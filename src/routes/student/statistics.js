const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const statisticsController = require('../../controllers/student/statisticsController');

router.use(protect);

// 对应前缀 /statistics
router.get('/overview', statisticsController.getOverview);
router.get('/spending-trends', statisticsController.getSpendingTrends);
router.get('/favorite-dishes', statisticsController.getFavoriteDishes);
router.get('/nutrition-summary', statisticsController.getNutritionSummary);

module.exports = router;