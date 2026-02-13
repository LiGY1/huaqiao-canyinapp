<template>
  <layout>
    <view class="profile-container">
      <!-- 顶部背景 -->
      <view class="profile-header-bg"></view>

      <view class="profile-content">
        <!-- 用户基本信息卡片 -->
        <view class="user-info-card glass-effect">
          <view class="user-avatar-wrapper">
            <view class="user-avatar">
              <uni-icons type="person-filled" size="60" color="#fff"></uni-icons>
            </view>
            <view class="avatar-badge">
              <uni-icons type="vip-filled" size="14" color="#fff"></uni-icons>
            </view>
          </view>

          <view class="user-details">
            <view class="name-row">
              <text class="user-name">{{ userInfo?.name || "未登录" }}</text>
              <view class="class-tag" v-if="userInfo?.className">
                <text>{{ userInfo?.className }}</text>
              </view>
            </view>
            <text class="user-id">ID: {{ userInfo?.studentId || "N/A" }}</text>
            <view class="balance-row">
              <text class="user-balance">余额: {{ balanceDisplay }} 元</text>
              <button class="recharge-btn" @click="openRechargePopup">充值</button>
            </view>
          </view>
        </view>

        <!-- 身体数据卡片 -->
        <view class="section-card">
          <view class="section-header">
            <view class="section-title-row">
              <uni-icons type="heart-filled" size="18" color="#ff6b81"></uni-icons>
              <text class="card-title">身体数据</text>
            </view>
            <view class="edit-btn" @click="handleEditBodyData">
              <text>更新</text>
              <uni-icons type="right" size="12" color="#999"></uni-icons>
            </view>
          </view>

          <view class="data-grid">
            <view class="data-item">
              <text class="data-label">身高</text>
              <view class="data-value-row">
                <text class="data-value">{{ userInfo?.height || 0 }}</text>
                <text class="data-unit">cm</text>
              </view>
            </view>
            <view class="data-divider"></view>
            <view class="data-item">
              <text class="data-label">体重</text>
              <view class="data-value-row">
                <text class="data-value">{{ userInfo?.weight || 0 }}</text>
                <text class="data-unit">kg</text>
              </view>
            </view>
            <view class="data-divider"></view>
            <view class="data-item">
              <text class="data-label">BMI</text>
              <view class="data-value-row">
                <text class="data-value">{{ calculateBMI() }}</text>
              </view>
            </view>
            <view class="data-divider"></view>
            <view class="data-item">
              <text class="data-label">目标热量</text>
              <view class="data-value-row">
                <text class="data-value">{{ userInfo?.targetCalories || 2000 }}</text>
                <text class="data-unit">kcal</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 健康信息卡片 -->
        <view class="section-card">
          <view class="section-header">
            <view class="section-title-row">
              <uni-icons type="paperclip" size="18" color="#2ed573"></uni-icons>
              <text class="card-title">健康档案</text>
            </view>
          </view>
          <view class="health-list">
            <view class="health-row">
              <text class="health-label">糖尿病史</text>
              <view class="health-tag" :class="userInfo?.diabetes ? 'tag-danger' : 'tag-success'">
                <text>{{ userInfo?.diabetes ? "有" : "无" }}</text>
              </view>
            </view>
            <view class="health-row">
              <text class="health-label">家族遗传病/既往病史</text>
              <view class="health-tag" :class="userInfo?.geneticDisease ? 'tag-warning' : 'tag-success'">
                <text>{{ userInfo?.geneticDisease ? "有" : "无" }}</text>
              </view>
            </view>
            <view class="health-row">
              <text class="health-label">过敏原</text>
              <view class="health-tag" :class="userInfo?.geneticDisease ? 'tag-warning' : 'tag-success'">
                <text>{{ userInfo?.allergens || "无" }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 功能菜单 -->
        <view class="menu-list">
          <view class="menu-item" @click="openOrdersPopup">
            <view class="menu-left">
              <view class="menu-icon-bg color-purple">
                <uni-icons type="list" size="20" color="#fff"></uni-icons>
              </view>
              <text class="menu-text">订单记录</text>
            </view>
            <uni-icons type="right" size="14" color="#ccc"></uni-icons>
          </view>

          <view class="menu-item" @click="openParentsPopup">
            <view class="menu-left">
              <view class="menu-icon-bg color-blue">
                <uni-icons type="staff-filled" size="20" color="#fff"></uni-icons>
              </view>
              <text class="menu-text">监护人信息</text>
            </view>
            <uni-icons type="right" size="14" color="#ccc"></uni-icons>
          </view>
        </view>

        <!-- 退出按钮 -->
        <view class="logout-section">
          <button class="logout-btn" @click="handleLogout">
            <uni-icons type="minus" size="16" color="#ff4757"></uni-icons>
            <text>退出登录</text>
          </button>
        </view>
      </view>

      <!-- 订单记录弹窗 -->
      <!-- 充值弹窗 -->
      <uni-popup ref="rechargePopup" type="center" :mask-click="true">
        <view class="recharge-popup">
          <view class="popup-header">
            <text class="popup-title">充值</text>
            <uni-icons type="closeempty" size="20" color="#999" @click="closeRechargePopup"></uni-icons>
          </view>
          <view class="recharge-body">
            <text class="recharge-label">充值金额 (元)</text>
            <input class="recharge-input" type="number" v-model="rechargeAmount" placeholder="输入金额" />
            <view class="quick-amounts">
              <button class="quick-btn" @click="rechargeAmount = 10">10</button>
              <button class="quick-btn" @click="rechargeAmount = 20">20</button>
              <button class="quick-btn" @click="rechargeAmount = 50">50</button>
              <button class="quick-btn" @click="rechargeAmount = 100">100</button>
            </view>
            <view class="recharge-actions">
              <button class="cancel-btn" @click="closeRechargePopup">取消</button>
              <button class="confirm-btn" @click="handleRecharge">确认充值</button>
            </view>
          </view>
        </view>
      </uni-popup>
      <uni-popup ref="ordersPopup" type="bottom" background-color="#fff">
        <view class="popup-container">
          <view class="popup-header">
            <text class="popup-title">订单记录</text>
            <uni-icons type="closeempty" size="24" color="#999" @click="closeOrdersPopup"></uni-icons>
          </view>
          <scroll-view scroll-y class="popup-content">
            <view class="order-list" v-if="orders.length > 0">
              <view class="order-card" v-for="(order, index) in orders" :key="index">
                <view class="order-card-header">
                  <text class="order-date">{{ order.date }}</text>
                  <text class="order-status">{{ order.status }}</text>
                </view>
                <view class="order-info">
                  <text class="order-food">{{ order.food }}</text>
                  <text class="order-cal">{{ order.calories }} kcal</text>
                </view>
              </view>
            </view>
            <view class="empty-state" v-else>
              <text>暂无订单记录</text>
            </view>
          </scroll-view>
        </view>
      </uni-popup>

      <!-- 监护人信息弹窗 -->
      <uni-popup ref="parentsPopup" type="center" :mask-click="true">
        <view class="center-popup-card">
          <view class="center-popup-header">
            <text class="popup-title">监护人信息</text>
            <uni-icons type="closeempty" size="20" color="#999" @click="closeParentsPopup"></uni-icons>
          </view>
          <view class="parents-list" v-if="parents.length > 0">
            <view class="parent-item" v-for="(parent, index) in parents" :key="index">
              <view class="parent-avatar">
                <text>{{ parent.name[0] }}</text>
              </view>
              <view class="parent-info">
                <text class="parent-name">{{ parent.name }}</text>
                <text class="parent-relation">{{ parent.relation }}</text>
              </view>
              <view class="contact-btn">
                <uni-icons type="phone-filled" size="18" color="#667eea"></uni-icons>
              </view>
            </view>
          </view>
          <view class="empty-state" v-else>
            <text>暂无监护人信息</text>
          </view>
        </view>
      </uni-popup>
    </view>
  </layout>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import layout from "@/components/layout.vue";
import storage from "@/utils/storage";
import { getUserInfo as fetchUserInfo } from "@/api/auth";
import { rechargeApi } from "@/api/student/stu";

// 用户信息
const userInfo = ref(storage.getUserInfo() || {});

// Popups refs
const ordersPopup = ref(null);
const parentsPopup = ref(null);

// 模拟数据
const orders = ref([
  { date: "2026-01-03", status: "已完成", food: "宫保鸡丁 + 米饭", calories: 520 },
  { date: "2026-01-02", status: "已完成", food: "清蒸鱼 + 青菜", calories: 480 },
  { date: "2026-01-01", status: "已完成", food: "红烧肉套餐", calories: 650 },
]);

const parents = ref([
  { name: "张大明", relation: "父亲", phone: "13800138000" },
  { name: "李美丽", relation: "母亲", phone: "13900139000" },
]);

// Recharge popup state
const rechargePopup = ref(null);
const rechargeAmount = ref(0);

const openRechargePopup = () => {
  rechargeAmount.value = 20; // default quick amount
  rechargePopup.value.open();
};

const closeRechargePopup = () => {
  rechargePopup.value.close();
};

const handleRecharge = async () => {
  const amount = Number(rechargeAmount.value);
  if (!amount || amount <= 0) {
    uni.showToast({ title: "请输入有效金额", icon: "none" });
    return;
  }

  uni.showLoading({ title: "充值中..." });
  try {
    const res = await rechargeApi({ amount });
    uni.hideLoading();
    if (res && res.success) {
      // If API returns updated balance, use it; otherwise increment local balance
      if (res.data && res.data.balance !== undefined && res.data.balance !== null) {
        userInfo.value.balance = Number(res.data.balance);
      } else {
        const prev = Number(userInfo.value.balance || 0);
        userInfo.value.balance = prev + amount;
      }
      storage.setUserInfo(userInfo.value);
      uni.showToast({ title: "充值成功", icon: "success" });
      closeRechargePopup();
    } else {
      uni.showToast({ title: (res && res.message) || "充值失败", icon: "none" });
    }
  } catch (e) {
    uni.hideLoading();
    // Try to show backend provided message if available
    let msg = "充值失败";
    try {
      if (e) {
        msg =
          e.message || (e.response && e.response.data && e.response.data.message) || (e.data && e.data.message) || msg;
      }
    } catch (err) {
      // ignore
    }
    uni.showToast({ title: msg, icon: "none" });
    console.error(e);
  }
};

// 计算BMI指数
const calculateBMI = () => {
  const height = userInfo.value.height || 0;
  const weight = userInfo.value.weight || 0;
  if (height === 0 || weight === 0) return "N/A";
  const bmi = weight / Math.pow(height / 100, 2);
  return bmi.toFixed(1);
};

// 获取用户信息
const loadUserInfo = async () => {
  try {
    const response = await fetchUserInfo();
    if (response.success) {
      userInfo.value = response.data;
      storage.setUserInfo(response.data);
    }
  } catch (error) {
    console.error("获取用户信息失败:", error);
  }
};

// 显示余额（保底为 0.00）
const balanceDisplay = computed(() => {
  const b = userInfo.value && userInfo.value.balance;
  if (b === undefined || b === null || isNaN(Number(b))) return "0.00";
  return Number(b).toFixed(2);
});

const handleEditBodyData = () => {
  uni.showToast({ title: "功能开发中", icon: "none" });
};

// Popup handlers
const openOrdersPopup = () => {
  ordersPopup.value.open();
};

const closeOrdersPopup = () => {
  ordersPopup.value.close();
};

const openParentsPopup = () => {
  parentsPopup.value.open();
};

const closeParentsPopup = () => {
  parentsPopup.value.close();
};

// 退出登录处理
const handleLogout = () => {
  uni.showModal({
    title: "确认退出",
    content: "确定要退出登录吗？",
    confirmColor: "#ff4757",
    success: (res) => {
      if (res.confirm) {
        // 清除所有认证信息
        storage.clearAuth();
        // 跳转到登录页
        uni.reLaunch({
          url: "/pages/login/login",
        });
      }
    },
  });
};

// 页面加载时获取用户信息
onMounted(() => {
  loadUserInfo();
});
</script>

<style scoped src="./style.scss"></style>
