const chalk = require('chalk');
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // 🚀 MongoDB 连接池优化配置
    const options = {
      maxPoolSize: 50,           // 最大连接数（默认10）
      minPoolSize: 10,           // 最小连接数（默认0）
      maxIdleTimeMS: 30000,      // 连接空闲30秒后关闭
      serverSelectionTimeoutMS: 5000,  // 服务器选择超时5秒
      socketTimeoutMS: 45000,    // Socket超时45秒
      family: 4,                 // 使用IPv4
      // 性能优化
      retryWrites: true,         // 自动重试写入
      w: 'majority',             // 写入确认级别
      readPreference: 'primaryPreferred',  // 优先从主节点读取
      // 压缩传输（减少网络开销）
      compressors: ['zlib'],
      zlibCompressionLevel: 6
    };
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(chalk.green(`[数据库] MongoDB 已连接: ${conn.connection.name} @ ${conn.connection.host}`));
    
    // 检查并显示 Redis 缓存连接状态
    try {
      const cache = require('../utils/cache');
      // 给 Redis 一些时间完成连接
      await new Promise(resolve => setTimeout(resolve, 1000));
      const cacheStatus = cache.getConnectionStatus();
      console.log(cacheStatus.message);
    } catch (err) {
      console.log(chalk.yellow('[缓存] 使用内存缓存 (Redis 未配置)'));
    }
    
    console.log(chalk.cyan(`[API] Dify API 已连接`));
  } catch (error) {
    console.error(chalk.red(`[数据库] MongoDB 连接失败: ${error.message}`));
    process.exit(1);
  }
};

module.exports = connectDB;

