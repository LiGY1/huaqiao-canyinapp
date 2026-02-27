<template>
  <layout>
    <view class="order-page">
      <view class="container">
        <!-- AI 推荐组件 -->
        <ai-recommendation-component
          :recommendation="aiRecommendation"
          :displayed-meals="displayedMeals"
          :nutrition="displayedMealsNutrition"
          :loading="loadingRecommendation"
          :cart-items="cartState.items"
          class="recommendation-popup-container"
          @recommend="handleRecommendClick"
          @add-to-cart="addToCart"
          @decrease-quantity="decreaseQuantity"
          @apply-to-cart="applyToCart"
        ></ai-recommendation-component>

        <!-- 用餐方式选择 -->
        <dining-type-selector v-model="selectedDiningType" @change="handleDiningTypeChange" />

        <!-- 分类展示所有菜品 -->
        <all-meals-component
          :meals="meals"
          :cart-items="cartState.items"
          @add-to-cart="addToCart"
          @decrease-quantity="decreaseQuantity"
        ></all-meals-component>
      </view>

      <!-- 购物车按钮 -->
      <uni-transition mode-class="fade" :show="cartTotalItems > 0 && meals.length > 0">
        <view class="cart-button-container">
          <cart-button-component :total-items="cartTotalItems" @click="toggleCart"></cart-button-component>
        </view>
      </uni-transition>

      <!-- 购物车抽屉 -->
      <uni-popup ref="popup" type="bottom" :mask-click="true" :safe-area-inset-bottom="true" class="high-z-index-popup">
        <cart-drawer-component
          :cart="{ items: cartState.items, totalItems: cartTotalItems, totalPrice: cartTotalPrice }"
          :total-nutrition="totalNutrition"
          :submitting="submitting"
          @close="closeCart"
          @decrease-quantity="decreaseQuantity"
          @increase-quantity="increaseQuantity"
          @remove-item="removeItemFromCart"
          @submit-order="submitOrder"
        ></cart-drawer-component>
      </uni-popup>
    </view>
  </layout>
</template>

<script setup>
import { onMounted, ref } from "vue";
import layout from "@/components/layout.vue";
import { getCurrentSolarTerm } from "@/api/meal.js";

// 导入本地组件
import diningTypeSelector from "./components/diningTypeSelector.vue";
import aiRecommendationComponent from "./components/aiRecommendation.vue";
import allMealsComponent from "./components/allMeals.vue";
import cartButtonComponent from "./components/cartButton.vue";
import cartDrawerComponent from "./components/cartDrawer.vue";

// 导入 Hooks
import { useCart } from "./hooks/useCart.js";
import { useMeals } from "./hooks/useMeals.js";
import { useAIRecommendation } from "./hooks/useAIRecommendation.js";
import { useOrder } from "./hooks/useOrder.js";

// 用餐方式
const selectedDiningType = ref("dine-in");

// 处理用餐方式变化
const handleDiningTypeChange = (type) => {
  // 可以在这里添加额外的业务逻辑
  // console.log("用餐方式已切换为:", type);
};

// 1. 初始化购物车逻辑
const {
  popup,
  cartState,
  syncCartState,
  cartTotalItems,
  cartTotalPrice,
  totalNutrition,
  addToCart,
  decreaseQuantity,
  increaseQuantity,
  removeItemFromCart,
  toggleCart,
  closeCart,
} = useCart();

const { meals, fetchMeals } = useMeals();

const {
  aiRecommendation,
  displayedMeals,
  displayedMealsNutrition,
  loadingRecommendation,
  handleRecommendClick,
  applyToCart,
} = useAIRecommendation(syncCartState);

const { submitting, submitOrder } = useOrder(cartState, cartTotalPrice, syncCartState, closeCart, selectedDiningType);

onMounted(() => {
  fetchMeals();
});
</script>

<style scoped>
.order-page {
  height: 100%;
  background-color: #f5f7fa;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.container {
  max-width: 100%;
  padding: 20rpx;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 44px - env(safe-area-inset-top));
  position: relative;
}

.cart-button-container {
  position: fixed;
  bottom: 160rpx;
  right: 40rpx;
  z-index: 90;
}

.high-z-index-popup,
.recommendation-popup-container :deep(.recommendation-popup) {
  z-index: 9999 !important;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
