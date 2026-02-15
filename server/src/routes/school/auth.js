const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const authService = require('../../services/school/authController');

// 认证相关路由
router.post('/login', authService.login);
router.get('/userinfo', protect, authService.getUserInfo);
router.post('/change-password', protect, authService.changePassword);
router.put('/profile', protect, authService.updateProfile);

module.exports = router;
