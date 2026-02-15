<template>
  <view class="date-filter">
    <view class="filter-tabs">
      <view
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-item"
        :class="{ active: activeTab === tab.value }"
        @click="selectTab(tab.value)"
      >
        {{ tab.label }}
      </view>
    </view>

    <view v-if="activeTab === 'custom'" class="custom-date">
      <view class="date-picker-row">
        <picker
          mode="date"
          :value="startDate"
          :end="endDate || today"
          @change="handleStartDateChange"
        >
          <view class="date-picker-item">
            <text class="date-label">开始日期</text>
            <text class="date-value">{{ startDate || '选择日期' }}</text>
          </view>
        </picker>
        
        <text class="date-separator">至</text>
        
        <picker
          mode="date"
          :value="endDate"
          :start="startDate"
          :end="today"
          @change="handleEndDateChange"
        >
          <view class="date-picker-item">
            <text class="date-label">结束日期</text>
            <text class="date-value">{{ endDate || '选择日期' }}</text>
          </view>
        </picker>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';

const emit = defineEmits(['change']);

const tabs = [
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '近三月', value: 'quarter' },
  { label: '自定义', value: 'custom' }
];

const activeTab = ref('week');
const startDate = ref('');
const endDate = ref('');

const today = computed(() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
});

const getDateRange = (type) => {
  const now = new Date();
  let start, end;

  switch (type) {
    case 'week':
      // 本周一到今天
      const dayOfWeek = now.getDay() || 7;
      start = new Date(now);
      start.setDate(now.getDate() - dayOfWeek + 1);
      end = now;
      break;
    case 'month':
      // 本月1号到今天
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = now;
      break;
    case 'quarter':
      // 近三个月
      start = new Date(now);
      start.setMonth(now.getMonth() - 3);
      end = now;
      break;
    default:
      return null;
  }

  return {
    startDate: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`,
    endDate: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
  };
};

const selectTab = (value) => {
  activeTab.value = value;

  if (value === 'custom') {
    // 自定义模式，等待用户选择日期
    return;
  }

  const range = getDateRange(value);
  if (range) {
    startDate.value = range.startDate;
    endDate.value = range.endDate;
    emit('change', { ...range, type: value });
  }
};

const handleStartDateChange = (e) => {
  startDate.value = e.detail.value;
  if (endDate.value) {
    emit('change', { startDate: e.detail.value, endDate: endDate.value, type: 'custom' });
  }
};

const handleEndDateChange = (e) => {
  endDate.value = e.detail.value;
  if (startDate.value) {
    emit('change', { startDate: startDate.value, endDate: e.detail.value, type: 'custom' });
  }
};

// 初始化默认选择本周
const initDefault = () => {
  const range = getDateRange('week');
  if (range) {
    activeTab.value = 'week';
    startDate.value = range.startDate;
    endDate.value = range.endDate;
    // 立即触发 change 事件，通知父组件
    emit('change', { ...range, type: 'week' });
  }
};

// 组件挂载后立即初始化
onMounted(() => {
  nextTick(() => {
    initDefault();
  });
});

defineExpose({
  getDateRange: () => ({ startDate: startDate.value, endDate: endDate.value, type: activeTab.value })
});
</script>

<style lang="scss" scoped>
.date-filter {
  background: #fff;
  border-radius: 24rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.filter-tabs {
  display: flex;
  gap: 16rpx;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  border-radius: 12rpx;
  font-size: 26rpx;
  color: #64748b;
  background: #f8fafc;
  transition: all 0.3s ease;

  &.active {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: #fff;
    font-weight: 600;
  }
}

.custom-date {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #e2e8f0;
}

.date-picker-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.date-picker-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 16rpx;
  background: #f8fafc;
  border-radius: 12rpx;
  border: 1rpx solid #e2e8f0;
}

.date-label {
  font-size: 22rpx;
  color: #94a3b8;
}

.date-value {
  font-size: 26rpx;
  color: #0f172a;
  font-weight: 500;
}

.date-separator {
  font-size: 24rpx;
  color: #94a3b8;
}
</style>
