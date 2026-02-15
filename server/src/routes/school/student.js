const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const studentController = require('../../controllers/school/studentController');

// 学生信息相关路由
router.get('/list', protect, studentController.getStudentList);
router.get('/health', protect, studentController.getHealthData);
router.get('/meals', protect, studentController.getMealRecords);
router.get('/nutrition', protect, studentController.getNutritionData);
router.get('/physical-exams', protect, studentController.getPhysicalExams);
router.post('/physical-exams', protect, studentController.addPhysicalExam);

// 健康报告相关路由
router.post('/health-report', protect, studentController.generateHealthReport);
router.get('/health-reports', protect, studentController.getHealthReportHistory);
router.get('/health-reports/:reportId', protect, studentController.getHealthReportById);

// 学生详情
router.get('/:studentId', protect, studentController.getStudentDetail);

module.exports = router;
