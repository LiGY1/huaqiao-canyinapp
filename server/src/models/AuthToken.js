const mongoose = require('mongoose');

/**
 * 永久Token模型
 * 系统仅允许存在一个有效Token
 * 重新生成Token时，旧Token立即失效
 */
const authTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUsedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

/**
 * 在创建新Token之前，将所有旧Token标记为无效
 */
authTokenSchema.statics.generateNewToken = async function() {
  // 使用UUID生成Token
  const { v4: uuidv4 } = require('uuid');
  const newToken = uuidv4();
  
  // 将旧Token全部标记为无效
  await this.updateMany({ isActive: true }, { isActive: false });
  
  // 创建新Token
  const tokenDoc = await this.create({
    token: newToken,
    isActive: true
  });
  
  return newToken;
};

/**
 * 验证Token是否有效
 */
authTokenSchema.statics.verifyToken = async function(token) {
  const tokenDoc = await this.findOne({ token, isActive: true });
  if (tokenDoc) {
    // 更新最后使用时间
    tokenDoc.lastUsedAt = new Date();
    await tokenDoc.save();
    return true;
  }
  return false;
};

module.exports = mongoose.model('AuthToken', authTokenSchema, 'auth');

