const { Router } = require('express');
const dashboardController = require('../controllers/dashboardController');
const authenticate = require('../middleware/authenticate');

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/summary', dashboardController.getSummary);
router.get('/cashflow', dashboardController.getCashflow);
router.get('/by-category', dashboardController.getByCategory);
router.get('/daily-spending', dashboardController.getDailySpending);

module.exports = router;
