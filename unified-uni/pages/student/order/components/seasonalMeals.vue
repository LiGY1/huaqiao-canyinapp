<template>
  <view v-if="meals.length > 0" class="seasonal-section">
    <view class="section-header">
      <h2 class="section-title">{{ seasonalTerm }} · 节气推荐</h2>
      <view class="seasonal-badge" :class="seasonTag">应季美味</view>
    </view>

    <view class="seasonal-meals-list">
      <view v-for="meal in meals" :key="meal.id" class="seasonal-meal-card">
        <!-- 价格定位到右上角 -->
        <view class="meal-price-highlight">¥{{ Number(meal.price).toFixed(0) }}</view>

        <view class="meal-info">
          <view class="meal-header">
            <view class="meal-card-title">{{ meal.name }}</view>
          </view>
          <view class="meal-nutrition">
            <text>{{ meal.calories }}千卡</text>
            <text>蛋白{{ meal.protein }}g</text>
            <text>纤维{{ meal.fiber }}g</text>
          </view>
          <text v-if="meal.nutritionDescription" class="meal-description">
            {{ meal.nutritionDescription }}
          </text>
          <view v-if="meal.ingredients && meal.ingredients.length > 0" class="meal-ingredients">
            <span class="ingredients-label">食材：</span>
            <span class="ingredients-list">{{ meal.ingredients.join("、") }}</span>
          </view>
        </view>

        <view class="add-to-cart-btn" @click="onAddToCart(meal)">
          <uni-icons type="plusempty" size="20" color="white"></uni-icons>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  meals: {
    type: Array,
    default: () => [],
  },
  seasonalTerm: {
    type: String,
    default: "",
  },
  seasonTag: {
    type: String,
    default: "success",
  },
});

const emit = defineEmits(["add-to-cart"]);

const onAddToCart = (meal) => {
  emit("add-to-cart", meal);
};
</script>

<style scoped>
/* 季节性菜品区域 */
.seasonal-section {
  background: white;
  border-radius: 24rpx;
  padding: 20rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 32rpx;
}

.section-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  line-height: 1.2;
}

.seasonal-badge {
  padding: 8rpx 32rpx;
  border-radius: 24rpx;
  font-size: 24rpx;
  font-weight: 600;
  color: white;
  align-self: flex-start;
}

.seasonal-badge.success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.seasonal-badge.warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.seasonal-badge.danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.seasonal-badge.info {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.seasonal-meals-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.seasonal-meal-card {
  display: flex;
  background: white;
  border-radius: 16rpx;
  padding: 32rpx;
  border: 2rpx solid #e5e7eb;
  justify-content: space-between;
  align-items: flex-start;
  transition: all 0.3s ease;
  position: relative;
}

.seasonal-meal-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.meal-info {
  flex: 1;
  margin-right: 140rpx;
  margin-bottom: 40rpx;
  padding-right: 40rpx;
}

.meal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
  width: 100%;
}

.meal-card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  line-height: 1.2;
}

.meal-price-highlight {
  position: absolute;
  top: 32rpx;
  right: 32rpx;
  font-size: 40rpx;
  font-weight: 700;
  color: #ef4444;
  margin: 0;
  z-index: 10;
}

.meal-nutrition {
  display: flex;
  flex-wrap: wrap;
  gap: 24rpx;
  margin-bottom: 16rpx;
  font-size: 24rpx;
  color: #6b7280;
}

.meal-nutrition text {
  white-space: normal;
}

.meal-description {
  display: block;
  font-size: 26rpx;
  color: #6b7280;
  line-height: 1.5;
  margin-bottom: 16rpx;
  white-space: normal;
  overflow: visible;
}

.meal-ingredients {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: #9ca3af;
  white-space: normal;
  overflow: visible;
}

.ingredients-label {
  font-weight: 600;
  color: #6b7280;
}

.add-to-cart-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 8rpx rgba(59, 130, 246, 0.2);
  flex-shrink: 0;
  position: absolute;
  bottom: 32rpx;
  right: 32rpx;
  overflow: hidden;
}

.add-to-cart-btn:active {
  transform: scale(0.95);
  opacity: 0.8;
}
</style>
