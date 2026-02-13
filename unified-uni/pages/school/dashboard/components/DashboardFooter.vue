<template>
  <view class="footer">
    <text class="update-time">最后更新: {{ lastUpdateTime }}</text>
    <button class="refresh-btn" @click="$emit('manual-refresh')" :loading="loading">刷新数据</button>
  </view>
</template>

<script setup>
const props = defineProps({
  lastUpdateTime: { type: String, default: "" },
  loading: { type: Boolean, default: false },
});
</script>

<style scoped>
.footer {
  padding: 40rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}
.update-time {
  font-size: 24rpx;
  color: #94a3b8;
}
.refresh-btn {
  width: 240rpx;
  height: 72rpx;
  line-height: 72rpx;
  background: #4facfe;
  color: #fff;
  border-radius: 36rpx;
  font-size: 28rpx;
}
</style>
