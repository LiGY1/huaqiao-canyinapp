<template>
  <view class="input-container">
    <view class="input-wrapper">
      <textarea
        v-model="msgText"
        class="input-box"
        :placeholder="placeholder"
        auto-height
        :disabled="disabled"
        maxlength="500"
        cursor-spacing="20"
      />
      <button 
        class="send-btn" 
        :class="{ active: msgText.trim() && !disabled }"
        @click="onSend"
        :disabled="!msgText.trim() || disabled"
      >
        <uni-icons type="paperplane-filled" size="20" color="#fff"></uni-icons>
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  disabled: Boolean,
  placeholder: {
    type: String,
    default: '咨询中心助手...'
  }
});

const emit = defineEmits(['send-message']);

const msgText = ref('');

const onSend = () => {
  if (!msgText.value.trim() || props.disabled) return;
  emit('send-message', msgText.value);
  msgText.value = '';
};
</script>

<style lang="scss" scoped>
.input-container {
  padding: 20rpx 30rpx;
  background: #fff;
  border-top: 1rpx solid #edf2f7;
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 20rpx;
}

.input-box {
  flex: 1;
  background: #f1f5f9;
  border-radius: 20rpx;
  padding: 16rpx 24rpx;
  font-size: 28rpx;
  min-height: 40rpx;
  max-height: 200rpx;
}

.send-btn {
  width: 80rpx;
  height: 80rpx;
  background-color: #cbd5e1;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.3s;
  &::after { border: none; }
  
  &.active {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    box-shadow: 0 4rpx 12rpx rgba(79, 172, 254, 0.3);
  }
}
</style>
