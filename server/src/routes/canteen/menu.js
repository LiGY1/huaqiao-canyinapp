const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const menuController = require('../../controllers/canteen/menuController');

// 菜单管理路由
router.get('/', protect, menuController.getDishList);
router.post('/', protect, menuController.addDish);
router.put('/:id', protect, menuController.updateDish);
router.delete('/:id', protect, menuController.deleteDish);
router.patch('/:id/status', protect, menuController.updateDishStatus);

module.exports = router;
