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
          <TypingIndicator v-if="isTyping" id="typing-indicator" />

          <view style="height: 20px" id="bottom-anchor"></view>
        </scroll-view>

        <!-- 清除历史记录按钮 -->
        <view class="clear-btn" @click="showClearConfirm">
          <uni-icons type="trash" size="24" color="#909399"></uni-icons>
        </view>

        <!-- 底部输入区域 -->
        <InputArea
          :active-tab="activeTab"
          :disabled="isTyping"
          @send-message="handleSendMessage"
          @switch-tab="switchTab"
          @open-voice-call="openVoiceCall"
          @input-focus="onInputFocus"
          @input-blur="onInputBlur"
          @keyboard-height-change="onKeyboardHeightChange"
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
        url: "/pages/student/voice-call",
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

    async handleSendMessage(text) {
      text = text.trim();
      if (!text) return;

      if (this.isTyping) {
        uni.showToast({
          title: "AI正在回答中...",
          icon: "none",
        });
        return;
      }

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

  onUnload() {
    uni.$off("clear-chat-request", this.showClearConfirm);
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
</style>
