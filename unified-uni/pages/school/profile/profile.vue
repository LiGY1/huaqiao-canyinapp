<template>
  <layout>
    <scroll-view class="profile-page" scroll-y>
      <!-- 个人信息卡片 -->
      <view class="profile-card info-card">
        <view class="header-section">
          <view class="avatar-box">
            <uni-icons type="person-filled" size="60" color="#4facfe"></uni-icons>
          </view>
          <view class="user-main">
            <text class="user-name">{{ userInfo.name || '未登入' }}</text>
            <view class="role-badge">{{ roleLabel }}</view>
          </view>
          <text class="school-name" v-if="userInfo.schoolName">{{ userInfo.schoolName }}</text>
        </view>
        
        <view class="info-list">
          <view class="info-item">
            <text class="label">用户名</text>
            <text class="value">{{ userInfo.username || '-' }}</text>
          </view>
          <view class="info-item">
            <text class="label">手机号</text>
            <text class="value">{{ userInfo.phone || '-' }}</text>
          </view>
          <view class="info-item">
            <text class="label">邮箱</text>
            <text class="value">{{ userInfo.email || '-' }}</text>
          </view>
          <view class="info-item" v-if="userInfo.department">
            <text class="label">部门</text>
            <text class="value">{{ userInfo.department }}</text>
          </view>
          <view class="info-item" v-if="userInfo.managedClasses && userInfo.managedClasses.length">
            <text class="label">管理班级</text>
            <text class="value">{{ userInfo.managedClasses.join(', ') }}</text>
          </view>
        </view>
      </view>

      <!-- 账户设置表单 -->
      <view class="profile-card">
        <view class="card-title">
          <uni-icons type="settings" size="20" color="#4facfe"></uni-icons>
          <text>账户设置</text>
        </view>
        <view class="form-body">
          <view class="input-group">
            <text class="label">姓名</text>
            <input v-model="form.name" placeholder="请输入姓名" class="profile-input" />
          </view>
          <view class="input-group">
            <text class="label">手机号</text>
            <input v-model="form.phone" placeholder="请输入手机号" class="profile-input" />
          </view>
          <view class="input-group">
            <text class="label">邮箱</text>
            <input v-model="form.email" placeholder="请输入邮箱" class="profile-input" />
          </view>
          <button class="submit-btn" :loading="loading" @click="saveProfile">保存修改</button>
        </view>
      </view>

      <!-- 修改密码 -->
      <view class="profile-card">
        <view class="card-title">
          <uni-icons type="locked" size="20" color="#f59e0b"></uni-icons>
          <text>修改密码</text>
        </view>
        <view class="form-body">
          <view class="input-group">
            <text class="label">原密码</text>
            <input v-model="passwordForm.oldPassword" type="password" placeholder="请输入原密码" class="profile-input" />
          </view>
          <view class="input-group">
            <text class="label">新密码</text>
            <input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码（不少于6位）" class="profile-input" />
          </view>
          <view class="input-group">
            <text class="label">确认新密码</text>
            <input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" class="profile-input" />
          </view>
          <button class="submit-btn orange" :loading="passwordLoading" @click="changePassword">修改密码</button>
        </view>
      </view>

      <view class="logout-section">
        <button class="logout-btn" @click="handleLogout">退出登录</button>
      </view>
    </scroll-view>
  </layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import layout from '@/components/layout.vue';
import { authApi } from '@/api/school/auth';
import storage from '@/utils/storage';

const userInfo = ref({});
const loading = ref(false);
const passwordLoading = ref(false);

const form = ref({
  name: '',
  phone: '',
  email: ''
});

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const roleLabels = {
  'teacher': '班主任',
  'principal': '校长',
  'admin': '学校管理员'
};

const roleLabel = computed(() => {
  return roleLabels[userInfo.value.role] || '教职工';
});

const loadUserInfo = async () => {
  const info = storage.getUserInfo();
  if (info) {
    userInfo.value = info;
    form.value = {
      name: info.name || '',
      phone: info.phone || '',
      email: info.email || ''
    };
  }
};

const saveProfile = async () => {
  if (!form.value.name) {
    uni.showToast({ title: '姓名不能为空', icon: 'none' });
    return;
  }
  
  try {
    loading.value = true;
    const res = await authApi.updateProfile(form.value);
    if (res.code === 200 || res.success) {
      uni.showToast({ title: '保存成功', icon: 'success' });
      // 更新本地存储
      const updatedInfo = { ...userInfo.value, ...form.value };
      storage.setUserInfo(updatedInfo);
      userInfo.value = updatedInfo;
    } else {
      uni.showToast({ title: res.message || '修改失败', icon: 'none' });
    }
  } catch (e) {
    uni.showToast({ title: '网络错误', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

const changePassword = async () => {
  const { oldPassword, newPassword, confirmPassword } = passwordForm.value;
  if (!oldPassword || !newPassword) {
    uni.showToast({ title: '请填写完整', icon: 'none' });
    return;
  }
  if (newPassword.length < 6) {
    uni.showToast({ title: '新密码不能少于6位', icon: 'none' });
    return;
  }
  if (newPassword !== confirmPassword) {
    uni.showToast({ title: '两次输入不一致', icon: 'none' });
    return;
  }

  try {
    passwordLoading.value = true;
    const res = await authApi.changePassword({ oldPassword, newPassword });
    if (res.code === 200 || res.success) {
      uni.showToast({ title: '修改成功', icon: 'success' });
      passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
    } else {
      uni.showToast({ title: res.message || '修改失败', icon: 'none' });
    }
  } catch (e) {
    uni.showToast({ title: '网络错误', icon: 'none' });
  } finally {
    passwordLoading.value = false;
  }
};

const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        storage.clearAuth();
        uni.reLaunch({ url: '/pages/login/login' });
      }
    }
  });
};

onMounted(() => {
  loadUserInfo();
});
</script>

<style lang="scss" scoped>
.profile-page {
  padding: 30rpx;
  background-color: #f8fafc;
  height: 100%;
}

.profile-card {
  background-color: #fff;
  border-radius: 24rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.header-section {
  padding: 60rpx 40rpx;
  background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  border-bottom: 1rpx solid #f1f5f9;

  .avatar-box {
    width: 140rpx;
    height: 140rpx;
    background-color: #fff;
    border-radius: 70rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10rpx 30rpx rgba(79, 172, 254, 0.2);
    margin-bottom: 24rpx;
  }
  
  .user-main {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 12rpx;
    .user-name { font-size: 36rpx; font-weight: bold; color: #1e293b; }
    .role-badge {
      font-size: 20rpx;
      padding: 4rpx 16rpx;
      background: rgba(79, 172, 254, 0.1);
      color: #4facfe;
      border-radius: 20rpx;
      font-weight: 500;
    }
  }
  
  .school-name { font-size: 26rpx; color: #64748b; }
}

.info-list {
  padding: 20rpx 40rpx;
  .info-item {
    display: flex;
    justify-content: space-between;
    padding: 30rpx 0;
    border-bottom: 1rpx solid #f1f5f9;
    &:last-child { border-bottom: none; }
    .label { font-size: 28rpx; color: #94a3b8; }
    .value { font-size: 28rpx; color: #334155; font-weight: 500; }
  }
}

.card-title {
  padding: 30rpx 40rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  border-bottom: 1rpx solid #f1f5f9;
  text { font-size: 30rpx; font-weight: bold; color: #1e293b; }
}

.form-body {
  padding: 30rpx 40rpx 40rpx;
}

.input-group {
  margin-bottom: 30rpx;
  .label { font-size: 26rpx; color: #64748b; margin-bottom: 16rpx; display: block; }
  .profile-input {
    height: 88rpx;
    background-color: #f8fafc;
    border-radius: 16rpx;
    padding: 0 30rpx;
    font-size: 28rpx;
    border: 1rpx solid #e2e8f0;
    &:focus { border-color: #4facfe; }
  }
}

.submit-btn {
  height: 90rpx;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
  border-radius: 45rpx;
  font-size: 30rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 20rpx rgba(79, 172, 254, 0.3);
  margin-top: 20rpx;
  &::after { border: none; }
  &.orange { background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); box-shadow: 0 8rpx 20rpx rgba(245, 158, 11, 0.3); }
}

.logout-section {
  padding: 30rpx 0 60rpx;
  .logout-btn {
    height: 90rpx;
    background-color: #fff;
    color: #ef4444;
    border: 1rpx solid #fee2e2;
    border-radius: 45rpx;
    font-size: 30rpx;
    font-weight: 500;
    &::after { border: none; }
  }
}
</style>
