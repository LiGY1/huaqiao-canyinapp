const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const chatService = require('../../services/parent/chatController');

// AI聊天相关路由
router.post('/save', protect, chatService.saveChatHistory);
router.post('/save-batch', protect, chatService.saveChatHistoryBatch);
router.get('/history', protect, chatService.getChatHistory);
router.get('/conversations', protect, chatService.getConversationList);
router.post('/stream', protect, chatService.streamChat);
router.delete('/clear-all', protect, chatService.clearAllChatHistory);
router.delete('/conversation/:conversationId', protect, chatService.deleteConversation);
router.delete('/:chatId', protect, chatService.deleteChatHistory);
router.put('/:chatId/favorite', protect, chatService.toggleChatFavorite);

module.exports = router;
