<template>
  <uni-popup ref="popup" type="center">
    <view class="report-dialog">
      <view class="popup-header">
        <text class="title">班级分析报告</text>
        <uni-icons type="closeempty" size="24" @click="close"></uni-icons>
      </view>
      <scroll-view scroll-y class="report-scroll">
        <view v-if="generating" class="generating">
          <uni-icons type="spinner-cycle" size="40" color="#4facfe" class="spin"></uni-icons>
          <text>{{ status }}</text>
        </view>
        <view v-else-if="report" class="report-content">
          <view class="section">
            <view class="st">整体分析</view>
            <text class="sc">{{ report.overview }}</text>
          </view>
          <view class="section" v-if="report.highlights && report.highlights.length">
            <view class="st">重点关注</view>
            <view v-for="(tip, i) in report.highlights" :key="i" class="tip-item">
              <text class="dot">·</text>
              <text class="sc">{{ tip }}</text>
            </view>
          </view>
          <view class="section" v-if="report.suggestions && report.suggestions.length">
            <view class="st">改善建议</view>
            <view v-for="(sug, j) in report.suggestions" :key="j" class="sug-item">
              <text class="num">{{ j + 1 }}.</text>
              <text class="sc">{{ sug }}</text>
            </view>
          </view>
        </view>
      </scroll-view>
      <view class="report-footer">
        <button 
          class="btn-gen" 
          @click="$emit('generate')" 
          :disabled="generating"
        >
          AI 重新分析
        </button>
      </view>
    </view>
  </uni-popup>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  report: Object,
  generating: Boolean,
  status: String
})

defineEmits(['generate'])

const popup = ref(null)

const open = () => {
  popup.value.open()
}

const close = () => {
  popup.value.close()
}

defineExpose({ open, close })
</script>

<style lang="scss" scoped>
.report-dialog {
  width: 90vw;
  background: #fff;
  border-radius: 32rpx;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.popup-header {
  padding: 40rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1rpx solid #f1f5f9;
  .title {
    font-size: 32rpx;
    font-weight: bold;
  }
}

.report-scroll {
  flex: 1;
  padding: 40rpx;
}

.generating {
  height: 400rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
  text {
    font-size: 28rpx;
    color: #94a3b8;
  }
}

.report-content {
  .section {
    margin-bottom: 30rpx;
    .st {
      font-size: 28rpx;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 12rpx;
    }
    .sc {
      font-size: 26rpx;
      color: #475569;
      line-height: 1.6;
    }
    .tip-item,
    .sug-item {
      display: flex;
      gap: 12rpx;
      margin-bottom: 8rpx;
      .dot,
      .num {
        color: #4facfe;
        font-weight: bold;
      }
    }
  }
}

.report-footer {
  padding: 30rpx;
  background: #f8fafc;
  .btn-gen {
    height: 88rpx;
    background: #4facfe;
    color: #fff;
    border-radius: 44rpx;
    font-size: 30rpx;
    &::after {
      border: none;
    }
  }
}

.spin {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
