const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const statisticsController = require('../../controllers/school/statisticsController');

// 统计数据相关路由
router.get('/dashboard', protect, statisticsController.getDashboardStats);
router.get('/class/:classId', protect, statisticsController.getClassStats);
router.get('/today-overview', protect, statisticsController.getTodayOverview);
router.get('/weekly-comparison', protect, statisticsController.getWeeklyComparison);
router.get('/teacher-classes', protect, statisticsController.getTeacherClasses);
router.get('/student-weekly-nutrition', protect, statisticsController.getStudentWeeklyNutrition);

module.exports = router;
