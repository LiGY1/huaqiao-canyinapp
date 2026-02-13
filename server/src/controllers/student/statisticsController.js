const Order = require('../../models/Order');
const NutritionRecord = require('../../models/NutritionRecord');
const Review = require('../../models/Review');
const Favorite = require('../../models/Favorite');
const { success, error } = require('../../utils/responseFormatter');
const { getWeekRange, getMonthRange } = require('../../utils/dateUtils');
const cache = require('../../utils/cache');

exports.getOverview = async (req, res) => {
  try {
    const userId = req.user._id;

    // 🚀 优化：生成缓存键
    const cacheKey = cache.generateKey('student:overview', {
      userId: userId.toString()
    });

    // 🚀 优化：尝试从缓存获取
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log('✅ 学生概览缓存命中');
      return success(res, cached);
    }

    const totalOrders = await Order.countDocuments({ user: userId });
    const completedOrders = await Order.countDocuments({
      user: userId,
      status: 'completed'
    });

    const orderStats = await Order.aggregate([
      { $match: { user: userId, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$totalAmount' }
        }
      }
    ]);
    const totalSpent = orderStats[0]?.totalSpent || 0;

    const favoriteCount = await Favorite.countDocuments({ user: userId });

    const reviewCount = await Review.countDocuments({ user: userId });

    const { start: weekStart, end: weekEnd } = getWeekRange();
    const weekOrders = await Order.countDocuments({
      user: userId,
      orderDate: { $gte: weekStart, $lte: weekEnd }
    });

    const { start: monthStart, end: monthEnd } = getMonthRange();
    const monthOrders = await Order.countDocuments({
      user: userId,
      orderDate: { $gte: monthStart, $lte: monthEnd }
    });

    const nutritionRecords = await NutritionRecord.find({
      user: userId,
      date: { $gte: monthStart, $lte: monthEnd }
    });

    const targetCalories = req.user.targetCalories || 2000;
    const nutritionCompliantDays = nutritionRecords.filter(record => {
      const intake = record.intake.calories || 0;
      return intake >= targetCalories * 0.8 && intake <= targetCalories * 1.2;
    }).length;

    const result = {
      orders: {
        total: totalOrders,
        completed: completedOrders,
        thisWeek: weekOrders,
        thisMonth: monthOrders
      },
      spending: {
        total: Number(totalSpent.toFixed(2)),
        average: completedOrders > 0 ? Number((totalSpent / completedOrders).toFixed(2)) : 0
      },
      favorites: favoriteCount,
      reviews: reviewCount,
      nutrition: {
        compliantDays: nutritionCompliantDays,
        totalDays: nutritionRecords.length,
        complianceRate: nutritionRecords.length > 0
          ? Number((nutritionCompliantDays / nutritionRecords.length * 100).toFixed(1))
          : 0
      }
    };

    // 🚀 优化：存入缓存（5分钟）
    await cache.set(cacheKey, result, 300);

    success(res, result);
  } catch (err) {
    console.error(err);
    error(res, '获取统计数据失败', 500);
  }
};

exports.getSpendingTrends = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const userId = req.user._id;

    // 🚀 优化：生成缓存键
    const cacheKey = cache.generateKey('student:spending', {
      userId: userId.toString(),
      period
    });

    // 🚀 优化：尝试从缓存获取
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log('✅ 学生消费趋势缓存命中');
      return success(res, cached);
    }

    let dateRange;
    if (period === 'week') {
      dateRange = getWeekRange();
    } else {
      dateRange = getMonthRange();
    }

    const orders = await Order.find({
      user: userId,
      status: 'completed',
      orderDate: { $gte: dateRange.start, $lte: dateRange.end }
    }).sort({ orderDate: 1 });

    const dailySpending = {};
    orders.forEach(order => {
      const date = order.orderDate.toISOString().split('T')[0];
      if (!dailySpending[date]) {
        dailySpending[date] = 0;
      }
      dailySpending[date] += order.totalAmount;
    });

    const dates = Object.keys(dailySpending).sort();
    const amounts = dates.map(date => Number(dailySpending[date].toFixed(2)));

    const result = {
      dates,
      amounts,
      total: Number(amounts.reduce((a, b) => a + b, 0).toFixed(2)),
      average: amounts.length > 0 ? Number((amounts.reduce((a, b) => a + b, 0) / amounts.length).toFixed(2)) : 0
    };

    // 🚀 优化：存入缓存（10分钟）
    await cache.set(cacheKey, result, 600);

    success(res, result);
  } catch (err) {
    console.error(err);
    error(res, '获取消费趋势失败', 500);
  }
};

exports.getFavoriteDishes = async (req, res) => {
  try {
    const userId = req.user._id;

    // 🚀 优化：生成缓存键
    const cacheKey = cache.generateKey('student:favorite-dishes', {
      userId: userId.toString()
    });

    // 🚀 优化：尝试从缓存获取
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log('✅ 学生喜爱菜品缓存命中');
      return success(res, cached);
    }

    const orders = await Order.find({
      user: userId,
      status: 'completed'
    }).populate('items.dish', 'name image category');

    const dishCount = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.dish) {
          const dishId = item.dish._id.toString();
          if (!dishCount[dishId]) {
            dishCount[dishId] = {
              dish: item.dish,
              count: 0,
              totalSpent: 0
            };
          }
          dishCount[dishId].count += item.quantity;
          dishCount[dishId].totalSpent += item.price * item.quantity;
        }
      });
    });

    const favoriteDishes = Object.values(dishCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(item => ({
        id: item.dish._id,
        name: item.dish.name,
        image: item.dish.image,
        category: item.dish.category,
        orderCount: item.count,
        totalSpent: Number(item.totalSpent.toFixed(2))
      }));

    // 🚀 优化：存入缓存（10分钟）
    await cache.set(cacheKey, favoriteDishes, 600);

    success(res, favoriteDishes);
  } catch (err) {
    console.error(err);
    error(res, '获取喜爱菜品失败', 500);
  }
};

exports.getNutritionSummary = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const userId = req.user._id;

    // 🚀 优化：生成缓存键
    const cacheKey = cache.generateKey('student:nutrition-summary', {
      userId: userId.toString(),
      period
    });

    // 🚀 优化：尝试从缓存获取
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log('✅ 学生营养统计缓存命中');
      return success(res, cached);
    }

    let dateRange;
    if (period === 'week') {
      dateRange = getWeekRange();
    } else {
      dateRange = getMonthRange();
    }

    const records = await NutritionRecord.find({
      user: userId,
      date: { $gte: dateRange.start, $lte: dateRange.end }
    });

    if (records.length === 0) {
      const emptyResult = {
        average: { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 },
        total: { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 },
        days: 0
      };
      // 🚀 优化：空结果也缓存（10分钟）
      await cache.set(cacheKey, emptyResult, 600);
      return success(res, emptyResult);
    }

    const total = {
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      fiber: 0
    };

    records.forEach(record => {
      total.calories += record.intake.calories || 0;
      total.protein += record.intake.protein || 0;
      total.fat += record.intake.fat || 0;
      total.carbs += record.intake.carbs || 0;
      total.fiber += record.intake.fiber || 0;
    });

    const average = {
      calories: Math.round(total.calories / records.length),
      protein: Math.round(total.protein / records.length),
      fat: Math.round(total.fat / records.length),
      carbs: Math.round(total.carbs / records.length),
      fiber: Math.round(total.fiber / records.length)
    };

    const result = {
      average,
      total: {
        calories: Math.round(total.calories),
        protein: Math.round(total.protein),
        fat: Math.round(total.fat),
        carbs: Math.round(total.carbs),
        fiber: Math.round(total.fiber)
      },
      days: records.length
    };

    // 🚀 优化：存入缓存（10分钟）
    await cache.set(cacheKey, result, 600);

    success(res, result);
  } catch (err) {
    console.error(err);
    error(res, '获取营养统计失败', 500);
  }
};

