<template>
  <view class="panel">
    <view class="panel-header">
      <uni-icons type="calendar" size="18" color="#f59e0b"></uni-icons>
      <text class="panel-title">今日用餐概览</text>
      <view class="live-badge">实时</view>
    </view>
    <view class="chart-box small">
      <l-echart ref="chartRef" @finished="initChart"></l-echart>
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from "vue";
const props = defineProps({
  todayStats: {
    type: Object,
    default: () => ({
      breakfast: 0,
      lunch: 0,
      dinner: 0,
    }),
  },
});
const chartRef = ref(null);
let chartInstance = null;
// 仅在小程序环境下引入 ECharts
// #ifdef MP
import echarts from "../../../../static/echarts.min.js";
// #endif
// #ifndef MP
const echarts = null; // H5 和 App 环境不需要手动引入
// #endif

// 更新图表数据
const updateChart = () => {
  if (!chartInstance) return;

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      borderColor: "#4facfe",
      borderWidth: 1,
      formatter: "{b}: {c}人 ({d}%)",
    },
    legend: {
      orient: "horizontal",
      bottom: "3%",
      textStyle: { fontSize: 11 },
    },
    series: [
      {
        name: "今日用餐",
        type: "pie",
        radius: ["30%", "60%"],
        center: ["50%", "45%"],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderWidth: 2,
        },
        label: {
          show: true,
          position: "outside",
          formatter: "{b}\n{c}人",
          fontSize: 11,
          fontWeight: 600,
        },
        labelLine: {
          show: true,
          length: 8,
          length2: 12,
          lineStyle: {},
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: "bold",
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
        data: [
          {
            name: "早餐",
            value: props.todayStats.breakfast || 0,
            itemStyle: { color: "#f59e0b" },
          },
          {
            name: "午餐",
            value: props.todayStats.lunch || 0,
            itemStyle: { color: "#10b981" },
          },
          {
            name: "晚餐",
            value: props.todayStats.dinner || 0,
            itemStyle: { color: "#3b82f6" },
          },
        ],
      },
    ],
  };

  chartInstance.setOption(option);
};

// 初始化图表
const initChart = async () => {
  // 初始化图表
  if (!chartRef.value) return;
  try {
    chartInstance = await chartRef.value.init(echarts);
    updateChart();
  } catch (error) {
    console.error("初始化图表失败:", error);
  }
};

// 监听todayStats变化，更新图表
watch(
  () => props.todayStats,
  () => {
    updateChart();
  },
  { deep: true },
);

defineExpose({ chartRef });
</script>

<style scoped>
.panel {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}
.panel-header {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
  gap: 12rpx;
}
.panel-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}
.live-badge {
  background: #fef2f2;
  color: #ef4444;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  margin-left: auto;
}
.chart-box.small {
  height: 400rpx;
}
</style>
