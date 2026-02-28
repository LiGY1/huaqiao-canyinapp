<template>
  <Layout>
    <view class="container">
      <view class="chat-container">
        <!-- 聊天记录区域 -->
        <scroll-view
          class="conversation-area"
          :style="{ paddingBottom: bottomPadding + 'px' }"
          scroll-y="true"
          :scroll-into-view="scrollIntoViewId"
          scroll-with-animation="true"
          @click="closeKeyboard"
          @scroll="onScroll"
          :lower-threshold="100"
        >
          <view id="scroll-top-pad"></view>

          <ChatMessage
            v-for="(message, index) in messages"
            :key="index"
            :id="'msg-' + index"
            :message="message"
            :disabled="isTyping"
            @quick-button-click="sendQuickMessage"
            @preview-image="previewImage"
          />

          <!-- 输入中状态 -->
          <TypingIndicator v-if="isTyping && !isVoiceThinking" id="typing-indicator" />

          <!-- 语音AI思考中状态 -->
          <view v-if="isVoiceThinking && !isTyping" class="voice-thinking" id="voice-thinking">
            <view class="thinking-bubble">
              <view class="thinking-dots">
                <view class="dot"></view>
                <view class="dot"></view>
                <view class="dot"></view>
              </view>
              <text class="thinking-text">AI思考中...</text>
            </view>
          </view>

          <view style="height: 20px" id="bottom-anchor"></view>
        </scroll-view>

        <!-- 清除历史记录按钮 -->
        <view class="clear-btn" @click="showClearConfirm">
          <uni-icons type="trash" size="24" color="#909399"></uni-icons>
        </view>

        <!-- 底部输入区域 -->
        <InputArea
          :active-tab="activeTab"
          :disabled="isTyping || isVoiceThinking || isRecording"
          @send-message="handleSendMessage"
          @switch-tab="switchTab"
          @open-voice-call="openVoiceCall"
          @input-focus="onInputFocus"
          @input-blur="onInputBlur"
          @keyboard-height-change="onKeyboardHeightChange"
          @record-start="handleRecordStart"
          @record-end="handleRecordEnd"
          @record-pause="handleRecordPause"
          @record-resume="handleRecordResume"
        />
      </view>
    </view>
    <!-- 逻辑层与视图层通信 -->
    <view :prop="trigger" :change:prop="renderScript.startStream" style="display: none"></view>
  </Layout>
</template>

<script>
import Layout from "@/components/layout.vue";
import ChatMessage from "./components/chatMessage.vue";
import InputArea from "./components/inputArea.vue";
import TypingIndicator from "./components/typingIndicator.vue";
import storage from "@/utils/storage";
import { throttle } from "@/utils/tool";
import { saveChatHistory, getChatHistory, clearAllChatHistory, sendMessage } from "@/api/student/aiAssistant";
import { BASE_URL } from "@/utils/request.js";

const otaUrl = "http://192.168.5.254:8002/xiaozhi/ota/";
const deviceId = "F4:E7:72:BB:B3:93";
const clientId = "web_ai_assistant";
const deviceMac = "web_ai_assistant";
const deviceName = "AI助手";

const completionEvents = new Set([
  "message_end",
  "workflow_finished",
  "workflow_completed",
  "finished",
  "completed",
  "end",
]);

const handleStream = async (config, ownerInstance) => {
  try {
    const response = await fetch(`${config.BASE_URL}/student/ai-chat/stream`, {
      // 1. -------------------
      method: "POST", // 发送post请求将
      headers: config.headers, // 配置请求头
      body: JSON.stringify(config.body), // 配置请求体
      // ----------------------
    });

    // 状态检查
    if (!response.ok) {
      console.error("HTTP Error:", response.status, response.statusText);
      return;
    }

    // 2. 获取读取器,初始化文本解码器-------------------
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    // -----------------------------------------------
    // 循环读取数据流
    while (true) {
      // 3. 每次循环从流中读取数据-------------------
      const { done, value } = await reader.read();
      // ------------------------------------------

      // 检查流是否结束
      if (done) {
        break;
      }

      // 4. 解码数据-------------------
      const text = decoder.decode(value, {
        stream: true,
      });
      // -----------------------------

      // 5. 更新消息-------------------
      ownerInstance.callMethod("updateMsg", text);
      // ------------------------------
    }
  } catch (e) {
    // 捕获网络错误 (如断网、DNS 解析失败等)
    console.error("Stream Request Failed:", e);
  }
};

export default {
  components: {
    Layout,
    ChatMessage,
    InputArea,
    TypingIndicator,
  },
  data() {
    return {
      // 聊天数据
      messages: [],
      conversationId: "",
      isTyping: false,

      // 滚动控制
      scrollIntoViewId: "",
      shouldAutoScroll: true,
      isProgrammaticScroll: false,
      bottomPadding: 140,

      // UI 状态
      activeTab: "text",

      // 录音相关
      isRecording: false,
      recognizedText: "", // 识别的文本
      voiceWebSocket: null, // 语音AI的WebSocket连接
      isVoiceConnected: false, // 语音AI连接状态
      isVoiceThinking: false, // 语音AI思考中状态

      // 音频录制相关（本地录音+服务器识别）
      mediaStream: null,
      audioContext: null,
      audioProcessor: null,
      audioProcessorType: null,
      pcmDataBuffer: new Int16Array(),
      opusEncoder: null, // Opus编码器

      // 音频播放相关
      audioQueue: [],
      isPlayingAudio: false,
      webAudioContext: null,
      nextPlayTime: 0,
      opusDecoder: null,

      // 流式响应临时变量
      currentUserMessage: "",
      currentUserTimestamp: null,
      currentAIResponseRaw: "",
      currentAIResponse: "",
      currentAIHtml: "",
      currentAIFiles: [],
      streamCompleted: false,

      trigger: {
        sign: 0,
        BASE_URL,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storage.getToken()}`,
        },
        handleStream,
      },
      bufferText: "",
      isFlushing: false,
    };
  },
  methods: {
    updateMsg(text) {
      // 2.-----------------------
      // 拼接新数据
      this.bufferText += text;
      // 节流操作
      if (this.isFlushing) {
        return;
      }
      // 打开节流开关
      this.isFlushing = true;
      // ------------------------

      setTimeout(() => {
        const lines = this.bufferText.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.substring(6).trim();

            try {
              const jsonData = JSON.parse(jsonStr);

              const rawEvent = (jsonData.event || "").toString();
              const event = rawEvent.trim().toLowerCase();

              if (event === "error" || jsonData.type === "error") {
                this.handleStreamError(new Error(jsonData.message || "Unknown stream error"));
                return;
              }

              if (jsonData.answer || (jsonData.files && jsonData.files.length > 0)) {
                this.handleStreamData(jsonData);
              }

              // 结束状态判断
              if (completionEvents.has(event) || jsonData.type === "final" || jsonData.status === "finished") {
                this.handleStreamComplete();
              }
            } catch (e) {
              console.error(e);
            }
          }
        }
        this.isFlushing = false;
        this.bufferText = "";
      }, 250);
    },

    // --- 滚动控制逻辑 ---
    scrollToBottom: throttle(function () {
      if (!this.shouldAutoScroll) return;

      this.$nextTick(() => {
        this.isProgrammaticScroll = true;
        this.scrollIntoViewId = "";
        this.$nextTick(() => {
          this.scrollIntoViewId = "bottom-anchor";
        });
      });
    }, 450),

    resetAutoScroll() {
      this.shouldAutoScroll = true;
      this.isProgrammaticScroll = true;
    },

    onScroll(e) {
      if (this.isProgrammaticScroll) {
        this.isProgrammaticScroll = false;
        return;
      }
      if (this.isTyping) {
        this.shouldAutoScroll = false;
      }
    },

    openVoiceCall() {
      uni.navigateTo({
        url: "/pages/student/voice-call/voiceCall",
      });
    },

    switchTab(tab) {
      if (tab === "voice") {
        this.openVoiceCall();
        return;
      }
      this.activeTab = tab;
    },

    onInputFocus() {
      this.scrollToBottom();
    },

    onInputBlur() {
      // 处理输入框失焦事件
    },

    closeKeyboard() {
      uni.hideKeyboard();
    },

    onKeyboardHeightChange(totalOffset) {
      this.bottomPadding = totalOffset || 0;
      if (totalOffset && totalOffset > 0) {
        this.$nextTick(() => this.scrollToBottom());
      }
    },

    previewImage(url) {
      uni.previewImage({
        urls: [url],
        current: url,
      });
    },

    async loadHistory() {
      try {
        const response = await getChatHistory({
          limit: 50,
          offset: 0,
        });
        const chatHistory = response.data.chatHistory || [];
        if (chatHistory.length === 0) {
          return;
        }

        chatHistory.forEach((chat) => {
          if (chat.userMessage) {
            this.messages.push({
              sender: "user",
              text: chat.userMessage,
              timestamp: new Date(chat.timestamp).getTime(),
            });
          }
          if (chat.aiMessage) {
            this.messages.push({
              sender: "ai",
              text: chat.aiMessage,
              html: chat.aiMessage,
              timestamp: new Date(chat.timestamp).getTime(),
              files: chat.files || [],
              quickButtons: [],
            });
          }
          if (chat.conversationId) {
            this.conversationId = chat.conversationId;
          }
        });
      } catch (error) {
        uni.showToast({
          title: "加载历史失败",
          icon: "none",
        });
      }
    },

    async saveChatToDatabase() {
      if (!this.currentUserMessage) return;

      const chatData = {
        conversationId: this.conversationId || "",
        sender: "ai",
        userMessage: this.currentUserMessage,
        aiMessage: this.currentAIResponse || "",
        timestamp: this.currentUserTimestamp,
        files: this.currentAIFiles,
        metadata: {
          userType: "学生",
        },
      };

      try {
        await saveChatHistory(chatData);
      } catch (e) {
        console.error(e);
      }
    },

    async clearAllChatRecords() {
      uni.showLoading({
        title: "清理中",
      });
      try {
        await clearAllChatHistory();
        uni.hideLoading();
        uni.showToast({
          title: "已清空",
        });
        // 重置逻辑：保留第一条欢迎语
        if (this.messages.length > 0) {
          this.messages = [this.messages[0]];
        }
      } catch (e) {
        uni.hideLoading();
        uni.showToast({
          title: "失败",
          icon: "none",
        });
      }
    },

    showClearConfirm() {
      uni.showModal({
        title: "清空聊天记录",
        content: "确定要清空所有聊天记录吗？此操作不可恢复。",
        confirmColor: "#f56c6c",
        success: (res) => {
          if (res.confirm) {
            this.clearAllChatRecords();
          }
        },
      });
    },

    updateCurrentAIResponse() {
      const lastMessageIndex = this.messages.length - 1;
      const lastMessage = this.messages[lastMessageIndex];

      try {
        if (lastMessageIndex >= 0 && lastMessage.sender === "ai") {
          lastMessage.text = this.currentAIResponse;
          lastMessage.html = this.currentAIHtml;
          lastMessage.files = this.currentAIFiles;
        } else {
          const aiMessage = {
            sender: "ai",
            text: this.currentAIResponse,
            html: this.currentAIHtml,
            timestamp: Date.now(),
            quickButtons: [],
            files: this.currentAIFiles,
          };
          this.messages.push(aiMessage);
        }
      } catch (error) {
        console.error("Error updating AI response:", error);
      }
      this.scrollToBottom();
    },

    addQuickButtonsToLastAIResponse() {
      const lastMessageIndex = this.messages.length - 1;
      if (lastMessageIndex >= 0 && this.messages[lastMessageIndex].sender === "ai") {
        let quickButtons = [
          {
            text: "我想健康增脂",
          },
          {
            text: "我想健康减肥",
          },
          {
            text: "我想均衡饮食",
          },
        ];
        this.messages[lastMessageIndex].quickButtons = quickButtons;
      }
    },

    async handleStreamComplete() {
      if (this.streamCompleted) return;
      this.streamCompleted = true;
      this.isTyping = false;

      this.addQuickButtonsToLastAIResponse();
      await this.saveChatToDatabase();
      this.scrollToBottom();
    },

    handleStreamError(error) {
      this.isTyping = false;
      const errorMessage = {
        sender: "ai",
        text: "出错了，请稍后再试。",
        html: '<div style="color:red">出错了，请稍后再试。</div>',
        timestamp: Date.now(),
        quickButtons: [
          {
            text: "重新发送",
          },
        ],
      };
      this.messages.push(errorMessage);
      this.scrollToBottom();
    },

    handleStreamData(data) {
      if (data.answer) {
        let answerText = data.answer;
        if (typeof answerText === "string") {
          answerText = answerText.replace(/\\n/g, "\n");
        }

        this.currentAIResponseRaw += answerText;
        let textContent = this.currentAIResponseRaw;

        this.currentAIResponse = textContent;
        this.currentAIHtml = textContent;
        this.updateCurrentAIResponse();
      }

      if (data.files && data.files.length > 0) {
        const imageFiles = data.files.filter((file) => file.type === "image");
        if (imageFiles.length > 0) {
          this.currentAIFiles = imageFiles.map((file) => ({
            filename: file.filename || "图片",
            url: file.url,
            type: "image",
          }));
          this.updateCurrentAIResponse();
        }
      }

      if (data.conversation_id) {
        this.conversationId = data.conversation_id;
      }
    },

    async handleSendMessage(text, fromVoice = false) {
      text = text.trim();
      if (!text) return;

      if (this.isTyping || this.isVoiceThinking) {
        uni.showToast({
          title: "AI正在回答中...",
          icon: "none",
        });
        return;
      }

      // 如果是语音输入，发送到语音AI；否则发送到文本AI
      if (fromVoice && this.isVoiceConnected) {
        this.sendToVoiceAI(text);
        return;
      }

      // 使用文本AI
      this.isTyping = true;
      this.currentUserMessage = text;
      this.currentUserTimestamp = Date.now();

      const userMessage = {
        sender: "user",
        text: text,
        timestamp: this.currentUserTimestamp,
      };

      this.messages.push(userMessage);
      this.$nextTick(() => {
        this.scrollToBottom();
      });

      this.resetAutoScroll();
      this.currentAIResponseRaw = "";
      this.currentAIResponse = "";
      this.currentAIHtml = "";
      this.currentAIFiles = [];
      this.streamCompleted = false;

      const userInfo = storage.getUserInfo();
      const inputs = {
        type: "学生",
        student_name: userInfo?.name || "未知用户",
        student_number: userInfo?.studentId || "未知学号",
      };

      // 请求体
      const body = {
        inputs: inputs,
        query: text,
        response_mode: "streaming",
        conversation_id: this.conversationId,
        user: "student-" + (userInfo?._id || "unknown"),
      };

      // #ifdef APP-PLUS
      this.trigger = {
        sign: this.trigger.sign + 1,
        token: storage.getToken(),
        body,
      };
      // #endif

      // #ifndef APP-PLUS
      try {
        await sendMessage(body, {
          // 注意这里使用箭头函数保持 this 指向，或者在 bind
          onData: (data) => this.handleStreamData(data),
          onComplete: () => this.handleStreamComplete(),
          onError: (err) => this.handleStreamError(err),
        });
      } catch (error) {
        console.error("Error calling Dify chat API:", error);
        this.handleStreamError(error);
      }
      // #endif
    },

    sendQuickMessage(text) {
      if (this.isTyping) return;
      this.handleSendMessage(text);
    },

    // 录音相关方法 - 使用本地录音+服务器识别（参考test_page.html）
    async handleRecordStart() {
      try {
        // 检查是否有其他AI正在工作
        if (this.isTyping || this.isVoiceThinking) {
          uni.showToast({
            title: "AI正在回答中，请稍候",
            icon: "none",
          });
          return;
        }

        // 如果语音AI未连接，先连接
        if (!this.isVoiceConnected) {
          await this.connectVoiceAI();
          // 等待连接完成
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        if (!this.isVoiceConnected || !this.voiceWebSocket || this.voiceWebSocket.readyState !== WebSocket.OPEN) {
          uni.showToast({
            title: "语音AI未连接",
            icon: "none",
          });
          return;
        }

        // 检查麦克风权限
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          uni.showModal({
            title: "不支持录音",
            content: "您的浏览器不支持录音功能",
            showCancel: false,
          });
          return;
        }

        // 显示加载提示
        uni.showLoading({
          title: "初始化中...",
          mask: true,
        });

        // 初始化Opus编码器（增加重试机制）
        if (!this.opusEncoder) {
          let retryCount = 0;
          const maxRetries = 5;

          while (retryCount < maxRetries) {
            this.opusEncoder = await this.initOpusEncoder();
            if (this.opusEncoder) {
              break;
            }
            retryCount++;
            await new Promise((resolve) => setTimeout(resolve, 500));
          }

          if (!this.opusEncoder) {
            uni.hideLoading();
            uni.showModal({
              title: "初始化失败",
              content: "Opus编码器初始化失败，请刷新页面重试",
              showCancel: false,
            });
            return;
          }
        }

        // 初始化音频录制
        await this.initAudioRecording();

        this.isRecording = true;
        uni.hideLoading();
      } catch (error) {
        uni.hideLoading();
        this.isRecording = false;

        if (error.name === "NotAllowedError") {
          uni.showModal({
            title: "需要麦克风权限",
            content: "请允许浏览器访问麦克风",
            showCancel: false,
          });
        } else {
          uni.showToast({
            title: "启动失败: " + error.message,
            icon: "none",
          });
        }
      }
    },

    async handleRecordEnd() {
      if (!this.isRecording) {
        return;
      }

      try {
        this.isRecording = false;

        // 停止AudioWorklet
        if (this.audioProcessorType === "worklet" && this.audioProcessor && this.audioProcessor.port) {
          this.audioProcessor.port.postMessage({ command: "stop" });
        }

        // 编码并发送剩余数据
        this.encodeAndSendOpus();

        // 清除语音AI思考状态，允许切换到文字AI
        this.isVoiceThinking = false;

        // 注意：不发送空Opus帧，保持WebSocket连接以便继续对话
        // 服务器会在一段时间没有音频数据后自动结束识别

        // 断开音频节点
        if (this.audioProcessor) {
          this.audioProcessor.disconnect();
          this.audioProcessor = null;
        }

        // 停止媒体流
        if (this.mediaStream) {
          this.mediaStream.getTracks().forEach((track) => {
            track.stop();
          });
          this.mediaStream = null;
        }

        // 关闭音频上下文
        if (this.audioContext) {
          await this.audioContext.close();
          this.audioContext = null;
        }
      } catch (error) {
        this.isRecording = false;
        this.isVoiceThinking = false;
      }
    },

    // 暂停录音（不挂断）
    handleRecordPause() {
      if (!this.isRecording) {
        return;
      }

      this.isRecording = false;

      // 停止AudioWorklet
      if (this.audioProcessorType === "worklet" && this.audioProcessor && this.audioProcessor.port) {
        this.audioProcessor.port.postMessage({ command: "stop" });
      }

      // 编码并发送剩余数据
      this.encodeAndSendOpus();
    },

    // 恢复录音
    async handleRecordResume() {
      if (this.isRecording) {
        return;
      }

      try {
        // 检查WebSocket连接
        if (!this.isVoiceConnected || !this.voiceWebSocket || this.voiceWebSocket.readyState !== WebSocket.OPEN) {
          uni.showToast({
            title: "语音AI未连接",
            icon: "none",
          });
          return;
        }

        // 检查是否需要重新获取麦克风权限
        if (!this.mediaStream || !this.audioContext) {
          // 重新初始化音频
          await this.initAudioRecording();
        } else {
          // 恢复AudioWorklet
          if (this.audioProcessorType === "worklet" && this.audioProcessor && this.audioProcessor.port) {
            this.audioProcessor.port.postMessage({ command: "start" });
          }
        }

        this.isRecording = true;
      } catch (error) {
        uni.showToast({
          title: "恢复录音失败",
          icon: "none",
        });
      }
    },

    // 初始化音频录制（提取公共逻辑）
    async initAudioRecording() {
      // 获取麦克风流
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 24000,
          channelCount: 1,
        },
      });

      this.mediaStream = stream;

      // 创建音频上下文
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContextClass({ sampleRate: 24000 });

      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      // 创建音频处理器
      const processorResult = await this.createAudioProcessor();
      if (!processorResult) {
        throw new Error("无法创建音频处理器");
      }

      this.audioProcessor = processorResult.node;
      this.audioProcessorType = processorResult.type;

      // 连接音频节点
      const audioSource = this.audioContext.createMediaStreamSource(stream);
      audioSource.connect(this.audioProcessor);

      // 创建静音节点（防止回声）
      const silent = this.audioContext.createGain();
      silent.gain.value = 0;
      this.audioProcessor.connect(silent);
      silent.connect(this.audioContext.destination);

      this.pcmDataBuffer = new Int16Array();

      // 如果使用AudioWorklet，发送开始命令
      if (this.audioProcessorType === "worklet" && this.audioProcessor.port) {
        this.audioProcessor.port.postMessage({ command: "start" });
      }
    },

    cleanupRecording() {
      if (this.recognition) {
        try {
          this.recognition.stop();
        } catch (e) {
          // 忽略错误
        }
      }

      this.isRecording = false;
    },

    // 创建音频处理器（AudioWorklet或ScriptProcessor）
    async createAudioProcessor() {
      try {
        if (this.audioContext.audioWorklet) {
          // 使用AudioWorklet
          const processorCode = `
            class AudioRecorderProcessor extends AudioWorkletProcessor {
              constructor() {
                super();
                this.frameSize = 1440;  // 60ms @ 24kHz = 1440 samples
                this.buffer = new Int16Array(this.frameSize);
                this.bufferIndex = 0;
                this.isRecording = false;
                
                
                
                this.port.onmessage = (event) => {
                  
                  if (event.data.command === 'start') {
                    this.isRecording = true;
                    
                    this.port.postMessage({ type: 'status', status: 'started' });
                  } else if (event.data.command === 'stop') {
                    this.isRecording = false;
                    
                    if (this.bufferIndex > 0) {
                      const finalBuffer = this.buffer.slice(0, this.bufferIndex);
                      this.port.postMessage({ type: 'buffer', buffer: finalBuffer });
                      this.bufferIndex = 0;
                    }
                    this.port.postMessage({ type: 'status', status: 'stopped' });
                  }
                };
              }
              
              process(inputs, outputs, parameters) {
                if (!this.isRecording) return true;
                
                const input = inputs[0][0];
                if (!input) return true;
                
                for (let i = 0; i < input.length; i++) {
                  if (this.bufferIndex >= this.frameSize) {
                    this.port.postMessage({ type: 'buffer', buffer: this.buffer.slice(0) });
                    this.bufferIndex = 0;
                  }
                  this.buffer[this.bufferIndex++] = Math.max(-32768, Math.min(32767, Math.floor(input[i] * 32767)));
                }
                
                return true;
              }
            }
            registerProcessor('audio-recorder-processor', AudioRecorderProcessor);
          `;

          const blob = new Blob([processorCode], { type: "application/javascript" });
          const url = URL.createObjectURL(blob);

          await this.audioContext.audioWorklet.addModule(url);

          URL.revokeObjectURL(url);

          const audioProcessor = new AudioWorkletNode(this.audioContext, "audio-recorder-processor");

          audioProcessor.port.onmessage = (event) => {
            if (event.data.type === "buffer") {
              this.processPCMBuffer(event.data.buffer);
            } else if (event.data.type === "status") {
            }
          };

          return { node: audioProcessor, type: "worklet" };
        } else {
          return this.createScriptProcessor();
        }
      } catch (error) {
        console.error("创建AudioWorklet失败:", error);

        return this.createScriptProcessor();
      }
    },

    // 创建ScriptProcessor作为后备方案
    createScriptProcessor() {
      try {
        const frameSize = 4096;
        const scriptProcessor = this.audioContext.createScriptProcessor(frameSize, 1, 1);

        scriptProcessor.onaudioprocess = (event) => {
          if (!this.isRecording) return;

          const input = event.inputBuffer.getChannelData(0);
          const buffer = new Int16Array(input.length);

          for (let i = 0; i < input.length; i++) {
            buffer[i] = Math.max(-32768, Math.min(32767, Math.floor(input[i] * 32767)));
          }

          this.processPCMBuffer(buffer);
        };

        return { node: scriptProcessor, type: "processor" };
      } catch (error) {
        console.error("创建ScriptProcessor失败:", error);
        return null;
      }
    },

    // 处理PCM缓冲区数据
    processPCMBuffer(buffer) {
      if (!this.isRecording) {
        return;
      }

      // 合并缓冲区
      const newBuffer = new Int16Array(this.pcmDataBuffer.length + buffer.length);
      newBuffer.set(this.pcmDataBuffer);
      newBuffer.set(buffer, this.pcmDataBuffer.length);
      this.pcmDataBuffer = newBuffer;

      // 每1440个采样点编码一次 (60ms @ 24kHz)
      const samplesPerFrame = 1440;
      while (this.pcmDataBuffer.length >= samplesPerFrame) {
        const frameData = this.pcmDataBuffer.slice(0, samplesPerFrame);
        this.pcmDataBuffer = this.pcmDataBuffer.slice(samplesPerFrame);
        this.encodeAndSendOpus(frameData);
      }
    },

    // 编码并发送Opus数据
    encodeAndSendOpus(pcmData = null) {
      if (!this.opusEncoder) {
        return;
      }

      try {
        if (pcmData) {
          const opusData = this.opusEncoder.encode(pcmData);

          if (opusData && opusData.length > 0) {
            if (this.voiceWebSocket && this.voiceWebSocket.readyState === WebSocket.OPEN) {
              this.voiceWebSocket.send(opusData.buffer);
            }
          }
        } else {
          // 编码剩余数据
          if (this.pcmDataBuffer.length > 0) {
            const samplesPerFrame = 1440; // 60ms @ 24kHz
            if (this.pcmDataBuffer.length < samplesPerFrame) {
              // 填充到1440个采样点
              const paddedBuffer = new Int16Array(samplesPerFrame);
              paddedBuffer.set(this.pcmDataBuffer);

              this.encodeAndSendOpus(paddedBuffer);
            } else {
              this.encodeAndSendOpus(this.pcmDataBuffer.slice(0, samplesPerFrame));
            }
            this.pcmDataBuffer = new Int16Array(0);
          }
        }
      } catch (error) {
        // 忽略编码错误
      }
    },

    // 初始化Opus编码器
    async initOpusEncoder() {
      if (this.opusEncoder) return this.opusEncoder;

      try {
        // 等待Opus库加载
        await this.waitForOpusLibrary();

        const mod = window.ModuleInstance;

        if (!mod) {
          console.error("ModuleInstance未定义");
          return null;
        }

        // 检查必要的函数是否存在
        if (typeof mod._opus_encoder_get_size !== "function") {
          console.error("opus_encoder_get_size函数不存在");
          return null;
        }

        const encoder = {
          channels: 1,
          sampleRate: 24000, // 改为24kHz以匹配服务器要求
          frameSize: 1440, // 60ms @ 24kHz = 1440 samples
          maxPacketSize: 4000,
          module: mod,
          encoderPtr: null,

          init: function () {
            if (this.encoderPtr) return true;

            try {
              // 获取编码器大小
              const encoderSize = this.module._opus_encoder_get_size(this.channels);

              // 分配内存
              this.encoderPtr = this.module._malloc(encoderSize);
              if (!this.encoderPtr) {
                console.error("无法分配编码器内存");
                return false;
              }

              // 初始化编码器 (application = 2048 for VOIP)
              const err = this.module._opus_encoder_init(this.encoderPtr, this.sampleRate, this.channels, 2048);

              if (err < 0) {
                console.error("Opus编码器初始化失败，错误码:", err);
                this.module._free(this.encoderPtr);
                this.encoderPtr = null;
                return false;
              }

              // 设置比特率 (16kbps)
              this.module._opus_encoder_ctl(this.encoderPtr, 4002, 16000);

              // 设置复杂度 (0-10)
              this.module._opus_encoder_ctl(this.encoderPtr, 4010, 5);

              // 设置使用DTX (不传输静音帧)
              this.module._opus_encoder_ctl(this.encoderPtr, 4016, 1);

              return true;
            } catch (error) {
              console.error("Opus编码器初始化异常:", error);
              if (this.encoderPtr) {
                this.module._free(this.encoderPtr);
                this.encoderPtr = null;
              }
              return false;
            }
          },

          encode: function (pcmData) {
            if (!this.encoderPtr) {
              if (!this.init()) {
                return new Uint8Array(0);
              }
            }

            try {
              const mod = this.module;

              // 为PCM数据分配内存
              const pcmPtr = mod._malloc(pcmData.length * 2);

              // 将PCM数据复制到HEAP
              for (let i = 0; i < pcmData.length; i++) {
                mod.HEAP16[(pcmPtr >> 1) + i] = pcmData[i];
              }

              // 为输出分配内存
              const outPtr = mod._malloc(this.maxPacketSize);

              // 进行编码
              const encodedLen = mod._opus_encode(this.encoderPtr, pcmPtr, this.frameSize, outPtr, this.maxPacketSize);

              if (encodedLen < 0) {
                console.error("Opus编码失败，错误码:", encodedLen);
                mod._free(pcmPtr);
                mod._free(outPtr);
                return new Uint8Array(0);
              }

              // 复制编码后的数据
              const opusData = new Uint8Array(encodedLen);
              for (let i = 0; i < encodedLen; i++) {
                opusData[i] = mod.HEAPU8[outPtr + i];
              }

              // 释放内存
              mod._free(pcmPtr);
              mod._free(outPtr);

              return opusData;
            } catch (error) {
              console.error("Opus编码异常:", error);
              return new Uint8Array(0);
            }
          },

          destroy: function () {
            if (this.encoderPtr) {
              this.module._free(this.encoderPtr);
              this.encoderPtr = null;
            }
          },
        };

        if (!encoder.init()) {
          console.error("编码器初始化失败");
          return null;
        }

        return encoder;
      } catch (error) {
        console.error("初始化Opus编码器失败:", error);
        return null;
      }
    },

    // 语音AI相关方法
    async connectVoiceAI() {
      try {
        uni.showLoading({
          title: "连接中...",
          mask: true,
        });

        // 获取WebSocket地址

        const wsUrl = await this.getVoiceWebSocketUrl();

        if (!wsUrl) {
          throw new Error("无法获取WebSocket地址");
        }

        // 创建WebSocket连接

        this.voiceWebSocket = new WebSocket(wsUrl);
        this.voiceWebSocket.binaryType = "arraybuffer";

        this.voiceWebSocket.onopen = async () => {
          this.isVoiceConnected = true;

          uni.hideLoading();

          // 发送hello消息

          await this.sendVoiceHelloMessage();
        };

        this.voiceWebSocket.onmessage = (event) => {
          this.handleVoiceWebSocketMessage(event);
        };

        this.voiceWebSocket.onclose = () => {
          this.isVoiceConnected = false;
          uni.hideLoading();
        };

        this.voiceWebSocket.onerror = (error) => {
          console.error("=== WebSocket连接错误 ===");
          console.error("错误:", error);
          this.isVoiceConnected = false;
          uni.hideLoading();
          uni.showToast({
            title: "语音AI连接失败",
            icon: "none",
          });
        };
      } catch (error) {
        console.error("=== 连接语音AI失败 ===");
        console.error("错误:", error);
        uni.hideLoading();
        uni.showToast({
          title: "连接失败: " + error.message,
          icon: "none",
        });
      }
    },

    async getVoiceWebSocketUrl() {
      try {
        const res = await new Promise((resolve, reject) => {
          uni.request({
            url: otaUrl,
            method: "POST",
            header: {
              "Content-Type": "application/json",
              "Device-Id": deviceId,
              "Client-Id": clientId,
            },
            data: {
              version: 0,
              uuid: "",
              application: {
                name: "xiaozhi-ai-assistant",
                version: "1.0.0",
                compile_time: "2025-04-16 10:00:00",
                idf_version: "4.4.3",
                elf_sha256: "1234567890abcdef1234567890abcdef1234567890abcdef",
              },
              ota: { label: "xiaozhi-ai-assistant" },
              board: {
                type: deviceName,
                ssid: "xiaozhi-ai-assistant",
                rssi: 0,
                channel: 0,
                ip: "192.168.1.1",
                mac: deviceMac,
              },
              flash_size: 0,
              minimum_free_heap_size: 0,
              mac_address: deviceMac,
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

          let wsUrl = wsInfo.url;
          const urlObj = new URL(wsUrl);

          if (wsInfo.token) {
            const token = wsInfo.token.startsWith("Bearer ") ? wsInfo.token : "Bearer " + wsInfo.token;
            urlObj.searchParams.append("authorization", token);
          }

          urlObj.searchParams.append("device-id", deviceId);
          urlObj.searchParams.append("client-id", clientId);

          const finalUrl = urlObj.toString();

          return finalUrl;
        }

        console.error("响应中没有websocket信息，完整响应:", res);
        throw new Error("响应中没有 websocket 信息");
      } catch (error) {
        console.error("获取WebSocket URL失败:", error);
        console.error("错误详情:", error.message, error.stack);
        return null;
      }
    },

    async sendVoiceHelloMessage() {
      if (!this.voiceWebSocket || this.voiceWebSocket.readyState !== WebSocket.OPEN) {
        console.warn("WebSocket未连接，无法发送hello消息");
        return;
      }

      const helloMessage = {
        type: "hello",
        device_id: "web_ai_assistant",
        device_name: "AI助手",
        device_mac: "web_ai_assistant",
        token: "",
        features: { mcp: true },
      };

      this.voiceWebSocket.send(JSON.stringify(helloMessage));
    },

    sendToVoiceAI(text) {
      if (!this.isVoiceConnected || !this.voiceWebSocket || this.voiceWebSocket.readyState !== WebSocket.OPEN) {
        uni.showToast({
          title: "语音AI未连接",
          icon: "none",
        });
        return;
      }

      try {
        const listenMessage = {
          type: "listen",
          state: "detect",
          text: text,
        };

        this.voiceWebSocket.send(JSON.stringify(listenMessage));

        // 显示用户消息
        const userMessage = {
          sender: "user",
          text: text,
          timestamp: Date.now(),
        };
        this.messages.push(userMessage);

        // 显示思考状态
        this.isVoiceThinking = true;

        this.$nextTick(() => {
          this.scrollToBottom();
        });
      } catch (error) {
        this.isVoiceThinking = false;
        uni.showToast({
          title: "发送失败",
          icon: "none",
        });
      }
    },

    handleVoiceWebSocketMessage(event) {
      try {
        if (typeof event.data === "string") {
          const message = JSON.parse(event.data);
          

          if (message.type === "stt") {
            // 语音识别结果
            if (message.text && message.text.trim()) {
              

              // 显示用户消息
              const userMessage = {
                sender: "user",
                text: message.text,
                timestamp: Date.now(),
              };
              this.messages.push(userMessage);

              // 显示语音AI思考状态（不显示文字AI状态）
              this.isVoiceThinking = true;
              this.isTyping = false;

              this.$nextTick(() => {
                this.scrollToBottom();
              });
            }
          } else if (message.type === "tts" || message.type === "llm") {
            if (message.text && message.text.trim()) {
              

              // 隐藏语音AI思考状态
              this.isVoiceThinking = false;

              // 显示AI回复
              const aiMessage = {
                sender: "ai",
                text: message.text,
                html: message.text,
                timestamp: Date.now(),
                quickButtons: [],
                files: [],
              };
              this.messages.push(aiMessage);

              this.$nextTick(() => {
                this.scrollToBottom();
              });
            }
          } else if (message.type === "listen") {
            

            // 处理语音识别结果（备用，某些服务器可能用listen返回识别结果）
            if (message.text && message.text.trim() && message.state === "detect") {
              

              // 显示用户消息
              const userMessage = {
                sender: "user",
                text: message.text,
                timestamp: Date.now(),
              };
              this.messages.push(userMessage);

              // 显示语音AI思考状态（不显示文字AI状态）
              this.isVoiceThinking = true;
              this.isTyping = false;

              this.$nextTick(() => {
                this.scrollToBottom();
              });
            }
          } else if (message.type === "hello") {
            
            
          } else if (message.type === "error") {
            console.error("[服务器错误]", message.message || message);
            this.isVoiceThinking = false;
          } else {
            
            
          }
        } else {
          // 处理二进制音频数据
          
          this.handleAudioData(event.data);
        }
      } catch (error) {
        console.error("[WebSocket错误]", error);
        this.isVoiceThinking = false;
      }
    },

    // 处理音频数据
    async handleAudioData(data) {
      try {
        // 如果是空数据，表示音频流结束
        if (data.byteLength === 0) {
          return;
        }

        // 将音频数据添加到队列
        if (!this.audioQueue) {
          this.audioQueue = [];
        }
        this.audioQueue.push(new Uint8Array(data));

        // 如果当前没有在播放，开始播放
        if (!this.isPlayingAudio) {
          this.playAudioQueue();
        }
      } catch (error) {
        // 忽略错误
      }
    },

    // 播放音频队列
    async playAudioQueue() {
      if (this.isPlayingAudio || !this.audioQueue || this.audioQueue.length === 0) return;

      this.isPlayingAudio = true;

      try {
        // 初始化Web Audio Context
        if (!this.webAudioContext) {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          this.webAudioContext = new AudioContextClass({
            sampleRate: 24000, // 改为24kHz
          });
          this.nextPlayTime = this.webAudioContext.currentTime;
        }

        const ctx = this.webAudioContext;

        // 恢复音频上下文（如果被暂停）
        if (ctx.state === "suspended") {
          await ctx.resume();
        }

        // 初始化Opus解码器
        if (!this.opusDecoder) {
          this.opusDecoder = await this.initOpusDecoder();
          if (!this.opusDecoder) {
            this.isPlayingAudio = false;
            return;
          }
        }

        // 处理队列中的所有音频数据
        while (this.audioQueue.length > 0) {
          const opusData = this.audioQueue.shift();

          try {
            // 使用Opus解码器解码数据
            const pcmData = this.opusDecoder.decode(opusData);

            if (pcmData.length === 0) {
              continue;
            }

            // 创建AudioBuffer
            const audioBuffer = this.pcmToAudioBuffer(pcmData);

            // 创建音频源
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);

            // 计算播放时间
            const currentTime = ctx.currentTime;
            const playTime = Math.max(currentTime, this.nextPlayTime);

            // 开始播放
            source.start(playTime);

            // 更新下一个播放时间
            this.nextPlayTime = playTime + audioBuffer.duration;
          } catch (error) {
            // 播放失败，跳过这个片段
          }
        }

        // 等待所有音频播放完成
        const waitTime = Math.max(0, (this.nextPlayTime - ctx.currentTime) * 1000);
        setTimeout(() => {
          this.isPlayingAudio = false;

          // 如果有新的音频数据，继续播放
          if (this.audioQueue && this.audioQueue.length > 0) {
            this.playAudioQueue();
          }
        }, waitTime);
      } catch (error) {
        this.isPlayingAudio = false;
      }
    },

    // 初始化Opus解码器
    async initOpusDecoder() {
      if (this.opusDecoder) return this.opusDecoder;

      try {
        // 等待Opus库加载
        await this.waitForOpusLibrary();

        const mod = window.ModuleInstance;

        if (!mod || typeof mod._opus_decoder_get_size !== "function") {
          return null;
        }

        const decoder = {
          channels: 1,
          rate: 24000, // 改为24kHz
          frameSize: 1440, // 60ms @ 24kHz
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

              const decodedSamples = mod._opus_decode(
                this.decoderPtr,
                opusPtr,
                opusData.length,
                pcmPtr,
                this.frameSize,
                0,
              );

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

        if (!decoder.init()) {
          return null;
        }

        return decoder;
      } catch (error) {
        return null;
      }
    },

    // 等待Opus库加载
    waitForOpusLibrary() {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // 最多等待5秒

        const checkOpus = () => {
          attempts++;

          // 检查是否超时
          if (attempts > maxAttempts) {
            console.error("Opus库加载超时");
            reject(new Error("Opus库加载超时"));
            return;
          }

          // 检查全局Module变量（libopus.js导出的）
          // 注意：在浏览器环境中，libopus.js会创建全局Module变量
          if (typeof Module === "undefined" && typeof window.Module === "undefined") {
            setTimeout(checkOpus, 100);
            return;
          }

          // 获取Module对象
          const ModuleObj = typeof Module !== "undefined" ? Module : window.Module;

          // 检查Module.instance（libopus.js最后一行导出方式）
          if (typeof ModuleObj.instance !== "undefined") {
            const mod = ModuleObj.instance;
            if (typeof mod._opus_encoder_get_size === "function") {
              window.ModuleInstance = mod;
              resolve(true);
              return;
            }
          }

          // 检查Module直接导出
          if (typeof ModuleObj._opus_encoder_get_size === "function") {
            window.ModuleInstance = ModuleObj;
            resolve(true);
            return;
          }

          // Module存在但函数不存在，继续等待

          setTimeout(checkOpus, 100);
        };

        checkOpus();
      });
    },

    // 将PCM数据转换为AudioBuffer
    pcmToAudioBuffer(pcmData, sampleRate = 24000) {
      // 改为24kHz
      const audioBuffer = this.webAudioContext.createBuffer(1, pcmData.length, sampleRate);
      const channelData = audioBuffer.getChannelData(0);

      // 将Int16转换为Float32 (-1.0 到 1.0)
      for (let i = 0; i < pcmData.length; i++) {
        channelData[i] = pcmData[i] / 32768.0;
      }

      return audioBuffer;
    },

    disconnectVoiceAI() {
      if (this.voiceWebSocket) {
        this.voiceWebSocket.close();
        this.voiceWebSocket = null;
      }
      this.isVoiceConnected = false;

      // 清理音频播放资源
      if (this.webAudioContext) {
        try {
          this.webAudioContext.close();
        } catch (e) {
          // 忽略错误
        }
        this.webAudioContext = null;
      }

      if (this.opusDecoder) {
        try {
          this.opusDecoder.destroy();
        } catch (e) {
          // 忽略错误
        }
        this.opusDecoder = null;
      }

      this.audioQueue = [];
      this.isPlayingAudio = false;
      this.nextPlayTime = 0;
    },
  },

  async onLoad() {
    const userInfo = storage.getUserInfo();
    const userName = userInfo ? userInfo.name : "用户";
    const initText = ` ${userName} **我是您的 AI 智膳伙伴**\n\n请问我有什么可以帮到您的吗？\n\n我可以为您提供以下服务：\n\n**营养咨询** - 个性化饮食建议     \n\n**健康分析** - 基于数据的健康评估          \n\n**健身指导** - 科学运动方案\n\n**食谱推荐** - 健康美味菜谱`;

    // 初始化欢迎语
    if (this.messages.length > 0 && this.messages[0].sender === "ai") {
      this.messages[0].text = initText;
      this.messages[0].html = initText;
    } else {
      this.messages.push({
        sender: "ai",
        text: initText,
        html: initText,
        timestamp: Date.now(),
        quickButtons: [],
        files: [],
      });
    }

    await this.loadHistory();
    this.resetAutoScroll();
    this.scrollToBottom();

    uni.$on("clear-chat-request", this.showClearConfirm);
  },
  async mounted() {
    // 页面挂载时的初始化

    // 检查Opus库是否已加载

    if (typeof Module !== "undefined") {
      if (Module.instance) {
      }
    }

    // 预先初始化Opus编码器

    try {
      this.opusEncoder = await this.initOpusEncoder();
      if (this.opusEncoder) {
      } else {
        console.warn("⚠️ Opus编码器预加载失败，将在录音时重试");
      }
    } catch (error) {
      console.warn("⚠️ Opus编码器预加载异常:", error);
    }

    // 连接语音AI

    await this.connectVoiceAI();

    // 检查连接状态

    if (this.voiceWebSocket) {
    }
  },

  onUnload() {
    uni.$off("clear-chat-request", this.showClearConfirm);
    // 清理录音资源
    this.cleanupRecording();
    // 清理语音AI连接
    this.disconnectVoiceAI();
  },
};
</script>

<script module="renderScript" lang="renderjs">
export default {
	methods: {
		async startStream(config, _, ownerInstance) {
			if (config.sign === 0) {
				return;
			};

      config.handleStream(config, ownerInstance)
		}
	}
}
</script>

<style lang="scss" scoped>
/* 样式部分保持不变 */
.container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f8fafc;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.conversation-area {
  flex: 1;
  height: 0;
  padding: 20rpx;
  box-sizing: border-box;
}

.clear-btn {
  position: absolute;
  top: 30rpx;
  right: 30rpx;
  width: 80rpx;
  height: 80rpx;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.3s;

  &:active {
    transform: scale(0.95);
    background-color: #f2f3f5;
  }
}

/* 语音AI思考中状态 */
.voice-thinking {
  padding: 20rpx;
  display: flex;
  justify-content: flex-start;
}

.thinking-bubble {
  background: #f0f7ff;
  border-radius: 20rpx;
  padding: 20rpx 30rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.thinking-dots {
  display: flex;
  gap: 8rpx;
}

.dot {
  width: 12rpx;
  height: 12rpx;
  background: #1a5f9e;
  border-radius: 50%;
  animation: thinking 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes thinking {
  0%,
  80%,
  100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.thinking-text {
  font-size: 28rpx;
  color: #1a5f9e;
}
</style>
