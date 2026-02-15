const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const productionController = require('../../controllers/canteen/productionController');

// 生产管理路由
router.get('/statistics', protect, productionController.getProductionStatistics);
router.get('/ai-suggestions', protect, productionController.getAISuggestions);
router.get('/:id', protect, productionController.getProductionPlanDetail);
router.get('/', protect, productionController.getProductionPlanList);
router.post('/', protect, productionController.createProductionPlan);
router.put('/:id', protect, productionController.updateProductionPlan);
router.delete('/:id', protect, productionController.deleteProductionPlan);
router.post('/:id/start', protect, productionController.startProduction);
router.post('/:id/progress', protect, productionController.updateProgress);
router.post('/:id/complete', protect, productionController.completeProduction);

module.exports = router;
