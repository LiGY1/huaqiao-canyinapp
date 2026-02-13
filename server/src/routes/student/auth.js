const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const authController = require('../../controllers/student/authController');

// 公开接口
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/verify-student-id', authController.verifyStudentId);

// 需要登录的接口
router.get('/info', protect, authController.getUserInfo);
router.put('/profile', protect, authController.updateProfile);
router.get('/balance', protect, authController.getBalance);
router.post('/recharge', protect, authController.recharge);
router.get('/bound-parents', protect, authController.getBoundParents);

module.exports = router;