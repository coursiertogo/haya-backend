const pool = require('../database');

const creerDemande = async (req, res) => {
  try {
    const { expediteur_id, telephone_destinataire, montant, objet, operateur, reference } = req.body;
    await pool.query(
      `INSERT INTO demandes_paiement (expediteur_id, telephone_destinataire, montant, objet, operateur, reference)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [expediteur_id, telephone_destinataire, montant, objet, operateur, reference]
    );
    res.status(201).json({ message: 'Demande enregistrée.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(200).json({ message: 'Demande déjà enregistrée.' });
    }
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const getDemandes = async (req, res) => {
  try {
    const { expediteur_id } = req.params;
    const [rows] = await pool.query(
      `SELECT * FROM demandes_paiement WHERE expediteur_id = ? ORDER BY cree_le DESC`,
      [expediteur_id]
    );
    res.json({ demandes: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const marquerPaye = async (req, res) => {
  try {
    const { reference } = req.params;
    await pool.query(
      `UPDATE demandes_paiement SET statut = 'paye', paye_le = NOW() WHERE reference = ?`,
      [reference]
    );
    res.json({ message: 'Paiement confirmé.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const getStatut = async (req, res) => {
  try {
    const { reference } = req.params;
    const [rows] = await pool.query(
      `SELECT statut, paye_le FROM demandes_paiement WHERE reference = ?`,
      [reference]
    );
    if (rows.length === 0) return res.status(404).json({ statut: 'inconnu' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = { creerDemande, getDemandes, marquerPaye, getStatut };
