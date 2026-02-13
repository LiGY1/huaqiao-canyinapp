<template>
  <layout>
    <view class="ai-page">
      <!-- 学生选择器 (仅教师) -->
      <StudentSelector 
        v-if="isTeacher"
        v-model="selectedStudents"
        :students="studentList"
      />

      <!-- 聊天区域 -->
      <scroll-view
        class="chat-area"
        scroll-y
        :scroll-into-view="scrollIntoViewId"
        scroll-with-animation
      >
        <view class="msg-list">
          <ChatMessage
            v-for="(msg, index) in messages"
            :key="index"
            :id="'msg-' + index"
            :message="msg"
            :disabled="isTyping"
            @quick-button-click="onQuickButtonClick"
            @preview-image="previewImage"
          />
          <TypingIndicator v-if="isTyping" id="typing-indicator" />
          <view id="bottom-anchor" style="height: 20rpx;"></view>
        </view>
      </scroll-view>

      <!-- 清除按钮 -->
      <view class="clear-history" @click="showClearConfirm">
        <uni-icons type="trash" size="20" color="#94a3b8"></uni-icons>
      </view>

      <!-- 输入区域 -->
      <InputArea
        :disabled="isTyping"
        :placeholder="inputPlaceholder"
        @send-message="handleSend"
      />
    </view>
  </layout>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue';
import layout from '@/components/layout.vue';
import ChatMessage from './components/chatMessage.vue';
import InputArea from './components/inputArea.vue';
import TypingIndicator from './components/typingIndicator.vue';
import StudentSelector from './components/studentSelector.vue';
import { studentApi } from '@/api/school/student';
import { sendMessage, getChatHistory, clearAllChatHistory, saveChatHistory } from '@/api/school/aiAssistant';
import storage from '@/utils/storage';

const isTeacher = ref(true); // 简单判断，实际应从store或storage获取
const studentList = ref([]);
const selectedStudents = ref([]);
const messages = ref([]);
const isTyping = ref(false);
const conversationId = ref('');
const scrollIntoViewId = ref('');

const inputPlaceholder = computed(() => {
  if (isTeacher.value && selectedStudents.value.length === 0) return '请先选择学生...';
  return '咨询关于学生的问题...';
});

// 加载学生列表
const loadStudents = async () => {
  try {
    const res = await studentApi.getStudentList({ page: 1, pageSize: 1000 });
    if (res.code === 200 || res.success) {
      studentList.value = res.data?.list || [];
    }
  } catch (e) { console.error(e); }
};

// 加载历史
const loadHistory = async () => {
  try {
    const res = await getChatHistory({ limit: 50, offset: 0 });
    if (res.code === 200 || res.success) {
      const records = res.data?.records || [];
      records.forEach(r => {
        if (r.userMessage) messages.value.push({ sender: 'user', text: r.userMessage, timestamp: r.timestamp });
        if (r.aiMessage) messages.value.push({ sender: 'ai', text: r.aiMessage, html: r.aiMessage, timestamp: r.timestamp + 1000, files: r.files || [] });
        if (r.conversationId) conversationId.value = r.conversationId;
      });
      scrollToBottom();
    }
  } catch (e) {
    // 忽略加载历史失败，可能第一次使用
  }
};

const handleSend = async (text) => {
  if (isTeacher.value && selectedStudents.value.length === 0) {
    uni.showToast({ title: '请先选择学生', icon: 'none' });
    return;
  }

  isTyping.value = true;
  const ts = Date.now();
  messages.value.push({ sender: 'user', text, timestamp: ts });
  scrollToBottom();

  const userInfo = storage.getUserInfo();
  const inputs = {
    type: '老师',
    teacher_name: userInfo?.name || '管理员',
    student_name: selectedStudents.value.join(',')
  };

  let aiResponseText = '';
  let aiFiles = [];

  try {
    await sendMessage({
      inputs,
      query: text,
      conversation_id: conversationId.value,
      user: 'school-' + (userInfo?.id || 'unknown')
    }, {
      onData: (data) => {
        if (data.answer) {
          aiResponseText += data.answer;
          updateAIResponse(aiResponseText, aiFiles);
        }
        if (data.files) {
          aiFiles = data.files;
          updateAIResponse(aiResponseText, aiFiles);
        }
        if (data.conversation_id) conversationId.value = data.conversation_id;
      },
      onComplete: async () => {
        isTyping.value = false;
        await saveChatHistory({
          conversationId: conversationId.value,
          sender: 'user',
          userMessage: text,
          aiMessage: aiResponseText,
          files: aiFiles,
          metadata: { selectedStudentNames: selectedStudents.value.join(',') }
        });
        addQuickButtons();
      },
      onError: () => {
        isTyping.value = false;
        messages.value.push({ sender: 'ai', text: '出了点问题，请稍后再试。', timestamp: Date.now() });
      }
    });
  } catch (e) {
    isTyping.value = false;
  }
};

const updateAIResponse = (text, files) => {
  const last = messages.value[messages.value.length - 1];
  if (last && last.sender === 'ai') {
    last.text = text;
    last.html = text;
    last.files = files;
  } else {
    messages.value.push({ sender: 'ai', text, html: text, timestamp: Date.now(), files });
  }
  scrollToBottom();
};

const addQuickButtons = () => {
  const last = messages.value[messages.value.length - 1];
  if (last && last.sender === 'ai') {
    last.quickButtons = [
      { text: '查看该生健康状况' },
      { text: '今日用餐建议' },
      { text: '本周异常预警' }
    ];
  }
};

const onQuickButtonClick = (text) => {
  if (!isTyping.value) handleSend(text);
};

const scrollToBottom = () => {
  nextTick(() => {
    scrollIntoViewId.value = '';
    nextTick(() => {
      scrollIntoViewId.value = 'bottom-anchor';
    });
  });
};

const previewImage = (url) => {
  uni.previewImage({ urls: [url], current: url });
};

const showClearConfirm = () => {
  uni.showModal({
    title: '清除对话',
    content: '确定要清除所有对话记录吗？',
    success: async (res) => {
      if (res.confirm) {
        await clearAllChatHistory();
        messages.value = [messages.value[0]];
        conversationId.value = '';
        uni.showToast({ title: '已清除' });
      }
    }
  });
};

onMounted(() => {
  const userInfo = storage.getUserInfo();
  const userName = userInfo?.name || '老师';
  messages.value.push({
    sender: 'ai',
    text: `### 您好，${userName}！我是您的智能校管助手\n\n我可以为您分析班级学生的健康数据、饮食情况及异常预警。请在上方选择学生后开始咨询。`,
    html: `### 您好，${userName}！我是您的智能校管助手\n\n我可以为您分析班级学生的健康数据、饮食情况及异常预警。请在上方选择学生后开始咨询。`,
    timestamp: Date.now(),
    quickButtons: [
      { text: '查看班级整体健康' },
      { text: '列出异常风险学生' },
      { text: '今日营养摄入概况' }
    ]
  });

  loadStudents();
  loadHistory();
});
</script>

<style lang="scss" scoped>
.ai-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120rpx);
  background-color: #f1f5f9;
  position: relative;
}

.chat-area {
  flex: 1;
  height: 0;
}

.msg-list {
  padding-bottom: 40rpx;
}

.clear-history {
  position: absolute;
  top: 150rpx;
  right: 30rpx;
  width: 72rpx;
  height: 72rpx;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
  z-index: 10;
}
</style>
