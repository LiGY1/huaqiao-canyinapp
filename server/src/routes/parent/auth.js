const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const authService = require('../../services/parent/authController');

// 认证相关路由
router.post('/login', authService.login);
router.post('/register', authService.register);
router.get('/info', protect, authService.getUserInfo);
router.post('/bind-child', protect, authService.bindChild);
router.get('/reminder-settings', protect, authService.getReminderSettings);
router.put('/reminder-settings', protect, authService.updateReminderSettings);

module.exports = router;
