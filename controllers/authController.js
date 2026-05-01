const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../database');
const AfricasTalking = require('africastalking');

const at = AfricasTalking({
  username: process.env.AT_USERNAME,
  apiKey: process.env.AT_API_KEY,
});
const sms = at.SMS;

const otpStore = new Map();

function genererOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const envoyerOTP = async (req, res) => {
  try {
    const { telephone } = req.body;
    if (!telephone || telephone.replace(/\D/g, '').length < 8) {
      return res.status(400).json({ message: 'Numéro invalide.' });
    }
    const tel = telephone.replace(/\D/g, '');
    const otp = genererOTP();
    otpStore.set(tel, { otp, expires: Date.now() + 10 * 60 * 1000 });
    console.log(`📱 OTP [${tel}] : ${otp}`);

    try {
      const result = await sms.send({
        to: [`+228${tel}`],
        message: `Votre code Haya : ${otp}. Valable 10 minutes.`,
      });
      console.log('📤 SMS résultat:', JSON.stringify(result));
    } catch (smsErr) {
      console.error('❌ SMS erreur:', smsErr.message);
    }

    res.json({ message: 'Code envoyé.', dev_otp: otp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const verifierOTP = async (req, res) => {
  try {
    const { telephone, otp } = req.body;
    const tel = telephone.replace(/\D/g, '');
    const stored = otpStore.get(tel);

    if (!stored || stored.otp !== otp || Date.now() > stored.expires) {
      return res.status(400).json({ message: 'Code incorrect ou expiré.' });
    }
    otpStore.delete(tel);

    const [rows] = await pool.query(
      'SELECT id, nom, prenom, telephone FROM users WHERE telephone = ?',
      [tel]
    );

    if (rows.length > 0) {
      const utilisateur = rows[0];
      const token = jwt.sign(
        { id: utilisateur.id, telephone: utilisateur.telephone },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
      return res.json({ message: 'Connexion réussie.', nouveau: false, token, utilisateur });
    }

    res.json({ message: 'OTP valide.', nouveau: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const inscription = async (req, res) => {
  try {
    const { nom, prenom, telephone } = req.body;
    const tel = telephone.replace(/\D/g, '');

    const [existe] = await pool.query('SELECT id FROM users WHERE telephone = ?', [tel]);
    if (existe.length > 0) {
      return res.status(400).json({ message: 'Ce numéro est déjà enregistré.' });
    }

    const motDePasseHash = await bcrypt.hash('HAYA_' + Date.now(), 10);

    const [result] = await pool.query(
      'INSERT INTO users (nom, prenom, telephone, mot_de_passe) VALUES (?, ?, ?, ?)',
      [nom, prenom, tel, motDePasseHash]
    );

    const utilisateur = { id: result.insertId, nom, prenom, telephone: tel };
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
