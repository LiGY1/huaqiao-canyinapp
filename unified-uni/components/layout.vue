<template>
  <view class="layout-container">
    <!-- 主内容区 -->
    <main class="layout-content">
      <slot></slot>
    </main>

    <!-- 动态tabbar -->
    <commonTabbar v-if="isShowCommonTabbar" :navItems="navItems"></commonTabbar>

    <!-- 食堂抽屉菜单 -->
    <canteenDrawer v-if="role === 'canteen_admin'" :menuItems="navItems"></canteenDrawer>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, unref, watch } from "vue";
import storage from "@/utils/storage";
import commonTabbar from "./commonTabbar.vue";
import canteenDrawer from "./canteenDrawer.vue";
import { getTabbarConfigByRole } from "@/utils/roleConfig";

const props = defineProps({
  showTabbar: {
    type: Boolean,
    default: true,
  },
});

const navItems = ref([]);
const currentUser = ref(null);
const role = ref("");

const isNotCanteen = computed(() => role.value !== "canteen_admin");
const isShowCommonTabbar = computed(() => {
  return unref(props.showTabbar) && unref(isNotCanteen) && unref(navItems).length > 0;
});

// 更新tabbar配置
const updateTabbar = () => {
  // 从storage获取用户信息
  const userInfo = storage.getUserInfo();
  if (userInfo && userInfo.role) {
    currentUser.value = userInfo;
    role.value = userInfo.role;
    // 获取对应角色的tabbar配置
    const tabbarConfig = getTabbarConfigByRole(userInfo.role);
    navItems.value = tabbarConfig.navItems || [];
  } else {
    navItems.value = [];
    role.value = "";
  }
};

// 监听页面显示事件，更新tabbar
const onShow = () => {
  updateTabbar();
  // 使用 fail 回调静默处理非 TabBar 页面的报错
  uni.hideTabBar({
    fail: () => {},
  });
};

// 页面显示时触发
uni.addInterceptor("navigateTo", {
  success() {
    onShow();
  },
});

uni.addInterceptor("redirectTo", {
  success() {
    onShow();
  },
});

uni.addInterceptor("reLaunch", {
  success() {
    onShow();
  },
});

uni.addInterceptor("switchTab", {
  success() {
    onShow();
  },
});

onMounted(() => {
  updateTabbar();
  // 隐藏原生tabbar，确保只显示自定义tabbar
  uni.hideTabBar({
    fail: () => {},
  });
});
</script>

<style scoped>
.layout-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.layout-content {
  flex: 1;
  /* padding-bottom: 30rpx; */
  min-height: 0;
}

.layout-content:has(+ commonTabbar) {
  padding-bottom: 120rpx; /* 有tabbar时增加留白 */
}
</style>
