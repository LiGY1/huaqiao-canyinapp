const Order = require('../../models/Order');
const { success, error, paginated } = require('../../utils/responseFormatter');
const { ORDER_STATUS } = require('../../config/constants');

exports.getOrderList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, mealType, date, keyword } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (mealType) filter.mealType = mealType;
    if (keyword) {
      filter.orderNumber = new RegExp(keyword, 'i');
    }
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      filter.orderDate = { $gte: startDate, $lte: endDate };
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('user', 'name studentId class grade phone')
      .populate('studentUser', 'name studentId class grade')
      .populate('items.dish', 'name image category')
      .sort({ orderDate: -1 })
      .limit(parseInt(pageSize))
      .skip((parseInt(page) - 1) * parseInt(pageSize));

    const formattedOrders = orders.map(order => {
      const user = order.studentUser || order.user;
      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        orderDate: order.orderDate,
        status: order.status,
        mealType: order.mealType,
        totalAmount: order.totalAmount,
        totalNutrition: order.totalNutrition,
        studentName: user?.name || '未知',
        studentId: user?.studentId || '-',
        className: user?.class || '-',
        grade: user?.grade || '-',
        phone: order.user?.phone || '-',
        location: order.location || {
          campus: '-',
          canteen: '-',
          floor: '-',
          window: '-'
        },
        items: order.items.map(item => ({
          id: item.dish?._id || item.dish,
          name: item.dishName,
          category: item.dishCategory,
          image: item.dishImage || item.dish?.image,
          quantity: item.quantity,
          price: item.price,
          nutrition: item.nutrition
        })),
        itemCount: order.items.length,
        dishNames: order.items.map(item => item.dishName).join('、'),
        completedAt: order.completedAt,
        remark: order.remark
      };
    });

    paginated(res, formattedOrders, page, pageSize, total);
  } catch (err) {
    console.error(err);
    error(res, '获取订单列表失败', 500);
  }
};

exports.getOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('user', 'name studentId class grade phone allergies hasDiabetes')
      .populate('studentUser', 'name studentId class grade allergies hasDiabetes')
      .populate('items.dish', 'name image category');

    if (!order) {
      return error(res, '订单不存在', 404);
    }

    const user = order.studentUser || order.user;
    const formattedOrder = {
      _id: order._id,
      orderNumber: order.orderNumber,
      orderDate: order.orderDate,
      status: order.status,
      mealType: order.mealType,
      totalAmount: order.totalAmount,
      totalNutrition: order.totalNutrition || {},
      scheduledDate: order.scheduledDate,
      completedAt: order.completedAt,
      remark: order.remark,
      location: order.location || {
        campus: '-',
        canteen: '-',
        floor: '-',
        window: '-'
      },
      student: {
        name: user?.name || '未知',
        studentId: user?.studentId || '-',
        class: user?.class || '-',
        grade: user?.grade || '-',
        phone: order.user?.phone || '-',
        allergies: user?.allergies || [],
        hasDiabetes: user?.hasDiabetes || false
      },
      items: order.items.map(item => ({
        id: item.dish?._id || item.dish,
        name: item.dishName,
        category: item.dishCategory,
        image: item.dishImage || item.dish?.image,
        quantity: item.quantity,
        price: item.price,
        nutrition: item.nutrition || {}
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };

    success(res, formattedOrder);
  } catch (err) {
    console.error(err);
    error(res, '获取订单详情失败', 500);
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      id,
      {
        status,
        ...(status === ORDER_STATUS.COMPLETED && { completedAt: new Date() })
      },
      { new: true }
    );

    if (!order) {
      return error(res, '订单不存在', 404);
    }

    success(res, order, '状态更新成功');
  } catch (err) {
    console.error(err);
    error(res, '更新状态失败', 500);
  }
};

exports.batchUpdateOrders = async (req, res) => {
  try {
    const { orderIds, status } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return error(res, '请提供订单ID列表', 400);
    }

    const result = await Order.updateMany(
      { _id: { $in: orderIds } },
      {
        status,
        ...(status === ORDER_STATUS.COMPLETED && { completedAt: new Date() })
      }
    );

    success(res, { modifiedCount: result.modifiedCount }, '批量更新成功');
  } catch (err) {
    console.error(err);
    error(res, '批量更新失败', 500);
  }
};

exports.getOrderStatistics = async (req, res) => {
  try {
    const { date, type = 'day' } = req.query;

    const targetDate = date ? new Date(date) : new Date();
    let startDate, endDate;

    if (type === 'day') {
      startDate = new Date(targetDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(targetDate);
      endDate.setHours(23, 59, 59, 999);
    }

    const orders = await Order.find({
      orderDate: { $gte: startDate, $lte: endDate },
      status: { $ne: ORDER_STATUS.CANCELLED }
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    const statusCount = {};
    Object.values(ORDER_STATUS).forEach(status => {
      statusCount[status] = orders.filter(o => o.status === status).length;
    });

    success(res, {
      totalOrders,
      totalRevenue: Math.round(totalRevenue),
      statusCount,
      date: targetDate.toISOString().split('T')[0]
    });
  } catch (err) {
    console.error(err);
    error(res, '获取订单统计失败', 500);
  }
};

