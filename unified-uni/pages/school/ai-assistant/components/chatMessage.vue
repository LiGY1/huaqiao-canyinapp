<template>
  <view class="message-wrapper" :class="message.sender">
    <view class="avatar" v-if="message.sender === 'ai'">
      <image src="/static/ai-avatar.png" mode="aspectFit" class="avatar-img" />
    </view>
    
    <view class="message-content">
      <view class="bubble">
        <!-- Markdown 渲染 -->
        <mp-html
          v-if="message.sender === 'ai'"
          :content="message.html"
          :markdown="true"
          class="rich-text"
        />
        <text v-else class="text">{{ message.text }}</text>

        <!-- 图片展示 -->
        <view v-if="message.files && message.files.length > 0" class="message-images">
          <image
            v-for="(file, idx) in message.files"
            :key="idx"
            :src="file.url"
            mode="widthFix"
            class="msg-img"
            @click="previewImage(file.url)"
          />
        </view>
      </view>

      <!-- 快捷按钮 -->
      <view v-if="message.sender === 'ai' && message.quickButtons && message.quickButtons.length > 0" class="quick-btns">
        <button 
          v-for="(btn, bIdx) in message.quickButtons" 
          :key="bIdx" 
          class="q-btn" 
          @click="onQuickBtnClick(btn.text)"
          :disabled="disabled"
        >
          {{ btn.text }}
        </button>
      </view>
      
      <text class="time">{{ formatTime(message.timestamp) }}</text>
    </view>
  </view>
</template>

<script setup>
import mpHtml from '@/components/mp-html/mp-html.vue';

const props = defineProps({
  message: Object,
  disabled: Boolean
});

const emit = defineEmits(['quick-button-click', 'preview-image']);

const onQuickBtnClick = (text) => {
  emit('quick-button-click', text);
};

const previewImage = (url) => {
  emit('preview-image', url);
};

const formatTime = (ts) => {
  const date = new Date(ts);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};
</script>

<style lang="scss" scoped>
.message-wrapper {
  display: flex;
  padding: 20rpx;
  gap: 20rpx;
  
  &.user {
    flex-direction: row-reverse;
    .bubble {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: #fff;
      border-bottom-right-radius: 4rpx;
    }
    .time { text-align: right; }
  }
  
  &.ai {
    .bubble {
      background-color: #fff;
      color: #1e293b;
      border-bottom-left-radius: 4rpx;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
    }
  }
}

.avatar {
  width: 72rpx;
  height: 72rpx;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  .avatar-img { width: 48rpx; height: 48rpx; }
}

.message-content {
  max-width: 75%;
}

.bubble {
  padding: 20rpx 28rpx;
  border-radius: 24rpx;
  font-size: 28rpx;
  line-height: 1.6;
}

.message-images {
  margin-top: 16rpx;
  .msg-img {
    width: 100%;
    border-radius: 12rpx;
  }
}

.quick-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 16rpx;
  .q-btn {
    font-size: 22rpx;
    background: #fff;
    color: #4facfe;
    border: 1rpx solid #4facfe;
    height: 54rpx;
    line-height: 52rpx;
    border-radius: 27rpx;
    margin: 0;
    &::after { border: none; }
  }
}

.time {
  font-size: 20rpx;
  color: #94a3b8;
  margin-top: 8rpx;
  display: block;
}

.rich-text {
  font-size: 28rpx;
  word-break: break-all;
}
</style>
