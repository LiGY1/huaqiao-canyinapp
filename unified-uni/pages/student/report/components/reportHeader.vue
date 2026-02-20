<template>
  <view class="report-header">
    <!-- 标题和类型选择器在同一行 -->
    <view class="header-row">
      <view class="header-content">
        <h1 class="report-title">营养报告</h1>
        <p class="report-subtitle">AI智能分析</p>
      </view>
      
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
  border-radius: 18rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

/* 标题和切换器在同一行 */
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.header-content {
  flex: 1;
}

.report-title {
  font-size: 36rpx;
  font-weight: bold;
  background: linear-gradient(to right, #667eea, #764ba2);
  background-clip: text;
  display: block;
  margin-bottom: 6rpx;
  line-height: 1.2;
}

.report-subtitle {
  font-size: 24rpx;
  color: #999;
  display: block;
  line-height: 1.2;
}

.toggle-group {
  display: flex;
  background-color: #f0f0f0;
  border-radius: 34rpx;
  overflow: hidden;
  border: 2rpx solid #e0e0e0;
}

.toggle-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10rpx 28rpx;
  font-size: 26rpx;
  color: #666;
  transition: all 0.3s ease;
  cursor: pointer;
}

.toggle-item.active {
  background-color: #667eea;
  color: #fff;
  box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.3);
}

.toggle-text {
  font-weight: 600;
}

/* 日期筛选器样式 */
.date-filter {
  margin-top: 16rpx;
}

.date-picker {
  margin-bottom: 14rpx;
}

.date-picker-value {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18rpx 22rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12rpx;
  color: #fff;
  font-size: 28rpx;
  font-weight: 500;
}

.date-text {
  flex: 1;
}

.picker-icon {
  font-size: 30rpx;
  margin-left: 12rpx;
}

.date-filter-actions {
  display: flex;
  gap: 14rpx;
  justify-content: space-between;
}

.period-btn {
  flex: 1;
  height: 60rpx;
  line-height: 60rpx;
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
