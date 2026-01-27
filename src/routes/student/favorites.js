const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const favoriteController = require('../../controllers/student/favoriteController');

router.use(protect);

// 对应前缀 /favorites
router.get('/', favoriteController.getFavorites);
router.post('/', favoriteController.addFavorite);
router.delete('/:dishId', favoriteController.removeFavorite);
router.get('/check/:dishId', favoriteController.checkFavorite);

module.exports = router;