const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const foodSafetyController = require('../../controllers/school/foodSafetyController');

// 食品安全相关路由
router.get('/records', protect, foodSafetyController.getRecords);
router.post('/records', protect, foodSafetyController.addRecord);
router.get('/freshness', protect, foodSafetyController.getFreshnessMonitoring);
router.get('/price-monitoring', protect, foodSafetyController.getPriceMonitoring);

module.exports = router;
