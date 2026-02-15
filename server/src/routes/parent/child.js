const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const childController = require('../../controllers/parent/childController');

// 子女信息相关路由
router.get('/:childId/nutrition', protect, childController.getChildNutrition);
router.get('/:childId/meal-history', protect, childController.getMealHistory);
router.get('/:childId/weekly-report', protect, childController.getWeeklyReport);
router.get('/:childId/physical-exams', protect, childController.getPhysicalExams);
router.post('/:childId/ai-report', protect, childController.generateChildAIReport);
router.get('/:childId/ai-reports', protect, childController.getChildAIReports);

module.exports = router;
