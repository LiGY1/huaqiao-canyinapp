const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const inventoryController = require('../../controllers/canteen/inventoryController');

// 库存管理路由
router.get('/statistics', protect, inventoryController.getStatistics);
router.get('/:id/history', protect, inventoryController.getInventoryHistory);
router.get('/', protect, inventoryController.getInventoryList);
router.post('/', protect, inventoryController.addInventoryItem);
router.put('/:id', protect, inventoryController.updateInventoryItem);
router.delete('/:id', protect, inventoryController.deleteInventoryItem);
router.post('/:id/stock-in', protect, inventoryController.stockIn);
router.post('/:id/stock-out', protect, inventoryController.stockOut);

module.exports = router;
