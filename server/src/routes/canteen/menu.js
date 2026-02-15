const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const menuService = require('../../services/canteen/menuController');

// 菜单管理路由
router.get('/', protect, menuService.getDishList);
router.post('/', protect, menuService.addDish);
router.put('/:id', protect, menuService.updateDish);
router.delete('/:id', protect, menuService.deleteDish);
router.patch('/:id/status', protect, menuService.updateDishStatus);

module.exports = router;
