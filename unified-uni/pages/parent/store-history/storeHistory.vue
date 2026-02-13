<template>
  <layout>
    <view class="page-container">
      <!-- 统计概览 -->
      <view class="stats-grid">
        <view class="stat-card">
          <view class="stat-icon bg-orange-100">
            <uni-icons type="cart-filled" size="24" color="#f97316"></uni-icons>
          </view>
          <view class="stat-info">
            <text class="stat-val">{{ statistics.totalOrders }}</text>
            <text class="stat-label">消费次数</text>
          </view>
        </view>
        
        <view class="stat-card">
          <view class="stat-icon bg-green-100">
            <uni-icons type="wallet-filled" size="24" color="#10b981"></uni-icons>
          </view>
          <view class="stat-info">
            <text class="stat-val">¥{{ statistics.totalSpent }}</text>
            <text class="stat-label">消费金额</text>
          </view>
        </view>
      </view>

      <!-- 时间筛选 -->
      <view class="filter-card mt-4">
        <picker mode="date" @change="onDateChange">
          <view class="filter-box">
            <uni-icons type="calendar" size="20" color="#64748b"></uni-icons>
            <text class="filter-txt">{{ dateRangeText || '点击筛选日期' }}</text>
          </view>
        </picker>
      </view>

      <!-- 记录列表 -->
      <view class="records-box mt-4">
        <view v-if="loading" class="loading-state">
           <uni-icons type="spinner-cycle" size="32" color="#94a3b8" class="spin"></uni-icons>
           <text>加载中...</text>
        </view>
        
        <view v-else-if="records.length === 0" class="empty-state">
          <uni-icons type="info" size="64" color="#cbd5e1"></uni-icons>
          <text class="empty-txt">暂无消费记录</text>
        </view>

        <view v-else class="record-list">
          <view v-for="rec in records" :key="rec.id" class="record-card">
            <view class="card-header">
              <view class="store-info">
                <uni-icons type="shop" size="20" color="#f59e0b"></uni-icons>
                <view class="name-box">
                  <text class="store-name">{{ rec.storeName }}</text>
                  <text class="store-time">{{ rec.date }} {{ rec.time }}</text>
                </view>
              </view>
              <text class="record-price">¥{{ rec.totalPrice }}</text>
            </view>

            <view class="location-tag">
              <uni-icons type="location" size="14" color="#64748b"></uni-icons>
              <text>{{ rec.campus }} · {{ rec.building }} · {{ rec.floor }}楼</text>
            </view>

            <view class="items-box">
              <view v-for="item in rec.items" :key="item.id" class="item-row">
                <view class="item-l">
                  <text class="item-name">{{ item.name }}</text>
                  <text v-if="item.category" class="item-cat">{{ item.category }}</text>
                </view>
                <view class="item-r">
                  <text class="item-qty">x{{ item.quantity }}</text>
                  <text class="item-price">¥{{ item.price }}</text>
                </view>
              </view>
            </view>

            <view class="card-footer">
              <view class="status-badge" :style="{ backgroundColor: getStatusColor(rec.status) }">
                {{ rec.status }}
              </view>
              <text class="order-no">订单号: {{ rec.orderNo }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </layout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import layout from '@/components/layout.vue';
import { consumptionApi } from '@/api/parent';

const loading = ref(false);
const records = ref([]);
const statistics = ref({ totalOrders: 0, totalSpent: 0 });
const dateRangeText = ref('');

// 模拟数据 (原有逻辑使用 mockData)
const fetchRecords = async () => {
  loading.value = true;
  try {
    // 实际项目中应调用 consumptionApi.getStoreHistory()
    // 这里先使用模拟数据逻辑
    await new Promise(r => setTimeout(r, 800));
    
    // 模拟数据结构
    const mockRecs = [
      {
        id: '1',
        storeName: '中心食堂1号窗',
        date: '2026-01-05',
        time: '12:30',
        totalPrice: 24.5,
        campus: '主校区',
        building: '第一食堂',
        floor: 1,
        status: '已完成',
        orderNo: 'SX20260105001',
        items: [
          { id: 'i1', name: '红烧肉套餐', quantity: 1, price: 18, category: '荤菜' },
          { id: 'i2', name: '酸梅汤', quantity: 1, price: 6.5, category: '饮品' }
        ]
      },
      {
        id: '2',
        storeName: '校园超市',
        date: '2026-01-05',
        time: '15:20',
        totalPrice: 12.0,
        campus: '主校区',
        building: '生活中心',
        floor: 1,
        status: '已完成',
        orderNo: 'SX20260105088',
        items: [
          { id: 'i3', name: '全麦面包', quantity: 2, price: 6.0, category: '烘焙' }
        ]
      }
    ];
    
    records.value = mockRecs;
    statistics.value = { totalOrders: 23, totalSpent: 456.8 };
  } catch (e) {
  } finally {
    loading.value = false;
  }
};

const onDateChange = (e) => {
  dateRangeText.value = e.detail.value;
  fetchRecords();
};

const getStatusColor = (s) => {
  if (s === '已完成') return '#10b981';
  if (s === '进行中') return '#3b82f6';
  return '#94a3b8';
};

onMounted(() => {
  fetchRecords();
});
</script>

<style lang="scss" scoped>
.page-container {
  padding: 30rpx;
  background-color: #f8fafc;
  min-height: 100vh;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.stat-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.stat-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  &.bg-orange-100 { background: #fff7ed; }
  &.bg-green-100 { background: #f0fdf4; }
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-val {
  font-size: 36rpx;
  font-weight: bold;
  color: #1e293b;
}

.stat-label {
  font-size: 22rpx;
  color: #94a3b8;
}

.filter-card {
  background: #fff;
  padding: 24rpx;
  border-radius: 20rpx;
}

.filter-box {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.filter-txt {
  font-size: 26rpx;
  color: #475569;
}

.records-box {
  min-height: 400rpx;
}

.record-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f1f5f9;
}

.store-info {
  display: flex;
  gap: 16rpx;
}

.store-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #1e293b;
  display: block;
}

.store-time {
  font-size: 22rpx;
  color: #94a3b8;
  margin-top: 4rpx;
  display: block;
}

.record-price {
  font-size: 36rpx;
  font-weight: bold;
  color: #f59e0b;
}

.location-tag {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin: 20rpx 0;
  background: #f8fafc;
  padding: 12rpx 20rpx;
  border-radius: 12rpx;
  font-size: 24rpx;
  color: #64748b;
}

.items-box {
  margin-bottom: 20rpx;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 0;
  border-bottom: 1rpx dashed #f1f5f9;
}

.item-l {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.item-name {
  font-size: 28rpx;
  color: #475569;
}

.item-cat {
  font-size: 18rpx;
  background: #f1f5f9;
  color: #64748b;
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
}

.item-r {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.item-qty { font-size: 24rpx; color: #94a3b8; }
.item-price { font-size: 26rpx; font-weight: bold; color: #475569; min-width: 100rpx; text-align: right; }

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20rpx;
}

.status-badge {
  color: #fff;
  font-size: 20rpx;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
}

.order-no {
  font-size: 20rpx;
  color: #cbd5e1;
}

.loading-state, .empty-state {
  padding: 100rpx 0;
  text-align: center;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.mt-4 { margin-top: 30rpx; }
.spin { animation: rotate 1s linear infinite; }
@keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
