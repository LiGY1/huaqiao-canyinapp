<template>
  <layout>
    <scroll-view class="dashboard-container" scroll-y>
      <!-- 加载状态 -->
      <view v-if="loading" class="loading-container">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载数据中...</text>
      </view>

      <view v-else class="content-wrapper">
        <!-- 学生选择区域 -->
        <StudentPanel
          :studentList="studentList"
          :selectedStudentId="selectedStudentId"
          :weekDateRange="weekDateRange"
          @select-student="selectStudent"
          @change-week="changeWeek"
        />

        <!-- 营养趋势图表 -->
        <NutritionTrend ref="nutritionTrendComp" :hasNoMealData="hasNoMealData || !selectedStudentId" />

        <TodayOverview ref="todayMealsComp" :todayStats="todayStats" />

        <view class="panel-grid">
          <SmallChartPanel ref="mealTypesComp" title="各餐次对比" :comparisonData="comparisonData" />
          <CalciumChart />
          <ParticipationChart />
          <HealthChart />
          <ProteinChart />
        </view>

        <KpiGrid :kpiData="kpiData" />

        <DashboardFooter :lastUpdateTime="lastUpdateTime" :loading="loading" @manual-refresh="handleManualRefresh" />
      </view>
    </scroll-view>
  </layout>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from "vue";
import layout from "@/components/layout.vue";
import storage from "@/utils/storage";
import { statisticsApi, studentApi } from "@/api/school";
import StudentPanel from "./components/StudentPanel.vue";
import NutritionTrend from "./components/NutritionTrend.vue";
import TodayOverview from "./components/TodayOverview.vue";
import SmallChartPanel from "./components/SmallChartPanel.vue";
import CalciumChart from "./components/CalciumChart.vue";
import ParticipationChart from "./components/ParticipationChart.vue";
import HealthChart from "./components/HealthChart.vue";
import ProteinChart from "./components/ProteinChart.vue";
import KpiGrid from "./components/KpiGrid.vue";
import DashboardFooter from "./components/DashboardFooter.vue";

// #ifdef MP
import echarts from "@/static/echarts.min.js";
// #endif
// #ifndef MP
const echarts = null;
// #endif

const loading = ref(true);
const lastUpdateTime = ref("");

// 图表 component refs (children expose their internal chartRef)
const nutritionTrendComp = ref(null);
const mealTypesComp = ref(null);

const studentList = ref([]);
const selectedStudentId = ref(null);
const studentNutritionData = ref(null);
const currentWeekOffset = ref(0);
const comparisonData = ref({
  totalStudents: 0,
  thisWeek: {
    totalOrders: 0,
    dailyMeals: new Array(7).fill(0),
    nutrition: { avgCalories: 0, avgProtein: 0, avgCarbs: 0, avgFat: 0 },
    mealTypes: { breakfast: 0, lunch: 0, dinner: 0 },
    participation: { activeStudents: 0, totalStudents: 0, participationRate: 0 },
  },
  lastWeek: {
    totalOrders: 0,
    dailyMeals: new Array(7).fill(0),
    nutrition: { avgCalories: 0, avgProtein: 0, avgCarbs: 0, avgFat: 0 },
    mealTypes: { breakfast: 0, lunch: 0, dinner: 0 },
    participation: { activeStudents: 0, totalStudents: 0, participationRate: 0 },
  },
  comparison: { orderChange: 0, nutritionChange: 0, participationChange: 0 },
});

const todayStats = ref({
  totalStudents: 0,
  breakfast: 0,
  lunch: 0,
  dinner: 0,
});

const weekDateRange = computed(() => {
  if (!studentNutritionData.value) return "";
  const { start, end } = studentNutritionData.value.dateRange || {};
  return start && end ? `${start} ~ ${end}` : "";
});

const hasNoMealData = computed(() => {
  if (!studentNutritionData.value || !studentNutritionData.value.weekData) return true;
  return !studentNutritionData.value.weekData.some(
    (day) => day.breakfast.hasOrder || day.lunch.hasOrder || day.dinner.hasOrder
  );
});

const kpiData = computed(() => [
  { label: "班级学生", value: comparisonData.value.totalStudents, trend: 0, trendClass: "neutral", color: "#3b82f6" },
  {
    label: "本周参与率",
    value: comparisonData.value.thisWeek.participation.participationRate + "%",
    trend: comparisonData.value.comparison.participationChange || 0,
    trendClass: getTrendClass(comparisonData.value.comparison.participationChange),
    color: "#10b981",
  },
  {
    label: "本周总订单",
    value: comparisonData.value.thisWeek.totalOrders,
    trend: comparisonData.value.comparison.orderChange || 0,
    trendClass: getTrendClass(comparisonData.value.comparison.orderChange),
    color: "#f59e0b",
  },
  {
    label: "平均卡路里",
    value: Math.round(comparisonData.value.thisWeek.nutrition.avgCalories) + " kcal",
    trend: comparisonData.value.comparison.nutritionChange || 0,
    trendClass: getTrendClass(comparisonData.value.comparison.nutritionChange),
    color: "#8b5cf6",
  },
]);

const getTrendClass = (change) => (change > 0 ? "positive" : change < 0 ? "negative" : "neutral");

const selectStudent = (id) => {
  selectedStudentId.value = id;
  currentWeekOffset.value = 0;
  loadStudentNutritionData();
};

const changeWeek = (offset) => {
  currentWeekOffset.value += offset;
  loadStudentNutritionData();
};

const loadStudentNutritionData = async () => {
  if (!selectedStudentId.value) return;
  try {
    const res = await statisticsApi.getStudentWeeklyNutrition({
      studentId: selectedStudentId.value,
      weekOffset: currentWeekOffset.value,
    });
    if (res && res.data) {
      studentNutritionData.value = res.data;
      await nextTick();
      if (!hasNoMealData.value) initNutritionTrendChart();
    }
  } catch (e) {
    console.error(e);
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    const [compRes, todayRes, studentRes] = await Promise.all([
      statisticsApi.getWeeklyComparison(),
      statisticsApi.getTodayOverview(),
      studentApi.getClassStudentList({ page: 1, pageSize: 50 }),
    ]);

    if (compRes.success) comparisonData.value = compRes.data;
    if (todayRes.success) todayStats.value = todayRes.data;
    if (studentRes && studentRes.data) {
      const list = Array.isArray(studentRes.data) ? studentRes.data : studentRes.data.list || [];
      studentList.value = list.map((s) => ({
        id: s._id || s.id,
        name: s.name || "未知",
        studentId: s.studentId || "",
      }));
      if (studentList.value.length > 0) {
        selectedStudentId.value = studentList.value[0].id;
        loadStudentNutritionData();
      }
    }

    updateLastRefreshTime();
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const updateLastRefreshTime = () => {
  lastUpdateTime.value = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
};

// 图量初始化逻辑 (简化适配 l-echart)
const initNutritionTrendChart = async () => {
  const comp = nutritionTrendComp.value;
  const chartComponentRef = comp && comp.chartRef;
  if (!chartComponentRef || !chartComponentRef.value) return;
  const chart = await chartComponentRef.value.init(echarts);
  const weekData = studentNutritionData.value.weekData || [];
  const days = weekData.map((d) => d.dayName);

  chart.setOption({
    tooltip: { trigger: "axis" },
    legend: { data: ["早餐", "午餐", "晚餐"], top: 0 },
    grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    xAxis: { type: "category", data: days },
    yAxis: { type: "value", name: "kcal" },
    series: [
      {
        name: "早餐",
        type: "bar",
        stack: "total",
        data: weekData.map((d) => Math.round(d.breakfast.calories)),
        itemStyle: { color: "#f59e0b" },
      },
      {
        name: "午餐",
        type: "bar",
        stack: "total",
        data: weekData.map((d) => Math.round(d.lunch.calories)),
        itemStyle: { color: "#10b981" },
      },
      {
        name: "晚餐",
        type: "bar",
        stack: "total",
        data: weekData.map((d) => Math.round(d.dinner.calories)),
        itemStyle: { color: "#3b82f6" },
      },
    ],
  });
};

const handleManualRefresh = () => loadData();

onMounted(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 20rpx;
  background-color: #f5f7fa;
  height: 100%;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #f3f3f3;
  border-top: 4rpx solid #4facfe;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* page-level layout for grouping small panels */
.panel-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20rpx;
}
</style>
