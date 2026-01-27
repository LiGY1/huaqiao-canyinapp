const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const mealController = require('../../controllers/student/mealController');

// 所有接口应用 protect 中间件
router.use(protect);

// 对应前缀 /meals
router.get('/', mealController.getMealList);
router.get('/ai-recommendation', mealController.getAIRecommendation);
router.get('/seasonal-notification', mealController.getSeasonalNotification);
router.get('/current-solar-term', mealController.getCurrentSolarTerm);

module.exports = router;