const { Router } = require('express');
const router = Router();
const maintenanceController = require('../controllers/maintenanceController');
const authMiddleware = require('../middleware/authenticate');

router.use(authMiddleware);

router.post('/accounts/:accountId/recalculate', maintenanceController.recalculateAccount);
router.post('/accounts/recalculate-all', maintenanceController.recalculateAll);
router.get('/consistency/check', maintenanceController.checkConsistency);

module.exports = router;