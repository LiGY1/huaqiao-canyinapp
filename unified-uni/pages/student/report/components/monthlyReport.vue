<template>
  <view class="monthly-report">
    <!-- 月度热量趋势 -->
    <view class="card">
      <view class="card-header">
        <text class="card-title">月度热量摄入趋势</text>
      </view>
      <view class="chart-container">
        <l-echart ref="monthlyChartRef" @finished="initMonthlyChart"></l-echart>
      </view>
    </view>

    <!-- 月度统计 -->
    <view class="stats-row">
      <view class="stat-card">
        <text class="stat-card-label">月均热量</text>
        <text class="stat-card-value primary">{{ monthlyData.avgCalories }}</text>
        <text class="stat-card-unit">千卡/天</text>
      </view>
      <view class="stat-card">
        <text class="stat-card-label">目标达成率</text>
        <text class="stat-card-value success"
          >{{ ((monthlyData.avgCalories / monthlyData.targetCalories) * 100).toFixed(1) }}%</text
        >
      </view>
      <view class="stat-card">
        <text class="stat-card-label">报告月份</text>
        <text class="stat-card-value primary">{{ monthlyData.month }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from "vue";

// #ifdef MP
import echarts from "../../../../static/echarts.min.js";
// #endif
// #ifndef MP
const echarts = null; // H5 和 App 环境不需要手动引入
// #endif

const props = defineProps({
  monthlyData: {
    type: Object,
    default: () => ({
      month: "",
      dailyCalories: [],
      avgCalories: 0,
      targetCalories: 0,
    }),
  },
});

const useMonthlyChart = () => {
  const monthlyChartRef = ref(null);
  const monthlyChartInstance = ref(null);

  const initMonthlyChart = async () => {
    if (!monthlyChartRef.value) return;
    try {
      monthlyChartInstance.value = await monthlyChartRef.value.init(echarts);

      const option = {
        animation: true,
        animationDuration: 1200,
        animationEasing: "cubicOut",
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "cross",
            crossStyle: {
              color: "#409eff",
              width: 1,
              opacity: 0.6,
            },
            lineStyle: {
              color: "#409eff",
              width: 1,
              opacity: 0.8,
            },
          },
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderColor: "#409eff",
          borderWidth: 2,
          shadowColor: "rgba(0, 0, 0, 0.1)",
          shadowBlur: 10,
          textStyle: {
            color: "#333",
            fontSize: 13,
          },
          //   formatter: (params) => {
          //     const param = params[0];
          //     const value = Math.round(param.value);
          //     const target = Math.round(monthlyData.value.targetCalories || 2000);
          //     const percentage = ((param.value / target) * 100).toFixed(1);
          //     const status = percentage >= 100 ? "超标" : percentage >= 90 ? "达标" : "不足";

          //     return `<div style="text-align: center;">
          //   <div style="font-weight: bold; color: #409eff; margin-bottom: 8px;">${param.name}</div>
          //   <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">
          //     <div style="width: 12px; height: 12px; background: linear-gradient(135deg, #409eff, #66b1ff); border-radius: 50%; margin-right: 8px;"></div>
          //     <span style="font-size: 16px; font-weight: bold; color: #409eff;">${value} 千卡</span>
          //   </div>
          //   <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
          //     目标: ${target} 千卡 (${percentage}%)
          //   </div>
          //   <div style="font-size: 12px; font-weight: bold; color: ${
          //     percentage >= 90 ? "#67c23a" : percentage >= 70 ? "#e6a23c" : "#f56c6c"
          //   };">
          //     ${status}
          //   </div>
          // </div>`;
          //   },
        },
        graphic: [
          {
            type: "text",
            left: 0,
            top: 0,
            style: {
              text: "热量(千卡)",
              fill: "#409eff",
              font: "bold 13px sans-serif",
            },
          },
        ],
        grid: {
          left: "3%",
          right: "8%",
          bottom: "3%",
          top: "15%",
          containLabel: true,
        },
        xAxis: {
          type: "category",
          // data: dateLabels,
          boundaryGap: false,
          axisLabel: {
            // rotate: dataLength > 15 ? 45 : 0,
            fontSize: 11,
            fontWeight: "bold",
            color: "#666",
          },
          axisLine: {
            lineStyle: {
              color: "#e0e6ed",
              width: 1,
            },
          },
          axisTick: {
            show: false,
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: "#f0f5ff",
              type: "dashed",
            },
          },
        },
        yAxis: {
          type: "value",
          min: "dataMin",
          max: "dataMax",
          splitLine: {
            lineStyle: {
              color: "#f0f5ff",
              type: "dashed",
            },
          },
          axisLabel: {
            fontSize: 11,
            color: "#666",
            formatter: (value) => `${value}`,
          },
          axisLine: {
            show: false,
          },
          axisTick: {
            show: false,
          },
        },
        series: [
          {
            name: "热量摄入",
            type: "line",
            // smooth: dataLength > 10,
            // data: monthlyData.value.dailyCalories,
            itemStyle: {
              color: "#409eff",
              borderWidth: 2,
              borderColor: "#ffffff",
              shadowColor: "rgba(64, 158, 255, 0.4)",
              shadowBlur: 8,
            },
            lineStyle: {
              width: 3,
              shadowColor: "rgba(64, 158, 255, 0.3)",
              shadowBlur: 6,
            },
            symbol: "circle",
            symbolSize: (value, params) => {
              const day = params.dataIndex + 1;
              return day % 7 === 0 || day % 7 === 6 ? 8 : 5;
            },
            emphasis: {
              focus: "series",
              itemStyle: {
                borderWidth: 3,
                borderColor: "#ffffff",
                shadowColor: "rgba(64, 158, 255, 0.6)",
                shadowBlur: 15,
              },
              label: {
                show: true,
                position: "top",
                fontSize: 12,
                fontWeight: "bold",
                color: "#409eff",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                borderColor: "#409eff",
                borderWidth: 1,
                borderRadius: 4,
                padding: [4, 8],
              },
            },
          },
        ],
      };

      monthlyChartInstance.value.setOption(option);
    } catch (error) {
      console.error("月度图表初始化失败:", error);
    }
  };

  const updateChart = (data) => {
    if (!monthlyChartInstance.value || !data) return;

    const days = data.dailyCalories.map((_, index) => index + 1);

    monthlyChartInstance.value.setOption({
      xAxis: {
        data: days,
      },
      series: [
        {
          data: data.dailyCalories,
          markLine: {
            data: [{ yAxis: data.targetCalories || 0 }],
          },
        },
      ],
    });
  };

  watch(
    () => props.monthlyData,
    (newVal) => {
      if (newVal && monthlyChartInstance.value) {
        updateChart(newVal);
      }
    },
    { deep: true }
  );

  // Watch for chart instance initialization if data comes first
  watch(monthlyChartInstance, (newVal) => {
    if (newVal && props.monthlyData) {
      updateChart(props.monthlyData);
    }
  });

  return { monthlyChartRef, initMonthlyChart };
};

const { monthlyChartRef, initMonthlyChart } = useMonthlyChart();
</script>

<style scoped>
.card {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  margin-bottom: 30rpx;
}

.card:active {
  transform: translateY(2rpx);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.card-header {
  margin-bottom: 20rpx;
}

.card-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.chart-container {
  height: 400rpx;
  background-color: #fafafa;
  border-radius: 16rpx;
  padding: 20rpx;
}

.stats-row {
  display: flex;
  gap: 20rpx;
  flex-wrap: wrap;
}

.stat-card {
  flex: 1;
  min-width: 200rpx;
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  text-align: center;
  transition: all 0.3s ease;
}

.stat-card:active {
  transform: translateY(2rpx);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.stat-card-label {
  font-size: 24rpx;
  color: #666;
  display: block;
  margin-bottom: 10rpx;
}

.stat-card-value {
  font-size: 36rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 5rpx;
}

.stat-card-value.primary {
  color: #667eea;
}

.stat-card-value.success {
  color: #67c23a;
}

.stat-card-unit {
  font-size: 22rpx;
  color: #999;
  display: block;
}
</style>
