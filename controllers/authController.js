const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../database');

// Inscription
const inscription = async (req, res) => {
  try {
    const { nom, prenom, telephone, email, mot_de_passe, pin } = req.body;

    // Vérifier si le numéro existe déjà
    const existe = await pool.query(
      'SELECT * FROM users WHERE telephone = $1', [telephone]
    );
    if (existe.rows.length > 0) {
      return res.status(400).json({ message: 'Ce numéro est déjà enregistré.' });
    }

    // Hasher le mot de passe et le PIN
    const motDePasseHash = await bcrypt.hash(mot_de_passe, 10);
    const pinHash = await bcrypt.hash(pin, 10);

    // Créer l'utilisateur
    const result = await pool.query(
      `INSERT INTO users (nom, prenom, telephone, email, mot_de_passe, pin)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nom, prenom, telephone`,
      [nom, prenom, telephone, email, motDePasseHash, pinHash]
    );

    const utilisateur = result.rows[0];

    // Générer le token JWT
    const token = jwt.sign(
      { id: utilisateur.id, telephone: utilisateur.telephone },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Compte créé avec succès !',
      token,
      utilisateur
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Connexion
const connexion = async (req, res) => {
  try {
    const { telephone, mot_de_passe } = req.body;

    // Chercher l'utilisateur
    const result = await pool.query(
      'SELECT * FROM users WHERE telephone = $1', [telephone]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Numéro ou mot de passe incorrect.' });
    }

    const utilisateur = result.rows[0];

    // Vérifier le mot de passe
    const valide = await bcrypt.compare(mot_de_passe, utilisateur.mot_de_passe);
    if (!valide) {
      return res.status(400).json({ message: 'Numéro ou mot de passe incorrect.' });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { id: utilisateur.id, telephone: utilisateur.telephone },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Connexion réussie !',
      token,
      utilisateur: {
        id: utilisateur.id,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        telephone: utilisateur.telephone,
        solde: utilisateur.solde
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = { inscription, connexion };