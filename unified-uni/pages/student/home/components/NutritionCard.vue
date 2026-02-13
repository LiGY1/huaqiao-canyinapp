<template>
  <view class="nutrition-card">
    <view class="card-header">
      <text class="card-title">今日营养摄入</text>
      <view v-if="props.hasOverIntake" class="custom-badge warn">{{ props.overIntakeItems.length }}项超标</view>
    </view>

    <view v-if="props.loading" class="loading">
      <uni-icons type="spinner-cycle" size="32" color="#409eff" class="loading-spinner"></uni-icons>
      <text class="loading-text">加载营养数据中...</text>
    </view>

    <view v-else-if="props.loadError" class="load-error">
      <uni-icons type="info-filled" size="32" color="#f56c6c"></uni-icons>
      <text class="error-text">营养数据加载失败</text>
      <text class="error-subtext">请确保后端服务正常运行</text>
      <button class="retry-btn" type="primary" @click="props.fetchNutritionData">重试</button>
    </view>

    <view v-else class="nutrition-list">
      <view
        v-for="nutrient in props.nutrients"
        :key="nutrient.key"
        class="nutrient-item"
        :style="{ background: nutrient.gradient }"
      >
        <view v-if="props.isOverIntake(nutrient.key)" class="custom-badge error mini">超标</view>
        <text class="nutrient-label">{{ nutrient.label }}</text>
        <text class="nutrient-value"
          >{{ props.formatNumber(props.nutritionData[nutrient.key], nutrient.unit === "千卡" ? 0 : 1)
          }}{{ nutrient.unit }}</text
        >
        <text class="nutrient-target"
          >目标: {{ props.nutritionData[`target${props.capitalize(nutrient.key)}`] }}{{ nutrient.unit }}</text
        >
        <view class="custom-progress small">
          <view
            class="progress-bar white"
            :style="{
              width: `${Math.min(
                100,
                props.getPercentage(
                  props.nutritionData[nutrient.key],
                  props.nutritionData[`target${props.capitalize(nutrient.key)}`]
                )
              )}%`,
            }"
          ></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  loading: Boolean,
  loadError: Boolean,
  nutrients: Array,
  nutritionData: Object,
  isOverIntake: Function,
  formatNumber: Function,
  capitalize: Function,
  getPercentage: Function,
  fetchNutritionData: Function,
  hasOverIntake: Boolean,
  overIntakeItems: Array,
});
</script>
<style scoped lang="scss">
.nutrition-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #1f2937;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
}

.loading-text {
  font-size: 28rpx;
  color: #6b7280;
  margin-top: 20rpx;
}

.load-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
  gap: 20rpx;
}

.error-text {
  font-size: 28rpx;
  color: #ef4444;
  font-weight: 500;
}

.error-subtext {
  font-size: 24rpx;
  color: #9ca3af;
}

.retry-btn {
  margin-top: 20rpx;
}

.nutrition-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.nutrient-item {
  border-radius: 16rpx;
  padding: 20rpx;
  color: #ffffff;
  position: relative;
  overflow: hidden;
}

.over-badge {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
}

.nutrient-label {
  font-size: 22rpx;
  opacity: 0.9;
  display: block;
  margin-bottom: 8rpx;
}

.nutrient-value {
  font-size: 36rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 8rpx;
}

.nutrient-target {
  font-size: 20rpx;
  opacity: 0.8;
  display: block;
  margin-bottom: 12rpx;
}

/* small progress bar */
.custom-progress.small {
  height: 4rpx;
}

.progress-bar.white {
  background-color: #ffffff;
}

/* shared badge */
.custom-badge {
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  font-size: 20rpx;
  font-weight: 500;
  display: inline-block;
}

.custom-badge.error {
  background-color: #fef2f2;
  color: #ef4444;
  border: 1rpx solid #fee2e2;
}

.custom-badge.mini {
  padding: 2rpx 8rpx;
  font-size: 16rpx;
  border-radius: 8rpx;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
