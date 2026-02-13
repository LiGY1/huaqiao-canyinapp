<template>
  <layout>
    <view class="page-container">
      <!-- 统计数据 -->
      <view class="stats-grid">
        <view class="stat-card">
          <view class="stat-icon bg-blue">
            <uni-icons type="calendar" size="20" color="#fff"></uni-icons>
          </view>
          <view class="stat-info">
            <text class="stat-value">{{ statistics.totalMeals }}</text>
            <text class="stat-label">总用餐次数</text>
          </view>
        </view>
        <view class="stat-card">
          <view class="stat-icon bg-green">
            <uni-icons type="wallet" size="20" color="#fff"></uni-icons>
          </view>
          <view class="stat-info">
            <text class="stat-value">¥{{ statistics.totalSpent }}</text>
            <text class="stat-label">总消费</text>
          </view>
        </view>
        <view class="stat-card">
          <view class="stat-icon bg-purple">
            <uni-icons type="bars" size="20" color="#fff"></uni-icons>
          </view>
          <view class="stat-info">
            <text class="stat-value">¥{{ statistics.avgSpent }}</text>
            <text class="stat-label">平均消费</text>
          </view>
        </view>
      </view>

      <!-- 图表区域 -->
      <view class="charts-section mt-4">
        <view class="chart-card">
          <view class="chart-header">
            <uni-icons type="chart" size="18" color="#3b82f6"></uni-icons>
            <text class="chart-title">三餐营养摄入分布</text>
          </view>
          <view class="chart-container">
            <l-echart ref="mealTypeChartRef" @finished="initMealTypeChart"></l-echart>
          </view>
        </view>
        
        <view class="chart-card mt-4">
          <view class="chart-header">
            <uni-icons type="pie" size="18" color="#8b5cf6"></uni-icons>
            <text class="chart-title">营养素比例</text>
          </view>
          <view class="chart-container">
            <l-echart ref="nutritionChartRef" @finished="initNutritionChart"></l-echart>
          </view>
        </view>
      </view>

      <!-- 记录列表 -->
      <view class="records-section mt-4">
        <view v-if="mealRecords.length === 0" class="empty-state">
          <uni-icons type="info" size="64" color="#e5e7eb"></uni-icons>
          <text class="empty-text">暂无用餐记录</text>
        </view>

        <view v-else class="record-list">
          <view v-for="record in mealRecords" :key="record.id" class="meal-card">
            <view class="meal-header">
              <view class="meal-type-tag" :class="getMealTypeClass(record.mealType)">
                {{ record.mealType }}
              </view>
              <text class="meal-time">{{ record.date }} {{ record.time }}</text>
              <text class="meal-price">¥{{ record.totalPrice.toFixed(2) }}</text>
            </view>

            <view class="location-info">
              <uni-icons type="location" size="14" color="#94a3b8"></uni-icons>
              <text class="location-text">{{ record.campus }} - {{ record.canteen }} - {{ record.floor }}楼{{ record.window }}号窗口</text>
            </view>

            <view class="dishes-list">
              <view v-for="dish in record.dishes" :key="dish.id" class="dish-item">
                <view class="dish-name-box">
                  <text class="dish-name">{{ dish.name }}</text>
                  <text v-if="dish.isHealthy" class="healthy-tag">营养推荐</text>
                </view>
                <view class="dish-price-box">
                  <text class="dish-qty">x{{ dish.quantity }}</text>
                  <text class="dish-p">¥{{ dish.price.toFixed(2) }}</text>
                </view>
              </view>
            </view>

            <view v-if="record.nutrition" class="nutrition-strip">
              <view class="nut-item">
                <text class="nut-val">{{ record.nutrition.calories }}</text>
                <text class="nut-lab">热量</text>
              </view>
              <view class="nut-item">
                <text class="nut-val">{{ record.nutrition.protein }}g</text>
                <text class="nut-lab">蛋白质</text>
              </view>
              <view class="nut-item">
                <text class="nut-val">{{ record.nutrition.fat }}g</text>
                <text class="nut-lab">脂肪</text>
              </view>
              <view class="nut-item">
                <text class="nut-val">{{ record.nutrition.carbs }}g</text>
                <text class="nut-lab">碳水</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </layout>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue';
import layout from '@/components/layout.vue';
import { consumptionApi } from '@/api/parent';
import storage from '@/utils/storage';

// #ifdef MP
import * as echarts from '@/static/echarts.min.js';
// #endif
// #ifndef MP
const echarts = null;
// #endif

const mealRecords = ref([]);
const statistics = reactive({
  totalMeals: 0,
  totalSpent: '0.00',
  avgSpent: '0.00'
});

const mealTypeChartRef = ref(null);
const nutritionChartRef = ref(null);
let mealChartInstance = null;
let nutritionChartInstance = null;

const mealTypeStats = ref({
  breakfast: 0,
  lunch: 0,
  dinner: 0
});

const nutritionStats = ref({
  protein: 0,
  fat: 0,
  carbs: 0
});

const getMealTypeClass = (type) => {
  const map = {
    '早餐': 'bg-amber',
    '午餐': 'bg-green',
    '晚餐': 'bg-blue',
    '夜宵': 'bg-purple'
  };
  return map[type] || 'bg-blue';
};

const fetchMealRecords = async () => {
  const userInfo = storage.getUserInfo();
  const childId = userInfo?.children?.[0]?._id;
  if (!childId) return;

  try {
    const res = await consumptionApi.getMealHistory(childId, { page: 1, pageSize: 50 });
    if (res.code === 200) {
      const list = res.data.list || [];
      mealRecords.value = list.map(order => {
        const d = new Date(order.orderDate);
        const mealTypeMap = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '夜宵' };
        return {
          id: order._id,
          mealType: mealTypeMap[order.mealType] || '用餐',
          date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
          time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
          totalPrice: order.totalAmount || 0,
          campus: order.location?.campus || '主校区',
          canteen: order.location?.canteen || '第一食堂',
          floor: order.location?.floor || '1',
          window: order.location?.window || '1',
          dishes: (order.items || []).map(it => ({
            id: it.dish?._id || it.dish,
            name: it.dish?.name || it.dishName || '菜品',
            quantity: it.quantity || 1,
            price: it.price || 0,
            isHealthy: it.nutrition?.fiber >= 5
          })),
          nutrition: order.totalNutrition
        };
      });
      calculateStats();
    }
  } catch (e) {
    console.error(e);
  }
};

const calculateStats = () => {
  const count = mealRecords.value.length;
  const total = mealRecords.value.reduce((s, r) => s + r.totalPrice, 0);
  statistics.totalMeals = count;
  statistics.totalSpent = total.toFixed(2);
  statistics.avgSpent = count > 0 ? (total / count).toFixed(2) : '0.00';

  const typeStats = { breakfast: 0, lunch: 0, dinner: 0 };
  const nutStats = { protein: 0, fat: 0, carbs: 0 };

  mealRecords.value.forEach(r => {
    if (r.mealType === '早餐') typeStats.breakfast += r.nutrition?.calories || 0;
    if (r.mealType === '午餐') typeStats.lunch += r.nutrition?.calories || 0;
    if (r.mealType === '晚餐') typeStats.dinner += r.nutrition?.calories || 0;

    if (r.nutrition) {
      nutStats.protein += r.nutrition.protein || 0;
      nutStats.fat += r.nutrition.fat || 0;
      nutStats.carbs += r.nutrition.carbs || 0;
    }
  });

  mealTypeStats.value = typeStats;
  nutritionStats.value = nutStats;
  
  nextTick(() => {
    updateCharts();
  });
};

const initMealTypeChart = async () => {
  if (!mealTypeChartRef.value) return;
  mealChartInstance = await mealTypeChartRef.value.init(echarts);
  updateCharts();
};

const initNutritionChart = async () => {
  if (!nutritionChartRef.value) return;
  nutritionChartInstance = await nutritionChartRef.value.init(echarts);
  updateCharts();
};

const updateCharts = () => {
  if (mealChartInstance) {
    const data = [
      { value: mealTypeStats.value.breakfast, name: '早餐', itemStyle: { color: '#f59e0b' } },
      { value: mealTypeStats.value.lunch, name: '午餐', itemStyle: { color: '#10b981' } },
      { value: mealTypeStats.value.dinner, name: '晚餐', itemStyle: { color: '#3b82f6' } }
    ].filter(i => i.value > 0);

    mealChartInstance.setOption({
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: data,
        label: { show: true, position: 'outside', formatter: '{b}\n{d}%' }
      }]
    });
  }

  if (nutritionChartInstance) {
    const data = [
      { value: nutritionStats.value.protein, name: '蛋白质', itemStyle: { color: '#ef4444' } },
      { value: nutritionStats.value.fat, name: '脂肪', itemStyle: { color: '#f59e0b' } },
      { value: nutritionStats.value.carbs, name: '碳水', itemStyle: { color: '#8b5cf6' } }
    ].filter(i => i.value > 0);

    nutritionChartInstance.setOption({
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: data,
        label: { show: true, position: 'outside', formatter: '{b}\n{d}%' }
      }]
    });
  }
};

onMounted(() => {
  fetchMealRecords();
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
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
}

.stat-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.stat-icon {
  width: 60rpx;
  height: 60rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12rpx;
}

.bg-blue { background-color: #3b82f6; }
.bg-green { background-color: #10b981; }
.bg-purple { background-color: #8b5cf6; }
.bg-amber { background-color: #f59e0b; }

.stat-value {
  font-size: 32rpx;
  font-weight: bold;
  color: #1e293b;
}

.stat-label {
  font-size: 22rpx;
  color: #64748b;
  margin-top: 4rpx;
}

.chart-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.chart-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.chart-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #334155;
}

.chart-container {
  height: 350rpx;
}

.meal-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.meal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.meal-type-tag {
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  font-size: 20rpx;
  color: #fff;
}

.meal-time {
  font-size: 24rpx;
  color: #64748b;
  flex: 1;
  margin-left: 20rpx;
}

.meal-price {
  font-size: 32rpx;
  font-weight: bold;
  color: #f59e0b;
}

.location-info {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: #f8fafc;
  padding: 12rpx 20rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
}

.location-text {
  font-size: 22rpx;
  color: #64748b;
}

.dish-item {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;
  border-bottom: 1rpx dashed #f1f5f9;
}

.dish-name-box {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.dish-name {
  font-size: 26rpx;
  color: #334155;
}

.healthy-tag {
  font-size: 18rpx;
  background: #f0fdf4;
  color: #16a34a;
  padding: 2rpx 8rpx;
  border-radius: 4rpx;
}

.dish-price-box {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.dish-qty {
  font-size: 24rpx;
  color: #94a3b8;
}

.dish-p {
  font-size: 26rpx;
  color: #334155;
  font-weight: 500;
}

.nutrition-strip {
  display: flex;
  justify-content: space-between;
  margin-top: 24rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f1f5f9;
}

.nut-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.nut-val {
  font-size: 24rpx;
  font-weight: bold;
  color: #1e293b;
}

.nut-lab {
  font-size: 18rpx;
  color: #94a3b8;
  margin-top: 4rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #94a3b8;
  margin-top: 20rpx;
}

.mt-4 { margin-top: 30rpx; }
</style>
