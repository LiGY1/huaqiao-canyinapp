const express = require('express');
const router = express.Router();
const authController = require('../controllers/unified/authController');
const { protect } = require('../middleware/auth');

// 路由测试接口
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: '统一登录模块路由正常',
    availableEndpoints: [
      'POST /api/unified/login - 统一登录',
      'GET /api/unified/userinfo - 获取用户信息（需要token）',
      'GET /api/unified/portal-config - 获取门户配置'
    ]
  });
});

// 统一登录接口 - 无需认证
router.post('/login', authController.login);

// 获取用户信息 - 需要认证
router.get('/userinfo', protect, authController.getUserInfo);

// 获取门户配置信息 - 无需认证（用于前端显示）
router.get('/portal-config', authController.getPortalConfig);

module.exports = router;

