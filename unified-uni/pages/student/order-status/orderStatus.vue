<template>
  <view class="container" :class="{ dark: isDarkMode }">
    <view class="order-status-content">
      <!-- 空状态 -->
      <view v-if="!orderId" class="card-base empty-card">
        <uni-icons type="info" size="64" color="#9ca3af"></uni-icons>
        <text class="empty-title">未找到订单信息</text>
        <text class="empty-desc">请先提交订单后再查看订单状态</text>
        <button class="btn btn-primary" @click="goToOrder">去点餐</button>
      </view>

      <!-- 订单详情卡片 -->
      <view v-else class="card-base order-card">
        <!-- 标题区域 -->
        <view class="header-section">
          <text class="title">订单进度</text>
          <text class="sub-title">订单号: {{ orderId }}</text>
        </view>

        <!-- 自定义步骤条 -->
        <view class="steps-container">
          <view class="step-item" :class="{ active: currentStep >= 0, finished: currentStep > 0 }">
            <view class="step-icon-box">
              <uni-icons v-if="currentStep > 0" type="checkbox-filled" size="20" color="#67c23a"></uni-icons>
              <view v-else class="step-dot"></view>
            </view>
            <text class="step-text">已支付</text>
          </view>
          <view class="step-line" :class="{ active: currentStep >= 1 }"></view>

          <view class="step-item" :class="{ active: currentStep >= 1, finished: currentStep > 1 }">
            <view class="step-icon-box">
              <uni-icons v-if="currentStep > 1" type="checkbox-filled" size="20" color="#67c23a"></uni-icons>
              <uni-icons v-else-if="currentStep === 1" type="spinner-cycle" size="20" color="#409eff"></uni-icons>
              <view v-else class="step-dot"></view>
            </view>
            <text class="step-text">准备中</text>
          </view>
          <view class="step-line" :class="{ active: currentStep >= 2 }"></view>

          <view class="step-item" :class="{ active: currentStep >= 2, finished: currentStep > 2 }">
            <view class="step-icon-box">
              <uni-icons v-if="currentStep > 2" type="checkbox-filled" size="20" color="#67c23a"></uni-icons>
              <uni-icons v-else-if="currentStep === 2" type="gear-filled" size="20" color="#e6a23c"></uni-icons>
              <view v-else class="step-dot"></view>
            </view>
            <text class="step-text">配餐中</text>
          </view>
          <view class="step-line" :class="{ active: currentStep >= 3 }"></view>

          <view class="step-item" :class="{ active: currentStep >= 3, finished: currentStep === 3 }">
            <view class="step-icon-box">
              <uni-icons v-if="currentStep === 3" type="checkbox-filled" size="20" color="#67c23a"></uni-icons>
              <view v-else class="step-dot"></view>
            </view>
            <text class="step-text">已完成</text>
          </view>
        </view>

        <!-- 当前状态大图标展示 -->
        <view class="status-display">
          <view class="status-circle" :class="statusConfig[orderStatus]?.bgClass || 'bg-gray'">
            <uni-icons
              :type="getStatusIcon(orderStatus)"
              size="40"
              :color="statusConfig[orderStatus]?.color || '#909399'"
            ></uni-icons>
          </view>
          <text class="status-main-text">{{ statusConfig[orderStatus]?.text || "处理中" }}</text>
          <text v-if="orderStatus === 'preparing'" class="status-sub-text">预计 {{ estimatedTime }} 分钟</text>
        </view>

        <!-- 订单详情列表 -->
        <view v-if="orderDetails" class="details-section">
          <view class="item-list">
            <view v-for="(item, index) in orderDetails.items" :key="index" class="order-item">
              <view class="item-left">
                <text class="item-name">{{ item.name }}</text>
                <text class="item-qty">×{{ item.quantity }}</text>
              </view>
              <text class="item-price">¥{{ (item.price * item.quantity).toFixed(2) }}</text>
            </view>
          </view>

          <view class="total-row">
            <text class="total-label">总额</text>
            <text class="total-value">¥{{ orderDetails.totalAmount?.toFixed(2) }}</text>
          </view>
        </view>

        <!-- 底部按钮 -->
        <view class="action-buttons">
          <button
            class="btn btn-default"
            :disabled="loading || orderStatus === 'completed'"
            @click="refreshStatus"
            :loading="loading"
          >
            刷新
          </button>

          <button v-if="orderStatus === 'completed'" class="btn btn-primary" @click="goHome">返回首页</button>
          <button v-else class="btn btn-outline" @click="goToOrder">继续点餐</button>
        </view>

        <view v-if="orderStatus === 'completed'" class="footer-msg">
          <text>订单已完成，请到取餐口取餐</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onUnmounted } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { getOrderDetails } from "@/api/meal";

const orderId = ref("");
const orderStatus = ref("paid");
const currentStep = ref(0);
const estimatedTime = ref(15);
const loading = ref(false);
const orderDetails = ref(null);
const isDarkMode = ref(false); // 简单的暗黑模式开关，实际可用 uni.getSystemInfoSync().theme

let refreshTimer = null;

const statusConfig = {
  paid: {
    text: "已支付",
    icon: "checkbox-filled",
    color: "#67c23a",
    bgClass: "bg-green",
    step: 0,
  },
  preparing: {
    text: "正在准备",
    icon: "spinner-cycle", // 对应 Timer
    color: "#409eff",
    bgClass: "bg-blue",
    step: 1,
  },
  ready: {
    text: "机械臂配餐中",
    icon: "gear-filled", // 对应 Setting
    color: "#e6a23c",
    bgClass: "bg-orange",
    step: 2,
  },
  completed: {
    text: "已完成",
    icon: "checkmarkempty", // 对应 CircleCheck
    color: "#67c23a",
    bgClass: "bg-green",
    step: 3,
  },
};

// UniApp 获取 Icon 类型
const getStatusIcon = (status) => {
  return statusConfig[status]?.icon || "info";
};

const goToOrder = () => {
  uni.reLaunch({ url: "/pages/student/order/order" });
};

const goHome = () => {
  uni.reLaunch({ url: "/pages/student/home/home" });
};

const refreshStatus = async () => {
  if (!orderId.value) return;

  loading.value = true;
  try {
    const res = await getOrderDetails(orderId.value);
    if (res.code === 200 || res.success) {
      const data = res.data || {};

      // 更新订单详情
      orderDetails.value = {
        items: data.items || [],
        totalAmount: data.totalAmount || data.price || 0,
        totalNutrition: data.totalNutrition || data.nutrition || null,
        mealType: data.mealType || "",
      };

      // 映射状态
      // 兼容多种可能的后端状态码/字符串
      const statusMap = {
        PAID: "paid",
        PREPARING: "preparing",
        READY: "ready",
        COMPLETED: "completed",
        picked: "completed", // 兼容之前的逻辑
      };

      const rawStatus = data.status?.toUpperCase() || data.status;
      const mappedStatus = statusMap[rawStatus] || data.status;

      if (statusConfig[mappedStatus]) {
        orderStatus.value = mappedStatus;
        currentStep.value = statusConfig[mappedStatus].step;
      }

      if (orderStatus.value === "preparing" && data.estimatedWaitTime) {
        estimatedTime.value = data.estimatedWaitTime;
      } else if (orderStatus.value === "preparing" && estimatedTime.value > 0) {
        // 如果后端没给时间，且当前正在准备，则每刷新一次减少一分钟模拟进度
        estimatedTime.value--;
      }
    }
  } catch (error) {
    console.error("获取订单状态失败:", error);
  } finally {
    loading.value = false;
  }
};

const startAutoRefresh = () => {
  stopAutoRefresh();
  refreshTimer = setInterval(() => {
    if (orderStatus.value !== "completed") {
      refreshStatus();
    } else {
      stopAutoRefresh();
    }
  }, 5000);
};

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
};

onLoad((options) => {
  if (options.orderId) {
    orderId.value = options.orderId;
    refreshStatus();
    startAutoRefresh();
  }
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<style lang="scss" scoped>
/* 变量定义 */
$primary-color: #409eff;
$success-color: #67c23a;
$warning-color: #e6a23c;
$text-main: #303133;
$text-regular: #606266;
$text-secondary: #909399;
$border-color: #ebeef5;
$bg-color: #f9fafb;
$card-bg: #ffffff;

.order-status-content {
  width: 100%;
}
.card-base.order-card {
  box-sizing: border-box;
}

.container {
  height: 100%;
  background-color: $bg-color;
  padding: 30rpx;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: flex-start; // 改为 flex-start 避免内容过少时居中奇怪
}

.card-base {
  background-color: $card-bg;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  padding: 40rpx;
  width: 100%;
}

/* 空状态 */
.empty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 40rpx;
}

.empty-title {
  font-size: 36rpx;
  font-weight: bold;
  color: $text-main;
  margin-top: 30rpx;
  margin-bottom: 16rpx;
}

.empty-desc {
  font-size: 28rpx;
  color: $text-secondary;
  margin-bottom: 48rpx;
}

/* 订单卡片 */
.header-section {
  text-align: center;
  margin-bottom: 40rpx;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: $text-main;
  display: block;
}

.sub-title {
  font-size: 24rpx;
  color: $text-secondary;
  margin-top: 8rpx;
  display: block;
}

/* 自定义步骤条 */
.steps-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 50rpx;
  padding: 0 10rpx;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
}

.step-icon-box {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
}

.step-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background-color: #dcdfe6;
}

.step-text {
  font-size: 24rpx;
  color: $text-secondary;
  margin-top: 10rpx;
}

.step-item.active .step-text {
  color: $text-main;
  font-weight: 500;
}

.step-line {
  flex: 1;
  height: 4rpx;
  background-color: #dcdfe6;
  margin: 0 10rpx;
  margin-bottom: 30rpx; // 调整线的位置以对齐圆点
}

.step-line.active {
  background-color: $success-color;
}

/* 状态展示 */
.status-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40rpx;
}

.status-circle {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
}

.status-main-text {
  font-size: 36rpx;
  font-weight: bold;
  color: $text-main;
}

.status-sub-text {
  font-size: 28rpx;
  color: $text-secondary;
  margin-top: 8rpx;
}

.bg-green {
  background-color: rgba(103, 194, 58, 0.1);
}
.bg-blue {
  background-color: rgba(64, 158, 255, 0.1);
}
.bg-orange {
  background-color: rgba(230, 162, 60, 0.1);
}
.bg-gray {
  background-color: #f4f4f5;
}

/* 订单详情 */
.details-section {
  margin-bottom: 40rpx;
}

.item-list {
  margin-bottom: 24rpx;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 20rpx;
  background-color: #f9fafb;
  border-radius: 8rpx;
  margin-bottom: 12rpx;
}

.item-left {
  display: flex;
  align-items: center;
  flex: 1;
  overflow: hidden;
}

.item-name {
  font-size: 28rpx;
  color: $text-main;
  margin-right: 16rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-qty {
  font-size: 24rpx;
  color: $text-secondary;
}

.item-price {
  font-size: 28rpx;
  color: $text-regular;
  font-weight: 500;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background-color: rgba(64, 158, 255, 0.1);
  border-radius: 8rpx;
  margin-bottom: 24rpx;
}

.total-label {
  font-size: 24rpx;
  color: $text-regular;
}

.total-value {
  font-size: 32rpx;
  font-weight: bold;
  color: $primary-color;
}

/* 按钮 */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 20rpx;
}

.btn {
  font-size: 28rpx;
  padding: 0 40rpx;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 36rpx;
  border: 1px solid transparent;
  background-color: #fff;
  &::after {
    border: none;
  }
}

.btn-primary {
  background-color: $primary-color;
  color: #fff;
}

.btn-outline {
  border-color: $border-color;
  color: $text-regular;
}

.btn-default {
  background-color: #f4f4f5;
  color: $text-regular;
}

.footer-msg {
  text-align: center;
  margin-top: 24rpx;
}

.footer-msg text {
  font-size: 24rpx;
  color: $success-color;
}

/* 暗黑模式简单适配 (如果容器有 dark 类) */
.dark {
  background-color: #111827;
  .card-base {
    background-color: #1f2937;
    box-shadow: none;
  }
  .title,
  .status-main-text,
  .nutri-val,
  .item-name {
    color: #f3f4f6;
  }
  .sub-title,
  .empty-desc,
  .step-text,
  .status-sub-text,
  .item-qty {
    color: #9ca3af;
  }
  .bg-green {
    background-color: rgba(16, 185, 129, 0.2);
  }
  .bg-blue {
    background-color: rgba(59, 130, 246, 0.2);
  }
  .bg-orange {
    background-color: rgba(245, 158, 11, 0.2);
  }
  .order-item {
    background-color: #374151;
  }
  .item-price {
    color: #d1d5db;
  }
  .total-row {
    background-color: rgba(30, 64, 175, 0.2);
  }
  .total-value {
    color: #60a5fa;
  }
  .btn-default {
    background-color: #374151;
    color: #d1d5db;
  }
  .btn-outline {
    border-color: #4b5563;
    color: #d1d5db;
    background: transparent;
  }
}
</style>
