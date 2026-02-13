<template>
  <view 
    v-if="show"
    class="loading-container" 
    :class="{ 'is-inline': inline }"
    :style="{ backgroundColor: !inline && mask ? maskColor : 'transparent' }"
    @touchmove.stop.prevent="preventTouch"
  >
    <view class="loading-wrapper">
      <view 
        class="loading-spinner" 
        :style="{ 
          width: size + 'rpx', 
          height: size + 'rpx', 
          borderTopColor: color,
          borderLeftColor: color,
          borderBottomColor: color 
        }"
      ></view>
      <text 
        v-if="text" 
        class="loading-text"
        :style="{ color: textColor, fontSize: textSize + 'rpx' }"
      >
        {{ text }}
      </text>
    </view>
  </view>
</template>

<script>
export default {
  name: "my-loading",
  props: {
    show: { type: Boolean, default: false },
    text: { type: String, default: '加载中...' },
    color: { type: String, default: '#007aff' },
    textColor: { type: String, default: '#666666' },
    // 局部加载通常背景淡一些，或者透明
    maskColor: { type: String, default: 'rgba(255, 255, 255, 0.9)' },
    mask: { type: Boolean, default: true },
    size: { type: Number, default: 50 },     // 尺寸稍微调小一点适配局部
    textSize: { type: Number, default: 26 },
    
    // 新增：是否为行内模式（非遮罩，仅显示图标）
    inline: { type: Boolean, default: false }
  },
  methods: {
    preventTouch() {
      // 非行内模式下阻止滑动
      if (!this.inline) return;
    }
  }
}
</script>

<style scoped>
/* 默认模式：绝对定位遮罩，填满父容器 */
.loading-container {
  position: absolute; /* 关键：改为 absolute */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10; /* 层级不需要太高，只要比内容高即可 */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 行内模式：流式布局，不绝对定位 */
.loading-container.is-inline {
  position: relative;
  width: 100%;
  height: auto;
  padding: 20rpx 0;
  background-color: transparent;
}

.loading-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  border: 4rpx solid transparent; /* 边框细一点 */
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 10rpx;
}

.loading-text {
  line-height: 1.5;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>