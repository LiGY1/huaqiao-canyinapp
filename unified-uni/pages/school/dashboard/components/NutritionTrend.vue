<template>
  <view class="container">
    <view class="chart-box">
      <l-echart ref="chartRef" @grid-click="$emit('grid-click', $event)"></l-echart>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, watchEffect } from "vue";
const props = defineProps({
  hasNoMealData: {
    type: Boolean,
    default: true,
  },
  studentNutritionData: {
    required: true,
  },
});
const chartRef = ref(null);

// #ifdef MP
import echarts from "@/static/echarts.min.js";
// #endif
// #ifndef MP
const echarts = null;
// #endif

let chart = null;
const initNutritionTrendChart = async () => {
  if (!chartRef.value) {
    return;
  }
  chart = await chartRef.value.init(echarts);
  const weekData = [];

  chart.setOption({
    tooltip: { trigger: "axis" },
    legend: { data: ["早餐", "午餐", "晚餐"], top: 0 },
    grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    xAxis: { type: "category", data: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"] },
    yAxis: { type: "value", name: "kcal" },
    series: [
      {
        name: "早餐",
        type: "bar",
        stack: "total",
        itemStyle: { color: "#f59e0b" },
      },
      {
        name: "午餐",
        type: "bar",
        stack: "total",
        itemStyle: { color: "#10b981" },
      },
      {
        name: "晚餐",
        type: "bar",
        stack: "total",
        itemStyle: { color: "#3b82f6" },
      },
    ],
  });
};
onMounted(() => {
  initNutritionTrendChart();
});

watchEffect(() => {
  const data = props.studentNutritionData
  if (!chart || !data) {
    return;
  }
  const weekData = data.weekData;
  chart.setOption({
    series: [
      {
        data: weekData.map((d) => Math.round(d.breakfast.calories)),
      },
      {
        data: weekData.map((d) => Math.round(d.lunch.calories)),
      },
      {
        data: weekData.map((d) => Math.round(d.dinner.calories)),
      },
    ],
  });
});
</script>

<style scoped>
.container {
  background: #fff;
  border-bottom-left-radius: 20rpx;
  border-bottom-right-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}
.chart-box {
  height: 400rpx;
  width: 100%;
}
.empty-box {
  height: 300rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 24rpx;
  gap: 16rpx;
}
</style>
