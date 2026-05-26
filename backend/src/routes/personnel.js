const { Router } = require('express');
const ctrl = require('../controllers/personnelController');

const router = Router();

router.get('/', ctrl.listPersonnel);
router.get('/officers', ctrl.listOfficers);
router.get('/prosecutors', ctrl.listProsecutors);
router.get('/defense', ctrl.listDefense);
router.post('/', ctrl.createPersonnel);
router.put('/:id', ctrl.updatePersonnel);
router.post('/:id/deactivate', ctrl.deactivatePersonnel);

module.exports = router;
