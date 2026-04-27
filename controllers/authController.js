const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../database');

// Stockage OTP en mémoire (clé: telephone, valeur: { otp, expires })
const otpStore = new Map();

function genererOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /auth/otp — Envoyer un code OTP
const envoyerOTP = async (req, res) => {
  try {
    const { telephone } = req.body;
    if (!telephone || telephone.replace(/\D/g, '').length < 8) {
      return res.status(400).json({ message: 'Numéro invalide.' });
    }

    const tel = telephone.replace(/\D/g, '');
    const otp = genererOTP();
    otpStore.set(tel, { otp, expires: Date.now() + 10 * 60 * 1000 });

    // TODO: remplacer par Africa's Talking quand activé
    console.log(`📱 OTP [${tel}] : ${otp}`);

    res.json({ message: 'Code envoyé.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// POST /auth/verifier-otp — Vérifier le code + retourner l'utilisateur si existant
const verifierOTP = async (req, res) => {
  try {
    const { telephone, otp } = req.body;
    const tel = telephone.replace(/\D/g, '');
    const stored = otpStore.get(tel);

    if (!stored || stored.otp !== otp || Date.now() > stored.expires) {
      return res.status(400).json({ message: 'Code incorrect ou expiré.' });
    }

    otpStore.delete(tel);

    // Vérifier si l'utilisateur existe déjà
    const result = await pool.query(
      'SELECT id, nom, prenom, telephone FROM users WHERE telephone = $1',
      [tel]
    );

    if (result.rows.length > 0) {
      const utilisateur = result.rows[0];
      const token = jwt.sign(
        { id: utilisateur.id, telephone: utilisateur.telephone },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
      return res.json({
        message: 'Connexion réussie.',
        nouveau: false,
        token,
        utilisateur
      });
    }

    res.json({ message: 'OTP valide.', nouveau: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// POST /auth/inscription — Créer le compte après OTP vérifié
const inscription = async (req, res) => {
  try {
    const { nom, prenom, telephone } = req.body;
    const tel = telephone.replace(/\D/g, '');

    const existe = await pool.query(
      'SELECT id FROM users WHERE telephone = $1', [tel]
    );
    if (existe.rows.length > 0) {
      return res.status(400).json({ message: 'Ce numéro est déjà enregistré.' });
    }

    // Hash aléatoire pour compatibilité schéma (mot de passe non utilisé)
    const motDePasseHash = await bcrypt.hash('HAYA_' + Date.now(), 10);

    const result = await pool.query(
      `INSERT INTO users (nom, prenom, telephone, mot_de_passe)
       VALUES ($1, $2, $3, $4) RETURNING id, nom, prenom, telephone`,
      [nom, prenom, tel, motDePasseHash]
    );

    const utilisateur = result.rows[0];
    const token = jwt.sign(
      { id: utilisateur.id, telephone: utilisateur.telephone },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({ message: 'Compte créé !', token, utilisateur });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = { envoyerOTP, verifierOTP, inscription };
