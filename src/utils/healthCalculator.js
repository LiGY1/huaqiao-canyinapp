const NutritionRecord = require('../models/NutritionRecord');
const PhysicalExam = require('../models/PhysicalExam');
const Order = require('../models/Order');
const { ORDER_STATUS } = require('../config/constants');

async function updateStudentHealthData(studentId, studentInfo = {}) {
  try {

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    const weekRecords = await NutritionRecord.find({
      user: studentId,
      date: { $gte: startDate, $lte: endDate }
    });

    if (weekRecords.length === 0) {
      console.log(`学生 ${studentId} 最近7天无饮食记录，跳过更新`);
      return null;
    }

    const avgCalories = weekRecords.reduce((sum, r) => sum + r.intake.calories, 0) / weekRecords.length;
    const avgProtein = weekRecords.reduce((sum, r) => sum + r.intake.protein, 0) / weekRecords.length;

    const totalMeals = weekRecords.reduce((sum, r) => sum + r.meals.length, 0);
    const mealFrequency = totalMeals / 21;

    let nutritionScore = 0;

    const mealRegularityScore = Math.min(40, Math.round(mealFrequency * 40));
    nutritionScore += mealRegularityScore;

    const targetCalories = 2200;
    const calorieRatio = avgCalories / targetCalories;
    let calorieScore = 0;

    if (calorieRatio >= 0.75 && calorieRatio <= 1.15) {
      calorieScore = 35;
    } else if (calorieRatio >= 0.60 && calorieRatio <= 1.30) {
      calorieScore = 28;
    } else if (calorieRatio >= 0.45 && calorieRatio <= 1.50) {
      calorieScore = 20;
    } else if (calorieRatio >= 0.30) {
      calorieScore = 12;
    } else {
      calorieScore = 5;
    }
    nutritionScore += calorieScore;

    const targetProtein = 70;
    const proteinRatio = avgProtein / targetProtein;
    let proteinScore = 0;

    if (proteinRatio >= 0.80 && proteinRatio <= 1.20) {
      proteinScore = 25;
    } else if (proteinRatio >= 0.60 && proteinRatio <= 1.40) {
      proteinScore = 20;
    } else if (proteinRatio >= 0.40 && proteinRatio <= 1.60) {
      proteinScore = 15;
    } else if (proteinRatio >= 0.25) {
      proteinScore = 8;
    } else {
      proteinScore = 3;
    }
    nutritionScore += proteinScore;

    nutritionScore = Math.max(0, Math.min(100, Math.round(nutritionScore)));

    let healthStatus = 'fair';
    if (nutritionScore >= 90) {
      healthStatus = 'excellent';
    } else if (nutritionScore >= 65) {
      healthStatus = 'fair';
    } else {
      healthStatus = 'poor';
    }

    const height = studentInfo.height || 165;
    const baseWeight = studentInfo.weight || 60;

    const targetWeeklyCalories = 2200 * 7;
    const actualWeeklyCalories = avgCalories * 7;
    const calorieBalance = actualWeeklyCalories - targetWeeklyCalories;
    const weightChange = calorieBalance / 7700;

    let newWeight = baseWeight + Math.max(-3, Math.min(5, weightChange));
    newWeight = Math.max(35, Math.min(120, newWeight));
    newWeight = parseFloat(newWeight.toFixed(1));

    const heightInMeters = height / 100;
    const bmi = parseFloat((newWeight / (heightInMeters * heightInMeters)).toFixed(1));

    const examDate = new Date();
    examDate.setHours(10, 0, 0, 0);

    const updatedExam = await PhysicalExam.findOneAndUpdate(
      {
        student: studentId,
        examDate: {
          $gte: new Date(examDate.setHours(0, 0, 0, 0)),
          $lt: new Date(examDate.setHours(23, 59, 59, 999))
        }
      },
      {
        student: studentId,
        examDate: examDate,
        height: height,
        weight: newWeight,
        bmi: bmi,
        healthStatus: healthStatus,
        nutritionScore: nutritionScore,
        heartRate: 70 + Math.floor(Math.random() * 20),
        bloodPressure: {
          systolic: 110 + Math.floor(Math.random() * 20),
          diastolic: 70 + Math.floor(Math.random() * 15)
        },
        notes: `基于最近7天饮食数据自动更新。用餐${totalMeals}次，平均每日${Math.round(avgCalories)}卡路里，营养评分${nutritionScore}分，BMI ${bmi}。`
      },
      {
        upsert: true,
        new: true
      }
    );

    console.log(` 更新学生健康数据: ${studentId} | 评分${nutritionScore} | 体重${newWeight}kg | BMI ${bmi}`);

    return {
      nutritionScore,
      healthStatus,
      weight: newWeight,
      bmi,
      totalMeals,
      avgCalories: Math.round(avgCalories)
    };

  } catch (error) {
    console.error('更新学生健康数据失败:', error);
    throw error;
  }
}

async function updateDailyNutritionRecord(studentId, orderDate) {
  try {

    const dayStart = new Date(orderDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(orderDate);
    dayEnd.setHours(23, 59, 59, 999);

    const dayOrders = await Order.find({
      user: studentId,
      orderDate: { $gte: dayStart, $lte: dayEnd },
      status: { $in: [ORDER_STATUS.PAID, ORDER_STATUS.PREPARING, ORDER_STATUS.READY, ORDER_STATUS.COMPLETED] }
    }).sort({ orderDate: 1 });

    if (dayOrders.length === 0) {
      console.log(`学生 ${studentId} 当天无已完成订单`);
      return null;
    }

    const dailyIntake = {
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      fiber: 0,
      vitaminC: 0,
      iron: 0,
      sugar: 0
    };

    const meals = [];

    for (const order of dayOrders) {
      const nutrition = order.totalNutrition || {};

      dailyIntake.calories += nutrition.calories || 0;
      dailyIntake.protein += nutrition.protein || 0;
      dailyIntake.fat += nutrition.fat || 0;
      dailyIntake.carbs += nutrition.carbs || 0;
      dailyIntake.fiber += nutrition.fiber || 0;
      dailyIntake.vitaminC += nutrition.vitaminC || 0;
      dailyIntake.iron += nutrition.iron || 0;
      dailyIntake.sugar += (nutrition.carbs || 0) * 0.1;

      meals.push({
        order: order._id,
        mealType: order.mealType,
        time: order.orderDate,
        items: order.items.map(item => item.dishName)
      });
    }

    const updatedRecord = await NutritionRecord.findOneAndUpdate(
      {
        user: studentId,
        date: dayStart
      },
      {
        user: studentId,
        date: dayStart,
        intake: dailyIntake,
        meals: meals
      },
      {
        upsert: true,
        new: true
      }
    );

    console.log(` 更新每日营养记录: ${studentId} | ${dayStart.toLocaleDateString()} | ${meals.length}餐 | ${Math.round(dailyIntake.calories)}卡`);

    return updatedRecord;

  } catch (error) {
    console.error('更新每日营养记录失败:', error);
    throw error;
  }
}

module.exports = {
  updateStudentHealthData,
  updateDailyNutritionRecord
};

