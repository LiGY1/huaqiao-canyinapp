const chalk = require('chalk');
const User = require('../../models/User');
const Order = require('../../models/Order');
const NutritionRecord = require('../../models/NutritionRecord');
const PhysicalExam = require('../../models/PhysicalExam');
const AIReport = require('../../models/AIReport');
const { success, error, paginated } = require('../../utils/responseFormatter');
const { getStartOfDay, getEndOfDay, getWeekRange, getMonthRange, formatDate } = require('../../utils/dateUtils');
const axios = require('axios');
const DIFY_CONFIG = require('../../config/dify');
const cache = require('../../utils/cache');

exports.getChildNutrition = async (req, res) => {
  try {
    const { childId } = req.params;

    // 🚀 优化：生成缓存键
    const cacheKey = cache.generateKey('parent:child:nutrition', {
      parentId: req.user._id.toString(),
      childId,
      date: formatDate(new Date())
    });

    // 🚀 临时禁用缓存，确保数据实时更新（修复餐次状态问题）
    // 清除旧缓存
    try {
      await cache.del(cacheKey);
      console.log('🗑️  已清除旧缓存');
    } catch (e) {
      console.log('⚠️  清除缓存失败（忽略）:', e.message);
    }

    const parent = await User.findById(req.user._id);
    if (!parent.children.some(id => id.toString() === childId)) {
      return error(res, '无权查看该学生信息', 403);
    }

    const child = await User.findById(childId);
    if (!child) {
      return error(res, '学生不存在', 404);
    }

    const today = new Date();
    const record = await NutritionRecord.findOne({
      user: childId,
      date: {
        $gte: getStartOfDay(today),
        $lte: getEndOfDay(today)
      }
    });

    const targetCalories = child.targetCalories || 2000;
    const intake = record ? record.intake : {
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      fiber: 0
    };

    // 始终从订单中获取餐次信息（确保数据完整）
    const { ORDER_STATUS } = require('../../config/constants');
    
    const todayStart = getStartOfDay(today);
    const todayEnd = getEndOfDay(today);
    
    // 获取今天的本地日期字符串
    const todayLocal = new Date();
    const todayLocalStr = `${todayLocal.getFullYear()}-${String(todayLocal.getMonth() + 1).padStart(2, '0')}-${String(todayLocal.getDate()).padStart(2, '0')}`;
    
    // 获取最近3天的订单（考虑时区问题）
    const threeDaysAgo = new Date(todayStart);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 2);
    
    const recentOrders = await Order.find({
      user: childId,
      $or: [
        { orderDate: { $gte: threeDaysAgo } },
        { scheduledDate: { $gte: threeDaysAgo } }
      ],
      status: { $in: [ORDER_STATUS.PAID, ORDER_STATUS.PREPARING, ORDER_STATUS.READY, ORDER_STATUS.COMPLETED] }
    }).sort({ orderDate: -1 });
    
    // 过滤出今天的订单
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
    
    const meals = todayOrders.map(order => ({
      order: order._id,
      mealType: order.mealType,
      time: order.orderDate || order.scheduledDate,
      items: order.items.map(item => item.dishName || item.dish?.name || '菜品')
    }));
    
    console.log('📦 家长端-从订单获取孩子餐次数据:', {
      childId,
      childName: child.name,
      todayLocalStr,
      recentOrdersCount: recentOrders.length,
      todayOrdersCount: todayOrders.length,
      mealsCount: meals.length,
      mealTypes: meals.map(m => m.mealType)
    });

    const result = {
      date: formatDate(today),
      childName: child.name,
      childInfo: {
        age: child.age,
        height: child.height,
        weight: child.weight,
        class: child.class
      },
      intake,
      target: {
        calories: targetCalories,
        protein: 75,
        fat: 60,
        carbs: 250,
        fiber: 25
      },
      meals: meals // 返回餐次信息
    };

    // 🚀 优化：存入缓存（30秒）- 缓存时间缩短，确保数据及时更新
    try {
      await cache.set(cacheKey, result, 30);
    } catch (e) {
      console.log('⚠️  缓存写入失败（忽略）:', e.message);
    }

    success(res, result);
  } catch (err) {
    console.error(err);
    error(res, '获取营养数据失败', 500);
  }
};

exports.getMealHistory = async (req, res) => {
  try {
    const { childId } = req.params;
    const { page = 1, pageSize = 10, startDate, endDate } = req.query;

    const parent = await User.findById(req.user._id);
    if (!parent.children.some(id => id.toString() === childId)) {
      return error(res, '无权查看该学生信息', 403);
    }

    const filter = {
      user: childId
    };

    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = new Date(startDate);
      if (endDate) filter.orderDate.$lte = new Date(endDate);
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('items.dish', 'name category image')
      .sort({ orderDate: -1 })
      .limit(parseInt(pageSize))
      .skip((parseInt(page) - 1) * parseInt(pageSize));

    paginated(res, orders, page, pageSize, total);
  } catch (err) {
    console.error(err);
    error(res, '获取用餐历史失败', 500);
  }
};

exports.getWeeklyReport = async (req, res) => {
  try {
    const { childId } = req.params;

    const parent = await User.findById(req.user._id);
    if (!parent.children.some(id => id.toString() === childId)) {
      return error(res, '无权查看该学生信息', 403);
    }

    const { start, end } = getWeekRange();
    const records = await NutritionRecord.find({
      user: childId,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const dailyCalories = new Array(7).fill(0);

    records.forEach(record => {
      const dayIndex = new Date(record.date).getDay();
      const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
      dailyCalories[adjustedIndex] = record.intake.calories || 0;
    });

    const avgCalories = Math.round(dailyCalories.reduce((a, b) => a + b, 0) / 7);

    success(res, {
      weekRange: `${formatDate(start)} 至 ${formatDate(end)}`,
      days,
      dailyCalories,
      avgCalories,
      targetCalories: 2000
    });
  } catch (err) {
    console.error(err);
    error(res, '获取周报失败', 500);
  }
};

exports.getPhysicalExams = async (req, res) => {
  try {
    const { childId } = req.params;

    const parent = await User.findById(req.user._id);
    if (!parent.children.some(id => id.toString() === childId)) {
      return error(res, '无权查看该学生信息', 403);
    }

    const exams = await PhysicalExam.find({ student: childId })
      .sort({ examDate: -1 })
      .limit(10);

    success(res, exams);
  } catch (err) {
    console.error(err);
    error(res, '获取体检数据失败', 500);
  }
};

async function callDifyAPI(prompt) {
  try {

    const apiUrl = DIFY_CONFIG.apiUrl.endsWith('/chat-messages')
      ? DIFY_CONFIG.apiUrl
      : `${DIFY_CONFIG.apiUrl}/chat-messages`;

    console.log('调用 Dify API...');
    console.log('配置:', {
      originalUrl: DIFY_CONFIG.apiUrl,
      actualUrl: apiUrl,
      hasApiKey: !!DIFY_CONFIG.apiKey,
      user: DIFY_CONFIG.user
    });

    const response = await axios.post(
      apiUrl,
      {
        inputs: {},
        query: prompt,
        response_mode: 'blocking',
        user: DIFY_CONFIG.user
      },
      {
        headers: {
          'Authorization': `Bearer ${DIFY_CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      }
    );

    console.log(chalk.green('[Dify] API 调用成功'));

    return {
      success: true,
      text: response.data.answer,
      conversationId: response.data.conversation_id
    };
  } catch (err) {
    console.error('Dify API 调用失败:', err.message);
    if (err.response) {
      console.error('响应状态:', err.response.status);
      console.error('响应数据:', err.response.data);
    }

    return {
      success: false,
      error: err.message
    };
  }
}

function parseAIResponse(text) {
  const content = {
    summary: '',
    highlights: [],
    suggestions: [],
    nextPlan: '',
    fullText: text
  };

  const summaryMatch = text.match(/【报告摘要】([\s\S]*?)(?=【|$)/);
  if (summaryMatch) {
    content.summary = summaryMatch[1].trim();
  }

  const highlightsMatch = text.match(/【亮点与提醒】([\s\S]*?)(?=【|$)/);
  if (highlightsMatch) {
    const highlightText = highlightsMatch[1].trim();
    const lines = highlightText.split('\n').filter(line => line.trim());
    content.highlights = lines.map(line => line.trim());
  }

  const suggestionsMatch = text.match(/【营养建议】([\s\S]*?)(?=【|$)/);
  if (suggestionsMatch) {
    const suggestionText = suggestionsMatch[1].trim();
    const lines = suggestionText.split('\n').filter(line => line.trim());
    content.suggestions = lines.map(line => line.trim());
  }

  const planMatch = text.match(/【下[周月]计划】([\s\S]*?)(?=【|$)/);
  if (planMatch) {
    content.nextPlan = planMatch[1].trim();
  }

  return content;
}

exports.generateChildAIReport = async (req, res) => {
  try {
    console.log('开始生成孩子AI报告...');
    const { childId } = req.params;
    const { reportType = 'weekly' } = req.body;

    console.log('孩子ID:', childId);
    console.log('报告类型:', reportType);
    console.log('家长ID:', req.user._id);

    const parent = await User.findById(req.user._id);
    console.log('家长信息:', { name: parent.name, childrenCount: parent.children.length });

    if (!parent.children.some(id => id.toString() === childId)) {
      console.error('权限验证失败: 该孩子不属于当前家长');
      return error(res, '无权查看该学生信息', 403);
    }

    const child = await User.findById(childId);
    if (!child) {
      console.error('学生不存在:', childId);
      return error(res, '学生不存在', 404);
    }

    console.log('找到孩子:', child.name);

    let dateRange, records, dataSummary, prompt;

    if (reportType === 'weekly') {

      const { start, end } = getWeekRange();
      dateRange = { start, end };

      console.log('查询日期范围:', {
        start: formatDate(start),
        end: formatDate(end)
      });

      records = await NutritionRecord.find({
        user: childId,
        date: { $gte: start, $lte: end }
      }).sort({ date: 1 });

      console.log('找到营养记录数:', records.length);

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
      const targetCalories = child.targetCalories || 2000;

      console.log('计算的平均值:', {
        avgCalories,
        avgProtein,
        avgFat,
        avgCarbs,
        avgFiber,
        targetCalories
      });

      dataSummary = {
        avgCalories,
        avgProtein,
        avgFat,
        avgCarbs,
        avgFiber,
        totalDays: 7,
        targetCalories,
        nutritionScore: {
          carbs: Math.min(Math.round((avgCarbs / 250) * 100), 100),
          protein: Math.min(Math.round((avgProtein / 75) * 100), 100),
          fat: Math.min(Math.round((avgFat / 60) * 100), 100),
          fiber: Math.min(Math.round((avgFiber / 25) * 100), 100),
          vitamin: 85
        }
      };

      prompt = DIFY_CONFIG.studentWeeklyPrompt
        .replace('{avgCalories}', avgCalories)
        .replace('{targetCalories}', targetCalories)
        .replace('{avgProtein}', avgProtein)
        .replace('{avgFat}', avgFat)
        .replace('{avgCarbs}', avgCarbs)
        .replace('{avgFiber}', avgFiber);

      prompt = `PARENT1_FE_BG,${prompt}`;

      console.log('生成的提示词长度:', prompt.length, '字符');
    } else {

      const { start, end } = getMonthRange();
      dateRange = { start, end };

      records = await NutritionRecord.find({
        user: childId,
        date: { $gte: start, $lte: end }
      }).sort({ date: 1 });

      let totalCalories = 0, totalProtein = 0, totalFat = 0, totalCarbs = 0, totalFiber = 0;
      const daysWithData = records.length;

      records.forEach(record => {
        totalCalories += record.intake.calories || 0;
        totalProtein += record.intake.protein || 0;
        totalFat += record.intake.fat || 0;
        totalCarbs += record.intake.carbs || 0;
        totalFiber += record.intake.fiber || 0;
      });

      const avgCalories = daysWithData > 0 ? Math.round(totalCalories / daysWithData) : 0;
      const avgProtein = daysWithData > 0 ? Math.round(totalProtein / daysWithData) : 0;
      const avgFat = daysWithData > 0 ? Math.round(totalFat / daysWithData) : 0;
      const avgCarbs = daysWithData > 0 ? Math.round(totalCarbs / daysWithData) : 0;
      const avgFiber = daysWithData > 0 ? Math.round(totalFiber / daysWithData) : 0;
      const targetCalories = child.targetCalories || 2000;

      dataSummary = {
        avgCalories,
        avgProtein,
        avgFat,
        avgCarbs,
        avgFiber,
        totalDays: daysWithData,
        targetCalories,
        nutritionScore: {
          carbs: Math.min(Math.round((avgCarbs / 250) * 100), 100),
          protein: Math.min(Math.round((avgProtein / 75) * 100), 100),
          fat: Math.min(Math.round((avgFat / 60) * 100), 100),
          fiber: Math.min(Math.round((avgFiber / 25) * 100), 100),
          vitamin: 85
        }
      };

      prompt = DIFY_CONFIG.studentMonthlyPrompt
        .replace('{avgCalories}', avgCalories)
        .replace('{targetCalories}', targetCalories)
        .replace('{avgProtein}', avgProtein)
        .replace('{avgFat}', avgFat)
        .replace('{avgCarbs}', avgCarbs)
        .replace('{avgFiber}', avgFiber)
        .replace('{totalDays}', daysWithData);

      prompt = `PARENT1_FE_BG,${prompt}`;
    }

    const report = new AIReport({
      student: childId,
      reportType,
      dateRange,
      dataSummary,
      status: 'generating'
    });

    await report.save();
    console.log(`创建报告记录: ${report._id}`);

    console.log(chalk.blue('[Dify] 开始调用API...'));
    const difyResult = await callDifyAPI(prompt);
    console.log(chalk.green(`[Dify] API调用完成: ${difyResult.success ? '成功' : '失败'}`));

    if (difyResult.success) {
      console.log('AI响应长度:', difyResult.text.length, '字符');

      const parsedContent = parseAIResponse(difyResult.text);

      report.content = parsedContent;
      report.conversationId = difyResult.conversationId;
      report.status = 'completed';
      await report.save();

      console.log(chalk.green('[报告] 生成成功并保存到数据库'));

      success(res, {
        reportId: report._id,
        reportType,
        dateRange,
        childName: child.name,
        content: parsedContent,
        dataSummary,
        createdAt: report.createdAt
      });
    } else {

      report.status = 'failed';
      report.errorMessage = difyResult.error;
      await report.save();

      console.error('Dify API 调用失败:', difyResult.error);
      error(res, `AI报告生成失败: ${difyResult.error}`, 500);
    }

  } catch (err) {
    console.error('生成孩子AI报告错误:', err);
    console.error('错误类型:', err.name);
    console.error('错误信息:', err.message);
    console.error('错误堆栈:', err.stack);
    error(res, `生成孩子AI报告失败: ${err.message}`, 500);
  }
};

exports.getChildAIReports = async (req, res) => {
  try {
    const { childId } = req.params;
    const { reportType } = req.query;

    const parent = await User.findById(req.user._id);
    if (!parent.children.some(id => id.toString() === childId)) {
      return error(res, '无权查看该学生信息', 403);
    }

    const filter = { student: childId };
    if (reportType) {
      filter.reportType = reportType;
    }

    const reports = await AIReport.find(filter)
      .sort({ createdAt: -1 })
      .limit(20);

    success(res, reports);
  } catch (err) {
    console.error('获取AI报告历史错误:', err);
    error(res, '获取AI报告历史失败', 500);
  }
};

