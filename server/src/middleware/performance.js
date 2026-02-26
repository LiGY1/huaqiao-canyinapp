/**
 * 性能监控中间件
 * 记录请求处理时间和性能指标
 */

/**
 * 性能监控中间件
 */
exports.performanceMonitor = (req, res, next) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();

  // 保存原始的 res.json 和 res.send 方法
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  // 重写 res.json
  res.json = function(data) {
    logPerformance();
    return originalJson(data);
  };

  // 重写 res.send
  res.send = function(data) {
    logPerformance();
    return originalSend(data);
  };

  // 记录性能数据
  function logPerformance() {
    const duration = Date.now() - startTime;
    const endMemory = process.memoryUsage();
    const memoryUsed = {
      rss: ((endMemory.rss - startMemory.rss) / 1024 / 1024).toFixed(2),
      heapUsed: ((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024).toFixed(2)
    };

    // 添加性能头
    res.setHeader('X-Response-Time', `${duration}ms`);
    res.setHeader('X-Memory-Used', `${memoryUsed.heapUsed}MB`);

    // 性能日志
    const level = duration > 1000 ? '🐌' : duration > 500 ? '⚠️' : '✅';
    

    // 慢查询警告
    if (duration > 1000) {
      console.warn(`⚠️  慢查询警告: ${req.path} 耗时 ${duration}ms`);
      console.warn(`   参数:`, req.query);
    }
  }

  next();
};

/**
 * 查询优化建议中间件
 */
exports.queryOptimizationHints = (req, res, next) => {
  const hints = [];

  // 检查是否缺少限制参数
  if (req.query.view && ['students', 'teachers', 'parents', 'orders'].includes(req.query.view)) {
    if (!req.query.limit || parseInt(req.query.limit) > 100) {
      hints.push('建议添加 limit 参数限制返回数量（推荐 ≤ 100）');
    }
  }

  // 检查是否应该使用缓存
  if (req.query.view === 'overview' && !req.query.nocache) {
    hints.push('overview 视图已启用缓存，如需实时数据请添加 nocache=1');
  }

  // 检查是否使用了 format 参数
  if (!req.query.format && req.query.view !== 'help') {
    hints.push('建议添加 format=json 获得更快的响应速度');
  }

  // 将优化建议附加到请求对象
  req.optimizationHints = hints;

  next();
};

/**
 * 请求日志中间件
 */
exports.requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const userId = req.user?.id || req.user?._id || 'anonymous';
  const userRole = req.user?.role || 'unknown';
  
  
  // 记录查询参数（排除敏感信息）
  const safeQuery = { ...req.query };
  if (safeQuery.token) {
    safeQuery.token = safeQuery.token.substring(0, 10) + '...';
  }
  
  next();
};

/**
 * 错误追踪中间件
 */
exports.errorTracker = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  const userId = req.user?.id || req.user?._id || 'anonymous';
  
  console.error(`❌ [${timestamp}] 错误: ${err.message}`);
  console.error(`   用户: ${userId}`);
  console.error(`   路径: ${req.method} ${req.path}`);
  console.error(`   堆栈:`, err.stack);

  // 返回错误响应
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message,
    timestamp,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

