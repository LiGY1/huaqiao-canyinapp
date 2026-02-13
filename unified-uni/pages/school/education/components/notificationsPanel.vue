<template>
  <view class="notifications-panel">
    <view v-if="isTeacher" class="info-alert">
      <uni-icons type="info" size="20" color="#4facfe"></uni-icons>
      <text>这里显示校长推送的会议通知，点击查看详情</text>
    </view>

    <view class="toolbar" v-if="!isTeacher">
      <button class="tool-btn primary" @click="showSendPopup">
        <uni-icons type="paperplane" size="18" color="#fff"></uni-icons>
        <text>推上班通知</text>
      </button>
      <button class="tool-btn success" @click="showDingtalkSettings">
        <uni-icons type="gear" size="18" color="#fff"></uni-icons>
        <text>钉钉配置</text>
      </button>
    </view>

    <view class="notif-list">
      <view v-for="notif in notifications" :key="notif._id" class="notif-card" @click="viewDetail(notif)">
        <view class="notif-header">
          <text class="title">{{ notif.title }}</text>
          <text class="date">{{ formatDate(notif.sendDate || notif.scheduledDate) }}</text>
        </view>
        <view class="notif-target">
          <text>目标: {{ notif.targetGrades?.[0] || '全校' }} · {{ notif.targetClasses?.[0] || '全部' }}</text>
        </view>
        <view class="notif-stats">
          <view class="read-rate">
            <text class="label">阅读率</text>
            <view class="progress-bar">
              <view class="progress" :style="{ width: notif.readRate + '%', backgroundColor: getRateColor(notif.readRate) }"></view>
            </view>
            <text class="percent">{{ notif.readRate }}%</text>
          </view>
          <text class="status-tag" :style="{ color: getStatusColor(notif.status) }">{{ notif.status }}</text>
        </view>
      </view>

      <view v-if="notifications.length === 0" class="empty-state">
        <image src="/static/empty.png" mode="aspectFit" class="empty-img"></image>
        <text>暂无推送记录</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { educationApi } from '@/api/school/education';
import storage from '@/utils/storage';

const isTeacher = ref(true);
const notifications = ref([]);
const loading = ref(false);

const loadNotifications = async () => {
  try {
    loading.value = true;
    const res = await educationApi.getNotifications({ page: 1, pageSize: 50 });
    if (res.code === 200 || res.success) {
      notifications.value = res.data?.list || res.data || [];
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return `${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const getRateColor = (rate) => {
  if (rate >= 80) return '#10b981';
  if (rate >= 50) return '#f59e0b';
  return '#ef4444';
};

const getStatusColor = (status) => {
  return status === '已发送' ? '#10b981' : '#f59e0b';
};

const viewDetail = (notif) => {
  uni.showToast({ title: '详情查看中', icon: 'none' });
};

const showSendPopup = () => {
  uni.showToast({ title: '通知发送开发中', icon: 'none' });
};

const showDingtalkSettings = () => {
  uni.showToast({ title: '配置开发中', icon: 'none' });
};

onMounted(() => {
  const userInfo = storage.getUserInfo();
  isTeacher.value = userInfo?.role === 'teacher';
  loadNotifications();
});
</script>

<style lang="scss" scoped>
.notifications-panel { padding: 10rpx 0; }

.info-alert {
  background-color: #f0f9ff;
  border: 1rpx solid #bae6fd;
  padding: 24rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 24rpx;
  text { font-size: 24rpx; color: #0369a1; }
}

.toolbar {
  display: flex;
  gap: 20rpx;
  margin-bottom: 30rpx;
  .tool-btn {
    flex: 1;
    height: 80rpx;
    border-radius: 40rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    font-size: 26rpx;
    color: #fff;
    &::after { border: none; }
    &.primary { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
    &.success { background: linear-gradient(135deg, #10b981 0%, #34d399 100%); }
  }
}

.notif-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.notif-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12rpx;
  .title { font-size: 30rpx; font-weight: bold; color: #1e293b; flex: 1; margin-right: 20rpx; }
  .date { font-size: 22rpx; color: #94a3b8; }
}

.notif-target {
  font-size: 24rpx;
  color: #64748b;
  margin-bottom: 24rpx;
}

.notif-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20rpx;
  border-top: 1rpx solid #f1f5f9;
}

.read-rate {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex: 1;
  .label { font-size: 22rpx; color: #94a3b8; }
  .progress-bar {
    flex: 1;
    max-width: 200rpx;
    height: 8rpx;
    background: #f1f5f9;
    border-radius: 4rpx;
    overflow: hidden;
    .progress { height: 100%; border-radius: 4rpx; transition: width 0.3s; }
  }
  .percent { font-size: 22rpx; color: #64748b; font-weight: bold; width: 60rpx; }
}

.status-tag { font-size: 22rpx; font-weight: 500; }

.empty-state {
  padding: 100rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  color: #94a3b8;
  font-size: 28rpx;
  .empty-img { width: 240rpx; height: 240rpx; opacity: 0.5; }
}
</style>
