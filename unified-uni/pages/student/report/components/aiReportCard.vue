<template>
  <view class="ai-report-card">
    <view class="ai-report-header">
      <text class="ai-report-title">AI 智能分析报告</text>
      <text class="ai-report-subtitle">由人工智能为您生成专业营养建议</text>
    </view>
    <view class="ai-report-actions">
      <button class="action-btn history-btn" @click="$emit('show-history')">
        <text>历史记录</text>
        <text class="badge">{{ reportHistory.length }}</text>
      </button>
      <button
        :class="{ generating: generatingReport }"
        class="action-btn generate-btn neon-button"
        @click="$emit('generate-report')"
        :disabled="generatingReport"
      >
        <text v-if="generatingReport">{{ generatingStatus }}</text>
        <text v-else>生成{{ reportType === "weekly" ? "周报" : "月报" }}</text>
      </button>
    </view>

    <!-- AI报告内容 -->
    <view v-if="aiReport" class="ai-report-content">
      <!-- 亮点与提醒 -->
      <view v-if="aiReport.highlights && aiReport.highlights.length > 0" class="report-section">
        <text class="section-title">亮点与提醒</text>
        <view class="highlights-list">
          <view v-for="(highlight, index) in aiReport.highlights" :key="index" class="highlight-item group">
            <view class="highlight-content markdown-content" v-html="parseMarkdown(highlight)"></view>
          </view>
        </view>
      </view>

      <!-- 营养建议 -->
      <view v-if="aiReport.suggestions && aiReport.suggestions.length > 0" class="report-section">
        <text class="section-title">营养建议</text>
        <view class="suggestions-list">
          <view v-for="(suggestion, index) in aiReport.suggestions" :key="index" class="suggestion-item">
            <view class="suggestion-content markdown-content" v-html="parseMarkdown(suggestion)"></view>
          </view>
        </view>
      </view>

      <!-- 下阶段饮食计划 -->
      <view class="report-section next-plan">
        <text class="section-title">下阶段饮食计划</text>
        <view class="plan-content markdown-content" v-html="parseMarkdown(aiReport.nextPlan || '暂无计划内容')"></view>
      </view>
    </view>

    <!-- 生成报告提示 -->
    <view v-else class="generate-prompt">
      <view class="prompt-icon"></view>
      <text class="prompt-title">点击上方按钮生成AI智能分析报告</text>
      <text class="prompt-subtitle">基于您的营养数据，AI将为您生成专业的{{ reportType }}分析</text>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  reportType: {
    type: String,
    default: "周报",
  },
  aiReport: {
    type: Object,
    default: null,
  },
  reportHistory: {
    type: Array,
    default: () => [],
  },
  generatingReport: {
    type: Boolean,
    default: false,
  },
  generatingStatus: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["generate-report", "show-history"]);

// 解析Markdown
const parseMarkdown = (text) => {
  if (!text) return "";
  try {
    let html = text;
    // 替换加粗
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // 替换斜体
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    // 替换列表
    html = html.replace(/^- (.*$)/gm, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");
    // 替换有序列表
    html = html.replace(/^\d+\. (.*$)/gm, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>)/s, "<ol>$1</ol>");
    // 替换链接
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
    // 替换代码块
    html = html.replace(/```(.*?)```/gs, "<pre><code>$1</code></pre>");
    // 替换行内代码
    html = html.replace(/`(.*?)`/g, "<code>$1</code>");
    // 替换标题
    html = html.replace(/^# (.*$)/gm, "<h1>$1</h1>");
    html = html.replace(/^## (.*$)/gm, "<h2>$1</h2>");
    html = html.replace(/^### (.*$)/gm, "<h3>$1</h3>");
    // 替换引用
    html = html.replace(/^> (.*$)/gm, "<blockquote>$1</blockquote>");
    return html;
  } catch (error) {
    console.error("Markdown解析失败:", error);
    return text;
  }
};
</script>

<style scoped>
.ai-report-card {
  background-color: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  min-height: 800rpx;
  flex-shrink: 0;
}

.ai-report-header {
  background: linear-gradient(to right, #667eea, #764ba2);
  padding: 30rpx;
  color: #fff;
}

.ai-report-title {
  font-size: 32rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 5rpx;
}

.ai-report-subtitle {
  font-size: 22rpx;
  opacity: 0.9;
  display: block;
}

.ai-report-actions {
  display: flex;
  gap: 16rpx;
  padding: 20rpx 30rpx;
  background-color: #fafafa;
  border-bottom: 2rpx solid #f0f0f0;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 14rpx 24rpx;
  border-radius: 12rpx;
  font-size: 24rpx;
  font-weight: 600;
  border: none;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.history-btn {
  background-color: rgba(102, 126, 234, 0.1);
  color: #667eea;
  border: 1.5rpx solid rgba(102, 126, 234, 0.3);
}

.history-btn:active {
  background-color: rgba(102, 126, 234, 0.2);
  transform: translateY(2rpx);
}

.generate-btn {
  background-color: #667eea;
  color: #fff;
  flex: 1;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
  border: 2rpx solid #667eea;
}

.generate-btn.generating {
  background-color: #764ba2;
  animation: pulse 1.5s ease-in-out infinite;
  box-shadow: 0 0 30rpx rgba(102, 126, 234, 0.6), 0 0 60rpx rgba(102, 126, 234, 0.4), 0 0 90rpx rgba(102, 126, 234, 0.2);
}

.neon-button {
  position: relative;
  overflow: hidden;
}

.neon-button::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #667eea, #764ba2, #f093fb, #667eea);
  background-size: 400%;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 0;
}

.neon-button:active::before {
  opacity: 0.15;
  animation: neon-flow 3s ease infinite;
}

.neon-button text {
  position: relative;
  z-index: 1;
}

@keyframes neon-flow {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.badge {
  background-color: rgba(255, 255, 255, 0.3);
  color: #667eea;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  font-size: 20rpx;
  font-weight: bold;
  min-width: 36rpx;
  text-align: center;
}

.ai-report-content {
  padding: 30rpx;
}

.report-section {
  margin-bottom: 40rpx;
}

.report-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
}

.highlights-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.highlight-item {
  background: linear-gradient(to right, #f0f9eb, #e6f7ff);
  border: 2rpx solid #c6f6d5;
  border-radius: 16rpx;
  padding: 24rpx;
  transition: all 0.3s ease;
}

.highlight-item:active {
  transform: scale(0.99);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.suggestion-item {
  background: linear-gradient(to right, #ecf5ff, #e6f4ff);
  border: 2rpx solid #90caf9;
  border-radius: 16rpx;
  padding: 24rpx;
  transition: all 0.3s ease;
}

.suggestion-item:active {
  transform: scale(0.99);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.next-plan {
  background: linear-gradient(to right, #faf5ff, #f3e8ff);
  border: 2rpx solid #d6bcfa;
  border-radius: 16rpx;
  padding: 24rpx;
}

.generate-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 20rpx;
  text-align: center;
}

.prompt-icon {
  width: 120rpx;
  height: 120rpx;
  background: linear-gradient(to right, #e6f7ff, #f0f5ff);
  border-radius: 50%;
  margin-bottom: 30rpx;
}

.prompt-title {
  font-size: 28rpx;
  color: #666;
  font-weight: 600;
  display: block;
  margin-bottom: 15rpx;
}

.prompt-subtitle {
  font-size: 24rpx;
  color: #999;
  display: block;
}

/* Markdown样式 */
.markdown-content {
  font-size: 26rpx;
  color: #333;
  line-height: 1.6;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.markdown-content :deep(strong) {
  font-weight: bold;
  color: #333;
}

.markdown-content :deep(em) {
  font-style: italic;
  color: #666;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 20rpx 0;
  padding-left: 40rpx;
}

.markdown-content :deep(li) {
  margin: 10rpx 0;
  font-size: 26rpx;
  color: #333;
  line-height: 1.6;
}

.markdown-content :deep(code) {
  background-color: #f0f0f0;
  padding: 4rpx 10rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  font-family: monospace;
  color: #f56c6c;
}

.markdown-content :deep(pre) {
  background-color: #1f2937;
  color: #f9fafb;
  padding: 20rpx;
  border-radius: 12rpx;
  overflow-x: auto;
  margin: 20rpx 0;
}

.markdown-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
  color: inherit;
}

.markdown-content :deep(blockquote) {
  border-left: 4rpx solid #667eea;
  padding-left: 20rpx;
  margin: 20rpx 0;
  font-style: italic;
  color: #4b5563;
  background-color: #f9fafb;
  padding: 15rpx 20rpx;
  border-radius: 8rpx;
}

.markdown-content :deep(a) {
  color: #667eea;
  text-decoration: underline;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  margin-top: 25rpx;
  margin-bottom: 15rpx;
  font-weight: 700;
  line-height: 1.4;
  color: #1f2937;
}

.markdown-content :deep(h1) {
  font-size: 32rpx;
}
.markdown-content :deep(h2) {
  font-size: 28rpx;
}
.markdown-content :deep(h3) {
  font-size: 26rpx;
}
.markdown-content :deep(h4) {
  font-size: 24rpx;
}
</style>
