<template>
  <view class="voice-call-container">
    <!-- 返回按钮 -->
    <view class="back-button" @click="handleBack">
      <text class="back-icon">←</text>
      <text class="back-text">返回</text>
    </view>

    <!-- 连接状态指示器 -->
    <view class="connection-status">
      <view class="status-indicator">
        <view :class="['status-dot', isConnected ? 'status-connected' : 'status-disconnected']"></view>
        <text>{{ isConnected ? "已连接" : "离线" }}</text>
      </view>
    </view>

    <!-- 聊天消息流 -->
    <scroll-view 
      class="chat-container" 
      scroll-y 
      :scroll-into-view="scrollIntoViewId"
      scroll-with-animation
      @scroll="onScroll"
      :lower-threshold="100"
    >
      <view id="scroll-top-pad"></view>
      <view class="chat-stream">
        <ChatMessage 
          v-for="(msg, index) in messages" 
          :key="index" 
          :id="'msg-' + index"
          :message="msg" 
          :disabled="isTyping" 
        />
      </view>
      <view style="height: 20px" id="bottom-anchor"></view>
    </scroll-view>

    <!-- 输入框 -->
    <view class="input-bar">
      <input
        id="quickInput"
        v-model="inputMessage"
        class="control-input"
        type="text"
        placeholder="输入消息，按Enter发送"
        confirm-type="send"
      />
      <button class="send-btn-inline" @click="handleSendMessage">
        <text class="send-icon-inline">↑</text>
      </button>
    </view>

    <!-- 底部控制栏 -->
    <view class="control-bar">
      <button class="control-btn" :class="{ recording: isRecording }" :disabled="!canRecord" @click="handleRecord">
        <text class="btn-icon">🎤</text>
        <text class="btn-text">{{ isRecording ? "录音中" : "录音" }}</text>
      </button>
    </view>

    <!-- 设置弹窗 -->
    <view v-if="showSettings" class="modal" @click="handleModalClick">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">设置</text>
          <button class="close-btn" @click="showSettings = false">×</button>
        </view>
        <view class="modal-body">
          <view class="input-group">
            <text class="label">OTA服务器地址:</text>
            <input v-model="otaUrl" class="input" placeholder="http://127.0.0.1:8002/xiaozhi/ota/" />
          </view>
          <view class="input-group">
            <text class="label">设备ID:</text>
            <input v-model="deviceId" class="input" placeholder="web_test_client" />
          </view>
          <view class="input-group">
            <text class="label">客户端ID:</text>
            <input v-model="clientId" class="input" placeholder="web_test_client" />
          </view>
          <view class="input-group">
            <text class="label">设备MAC:</text>
            <input v-model="deviceMac" class="input" placeholder="web_test_device" />
          </view>
          <view class="input-group">
            <text class="label">设备名称:</text>
            <input v-model="deviceName" class="input" placeholder="Web测试设备" />
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onUnmounted, onMounted, nextTick } from "vue";
import ChatMessage from "@/pages/student/ai-assistant/components/chatMessage.vue";

// 状态管理
const isConnected = ref(false);
const isRecording = ref(false);
const showSettings = ref(false);
const messages = ref([]);
const scrollIntoViewId = ref("");
const inputMessage = ref("");
const isTyping = ref(false);

// 滚动控制
const shouldAutoScroll = ref(true);
const isProgrammaticScroll = ref(false);

// 配置
const otaUrl = ref("http://192.168.5.254:8002/xiaozhi/ota/");
const deviceMac = ref("web_test_device");
const deviceName = ref("Web测试设备");
const deviceId = ref("F4:E7:72:BB:B3:93");
const clientId = ref("web_test_client");

// WebSocket和音频相关
let websocket = null;
let audioContext = null;
let mediaStream = null;
let audioProcessor = null;
let pcmDataBuffer = new Int16Array();
let audioQueue = []; // 音频数据队列
let isPlayingAudio = false;
let webAudioContext = null; // Web Audio API上下文
let nextPlayTime = 0; // 下一个音频块的播放时间
let opusDecoder = null; // Opus解码器

// 计算属性
const canRecord = computed(() => isConnected.value);

// 节流函数
const throttle = (func, delay) => {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func.apply(this, args);
    }
  };
};

// 滚动到底部
const scrollToBottom = throttle(() => {
  if (!shouldAutoScroll.value) return;

  nextTick(() => {
    isProgrammaticScroll.value = true;
    scrollIntoViewId.value = "";
    nextTick(() => {
      scrollIntoViewId.value = "bottom-anchor";
    });
  });
}, 450);

// 重置自动滚动
const resetAutoScroll = () => {
  shouldAutoScroll.value = true;
  isProgrammaticScroll.value = true;
};

// 监听滚动事件
const onScroll = (e) => {
  if (isProgrammaticScroll.value) {
    isProgrammaticScroll.value = false;
    return;
  }
  if (isTyping.value) {
    shouldAutoScroll.value = false;
  }
};

// 添加消息
const addMessage = (content, isUser = false) => {
  if (!content.trim()) {
    return;
  }
  const message = {
    sender: isUser ? "user" : "ai",
    text: content,
    html: content,
    timestamp: Date.now(),
    quickButtons: [],
    files: [],
  };

  messages.value.push(message);

  // 滚动到底部
  nextTick(() => {
    scrollToBottom();
  });
};

// 发送文本消息
let sendingMessage = false; // 防止重复发送
const handleSendMessage = () => {
  if (sendingMessage) {
    return;
  }
  const message = inputMessage.value.trim();
  if (!message) {
    return;
  }

  // 如果未连接，提示用户
  if (!isConnected.value) {
    addMessage("请先点击拨号按钮连接服务器", false);
    return;
  }

  try {
    sendingMessage = true;

    if (websocket && websocket.readyState === WebSocket.OPEN) {
      const listenMessage = {
        type: "listen",
        state: "detect",
        text: message,
      };
      websocket.send(JSON.stringify(listenMessage));
      // 显示用户消息
      addMessage(message, true);
    }

    // 清空输入框
    inputMessage.value = "";

    // 延迟重置发送状态
    setTimeout(() => {
      sendingMessage = false;
      console.log("发送状态已重置");
    }, 300);
  } catch (error) {
    addMessage("发送消息失败", false);
    sendingMessage = false;
  }
};

// 连接服务器
const connect = async () => {
  try {
    addMessage("正在连接服务器...", false);

    // 获取WebSocket地址
    const wsUrl = await getWebSocketUrl();
    if (!wsUrl) {
      throw new Error("无法获取WebSocket地址");
    }

    // 创建WebSocket连接
    websocket = new WebSocket(wsUrl);
    websocket.binaryType = "arraybuffer";

    websocket.onopen = async () => {
      isConnected.value = true;
      resetAutoScroll();
      addMessage("连接成功，开始聊天吧~😊", false);

      // 发送hello消息
      await sendHelloMessage();
    };

    websocket.onmessage = (event) => {
      handleWebSocketMessage(event);
    };

    websocket.onclose = () => {
      isConnected.value = false;
      addMessage("已断开连接", false);
      cleanup();
    };

    websocket.onerror = (error) => {
      addMessage("连接错误", false);
    };
  } catch (error) {
    addMessage(`连接失败: ${error.message}`, false);
  }
};

// 获取WebSocket地址
const getWebSocketUrl = async () => {
  try {
    // 发送OTA POST请求 - 使用原生uni.request因为需要自定义完整URL
    const res = await new Promise((resolve, reject) => {
      uni.request({
        url: otaUrl.value,
        method: "POST",
        header: {
          "Content-Type": "application/json",
          "Device-Id": deviceId.value,
          "Client-Id": clientId.value,
        },
        data: {
          version: 0,
          uuid: "",
          application: {
            name: "xiaozhi-web-test",
            version: "1.0.0",
            compile_time: "2025-04-16 10:00:00",
            idf_version: "4.4.3",
            elf_sha256: "1234567890abcdef1234567890abcdef1234567890abcdef",
          },
          ota: { label: "xiaozhi-web-test" },
          board: {
            type: deviceName.value,
            ssid: "xiaozhi-web-test",
            rssi: 0,
            channel: 0,
            ip: "192.168.1.1",
            mac: deviceMac.value,
          },
          flash_size: 0,
          minimum_free_heap_size: 0,
          mac_address: deviceMac.value,
          chip_model_name: "",
          chip_info: { model: 0, cores: 0, revision: 0, features: 0 },
          partition_table: [{ label: "", type: 0, subtype: 0, address: 0, size: 0 }],
        },
        success: (response) => {
          resolve(response);
        },
        fail: (error) => {
          console.error("OTA请求失败:", error);
          reject(error);
        },
      });
    });

    if (res && res.data && res.data.websocket) {
      const wsInfo = res.data.websocket;

      // 构建WebSocket URL
      let wsUrl = wsInfo.url;
      const urlObj = new URL(wsUrl);

      // 添加token参数
      if (wsInfo.token) {
        const token = wsInfo.token.startsWith("Bearer ") ? wsInfo.token : "Bearer " + wsInfo.token;
        urlObj.searchParams.append("authorization", token);
      }

      // 添加认证参数
      urlObj.searchParams.append("device-id", deviceId.value);
      urlObj.searchParams.append("client-id", clientId.value);

      return urlObj.toString();
    }

    throw new Error("无法获取WebSocket地址");
  } catch (error) {
    console.error("获取WebSocket地址失败:", error);
    addMessage(`OTA请求失败: ${error.errMsg || error.message}`, false);
    return null;
  }
};

// 发送hello消息
const sendHelloMessage = async () => {
  if (!websocket || websocket.readyState !== WebSocket.OPEN) return;

  const helloMessage = {
    type: "hello",
    device_id: deviceId.value,
    device_name: deviceName.value,
    device_mac: deviceMac.value,
    token: "",
    features: { mcp: true },
  };

  websocket.send(JSON.stringify(helloMessage));
};

// 处理WebSocket消息
const handleWebSocketMessage = (event) => {
  try {
    if (typeof event.data === "string") {
      const message = JSON.parse(event.data);
      handleTextMessage(message);
    } else {
      // 处理二进制音频数据
      handleBinaryMessage(event.data);
    }
  } catch (error) {
    // 忽略错误
  }
};

// 处理文本消息
const handleTextMessage = (message) => {
  if (message.type === "tts" || message === "llm") {
    addMessage(message.text, false);
  }
};

// 处理二进制消息（音频播放）
const handleBinaryMessage = async (data) => {
  try {
    // 如果是空数据，表示音频流结束
    if (data.byteLength === 0) {
      return;
    }

    // 将音频数据添加到队列
    audioQueue.push(new Uint8Array(data));

    // 如果当前没有在播放，开始播放
    if (!isPlayingAudio) {
      playAudioQueue();
    }
  } catch (error) {
    // 忽略错误
  }
};

// 等待Opus库加载
const waitForOpusLibrary = () => {
  return new Promise((resolve) => {
    const checkOpus = () => {
      // 检查Module是否存在
      if (typeof window.Module === "undefined") {
        setTimeout(checkOpus, 100);
        return;
      }

      // 检查Module.instance（libopus.js导出方式）
      if (typeof window.Module.instance !== "undefined") {
        const mod = window.Module.instance;
        if (typeof mod._opus_decoder_get_size === "function") {
          window.ModuleInstance = mod;
          resolve(true);
          return;
        }
      }

      // 检查全局Module函数
      if (typeof window.Module._opus_decoder_get_size === "function") {
        window.ModuleInstance = window.Module;
        resolve(true);
        return;
      }

      setTimeout(checkOpus, 100);
    };
    checkOpus();
  });
};

// 初始化Opus解码器
const initOpusDecoder = async () => {
  if (opusDecoder) return opusDecoder;

  try {
    // 等待Opus库加载
    await waitForOpusLibrary();

    const mod = window.ModuleInstance;

    if (!mod || typeof mod._opus_decoder_get_size !== "function") {
      addMessage("Opus库未正确加载", false);
      return null;
    }

    opusDecoder = {
      channels: 1,
      rate: 16000,
      frameSize: 960,
      module: mod,
      decoderPtr: null,

      init: function () {
        if (this.decoderPtr) return true;

        try {
          const decoderSize = this.module._opus_decoder_get_size(this.channels);
          this.decoderPtr = this.module._malloc(decoderSize);

          if (!this.decoderPtr) {
            return false;
          }

          const err = this.module._opus_decoder_init(this.decoderPtr, this.rate, this.channels);

          if (err < 0) {
            this.destroy();
            return false;
          }

          return true;
        } catch (error) {
          return false;
        }
      },

      decode: function (opusData) {
        if (!this.decoderPtr) {
          if (!this.init()) {
            return new Int16Array(0);
          }
        }

        try {
          const mod = this.module;
          const opusPtr = mod._malloc(opusData.length);
          mod.HEAPU8.set(opusData, opusPtr);

          const pcmPtr = mod._malloc(this.frameSize * 2);

          const decodedSamples = mod._opus_decode(this.decoderPtr, opusPtr, opusData.length, pcmPtr, this.frameSize, 0);

          if (decodedSamples < 0) {
            mod._free(opusPtr);
            mod._free(pcmPtr);
            return new Int16Array(0);
          }

          const decodedData = new Int16Array(decodedSamples);
          for (let i = 0; i < decodedSamples; i++) {
            decodedData[i] = mod.HEAP16[(pcmPtr >> 1) + i];
          }

          mod._free(opusPtr);
          mod._free(pcmPtr);

          return decodedData;
        } catch (error) {
          return new Int16Array(0);
        }
      },

      destroy: function () {
        if (this.decoderPtr) {
          this.module._free(this.decoderPtr);
          this.decoderPtr = null;
        }
      },
    };

    if (!opusDecoder.init()) {
      opusDecoder = null;
      return null;
    }

    return opusDecoder;
  } catch (error) {
    return null;
  }
};

// 初始化Web Audio Context
const initWebAudioContext = () => {
  if (!webAudioContext) {
    // @ts-ignore - webkitAudioContext for Safari compatibility
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    webAudioContext = new AudioContextClass({
      sampleRate: 16000,
    });
    nextPlayTime = webAudioContext.currentTime;
  }
  return webAudioContext;
};

// 将PCM数据转换为AudioBuffer
const pcmToAudioBuffer = (pcmData, sampleRate = 16000) => {
  const audioBuffer = webAudioContext.createBuffer(1, pcmData.length, sampleRate);
  const channelData = audioBuffer.getChannelData(0);

  // 将Int16转换为Float32 (-1.0 到 1.0)
  for (let i = 0; i < pcmData.length; i++) {
    channelData[i] = pcmData[i] / 32768.0;
  }

  return audioBuffer;
};

// 播放音频队列
const playAudioQueue = async () => {
  if (isPlayingAudio || audioQueue.length === 0) return;

  isPlayingAudio = true;

  try {
    // 初始化Web Audio Context
    const ctx = initWebAudioContext();

    // 恢复音频上下文（如果被暂停）
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    // 初始化Opus解码器（异步）
    if (!opusDecoder) {
      opusDecoder = await initOpusDecoder();
      if (!opusDecoder) {
        isPlayingAudio = false;
        return;
      }
    }

    // 处理队列中的所有音频数据
    while (audioQueue.length > 0) {
      const opusData = audioQueue.shift();

      try {
        // 使用Opus解码器解码数据
        const pcmData = opusDecoder.decode(opusData);

        if (pcmData.length === 0) {
          continue;
        }

        // 创建AudioBuffer
        const audioBuffer = pcmToAudioBuffer(pcmData);

        // 创建音频源
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);

        // 计算播放时间
        const currentTime = ctx.currentTime;
        const playTime = Math.max(currentTime, nextPlayTime);

        // 开始播放
        source.start(playTime);

        // 更新下一个播放时间
        nextPlayTime = playTime + audioBuffer.duration;
      } catch (error) {
        // 播放失败，跳过这个片段
      }
    }

    // 等待所有音频播放完成
    const waitTime = Math.max(0, (nextPlayTime - ctx.currentTime) * 1000);
    setTimeout(() => {
      isPlayingAudio = false;

      // 如果有新的音频数据，继续播放
      if (audioQueue.length > 0) {
        playAudioQueue();
      }
    }, waitTime);
  } catch (error) {
    isPlayingAudio = false;
  }
};

// 断开连接
const disconnect = () => {
  if (websocket) {
    websocket.close();
    websocket = null;
  }
  cleanup();
};

// 录音控制
const handleRecord = async () => {
  if (isRecording.value) {
    stopRecording();
  } else {
    await startRecording();
  }
};

// 开始录音
const startRecording = async () => {
  try {
    // 获取麦克风权限
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 16000,
        channelCount: 1,
      },
    });

    // 创建音频上下文
    // @ts-ignore - webkitAudioContext for Safari compatibility
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextClass({ sampleRate: 16000 });

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    // 创建音频处理器
    const source = audioContext.createMediaStreamSource(mediaStream);

    // 使用ScriptProcessor处理音频
    audioProcessor = audioContext.createScriptProcessor(4096, 1, 1);

    audioProcessor.onaudioprocess = (event) => {
      if (!isRecording.value) return;

      const input = event.inputBuffer.getChannelData(0);
      const buffer = new Int16Array(input.length);

      for (let i = 0; i < input.length; i++) {
        buffer[i] = Math.max(-32768, Math.min(32767, Math.floor(input[i] * 32767)));
      }

      processPCMBuffer(buffer);
    };

    source.connect(audioProcessor);
    audioProcessor.connect(audioContext.destination);

    // 设置录音状态为true
    isRecording.value = true;
    pcmDataBuffer = new Int16Array();
  } catch (error) {
    // 出错时确保状态为false
    isRecording.value = false;

    // 清理可能已创建的资源
    if (audioProcessor) {
      try {
        audioProcessor.disconnect();
      } catch (e) {}
      audioProcessor = null;
    }

    if (mediaStream) {
      try {
        mediaStream.getTracks().forEach((track) => track.stop());
      } catch (e) {}
      mediaStream = null;
    }

    if (audioContext) {
      try {
        audioContext.close();
      } catch (e) {}
      audioContext = null;
    }

    addMessage("录音启动失败，请检查麦克风权限", false);
  }
};

// 处理PCM缓冲
const processPCMBuffer = (buffer) => {
  if (!isRecording.value) return;

  // 合并缓冲区
  const newBuffer = new Int16Array(pcmDataBuffer.length + buffer.length);
  newBuffer.set(pcmDataBuffer);
  newBuffer.set(buffer, pcmDataBuffer.length);
  pcmDataBuffer = newBuffer;

  // 每960个采样点发送一次
  const samplesPerFrame = 960;
  while (pcmDataBuffer.length >= samplesPerFrame) {
    const frameData = pcmDataBuffer.slice(0, samplesPerFrame);
    pcmDataBuffer = pcmDataBuffer.slice(samplesPerFrame);

    // 直接发送PCM数据（简化版，实际应该编码为Opus）
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.send(frameData.buffer);
    }
  }
};

// 停止录音
const stopRecording = () => {
  // 立即设置录音状态为false
  isRecording.value = false;

  // 断开音频处理器
  if (audioProcessor) {
    try {
      audioProcessor.disconnect();
    } catch (e) {
      // 忽略断开连接错误
    }
    audioProcessor = null;
  }

  // 停止媒体流
  if (mediaStream) {
    try {
      mediaStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      // 忽略停止轨道错误
    }
    mediaStream = null;
  }

  // 关闭音频上下文
  if (audioContext) {
    try {
      audioContext.close();
    } catch (e) {
      // 忽略关闭错误
    }
    audioContext = null;
  }

  // 发送结束信号
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    try {
      const emptyFrame = new Uint8Array(0);
      websocket.send(emptyFrame);
    } catch (e) {
      // 忽略发送错误
    }
  }

  // 清空PCM缓冲区
  pcmDataBuffer = new Int16Array();
};

// 清理资源
const cleanup = () => {
  if (isRecording.value) {
    stopRecording();
  }

  // audioContext 已经在 stopRecording 中关闭，这里不需要再关闭

  if (webAudioContext) {
    try {
      webAudioContext.close();
    } catch (e) {
      // 忽略关闭错误
    }
    webAudioContext = null;
  }

  if (opusDecoder) {
    try {
      opusDecoder.destroy();
    } catch (e) {
      // 忽略销毁错误
    }
    opusDecoder = null;
  }

  audioQueue = [];
  isPlayingAudio = false;
  nextPlayTime = 0;
};

// 模态框点击处理
const handleModalClick = () => {
  showSettings.value = false;
};

// 返回按钮处理
const handleBack = () => {
  // 如果正在连接或录音，先断开
  if (isConnected.value || isRecording.value) {
    disconnect();
  }

  // 返回上一页
  uni.navigateBack({
    delta: 1,
  });
};

// 组件挂载时自动连接
onMounted(async () => {
  // 自动连接服务器
  if (otaUrl.value.trim()) {
    await connect();
  } else {
    addMessage("请在设置中配置OTA服务器地址", false);
  }
  
  // 初始化滚动
  resetAutoScroll();
  nextTick(() => {
    scrollToBottom();
  });
});

// 组件卸载时清理
onUnmounted(() => {
  disconnect();
  cleanup();
});
</script>

<style lang="scss" scoped src="./style.scss"></style>
