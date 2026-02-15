<template>
  <view class="meal-card">
    <view class="meal-header">
      <view class="meal-type-tag" :class="getMealTypeClass(record.mealType)">
        {{ record.mealType }}
      </view>
      <text class="meal-time">{{ record.date }} {{ record.time }}</text>
      <text class="meal-price">¥{{ record.totalPrice.toFixed(2) }}</text>
    </view>

    <view class="location-info">
      <uni-icons type="location" size="14" color="#94a3b8"></uni-icons>
      <text class="location-text"
        >{{ record.campus }} - {{ record.canteen }} - {{ record.floor }}楼{{ record.window }}号窗口</text
      >
    </view>

    <view class="dishes-list">
      <view v-for="dish in record.dishes" :key="dish.id" class="dish-item">
        <view class="dish-name-box">
          <text class="dish-name">{{ dish.name }}</text>
          <text v-if="dish.isHealthy" class="healthy-tag">营养推荐</text>
        </view>
        <view class="dish-price-box">
          <text class="dish-qty">x{{ dish.quantity }}</text>
          <text class="dish-p">¥{{ dish.price.toFixed(2) }}</text>
        </view>
      </view>
    </view>

    <view v-if="record.nutrition" class="nutrition-strip">
      <view class="nut-item">
        <text class="nut-val">{{ formatNumber(record.nutrition.calories) }}</text>
        <text class="nut-lab">热量(kcal)</text>
      </view>
      <view class="nut-item">
        <text class="nut-val">{{ formatNumber(record.nutrition.protein) }}</text>
        <text class="nut-lab">蛋白质(g)</text>
      </view>
      <view class="nut-item">
        <text class="nut-val">{{ formatNumber(record.nutrition.fat) }}</text>
        <text class="nut-lab">脂肪(g)</text>
      </view>
      <view class="nut-item">
        <text class="nut-val">{{ formatNumber(record.nutrition.carbs) }}</text>
        <text class="nut-lab">碳水(g)</text>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  record: {
    type: Object,
    required: true
  }
});

const getMealTypeClass = (type) => {
  const map = {
    早餐: "bg-amber",
    午餐: "bg-green",
    晚餐: "bg-blue",
    夜宵: "bg-purple",
  };
  return map[type] || "bg-blue";
};

const formatNumber = (value) => {
  if (!value || isNaN(value)) return '0';
  const num = Number(value);
  if (num % 1 === 0) return num.toString();
  return num.toFixed(1);
};
</script>

<style lang="scss" scoped>
.meal-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.meal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.meal-type-tag {
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  font-size: 20rpx;
  color: #fff;
}

.bg-amber {
  background-color: #f59e0b;
}
.bg-green {
  background-color: #10b981;
}
.bg-blue {
  background-color: #3b82f6;
}
.bg-purple {
  background-color: #8b5cf6;
}

.meal-time {
  font-size: 24rpx;
  color: #64748b;
  flex: 1;
  margin-left: 20rpx;
}

.meal-price {
  font-size: 32rpx;
  font-weight: bold;
  color: #f59e0b;
}

.location-info {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: #f8fafc;
  padding: 12rpx 20rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
}

.location-text {
  font-size: 22rpx;
  color: #64748b;
}

.dishes-list {
  margin-bottom: 20rpx;
}

.dish-item {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;
  border-bottom: 1rpx dashed #f1f5f9;
}

.dish-name-box {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.dish-name {
  font-size: 26rpx;
  color: #334155;
}

.healthy-tag {
  font-size: 18rpx;
  background: #f0fdf4;
  color: #16a34a;
  padding: 2rpx 8rpx;
  border-radius: 4rpx;
}

.dish-price-box {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.dish-qty {
  font-size: 24rpx;
  color: #94a3b8;
}

.dish-p {
  font-size: 26rpx;
  color: #334155;
  font-weight: 500;
}

.nutrition-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid #e2e8f0;
}

.nut-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 8rpx;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12rpx;
  border: 1rpx solid #e2e8f0;
}

.nut-val {
  font-size: 28rpx;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
  margin-bottom: 6rpx;
}

.nut-lab {
  font-size: 20rpx;
  color: #64748b;
  font-weight: 500;
  white-space: nowrap;
}
</style>
