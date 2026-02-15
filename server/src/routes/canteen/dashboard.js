const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const dashboardController = require('../../controllers/canteen/dashboardController');

// 仪表盘相关路由
router.get('/sales', protect, dashboardController.getSalesData);
router.get('/inventory', protect, dashboardController.getInventoryData);
router.get('/production-suggestions', protect, dashboardController.getProductionSuggestions);
router.get('/seasonal-recommendations', protect, dashboardController.getSeasonalRecommendations);
router.get('/purchase-plan', protect, dashboardController.getPurchasePlan);
router.get('/nutrition-analysis', protect, dashboardController.getNutritionAnalysis);

module.exports = router;
