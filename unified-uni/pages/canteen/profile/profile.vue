<template>
  <layout>
    <view class="profile-page">
      <!-- 头部个人信息 -->
      <view class="profile-header">
        <view class="avatar-box">
          <image :src="userInfo.avatar || '/static/logo.png'" mode="aspectFill" class="avatar"></image>
        </view>
        <view class="user-main">
          <text class="user-name">{{ userInfo.name || '食堂管理员' }}</text>
          <text class="user-role">{{ getRoleText(userInfo.role) }}</text>
        </view>
      </view>

      <!-- 工作统计 -->
      <view class="stats-card">
        <view class="card-title">今日概览</view>
        <view class="stats-grid">
          <view class="stat-item">
            <text class="val">{{ workStats.today?.orders || 0 }}</text>
            <text class="lab">今日订单</text>
          </view>
          <view class="stat-item">
            <text class="val">¥{{ (workStats.today?.revenue || 0).toFixed(0) }}</text>
            <text class="lab">今日营收</text>
          </view>
          <view class="stat-item">
            <text class="val">{{ workStats.today?.production || 0 }}</text>
            <text class="lab">计划生产</text>
          </view>
        </view>
      </view>

      <!-- 功能列表 -->
      <view class="menu-list">
        <view class="menu-item" @click="handleEditProfile">
          <view class="menu-left">
            <uni-icons type="person" size="20" color="#64748b"></uni-icons>
            <text>基本信息</text>
          </view>
          <view class="menu-right">
            <text class="info-text">{{ userInfo.phone || '未绑定手机' }}</text>
            <uni-icons type="right" size="16" color="#cbd5e1"></uni-icons>
          </view>
        </view>
        
        <view class="menu-item" @click="handlePassword">
          <view class="menu-left">
            <uni-icons type="locked" size="20" color="#64748b"></uni-icons>
            <text>修改密码</text>
          </view>
          <uni-icons type="right" size="16" color="#cbd5e1"></uni-icons>
        </view>
        
        <view class="menu-item">
          <view class="menu-left">
            <uni-icons type="notification" size="20" color="#64748b"></uni-icons>
            <text>新订单提醒</text>
          </view>
          <switch :checked="true" color="#4facfe" style="transform: scale(0.7);"></switch>
        </view>
      </view>

      <!-- 退出按钮 -->
      <button class="logout-btn" @click="handleLogout">退出当前账号</button>
    </view>
  </layout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import layout from '@/components/layout.vue';
import storage from '@/utils/storage';
import { getUserInfo, getWorkStatistics, logout } from '@/api/canteen/auth';

const userInfo = ref({});
const workStats = ref({});

const getRoleText = (r) => ({
  canteen_admin: '总管理员',
  canteen_staff: '食堂员工',
  canteen_chef: '厨师长'
}[r] || '食堂员工');

const fetchData = async () => {
  try {
    const userRes = await getUserInfo();
    if (userRes.code === 200 || userRes.success) {
      userInfo.value = userRes.data || userRes;
      storage.setUserInfo(userInfo.value);
    }
    
    const statsRes = await getWorkStatistics();
    if (statsRes.code === 200 || statsRes.success) {
      workStats.value = statsRes.data || statsRes;
    }
  } catch (e) {
    console.error(e);
  }
};

const handleEditProfile = () => {
  uni.showToast({ title: '信息修改开发中', icon: 'none' });
};

const handlePassword = () => {
  uni.showToast({ title: '修改密码开发中', icon: 'none' });
};

const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await logout();
          storage.clearAuth();
          uni.reLaunch({ url: '/pages/login/login' });
        } catch (e) {
          storage.clearAuth();
          uni.reLaunch({ url: '/pages/login/login' });
        }
      }
    }
  });
};

onMounted(() => {
  fetchData();
});
</script>

<style lang="scss" scoped>
.profile-page {
  padding: 40rpx 30rpx;
  background-color: #f8fafc;
  min-height: calc(100vh - 120rpx);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 30rpx;
  margin-bottom: 40rpx;
  
  .avatar-box {
    width: 140rpx;
    height: 140rpx;
    border-radius: 70rpx;
    border: 6rpx solid #fff;
    box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.1);
    overflow: hidden;
    .avatar { width: 100%; height: 100%; }
  }
  
  .user-main {
    .user-name { font-size: 40rpx; font-weight: bold; color: #1e293b; display: block; }
    .user-role { font-size: 24rpx; color: #4facfe; background: #eff6ff; padding: 2rpx 16rpx; border-radius: 20rpx; margin-top: 12rpx; display: inline-block; }
  }
}

.stats-card {
  background-color: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
  
  .card-title { font-size: 30rpx; font-weight: bold; color: #1e293b; margin-bottom: 30rpx; }
  .stats-grid {
    display: flex;
    .stat-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      border-right: 1rpx solid #f1f5f9;
      &:last-child { border-right: none; }
      .val { font-size: 36rpx; font-weight: bold; color: #1e293b; }
      .lab { font-size: 22rpx; color: #94a3b8; margin-top: 8rpx; }
    }
  }
}

.menu-list {
  background-color: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  margin-bottom: 60rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
  
  .menu-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 36rpx 30rpx;
    border-bottom: 1rpx solid #f1f5f9;
    &:last-child { border-bottom: none; }
    
    .menu-left {
      display: flex;
      align-items: center;
      gap: 20rpx;
      font-size: 30rpx;
      color: #334155;
    }
    
    .menu-right {
      display: flex;
      align-items: center;
      gap: 12rpx;
      .info-text { font-size: 26rpx; color: #94a3b8; }
    }
  }
}

.logout-btn {
  width: 100%;
  height: 90rpx;
  background-color: #fff;
  color: #ef4444;
  border-radius: 24rpx;
  font-size: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1rpx solid #fee2e2;
  &::after { border: none; }
}
</style>
