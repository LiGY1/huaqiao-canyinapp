<template>
  <layout>
    <view class="dashboard-page">
      <!-- 统计卡片 -->
      <view class="stats-grid">
        <view class="stat-card" v-for="(stat, index) in stats" :key="index">
          <view class="stat-icon" :class="stat.type">
            <uni-icons :type="stat.icon" size="24" color="#fff"></uni-icons>
          </view>
          <view class="stat-info">
            <text class="stat-value">{{ stat.value }}</text>
            <text class="stat-label">{{ stat.label }}</text>
          </view>
        </view>
      </view>

      <!-- 快捷入口 -->
      <view class="section-card">
        <view class="section-title">快捷功能</view>
        <view class="quick-nav">
          <view class="nav-item" v-for="(nav, index) in quickNavs" :key="index" @click="handleNav(nav.url)">
            <view class="nav-icon" :style="{ background: nav.color }">
              <uni-icons :type="nav.icon" size="26" color="#fff"></uni-icons>
            </view>
            <text class="nav-text">{{ nav.label }}</text>
          </view>
        </view>
      </view>

      <!-- 实时预警 -->
      <view class="section-card">
        <view class="section-title">
          <text>实时预警</text>
          <text class="more-btn" @click="handleNav('inventory/inventory')">查看全部</text>
        </view>
        <view class="warning-list" v-if="warnings.length">
          <view class="warning-item" v-for="(item, index) in warnings" :key="index">
            <uni-icons type="warn-filled" size="18" color="#ef4444"></uni-icons>
            <view class="warning-content">
              <text class="warning-name">{{ item.name }}</text>
              <text class="warning-desc">当前存储不足: {{ item.currentStock }}{{ item.unit }}</text>
            </view>
            <button class="handle-btn" size="mini" @click="handleNav('purchase/purchase')">补充</button>
          </view>
        </view>
        <view class="empty-box" v-else>
          <uni-icons type="checkbox-filled" size="40" color="#10b981"></uni-icons>
          <text>暂无库存预警</text>
        </view>
      </view>

      <!-- AI 建议概览 -->
      <view class="section-card ai-suggestion">
        <view class="section-title">
          <text>AI 智能建议</text>
          <uni-icons type="sparkles" size="18" color="#4facfe"></uni-icons>
        </view>
        <view class="ai-content">
          <view class="ai-item" v-for="(item, index) in aiSuggestions" :key="index">
            <text class="ai-tag">生产推荐</text>
            <text class="ai-text">预计今日「{{ item.dish }}」销售较好，建议生产 {{ item.suggestedProduction }} 份。</text>
          </view>
        </view>
      </view>
    </view>
  </layout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import layout from '@/components/layout.vue';
import { getDashboardStats, getInventoryWarnings } from '@/api/canteen/dashboard';
import { getProductionStatistics } from '@/api/canteen/production';

const stats = ref([
  { label: '今日销售额', value: '¥0.00', icon: 'wallet-filled', type: 'primary' },
  { label: '今日订单', value: '0', icon: 'cart-filled', type: 'success' },
  { label: '库存预警', value: '0', icon: 'info-filled', type: 'warning' },
  { label: '平均评分', value: '4.8', icon: 'star-filled', type: 'error' }
]);

const quickNavs = [
  { label: '点餐记录', icon: 'list', url: 'orders/orders', color: '#4facfe' },
  { label: '菜单管理', icon: 'shop', url: 'menu/menu', color: '#10b981' },
  { label: '生产计划', icon: 'paperplane', url: 'production/production', color: '#f59e0b' },
  { label: '库存采购', icon: 'bars', url: 'inventory/inventory', color: '#8b5cf6' }
];

const warnings = ref([]);
const aiSuggestions = ref([]);

const fetchData = async () => {
  try {
    const res = await getDashboardStats();
    if (res.code === 200 || res.success) {
      stats.value[0].value = `¥${res.data.todaySales || 0}`;
      stats.value[1].value = res.data.todayOrders || 0;
      stats.value[2].value = res.data.lowStockCount || 0;
    }
    
    const warnRes = await getInventoryWarnings();
    if (warnRes.code === 200 || warnRes.success) {
      warnings.value = warnRes.data.slice(0, 3);
    }

    // 模拟AI建议
    aiSuggestions.value = [
      { dish: '红烧肉', suggestedProduction: 80 },
      { dish: '清蒸鱼', suggestedProduction: 45 }
    ];
  } catch (e) {
    console.error(e);
  }
};

const handleNav = (url) => {
  uni.navigateTo({
    url: `/pages/canteen/${url}`
  });
};

onMounted(() => {
  fetchData();
});
</script>

<style lang="scss" scoped>
.dashboard-page {
  padding: 30rpx;
  background-color: #f8fafc;
  min-height: calc(100vh - 120rpx);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
  margin-bottom: 30rpx;
}

.stat-card {
  background-color: #fff;
  padding: 30rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);

  .stat-icon {
    width: 80rpx;
    height: 80rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 20rpx;
    
    &.primary { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
    &.success { background: linear-gradient(135deg, #10b981 0%, #34d399 100%); }
    &.warning { background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); }
    &.error { background: linear-gradient(135deg, #ef4444 0%, #f87171 100%); }
  }

  .stat-info {
    display: flex;
    flex-direction: column;
    .stat-value { font-size: 32rpx; font-weight: bold; color: #1e293b; }
    .stat-label { font-size: 24rpx; color: #64748b; margin-top: 4rpx; }
  }
}

.section-card {
  background-color: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #1e293b;
  margin-bottom: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .more-btn { font-size: 24rpx; font-weight: normal; color: #4facfe; }
}

.quick-nav {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20rpx;
  
  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .nav-icon {
      width: 90rpx;
      height: 90rpx;
      border-radius: 24rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12rpx;
    }
    .nav-text { font-size: 24rpx; color: #475569; }
  }
}

.warning-list {
  .warning-item {
    display: flex;
    align-items: center;
    padding: 24rpx 0;
    border-bottom: 1rpx solid #f1f5f9;
    &:last-child { border-bottom: none; }
    
    .warning-content {
      flex: 1;
      margin: 0 20rpx;
      display: flex;
      flex-direction: column;
      .warning-name { font-size: 28rpx; font-weight: 500; color: #1e293b; }
      .warning-desc { font-size: 24rpx; color: #94a3b8; margin-top: 4rpx; }
    }
    
    .handle-btn {
      margin: 0;
      background-color: #f1f5f9;
      color: #475569;
      font-size: 22rpx;
      padding: 0 24rpx;
      border-radius: 30rpx;
      &::after { border: none; }
    }
  }
}

.empty-box {
  padding: 40rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #94a3b8;
  font-size: 26rpx;
  uni-icons { margin-bottom: 16rpx; }
}

.ai-suggestion {
  background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
  border: 1rpx solid rgba(79, 172, 254, 0.1);
  
  .ai-content {
    .ai-item {
      display: flex;
      gap: 16rpx;
      margin-bottom: 20rpx;
      &:last-child { margin-bottom: 0; }
      
      .ai-tag {
        font-size: 20rpx;
        padding: 4rpx 12rpx;
        background-color: #4facfe;
        color: #fff;
        border-radius: 8rpx;
        white-space: nowrap;
        height: min-content;
      }
      .ai-text { font-size: 26rpx; color: #334155; line-height: 1.5; }
    }
  }
}
</style>