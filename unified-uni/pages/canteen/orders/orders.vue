<template>
  <layout>
    <view class="orders-page">
      <!-- 统计栏 -->
      <view class="stats-bar">
        <view class="stat-item" v-for="(val, label) in { '今日订单': statistics.totalOrders, '待处理': statistics.statusCount?.paid || 0, '营业额': '¥' + (statistics.totalRevenue || 0).toFixed(2) }" :key="label">
          <text class="stat-val">{{ val }}</text>
          <text class="stat-lab">{{ label }}</text>
        </view>
      </view>

      <!-- 筛选栏 -->
      <view class="filter-section">
        <scroll-view scroll-x class="status-tabs">
          <view 
            v-for="tab in statusTabs" 
            :key="tab.value"
            class="tab-item"
            :class="{ active: currentStatus === tab.value }"
            @click="switchStatus(tab.value)"
          >{{ tab.label }}</view>
        </scroll-view>
        <view class="search-box">
          <uni-icons type="search" size="16" color="#94a3b8"></uni-icons>
          <input v-model="searchKeyword" placeholder="搜索订单号/学生姓名" @input="handleSearch" />
        </view>
      </view>

      <!-- 订单列表 -->
      <scroll-view scroll-y class="list-container" @scrolltolower="loadMore">
        <view class="order-card" v-for="order in orderList" :key="order._id" @click="handleDetail(order)">
          <view class="card-header">
            <text class="order-no">#{{ order.orderNumber.slice(-6) }}</text>
            <text class="order-status" :class="order.status">{{ getStatusText(order.status) }}</text>
          </view>
          
          <view class="card-body">
            <view class="student-info">
              <text class="name">{{ order.studentName }}</text>
              <text class="class">{{ order.className }}</text>
              <text class="meal-tag">{{ getMealText(order.mealType) }}</text>
            </view>
            
            <view class="dish-list">
              <view class="dish-item" v-for="(item, idx) in order.items" :key="idx">
                <text class="dish-name">{{ item.name }}</text>
                <text class="dish-qty">x{{ item.quantity }}</text>
              </view>
            </view>
            
            <view class="location-info">
              <uni-icons type="location-filled" size="14" color="#94a3b8"></uni-icons>
              <text>{{ order.location?.canteen }} · {{ order.location?.floor }} · {{ order.location?.window }}</text>
            </view>
          </view>
          
          <view class="card-footer">
            <text class="time">{{ formatTime(order.orderDate) }}</text>
            <view class="actions" @click.stop>
              <button class="action-btn primary" v-if="order.status === 'paid'" @click="updateStatus(order, 'preparing')">开始制作</button>
              <button class="action-btn success" v-if="order.status === 'preparing'" @click="updateStatus(order, 'ready')">制作完成</button>
              <button class="action-btn warning" v-if="order.status === 'ready'" @click="updateStatus(order, 'completed')">已取餐</button>
            </view>
          </view>
        </view>
        
        <view class="load-more">
          <text v-if="loading">加载中...</text>
          <text v-else-if="noMore">没有更多了</text>
        </view>
      </scroll-view>
    </view>
  </layout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import layout from '@/components/layout.vue';
import { getOrderList, getOrderStatistics, updateOrderStatus } from '@/api/canteen/order';

const orderList = ref([]);
const statistics = ref({});
const currentStatus = ref('');
const searchKeyword = ref('');
const page = ref(1);
const loading = ref(false);
const noMore = ref(false);

const statusTabs = [
  { label: '全部', value: '' },
  { label: '已支付', value: 'paid' },
  { label: '制作中', value: 'preparing' },
  { label: '待取餐', value: 'ready' },
  { label: '已完成', value: 'completed' }
];

const getStatusText = (s) => ({
  paid: '已支付',
  preparing: '制作中',
  ready: '待取餐',
  completed: '已完成',
  cancelled: '已取消'
}[s] || s);

const getMealText = (m) => ({
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐'
}[m] || m);

const formatTime = (t) => {
  const d = new Date(t);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const fetchStats = async () => {
  const res = await getOrderStatistics();
  if (res.code === 200 || res.success) {
    statistics.value = res.data || res;
  }
};

const fetchList = async (reset = false) => {
  if (reset) {
    page.value = 1;
    orderList.value = [];
    noMore.value = false;
  }
  if (loading.value || noMore.value) return;

  loading.value = true;
  try {
    const res = await getOrderList({
      page: page.value,
      pageSize: 10,
      status: currentStatus.value,
      keyword: searchKeyword.value
    });
    if (res.code === 200 || res.success) {
      const items = res.data.list || res.data || [];
      if (items.length < 10) noMore.value = true;
      orderList.value = [...orderList.value, ...items];
      page.value++;
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => fetchList(true);
const switchStatus = (s) => { currentStatus.value = s; fetchList(true); };
const loadMore = () => fetchList();

const updateStatus = async (order, status) => {
  try {
    const res = await updateOrderStatus(order._id, status);
    if (res.code === 200 || res.success) {
      uni.showToast({ title: '更新成功', icon: 'success' });
      fetchList(true);
      fetchStats();
    }
  } catch (e) {
    uni.showToast({ title: '更新失败', icon: 'none' });
  }
};

const handleDetail = (order) => {
  uni.showToast({ title: '详情开发中', icon: 'none' });
};

onMounted(() => {
  fetchStats();
  fetchList();
});
</script>

<style lang="scss" scoped>
.orders-page {
  background-color: #f8fafc;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.stats-bar {
  display: flex;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  padding: 40rpx 30rpx;
  color: #fff;
  
  .stat-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    border-right: 1rpx solid rgba(255,255,255,0.2);
    &:last-child { border-right: none; }
    
    .stat-val { font-size: 36rpx; font-weight: bold; }
    .stat-lab { font-size: 24rpx; opacity: 0.8; margin-top: 8rpx; }
  }
}

.filter-section {
  background-color: #fff;
  padding: 20rpx 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
  z-index: 10;
}

.status-tabs {
  white-space: nowrap;
  margin-bottom: 20rpx;
  .tab-item {
    display: inline-block;
    padding: 10rpx 30rpx;
    font-size: 26rpx;
    color: #64748b;
    margin-right: 16rpx;
    border-radius: 30rpx;
    &.active { background-color: #f1f5f9; color: #4facfe; font-weight: bold; }
  }
}

.search-box {
  height: 72rpx;
  background-color: #f1f5f9;
  border-radius: 36rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  input { flex: 1; margin-left: 12rpx; font-size: 26rpx; }
}

.list-container {
  flex: 1;
  padding: 30rpx;
  box-sizing: border-box;
}

.order-card {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
  
  .card-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 24rpx;
    .order-no { font-size: 28rpx; color: #94a3b8; font-family: monospace; }
    .order-status {
      font-size: 24rpx;
      &.paid { color: #f59e0b; }
      &.preparing { color: #4facfe; }
      &.ready { color: #10b981; }
      &.completed { color: #94a3b8; }
    }
  }
  
  .card-body {
    .student-info {
      display: flex;
      align-items: center;
      gap: 16rpx;
      margin-bottom: 16rpx;
      .name { font-size: 32rpx; font-weight: bold; color: #1e293b; }
      .class { font-size: 24rpx; color: #64748b; }
      .meal-tag { font-size: 20rpx; background: #eff6ff; color: #4facfe; padding: 2rpx 12rpx; border-radius: 6rpx; }
    }
    
    .dish-list {
      background-color: #f8fafc;
      padding: 20rpx;
      border-radius: 12rpx;
      margin-bottom: 16rpx;
      .dish-item {
        display: flex;
        justify-content: space-between;
        font-size: 26rpx;
        color: #475569;
        margin-bottom: 8rpx;
        &:last-child { margin-bottom: 0; }
      }
    }
    
    .location-info {
      display: flex;
      align-items: center;
      gap: 8rpx;
      font-size: 24rpx;
      color: #94a3b8;
    }
  }
  
  .card-footer {
    margin-top: 30rpx;
    padding-top: 24rpx;
    border-top: 1rpx solid #f1f5f9;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .time { font-size: 24rpx; color: #cbd5e1; }
    .actions {
      display: flex;
      gap: 16rpx;
      .action-btn {
        margin: 0;
        height: 60rpx;
        display: flex;
        align-items: center;
        font-size: 24rpx;
        border-radius: 30rpx;
        padding: 0 24rpx;
        color: #fff;
        &::after { border: none; }
        &.primary { background-color: #4facfe; }
        &.success { background-color: #10b981; }
        &.warning { background-color: #f59e0b; }
      }
    }
  }
}

.load-more {
  padding: 30rpx 0;
  text-align: center;
  font-size: 24rpx;
  color: #94a3b8;
}
</style>