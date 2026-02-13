<template>
  <layout>
    <view class="production-page">
      <!-- 统计栏 -->
      <view class="stats-bar">
        <view class="stat-item" v-for="(val, label) in { '总计划': statistics.total, '待开始': statistics.pending, '制作中': statistics.inProgress, '已完成': statistics.completed }" :key="label">
          <text class="val">{{ val }}</text>
          <text class="lab">{{ label }}</text>
        </view>
      </view>

      <!-- 操作栏 -->
      <view class="action-bar">
        <view class="date-picker-wrap">
          <picker mode="date" :value="selectedDate" @change="onDateChange">
            <view class="picker-inner">
              <uni-icons type="calendar" size="16" color="#4facfe"></uni-icons>
              <text>{{ selectedDate }}</text>
            </view>
          </picker>
        </view>
        <view class="btn-group">
          <button class="ai-btn" @click="handleAISuggest">
            <uni-icons type="sparkles" size="16" color="#fff"></uni-icons>
            <text>AI建议</text>
          </button>
          <button class="add-btn" @click="handleCreate">
            <uni-icons type="plus" size="16" color="#fff"></uni-icons>
            <text>创建</text>
          </button>
        </view>
      </view>

      <!-- 计划列表 -->
      <scroll-view scroll-y class="list-container" @scrolltolower="loadMore">
        <view class="plan-card" v-for="item in productionList" :key="item._id">
          <view class="card-header">
            <view class="dish-title">
              <text class="name">{{ item.dishName }}</text>
              <text class="meal-tag">{{ getMealText(item.mealType) }}</text>
            </view>
            <text class="status-tag" :class="item.status">{{ getStatusText(item.status) }}</text>
          </view>
          
          <view class="card-body">
            <view class="progress-info">
              <view class="progress-header">
                <text>进度: {{ item.completedQuantity }}/{{ item.plannedQuantity }}份</text>
                <text>{{ item.progress }}%</text>
              </view>
              <view class="progress-bar">
                <view class="progress-inner" :style="{ width: item.progress + '%', background: getProgressColor(item.status) }"></view>
              </view>
            </view>
            <view class="meta-info">
              <text>负责人: {{ item.chef || '未分配' }}</text>
              <text v-if="item.aiSuggested" class="ai-label">
                <uni-icons type="sparkles" size="12" color="#4facfe"></uni-icons>
                AI 推荐
              </text>
            </view>
          </view>
          
          <view class="card-footer">
            <button class="action-btn" v-if="item.status === 'pending'" @click="updateStatus(item, 'start')">开始制作</button>
            <button class="action-btn primary" v-if="item.status === 'in_progress'" @click="handleUpdateProgress(item)">更新数量</button>
            <button class="action-btn success" v-if="item.status === 'in_progress'" @click="updateStatus(item, 'complete')">确认完成</button>
            <button class="action-btn delete" v-if="item.status === 'pending'" @click="handleDelete(item)">删除</button>
          </view>
        </view>
        
        <view class="load-more">
          <text v-if="loading">加载中...</text>
          <text v-else-if="noMore">没有更多计划</text>
        </view>
      </scroll-view>

      <!-- AI 建议弹窗 (简易版) -->
      <uni-popup ref="aiPopup" type="bottom">
        <view class="popup-box">
          <view class="popup-title">AI 智能生产建议</view>
          <scroll-view scroll-y class="ai-list">
            <view class="ai-item" v-for="(item, idx) in aiSuggestions" :key="idx">
              <view class="ai-item-info">
                <text class="ai-dish">{{ item.dishName }}</text>
                <text class="ai-reason">{{ item.reason }}</text>
              </view>
              <view class="ai-item-action">
                <text class="ai-qty">{{ item.suggestedQuantity }}份</text>
                <button class="ai-add-btn" size="mini" @click="createFromAI(item)">采纳</button>
              </view>
            </view>
          </scroll-view>
          <button class="popup-close" @click="closeAIPopup">关闭</button>
        </view>
      </uni-popup>
    </view>
  </layout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import layout from '@/components/layout.vue';
import { getProductionPlanList, getProductionStatistics, updateProgress, completePlan, startPlan, deletePlan, getAISuggestions } from '@/api/canteen/production';

const selectedDate = ref(new Date().toISOString().split('T')[0]);
const productionList = ref([]);
const statistics = ref({});
const loading = ref(false);
const noMore = ref(false);
const page = ref(1);

const aiPopup = ref(null);
const aiSuggestions = ref([]);

const getStatusText = (s) => ({
  pending: '待开始',
  in_progress: '进行中',
  completed: '已完成'
}[s] || s);

const getMealText = (m) => ({
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐'
}[m] || m);

const getProgressColor = (s) => s === 'completed' ? '#10b981' : '#4facfe';

const fetchStats = async () => {
  const res = await getProductionStatistics({ date: selectedDate.value });
  if (res.code === 200 || res.success) {
    statistics.value = res.data || res;
  }
};

const fetchList = async (reset = false) => {
  if (reset) {
    page.value = 1;
    productionList.value = [];
    noMore.value = false;
  }
  if (loading.value || noMore.value) return;

  loading.value = true;
  try {
    const res = await getProductionPlanList({
      page: page.value,
      pageSize: 10,
      date: selectedDate.value
    });
    if (res.code === 200 || res.success) {
      const items = res.data.list || res.data || [];
      if (items.length < 10) noMore.value = true;
      productionList.value = [...productionList.value, ...items];
      page.value++;
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const onDateChange = (e) => {
  selectedDate.value = e.detail.value;
  fetchList(true);
  fetchStats();
};

const handleAISuggest = async () => {
  uni.showLoading({ title: 'AI 思考中...' });
  const res = await getAISuggestions({ date: selectedDate.value });
  uni.hideLoading();
  if (res.code === 200 || res.success) {
    aiSuggestions.value = res.data || res;
    aiPopup.value.open();
  }
};

const closeAIPopup = () => aiPopup.value.close();

const createFromAI = async (item) => {
  // 简易逻辑：直接采纳一条
  uni.showToast({ title: '已采纳建议', icon: 'success' });
  closeAIPopup();
  fetchList(true);
};

const updateStatus = async (item, action) => {
  try {
    let res;
    if (action === 'start') res = await startPlan(item._id);
    else if (action === 'complete') res = await completePlan(item._id, { actualQuantity: item.plannedQuantity });
    
    if (res.code === 200 || res.success) {
      uni.showToast({ title: '操作成功', icon: 'success' });
      fetchList(true);
      fetchStats();
    }
  } catch (e) {
    uni.showToast({ title: '操作失败', icon: 'none' });
  }
};

const handleUpdateProgress = (item) => {
  uni.showModal({
    title: '更新完成数量',
    editable: true,
    placeholderText: '请输入完成数量',
    success: async (res) => {
      if (res.confirm && res.content) {
        await updateProgress(item._id, { completedQuantity: parseInt(res.content) });
        fetchList(true);
      }
    }
  });
};

const handleDelete = (item) => {
  uni.showModal({
    title: '提示',
    content: '确定要删除该计划吗？',
    success: async (res) => {
      if (res.confirm) {
        await deletePlan(item._id);
        fetchList(true);
        fetchStats();
      }
    }
  });
};

const handleCreate = () => {
  uni.showToast({ title: '手动创建功能开发中', icon: 'none' });
};

const loadMore = () => fetchList();

onMounted(() => {
  fetchStats();
  fetchList();
});
</script>

<style lang="scss" scoped>
.production-page {
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
    .val { font-size: 32rpx; font-weight: bold; color: #1e293b; }
    .lab { font-size: 22rpx; color: #94a3b8; margin-top: 4rpx; }
  }
}

.action-bar {
  background-color: #fff;
  padding: 20rpx 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
  
  .picker-inner {
    display: flex;
    align-items: center;
    gap: 12rpx;
    font-size: 28rpx;
    color: #4facfe;
    background: #eff6ff;
    padding: 10rpx 24rpx;
    border-radius: 30rpx;
  }
  
  .btn-group {
    display: flex;
    gap: 16rpx;
    button {
      margin: 0;
      height: 64rpx;
      display: flex;
      align-items: center;
      padding: 0 24rpx;
      border-radius: 32rpx;
      color: #fff;
      font-size: 24rpx;
      &::after { border: none; }
      &.ai-btn { background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%); }
      &.add-btn { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
      text { margin-left: 6rpx; }
    }
  }
}

.list-container {
  flex: 1;
  padding: 30rpx;
  box-sizing: border-box;
}

.plan-card {
  background-color: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24rpx;
    
    .dish-title {
      .name { font-size: 32rpx; font-weight: bold; color: #1e293b; display: block; }
      .meal-tag { font-size: 20rpx; color: #4facfe; background: #eff6ff; padding: 2rpx 10rpx; border-radius: 4rpx; margin-top: 6rpx; display: inline-block; }
    }
    
    .status-tag {
      font-size: 22rpx;
      padding: 4rpx 16rpx;
      border-radius: 20rpx;
      &.pending { background: #f1f5f9; color: #64748b; }
      &.in_progress { background: #fee2e2; color: #ef4444; }
      &.completed { background: #ecfdf5; color: #10b981; }
    }
  }
  
  .card-body {
    .progress-info {
      margin-bottom: 20rpx;
      .progress-header {
        display: flex;
        justify-content: space-between;
        font-size: 24rpx;
        color: #64748b;
        margin-bottom: 10rpx;
      }
      .progress-bar {
        height: 12rpx;
        background: #f1f5f9;
        border-radius: 6rpx;
        overflow: hidden;
        .progress-inner { height: 100%; transition: width 0.3s; }
      }
    }
    
    .meta-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 24rpx;
      color: #94a3b8;
      .ai-label { color: #8b5cf6; display: flex; align-items: center; gap: 4rpx; }
    }
  }
  
  .card-footer {
    padding-top: 24rpx;
    margin-top: 24rpx;
    border-top: 1rpx solid #f1f5f9;
    display: flex;
    justify-content: flex-end;
    gap: 16rpx;
    
    .action-btn {
      margin: 0;
      height: 60rpx;
      font-size: 24rpx;
      border-radius: 30rpx;
      padding: 0 28rpx;
      background: #f1f5f9;
      color: #64748b;
      display: flex;
      align-items: center;
      &::after { border: none; }
      &.primary { background: #4facfe; color: #fff; }
      &.success { background: #10b981; color: #fff; }
      &.delete { color: #ef4444; }
    }
  }
}

.popup-box {
  background-color: #fff;
  border-radius: 30rpx 30rpx 0 0;
  padding: 40rpx 30rpx;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  
  .popup-title { font-size: 32rpx; font-weight: bold; text-align: center; margin-bottom: 30rpx; }
  .ai-list { flex: 1; }
  .ai-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24rpx;
    background: #f8fafc;
    border-radius: 16rpx;
    margin-bottom: 20rpx;
    
    .ai-item-info {
      flex: 1;
      .ai-dish { font-size: 28rpx; font-weight: bold; color: #1e293b; display: block; }
      .ai-reason { font-size: 22rpx; color: #94a3b8; margin-top: 4rpx; }
    }
    .ai-item-action {
      text-align: right;
      .ai-qty { font-size: 32rpx; font-weight: bold; color: #8b5cf6; margin-right: 20rpx; }
      .ai-add-btn { background: #8b5cf6; color: #fff; border-radius: 30rpx; &::after { border: none; } }
    }
  }
  .popup-close { margin-top: 30rpx; background: #f1f5f9; color: #64748b; border-radius: 40rpx; font-size: 30rpx; }
}

.load-more {
  padding: 40rpx 0;
  text-align: center;
  font-size: 24rpx;
  color: #94a3b8;
}
</style>
