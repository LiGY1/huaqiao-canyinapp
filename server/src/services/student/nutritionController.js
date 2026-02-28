const chalk = require("chalk");
const NutritionRecord = require("../../models/NutritionRecord");
const Order = require("../../models/Order");
const AIReport = require("../../models/AIReport");
const AIChatHistory = require("../../models/AIChatHistory");
const { success, error } = require("../../utils/responseFormatter");
const { getStartOfDay, getEndOfDay, getWeekRange, getMonthRange, formatDate } = require("../../utils/dateUtils");
const axios = require("axios");
const DIFY_CONFIG = require("../../config/dify");
const { DISH_STATUS } = require("../../config/constants");

const Dish = require("../../models/Dish");

const filter = { status: DISH_STATUS.AVAILABLE };

const adaptMealData = (meal) => {
  return {
    id: meal._id || meal.id,
    name: meal.name,
    category: meal.category,
    price: meal.price,
    image: meal.image || "https://via.placeholder.com/150",
    calories: meal.nutrition?.calories || 0,
    protein: meal.nutrition?.protein || 0,
    fat: meal.nutrition?.fat || 0,
    carbs: meal.nutrition?.carbs || 0,
    fiber: meal.nutrition?.fiber || 0,
    matchScore: meal.matchScore || 0,
    seasonal: meal.seasonal || false,
    solarTerm: meal.solarTerm || "",
    nutritionDescription: meal.nutritionDescription || "",
    ingredients: meal.ingredients || [],
    isRecommended: meal.isRecommended || false,
  };
};

const getMealList = async () => {
  return await Dish.find(filter).sort({
    seasonal: -1,
    isRecommended: -1,
    isPopular: -1,
    salesCount: -1,
  });
};

// 获取今日餐次状态（统一接口）
exports.getMealStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    const todayStart = getStartOfDay(today);
    const todayEnd = getEndOfDay(today);

    // 方法1：优先从营养记录中获取（更可靠）
    const record = await NutritionRecord.findOne({
      user: userId,
      date: {
        $gte: todayStart,
        $lte: todayEnd,
      },
    });

    const mealStatus = {
      breakfast: false,
      lunch: false,
      dinner: false,
    };

    if (record && record.meals && record.meals.length > 0) {
      // 从营养记录的meals中提取餐次
      record.meals.forEach((meal) => {
        if (meal.mealType === "breakfast") {
          mealStatus.breakfast = true;
        } else if (meal.mealType === "lunch") {
          mealStatus.lunch = true;
        } else if (meal.mealType === "dinner") {
          mealStatus.dinner = true;
        }
      });

      return success(res, {
        date: formatDate(today),
        ...mealStatus,
      });
    }

    // 方法2：如果营养记录中没有，从订单中获取
    // 使用日期字符串比较，避免时区问题
    // 获取今天的本地日期字符串（YYYY-MM-DD）
    const todayLocal = new Date();
    const todayLocalStr = `${todayLocal.getFullYear()}-${String(todayLocal.getMonth() + 1).padStart(2, "0")}-${String(todayLocal.getDate()).padStart(2, "0")}`;

    // 获取最近3天的订单（考虑时区问题，扩展查询范围）
    const threeDaysAgo = new Date(todayStart);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 2); // 向前2天，确保包含所有今天的订单

    const recentOrders = await Order.find({
      user: userId,
      $or: [{ orderDate: { $gte: threeDaysAgo } }, { scheduledDate: { $gte: threeDaysAgo } }],
      status: { $in: ["paid", "preparing", "ready", "completed"] },
    }).sort({ orderDate: -1 });

    // 过滤出今天的订单（比较日期字符串）
    // 将订单日期转换为本地日期字符串进行比较
    const orders = recentOrders.filter((order) => {
      if (!order.orderDate && !order.scheduledDate) return false;

      // 将订单日期转换为本地日期字符串
      const getLocalDateStr = (date) => {
        if (!date) return null;
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const orderDateLocalStr = getLocalDateStr(order.orderDate);
      const scheduledDateLocalStr = getLocalDateStr(order.scheduledDate);

      // 匹配今天的本地日期
      return orderDateLocalStr === todayLocalStr || scheduledDateLocalStr === todayLocalStr;
    });

    orders.forEach((order) => {
      if (order.mealType === "breakfast") {
        mealStatus.breakfast = true;
      } else if (order.mealType === "lunch") {
        mealStatus.lunch = true;
      } else if (order.mealType === "dinner") {
        mealStatus.dinner = true;
      }
    });



    success(res, {
      date: todayLocalStr,
      ...mealStatus,
    });
  } catch (err) {
    console.error("获取餐次状态失败:", err);
    error(res, "获取餐次状态失败", 500);
  }
};

const DEFAULT_TARGETS = {
  protein: 75,
  fat: 60,
  carbs: 250,
  fiber: 25,
  vitaminC: 100,
  iron: 15,
};

const DEFAULT_INTAKE = {
  calories: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
  fiber: 0,
  vitaminC: 0,
  iron: 0,
};

/**
 * 1. 计算基础营养匹配度
 */
const calculateNutritionMatch = (meal, nutritionNeeds, todayNutrition) => {
  let score = 30; // 基础分
  const reasons = [];

  // 计算当前餐次的推荐热量
  const hour = new Date().getHours();
  let mealRatio = 0.35; // 默认午餐
  if (hour >= 6 && hour < 9)
    mealRatio = 0.25; // 早餐
  else if (hour >= 11 && hour < 14)
    mealRatio = 0.35; // 午餐
  else if (hour >= 17 && hour < 20) mealRatio = 0.35; // 晚餐

  const targetCalories = nutritionNeeds?.targetCalories || 2000;
  const targetProtein = nutritionNeeds?.targetProtein || 60;
  const targetCarbs = nutritionNeeds?.targetCarbs || 300;
  const targetFiber = nutritionNeeds?.targetFiber || 25;

  const recommendedCalories = targetCalories * mealRatio;
  const currentCalories = todayNutrition.calories || 0;
  const remainingCalories = targetCalories - currentCalories;
  const remainingMealCalories = recommendedCalories - currentCalories;
  
  // 判断当前餐次是否已达标或接近达标
  const isCurrentMealSufficient = currentCalories >= recommendedCalories * 0.8; // 当前餐次已达80%
  const isDailyOverTarget = currentCalories >= targetCalories; // 全天已超标

  // 热量匹配度 - 根据摄入情况采用不同策略
  if (meal.calories > 0) {
    if (isDailyOverTarget) {
      // 全天已超标：严格限制高热量
      if (meal.calories <= 150) {
        score += 20;
        reasons.push("低热量");
      } else if (meal.calories <= 250) {
        score += 10;
        reasons.push("适度热量");
      } else if (meal.calories <= 350) {
        score += 2;
      } else {
        // 超过350千卡，大幅扣分
        score -= Math.min(25, Math.floor((meal.calories - 350) / 40));
        reasons.push("热量偏高");
      }
    } else if (isCurrentMealSufficient) {
      // 当前餐次接近达标：优先推荐低热量菜品
      if (meal.calories <= 200) {
        score += 15;
        reasons.push("低热量");
      } else if (meal.calories <= 300) {
        score += 8;
      } else if (meal.calories <= 400) {
        score += 3;
      } else {
        // 超过400千卡，扣分
        score -= Math.min(20, Math.floor((meal.calories - 400) / 50));
      }
    } else {
      // 未达标：按剩余需求匹配
      const neededCalories = Math.max(200, remainingMealCalories);
      if (meal.calories >= 100 && meal.calories <= 800) {
        score += 5;
        const caloriesDiff = Math.abs(meal.calories - neededCalories);
        if (caloriesDiff <= neededCalories * 0.3) {
          score += 10;
          reasons.push("热量匹配");
        } else if (caloriesDiff <= neededCalories * 0.5) {
          score += 5;
        } else if (meal.calories > neededCalories * 1.5) {
          // 超出需求过多，扣分
          score -= 5;
        }
      } else if (meal.calories < 100) {
        score -= 5;
      } else if (meal.calories > 1000) {
        score -= 10;
      }
    }
  } else {
    score -= 5;
  }

  // 蛋白质匹配度
  const recommendedProtein = targetProtein * mealRatio;
  const currentProtein = todayNutrition.protein || 0;
  const neededProtein = Math.max(5, recommendedProtein - currentProtein);
  if (meal.protein > 0) {
    if (meal.protein >= 5) {
      score += 5;
      if (meal.protein >= neededProtein * 0.5) {
        score += 5;
        reasons.push("蛋白质充足");
      }
    }
  }

  // 碳水匹配度
  const recommendedCarbs = targetCarbs * mealRatio;
  const currentCarbs = todayNutrition.carbs || 0;
  const neededCarbs = Math.max(20, recommendedCarbs - currentCarbs);
  if (meal.carbs > 0 && meal.carbs >= 20) {
    score += 3;
    if (meal.carbs >= neededCarbs * 0.5) {
      score += 2;
    }
  }

  if (meal.fiber > 0) {
    if (meal.fiber >= 2) {
      score += 2;
      if (meal.fiber >= 3) {
        score += 3;
        reasons.push("富含纤维");
      }
    }
  }

  return { score, reasons };
};

/**
 * 2. 检查健康限制（过敏、疾病等）
 */
const checkHealthRestrictions = (meal, userInfo) => {
  let score = 0;
  const reasons = [];

  if (!userInfo || !userInfo.healthInfo) {
    return { score: 0, reasons: [] };
  }

  const healthInfo = userInfo.healthInfo;

  // 检查过敏原
  if (healthInfo.allergies && Array.isArray(healthInfo.allergies) && healthInfo.allergies.length > 0) {
    const mealIngredients = (meal.ingredients || []).map((ing) => ing.toLowerCase());
    const allergies = healthInfo.allergies.map((a) => a.toLowerCase());

    const hasAllergen = allergies.some((allergy) =>
      mealIngredients.some((ing) => ing.includes(allergy) || allergy.includes(ing)),
    );

    if (hasAllergen) {
      score -= 50;
      reasons.push("含过敏原");
      return { score, reasons };
    }
  }

  // 检查糖尿病
  if (healthInfo.hasDiabetes === true) {
    const carbsRatio = (meal.carbs / (meal.calories || 1)) * 100;
    if (carbsRatio > 70) {
      score -= 20;
      reasons.push("碳水过高");
    } else if (carbsRatio < 40) {
      score += 5;
      reasons.push("适合控糖");
    }
  }

  // 检查高血压
  if (healthInfo.hasHypertension === true) {
    const fatRatio = (meal.fat / (meal.calories || 1)) * 100;
    if (fatRatio > 40) {
      score -= 15;
      reasons.push("脂肪过高");
    }
  }

  // BMI 相关检查
  if (userInfo.bmi) {
    if (userInfo.bmi < 18.5) {
      // 偏瘦
      if (meal.calories > 300 && meal.protein > 15) {
        score += 5;
        reasons.push("适合增重");
      }
    } else if (userInfo.bmi > 24) {
      // 超重
      if (meal.calories < 250 && meal.fiber > 2) {
        score += 5;
        reasons.push("适合减重");
      } else if (meal.calories > 400) {
        score -= 10;
        reasons.push("热量偏高");
      }
    }
  }

  return { score, reasons };
};

/**
 * 3. 评估营养均衡性
 */
const evaluateNutritionalBalance = (meal) => {
  let score = 0;
  const reasons = [];

  if (meal.calories === 0) return { score: 0, reasons: [] };

  const proteinRatio = ((meal.protein * 4) / meal.calories) * 100;
  const fatRatio = ((meal.fat * 9) / meal.calories) * 100;
  const carbsRatio = ((meal.carbs * 4) / meal.calories) * 100;

  let balanceScore = 10;

  if (proteinRatio < 10) balanceScore -= 3;
  else if (proteinRatio > 25) balanceScore -= 2;
  else if (proteinRatio >= 15 && proteinRatio <= 20) {
    balanceScore += 2;
    reasons.push("蛋白质比例均衡");
  }

  if (fatRatio < 15 || fatRatio > 35) balanceScore -= 2;
  else if (fatRatio >= 20 && fatRatio <= 30) {
    balanceScore += 1;
  }

  if (carbsRatio < 45 || carbsRatio > 65) balanceScore -= 2;
  else if (carbsRatio >= 50 && carbsRatio <= 55) {
    balanceScore += 1;
  }

  score += Math.max(0, balanceScore);

  if (meal.fiber > 0) {
    const fiberScore = Math.min(10, (meal.fiber / 5) * 10);
    score += fiberScore * 0.5;
    if (meal.fiber >= 3) {
      reasons.push("高纤维");
    }
  }

  return { score, reasons };
};

/**
 * 4. 评估多样性
 */
const evaluateDiversity = (meal) => {
  let score = 5;
  const reasons = [];

  if (meal.category === "mixed") {
    score += 5;
    reasons.push("荤素搭配");
  } else if (meal.category === "meat") {
    score += 3;
    reasons.push("肉类");
  }

  if (meal.seasonal === true) {
    score += 2;
    reasons.push("应季菜品");
  }

  return { score, reasons };
};

/**
 * 5. 计算总评分
 */
const calculateNutritionalScore = (meal, nutritionNeeds, userInfo, todayNutrition) => {
  let score = 30; // 基础分
  const reasons = [];

  const nutritionScore = calculateNutritionMatch(meal, nutritionNeeds, todayNutrition);
  score += nutritionScore.score;
  reasons.push(...nutritionScore.reasons);

  const healthScore = checkHealthRestrictions(meal, userInfo);
  score += healthScore.score;
  if (healthScore.reasons.length > 0) {
    reasons.push(...healthScore.reasons);
  }

  const balanceScore = evaluateNutritionalBalance(meal);
  score += balanceScore.score;
  reasons.push(...balanceScore.reasons);

  const diversityScore = evaluateDiversity(meal);
  score += diversityScore.score;
  reasons.push(...diversityScore.reasons);

  // 根据热量摄入情况，调整蔬菜类菜品的评分
  const targetCalories = nutritionNeeds?.targetCalories || 2000;
  const currentCalories = todayNutrition.calories || 0;
  const isDailyOverTarget = currentCalories >= targetCalories;
  
  if (meal.category === "vegetable") {
    if (isDailyOverTarget) {
      // 超标时，大幅提升蔬菜评分
      score += 15;
      reasons.push("低热量蔬菜");
    } else {
      // 正常时，适度提升蔬菜评分
      score += 5;
      reasons.push("蔬菜类");
    }
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score: Math.round(score),
    reasons: reasons.slice(0, 3),
  };
};

/**
 * 6. 选择套餐组合
 */
const selectBalancedMealCombo = (scoredMeals, nutritionNeeds, todayNutrition) => {
  if (!scoredMeals || scoredMeals.length === 0) return [];

  const hour = new Date().getHours();
  let mealRatio = 0.35;
  if (hour >= 6 && hour < 9) mealRatio = 0.25;
  else if (hour >= 17 && hour < 20) mealRatio = 0.35;

  const targetCaloriesTotal = nutritionNeeds?.targetCalories || 2000;
  const targetProteinTotal = nutritionNeeds?.targetProtein || 60;
  const currentCalories = todayNutrition.calories || 0;
  const currentProtein = todayNutrition.protein || 0;

  // 计算剩余需要的热量和蛋白质
  const remainingCalories = targetCaloriesTotal * mealRatio - currentCalories;
  const remainingProtein = targetProteinTotal * mealRatio - currentProtein;
  
  // 判断是否超标
  const isDailyOverTarget = currentCalories >= targetCaloriesTotal;
  const isMealSufficient = currentCalories >= targetCaloriesTotal * mealRatio * 0.8;
  
  // 根据超标情况设置不同的限制
  let maxMealCalories, maxSingleCalories, targetMealCount;
  
  if (isDailyOverTarget) {
    // 全天超标：严格限制
    maxMealCalories = 200; // 整餐不超过200千卡
    maxSingleCalories = 150; // 单个菜品不超过150千卡
    targetMealCount = 2; // 只推荐2个菜品
  } else if (isMealSufficient) {
    // 当前餐次接近达标：适度限制
    maxMealCalories = 350; // 整餐不超过350千卡
    maxSingleCalories = 200; // 单个菜品不超过200千卡
    targetMealCount = 2; // 推荐2-3个菜品
  } else {
    // 未达标：正常推荐
    maxMealCalories = Math.max(300, remainingCalories * 1.2); // 允许略超剩余需求
    maxSingleCalories = Math.max(400, remainingCalories * 0.8);
    targetMealCount = 3; // 推荐3-5个菜品
  }

  const selected = [];
  let comboCalories = 0;
  let comboProtein = 0;

  // 策略1：从候选中选择，增加随机性
  // 将候选分为不同类别，确保多样性
  const mealsByCategory = {
    staple: scoredMeals.filter(m => m.category === "staple" && m.calories <= maxSingleCalories),
    meat: scoredMeals.filter(m => m.category === "meat" && m.calories <= maxSingleCalories),
    vegetable: scoredMeals.filter(m => m.category === "vegetable" && m.calories <= maxSingleCalories),
    mixed: scoredMeals.filter(m => m.category === "mixed" && m.calories <= maxSingleCalories),
    other: scoredMeals.filter(m => !["staple", "meat", "vegetable", "mixed"].includes(m.category) && m.calories <= maxSingleCalories)
  };

  // 优先确保有主食
  if (mealsByCategory.staple.length > 0) {
    const stapleOptions = mealsByCategory.staple.slice(0, Math.min(3, mealsByCategory.staple.length));
    const randomStaple = stapleOptions[Math.floor(Math.random() * stapleOptions.length)];
    if (randomStaple && comboCalories + randomStaple.calories <= maxMealCalories) {
      selected.push(randomStaple);
      comboCalories += randomStaple.calories || 0;
      comboProtein += randomStaple.protein || 0;
    }
  }

  // 优先确保有蔬菜（特别是在超标或接近达标时）
  if (mealsByCategory.vegetable.length > 0 && selected.length < targetMealCount) {
    const vegetableOptions = mealsByCategory.vegetable.slice(0, Math.min(3, mealsByCategory.vegetable.length));
    const randomVegetable = vegetableOptions[Math.floor(Math.random() * vegetableOptions.length)];
    if (randomVegetable && comboCalories + randomVegetable.calories <= maxMealCalories) {
      selected.push(randomVegetable);
      comboCalories += randomVegetable.calories || 0;
      comboProtein += randomVegetable.protein || 0;
    }
  }

  // 优先确保有主菜（肉类或混合）- 但在超标时可以跳过
  if (!isDailyOverTarget && mealsByCategory.meat.length + mealsByCategory.mixed.length > 0 && selected.length < targetMealCount) {
    const mainDishOptions = [...mealsByCategory.meat, ...mealsByCategory.mixed]
      .filter(m => !selected.some(s => s.id === m.id))
      .slice(0, Math.min(5, mealsByCategory.meat.length + mealsByCategory.mixed.length));
    
    if (mainDishOptions.length > 0) {
      const randomMainDish = mainDishOptions[Math.floor(Math.random() * mainDishOptions.length)];
      if (randomMainDish && comboCalories + randomMainDish.calories <= maxMealCalories) {
        selected.push(randomMainDish);
        comboCalories += randomMainDish.calories || 0;
        comboProtein += randomMainDish.protein || 0;
      }
    }
  }

  // 从剩余候选中随机选择，直到达到目标数量或热量上限
  const remaining = scoredMeals.filter(m => 
    !selected.some(s => s.id === m.id) && 
    m.calories <= maxSingleCalories
  );
  
  for (const meal of remaining) {
    if (selected.length >= Math.min(5, targetMealCount + 2)) break;
    if (comboCalories + meal.calories > maxMealCalories) continue;
    
    // 增加随机性：不是每个符合条件的都选，而是有一定概率跳过
    // 前3个必选，后面的有70%概率选择
    if (selected.length >= targetMealCount && Math.random() > 0.7) continue;
    
    selected.push(meal);
    comboCalories += meal.calories || 0;
    comboProtein += meal.protein || 0;

    // 达到目标数量且营养充足时停止
    if (selected.length >= targetMealCount && 
        comboCalories >= maxMealCalories * 0.6) break;
  }

  // 补足至少2个（超标时）或3个（正常时）
  const minCount = isDailyOverTarget || isMealSufficient ? 2 : 3;
  if (selected.length < minCount) {
    for (const meal of scoredMeals) {
      if (selected.length >= minCount) break;
      if (!selected.some((m) => m.id === meal.id) && 
          meal.calories <= maxSingleCalories &&
          comboCalories + meal.calories <= maxMealCalories) {
        selected.push(meal);
        comboCalories += meal.calories || 0;
        comboProtein += meal.protein || 0;
      }
    }
  }

  // 最后轻度打乱顺序（保持第一个主食的位置）
  if (selected.length > 2) {
    const first = selected[0];
    const rest = selected.slice(1);
    // 只打乱后面的，保持第一个
    for (let i = rest.length - 1; i > 0; i--) {
      if (Math.random() > 0.5) { // 50%概率交换
        const j = Math.floor(Math.random() * (i + 1));
        [rest[i], rest[j]] = [rest[j], rest[i]];
      }
    }
    return [first, ...rest].slice(0, 5);
  }

  return selected.slice(0, 5);
};

/**
 * 7. 生成推荐理由文本
 */
const generateRecommendationReason = (meals, nutritionNeeds, todayNutrition, userInfo) => {
  const reasons = [];
  const hour = new Date().getHours();

  // 计算当前餐次的推荐热量
  let mealRatio = 0.35; // 默认午餐
  if (hour >= 6 && hour < 9)
    mealRatio = 0.25; // 早餐
  else if (hour >= 11 && hour < 14)
    mealRatio = 0.35; // 午餐
  else if (hour >= 17 && hour < 20) mealRatio = 0.35; // 晚餐

  // 餐次提示
  if (hour >= 6 && hour < 9) reasons.push("早餐推荐");
  else if (hour >= 11 && hour < 14) reasons.push("午餐推荐");
  else if (hour >= 17 && hour < 20) reasons.push("晚餐推荐");

  const targetCal = nutritionNeeds?.targetCalories || 2000;
  const currentCal = todayNutrition.calories || 0;
  const caloriesPercent = (currentCal / targetCal) * 100;
  const recommendedMealCalories = targetCal * mealRatio;
  const mealCaloriesPercent = (currentCal / recommendedMealCalories) * 100;

  // 根据热量摄入情况给出不同的建议
  if (caloriesPercent >= 100) {
    // 全天已达标或超标
    if (caloriesPercent > 120) {
      reasons.push("您今日热量已超标，推荐清淡低热量的菜品");
    } else {
      reasons.push("您今日热量已达标，推荐适量清淡的菜品");
    }
  } else if (mealCaloriesPercent >= 80) {
    // 当前餐次接近达标
    reasons.push("根据您的营养需求，推荐以下均衡搭配，本餐提供热量约" + Math.round(meals.reduce((sum, m) => sum + (m.calories || 0), 0)) + "千卡");
  } else if (caloriesPercent < 50) {
    reasons.push("您今日热量摄入不足，推荐营养均衡的菜品组合");
  } else {
    reasons.push("根据您的营养需求，推荐以下均衡搭配");
  }

  // 健康状况提示
  if (userInfo?.healthInfo) {
    if (userInfo.healthInfo.hasDiabetes) reasons.push("已考虑控糖需求");
    if (userInfo.healthInfo.hasHypertension) reasons.push("已考虑低脂低钠");
  }

  // 计算推荐菜品的营养总量
  const totalCalories = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
  const totalProtein = meals.reduce((sum, m) => sum + (m.protein || 0), 0);
  
  // 根据是否超标，使用不同的描述
  if (caloriesPercent >= 100 || mealCaloriesPercent >= 80) {
    // 已达标或接近达标，不说"补充"，改为"提供"
    reasons.push(`本餐提供热量约${Math.round(totalCalories)}千卡，蛋白质${Math.round(totalProtein)}g`);
  } else {
    // 未达标，可以说"补充"
    const remaining = targetCal - currentCal;
    if (totalCalories <= remaining) {
      reasons.push(`预计补充热量${Math.round(totalCalories)}千卡，蛋白质${Math.round(totalProtein)}g`);
    } else {
      reasons.push(`本餐提供热量约${Math.round(totalCalories)}千卡，蛋白质${Math.round(totalProtein)}g`);
    }
  }

  return reasons.join("，");
};

const generateSmartRecommendation = (allMeals, nutritionNeeds, userInfo, todayNutrition) => {
  if (!allMeals || allMeals.length === 0) {
    return { recommendedMeals: [], reason: "暂无可用菜品" };
  }

  // 评分
  const scoredMeals = allMeals.map((meal) => {
    const result = calculateNutritionalScore(meal, nutritionNeeds, userInfo, todayNutrition);
    return {
      ...meal,
      matchScore: result.score,
      matchReasons: result.reasons,
    };
  });

  // 排序
  scoredMeals.sort((a, b) => b.matchScore - a.matchScore);

  // 阈值筛选 - 优化：使用更灵活的阈值策略
  // 1. 取前30%位置的分数，但不低于15分
  // 2. 如果最高分很低（<30），则降低阈值到10分
  const topScore = scoredMeals[0]?.matchScore || 0;
  const percentile30Score = scoredMeals[Math.floor(scoredMeals.length * 0.3)]?.matchScore || 0;
  
  let threshold;
  if (topScore < 30) {
    // 所有菜品分数都很低，使用最低阈值
    threshold = 10;
  } else {
    // 正常情况，使用30%分位数，但不低于15分
    threshold = Math.max(15, percentile30Score);
  }
  
  const qualifiedMeals = scoredMeals.filter((meal) => meal.matchScore >= threshold);
  let candidates =
    qualifiedMeals.length >= 3 ? qualifiedMeals : scoredMeals.slice(0, Math.max(3, Math.min(5, scoredMeals.length)));

  // 增加多样性：在候选菜品中引入随机性
  // 将候选菜品分为高分组和中分组，从两组中随机选择
  if (candidates.length > 10) {
    const topTier = candidates.slice(0, Math.ceil(candidates.length * 0.4)); // 前40%
    const midTier = candidates.slice(Math.ceil(candidates.length * 0.4)); // 后60%
    
    // 随机打乱两组
    shuffleArray(topTier);
    shuffleArray(midTier);
    
    // 重新组合：优先从高分组选，但也混入中分组
    candidates = [...topTier.slice(0, Math.ceil(topTier.length * 0.7)), ...midTier.slice(0, Math.ceil(midTier.length * 0.3))];
    shuffleArray(candidates); // 最后再打乱一次
  } else if (candidates.length > 5) {
    // 候选较少时，轻度打乱（保持前几名，打乱后面的）
    const top3 = candidates.slice(0, 3);
    const rest = candidates.slice(3);
    shuffleArray(rest);
    candidates = [...top3, ...rest];
  }

  // 组合
  const recommendedMeals = selectBalancedMealCombo(candidates, nutritionNeeds, todayNutrition);

  // 兜底
  if (!recommendedMeals || recommendedMeals.length === 0) {
    const fallbackMeals = scoredMeals.slice(0, Math.min(5, scoredMeals.length));
    if (fallbackMeals.length > 0) {
      return {
        recommendedMeals: fallbackMeals,
        reason: generateRecommendationReason(fallbackMeals, nutritionNeeds, todayNutrition, userInfo),
        totalScore: fallbackMeals.reduce((sum, m) => sum + (m.matchScore || 0), 0) / fallbackMeals.length,
      };
    }
    return { recommendedMeals: [], reason: "无法生成推荐" };
  }

  // 理由
  const reason = generateRecommendationReason(recommendedMeals, nutritionNeeds, todayNutrition, userInfo);

  return {
    recommendedMeals,
    reason,
    totalScore: recommendedMeals.reduce((sum, m) => sum + (m.matchScore || 0), 0) / recommendedMeals.length,
  };
};

/**
 * Fisher-Yates 洗牌算法 - 用于增加推荐多样性
 */
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

/**
 * 调用 AI 营养大模型生成结构化建议
 * @param {Object} intake 用户当前摄入
 * @param {Object} mealList 菜品列表
 * @param {Object} userInfo 用户信息
 * @returns {Promise<Object>} 包含分析结论和推荐菜品列表的结构化数据
 */
const recommendDiet = async (intake, mealList, userInfo) => {
  const allMeals = (mealList || []).map(adaptMealData);

  // 构建营养需求目标
  const nutritionNeeds = {
    targetCalories: userInfo.targetCalories || 2000,
    targetProtein: userInfo.targetProtein || 60,
    targetCarbs: userInfo.targetCarbs || 300,
    targetFiber: userInfo.targetFiber || 25,
  };

  // 当前摄入量
  const todayNutrition = {
    calories: intake.calories || 0,
    protein: intake.protein || 0,
    carbs: intake.carbs || 0,
    fiber: intake.fiber || 0,
  };

  return generateSmartRecommendation(allMeals, nutritionNeeds, userInfo, todayNutrition);
};

const fetchNutritionIntake = async (userId, startOfDay, endOfDay) => {
  const record = await NutritionRecord.findOne({
    user: userId,
    date: { $gte: startOfDay, $lte: endOfDay },
  }).lean();
  return record ? record.intake : DEFAULT_INTAKE;
};

const fetchTodayMeals = async (userId, startOfDay, endOfDay) => {
  const query = {
    user: userId,
    status: { $in: ["paid", "preparing", "ready", "completed"] },
    $or: [{ orderDate: { $gte: startOfDay, $lte: endOfDay } }, { scheduledDate: { $gte: startOfDay, $lte: endOfDay } }],
  };

  const orders = await Order.find(query)
    .sort({ orderDate: -1 })
    .select("orderDate scheduledDate mealType items")
    .lean();

  return orders.map((order) => ({
    order: order._id,
    mealType: order.mealType,
    time: order.scheduledDate || order.orderDate,
    items: order.items.map((item) => item.dishName),
  }));
};

exports.getRecommend = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    const todayStart = getStartOfDay(today);
    const todayEnd = getEndOfDay(today);

    const mealList = await getMealList();

    // 1. 获取今日已摄入的营养素
    const intake = await fetchNutritionIntake(userId, todayStart, todayEnd);

    // 2. 调用智能算法生成推荐
    const suggestion = await recommendDiet(intake, mealList, req.user);

    const meals = await fetchTodayMeals(userId, todayStart, todayEnd);

    // 3. 将建议添加到响应中
    success(res, {
      suggestion,
      date: formatDate(today),
      ...intake,
      vitaminC: intake.vitaminC || 0,
      iron: intake.iron || 0,
      meals: meals,
    });
  } catch (err) {
    console.error(err);
    error(res, "获取今日营养及推荐失败", 500);
  }
};

exports.getTodayNutrition = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    const todayStart = getStartOfDay(today);
    const todayEnd = getEndOfDay(today);

    const record = await NutritionRecord.findOne({
      user: userId,
      date: {
        $gte: todayStart,
        $lte: todayEnd,
      },
    });

    const targetCalories = req.user.targetCalories || 2000;
    const targetProtein = 75;
    const targetFat = 60;
    const targetCarbs = 250;
    const targetFiber = 25;

    const intake = record
      ? record.intake
      : {
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
        fiber: 0,
        vitaminC: 0,
        iron: 0,
      };

    // 从订单中获取餐次信息（始终从订单获取，确保数据最新）
    const todayLocal = new Date();
    const todayLocalStr = `${todayLocal.getFullYear()}-${String(todayLocal.getMonth() + 1).padStart(2, "0")}-${String(todayLocal.getDate()).padStart(2, "0")}`;

    const threeDaysAgo = new Date(todayStart);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 2);

    const recentOrders = await Order.find({
      user: userId,
      $or: [{ orderDate: { $gte: threeDaysAgo } }, { scheduledDate: { $gte: threeDaysAgo } }],
      status: { $in: ["paid", "preparing", "ready", "completed"] },
    }).sort({ orderDate: -1 });

    const getLocalDateStr = (date) => {
      if (!date) return null;
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const todayOrders = recentOrders.filter((order) => {
      if (!order.orderDate && !order.scheduledDate) return false;
      const orderDateLocalStr = getLocalDateStr(order.orderDate);
      const scheduledDateLocalStr = getLocalDateStr(order.scheduledDate);
      return orderDateLocalStr === todayLocalStr || scheduledDateLocalStr === todayLocalStr;
    });

    // 构建 meals 数组（始终从订单构建，确保完整性）
    const meals = todayOrders.map((order) => ({
      order: order._id,
      mealType: order.mealType,
      time: order.orderDate || order.scheduledDate,
      items: order.items.map((item) => item.dishName),
    }));

    success(res, {
      date: formatDate(today),
      calories: intake.calories,
      protein: intake.protein,
      fat: intake.fat,
      carbs: intake.carbs,
      fiber: intake.fiber,
      vitaminC: intake.vitaminC || 0,
      iron: intake.iron || 0,
      targetCalories,
      targetProtein,
      targetFat,
      targetCarbs,
      targetFiber,
      targetVitaminC: 100,
      targetIron: 15,
      meals: meals, // 返回餐次信息
    });
  } catch (err) {
    console.error(err);
    error(res, "获取今日营养失败", 500);
  }
};

const getUserTargets = (user) => ({
  calories: user.targetCalories || 2000,
  protein: user.targetProtein || 75,
  fat: user.targetFat || 60,
  carbs: user.targetCarbs || 300, // 补充碳水默认值
  fiber: user.targetFiber || 25,
});

const aggregateDailyRecords = (records) => {
  const data = {
    calories: new Array(7).fill(0),
    protein: new Array(7).fill(0),
    fat: new Array(7).fill(0),
    carbs: new Array(7).fill(0),
    fiber: new Array(7).fill(0),
  };

  records.forEach(({ intake, date }) => {
    const dayIndex = new Date(date).getDay();
    const idx = dayIndex === 0 ? 7 : dayIndex - 1;

    data.calories[idx] += intake.calories || 0;
    data.protein[idx] += intake.protein || 0;
    data.fat[idx] += intake.fat || 0;
    data.carbs[idx] += intake.carbs || 0;
    data.fiber[idx] += intake.fiber || 0;
  });
  return data;
};

/**
 * 3. 计算周平均值和营养得分
 */
const calculateMetrics = (dailyData, targets) => {
  // 过滤掉无效数据
  Object.keys(dailyData).forEach((key) => {
    dailyData[key] = dailyData[key].filter(item => item !== null && !isNaN(item));
  });

  // 辅助：数组求和
  const sum = (arr) => arr.reduce((a, b) => a + b, 0);

  // 辅助：计算单项分数 (上限100)
  // 逻辑：(实际平均摄入 / 目标值) * 100
  const calcScore = (arr, targetVal) => {
    if (!targetVal || arr.length === 0) return 0;
    const actualAvg = sum(arr) / arr.length; // 使用实际长度计算平均值
    return Math.min(100, Math.round((actualAvg / targetVal) * 100));
  };

  // 使用实际天数计算平均值
  const validDays = dailyData.calories.length || 7; // 如果没有有效数据，默认7天
  const avgCalories = validDays > 0 ? Math.round(sum(dailyData.calories) / validDays) : 0;

  return {
    avgCalories,
    calorieDeficit: avgCalories * validDays - targets.calories * validDays,
    scores: {
      carbs: calcScore(dailyData.carbs, targets.carbs),
      protein: calcScore(dailyData.protein, targets.protein),
      fat: calcScore(dailyData.fat, targets.fat),
      fiber: calcScore(dailyData.fiber, targets.fiber),
      vitamin: 80, // 暂时硬编码
    },
  };
};

const formatWeeklyData = (dailyData) => {
  return {
    dailyCalories: dailyData.calories,
    dailyProtein: dailyData.protein,
    dailyFat: dailyData.fat,
    dailyCarbs: dailyData.carbs,
    dailyFiber: dailyData.fiber,
  };
};

const formatMetrics = (metrics) => {
  return {
    avgCalories: metrics.avgCalories,
    calorieDeficit: metrics.calorieDeficit,
    nutritionScore: metrics.scores,
  };
};

exports.getWeeklyReport = async (req, res) => {
  try {
    // ---------- 1. 取出用户id --------------
    const userId = req.user._id;

    // ---------- 2. 得到本周的时间范围 --------------
    const targetDate = req.query.date ? new Date(req.query.date) : new Date();
    const { start, end } = getWeekRange(targetDate);

    // ---------- 3. 数据库查询 --------------
    const records = await NutritionRecord.find({
      user: userId,
      date: { $gte: start, $lte: end },
    }).lean();

    const dailyData = aggregateDailyRecords(records);
    const targets = getUserTargets(req.user);
    const metrics = calculateMetrics(dailyData, targets);

    success(res, {
      ...formatWeeklyData(dailyData),
      days: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
      weekRange: `${formatDate(start)} 至 ${formatDate(end)}`,
      targetCalories: targets.calories,
      avgSugar: 45,
      ...formatMetrics(metrics),
    });
  } catch (err) {
    console.error("Weekly report error:", err);
    error(res, "获取周报失败", 500);
  }
};

exports.getMonthlyReport = async (req, res) => {
  try {
    const userId = req.user._id;
    // 支持传入日期参数，如果没有传入则使用当前日期
    const targetDate = req.query.date ? new Date(req.query.date) : new Date();
    const { start, end } = getMonthRange(targetDate);

    const records = await NutritionRecord.find({
      user: userId,
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 });

    const daysInMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
    const dailyCalories = new Array(daysInMonth).fill(0);

    records.forEach((record) => {
      const day = new Date(record.date).getDate();
      dailyCalories[day - 1] = record.intake.calories || 0;
    });

    const totalCalories = dailyCalories.reduce((a, b) => a + b, 0);
    const avgCalories = Math.round(totalCalories / daysInMonth);
    const targetCalories = req.user.targetCalories || 2000;

    success(res, {
      month: `${end.getFullYear()}年${end.getMonth() + 1}月`,
      dailyCalories,
      avgCalories,
      targetCalories,
    });
  } catch (err) {
    console.error(err);
    error(res, "获取月报失败", 500);
  }
};

function parseAIResponse(aiText) {
  const lines = aiText.split("\n").filter((line) => line.trim());

  const result = {
    summary: "",
    highlights: [],
    suggestions: [],
    nextPlan: "",
    fullText: aiText,
  };

  let currentSection = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.includes("总体评价") || trimmed.includes("总结")) {
      currentSection = "summary";
      continue;
    } else if (trimmed.includes("亮点") || trimmed.includes("成就") || trimmed.includes("进步")) {
      currentSection = "highlights";
      continue;
    } else if (trimmed.includes("建议") || trimmed.includes("改进")) {
      currentSection = "suggestions";
      continue;
    } else if (
      trimmed.includes("下周") ||
      trimmed.includes("下月") ||
      trimmed.includes("计划") ||
      trimmed.includes("目标")
    ) {
      currentSection = "nextPlan";
      continue;
    }

    if (currentSection === "summary" && trimmed) {
      result.summary += (result.summary ? " " : "") + trimmed;
    } else if (
      currentSection === "highlights" &&
      (trimmed.startsWith("") || trimmed.startsWith("") || trimmed.match(/^\d+\./))
    ) {
      result.highlights.push(trimmed);
    } else if (currentSection === "suggestions" && (trimmed.match(/^\d+\./) || trimmed.startsWith("-"))) {
      result.suggestions.push(trimmed.replace(/^\d+\.\s*/, "").replace(/^-\s*/, ""));
    } else if (currentSection === "nextPlan" && trimmed) {
      result.nextPlan += (result.nextPlan ? " " : "") + trimmed;
    }
  }

  if (!result.summary && !result.highlights.length) {
    result.summary = aiText.substring(0, 200);
    result.fullText = aiText;
  }

  return result;
}

async function callDifyAPI(prompt) {
  try {
    const response = await axios.post(
      DIFY_CONFIG.apiUrl,
      {
        inputs: {},
        query: prompt,
        response_mode: "blocking",
        conversation_id: "",
        user: "student-nutrition-report",
      },
      {
        headers: {
          Authorization: `Bearer ${DIFY_CONFIG.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: DIFY_CONFIG.timeout,
      },
    );

    const result = response.data;
    let aiText = "";

    if (result.answer) {
      aiText = result.answer;
    } else if (result.data && result.data.outputs) {
      aiText = result.data.outputs.text || result.data.outputs.result;
    } else {
      aiText = JSON.stringify(result);
    }

    return {
      success: true,
      text: aiText,
      conversationId: result.conversation_id || "",
    };
  } catch (err) {
    console.error(chalk.red("Dify API 调用失败:"), err.message);

    // 详细错误日志
    if (err.code === "ECONNREFUSED") {
      console.error(chalk.red("  原因: 连接被拒绝 - Dify 服务可能未运行"));
    } else if (err.code === "ETIMEDOUT" || err.message.includes("timeout")) {
      console.error(chalk.red("  原因: 连接超时 - Dify 服务不可达"));
    } else if (err.code === "ENOTFOUND") {
      console.error(chalk.red("  原因: 域名/IP 无法解析"));
    } else if (err.response) {
      console.error(chalk.red("  HTTP状态:"), err.response.status);
      console.error(chalk.red("  错误详情:"), err.response.data);
    }

    return {
      success: false,
      error: err.message,
      errorCode: err.code,
    };
  }
}

/**
 * 1. 获取日期范围
 */
const getDateRange = (type) => {
  if (type === "weekly") {
    // 假设 getWeekRange 返回标准 Date 对象
    return getWeekRange();
  } else {
    // 假设 getMonthRange 返回标准 Date 对象
    return getMonthRange();
  }
};

/**
 * 2. 核心：聚合数据库记录到每日数组
 * 解决了原代码中用 '=' 导致数据被覆盖的 Bug，改为 '+='
 */
const aggregateRecords = (records, type, endDate) => {
  // 确定数组长度：周报7天，月报则是当月总天数
  const totalDays = type === "weekly" ? 7 : new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate();

  const data = {
    calories: new Array(totalDays).fill(0),
    protein: new Array(totalDays).fill(0),
    fat: new Array(totalDays).fill(0),
    carbs: new Array(totalDays).fill(0),
    fiber: new Array(totalDays).fill(0),
    totalDays, // 保存总天数供后续计算使用
  };

  records.forEach((record) => {
    if (!record.intake) return;

    let idx;
    const date = new Date(record.date);

    if (type === "weekly") {
      // 周报索引：周一(0) - 周日(6)
      const dayIndex = date.getDay();
      idx = dayIndex === 0 ? 6 : dayIndex - 1;
    } else {
      // 月报索引：1号(0) - 31号(30)
      idx = date.getDate() - 1;
    }

    // 安全累加
    data.calories[idx] += record.intake.calories || 0;
    data.protein[idx] += record.intake.protein || 0;
    data.fat[idx] += record.intake.fat || 0;
    data.carbs[idx] += record.intake.carbs || 0;
    data.fiber[idx] += record.intake.fiber || 0;
  });

  return data;
};

/**
 * 3. 计算统计数据和评分
 */
const calculateStats = (dailyData, userTargets) => {
  const { totalDays } = dailyData;
  const sum = (arr) => arr.reduce((a, b) => a + b, 0);

  const avgCalories = Math.round(sum(dailyData.calories) / totalDays);
  const avgProtein = Math.round(sum(dailyData.protein) / totalDays);
  const avgFat = Math.round(sum(dailyData.fat) / totalDays);
  const avgCarbs = Math.round(sum(dailyData.carbs) / totalDays);
  const avgFiber = Math.round(sum(dailyData.fiber) / totalDays);

  return {
    avgCalories,
    avgProtein,
    avgFat,
    avgCarbs,
    avgFiber,
    totalDays,
    targetCalories: userTargets.calories,
    nutritionScore: {
      carbs: Math.min(100, Math.round((avgCalories / userTargets.calories) * 100)), // 原逻辑似乎是用热量占比代表碳水得分？
      protein: Math.min(100, Math.round((avgProtein / (userTargets.protein || 75)) * 100)),
      fat: Math.min(100, Math.round((avgFat / (userTargets.fat || 60)) * 100)),
      fiber: Math.min(100, Math.round((avgFiber / (userTargets.fiber || 25)) * 100)),
      vitamin: 80,
    },
  };
};

/**
 * 4. 构建 Prompt 字符串
 * 处理周报详情或月报趋势
 */
const buildPromptContext = (type, dailyData, stats, dateRange) => {
  let detailString = "";
  let baseTemplate = "";

  if (type === "weekly") {
    const days = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
    detailString = days
      .map(
        (day, i) =>
          `${day}: 热量${dailyData.calories[i]}千卡, 蛋白质${dailyData.protein[i]}g, 脂肪${dailyData.fat[i]}g, 碳水${dailyData.carbs[i]}g`,
      )
      .join("\n");
    baseTemplate = DIFY_CONFIG.weeklyPrompt;
  } else {
    // 月报计算周趋势
    const weeks = Math.ceil(stats.totalDays / 7);
    const weeklyTrend = [];
    for (let w = 0; w < weeks; w++) {
      const start = w * 7;
      const end = Math.min((w + 1) * 7, stats.totalDays);
      const slice = dailyData.calories.slice(start, end);
      const weekAvg = Math.round(slice.reduce((a, b) => a + b, 0) / slice.length) || 0;
      weeklyTrend.push(`第${w + 1}周平均: ${weekAvg}千卡`);
    }
    detailString = weeklyTrend.join("\n");
    baseTemplate = DIFY_CONFIG.monthlyPrompt;
  }

  // 替换通用占位符
  let prompt = baseTemplate
    .replace("{avgCalories}", stats.avgCalories)
    .replace("{targetCalories}", stats.targetCalories)
    .replace("{avgProtein}", stats.avgProtein)
    .replace("{avgFat}", stats.avgFat)
    .replace("{avgCarbs}", stats.avgCarbs)
    .replace("{avgFiber}", stats.avgFiber)
    .replace("{totalDays}", stats.totalDays)
    .replace("{dateRange}", `${formatDate(dateRange.start)} 至 ${formatDate(dateRange.end)}`)
    .replace("{scoreCarbs}", stats.nutritionScore.carbs)
    .replace("{scoreProtein}", stats.nutritionScore.protein)
    .replace("{scoreFat}", stats.nutritionScore.fat)
    .replace("{scoreFiber}", stats.nutritionScore.fiber)
    .replace("{scoreVitamin}", stats.nutritionScore.vitamin);

  // 替换特定占位符
  if (type === "weekly") {
    prompt = prompt.replace("{dailyData}", detailString);
  } else {
    prompt = prompt.replace("{weeklyTrend}", detailString);
  }

  return `STU1_FE_BG,${prompt}`;
};

exports.generateAIReport = async (req, res) => {
  let reportRecord = null;

  try {
    const userId = req.user._id;
    const { reportType = "weekly" } = req.body;
    const { start, end } = getDateRange(reportType);
    const dateRange = { start, end };

    // 2. 查询数据库
    const records = await NutritionRecord.find({
      user: userId,
      date: { $gte: start, $lte: end },
    })
      .sort({ date: 1 })
      .lean(); // 调用lean方法

    // 3. 数据聚合与统计
    const dailyData = aggregateRecords(records, reportType, end);
    const dataSummary = calculateStats(dailyData, {
      calories: req.user.targetCalories || 2000,
      protein: req.user.targetProtein, // 可以为空，helpers里有默认值
      fat: req.user.targetFat,
      fiber: req.user.targetFiber,
    });

    // 4. 初始化报告记录
    reportRecord = new AIReport({
      student: userId,
      reportType,
      dateRange,
      dataSummary,
      status: "generating",
    });
    await reportRecord.save();

    // 5. 构建 Prompt
    const prompt = buildPromptContext(reportType, dailyData, dataSummary, dateRange);

    // 6. 调用 AI 服务
    const difyResult = await callDifyAPI(prompt);

    // 7. 处理结果
    if (difyResult.success) {
      const parsedContent = parseAIResponse(difyResult.text);

      reportRecord.content = parsedContent;
      reportRecord.conversationId = difyResult.conversationId;
      reportRecord.status = "completed";
      await reportRecord.save();

      success(res, {
        reportId: reportRecord._id,
        reportType,
        dateRange,
        content: parsedContent,
        dataSummary,
        createdAt: reportRecord.createdAt,
      });
    } else {
      // AI 调用失败逻辑
      await handleAiFailure(reportRecord, difyResult, res);
    }
  } catch (err) {
    console.error("生成AI报告系统错误:", err);
    // 尝试更新数据库状态为失败
    if (reportRecord) {
      reportRecord.status = "failed";
      reportRecord.errorMessage = "Internal Server Error";
      await reportRecord.save().catch(() => { });
    }
    error(res, "生成AI报告失败", 500);
  }
};

// 辅助：单独提取 AI 失败处理逻辑
const handleAiFailure = async (reportModel, result, res) => {
  reportModel.status = "failed";
  reportModel.errorMessage = result.error;
  await reportModel.save();

  let clientMsg = "AI报告生成失败";
  if (result.errorCode === "ECONNREFUSED" || result.errorCode === "ETIMEDOUT") {
    clientMsg = "AI服务暂时不可用，请稍后重试";
  } else if (result.errorCode === "ENOTFOUND") {
    clientMsg = "AI服务配置错误";
  }

  error(res, clientMsg, 503);
};

exports.getAIReportHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { reportType, limit = 10, offset = 0 } = req.query;

    const query = {
      student: userId,
      status: "completed",
    };

    if (reportType && (reportType === "weekly" || reportType === "monthly")) {
      query.reportType = reportType;
    }

    const reports = await AIReport.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select("-__v");

    const total = await AIReport.countDocuments(query);

    success(res, {
      reports,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: total > parseInt(offset) + parseInt(limit),
    });
  } catch (err) {
    console.error("获取报告历史错误:", err);
    error(res, "获取报告历史失败", 500);
  }
};

exports.getAIReportById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { reportId } = req.params;

    const report = await AIReport.findOne({
      _id: reportId,
      student: userId,
    });

    if (!report) {
      return error(res, "报告不存在", 404);
    }

    success(res, report);
  } catch (err) {
    console.error("获取报告详情错误:", err);
    error(res, "获取报告详情失败", 500);
  }
};

exports.saveChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId, sender, userMessage, aiMessage, timestamp, metadata, summary, tags, files } = req.body;

    if (!sender || (sender !== "user" && sender !== "ai")) {
      return error(res, "无效的发送者类型", 400);
    }

    const chatHistory = new AIChatHistory({
      user: userId,
      source: "student",
      conversationId: conversationId || "",
      sender,
      userMessage: userMessage || "",
      aiMessage: aiMessage || "",
      files: files || [],
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      metadata: metadata || {},
      summary: summary || "",
      tags: tags || [],
      isFavorite: false,
    });

    await chatHistory.save();

    const savedChat = await AIChatHistory.findById(chatHistory._id);
    success(res, {
      chatId: chatHistory._id,
      message: "聊天记录保存成功",
    });
  } catch (err) {
    console.error("保存聊天记录错误:", err);
    error(res, "保存聊天记录失败", 500);
  }
};

exports.saveChatHistoryBatch = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return error(res, "消息数组不能为空", 400);
    }

    const chatHistories = messages.map((msg) => ({
      user: userId,
      source: "student",
      conversationId: msg.conversationId || "",
      sender: msg.sender,
      userMessage: msg.userMessage || "",
      aiMessage: msg.aiMessage || "",
      files: msg.files || [],
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
      metadata: msg.metadata || {},
      summary: msg.summary || "",
      tags: msg.tags || [],
      isFavorite: false,
    }));

    const result = await AIChatHistory.insertMany(chatHistories);

    success(res, {
      count: result.length,
      message: `成功保存${result.length}条聊天记录`,
    });
  } catch (err) {
    console.error("批量保存聊天记录错误:", err);
    error(res, "批量保存聊天记录失败", 500);
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId, limit = 50, offset = 0, startDate, endDate, isFavorite } = req.query;

    const query = {
      user: userId,
      source: "student",
    };

    if (conversationId) {
      query.conversationId = conversationId;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    if (isFavorite !== undefined) {
      query.isFavorite = isFavorite === "true" || isFavorite === true;
    }

    const chatHistory = await AIChatHistory.find(query)
      .sort({ timestamp: 1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select("-__v");

    const total = await AIChatHistory.countDocuments(query);

    success(res, {
      chatHistory,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: total > parseInt(offset) + parseInt(limit),
    });
  } catch (err) {
    console.error("获取聊天记录错误:", err);
    error(res, "获取聊天记录失败", 500);
  }
};

exports.getConversationList = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 20, offset = 0 } = req.query;

    const conversations = await AIChatHistory.aggregate([
      {
        $match: {
          user: userId,
          source: "student",
          conversationId: { $ne: "" },
        },
      },
      {
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: "$conversationId",
          lastMessage: { $first: "$$ROOT" },
          messageCount: { $sum: 1 },
          firstTimestamp: { $min: "$timestamp" },
          lastTimestamp: { $max: "$timestamp" },
        },
      },
      {
        $sort: { lastTimestamp: -1 },
      },
      {
        $skip: parseInt(offset),
      },
      {
        $limit: parseInt(limit),
      },
    ]);

    const totalConversations = await AIChatHistory.distinct("conversationId", {
      user: userId,
      source: "student",
      conversationId: { $ne: "" },
    });

    success(res, {
      conversations,
      total: totalConversations.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: totalConversations.length > parseInt(offset) + parseInt(limit),
    });
  } catch (err) {
    console.error("获取对话列表错误:", err);
    error(res, "获取对话列表失败", 500);
  }
};

exports.deleteChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId } = req.params;

    const chatHistory = await AIChatHistory.findOneAndDelete({
      _id: chatId,
      user: userId,
      source: "student",
    });

    if (!chatHistory) {
      return error(res, "聊天记录不存在", 404);
    }

    success(res, {
      message: "聊天记录删除成功",
    });
  } catch (err) {
    console.error("删除聊天记录错误:", err);
    error(res, "删除聊天记录失败", 500);
  }
};

exports.deleteConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    const result = await AIChatHistory.deleteMany({
      user: userId,
      source: "student",
      conversationId: conversationId,
    });

    success(res, {
      deletedCount: result.deletedCount,
      message: `成功删除${result.deletedCount}条聊天记录`,
    });
  } catch (err) {
    console.error("删除对话错误:", err);
    error(res, "删除对话失败", 500);
  }
};

exports.toggleChatFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId } = req.params;

    const chatHistory = await AIChatHistory.findOne({
      _id: chatId,
      user: userId,
      source: "student",
    });

    if (!chatHistory) {
      return error(res, "聊天记录不存在", 404);
    }

    chatHistory.isFavorite = !chatHistory.isFavorite;
    await chatHistory.save();

    success(res, {
      chatId: chatHistory._id,
      isFavorite: chatHistory.isFavorite,
      message: chatHistory.isFavorite ? "已收藏" : "已取消收藏",
    });
  } catch (err) {
    console.error("切换收藏状态错误:", err);
    error(res, "切换收藏状态失败", 500);
  }
};

exports.clearAllChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await AIChatHistory.deleteMany({
      user: userId,
      source: "student",
    });

    success(res, {
      deletedCount: result.deletedCount,
      message: `成功清空${result.deletedCount}条聊天记录`,
    });
  } catch (err) {
    console.error("清空聊天记录错误:", err);
    error(res, "清空聊天记录失败", 500);
  }
};

const formatError = (err) => {
  let userMessage = "AI 服务暂时不可用，请稍后重试";
  let logDetail = "";

  // 提取错误信息
  const errCode = err.code;
  const status = err.response?.status;

  if (errCode === "ECONNREFUSED") {
    logDetail = "原因: 连接被拒绝 - Dify 服务未运行";
    userMessage = "AI 服务未启动，请联系管理员";
  } else if (errCode === "ETIMEDOUT" || err.message.includes("timeout")) {
    logDetail = `原因: 连接超时 - Dify 服务不可达 (Timeout: ${DIFY_CONFIG.timeout}ms)`;
    userMessage = "AI 服务连接超时，请检查网络或稍后重试";
  } else if (errCode === "ENOTFOUND") {
    logDetail = "原因: 域名/IP 无法解析";
    userMessage = "AI 服务配置错误，请联系管理员";
  } else if (errCode === "ECONNRESET") {
    logDetail = "原因: 连接被重置 - Dify 服务不稳定";
    userMessage = "AI 服务连接中断，请重试";
  } else if (status) {
    logDetail = `HTTP状态: ${status} - ${JSON.stringify(err.response.data || {})}`;
    if (status === 404) userMessage = "AI 服务接口不存在或会话已失效";
    if ([401, 403].includes(status)) userMessage = "AI 服务认证失败，请联系管理员";
  }

  return { userMessage, logMessage: err.message, logDetail };
};

const callDifyApi = async (conversationId, { inputs, query, user }) => {
  return axios.post(
    DIFY_CONFIG.apiUrl,
    {
      inputs: inputs || {},
      query: query,
      response_mode: "streaming",
      conversation_id: conversationId,
      user: user,
    },
    {
      headers: {
        Authorization: `Bearer ${DIFY_CONFIG.apiKey}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      timeout: DIFY_CONFIG.timeout,
      responseType: "stream",
    },
  );
};

const pipeStreamToResponse = (sourceStream, res) => {
  // 1. 数据传输
  sourceStream.on("data", (chunk) => {
    res.write(chunk);
    // 确保数据立即发送（绕过某些压缩中间件的缓冲）
    if (typeof res.flush === "function") {
      res.flush();
    }
  });

  // 2. 传输结束
  sourceStream.on("end", () => {
    res.end();
  });

  // 3. 传输中途出错
  sourceStream.on("error", (err) => {
    console.error(chalk.red("[学生AI助手] 流传输中断:"), err.message);
    const { userMessage } = formatError(err);

    // 此时流已开启，必须通过 SSE 事件发送错误
    res.write(
      `data: ${JSON.stringify({
        event: "error",
        message: userMessage,
        code: err.code,
      })}\n\n`,
    );
    res.end();
  });
};

const getChatStreamService = async (conversationId, payloadData) => {
  // 情况 A: 初始请求，无会话ID -> 直接开启新会话
  if (!conversationId || !conversationId.trim()) {
    return await callDifyApi("", payloadData);
  }

  // 情况 B: 尝试延续现有会话
  try {
    return await callDifyApi(conversationId, payloadData);
  } catch (err) {
    // 捕获 404 错误 -> 意味着 Dify 端找不到该会话
    if (err.response?.status === 404) {
      console.warn(chalk.yellow("[学生AI助手] 会话失效 (404)，自动开启新会话..."));
      // 降级策略：传空字符串作为 ID，开启新会话
      return await callDifyApi("", payloadData);
    }
    // 其他错误（如网络超时、500错误）直接抛出
    throw err;
  }
};

exports.streamChat = async (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
    "Transfer-Encoding": "chunked",
  });

  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  try {
    // 1. 结构出请求参数
    const { inputs, query, user, conversation_id } = req.body;

    // 2. 构建大模型接口的请求参数
    const payloadData = {
      inputs,
      query,
      user,
    };

    // 3. 请求大模型获取流式响应
    const response = await getChatStreamService(conversation_id, payloadData);

    // 4. 将流式响应输出到客户端
    pipeStreamToResponse(response.data, res);
  } catch (err) {
    console.error(chalk.red("[学生AI助手] 初始化失败:"), err.message);
    const { userMessage, logDetail } = formatError(err);

    if (logDetail) {
      console.error(chalk.red(`  ${logDetail}`));
    }

    res.write(
      `data: ${JSON.stringify({
        event: "error",
        message: userMessage,
        details: err.message,
        code: err.code,
      })}\n\n`,
    );
    res.end();
  }
};
