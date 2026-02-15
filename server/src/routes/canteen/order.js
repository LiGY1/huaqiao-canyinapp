const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const orderController = require('../../controllers/canteen/orderController');

// 订单管理路由
router.get('/', protect, orderController.getOrderList);
router.get('/statistics', protect, orderController.getOrderStatistics);
router.post('/batch-update', protect, orderController.batchUpdateOrders);
router.get('/:id', protect, orderController.getOrderDetail);
router.patch('/:id/status', protect, orderController.updateOrderStatus);

module.exports = router;
