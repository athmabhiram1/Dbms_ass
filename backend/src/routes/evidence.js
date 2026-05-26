const { Router } = require('express');
const ctrl = require('../controllers/evidenceController');

const router = Router();

router.get('/', ctrl.listEvidence);
router.get('/:tag/audit', ctrl.getAuditTrail);
router.post('/', ctrl.createEvidence);

module.exports = router;
