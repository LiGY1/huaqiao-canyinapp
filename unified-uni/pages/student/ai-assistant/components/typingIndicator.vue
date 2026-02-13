<template>
  <view class="message-wrapper">
    <view class="typing-indicator">
      <view class="typing-dots">
        <view class="typing-dot"></view>
        <view class="typing-dot"></view>
        <view class="typing-dot"></view>
      </view>
    </view>
  </view>
</template>

<script setup>
// No props or emits needed for this simple component
</script>

<style scoped>
.typing-indicator {
  padding: 20rpx 30rpx;
  background: #fff;
  border-radius: 30rpx;
  border-bottom-left-radius: 8rpx;
  width: 100rpx;
}
.typing-dots {
  display: flex;
  gap: 8rpx;
}
.typing-dot {
  width: 12rpx;
  height: 12rpx;
  background: #1a5f9e;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}
.typing-dot:nth-child(1) {
  animation-delay: -0.32s;
}
.typing-dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}
</style>
