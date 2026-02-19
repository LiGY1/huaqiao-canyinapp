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

    <!-- 日期筛选器 -->
    <view class="date-filter">
      <picker
        mode="date"
        :value="localSelectedDate"
        :end="currentDate"
        @change="onDateChange"
        class="date-picker"
      >
        <view class="date-picker-value">
          <text class="date-text">{{ formatDisplayDate(localSelectedDate) }}</text>
          <text class="picker-icon">📅</text>
        </view>
      </picker>
      
      <view class="date-filter-actions">
        <button
          @click="changePeriod(-1)"
          class="period-btn"
          size="mini"
        >
          {{ localReportType === 'weekly' ? '上周' : '上月' }}
        </button>
        <button @click="resetToToday" class="period-btn today-btn" size="mini">
          本{{ localReportType === 'weekly' ? '周' : '月' }}
        </button>
        <button
          @click="changePeriod(1)"
          class="period-btn"
          size="mini"
          :disabled="isCurrentPeriod"
        >
          {{ localReportType === 'weekly' ? '下周' : '下月' }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  reportType: {
    type: String,
    default: "weekly",
  },
  selectedDate: {
    type: String,
    required: true,
  },
  currentDate: {
    type: String,
    required: true,
  },
  isCurrentPeriod: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:reportType", "update:selectedDate", "changePeriod", "resetToToday"]);

// 本地报告类型，用于双向绑定
const localReportType = computed({
  get: () => props.reportType,
  set: (value) => {
    emit("update:reportType", value);
  },
});

// 本地选中日期
const localSelectedDate = computed({
  get: () => props.selectedDate,
  set: (value) => {
    emit("update:selectedDate", value);
  },
});

// 监听报告类型变化
const handleReportTypeChange = (value) => {
  localReportType.value = value;
};

// 格式化显示日期
function formatDisplayDate(dateStr) {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${year}年${month}月${day}日`;
}

// 日期选择器变化
const onDateChange = (e) => {
  localSelectedDate.value = e.detail.value;
};

// 切换周期
const changePeriod = (offset) => {
  emit("changePeriod", offset);
};

// 重置到今天
const resetToToday = () => {
  emit("resetToToday");
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
  margin-bottom: 30rpx;
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

/* 日期筛选器样式 */
.date-filter {
  margin-top: 20rpx;
}

.date-picker {
  margin-bottom: 20rpx;
}

.date-picker-value {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12rpx;
  color: #fff;
  font-size: 30rpx;
  font-weight: 500;
}

.date-text {
  flex: 1;
}

.picker-icon {
  font-size: 32rpx;
  margin-left: 16rpx;
}

.date-filter-actions {
  display: flex;
  gap: 16rpx;
  justify-content: space-between;
}

.period-btn {
  flex: 1;
  height: 64rpx;
  line-height: 64rpx;
  padding: 0;
  font-size: 26rpx;
  border-radius: 12rpx;
  background: #f5f7fa;
  color: #666;
  border: none;
}

.period-btn::after {
  border: none;
}

.period-btn:active {
  background: #e8eaf0;
}

.period-btn[disabled] {
  opacity: 0.4;
  color: #999;
}

.today-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.today-btn:active {
  opacity: 0.9;
}
</style>
