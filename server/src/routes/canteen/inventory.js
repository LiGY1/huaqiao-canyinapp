const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const inventoryService = require('../../services/canteen/inventoryController');

// 库存管理路由
router.get('/statistics', protect, inventoryService.getStatistics);
router.get('/:id/history', protect, inventoryService.getInventoryHistory);
router.get('/', protect, inventoryService.getInventoryList);
router.post('/', protect, inventoryService.addInventoryItem);
router.put('/:id', protect, inventoryService.updateInventoryItem);
router.delete('/:id', protect, inventoryService.deleteInventoryItem);
router.post('/:id/stock-in', protect, inventoryService.stockIn);
router.post('/:id/stock-out', protect, inventoryService.stockOut);

module.exports = router;
