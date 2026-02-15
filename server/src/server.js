require("dotenv").config();
const express = require("express");
const cors = require("cors");
const chalk = require("chalk");
const compression = require("compression");
const connectDB = require("./config/database");
const errorHandler = require("./middleware/errorHandler");
const requestLogger = require("./middleware/requestLogger");
const { initBucket } = require("./config/minio");
const studentRoutes = require("./routes/student");
const parentRoutes = require("./routes/parent");
const schoolRoutes = require("./routes/school");
const canteenRoutes = require("./routes/canteen");
const unifiedRoutes = require("./routes/unified");
const roleQueryRoutes = require("./routes/roleQuery");
const monitoringRoutes = require("./routes/monitoring");
const tokenManagementRoutes = require("./routes/tokenManagement");
const routes = require("./routes");

const app = express();

connectDB();
initBucket();

// 启用 Gzip 压缩
app.use(
  compression({
    // 只压缩大于 1KB 的响应
    threshold: 1024,
    // 压缩级别 (0-9, 6是默认值，9是最高压缩)
    level: 6,
    // 过滤函数 - 只压缩文本类型
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
  }),
);

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 添加缓存控制中间件
app.use((req, res, next) => {
  // 静态资源缓存策略
  if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    // 静态资源缓存 7 天
    res.setHeader("Cache-Control", "public, max-age=604800, immutable");
  } else if (req.url.startsWith("/api/")) {
    // API 请求不缓存（或使用协商缓存）
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
  next();
});

// 使用美化的请求日志中间件
app.use(requestLogger);

for (const route of routes) {
  app.use(route.path, route.callback);
}

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "路由不存在",
    path: req.path,
  });
});

app.use(errorHandler);
const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, () => {
  console.log(`[服务器] 后端服务已启动 | 端口: ${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.error(chalk.red(`[错误] 未处理的Promise拒绝: ${err.message}`));
  server.close(() => process.exit(1));
});

module.exports = app;
