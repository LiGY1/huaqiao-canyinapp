<template>
  <view class="report-header">
    <view class="header-content">
      <h1 class="report-title">营养报告</h1>
      <p class="report-subtitle">基于您的饮食数据，AI智能生成专业营养分析</p>
    </view>
    <view class="report-type-selector">
      <view class="toggle-group">
        <view
          class="toggle-item"
          :class="{ active: localReportType === 'weekly' }"
          @click="handleReportTypeChange('weekly')"
        >
          <text class="toggle-text">周报</text>
        </view>
        <view
          class="toggle-item"
          :class="{ active: localReportType === 'monthly' }"
          @click="handleReportTypeChange('monthly')"
        >
          <text class="toggle-text">月报</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  reportType: {
    type: String,
    default: "周报",
  },
});

const emit = defineEmits(["update:reportType"]);

// 本地报告类型，用于双向绑定
const localReportType = computed({
  get: () => props.reportType,
  set: (value) => {
    emit("update:reportType", value);
  },
});

// 监听报告类型变化
const handleReportTypeChange = (value) => {
  localReportType.value = value;
};
</script>

<style scoped>
.report-header {
  background: linear-gradient(to bottom, #f0f5ff, #ffffff);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.header-content {
  margin-bottom: 30rpx;
}

.report-title {
  font-size: 36rpx;
  font-weight: bold;
  background: linear-gradient(to right, #667eea, #764ba2);
  background-clip: text;
  display: block;
  margin-bottom: 10rpx;
}

.report-subtitle {
  font-size: 24rpx;
  color: #666;
  display: block;
}

.report-type-selector {
  display: flex;
  justify-content: flex-end;
}

.toggle-group {
  display: flex;
  background-color: #f0f0f0;
  border-radius: 36rpx;
  overflow: hidden;
  border: 2rpx solid #e0e0e0;
}

.toggle-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12rpx 32rpx;
  font-size: 26rpx;
  color: #666;
  position: relative;
  transition: all 0.3s ease;
  cursor: pointer;
  gap: 10rpx;
  flex: 1;
}

.toggle-item.active {
  background-color: #667eea;
  color: #fff;
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.4);
}

.toggle-text {
  font-weight: 600;
}
</style>
