const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const healthController = require('../../controllers/student/healthController');

router.use(protect);

// 对应前缀 /health
router.post('/', healthController.addHealthRecord);
router.get('/', healthController.getHealthRecords);
router.get('/today', healthController.getTodayHealth);
router.get('/trends', healthController.getHealthTrends);
router.get('/assessment', healthController.getHealthAssessment);

module.exports = router;