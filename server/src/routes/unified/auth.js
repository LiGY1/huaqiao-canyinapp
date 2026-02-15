const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const authController = require('../../controllers/unified/authController');

// 统一认证相关路由
router.post('/login', authController.login);
router.get('/userinfo', protect, authController.getUserInfo);
router.get('/portal-config', authController.getPortalConfig);

module.exports = router;
