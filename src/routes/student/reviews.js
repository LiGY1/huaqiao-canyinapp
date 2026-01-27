const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const reviewController = require('../../controllers/student/reviewController');

router.use(protect);

// 对应前缀 /reviews
router.post('/', reviewController.createReview);
router.get('/', reviewController.getMyReviews);
router.get('/dish/:dishId', reviewController.getDishReviews);
router.get('/check/:orderId', reviewController.checkReviewable);

module.exports = router;