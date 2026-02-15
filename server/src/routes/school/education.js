const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const educationService = require('../../services/school/educationController');

// 教育材料相关路由
router.get('/materials', protect, educationService.getMaterials);
router.post('/materials', protect, educationService.createMaterial);
router.put('/materials/:id', protect, educationService.updateMaterial);
router.delete('/materials/:id', protect, educationService.deleteMaterial);
router.post('/materials/:id/publish', protect, educationService.publishMaterial);

// 通知相关路由
router.post('/notifications', protect, educationService.sendNotification);
router.get('/notifications', protect, educationService.getNotifications);
router.get('/notifications/:id', protect, educationService.getNotificationDetail);
router.delete('/notifications/:id', protect, educationService.deleteNotification);
router.post('/test-webhook', protect, educationService.testWebhook);

module.exports = router;
