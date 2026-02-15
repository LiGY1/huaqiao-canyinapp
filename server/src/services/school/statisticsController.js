const User = require('../../models/User');
const Order = require('../../models/Order');
const NutritionRecord = require('../../models/NutritionRecord');
const PhysicalExam = require('../../models/PhysicalExam');
const { success, error } = require('../../utils/responseFormatter');
const { getWeekRange, getStartOfDay, getEndOfDay } = require('../../utils/dateUtils');
const { USER_ROLES, ORDER_STATUS } = require('../../config/constants');

exports.getDashboardStats = async (req, res) => {
  try {
    const currentUser = req.user;

    let studentFilter = { role: USER_ROLES.STUDENT };

    if (currentUser.role === USER_ROLES.TEACHER) {

      if (currentUser.managedClasses && currentUser.managedClasses.length > 0) {
        studentFilter.class = { $in: currentUser.managedClasses };
      } else {

        return success(res, {
          totalStudents: 0,
          healthDistribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
          todayOrders: 0,
          nutritionTrend: new Array(7).fill(0),
          foodSafetyScore: 0,
          alerts: []
        });
      }
    }

    const totalStudents = await User.countDocuments(studentFilter);

    const { start, end } = getWeekRange();

    const studentIds = await User.find(studentFilter).select('_id');
    const studentIdList = studentIds.map(s => s._id);

    const weeklyRecords = await NutritionRecord.find({
      user: { $in: studentIdList },
      date: { $gte: start, $lte: end }
    });

    const dailyAvgCalories = new Array(7).fill(0);
    const dailyCounts = new Array(7).fill(0);

    weeklyRecords.forEach(record => {
      const dayIndex = new Date(record.date).getDay();
      const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
      dailyAvgCalories[adjustedIndex] += record.intake.calories;
      dailyCounts[adjustedIndex]++;
    });

    const nutritionTrend = dailyAvgCalories.map((total, i) =>
      dailyCounts[i] > 0 ? Math.round(total / dailyCounts[i]) : 0
    );

    const today = new Date();
    const todayStart = getStartOfDay(today);
    const todayEnd = getEndOfDay(today);

    const todayMeals = await Order.find({
      user: { $in: studentIdList },
      orderDate: { $gte: todayStart, $lte: todayEnd },
      status: { $in: [ORDER_STATUS.PAID, ORDER_STATUS.PREPARING, ORDER_STATUS.READY, ORDER_STATUS.COMPLETED] }
    });

    const totalPossibleMeals = studentIdList.length * 3;
    const actualMeals = todayMeals.length;
    const mealPercentage = totalPossibleMeals > 0 ? Math.round((actualMeals / totalPossibleMeals) * 100) : 0;

    success(res, {
      totalStudents,
      mealPercentage,
      nutritionTrend,
      alerts: [
        { type: 'warning', message: `有${Math.max(0, studentIdList.length - Math.round(actualMeals / 3))}名学生今日未用餐` },
        { type: 'info', message: `班级用餐率: ${mealPercentage}%` }
      ]
    });
  } catch (err) {
    console.error(err);
    error(res, '获取统计数据失败', 500);
  }
};

exports.getClassStats = async (req, res) => {
  try {
    const { classId } = req.params;
    const currentUser = req.user;

    if (currentUser.role === USER_ROLES.TEACHER) {
      if (!currentUser.managedClasses || !currentUser.managedClasses.includes(classId)) {
        return error(res, '无权限查看该班级信息', 403);
      }
    }

    const students = await User.find({
      class: classId,
      role: USER_ROLES.STUDENT
    });

    const { start, end } = getWeekRange();

    const statsPromises = students.map(async (student) => {
      const weekOrders = await Order.countDocuments({
        user: student._id,
        orderDate: { $gte: start, $lte: end }
      });

      const latestExam = await PhysicalExam.findOne({ student: student._id })
        .sort({ examDate: -1 });

      return {
        id: student._id,
        name: student.name,
        studentId: student.studentId,
        weekMealCount: weekOrders,
        healthStatus: latestExam?.healthStatus || 'good',
        bmi: latestExam?.bmi || 0
      };
    });

    const classStats = await Promise.all(statsPromises);

    success(res, {
      className: classId,
      totalStudents: students.length,
      students: classStats
    });
  } catch (err) {
    console.error(err);
    error(res, '获取班级统计失败', 500);
  }
};

exports.getTodayOverview = async (req, res) => {
  try {
    const currentUser = req.user;
    const { MEAL_TYPES } = require('../../config/constants');

    let studentFilter = { role: USER_ROLES.STUDENT };

    if (currentUser.role === USER_ROLES.TEACHER) {

      if (currentUser.managedClasses && currentUser.managedClasses.length > 0) {
        studentFilter.class = { $in: currentUser.managedClasses };
      } else {
        return success(res, {
          totalStudents: 0,
          breakfast: 0,
          lunch: 0,
          dinner: 0,
          breakfastPercentage: 0,
          lunchPercentage: 0,
          dinnerPercentage: 0
        });
      }
    }

    const students = await User.find(studentFilter);
    const totalStudents = students.length;
    const studentIds = students.map(s => s._id);

    const today = new Date();
    const todayStart = getStartOfDay(today);
    const todayEnd = getEndOfDay(today);

    const breakfastOrders = await Order.countDocuments({
      user: { $in: studentIds },
      orderDate: { $gte: todayStart, $lte: todayEnd },
      mealType: MEAL_TYPES.BREAKFAST,
      status: { $in: [ORDER_STATUS.PAID, ORDER_STATUS.PREPARING, ORDER_STATUS.READY, ORDER_STATUS.COMPLETED] }
    });

    const lunchOrders = await Order.countDocuments({
      user: { $in: studentIds },
      orderDate: { $gte: todayStart, $lte: todayEnd },
      mealType: MEAL_TYPES.LUNCH,
      status: { $in: [ORDER_STATUS.PAID, ORDER_STATUS.PREPARING, ORDER_STATUS.READY, ORDER_STATUS.COMPLETED] }
    });

    const dinnerOrders = await Order.countDocuments({
      user: { $in: studentIds },
      orderDate: { $gte: todayStart, $lte: todayEnd },
      mealType: MEAL_TYPES.DINNER,
      status: { $in: [ORDER_STATUS.PAID, ORDER_STATUS.PREPARING, ORDER_STATUS.READY, ORDER_STATUS.COMPLETED] }
    });

    success(res, {
      totalStudents,
      breakfast: breakfastOrders,
      lunch: lunchOrders,
      dinner: dinnerOrders,
      breakfastPercentage: totalStudents > 0 ? Math.round((breakfastOrders / totalStudents) * 100) : 0,
      lunchPercentage: totalStudents > 0 ? Math.round((lunchOrders / totalStudents) * 100) : 0,
      dinnerPercentage: totalStudents > 0 ? Math.round((dinnerOrders / totalStudents) * 100) : 0
    });
  } catch (err) {
    console.error(err);
    error(res, '获取今日概览失败', 500);
  }
};

exports.getWeeklyComparison = async (req, res) => {
  try {
    const currentUser = req.user;
    const { MEAL_TYPES } = require('../../config/constants');

    let studentFilter = { role: USER_ROLES.STUDENT };

    if (currentUser.role === USER_ROLES.TEACHER) {
      if (currentUser.managedClasses && currentUser.managedClasses.length > 0) {
        studentFilter.class = { $in: currentUser.managedClasses };
      } else {
        return success(res, getEmptyComparisonData());
      }
    }

    const students = await User.find(studentFilter);
    const studentIds = students.map(s => s._id);

    const thisWeek = getWeekRange();
    const lastWeek = getWeekRange(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

    const [thisWeekOrders, lastWeekOrders] = await Promise.all([
      Order.countDocuments({
        user: { $in: studentIds },
        orderDate: { $gte: thisWeek.start, $lte: thisWeek.end },
        status: { $in: [ORDER_STATUS.PAID, ORDER_STATUS.PREPARING, ORDER_STATUS.READY, ORDER_STATUS.COMPLETED] }
      }),
      Order.countDocuments({
        user: { $in: studentIds },
        orderDate: { $gte: lastWeek.start, $lte: lastWeek.end },
        status: { $in: [ORDER_STATUS.PAID, ORDER_STATUS.PREPARING, ORDER_STATUS.READY, ORDER_STATUS.COMPLETED] }
      })
    ]);

    const thisWeekDailyMeals = await getDailyMealCounts(studentIds, thisWeek.start, thisWeek.end);
    const lastWeekDailyMeals = await getDailyMealCounts(studentIds, lastWeek.start, lastWeek.end);

    const [thisWeekNutrition, lastWeekNutrition] = await Promise.all([
      getNutritionStats(studentIds, thisWeek.start, thisWeek.end),
      getNutritionStats(studentIds, lastWeek.start, lastWeek.end)
    ]);

    const [thisWeekMealTypes, lastWeekMealTypes] = await Promise.all([
      getMealTypeStats(studentIds, thisWeek.start, thisWeek.end),
      getMealTypeStats(studentIds, lastWeek.start, lastWeek.end)
    ]);

    const healthDistribution = await getHealthDistribution(studentIds);

    const [thisWeekParticipation, lastWeekParticipation] = await Promise.all([
      getStudentParticipation(studentIds, thisWeek.start, thisWeek.end),
      getStudentParticipation(studentIds, lastWeek.start, lastWeek.end)
    ]);

    success(res, {
      totalStudents: students.length,
      thisWeek: {
        totalOrders: thisWeekOrders,
        dailyMeals: thisWeekDailyMeals,
        nutrition: thisWeekNutrition,
        mealTypes: thisWeekMealTypes,
        participation: thisWeekParticipation
      },
      lastWeek: {
        totalOrders: lastWeekOrders,
        dailyMeals: lastWeekDailyMeals,
        nutrition: lastWeekNutrition,
        mealTypes: lastWeekMealTypes,
        participation: lastWeekParticipation
      },
      healthDistribution,
      comparison: {
        orderChange: calculatePercentageChange(lastWeekOrders, thisWeekOrders),
        nutritionChange: calculatePercentageChange(lastWeekNutrition.avgCalories, thisWeekNutrition.avgCalories),
        participationChange: calculatePercentageChange(lastWeekParticipation.activeStudents, thisWeekParticipation.activeStudents)
      }
    });
  } catch (err) {
    console.error(err);
    error(res, '获取周对比数据失败', 500);
  }
};

async function getDailyMealCounts(studentIds, startDate, endDate) {
  const orders = await Order.find({
    user: { $in: studentIds },
    orderDate: { $gte: startDate, $lte: endDate },
    status: { $in: [ORDER_STATUS.PAID, ORDER_STATUS.PREPARING, ORDER_STATUS.READY, ORDER_STATUS.COMPLETED] }
  });

  const dailyCounts = new Array(7).fill(0);
  orders.forEach(order => {
    const dayIndex = new Date(order.orderDate).getDay();
    const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    dailyCounts[adjustedIndex]++;
  });

  return dailyCounts;
}

async function getNutritionStats(studentIds, startDate, endDate) {
  const records = await NutritionRecord.find({
    user: { $in: studentIds },
    date: { $gte: startDate, $lte: endDate }
  });

  if (records.length === 0) {
    return { avgCalories: 0, avgProtein: 0, avgCarbs: 0, avgFat: 0 };
  }

  const totals = records.reduce((acc, record) => ({
    calories: acc.calories + (record.intake?.calories || 0),
    protein: acc.protein + (record.intake?.protein || 0),
    carbs: acc.carbs + (record.intake?.carbs || 0),
    fat: acc.fat + (record.intake?.fat || 0)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  return {
    avgCalories: Math.round(totals.calories / records.length),
    avgProtein: Math.round(totals.protein / records.length),
    avgCarbs: Math.round(totals.carbs / records.length),
    avgFat: Math.round(totals.fat / records.length)
  };
}

async function getMealTypeStats(studentIds, startDate, endDate) {
  const { MEAL_TYPES } = require('../../config/constants');

  const [breakfast, lunch, dinner] = await Promise.all([
    Order.countDocuments({
      user: { $in: studentIds },
      orderDate: { $gte: startDate, $lte: endDate },
      mealType: MEAL_TYPES.BREAKFAST,
      status: { $in: [ORDER_STATUS.PAID, ORDER_STATUS.PREPARING, ORDER_STATUS.READY, ORDER_STATUS.COMPLETED] }
    }),
    Order.countDocuments({
      user: { $in: studentIds },
      orderDate: { $gte: startDate, $lte: endDate },
      mealType: MEAL_TYPES.LUNCH,
      status: { $in: [ORDER_STATUS.PAID, ORDER_STATUS.PREPARING, ORDER_STATUS.READY, ORDER_STATUS.COMPLETED] }
    }),
    Order.countDocuments({
      user: { $in: studentIds },
      orderDate: { $gte: startDate, $lte: endDate },
      mealType: MEAL_TYPES.DINNER,
      status: { $in: [ORDER_STATUS.PAID, ORDER_STATUS.PREPARING, ORDER_STATUS.READY, ORDER_STATUS.COMPLETED] }
    })
  ]);

  return { breakfast, lunch, dinner };
}

async function getHealthDistribution(studentIds) {
  const exams = await PhysicalExam.aggregate([
    {
      $match: { student: { $in: studentIds } }
    },
    {
      $sort: { examDate: -1 }
    },
    {
      $group: {
        _id: '$student',
        latestExam: { $first: '$$ROOT' }
      }
    }
  ]);

  const distribution = { excellent: 0, good: 0, fair: 0, poor: 0, unknown: 0 };
  exams.forEach(item => {
    const status = item.latestExam?.healthStatus || 'unknown';
    distribution[status] = (distribution[status] || 0) + 1;
  });

  distribution.unknown += studentIds.length - exams.length;

  return distribution;
}

async function getStudentParticipation(studentIds, startDate, endDate) {
  const studentsWithOrders = await Order.distinct('user', {
    user: { $in: studentIds },
    orderDate: { $gte: startDate, $lte: endDate },
    status: { $in: [ORDER_STATUS.PAID, ORDER_STATUS.PREPARING, ORDER_STATUS.READY, ORDER_STATUS.COMPLETED] }
  });

  return {
    activeStudents: studentsWithOrders.length,
    totalStudents: studentIds.length,
    participationRate: studentIds.length > 0
      ? Math.round((studentsWithOrders.length / studentIds.length) * 100)
      : 0
  };
}

function calculatePercentageChange(oldValue, newValue) {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return Math.round(((newValue - oldValue) / oldValue) * 100);
}

function getEmptyComparisonData() {
  return {
    totalStudents: 0,
    thisWeek: {
      totalOrders: 0,
      dailyMeals: new Array(7).fill(0),
      nutrition: { avgCalories: 0, avgProtein: 0, avgCarbs: 0, avgFat: 0 },
      mealTypes: { breakfast: 0, lunch: 0, dinner: 0 },
      participation: { activeStudents: 0, totalStudents: 0, participationRate: 0 }
    },
    lastWeek: {
      totalOrders: 0,
      dailyMeals: new Array(7).fill(0),
      nutrition: { avgCalories: 0, avgProtein: 0, avgCarbs: 0, avgFat: 0 },
      mealTypes: { breakfast: 0, lunch: 0, dinner: 0 },
      participation: { activeStudents: 0, totalStudents: 0, participationRate: 0 }
    },
    healthDistribution: { excellent: 0, good: 0, fair: 0, poor: 0, unknown: 0 },
    comparison: { orderChange: 0, nutritionChange: 0, participationChange: 0 }
  };
}

exports.getTeacherClasses = async (req, res) => {
  try {
    const currentUser = req.user;

    const students = await User.find({ role: USER_ROLES.STUDENT });

    const classesSet = new Set();
    const classesMap = new Map();

    students.forEach(student => {
      if (student.class) {
        classesSet.add(student.class);
        if (!classesMap.has(student.class)) {
          classesMap.set(student.class, {
            classId: student.class,
            className: student.class,
            grade: student.grade || '2025级',
            studentCount: 1
          });
        } else {
          const classInfo = classesMap.get(student.class);
          classInfo.studentCount++;
        }
      }
    });

    const classes = Array.from(classesMap.values());

    if (currentUser.role === USER_ROLES.TEACHER && currentUser.managedClasses) {
      const filteredClasses = classes.filter(cls =>
        currentUser.managedClasses.includes(cls.classId)
      );
      return success(res, filteredClasses);
    }

    success(res, classes);
  } catch (err) {
    console.error(err);
    error(res, '获取班级列表失败', 500);
  }
};

// 获取学生每周营养详情数据
exports.getStudentWeeklyNutrition = async (req, res) => {
  try {
    const { studentId, weekOffset = 0 } = req.query;
    const currentUser = req.user;

    // 验证学生ID
    if (!studentId) {
      return error(res, '学生ID不能为空', 400);
    }

    // 查找学生
    const student = await User.findById(studentId);
    if (!student || student.role !== USER_ROLES.STUDENT) {
      return error(res, '学生不存在', 404);
    }

    // 权限检查（老师只能查看自己班级的学生）
    if (currentUser.role === USER_ROLES.TEACHER) {
      if (!currentUser.managedClasses || !currentUser.managedClasses.includes(student.class)) {
        return error(res, '无权限查看该学生信息', 403);
      }
    }

    // 计算日期范围（基于weekOffset）
    const today = new Date();
    const offset = parseInt(weekOffset) || 0;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - today.getDay() + 1 + (offset * 7)); // 本周周一
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6); // 本周周日
    endDate.setHours(23, 59, 59, 999);

    // 获取该学生这周的所有订单
    const orders = await Order.find({
      user: studentId,
      orderDate: { $gte: startDate, $lte: endDate },
      status: { $in: [ORDER_STATUS.PAID, ORDER_STATUS.PREPARING, ORDER_STATUS.READY, ORDER_STATUS.COMPLETED] }
    }).populate('items.dish', 'name category nutrition').sort({ orderDate: 1 });

    // 初始化每天每餐的数据结构
    const weekData = [];
    const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    
    // 格式化本地日期为 YYYY-MM-DD
    const formatLocalDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);  // 修复：使用 currentDate.getDate() 而不是 startDate.getDate()
      
      weekData.push({
        date: formatLocalDate(currentDate),  // 修复：使用本地日期格式化
        dayName: dayNames[i],
        breakfast: { hasOrder: false, calories: 0, protein: 0, carbs: 0, fat: 0, dishes: [] },
        lunch: { hasOrder: false, calories: 0, protein: 0, carbs: 0, fat: 0, dishes: [] },
        dinner: { hasOrder: false, calories: 0, protein: 0, carbs: 0, fat: 0, dishes: [] },
        total: { calories: 0, protein: 0, carbs: 0, fat: 0 }
      });
    }

    // 填充订单数据
    orders.forEach(order => {
      const orderDate = new Date(order.orderDate);
      const dayIndex = Math.floor((orderDate - startDate) / (1000 * 60 * 60 * 24));
      
      if (dayIndex >= 0 && dayIndex < 7) {
        const mealType = order.mealType || 'lunch'; // breakfast, lunch, dinner
        const dayData = weekData[dayIndex];
        const mealData = dayData[mealType];

        if (mealData) {
          mealData.hasOrder = true;
          
          // 计算这一餐的营养总和
          order.items.forEach(item => {
            if (item.dish && item.dish.nutrition) {
              const nutrition = item.dish.nutrition;
              const quantity = item.quantity || 1;
              
              mealData.calories += (nutrition.calories || 0) * quantity;
              mealData.protein += (nutrition.protein || 0) * quantity;
              mealData.carbs += (nutrition.carbs || 0) * quantity;
              mealData.fat += (nutrition.fat || 0) * quantity;
              
              mealData.dishes.push({
                name: item.dish.name,
                quantity: quantity,
                nutrition: {
                  calories: (nutrition.calories || 0) * quantity,
                  protein: (nutrition.protein || 0) * quantity,
                  carbs: (nutrition.carbs || 0) * quantity,
                  fat: (nutrition.fat || 0) * quantity
                }
              });
            }
          });

          // 更新当天总计
          dayData.total.calories += mealData.calories;
          dayData.total.protein += mealData.protein;
          dayData.total.carbs += mealData.carbs;
          dayData.total.fat += mealData.fat;
        }
      }
    });

    // 计算周总计和平均值
    const weekTotal = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      mealCount: 0
    };

    weekData.forEach(day => {
      weekTotal.calories += day.total.calories;
      weekTotal.protein += day.total.protein;
      weekTotal.carbs += day.total.carbs;
      weekTotal.fat += day.total.fat;
      
      if (day.breakfast.hasOrder) weekTotal.mealCount++;
      if (day.lunch.hasOrder) weekTotal.mealCount++;
      if (day.dinner.hasOrder) weekTotal.mealCount++;
    });

    const weekAverage = {
      calories: weekTotal.mealCount > 0 ? Math.round(weekTotal.calories / weekTotal.mealCount) : 0,
      protein: weekTotal.mealCount > 0 ? Math.round(weekTotal.protein / weekTotal.mealCount) : 0,
      carbs: weekTotal.mealCount > 0 ? Math.round(weekTotal.carbs / weekTotal.mealCount) : 0,
      fat: weekTotal.mealCount > 0 ? Math.round(weekTotal.fat / weekTotal.mealCount) : 0
    };

    // 格式化本地日期为 YYYY-MM-DD（复用上面的函数逻辑）
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    success(res, {
      student: {
        id: student._id,
        name: student.name,
        studentId: student.studentId,
        class: student.class,
        grade: student.grade
      },
      dateRange: {
        start: formatDate(startDate),
        end: formatDate(endDate),
        weekOffset: offset
      },
      weekData,
      weekTotal,
      weekAverage
    });
  } catch (err) {
    console.error('Get student weekly nutrition error:', err);
    error(res, '获取学生营养数据失败', 500);
  }
};

