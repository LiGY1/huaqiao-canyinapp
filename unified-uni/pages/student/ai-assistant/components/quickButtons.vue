<template>
  <view class="quick-buttons">
    <button
      class="quick-button"
      v-for="(button, btnIndex) in buttons"
      :key="btnIndex"
      @tap="onButtonClick(button.text)"
      :disabled="disabled"
    >
      {{ button.text }}
    </button>
  </view>
</template>

<script setup>
// Props
const props = defineProps({
  buttons: {
    type: Array,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(["click"]);

// Methods
const onButtonClick = (text) => {
  emit("click", text);
};
</script>

<style scoped>
.quick-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 20rpx;
}

.quick-button {
  margin: 0;
  padding: 0 24rpx;
  height: 60rpx;
  line-height: 60rpx;
  font-size: 24rpx;
  background: #eff6ff;
  color: #1a5f9e;
  border: 1rpx solid #bfdbfe;
  border-radius: 30rpx;
}

.quick-button::after {
  border: none;
}
</style>
