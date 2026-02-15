const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const orderService = require('../../services/parent/orderController');

// 餐食相关路由
router.get('/', protect, orderService.getMealList);

module.exports = router;
