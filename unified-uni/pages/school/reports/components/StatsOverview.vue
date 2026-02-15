<template>
  <view class="stats-overview">
    <view 
      class="stat-item" 
      v-for="(stat, index) in stats" 
      :key="index" 
      :class="stat.type"
    >
      <text class="stat-value">{{ stat.value }}</text>
      <text class="stat-label">{{ stat.label }}</text>
    </view>
  </view>
</template>

<script setup>
defineProps({
  stats: {
    type: Array,
    required: true
  }
})
</script>

<style lang="scss" scoped>
.stats-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
  margin-bottom: 24rpx;

  .stat-item {
    background: #fff;
    padding: 20rpx;
    border-radius: 20rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.02);

    .stat-value {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
    }
    .stat-label {
      font-size: 20rpx;
      color: #94a3b8;
      margin-top: 4rpx;
    }

    &.healthy .stat-value {
      color: #10b981;
    }
    &.attention .stat-value {
      color: #f59e0b;
    }
    &.abnormal .stat-value {
      color: #f56c6c;
    }
  }
}
</style>
