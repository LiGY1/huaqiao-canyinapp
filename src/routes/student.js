const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// 路由测试接口
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: '学生端路由正常',
    module: 'student',
    availableEndpoints: [
      'POST /api/student/auth/login',
      'GET /api/student/meals',
      'GET /api/student/nutrition/today',
      '... 查看完整文档'
    ]
  });
});

const authController = require('../controllers/student/authController');
const mealController = require('../controllers/student/mealController');
const nutritionController = require('../controllers/student/nutritionController');
const favoriteController = require('../controllers/student/favoriteController');
const reviewController = require('../controllers/student/reviewController');
const healthController = require('../controllers/student/healthController');
const statisticsController = require('../controllers/student/statisticsController');

router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.get('/auth/info', protect, authController.getUserInfo);
router.put('/auth/profile', protect, authController.updateProfile);
router.get('/auth/balance', protect, authController.getBalance);
router.post('/auth/recharge', protect, authController.recharge);
router.get('/auth/bound-parents', protect, authController.getBoundParents);

router.post('/verify-student-id', authController.verifyStudentId);

router.get('/meals', protect, mealController.getMealList);
router.get('/meals/ai-recommendation', protect, mealController.getAIRecommendation);
router.get('/meals/seasonal-notification', protect, mealController.getSeasonalNotification);
router.get('/meals/current-solar-term', protect, mealController.getCurrentSolarTerm);
router.post('/orders', protect, mealController.submitOrder);
router.get('/orders', protect, mealController.getOrderHistory);
router.get('/orders/:orderId', protect, mealController.getOrderStatus);

router.get('/nutrition/today', protect, nutritionController.getTodayNutrition);
router.get('/nutrition/meal-status', protect, nutritionController.getMealStatus);
router.get('/nutrition/weekly-report', protect, nutritionController.getWeeklyReport);
router.get('/nutrition/monthly-report', protect, nutritionController.getMonthlyReport);

router.post('/nutrition/ai-report', protect, nutritionController.generateAIReport);
router.get('/nutrition/ai-reports', protect, nutritionController.getAIReportHistory);
router.get('/nutrition/ai-reports/:reportId', protect, nutritionController.getAIReportById);

router.post('/ai-chat/save', protect, nutritionController.saveChatHistory);
router.post('/ai-chat/save-batch', protect, nutritionController.saveChatHistoryBatch);
router.get('/ai-chat/history', protect, nutritionController.getChatHistory);
router.get('/ai-chat/conversations', protect, nutritionController.getConversationList);
router.post('/ai-chat/stream', protect, nutritionController.streamChat);
router.delete('/ai-chat/clear-all', protect, nutritionController.clearAllChatHistory);
router.delete('/ai-chat/conversation/:conversationId', protect, nutritionController.deleteConversation);
router.delete('/ai-chat/:chatId', protect, nutritionController.deleteChatHistory);
router.put('/ai-chat/:chatId/favorite', protect, nutritionController.toggleChatFavorite);

router.get('/favorites', protect, favoriteController.getFavorites);
router.post('/favorites', protect, favoriteController.addFavorite);
router.delete('/favorites/:dishId', protect, favoriteController.removeFavorite);
router.get('/favorites/check/:dishId', protect, favoriteController.checkFavorite);

router.post('/reviews', protect, reviewController.createReview);
router.get('/reviews', protect, reviewController.getMyReviews);
router.get('/reviews/dish/:dishId', protect, reviewController.getDishReviews);
router.get('/reviews/check/:orderId', protect, reviewController.checkReviewable);

router.post('/health', protect, healthController.addHealthRecord);
router.get('/health', protect, healthController.getHealthRecords);
router.get('/health/today', protect, healthController.getTodayHealth);
router.get('/health/trends', protect, healthController.getHealthTrends);
router.get('/health/assessment', protect, healthController.getHealthAssessment);

router.get('/statistics/overview', protect, statisticsController.getOverview);
router.get('/statistics/spending-trends', protect, statisticsController.getSpendingTrends);
router.get('/statistics/favorite-dishes', protect, statisticsController.getFavoriteDishes);
router.get('/statistics/nutrition-summary', protect, statisticsController.getNutritionSummary);

module.exports = router;

