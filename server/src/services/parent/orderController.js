const Dish = require('../../models/Dish');
const Order = require('../../models/Order');
const User = require('../../models/User');
const { success, error } = require('../../utils/responseFormatter');
const { ORDER_STATUS, DISH_STATUS } = require('../../config/constants');

exports.getMealList = async (req, res) => {
  try {
    const { category } = req.query;

    const filter = { status: DISH_STATUS.AVAILABLE };
    if (category && category !== 'all') {
      filter.category = category;
    }

    const dishes = await Dish.find(filter).sort({ isPopular: -1 });

    success(res, dishes);
  } catch (err) {
    console.error(err);
    error(res, '获取菜品列表失败', 500);
  }
};

exports.createOrderForChild = async (req, res) => {
  try {
    const { childId, items, mealType, scheduledDate } = req.body;

    const parent = await User.findById(req.user._id);
    if (!parent.children.some(id => id.toString() === childId)) {
      return error(res, '无权为该学生订餐', 403);
    }

    if (!items || items.length === 0) {
      return error(res, '订单不能为空', 400);
    }

    let totalAmount = 0;
    let totalNutrition = {
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      fiber: 0
    };

    const orderItems = [];

    for (const item of items) {
      const dish = await Dish.findById(item.dishId);
      if (!dish) {
        return error(res, `菜品不存在: ${item.dishId}`, 400);
      }

      const itemTotal = dish.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        dish: dish._id,
        dishName: dish.name,
        quantity: item.quantity,
        price: dish.price,
        nutrition: dish.nutrition
      });

      totalNutrition.calories += dish.nutrition.calories * item.quantity;
      totalNutrition.protein += dish.nutrition.protein * item.quantity;
      totalNutrition.fat += dish.nutrition.fat * item.quantity;
      totalNutrition.carbs += dish.nutrition.carbs * item.quantity;
      totalNutrition.fiber += dish.nutrition.fiber * item.quantity;
    }

    const order = await Order.create({
      user: req.user._id,
      studentUser: childId,
      items: orderItems,
      totalAmount,
      totalNutrition,
      status: ORDER_STATUS.PAID,
      mealType,
      scheduledDate: scheduledDate || new Date()
    });

    // 🚀 缓存失效：清除相关缓存
    const cacheInvalidation = require('../../utils/cacheInvalidation');
    cacheInvalidation.invalidateOrderCache(order).catch(err => {
      console.error('缓存失效失败:', err);
    });

    success(res, {
      orderId: order.orderNumber,
      status: order.status
    }, '订餐成功', 201);
  } catch (err) {
    console.error(err);
    error(res, '订餐失败', 500);
  }
};

exports.getOrderHistory = async (req, res) => {
  try {
    const { childId, page = 1, pageSize = 10 } = req.query;

    let filter = { user: req.user._id };

    if (childId) {

      const parent = await User.findById(req.user._id);
      if (!parent.children.some(id => id.toString() === childId)) {
        return error(res, '无权查看该订单', 403);
      }
      filter.studentUser = childId;
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('studentUser', 'name studentId')
      .populate('items.dish', 'name image')
      .sort({ orderDate: -1 })
      .limit(parseInt(pageSize))
      .skip((parseInt(page) - 1) * parseInt(pageSize));

    success(res, {
      list: orders,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (err) {
    console.error(err);
    error(res, '获取订单历史失败', 500);
  }
};

