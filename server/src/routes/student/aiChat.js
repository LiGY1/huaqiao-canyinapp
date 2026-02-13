const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const nutritionController = require('../../controllers/student/nutritionController');

router.use(protect);

// -------- ai聊天接口 --------
router.post('/stream', nutritionController.streamChat);
// ---------------------


router.post('/save', nutritionController.saveChatHistory);
router.post('/save-batch', nutritionController.saveChatHistoryBatch);
router.get('/history', nutritionController.getChatHistory);
router.get('/conversations', nutritionController.getConversationList);
router.delete('/clear-all', nutritionController.clearAllChatHistory);
router.delete('/conversation/:conversationId', nutritionController.deleteConversation);
router.delete('/:chatId', nutritionController.deleteChatHistory);
router.put('/:chatId/favorite', nutritionController.toggleChatFavorite);

module.exports = router;