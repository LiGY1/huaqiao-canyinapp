const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { USER_ROLES } = require('../config/constants');
const uploadEducation = require('../middleware/uploadEducation');

// 路由测试接口
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: '学校端路由正常',
    module: 'school',
    availableEndpoints: [
      'POST /api/school/auth/login',
      'GET /api/school/student/list',
      'GET /api/school/statistics/dashboard',
      '... 查看完整文档'
    ]
  });
});

const authController = require('../controllers/school/authController');
const studentController = require('../controllers/school/studentController');
const foodSafetyController = require('../controllers/school/foodSafetyController');
const educationController = require('../controllers/school/educationController');
const statisticsController = require('../controllers/school/statisticsController');
const uploadController = require('../controllers/school/uploadController');

router.post('/auth/login', authController.login);
router.get('/auth/userinfo', protect, authController.getUserInfo);
router.post('/auth/change-password', protect, authController.changePassword);
router.put('/auth/profile', protect, authController.updateProfile);

router.get('/student/list', protect, studentController.getStudentList);
router.get('/student/health', protect, studentController.getHealthData);
router.get('/student/meals', protect, studentController.getMealRecords);
router.get('/student/nutrition', protect, studentController.getNutritionData);
router.get('/student/physical-exams', protect, studentController.getPhysicalExams);
router.post('/student/physical-exams', protect, studentController.addPhysicalExam);

router.post('/student/health-report', protect, studentController.generateHealthReport);
router.get('/student/health-reports', protect, studentController.getHealthReportHistory);
router.get('/student/health-reports/:reportId', protect, studentController.getHealthReportById);

router.get('/student/:studentId', protect, studentController.getStudentDetail);

router.post('/ai-chat/save', protect, studentController.saveChatHistory);
router.get('/ai-chat/history', protect, studentController.getChatHistory);
router.post('/ai-chat/stream', protect, studentController.streamChat);
router.delete('/ai-chat/clear-all', protect, studentController.clearAllChatHistory);

router.get('/food-safety/records', protect, foodSafetyController.getRecords);
router.post('/food-safety/records', protect, foodSafetyController.addRecord);
router.get('/food-safety/freshness', protect, foodSafetyController.getFreshnessMonitoring);
router.get('/food-safety/price-monitoring', protect, foodSafetyController.getPriceMonitoring);

router.get('/education/materials', protect, educationController.getMaterials);
router.post('/education/materials', protect, educationController.createMaterial);
router.put('/education/materials/:id', protect, educationController.updateMaterial);
router.delete('/education/materials/:id', protect, educationController.deleteMaterial);
router.post('/education/materials/:id/publish', protect, educationController.publishMaterial);

router.post('/education/notifications', protect, educationController.sendNotification);
router.get('/education/notifications', protect, educationController.getNotifications);
router.get('/education/notifications/:id', protect, educationController.getNotificationDetail);
router.delete('/education/notifications/:id', protect, educationController.deleteNotification);
router.post('/education/test-webhook', protect, educationController.testWebhook);

router.get('/statistics/dashboard', protect, statisticsController.getDashboardStats);
router.get('/statistics/class/:classId', protect, statisticsController.getClassStats);
router.get('/statistics/today-overview', protect, statisticsController.getTodayOverview);
router.get('/statistics/weekly-comparison', protect, statisticsController.getWeeklyComparison);
router.get('/statistics/teacher-classes', protect, statisticsController.getTeacherClasses);
router.get('/statistics/student-weekly-nutrition', protect, statisticsController.getStudentWeeklyNutrition);

router.post('/upload/education', protect, uploadEducation.single('file'), uploadController.uploadEducationFile);
router.post('/upload/education/multiple', protect, uploadEducation.array('files', 10), uploadController.uploadMultipleFiles);

module.exports = router;

