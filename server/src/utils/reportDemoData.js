const mongoose = require('mongoose')
const NutritionRecord = require('../models/NutritionRecord')
const Dish = require('../models/Dish')
const User = require('../models/User')
const fs = require('fs')
const path = require('path')

// 每日推荐摄入量（儿童/青少年标准）
const DAILY_TARGETS = {
  calories: 1800, // 1600-2000千卡
  protein: 60,    // 50-70克
  fat: 60,        // 50-70克
  carbs: 250,     // 230-280克
  fiber: 25       // 20-30克
}

// 三餐热量分配比例
const MEAL_RATIOS = {
  breakfast: 0.30,  // 早餐30%
  lunch: 0.40,      // 午餐40%
  dinner: 0.30      // 晚餐30%
}

// 记录文件路径
const LAST_RUN_FILE = path.join(__dirname, '../../.last-seed-run.json')

/**
 * 检查今天是否已经运行过
 */
function hasRunToday() {
  try {
    if (!fs.existsSync(LAST_RUN_FILE)) {
      return false
    }
    
    const data = JSON.parse(fs.readFileSync(LAST_RUN_FILE, 'utf8'))
    const lastRunDate = new Date(data.lastRun)
    const today = new Date()
    
    // 比较日期（忽略时间）
    return lastRunDate.toDateString() === today.toDateString()
  } catch (error) {
    return false
  }
}

/**
 * 记录今天的运行时间
 */
function recordRunTime() {
  try {
    const data = {
      lastRun: new Date().toISOString(),
      timestamp: Date.now()
    }
    fs.writeFileSync(LAST_RUN_FILE, JSON.stringify(data, null, 2))
  } catch (error) {
    // 静默失败
  }
}

/**
 * 从数据库获取菜品营养数据
 */
async function loadDishNutrition() {
  const dishes = await Dish.find({ status: 1 }).select('name nutrition category')
  const nutritionMap = {}
  
  dishes.forEach(dish => {
    nutritionMap[dish.name] = {
      calories: dish.nutrition?.calories || 0,
      protein: dish.nutrition?.protein || 0,
      fat: dish.nutrition?.fat || 0,
      carbs: dish.nutrition?.carbs || 0,
      fiber: dish.nutrition?.fiber || 0,
      vitaminC: dish.nutrition?.vitaminC || 0,
      iron: dish.nutrition?.iron || 0,
      category: dish.category
    }
  })
  
  return nutritionMap
}

/**
 * 根据类别筛选菜品
 */
function filterDishesByCategory(nutritionMap, categories) {
  const categoryArray = Array.isArray(categories) ? categories : [categories]
  return Object.keys(nutritionMap).filter(name => 
    categoryArray.includes(nutritionMap[name].category)
  )
}

/**
 * 随机选择一个菜品
 */
function pickRandomDish(dishes, nutritionMap, excludeDishes = []) {
  const available = dishes.filter(d => !excludeDishes.includes(d))
  if (available.length === 0) return null
  return available[Math.floor(Math.random() * available.length)]
}

/**
 * 选择菜品以达到目标热量
 */
function selectDishesForMeal(nutritionMap, targetCalories, mealType) {
  const dishes = []
  let currentCalories = 0
  
  // 1. 主食（米饭/面食）- 必选，早餐和午餐可能选2份
  const staples = filterDishesByCategory(nutritionMap, 'staple')
  const stapleCount = (mealType === 'breakfast' || mealType === 'lunch') && Math.random() > 0.6 ? 2 : 1
  for (let i = 0; i < stapleCount && staples.length > 0; i++) {
    const staple = pickRandomDish(staples, nutritionMap, dishes)
    if (staple) {
      dishes.push(staple)
      currentCalories += nutritionMap[staple].calories
    }
  }
  
  // 2. 主菜（肉类/混合菜）- 选2-3个
  const mains = filterDishesByCategory(nutritionMap, ['meat', 'mixed'])
  const mainCount = mealType === 'lunch' ? 3 : 2 // 午餐3个主菜，其他2个
  for (let i = 0; i < mainCount && mains.length > 0; i++) {
    const main = pickRandomDish(mains, nutritionMap, dishes)
    if (main) {
      dishes.push(main)
      currentCalories += nutritionMap[main].calories
    }
  }
  
  // 3. 蔬菜 - 选2个
  const vegetables = filterDishesByCategory(nutritionMap, 'vegetable')
  for (let i = 0; i < 2 && vegetables.length > 0; i++) {
    const veg = pickRandomDish(vegetables, nutritionMap, dishes)
    if (veg) {
      dishes.push(veg)
      currentCalories += nutritionMap[veg].calories
    }
  }
  
  // 4. 汤类 - 午餐和晚餐必选
  if (mealType === 'lunch' || mealType === 'dinner') {
    const soups = filterDishesByCategory(nutritionMap, 'soup')
    if (soups.length > 0) {
      const soup = pickRandomDish(soups, nutritionMap, dishes)
      if (soup) {
        dishes.push(soup)
        currentCalories += nutritionMap[soup].calories
      }
    }
  }
  
  // 5. 如果热量不足目标的85%，继续添加高热量菜品
  const allDishes = Object.keys(nutritionMap).sort((a, b) => 
    nutritionMap[b].calories - nutritionMap[a].calories
  )
  let attempts = 0
  while (currentCalories < targetCalories * 0.85 && attempts < 10) {
    const dish = pickRandomDish(allDishes, nutritionMap, dishes)
    if (!dish) break
    dishes.push(dish)
    currentCalories += nutritionMap[dish].calories
    attempts++
  }
  
  return dishes
}

/**
 * 计算餐次营养摄入
 */
function calcIntakeFromMeals(meals, nutritionMap) {
  const total = {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    fiber: 0,
    vitaminC: 0,
    iron: 0
  }

  meals.forEach(meal => {
    meal.items.forEach(item => {
      const n = nutritionMap[item]
      if (!n) return

      total.calories += n.calories
      total.protein += n.protein
      total.fat += n.fat
      total.carbs += n.carbs
      total.fiber += n.fiber
      total.vitaminC += n.vitaminC
      total.iron += n.iron
    })
  })

  // 添加轻微随机波动（±3%）使数据更真实，但不要降低太多
  const variance = 0.98 + Math.random() * 0.06

  return {
    calories: Math.round(total.calories * variance),
    protein: +(total.protein * variance).toFixed(1),
    fat: +(total.fat * variance).toFixed(1),
    carbs: +(total.carbs * variance).toFixed(1),
    fiber: +(total.fiber * variance).toFixed(1),
    vitaminC: Math.round(total.vitaminC * variance),
    iron: +(total.iron * variance).toFixed(1),
    sugar: +(15 + Math.random() * 25).toFixed(1) // 糖分15-40克
  }
}

/**
 * 姓名脱敏处理
 * 规则：保留姓氏，名字用*代替
 * 例如：张三 -> 张*，李四四 -> 李**
 */
function maskName(name) {
  if (!name || name.length === 0) return name
  if (name.length === 1) return '*'
  return name[0] + '*'.repeat(name.length - 1)
}

/**
 * 对User集合进行脱敏操作
 * 对角色为teacher、student、parent的用户姓名进行脱敏
 */
async function maskUserNames() {
  try {
    // 查找需要脱敏的用户（teacher、student、parent角色）
    const users = await User.find({
      role: { $in: ['teacher', 'student', 'parent'] }
    })

    if (users.length === 0) {
      return
    }

    // 批量更新用户姓名
    const bulkOps = users.map(user => ({
      updateOne: {
        filter: { _id: user._id },
        update: { $set: { name: maskName(user.name) } }
      }
    }))

    await User.bulkWrite(bulkOps)
  } catch (error) {
    console.error('用户姓名脱敏失败:', error)
  }
}

module.exports = async function seedNutritionRecords() {
  // 检查今天是否已经运行过
  if (hasRunToday()) {
    return
  }

  // 执行用户姓名脱敏操作
  await maskUserNames()

  const userId = new mongoose.Types.ObjectId('68fdeb46be5156b253d36f72')

  // 加载菜品营养数据
  const nutritionMap = await loadDishNutrition()

  if (Object.keys(nutritionMap).length === 0) {
    return
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const records = []

  for (let i = 1; i <= 30; i++) {
    const day = new Date(today)
    day.setDate(day.getDate() - i)
    day.setHours(16, 0, 0, 0) // UTC（北京时间 0 点）

    // 每日总热量有±8%的随机波动，偏向上限
    const dailyCalories = DAILY_TARGETS.calories * (0.95 + Math.random() * 0.15)

    const meals = [
      {
        order: new mongoose.Types.ObjectId(),
        mealType: 'breakfast',
        time: new Date(day.getTime() - 16 * 60 * 60 * 1000), // 早上8点
        items: selectDishesForMeal(
          nutritionMap,
          dailyCalories * MEAL_RATIOS.breakfast,
          'breakfast'
        )
      },
      {
        order: new mongoose.Types.ObjectId(),
        mealType: 'lunch',
        time: new Date(day.getTime() - 11 * 60 * 60 * 1000), // 中午1点
        items: selectDishesForMeal(
          nutritionMap,
          dailyCalories * MEAL_RATIOS.lunch,
          'lunch'
        )
      },
      {
        order: new mongoose.Types.ObjectId(),
        mealType: 'dinner',
        time: new Date(day.getTime() - 5 * 60 * 60 * 1000), // 晚上7点
        items: selectDishesForMeal(
          nutritionMap,
          dailyCalories * MEAL_RATIOS.dinner,
          'dinner'
        )
      }
    ]

    const intake = calcIntakeFromMeals(meals, nutritionMap)

    records.push({
      user: userId,
      date: day,
      meals,
      intake
    })
  }

  await NutritionRecord.deleteMany({ user: userId })
  await NutritionRecord.insertMany(records)

  // 记录运行时间
  recordRunTime()
}

