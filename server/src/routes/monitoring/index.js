/**
 * 性能监控路由
 * 提供实时性能统计和监控数据
 */

const express = require('express');
const router = express.Router();
const cache = require('../../utils/cache');
const preheater = require('../../utils/cachePreheating');
const deduplicator = require('../../utils/requestDeduplicator');
const compressionHelper = require('../../utils/compressionHelper');

/**
 * 路由测试接口
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: '监控路由正常',
    module: 'monitoring',
    availableEndpoints: [
      'GET /api/monitoring/stats',
      'GET /api/monitoring/cache',
      'GET /api/monitoring/health'
    ]
  });
});

/**
 * 获取完整性能统计
 */
router.get('/stats', (req, res) => {
  try {
    const stats = {
      timestamp: new Date().toISOString(),
      cache: cache.getCacheStats(),
      preheater: preheater.getStats(),
      deduplicator: deduplicator.getStats(),
      compression: compressionHelper.getStats(),
      system: {
        uptime: process.uptime(),
        memory: {
          used: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB',
          total: (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2) + ' MB',
          rss: (process.memoryUsage().rss / 1024 / 1024).toFixed(2) + ' MB'
        },
        cpu: process.cpuUsage()
      }
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 获取缓存统计
 */
router.get('/cache', (req, res) => {
  try {
    const stats = cache.getCacheStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 获取预热统计
 */
router.get('/preheater', (req, res) => {
  try {
    const stats = preheater.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 获取去重统计
 */
router.get('/deduplicator', (req, res) => {
  try {
    const stats = deduplicator.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 获取压缩统计
 */
router.get('/compression', (req, res) => {
  try {
    const stats = compressionHelper.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 重置统计数据
 */
router.post('/reset', (req, res) => {
  try {
    deduplicator.resetStats();
    res.json({ message: '统计数据已重置' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 健康检查
 */
router.get('/health', (req, res) => {
  try {
    const cacheStatus = cache.getConnectionStatus();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      cache: cacheStatus,
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      error: error.message 
    });
  }
});

module.exports = router;
