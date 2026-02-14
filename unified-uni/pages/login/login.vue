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
          <!-- 输入表单 -->
          <view class="form-group">
            <view class="input-item" :class="{ 'is-focus': focusField === 'username' }">
              <uni-icons
                class="input-icon"
                type="person"
                size="22"
                :color="focusField === 'username' ? '#4f46e5' : '#9ca3af'"
              ></uni-icons>

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

          <!-- 用户协议勾选 -->
          <view class="agreement-box" :class="{ 'shake-animation': agreementShake }">
            <view class="agreement-checkbox" @click="agreeToTerms = !agreeToTerms">
              <view class="custom-checkbox" :class="{ checked: agreeToTerms }">
                <uni-icons v-if="agreeToTerms" type="checkmarkempty" size="12" color="#fff"></uni-icons>
              </view>
              <text class="agreement-text">
                我已阅读并同意
                <text class="link-text" @click.stop="showAgreement('user')">《用户协议》</text>
                和
                <text class="link-text" @click.stop="showAgreement('privacy')">《隐私政策》</text>
              </text>
            </view>
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

        <!-- 验证码弹窗 -->
        <view v-if="showCaptcha" class="captcha-modal" @click="closeCaptcha">
          <view class="captcha-content" @click.stop>
            <view class="captcha-header">
              <text class="captcha-title">安全验证</text>
              <view class="captcha-close" @click="closeCaptcha">
                <uni-icons type="closeempty" size="20" color="#666"></uni-icons>
              </view>
            </view>
            <view class="captcha-body">
              <text class="captcha-tip">请将滑块拖动到最右侧</text>
              <view class="captcha-image-box">
                <view class="captcha-progress-bar">
                  <view class="progress-fill" :style="{ width: sliderProgress + '%' }"></view>
                  <view class="progress-text">{{ sliderProgress }}%</view>
                </view>
              </view>
              <view class="slider-container">
                <view class="slider-track">
                  <view class="slider-fill" :style="{ width: sliderOffset + 'px' }"></view>
                  <view 
                    class="slider-btn" 
                    :style="{ left: sliderOffset + 'px' }"
                    @touchstart="onSliderStart"
                    @touchmove="onSliderMove"
                    @touchend="onSliderEnd"
                  >
                    <uni-icons type="forward" size="20" color="#fff"></uni-icons>
                  </view>
                </view>
                <text class="slider-text">{{ sliderText }}</text>
              </view>
            </view>
          </view>
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
import { ref, computed, onMounted, unref } from "vue";
import { unifiedLogin, getUserInfo, generateCaptcha as fetchCaptcha, verifyCaptcha } from "@/api/auth";
import storage from "../../utils/storage";

// 定义formData对象记录账号密码
const formData = ref({
  username: "",
  password: "",
});

// 角色类型到首页的映射
const roleHomePages = {
  student: "/pages/student/home/home",
  parent: "/pages/parent/home/home",
  school: "/pages/school/dashboard/dashboard",
  canteen: "/pages/canteen/dashboard",
};

const goPage = (url) => {
  uni.switchTab({
    url: url,
    fail: () => {
      uni.redirectTo({
        url: url,
      });
    },
  });
};

// 用户协议相关
const agreeToTerms = ref(false);
const agreementShake = ref(false);

// 验证码相关
const showCaptcha = ref(false);
const loginAttempts = ref(0); // 登录尝试次数
const sliderOffset = ref(0);
const sliderText = ref("向右滑动验证");
const isSliding = ref(false);
const startX = ref(0);
const lastUpdateTime = ref(0); // 用于节流
const maxSliderOffset = ref(240); // 最大滑动距离，动态计算

// 计算滑动百分比（使用computed优化性能）
const sliderProgress = computed(() => {
  return Math.floor((sliderOffset.value / maxSliderOffset.value) * 100);
});

// 生成验证码数据
const generateCaptchaData = () => {
  sliderOffset.value = 0;
  sliderText.value = "向右滑动验证";
  
  // 动态获取滑块轨道宽度
  uni.createSelectorQuery().select('.slider-track').boundingClientRect(data => {
    if (data && data.width) {
      // 轨道宽度减去滑块按钮宽度（80rpx转px）
      const sliderBtnWidth = uni.upx2px(80);
      maxSliderOffset.value = data.width - sliderBtnWidth;
    }
  }).exec();
};

// 滑块操作
const onSliderStart = (e) => {
  isSliding.value = true;
  startX.value = e.touches[0].clientX - sliderOffset.value;
  lastUpdateTime.value = Date.now();
  // 阻止默认行为，防止页面滚动
  e.preventDefault();
};

const onSliderMove = (e) => {
  if (!isSliding.value) return;
  
  // 阻止默认行为和事件冒泡
  e.preventDefault();
  e.stopPropagation();
  
  // 节流：限制更新频率为每16ms一次（约60fps）
  const now = Date.now();
  if (now - lastUpdateTime.value < 16) return;
  lastUpdateTime.value = now;
  
  const currentX = e.touches[0].clientX;
  let offset = currentX - startX.value;
  
  // 限制滑动范围 0-maxSliderOffset
  if (offset < 0) offset = 0;
  if (offset > maxSliderOffset.value) offset = maxSliderOffset.value;
  
  sliderOffset.value = offset;
};

const onSliderEnd = () => {
  if (!isSliding.value) return;
  isSliding.value = false;
  
  // 验证滑块位置（需要滑到90%以上）
  const progress = (sliderOffset.value / maxSliderOffset.value) * 100;
  
  if (progress >= 90) {
    sliderText.value = "验证成功";
    setTimeout(() => {
      showCaptcha.value = false;
      // 验证成功后执行登录
      performLogin();
    }, 500);
  } else {
    sliderText.value = "验证失败，请重试";
    sliderOffset.value = 0;
    setTimeout(() => {
      sliderText.value = "向右滑动验证";
      generateCaptchaData();
    }, 1000);
  }
};

const closeCaptcha = () => {
  showCaptcha.value = false;
  sliderOffset.value = 0;
  sliderText.value = "向右滑动验证";
};

// 显示协议
const showAgreement = (type) => {
  const title = type === "user" ? "用户协议" : "隐私政策";
  const content = type === "user" 
    ? "这里是用户协议的内容。实际项目中应该显示完整的用户协议。"
    : "这里是隐私政策的内容。实际项目中应该显示完整的隐私政策。";
  
  uni.showModal({
    title: title,
    content: content,
    showCancel: false,
    confirmText: "我知道了",
  });
};

// 触发协议抖动动画
const triggerAgreementShake = () => {
  agreementShake.value = true;
  setTimeout(() => {
    agreementShake.value = false;
  }, 500);
};

// 登录处理
const handleLogin = async () => {
  errorMessage.value = "";
  
  // 验证是否同意协议
  if (!agreeToTerms.value) {
    errorMessage.value = "请先阅读并同意用户协议和隐私政策";
    triggerAgreementShake();
    return;
  }
  
  if (!validate()) {
    return;
  }
  
  // 检查是否需要验证码（登录失败3次以上）
  if (loginAttempts.value >= 3) {
    showCaptcha.value = true;
    // 延迟执行，确保DOM已渲染
    setTimeout(() => {
      generateCaptchaData();
    }, 100);
    return;
  }
  
  // 直接登录
  await performLogin();
};

// 执行登录请求
const performLogin = async () => {
  loading.value = true;

  try {
    // 1. 发送请求进行登录（不传roleType，由后端判断）
    const response = await unifiedLogin(unref(formData));

    // 2. 登录成功，重置尝试次数
    loginAttempts.value = 0;

    // 3. 请求成功后保存token等信息
    saveAuth(response);

    // 4. 根据后端返回的角色类型跳转到对应页面
    const roleType = response.data.userInfo.roleType;
    const homePage = roleHomePages[roleType] || "/pages/student/home/home";
    goPage(homePage);
  } catch (error) {
    console.error("登录错误:", error);
    errorMessage.value = error.response?.data?.message || "登录失败，请检查用户名和密码";
    redirecting.value = false;
    
    // 登录失败，增加尝试次数
    loginAttempts.value++;
    
    // 提示用户还有几次机会
    if (loginAttempts.value >= 3) {
      errorMessage.value = "登录失败次数过多，需要进行安全验证";
    } else if (loginAttempts.value >= 2) {
      errorMessage.value += `（还有${3 - loginAttempts.value}次机会后需验证）`;
    }
  } finally {
    loading.value = false;
  }
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
    const { username } = formData.value;
    storage.setSavedUsername(username);
  } else {
    storage.removeSavedUsername();
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

        // 根据角色类型跳转到对应页面
        const roleType = userData.roleType;
        const homePage = roleHomePages[roleType] || "/pages/student/home/home";
        goPage(homePage);
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
