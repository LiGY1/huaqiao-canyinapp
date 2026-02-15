const express = require('express');
const router = express.Router();

// 导入子模块路由
const authRoutes = require('./auth');
const dashboardRoutes = require('./dashboard');
const menuRoutes = require('./menu');
const inventoryRoutes = require('./inventory');
const orderRoutes = require('./order');
const purchaseRoutes = require('./purchase');
const productionRoutes = require('./production');
const uploadRoutes = require('./upload');
const solarTermRoutes = require('./solarTerm');

// 注册子模块路由
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/menu', menuRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/orders', orderRoutes);
router.use('/purchase', purchaseRoutes);
router.use('/production', productionRoutes);
router.use('/upload', uploadRoutes);
router.use('/solar-term', solarTermRoutes);

module.exports = router;
