const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const nutritionController = require('../../controllers/student/nutritionController');

router.use(protect);

// 营养数据
router.get('/weekly-report', nutritionController.getWeeklyReport);
router.get('/today', nutritionController.getTodayNutrition);
router.get('/meal-status', nutritionController.getMealStatus);
router.get('/monthly-report', nutritionController.getMonthlyReport);

// AI 分析报告
router.post('/ai-report', nutritionController.generateAIReport);
router.get('/ai-reports', nutritionController.getAIReportHistory);
router.get('/ai-reports/:reportId', nutritionController.getAIReportById);

module.exports = router;