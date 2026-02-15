const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const statisticsService = require('../../services/student/statisticsController');

router.use(protect);

// 对应前缀 /statistics
router.get('/overview', statisticsService.getOverview);
router.get('/spending-trends', statisticsService.getSpendingTrends);
router.get('/favorite-dishes', statisticsService.getFavoriteDishes);
router.get('/nutrition-summary', statisticsService.getNutritionSummary);

module.exports = router;