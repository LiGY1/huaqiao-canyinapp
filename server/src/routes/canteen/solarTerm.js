const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const solarTermService = require('../../services/canteen/solarTermController');

// 节气相关路由
router.get('/current', protect, solarTermService.getCurrentSolarTerm);
router.post('/ai-recommend', protect, solarTermService.getAIRecommendations);
router.post('/add-dish', protect, solarTermService.addSeasonalDish);
router.post('/push-dingtalk', protect, solarTermService.pushToDingTalk);
router.get('/dishes', protect, solarTermService.getSeasonalDishes);
router.delete('/dish/:dishId', protect, solarTermService.removeSeasonalDish);

module.exports = router;
