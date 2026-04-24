const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.connect((err) => {
  if (err) {
    console.error('❌ Erreur connexion base de données:', err.message);
  } else {
    console.log('✅ Connecté à la base de données Supabase !');
  }
});

module.exports = pool;