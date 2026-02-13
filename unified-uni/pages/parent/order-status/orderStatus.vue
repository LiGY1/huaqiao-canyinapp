<template>
  <layout>
    <view class="page-container">
      <view class="status-card">
        <view class="header">
          <text class="title">订单进度</text>
          <text class="order-no">订单号: {{ orderId }}</text>
        </view>

        <view class="steps-box">
          <uni-steps :options="stepOptions" :active="currentStep" active-color="#67c23a" />
        </view>

        <view class="status-main">
          <view 
            class="status-icon-box" 
            :class="statusConfig[orderStatus]?.bgClass || 'bg-gray-100'"
          >
            <uni-icons 
              :type="statusConfig[orderStatus]?.uniIcon || 'spinner-cycle'" 
              size="64" 
              :color="statusConfig[orderStatus]?.color || '#94a3b8'"
              :class="{ spin: orderStatus !== 'completed' && orderStatus !== 'failed' }"
            ></uni-icons>
          </view>
          <text class="status-text">{{ statusConfig[orderStatus]?.text || '处理中' }}</text>
          <text v-if="orderStatus === 'preparing'" class="time-hint">
            预计还需 {{ estimatedTime }} 分钟
          </text>
        </view>

        <view class="action-row">
          <button class="sub-btn" :loading="loading" @click="refreshStatus">
            <uni-icons type="refresh" size="16" color="#64748b"></uni-icons>
            刷新状态
          </button>
          
          <button v-if="orderStatus === 'completed'" class="main-btn" type="primary" @click="goHome">
            返回首页
          </button>
          <button v-else class="main-btn" @click="goOrder">
            继续点餐
          </button>
        </view>

        <view v-if="orderStatus !== 'completed'" class="refresh-hint">
          <uni-icons type="info" size="14" color="#3b82f6"></uni-icons>
          <text class="hint-txt">系统将每5秒自动刷新订单状态</text>
        </view>
      </view>
    </view>
  </layout>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import layout from '@/components/layout.vue';
import { mealApi } from '@/api/parent';

const orderId = ref('');
const orderStatus = ref('paid');
const currentStep = ref(0);
const estimatedTime = ref(15);
const loading = ref(false);
let timer = null;

const stepOptions = [
  { title: '已支付', desc: '订单支付成功' },
  { title: '待取餐', desc: '食堂准备中' },
  { title: '配餐中', desc: '机械臂配餐' },
  { title: '已完成', desc: '请及时取餐' }
];

const statusConfig = {
  paid: { text: '已支付', uniIcon: 'checkbox-filled', color: '#67c23a', bgClass: 'bg-green', step: 0 },
  preparing: { text: '正在准备', uniIcon: 'spinner-cycle', color: '#409eff', bgClass: 'bg-blue', step: 1 },
  ready: { text: '配餐中', uniIcon: 'gear-filled', color: '#e6a23c', bgClass: 'bg-orange', step: 2 },
  completed: { text: '已完成', uniIcon: 'checkmarkempty', color: '#67c23a', bgClass: 'bg-green', step: 3 }
};

onLoad((options) => {
  if (options.orderId) orderId.value = options.orderId;
});

const refreshStatus = async () => {
  if (!orderId.value) return;
  loading.value = true;
  try {
    const res = await mealApi.getOrderHistory({ orderId: orderId.value });
    if (res.code === 200 && res.data.list?.length > 0) {
      const order = res.data.list[0];
      orderStatus.value = order.status;
      currentStep.value = statusConfig[orderStatus.value]?.step || 0;
      if (orderStatus.value === 'preparing' && estimatedTime.value > 0) estimatedTime.value--;
      if (orderStatus.value === 'completed') stopRefresh();
    }
  } catch (e) {}
  finally { loading.value = false; }
};

const startRefresh = () => {
  timer = setInterval(refreshStatus, 5000);
};

const stopRefresh = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

const goHome = () => uni.switchTab({ url: '/pages/parent/home/home' });
const goOrder = () => uni.redirectTo({ url: '/pages/parent/order/order' });

onMounted(() => {
  refreshStatus();
  startRefresh();
});

onUnmounted(() => {
  stopRefresh();
});
</script>

<style lang="scss" scoped>
.page-container {
  padding: 30rpx;
  background-color: #f8fafc;
  min-height: 100vh;
}

.status-card {
  background: #fff;
  border-radius: 32rpx;
  padding: 60rpx 40rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.05);
}

.header {
  text-align: center;
  margin-bottom: 60rpx;
}

.title {
  font-size: 40rpx;
  font-weight: bold;
  color: #1e293b;
  display: block;
  margin-bottom: 12rpx;
}

.order-no {
  font-size: 24rpx;
  color: #94a3b8;
}

.steps-box {
  margin-bottom: 80rpx;
}

.status-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;
}

.status-icon-box {
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30rpx;
  &.bg-green { background: #f0fdf4; }
  &.bg-blue { background: #eff6ff; }
  &.bg-orange { background: #fff7ed; }
}

.status-text {
  font-size: 36rpx;
  font-weight: bold;
  color: #1e293b;
}

.time-hint {
  font-size: 26rpx;
  color: #64748b;
  margin-top: 12rpx;
}

.action-row {
  display: flex;
  gap: 24rpx;
  margin-bottom: 40rpx;
}

.sub-btn {
  flex: 1;
  background: #f1f5f9;
  color: #64748b;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  &::after { border: none; }
}

.main-btn {
  flex: 1.5;
  font-size: 28rpx;
}

.refresh-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  background: #f0f7ff;
  padding: 16rpx;
  border-radius: 12rpx;
}

.hint-txt {
  font-size: 22rpx;
  color: #3b82f6;
}

.spin {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>