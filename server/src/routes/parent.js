const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// 路由测试接口
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: '家长端路由正常',
    module: 'parent',
    availableEndpoints: [
      'POST /api/parent/auth/login',
      'GET /api/parent/child/:childId/nutrition',
      'GET /api/parent/orders',
      '... 查看完整文档'
    ]
  });
});

const authController = require('../controllers/parent/authController');
const childController = require('../controllers/parent/childController');
const orderController = require('../controllers/parent/orderController');
const chatController = require('../controllers/parent/chatController');

router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.get('/auth/info', protect, authController.getUserInfo);
router.post('/auth/bind-child', protect, authController.bindChild);
router.get('/auth/reminder-settings', protect, authController.getReminderSettings);
router.put('/auth/reminder-settings', protect, authController.updateReminderSettings);

router.get('/child/:childId/nutrition', protect, childController.getChildNutrition);
router.get('/child/:childId/meal-history', protect, childController.getMealHistory);
router.get('/child/:childId/weekly-report', protect, childController.getWeeklyReport);
router.get('/child/:childId/physical-exams', protect, childController.getPhysicalExams);

router.post('/child/:childId/ai-report', protect, childController.generateChildAIReport);
router.get('/child/:childId/ai-reports', protect, childController.getChildAIReports);

router.get('/meals', protect, orderController.getMealList);
router.post('/orders', protect, orderController.createOrderForChild);
router.get('/orders', protect, orderController.getOrderHistory);

router.post('/ai-chat/save', protect, chatController.saveChatHistory);
router.post('/ai-chat/save-batch', protect, chatController.saveChatHistoryBatch);
router.get('/ai-chat/history', protect, chatController.getChatHistory);
router.get('/ai-chat/conversations', protect, chatController.getConversationList);
router.post('/ai-chat/stream', protect, chatController.streamChat);
router.delete('/ai-chat/clear-all', protect, chatController.clearAllChatHistory);
router.delete('/ai-chat/conversation/:conversationId', protect, chatController.deleteConversation);
router.delete('/ai-chat/:chatId', protect, chatController.deleteChatHistory);
router.put('/ai-chat/:chatId/favorite', protect, chatController.toggleChatFavorite);

module.exports = router;

