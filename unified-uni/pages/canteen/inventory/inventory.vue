<template>
  <layout>
    <view class="inventory-page">
      <!-- 汇总数据 -->
      <view class="stats-grid">
        <view class="stat-card">
          <text class="label">库存净值</text>
          <text class="value primary">¥{{ stats.totalValue }}</text>
        </view>
        <view class="stat-card">
          <text class="label">预警品类</text>
          <text class="value warning">{{ stats.warningCount }}</text>
        </view>
      </view>

      <!-- 操作栏 -->
      <view class="action-bar">
        <view class="search-box">
          <uni-icons type="search" size="18" color="#94a3b8"></uni-icons>
          <input v-model="searchKeyword" placeholder="搜索食材名称" @input="handleSearch" />
        </view>
        <button class="add-btn" @click="handleEdit()">
          <uni-icons type="plus" size="16" color="#fff"></uni-icons>
          <text>新增</text>
        </button>
      </view>

      <!-- 库存列表 -->
      <scroll-view scroll-y class="list-container" @scrolltolower="loadMore">
        <view class="inventory-item" v-for="item in list" :key="item._id">
          <view class="item-main">
            <view class="item-info">
              <text class="item-name">{{ item.name }}</text>
              <view class="item-tags">
                <text class="item-tag">{{ getCategoryName(item.category) }}</text>
                <text class="item-tag warning" v-if="item.quantity <= item.warningLevel">低库存</text>
              </view>
            </view>
            <view class="item-stock">
              <text class="stock-num" :class="{ warning: item.quantity <= item.warningLevel }">
                {{ item.quantity }}
              </text>
              <text class="stock-unit">{{ item.unit }}</text>
            </view>
          </view>
          
          <view class="item-footer">
            <text class="price">单价: ¥{{ item.unitPrice }}</text>
            <view class="item-actions">
              <text class="action-link" @click="handleStockAction(item, 'in')">入库</text>
              <text class="action-link" @click="handleStockAction(item, 'out')">出库</text>
              <text class="action-link" @click="handleEdit(item)">编辑</text>
              <text class="action-link delete" @click="handleDelete(item)">删除</text>
            </view>
          </view>
        </view>
        
        <view class="load-more">
          <text v-if="loading">加载中...</text>
          <text v-else-if="noMore">没有更多了</text>
        </view>
      </scroll-view>

      <!-- 入库/出库 弹窗 -->
      <uni-popup ref="stockPopup" type="center">
        <view class="popup-content">
          <view class="popup-header">
            <text>{{ popupTitle }}</text>
            <uni-icons type="closeempty" size="20" @click="closePopup"></uni-icons>
          </view>
          <view class="popup-body">
            <view class="form-item">
              <text class="label">数量 ({{ currentItem.unit }})</text>
              <input type="number" v-model="stockForm.quantity" placeholder="请输入操作数量" class="popup-input" />
            </view>
            <view class="form-item">
              <text class="label">备注</text>
              <textarea v-model="stockForm.remark" placeholder="请输入备注 (可选)" class="popup-area" />
            </view>
          </view>
          <view class="popup-footer">
            <button class="cancel-btn" @click="closePopup">取消</button>
            <button class="confirm-btn" @click="submitStockAction">确定</button>
          </view>
        </view>
      </uni-popup>
    </view>
  </layout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import layout from '@/components/layout.vue';
import { getInventoryList, getStatistics, stockIn, stockOut, deleteInventoryItem } from '@/api/canteen/inventory';

const list = ref([]);
const stats = ref({ totalValue: '0.00', warningCount: 0 });
const searchKeyword = ref('');
const loading = ref(false);
const noMore = ref(false);
const page = ref(1);

const stockPopup = ref(null);
const popupTitle = ref('');
const currentItem = ref({});
const stockActionType = ref('');
const stockForm = reactive({ quantity: '', remark: '' });

const categoryMap = {
  meat: '肉类',
  vegetable: '蔬菜',
  grain: '粮食',
  seasoning: '调料',
  oil: '油脂',
  dairy: '乳制品',
  other: '其他'
};

const getCategoryName = (cat) => categoryMap[cat] || '其他';

const fetchStats = async () => {
  const res = await getStatistics();
  if (res.code === 200 || res.success) {
    stats.value = {
      totalValue: (res.data.totalValue || 0).toFixed(2),
      warningCount: res.data.warningCount || 0
    };
  }
};

const fetchList = async (reset = false) => {
  if (reset) {
    page.value = 1;
    list.value = [];
    noMore.value = false;
  }
  if (loading.value || noMore.value) return;
  
  loading.value = true;
  try {
    const res = await getInventoryList({
      page: page.value,
      pageSize: 10,
      keyword: searchKeyword.value
    });
    if (res.code === 200 || res.success) {
      const items = res.data.list || res.data || [];
      if (items.length < 10) noMore.value = true;
      list.value = [...list.value, ...items];
      page.value++;
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  fetchList(true);
};

const loadMore = () => {
  fetchList();
};

const handleStockAction = (item, type) => {
  currentItem.value = item;
  stockActionType.value = type;
  popupTitle.value = type === 'in' ? '增加库存' : '消耗库存';
  stockForm.quantity = '';
  stockForm.remark = '';
  stockPopup.value.open();
};

const closePopup = () => {
  stockPopup.value.close();
};

const submitStockAction = async () => {
  if (!stockForm.quantity || stockForm.quantity <= 0) {
    uni.showToast({ title: '请输入有效数量', icon: 'none' });
    return;
  }
  
  try {
    const api = stockActionType.value === 'in' ? stockIn : stockOut;
    const res = await api(currentItem.value._id, stockForm);
    if (res.code === 200 || res.success) {
      uni.showToast({ title: '操作成功', icon: 'success' });
      closePopup();
      fetchList(true);
      fetchStats();
    }
  } catch (e) {
    uni.showToast({ title: e.message || '操作失败', icon: 'none' });
  }
};

const handleEdit = (item) => {
  // 简易逻辑：跳转到详情或编辑页
  uni.showToast({ title: '编辑功能建设中', icon: 'none' });
};

const handleDelete = (item) => {
  uni.showModal({
    title: '提示',
    content: `确定要删除 "${item.name}" 吗？`,
    success: async (res) => {
      if (res.confirm) {
        await deleteInventoryItem(item._id);
        fetchList(true);
        fetchStats();
      }
    }
  });
};

onMounted(() => {
  fetchStats();
  fetchList();
});
</script>

<style lang="scss" scoped>
.inventory-page {
  padding: 30rpx;
  background-color: #f8fafc;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
  margin-bottom: 30rpx;
  
  .stat-card {
    background-color: #fff;
    padding: 30rpx;
    border-radius: 20rpx;
    box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
    display: flex;
    flex-direction: column;
    
    .label { font-size: 24rpx; color: #64748b; margin-bottom: 8rpx; }
    .value {
      font-size: 36rpx;
      font-weight: bold;
      &.primary { color: #4facfe; }
      &.warning { color: #f59e0b; }
    }
  }
}

.action-bar {
  display: flex;
  gap: 20rpx;
  margin-bottom: 30rpx;
  
  .search-box {
    flex: 1;
    height: 80rpx;
    background-color: #fff;
    border-radius: 40rpx;
    padding: 0 30rpx;
    display: flex;
    align-items: center;
    box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
    
    input { flex: 1; margin-left: 16rpx; font-size: 28rpx; }
  }
  
  .add-btn {
    width: 160rpx;
    height: 80rpx;
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: #fff;
    border-radius: 40rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28rpx;
    padding: 0;
    margin: 0;
    &::after { border: none; }
    text { margin-left: 8rpx; }
  }
}

.list-container {
  flex: 1;
  overflow: hidden;
}

.inventory-item {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
  
  .item-main {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20rpx;
    
    .item-name { font-size: 32rpx; font-weight: bold; color: #1e293b; }
    .item-tags {
      display: flex;
      gap: 12rpx;
      margin-top: 10rpx;
      .item-tag {
        font-size: 20rpx;
        padding: 4rpx 12rpx;
        background-color: #f1f5f9;
        color: #64748b;
        border-radius: 6rpx;
        &.warning { background-color: #fee2e2; color: #ef4444; }
      }
    }
    
    .item-stock {
      text-align: right;
      .stock-num {
        font-size: 44rpx;
        font-weight: bold;
        color: #1e293b;
        &.warning { color: #ef4444; }
      }
      .stock-unit { font-size: 24rpx; color: #94a3b8; margin-left: 4rpx; }
    }
  }
  
  .item-footer {
    padding-top: 20rpx;
    border-top: 1rpx solid #f1f5f9;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .price { font-size: 26rpx; color: #94a3b8; }
    .item-actions {
      display: flex;
      gap: 30rpx;
      .action-link {
        font-size: 26rpx;
        color: #4facfe;
        &.delete { color: #ef4444; }
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

.popup-content {
  width: 600rpx;
  background-color: #fff;
  border-radius: 30rpx;
  padding: 40rpx;
  
  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40rpx;
    text { font-size: 32rpx; font-weight: bold; color: #1e293b; }
  }
  
  .form-item {
    margin-bottom: 30rpx;
    .label { font-size: 26rpx; color: #64748b; margin-bottom: 16rpx; display: block; }
    .popup-input {
      height: 88rpx;
      background-color: #f8fafc;
      border-radius: 16rpx;
      padding: 0 30rpx;
      font-size: 30rpx;
      border: 1rpx solid #e2e8f0;
    }
    .popup-area {
      width: 100%;
      height: 160rpx;
      background-color: #f8fafc;
      border-radius: 16rpx;
      padding: 20rpx 30rpx;
      font-size: 28rpx;
      border: 1rpx solid #e2e8f0;
    }
  }
  
  .popup-footer {
    display: flex;
    gap: 20rpx;
    margin-top: 20rpx;
    button {
      flex: 1;
      height: 88rpx;
      border-radius: 44rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 30rpx;
      &::after { border: none; }
    }
    .cancel-btn { background-color: #f1f5f9; color: #64748b; }
    .confirm-btn { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: #fff; }
  }
}
</style>
