const express = require('express');
const router = express.Router();
const { creerDemande, getDemandes, marquerPaye, getStatut } = require('../controllers/demandeController');

router.post('/', creerDemande);
router.get('/:expediteur_id', getDemandes);
router.put('/payer/:reference', marquerPaye);
router.get('/statut/:reference', getStatut);

module.exports = router;
