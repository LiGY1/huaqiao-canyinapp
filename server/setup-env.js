/**
 * 自动创建 .env 配置文件（统一门户模式）
 * 运行命令：node setup-env.js
 */

const fs = require('fs');
const path = require('path');

const envContent = `# ==================== 统一门户模式配置 ====================
# 使用统一端口模式（所有前端通过同一端口的不同路径访问）
USE_UNIFIED_PORT=true
UNIFIED_PORT=1000
UNIFIED_BASE_URL=http://localhost:1000

# ========== 后端服务器配置 ==========
PORT=8000

# ========== 数据库配置 ==========
MONGODB_URI=mongodb://localhost:27017/nutriai

# ========== Redis 配置 ==========
REDIS_HOST=localhost
REDIS_PORT=6379

# ========== JWT 配置 ==========
JWT_SECRET=nutriai-jwt-secret-key-change-in-production-2024
JWT_EXPIRES_IN=7d

# ========== MinIO 配置（对象存储）==========
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=nutriai

# ========== Dify AI 配置（可选）==========
DIFY_API_URL=http://171.111.194.87/v1/chat-messages
DIFY_API_KEY=app-IHUOYKE2fAyNPXkLVGBdJTPs

# ========== CORS 配置 ==========
# 允许的跨域源（统一端口模式 + 各独立端口，兼容开发环境）
CORS_ORIGIN=http://localhost:1000,http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:5177,http://localhost:8000

# ========== 环境 ==========
NODE_ENV=development

# ========== 日志级别 ==========
LOG_LEVEL=info
`;

const envPath = path.join(__dirname, '.env');

// 备份现有 .env 文件（如果存在）
if (fs.existsSync(envPath)) {
  const backupPath = path.join(__dirname, '.env.backup');
  fs.copyFileSync(envPath, backupPath);
  console.log('✓ 已备份现有 .env 文件到 .env.backup');
}

// 创建新的 .env 文件
fs.writeFileSync(envPath, envContent, 'utf8');
console.log('✓ 已创建 .env 文件（统一门户模式）');
console.log('✓ 配置内容：');
console.log('  - USE_UNIFIED_PORT=true');
console.log('  - UNIFIED_PORT=1000');
console.log('  - UNIFIED_BASE_URL=http://localhost:1000');
console.log('\n请重启后端服务以应用新配置！');

