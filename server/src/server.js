require("dotenv").config();
const express = require("express");
const cors = require("cors");
const chalk = require("chalk");
const compression = require("compression");
const connectDB = require("./config/database");
const errorHandler = require("./middleware/errorHandler");
const { initBucket } = require("./config/minio");
const routes = require("./routes");

const app = express();

connectDB();
initBucket();

app.use(
  compression({
    threshold: 1024,
    level: 6,
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
app.use(require("./middleware/cacheRule"));

// 挂载路由
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

const server = app.listen(PORT);

server.on("listening", () => {
  console.log(`服务器已启动 | 端口: ${PORT}`);
})

process.on("unhandledRejection", (err) => {
  console.error(chalk.red(`[错误] 未处理的Promise拒绝: ${err.message}`));
  server.close(() => process.exit(1));
});

module.exports = app;
