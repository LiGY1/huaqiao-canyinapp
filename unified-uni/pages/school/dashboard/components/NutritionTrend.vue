<template>
  <view class="container">
    <view class="chart-box" v-if="!hasNoMealData">
      <l-echart ref="chartRef" @grid-click="$emit('grid-click', $event)"></l-echart>
    </view>
    <view class="empty-box" v-else>
      <uni-icons type="info" size="40" color="#ccc"></uni-icons>
      <text>暂无用餐记录</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from "vue";
const props = defineProps({ hasNoMealData: { type: Boolean, default: true } });
const chartRef = ref(null);
defineExpose({ chartRef });
</script>

<style scoped>
.container {
  background: #fff;
  border-bottom-left-radius: 20rpx;
  border-bottom-right-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}
.chart-box {
  height: 400rpx;
  width: 100%;
}
.empty-box {
  height: 300rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 24rpx;
  gap: 16rpx;
}
</style>
