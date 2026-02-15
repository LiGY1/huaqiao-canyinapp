const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const studentService = require('../../services/school/studentController');

// 学生信息相关路由
router.get('/list', protect, studentService.getStudentList);
router.get('/health', protect, studentService.getHealthData);
router.get('/meals', protect, studentService.getMealRecords);
router.get('/nutrition', protect, studentService.getNutritionData);
router.get('/physical-exams', protect, studentService.getPhysicalExams);
router.post('/physical-exams', protect, studentService.addPhysicalExam);

// 健康报告相关路由
router.post('/health-report', protect, studentService.generateHealthReport);
router.get('/health-reports', protect, studentService.getHealthReportHistory);
router.get('/health-reports/:reportId', protect, studentService.getHealthReportById);

// 学生详情
router.get('/:studentId', protect, studentService.getStudentDetail);

module.exports = router;
