const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const authMiddleware = require('../middleware/authenticate');

router.use(authMiddleware);

router.post('/recalculate-balances', maintenanceController.recalculateBalances);
router.post('/recalculate-account/:accountId', maintenanceController.recalculateAccount);
router.post('/adjust-balance', maintenanceController.adjustBalance);
router.get('/consistency/check', maintenanceController.checkConsistency);

module.exports = router;
