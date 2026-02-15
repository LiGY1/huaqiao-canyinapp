const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const reviewService = require('../../services/student/reviewController');

router.use(protect);

// 对应前缀 /reviews
router.post('/', reviewService.createReview);
router.get('/', reviewService.getMyReviews);
router.get('/dish/:dishId', reviewService.getDishReviews);
router.get('/check/:orderId', reviewService.checkReviewable);

module.exports = router;