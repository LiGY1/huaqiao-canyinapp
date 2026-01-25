const AuthToken = require('../models/AuthToken');

/**
 * 角色查询接口的Token验证中间件
 * 支持多种方式传递Token：
 * 1. Authorization Header: Bearer <token>
 * 2. Query参数: ?token=<token>
 * 3. Body参数: {token: "<token>"}
 * 4. X-Token Header: X-Token: <token>
 */
exports.verifyRoleQueryToken = async (req, res, next) => {
  try {
    let token;
    
    // 优先级1: Authorization Header (Bearer Token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // 优先级2: Query参数
    if (!token && req.query.token) {
      token = req.query.token;
    }
    
    // 优先级3: Body参数
    if (!token && req.body.token) {
      token = req.body.token;
    }
    
    // 优先级4: X-Token Header
    if (!token && req.headers['x-token']) {
      token = req.headers['x-token'];
    }
    
    if (!token) {
      return res.status(401).json({
        error: '未授权，请提供token。支持方式：Authorization: Bearer <token> 或 URL参数 ?token=<token>'
      });
    }
    
    const isValid = await AuthToken.verifyToken(token);
    
    if (!isValid) {
      return res.status(401).json({
        error: 'Token无效或已失效'
      });
    }
    
    next();
  } catch (error) {
    console.error('Token验证失败:', error);
    return res.status(401).json({
      error: 'Token验证失败'
    });
  }
};

