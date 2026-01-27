const express = require('express');
const router = express.Router();
const authController = require('../controllers/unified/authController');
const { protect } = require('../middleware/auth');

// 配置登录路由
router.post('/login', authController.login);

router.get('/userinfo', protect, authController.getUserInfo);

router.get('/portal-config', authController.getPortalConfig);

module.exports = router;

