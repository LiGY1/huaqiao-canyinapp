const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const mealService = require('../../services/student/mealController');

// 所有接口应用 protect 中间件
router.use(protect);

// 对应前缀 /meals
router.get('/', mealService.getMealList);
router.get('/ai-recommendation', mealService.getAIRecommendation);
router.get('/seasonal-notification', mealService.getSeasonalNotification);
router.get('/current-solar-term', mealService.getCurrentSolarTermRecommend);
router.get('/solar-term-dishes', mealService.getSolarTermDishes);

module.exports = router;