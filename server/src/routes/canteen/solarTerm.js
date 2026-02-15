const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const solarTermController = require('../../controllers/canteen/solarTermController');

// 节气相关路由
router.get('/current', protect, solarTermController.getCurrentSolarTerm);
router.post('/ai-recommend', protect, solarTermController.getAIRecommendations);
router.post('/add-dish', protect, solarTermController.addSeasonalDish);
router.post('/push-dingtalk', protect, solarTermController.pushToDingTalk);
router.get('/dishes', protect, solarTermController.getSeasonalDishes);
router.delete('/dish/:dishId', protect, solarTermController.removeSeasonalDish);

module.exports = router;
