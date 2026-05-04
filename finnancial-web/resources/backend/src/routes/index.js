const { Router } = require('express');
const authRoutes = require('./auth');
const transactionRoutes = require('./transactions');
const dashboardRoutes = require('./dashboard');
const budgetRoutes = require('./budgets');
const categoryRoutes = require('./categories');
const accountRoutes = require('./accounts');
const goalRoutes = require('./goals');
const recurringRoutes = require('./recurring');
const reportRoutes = require('./reports');
const userRoutes = require('./users');
const maintenanceRoutes = require('./maintenance');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/transactions', transactionRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/budgets', budgetRoutes);
router.use('/categories', categoryRoutes);
router.use('/accounts', accountRoutes);
router.use('/goals', goalRoutes);
router.use('/recurring', recurringRoutes);
router.use('/reports', reportRoutes);
router.use('/maintenance', maintenanceRoutes);

module.exports = router;
