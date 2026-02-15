const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const mealService = require('../../services/student/mealController');

router.use(protect);

// 对应前缀 /orders
router.post('/', mealService.submitOrder);
router.get('/', mealService.getOrderHistory);
router.get('/:orderId', mealService.getOrderStatus);

module.exports = router;