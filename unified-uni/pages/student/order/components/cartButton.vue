<template>
  <view class="cart-badge">
    <button class="cart-btn" @click="onClick">
      <uni-icons :size="28" type="cart" color="white"></uni-icons>
    </button>
    <view class="badge-count">
      {{ totalItems > 99 ? "99+" : totalItems }}
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  totalItems: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(["click"]);

const onClick = () => {
  emit("click");
};
</script>

<style scoped>
.cart-badge {
  position: relative;
}

.cart-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8rpx 32rpx rgba(59, 130, 246, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.cart-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 12rpx 40rpx rgba(59, 130, 246, 0.4);
}

.badge-count {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  background: #ef4444;
  color: white;
  font-size: 32rpx;
  padding: 0;
  border-radius: 32rpx;
  min-width: 56rpx;
  text-align: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.15);
}
</style>
