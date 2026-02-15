const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const childService = require('../../services/parent/childController');

// 子女信息相关路由
router.get('/:childId/nutrition', protect, childService.getChildNutrition);
router.get('/:childId/meal-history', protect, childService.getMealHistory);
router.get('/:childId/weekly-report', protect, childService.getWeeklyReport);
router.get('/:childId/physical-exams', protect, childService.getPhysicalExams);
router.post('/:childId/ai-report', protect, childService.generateChildAIReport);
router.get('/:childId/ai-reports', protect, childService.getChildAIReports);

module.exports = router;
