const express = require('express');
const router = express.Router();
const authController = require('../controllers/unified/authController');
const captchaController = require('../controllers/unified/captchaController');
const { protect } = require('../middleware/auth');

// 配置登录路由
router.post('/login', authController.login);

router.get('/userinfo', protect, authController.getUserInfo);

router.get('/portal-config', authController.getPortalConfig);

// 验证码路由
router.get('/captcha/generate', captchaController.generateCaptcha);
router.post('/captcha/verify', captchaController.verifyCaptcha);

module.exports = router;

