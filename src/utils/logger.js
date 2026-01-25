/**
 * 美化的日志工具
 * 支持彩色输出和中文友好
 */

const chalk = require('chalk');

/**
 * 格式化时间戳
 */
function getTimestamp() {
  return new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '-');
}

/**
 * 信息日志
 */
function info(category, message, details = '') {
  const timestamp = chalk.gray(getTimestamp());
  const cat = chalk.cyan(`[${category}]`);
  const msg = chalk.white(message);
  const det = details ? chalk.gray(details) : '';
  console.log(`${timestamp} ${cat} ${msg} ${det}`);
}

/**
 * 成功日志
 */
function success(category, message, details = '') {
  const timestamp = chalk.gray(getTimestamp());
  const cat = chalk.green(`[${category}]`);
  const msg = chalk.white(message);
  const det = details ? chalk.gray(details) : '';
  console.log(`${timestamp} ${cat} ${msg} ${det}`);
}

/**
 * 警告日志
 */
function warn(category, message, details = '') {
  const timestamp = chalk.gray(getTimestamp());
  const cat = chalk.yellow(`[${category}]`);
  const msg = chalk.white(message);
  const det = details ? chalk.gray(details) : '';
  console.log(`${timestamp} ${cat} ${msg} ${det}`);
}

/**
 * 错误日志
 */
function error(category, message, details = '') {
  const timestamp = chalk.gray(getTimestamp());
  const cat = chalk.red(`[${category}]`);
  const msg = chalk.white(message);
  const det = details ? chalk.red(details) : '';
  console.error(`${timestamp} ${cat} ${msg} ${det}`);
}

/**
 * 缓存日志
 */
function cache(action, details = '') {
  const timestamp = chalk.gray(getTimestamp());
  const cat = chalk.magenta('[缓存]');
  
  let actionText = '';
  
  if (action === 'hit') {
    actionText = chalk.green('命中');
  } else if (action === 'miss') {
    actionText = chalk.yellow('未命中');
  } else if (action === 'set') {
    actionText = chalk.blue('设置');
  } else if (action === 'del') {
    actionText = chalk.red('删除');
  }
  
  const det = details ? chalk.gray(details) : '';
  console.log(`${timestamp} ${cat} ${actionText} ${det}`);
}

/**
 * API请求日志
 */
function api(method, path, status, time, details = '') {
  const timestamp = chalk.gray(getTimestamp());
  
  let statusColor;
  if (status >= 200 && status < 300) {
    statusColor = chalk.green(status);
  } else if (status >= 300 && status < 400) {
    statusColor = chalk.cyan(status);
  } else if (status >= 400 && status < 500) {
    statusColor = chalk.yellow(status);
  } else {
    statusColor = chalk.red(status);
  }
  
  const methodColor = method === 'GET' ? chalk.blue(method) : chalk.cyan(method);
  const pathText = chalk.white(path);
  const timeText = time ? chalk.gray(`${time}ms`) : '';
  const det = details ? chalk.gray(details) : '';
  
  console.log(`${timestamp} ${methodColor} ${pathText} ${statusColor} ${timeText} ${det}`);
}

module.exports = {
  info,
  success,
  warn,
  error,
  cache,
  api,
  getTimestamp
};

