const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const orderController = require('../../controllers/parent/orderController');

// 餐食相关路由
router.get('/', protect, orderController.getMealList);

module.exports = router;
