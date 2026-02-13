<template>
  <view class="common-tabbar">
    <view
      v-for="(item, index) in navItems"
      :key="item.path"
      class="tabbar-item"
      :class="{
        active: isActive(item.path),
        'ai-button': item.isAI,
        placeholder: item.isPlaceholder,
      }"
      @click="!item.isPlaceholder && navigate(item.path)"
    >
      <view v-if="item.isAI" class="ai-btn-wrapper">
        <view class="ai-btn-circle">
          <view class="ai-glow"></view>
          <uni-icons :type="item.icon" :size="30" color="#ffffff"></uni-icons>
        </view>
        <!-- <text v-if="item.label" class="tabbar-label">{{ item.label }}</text> -->
      </view>
      <template v-else-if="!item.isPlaceholder">
        <uni-icons :type="item.icon" :size="28" :color="isActive(item.path) ? activeColor : inactiveColor"></uni-icons>
        <text class="tabbar-label" :style="{ color: isActive(item.path) ? activeColor : inactiveColor }">{{
          item.label
        }}</text>
        <view v-if="isActive(item.path)" class="active-indicator"></view>
      </template>
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from "vue";
import navigate from "@/utils/navigate";

const props = defineProps({
  navItems: {
    type: Array,
    default: () => [],
  },
  activeColor: {
    type: String,
    default: "#409EFF",
  },
  inactiveColor: {
    type: String,
    default: "#909399",
  },
});

// 获取当前页面路径
const currentPath = ref(uni.getStorageSync("currentPagePath") || "");

// 初始化当前路径
const initCurrentPath = () => {
  const pages = getCurrentPages();
  if (pages.length > 0) {
    const currentPage = pages[pages.length - 1];
    currentPath.value = currentPage.route;
  }
};

// 监听路由变化
uni.addInterceptor("navigateTo", {
  success() {
    initCurrentPath();
  },
});

uni.addInterceptor("redirectTo", {
  success() {
    initCurrentPath();
  },
});

uni.addInterceptor("reLaunch", {
  success() {
    initCurrentPath();
  },
});

uni.addInterceptor("switchTab", {
  success() {
    initCurrentPath();
  },
});

// 初始化当前路径
initCurrentPath();

// 判断是否为当前激活的路由
const isActive = (path) => {
  return currentPath.value === path;
};

// 使用共享 navigation helper（navigate 已在上方 import）
</script>

<style scoped>
.common-tabbar {
  height: 120rpx;
  background: #ffffff;
  border-top: 1rpx solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 20rpx;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 999;
}

.tabbar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 0 0 20%; /* 5个图标，每个占20% */
  position: relative;
  height: 100%;
  width: 20%;
}

/* 激活状态样式 */
.tabbar-item.active {
  color: #409eff;
}

.tabbar-item .uni-icons {
  color: #909399;
  transition: color 0.3s ease;
}

.tabbar-item.active .uni-icons {
  color: #409eff;
}

.active-indicator {
  width: 4px;
  height: 4px;
  background: #409eff;
  border-radius: 50%;
  margin-top: 2px;
  transition: opacity 0.3s ease;
}

/* AI按钮特殊样式 */
.ai-button {
  position: relative;
  flex: 0 0 20%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-btn-circle {
  width: 70rpx;
  height: 70rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  position: relative;
  margin-bottom: 4rpx;
}

.tabbar-label {
  font-size: 20rpx;
  line-height: 1;
  margin-top: 4rpx;
  white-space: nowrap;
}

.ai-btn-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ai-btn-circle {
  width: 70rpx;
  height: 70rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  position: relative;
}

.ai-glow {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  opacity: 0.5;
  animation: glow 2s infinite;
}

@keyframes glow {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

/* 占位符样式 */
.placeholder {
  pointer-events: none;
  flex: 0 0 20%;
}

/* 确保TabBar均匀分布 */
.common-tabbar {
  justify-content: space-around;
}
</style>
