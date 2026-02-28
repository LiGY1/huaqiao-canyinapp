const Dish = require('../../models/Dish');
const Order = require('../../models/Order');
const NutritionRecord = require('../../models/NutritionRecord');
const User = require('../../models/User');
const { success, error } = require('../../utils/responseFormatter');
const { ORDER_STATUS, DISH_STATUS } = require('../../config/constants');
const { getStartOfDay, getEndOfDay } = require('../../utils/dateUtils');
const { updateStudentHealthData, updateDailyNutritionRecord } = require('../../utils/healthCalculator');
const { getCurrentSolarTerm } = require('../../utils/solarTermUtils');
const cache = require('../../utils/cache');

const prefix = 'meal:list:';

exports.getMealList = async (req, res) => {
  try {
    const { category } = req.query;

    const filter = { status: DISH_STATUS.AVAILABLE };
    if (category && category !== 'all') {
      filter.category = category;
    }

    const dishes = await Dish.find(filter).sort({
      seasonal: -1,
      isRecommended: -1,
      isPopular: -1,
      salesCount: -1
    });

    success(res, dishes);
  } catch (err) {
    console.error(err);
    error(res, '获取菜品列表失败', 500);
  }
};

exports.getCurrentSolarTermRecommend = async (req, res) => {
  try {
    const cacheKey = 'solar:term:current';
    const cached = await cache.get(cacheKey);
    if (cached) {
      return success(res, cached);
    }

    const solarTermInfo = getCurrentSolarTerm();

    cache.set(cacheKey, solarTermInfo, 1800);
    success(res, solarTermInfo);
  } catch (err) {
    console.error('[节气信息] 获取失败:', err);
    error(res, '获取节气信息失败', 500);
  }
};

// 根据当前节气获取推荐菜品
exports.getSolarTermDishes = async (req, res) => {
  try {
    const { limit = 10, includePopular = true } = req.query;

    // 获取当前节气信息
    const solarTermInfo = getCurrentSolarTerm();
    const currentTerm = solarTermInfo.name;
    const currentSeason = solarTermInfo.season;

    // 构建缓存键
    const cacheKey = `solar:dishes:${currentTerm}:${limit}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return success(res, cached);
    }

    // 查询条件：状态为可用
    const baseFilter = { status: DISH_STATUS.AVAILABLE };

    let dishes = [];

    // 第一步：查询当前节气的菜品
    const termDishes = await Dish.find({
      ...baseFilter,
      seasonal: true,
      solarTerm: currentTerm
    })
      .sort({
        isRecommended: -1,  // 推荐菜品优先
        averageRating: -1,  // 评分高的优先
        salesCount: -1      // 销量高的优先
      })
      .limit(parseInt(limit));

    dishes = [...termDishes];

    // 第二步：如果节气菜品不足，补充当前季节的菜品
    if (dishes.length < limit) {
      const seasonTerms = getSeasonTerms(currentSeason);
      const remainingLimit = limit - dishes.length;

      const seasonDishes = await Dish.find({
        ...baseFilter,
        seasonal: true,
        solarTerm: { $in: seasonTerms, $ne: currentTerm },
        _id: { $nin: dishes.map(d => d._id) }
      })
        .sort({
          isRecommended: -1,
          averageRating: -1,
          salesCount: -1
        })
        .limit(remainingLimit);

      dishes = [...dishes, ...seasonDishes];
    }

    // 第三步：智能降级策略 - 根据节气特点推荐合适的菜品
    if (dishes.length < limit) {
      const remainingLimit = limit - dishes.length;
      const termPreferences = getTermFoodPreferences(currentTerm, currentSeason);
      
      const smartFilter = {
        ...baseFilter,
        _id: { $nin: dishes.map(d => d._id) }
      };
      
      // 优先推荐符合节气特点的菜品分类
      if (termPreferences.categories && termPreferences.categories.length > 0) {
        smartFilter.category = { $in: termPreferences.categories };
      }
      
      const smartDishes = await Dish.find(smartFilter)
      .sort({ 
        isRecommended: -1,
        averageRating: -1,
        salesCount: -1
      })
      .limit(remainingLimit);
      
      dishes = [...dishes, ...smartDishes];
    }

    // 第四步：如果还不足且允许包含热门菜品，补充热门菜品
    if (dishes.length < limit && includePopular === 'true') {
      const remainingLimit = limit - dishes.length;

      const popularDishes = await Dish.find({
        ...baseFilter,
        isPopular: true,
        _id: { $nin: dishes.map(d => d._id) }
      })
        .sort({
          salesCount: -1,
          averageRating: -1
        })
        .limit(remainingLimit);

      dishes = [...dishes, ...popularDishes];
    }

    // 第五步：如果还是不足，返回所有可用菜品
    if (dishes.length < limit) {
      const remainingLimit = limit - dishes.length;
      
      const allDishes = await Dish.find({
        ...baseFilter,
        _id: { $nin: dishes.map(d => d._id) }
      })
      .sort({ 
        averageRating: -1,
        salesCount: -1
      })
      .limit(remainingLimit);
      
      dishes = [...dishes, ...allDishes];
    }

    // 计算推荐分数（用于前端排序展示）
    const dishesWithScore = dishes.map(dish => {
      let score = 0;
      let matchType = 'general';

      // 节气匹配度（最高权重）
      if (dish.solarTerm === currentTerm) {
        score += 50;
        matchType = 'term';
      } else if (dish.seasonal && getSeasonTerms(currentSeason).includes(dish.solarTerm)) {
        score += 30;
        matchType = 'season';
      } else if (dish.isPopular) {
        score += 15;
        matchType = 'popular';
      } else {
        // 智能匹配的菜品
        const termPreferences = getTermFoodPreferences(currentTerm, currentSeason);
        if (termPreferences.categories.includes(dish.category)) {
          score += 25;
          matchType = 'smart';
        }
      }

      // 推荐标记
      if (dish.isRecommended) {
        score += 20;
      }

      // 评分（0-5分，转换为0-15分）
      score += (dish.averageRating || 0) * 3;

      // 销量（归一化到0-10分）
      const normalizedSales = Math.min((dish.salesCount || 0) / 100, 1) * 10;
      score += normalizedSales;

      return {
        ...dish.toObject(),
        recommendScore: Math.round(score),
        matchType,
        seasonalReason: getSeasonalReason(currentTerm, currentSeason, dish, matchType)
      };
    });

    // 按推荐分数排序
    dishesWithScore.sort((a, b) => b.recommendScore - a.recommendScore);

    const result = {
      solarTerm: solarTermInfo,
      dishes: dishesWithScore,
      total: dishesWithScore.length,
      algorithm: {
        termMatches: dishesWithScore.filter(d => d.matchType === 'term').length,
        seasonMatches: dishesWithScore.filter(d => d.matchType === 'season').length,
        smartMatches: dishesWithScore.filter(d => d.matchType === 'smart').length,
        popularMatches: dishesWithScore.filter(d => d.matchType === 'popular').length,
        generalMatches: dishesWithScore.filter(d => d.matchType === 'general').length
      }
    };

    // 缓存结果（30分钟）
    cache.set(cacheKey, result, 1800);

    success(res, result);
  } catch (err) {
    console.error('[节气菜品推荐] 获取失败:', err);
    error(res, '获取节气推荐菜品失败', 500);
  }
};

// 辅助函数：根据季节获取所有节气
function getSeasonTerms(season) {
  const seasonMap = {
    spring: ['立春', '雨水', '惊蛰', '春分', '清明', '谷雨'],
    summer: ['立夏', '小满', '芒种', '夏至', '小暑', '大暑'],
    autumn: ['立秋', '处暑', '白露', '秋分', '寒露', '霜降'],
    winter: ['立冬', '小雪', '大雪', '冬至', '小寒', '大寒']
  };
  return seasonMap[season] || [];
}

exports.getSeasonalNotification = async (req, res) => {
  try {

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const seasonalDishes = await Dish.find({
      seasonal: true,
      status: DISH_STATUS.AVAILABLE,
      createdAt: { $gte: sevenDaysAgo }
    }).sort({ createdAt: -1 }).limit(10);

    console.log(`[节气通知] 查询到${seasonalDishes.length}道节气菜品`);

    if (seasonalDishes.length === 0) {
      console.log('[节气通知] 无新节气菜品');
      return success(res, {
        hasNew: false,
        dishes: []
      });
    }

    const solarTerm = seasonalDishes[0].solarTerm || '当季';

    console.log(`[节气通知] 返回${seasonalDishes.length}道${solarTerm}菜品`);

    success(res, {
      hasNew: true,
      solarTerm,
      dishCount: seasonalDishes.length,
      dishes: seasonalDishes.slice(0, 3),
      message: `AI为您推荐了${seasonalDishes.length}道${solarTerm}应季菜品，欢迎尝鲜！`
    });
  } catch (err) {
    console.error('[节气通知] 查询失败:', err);
    error(res, '获取节气菜品通知失败', 500);
  }
};

// exports.getMealList = async (req, res) => {
//   try {
//     const { category } = req.query;

//     const cacheKey = cache.generateKey(prefix, {
//       category
//     });

//     const cached = await cache.get(cacheKey);
//     if (cached) {
//       success(res, cached);
//       return;
//     }

//     const filter = { status: DISH_STATUS.AVAILABLE };
//     if (category && category !== 'all') {
//       filter.category = category;
//     }

//     const dishes = await Dish.find(filter).sort({
//       seasonal: -1,
//       isRecommended: -1,
//       isPopular: -1,
//       salesCount: -1
//     });

//     cache.set(cacheKey, dishes);

//     success(res, dishes);
//   } catch (err) {
//     console.error(err);
//     error(res, '获取菜品列表失败', 500);
//   }
// };

exports.getAIRecommendation = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();

    const nutritionRecord = await NutritionRecord.findOne({
      user: userId,
      date: {
        $gte: getStartOfDay(today),
        $lte: getEndOfDay(today)
      }
    });

    const targetCalories = req.user.targetCalories || 2000;
    const targetProtein = Math.round(req.user.weight * 1.2) || 75;
    const targetFat = Math.round(targetCalories * 0.25 / 9) || 55;
    const targetCarbs = Math.round(targetCalories * 0.55 / 4) || 275;
    const targetFiber = 25;

    let remainingCalories = targetCalories;
    let remainingProtein = targetProtein;
    let remainingFat = targetFat;
    let remainingCarbs = targetCarbs;
    let remainingFiber = targetFiber;

    if (nutritionRecord) {
      remainingCalories = Math.max(0, targetCalories - (nutritionRecord.intake.calories || 0));
      remainingProtein = Math.max(0, targetProtein - (nutritionRecord.intake.protein || 0));
      remainingFat = Math.max(0, targetFat - (nutritionRecord.intake.fat || 0));
      remainingCarbs = Math.max(0, targetCarbs - (nutritionRecord.intake.carbs || 0));
      remainingFiber = Math.max(0, targetFiber - (nutritionRecord.intake.fiber || 0));
    }

    const allDishes = await Dish.find({ status: DISH_STATUS.AVAILABLE });

    const userAllergies = req.user.allergies || [];
    const hasDiabetes = req.user.hasDiabetes || false;

    const safeDishes = allDishes.filter(dish => {

      if (dish.allergens && dish.allergens.length > 0) {
        if (dish.allergens.some(allergen => userAllergies.includes(allergen))) {
          return false;
        }
      }

      if (hasDiabetes && dish.nutrition.carbs > 50) {
        return false;
      }

      return true;
    });

    const scoredDishes = safeDishes.map(dish => {
      let score = 0;
      const nutrition = dish.nutrition;

      const isOverTarget = remainingCalories <= 0 || remainingProtein <= 0;

      if (isOverTarget) {

        const calorieScore = Math.max(0, 30 * (1 - nutrition.calories / targetCalories));
        score += calorieScore;

        if (nutrition.protein > 0 && nutrition.protein <= targetProtein * 0.3) {
          score += 20;
        }

        if (nutrition.fiber > 5) {
          score += 15;
        }
      } else {

        if (nutrition.calories > 0) {
          if (nutrition.calories <= remainingCalories * 1.5) {
            score += 30 * Math.min(1, nutrition.calories / remainingCalories);
          } else {
            score += 10;
          }
        }

        if (nutrition.protein > 0) {
          if (nutrition.protein <= remainingProtein * 1.5) {
            score += 25 * Math.min(1, nutrition.protein / remainingProtein);
          } else {
            score += 10;
          }
        }

        if (nutrition.fiber > 0) {
          score += 15 * Math.min(1, nutrition.fiber / Math.max(1, remainingFiber));
        }

        if (nutrition.fat > 0) {
          score += 10 * Math.min(1, nutrition.fat / Math.max(1, remainingFat));
        }

        if (nutrition.carbs > 0) {
          score += 10 * Math.min(1, nutrition.carbs / Math.max(1, remainingCarbs));
        }
      }

      if (dish.averageRating > 0) {
        score += 10 * (dish.averageRating / 5);
      } else {
        score += 5;
      }

      if (dish.isPopular) {
        score += 5;
      }

      const randomFactor = (Math.random() - 0.5) * 30;
      score += randomFactor;

      return {
        ...dish.toObject(),
        matchScore: Math.min(100, Math.max(0, Math.round(score)))
      };
    });

    scoredDishes.sort((a, b) => b.matchScore - a.matchScore);

    const recommendedMeals = [];
    let totalCalories = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;
    let totalFiber = 0;

    const categories = ['staple', 'meat', 'vegetable', 'soup'];

    const targetMealCount = Math.min(10, Math.max(6, Math.floor(scoredDishes.length * 0.5)));

    const singleMealTargetCalories = remainingCalories * 0.35;

    const stapleDishes = scoredDishes.filter(d => d.category === 'staple');
    const allStapleDishes = allDishes.filter(d => d.category === 'staple' && d.status === DISH_STATUS.AVAILABLE);

    console.log(`[AI推荐] 可用主食数量: ${stapleDishes.length} (评分后), ${allStapleDishes.length} (全部)`);

    if (stapleDishes.length > 0) {

      let riceFound = false;
      const riceDishes = stapleDishes.filter(d =>
        d.name.includes('米饭') || d.name.includes('白饭') || d.name.includes('米') ||
        d.name.includes('饭') || d.name === '米饭'
      );

      console.log(`[AI推荐] 找到米饭: ${riceDishes.length}个`);

      if (riceDishes.length > 0) {

        const randomRice = riceDishes[Math.floor(Math.random() * riceDishes.length)];
        console.log(`[AI推荐] 选择主食: ${randomRice.name}`);
        recommendedMeals.push(randomRice);
        totalCalories += randomRice.nutrition.calories;
        totalProtein += randomRice.nutrition.protein;
        totalFat += randomRice.nutrition.fat;
        totalCarbs += randomRice.nutrition.carbs;
        totalFiber += randomRice.nutrition.fiber;
        riceFound = true;
      }

      if (!riceFound) {
        const topStaple = stapleDishes[0];
        console.log(`[AI推荐] 没有米饭，选择主食: ${topStaple.name}`);
        recommendedMeals.push(topStaple);
        totalCalories += topStaple.nutrition.calories;
        totalProtein += topStaple.nutrition.protein;
        totalFat += topStaple.nutrition.fat;
        totalCarbs += topStaple.nutrition.carbs;
        totalFiber += topStaple.nutrition.fiber;
      }
    } else if (allStapleDishes.length > 0) {

      console.warn('[AI推荐] 警告: 评分后没有主食，从全部主食中选择');
      const fallbackStaple = allStapleDishes[0];
      recommendedMeals.push({
        ...fallbackStaple.toObject(),
        matchScore: 60
      });
      totalCalories += fallbackStaple.nutrition.calories;
      totalProtein += fallbackStaple.nutrition.protein;
      totalFat += fallbackStaple.nutrition.fat;
      totalCarbs += fallbackStaple.nutrition.carbs;
      totalFiber += fallbackStaple.nutrition.fiber;
    } else {

      console.error('[AI推荐] 严重警告: 数据库中没有主食数据！');
    }

    const otherCategories = ['meat', 'vegetable', 'soup'];
    for (const category of otherCategories) {
      const dishesFromCategory = scoredDishes.filter(d =>
        d.category === category &&
        !recommendedMeals.some(m => m._id.toString() === d._id.toString())
      );

      if (dishesFromCategory.length === 0) continue;

      const countToSelect = Math.min(2, dishesFromCategory.length);

      const topCandidates = dishesFromCategory.slice(0, Math.min(5, dishesFromCategory.length));

      for (let i = 0; i < countToSelect && recommendedMeals.length < targetMealCount; i++) {
        if (topCandidates.length === 0) break;

        const candidate = topCandidates[Math.floor(Math.random() * topCandidates.length)];
        const potentialTotalCalories = totalCalories + candidate.nutrition.calories;

        if (singleMealTargetCalories > 0 && potentialTotalCalories > singleMealTargetCalories * 1.2 && recommendedMeals.length >= 4) {

          topCandidates.splice(topCandidates.indexOf(candidate), 1);
          i--;
          continue;
        }

        recommendedMeals.push(candidate);
        totalCalories += candidate.nutrition.calories;
        totalProtein += candidate.nutrition.protein;
        totalFat += candidate.nutrition.fat;
        totalCarbs += candidate.nutrition.carbs;
        totalFiber += candidate.nutrition.fiber;

        topCandidates.splice(topCandidates.indexOf(candidate), 1);
      }
    }

    if (recommendedMeals.length < targetMealCount) {

      const hasStaple = recommendedMeals.some(m => m.category === 'staple');

      const remainingDishes = scoredDishes.filter(dish => {

        if (recommendedMeals.some(m => m._id.toString() === dish._id.toString())) {
          return false;
        }

        if (hasStaple && dish.category === 'staple') {
          return false;
        }
        return true;
      });

      const candidatePool = remainingDishes.slice(0, Math.min(10, remainingDishes.length));

      while (recommendedMeals.length < targetMealCount && candidatePool.length > 0) {

        const randomIndex = Math.floor(Math.random() * candidatePool.length);
        const selectedDish = candidatePool[randomIndex];

        const potentialTotalCalories = totalCalories + selectedDish.nutrition.calories;

        if (singleMealTargetCalories > 0 &&
          potentialTotalCalories > singleMealTargetCalories * 1.3 &&
          recommendedMeals.length >= 4) {
          candidatePool.splice(randomIndex, 1);
          continue;
        }

        recommendedMeals.push(selectedDish);
        totalCalories += selectedDish.nutrition.calories;
        totalProtein += selectedDish.nutrition.protein;
        totalFat += selectedDish.nutrition.fat;
        totalCarbs += selectedDish.nutrition.carbs;
        totalFiber += selectedDish.nutrition.fiber;

        candidatePool.splice(randomIndex, 1);
      }
    }

    if (recommendedMeals.length === 0 && allDishes.length > 0) {
      const randomCount = Math.min(4, allDishes.length);
      const randomDishes = allDishes.slice(0, randomCount);
      randomDishes.forEach(dish => {
        recommendedMeals.push({
          ...dish.toObject(),
          matchScore: 50
        });
        totalCalories += dish.nutrition.calories;
        totalProtein += dish.nutrition.protein;
        totalFat += dish.nutrition.fat;
        totalCarbs += dish.nutrition.carbs;
        totalFiber += dish.nutrition.fiber;
      });
    }

    if (recommendedMeals.length < 4 && allDishes.length >= 4) {
      console.warn('推荐菜品数量不足4个，正在补充...');
      const neededCount = 4 - recommendedMeals.length;
      const hasStaple = recommendedMeals.some(m => m.category === 'staple');

      const availableDishes = allDishes.filter(dish => {

        if (recommendedMeals.some(m => m._id.toString() === dish._id.toString())) {
          return false;
        }

        if (hasStaple && dish.category === 'staple') {
          return false;
        }
        return true;
      });

      for (let i = 0; i < neededCount && i < availableDishes.length; i++) {
        const dish = availableDishes[i];
        recommendedMeals.push({
          ...dish.toObject(),
          matchScore: 50
        });
        totalCalories += dish.nutrition.calories;
        totalProtein += dish.nutrition.protein;
        totalFat += dish.nutrition.fat;
        totalCarbs += dish.nutrition.carbs;
        totalFiber += dish.nutrition.fiber;
      }
    }

    let reason = ``;

    const isOverCalories = remainingCalories <= 0;
    const isOverProtein = remainingProtein <= 0;

    const hour = new Date().getHours();
    let mealName = '本餐';
    if (hour >= 6 && hour < 10) mealName = '早餐';
    else if (hour >= 10 && hour < 14) mealName = '午餐';
    else if (hour >= 14 && hour < 17) mealName = '下午茶';
    else if (hour >= 17 && hour < 21) mealName = '晚餐';
    else mealName = '本餐';

    if (isOverCalories || isOverProtein) {
      reason += `您今日营养摄入已较为充足`;
      if (isOverCalories) {
        reason += `（热量已达标）`;
      }
      reason += `。为您的${mealName}推荐以下清淡健康的菜品`;
    } else {

      const needs = [];
      const mealCalories = Math.round(singleMealTargetCalories);

      if (mealCalories > 0) {
        needs.push(`约${mealCalories}千卡热量`);
      }

      const mealProtein = Math.round(remainingProtein * 0.35);
      if (mealProtein > 0) {
        needs.push(`${mealProtein}克蛋白质`);
      }

      if (needs.length > 0) {
        reason += `您的${mealName}建议摄入${needs.join('、')}。`;
      }

      const hasRice = recommendedMeals.some(m =>
        m.name.includes('米饭') || m.name.includes('饭') || m.category === 'staple'
      );
      if (hasRice) {
        reason += `为您推荐营养均衡的主食搭配`;
      } else {
        reason += `为您推荐营养搭配`;
      }
    }

    success(res, {
      reason,
      recommendedMeals,
      totalNutrition: {
        calories: Math.round(totalCalories),
        protein: Math.round(totalProtein),
        fat: Math.round(totalFat),
        carbs: Math.round(totalCarbs),
        fiber: Math.round(totalFiber)
      },
      remaining: {
        calories: Math.round(remainingCalories),
        protein: Math.round(remainingProtein),
        fat: Math.round(remainingFat),
        carbs: Math.round(remainingCarbs),
        fiber: Math.round(remainingFiber)
      }
    });
  } catch (err) {
    console.error(err);
    error(res, '获取AI推荐失败', 500);
  }
};

exports.submitOrder = async (req, res) => {
  try {
    const { items, mealType, scheduledDate } = req.body;

    if (!items || items.length === 0) {
      return error(res, '订单不能为空', 400);
    }

    let totalAmount = 0;
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

    const orderItems = [];

    for (const item of items) {
      const dish = await Dish.findById(item.dishId);
      if (!dish) {
        return error(res, `菜品不存在: ${item.dishId}`, 400);
      }

      if (dish.status !== DISH_STATUS.AVAILABLE) {
        return error(res, `菜品"${dish.name}"暂时不可点餐`, 400);
      }

      const itemTotal = dish.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        dish: dish._id,
        dishName: dish.name,
        dishCategory: dish.category,
        dishImage: dish.image,
        quantity: item.quantity,
        price: dish.price,
        nutrition: dish.nutrition
      });

      totalNutrition.calories += (dish.nutrition.calories || 0) * item.quantity;
      totalNutrition.protein += (dish.nutrition.protein || 0) * item.quantity;
      totalNutrition.fat += (dish.nutrition.fat || 0) * item.quantity;
      totalNutrition.carbs += (dish.nutrition.carbs || 0) * item.quantity;
      totalNutrition.fiber += (dish.nutrition.fiber || 0) * item.quantity;
      totalNutrition.vitaminA += (dish.nutrition.vitaminA || 0) * item.quantity;
      totalNutrition.vitaminC += (dish.nutrition.vitaminC || 0) * item.quantity;
      totalNutrition.vitaminD += (dish.nutrition.vitaminD || 0) * item.quantity;
      totalNutrition.vitaminE += (dish.nutrition.vitaminE || 0) * item.quantity;
      totalNutrition.calcium += (dish.nutrition.calcium || 0) * item.quantity;
      totalNutrition.iron += (dish.nutrition.iron || 0) * item.quantity;
      totalNutrition.zinc += (dish.nutrition.zinc || 0) * item.quantity;
      totalNutrition.sodium += (dish.nutrition.sodium || 0) * item.quantity;
      totalNutrition.potassium += (dish.nutrition.potassium || 0) * item.quantity;

      dish.salesCount += item.quantity;
      await dish.save();
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return error(res, '用户不存在', 404);
    }

    const userBalance = user.balance || 0;
    if (userBalance < totalAmount) {
      return error(res, '余额不足，请先充值', 402, {
        balance: userBalance,
        required: totalAmount,
        shortage: totalAmount - userBalance
      });
    }

    user.balance = userBalance - totalAmount;
    await user.save();

    const orderNumber = 'ORDER' + Date.now() + Math.floor(Math.random() * 1000);

    const orderDate = new Date();
    const order = await Order.create({
      orderNumber,
      user: req.user._id,
      items: orderItems,
      totalAmount,
      totalNutrition,
      status: ORDER_STATUS.PAID,
      mealType,
      orderDate: orderDate,
      scheduledDate: scheduledDate || orderDate
    });

    await updateNutritionRecord(req.user._id, totalNutrition, order._id, mealType);

    // updateDailyNutritionRecord(req.user._id, order.orderDate || new Date())
    //   .then(() => updateStudentHealthData(req.user._id, {
    //     height: user.height,
    //     weight: user.weight,
    //     gender: user.gender
    //   }))
    //   .catch(err => console.error('更新健康数据失败:', err));

    const cacheInvalidation = require('../../utils/cacheInvalidation');
    cacheInvalidation.invalidateOrderCache(order).catch(err => {
      console.error('缓存失效失败:', err);
    });

    success(res, {
      orderId: order.orderNumber,
      status: order.status,
      estimatedTime: 15,
      remainingBalance: user.balance
    }, '下单成功', 201);
  } catch (err) {
    console.error(err);
    error(res, '下单失败', 500);
  }
};

exports.getOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderNumber: orderId })
      .populate('items.dish', 'name image category');

    if (!order) {
      return error(res, '订单不存在', 404);
    }

    const statusText = {
      pending: '待支付',
      paid: '已支付',
      preparing: '准备中',
      ready: '待取餐',
      completed: '已完成',
      cancelled: '已取消'
    };

    const formattedItems = order.items.map(item => ({
      id: item.dish?._id || item.dish,
      name: item.dishName,
      category: item.dishCategory,
      image: item.dishImage || item.dish?.image,
      quantity: item.quantity,
      price: item.price,
      nutrition: item.nutrition
    }));

    success(res, {
      orderId: order.orderNumber,
      status: order.status,
      statusText: statusText[order.status],
      items: formattedItems,
      totalAmount: order.totalAmount,
      totalNutrition: order.totalNutrition,
      orderDate: order.orderDate,
      mealType: order.mealType
    });
  } catch (err) {
    console.error(err);
    error(res, '获取订单状态失败', 500);
  }
};

exports.getOrderHistory = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, startDate, endDate } = req.query;
    const skip = (page - 1) * pageSize;

    const filter = { user: req.user._id };
    if (status) {
      filter.status = status;
    }

    // 支持日期范围过滤
    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) {
        // 处理日期字符串 YYYY-MM-DD
        const startStr = startDate.split('T')[0]; // 确保只取日期部分
        const [year, month, day] = startStr.split('-').map(Number);
        const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
        filter.orderDate.$gte = start;
      }
      if (endDate) {
        // 处理日期字符串 YYYY-MM-DD
        const endStr = endDate.split('T')[0]; // 确保只取日期部分
        const [year, month, day] = endStr.split('-').map(Number);
        const end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
        filter.orderDate.$lte = end;
      }

      console.log('📅 订单日期过滤:', {
        startDate,
        endDate,
        filter: {
          $gte: filter.orderDate.$gte?.toISOString(),
          $lte: filter.orderDate.$lte?.toISOString()
        }
      });
    }

    const orders = await Order.find(filter)
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(parseInt(pageSize))
      .populate('items.dish', 'name image category');

    const total = await Order.countDocuments(filter);

    console.log('📊 查询结果:', {
      查询条件: JSON.stringify(filter),
      找到订单数: orders.length,
      订单日期范围: orders.length > 0 ? {
        最早: orders[orders.length - 1]?.orderDate,
        最晚: orders[0]?.orderDate
      } : null
    });

    const formattedOrders = orders.map(order => ({
      orderId: order.orderNumber,
      orderTime: order.orderDate,
      status: order.status,
      totalPrice: order.totalAmount,
      mealType: order.mealType,
      items: order.items.map(item => ({
        id: item.dish?._id || item.dish,
        name: item.dishName,
        category: item.dishCategory,
        image: item.dishImage || item.dish?.image,
        price: item.price,
        quantity: item.quantity,
        nutrition: item.nutrition
      })),
      nutrition: order.totalNutrition || {
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
        fiber: 0
      }
    }));

    success(res, {
      orders: formattedOrders,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (err) {
    console.error(err);
    error(res, '获取订单历史失败', 500);
  }
};

async function updateNutritionRecord(userId, nutrition, orderId, mealType) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let record = await NutritionRecord.findOne({
    user: userId,
    date: today
  });

  if (!record) {
    record = new NutritionRecord({
      user: userId,
      date: today,
      intake: nutrition,
      meals: [{
        order: orderId,
        mealType: mealType,
        time: new Date()
      }]
    });
  } else {

    record.intake.calories += nutrition.calories || 0;
    record.intake.protein += nutrition.protein || 0;
    record.intake.fat += nutrition.fat || 0;
    record.intake.carbs += nutrition.carbs || 0;
    record.intake.fiber += nutrition.fiber || 0;
    record.intake.vitaminA = (record.intake.vitaminA || 0) + (nutrition.vitaminA || 0);
    record.intake.vitaminC = (record.intake.vitaminC || 0) + (nutrition.vitaminC || 0);
    record.intake.vitaminD = (record.intake.vitaminD || 0) + (nutrition.vitaminD || 0);
    record.intake.vitaminE = (record.intake.vitaminE || 0) + (nutrition.vitaminE || 0);
    record.intake.calcium = (record.intake.calcium || 0) + (nutrition.calcium || 0);
    record.intake.iron = (record.intake.iron || 0) + (nutrition.iron || 0);
    record.intake.zinc = (record.intake.zinc || 0) + (nutrition.zinc || 0);
    record.intake.sodium = (record.intake.sodium || 0) + (nutrition.sodium || 0);
    record.intake.potassium = (record.intake.potassium || 0) + (nutrition.potassium || 0);

    record.meals.push({
      order: orderId,
      mealType: mealType,
      time: new Date()
    });
  }

  await record.save();
}


// 辅助函数：根据节气特点获取推荐的菜品分类
function getTermFoodPreferences(term, season) {
  // 节气饮食偏好映射
  const termPreferencesMap = {
    // 春季节气
    '立春': { categories: ['vegetable', 'mixed', 'soup'], keywords: ['韭菜', '春笋', '豆芽'] },
    '雨水': { categories: ['soup', 'mixed', 'vegetable'], keywords: ['山药', '红枣', '粥'] },
    '惊蛰': { categories: ['vegetable', 'mixed', 'meat'], keywords: ['菠菜', '芹菜', '鸡蛋'] },
    '春分': { categories: ['vegetable', 'mixed', 'soup'], keywords: ['豆类', '新鲜蔬菜'] },
    '清明': { categories: ['vegetable', 'mixed', 'soup'], keywords: ['青团', '春菜'] },
    '谷雨': { categories: ['vegetable', 'soup', 'mixed'], keywords: ['香椿', '豆腐'] },
    
    // 夏季节气
    '立夏': { categories: ['vegetable', 'soup', 'beverage'], keywords: ['绿豆', '冬瓜', '苦瓜'] },
    '小满': { categories: ['vegetable', 'soup', 'mixed'], keywords: ['苦菜', '黄瓜'] },
    '芒种': { categories: ['vegetable', 'soup', 'beverage'], keywords: ['西瓜', '绿豆汤'] },
    '夏至': { categories: ['vegetable', 'soup', 'beverage'], keywords: ['面条', '清淡'] },
    '小暑': { categories: ['vegetable', 'soup', 'beverage'], keywords: ['莲藕', '绿豆'] },
    '大暑': { categories: ['soup', 'vegetable', 'beverage'], keywords: ['西瓜', '绿豆汤', '清热'] },
    
    // 秋季节气
    '立秋': { categories: ['meat', 'mixed', 'soup'], keywords: ['鸭肉', '莲藕', '百合'] },
    '处暑': { categories: ['soup', 'vegetable', 'mixed'], keywords: ['银耳', '梨', '润燥'] },
    '白露': { categories: ['soup', 'mixed', 'vegetable'], keywords: ['龙眼', '红枣'] },
    '秋分': { categories: ['mixed', 'soup', 'vegetable'], keywords: ['南瓜', '芋头'] },
    '寒露': { categories: ['soup', 'mixed', 'meat'], keywords: ['芝麻', '蜂蜜', '润肺'] },
    '霜降': { categories: ['meat', 'mixed', 'soup'], keywords: ['栗子', '山药', '温补'] },
    
    // 冬季节气
    '立冬': { categories: ['meat', 'mixed', 'soup'], keywords: ['羊肉', '牛肉', '温补'] },
    '小雪': { categories: ['meat', 'soup', 'mixed'], keywords: ['羊肉', '核桃', '温热'] },
    '大雪': { categories: ['meat', 'soup', 'mixed'], keywords: ['温热食物', '进补'] },
    '冬至': { categories: ['meat', 'soup', 'staple'], keywords: ['饺子', '汤圆', '温补'] },
    '小寒': { categories: ['meat', 'soup', 'mixed'], keywords: ['温补', '驱寒'] },
    '大寒': { categories: ['meat', 'soup', 'mixed'], keywords: ['温补', '为春季做准备'] }
  };
  
  // 如果有具体节气的偏好，返回；否则返回季节通用偏好
  if (termPreferencesMap[term]) {
    return termPreferencesMap[term];
  }
  
  // 季节通用偏好
  const seasonPreferences = {
    spring: { categories: ['vegetable', 'mixed', 'soup'], keywords: ['新鲜', '清淡'] },
    summer: { categories: ['vegetable', 'soup', 'beverage'], keywords: ['清热', '解暑'] },
    autumn: { categories: ['mixed', 'soup', 'meat'], keywords: ['润燥', '滋补'] },
    winter: { categories: ['meat', 'soup', 'mixed'], keywords: ['温补', '御寒'] }
  };
  
  return seasonPreferences[season] || { categories: ['mixed', 'vegetable', 'meat'], keywords: [] };
}

// 辅助函数：生成推荐理由
function getSeasonalReason(term, season, dish, matchType) {
  const reasons = {
    term: `${term}节气推荐，应季养生佳品`,
    season: `${getSeasonName(season)}季节推荐，符合时令特点`,
    smart: `根据${term}节气特点智能推荐`,
    popular: '热门菜品，深受欢迎',
    general: '营养均衡，适合日常食用'
  };
  
  return reasons[matchType] || reasons.general;
}

function getSeasonName(season) {
  const names = {
    spring: '春',
    summer: '夏',
    autumn: '秋',
    winter: '冬'
  };
  return names[season] || '';
}
