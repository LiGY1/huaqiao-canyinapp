const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const mealController = require('../../controllers/student/mealController'); // 依然使用 mealController，除非你拆分了 Controller

router.use(protect);

// 对应前缀 /orders
router.post('/', mealController.submitOrder);
router.get('/', mealController.getOrderHistory);
router.get('/:orderId', mealController.getOrderStatus);

module.exports = router;