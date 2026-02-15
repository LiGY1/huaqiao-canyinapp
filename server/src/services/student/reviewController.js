const Review = require('../../models/Review');
const Order = require('../../models/Order');
const Dish = require('../../models/Dish');
const { success, error } = require('../../utils/responseFormatter');

exports.createReview = async (req, res) => {
  try {
    const {
      orderId,
      dishId,
      rating,
      taste,
      freshness,
      portionSize,
      comment,
      images,
      isAnonymous
    } = req.body;

    if (!orderId || !rating) {
      return error(res, '订单ID和评分为必填项', 400);
    }

    const order = await Order.findOne({
      orderNumber: orderId,
      user: req.user._id
    });

    if (!order) {
      return error(res, '订单不存在或无权限', 404);
    }

    if (order.status !== 'completed') {
      return error(res, '只能评价已完成的订单', 400);
    }

    const existingReview = await Review.findOne({
      order: order._id,
      user: req.user._id
    });

    if (existingReview) {
      return error(res, '该订单已评价', 400);
    }

    let dishObjectId = null;
    if (dishId) {
      const dishInOrder = order.items.find(item =>
        item.dish.toString() === dishId
      );
      if (!dishInOrder) {
        return error(res, '该菜品不在订单中', 400);
      }
      dishObjectId = dishId;
    }

    const review = await Review.create({
      user: req.user._id,
      order: order._id,
      dish: dishObjectId,
      rating,
      taste: taste || rating,
      freshness: freshness || rating,
      portionSize: portionSize || rating,
      comment,
      images: images || [],
      isAnonymous: isAnonymous || false
    });

    if (dishObjectId) {
      await updateDishRating(dishObjectId);
    }

    success(res, {
      id: review._id,
      message: '评价成功'
    }, '评价成功', 201);
  } catch (err) {
    console.error(err);
    error(res, '评价失败', 500);
  }
};

exports.getMyReviews = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const skip = (page - 1) * pageSize;

    const reviews = await Review.find({ user: req.user._id })
      .populate('order', 'orderNumber orderDate totalAmount')
      .populate('dish', 'name image category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(pageSize));

    const total = await Review.countDocuments({ user: req.user._id });

    const formattedReviews = reviews.map(review => ({
      id: review._id,
      order: {
        orderId: review.order.orderNumber,
        orderDate: review.order.orderDate,
        totalAmount: review.order.totalAmount
      },
      dish: review.dish ? {
        id: review.dish._id,
        name: review.dish.name,
        image: review.dish.image,
        category: review.dish.category
      } : null,
      rating: review.rating,
      taste: review.taste,
      freshness: review.freshness,
      portionSize: review.portionSize,
      comment: review.comment,
      images: review.images,
      isAnonymous: review.isAnonymous,
      reply: review.reply,
      createdAt: review.createdAt
    }));

    success(res, {
      reviews: formattedReviews,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (err) {
    console.error(err);
    error(res, '获取评价列表失败', 500);
  }
};

exports.getDishReviews = async (req, res) => {
  try {
    const { dishId } = req.params;
    const { page = 1, pageSize = 10 } = req.query;
    const skip = (page - 1) * pageSize;

    const reviews = await Review.find({ dish: dishId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(pageSize));

    const total = await Review.countDocuments({ dish: dishId });

    const stats = await Review.aggregate([
      { $match: { dish: mongoose.Types.ObjectId(dishId) } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          avgTaste: { $avg: '$taste' },
          avgFreshness: { $avg: '$freshness' },
          avgPortionSize: { $avg: '$portionSize' },
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedReviews = reviews.map(review => ({
      id: review._id,
      user: review.isAnonymous ? {
        name: '匿名用户',
        avatar: ''
      } : {
        name: review.user.name,
        avatar: review.user.avatar
      },
      rating: review.rating,
      taste: review.taste,
      freshness: review.freshness,
      portionSize: review.portionSize,
      comment: review.comment,
      images: review.images,
      reply: review.reply,
      createdAt: review.createdAt
    }));

    success(res, {
      reviews: formattedReviews,
      stats: stats[0] || {
        avgRating: 0,
        avgTaste: 0,
        avgFreshness: 0,
        avgPortionSize: 0,
        count: 0
      },
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (err) {
    console.error(err);
    error(res, '获取评价失败', 500);
  }
};

exports.checkReviewable = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      orderNumber: orderId,
      user: req.user._id
    });

    if (!order) {
      return error(res, '订单不存在', 404);
    }

    const existingReview = await Review.findOne({
      order: order._id,
      user: req.user._id
    });

    success(res, {
      canReview: order.status === 'completed' && !existingReview,
      hasReviewed: !!existingReview,
      orderStatus: order.status
    });
  } catch (err) {
    console.error(err);
    error(res, '检查失败', 500);
  }
};

async function updateDishRating(dishId) {
  try {
    const stats = await Review.aggregate([
      { $match: { dish: mongoose.Types.ObjectId(dishId) } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' }
        }
      }
    ]);

    if (stats.length > 0) {
      await Dish.findByIdAndUpdate(dishId, {
        averageRating: Number(stats[0].avgRating.toFixed(1))
      });
    }
  } catch (err) {
    console.error('更新菜品评分失败:', err);
  }
}

