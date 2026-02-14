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

app.use("/api/unified", unifiedRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/parent", parentRoutes);
app.use("/api/school", schoolRoutes);
app.use("/api/canteen", canteenRoutes);
app.use("/api/role-query", roleQueryRoutes);
app.use("/api/monitoring", monitoringRoutes);
app.use("/api/token-management", tokenManagementRoutes);

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


const NodeRSA = require('node-rsa');

// 1. 把前端用的公钥填在这里
const pubKeyData = `-----BEGIN PUBLIC KEY-----
...前端用的公钥...
-----END PUBLIC KEY-----`;

// 2. 把后端用的私钥填在这里
const priKeyData = `-----BEGIN RSA PRIVATE KEY-----
...后端用的私钥...
-----END RSA PRIVATE KEY-----`;

const txt = '123456'; // 测试密码

const { privateKey, publicKey } = require("./config/rsaKey")

try {
  // 模拟前端加密
  const keyPub = new NodeRSA(publicKey);
  keyPub.setOptions({ encryptionScheme: 'pkcs1' });
  const encrypted = keyPub.encrypt(txt, 'base64');
  console.log('加密结果:', encrypted);

  // 模拟后端解密
  const keyPri = new NodeRSA(privateKey);
  keyPri.setOptions({ encryptionScheme: 'pkcs1' });
  const decrypted = keyPri.decrypt(encrypted, 'utf8');

  console.log('解密结果:', decrypted);

  if (decrypted === txt) {
    console.log('✅ 密钥匹配成功！是传输或代码逻辑问题。');
  } else {
    console.log('❌ 解密内容不一致，密钥虽能运算但不匹配。');
  }
} catch (e) {
  console.log('❌ 报错了，说明密钥完全不匹配或格式错误:', e.message);
}