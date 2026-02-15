const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const authService = require('../../services/student/authController');

// 公开接口
router.post('/login', authService.login);
router.post('/register', authService.register);
router.post('/verify-student-id', authService.verifyStudentId);

// 需要登录的接口
router.get('/info', protect, authService.getUserInfo);
router.put('/profile', protect, authService.updateProfile);
router.get('/balance', protect, authService.getBalance);
router.post('/recharge', protect, authService.recharge);
router.get('/bound-parents', protect, authService.getBoundParents);

module.exports = router;