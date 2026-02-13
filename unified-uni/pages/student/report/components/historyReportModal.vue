<template>
  <uni-popup ref="popupRef" type="center" :mask-click="false" class="history-modal" @change="onPopupChange">
    <view class="modal-content">
      <view class="modal-header">
        <view class="header-text">
          <text class="modal-title">历史报告</text>
          <text class="modal-subtitle">查看您之前生成的{{ typeText }}</text>
        </view>
        <button class="close-btn" @click="$emit('close')">
          <uni-icons type="closeempty" size="20" color="#999"></uni-icons>
        </button>
      </view>

      <!-- 历史报告列表 -->
      <view v-if="loadingHistory" class="modal-loading">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载中...</text>
      </view>
      <view v-else-if="reportHistory.length === 0" class="empty-history">
        <view class="empty-icon"></view>
        <text class="empty-title">暂无{{ typeText }}历史</text>
        <text class="empty-subtitle">生成第一份{{ typeText }}吧！</text>
      </view>
      <view v-else class="history-list custom-scrollbar">
        <view
          v-for="(report, idx) in reportHistory"
          :key="report._id"
          class="history-item report-history-card"
          @click="$emit('view-report', report)"
        >
          <!-- Card Header: Type & Date -->
          <view class="card-top-row">
            <view class="type-badge" :class="report.reportType">
              <text class="type-text">{{ typeText }}</text>
              <text class="type-number">#{{ reportHistory.length - idx }}</text>
            </view>
            <text class="create-time">{{ formatDateSimple(report.createdAt) }}</text>
          </view>

          <!-- Card Body: Date Range -->
          <view class="card-main-info">
            <text class="range-label">周期</text>
            <text class="range-value">{{ formatDateRange(report.dateRange) }}</text>
          </view>

          <!-- Card Footer: Stats & Action -->
          <view class="card-footer">
            <view class="stats-row">
              <view class="stat-pill">
                <uni-icons type="fire-filled" size="12" color="#667eea"></uni-icons>
                <text>平均 {{ report.dataSummary?.avgCalories || 0 }}千卡</text>
              </view>
              <view class="stat-pill">
                <uni-icons type="calendar-filled" size="12" color="#667eea"></uni-icons>
                <text>{{ report.dataSummary?.totalDays || 0 }}天</text>
              </view>
            </view>
            <view class="action-btn-small">
              <text>查看</text>
              <uni-icons type="arrowright" size="12" color="#fff"></uni-icons>
            </view>
          </view>
        </view>
      </view>
    </view>
  </uni-popup>
</template>

<script setup>
import { ref, watch, computed } from "vue";

const popupRef = ref(null);

const props = defineProps({
  showModal: {
    type: Boolean,
    default: false,
  },
  reportType: {
    type: String,
    default: "周报",
  },
  reportHistory: {
    type: Array,
    default: () => [],
  },
  loadingHistory: {
    type: Boolean,
    default: false,
  },
});

const typeText = computed(() => {
  return props.reportType === "weekly" ? "周报" : "月报";
});

const emit = defineEmits(["close", "view-report"]);

// 监听 showModal 变化
watch(
  () => props.showModal,
  (newVal) => {
    if (newVal) {
      popupRef.value?.open();
    } else {
      popupRef.value?.close();
    }
  }
);

// 处理弹窗关闭事件（用于同步状态）
const onPopupChange = (e) => {
  if (!e.show) {
    emit("close");
  }
};

// 简单日期格式化 YYYY-MM-DD
const formatDateSimple = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(
    2,
    "0"
  )}`;
};

// 格式化日期范围
const formatDateRange = (range) => {
  if (!range || !range.start || !range.end) return "";
  const start = new Date(range.start);
  const end = new Date(range.end);
  return `${start.getFullYear()}.${String(start.getMonth() + 1).padStart(2, "0")}.${String(start.getDate()).padStart(
    2,
    "0"
  )} - ${String(end.getMonth() + 1).padStart(2, "0")}.${String(end.getDate()).padStart(2, "0")}`;
};
</script>

<style scoped>
.history-modal {
  z-index: 999;
}

.modal-content {
  background-color: #fff;
  border-radius: 24rpx;
  width: 700rpx;
  overflow: hidden;
  box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  max-height: 80vh;
}

.modal-header {
  padding: 30rpx 40rpx;
  border-bottom: 2rpx solid #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
}

.header-text {
  display: flex;
  flex-direction: column;
}

.modal-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 6rpx;
}

.modal-subtitle {
  font-size: 24rpx;
  color: #909399;
}

.close-btn {
  background: #f4f4f5;
  border: none;
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin: 0;
  padding: 0;
  transition: all 0.2s;
}

.close-btn:active {
  background-color: #e9e9eb;
  transform: scale(0.95);
}

.modal-loading {
  padding: 80rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loading-spinner {
  width: 50rpx;
  height: 50rpx;
  border: 4rpx solid #e0e0e0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 20rpx;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 24rpx;
  color: #999;
}

.empty-history {
  padding: 100rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.empty-icon {
  width: 120rpx;
  height: 120rpx;
  background-color: #f0f2f5;
  border-radius: 50%;
  margin-bottom: 30rpx;
}

.empty-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12rpx;
}

.empty-subtitle {
  font-size: 26rpx;
  color: #909399;
}

.history-list {
  padding: 30rpx 40rpx;
  overflow-y: auto;
  flex: 1;
}

.report-history-card {
  background-color: #ffffff;
  border: 2rpx solid #edf2f7;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.03);
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.report-history-card:active {
  transform: scale(0.98);
  border-color: #dbeafe;
  background-color: #f8fafc;
}

.card-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.type-badge {
  display: flex;
  align-items: center;
  background-color: #edf2f7;
  padding: 6rpx 16rpx;
  border-radius: 30rpx;
}

.type-badge.weekly {
  background-color: #eef2ff;
}
.type-badge.monthly {
  background-color: #f3e8ff;
}

.type-text {
  font-size: 22rpx;
  font-weight: 700;
  margin-right: 8rpx;
}

.weekly .type-text {
  color: #4f46e5;
}
.monthly .type-text {
  color: #9333ea;
}

.type-number {
  font-size: 20rpx;
  color: rgba(0, 0, 0, 0.4);
  font-weight: 600;
}

.create-time {
  font-size: 22rpx;
  color: #a0aec0;
}

.card-main-info {
  margin-bottom: 24rpx;
}

.range-label {
  font-size: 20rpx;
  color: #718096;
  margin-bottom: 6rpx;
  display: block;
}

.range-value {
  font-size: 28rpx;
  font-weight: 600;
  color: #2d3748;
  font-family: "Roboto", sans-serif; /* Try to use a nice number font */
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 2rpx dashed #edf2f7;
  padding-top: 20rpx;
}

.stats-row {
  display: flex;
  gap: 12rpx;
}

.stat-pill {
  display: flex;
  align-items: center;
  gap: 6rpx;
  background-color: #f7fafc;
  padding: 6rpx 14rpx;
  border-radius: 12rpx;
}

.stat-pill text {
  font-size: 20rpx;
  color: #4a5568;
  font-weight: 500;
}

.action-btn-small {
  display: flex;
  align-items: center;
  gap: 4rpx;
  background: linear-gradient(135deg, #667eea, #764ba2);
  padding: 8rpx 16rpx;
  border-radius: 30rpx;
  box-shadow: 0 4rpx 10rpx rgba(118, 75, 162, 0.2);
}

.action-btn-small text {
  font-size: 20rpx;
  color: #fff;
  font-weight: 600;
}
</style>
