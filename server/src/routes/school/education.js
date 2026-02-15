const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const educationController = require('../../controllers/school/educationController');

// 教育材料相关路由
router.get('/materials', protect, educationController.getMaterials);
router.post('/materials', protect, educationController.createMaterial);
router.put('/materials/:id', protect, educationController.updateMaterial);
router.delete('/materials/:id', protect, educationController.deleteMaterial);
router.post('/materials/:id/publish', protect, educationController.publishMaterial);

// 通知相关路由
router.post('/notifications', protect, educationController.sendNotification);
router.get('/notifications', protect, educationController.getNotifications);
router.get('/notifications/:id', protect, educationController.getNotificationDetail);
router.delete('/notifications/:id', protect, educationController.deleteNotification);
router.post('/test-webhook', protect, educationController.testWebhook);

module.exports = router;
