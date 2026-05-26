const { Router } = require('express');
const ctrl = require('../controllers/caseController');

const router = Router();

router.get('/', ctrl.listCases);
router.get('/:id', ctrl.getCase);
router.patch('/:id/close', ctrl.closeCase);
router.get('/:id/evidence', ctrl.getCaseEvidence);

module.exports = router;
