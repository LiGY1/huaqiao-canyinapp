const chalk = require('chalk');
const Dish = require('../../models/Dish');
const axios = require('axios');
const { success, error } = require('../../utils/responseFormatter');
const { getCurrentSolarTerm, generateSolarTermPrompt } = require('../../utils/solarTermUtils');
const DIFY_CONFIG = require('../../config/dify');

// 使用统一配置，保持向后兼容
const DIFY_API_KEY = DIFY_CONFIG.apiKey || '';
const DIFY_API_URL = DIFY_CONFIG.apiUrl;

exports.getCurrentSolarTerm = async (req, res) => {
  try {
    const solarTermInfo = getCurrentSolarTerm();
    success(res, solarTermInfo);
  } catch (err) {
    console.error('[节气信息] 获取失败:', err);
    error(res, '获取节气信息失败', 500);
  }
};

exports.getAIRecommendations = async (req, res) => {
  try {
    const { term, season, prompt } = req.body;

    if (!term || !prompt) {
      return error(res, '缺少必要参数', 400);
    }


    let aiResponse;

    if (!DIFY_API_KEY || DIFY_API_KEY === '') {
      console.error('[节气推荐] DIFY_API_KEY 未配置');
      if (process.env.NODE_ENV === 'development') {
        return success(res, getMockRecommendations(term, season));
      }
      return error(res, 'AI服务未配置', 503);
    }

    try {
      
      // 增加超时时间到180秒（3分钟），因为AI生成可能需要较长时间
      // DIFY_API_URL 已经是完整的URL（包含 /chat-messages），直接使用
      
      const requestStartTime = Date.now();
      const difyResponse = await axios.post(
        DIFY_API_URL,
        {
          inputs: {},
          query: prompt,
          user: `canteen_${req.user?.id || 'system'}`,
          response_mode: 'blocking'
        },
        {
          headers: {
            'Authorization': `Bearer ${DIFY_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 180000, // 180秒（3分钟）
          validateStatus: function (status) {
            // 允许所有状态码，不自动抛出错误
            return status >= 200 && status < 600;
          }
        }
      );
      
      const requestDuration = Date.now() - requestStartTime;

      aiResponse = difyResponse.data.answer;
    } catch (difyError) {
      console.error(chalk.red('[节气] Dify调用失败:'), difyError.message);

      // 处理超时错误
      if (difyError.code === 'ECONNABORTED' || difyError.message.includes('timeout')) {
        console.warn('[节气推荐] 请求超时，Dify API响应过慢');
        
        // 开发环境下直接返回模拟数据
        if (process.env.NODE_ENV === 'development') {
          return success(res, getMockRecommendations(term, season));
        }
        
        // 生产环境下返回友好的错误提示
        return error(res, 'AI服务响应超时，可能是服务器负载过高。建议稍后重试或使用模拟数据', 504);
      }

      if (difyError.response) {
        console.error('[节气推荐] 状态码:', difyError.response.status);
        console.error('[节气推荐] 错误详情:', difyError.response.data);

        if (difyError.response.status === 404) {
          try {
            // 使用工作流端点
            const workflowUrl = DIFY_CONFIG.workflowApiUrl || DIFY_API_URL.replace('/chat-messages', '/workflows/run');
            const workflowResponse = await axios.post(
              workflowUrl,
              {
                inputs: { query: prompt },
                user: `canteen_${req.user?.id || 'system'}`,
                response_mode: 'blocking'
              },
              {
                headers: {
                  'Authorization': `Bearer ${DIFY_API_KEY}`,
                  'Content-Type': 'application/json'
                },
                timeout: 180000 // 180秒（3分钟）
              }
            );

            aiResponse = workflowResponse.data.data?.outputs?.text ||
                        workflowResponse.data.data?.outputs?.result ||
                        JSON.stringify(workflowResponse.data.data?.outputs || {});
            console.log(chalk.green('[节气] 工作流调用成功'));
          } catch (workflowError) {
            console.error(chalk.red('[节气] 工作流调用失败:'), workflowError.message);
            
            // 如果工作流也超时，返回模拟数据
            if (workflowError.code === 'ECONNABORTED' || workflowError.message.includes('timeout')) {
              console.warn('[节气推荐] 工作流也超时，使用模拟数据');
              if (process.env.NODE_ENV === 'development') {
                return success(res, getMockRecommendations(term, season));
              }
              return error(res, 'AI服务响应超时，建议稍后重试', 504);
            }
            
            throw difyError;
          }
        } else {
          throw difyError;
        }
      } else {
        // 网络错误或其他错误
        console.error('[节气推荐] 网络错误或其他错误:', difyError.code);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[节气推荐] 使用模拟数据（网络错误降级）');
          return success(res, getMockRecommendations(term, season));
        }
        
        return error(res, 'AI服务连接失败，请检查网络或稍后重试', 503);
      }

      if (!aiResponse && process.env.NODE_ENV === 'development') {
        console.log('[节气推荐] 使用模拟数据');
        return success(res, getMockRecommendations(term, season));
      }

      return error(res, 'AI服务暂时不可用，请稍后重试', 503);
    }

    let dishes;
    try {

      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[0]);
        dishes = jsonData.dishes || [];
      } else {
        throw new Error('无法从AI响应中提取JSON');
      }
    } catch (parseError) {
      console.error('[节气推荐] JSON解析失败:', parseError.message);
      console.log('[节气推荐] 原始响应:', aiResponse);

      return success(res, getMockRecommendations(term, season));
    }

    const cleanedDishes = dishes.map(dish => {

      const nutritionData = typeof dish.nutrition === 'object' ? dish.nutrition : {};

      return {
        name: dish.name || '未命名菜品',
        reason: dish.reason || '营养均衡，适合当季',
        ingredients: Array.isArray(dish.ingredients) ? dish.ingredients : [],
        price: parseFloat(dish.price) || 12,
        popularity: parseInt(dish.popularity) || 85,

        nutrition: {
          calories: parseFloat(nutritionData.calories) || 0,
          protein: parseFloat(nutritionData.protein) || 0,
          fat: parseFloat(nutritionData.fat) || 0,
          carbs: parseFloat(nutritionData.carbs) || 0,
          fiber: parseFloat(nutritionData.fiber) || 0,
          vitaminA: parseFloat(nutritionData.vitaminA) || 0,
          vitaminC: parseFloat(nutritionData.vitaminC) || 0,
          vitaminD: parseFloat(nutritionData.vitaminD) || 0,
          vitaminE: parseFloat(nutritionData.vitaminE) || 0,
          calcium: parseFloat(nutritionData.calcium) || 0,
          iron: parseFloat(nutritionData.iron) || 0,
          zinc: parseFloat(nutritionData.zinc) || 0,
          sodium: parseFloat(nutritionData.sodium) || 0,
          potassium: parseFloat(nutritionData.potassium) || 0
        }
      };
    });

    console.log(chalk.green(`[节气] 成功生成${cleanedDishes.length}道菜品推荐`));

    success(res, {
      dishes: cleanedDishes,
      term,
      season,
      generatedAt: new Date()
    });
  } catch (err) {
    console.error('[节气推荐] 错误:', err);
    error(res, '获取AI推荐失败', 500);
  }
};

exports.addSeasonalDish = async (req, res) => {
  try {
    const dishData = req.body;

    console.log('[节气菜品] 接收到请求:', JSON.stringify(dishData, null, 2));

    if (!dishData.name) {
      console.error('[节气菜品] 错误: 菜品名称为空');
      return error(res, '菜品名称不能为空', 400);
    }

    const existingDish = await Dish.findOne({
      name: dishData.name,
      status: { $ne: -1 }
    });

    if (existingDish) {
      console.log(`[节气菜品] 菜品"${dishData.name}"已存在`);
      return error(res, `菜品"${dishData.name}"已存在于菜单中`, 400);
    }

    const newDish = new Dish({
      name: dishData.name,
      category: 'seasonal',
      price: parseFloat(dishData.price) || 12,
      description: dishData.description || dishData.reason || '',
      image: dishData.image || 'https://via.placeholder.com/150',
      ingredients: Array.isArray(dishData.ingredients) ? dishData.ingredients : [],

      nutrition: dishData.nutrition || {
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
      },

      nutritionDescription: generateNutritionDescription(dishData.nutrition),

      seasonal: true,
      solarTerm: dishData.solarTerm || '',

      isRecommended: true,
      isPopular: false,

      status: 1,
      stock: 100,

      averageRating: 0,
      reviewCount: 0,
      salesCount: 0
    });

    await newDish.save();

    console.log(chalk.green(`[节气] "${dishData.name}" 已加入菜单 (ID: ${newDish._id})`));
    console.log(chalk.blue(`[节气] 营养数据: 热量${newDish.nutrition.calories}kcal`));
    console.log(`[节气菜品] 营养描述: ${newDish.nutritionDescription || '无'}`);
    console.log(`[节气菜品] 食材列表: ${newDish.ingredients?.join('、') || '无'}`);

    success(res, {
      dish: newDish,
      message: '菜品已成功加入菜单'
    });
  } catch (err) {
    console.error('[节气菜品] 加入菜单失败:', err);
    console.error('[节气菜品] 错误详情:', err.message);
    console.error('[节气菜品] 错误堆栈:', err.stack);

    const errorMessage = err.message || '加入菜单失败';
    error(res, `加入菜单失败: ${errorMessage}`, 500);
  }
};

exports.pushToDingTalk = async (req, res) => {
  try {
    const { term, termDesc, dish } = req.body;

    console.log('[钉钉推送] 接收到请求:', { term, termDesc, dishName: dish?.name });

    if (!term || !dish || !dish.name) {
      console.error('[钉钉推送] 错误: 缺少必要参数');
      return error(res, '缺少必要参数（term、dish.name必填）', 400);
    }

    const webhookUrl = process.env.DINGTALK_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error('[钉钉推送] 错误: DINGTALK_WEBHOOK_URL 未配置');
      console.log('[钉钉推送] 提示: 在.env文件中添加 DINGTALK_WEBHOOK_URL=你的webhook地址');
      return error(res, '钉钉推送未配置，请在.env中配置DINGTALK_WEBHOOK_URL', 500);
    }

    console.log('[钉钉推送] Webhook地址已配置:', webhookUrl.substring(0, 50) + '...');

    let nutritionText = '富含多种营养元素';
    if (dish.nutrition && typeof dish.nutrition === 'object') {
      const nutrition = dish.nutrition;
      const nutritionItems = [];

      if (nutrition.calories > 0) nutritionItems.push(`${nutrition.calories}千卡`);
      if (nutrition.protein > 0) nutritionItems.push(`蛋白${nutrition.protein}g`);
      if (nutrition.fiber > 0) nutritionItems.push(`纤维${nutrition.fiber}g`);
      if (nutrition.fat > 0) nutritionItems.push(`脂肪${nutrition.fat}g`);
      if (nutrition.carbs > 0) nutritionItems.push(`碳水${nutrition.carbs}g`);

      if (nutritionItems.length > 0) {
        nutritionText = nutritionItems.join(' · ');
      }
    } else if (typeof dish.nutrition === 'string') {
      nutritionText = dish.nutrition;
    }

    const message = {
      msgtype: 'markdown',
      markdown: {
        title: `${term}节气·应季菜品推荐`,
        text: `## ${term}节气·应季菜品推荐\n\n` +
              `> ${termDesc || '应时而食，健康生活'}\n\n` +
              `### ${dish.name}\n\n` +
              `**推荐理由：** ${dish.reason || '营养均衡，适合当季食用'}\n\n` +
              `**营养特点：** ${nutritionText}\n\n` +
              `**主要食材：** ${dish.ingredients?.join('、') || '时令食材'}\n\n` +
              `**价格：** ¥${dish.price || 12}\n\n` +
              `---\n\n` +
              `立即前往食堂点餐，品尝应季美味！`
      }
    };

    try {
      let finalUrl = webhookUrl;

      const secret = process.env.DINGTALK_SECRET;
      if (secret) {
        const crypto = require('crypto');
        const timestamp = Date.now();
        const stringToSign = `${timestamp}\n${secret}`;
        const sign = crypto.createHmac('sha256', secret).update(stringToSign).digest('base64');

        const urlObj = new URL(webhookUrl);
        urlObj.searchParams.set('timestamp', timestamp);
        urlObj.searchParams.set('sign', sign);
        finalUrl = urlObj.toString();

        console.log('[钉钉推送] 使用加签安全设置');
      } else {
        console.log('[钉钉推送] 使用关键词安全设置');
      }

      const dingResponse = await axios.post(finalUrl, message, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log(chalk.green(`[钉钉] "${dish.name}" 推送成功`));

      success(res, {
        message: '推送成功',
        dingResponse: dingResponse.data
      });
    } catch (dingError) {
      console.error('[钉钉推送] 失败:', dingError.message);

      let errorMessage = '钉钉推送失败';
      let errorCode = 500;

      if (dingError.response) {
        console.error('[钉钉推送] 响应状态:', dingError.response.status);
        console.error('[钉钉推送] 响应数据:', dingError.response.data);

        const status = dingError.response.status;
        const data = dingError.response.data;

        if (status === 400) {
          errorMessage = '钉钉推送失败: 请求格式错误，请检查webhook配置';
          errorCode = 400;
        } else if (status === 403) {
          errorMessage = '钉钉推送失败: 机器人被禁用或权限不足';
          errorCode = 403;
        } else if (status === 404) {
          errorMessage = '钉钉推送失败: webhook地址不存在';
          errorCode = 404;
        } else if (data && data.errmsg) {
          errorMessage = `钉钉推送失败: ${data.errmsg}`;
        }
      } else if (dingError.code === 'ENOTFOUND') {
        errorMessage = '钉钉推送失败: 网络连接问题，请检查网络和URL';
        errorCode = 503;
      } else if (dingError.code === 'ECONNREFUSED') {
        errorMessage = '钉钉推送失败: 连接被拒绝，请检查URL';
        errorCode = 503;
      } else if (dingError.code === 'ETIMEDOUT') {
        errorMessage = '钉钉推送失败: 请求超时，请稍后重试';
        errorCode = 504;
      }

      console.error('[钉钉推送] 详细错误信息:', errorMessage);
      error(res, errorMessage, errorCode);
    }
  } catch (err) {
    console.error('[钉钉推送] 错误:', err);
    console.error('[钉钉推送] 错误详情:', err.message);
    error(res, `推送失败: ${err.message}`, 500);
  }
};

exports.getSeasonalDishes = async (req, res) => {
  try {
    const { term } = req.query;

    const query = {
      seasonal: true,
      status: { $ne: -1 }
    };

    if (term) {
      query.solarTerm = term;
    }

    const dishes = await Dish.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    success(res, dishes);
  } catch (err) {
    console.error('[节气菜品] 查询失败:', err);
    error(res, '查询失败', 500);
  }
};

exports.removeSeasonalDish = async (req, res) => {
  try {
    const { dishId } = req.params;

    console.log(`[节气菜品] 准备下架菜品，ID: ${dishId}`);

    if (!dishId || !dishId.match(/^[0-9a-fA-F]{24}$/)) {
      console.error('[节气菜品] 错误: 无效的菜品ID格式');
      return error(res, '无效的菜品ID', 400);
    }

    const dish = await Dish.findById(dishId);

    if (!dish) {
      console.error(`[节气菜品] 错误: 菜品不存在，ID: ${dishId}`);
      return error(res, '菜品不存在', 404);
    }

    console.log(`[节气菜品] 找到菜品: ${dish.name}`);

    await Dish.findByIdAndDelete(dishId);

    console.log(chalk.green(`[节气] "${dish.name}" 已删除`));
    success(res, {
      message: '删除成功',
      dishName: dish.name
    });
  } catch (err) {
    console.error('[节气菜品] 删除失败:', err);
    console.error('[节气菜品] 错误详情:', err.message);
    console.error('[节气菜品] 错误堆栈:', err.stack);

    if (err.name === 'ValidationError') {
      return error(res, `数据验证失败: ${err.message}`, 400);
    }

    error(res, `删除失败: ${err.message}`, 500);
  }
};

function generateNutritionDescription(nutrition) {
  if (!nutrition || typeof nutrition !== 'object') {
    return '富含多种营养元素';
  }

  const elements = [];

  if (nutrition.protein > 15) elements.push('蛋白质');
  if (nutrition.carbs > 30) elements.push('碳水化合物');
  if (nutrition.fiber > 3) elements.push('膳食纤维');

  if (nutrition.vitaminA > 100) elements.push('维生素A');
  if (nutrition.vitaminC > 20) elements.push('维生素C');
  if (nutrition.vitaminD > 1) elements.push('维生素D');
  if (nutrition.vitaminE > 3) elements.push('维生素E');

  if (nutrition.calcium > 80) elements.push('钙');
  if (nutrition.iron > 2) elements.push('铁');
  if (nutrition.zinc > 1) elements.push('锌');
  if (nutrition.potassium > 200) elements.push('钾');

  return elements.length > 0
    ? `富含${elements.join('、')}`
    : '营养均衡';
}

function getMockRecommendations(term, season) {
  const mockData = {
    spring: [
      {
        name: '春笋炒肉',
        reason: '春季时令菜品，春笋鲜嫩爽脆，搭配瘦肉营养均衡，富含膳食纤维和蛋白质',
        ingredients: ['春笋', '瘦肉', '青椒', '蒜'],
        price: 15,
        popularity: 88,
        nutrition: {
          calories: 420,
          protein: 22,
          fat: 18,
          carbs: 35,
          fiber: 6,
          vitaminA: 150,
          vitaminC: 25,
          vitaminD: 1,
          vitaminE: 4,
          calcium: 90,
          iron: 3.5,
          zinc: 2.5,
          sodium: 550,
          potassium: 380
        }
      },
      {
        name: '香椿炒鸡蛋',
        reason: '春季特色菜，香椿独特香气开胃，配合鸡蛋营养丰富，适合春季养生',
        ingredients: ['香椿', '鸡蛋', '盐'],
        price: 12,
        popularity: 85,
        nutrition: {
          calories: 380,
          protein: 18,
          fat: 16,
          carbs: 28,
          fiber: 4,
          vitaminA: 220,
          vitaminC: 35,
          vitaminD: 2,
          vitaminE: 6,
          calcium: 120,
          iron: 2.8,
          zinc: 1.8,
          sodium: 480,
          potassium: 320
        }
      }
    ],
    summer: [
      {
        name: '凉拌黄瓜',
        reason: '夏季清爽开胃，黄瓜水分充足消暑解渴，低卡路里适合夏季食用',
        ingredients: ['黄瓜', '蒜', '醋', '香油'],
        price: 8,
        popularity: 92,
        nutrition: {
          calories: 180,
          protein: 3,
          fat: 8,
          carbs: 15,
          fiber: 4,
          vitaminA: 80,
          vitaminC: 45,
          vitaminD: 0,
          vitaminE: 2,
          calcium: 50,
          iron: 1.2,
          zinc: 0.8,
          sodium: 420,
          potassium: 280
        }
      },
      {
        name: '番茄鸡蛋汤',
        reason: '夏季补充水分，番茄生津止渴，鸡蛋补充蛋白质，营养均衡',
        ingredients: ['番茄', '鸡蛋', '葱花'],
        price: 10,
        popularity: 90,
        nutrition: {
          calories: 320,
          protein: 15,
          fat: 12,
          carbs: 25,
          fiber: 3,
          vitaminA: 180,
          vitaminC: 40,
          vitaminD: 1.5,
          vitaminE: 4,
          calcium: 85,
          iron: 2.5,
          zinc: 1.5,
          sodium: 510,
          potassium: 340
        }
      }
    ],
    autumn: [
      {
        name: '栗子烧鸡',
        reason: '秋季滋补佳品，栗子香甜软糯，鸡肉蛋白质丰富，应季食材新鲜实惠',
        ingredients: ['板栗', '鸡肉', '姜', '葱'],
        price: 18,
        popularity: 87,
        nutrition: {
          calories: 520,
          protein: 28,
          fat: 20,
          carbs: 45,
          fiber: 5,
          vitaminA: 120,
          vitaminC: 18,
          vitaminD: 1,
          vitaminE: 5,
          calcium: 95,
          iron: 3.8,
          zinc: 3.2,
          sodium: 580,
          potassium: 420
        }
      },
      {
        name: '莲藕排骨汤',
        reason: '秋季润燥养肺，莲藕清脆爽口，排骨营养丰富，适合秋季进补',
        ingredients: ['莲藕', '排骨', '姜', '枸杞'],
        price: 16,
        popularity: 85,
        nutrition: {
          calories: 480,
          protein: 24,
          fat: 22,
          carbs: 38,
          fiber: 4,
          vitaminA: 100,
          vitaminC: 28,
          vitaminD: 0.5,
          vitaminE: 3,
          calcium: 150,
          iron: 4.2,
          zinc: 2.8,
          sodium: 620,
          potassium: 380
        }
      }
    ],
    winter: [
      {
        name: '羊肉火锅',
        reason: '冬季温补佳品，羊肉性温驱寒，配合时蔬营养全面，是冬季首选',
        ingredients: ['羊肉', '白菜', '豆腐', '粉丝'],
        price: 22,
        popularity: 92,
        nutrition: {
          calories: 580,
          protein: 32,
          fat: 25,
          carbs: 42,
          fiber: 6,
          vitaminA: 140,
          vitaminC: 22,
          vitaminD: 0.8,
          vitaminE: 4,
          calcium: 110,
          iron: 5.5,
          zinc: 4.2,
          sodium: 650,
          potassium: 450
        }
      },
      {
        name: '红烧牛肉',
        reason: '冬季高热量补充体力，牛肉蛋白质含量高，适合学生冬季进补',
        ingredients: ['牛肉', '土豆', '胡萝卜', '八角'],
        price: 20,
        popularity: 89,
        nutrition: {
          calories: 540,
          protein: 30,
          fat: 22,
          carbs: 40,
          fiber: 5,
          vitaminA: 280,
          vitaminC: 20,
          vitaminD: 0.6,
          vitaminE: 3.5,
          calcium: 85,
          iron: 4.8,
          zinc: 3.8,
          sodium: 590,
          potassium: 410
        }
      }
    ]
  };

  const dishes = mockData[season] || mockData.autumn;

  return {
    dishes: dishes.slice(0, 5),
    term,
    season,
    generatedAt: new Date(),
    isMock: true
  };
}

module.exports = exports;

