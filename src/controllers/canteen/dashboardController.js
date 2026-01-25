const Order = require('../../models/Order');
const Dish = require('../../models/Dish');
const Inventory = require('../../models/Inventory');
const { success, error } = require('../../utils/responseFormatter');
const { getStartOfDay, getEndOfDay, getWeekRange } = require('../../utils/dateUtils');
const { ORDER_STATUS } = require('../../config/constants');

exports.getSalesData = async (req, res) => {
  try {
    const today = new Date();

    const todayOrders = await Order.find({
      orderDate: {
        $gte: getStartOfDay(today),
        $lte: getEndOfDay(today)
      },
      status: { $ne: ORDER_STATUS.CANCELLED }
    });

    const todaySales = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const todayOrderCount = todayOrders.length;

    const dishSales = {};
    todayOrders.forEach(order => {
      order.items.forEach(item => {
        const dishName = item.dishName;
        if (!dishSales[dishName]) {
          dishSales[dishName] = {
            name: dishName,
            category: item.dishCategory,
            sales: 0,
            revenue: 0,
            image: item.dishImage
          };
        }
        dishSales[dishName].sales += item.quantity;
        dishSales[dishName].revenue += item.price * item.quantity;
      });
    });

    const topDishes = Object.values(dishSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);

    const { start, end } = getWeekRange();
    const weeklyOrders = await Order.find({
      orderDate: { $gte: start, $lte: end },
      status: { $ne: ORDER_STATUS.CANCELLED }
    });

    const dailySales = new Array(7).fill(0);
    weeklyOrders.forEach(order => {
      const dayIndex = new Date(order.orderDate).getDay();
      const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
      dailySales[adjustedIndex] += order.totalAmount;
    });

    const trend = dailySales.map((sales, i) => ({
      date: `Day ${i + 1}`,
      sales: Math.round(sales)
    }));

    success(res, {
      todaySales: Math.round(todaySales),
      todayOrders: todayOrderCount,
      dishes: topDishes,
      trend
    });
  } catch (err) {
    console.error(err);
    error(res, '获取销售数据失败', 500);
  }
};

exports.getInventoryData = async (req, res) => {
  try {
    const inventory = await Inventory.find();

    const totalValue = inventory.reduce((sum, item) =>
      sum + (item.quantity * item.unitPrice), 0
    );

    const warningItems = inventory.filter(item => item.quantity <= item.warningLevel);

    const items = warningItems.map(item => ({
      name: item.name,
      quantity: item.quantity,
      warningLevel: item.warningLevel,
      unit: item.unit
    }));

    success(res, {
      totalValue: Math.round(totalValue),
      warningCount: warningItems.length,
      items
    });
  } catch (err) {
    console.error(err);
    error(res, '获取库存数据失败', 500);
  }
};

exports.getProductionSuggestions = async (req, res) => {
  try {

    const dishes = await Dish.find({ status: 1 }).sort({ salesCount: -1 });

    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentOrders = await Order.find({
      orderDate: {
        $gte: getStartOfDay(sevenDaysAgo),
        $lte: getEndOfDay(today)
      },
      status: { $ne: ORDER_STATUS.CANCELLED }
    });

    const weekSales = {};
    const todaySales = {};

    recentOrders.forEach(order => {
      const isToday = order.orderDate >= getStartOfDay(today);

      order.items.forEach(item => {
        const dishId = item.dish.toString();

        if (!weekSales[dishId]) {
          weekSales[dishId] = 0;
        }
        weekSales[dishId] += item.quantity;

        if (isToday) {
          if (!todaySales[dishId]) {
            todaySales[dishId] = 0;
          }
          todaySales[dishId] += item.quantity;
        }
      });
    });

    const suggestions = dishes.slice(0, 10).map((dish, index) => {
      const dishId = dish._id.toString();
      const todaySold = todaySales[dishId] || 0;
      const weekSold = weekSales[dishId] || 0;
      const weekAvg = Math.round(weekSold / 7);
      const currentStock = dish.stock || 0;

      let baseProduction = weekAvg > 0 ? Math.round(weekAvg * 1.2) : 20 + (index * 5);

      let suggestedProduction = baseProduction;
      let adjustmentFactor = 1.0;

      if (dish.isPopular) {
        adjustmentFactor *= 1.3;
      }

      if (dish.averageRating >= 4.5) {
        adjustmentFactor *= 1.2;
      } else if (dish.averageRating < 3.5) {
        adjustmentFactor *= 0.85;
      }

      if (weekAvg > 0) {
        const todayRatio = todaySold / weekAvg;
        if (todayRatio > 1.5) {
          adjustmentFactor *= 1.25;
        } else if (todayRatio < 0.5 && todaySold > 0) {
          adjustmentFactor *= 0.9;
        }
      }

      if (dish.category === 'staple') {
        adjustmentFactor *= 1.3;
      } else if (dish.category === 'vegetable') {
        adjustmentFactor *= 1.15;
      } else if (dish.category === 'meat') {
        adjustmentFactor *= 1.1;
      }

      if (currentStock > baseProduction * 0.8) {
        adjustmentFactor *= 0.85;
      } else if (currentStock < baseProduction * 0.3) {
        adjustmentFactor *= 1.2;
      }

      suggestedProduction = Math.max(15, Math.round(baseProduction * adjustmentFactor));

      let reason = '';
      const reasons = [];

      if (dish.isPopular) {
        reasons.push('热门菜品');
      }

      if (dish.averageRating >= 4.5) {
        reasons.push(`评分${dish.averageRating.toFixed(1)}分`);
      }

      if (weekAvg > 0) {
        reasons.push(`7日均销${weekAvg}份`);

        if (todaySold > weekAvg * 1.5) {
          reasons.push('今日销量大增');
        }
      } else {
        reasons.push('新品或销量较低');
      }

      if (currentStock < suggestedProduction * 0.3) {
        reasons.push('库存不足');
      } else if (currentStock > suggestedProduction * 0.8) {
        reasons.push('库存充足');
      }

      const categoryReasons = {
        'staple': '主食刚需，建议充足备货',
        'meat': '荤菜受欢迎，保持稳定供应',
        'vegetable': '素菜健康低成本，可适当多备',
        'soup': '汤品配餐，适量准备',
        'snack': '小吃零食，灵活调整'
      };

      if (categoryReasons[dish.category]) {
        reasons.push(categoryReasons[dish.category]);
      }

      reason = reasons.join('，');

      let confidence = 0.6;
      if (weekSold > 50) confidence += 0.2;
      if (dish.averageRating > 4.0) confidence += 0.1;
      if (dish.isPopular) confidence += 0.1;
      confidence = Math.min(0.95, confidence);

      return {
        dish: dish.name,
        dishId: dish._id,
        category: dish.category,
        currentStock,
        suggestedProduction,
        historicalAvg: weekAvg,
        todaySold,
        weekSold,
        reason,
        confidence,
        image: dish.image,
        rating: dish.averageRating || 0,
        isPopular: dish.isPopular || false
      };
    });

    success(res, suggestions);
  } catch (err) {
    console.error(err);
    error(res, '获取生产建议失败', 500);
  }
};

exports.getSeasonalRecommendations = async (req, res) => {
  try {
    const month = new Date().getMonth() + 1;
    let season = 'spring';

    if (month >= 3 && month <= 5) season = 'spring';
    else if (month >= 6 && month <= 8) season = 'summer';
    else if (month >= 9 && month <= 11) season = 'autumn';
    else season = 'winter';

    const recommendations = [
      {
        name: '栗子烧鸡',
        reason: '秋季滋补佳品，应季食材新鲜且价格实惠',
        popularity: 87,
        ingredients: ['鸡肉', '栗子', '姜', '葱'],
        cost: 12,
        suggestedPrice: 18
      },
      {
        name: '板栗烧肉',
        reason: '秋季特色菜，营养丰富',
        popularity: 82,
        ingredients: ['猪肉', '板栗', '酱油', '冰糖'],
        cost: 10,
        suggestedPrice: 16
      }
    ];

    success(res, {
      season,
      recommendations
    });
  } catch (err) {
    console.error(err);
    error(res, '获取季节推荐失败', 500);
  }
};

exports.getPurchasePlan = async (req, res) => {
  try {
    const inventory = await Inventory.find();

    const plan = inventory
      .filter(item => item.quantity <= item.warningLevel)
      .map(item => ({
        name: item.name,
        currentStock: item.quantity,
        dailyConsumption: 45,
        suggestedPurchase: Math.max(100, item.warningLevel * 2),
        unit: item.unit,
        unitPrice: item.unitPrice,
        estimatedCost: Math.round(item.unitPrice * Math.max(100, item.warningLevel * 2)),
        isLow: true
      }));

    success(res, plan);
  } catch (err) {
    console.error(err);
    error(res, '获取采购计划失败', 500);
  }
};

exports.getNutritionAnalysis = async (req, res) => {
  try {
    const today = new Date();

    const todayOrders = await Order.find({
      orderDate: {
        $gte: getStartOfDay(today),
        $lte: getEndOfDay(today)
      },
      status: { $ne: ORDER_STATUS.CANCELLED }
    });

    let totalNutrition = {
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      fiber: 0,
      vitaminA: 0,
      vitaminC: 0,
      vitaminD: 0,
      vitaminE: 0,
      calcium: 0,
      iron: 0,
      zinc: 0,
      sodium: 0,
      potassium: 0
    };

    let orderCount = todayOrders.length;

    todayOrders.forEach(order => {
      if (order.totalNutrition) {
        Object.keys(totalNutrition).forEach(key => {
          totalNutrition[key] += order.totalNutrition[key] || 0;
        });
      }
    });

    const avgNutrition = {};
    Object.keys(totalNutrition).forEach(key => {
      avgNutrition[key] = orderCount > 0 ? Math.round(totalNutrition[key] / orderCount) : 0;
    });

    const totalMacros = totalNutrition.protein * 4 + totalNutrition.fat * 9 + totalNutrition.carbs * 4;
    const macroRatios = {
      protein: totalMacros > 0 ? Math.round((totalNutrition.protein * 4 / totalMacros) * 100) / 100 : 0.25,
      carbs: totalMacros > 0 ? Math.round((totalNutrition.carbs * 4 / totalMacros) * 100) / 100 : 0.50,
      fat: totalMacros > 0 ? Math.round((totalNutrition.fat * 9 / totalMacros) * 100) / 100 : 0.25
    };

    const suggestions = [];

    if (macroRatios.protein < 0.15) {
      suggestions.push('蛋白质比例偏低，建议增加荤菜和豆制品菜品');
    } else if (macroRatios.protein > 0.35) {
      suggestions.push('蛋白质比例偏高，可适当减少荤菜比例');
    }

    if (macroRatios.carbs < 0.45) {
      suggestions.push('碳水化合物比例偏低，建议增加主食类菜品');
    } else if (macroRatios.carbs > 0.65) {
      suggestions.push('碳水化合物比例偏高，建议增加蔬菜和肉类比例');
    }

    if (macroRatios.fat > 0.35) {
      suggestions.push('脂肪比例偏高，建议减少油炸类菜品，增加清淡菜品');
    }

    if (avgNutrition.fiber < 10) {
      suggestions.push('膳食纤维摄入不足，建议增加蔬菜类和粗粮类菜品');
    }

    if (avgNutrition.calcium < 300) {
      suggestions.push('钙摄入偏低，建议增加豆制品、奶制品类菜品');
    }

    if (avgNutrition.iron < 8) {
      suggestions.push('铁摄入偏低，建议增加红肉、动物肝脏类菜品');
    }

    if (avgNutrition.vitaminC < 50) {
      suggestions.push('维生素C摄入不足，建议增加新鲜蔬菜和水果');
    }

    if (suggestions.length === 0) {
      suggestions.push('当前营养搭配合理，继续保持！');
    }

    const dishCategories = await Order.aggregate([
      {
        $match: {
          orderDate: {
            $gte: getStartOfDay(today),
            $lte: getEndOfDay(today)
          },
          status: { $ne: ORDER_STATUS.CANCELLED }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.dishCategory',
          totalCalories: { $sum: '$items.nutrition.calories' },
          totalProtein: { $sum: '$items.nutrition.protein' },
          count: { $sum: '$items.quantity' }
        }
      }
    ]);

    const categoryDistribution = dishCategories.map(cat => ({
      category: cat._id || '未分类',
      calories: Math.round(cat.totalCalories),
      protein: Math.round(cat.totalProtein),
      count: cat.count
    }));

    success(res, {
      totalOrders: orderCount,
      averageNutrition: avgNutrition,
      totalNutrition: {
        calories: Math.round(totalNutrition.calories),
        protein: Math.round(totalNutrition.protein),
        fat: Math.round(totalNutrition.fat),
        carbs: Math.round(totalNutrition.carbs),
        fiber: Math.round(totalNutrition.fiber),
        vitaminC: Math.round(totalNutrition.vitaminC),
        calcium: Math.round(totalNutrition.calcium),
        iron: Math.round(totalNutrition.iron)
      },
      macroRatios,
      categoryDistribution,
      suggestions
    });
  } catch (err) {
    console.error(err);
    error(res, '获取营养分析失败', 500);
  }
};

