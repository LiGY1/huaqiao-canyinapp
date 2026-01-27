const express = require('express');
const router = express.Router();

// 引入子路由
const authRoutes = require('./auth');
const mealRoutes = require('./meals');
const orderRoutes = require('./orders');
const nutritionRoutes = require('./nutrition');
const aiChatRoutes = require('./aiChat');
const favoriteRoutes = require('./favorites');
const reviewRoutes = require('./reviews');
const healthRoutes = require('./health');
const statisticsRoutes = require('./statistics');

// 挂载子路由
// API 路径前缀在此定义
router.use('/auth', authRoutes);
router.use('/meals', mealRoutes);
router.use('/orders', orderRoutes);
router.use('/nutrition', nutritionRoutes);
router.use('/ai-chat', aiChatRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/reviews', reviewRoutes);
router.use('/health', healthRoutes);
router.use('/statistics', statisticsRoutes);

module.exports = router;