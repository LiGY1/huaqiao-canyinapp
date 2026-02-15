const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const orderService = require('../../services/parent/orderController');

// 订单相关路由
router.get('/', protect, orderService.getOrderHistory);
router.post('/', protect, orderService.createOrderForChild);

module.exports = router;
