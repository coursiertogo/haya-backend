const express = require('express');
const router = express.Router();
const { envoyerOTP, verifierOTP, inscription } = require('../controllers/authController');

router.post('/otp', envoyerOTP);
router.post('/verifier-otp', verifierOTP);
router.post('/inscription', inscription);

module.exports = router;
