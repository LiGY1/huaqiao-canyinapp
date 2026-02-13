<template>
  <view class="welcome-card">
    <view class="welcome-header">
      <view class="user-info">
        <text class="user-name">{{ props.userInfo?.name || "同学" }}</text>
        <text class="greeting">{{ props.greeting }}</text>
      </view>
      <view class="datetime-info">
        <text class="date">{{ props.currentDate }}</text>
        <text class="time">{{ props.currentTime }}</text>
        <view class="weather">
          <uni-icons type="sunny" size="16" color="#fbbf24"></uni-icons>
          <text class="weather-text">{{ props.weatherInfo }}</text>
        </view>
      </view>
    </view>

    <view class="health-tip">
      <uni-icons type="star" size="16" color="#6366f1"></uni-icons>
      <text class="tip-text">今日健康小贴士</text>
      <text class="tip-content">"{{ props.dailyTip }}"</text>
    </view>

    <view class="goal-progress">
      <view class="progress-header">
        <text class="progress-title">今日目标完成度</text>
        <text class="progress-value">{{ props.dailyGoalProgress }}%</text>
        <view v-if="props.hasOverIntake" class="custom-badge warn">超标</view>
      </view>
      <view class="custom-progress">
        <view
          class="progress-bar"
          :style="{
            width: `${Math.min(100, props.dailyGoalProgress)}%`,
            backgroundColor: props.hasOverIntake ? '#f56c6c' : '#409eff',
          }"
        ></view>
      </view>
      <view v-if="props.hasOverIntake" class="over-limit">
        <uni-icons type="warn" size="14" color="#f59e0b"></uni-icons>
        <text class="over-limit-text">超出目标 {{ props.dailyGoalProgress - 100 }}%</text>
      </view>

      <!-- 早中晚餐状态 -->
      <view class="meal-status">
        <view class="meal-item">
          <view class="meal-dot" :class="props.mealStatus.breakfast ? 'active' : ''"></view>
          <text class="meal-text" :class="props.mealStatus.breakfast ? 'active' : ''">早餐</text>
        </view>
        <view class="meal-item">
          <view class="meal-dot" :class="props.mealStatus.lunch ? 'active' : ''"></view>
          <text class="meal-text" :class="props.mealStatus.lunch ? 'active' : ''">午餐</text>
        </view>
        <view class="meal-item">
          <view class="meal-dot" :class="props.mealStatus.dinner ? 'active' : ''"></view>
          <text class="meal-text" :class="props.mealStatus.dinner ? 'active' : ''">晚餐</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  userInfo: Object,
  greeting: String,
  currentDate: String,
  currentTime: String,
  weatherInfo: String,
  dailyTip: String,
  dailyGoalProgress: [Number, String],
  hasOverIntake: Boolean,
  mealStatus: Object,
});
</script>
<style scoped lang="scss">
.welcome-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.welcome-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20rpx;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 40rpx;
  font-weight: bold;
  color: #1f2937;
  display: block;
  margin-bottom: 8rpx;
}

.greeting {
  font-size: 28rpx;
  color: #6b7280;
}

.datetime-info {
  text-align: right;
}

.date,
.time {
  display: block;
  font-size: 24rpx;
  color: #6b7280;
  margin-bottom: 4rpx;
}

.weather {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6rpx;
}

.weather-text {
  font-size: 22rpx;
  color: #6b7280;
}

.health-tip {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.tip-text {
  font-size: 24rpx;
  font-weight: 500;
  color: #065f46;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.tip-content {
  font-size: 22rpx;
  color: #15803d;
  font-style: italic;
}

.goal-progress {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 16rpx;
  padding: 20rpx;
}

.progress-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.progress-title {
  font-size: 24rpx;
  font-weight: 500;
  color: #1e40af;
}

.progress-value {
  font-size: 24rpx;
  font-weight: 600;
  color: #1d4ed8;
}

.over-limit {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 12rpx;
}

.over-limit-text {
  font-size: 20rpx;
  color: #f59e0b;
}

.meal-status {
  display: flex;
  justify-content: center;
  gap: 60rpx;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid rgba(0, 0, 0, 0.1);
}

.meal-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.meal-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background-color: #d1d5db;
}

.meal-dot.active {
  background-color: #3b82f6;
}

.meal-text {
  font-size: 22rpx;
  color: #6b7280;
}

.meal-text.active {
  font-size: 22rpx;
  color: #1d4ed8;
  font-weight: 500;
}

/* 自定义徽章样式 (used here) */
.custom-badge {
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  font-size: 20rpx;
  font-weight: 500;
  display: inline-block;
}

.custom-badge.warn {
  background-color: #fffbeb;
  color: #f59e0b;
  border: 1rpx solid #fef3c7;
}

.custom-badge.mini {
  padding: 2rpx 8rpx;
  font-size: 16rpx;
  border-radius: 8rpx;
}

/* 进度条 */
.custom-progress {
  width: 100%;
  height: 6rpx;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 3rpx;
  overflow: hidden;
  margin-top: 10rpx;
}

.progress-bar {
  height: 100%;
  background-color: #409eff;
  border-radius: 3rpx;
  transition: width 0.3s ease;
}

.progress-bar.white {
  background-color: #ffffff;
}
</style>
