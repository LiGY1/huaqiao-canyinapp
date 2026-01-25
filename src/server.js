require('dotenv').config();
const express = require('express');
const cors = require('cors');
const chalk = require('chalk');
const compression = require('compression');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const { initBucket } = require('./config/minio');

const studentRoutes = require('./routes/student');
const parentRoutes = require('./routes/parent');
const schoolRoutes = require('./routes/school');
const canteenRoutes = require('./routes/canteen');
const unifiedRoutes = require('./routes/unified');
const roleQueryRoutes = require('./routes/roleQuery');
const monitoringRoutes = require('./routes/monitoring');
const tokenManagementRoutes = require('./routes/tokenManagement');

const app = express();

connectDB();

initBucket();


// 启用 Gzip 压缩
app.use(compression({
  // 只压缩大于 1KB 的响应
  threshold: 1024,
  // 压缩级别 (0-9, 6是默认值，9是最高压缩)
  level: 6,
  // 过滤函数 - 只压缩文本类型
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 添加缓存控制中间件
app.use((req, res, next) => {
  // 静态资源缓存策略
  if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    // 静态资源缓存 7 天
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
  } else if (req.url.startsWith('/api/')) {
    // API 请求不缓存（或使用协商缓存）
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

// 使用美化的请求日志中间件
app.use(requestLogger);

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '服务器正在运行',
    author: '作者：沈异 (Shenyi)',
    organization: '为 星火工作坊 倾情打造',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/unified', unifiedRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/school', schoolRoutes);
app.use('/api/canteen', canteenRoutes);
app.use('/api/role-query', roleQueryRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/token-management', tokenManagementRoutes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '智膳伙伴后端 API',
    author: '作者：沈异 (Shenyi)',
    organization: '为 星火工作坊 倾情打造',
    version: '1.0.0',
    endpoints: {
      unified: '/api/unified',
      student: '/api/student',
      parent: '/api/parent',
      school: '/api/school',
      canteen: '/api/canteen',
      roleQuery: '/api/role-query/llm',
      monitoring: '/api/monitoring',
      tokenManagement: '/api/token-management'
    }
  });
});

// 404 处理必须在错误处理之前
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '路由不存在',
    path: req.path
  });
});

// 错误处理中间件必须放在最后
app.use(errorHandler);

const PORT = process.env.PORT || 8000;

const os = require('os');
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const server = app.listen(PORT, () => {
  const currentIP = getLocalIP();
  console.log(chalk.cyan('\n[服务器] 后端服务已启动'));
  console.log(chalk.gray(`[服务器] 端口: ${PORT} | IP: ${currentIP}`));
  console.log(chalk.gray('[服务器] 接口列表:'));
  console.log(chalk.gray(`[统一登录] http://${currentIP}:${PORT}/api/unified`));
  console.log(chalk.gray(`[学生端]   http://${currentIP}:${PORT}/api/student`));
  console.log(chalk.gray(`[家长端]   http://${currentIP}:${PORT}/api/parent`));
  console.log(chalk.gray(`[学校端]   http://${currentIP}:${PORT}/api/school`));
  console.log(chalk.gray(`[食堂端]   http://${currentIP}:${PORT}/api/canteen`));
  console.log(chalk.gray(`[角色查询] http://${currentIP}:${PORT}/api/role-query/llm`));
  console.log(chalk.gray(`[性能监控] http://${currentIP}:${PORT}/api/monitoring/stats`));
  console.log(chalk.gray(`[健康检查] http://${currentIP}:${PORT}/health`));
  console.log('');
});

process.on('unhandledRejection', (err) => {
  console.error(chalk.red(`[错误] 未处理的Promise拒绝: ${err.message}`));
  server.close(() => process.exit(1));
});

module.exports = app;

