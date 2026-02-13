<template>
  <view class="typing-container">
    <view class="bubble ai">
      <view class="typing-dots">
        <view class="dot"></view>
        <view class="dot d2"></view>
        <view class="dot d3"></view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.typing-container {
  padding: 20rpx;
  display: flex;
}

.bubble {
  padding: 24rpx 32rpx;
  border-radius: 32rpx;
  max-width: 100rpx;
  position: relative;
  
  &.ai {
    background-color: #fff;
    border-bottom-left-radius: 4rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  }
}

.typing-dots {
  display: flex;
  gap: 8rpx;
  align-items: center;
  height: 24rpx;
}

.dot {
  width: 10rpx;
  height: 10rpx;
  background-color: #cbd5e1;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
  
  &.d2 { animation-delay: 0.2s; }
  &.d3 { animation-delay: 0.4s; }
}

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1.0); }
}
</style>
