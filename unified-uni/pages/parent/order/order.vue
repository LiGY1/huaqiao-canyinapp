<template>
  <layout>
    <view class="page-container">
      <!-- AI 推荐卡片 -->
      <view class="ai-recommend-card">
        <view class="ai-header">
          <view class="ai-title-box">
            <uni-icons type="paperplane-filled" size="24" color="#6366f1"></uni-icons>
            <text class="ai-title">AI 智能推荐</text>
          </view>
          <button 
            class="ai-btn" 
            :disabled="loadingRec || hasRec" 
            @click="fetchRecommendation"
          >
            <text>{{ loadingRec ? '分析中...' : hasRec ? '已推荐' : '获取推荐' }}</text>
          </button>
        </view>

        <view v-if="aiRec" class="ai-body mt-4">
          <text class="ai-reason">{{ aiRec.reason }}</text>
          <view class="rec-grid">
            <view v-for="m in aiRec.recommendedMeals" :key="m.id" class="rec-item">
              <text class="rec-name">{{ m.name }}</text>
              <view class="rec-meta">
                <text class="rec-price">¥{{ m.price }}</text>
                <text class="rec-score">{{ m.matchScore }}%</text>
              </view>
            </view>
          </view>
          <view class="rec-nut mt-4">
            <text class="nut-tag">热量 {{ aiRec.totalNutrition.calories }}</text>
            <text class="nut-tag">蛋白 {{ aiRec.totalNutrition.protein }}g</text>
            <text class="nut-tag">脂肪 {{ aiRec.totalNutrition.fat }}g</text>
          </view>
        </view>
        <view v-else class="ai-empty">
          <text>点击按钮，AI将为您推荐最适合的菜品组合</text>
        </view>
      </view>

      <!-- 菜品列表 -->
      <view class="meal-section mt-4">
        <view v-if="meals.length > 0" class="meal-grid">
          <view v-for="m in meals" :key="m.id" class="meal-card">
            <view class="meal-img-box">
              <image :src="m.image" mode="aspectFill" class="meal-img" />
              <view class="meal-cat-tag">{{ m.category }}</view>
            </view>
            <view class="meal-info">
              <text class="meal-name">{{ m.name }}</text>
              <view class="meal-nut-line">
                <text class="nut-s">{{ m.calories }}千卡</text>
                <text class="nut-s">P{{ m.protein }}g</text>
              </view>
              <view class="meal-footer">
                <text class="meal-price">¥{{ m.price }}</text>
                <view class="add-btn" @click="addToCart(m)">
                  <uni-icons type="plus" size="20" color="#fff"></uni-icons>
                </view>
              </view>
            </view>
          </view>
        </view>
        <view v-else class="empty-list">
          <uni-icons type="info" size="48" color="#cbd5e1"></uni-icons>
          <text>暂无菜品</text>
        </view>
      </view>

      <!-- 悬浮购物车按钮 -->
      <view v-if="totalItems > 0" class="cart-fab" @click="toggleCart">
        <uni-icons type="cart-filled" size="30" color="#fff"></uni-icons>
        <view class="badge">{{ totalItems }}</view>
      </view>

      <!-- 购物车弹出层 -->
      <uni-popup ref="cartPopup" type="bottom">
        <view class="cart-drawer">
          <view class="cart-header">
            <text class="cart-title">购物车</text>
            <view @click="toggleCart"><uni-icons type="closeempty" size="20"></uni-icons></view>
          </view>

          <scroll-view scroll-y class="cart-list">
            <view v-for="item in cartItems" :key="item.id" class="cart-item">
              <text class="item-name">{{ item.name }}</text>
              <view class="item-ops">
                <view class="qty-btn" @click="updateQty(item.id, -1)">-</view>
                <text class="qty-val">{{ item.quantity }}</text>
                <view class="qty-btn" @click="updateQty(item.id, 1)">+</view>
                <text class="item-p">¥{{ (item.price * item.quantity).toFixed(1) }}</text>
              </view>
            </view>
          </scroll-view>

          <view class="cart-footer">
            <view class="footer-left">
              <text class="total-label">合计</text>
              <text class="total-val">¥{{ totalPrice.toFixed(1) }}</text>
            </view>
            <button class="pay-btn" type="primary" :loading="submitting" @click="submitOrder">提交订单</button>
          </view>
        </view>
      </uni-popup>
    </view>
  </layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import layout from '@/components/layout.vue';
import { mealApi } from '@/api/parent';
import storage from '@/utils/storage';

const meals = ref([]);
const loading = ref(false);
const cartItems = ref([]);
const loadingRec = ref(false);
const hasRec = ref(false);
const aiRec = ref(null);
const cartPopup = ref(null);
const submitting = ref(false);

const totalItems = computed(() => cartItems.value.reduce((s, i) => s + i.quantity, 0));
const totalPrice = computed(() => cartItems.value.reduce((s, i) => s + i.price * i.quantity, 0));

const fetchMeals = async () => {
  loading.value = true;
  try {
    const res = await mealApi.getMealList();
    if (res.code === 200) meals.value = res.data;
  } catch (e) {}
  finally { loading.value = false; }
};

const fetchRecommendation = async () => {
  loadingRec.value = true;
  try {
    const res = await mealApi.getAIRecommendation();
    if (res.code === 200) {
      aiRec.value = res.data;
      hasRec.value = true;
      res.data.recommendedMeals.forEach(m => addToCart(m, false));
      uni.showToast({ title: '已为您加入推荐搭配' });
    }
  } catch (e) {}
  finally { loadingRec.value = false; }
};

const addToCart = (meal, showMsg = true) => {
  const existing = cartItems.value.find(i => i.id === meal.id);
  if (existing) {
    existing.quantity++;
  } else {
    cartItems.value.push({ ...meal, quantity: 1 });
  }
  if (showMsg) uni.showToast({ title: '已加入购物车', icon: 'none' });
};

const updateQty = (id, delta) => {
  const idx = cartItems.value.findIndex(i => i.id === id);
  if (idx > -1) {
    cartItems.value[idx].quantity += delta;
    if (cartItems.value[idx].quantity <= 0) {
      cartItems.value.splice(idx, 1);
    }
  }
};

const toggleCart = () => {
  if (cartItems.value.length === 0) {
    uni.showToast({ title: '购物车是空的', icon: 'none' });
    return;
  }
  cartPopup.value.open();
};

const submitOrder = async () => {
  submitting.value = true;
  try {
    const userInfo = storage.getUserInfo();
    const childId = userInfo?.children?.[0]?._id;
    if (!childId) {
       uni.showToast({ title: '请先绑定孩子', icon: 'none' });
       return;
    }
    const res = await mealApi.submitOrder({
      items: cartItems.value,
      totalPrice: totalPrice.value,
      childId: childId
    });
    if (res.code === 200) {
      uni.showToast({ title: '下单成功', icon: 'success' });
      cartItems.value = [];
      cartPopup.value.close();
      uni.navigateTo({ url: `/pages/parent/order-status/orderStatus?orderId=${res.data.orderId}` });
    }
  } catch (e) {}
  finally { submitting.value = false; }
};

onMounted(() => {
  fetchMeals();
});
</script>

<style lang="scss" scoped>
.page-container {
  padding: 30rpx;
  background-color: #f8fafc;
  min-height: 100vh;
}

.ai-recommend-card {
  background: linear-gradient(135deg, #eff6ff, #f5f3ff);
  border-radius: 24rpx;
  padding: 30rpx;
  border: 1rpx solid #e0e7ff;
}

.ai-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ai-title-box {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.ai-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #1e1b4b;
}

.ai-btn {
  background: #6366f1;
  color: #fff;
  font-size: 24rpx;
  border-radius: 50rpx;
}

.ai-reason {
  font-size: 26rpx;
  color: #4338ca;
  line-height: 1.5;
  display: block;
  margin-bottom: 20rpx;
}

.rec-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.rec-item {
  background: rgba(255,255,255,0.6);
  padding: 20rpx;
  border-radius: 16rpx;
}

.rec-name { font-size: 24rpx; font-weight: bold; }
.rec-meta { display: flex; justify-content: space-between; margin-top: 8rpx; }
.rec-price { font-size: 22rpx; color: #6366f1; }
.rec-score { font-size: 20rpx; color: #10b981; }

.rec-nut {
  display: flex;
  gap: 16rpx;
}

.nut-tag {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  font-size: 20rpx;
}

.ai-empty {
  padding: 40rpx 0;
  text-align: center;
  color: #94a3b8;
  font-size: 24rpx;
}

.meal-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.meal-card {
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.meal-img-box {
  position: relative;
  height: 240rpx;
}

.meal-img {
  width: 100%;
  height: 100%;
}

.meal-cat-tag {
  position: absolute;
  top: 16rpx;
  left: 16rpx;
  background: rgba(0,0,0,0.5);
  color: #fff;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  font-size: 20rpx;
}

.meal-info {
  padding: 20rpx;
}

.meal-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #1e293b;
}

.meal-nut-line {
  display: flex;
  gap: 12rpx;
  margin-top: 8rpx;
}

.nut-s {
  font-size: 20rpx;
  color: #94a3b8;
}

.meal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16rpx;
}

.meal-price {
  font-size: 32rpx;
  font-weight: bold;
  color: #ef4444;
}

.add-btn {
  background: #3b82f6;
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-fab {
  position: fixed;
  bottom: 120rpx;
  right: 40rpx;
  background: #3b82f6;
  width: 110rpx;
  height: 110rpx;
  border-radius: 50%;
  box-shadow: 0 8rpx 24rpx rgba(59,130,246,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99;
}

.badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #ef4444;
  color: #fff;
  font-size: 20rpx;
  min-width: 36rpx;
  height: 36rpx;
  border-radius: 18rpx;
  text-align: center;
  line-height: 36rpx;
}

.cart-drawer {
  background: #fff;
  padding: 40rpx 30rpx;
  border-top-left-radius: 32rpx;
  border-top-right-radius: 32rpx;
}

.cart-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30rpx;
}

.cart-title { font-size: 32rpx; font-weight: bold; }

.cart-list { max-height: 400rpx; }

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f1f5f9;
}

.item-name { font-size: 28rpx; }

.item-ops {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.qty-btn {
  width: 48rpx;
  height: 48rpx;
  border: 1rpx solid #cbd5e1;
  border-radius: 8rpx;
  text-align: center;
  line-height: 44rpx;
}

.qty-val { font-size: 28rpx; width: 40rpx; text-align: center; }

.item-p { font-size: 28rpx; font-weight: bold; width: 100rpx; text-align: right; }

.cart-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 40rpx;
}

.total-val { font-size: 40rpx; font-weight: bold; color: #ef4444; margin-left: 12rpx; }

.pay-btn {
  width: 300rpx;
}

.mt-4 { margin-top: 30rpx; }
</style>
