const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const foodSafetyService = require('../../services/school/foodSafetyController');

// 食品安全相关路由
router.get('/records', protect, foodSafetyService.getRecords);
router.post('/records', protect, foodSafetyService.addRecord);
router.get('/freshness', protect, foodSafetyService.getFreshnessMonitoring);
router.get('/price-monitoring', protect, foodSafetyService.getPriceMonitoring);

module.exports = router;
