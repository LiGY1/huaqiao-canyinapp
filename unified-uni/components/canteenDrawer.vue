<template>
  <view>
    <!-- 悬浮菜单按钮 -->
    <view class="menu-trigger" @click="openMenu">
      <uni-icons type="bars" size="24" color="#64748b"></uni-icons>
    </view>

    <!-- 侧边抽屉（自定义实现，替代 uni-drawer，避免组件方法差异） -->
    <view v-show="visible" class="drawer-mask" @click="closeMenu"></view>
    <view :class="['drawer-panel', { open: visible }]">
      <view class="drawer-content">
        <!-- 头部 -->
        <view class="drawer-header">
          <text class="title">智膳伙伴</text>
          <uni-icons type="closeempty" size="24" color="#94a3b8" @click="closeMenu"></uni-icons>
        </view>

        <!-- 菜单列表 -->
        <scroll-view scroll-y class="menu-list">
          <view v-if="menuList.length === 0" class="empty-list">
            <text class="empty-text">暂无菜单项</text>
          </view>
          <view
            v-for="(item, index) in menuList"
            :key="item.path || index"
            class="menu-item"
            :class="{ active: currentPath === item.path }"
            @click="handleNavigate(item)"
          >
            <view class="icon-wrap">
              <uni-icons
                :type="item.icon"
                size="22"
                :color="currentPath === item.path ? '#4facfe' : '#64748b'"
              ></uni-icons>
            </view>
            <text class="label">{{ item.label }}</text>
          </view>
        </scroll-view>

        <!-- 底部退出 -->
        <view class="drawer-footer">
          <button class="logout-btn" @click="handleLogout">
            <uni-icons type="paperplane" size="18" color="#fff"></uni-icons>
            <text>退出登录</text>
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from "vue";
import storage from "@/utils/storage";
import { logout } from "@/api/canteen/auth";
import { getTabbarConfigByRole } from "@/utils/roleConfig";
import navigate from "@/utils/navigate";

const props = defineProps({
  menuItems: { type: Array, default: () => [] },
});

// 菜单数据：优先使用传入的 prop，否则根据当前用户 role 回退到 roleConfig
const menuList = computed(() => {
  const provided = props.menuItems || [];
  if (provided.length) return provided;
  const user = storage.getUserInfo();
  const role = user && user.role ? user.role : "";
  const cfg = getTabbarConfigByRole(role);
  return cfg && cfg.navItems ? cfg.navItems : [];
});

// 控制自定义抽屉显隐
const visible = ref(false);
const currentPath = ref("");

// 根据当前页面路径标记激活项
const updateCurrentPath = () => {
  const pages = getCurrentPages();
  if (pages.length) {
    currentPath.value = pages[pages.length - 1].route;
  }
};

const openMenu = () => {
  updateCurrentPath();
  visible.value = true;
};

const closeMenu = () => {
  visible.value = false;
};

const handleNavigate = (item) => {
  closeMenu();
  const path = item && item.path ? item.path : item;
  navigate(path);
};

const handleLogout = () => {
  uni.showModal({
    title: "提示",
    content: "确定要退出登录吗？",
    success: async (res) => {
      if (res.confirm) {
        try {
          await logout();
          storage.clearAuth();
          uni.reLaunch({ url: "/pages/login/login" });
        } catch (e) {
          storage.clearAuth();
          uni.reLaunch({ url: "/pages/login/login" });
        }
      }
    },
  });
};
</script>

<style lang="scss" scoped>
.menu-trigger {
  position: fixed;
  /* 放置到页面头部标题栏内，使用安全区偏移避免被状态栏/刘海遮挡 */
  left: calc(env(safe-area-inset-left) + 24rpx);
  top: calc(env(safe-area-inset-top) + 12rpx);
  /* 略微缩小，使其更贴合标题栏尺寸 */
  width: 64rpx;
  height: 64rpx;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6rpx 14rpx rgba(0, 0, 0, 0.06);
  /* 保持在 mask 之上，但低于抽屉面板（以便面板打开时覆盖按钮） */
  z-index: 10020;
  border: 1rpx solid #e6eef6;
}

.drawer-content {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #fff;
}

.drawer-header {
  padding: 80rpx 40rpx 40rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .title {
    font-size: 40rpx;
    font-weight: 800;
    color: #334155;
    letter-spacing: 2rpx;
  }
}

.menu-list {
  flex: 1;
  padding: 0 20rpx;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 28rpx 32rpx;
  margin-bottom: 8rpx;
  border-radius: 16rpx;
  gap: 24rpx;
  transition: all 0.2s;

  .icon-wrap {
    width: 48rpx;
    height: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .label {
    font-size: 30rpx;
    color: #475569;
  }

  &.active {
    background-color: #f1f5f9;
    .label {
      color: #1e293b;
      font-weight: 600;
    }
  }

  /* 为第一个（AI数据大屏）设置蓝色 */
  &:first-child .label {
    color: #3b82f6;
  }
  &:first-child .icon-wrap :deep(.uni-icons) {
    color: #3b82f6 !important;
  }
}

.drawer-footer {
  padding: 40rpx;
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #f1f5f9;

  .logout-btn {
    height: 90rpx;
    background: #ff6b6b;
    color: #fff;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    font-size: 30rpx;
    box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.3);
    &::after {
      border: none;
    }
  }
}

/* 遮罩层和抽屉面板样式 */
.drawer-mask {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 10010;
}

.drawer-panel {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 560rpx; /* 保持和原先 280 的宽度对应（视设计 rpx 比例而定） */
  transform: translateX(-100%);
  transition: transform 0.28s ease;
  z-index: 10030;
  display: flex;
  flex-direction: column;
}

.drawer-panel.open {
  transform: translateX(0);
}
</style>
