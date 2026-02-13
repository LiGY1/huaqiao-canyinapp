<template>
  <view class="panel">
    <view class="panel-header">
      <uni-icons type="star" size="18" color="#f093fb"></uni-icons>
      <text class="panel-title">钙摄入情况</text>
    </view>
    <view class="chart-box small">
      <l-echart ref="chartRef" @finished="initChart"></l-echart>
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from "vue";
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
      trigger: "axis",
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      borderColor: "#f5576c",
      borderWidth: 1,
      textStyle: { color: "#303133" },
      formatter: "{b}: {c}人"
    },
    legend: {
      data: ["本周", "上周"],
      top: 10,
      textStyle: {
        fontSize: 12
      }
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true
    },
    xAxis: {
      type: "category",
      data: ["乳制品日均摄入", "钙摄入达标人数"],
      axisLine: {
        lineStyle: {
          color: "#ccc"
        }
      }
    },
    yAxis: {
      type: "value",
      name: "人数",
      nameTextStyle: {
        fontSize: 12
      },
      axisLine: { show: false },
      splitLine: {
        lineStyle: {
          type: "dashed",
          color: "#f0f0f0"
        }
      }
    },
    series: [
      {
        name: "本周",
        type: "bar",
        data: [14, 23],
        itemStyle: {
          borderRadius: [4, 4, 0, 0]
        }
      },
      {
        name: "上周",
        type: "bar",
        data: [21, 26],
        itemStyle: {
          color: "rgba(240, 147, 251, 0.4)",
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  };

  chartInstance.setOption(option);
};

// 初始化图表
const initChart = async () => {
  if (!chartRef.value) return;

  try {
    chartInstance = await chartRef.value.init(echarts);
    updateChart();
  } catch (error) {
    console.error("初始化图表失败:", error);
  }
};

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