const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const orderController = require('../../controllers/parent/orderController');

// 订单相关路由
router.get('/', protect, orderController.getOrderHistory);
router.post('/', protect, orderController.createOrderForChild);

module.exports = router;
