const express = require('express');
const router = express.Router();
const AuthToken = require('../models/AuthToken');
const { protect } = require('../middleware/auth');

/**
 * Token 管理路由
 * 需要管理员权限
 */

/**
 * 路由测试接口
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Token管理路由正常',
    module: 'tokenManagement',
    availableEndpoints: [
      'GET /api/token-management/token',
      'GET /api/token-management/current',
      'POST /api/token-management/generate',
      'GET /api/token-management/history'
    ]
  });
});

/**
 * 获取当前有效的 Token（仅返回 token 字符串，用于工作流）
 * GET /api/token-management/token
 * 无需认证，直接返回当前有效的 token 字符串
 */
router.get('/token', async (req, res) => {
  try {
    const currentToken = await AuthToken.findOne({ isActive: true })
      .select('token')
      .lean();

    if (!currentToken) {
      return res.status(404).send('No active token found');
    }

    // 直接返回纯文本 token，方便工作流使用
    res.type('text/plain');
    res.send(currentToken.token);
  } catch (error) {
    console.error('获取 Token 失败:', error);
    res.status(500).send('Error retrieving token');
  }
});

/**
 * 获取当前有效的 Token（完整信息）
 * GET /api/token-management/current
 */
router.get('/current', protect, async (req, res) => {
  try {
    // 检查是否是管理员
    if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.role !== 'principal') {
      return res.status(403).json({
        success: false,
        error: '权限不足，仅管理员可访问'
      });
    }

    const currentToken = await AuthToken.findOne({ isActive: true })
      .select('token createdAt lastUsedAt')
      .lean();

    if (!currentToken) {
      return res.json({
        success: true,
        data: null,
        message: '当前没有有效的 Token'
      });
    }

    res.json({
      success: true,
      data: {
        token: currentToken.token,
        createdAt: currentToken.createdAt,
        lastUsedAt: currentToken.lastUsedAt
      }
    });
  } catch (error) {
    console.error('获取当前 Token 失败:', error);
    res.status(500).json({
      success: false,
      error: '获取 Token 失败: ' + error.message
    });
  }
});

/**
 * 生成新的 Token
 * POST /api/token-management/generate
 */
router.post('/generate', protect, async (req, res) => {
  try {
    // 检查是否是管理员
    if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.role !== 'principal') {
      return res.status(403).json({
        success: false,
        error: '权限不足，仅管理员可生成 Token'
      });
    }

    // 生成新 Token（这会自动将旧 Token 标记为无效）
    const newToken = await AuthToken.generateNewToken();

    res.json({
      success: true,
      data: {
        token: newToken,
        message: '新 Token 已生成，旧 Token 已失效'
      }
    });
  } catch (error) {
    console.error('生成新 Token 失败:', error);
    res.status(500).json({
      success: false,
      error: '生成 Token 失败: ' + error.message
    });
  }
});

/**
 * 获取 Token 历史记录
 * GET /api/token-management/history
 */
router.get('/history', protect, async (req, res) => {
  try {
    // 检查是否是管理员
    if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.role !== 'principal') {
      return res.status(403).json({
        success: false,
        error: '权限不足，仅管理员可访问'
      });
    }

    const limit = parseInt(req.query.limit) || 10;
    
    const tokens = await AuthToken.find()
      .select('token isActive createdAt lastUsedAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: tokens.map(t => ({
        token: t.token.substring(0, 8) + '...' + t.token.substring(t.token.length - 4), // 只显示部分 token
        fullToken: t.token,
        isActive: t.isActive,
        createdAt: t.createdAt,
        lastUsedAt: t.lastUsedAt
      }))
    });
  } catch (error) {
    console.error('获取 Token 历史失败:', error);
    res.status(500).json({
      success: false,
      error: '获取历史记录失败: ' + error.message
    });
  }
});

module.exports = router;

