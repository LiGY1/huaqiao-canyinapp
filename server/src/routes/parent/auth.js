const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const authController = require('../../controllers/parent/authController');

// 认证相关路由
router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/info', protect, authController.getUserInfo);
router.post('/bind-child', protect, authController.bindChild);
router.get('/reminder-settings', protect, authController.getReminderSettings);
router.put('/reminder-settings', protect, authController.updateReminderSettings);

module.exports = router;
