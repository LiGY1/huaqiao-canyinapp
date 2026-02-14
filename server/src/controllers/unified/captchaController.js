const { success, error } = require("../../utils/responseFormatter");

/**
 * 生成滑块验证码
 * 实际项目中应该生成真实的拼图验证码图片
 */
exports.generateCaptcha = async (req, res) => {
  try {
    // 生成随机的正确位置（60-240之间）
    const correctOffset = Math.floor(Math.random() * 180) + 60;
    
    // 生成唯一的验证码ID
    const captchaId = `captcha_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 实际项目中应该：
    // 1. 生成拼图背景图和拼图块
    // 2. 将正确位置存储到Redis中，设置5分钟过期
    // 3. 返回图片URL和验证码ID
    
    // 这里返回模拟数据
    success(res, {
      captchaId,
      background: `https://picsum.photos/300/150?random=${Date.now()}`,
      piece: `https://picsum.photos/60/150?random=${Date.now() + 1}`,
      // 不返回正确位置给前端，验证时在后端比对
    });
  } catch (err) {
    console.error("[Captcha] 生成验证码失败:", err);
    error(res, "生成验证码失败", 500);
  }
};

/**
 * 验证滑块验证码
 */
exports.verifyCaptcha = async (req, res) => {
  try {
    const { captchaId, offset } = req.body;
    
    if (!captchaId || offset === undefined) {
      return error(res, "参数错误", 400);
    }
    
    // 实际项目中应该：
    // 1. 从Redis中获取该验证码ID对应的正确位置
    // 2. 比对用户提交的位置和正确位置（允许±10px误差）
    // 3. 验证通过后删除Redis中的记录（防止重复使用）
    
    // 这里返回模拟验证结果
    // 实际应该从Redis获取正确位置进行比对
    const mockCorrectOffset = 150; // 模拟的正确位置
    const diff = Math.abs(offset - mockCorrectOffset);
    const isValid = diff <= 10;
    
    if (isValid) {
      success(res, { valid: true }, "验证成功");
    } else {
      success(res, { valid: false }, "验证失败");
    }
  } catch (err) {
    console.error("[Captcha] 验证失败:", err);
    error(res, "验证失败", 500);
  }
};

module.exports = exports;
