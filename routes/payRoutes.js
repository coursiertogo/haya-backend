const express = require('express');
const router = express.Router();
const { getPayPage } = require('../controllers/payController');

router.get('/:reference', getPayPage);

module.exports = router;
