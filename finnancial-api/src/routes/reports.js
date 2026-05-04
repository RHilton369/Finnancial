const { Router } = require('express');
const reportController = require('../controllers/reportController');
const authenticate = require('../middleware/authenticate');

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/monthly', reportController.getMonthly);
router.get('/category-evolution', reportController.getCategoryEvolution);
router.get('/export-csv', reportController.exportTransactionsCSV);

module.exports = router;
