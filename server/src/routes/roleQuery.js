const express = require('express');
const router = express.Router();
const roleQueryController = require('../controllers/roleQueryController');
const { verifyRoleQueryToken } = require('../middleware/roleQueryAuth');

/**
 * 通用角色查询接口路由
 * 路径: /api/role-query/llm
 * 支持教师、学生、家长三种角色的查询
 */

// 路由测试接口（不需要token）
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: '角色查询路由正常',
    module: 'roleQuery',
    availableEndpoints: [
      'GET /api/role-query/llm - 角色查询接口（需要token）'
    ]
  });
});

// 所有路由都需要Token验证
router.use(verifyRoleQueryToken);

// 主查询接口
router.get('/llm', roleQueryController.queryByRole);

module.exports = router;

