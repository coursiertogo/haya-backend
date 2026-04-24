const express = require('express');
const router = express.Router();
const { creerTransaction, getTransactions, getStats } = require('../controllers/transactionController');

// Routes transactions
router.post('/', creerTransaction);
router.get('/:expediteur_id', getTransactions);
router.get('/stats/:expediteur_id', getStats);

module.exports = router;