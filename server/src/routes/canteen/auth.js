const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const authController = require('../../controllers/canteen/authController');

// 认证相关路由
router.post('/login', authController.login);
router.post('/logout', protect, authController.logout);
router.get('/info', protect, authController.getUserInfo);
router.put('/info', protect, authController.updateUserInfo);
router.post('/change-password', protect, authController.changePassword);
router.get('/statistics', protect, authController.getWorkStatistics);

module.exports = router;
