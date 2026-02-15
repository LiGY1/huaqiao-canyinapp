const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const authController = require('../../controllers/school/authController');

// 认证相关路由
router.post('/login', authController.login);
router.get('/userinfo', protect, authController.getUserInfo);
router.post('/change-password', protect, authController.changePassword);
router.put('/profile', protect, authController.updateProfile);

module.exports = router;
