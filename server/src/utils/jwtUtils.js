const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const cacheManager = require('./cache');

/**
 * 生成 Token Key（用于 Redis 存储）
 */
function getTokenKey(token) {
  // 使用 token 的 hash 值作为 key，避免 key 过长
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return `jwt:token:${hash}`;
}

/**
 * 获取用户的所有 token key 模式
 */
function getUserTokensPattern(userId) {
  return `jwt:user:${userId}:*`;
}

/**
 * 获取用户的单个 token key
 */
function getUserTokenKey(userId, token) {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return `jwt:user:${userId}:${hash}`;
}

/**
 * 计算 token 的 TTL（秒）
 */
function getTokenTTL(token) {
  try {
    const decoded = jwt.decode(token);
    if (decoded && decoded.exp) {
      const now = Math.floor(Date.now() / 1000);
      const ttl = decoded.exp - now;
      // 如果已过期或即将过期，返回较小值
      return ttl > 0 ? ttl : 60;
    }
  } catch (error) {
    // 如果解析失败，返回默认值
  }
  // 默认 TTL：1 小时
  return 3600;
}

/**
 * 生成 Token 并存储到 Redis
 * @param {String} userId - 用户 ID
 * @param {Object} options - 选项 { role, expiresIn }
 * @returns {String} JWT Token
 */
exports.generateToken = async (userId, options = {}) => {
  const expiresIn = options.expiresIn || process.env.JWT_EXPIRE || '24h';
  
  const payload = {
    id: userId
  };

  if (options.role) {
    payload.role = options.role;
  }

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn
  });

  // 存储 token 到 Redis（白名单模式）
  try {
    const tokenKey = getTokenKey(token);
    const userTokenKey = getUserTokenKey(userId, token);
    const ttl = getTokenTTL(token);

    // 存储 token 到 Redis，value 存储用户 ID 和生成时间
    await cacheManager.set(tokenKey, {
      userId: userId.toString(),
      createdAt: new Date().toISOString(),
      role: options.role || null
    }, ttl);

    // 同时存储用户的 token 映射，方便批量管理
    await cacheManager.set(userTokenKey, {
      tokenHash: tokenKey.split(':').pop(),
      createdAt: new Date().toISOString()
    }, ttl);
  } catch (error) {
    // Redis 错误不应该阻止 token 生成，但记录日志
    console.error('[JWT] Redis 存储失败，但 token 已生成:', error.message);
  }

  return token;
};

/**
 * 生成永久 Token（不受 Redis TTL 限制，但仍存储在 Redis 中）
 */
exports.generatePermanentToken = async (userId, userRole = null) => {
  const payload = {
    id: userId,
    permanent: true
  };

  if (userRole) {
    payload.role = userRole;
  }

  const token = jwt.sign(payload, process.env.JWT_SECRET);

  // 存储永久 token 到 Redis（使用较长的 TTL，如 10 年）
  try {
    const tokenKey = getTokenKey(token);
    const userTokenKey = getUserTokenKey(userId, token);
    const longTTL = 60 * 60 * 24 * 365 * 10; // 10 年

    await cacheManager.set(tokenKey, {
      userId: userId.toString(),
      createdAt: new Date().toISOString(),
      role: userRole,
      permanent: true
    }, longTTL);

    await cacheManager.set(userTokenKey, {
      tokenHash: tokenKey.split(':').pop(),
      createdAt: new Date().toISOString(),
      permanent: true
    }, longTTL);
  } catch (error) {
    console.error('[JWT] Redis 存储失败，但 token 已生成:', error.message);
  }

  return token;
};

/**
 * 生成长生命周期 Token
 */
exports.generateLongLivedToken = async (userId, userRole = null) => {
  const payload = {
    id: userId,
    longLived: true
  };

  if (userRole) {
    payload.role = userRole;
  }

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '100y'
  });

  // 存储长生命周期 token 到 Redis
  try {
    const tokenKey = getTokenKey(token);
    const userTokenKey = getUserTokenKey(userId, token);
    const ttl = getTokenTTL(token);

    await cacheManager.set(tokenKey, {
      userId: userId.toString(),
      createdAt: new Date().toISOString(),
      role: userRole,
      longLived: true
    }, ttl);

    await cacheManager.set(userTokenKey, {
      tokenHash: tokenKey.split(':').pop(),
      createdAt: new Date().toISOString(),
      longLived: true
    }, ttl);
  } catch (error) {
    console.error('[JWT] Redis 存储失败，但 token 已生成:', error.message);
  }

  return token;
};

/**
 * 验证 Token（同步方法，保持向后兼容）
 * 仅验证 JWT 签名和过期时间，不检查 Redis
 */
exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * 验证 Token 并检查 Redis 缓存（异步方法）
 * @param {String} token - JWT Token
 * @returns {Object|null} 解码后的 token 信息，如果无效或不在缓存中则返回 null
 */
exports.verifyTokenWithCache = async (token) => {
  try {
    // 先验证 JWT 本身
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 检查 Redis 中是否存在（白名单检查）
    const tokenKey = getTokenKey(token);
    const cached = await cacheManager.get(tokenKey);
    
    if (!cached) {
      // Token 不在白名单中，视为无效
      return null;
    }

    // 验证用户 ID 是否匹配
    if (cached.userId !== decoded.id.toString()) {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * 使 Token 失效（从 Redis 中删除）
 * @param {String} token - JWT Token
 */
exports.revokeToken = async (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.id) {
      return false;
    }

    const tokenKey = getTokenKey(token);
    const userTokenKey = getUserTokenKey(decoded.id, token);

    await cacheManager.del(tokenKey);
    await cacheManager.del(userTokenKey);

    return true;
  } catch (error) {
    console.error('[JWT] 撤销 token 失败:', error.message);
    return false;
  }
};

/**
 * 撤销用户的所有 Token
 * @param {String} userId - 用户 ID
 */
exports.revokeUserTokens = async (userId) => {
  try {
    const pattern = getUserTokensPattern(userId);
    await cacheManager.delPattern(pattern);
    return true;
  } catch (error) {
    console.error('[JWT] 撤销用户所有 token 失败:', error.message);
    return false;
  }
};

/**
 * 检查 Token 是否在缓存中（可选：用于调试或管理功能）
 */
exports.isTokenCached = async (token) => {
  try {
    const tokenKey = getTokenKey(token);
    const cached = await cacheManager.get(tokenKey);
    return cached !== null;
  } catch (error) {
    return false;
  }
};

