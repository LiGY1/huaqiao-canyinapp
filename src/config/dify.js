/**
 * Dify API 统一配置
 * 所有控制器应该从此文件导入配置，而不是各自定义
 */

// 获取基础 URL，如果未配置则使用默认值
const baseUrl = process.env.DIFY_API_URL || 'http://171.111.194.87/v1/chat-messages';
// 确保 URL 格式正确
let apiUrl = baseUrl.trim().replace(/\/+$/, '');
if (!apiUrl.includes('/chat-messages') && !apiUrl.includes('/workflows')) {
  apiUrl = `${apiUrl}/chat-messages`;
}

// API Key 配置验证
const apiKey = process.env.DIFY_API_KEY;
const workflowApiKey = process.env.DIFY_WORKFLOW_API_KEY;

// 警告：如果没有配置 API Key
if (!apiKey) {
  console.warn('⚠️  WARNING: DIFY_API_KEY not set in environment variables');
  console.warn('   Using fallback key (for testing only). Please configure in .env file.');
}

module.exports = {
  // API 配置
  apiUrl: apiUrl,
  apiKey: apiKey || 'app-IHUOYKE2fAyNPXkLVGBdJTPs', // 保留默认值以兼容现有代码，但不推荐
  
  // Workflow API Key (可选，用于 Workflow 调用)
  workflowApiKey: workflowApiKey || null,
  workflowApiUrl: workflowApiKey 
    ? (baseUrl.includes('/workflows') ? baseUrl : baseUrl.replace(/\/chat-messages$/, '').replace(/\/+$/, '') + '/workflows/run')
    : null,
  
  // 用户标识
  user: process.env.DIFY_USER || 'parent-nutrition-report',

  studentWeeklyPrompt: `你是一个专业的营养分析师。请根据以下数据生成一份家长可读的周报：

营养数据：
- 日均热量摄入：{avgCalories} 千卡（目标：{targetCalories} 千卡）
- 日均蛋白质：{avgProtein} 克（目标：75克）
- 日均脂肪：{avgFat} 克（目标：60克）
- 日均碳水化合物：{avgCarbs} 克（目标：250克）
- 日均膳食纤维：{avgFiber} 克（目标：25克）

请按照以下格式输出：

【报告摘要】
（用2-3句话总结本周整体营养状况）

【亮点与提醒】
（列出做得好的地方）
（列出需要改善的地方）

【营养建议】
1. （具体的饮食改善建议）
2. （具体的饮食改善建议）
3. （具体的饮食改善建议）

【下周计划】
（提供下周的饮食建议和目标）`,

  studentMonthlyPrompt: `你是一个专业的营养分析师。请根据以下数据生成一份家长可读的月报：

营养数据：
- 日均热量摄入：{avgCalories} 千卡（目标：{targetCalories} 千卡）
- 日均蛋白质：{avgProtein} 克（目标：75克）
- 日均脂肪：{avgFat} 克（目标：60克）
- 日均碳水化合物：{avgCarbs} 克（目标：250克）
- 日均膳食纤维：{avgFiber} 克（目标：25克）
- 统计天数：{totalDays} 天

请按照以下格式输出：

【报告摘要】
（用2-3句话总结本月整体营养状况）

【亮点与提醒】
（列出做得好的地方）
（列出需要改善的地方）

【营养建议】
1. （具体的饮食改善建议）
2. （具体的饮食改善建议）
3. （具体的饮食改善建议）

【下月计划】
（提供下月的饮食建议和目标）`,

  classHealthPrompt: `你是一个专业的学校营养师。请根据以下数据生成一份班级健康报告：

班级范围：{scope}
学生总数：{total} 人
健康学生：{healthy} 人（{healthyRate}%）
需关注学生：{attention} 人
异常学生：{abnormal} 人

平均数据：
- 平均身高：{avgHeight} cm
- 平均体重：{avgWeight} kg
- 平均BMI：{avgBMI}
- 平均营养评分：{avgNutritionScore}

请按照以下格式输出：

【整体评价】
（用2-3句话总结班级整体健康状况）

【数据分析】
（列出优秀的方面）
（列出需要关注的方面）

【改善建议】
1. （针对性的改善建议）
2. （针对性的改善建议）
3. （针对性的改善建议）

【行动计划】
（提供具体的行动建议）`,

  // 学生端营养报告 Prompt（用于 nutritionController.js）
  weeklyPrompt: `请基于以下学生的营养数据生成一份周报：

数据概要：
- 平均每日热量：{avgCalories} 千卡（目标：{targetCalories} 千卡）
- 平均蛋白质：{avgProtein}g
- 平均脂肪：{avgFat}g
- 平均碳水化合物：{avgCarbs}g
- 平均膳食纤维：{avgFiber}g
- 统计天数：{totalDays}天
- 时间范围：{dateRange}

每日详细数据：
{dailyData}

营养评分：
- 碳水化合物：{scoreCarbs}/100
- 蛋白质：{scoreProtein}/100
- 脂肪：{scoreFat}/100
- 膳食纤维：{scoreFiber}/100
- 维生素：{scoreVitamin}/100

请生成一份包含以下内容的报告：
1. 总体评价（2-3句话）
2. 主要亮点（3-5条，用标记好的方面，标记需要注意的方面）
3. 改进建议（3-5条具体建议）
4. 下周计划（1段话，给出具体的饮食建议）

请用温暖、鼓励的语气，适合学生阅读。`,

  monthlyPrompt: `请基于以下学生的营养数据生成一份月报：

数据概要：
- 平均每日热量：{avgCalories} 千卡（目标：{targetCalories} 千卡）
- 平均蛋白质：{avgProtein}g
- 平均脂肪：{avgFat}g
- 平均碳水化合物：{avgCarbs}g
- 平均膳食纤维：{avgFiber}g
- 统计天数：{totalDays}天
- 时间范围：{dateRange}

营养评分：
- 碳水化合物：{scoreCarbs}/100
- 蛋白质：{scoreProtein}/100
- 脂肪：{scoreFat}/100
- 膳食纤维：{scoreFiber}/100
- 维生素：{scoreVitamin}/100

每周趋势：
{weeklyTrend}

请生成一份包含以下内容的月度报告：
1. 月度总结（3-4句话）
2. 主要成就和进步（3-5条，用标记）
3. 需要改进的地方（2-3条，用标记）
4. 详细建议（4-6条具体可行的建议）
5. 下月目标和计划（1-2段话）

请用专业但温暖的语气，既要指出问题也要给予鼓励。`,

  // 学校端班级健康分析 Prompt（用于 studentController.js）
  classHealthAnalysisPrompt: `请基于以下班级学生的健康数据生成一份班级健康分析报告：

班级基本信息：
- 范围：{scope}
- 学生总数：{total}人
- 健康学生：{healthy}人（占比{healthyRate}%）
- 需关注学生：{attention}人
- 健康异常学生：{abnormal}人

健康指标平均值：
- 平均身高：{avgHeight}cm
- 平均体重：{avgWeight}kg
- 平均BMI：{avgBMI}
- 平均营养评分：{avgNutritionScore}分

请生成一份包含以下内容的班级健康报告：
1. 整体概况（2-3句话，综合评价班级健康状况）
2. 重点关注（3-5条，用标记良好情况，标记需要关注的问题，标记严重问题）
3. 改善建议（5-7条具体可行的建议，针对班级整体和个别学生）
4. 后续计划（1-2段话，给出未来一个月的健康管理计划）

请用专业、负责的语气，既要客观分析问题，也要给出建设性的解决方案。`,

  timeout: 120000,

  retry: {
    maxRetries: 3,
    retryDelay: 1000
  }
};

