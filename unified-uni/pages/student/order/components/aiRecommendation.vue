<template>
  <view class="ai-recommend-section">
    <view class="section-header">
      <h2 class="section-title">AI 智能推荐</h2>
      <button class="ai-recommend-btn" :disabled="loading" @click="handleRecommendClick">
        <uni-icons v-if="loading" type="spinner" size="32rpx" class="loading-icon"></uni-icons>
        {{ loading ? "分析中..." : recommendation ? "换一批推荐" : "获取推荐" }}
      </button>
    </view>

    <uni-popup ref="recommendPopup" type="center" :mask-click="true" class="recommendation-popup">
      <view class="popup-container">
        <!-- 加载状态 -->
        <view v-if="loading" class="popup-loading">
          <view class="ai-brain-icon">
            <uni-icons type="staff-filled" size="80rpx" color="#8b5cf6"></uni-icons>
          </view>
          <text class="loading-text">AI 正在根据您的需求挑选菜品...</text>
          <view class="loading-bar">
            <view class="loading-progress"></view>
          </view>
        </view>
        
        <!-- 结果显示 -->
        <view v-else-if="recommendation" class="popup-content">
          <view class="popup-header">
            <text class="popup-title">AI 智能推荐方案</text>
            <view class="close-icon" @click="closePopup">
              <uni-icons type="closeempty" size="20" color="#94a3b8"></uni-icons>
            </view>
          </view>
          
          <view class="ai-recommendation-content">
            <view class="reason-section">
              <uni-icons type="info" size="24rpx" color="#8b5cf6"></uni-icons>
              <text class="recommendation-reason">{{ recommendation.reason }}</text>
            </view>
            
            <view class="recommended-meals-grid">
              <view
                v-for="(meal, index) in displayedMeals"
                :key="meal.id"
                class="recommended-meal-card"
                :style="{ animationDelay: `${index * 0.1}s` }"
              >
                <view class="meal-card-content">
                  <LazyImage :src="meal.image" class="meal-image"></LazyImage>
                  
                  <view class="meal-details">
                    <view class="meal-card-header">
                      <view class="meal-name">{{ meal.name }}</view>
                      
                      <view class="quantity-selector">
                        <view v-if="getQuantity(meal.id) > 0" class="control-group">
                          <view class="minus-btn" @click.stop="onDecreaseQuantity(meal)">
                            <uni-icons type="minus-filled" size="20" color="#cbd5e1"></uni-icons>
                          </view>
                          <text class="quantity">{{ getQuantity(meal.id) }}</text>
                        </view>
                        <view class="add-btn-small" @click.stop="onAddToCart(meal)">
                          <uni-icons type="plusempty" size="14" color="white"></uni-icons>
                        </view>
                      </view>
                    </view>
                    
                    <view class="meal-price">¥{{ Number(meal.price).toFixed(2) }}</view>
                    <view class="match-score">
                      <uni-icons size="28rpx" type="star"></uni-icons>
                      <text>匹配度 {{ meal.matchScore }}%</text>
                    </view>
                  </view>
                </view>
              </view>
            </view>
            
            <view class="nutrition-stats">
              <text class="stats-title">方案营养概览：</text>
              <view class="stats-tags">
                <view class="nutrition-tag">
                  <uni-icons size="24rpx" type="sunny"></uni-icons>
                  {{ nutrition.calories }} 千卡
                </view>
                <view class="nutrition-tag">
                  <uni-icons size="24rpx" type="spoon"></uni-icons>
                  {{ nutrition.protein }}g 蛋白质
                </view>
                <view class="nutrition-tag">
                  <uni-icons size="24rpx" type="fire"></uni-icons>
                  {{ nutrition.fat }}g 脂肪
                </view>
                <view class="nutrition-tag">
                  <uni-icons size="24rpx" type="leaf"></uni-icons>
                  {{ nutrition.carbs }}g 碳水
                </view>
              </view>
            </view>

            <view class="action-buttons">
              <button class="cancel-btn" @click="closePopup">
                <uni-icons type="closeempty" size="20" color="#64748b"></uni-icons>
                取消
              </button>
              <button class="apply-btn" @click="handleApplyToCart">
                <uni-icons type="cart-filled" size="20" color="white"></uni-icons>
                应用到购物车
              </button>
            </view>
          </view>
        </view>
      </view>
    </uni-popup>

    <!-- 卡片展示区 -->
    <view v-if="recommendation" class="ai-recommendation-ready" @click="openPopup">
      <view class="ready-info">
        <uni-icons type="checkbox-filled" size="32rpx" color="#10b981"></uni-icons>
        <text class="ready-text">AI 已为您生成个性化推荐方案</text>
      </view>
      <text class="view-details">点击查看详情 ></text>
    </view>
    <view v-else class="ai-recommendation-empty">
      <text class="empty-text">点击"获取推荐"按钮，AI将为您推荐最适合的菜品组合</text>
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from "vue";
import LazyImage from "@/components/LazyImage/index.vue";

const props = defineProps({
  recommendation: {
    type: Object,
    default: null,
  },
  displayedMeals: {
    type: Array,
    default: () => [],
  },
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
  loading: {
    type: Boolean,
    default: false,
  },
  cartItems: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["recommend", "add-to-cart", "decrease-quantity", "apply-to-cart"]);

const recommendPopup = ref(null);

const handleRecommendClick = () => {
  emit("recommend");
  recommendPopup.value.open();
};

const onAddToCart = (meal) => {
  emit("add-to-cart", meal);
};

const onDecreaseQuantity = (meal) => {
  const cartItem = props.cartItems.find((item) => item.id === meal.id);
  if (cartItem) {
    emit("decrease-quantity", cartItem);
  }
};

const getQuantity = (mealId) => {
  const item = props.cartItems.find((item) => item.id === mealId);
  return item ? item.quantity : 0;
};

const openPopup = () => {
  recommendPopup.value.open();
};

const closePopup = () => {
  recommendPopup.value.close();
};

const handleApplyToCart = () => {
  emit("apply-to-cart");
  closePopup();
};

watch(
  () => props.recommendation,
  (newVal) => {
    // 只有在非加载状态下更新了推荐才自动弹出（如果用户还没打开的话）
    if (newVal && !props.loading) {
      recommendPopup.value.open();
    }
  }
);
</script>

<style scoped lang="scss">
$descMarginButtom: 5rpx;

.ai-recommend-section {
  background: white;
  border: 2rpx solid rgba(139, 92, 246, 0.2);
  border-radius: 24rpx;
  padding: 20rpx;
  margin-bottom: 32rpx;
  color: #1f2937;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
  position: relative;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32rpx;
  padding-bottom: 0;
  border-bottom: none;
}

.ai-recommend-btn {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: none;
  padding: 8rpx 38rpx;
  border-radius: 80rpx;
  font-size: 28rpx;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  position: static;
  transform: none;
  margin: 0;
}

.ai-recommend-btn uni-icons {
  margin-right: 12rpx;
}

.ai-recommend-btn:hover:not(:disabled) {
  transform: translateY(-2rpx);
  box-shadow: 0 12rpx 40rpx rgba(139, 92, 246, 0.3);
}

.ai-recommend-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.ai-recommendation-empty {
  text-align: center;
  padding: 10rpx 0;
  color: #6b7280;
}

.empty-icon {
  color: rgba(139, 92, 246, 0.4);
  margin-bottom: 24rpx;
}

.empty-text {
  font-size: 28rpx;
  line-height: 1.5;
  color: #6b7280;
}

/* 弹窗样式 */
.popup-container {
  background: white;
  width: 650rpx;
  border-radius: 32rpx;
  overflow: hidden;
  box-shadow: 0 20rpx 80rpx rgba(0, 0, 0, 0.15);
}

.popup-loading {
  padding: 80rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.popup-loading > * + * {
  margin-top: 32rpx;
}

.ai-brain-icon {
  width: 120rpx;
  height: 120rpx;
  background: #f5f3ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 20rpx rgba(139, 92, 246, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
}

.loading-text {
  font-size: 28rpx;
  color: #6d28d9;
  font-weight: 600;
  text-align: center;
}

.loading-bar {
  width: 80%;
  height: 8rpx;
  background: #f3f4f6;
  border-radius: 4rpx;
  overflow: hidden;
}

.loading-progress {
  width: 30%;
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #d946ef);
  border-radius: 4rpx;
  animation: loadingMove 1.5s infinite linear;
}

@keyframes loadingMove {
  from { transform: translateX(-100%); width: 30%; }
  to { transform: translateX(400%); width: 30%; }
}

.popup-content {
  padding: 32rpx 24rpx 24rpx;
  position: relative;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  flex-shrink: 0;
}

.popup-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1e293b;
}

.ai-recommendation-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.reason-section {
  display: flex;
  align-items: flex-start;
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  padding: 20rpx 18rpx;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  border-left: 5rpx solid #8b5cf6;
  box-shadow: 0 4rpx 16rpx rgba(139, 92, 246, 0.15);
  flex-shrink: 0;
}

.reason-section uni-icons {
  margin-right: 12rpx;
}

.recommendation-reason {
  flex: 1;
  font-size: 26rpx;
  color: #5b21b6;
  line-height: 1.6;
  font-weight: 500;
}

.recommended-meals-grid {
  display: flex;
  flex-direction: column;
  margin-bottom: 20rpx;
  flex: 1;
  overflow-y: auto;
  padding: 4rpx;
  min-height: 0;
}

.recommended-meal-card {
  background: white;
  border-radius: 16rpx;
  padding: 16rpx;
  border: 2rpx solid #e2e8f0;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  flex-shrink: 0;
  margin-bottom: 20rpx;
}

.recommended-meal-card:last-child {
  margin-bottom: 0;
}

.recommended-meal-card:active {
  transform: translateY(-2rpx);
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.1);
}

.meal-card-content {
  display: flex;
}

.meal-image {
  width: 140rpx;
  height: 140rpx;
  border-radius: 12rpx;
  object-fit: cover;
  flex-shrink: 0;
  background: #f1f5f9;
  margin-right: 16rpx;
}

.meal-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.meal-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8rpx;
}

.meal-name {
  font-weight: 700;
  font-size: 30rpx;
  color: #0f172a;
  line-height: 1.3;
  flex: 1;
  padding-right: 12rpx;
}

.quantity-selector {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.quantity-selector > * + * {
  margin-left: 12rpx;
}

.control-group {
  display: flex;
  align-items: center;
}

.control-group > * + * {
  margin-left: 12rpx;
}

.minus-btn {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quantity {
  font-size: 24rpx;
  font-weight: 700;
  color: #1e293b;
  min-width: 30rpx;
  text-align: center;
}

.add-btn-small {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  width: 36rpx;
  height: 36rpx;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.meal-price {
  font-size: 32rpx;
  font-weight: 700;
  color: #ef4444;
  margin-top: 4rpx;
  margin-bottom: 6rpx;
}

.match-score {
  display: inline-flex;
  align-items: center;
  font-size: 24rpx;
  color: #8b5cf6;
  background: #f5f3ff;
  padding: 6rpx 16rpx;
  border-radius: 32rpx;
  font-weight: 600;
}

.match-score uni-icons {
  margin-right: 8rpx;
}

.nutrition-stats {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 16rpx;
  padding: 18rpx 16rpx;
  margin-bottom: 20rpx;
  border: 2rpx solid #fbbf24;
  box-shadow: 0 4rpx 16rpx rgba(251, 191, 36, 0.2);
  flex-shrink: 0;
}

.stats-title {
  display: block;
  font-size: 24rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
  color: #78350f;
}

.stats-tags {
  display: flex;
  flex-wrap: wrap;
  margin: -6rpx;
}

.nutrition-tag {
  display: flex;
  align-items: center;
  background: white;
  padding: 10rpx 20rpx;
  border-radius: 32rpx;
  font-size: 22rpx;
  color: #92400e;
  font-weight: 600;
  border: 2rpx solid #fbbf24;
  box-shadow: 0 2rpx 8rpx rgba(251, 191, 36, 0.15);
  margin: 6rpx;
}

.nutrition-tag uni-icons {
  margin-right: 6rpx;
}

.action-buttons {
  display: flex;
  flex-shrink: 0;
  justify-content: center;
}

.cancel-btn {
  width: 180rpx;
  background: #f1f5f9;
  color: #64748b;
  border: 2rpx solid #e2e8f0;
  border-radius: 80rpx;
  font-size: 26rpx;
  font-weight: 600;
  padding: 12rpx 0;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
}

.cancel-btn uni-icons {
  margin-right: 8rpx;
}

.cancel-btn:active {
  transform: scale(0.97);
  background: #e2e8f0;
}

.apply-btn {
  width: 260rpx;
  margin: 0;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: none;
  border-radius: 80rpx;
  font-size: 26rpx;
  font-weight: 600;
  padding: 12rpx 0;
  box-shadow: 0 6rpx 20rpx rgba(139, 92, 246, 0.35);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.apply-btn uni-icons {
  margin-right: 8rpx;
}

.apply-btn:active {
  transform: scale(0.97);
  box-shadow: 0 4rpx 16rpx rgba(139, 92, 246, 0.45);
}

/* 卡片显示区样式 */
.ai-recommendation-ready {
  background: #f0fdf4;
  border: 2rpx solid #bcf0da;
  border-radius: 16rpx;
  padding: 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ai-recommendation-ready:active {
  transform: scale(0.99);
  background: #dcfce7;
}

.ready-info {
  display: flex;
  align-items: center;
}

.ready-info uni-icons {
  margin-right: 12rpx;
}

.ready-text {
  font-size: 26rpx;
  color: #065f46;
  font-weight: 600;
}

.view-details {
  font-size: 24rpx;
  color: #059669;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20rpx);
}
</style>
