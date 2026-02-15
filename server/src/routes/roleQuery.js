const express = require('express');
const router = express.Router();
const roleQueryController = require('../controllers/roleQueryController');
const { verifyRoleQueryToken } = require('../middleware/roleQueryAuth');


// 所有路由都需要Token验证
router.use(verifyRoleQueryToken);

// 主查询接口
router.get('/llm', roleQueryController.queryByRole);

module.exports = router;

