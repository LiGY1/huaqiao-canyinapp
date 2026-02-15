const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const productionService = require('../../services/canteen/productionController');

// 生产管理路由
router.get('/statistics', protect, productionService.getProductionStatistics);
router.get('/ai-suggestions', protect, productionService.getAISuggestions);
router.get('/:id', protect, productionService.getProductionPlanDetail);
router.get('/', protect, productionService.getProductionPlanList);
router.post('/', protect, productionService.createProductionPlan);
router.put('/:id', protect, productionService.updateProductionPlan);
router.delete('/:id', protect, productionService.deleteProductionPlan);
router.post('/:id/start', protect, productionService.startProduction);
router.post('/:id/progress', protect, productionService.updateProgress);
router.post('/:id/complete', protect, productionService.completeProduction);

module.exports = router;
