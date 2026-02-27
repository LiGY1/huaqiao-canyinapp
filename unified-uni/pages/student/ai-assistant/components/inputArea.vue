<template>
  <view class="input-area" :style="{ bottom: inputBottom + 'px' }">
    <!-- <view class="input-tabs">
      <view class="input-tab" :class="{ active: activeTab === 'text' }" @tap="switchTab('text')">
        <text>文本输入</text>
      </view>
      <view class="input-tab" :class="{ active: activeTab === 'voice' }" @tap="openVoiceCall">
        <text>呼叫助手</text>
      </view>
    </view> -->

    <!-- 文本输入 -->
    <view class="input-content" v-if="activeTab === 'text'">
      <view class="text-input-area">
        <!-- 电话按钮 -->
        <view class="voice-button" @tap="openVoiceCall">
          <uni-icons type="phone-filled" size="24" color="#1a5f9e"></uni-icons>
        </view>
        
        <textarea
          class="text-input"
          v-model="localInput"
          placeholder="开始质询 AI 健康顾问..."
          :auto-height="true"
          :adjust-position="false"
          @focus="onInputFocus"
          @blur="onInputBlur"
          @confirm="handleSendMessage"
          confirm-type="send"
          maxlength="-1"
        ></textarea>
        
        <view class="send-button" :class="{ disabled: !localInput.trim() || disabled }" @tap="handleSendMessage">
          <text class="send-icon">↑</text>
        </view>
      </view>
    </view>

    <!-- 语音入口 -->
    <view class="input-content" v-if="activeTab === 'voice'">
      <view class="voice-input-area">
        <view class="voice-call-prompt">
          <text class="prompt-text">点击下方按钮开启语音通话</text>
          <text class="prompt-subtext">全屏沉浸式体验</text>
        </view>
        <button class="start-voice-call-button" @tap="openVoiceCall">
          <text>开启语音通话</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from "vue";

// Props
const props = defineProps({
  activeTab: {
    type: String,
    default: "text",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

// Emits (use kebab-case so parent listeners like @send-message work without warnings)
const emit = defineEmits([
  "send-message",
  "switch-tab",
  "open-voice-call",
  "input-focus",
  "input-blur",
  "keyboard-height-change",
]);

// Local state
const localInput = ref("");
const inputBottom = ref(0);
const areaHeight = ref(0);

let uniKeyboardListener = null;
let visualViewportHandler = null;
let resizeHandler = null;

// Watch for external changes to activeTab
watch(
  () => props.activeTab,
  (newTab) => {
    if (newTab === "text") {
      // Focus textarea when switching to text tab
      setTimeout(() => {
        uni
          .createSelectorQuery()
          .select(".text-input")
          .context((res) => {
            res.context.focus();
          })
          .exec();
      }, 100);
    }
  }
);

// Methods
const switchTab = (tab) => {
  emit("switch-tab", tab);
};

const openVoiceCall = () => {
  emit("open-voice-call");
};

const onInputFocus = (e) => {
  // Prefer platform-provided keyboard height
  if (e && e.detail && e.detail.height) {
    inputBottom.value = e.detail.height;
  }
  emit("input-focus");
};

const onInputBlur = () => {
  inputBottom.value = 0;
  emit("input-blur");
};

// Emit combined offset (area height + keyboard height) so parent can adjust scroll padding
watch(
  () => inputBottom.value,
  (h) => {
    const total = (areaHeight.value || 0) + (h || 0);
    emit("keyboard-height-change", total);
  }
);

onMounted(() => {
  // measure area height
  uni
    .createSelectorQuery()
    .select(".input-area")
    .boundingClientRect((rect) => {
      if (rect && rect.height) {
        areaHeight.value = rect.height;
        // initial emit so parent can reserve space
        emit("keyboard-height-change", areaHeight.value + (inputBottom.value || 0));
      }
    })
    .exec();

  // Use uni API when available (App/MP)
  if (typeof uni !== "undefined" && uni.onKeyboardHeightChange) {
    try {
      uniKeyboardListener = uni.onKeyboardHeightChange((res) => {
        if (res && res.height !== undefined) {
          inputBottom.value = res.height;
        }
      });
    } catch (e) {
      // ignore
    }
  } else if (typeof window !== "undefined") {
    // H5: use visualViewport to detect keyboard resize
    if (window.visualViewport) {
      visualViewportHandler = () => {
        const heightDiff = window.innerHeight - window.visualViewport.height;
        inputBottom.value = Math.max(0, Math.round(heightDiff));
      };
      window.visualViewport.addEventListener("resize", visualViewportHandler);
    } else {
      // fallback: window resize
      resizeHandler = () => {
        const heightDiff = window.innerHeight - document.documentElement.clientHeight;
        inputBottom.value = Math.max(0, Math.round(heightDiff));
      };
      window.addEventListener("resize", resizeHandler);
    }
  }
});

onBeforeUnmount(() => {
  if (uniKeyboardListener && uniKeyboardListener.off) {
    uniKeyboardListener.off();
  }
  if (visualViewportHandler && window.visualViewport) {
    window.visualViewport.removeEventListener("resize", visualViewportHandler);
  }
  if (resizeHandler) {
    window.removeEventListener("resize", resizeHandler);
  }
});

const handleSendMessage = () => {
  const text = localInput.value.trim();
  if (text && !props.disabled) {
    emit("send-message", text);
    localInput.value = "";
  }
};
</script>

<style scoped>
/* 输入区域 */
.input-area {
  width: 100%;
  padding: 20rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: white;
  border-top: 1rpx solid rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
  z-index: 100;
  transition: bottom 0.3s;
}

.input-tabs {
  display: flex;
  margin-bottom: 20rpx;
  background: #f1f5f9;
  border-radius: 16rpx;
  padding: 6rpx;
}

.input-tab {
  flex: 1;
  text-align: center;
  padding: 12rpx 0;
  border-radius: 12rpx;
  font-size: 26rpx;
  color: #64748b;
}

.input-tab.active {
  background: white;
  color: #1a5f9e;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  font-weight: 500;
}

.text-input-area {
  display: flex;
  align-items: flex-end;
  gap: 20rpx;
}

/* 电话按钮 */
.voice-button {
  width: 80rpx;
  height: 80rpx;
  background: #f0f7ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s;
}

.voice-button:active {
  background: #e0f0ff;
  transform: scale(0.95);
}

.text-input {
  flex: 1;
  background: #f8fafc;
  border: 1rpx solid #e2e8f0;
  border-radius: 32rpx;
  padding: 20rpx 30rpx;
  font-size: 30rpx;
  min-height: 40rpx;
  max-height: 200rpx;
  width: auto;
}

.send-button {
  width: 80rpx;
  height: 80rpx;
  background: #1a5f9e;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.send-button.disabled {
  background: #cbd5e1;
}

.send-icon {
  color: white;
  font-size: 36rpx;
  font-weight: bold;
}

/* Voice Call */
.voice-input-area {
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.start-voice-call-button {
  background: linear-gradient(135deg, #1a5f9e, #2c72b5);
  color: white;
  border-radius: 40rpx;
  padding: 0 60rpx;
  height: 80rpx;
  line-height: 80rpx;
  font-size: 30rpx;
  margin-top: 30rpx;
}
.prompt-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #334155;
}
.prompt-subtext {
  font-size: 24rpx;
  color: #94a3b8;
  margin-top: 10rpx;
}
</style>
