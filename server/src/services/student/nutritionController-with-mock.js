

const NutritionRecord = require('../../models/NutritionRecord');
const AIReport = require('../../models/AIReport');
const { success, error } = require('../../utils/responseFormatter');
const { getStartOfDay, getEndOfDay, getWeekRange, getMonthRange } = require('../../utils/dateUtils');
const axios = require('axios');

const USE_MOCK_DIFY = true;

const DIFY_CONFIG = {
  apiUrl: 'http://171.111.194.87/v1/workflows/run',
  apiKey: process.env.DIFY_WORKFLOW_API_KEY || 'app-IHUOYKE2fAyNPXkLVGBdJTPs',
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

请用专业但温暖的语气，既要指出问题也要给予鼓励。`
};

function generateMockDifyResponse(dataSummary, reportType) {
  const { avgCalories, targetCalories, avgProtein, avgFat, avgCarbs, avgFiber } = dataSummary;
  const达标率 = Math.round((avgCalories / targetCalories) * 100);

  let summary, highlights, suggestions, nextPlan;

  if (reportType === 'weekly') {

    summary = `本周整体营养摄入${达标率 >= 90 ? '优秀' : 达标率 >= 80 ? '良好' : '基本达标'}，平均每日摄入${avgCalories}千卡，${达标率 >= 100 ? '略超过' : '接近'}目标值${targetCalories}千卡。蛋白质和膳食纤维摄入充足，值得继续保持。`;

    highlights = [
      avgProtein >= 60 ? '蛋白质摄入充足（' + avgProtein + 'g/天），有利于肌肉发育和身体成长' : '蛋白质摄入偏低（' + avgProtein + 'g/天），建议增加优质蛋白来源',
      avgFiber >= 20 ? '膳食纤维摄入达标（' + avgFiber + 'g/天），消化系统健康' : '膳食纤维不足（' + avgFiber + 'g/天），需要多吃蔬菜水果',
      达标率 >= 90 && 达标率 <= 110 ? '热量控制良好，保持在合理范围内' : 达标率 < 90 ? '热量摄入偏低，可能影响日常活动' : '热量摄入略高，注意控制'
    ];

    suggestions = [
      '建议每日增加绿叶蔬菜摄入量，如菠菜、生菜、西兰花等',
      '适当补充优质蛋白质，如鱼肉、鸡胸肉、豆制品',
      '减少油炸食品和高糖零食的摄入频率',
      '保持规律的三餐时间，避免暴饮暴食',
      '每天保证饮水1500-2000ml，促进新陈代谢'
    ];

    nextPlan = `下周建议热量摄入维持在${targetCalories - 100}-${targetCalories + 100}千卡之间，重点增加蔬菜水果比例，确保每天至少5种不同颜色的蔬果。同时适量运动配合饮食管理，每周至少3次中等强度运动，每次30分钟以上。`;

  } else {

    summary = `本月营养摄入${达标率 >= 85 ? '表现优秀' : '整体良好'}，月均每日摄入${avgCalories}千卡，达标率${达标率}%。相较上月${达标率 > 95 ? '有明显进步' : '保持稳定'}，整体饮食结构${avgProtein >= 60 && avgFiber >= 20 ? '均衡合理' : '有待优化'}。继续保持良好的饮食习惯，争取下月有更大进步。`;

    highlights = [
      '月度热量摄入稳定，波动范围较小',
      avgProtein >= 60 ? '蛋白质摄入持续达标，身体发育良好' : '蛋白质摄入有待提高',
      avgFiber >= 20 ? '膳食纤维保持良好水平' : '膳食纤维摄入需要改善',
      '养成了较规律的饮食习惯',
      达标率 >= 90 ? '营养目标完成度高' : '部分营养素摄入需要调整'
    ];

    suggestions = [
      '继续保持当前的优秀饮食习惯',
      '增加食物种类多样性，每周尝试2-3种新食材',
      '注意维生素和矿物质的补充，多吃深色蔬菜',
      '控制添加糖和饱和脂肪的摄入',
      '建立饮食日记，记录每日饮食感受',
      '定期进行体重和体成分监测'
    ];

    nextPlan = `下月目标：将热量摄入稳定在${targetCalories}±50千卡范围内，蛋白质摄入提升至70g/天以上，膳食纤维保持25g/天以上。计划每周增加1-2次鱼类摄入，每天保证至少300g蔬菜和200g水果。配合适量运动（每周150分钟中等强度），达成更健康的生活方式。`;
  }

  return {
    summary,
    highlights: highlights.slice(0, reportType === 'weekly' ? 4 : 5),
    suggestions: suggestions.slice(0, reportType === 'weekly' ? 4 : 6),
    nextPlan,
    fullText: `${summary}\n\n${highlights.join('\n')}\n\n${suggestions.join('\n')}\n\n${nextPlan}`
  };
}

async function callDifyWorkflow(prompt, dataSummary, reportType) {

  if (USE_MOCK_DIFY) {
    console.log('使用模拟 AI 响应（USE_MOCK_DIFY = true）');
    console.log('提示：修改 nutritionController.js 中的 USE_MOCK_DIFY = false 使用真实 Dify');

    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockResponse = generateMockDifyResponse(dataSummary, reportType);

    return {
      success: true,
      text: mockResponse.fullText,
      conversationId: 'mock-' + Date.now(),
      _isMock: true
    };
  }

  try {
    const response = await axios.post(
      DIFY_CONFIG.apiUrl,
      {
        inputs: {
          query: prompt
        },
        response_mode: 'blocking',
        user: 'student-nutrition-system'
      },
      {
        headers: {
          'Authorization': `Bearer ${DIFY_CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    const result = response.data;
    let aiText = '';

    if (result.data && result.data.outputs) {
      aiText = result.data.outputs.text || result.data.outputs.result || JSON.stringify(result.data.outputs);
    } else if (result.answer) {
      aiText = result.answer;
    } else {
      aiText = JSON.stringify(result);
    }

    return {
      success: true,
      text: aiText,
      conversationId: result.conversation_id || result.workflow_run_id
    };
  } catch (err) {
    console.error('Dify API调用失败:', err.message);
    console.error('提示：如果Dify暂时无法使用，可以设置 USE_MOCK_DIFY = true 进行测试');
    return {
      success: false,
      error: err.message
    };
  }
}

