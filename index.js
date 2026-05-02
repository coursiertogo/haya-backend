const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./database');
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const demandeRoutes = require('./routes/demandeRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/demandes', demandeRoutes);

// Route de test
app.get('/', (req, res) => {
  res.json({ 
    message: 'Haya Backend API fonctionne !',
    version: '1.0.0',
    routes: [
      'POST /api/auth/inscription',
      'POST /api/auth/connexion',
      'POST /api/transactions',
      'GET /api/transactions/:expediteur_id',
      'GET /api/transactions/stats/:expediteur_id',
    ]
  });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur Haya démarré sur le port ${PORT}`);
});