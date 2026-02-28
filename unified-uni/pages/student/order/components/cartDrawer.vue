<template>
  <view class="cart-drawer cart-drawer-bottom">
    <view class="cart-drawer-header">
      <h3 class="cart-title">购物车</h3>
      <button class="close-btn" @click="onClose">
        <uni-icons type="closeempty" size="20" color="white"></uni-icons>
      </button>
    </view>

    <view v-if="cart.items.length > 0" class="cart-drawer-content">
      <view class="cart-items">
        <view v-for="item in cart.items" :key="item.id" class="cart-item-card">
          <view class="cart-item-header">
            <span class="cart-item-name">{{ item.name }}</span>
            <button class="remove-item-btn" @click="onRemoveItem(item.id)">
              <uni-icons type="trash" size="18" color="#ff4d4f"></uni-icons>
            </button>
          </view>

          <!-- 营养信息显示 -->
          <view class="cart-item-nutrition">
            <view class="nutrition-grid">
              <view class="nutrition-grid-item">
                <div class="nutrition-value text-orange-500">
                  {{ Math.round(((item.calories ?? item.nutrition?.calories ?? 0) * item.quantity)) }}
                </div>
                <div class="nutrition-unit">千卡</div>
              </view>
              <view class="nutrition-grid-item">
                <div class="nutrition-value text-blue-500">{{ (((item.protein ?? item.nutrition?.protein ?? 0) * item.quantity)).toFixed(1) }}</div>
                <div class="nutrition-unit">蛋白质(g)</div>
              </view>
              <view class="nutrition-grid-item">
                <div class="nutrition-value text-purple-500">{{ (((item.fat ?? item.nutrition?.fat ?? 0) * item.quantity)).toFixed(1) }}</div>
                <div class="nutrition-unit">脂肪(g)</div>
              </view>
              <view class="nutrition-grid-item">
                <div class="nutrition-value text-green-500">{{ (((item.carbs ?? item.nutrition?.carbs ?? 0) * item.quantity)).toFixed(1) }}</div>
                <div class="nutrition-unit">碳水(g)</div>
              </view>
            </view>
            <view v-if="(item.fiber ?? item.nutrition?.fiber ?? 0) > 0" class="fiber-info">
              膳食纤维: <span class="fiber-value">{{ (((item.fiber ?? item.nutrition?.fiber ?? 0) * item.quantity)).toFixed(1) }}g</span>
            </view>
          </view>

          <view class="cart-item-footer">
            <view class="quantity-control">
              <uni-icons @click="onDecreaseQuantity(item)" type="minus" size="30" color="#677be6"></uni-icons>
              <span class="quantity-value">{{ item.quantity }}</span>
              <uni-icons @click="onIncreaseQuantity(item)" type="plus" size="30" color="#3175f1"></uni-icons>
            </view>
            <view class="item-total-price"> ¥{{ (item.price * item.quantity).toFixed(2) }} </view>
          </view>
        </view>
      </view>

      <view class="cart-drawer-footer">
        <view class="total-section">
          <span class="total-label">总计</span>
          <span class="total-price">¥{{ cart.totalPrice.toFixed(2) }}</span>
        </view>

        <view class="cart-nutrition-summary">
          <view class="summary-item">
            <div class="summary-value">{{ totalNutrition.calories }}</div>
            <div class="summary-unit">千卡</div>
          </view>
          <view class="summary-item">
            <div class="summary-value">{{ totalNutrition.protein }}g</div>
            <div class="summary-unit">蛋白质</div>
          </view>
          <view class="summary-item">
            <div class="summary-value">{{ totalNutrition.fat }}g</div>
            <div class="summary-unit">脂肪</div>
          </view>
          <view class="summary-item">
            <div class="summary-value">{{ totalNutrition.carbs }}g</div>
            <div class="summary-unit">碳水</div>
          </view>
        </view>

        <button class="submit-order-btn" :disabled="submitting" @click="onSubmitOrder">
          <uni-icons v-if="submitting" type="spinner" size="18" class="loading-icon"></uni-icons>
          {{ submitting ? "提交中..." : "提交订单" }}
        </button>
      </view>
    </view>

    <view v-else class="empty-cart">
      <uni-icons type="cart" size="64" color="#d1d5db"></uni-icons>
      <text class="empty-text">购物车是空的</text>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  cart: {
    type: Object,
    default: () => ({
      items: [],
      totalItems: 0,
      totalPrice: 0,
    }),
  },
  totalNutrition: {
    type: Object,
    default: () => ({}),
  },
  submitting: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "decrease-quantity", "increase-quantity", "remove-item", "submit-order"]);

const onClose = () => {
  emit("close");
};

const onDecreaseQuantity = (item) => {
  emit("decrease-quantity", item);
};

const onIncreaseQuantity = (item) => {
  emit("increase-quantity", item);
};

const onRemoveItem = (itemId) => {
  emit("remove-item", itemId);
};

const onSubmitOrder = () => {
  emit("submit-order");
};
</script>

<style scoped>
/* 购物车抽屉样式 */
.cart-drawer {
  width: 100%;
  height: 100vh;
  background: white;
  display: flex;
  flex-direction: column;
  box-shadow: -8rpx 0 64rpx rgba(0, 0, 0, 0.15);
}

.cart-drawer-bottom {
  width: 100%;
  max-width: none;
  height: 80vh;
  border-radius: 32rpx 32rpx 0 0;
  box-shadow: 0 -8rpx 64rpx rgba(0, 0, 0, 0.15);
}

.cart-drawer-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx 32rpx;
  border-bottom: 2rpx solid #f0f2f5;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 32rpx 32rpx 0 0;
  position: relative;
}

.cart-title {
  font-size: 36rpx;
  font-weight: 600;
  color: white;
  margin: 0;
}

.cart-drawer-header .close-btn {
  background: rgba(255, 255, 255, 0.4);
  color: white;
  border: none;
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: absolute;
  top: 50%;
  right: 24rpx;
  transform: translateY(-50%);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
}

.cart-drawer-header .close-btn:hover {
  background: rgba(255, 255, 255, 0.5);
  transform: translateY(-50%) scale(1.1);
}

.cart-drawer-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cart-items {
  flex: 1;
  overflow-y: auto;
  padding: 40rpx;
  scrollbar-width: thin;
  scrollbar-color: #e2e8f0 transparent;
}

.cart-items::-webkit-scrollbar {
  width: 12rpx;
}

.cart-items::-webkit-scrollbar-track {
  background: transparent;
}

.cart-items::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 6rpx;
}

.cart-items::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

.cart-item-card {
  background: white;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  transition: all 0.3s ease;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid #f0f2f5;
}

.cart-item-card:hover {
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
  transform: translateY(-2rpx);
}

.cart-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.cart-item-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2937;
  flex: 1;
}

.remove-item-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8rpx;
  border-radius: 8rpx;
  transition: all 0.3s ease;
  opacity: 0.7;
  line-height: 30rpx;
}

.remove-item-btn:hover {
  background: #fee2e2;
  opacity: 1;
}

.cart-item-nutrition {
  margin-bottom: 20rpx;
  background: #f8fafc;
  border-radius: 16rpx;
  padding: 16rpx;
}

.nutrition-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.nutrition-grid-item {
  text-align: center;
  background: white;
  padding: 10rpx 6rpx;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.nutrition-value {
  font-size: 30rpx;
  font-weight: 700;
  display: block;
  margin-bottom: 1rpx;
}

.text-orange-500 {
  color: #f97316;
}

.text-blue-500 {
  color: #3b82f6;
}

.text-purple-500 {
  color: #8b5cf6;
}

.text-green-500 {
  color: #10b981;
}

.nutrition-unit {
  font-size: 20rpx;
  color: #94a3b8;
  font-weight: 500;
}

.fiber-info {
  font-size: 26rpx;
  color: #64748b;
  text-align: center;
  padding: 8rpx;
  background: rgba(16, 185, 129, 0.05);
  border-radius: 12rpx;
  border: 2rpx solid rgba(16, 185, 129, 0.1);
}

.fiber-value {
  font-weight: 600;
  color: #10b981;
}

.cart-item-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16rpx;
  border-top: 2rpx solid #f0f2f5;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: #f8fafc;
  padding: 8rpx 16rpx;
  border-radius: 32rpx;
}

.quantity-btn {
  width: 52rpx;
  height: 52rpx;
  border: 2rpx solid #e2e8f0;
  background: white;
  cursor: pointer;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  font-weight: 600;
}

.quantity-btn:active {
  transform: scale(0.95);
}

.quantity-btn:hover:not(.primary) {
  border-color: #cbd5e1;
  background: #f1f5f9;
}

.quantity-btn.primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-color: #3b82f6;
  color: white;
  box-shadow: 0 2rpx 8rpx rgba(59, 130, 246, 0.2);
}

.quantity-btn.primary:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border-color: #2563eb;
  box-shadow: 0 4rpx 16rpx rgba(59, 130, 246, 0.3);
}

.quantity-btn.primary:active {
  transform: scale(0.95);
}

.quantity-value {
  font-size: 28rpx;
  font-weight: 700;
  min-width: 52rpx;
  text-align: center;
  color: #1f2937;
}

.item-total-price {
  font-size: 30rpx;
  font-weight: 700;
  color: #ef4444;
}

.cart-drawer-footer {
  padding: 40rpx;
  border-top: 2rpx solid #f0f2f5;
  background: white;
  box-shadow: 0 -4rpx 32rpx rgba(0, 0, 0, 0.05);
}

.total-section {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  margin-top: 24rpx !important;
  padding-top: 20rpx !important;
  border-top: 2rpx solid #f0f2f5 !important;
  margin-bottom: 20rpx !important;
}

.total-label {
  font-size: 28rpx;
  color: #64748b;
  font-weight: 500;
}

.total-price {
  font-size: 36rpx;
  font-weight: 700;
  color: #ef4444;
}

.cart-nutrition-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 12rpx;
  padding: 12rpx;
  margin-bottom: 20rpx;
  border: 2rpx solid #e2e8f0;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.summary-item {
  text-align: center;
  background: white;
  padding: 12rpx 4rpx;
  border-radius: 8rpx;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.05);
}

.summary-value {
  font-size: 28rpx;
  font-weight: 700;
  color: #1f2937;
  display: block;
}

.summary-unit {
  font-size: 18rpx;
  color: #94a3b8;
  font-weight: 500;
  margin-top: 2rpx;
}

.submit-order-btn {
  width: 100%;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 16rpx;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2rpx 8rpx rgba(16, 185, 129, 0.2);
  position: relative;
  overflow: hidden;
}

.submit-order-btn::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.submit-order-btn:hover:not(:disabled)::before {
  left: 100%;
}

.submit-order-btn:hover:not(:disabled) {
  transform: translateY(-4rpx);
  box-shadow: 0 12rpx 40rpx rgba(16, 185, 129, 0.4);
}

.submit-order-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-order-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.empty-cart {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #d1d5db;
}

.empty-text {
  margin-top: 24rpx;
  font-size: 28rpx;
  color: #9ca3af;
}

.loading-icon {
  animation: spin 1s linear infinite;
  margin-right: 8rpx;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
