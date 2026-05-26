const { Router } = require('express');
const ctrl = require('../controllers/custodyController');

const router = Router();

router.get('/transfers', ctrl.listTransfers);
router.post('/transfer', ctrl.createTransfer);

module.exports = router;
