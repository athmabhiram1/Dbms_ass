const { Router } = require('express');
const ctrl = require('../controllers/disclosureController');

const router = Router();

router.get('/requests', ctrl.listRequests);
router.post('/request', ctrl.createRequest);
router.post('/log', ctrl.logDisclosure);

module.exports = router;
