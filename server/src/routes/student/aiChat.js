const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const nutritionService = require('../../services/student/nutritionController');

router.use(protect);

// -------- ai聊天接口 --------
router.post('/stream', nutritionService.streamChat);
// ---------------------


router.post('/save', nutritionService.saveChatHistory);
router.post('/save-batch', nutritionService.saveChatHistoryBatch);
router.get('/history', nutritionService.getChatHistory);
router.get('/conversations', nutritionService.getConversationList);
router.delete('/clear-all', nutritionService.clearAllChatHistory);
router.delete('/conversation/:conversationId', nutritionService.deleteConversation);
router.delete('/:chatId', nutritionService.deleteChatHistory);
router.put('/:chatId/favorite', nutritionService.toggleChatFavorite);

module.exports = router;