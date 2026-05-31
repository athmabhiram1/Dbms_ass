const { Router } = require('express');
const ctrl = require('../controllers/databaseController');

const router = Router();

router.get('/schema', ctrl.getSchema);
router.get('/storage', ctrl.getStorageGrid);

module.exports = router;
