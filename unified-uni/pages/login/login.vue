<template>
  <view class="page-container">
    <!-- 固定背景，防止键盘弹出时背景变形 -->
    <view class="bg-layer"></view>

    <!-- 滚动区域 -->
    <scroll-view scroll-y class="scroll-content" :show-scrollbar="false">
      <!-- 状态栏占位，适配刘海屏 -->
      <view :style="{ height: statusBarHeight + 'px' }"></view>

      <view class="main-wrapper">
        <!-- 头部标题区 -->
        <view class="header-section">
          <text class="app-name">智慧校园</text>
          <text class="app-slogan">连接学校、家庭与生活的桥梁</text>
        </view>

        <!-- 登录卡片 -->
        <view class="login-card">
          <!-- 身份选择 (胶囊样式) -->
          <view class="role-selector">
            <picker @change="onRoleChange" :value="roleIndex" :range="roles" range-key="label" :disabled="loading">
              <view class="role-trigger" :class="{ 'has-value': roleIndex >= 0 }">
                <view class="role-left">
                  <view class="icon-circle">
                    <uni-icons type="staff-filled" size="20" color="#4f46e5"></uni-icons>
                  </view>
                  <text class="role-text">{{ roleIndex >= 0 ? roles[roleIndex].label : "请选择登录身份" }}</text>
                </view>
                <uni-icons type="right" size="16" color="#9ca3af"></uni-icons>
              </view>
            </picker>
          </view>

          <!-- 输入表单 -->
          <view class="form-group">
            <view class="input-item" :class="{ 'is-focus': focusField === 'username' }">
              <uni-icons
                class="input-icon"
                type="person"
                size="22"
                :color="focusField === 'username' ? '#4f46e5' : '#9ca3af'"
              ></uni-icons>

              <!-- 2. 绑定用户名 -->
              <input
                v-model="formData.username"
                type="text"
                class="input-field"
                placeholder="请输入用户名"
                placeholder-class="input-placeholder"
                :disabled="loading"
                @focus="focusField = 'username'"
                @blur="focusField = ''"
              />
            </view>

            <view class="input-item" :class="{ 'is-focus': focusField === 'password' }">
              <uni-icons
                class="input-icon"
                type="locked"
                size="22"
                :color="focusField === 'password' ? '#4f46e5' : '#9ca3af'"
              ></uni-icons>

              <!-- 3. 绑定密码 -->
              <input
                v-model="formData.password"
                :type="showPassword ? 'text' : 'password'"
                class="input-field"
                placeholder="请输入密码"
                placeholder-class="input-placeholder"
                :disabled="loading"
                @focus="focusField = 'password'"
                @blur="focusField = ''"
              />
              <view class="eye-btn" @click="showPassword = !showPassword">
                <uni-icons
                  :type="showPassword ? 'eye-filled' : 'eye-slash-filled'"
                  size="22"
                  color="#9ca3af"
                ></uni-icons>
              </view>
            </view>
          </view>

          <!-- 功能区 -->
          <view class="action-bar">
            <view class="remember-box" @click="rememberMe = !rememberMe">
              <view class="custom-checkbox" :class="{ checked: rememberMe }">
                <uni-icons v-if="rememberMe" type="checkmarkempty" size="12" color="#fff"></uni-icons>
              </view>
              <text>记住我</text>
            </view>
            <text class="forgot-btn" @click="handleForgetPassword">忘记密码?</text>
          </view>

          <!-- 错误提示 -->
          <view v-if="errorMessage" class="error-banner animate-shake">
            <uni-icons type="info-filled" size="16" color="#ef4444"></uni-icons>
            <text class="error-msg">{{ errorMessage }}</text>
          </view>

          <!-- 登录按钮 (添加 hover-class) -->
          <button @click="handleLogin" class="submit-btn" hover-class="submit-btn-active" :disabled="loading">
            <view v-if="loading" class="spinner"></view>
            <text>{{ loading ? "登录中..." : "立即登录" }}</text>
          </button>
        </view>

        <view class="portal-section">
          <view class="section-title"> </view>

          <view class="grid-box">
            <view class="grid-card blue" hover-class="grid-hover" @click="tip('学生端')">
              <view class="grid-icon-bg">
                <uni-icons type="person-filled" size="24" color="#2563eb"></uni-icons>
              </view>
              <view class="grid-text">
                <text class="main">学生端</text>
                <text class="sub">订餐·营养</text>
              </view>
            </view>

            <view class="grid-card green" hover-class="grid-hover" @click="tip('家长端')">
              <view class="grid-icon-bg">
                <uni-icons type="heart-filled" size="24" color="#16a34a"></uni-icons>
              </view>
              <view class="grid-text">
                <text class="main">家长端</text>
                <text class="sub">监督·关爱</text>
              </view>
            </view>

            <view class="grid-card purple" hover-class="grid-hover" @click="tip('学校端')">
              <view class="grid-icon-bg">
                <uni-icons type="staff-filled" size="24" color="#9333ea"></uni-icons>
              </view>
              <view class="grid-text">
                <text class="main">学校端</text>
                <text class="sub">管理·分析</text>
              </view>
            </view>

            <view class="grid-card orange" hover-class="grid-hover" @click="tip('食堂端')">
              <view class="grid-icon-bg">
                <uni-icons type="cart-filled" size="24" color="#ea580c"></uni-icons>
              </view>
              <view class="grid-text">
                <text class="main">食堂端</text>
                <text class="sub">订单·库存</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 底部安全区占位 -->
        <view class="safe-area-spacer"></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted, unref } from "vue";
import { unifiedLogin, getUserInfo } from "@/api/auth";
import storage from "../../utils/storage";

// -----1. 定义formData对象记录账号密码-------
const formData = ref({
  roleType: "student",
  username: "",
  password: "",
});
// -----------------

const roles = [
  {
    value: "student",
    label: "学生",
    homePage: "/pages/student/home/home",
  },
  {
    value: "parent",
    label: "家长",
    homePage: "/pages/parent/home/home",
  },
  {
    value: "school",
    label: "学校人员（教师/管理员）",
    homePage: "/pages/school/dashboard/dashboard",
  },
  {
    value: "canteen",
    label: "食堂人员",
    homePage: "/pages/canteen/dashboard",
  },
];
const roleIndex = ref(0);

// 登录处理
const handleLogin = async () => {
  errorMessage.value = "";
  if (!validate()) {
    return;
  }
  loading.value = true;

  try {
    // --------------
    // 1. 发送请求进行登录
    const response = await unifiedLogin(unref(formData));

    // 2. 请求成功后保存token等信息
    saveAuth(response);

    // 3. 登录成功，跳转到对应页面
    const homePage = roles[roleIndex.value].homePage;
    uni.switchTab({
      url: homePage,
    });
    // ------------------
  } catch (error) {
    console.error("登录错误:", error);
    errorMessage.value = error.response?.data?.message || "登录失败，请检查用户名和密码";
    redirecting.value = false;
  } finally {
    loading.value = false;
  }
};

const onRoleChange = (e) => {
  roleIndex.value = e.detail.value;
  formData.value.roleType = roles[roleIndex.value].value;
};

// 获取系统状态栏高度
const statusBarHeight = ref(20);
const redirecting = ref(false);

const focusField = ref(""); // 用于控制输入框高亮动画

const showPassword = ref(false);
const loading = ref(false);
const errorMessage = ref("");
const rememberMe = ref(true);

const validate = () => {
  // 验证是否选择了角色
  if (!formData.value.roleType) {
    errorMessage.value = "请选择登录身份";
    return false;
  }

  // 验证用户名和密码
  if (!formData.value.username || !formData.value.password) {
    errorMessage.value = "请输入用户名和密码";
    return false;
  }
  return true;
};

const handleForgetPassword = () => {
  uni.showToast({
    title: "请联系学校管理员重置密码",
    icon: "none",
  });
};

const tip = () => {
  uni.vibrateShort(); // 添加轻微震动反馈
};

const saveAuth = (res) => {
  const { token, userInfo } = res.data;
  const isRemember = rememberMe.value;

  storage.setToken(token, isRemember);
  storage.setUserInfo(userInfo, isRemember);
  storage.setRememberMe(isRemember);

  if (isRemember) {
    const { username, roleType } = formData.value;
    storage.setSavedUsername(username);
    storage.setSavedRoleType(roleType);
  } else {
    storage.removeSavedUsername();
    storage.removeSavedRoleType();
  }

  redirecting.value = true;
};

onMounted(async () => {
  const sysInfo = uni.getSystemInfoSync();
  statusBarHeight.value = sysInfo.statusBarHeight || 20;

  // 恢复记住我状态
  const savedRemember = storage.getRememberMe();
  if (savedRemember) {
    rememberMe.value = true;
    formData.value.username = storage.getSavedUsername() || "";
    const savedRole = storage.getSavedRoleType();
    if (savedRole) {
      formData.value.roleType = savedRole;
      roleIndex.value = roles.findIndex((r) => r.value === savedRole);
    }
  }

  // 检查是否已登录，实现自动登录
  const token = storage.getToken();
  const userInfo = storage.getUserInfo();

  if (token && userInfo) {
    try {
      loading.value = true;
      redirecting.value = true;

      // 验证token是否有效
      const response = await getUserInfo();

      if (response.success) {
        const userData = response.data;

        // 登录成功，跳转到对应页面
        redirectToHome(userData);
      } else {
        // Token无效，清除并显示登录表单
        storage.clearAuth();
        loading.value = false;
        redirecting.value = false;
      }
    } catch (error) {
      // Token验证失败，清除并显示登录表单
      console.warn("Token验证失败，需要重新登录:", error);
      storage.clearAuth();
      loading.value = false;
      redirecting.value = false;
    }
  }
});
</script>

<style lang="scss" scoped src="./style.scss"></style>
