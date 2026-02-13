<template>
  <view class="panel">
    <view class="panel-header">
      <text class="panel-title">{{ title }}</text>
    </view>
    <view class="chart-box small">
      <l-echart ref="chartRef" @finished="initChart"></l-echart>
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from "vue";
const props = defineProps({
  title: {
    type: String,
    default: "",
  },
  comparisonData: {
    type: Object,
    require: true,
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
  if (!chartInstance || !props.comparisonData) return;

  const option = {
    series: [
      {
        name: "本周",
        type: "bar",
        data: [
          props.comparisonData.thisWeek?.mealTypes?.breakfast || 0,
          props.comparisonData.thisWeek?.mealTypes?.lunch || 0,
          props.comparisonData.thisWeek?.mealTypes?.dinner || 0,
        ],
        itemStyle: {
          color: "#3b82f6",
          borderRadius: [4, 4, 0, 0],
        },
      },
      {
        name: "上周",
        type: "bar",
        data: [
          props.comparisonData.lastWeek?.mealTypes?.breakfast || 0,
          props.comparisonData.lastWeek?.mealTypes?.lunch || 0,
          props.comparisonData.lastWeek?.mealTypes?.dinner || 0,
        ],
        itemStyle: {
          color: "rgba(144, 147, 153, 0.5)",
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };

  chartInstance.setOption(option);
};

// 初始化图表
const initChart = async () => {
  // 初始化图表
  if (!chartRef.value) return;

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      borderColor: "#4facfe",
      borderWidth: 1,
      textStyle: { color: "#303133" },
      formatter: "{b}: {c}次",
    },
    legend: {
      data: ["本周", "上周"],
      top: 10,
      textStyle: {
        fontSize: 12,
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: ["早餐", "午餐", "晚餐"],
      axisLine: {
        lineStyle: {
          color: "#ccc",
        },
      },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      splitLine: {
        lineStyle: {
          type: "dashed",
          color: "#f0f0f0",
        },
      },
    },
    series: [
      {
        name: "本周",
        type: "bar",
        data: [0, 0, 0],
        itemStyle: {
          color: "#3b82f6",
          borderRadius: [4, 4, 0, 0],
        },
      },
      {
        name: "上周",
        type: "bar",
        data: [0, 0, 0],
        itemStyle: {
          color: "rgba(144, 147, 153, 0.5)",
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };

  try {
    chartInstance = await chartRef.value.init(echarts);
    chartInstance.setOption(option);
    // 初始化后立即更新数据
    updateChart();
  } catch (error) {
    console.error("初始化图表失败:", error);
  }
};

// 监听comparisonData变化，更新图表
watch(
  () => props.comparisonData,
  () => {
    updateChart();
  },
  { deep: true }
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
.chart-box.small {
  height: 350rpx;
}
</style>
