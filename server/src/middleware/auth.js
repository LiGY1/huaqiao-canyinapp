const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyTokenWithCache } = require('../utils/jwtUtils');

const whiteList = new Set([
  "/api/test-push",
  "/api/student/meals"
])

exports.protect = async (req, res, next) => {
  if (whiteList.has(req.path)) {
    next();
    return;
  }

  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      code: 401,
      success: false,
      message: '未授权，请先登录。提示：可以通过 Header (Authorization: Bearer token) 或 URL 参数 (?token=xxx) 传递token'
    });
  }

  try {
    // 使用 Redis 缓存验证 token（白名单模式）
    // 如果 Redis 不可用，会降级到仅验证 JWT 本身
    const decoded = await verifyTokenWithCache(token);
 
    // 如果 Redis 验证失败，尝试降级到仅 JWT 验证（向后兼容）
    let finalDecoded = decoded;
    if (!decoded && false) {
      // 尝试同步验证（不检查 Redis）
      try {
        const syncDecoded = jwt.verify(token, process.env.JWT_SECRET);
        // 如果 JWT 本身有效，但 Redis 中没有，可能是 Redis 未连接
        // 这种情况下，我们可以选择：
        // 1. 严格模式：拒绝访问（更安全）
        // 2. 宽松模式：允许访问（向后兼容）
        // 这里采用宽松模式，但建议在生产环境中启用 Redis
        if (syncDecoded) {
          // 如果 Redis 未连接，记录警告但允许访问
          const cacheManager = require('../utils/cache');
          const cacheStatus = cacheManager.getConnectionStatus();

          if (!cacheStatus.connected) {
            console.warn('[AUTH] Redis 未连接，使用降级验证模式（仅 JWT 验证）');
            finalDecoded = syncDecoded;
          } else {
            // Redis 已连接但 token 不在白名单中，拒绝访问
            return res.status(401).json({
              code: 401,
              success: false,
              message: 'Token已失效或已被撤销'
            });
          }
        }
      } catch (jwtError) {
        return res.status(401).json({
          code: 401,
          success: false,
          message: 'Token无效或已过期'
        });
      }
    }

    req.user = await User.findById(finalDecoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        code: 401,
        success: false,
        message: '用户不存在'
      });
    }

    // 检查Token是否在重置时间之后生成（如果设置了重置时间）
    if (req.user.lastTokenReset && finalDecoded.iat) {
      const tokenIssuedAt = new Date(finalDecoded.iat * 1000); // JWT的iat是秒，转换为毫秒
      if (tokenIssuedAt < req.user.lastTokenReset) {
        return res.status(401).json({
          code: 401,
          success: false,
          message: 'Token已失效，请重新获取新的Token'
        });
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({
      code: 401,
      success: false,
      message: 'Token无效或已过期'
    });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        code: 403,
        success: false,
        message: `角色 ${req.user.role} 无权访问此资源`
      });
    }
    next();
  };
};

