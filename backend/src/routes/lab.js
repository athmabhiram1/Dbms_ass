const { Router } = require('express');
const ctrl = require('../controllers/labController');

const router = Router();

router.get('/tests', ctrl.listTests);
router.post('/tests', ctrl.createTest);
router.patch('/tests/:id', ctrl.completeTest);

module.exports = router;
