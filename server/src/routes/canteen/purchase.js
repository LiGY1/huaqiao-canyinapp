const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const purchaseService = require('../../services/canteen/purchaseController');

// 采购管理路由
router.get('/statistics', protect, purchaseService.getPurchaseStatistics);
router.get('/:id', protect, purchaseService.getPurchaseOrderDetail);
router.get('/', protect, purchaseService.getPurchaseOrderList);
router.post('/', protect, purchaseService.createPurchaseOrder);
router.delete('/:id', protect, purchaseService.deletePurchaseOrder);
router.post('/:id/approve', protect, purchaseService.approvePurchaseOrder);
router.patch('/:id/status', protect, purchaseService.updatePurchaseOrderStatus);
router.post('/:id/complete', protect, purchaseService.completePurchase);

module.exports = router;
