const express = require('express');
const router = express.Router();

// 导入子模块路由
const authRoutes = require('./auth');
const captchaRoutes = require('./captcha');

// 注册子模块路由
router.use('/auth', authRoutes);
router.use('/captcha', captchaRoutes);

// 兼容旧路由 - 直接挂载在根路径的路由
const authController = require('../../controllers/unified/authController');
const { protect } = require('../../middleware/auth');

router.post('/login', authController.login);
router.get('/userinfo', protect, authController.getUserInfo);
router.get('/portal-config', authController.getPortalConfig);

module.exports = router;
