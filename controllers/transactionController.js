const pool = require('../database');

// Créer une transaction
const creerTransaction = async (req, res) => {
  try {
    const { expediteur_id, telephone_destinataire, montant, operateur, reference } = req.body;

    const frais = Math.max(Math.round(montant * 0.01), 10);

    const result = await pool.query(
      `INSERT INTO transactions 
       (expediteur_id, telephone_destinataire, montant, frais, operateur, statut, reference)
       VALUES ($1, $2, $3, $4, $5, 'complete', $6)
       RETURNING *`,
      [expediteur_id, telephone_destinataire, montant, frais, operateur, reference]
    );

    res.status(201).json({
      message: 'Transaction enregistrée !',
      transaction: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Historique des transactions
const getTransactions = async (req, res) => {
  try {
    const { expediteur_id } = req.params;

    const result = await pool.query(
      `SELECT * FROM transactions 
       WHERE expediteur_id = $1 
       ORDER BY cree_le DESC`,
      [expediteur_id]
    );

    res.json({
      transactions: result.rows,
      total: result.rows.length
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Statistiques (total envoyé/reçu)
const getStats = async (req, res) => {
  try {
    const { expediteur_id } = req.params;

    const result = await pool.query(
      `SELECT 
        COUNT(*) as nombre_transactions,
        SUM(montant) as total_envoye,
        SUM(frais) as total_frais
       FROM transactions 
       WHERE expediteur_id = $1 AND statut = 'complete'`,
      [expediteur_id]
    );

    res.json({ stats: result.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = { creerTransaction, getTransactions, getStats };