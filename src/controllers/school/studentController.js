const chalk = require('chalk');
const User = require('../../models/User');
const NutritionRecord = require('../../models/NutritionRecord');
const PhysicalExam = require('../../models/PhysicalExam');
const Order = require('../../models/Order');
const ClassHealthReport = require('../../models/ClassHealthReport');
const AIChatHistory = require('../../models/AIChatHistory');
const { success, error, paginated } = require('../../utils/responseFormatter');
const { getWeekRange } = require('../../utils/dateUtils');
const { USER_ROLES } = require('../../config/constants');
const axios = require('axios');
const DIFY_CONFIG = require('../../config/dify');

async function callDifyAPI(prompt) {
  try {
    console.log('调用 Dify API 生成班级健康报告...');
    console.log('API URL:', DIFY_CONFIG.apiUrl);
    console.log('超时设置:', DIFY_CONFIG.timeout, 'ms');

    const response = await axios.post(
      DIFY_CONFIG.apiUrl,
      {
        inputs: {},
        query: prompt,
        response_mode: 'blocking',
        conversation_id: '',
        user: 'school-class-health-report'
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
    
    // 详细错误诊断
    if (err.code === 'ECONNREFUSED') {
      console.error(chalk.red('  原因: 连接被拒绝 - Dify 服务未运行'));
    } else if (err.code === 'ETIMEDOUT' || err.message.includes('timeout')) {
      console.error(chalk.red('  原因: 连接超时 - Dify 服务不可达'));
    } else if (err.code === 'ENOTFOUND') {
      console.error(chalk.red('  原因: 域名/IP 无法解析'));
    } else if (err.response) {
      console.error(chalk.red('  HTTP状态:'), err.response.status);
      console.error(chalk.red('  错误详情:'), JSON.stringify(err.response.data, null, 2));
      
      // 特殊处理 SiliconFlow rerank 错误
      if (err.response.data?.message?.includes('siliconflow') && 
          err.response.data?.message?.includes('rerank')) {
        console.error(chalk.yellow('  ⚠️  检测到 SiliconFlow rerank 插件错误'));
        console.error(chalk.yellow('  建议: 在 Dify Workflow 中禁用或修复 rerank 节点'));
        console.error(chalk.yellow('  或检查 SiliconFlow API Key 配置'));
      }
    }

    return {
      success: false,
      error: err.message,
      errorCode: err.code,
      httpStatus: err.response?.status,
      errorDetails: err.response?.data
    };
  }
}

function parseAIResponse(text) {
  const sections = {
    overview: '',
    highlights: [],
    suggestions: [],
    nextPlan: ''
  };

  try {

    const lines = text.split('\n').filter(line => line.trim());
    let currentSection = 'overview';

    for (let line of lines) {
      line = line.trim();

      if (line.match(/^(整体概况|总体评价|概况)[:：]/i)) {
        currentSection = 'overview';
        continue;
      } else if (line.match(/^(重点关注|主要问题|关注点|亮点)[:：]/i)) {
        currentSection = 'highlights';
        continue;
      } else if (line.match(/^(改善建议|建议|改进建议)[:：]/i)) {
        currentSection = 'suggestions';
        continue;
      } else if (line.match(/^(后续计划|下阶段计划|计划)[:：]/i)) {
        currentSection = 'nextPlan';
        continue;
      }

      if (line.match(/^[]/)) {
        if (currentSection === 'highlights') {
          sections.highlights.push(line);
        } else if (currentSection === 'suggestions') {
          sections.suggestions.push(line.replace(/^[]\s*/, ''));
        }
      } else if (line.match(/^[\d]+[\.、]/)) {
        if (currentSection === 'suggestions') {
          sections.suggestions.push(line.replace(/^[\d]+[\.、]\s*/, ''));
        } else if (currentSection === 'highlights') {
          sections.highlights.push(line);
        }
      } else if (line.length > 5) {
        if (currentSection === 'overview') {
          sections.overview += (sections.overview ? ' ' : '') + line;
        } else if (currentSection === 'nextPlan') {
          sections.nextPlan += (sections.nextPlan ? ' ' : '') + line;
        } else if (currentSection === 'suggestions' && line.length > 10) {
          sections.suggestions.push(line);
        } else if (currentSection === 'highlights' && line.length > 10) {
          sections.highlights.push(line);
        }
      }
    }

    if (!sections.overview && sections.highlights.length === 0) {
      sections.overview = text;
    }

    return sections;
  } catch (err) {
    console.error('解析AI响应失败:', err);
    return {
      overview: text,
      highlights: [],
      suggestions: [],
      nextPlan: ''
    };
  }
}

exports.getStudentList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, grade, class: studentClass, keyword } = req.query;
    const currentUser = req.user;

    const filter = { role: USER_ROLES.STUDENT };

    if (currentUser.role === USER_ROLES.TEACHER) {

      if (currentUser.managedClasses && currentUser.managedClasses.length > 0) {
        filter.class = { $in: currentUser.managedClasses };
      } else {

        return paginated(res, [], page, pageSize, 0);
      }
    }

    if (grade) filter.grade = grade;
    if (studentClass) filter.class = studentClass;
    if (keyword) {
      filter.$or = [
        { name: new RegExp(keyword, 'i') },
        { studentId: new RegExp(keyword, 'i') }
      ];
    }

    const total = await User.countDocuments(filter);
    const students = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(parseInt(pageSize))
      .skip((parseInt(page) - 1) * parseInt(pageSize));

    paginated(res, students, page, pageSize, total);
  } catch (err) {
    console.error(err);
    error(res, '获取学生列表失败', 500);
  }
};

exports.getHealthData = async (req, res) => {
  try {
    const { grade, class: studentClass, keyword, healthStatus } = req.query;
    const currentUser = req.user;

    const filter = { role: USER_ROLES.STUDENT };

    if (currentUser.role === USER_ROLES.TEACHER) {

      if (currentUser.managedClasses && currentUser.managedClasses.length > 0) {
        filter.class = { $in: currentUser.managedClasses };
      } else {

        return success(res, []);
      }
    }

    if (keyword) {
      filter.name = new RegExp(keyword, 'i');
    }

    if (grade) filter.grade = grade;
    if (studentClass) filter.class = studentClass;

    const students = await User.find(filter).select('name studentId class grade height weight gender');

    const healthData = await Promise.all(students.map(async (student) => {
      // 获取最新的体检记录（已经包含了保存的营养评分和健康状态）
      const latestExam = await PhysicalExam.findOne({ student: student._id })
        .sort({ examDate: -1 });

      // 从数据库读取已保存的数据，而不是重新计算
      const height = latestExam?.height || student.height || 0;
      const weight = latestExam?.weight || student.weight || 0;
      const bmi = latestExam?.bmi || 0;
      
      // 使用数据库中已保存的营养评分（累积数据，不会随时间变化）
      const nutritionScore = latestExam?.nutritionScore || 0;
      
      // 使用数据库中已保存的健康状态
      const dbHealthStatus = latestExam?.healthStatus || 'fair';
      
      // 映射数据库健康状态到前端显示格式
      // 对于模拟数据，只要营养评分 >= 65（fair/good/excellent）都显示为健康
      let mappedHealthStatus = 'healthy';
      if (dbHealthStatus === 'excellent' || dbHealthStatus === 'good' || dbHealthStatus === 'fair') {
        mappedHealthStatus = 'healthy';
      } else if (dbHealthStatus === 'poor') {
        mappedHealthStatus = 'abnormal';
      } else {
        // 如果没有健康状态数据，根据营养评分判断
        if (nutritionScore >= 65) {
          mappedHealthStatus = 'healthy';
        } else if (nutritionScore >= 50) {
          mappedHealthStatus = 'attention';
        } else {
          mappedHealthStatus = 'abnormal';
        }
      }

      return {
        id: student._id,
        studentName: student.name,
        studentId: student.studentId,
        class: student.class,
        grade: student.grade,
        gender: student.gender || '未知',
        height: height,
        weight: weight,
        bmi: bmi,
        healthStatus: mappedHealthStatus,
        nutritionScore: nutritionScore,
        lastExamDate: latestExam?.examDate ? new Date(latestExam.examDate).toISOString().split('T')[0] : null
      };
    }));

    success(res, healthData);
  } catch (err) {
    console.error(err);
    error(res, '获取健康数据失败', 500);
  }
};

exports.getMealRecords = async (req, res) => {
  try {
    const { studentId, startDate, endDate } = req.query;

    const student = await User.findById(studentId);
    if (!student) {
      return error(res, '学生不存在', 404);
    }

    const filter = { user: studentId };

    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = new Date(startDate);
      if (endDate) filter.orderDate.$lte = new Date(endDate);
    }

    const orders = await Order.find(filter)
      .populate('items.dish', 'name category nutrition')
      .sort({ orderDate: -1 });

    success(res, orders);
  } catch (err) {
    console.error(err);
    error(res, '获取用餐记录失败', 500);
  }
};

exports.getNutritionData = async (req, res) => {
  try {
    const { studentId, startDate, endDate } = req.query;

    const student = await User.findById(studentId);
    if (!student) {
      return error(res, '学生不存在', 404);
    }

    const filter = { user: studentId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const records = await NutritionRecord.find(filter).sort({ date: -1 });

    success(res, records);
  } catch (err) {
    console.error(err);
    error(res, '获取营养数据失败', 500);
  }
};

exports.getPhysicalExams = async (req, res) => {
  try {
    const { studentId } = req.query;

    const filter = {};
    if (studentId) filter.student = studentId;

    const exams = await PhysicalExam.find(filter)
      .populate('student', 'name studentId class')
      .sort({ examDate: -1 });

    success(res, exams);
  } catch (err) {
    console.error(err);
    error(res, '获取体检数据失败', 500);
  }
};

exports.addPhysicalExam = async (req, res) => {
  try {
    const examData = req.body;

    const exam = await PhysicalExam.create({
      ...examData,
      examiner: req.user.name
    });

    await User.findByIdAndUpdate(examData.student, {
      height: examData.height,
      weight: examData.weight
    });

    success(res, exam, '添加成功', 201);
  } catch (err) {
    console.error(err);
    error(res, '添加体检数据失败', 500);
  }
};

exports.getStudentDetail = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await User.findById(studentId).select('-password');
    if (!student) {
      return error(res, '学生不存在', 404);
    }

    const latestExam = await PhysicalExam.findOne({ student: studentId })
      .sort({ examDate: -1 });

    const { start, end } = getWeekRange();
    const weekRecords = await NutritionRecord.find({
      user: studentId,
      date: { $gte: start, $lte: end }
    });

    success(res, {
      student,
      latestExam,
      weekNutrition: weekRecords
    });
  } catch (err) {
    console.error(err);
    error(res, '获取学生详情失败', 500);
  }
};

exports.generateHealthReport = async (req, res) => {
  try {
    const { filters, students, summary } = req.body;
    const currentUser = req.user;

    if (!students || students.length === 0) {
      return error(res, '没有学生数据，无法生成报告', 400);
    }

    console.log('生成班级健康报告，学生数量:', students.length);

    const total = summary.total || students.length;
    const healthy = summary.healthy || 0;
    const attention = summary.attention || 0;
    const abnormal = summary.abnormal || 0;
    const healthyRate = total > 0 ? ((healthy / total) * 100).toFixed(1) : 0;

    let scope = '';
    if (filters.grade && filters.class) {
      scope = `${filters.grade}年级${filters.class}班`;
    } else if (filters.grade) {
      scope = `${filters.grade}年级`;
    } else {
      scope = '全校';
    }

    const report = new ClassHealthReport({
      generatedBy: currentUser._id,
      filters,
      scope,
      summary: {
        total,
        healthy,
        attention,
        abnormal,
        healthyRate: parseFloat(healthyRate),
        avgHeight: parseFloat(summary.avgHeight) || 0,
        avgWeight: parseFloat(summary.avgWeight) || 0,
        avgBMI: parseFloat(summary.avgBMI) || 0,
        avgNutritionScore: parseFloat(summary.avgNutritionScore) || 0
      },
      students: students.map(s => ({
        studentId: s.studentId,
        studentName: s.studentName,
        healthStatus: s.healthStatus,
        bmi: s.bmi
      })),
      status: 'generating'
    });

    await report.save();

    let prompt = DIFY_CONFIG.classHealthAnalysisPrompt || DIFY_CONFIG.classHealthPrompt
      .replace('{scope}', scope)
      .replace('{total}', total)
      .replace('{healthy}', healthy)
      .replace('{healthyRate}', healthyRate)
      .replace('{attention}', attention)
      .replace('{abnormal}', abnormal)
      .replace('{avgHeight}', summary.avgHeight || 0)
      .replace('{avgWeight}', summary.avgWeight || 0)
      .replace('{avgBMI}', summary.avgBMI || 0)
      .replace('{avgNutritionScore}', summary.avgNutritionScore || 0);

    prompt = `TEA1_FE_BG,${prompt}`;

    console.log('调用 Dify API 生成报告...');

    const difyResult = await callDifyAPI(prompt);

    if (difyResult.success) {

      const parsedContent = parseAIResponse(difyResult.text);

      report.content = parsedContent;
      report.conversationId = difyResult.conversationId;
      report.status = 'completed';
      await report.save();

      console.log(chalk.green('[报告] 生成成功并保存到数据库'));

      success(res, {
        reportId: report._id,
        content: parsedContent,
        metadata: {
          filters,
          studentCount: students.length,
          summary: report.summary,
          generatedBy: currentUser.name,
          generatedAt: report.createdAt,
          scope
        },
        conversationId: difyResult.conversationId,
        generatedAt: report.createdAt.toISOString()
      });
    } else {

      report.status = 'failed';
      report.errorMessage = difyResult.error;
      await report.save();

      console.error('Dify API 调用失败:', difyResult.error);
      
      // 返回更友好的错误信息
      let errorMessage = 'AI报告生成失败';
      let statusCode = 500;
      
      if (difyResult.httpStatus === 400) {
        // 特殊处理 400 错误
        if (difyResult.errorDetails?.message?.includes('siliconflow') && 
            difyResult.errorDetails?.message?.includes('rerank')) {
          errorMessage = 'AI 服务配置错误（SiliconFlow rerank），请联系管理员检查 Dify Workflow 配置';
        } else {
          errorMessage = 'AI 服务请求参数错误，请联系管理员';
        }
        statusCode = 503; // Service Unavailable
      } else if (difyResult.errorCode === 'ECONNREFUSED' || difyResult.errorCode === 'ETIMEDOUT') {
        errorMessage = 'AI 服务暂时不可用，请稍后重试或联系管理员';
        statusCode = 503;
      } else if (difyResult.httpStatus === 401 || difyResult.httpStatus === 403) {
        errorMessage = 'AI 服务认证失败，请联系管理员检查 API Key';
        statusCode = 503;
      }
      
      error(res, errorMessage, statusCode);
    }
  } catch (err) {
    console.error('生成健康报告失败:', err);
    error(res, '生成健康报告失败', 500);
  }
};

exports.getHealthReportHistory = async (req, res) => {
  try {
    const currentUser = req.user;
    const { limit = 10, offset = 0, scope } = req.query;

    console.log('获取报告历史，用户:', currentUser.name, '角色:', currentUser.role);

    const query = {};

    if (currentUser.role === USER_ROLES.TEACHER) {
      query.generatedBy = currentUser._id;
    }

    if (scope) {
      query.scope = new RegExp(scope, 'i');
    }

    query.status = 'completed';

    console.log('查询条件:', query);

    const reports = await ClassHealthReport.find(query)
      .populate('generatedBy', 'name role')
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    const total = await ClassHealthReport.countDocuments(query);

    console.log('找到报告数量:', reports.length, '总计:', total);

    success(res, {
      reports: reports || [],
      total: total || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    console.error('获取报告历史失败:', err);
    console.error('错误详情:', err.stack);

    success(res, {
      reports: [],
      total: 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  }
};

exports.getHealthReportById = async (req, res) => {
  try {
    const { reportId } = req.params;
    const currentUser = req.user;

    const report = await ClassHealthReport.findById(reportId)
      .populate('generatedBy', 'name role');

    if (!report) {
      return error(res, '报告不存在', 404);
    }

    if (currentUser.role === USER_ROLES.TEACHER &&
        report.generatedBy._id.toString() !== currentUser._id.toString()) {
      return error(res, '没有权限查看此报告', 403);
    }

    success(res, report);
  } catch (err) {
    console.error('获取报告详情失败:', err);
    error(res, '获取报告详情失败', 500);
  }
};

exports.saveChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId, sender, userMessage, aiMessage, metadata, files } = req.body;

    const chatHistory = new AIChatHistory({
      user: userId,
      source: 'school',
      conversationId: conversationId || '',
      sender,
      userMessage: userMessage || '',
      aiMessage: aiMessage || '',
      files: files || [],
      metadata: metadata || {},
      timestamp: new Date()
    });

    await chatHistory.save();

    console.log(chalk.green(`[学校] 聊天记录保存成功: ${chatHistory._id} (文件数: ${(files || []).length})`));

    success(res, {
      chatId: chatHistory._id,
      message: '聊天记录保存成功'
    });
  } catch (err) {
    console.error('保存聊天记录失败:', err);
    error(res, '保存聊天记录失败', 500);
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId, limit = 50, offset = 0, startDate, endDate } = req.query;

    const query = {
      user: userId,
      source: 'school'
    };

    if (conversationId) {
      query.conversationId = conversationId;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const chatHistory = await AIChatHistory.find(query)
      .sort({ timestamp: 1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    const total = await AIChatHistory.countDocuments(query);

    success(res, {
      records: chatHistory,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    console.error('获取聊天记录失败:', err);
    error(res, '获取聊天记录失败', 500);
  }
};

exports.clearAllChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await AIChatHistory.deleteMany({
      user: userId,
      source: 'school'
    });

    success(res, {
      deletedCount: result.deletedCount,
      message: `成功清空${result.deletedCount}条聊天记录`
    });
  } catch (err) {
    console.error('清空聊天记录失败:', err);
    error(res, '清空聊天记录失败', 500);
  }
};

// Dify 流式聊天代理
exports.streamChat = async (req, res) => {
  try {
    let { inputs, query, conversation_id, user: clientUser } = req.body;
    const userId = req.user._id;

    console.log(chalk.cyan('[学校AI助手] 开始流式对话'));
    console.log('用户ID:', userId);
    console.log('对话ID:', conversation_id);
    console.log('问题:', query);
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
      console.log(chalk.cyan('[学校AI助手] 开始新对话'));
      response = await axios.post(
        DIFY_CONFIG.apiUrl,
        {
          inputs: inputs || {},
          query: query,
          response_mode: 'streaming',
          conversation_id: '',
          user: clientUser || `school-${userId}`
        },
        {
          headers: {
            'Authorization': `Bearer ${DIFY_CONFIG.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream'
          },
          timeout: 120000,
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
            user: clientUser || `school-${userId}`
          },
          {
            headers: {
              'Authorization': `Bearer ${DIFY_CONFIG.apiKey}`,
              'Content-Type': 'application/json',
              'Accept': 'text/event-stream'
            },
            timeout: 120000,
            responseType: 'stream'
          }
        );
      } catch (firstError) {
        // 如果是 404 且有 conversation_id，说明对话不存在，重试不带 conversation_id
        if (firstError.response?.status === 404) {
          console.log(chalk.yellow('[学校AI助手] 对话不存在(404)，开始新对话'));
          
          // 第二次尝试：不带 conversation_id，开始新对话
          response = await axios.post(
            DIFY_CONFIG.apiUrl,
            {
              inputs: inputs || {},
              query: query,
              response_mode: 'streaming',
              conversation_id: '',
              user: clientUser || `school-${userId}`
            },
            {
              headers: {
                'Authorization': `Bearer ${DIFY_CONFIG.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream'
              },
              timeout: 120000,
              responseType: 'stream'
            }
          );
        } else {
          // 其他错误，抛出
          throw firstError;
        }
      }
    }

    console.log(chalk.green('[学校AI助手] Dify API 连接成功'));

    // 将 Dify 的流式响应转发给客户端
    let chunkCount = 0;
    let totalBytes = 0;
    
    response.data.on('data', (chunk) => {
      chunkCount++;
      totalBytes += chunk.length;
      const chunkStr = chunk.toString('utf-8');
      console.log(chalk.cyan(`[学校AI助手] 收到数据块 #${chunkCount} (${chunk.length} bytes) - 立即转发`));
      
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
      console.log(chalk.green(`[学校AI助手] 流式响应结束 - 共收到 ${chunkCount} 个数据块，总计 ${totalBytes} bytes`));
      res.end();
    });

    response.data.on('error', (err) => {
      console.error(chalk.red('[学校AI助手] 流式响应错误:'), err);
      res.write(`data: ${JSON.stringify({ event: 'error', message: err.message })}\n\n`);
      res.end();
    });

  } catch (err) {
    console.error(chalk.red('[学校AI助手] 流式对话失败:'), err.message);
    if (err.response) {
      console.error('HTTP状态:', err.response.status);
      console.error('错误详情:', err.response.data);
    }

    // 如果还没有发送响应头，发送错误响应
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: '流式对话失败',
        error: err.message
      });
    } else {
      // 如果已经发送了响应头，通过 SSE 发送错误事件
      res.write(`data: ${JSON.stringify({ event: 'error', message: err.message })}\n\n`);
      res.end();
    }
  }
};

