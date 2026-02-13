<template>
  <view class="nutrition-stats-card">
    <view class="stats-card-header">
      <h4 class="stats-card-title">已选营养统计</h4>
      <button class="close-btn" @click="onClose">
        <uni-icons type="closeempty" size="16"></uni-icons>
      </button>
    </view>
    <view class="stats-list">
      <view class="stat-item">
        <span class="stat-label">热量</span>
        <span class="stat-value">{{ nutrition.calories }} 千卡</span>
      </view>
      <view class="stat-item">
        <span class="stat-label">蛋白质</span>
        <span class="stat-value">{{ nutrition.protein }}g</span>
      </view>
      <view class="stat-item">
        <span class="stat-label">脂肪</span>
        <span class="stat-value">{{ nutrition.fat }}g</span>
      </view>
      <view class="stat-item">
        <span class="stat-label">碳水化合物</span>
        <span class="stat-value">{{ nutrition.carbs }}g</span>
      </view>
      <view class="stat-item">
        <span class="stat-label">膳食纤维</span>
        <span class="stat-value">{{ nutrition.fiber }}g</span>
      </view>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  nutrition: {
    type: Object,
    default: () => ({
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      fiber: 0,
    }),
  },
});

const emit = defineEmits(["close"]);

const onClose = () => {
  emit("close");
};
</script>

<style scoped>
/* 营养统计卡片 */
.nutrition-stats-card {
  position: fixed;
  left: 280rpx;
  bottom: 160rpx;
  background: white;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.15);
  z-index: 100;
  max-width: 560rpx;
  border: 2rpx solid #e8ecef;
  width: 250rpx;
}

.stats-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
  padding-bottom: 16rpx;
  border-bottom: 2rpx solid #f3f4f6;
}

.stats-card-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.close-btn {
  width: 48rpx;
  height: 48rpx;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  margin: 0;
}

.close-btn:hover {
  background: #f3f4f6;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.stat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 26rpx;
}

.stat-label {
  color: #666;
}

.stat-value {
  font-weight: 600;
  color: #333;
}
</style>
