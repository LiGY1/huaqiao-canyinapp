const chalk = require('chalk');
const NutritionRecord = require('../../models/NutritionRecord');
const Order = require('../../models/Order');
const AIReport = require('../../models/AIReport');
const AIChatHistory = require('../../models/AIChatHistory');
const { success, error } = require('../../utils/responseFormatter');
const { getStartOfDay, getEndOfDay, getWeekRange, getMonthRange, formatDate } = require('../../utils/dateUtils');
const axios = require('axios');
const DIFY_CONFIG = require('../../config/dify');

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
        $lte: todayEnd
      }
    });

    const mealStatus = {
      breakfast: false,
      lunch: false,
      dinner: false
    };

    if (record && record.meals && record.meals.length > 0) {
      // 从营养记录的meals中提取餐次
      record.meals.forEach(meal => {
        if (meal.mealType === 'breakfast') {
          mealStatus.breakfast = true;
        } else if (meal.mealType === 'lunch') {
          mealStatus.lunch = true;
        } else if (meal.mealType === 'dinner') {
          mealStatus.dinner = true;
        }
      });

      console.log('✅ 从营养记录获取餐次状态:', mealStatus);
      return success(res, {
        date: formatDate(today),
        ...mealStatus
      });
    }

    // 方法2：如果营养记录中没有，从订单中获取
    // 使用日期字符串比较，避免时区问题
    // 获取今天的本地日期字符串（YYYY-MM-DD）
    const todayLocal = new Date();
    const todayLocalStr = `${todayLocal.getFullYear()}-${String(todayLocal.getMonth() + 1).padStart(2, '0')}-${String(todayLocal.getDate()).padStart(2, '0')}`;
    
    // 获取最近3天的订单（考虑时区问题，扩展查询范围）
    const threeDaysAgo = new Date(todayStart);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 2); // 向前2天，确保包含所有今天的订单
    
    const recentOrders = await Order.find({
      user: userId,
      $or: [
        { orderDate: { $gte: threeDaysAgo } },
        { scheduledDate: { $gte: threeDaysAgo } }
      ],
      status: { $in: ['paid', 'preparing', 'ready', 'completed'] }
    }).sort({ orderDate: -1 });
    
    // 过滤出今天的订单（比较日期字符串）
    // 将订单日期转换为本地日期字符串进行比较
    const orders = recentOrders.filter(order => {
      if (!order.orderDate && !order.scheduledDate) return false;
      
      // 将订单日期转换为本地日期字符串
      const getLocalDateStr = (date) => {
        if (!date) return null;
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const orderDateLocalStr = getLocalDateStr(order.orderDate);
      const scheduledDateLocalStr = getLocalDateStr(order.scheduledDate);
      
      // 匹配今天的本地日期
      return orderDateLocalStr === todayLocalStr || scheduledDateLocalStr === todayLocalStr;
    });

    orders.forEach(order => {
      if (order.mealType === 'breakfast') {
        mealStatus.breakfast = true;
      } else if (order.mealType === 'lunch') {
        mealStatus.lunch = true;
      } else if (order.mealType === 'dinner') {
        mealStatus.dinner = true;
      }
    });

    console.log('✅ 从订单获取餐次状态:', mealStatus, `(找到${orders.length}个订单)`);
    console.log('📅 今天本地日期:', todayLocalStr);
    if (orders.length > 0) {
      console.log('📋 订单详情:', orders.map(o => ({
        mealType: o.mealType,
        orderDate: o.orderDate ? new Date(o.orderDate).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) : null,
        scheduledDate: o.scheduledDate ? new Date(o.scheduledDate).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) : null,
        status: o.status
      })));
    }
    
    success(res, {
      date: todayLocalStr,
      ...mealStatus
    });
  } catch (err) {
    console.error('获取餐次状态失败:', err);
    error(res, '获取餐次状态失败', 500);
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
        $lte: todayEnd
      }
    });

    const targetCalories = req.user.targetCalories || 2000;
    const targetProtein = 75;
    const targetFat = 60;
    const targetCarbs = 250;
    const targetFiber = 25;

    const intake = record ? record.intake : {
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      fiber: 0,
      vitaminC: 0,
      iron: 0
    };

    // 从订单中获取餐次信息（始终从订单获取，确保数据最新）
    const todayLocal = new Date();
    const todayLocalStr = `${todayLocal.getFullYear()}-${String(todayLocal.getMonth() + 1).padStart(2, '0')}-${String(todayLocal.getDate()).padStart(2, '0')}`;
    
    const threeDaysAgo = new Date(todayStart);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 2);
    
    const recentOrders = await Order.find({
      user: userId,
      $or: [
        { orderDate: { $gte: threeDaysAgo } },
        { scheduledDate: { $gte: threeDaysAgo } }
      ],
      status: { $in: ['paid', 'preparing', 'ready', 'completed'] }
    }).sort({ orderDate: -1 });
    
    const getLocalDateStr = (date) => {
      if (!date) return null;
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const todayOrders = recentOrders.filter(order => {
      if (!order.orderDate && !order.scheduledDate) return false;
      const orderDateLocalStr = getLocalDateStr(order.orderDate);
      const scheduledDateLocalStr = getLocalDateStr(order.scheduledDate);
      return orderDateLocalStr === todayLocalStr || scheduledDateLocalStr === todayLocalStr;
    });
    
    // 构建 meals 数组（始终从订单构建，确保完整性）
    const meals = todayOrders.map(order => ({
      order: order._id,
      mealType: order.mealType,
      time: order.orderDate || order.scheduledDate,
      items: order.items.map(item => item.dishName)
    }));
    
    console.log('✅ 从订单构建餐次信息:', meals.length, '个餐次', meals.map(m => m.mealType));

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
      meals: meals // 返回餐次信息
    });
  } catch (err) {
    console.error(err);
    error(res, '获取今日营养失败', 500);
  }
};

exports.getWeeklyReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const { start, end } = getWeekRange();

    const records = await NutritionRecord.find({
      user: userId,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const dailyCalories = new Array(7).fill(0);
    const dailyProtein = new Array(7).fill(0);
    const dailyFat = new Array(7).fill(0);
    const dailyCarbs = new Array(7).fill(0);
    const dailyFiber = new Array(7).fill(0);

    records.forEach(record => {
      const dayIndex = new Date(record.date).getDay();
      const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;

      dailyCalories[adjustedIndex] = record.intake.calories || 0;
      dailyProtein[adjustedIndex] = record.intake.protein || 0;
      dailyFat[adjustedIndex] = record.intake.fat || 0;
      dailyCarbs[adjustedIndex] = record.intake.carbs || 0;
      dailyFiber[adjustedIndex] = record.intake.fiber || 0;
    });

    const avgCalories = Math.round(dailyCalories.reduce((a, b) => a + b, 0) / 7);
    const targetCalories = req.user.targetCalories || 2000;

    success(res, {
      weekRange: `${formatDate(start)} 至 ${formatDate(end)}`,
      dailyCalories,
      dailyProtein,
      dailyFat,
      dailyCarbs,
      dailyFiber,
      days,
      avgCalories,
      targetCalories,
      calorieDeficit: avgCalories * 7 - targetCalories * 7,
      avgSugar: 45,
      nutritionScore: {
        carbs: Math.min(100, Math.round((avgCalories / targetCalories) * 100)),
        protein: Math.min(100, Math.round((dailyProtein.reduce((a, b) => a + b, 0) / 7 / 75) * 100)),
        fat: Math.min(100, Math.round((dailyFat.reduce((a, b) => a + b, 0) / 7 / 60) * 100)),
        fiber: Math.min(100, Math.round((dailyFiber.reduce((a, b) => a + b, 0) / 7 / 25) * 100)),
        vitamin: 80
      }
    });
  } catch (err) {
    console.error(err);
    error(res, '获取周报失败', 500);
  }
};

exports.getMonthlyReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const { start, end } = getMonthRange();

    const records = await NutritionRecord.find({
      user: userId,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    const daysInMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
    const dailyCalories = new Array(daysInMonth).fill(0);

    records.forEach(record => {
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
      targetCalories
    });
  } catch (err) {
    console.error(err);
    error(res, '获取月报失败', 500);
  }
};

function parseAIResponse(aiText) {
  const lines = aiText.split('\n').filter(line => line.trim());

  const result = {
    summary: '',
    highlights: [],
    suggestions: [],
    nextPlan: '',
    fullText: aiText
  };

  let currentSection = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.includes('总体评价') || trimmed.includes('总结')) {
      currentSection = 'summary';
      continue;
    } else if (trimmed.includes('亮点') || trimmed.includes('成就') || trimmed.includes('进步')) {
      currentSection = 'highlights';
      continue;
    } else if (trimmed.includes('建议') || trimmed.includes('改进')) {
      currentSection = 'suggestions';
      continue;
    } else if (trimmed.includes('下周') || trimmed.includes('下月') || trimmed.includes('计划') || trimmed.includes('目标')) {
      currentSection = 'nextPlan';
      continue;
    }

    if (currentSection === 'summary' && trimmed) {
      result.summary += (result.summary ? ' ' : '') + trimmed;
    } else if (currentSection === 'highlights' && (trimmed.startsWith('') || trimmed.startsWith('') || trimmed.match(/^\d+\./))) {
      result.highlights.push(trimmed);
    } else if (currentSection === 'suggestions' && (trimmed.match(/^\d+\./) || trimmed.startsWith('-'))) {
      result.suggestions.push(trimmed.replace(/^\d+\.\s*/, '').replace(/^-\s*/, ''));
    } else if (currentSection === 'nextPlan' && trimmed) {
      result.nextPlan += (result.nextPlan ? ' ' : '') + trimmed;
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
    console.log('调用 Dify API...');
    console.log('API URL:', DIFY_CONFIG.apiUrl);
    console.log('超时设置:', DIFY_CONFIG.timeout, 'ms');

    const response = await axios.post(
      DIFY_CONFIG.apiUrl,
      {
        inputs: {},
        query: prompt,
        response_mode: 'blocking',
        conversation_id: '',
        user: 'student-nutrition-report'
      },
      {
        headers: {
          'Authorization': `Bearer ${DIFY_CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: DIFY_CONFIG.timeout
      }
    );

    console.log(chalk.green('[Dify] API 调用成功'));

    const result = response.data;
    let aiText = '';

    if (result.answer) {
      aiText = result.answer;
    } else if (result.data && result.data.outputs) {
      aiText = result.data.outputs.text || result.data.outputs.result;
    } else {
      aiText = JSON.stringify(result);
    }

    console.log('AI 响应长度:', aiText.length, '字符');

    return {
      success: true,
      text: aiText,
      conversationId: result.conversation_id || ''
    };
  } catch (err) {
    console.error(chalk.red('Dify API 调用失败:'), err.message);
    
    // 详细错误日志
    if (err.code === 'ECONNREFUSED') {
      console.error(chalk.red('  原因: 连接被拒绝 - Dify 服务可能未运行'));
    } else if (err.code === 'ETIMEDOUT' || err.message.includes('timeout')) {
      console.error(chalk.red('  原因: 连接超时 - Dify 服务不可达'));
    } else if (err.code === 'ENOTFOUND') {
      console.error(chalk.red('  原因: 域名/IP 无法解析'));
    } else if (err.response) {
      console.error(chalk.red('  HTTP状态:'), err.response.status);
      console.error(chalk.red('  错误详情:'), err.response.data);
    }

    return {
      success: false,
      error: err.message,
      errorCode: err.code
    };
  }
}

exports.generateAIReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const { reportType = 'weekly' } = req.body;

    let dateRange, records, dataSummary, prompt;

    if (reportType === 'weekly') {

      const { start, end } = getWeekRange();
      dateRange = { start, end };

      records = await NutritionRecord.find({
        user: userId,
        date: { $gte: start, $lte: end }
      }).sort({ date: 1 });

      const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
      const dailyCalories = new Array(7).fill(0);
      const dailyProtein = new Array(7).fill(0);
      const dailyFat = new Array(7).fill(0);
      const dailyCarbs = new Array(7).fill(0);
      const dailyFiber = new Array(7).fill(0);

      records.forEach(record => {
        const dayIndex = new Date(record.date).getDay();
        const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;

        dailyCalories[adjustedIndex] = record.intake.calories || 0;
        dailyProtein[adjustedIndex] = record.intake.protein || 0;
        dailyFat[adjustedIndex] = record.intake.fat || 0;
        dailyCarbs[adjustedIndex] = record.intake.carbs || 0;
        dailyFiber[adjustedIndex] = record.intake.fiber || 0;
      });

      const avgCalories = Math.round(dailyCalories.reduce((a, b) => a + b, 0) / 7);
      const avgProtein = Math.round(dailyProtein.reduce((a, b) => a + b, 0) / 7);
      const avgFat = Math.round(dailyFat.reduce((a, b) => a + b, 0) / 7);
      const avgCarbs = Math.round(dailyCarbs.reduce((a, b) => a + b, 0) / 7);
      const avgFiber = Math.round(dailyFiber.reduce((a, b) => a + b, 0) / 7);
      const targetCalories = req.user.targetCalories || 2000;

      dataSummary = {
        avgCalories,
        avgProtein,
        avgFat,
        avgCarbs,
        avgFiber,
        totalDays: 7,
        targetCalories,
        nutritionScore: {
          carbs: Math.min(100, Math.round((avgCalories / targetCalories) * 100)),
          protein: Math.min(100, Math.round((avgProtein / 75) * 100)),
          fat: Math.min(100, Math.round((avgFat / 60) * 100)),
          fiber: Math.min(100, Math.round((avgFiber / 25) * 100)),
          vitamin: 80
        }
      };

      const dailyDataStr = days.map((day, idx) =>
        `${day}: 热量${dailyCalories[idx]}千卡, 蛋白质${dailyProtein[idx]}g, 脂肪${dailyFat[idx]}g, 碳水${dailyCarbs[idx]}g, 纤维${dailyFiber[idx]}g`
      ).join('\n');

      prompt = DIFY_CONFIG.weeklyPrompt
        .replace('{avgCalories}', avgCalories)
        .replace('{targetCalories}', targetCalories)
        .replace('{avgProtein}', avgProtein)
        .replace('{avgFat}', avgFat)
        .replace('{avgCarbs}', avgCarbs)
        .replace('{avgFiber}', avgFiber)
        .replace('{totalDays}', 7)
        .replace('{dateRange}', `${formatDate(start)} 至 ${formatDate(end)}`)
        .replace('{dailyData}', dailyDataStr)
        .replace('{scoreCarbs}', dataSummary.nutritionScore.carbs)
        .replace('{scoreProtein}', dataSummary.nutritionScore.protein)
        .replace('{scoreFat}', dataSummary.nutritionScore.fat)
        .replace('{scoreFiber}', dataSummary.nutritionScore.fiber)
        .replace('{scoreVitamin}', dataSummary.nutritionScore.vitamin);

      prompt = `STU1_FE_BG,${prompt}`;

    } else {

      const { start, end } = getMonthRange();
      dateRange = { start, end };

      records = await NutritionRecord.find({
        user: userId,
        date: { $gte: start, $lte: end }
      }).sort({ date: 1 });

      const daysInMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
      const dailyCalories = new Array(daysInMonth).fill(0);
      const dailyProtein = new Array(daysInMonth).fill(0);
      const dailyFat = new Array(daysInMonth).fill(0);
      const dailyCarbs = new Array(daysInMonth).fill(0);
      const dailyFiber = new Array(daysInMonth).fill(0);

      records.forEach(record => {
        const day = new Date(record.date).getDate();
        dailyCalories[day - 1] = record.intake.calories || 0;
        dailyProtein[day - 1] = record.intake.protein || 0;
        dailyFat[day - 1] = record.intake.fat || 0;
        dailyCarbs[day - 1] = record.intake.carbs || 0;
        dailyFiber[day - 1] = record.intake.fiber || 0;
      });

      const totalCalories = dailyCalories.reduce((a, b) => a + b, 0);
      const avgCalories = Math.round(totalCalories / daysInMonth);
      const avgProtein = Math.round(dailyProtein.reduce((a, b) => a + b, 0) / daysInMonth);
      const avgFat = Math.round(dailyFat.reduce((a, b) => a + b, 0) / daysInMonth);
      const avgCarbs = Math.round(dailyCarbs.reduce((a, b) => a + b, 0) / daysInMonth);
      const avgFiber = Math.round(dailyFiber.reduce((a, b) => a + b, 0) / daysInMonth);
      const targetCalories = req.user.targetCalories || 2000;

      dataSummary = {
        avgCalories,
        avgProtein,
        avgFat,
        avgCarbs,
        avgFiber,
        totalDays: daysInMonth,
        targetCalories,
        nutritionScore: {
          carbs: Math.min(100, Math.round((avgCalories / targetCalories) * 100)),
          protein: Math.min(100, Math.round((avgProtein / 75) * 100)),
          fat: Math.min(100, Math.round((avgFat / 60) * 100)),
          fiber: Math.min(100, Math.round((avgFiber / 25) * 100)),
          vitamin: 80
        }
      };

      const weeks = Math.ceil(daysInMonth / 7);
      const weeklyTrend = [];
      for (let w = 0; w < weeks; w++) {
        const weekStart = w * 7;
        const weekEnd = Math.min((w + 1) * 7, daysInMonth);
        const weekCalories = dailyCalories.slice(weekStart, weekEnd);
        const weekAvg = Math.round(weekCalories.reduce((a, b) => a + b, 0) / weekCalories.length);
        weeklyTrend.push(`第${w + 1}周平均: ${weekAvg}千卡`);
      }

      prompt = DIFY_CONFIG.monthlyPrompt
        .replace('{avgCalories}', avgCalories)
        .replace('{targetCalories}', targetCalories)
        .replace('{avgProtein}', avgProtein)
        .replace('{avgFat}', avgFat)
        .replace('{avgCarbs}', avgCarbs)
        .replace('{avgFiber}', avgFiber)
        .replace('{totalDays}', daysInMonth)
        .replace('{dateRange}', `${formatDate(start)} 至 ${formatDate(end)}`)
        .replace('{weeklyTrend}', weeklyTrend.join('\n'))
        .replace('{scoreCarbs}', dataSummary.nutritionScore.carbs)
        .replace('{scoreProtein}', dataSummary.nutritionScore.protein)
        .replace('{scoreFat}', dataSummary.nutritionScore.fat)
        .replace('{scoreFiber}', dataSummary.nutritionScore.fiber)
        .replace('{scoreVitamin}', dataSummary.nutritionScore.vitamin);

      prompt = `STU1_FE_BG,${prompt}`;
    }

    const report = new AIReport({
      student: userId,
      reportType,
      dateRange,
      dataSummary,
      status: 'generating'
    });

    await report.save();

    const difyResult = await callDifyAPI(prompt);

    if (difyResult.success) {

      const parsedContent = parseAIResponse(difyResult.text);

      report.content = parsedContent;
      report.conversationId = difyResult.conversationId;
      report.status = 'completed';
      await report.save();

      success(res, {
        reportId: report._id,
        reportType,
        dateRange,
        content: parsedContent,
        dataSummary,
        createdAt: report.createdAt
      });
    } else {

      report.status = 'failed';
      report.errorMessage = difyResult.error;
      await report.save();

      // 返回更友好的错误信息
      let errorMessage = 'AI报告生成失败';
      if (difyResult.errorCode === 'ECONNREFUSED' || difyResult.errorCode === 'ETIMEDOUT') {
        errorMessage = 'AI服务暂时不可用，请稍后重试或联系管理员检查Dify服务状态';
      } else if (difyResult.errorCode === 'ENOTFOUND') {
        errorMessage = 'AI服务配置错误，请联系管理员';
      }

      error(res, errorMessage, 503); // 503 Service Unavailable
    }

  } catch (err) {
    console.error('生成AI报告错误:', err);
    error(res, '生成AI报告失败', 500);
  }
};

exports.getAIReportHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { reportType, limit = 10, offset = 0 } = req.query;

    const query = {
      student: userId,
      status: 'completed'
    };

    if (reportType && (reportType === 'weekly' || reportType === 'monthly')) {
      query.reportType = reportType;
    }

    const reports = await AIReport.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select('-__v');

    const total = await AIReport.countDocuments(query);

    success(res, {
      reports,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: total > parseInt(offset) + parseInt(limit)
    });

  } catch (err) {
    console.error('获取报告历史错误:', err);
    error(res, '获取报告历史失败', 500);
  }
};

exports.getAIReportById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { reportId } = req.params;

    const report = await AIReport.findOne({
      _id: reportId,
      student: userId
    });

    if (!report) {
      return error(res, '报告不存在', 404);
    }

    success(res, report);

  } catch (err) {
    console.error('获取报告详情错误:', err);
    error(res, '获取报告详情失败', 500);
  }
};

exports.saveChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      conversationId,
      sender,
      userMessage,
      aiMessage,
      timestamp,
      metadata,
      summary,
      tags,
      files
    } = req.body;

    if (!sender || (sender !== 'user' && sender !== 'ai')) {
      return error(res, '无效的发送者类型', 400);
    }

    const chatHistory = new AIChatHistory({
      user: userId,
      source: 'student',
      conversationId: conversationId || '',
      sender,
      userMessage: userMessage || '',
      aiMessage: aiMessage || '',
      files: files || [],
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      metadata: metadata || {},
      summary: summary || '',
      tags: tags || [],
      isFavorite: false
    });

    await chatHistory.save();

    console.log(chalk.green(`[学生] 聊天记录保存成功: ${chatHistory._id} (文件数: ${(files || []).length})`));

    const savedChat = await AIChatHistory.findById(chatHistory._id);
    console.log(' 验证保存后的数据:', {
      hasFiles: !!savedChat.files,
      filesLength: savedChat.files?.length || 0,
      files: savedChat.files
    });

    success(res, {
      chatId: chatHistory._id,
      message: '聊天记录保存成功'
    });

  } catch (err) {
    console.error('保存聊天记录错误:', err);
    error(res, '保存聊天记录失败', 500);
  }
};

exports.saveChatHistoryBatch = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return error(res, '消息数组不能为空', 400);
    }

    const chatHistories = messages.map(msg => ({
      user: userId,
      source: 'student',
      conversationId: msg.conversationId || '',
      sender: msg.sender,
      userMessage: msg.userMessage || '',
      aiMessage: msg.aiMessage || '',
      files: msg.files || [],
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
      metadata: msg.metadata || {},
      summary: msg.summary || '',
      tags: msg.tags || [],
      isFavorite: false
    }));

    const result = await AIChatHistory.insertMany(chatHistories);

    success(res, {
      count: result.length,
      message: `成功保存${result.length}条聊天记录`
    });

  } catch (err) {
    console.error('批量保存聊天记录错误:', err);
    error(res, '批量保存聊天记录失败', 500);
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      conversationId,
      limit = 50,
      offset = 0,
      startDate,
      endDate,
      isFavorite
    } = req.query;

    const query = {
      user: userId,
      source: 'student'
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
      query.isFavorite = isFavorite === 'true' || isFavorite === true;
    }

    const chatHistory = await AIChatHistory.find(query)
      .sort({ timestamp: 1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select('-__v');

    const total = await AIChatHistory.countDocuments(query);

    console.log(' 获取聊天记录:', {
      total,
      返回数量: chatHistory.length,
      示例数据: chatHistory.length > 0 ? {
        id: chatHistory[0]._id,
        hasFiles: !!chatHistory[0].files,
        filesCount: chatHistory[0].files?.length || 0,
        files: chatHistory[0].files
      } : null
    });

    success(res, {
      chatHistory,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: total > parseInt(offset) + parseInt(limit)
    });

  } catch (err) {
    console.error('获取聊天记录错误:', err);
    error(res, '获取聊天记录失败', 500);
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
          source: 'student',
          conversationId: { $ne: '' }
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          messageCount: { $sum: 1 },
          firstTimestamp: { $min: '$timestamp' },
          lastTimestamp: { $max: '$timestamp' }
        }
      },
      {
        $sort: { lastTimestamp: -1 }
      },
      {
        $skip: parseInt(offset)
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    const totalConversations = await AIChatHistory.distinct('conversationId', {
      user: userId,
      source: 'student',
      conversationId: { $ne: '' }
    });

    success(res, {
      conversations,
      total: totalConversations.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: totalConversations.length > parseInt(offset) + parseInt(limit)
    });

  } catch (err) {
    console.error('获取对话列表错误:', err);
    error(res, '获取对话列表失败', 500);
  }
};

exports.deleteChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId } = req.params;

    const chatHistory = await AIChatHistory.findOneAndDelete({
      _id: chatId,
      user: userId,
      source: 'student'
    });

    if (!chatHistory) {
      return error(res, '聊天记录不存在', 404);
    }

    success(res, {
      message: '聊天记录删除成功'
    });

  } catch (err) {
    console.error('删除聊天记录错误:', err);
    error(res, '删除聊天记录失败', 500);
  }
};

exports.deleteConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    const result = await AIChatHistory.deleteMany({
      user: userId,
      source: 'student',
      conversationId: conversationId
    });

    success(res, {
      deletedCount: result.deletedCount,
      message: `成功删除${result.deletedCount}条聊天记录`
    });

  } catch (err) {
    console.error('删除对话错误:', err);
    error(res, '删除对话失败', 500);
  }
};

exports.toggleChatFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId } = req.params;

    const chatHistory = await AIChatHistory.findOne({
      _id: chatId,
      user: userId,
      source: 'student'
    });

    if (!chatHistory) {
      return error(res, '聊天记录不存在', 404);
    }

    chatHistory.isFavorite = !chatHistory.isFavorite;
    await chatHistory.save();

    success(res, {
      chatId: chatHistory._id,
      isFavorite: chatHistory.isFavorite,
      message: chatHistory.isFavorite ? '已收藏' : '已取消收藏'
    });

  } catch (err) {
    console.error('切换收藏状态错误:', err);
    error(res, '切换收藏状态失败', 500);
  }
};

exports.clearAllChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await AIChatHistory.deleteMany({
      user: userId,
      source: 'student'
    });

    success(res, {
      deletedCount: result.deletedCount,
      message: `成功清空${result.deletedCount}条聊天记录`
    });

  } catch (err) {
    console.error('清空聊天记录错误:', err);
    error(res, '清空聊天记录失败', 500);
  }
};

// Dify 流式聊天代理（学生端）
exports.streamChat = async (req, res) => {
  try {
    let { inputs, query, conversation_id, user: clientUser } = req.body;
    const userId = req.user._id;

    console.log(chalk.cyan('[学生AI助手] 开始流式对话'));
    console.log('用户ID:', userId);
    console.log('对话ID:', conversation_id);
    console.log('问题:', query);
    console.log('Dify API URL:', DIFY_CONFIG.apiUrl);
    console.log('输入参数:', inputs);

    // 设置 SSE 响应头 - 禁用所有缓冲
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');  // Nginx 不缓冲
    res.setHeader('Transfer-Encoding', 'chunked');  // 分块传输
    
    // 立即发送响应头
    res.flushHeaders();

    let response;
    
    // 如果 conversation_id 为空，直接发送请求，不进行重试
    if (!conversation_id || conversation_id.trim() === '') {
      console.log(chalk.cyan('[学生AI助手] 开始新对话'));
      response = await axios.post(
        DIFY_CONFIG.apiUrl,
        {
          inputs: inputs || {},
          query: query,
          response_mode: 'streaming',
          conversation_id: '',
          user: clientUser || `student-${userId}`
        },
        {
          headers: {
            'Authorization': `Bearer ${DIFY_CONFIG.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream'
          },
          timeout: DIFY_CONFIG.timeout,
          responseType: 'stream'
        }
      );
    } else {
      // 有 conversation_id，先尝试使用它
      try {
        response = await axios.post(
          DIFY_CONFIG.apiUrl,
          {
            inputs: inputs || {},
            query: query,
            response_mode: 'streaming',
            conversation_id: conversation_id,
            user: clientUser || `student-${userId}`
          },
          {
            headers: {
              'Authorization': `Bearer ${DIFY_CONFIG.apiKey}`,
              'Content-Type': 'application/json',
              'Accept': 'text/event-stream'
            },
            timeout: DIFY_CONFIG.timeout,
            responseType: 'stream'
          }
        );
      } catch (firstError) {
        // 如果是 404，说明对话不存在，重试不带 conversation_id
        if (firstError.response?.status === 404) {
          console.log(chalk.yellow('[学生AI助手] 对话不存在(404)，开始新对话'));
          
          // 第二次尝试：不带 conversation_id，开始新对话
          response = await axios.post(
            DIFY_CONFIG.apiUrl,
            {
              inputs: inputs || {},
              query: query,
              response_mode: 'streaming',
              conversation_id: '',
              user: clientUser || `student-${userId}`
            },
            {
              headers: {
                'Authorization': `Bearer ${DIFY_CONFIG.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream'
              },
              timeout: DIFY_CONFIG.timeout,
              responseType: 'stream'
            }
          );
        } else {
          // 其他错误，抛出
          throw firstError;
        }
      }
    }

    console.log(chalk.green('[学生AI助手] Dify API 连接成功'));

    // 将 Dify 的流式响应转发给客户端
    let chunkCount = 0;
    let totalBytes = 0;
    
    response.data.on('data', (chunk) => {
      chunkCount++;
      totalBytes += chunk.length;
      const chunkStr = chunk.toString('utf-8');
      console.log(chalk.cyan(`[学生AI助手] 收到数据块 #${chunkCount} (${chunk.length} bytes) - 立即转发`));
      
      // 如果包含error事件，显示完整内容
      if (chunkStr.includes('"event": "error"') || chunkStr.includes('"event":"error"')) {
        console.log(chalk.red('⚠️ 检测到错误事件，完整内容：'));
        console.log(chalk.red(chunkStr));
      } else {
        console.log(chalk.gray(chunkStr.substring(0, 200)));
      }
      
      // 立即写入并刷新缓冲区
      res.write(chunk);
      
      // 尝试立即刷新（如果可用）
      if (typeof res.flush === 'function') {
        res.flush();
      }
    });

    response.data.on('end', () => {
      console.log(chalk.green(`[学生AI助手] 流式响应结束 - 共收到 ${chunkCount} 个数据块，总计 ${totalBytes} bytes`));
      res.end();
    });

    response.data.on('error', (err) => {
      console.error(chalk.red('[学生AI助手] 流式响应错误:'), err);
      
      // 详细错误诊断
      if (err.code === 'ECONNRESET') {
        console.error(chalk.red('  原因: Dify 服务连接被重置 - 可能服务不稳定或已关闭'));
      } else if (err.code === 'ETIMEDOUT') {
        console.error(chalk.red('  原因: Dify 服务响应超时'));
      } else if (err.code === 'ECONNREFUSED') {
        console.error(chalk.red('  原因: Dify 服务拒绝连接'));
      }
      
      // 发送友好的错误消息
      const errorMessage = err.code === 'ECONNRESET' 
        ? 'AI 服务连接中断，请稍后重试' 
        : 'AI 服务暂时不可用';
      
      res.write(`data: ${JSON.stringify({ 
        event: 'error', 
        message: errorMessage,
        details: err.message,
        code: err.code 
      })}\n\n`);
      res.end();
    });

  } catch (err) {
    console.error(chalk.red('[学生AI助手] 流式对话失败:'), err.message);
    
    // 详细错误诊断
    let userMessage = 'AI 服务暂时不可用，请稍后重试';
    
    if (err.code === 'ECONNREFUSED') {
      console.error(chalk.red('  原因: 连接被拒绝 - Dify 服务未运行'));
      userMessage = 'AI 服务未启动，请联系管理员';
    } else if (err.code === 'ETIMEDOUT' || err.message.includes('timeout')) {
      console.error(chalk.red('  原因: 连接超时 - Dify 服务不可达'));
      console.error(chalk.yellow(`  建议: 检查 DIFY_API_URL 配置: ${DIFY_CONFIG.apiUrl}`));
      userMessage = 'AI 服务连接超时，请检查网络或稍后重试';
    } else if (err.code === 'ENOTFOUND') {
      console.error(chalk.red('  原因: 域名/IP 无法解析'));
      userMessage = 'AI 服务配置错误，请联系管理员';
    } else if (err.code === 'ECONNRESET') {
      console.error(chalk.red('  原因: 连接被重置 - Dify 服务不稳定'));
      userMessage = 'AI 服务连接中断，请重试';
    } else if (err.response) {
      console.error(chalk.red('  HTTP状态:'), err.response.status);
      console.error(chalk.red('  错误详情:'), err.response.data);
      if (err.response.status === 404) {
        userMessage = 'AI 服务接口不存在，请联系管理员';
      } else if (err.response.status === 401 || err.response.status === 403) {
        userMessage = 'AI 服务认证失败，请联系管理员';
      }
    }

    // 如果还没有发送响应头，发送错误响应
    if (!res.headersSent) {
      res.status(503).json({  // 503 Service Unavailable
        success: false,
        message: userMessage,
        error: err.message,
        code: err.code
      });
    } else {
      // 如果已经发送了响应头，通过 SSE 发送错误事件
      res.write(`data: ${JSON.stringify({ 
        event: 'error', 
        message: userMessage,
        details: err.message,
        code: err.code
      })}\n\n`);
      res.end();
    }
  }
};

