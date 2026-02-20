<template>
  <layout>
    <scroll-view
      :scroll-y="true"
      class="page-container"
      @scrolltolower="loadMore"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <!-- 日期筛选 -->
      <DateFilter @change="handleDateChange" />

      <!-- 统计数据 - 显示时间范围 -->
      <view class="stats-header">
        <text class="stats-title">{{ dateRangeText }}</text>
      </view>
      <StatsCards :statistics="statistics" />

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
        <view v-if="mealRecords.length === 0 && !loading" class="empty-state">
          <uni-icons type="info" size="64" color="#e5e7eb"></uni-icons>
          <text class="empty-text">暂无用餐记录</text>
        </view>

        <view v-else class="record-list">
          <MealRecordCard v-for="record in mealRecords" :key="record.id" :record="record" />
        </view>

        <!-- 加载状态 -->
        <view v-if="loading" class="loading-state">
          <uni-icons type="spinner-cycle" size="32" color="#3b82f6"></uni-icons>
          <text class="loading-text">加载中...</text>
        </view>

        <!-- 没有更多数据 -->
        <view v-if="!hasMore && mealRecords.length > 0" class="no-more">
          <text class="no-more-text">没有更多数据了</text>
        </view>
      </view>
    </scroll-view>
  </layout>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, computed } from "vue";
import layout from "@/components/layout.vue";
import { consumptionApi } from "@/api/parent";
import storage from "@/utils/storage";
import StatsCards from "./components/StatsCards.vue";
import MealRecordCard from "./components/MealRecordCard.vue";
import DateFilter from "./components/DateFilter.vue";

// #ifdef MP
import * as echarts from "@/static/echarts.min.js";
// #endif
// #ifndef MP
const echarts = null;
// #endif

const mealRecords = ref([]);

const statistics = reactive({
  totalMeals: 0,
  totalSpent: "0.00",
  avgSpent: "0.00",
});

const dateRange = reactive({
  startDate: "",
  endDate: "",
  type: "week",
});

// 分页相关
const loading = ref(false);
const refreshing = ref(false);
const currentPage = ref(1);
const pageSize = 10;
const hasMore = ref(true);

// 生成日期范围文本
const dateRangeText = computed(() => {
  if (!dateRange.startDate || !dateRange.endDate) return "统计数据";

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const typeMap = {
    week: "本周",
    month: "本月",
    quarter: "近三月",
    custom: "自定义",
  };

  return `${typeMap[dateRange.type] || ""}（${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}）`;
});

const mealTypeStats = ref({
  breakfast: 0,
  lunch: 0,
  dinner: 0,
});

const nutritionStats = ref({
  protein: 0,
  fat: 0,
  carbs: 0,
});

const mealTypeChartRef = ref(null);
const nutritionChartRef = ref(null);
let mealChartInstance = null;
let nutritionChartInstance = null;

// 日期筛选变化
const handleDateChange = async (range) => {
  try {
    // 更新日期范围
    Object.assign(dateRange, range);

    // 重置分页
    currentPage.value = 1;
    hasMore.value = true;

    // 不是首次加载，清空列表
    if (mealRecords.value.length > 0) {
      mealRecords.value = [];
      uni.showLoading({ title: "加载中..." });
    }

    // 重新加载数据
    await fetchMealRecords();
  } finally {
    uni.hideLoading();
  }
};

const fetchMealRecords = async (isLoadMore = false) => {
  if (loading.value) return;

  const userInfo = storage.getUserInfo();
  const childId = userInfo?.children?.[0]?._id;
  if (!childId) return;

  loading.value = true;

  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize,
    };

    // 添加日期筛选参数
    if (dateRange.startDate) {
      params.startDate = dateRange.startDate;
    }
    if (dateRange.endDate) {
      params.endDate = dateRange.endDate;
    }

    const res = await consumptionApi.getMealHistory(childId, params);

    if (res.code === 200 || res.success) {
      const responseData = res.data || res;
      const list = responseData.list || responseData.data || [];
      const total = responseData.total || responseData.pagination?.total || 0;

      // 数据转换
      const newRecords = list.map((order) => {
        const d = new Date(order.orderDate);
        const mealTypeMap = { breakfast: "早餐", lunch: "午餐", dinner: "晚餐", snack: "夜宵" };
        return {
          id: order._id,
          mealType: mealTypeMap[order.mealType] || "用餐",
          date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
          time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
          totalPrice: order.totalAmount || 0,
          campus: order.location?.campus || "主校区",
          canteen: order.location?.canteen || "第一食堂",
          floor: order.location?.floor || "1",
          window: order.location?.window || "1",
          dishes: (order.items || []).map((it) => ({
            id: it.dish?._id || it.dish,
            name: it.dish?.name || it.dishName || "菜品",
            quantity: it.quantity || 1,
            price: it.price || 0,
            isHealthy: it.nutrition?.fiber >= 5,
          })),
          nutrition: order.totalNutrition,
        };
      });

      if (isLoadMore) {
        mealRecords.value = [...mealRecords.value, ...newRecords];
      } else {
        mealRecords.value = newRecords;
      }

      hasMore.value = mealRecords.value.length < total;

      // 使用后端返回的统计数据
      if (responseData.statistics) {
        statistics.totalMeals = responseData.statistics.totalMeals;
        statistics.totalSpent = responseData.statistics.totalSpent;
        statistics.avgSpent = responseData.statistics.avgSpent;
      }

      // 使用后端返回的三餐热量数据
      if (responseData.mealTypeStats) {
        mealTypeStats.value = responseData.mealTypeStats;
      }

      // 使用后端返回的营养素数据
      if (responseData.nutritionStats) {
        nutritionStats.value = responseData.nutritionStats;
      }

      // 更新图表
      nextTick(() => {
        updateCharts();
      });

      if (newRecords.length === 0 && !isLoadMore) {
        uni.showToast({ title: "该时间段暂无用餐记录", icon: "none" });
      }
    } else {
      uni.showToast({ title: res.message || "加载数据失败", icon: "none" });
    }
  } catch (e) {
    uni.showToast({ title: "加载数据失败", icon: "none" });
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true;
  currentPage.value = 1;
  hasMore.value = true;
  fetchMealRecords();
};

// 加载更多
const loadMore = () => {
  if (!hasMore.value || loading.value) return;

  currentPage.value++;
  fetchMealRecords(true);
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
      { value: mealTypeStats.value.breakfast, name: "早餐", itemStyle: { color: "#f59e0b" } },
      { value: mealTypeStats.value.lunch, name: "午餐", itemStyle: { color: "#10b981" } },
      { value: mealTypeStats.value.dinner, name: "晚餐", itemStyle: { color: "#3b82f6" } },
    ].filter((i) => i.value > 0);

    mealChartInstance.setOption({
      series: [
        {
          type: "pie",
          radius: ["40%", "70%"],
          data: data,
          label: { show: true, position: "outside", formatter: "{b}\n{d}%" },
        },
      ],
    });
  }

  if (nutritionChartInstance) {
    const data = [
      { value: nutritionStats.value.protein, name: "蛋白质", itemStyle: { color: "#ef4444" } },
      { value: nutritionStats.value.fat, name: "脂肪", itemStyle: { color: "#f59e0b" } },
      { value: nutritionStats.value.carbs, name: "碳水", itemStyle: { color: "#8b5cf6" } },
    ].filter((i) => i.value > 0);

    nutritionChartInstance.setOption({
      series: [
        {
          type: "pie",
          radius: ["40%", "70%"],
          data: data,
          label: { show: true, position: "outside", formatter: "{b}\n{d}%" },
        },
      ],
    });
  }
};

onMounted(() => {
  // 初始加载会由 DateFilter 组件触发
});
</script>

<style lang="scss" scoped>
.page-container {
  padding: 30rpx;
  background-color: #f8fafc;
  height: 100%;
}

.stats-header {
  margin-bottom: 12rpx;
}

.stats-title {
  font-size: 24rpx;
  color: #64748b;
  font-weight: 500;
}

.chart-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
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

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 0;
  gap: 16rpx;
}

.loading-text {
  font-size: 24rpx;
  color: #64748b;
}

.no-more {
  padding: 40rpx 0;
  text-align: center;
}

.no-more-text {
  font-size: 24rpx;
  color: #94a3b8;
}

.mt-4 {
  margin-top: 30rpx;
}
</style>
