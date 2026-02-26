/**
 * 美化的请求日志中间件
 * 替代morgan，提供更友好的中文日志输出
 */

const chalk = require('chalk');

/**
 * 格式化时间戳
 */
function getTimestamp() {
  const now = new Date();
  return chalk.gray(now.toLocaleTimeString('zh-CN', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }));
}

/**
 * 格式化HTTP方法
 */
function formatMethod(method) {
  const colors = {
    'GET': chalk.blue,
    'POST': chalk.green,
    'PUT': chalk.yellow,
    'DELETE': chalk.red,
    'PATCH': chalk.cyan
  };
  const color = colors[method] || chalk.white;
  return color(method.padEnd(6));
}

/**
 * 格式化状态码
 */
function formatStatus(status) {
  if (status >= 200 && status < 300) {
    return chalk.green(status);
  } else if (status >= 300 && status < 400) {
    return chalk.cyan(status);
  } else if (status >= 400 && status < 500) {
    return chalk.yellow(status);
  } else {
    return chalk.red(status);
  }
}

/**
 * 格式化响应时间
 */
function formatTime(ms) {
  if (ms < 10) {
    return chalk.green(`${ms.toFixed(0)}ms`);
  } else if (ms < 100) {
    return chalk.cyan(`${ms.toFixed(0)}ms`);
  } else if (ms < 500) {
    return chalk.yellow(`${ms.toFixed(0)}ms`);
  } else {
    return chalk.red(`${ms.toFixed(0)}ms`);
  }
}

/**
 * 简化URL显示
 */
function formatUrl(url) {
  // 移除token参数中的值，保护隐私
  let displayUrl = url.replace(/([?&])token=[^&]+/, '$1token=***');
  
  // 解码中文字符
  try {
    displayUrl = decodeURIComponent(displayUrl);
  } catch (e) {
    // 解码失败，使用原始URL
  }
  
  // 截断过长的URL
  if (displayUrl.length > 100) {
    displayUrl = displayUrl.substring(0, 97) + '...';
  }
  
  return chalk.white(displayUrl);
}

/**
 * 美化的请求日志中间件
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();
  
  // 监听响应完成事件
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const timestamp = getTimestamp();
    const method = formatMethod(req.method);
    const url = formatUrl(req.originalUrl || req.url);
    const status = formatStatus(res.statusCode);
    const time = formatTime(duration);
    
    // 只输出重要的请求（排除health check等）
    if (req.url === '/health' || req.url === '/favicon.ico') {
      return;
    }
    
  });
  
  next();
}

module.exports = requestLogger;

