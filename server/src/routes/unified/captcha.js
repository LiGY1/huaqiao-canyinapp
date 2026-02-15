const express = require('express');
const router = express.Router();
const captchaController = require('../../controllers/unified/captchaController');

// 验证码相关路由
router.get('/generate', captchaController.generateCaptcha);
router.post('/verify', captchaController.verifyCaptcha);

module.exports = router;
