const pool = require('../database');

const creerTransaction = async (req, res) => {
  try {
    const { expediteur_id, telephone_destinataire, montant, operateur, reference } = req.body;
    const frais = Math.max(Math.round(montant * 0.01), 10);

    const [result] = await pool.query(
      `INSERT INTO transactions (expediteur_id, telephone_destinataire, montant, frais, operateur, statut, reference)
       VALUES (?, ?, ?, ?, ?, 'complete', ?)`,
      [expediteur_id, telephone_destinataire, montant, frais, operateur, reference]
    );

    const [rows] = await pool.query('SELECT * FROM transactions WHERE id = ?', [result.insertId]);

    res.status(201).json({ message: 'Transaction enregistrée !', transaction: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const getTransactions = async (req, res) => {
  try {
    const { expediteur_id } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM transactions WHERE expediteur_id = ? ORDER BY cree_le DESC',
      [expediteur_id]
    );
    res.json({ transactions: rows, total: rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const getStats = async (req, res) => {
  try {
    const { expediteur_id } = req.params;
    const [rows] = await pool.query(
      `SELECT COUNT(*) as nombre_transactions, SUM(montant) as total_envoye, SUM(frais) as total_frais
       FROM transactions WHERE expediteur_id = ? AND statut = 'complete'`,
      [expediteur_id]
    );
    res.json({ stats: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = { creerTransaction, getTransactions, getStats };
