<template>
  <view class="input-area" :style="{ bottom: inputBottom + 'px' }">
    <!-- 文本输入模式 -->
    <view class="input-content" v-if="inputMode === 'text'">
      <view class="text-input-area">
        <!-- 语音按钮 -->
        <view 
          class="voice-button" 
          :class="{ disabled: disabled }"
          @tap="switchToVoiceMode"
        >
          <uni-icons type="mic-filled" size="24" color="#1a5f9e"></uni-icons>
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

    <!-- 语音录音模式 -->
    <view class="input-content" v-if="inputMode === 'voice'">
      <view class="voice-input-area">
        <!-- 返回文本按钮 -->
        <view 
          class="back-to-text-button" 
          :class="{ disabled: isRecording || disabled }"
          @tap="switchToTextMode"
        >
          <uni-icons type="font" size="24" color="#1a5f9e"></uni-icons>
        </view>
        
        <!-- 拨号/挂断按钮 -->
        <view 
          class="record-button" 
          :class="{ recording: isRecording, disabled: !isRecording && disabled }"
          @tap="toggleRecording"
        >
          <view class="record-button-inner">
            <uni-icons 
              :type="isRecording ? 'phone-filled' : 'mic-filled'" 
              size="32" 
              :color="isRecording ? '#fff' : '#1a5f9e'"
            ></uni-icons>
            <text class="record-text">{{ recordButtonText }}</text>
          </view>
        </view>
        
        <!-- 录音控制按钮（暂停/恢复） -->
        <view 
          class="record-control-button"
          :class="{ disabled: !isDialed, paused: isDialed && !isSendingAudio }"
          @tap="toggleRecordingControl"
        >
          <uni-icons 
            :type="isSendingAudio ? 'mic-filled' : 'mic'" 
            size="24" 
            :color="!isDialed ? '#cbd5e1' : (isSendingAudio ? '#1a5f9e' : '#ef4444')"
          ></uni-icons>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from "vue";

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
  "record-start",
  "record-end",
  "record-pause",
  "record-resume",
]);

// Local state
const localInput = ref("");
const inputBottom = ref(0);
const areaHeight = ref(0);
const inputMode = ref("text"); // 'text' or 'voice'
const isRecording = ref(false); // 是否正在录音（发送音频数据）
const isDialed = ref(false); // 是否已拨号（建立连接）
const isSendingAudio = ref(false); // 是否正在发送音频（用于控制右侧按钮状态）
const recordingDuration = ref(0); // 录音时长（秒）

let uniKeyboardListener = null;
let visualViewportHandler = null;
let resizeHandler = null;
let recordingTimer = null; // 录音计时器

// 计算录音按钮文本
const recordButtonText = computed(() => {
  if (isRecording.value) {
    const minutes = Math.floor(recordingDuration.value / 60);
    const seconds = recordingDuration.value % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    return `点击挂断 ${timeStr}`;
  }
  return '点击拨号';
});

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

const switchToVoiceMode = () => {
  if (props.disabled) {
    return;
  }
  inputMode.value = "voice";
};

const switchToTextMode = () => {
  if (isRecording.value || props.disabled) {
    return;
  }
  inputMode.value = "text";
};

const openVoiceCall = () => {
  emit("open-voice-call");
};

// 切换录音状态（拨号/挂断）
const toggleRecording = () => {
  // 如果已拨号，执行挂断
  if (isDialed.value) {
    stopRecording();
    return;
  }
  
  // 如果未拨号，检查是否被禁用
  if (props.disabled) {
    return;
  }
  
  // 开始拨号并录音
  isDialed.value = true;
  isRecording.value = true;
  isSendingAudio.value = true;
  startRecording();
};

// 切换录音控制（暂停/恢复录音）
const toggleRecordingControl = () => {
  // 如果未拨号，不允许操作
  if (!isDialed.value) {
    return;
  }
  
  if (isSendingAudio.value) {
    // 当前正在发送音频，暂停
    pauseRecording();
  } else {
    // 当前已暂停，恢复
    resumeRecording();
  }
};

const pauseRecording = () => {
  isSendingAudio.value = false;
  
  // 显示提示
  uni.showToast({
    title: "已暂停录音",
    icon: "error",
    duration: 1500,
  });
  
  emit("record-pause");
};

const resumeRecording = () => {
  isSendingAudio.value = true;
  
  // 显示提示
  uni.showToast({
    title: "已恢复录音",
    icon: "success",
    duration: 1500,
  });
  
  emit("record-resume");
};

const startRecording = () => {
  isRecording.value = true;
  recordingDuration.value = 0;
  
  // 启动计时器
  recordingTimer = setInterval(() => {
    recordingDuration.value++;
  }, 1000);
  
  emit("record-start");
};

const stopRecording = () => {
  isRecording.value = false;
  isDialed.value = false; // 重置拨号状态
  isSendingAudio.value = false; // 重置发送状态
  
  // 停止计时器
  if (recordingTimer) {
    clearInterval(recordingTimer);
    recordingTimer = null;
  }
  
  // 重置录音时长
  recordingDuration.value = 0;
  
  emit("record-end");
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
  // 清理计时器
  if (recordingTimer) {
    clearInterval(recordingTimer);
    recordingTimer = null;
  }
  
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

/* 语音按钮 */
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

.voice-button:active:not(.disabled) {
  background: #e0f0ff;
  transform: scale(0.95);
}

.voice-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 语音录音模式 */
.voice-input-area {
  display: flex;
  align-items: center;
  gap: 20rpx;
  justify-content: space-between;
}

.back-to-text-button {
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

.back-to-text-button:active:not(.disabled) {
  background: #e0f0ff;
  transform: scale(0.95);
}

.back-to-text-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.record-button {
  flex: 1;
  height: 80rpx;
  background: #f0f7ff;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  cursor: pointer;
}

.record-button:active:not(.disabled) {
  transform: scale(0.98);
}

.record-button.recording {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  animation: pulse 2s infinite;
  cursor: pointer;
}

.record-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  50% {
    box-shadow: 0 0 0 20rpx rgba(239, 68, 68, 0);
  }
}

.record-button-inner {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.record-text {
  font-size: 30rpx;
  color: #1a5f9e;
  font-weight: 500;
}

.record-button.recording .record-text {
  color: #fff;
}

.placeholder-button {
  width: 80rpx;
  height: 80rpx;
  flex-shrink: 0;
}

/* 录音控制按钮 */
.record-control-button {
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

.record-control-button:active:not(.disabled) {
  background: #e0f0ff;
  transform: scale(0.95);
}

.record-control-button.disabled {
  opacity: 0.3;
  cursor: not-allowed;
  background: #f8fafc;
}

.record-control-button.paused {
  background: #fee2e2;
  animation: blink 1.5s infinite;
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
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


</style>
