const ProductionPlan = require('../../models/ProductionPlan');
const Dish = require('../../models/Dish');
const Inventory = require('../../models/Inventory');
const Order = require('../../models/Order');
const { success, error, paginated } = require('../../utils/responseFormatter');
const { getStartOfDay, getEndOfDay } = require('../../utils/dateUtils');
const { ORDER_STATUS } = require('../../config/constants');

exports.getProductionPlanList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, date, mealType, status } = req.query;

    const filter = {};
    if (date) {
      const targetDate = new Date(date);
      filter.date = {
        $gte: getStartOfDay(targetDate),
        $lte: getEndOfDay(targetDate)
      };
    }
    if (mealType) filter.mealType = mealType;
    if (status) filter.status = status;

    const total = await ProductionPlan.countDocuments(filter);
    const plans = await ProductionPlan.find(filter)
      .populate('dish', 'name image category price')
      .sort({ date: -1, mealType: 1 })
      .limit(parseInt(pageSize))
      .skip((parseInt(page) - 1) * parseInt(pageSize));

    const formattedPlans = plans.map(plan => ({
      _id: plan._id,
      dish: plan.dish,
      dishName: plan.dishName || plan.dish?.name,
      dishCategory: plan.dishCategory || plan.dish?.category,
      dishImage: plan.dishImage || plan.dish?.image,
      date: plan.date,
      mealType: plan.mealType,
      plannedQuantity: plan.plannedQuantity,
      completedQuantity: plan.completedQuantity,
      status: plan.status,
      chef: plan.chef,
      startTime: plan.startTime,
      completedTime: plan.completedTime,
      remark: plan.remark,
      aiSuggested: plan.aiSuggested,
      suggestedReason: plan.suggestedReason,
      quality: plan.quality,
      progress: plan.plannedQuantity > 0
        ? Math.round((plan.completedQuantity / plan.plannedQuantity) * 100)
        : 0,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt
    }));

    paginated(res, formattedPlans, page, pageSize, total);
  } catch (err) {
    console.error(err);
    error(res, '获取生产计划列表失败', 500);
  }
};

exports.createProductionPlan = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      return error(res, '生产计划不能为空', 400);
    }

    const createdPlans = [];

    for (const item of items) {
      const dish = await Dish.findById(item.dishId);
      if (!dish) {
        console.warn(`菜品不存在: ${item.dishId}`);
        continue;
      }

      const plan = await ProductionPlan.create({
        dish: dish._id,
        dishName: dish.name,
        dishCategory: dish.category,
        dishImage: dish.image,
        date: item.date,
        mealType: item.mealType,
        plannedQuantity: item.plannedQuantity,
        chef: item.chef,
        remark: item.remark,
        aiSuggested: item.aiSuggested || false,
        suggestedReason: item.suggestedReason
      });

      createdPlans.push(plan);
    }

    success(res, createdPlans, `成功创建${createdPlans.length}个生产计划`, 201);
  } catch (err) {
    console.error(err);
    error(res, '创建生产计划失败', 500);
  }
};

exports.updateProductionPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const plan = await ProductionPlan.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('dish', 'name image category');

    if (!plan) {
      return error(res, '生产计划不存在', 404);
    }

    success(res, plan, '更新成功');
  } catch (err) {
    console.error(err);
    error(res, '更新生产计划失败', 500);
  }
};

exports.updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { completedQuantity, usedIngredients, remark } = req.body;

    const plan = await ProductionPlan.findById(id);
    if (!plan) {
      return error(res, '生产计划不存在', 404);
    }

    plan.completedQuantity = completedQuantity;
    if (usedIngredients) plan.usedIngredients = usedIngredients;
    if (remark) plan.remark = remark;

    if (completedQuantity >= plan.plannedQuantity) {
      plan.status = 'completed';
      plan.completedTime = new Date();
    }

    await plan.save();

    success(res, plan, '进度更新成功');
  } catch (err) {
    console.error(err);
    error(res, '更新进度失败', 500);
  }
};

exports.startProduction = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await ProductionPlan.findById(id);
    if (!plan) {
      return error(res, '生产计划不存在', 404);
    }

    if (plan.status !== 'pending') {
      return error(res, '该计划已经开始或完成', 400);
    }

    plan.status = 'in_progress';
    plan.startTime = new Date();

    await plan.save();

    success(res, plan, '已开始制作');
  } catch (err) {
    console.error(err);
    error(res, '开始制作失败', 500);
  }
};

exports.completeProduction = async (req, res) => {
  try {
    const { id } = req.params;
    const { quality, qualityRemark, actualQuantity } = req.body;

    const plan = await ProductionPlan.findById(id).populate('dish');
    if (!plan) {
      return error(res, '生产计划不存在', 404);
    }

    plan.status = 'completed';
    plan.completedTime = new Date();
    plan.completedQuantity = actualQuantity || plan.plannedQuantity;
    if (quality) plan.quality = quality;
    if (qualityRemark) plan.qualityRemark = qualityRemark;

    await plan.save();

    if (plan.dish) {
      const dish = await Dish.findById(plan.dish._id);
      if (dish) {
        dish.stock = (dish.stock || 0) + plan.completedQuantity;
        await dish.save();
      }
    }

    success(res, plan, '生产完成');
  } catch (err) {
    console.error(err);
    error(res, '完成生产失败', 500);
  }
};

exports.deleteProductionPlan = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await ProductionPlan.findById(id);
    if (!plan) {
      return error(res, '生产计划不存在', 404);
    }

    if (plan.status !== 'pending') {
      return error(res, '只能删除待开始的生产计划', 400);
    }

    await ProductionPlan.findByIdAndDelete(id);

    success(res, null, '删除成功');
  } catch (err) {
    console.error(err);
    error(res, '删除生产计划失败', 500);
  }
};

exports.getProductionStatistics = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const filter = {
      date: {
        $gte: getStartOfDay(targetDate),
        $lte: getEndOfDay(targetDate)
      }
    };

    const plans = await ProductionPlan.find(filter);

    const statistics = {
      total: plans.length,
      pending: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
      totalPlanned: 0,
      totalCompleted: 0,
      completionRate: 0,
      byMealType: {
        breakfast: { count: 0, planned: 0, completed: 0 },
        lunch: { count: 0, planned: 0, completed: 0 },
        dinner: { count: 0, planned: 0, completed: 0 }
      }
    };

    plans.forEach(plan => {

      if (plan.status === 'pending') statistics.pending++;
      else if (plan.status === 'in_progress') statistics.inProgress++;
      else if (plan.status === 'completed') statistics.completed++;
      else if (plan.status === 'cancelled') statistics.cancelled++;

      statistics.totalPlanned += plan.plannedQuantity;
      statistics.totalCompleted += plan.completedQuantity;

      if (statistics.byMealType[plan.mealType]) {
        statistics.byMealType[plan.mealType].count++;
        statistics.byMealType[plan.mealType].planned += plan.plannedQuantity;
        statistics.byMealType[plan.mealType].completed += plan.completedQuantity;
      }
    });

    if (statistics.totalPlanned > 0) {
      statistics.completionRate = Math.round((statistics.totalCompleted / statistics.totalPlanned) * 100);
    }

    success(res, statistics);
  } catch (err) {
    console.error(err);
    error(res, '获取统计数据失败', 500);
  }
};

exports.getAISuggestions = async (req, res) => {
  try {
    const { date, mealType } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const dishes = await Dish.find({ status: 1 }).sort({ salesCount: -1 });

    const historicalOrders = await Order.find({
      orderDate: {
        $gte: new Date(targetDate.getTime() - 7 * 24 * 60 * 60 * 1000),
        $lte: targetDate
      },
      status: { $ne: ORDER_STATUS.CANCELLED }
    });

    const dishSales = {};
    historicalOrders.forEach(order => {
      order.items.forEach(item => {
        const dishId = item.dish.toString();
        if (!dishSales[dishId]) {
          dishSales[dishId] = {
            total: 0,
            byMealType: { breakfast: 0, lunch: 0, dinner: 0 }
          };
        }
        dishSales[dishId].total += item.quantity;
        if (order.mealType) {
          dishSales[dishId].byMealType[order.mealType] =
            (dishSales[dishId].byMealType[order.mealType] || 0) + item.quantity;
        }
      });
    });

    const suggestions = dishes.slice(0, 20).map(dish => {
      const dishId = dish._id.toString();
      const sales = dishSales[dishId] || { total: 0, byMealType: {} };

      const avgDaily = Math.round(sales.total / 7);
      const avgMealType = mealType ? Math.round((sales.byMealType[mealType] || 0) / 7) : avgDaily;

      let suggestedQuantity = Math.max(20, Math.round(avgMealType * 1.1));

      if (dish.isPopular) {
        suggestedQuantity = Math.round(suggestedQuantity * 1.2);
      }
      if (dish.category === 'staple') {
        suggestedQuantity = Math.round(suggestedQuantity * 1.3);
      }

      let reason = '';
      if (dish.isPopular) {
        reason = '热门菜品，建议多准备';
      } else if (avgMealType > 50) {
        reason = `近7日平均销售${avgMealType}份/餐，需求稳定`;
      } else if (dish.averageRating > 4.5) {
        reason = `评分${dish.averageRating}分，口碑优秀`;
      } else if (dish.category === 'staple') {
        reason = '主食类刚需，建议充足供应';
      } else {
        reason = '根据历史数据适量准备';
      }

      return {
        dishId: dish._id,
        dishName: dish.name,
        dishCategory: dish.category,
        dishImage: dish.image,
        suggestedQuantity,
        historicalAvg: avgMealType,
        currentStock: dish.stock || 0,
        reason,
        confidence: avgMealType > 10 ? 0.85 : 0.60
      };
    });

    const filteredSuggestions = suggestions.filter(s => s.suggestedQuantity > 0);

    success(res, filteredSuggestions);
  } catch (err) {
    console.error(err);
    error(res, '获取AI建议失败', 500);
  }
};

exports.getProductionPlanDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await ProductionPlan.findById(id)
      .populate('dish', 'name image category price nutrition')
      .populate('usedIngredients.ingredient', 'name unit');

    if (!plan) {
      return error(res, '生产计划不存在', 404);
    }

    success(res, plan);
  } catch (err) {
    console.error(err);
    error(res, '获取生产计划详情失败', 500);
  }
};

module.exports = exports;

