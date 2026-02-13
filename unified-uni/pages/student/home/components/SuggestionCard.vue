<template>
  <view class="suggestion-card">
    <text class="card-title">今日营养建议</text>
    <view class="suggestion-list">
      <view
        v-for="(suggestion, index) in props.suggestions"
        :key="index"
        class="suggestion-item"
        :class="props.getSuggestionClass(suggestion)"
      >
        <uni-icons
          :type="props.getSuggestionIcon(suggestion)"
          size="18"
          :color="props.getSuggestionColor(suggestion)"
        ></uni-icons>
        <text class="suggestion-text">{{ suggestion }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  suggestions: Array,
  getSuggestionClass: Function,
  getSuggestionIcon: Function,
  getSuggestionColor: Function,
});
</script>
<style scoped lang="scss">
.suggestion-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.suggestion-list {
  margin-top: 20rpx;
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 20rpx;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
}

.suggestion-item-danger {
  background-color: #fef2f2;
  border: 1rpx solid #fee2e2;
}

.suggestion-item-warning {
  background-color: #fffbeb;
  border: 1rpx solid #fef3c7;
}

.suggestion-item-success {
  background-color: #f0fdf4;
  border: 1rpx solid #dcfce7;
}

.suggestion-text {
  flex: 1;
  font-size: 26rpx;
  color: #1f2937;
  line-height: 40rpx;
}
</style>
