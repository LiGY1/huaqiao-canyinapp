const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const authService = require('../../services/canteen/authController');

// 认证相关路由
router.post('/login', authService.login);
router.post('/logout', protect, authService.logout);
router.get('/info', protect, authService.getUserInfo);
router.put('/info', protect, authService.updateUserInfo);
router.post('/change-password', protect, authService.changePassword);
router.get('/statistics', protect, authService.getWorkStatistics);

module.exports = router;
