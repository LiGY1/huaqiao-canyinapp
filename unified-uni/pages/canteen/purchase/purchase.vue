<template>
  <layout>
    <view class="purchase-page">
      <!-- 汇总数据 -->
      <view class="stats-bar">
        <view class="stat-item" v-for="(val, label) in { '待审核': statistics.pending, '采购中': statistics.purchasing, '本月支出': '¥' + (statistics.monthlyAmount || 0).toFixed(2) }" :key="label">
          <text class="val">{{ val }}</text>
          <text class="lab">{{ label }}</text>
        </view>
      </view>

      <!-- 操作栏 -->
      <view class="action-bar">
        <view class="status-picker-wrap">
          <picker :range="statusOptions" range-key="label" @change="onStatusChange">
            <view class="picker-inner">
              <text>{{ currentStatusLabel || '全部状态' }}</text>
              <uni-icons type="bottom" size="14" color="#64748b"></uni-icons>
            </view>
          </picker>
        </view>
        <button class="add-btn" @click="handleCreate">
          <uni-icons type="plus" size="16" color="#fff"></uni-icons>
          <text>新采购单</text>
        </button>
      </view>

      <!-- 采购单列表 -->
      <scroll-view scroll-y class="list-container" @scrolltolower="loadMore">
        <view class="purchase-card" v-for="item in purchaseList" :key="item._id" @click="handleView(item)">
          <view class="card-header">
            <text class="order-no">{{ item.orderNumber }}</text>
            <text class="status-tag" :class="item.status">{{ getStatusText(item.status) }}</text>
          </view>
          
          <view class="card-body">
            <view class="info-row">
              <text class="label">供应商:</text>
              <text class="value">{{ item.supplier }}</text>
            </view>
            <view class="info-row">
              <text class="label">采购项:</text>
              <view class="tags-wrap">
                <text class="item-tag" v-for="(p, idx) in item.items.slice(0, 3)" :key="idx">{{ p.ingredientName }}</text>
                <text class="item-tag more" v-if="item.items.length > 3">...</text>
              </view>
            </view>
            <view class="info-row price-row">
              <text class="label">总金额:</text>
              <text class="total-price">¥{{ item.totalAmount.toFixed(2) }}</text>
            </view>
          </view>
          
          <view class="card-footer">
            <text class="time">{{ formatTime(item.createdAt) }}</text>
            <view class="actions" @click.stop>
              <button class="action-btn success" v-if="item.status === 'pending'" @click="handleAction(item, 'approve')">审核</button>
              <button class="action-btn primary" v-if="['approved', 'purchasing'].includes(item.status)" @click="handleAction(item, 'complete')">完成</button>
              <button class="action-btn delete" v-if="item.status === 'pending'" @click="handleAction(item, 'delete')">删除</button>
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
import { getPurchaseOrderList, getPurchaseStatistics, approvePurchaseOrder, completePurchase, deletePurchaseOrder } from '@/api/canteen/purchase';

const purchaseList = ref([]);
const statistics = ref({});
const currentStatus = ref('');
const currentStatusLabel = ref('');
const page = ref(1);
const loading = ref(false);
const noMore = ref(false);

const statusOptions = [
  { label: '全部', value: '' },
  { label: '待审核', value: 'pending' },
  { label: '已批准', value: 'approved' },
  { label: '采购中', value: 'purchasing' },
  { label: '已完成', value: 'received' }
];

const getStatusText = (s) => ({
  pending: '待审核',
  approved: '已批准',
  purchasing: '采购中',
  received: '已完成',
  rejected: '已拒绝'
}[s] || s);

const formatTime = (t) => {
  const d = new Date(t);
  return `${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const fetchStats = async () => {
  const res = await getPurchaseStatistics();
  if (res.code === 200 || res.success) {
    statistics.value = res.data || res;
  }
};

const fetchList = async (reset = false) => {
  if (reset) {
    page.value = 1;
    purchaseList.value = [];
    noMore.value = false;
  }
  if (loading.value || noMore.value) return;

  loading.value = true;
  try {
    const res = await getPurchaseOrderList({
      page: page.value,
      pageSize: 10,
      status: currentStatus.value
    });
    if (res.code === 200 || res.success) {
      const items = res.data.list || res.data || [];
      if (items.length < 10) noMore.value = true;
      purchaseList.value = [...purchaseList.value, ...items];
      page.value++;
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const onStatusChange = (e) => {
  const sel = statusOptions[e.detail.value];
  currentStatus.value = sel.value;
  currentStatusLabel.value = sel.label;
  fetchList(true);
};

const handleAction = async (item, action) => {
  uni.showModal({
    title: '提示',
    content: `确定要执行 ${action === 'delete' ? '删除' : '操作'} 吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          if (action === 'approve') await approvePurchaseOrder(item._id, { approved: true });
          else if (action === 'complete') await completePurchase(item._id, { actualAmount: item.totalAmount });
          else if (action === 'delete') await deletePurchaseOrder(item._id);
          
          uni.showToast({ title: '操作成功', icon: 'success' });
          fetchList(true);
          fetchStats();
        } catch (e) {
          uni.showToast({ title: '操作失败', icon: 'none' });
        }
      }
    }
  });
};

const handleView = (item) => {
  uni.showToast({ title: '详情开发中', icon: 'none' });
};

const handleCreate = () => {
  uni.showToast({ title: '创建功能开发中', icon: 'none' });
};

const loadMore = () => fetchList();

onMounted(() => {
  fetchStats();
  fetchList();
});
</script>

<style lang="scss" scoped>
.purchase-page {
  background-color: #f8fafc;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.stats-bar {
  display: flex;
  background: #fff;
  padding: 30rpx;
  border-bottom: 1rpx solid #f1f5f9;
  
  .stat-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    border-right: 1rpx solid #f1f5f9;
    &:last-child { border-right: none; }
    .val { font-size: 32rpx; font-weight: bold; color: #1e293b; }
    .lab { font-size: 22rpx; color: #94a3b8; margin-top: 4rpx; }
  }
}

.action-bar {
  background-color: #fff;
  padding: 24rpx 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
  
  .picker-inner {
    display: flex;
    align-items: center;
    gap: 12rpx;
    font-size: 28rpx;
    color: #475569;
    background: #f1f5f9;
    padding: 10rpx 24rpx;
    border-radius: 30rpx;
  }
  
  .add-btn {
    margin: 0;
    height: 72rpx;
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: #fff;
    border-radius: 36rpx;
    display: flex;
    align-items: center;
    padding: 0 30rpx;
    font-size: 26rpx;
    &::after { border: none; }
    text { margin-left: 8rpx; }
  }
}

.list-container {
  flex: 1;
  padding: 30rpx;
  box-sizing: border-box;
}

.purchase-card {
  background-color: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
  
  .card-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 24rpx;
    .order-no { font-size: 26rpx; color: #94a3b8; }
    .status-tag {
      font-size: 22rpx;
      padding: 4rpx 16rpx;
      border-radius: 20rpx;
      &.pending { background: #fff7ed; color: #f59e0b; }
      &.approved { background: #eff6ff; color: #4facfe; }
      &.received { background: #ecfdf5; color: #10b981; }
    }
  }
  
  .card-body {
    .info-row {
      display: flex;
      gap: 16rpx;
      margin-bottom: 16rpx;
      .label { font-size: 26rpx; color: #94a3b8; width: 100rpx; }
      .value { font-size: 26rpx; color: #475569; }
      .tags-wrap {
        display: flex;
        flex-wrap: wrap;
        gap: 10rpx;
        .item-tag { font-size: 22rpx; background: #f1f5f9; color: #64748b; padding: 2rpx 12rpx; border-radius: 6rpx; }
      }
      &.price-row { align-items: baseline; }
      .total-price { font-size: 36rpx; font-weight: bold; color: #ef4444; }
    }
  }
  
  .card-footer {
    border-top: 1rpx solid #f1f5f9;
    padding-top: 24rpx;
    margin-top: 24rpx;
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
        font-size: 24rpx;
        border-radius: 30rpx;
        padding: 0 28rpx;
        display: flex;
        align-items: center;
        background: #f1f5f9;
        color: #64748b;
        &::after { border: none; }
        &.success { background: #10b981; color: #fff; }
        &.primary { background: #4facfe; color: #fff; }
        &.delete { color: #ef4444; }
      }
    }
  }
}

.load-more {
  padding: 40rpx 0;
  text-align: center;
  font-size: 24rpx;
  color: #94a3b8;
}
</style>
