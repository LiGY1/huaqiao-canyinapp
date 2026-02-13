<template>
  <Layout>
    <view class="container">
      <view class="chat-container">
        <!-- 聊天记录区域 -->
        <scroll-view
          class="conversation-area"
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
        />
      </view>
    </view>
  </Layout>
</template>

<script setup>
import { ref, nextTick } from "vue";
import { onLoad, onUnload } from "@dcloudio/uni-app";
import storage from "@/utils/storage";
import { saveChatHistory, getChatHistory, clearAllChatHistory, sendMessage } from "@/api/parent/aiAssistant";
import Layout from "@/components/layout.vue";
import ChatMessage from "../../student/ai-assistant/components/chatMessage.vue";
import InputArea from "../../student/ai-assistant/components/inputArea.vue";
import TypingIndicator from "../../student/ai-assistant/components/typingIndicator.vue";
import { throttle } from "@/utils/tool";

// --- Composables ---

function useScrollControl(isTyping) {
  const scrollIntoViewId = ref("");
  const isUserScrolling = ref(false);
  const shouldAutoScroll = ref(true);
  let isProgrammaticScroll = false;

  const scrollToBottom = throttle(() => {
    if (!shouldAutoScroll.value) return;

    nextTick(() => {
      isProgrammaticScroll = true;
      scrollIntoViewId.value = "";
      nextTick(() => {
        scrollIntoViewId.value = "bottom-anchor";
      });
    });
  }, 450);

  const resetAutoScroll = () => {
    shouldAutoScroll.value = true;
    isProgrammaticScroll = true;
  };

  const onScroll = (e) => {
    if (isProgrammaticScroll) {
      isProgrammaticScroll = false;
      return;
    }
    if (isTyping.value) {
      shouldAutoScroll.value = false;
    }
  };

  return {
    scrollIntoViewId,
    scrollToBottom,
    resetAutoScroll,
    onScroll
  };
}

function useChatUI(scrollToBottom) {
  const activeTab = ref("text");

  const openVoiceCall = () => {
    uni.navigateTo({
      url: "/pages/parent/voice-call/voiceCall",
    });
  };

  const switchTab = (tab) => {
    if (tab === "voice") {
      openVoiceCall();
      return;
    }
    activeTab.value = tab;
  };

  const onInputFocus = () => {
    scrollToBottom();
  };

  const onInputBlur = () => {
    // 处理输入框失焦事件
  };

  const closeKeyboard = () => {
    uni.hideKeyboard();
  };

  return {
    activeTab,
    openVoiceCall,
    switchTab,
    onInputFocus,
    onInputBlur,
    closeKeyboard
  };
}

function useChatHistory(messages, conversationId) {
  const loadHistory = async () => {
    try {
      const response = await getChatHistory({ limit: 50, offset: 0 });
      const chatHistory = response.data.chatHistory || [];
      if (chatHistory.length === 0) {
        return;
      }

      chatHistory.forEach((chat) => {
        if (chat.userMessage) {
          messages.value.push({
            sender: "user",
            text: chat.userMessage,
            timestamp: new Date(chat.timestamp).getTime(),
          });
        }
        if (chat.aiMessage) {
          messages.value.push({
            sender: "ai",
            text: chat.aiMessage,
            html: chat.aiMessage,
            timestamp: new Date(chat.timestamp).getTime(),
            files: chat.files || [],
            quickButtons: [],
          });
        }
        if (chat.conversationId) {
          conversationId.value = chat.conversationId;
        }
      });
    } catch (error) {
      uni.showToast({ title: "加载历史失败", icon: "none" });
    }
  };

  const saveChatToDatabase = async (currentUserMessageValue, currentAIResponseValue, currentUserTimestampValue, currentAIFilesValue) => {
    if (!currentUserMessageValue) return;

    const userInfo = storage.getUserInfo();
    const children = userInfo?.children || [];
    const firstChild = children.length > 0 ? children[0] : null;

    const chatData = {
      conversationId: conversationId.value || "",
      sender: "ai",
      userMessage: currentUserMessageValue,
      aiMessage: currentAIResponseValue || "",
      timestamp: currentUserTimestampValue,
      files: currentAIFilesValue,
      metadata: { 
        userType: "家长",
        parent_name: userInfo?.name || "未知家长",
        student_name: firstChild?.name || "未知学生",
        student_number: firstChild?.studentId || firstChild?._id || "未知学号"
      },
    };

    try {
      await saveChatHistory(chatData);
    } catch (e) {
      console.error(e);
    }
  };

  const clearAllChatRecords = async () => {
    uni.showLoading({ title: "清理中" });
    try {
      await clearAllChatHistory();
      uni.hideLoading();
      uni.showToast({ title: "已清空" });
      // 重置逻辑：保留第一条欢迎语
      if (messages.value.length > 0) {
        messages.value = [messages.value[0]];
      }
    } catch (e) {
      uni.hideLoading();
      uni.showToast({ title: "失败", icon: "none" });
    }
  };

  const showClearConfirm = () => {
    uni.showModal({
      title: "清空聊天记录",
      content: "确定要清空所有聊天记录吗？此操作不可恢复。",
      confirmColor: "#f56c6c",
      success: (res) => {
        if (res.confirm) {
          clearAllChatRecords();
        }
      },
    });
  };

  return {
    loadHistory,
    saveChatToDatabase,
    showClearConfirm,
    clearAllChatRecords
  };
}

function useChatStream(messages, conversationId, isTyping, scrollToBottom, resetAutoScroll, saveChatToDatabase) {
  const currentUserMessage = ref("");
  const currentUserTimestamp = ref(null);
  
  // 流式响应临时变量
  const currentAIResponseRaw = ref("");
  const currentAIResponse = ref("");
  const currentAIHtml = ref("");
  const currentAIFiles = ref([]);
  const streamCompleted = ref(false);

  const updateCurrentAIResponse = () => {
    const lastMessageIndex = messages.value.length - 1;
    const lastMessage = messages.value[lastMessageIndex];

    try {
      if (lastMessageIndex >= 0 && lastMessage.sender === "ai") {
        lastMessage.text = currentAIResponse.value;
        lastMessage.html = currentAIHtml.value;
        lastMessage.files = currentAIFiles.value;
      } else {
        const aiMessage = {
          sender: "ai",
          text: currentAIResponse.value,
          html: currentAIHtml.value,
          timestamp: Date.now(),
          quickButtons: [],
          files: currentAIFiles.value,
        };
        messages.value.push(aiMessage);
      }
    } catch (error) {
      console.error("Error updating AI response:", error);
    }
    scrollToBottom();
  };

  const addQuickButtonsToLastAIResponse = () => {
    const lastMessageIndex = messages.value.length - 1;
    if (lastMessageIndex >= 0 && messages.value[lastMessageIndex].sender === "ai") {
      let quickButtons = [{ text: "孩子偏食怎么办？" }, { text: "如何纠正孩子偏食？" }, { text: "孩子需要哪些营养？" }];
      messages.value[lastMessageIndex].quickButtons = quickButtons;
    }
  };

  const handleStreamComplete = async () => {
    if (streamCompleted.value) return;
    streamCompleted.value = true;
    isTyping.value = false;

    addQuickButtonsToLastAIResponse();
    await saveChatToDatabase(currentUserMessage.value, currentAIResponse.value, currentUserTimestamp.value, currentAIFilesValue);
    scrollToBottom();
  };

  const handleStreamError = (error) => {
    isTyping.value = false;
    const errorMessage = {
      sender: "ai",
      text: "出错了，请稍后再试。",
      html: '<div style="color:red">出错了，请稍后再试。</div>',
      timestamp: Date.now(),
      quickButtons: [{ text: "重新发送" }],
    };
    messages.value.push(errorMessage);
    scrollToBottom();
  };

  const handleStreamData = (data) => {
    if (data.answer) {
      let answerText = data.answer;
      if (typeof answerText === "string") {
        answerText = answerText.replace(/\\n/g, "\n");
      }

      currentAIResponseRaw.value += answerText;
      let textContent = currentAIResponseRaw.value;

      currentAIResponse.value = textContent;
      currentAIHtml.value = textContent;
      updateCurrentAIResponse();
    }

    if (data.files && data.files.length > 0) {
      const imageFiles = data.files.filter((file) => file.type === "image");
      if (imageFiles.length > 0) {
        currentAIFiles.value = imageFiles.map((file) => ({
          filename: file.filename || "图片",
          url: file.url,
          type: "image",
        }));
        updateCurrentAIResponse();
      }
    }

    if (data.conversation_id) {
      conversationId.value = data.conversation_id;
    }
  };

  const handleSendMessage = async (text) => {
    text = text.trim();
    if (!text) return;

    if (isTyping.value) {
      uni.showToast({ title: "AI正在回答中...", icon: "none" });
      return;
    }

    isTyping.value = true;
    currentUserMessage.value = text;
    currentUserTimestamp.value = Date.now();

    const userMessage = {
      sender: "user",
      text: text,
      timestamp: currentUserTimestamp.value,
    };

    messages.value.push(userMessage);
    nextTick(() => {
      scrollToBottom();
    });

    resetAutoScroll();
    currentAIResponseRaw.value = "";
    currentAIResponse.value = "";
    currentAIHtml.value = "";
    currentAIFiles.value = [];
    streamCompleted.value = false;

    const userInfo = storage.getUserInfo();
    const children = userInfo?.children || [];
    const firstChild = children.length > 0 ? children[0] : null;

    const inputs = {
      type: "家长",
      parent_name: userInfo?.name || "未知家长",
      student_name: firstChild?.name || "未知学生",
      student_number: firstChild?.studentId || firstChild?._id || "未知学号",
    };

    try {
      await sendMessage(
        {
          inputs: inputs,
          query: text,
          response_mode: "streaming",
          conversation_id: conversationId.value,
          user: "parent-" + (userInfo?.id || "unknown"),
        },
        {
          onData: handleStreamData,
          onComplete: handleStreamComplete,
          onError: handleStreamError,
        }
      );
    } catch (error) {
      console.error("Error calling Dify chat API:", error);
      handleStreamError(error);
    }
  };

  const sendQuickMessage = (text) => {
    if (isTyping.value) return;
    handleSendMessage(text);
  };

  return {
    handleSendMessage,
    sendQuickMessage
  };
}

function useImagePreview() {
  const previewImage = (url) => {
    uni.previewImage({
      urls: [url],
      current: url,
    });
  };
  return { previewImage };
}

// --- Main Setup Flow ---

const messages = ref([]);
const conversationId = ref("");
const isTyping = ref(false);

const { scrollIntoViewId, scrollToBottom, resetAutoScroll, onScroll } = useScrollControl(isTyping);
const { activeTab, openVoiceCall, switchTab, onInputFocus, onInputBlur, closeKeyboard } = useChatUI(scrollToBottom);
const { loadHistory, saveChatToDatabase, showClearConfirm } = useChatHistory(messages, conversationId);
const { handleSendMessage, sendQuickMessage } = useChatStream(messages, conversationId, isTyping, scrollToBottom, resetAutoScroll, saveChatToDatabase);
const { previewImage } = useImagePreview();

// --- Lifecycle ---

onLoad(async () => {
  const userInfo = storage.getUserInfo();
  const userName = userInfo ? userInfo.name : "家长";

  if (messages.value.length > 0 && messages.value[0].sender === "ai") {
    const initText = ` ${userName} **我是您孩子的 AI 智膳伙伴**\n\n请问我有什么可以帮到您的吗？\n\n我可以为您提供以下服务：\n\n**孩子营养咨询** - 科学喂养建议和营养搭配     \n\n**营养分析** - 评估孩子的营养摄入状况          \n\n**儿童食谱推荐** - 年龄适宜的健康食谱\n\n**成长发育指导** - 促进孩子健康成长的建议`;
    messages.value[0].text = initText;
    messages.value[0].html = initText;
  } else {
    const initText = ` ${userName} **我是您孩子的 AI 智膳伙伴**\n\n请问我有什么可以帮到您的吗？\n\n我可以为您提供以下服务：\n\n**孩子营养咨询** - 科学喂养建议和营养搭配     \n\n**营养分析** - 评估孩子的营养摄入状况          \n\n**儿童食谱推荐** - 年龄适宜的健康食谱\n\n**成长发育指导** - 促进孩子健康成长的建议`;
    messages.value.push({
      sender: "ai",
      text: initText,
      html: initText,
      timestamp: Date.now(),
      quickButtons: [],
      files: [],
    });
  }

  await loadHistory();
  resetAutoScroll();
  scrollToBottom();

  uni.$on("clear-chat-request", showClearConfirm);
});

onUnload(() => {
  uni.$off("clear-chat-request", showClearConfirm);
});
</script>

<style lang="scss" scoped>
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