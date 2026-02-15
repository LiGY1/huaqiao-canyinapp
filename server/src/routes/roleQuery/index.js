const express = require('express');
const router = express.Router();
const roleQueryService = require('../../services/roleQueryController');
const { verifyRoleQueryToken } = require('../../middleware/roleQueryAuth');

// 所有路由都需要Token验证
router.use(verifyRoleQueryToken);

// 主查询接口
router.get('/llm', roleQueryService.queryByRole);

module.exports = router;
