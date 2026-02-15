const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const nutritionService = require('../../services/student/nutritionController');

router.use(protect);

// 营养数据
router.get('/weekly-report', nutritionService.getWeeklyReport);
router.get('/today', nutritionService.getTodayNutrition);
router.get('/getRecommend', nutritionService.getRecommend);
router.get('/meal-status', nutritionService.getMealStatus);
router.get('/monthly-report', nutritionService.getMonthlyReport);

// AI 分析报告
router.post('/ai-report', nutritionService.generateAIReport);
router.get('/ai-reports', nutritionService.getAIReportHistory);
router.get('/ai-reports/:reportId', nutritionService.getAIReportById);

module.exports = router;