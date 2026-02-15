const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const healthService = require('../../services/student/healthController');

router.use(protect);

// 对应前缀 /health
router.post('/', healthService.addHealthRecord);
router.get('/', healthService.getHealthRecords);
router.get('/today', healthService.getTodayHealth);
router.get('/trends', healthService.getHealthTrends);
router.get('/assessment', healthService.getHealthAssessment);

module.exports = router;