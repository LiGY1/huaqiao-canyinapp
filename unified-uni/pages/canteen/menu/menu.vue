<template>
  <layout>
    <view class="menu-page">
      <!-- 搜索和筛选 -->
      <view class="header-section">
        <view class="search-bar">
          <view class="search-box">
            <uni-icons type="search" size="18" color="#94a3b8"></uni-icons>
            <input v-model="searchKeyword" placeholder="搜索菜品名称" @input="handleSearch" />
          </view>
          <button class="add-btn" @click="handleAdd">
            <uni-icons type="plus" size="16" color="#fff"></uni-icons>
            <text>添加菜品</text>
          </button>
        </view>
        
        <scroll-view scroll-x class="category-tabs">
          <view 
            class="tab-item" 
            :class="{ active: currentCategory === '' }" 
            @click="switchCategory('')"
          >全部</view>
          <view 
            v-for="(label, value) in categories" 
            :key="value"
            class="tab-item"
            :class="{ active: currentCategory === value }"
            @click="switchCategory(value)"
          >{{ label }}</view>
        </scroll-view>
      </view>

      <!-- 菜品列表 -->
      <scroll-view scroll-y class="list-container" @scrolltolower="loadMore">
        <view class="dish-card" v-for="item in menuList" :key="item._id">
          <image :src="item.image || '/static/logo.png'" mode="aspectFill" class="dish-img"></image>
          <view class="dish-info">
            <view class="dish-header">
              <text class="dish-name">{{ item.name }}</text>
              <text class="dish-price">¥{{ item.price }}</text>
            </view>
            <view class="dish-meta">
              <text class="dish-cat">{{ categories[item.category] || item.category }}</text>
              <text class="dish-stock">库存: {{ item.stock }}</text>
            </view>
            <view class="dish-nutrition" v-if="item.nutrition">
              <text>热量: {{ item.nutrition.calories }}kcal</text>
              <text>蛋白质: {{ item.nutrition.protein }}g</text>
            </view>
            <view class="dish-actions">
              <view class="status-switch" @click.stop="toggleStatus(item)">
                <text :class="{ active: item.status === 1 }">{{ item.status === 1 ? '在售' : '下架' }}</text>
                <view class="switch-bg" :class="{ on: item.status === 1 }">
                  <view class="switch-dot"></view>
                </view>
              </view>
              <view class="btn-group">
                <text class="action-btn edit" @click.stop="handleEdit(item)">编辑</text>
                <text class="action-btn delete" @click.stop="handleDelete(item)">删除</text>
              </view>
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
import { getDishList, deleteDish, updateDishStatus } from '@/api/canteen/menu';

const searchKeyword = ref('');
const currentCategory = ref('');
const menuList = ref([]);
const page = ref(1);
const loading = ref(false);
const noMore = ref(false);

const categories = {
  meat: '荤菜',
  vegetable: '素菜',
  mixed: '半荤半素',
  soup: '汤品',
  staple: '主食',
  dessert: '甜点'
};

const fetchList = async (reset = false) => {
  if (reset) {
    page.value = 1;
    menuList.value = [];
    noMore.value = false;
  }
  if (loading.value || noMore.value) return;

  loading.value = true;
  try {
    const res = await getDishList({
      page: page.value,
      pageSize: 10,
      category: currentCategory.value,
      keyword: searchKeyword.value
    });
    
    if (res.code === 200 || res.success) {
      const items = res.data.list || res.data || [];
      if (items.length < 10) noMore.value = true;
      menuList.value = [...menuList.value, ...items];
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

const switchCategory = (cat) => {
  currentCategory.value = cat;
  fetchList(true);
};

const loadMore = () => {
  fetchList();
};

const handleAdd = () => {
  // 跳转到添加/编辑页面，因组件较重，建议移动端拆分页面
  uni.showToast({ title: '添加功能建设中', icon: 'none' });
};

const handleEdit = (item) => {
  uni.showToast({ title: '编辑功能建设中', icon: 'none' });
};

const handleDelete = (item) => {
  uni.showModal({
    title: '提示',
    content: `确定要删除 "${item.name}" 吗？`,
    success: async (res) => {
      if (res.confirm) {
        await deleteDish(item._id);
        fetchList(true);
      }
    }
  });
};

const toggleStatus = async (item) => {
  const newStatus = item.status === 1 ? 0 : 1;
  try {
    const res = await updateDishStatus(item._id, newStatus);
    if (res.code === 200 || res.success) {
      item.status = newStatus;
      uni.showToast({ title: newStatus === 1 ? '已上架' : '已下架', icon: 'success' });
    }
  } catch (e) {
    uni.showToast({ title: '操作失败', icon: 'none' });
  }
};

onMounted(() => {
  fetchList();
});
</script>

<style lang="scss" scoped>
.menu-page {
  background-color: #f8fafc;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header-section {
  background-color: #fff;
  padding: 20rpx 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
  z-index: 10;
}

.search-bar {
  display: flex;
  gap: 20rpx;
  align-items: center;
  margin-bottom: 20rpx;
  
  .search-box {
    flex: 1;
    height: 72rpx;
    background-color: #f1f5f9;
    border-radius: 36rpx;
    padding: 0 24rpx;
    display: flex;
    align-items: center;
    
    input { flex: 1; margin-left: 12rpx; font-size: 26rpx; }
  }
  
  .add-btn {
    width: 200rpx;
    height: 72rpx;
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: #fff;
    border-radius: 36rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26rpx;
    margin: 0;
    padding: 0;
    &::after { border: none; }
    text { margin-left: 6rpx; }
  }
}

.category-tabs {
  white-space: nowrap;
  
  .tab-item {
    display: inline-block;
    padding: 12rpx 32rpx;
    font-size: 28rpx;
    color: #64748b;
    margin-right: 20rpx;
    border-radius: 30rpx;
    background-color: #f8fafc;
    transition: all 0.3s;
    
    &.active {
      background-color: #4facfe;
      color: #fff;
    }
  }
}

.list-container {
  flex: 1;
  padding: 30rpx;
  box-sizing: border-box;
}

.dish-card {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  display: flex;
  gap: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
  
  .dish-img {
    width: 200rpx;
    height: 200rpx;
    border-radius: 16rpx;
    background-color: #f1f5f9;
  }
  
  .dish-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    
    .dish-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      .dish-name { font-size: 32rpx; font-weight: bold; color: #1e293b; }
      .dish-price { font-size: 32rpx; font-weight: bold; color: #ef4444; }
    }
    
    .dish-meta {
      display: flex;
      justify-content: space-between;
      margin-top: 8rpx;
      .dish-cat { font-size: 24rpx; color: #4facfe; background: rgba(79, 172, 254, 0.1); padding: 2rpx 12rpx; border-radius: 6rpx; }
      .dish-stock { font-size: 24rpx; color: #64748b; }
    }
    
    .dish-nutrition {
      display: flex;
      gap: 20rpx;
      margin: 12rpx 0;
      font-size: 22rpx;
      color: #94a3b8;
    }
    
    .dish-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10rpx;
      
      .status-switch {
        display: flex;
        align-items: center;
        gap: 12rpx;
        font-size: 24rpx;
        color: #94a3b8;
        .active { color: #10b981; }
        
        .switch-bg {
          width: 72rpx;
          height: 36rpx;
          background-color: #e2e8f0;
          border-radius: 18rpx;
          position: relative;
          transition: 0.3s;
          &.on { background-color: #10b981; }
          
          .switch-dot {
            width: 28rpx;
            height: 28rpx;
            background-color: #fff;
            border-radius: 50%;
            position: absolute;
            top: 4rpx;
            left: 4rpx;
            transition: 0.3s;
          }
          &.on .switch-dot { left: 40rpx; }
        }
      }
      
      .btn-group {
        display: flex;
        gap: 24rpx;
        .action-btn {
          font-size: 26rpx;
          &.edit { color: #4facfe; }
          &.delete { color: #ef4444; }
        }
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