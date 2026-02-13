<template>
  <view class="kpi-grid">
    <view class="kpi-card" v-for="(kpi, index) in kpiData" :key="index">
      <text class="kpi-label">{{ kpi.label }}</text>
      <text class="kpi-value" :style="{ color: kpi.color }">{{ kpi.value }}</text>
      <view class="kpi-trend" :class="getTrendClass(kpi.trend)">
        <uni-icons :type="kpi.trend >= 0 ? 'top' : 'bottom'" size="12" :color="getTrendColor(kpi.trend)"></uni-icons>
        <text>{{ Math.abs(kpi.trend) }}%</text>
      </view>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({ kpiData: { type: Array, default: () => [] } });
const getTrendClass = (change) => (change > 0 ? "positive" : change < 0 ? "negative" : "neutral");
const getTrendColor = (change) => (change > 0 ? "#10b981" : change < 0 ? "#ef4444" : "#909399");
</script>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  margin-bottom: 30rpx;
}
.kpi-card {
  background: #fff;
  padding: 24rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.03);
}
.kpi-label {
  font-size: 24rpx;
  color: #64748b;
  display: block;
  margin-bottom: 8rpx;
}
.kpi-value {
  font-size: 32rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 8rpx;
}
.kpi-trend {
  display: flex;
  align-items: center;
  font-size: 20rpx;
  gap: 4rpx;
}
.positive {
  color: #10b981;
}
.negative {
  color: #ef4444;
}
.neutral {
  color: #94a3b8;
}
</style>
