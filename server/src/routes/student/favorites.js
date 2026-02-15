const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const favoriteService = require('../../services/student/favoriteController');

router.use(protect);

// 对应前缀 /favorites
router.get('/', favoriteService.getFavorites);
router.post('/', favoriteService.addFavorite);
router.delete('/:dishId', favoriteService.removeFavorite);
router.get('/check/:dishId', favoriteService.checkFavorite);

module.exports = router;