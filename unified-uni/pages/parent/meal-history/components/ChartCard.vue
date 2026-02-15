<template>
  <view class="chart-card">
    <view class="chart-header">
      <uni-icons :type="icon" size="18" :color="iconColor"></uni-icons>
      <text class="chart-title">{{ title }}</text>
    </view>
    <view class="chart-container">
      <l-echart :ref="chartRef" @finished="handleFinished"></l-echart>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: 'chart'
  },
  iconColor: {
    type: String,
    default: '#3b82f6'
  },
  chartRef: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['finished']);

const handleFinished = () => {
  emit('finished');
};
</script>

<style lang="scss" scoped>
.chart-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.chart-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.chart-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #334155;
}

.chart-container {
  height: 350rpx;
}
</style>
