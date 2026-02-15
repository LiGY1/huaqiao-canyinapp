const express = require('express');
const router = express.Router();

// 导入子模块路由
const authRoutes = require('./auth');
const studentRoutes = require('./student');
const foodSafetyRoutes = require('./foodSafety');
const educationRoutes = require('./education');
const statisticsRoutes = require('./statistics');
const uploadRoutes = require('./upload');

// 注册子模块路由
router.use('/auth', authRoutes);
router.use('/student', studentRoutes);
router.use('/food-safety', foodSafetyRoutes);
router.use('/education', educationRoutes);
router.use('/statistics', statisticsRoutes);
router.use('/upload', uploadRoutes);

// 兼容旧路由 - ai-chat 路由挂载到 student 下
const chatService = require('../../services/school/studentController');
const { protect } = require('../../middleware/auth');

router.post('/ai-chat/save', protect, chatService.saveChatHistory);
router.get('/ai-chat/history', protect, chatService.getChatHistory);
router.post('/ai-chat/stream', protect, chatService.streamChat);
router.delete('/ai-chat/clear-all', protect, chatService.clearAllChatHistory);

module.exports = router;
