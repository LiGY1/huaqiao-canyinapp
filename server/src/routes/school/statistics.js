const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const statisticsService = require('../../services/school/statisticsController');

// 统计数据相关路由
router.get('/dashboard', protect, statisticsService.getDashboardStats);
router.get('/class/:classId', protect, statisticsService.getClassStats);
router.get('/today-overview', protect, statisticsService.getTodayOverview);
router.get('/weekly-comparison', protect, statisticsService.getWeeklyComparison);
router.get('/teacher-classes', protect, statisticsService.getTeacherClasses);
router.get('/student-weekly-nutrition', protect, statisticsService.getStudentWeeklyNutrition);

module.exports = router;
