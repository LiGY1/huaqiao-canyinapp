<template>
  <view class="stats-grid">
    <view class="stat-card">
      <view class="stat-icon bg-blue">
        <uni-icons type="calendar" size="20" color="#fff"></uni-icons>
      </view>
      <view class="stat-info">
        <text class="stat-value">{{ statistics.totalMeals }}</text>
        <text class="stat-label">总用餐次数</text>
      </view>
    </view>
    <view class="stat-card">
      <view class="stat-icon bg-green">
        <uni-icons type="wallet" size="20" color="#fff"></uni-icons>
      </view>
      <view class="stat-info">
        <text class="stat-value">¥{{ statistics.totalSpent }}</text>
        <text class="stat-label">总消费</text>
      </view>
    </view>
    <view class="stat-card">
      <view class="stat-icon bg-purple">
        <uni-icons type="bars" size="20" color="#fff"></uni-icons>
      </view>
      <view class="stat-info">
        <text class="stat-value">¥{{ statistics.avgSpent }}</text>
        <text class="stat-label">平均消费</text>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  statistics: {
    type: Object,
    required: true
  }
});
</script>

<style lang="scss" scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
}

.stat-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 24rpx;
  padding: 32rpx 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
  border: 1rpx solid rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4rpx;
    background: linear-gradient(90deg, transparent, currentColor, transparent);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:active {
    transform: translateY(-4rpx);
    box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.1);

    &::before {
      opacity: 1;
    }
  }
}

.stat-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16rpx;
  box-shadow: 0 8rpx 16rpx rgba(0, 0, 0, 0.12);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 20rpx;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), transparent);
  }
}

.bg-blue {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.bg-green {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.bg-purple {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.stat-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.stat-value {
  font-size: 36rpx;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.5rpx;
  line-height: 1.2;
}

.stat-label {
  font-size: 22rpx;
  color: #64748b;
  font-weight: 500;
  letter-spacing: 0.5rpx;
}
</style>
