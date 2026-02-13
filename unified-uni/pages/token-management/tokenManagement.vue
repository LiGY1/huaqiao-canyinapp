<template>
  <view class="token-admin">
    <!-- 密码验证界面 -->
    <view v-if="!isAuthenticated" class="auth-screen">
      <view class="auth-card">
        <text class="title">Token 管理后台</text>
        <text class="subtitle">访问密码验证</text>
        
        <form @submit.prevent="checkPassword" class="auth-form">
          <input 
            v-model="accessPassword" 
            type="password" 
            placeholder="请输入访问密码"
            class="password-input"
            autofocus
          />
          <button type="submit" class="auth-button" :disabled="loading">
            {{ loading ? '验证中...' : '进入' }}
          </button>
        </form>
        
        <text v-if="errorMessage" class="error-message">{{ errorMessage }}</text>
        
        <view class="hint">
          <text class="hint-text">快速访问：?password=nutriai2024</text>
        </view>
      </view>
    </view>

    <!-- Token 管理界面 -->
    <view v-else class="admin-screen">
      <view class="admin-header">
        <view class="header-content">
          <text class="header-title">Token 管理</text>
          <text class="header-subtitle">/api/role-query/llm 接口认证</text>
        </view>
        <button class="logout-button" @click="logout">退出</button>
      </view>

      <view class="admin-container">
        <!-- 当前 Token 卡片 -->
        <view class="card">
          <view class="card-header">
            <text class="card-title">当前 Token</text>
            <button 
              class="btn btn-primary" 
              @click="generateNewToken"
              :disabled="loading"
            >
              {{ loading ? '生成中...' : '生成新 Token' }}
            </button>
          </view>

          <view v-if="currentToken" class="token-info">
            <view class="token-display">
              <text class="label">Token</text>
              <view class="token-value">
                <code class="token-text">{{ currentToken.token }}</code>
                <button class="btn-copy" @click="copyToken(currentToken.token)">复制</button>
              </view>
            </view>

            <view class="token-meta">
              <view class="meta-item">
                <text class="label">创建时间</text>
                <text class="value">{{ formatDate(currentToken.createdAt) }}</text>
              </view>
              <view class="meta-item">
                <text class="label">最后使用</text>
                <text class="value">{{ formatDate(currentToken.lastUsedAt) }}</text>
              </view>
            </view>

            <view class="usage-section">
              <text class="section-title">使用方式</text>
              
              <view class="usage-item">
                <text class="usage-type">URL 参数</text>
                <code class="usage-code">{{ apiUrl }}/api/role-query/llm?token={{ currentToken.token }}&role=teacher&teacherName=张老师</code>
                <button class="btn-copy-small" @click="copyExample(1)">复制</button>
              </view>
              
              <view class="usage-item">
                <text class="usage-type">Authorization Header</text>
                <code class="usage-code">Authorization: Bearer {{ currentToken.token }}</code>
                <button class="btn-copy-small" @click="copyExample(2)">复制</button>
              </view>

              <view class="usage-item">
                <text class="usage-type">X-Token Header</text>
                <code class="usage-code">X-Token: {{ currentToken.token }}</code>
                <button class="btn-copy-small" @click="copyExample(3)">复制</button>
              </view>
            </view>
          </view>

          <view v-else class="no-token">
            <text class="no-token-text">当前没有有效的 Token</text>
            <button class="btn btn-primary" @click="generateNewToken">生成 Token</button>
          </view>
        </view>

        <!-- Token 历史记录 -->
        <view class="card">
          <view class="card-header">
            <text class="card-title">历史记录</text>
            <button class="btn btn-secondary" @click="loadHistory">刷新</button>
          </view>

          <view class="history-list">
            <view v-if="history.length === 0" class="no-history">
              暂无历史记录
            </view>
            <view 
              v-for="(item, index) in history" 
              :key="index"
              class="history-item"
              :class="{ active: item.isActive }"
            >
              <view class="history-token">
                <view class="status-badge" :class="{ active: item.isActive }">
                  {{ item.isActive ? '有效' : '已失效' }}
                </view>
                <code class="history-token-text">{{ item.token }}</code>
              </view>
              <view class="history-meta">
                <text class="meta-text">创建: {{ formatDate(item.createdAt) }}</text>
                <text class="meta-text">使用: {{ formatDate(item.lastUsedAt) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 通知提示 -->
    <uni-popup ref="notificationPopup" type="top" :duration="3000">
      <view class="notification" :class="notification.type">
        {{ notification.message }}
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// 状态
const isAuthenticated = ref(false);
const accessPassword = ref('');
const errorMessage = ref('');
const loading = ref(false);
const currentToken = ref(null);
const history = ref([]);
const notification = ref(null);
const apiUrl = ref('http://localhost:8000');
const notificationPopup = ref(null);

// 管理员 Token（登录后获取）
const adminToken = ref('');

// ========== 配置区域 ==========
// 修改这里的配置
const CONFIG = {
  ACCESS_PASSWORD: 'nutriai2024',        // 页面访问密码
  ADMIN_USERNAME: 'admin',          // 用于调用 API 的管理员账号
  ADMIN_PASSWORD: 'admin123'           // 管理员密码
};
// ==============================

// 密码验证（手动输入）
const checkPassword = async () => {
  if (!accessPassword.value) {
    errorMessage.value = '请输入访问密码';
    return;
  }

  if (accessPassword.value !== CONFIG.ACCESS_PASSWORD) {
    errorMessage.value = '密码错误';
    return;
  }

  // 密码正确，使用配置的管理员账号登录获取 API 权限
  loading.value = true;
  try {
    const response = await uni.request({
      url: `${apiUrl.value}/api/school/auth/login`,
      method: 'POST',
      data: {
        username: CONFIG.ADMIN_USERNAME,
        password: CONFIG.ADMIN_PASSWORD
      }
    });

    if (response.data.success && response.data.data.token) {
      adminToken.value = response.data.data.token;
      isAuthenticated.value = true;
      uni.setStorageSync('token_admin_auth', adminToken.value);
      uni.setStorageSync('token_admin_password', accessPassword.value);
      loadCurrentToken();
      loadHistory();
    } else {
      errorMessage.value = '系统配置错误';
    }
  } catch (error) {
    console.error('获取 API 权限失败:', error);
    errorMessage.value = '系统配置错误，请检查 CONFIG 中的管理员账号';
  } finally {
    loading.value = false;
  }
};

// 退出登录
const logout = () => {
  isAuthenticated.value = false;
  adminToken.value = '';
  accessPassword.value = '';
  uni.removeStorageSync('token_admin_auth');
  uni.removeStorageSync('token_admin_password');
};

// 获取当前 Token
const loadCurrentToken = async () => {
  try {
    const response = await uni.request({
      url: `${apiUrl.value}/api/token-management/current`,
      method: 'GET',
      header: {
        Authorization: `Bearer ${adminToken.value}`
      }
    });

    if (response.data.success && response.data.data) {
      currentToken.value = response.data.data;
    } else {
      currentToken.value = null;
    }
  } catch (error) {
    console.error('获取当前 Token 失败:', error);
    if (error.response?.status === 401) {
      logout();
    }
  }
};

// 生成新 Token
const generateNewToken = async () => {
  uni.showModal({
    title: '确认生成',
    content: '确定要生成新的 Token 吗？\n\n注意：这将使旧 Token 立即失效！',
    success: async (res) => {
      if (res.confirm) {
        loading.value = true;
        try {
          const response = await uni.request({
            url: `${apiUrl.value}/api/token-management/generate`,
            method: 'POST',
            data: {},
            header: {
              Authorization: `Bearer ${adminToken.value}`
            }
          });

          if (response.data.success) {
            showNotification('生成成功，旧 Token 已失效', 'success');
            await loadCurrentToken();
            await loadHistory();
          }
        } catch (error) {
          console.error('生成 Token 失败:', error);
          showNotification('生成失败: ' + (error.response?.data?.error || error.message), 'error');
        } finally {
          loading.value = false;
        }
      }
    }
  });
};

// 获取历史记录
const loadHistory = async () => {
  try {
    const response = await uni.request({
      url: `${apiUrl.value}/api/token-management/history?limit=10`,
      method: 'GET',
      header: {
        Authorization: `Bearer ${adminToken.value}`
      }
    });

    if (response.data.success) {
      history.value = response.data.data;
    }
  } catch (error) {
    console.error('获取历史记录失败:', error);
  }
};

// 复制 Token
const copyToken = async (token) => {
  try {
    await uni.setClipboardData({
      data: token
    });
    showNotification('复制成功', 'success');
  } catch (error) {
    console.error('复制失败:', error);
    showNotification('复制失败', 'error');
  }
};

// 复制使用示例
const copyExample = async (type) => {
  let text = '';
  if (type === 1) {
    text = `${apiUrl.value}/api/role-query/llm?token=${currentToken.value.token}&role=teacher&teacherName=张老师`;
  } else if (type === 2) {
    text = `Authorization: Bearer ${currentToken.value.token}`;
  } else if (type === 3) {
    text = `X-Token: ${currentToken.value.token}`;
  }

  try {
    await uni.setClipboardData({
      data: text
    });
    showNotification('复制成功', 'success');
  } catch (error) {
    console.error('复制失败:', error);
    showNotification('复制失败', 'error');
  }
};

// 格式化日期
const formatDate = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// 显示通知
const showNotification = (message, type = 'info') => {
  notification.value = { message, type };
  notificationPopup.value?.open();
};

// 初始化
onMounted(async () => {
  // 检查存储中的认证信息
  const savedAuth = uni.getStorageSync('token_admin_auth');
  const savedPassword = uni.getStorageSync('token_admin_password');
  
  if (savedAuth && savedPassword) {
    adminToken.value = savedAuth;
    accessPassword.value = savedPassword;
    isAuthenticated.value = true;
    loadCurrentToken();
    loadHistory();
    return;
  }
  
  // 检查 URL 参数中的密码，自动验证
  const urlPassword = route.query.password;
  
  if (urlPassword) {
    accessPassword.value = urlPassword;
    await checkPassword();
  }
});
</script>

<style scoped>
.token-admin {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 认证界面 */
.auth-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.auth-card {
  background: white;
  border-radius: 24px;
  padding: 3rem;
  max-width: 450px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
  animation: slideIn 0.5s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.title {
  font-size: 2rem;
  color: #1f2937;
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.subtitle {
  color: #6b7280;
  display: block;
  margin-bottom: 2rem;
}

.auth-form {
  margin-bottom: 1.5rem;
}

.password-input {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  margin-bottom: 1rem;
  transition: all 0.3s;
}

.password-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.auth-button {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.auth-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
}

.auth-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  color: #ef4444;
  font-weight: 600;
  margin-bottom: 1rem;
  display: block;
}

.hint {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
  text-align: left;
}

.hint-text {
  color: #6b7280;
  font-size: 0.9rem;
  display: block;
  margin-bottom: 0.5rem;
}

/* 管理界面 */
.admin-screen {
  min-height: 100vh;
  padding: 2rem;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  color: white;
}

.header-title {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.header-subtitle {
  opacity: 0.9;
  display: block;
}

.logout-button {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
}

.logout-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.admin-container {
  max-width: 1200px;
  margin: 0 auto;
}

.card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  margin-bottom: 2rem;
  animation: fadeInUp 0.5s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f3f4f6;
}

.card-title {
  font-size: 1.5rem;
  color: #1f2937;
  font-weight: bold;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover {
  background: #d1d5db;
}

.token-display {
  margin-bottom: 1.5rem;
}

.label {
  font-weight: 600;
  color: #374151;
  display: block;
  margin-bottom: 0.5rem;
}

.token-value {
  display: flex;
  align-items: center;
  background: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
}

.token-text {
  flex: 1;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.9rem;
  color: #059669;
  word-break: break-all;
}

.token-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.meta-item {
  display: flex;
  flex-direction: column;
}

.meta-item .label {
  font-weight: 600;
  color: #6b7280;
  font-size: 0.85rem;
  margin-bottom: 0.3rem;
}

.meta-item .value {
  color: #1f2937;
  font-size: 1rem;
}

.usage-section {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.section-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
  display: block;
}

.usage-item {
  background: white;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 0.75rem;
  border: 1px solid #e5e7eb;
  position: relative;
}

.usage-item:last-child {
  margin-bottom: 0;
}

.usage-type {
  display: block;
  color: #6b7280;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.usage-code {
  display: block;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.8rem;
  color: #1e40af;
  word-break: break-all;
  padding-right: 4rem;
  line-height: 1.4;
}

.btn-copy {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.2s;
}

.btn-copy:hover {
  background: #2563eb;
}

.btn-copy-small {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  padding: 0.25rem 0.75rem;
  background: #e5e7eb;
  color: #374151;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: background 0.2s;
}

.btn-copy-small:hover {
  background: #d1d5db;
}

.no-token {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.no-token-text {
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  display: block;
}

.history-list {
  max-height: 400px;
  overflow-y: auto;
}

.no-history {
  text-align: center;
  padding: 2rem;
  color: #9ca3af;
  font-size: 1rem;
}

.history-item {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0.8rem;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  transition: all 0.2s;
}

.history-item.active {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border-color: #10b981;
}

.history-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.history-token {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.status-badge {
  padding: 0.3rem 0.8rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  margin-right: 1rem;
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.active {
  background: #d1fae5;
  color: #065f46;
}

.history-token-text {
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.85rem;
  color: #6b7280;
}

.history-meta {
  display: flex;
  gap: 2rem;
  font-size: 0.85rem;
  color: #6b7280;
}

.meta-text {
  display: block;
}

.notification {
  padding: 1rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  color: white;
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification.success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.notification.error {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

/* 适配移动端 */
@media (max-width: 768px) {
  .admin-screen {
    padding: 1rem;
  }

  .auth-card {
    padding: 2rem;
  }

  .admin-header {
    flex-direction: column;
    gap: 1rem;
  }

  .card {
    padding: 1.5rem;
  }

  .card-header {
    flex-direction: column;
    gap: 1rem;
  }

  .token-meta {
    grid-template-columns: 1fr;
  }

  .history-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>