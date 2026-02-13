<template>
  <view class="panel">
    <view class="panel-header">
      <uni-icons type="piechart" size="18" color="#f59e0b"></uni-icons>
      <text class="panel-title">动物性蛋白日均摄入</text>
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

  // 写死的数据：动物性蛋白日均摄入
  // 29人达标，1人不达标
  const data = [
    { name: "达标", value: 29 },
    { name: "不达标", value: 1 }
  ];

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      borderColor: "#f59e0b",
      borderWidth: 1,
      textStyle: { color: "#303133" },
      formatter: "{b}: {c}人 ({d}%)"
    },
    legend: {
      orient: "horizontal",
      bottom: "5%",
      left: "center",
      textStyle: {
        fontSize: 11
      }
    },
    series: [{
      name: "动物性蛋白日均摄入",
      type: "pie",
      radius: ["35%", "60%"],
      center: ["50%", "45%"],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 8,
        borderColor: "#fff",
        borderWidth: 2
      },
      label: {
        show: true,
        color: "#606266",
        fontSize: 11,
        formatter: "{b}\n{d}%"
      },
      labelLine: {
        show: true,
        length: 15,
        length2: 10,
        lineStyle: {
          color: "#ccc"
        }
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 13,
          fontWeight: "bold",
          color: "#303133"
        },
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: "rgba(245, 158, 11, 0.5)"
        }
      },
      data: data,
      // 颜色：达标(橙色)、不达标(深橙色)
      color: ["#f59e0b", "#d97706"]
    }]
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