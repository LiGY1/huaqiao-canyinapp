const express = require('express');
const router = express.Router();

// 导入子模块路由
const authRoutes = require('./auth');
const childRoutes = require('./child');
const orderRoutes = require('./order');
const mealRoutes = require('./meal');
const chatRoutes = require('./chat');

// 注册子模块路由
router.use('/auth', authRoutes);
router.use('/child', childRoutes);
router.use('/orders', orderRoutes);
router.use('/meals', mealRoutes);
router.use('/ai-chat', chatRoutes);

module.exports = router;
