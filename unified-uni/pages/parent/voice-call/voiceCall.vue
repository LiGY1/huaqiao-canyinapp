<template>
  <view class="voice-call-container">
    <view class="dialing-overlay" v-if="isDialing">
      <view class="dialing-content">
        <view class="dialing-rings">
          <view class="ring ring-1"></view>
          <view class="ring ring-2"></view>
          <view class="ring ring-3"></view>
          <view class="ring ring-4"></view>
          <view class="dialing-icon">
            <uni-icons type="phone-filled" size="40" color="#3b82f6"></uni-icons>
          </view>
        </view>
        <view class="dialing-text">
          <text class="h2">正在呼叫 AI 智膳伙伴</text>
          <view class="dialing-dots">
            <view class="dot"></view><view class="dot"></view><view class="dot"></view>
          </view>
        </view>
        <view class="dialing-progress-box">
          <view class="progress-bar" :style="{ width: dialingProgress + '%' }"></view>
        </view>
      </view>
    </view>

    <view class="status-bar">
      <view class="microphone-warning" v-if="showMicrophoneWarning">
        <uni-icons type="warn-filled" size="16" color="#ef4444"></uni-icons>
        <text>当前设备不支持麦克风</text>
      </view>
      <view class="status-text" v-else>
        <text v-if="errorMessage" class="error-text">{{ errorMessage }}</text>
        <text v-else-if="!isVoiceConnected && !isConnecting">准备通话</text>
        <text v-else-if="isConnecting">正在连接...</text>
        <text v-else-if="isVoiceConnected && !isRecording">点击开始对话</text>
        <text v-else-if="isRecording">正在聆听...</text>
      </view>
      <view class="recording-time" v-if="isRecording">{{ recordingTime.toFixed(1) }}s</view>
    </view>

    <view class="siri-orb-container" @click="toggleRecording">
      <view class="siri-orb" :class="{ 'active': isRecording, 'connected': isVoiceConnected }">
        <view class="wave wave-1"></view>
        <view class="wave wave-2"></view>
        <view class="wave wave-3"></view>
        <view class="wave wave-4"></view>
        <view class="wave wave-5"></view>
        <view class="orb-core">
          <view class="orb-inner"></view>
          <view class="orb-glow"></view>
        </view>
      </view>

      <view class="conversation-display">
        <view class="user-text" v-if="displayMessage && displayMessage.sender === 'user'">
          <text class="text-label">{{ parentName }}：</text>
          <text class="text-content">{{ displayMessage.text }}</text>
        </view>
        <view class="ai-text" v-if="displayMessage && displayMessage.sender === 'ai'">
          <text class="text-label">AI 智膳伙伴：</text>
          <text class="text-content">{{ displayMessage.text }}</text>
        </view>
        <view class="hint-text" v-if="!displayMessage && isVoiceConnected && !isRecording">
          已为您分配专属AI智膳伙伴
        </view>
      </view>
    </view>

    <view class="controls">
      <view class="hang-up-button" @click="hangUp">
        <uni-icons type="phone-filled" size="30" color="#fff"></uni-icons>
        <text class="btn-label">挂断</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import VoiceConnection from '@/utils/voice/voiceConnect';
import { checkOpusLoaded } from '@/utils/voice/opus';
import storage from '@/utils/storage';
import { aiAssistantApi } from '@/api/parent';

const isDialing = ref(true);
const dialingProgress = ref(0);
const isVoiceConnected = ref(false);
const isConnecting = ref(false);
const isRecording = ref(false);
const recordingTime = ref(0);
const lastMessage = ref(null);
const currentAIText = ref('');
const errorMessage = ref(null);
const showMicrophoneWarning = ref(false);
const voiceConnection = ref(null);
const conversationId = ref(`voice-${Date.now()}`);

const userInfo = storage.getUserInfo();
const parentName = computed(() => userInfo?.name || '家长');
const displayMessage = computed(() => lastMessage.value);

let dialingInterval = null;
let recordingTimer = null;

const startDialing = () => {
  dialingInterval = setInterval(() => {
    dialingProgress.value += 2;
    if (dialingProgress.value >= 100) clearInterval(dialingInterval);
  }, 40);
  setTimeout(() => { isDialing.value = false; }, 2500);
};

const initVoice = async () => {
  try {
    const isOpusOk = checkOpusLoaded();
    if (!isOpusOk) {
       errorMessage.value = '音频插件加载中...';
       return;
    }

    let mac = storage.get('voice_mac');
    if (!mac) {
      mac = VoiceConnection.generateRandomMac();
      storage.set('voice_mac', mac);
    }

    voiceConnection.value = new VoiceConnection();
    voiceConnection.value.onStt((text) => {
      lastMessage.value = { sender: 'user', text };
      currentAIText.value = '';
    });

    voiceConnection.value.onMessage((text) => {
      currentAIText.value += text;
      lastMessage.value = { sender: 'ai', text: currentAIText.value };
    });

    voiceConnection.value.onConnected(() => {
      isVoiceConnected.value = true;
      isConnecting.value = false;
    });

    voiceConnection.value.onDisconnected(() => {
      isVoiceConnected.value = false;
      isConnecting.value = false;
    });

    isConnecting.value = true;
    await voiceConnection.value.connect('http://124.223.202.156:8003/xiaozhi/ota/', {
      deviceMac: mac,
      deviceId: mac,
      deviceName: '家长端语音助手',
      clientId: 'parent_portal',
      token: 'your-token1'
    });
  } catch (e) {
    errorMessage.value = '连接失败';
    isConnecting.value = false;
  }
};

const toggleRecording = async () => {
  if (!isVoiceConnected.value) return;
  if (isRecording.value) {
    await voiceConnection.value.stopRecording();
    isRecording.value = false;
    clearInterval(recordingTimer);
  } else {
    try {
      const ok = await voiceConnection.value.startRecording();
      if (ok) {
        isRecording.value = true;
        recordingTime.value = 0;
        recordingTimer = setInterval(() => { recordingTime.value += 0.1; }, 100);
      }
    } catch (e) {
      errorMessage.value = '无法启动录音';
    }
  }
};

const hangUp = () => {
  if (voiceConnection.value) voiceConnection.value.disconnect();
  uni.navigateBack();
};

onMounted(() => {
  startDialing();
  initVoice();
});

onUnmounted(() => {
  if (voiceConnection.value) voiceConnection.value.disconnect();
  clearInterval(dialingInterval);
  clearInterval(recordingTimer);
});
</script>

<style lang="scss" scoped>
.voice-call-container {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialing-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: #fff;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialing-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40rpx;
}

.dialing-rings {
  position: relative;
  width: 240rpx;
  height: 240rpx;
}

.dialing-icon {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
}

.ring {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  border: 2rpx solid #3b82f6;
  border-radius: 50%;
  opacity: 0;
  animation: ring-pulse 4s infinite;
}

.ring-2 { animation-delay: 1s; }
.ring-3 { animation-delay: 2s; }
.ring-4 { animation-delay: 3s; }

@keyframes ring-pulse {
  0% { transform: scale(1); opacity: 0.5; }
  100% { transform: scale(2.5); opacity: 0; }
}

.dialing-text {
  text-align: center;
}

.h2 { font-size: 32rpx; font-weight: bold; color: #1e293b; }

.dialing-dots {
  display: flex;
  gap: 8rpx;
  justify-content: center;
  margin-top: 20rpx;
}

.dot {
  width: 12rpx; height: 12rpx;
  background: #3b82f6;
  border-radius: 50%;
  animation: dot-pulse 1.5s infinite;
}

.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes dot-pulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.5); opacity: 1; }
}

.dialing-progress-box {
  width: 300rpx;
  height: 8rpx;
  background: #f1f5f9;
  border-radius: 4rpx;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: #3b82f6;
  border-radius: 4rpx;
}

.status-bar {
  position: absolute;
  top: 100rpx;
  text-align: center;
}

.status-text { font-size: 28rpx; color: #64748b; }
.error-text { color: #ef4444; }
.recording-time { font-size: 40rpx; font-weight: bold; color: #3b82f6; margin-top: 20rpx; }

.siri-orb-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 60rpx;
}

.siri-orb {
  width: 300rpx; height: 300rpx;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.orb-core {
  width: 120rpx; height: 120rpx;
  background: #3b82f6;
  border-radius: 50%;
  position: relative;
  z-index: 5;
}

.orb-inner {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: radial-gradient(circle at 30% 30%, #60a5fa, #3b82f6);
  border-radius: 50%;
  box-shadow: 0 0 30rpx rgba(59, 130, 246, 0.5);
}

.wave {
  position: absolute;
  width: 100%; height: 100%;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.1);
  transform: scale(1);
}

.active .wave {
  animation: wave-pulse 2s infinite ease-in-out;
}

.wave-2 { animation-delay: 0.4s; }
.wave-3 { animation-delay: 0.8s; }
.wave-4 { animation-delay: 1.2s; }
.wave-5 { animation-delay: 1.6s; }

@keyframes wave-pulse {
  0% { transform: scale(1); opacity: 0.5; }
  100% { transform: scale(1.8); opacity: 0; }
}

.conversation-display {
  width: 600rpx;
  padding: 40rpx;
  background: rgba(255,255,255,0.8);
  border-radius: 32rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.05);
  min-height: 200rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.user-text, .ai-text {
  margin-bottom: 20rpx;
}

.text-label { font-size: 24rpx; color: #94a3b8; font-weight: bold; }
.text-content { font-size: 32rpx; color: #1e293b; line-height: 1.5; }

.hint-text {
  font-size: 28rpx;
  color: #94a3b8;
  text-align: center;
  line-height: 1.8;
}

.controls {
  position: absolute;
  bottom: 120rpx;
}

.hang-up-button {
  width: 120rpx; height: 120rpx;
  background: #ef4444;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(239, 68, 68, 0.4);
}

.btn-label { font-size: 20rpx; color: #fff; margin-top: 4rpx; }
</style>
