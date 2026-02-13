<template>
  <view class="panel">
    <view class="panel-header">
      <uni-icons type="map-pin" size="18" color="#67C23A"></uni-icons>
      <text class="panel-title">健康状况</text>
    </view>
    <view class="chart-box small">
      <l-echart ref="chartRef" @finished="initChart"></l-echart>
    </view>
  </view>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { studentApi } from "@/api/school";

const chartRef = ref(null);
let chartInstance = null;
const healthDistributionData = ref({
  healthy: 0,
  attention: 0,
  abnormal: 0
});

// 仅在小程序环境下引入 ECharts
// #ifdef MP
import echarts from "../../../../static/echarts.min.js";
// #endif
// #ifndef MP
const echarts = null; // H5 和 App 环境不需要手动引入
// #endif

// 加载健康分布数据
const loadHealthDistribution = async () => {
  try {
    const response = await studentApi.getHealthData({});
    if (response.success && Array.isArray(response.data)) {
      // 统计健康状态分布
      const distribution = {
        healthy: 0,
        attention: 0,
        abnormal: 0
      };
      response.data.forEach(student => {
        const status = student.healthStatus || 'attention';
        if (status === 'healthy') {
          distribution.healthy++;
        } else if (status === 'attention') {
          distribution.attention++;
        } else if (status === 'abnormal') {
          distribution.abnormal++;
        }
      });
      healthDistributionData.value = distribution;
      updateChart();
    }
  } catch (error) {
    console.error('Load health distribution error:', error);
    // 失败时使用默认值
    healthDistributionData.value = { healthy: 0, attention: 0, abnormal: 0 };
  }
};

// 更新图表数据
const updateChart = () => {
  if (!chartInstance) return;

  const healthLabels = {
    healthy: '健康',
    attention: '需关注',
    abnormal: '异常'
  };

  const data = Object.entries(healthDistributionData.value).map(([key, value]) => ({
    name: healthLabels[key] || key,
    value: value
  })).filter(item => item.value > 0); // 只显示有数据的项

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      borderColor: "#4facfe",
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
          shadowColor: "rgba(79, 172, 254, 0.5)"
        }
      },
      data: data,
      // 颜色匹配：健康(绿色)、需关注(橙色)、异常(红色)
      color: ["#67C23A", "#E6A23C", "#F56C6C"]
    }]
  };

  chartInstance.setOption(option);
};

// 初始化图表
const initChart = async () => {
  if (!chartRef.value) return;

  try {
    chartInstance = await chartRef.value.init(echarts);
    await loadHealthDistribution();
  } catch (error) {
    console.error("初始化图表失败:", error);
  }
};

onMounted(() => {
  loadHealthDistribution();
});

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