<template>
  <view class="message-wrapper" :class="{ 'justify-end': message.sender === 'user' }">
    <!-- AI 消息 -->
    <template v-if="message.sender === 'ai'">
      <view class="message ai">
        <!-- 富文本渲染区域 -->
        <mp-html
          class="message-content"
          :content="message.html || ''"
          :copy-link="true"
          :selectable="true"
          :markdown="true"
        />

        <!-- 图片区域 -->
        <view v-if="message.files && message.files.length > 0" class="message-images">
          <view v-for="(file, fileIndex) in message.files" :key="fileIndex" class="message-image-item">
            <image
              mode="widthFix"
              :src="file.url"
              :alt="file.filename || 'AI生成的图片'"
              @click.stop="previewImage(file.url)"
              @error="onImageError(fileIndex)"
              class="clickable-image"
            />
          </view>
        </view>

        <view class="message-time">{{ formatTime(message.timestamp) }}</view>

        <!-- 快捷按钮 -->
        <QuickButtons
          v-if="message.quickButtons && message.quickButtons.length"
          :buttons="message.quickButtons"
          :disabled="disabled"
          @click="onQuickButtonClick"
        />
      </view>
    </template>

    <!-- 用户消息 -->
    <template v-if="message.sender === 'user'">
      <view class="message user">
        <text class="message-content-text">{{ message.text }}</text>
        <view class="message-time text-white">{{ formatTime(message.timestamp) }}</view>
      </view>
    </template>
  </view>
</template>

<script setup>
import mpHtml from "@/components/mp-html/mp-html";
import QuickButtons from "./quickButtons.vue";

// Props
const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(["quickButtonClick", "previewImage"]);

// Methods
const formatTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

const previewImage = (url) => {
  emit("previewImage", url);
};

const onImageError = (fileIndex) => {
  console.log("Image load error", fileIndex);
};

const onQuickButtonClick = (text) => {
  emit("quickButtonClick", text);
};
</script>

<style scoped>
.message-wrapper {
  display: flex;
  margin-bottom: 30rpx;
  width: 100%;
}

.message-wrapper.justify-end {
  justify-content: flex-end;
}

.message {
  padding: 12rpx 16rpx;
  border-radius: 36rpx;
  box-shadow: 0 4rpx 16rpx rgba(26, 95, 158, 0.08);
  font-size: 30rpx;
  line-height: 1.6;
}

.message.user {
  background: linear-gradient(135deg, #1a5f9e, #2c72b5);
  color: white;
  border-bottom-right-radius: 12rpx;
  margin-left: auto;
}

.message.ai {
  background: #ffffff;
  color: #2c3e50;
  border-bottom-left-radius: 12rpx;
}

.message-time {
  font-size: 22rpx;
  opacity: 0.7;
  margin-top: 8rpx;
  text-align: right;
}

.text-white {
  color: rgba(255, 255, 255, 0.9);
}

/* 图片 */
.message-images {
  margin-top: 16rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}
.clickable-image {
  max-width: 400rpx;
  border-radius: 12rpx;
}
</style>
