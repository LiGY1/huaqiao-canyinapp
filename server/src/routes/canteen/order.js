const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const orderService = require('../../services/canteen/orderController');

// 订单管理路由
router.get('/', protect, orderService.getOrderList);
router.get('/statistics', protect, orderService.getOrderStatistics);
router.post('/batch-update', protect, orderService.batchUpdateOrders);
router.get('/:id', protect, orderService.getOrderDetail);
router.patch('/:id/status', protect, orderService.updateOrderStatus);

module.exports = router;
