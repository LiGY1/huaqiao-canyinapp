const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const purchaseController = require('../../controllers/canteen/purchaseController');

// 采购管理路由
router.get('/statistics', protect, purchaseController.getPurchaseStatistics);
router.get('/:id', protect, purchaseController.getPurchaseOrderDetail);
router.get('/', protect, purchaseController.getPurchaseOrderList);
router.post('/', protect, purchaseController.createPurchaseOrder);
router.delete('/:id', protect, purchaseController.deletePurchaseOrder);
router.post('/:id/approve', protect, purchaseController.approvePurchaseOrder);
router.patch('/:id/status', protect, purchaseController.updatePurchaseOrderStatus);
router.post('/:id/complete', protect, purchaseController.completePurchase);

module.exports = router;
