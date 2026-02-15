const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const chatController = require('../../controllers/parent/chatController');

// AI聊天相关路由
router.post('/save', protect, chatController.saveChatHistory);
router.post('/save-batch', protect, chatController.saveChatHistoryBatch);
router.get('/history', protect, chatController.getChatHistory);
router.get('/conversations', protect, chatController.getConversationList);
router.post('/stream', protect, chatController.streamChat);
router.delete('/clear-all', protect, chatController.clearAllChatHistory);
router.delete('/conversation/:conversationId', protect, chatController.deleteConversation);
router.delete('/:chatId', protect, chatController.deleteChatHistory);
router.put('/:chatId/favorite', protect, chatController.toggleChatFavorite);

module.exports = router;
