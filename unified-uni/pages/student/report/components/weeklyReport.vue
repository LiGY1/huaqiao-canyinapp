<template>
  <view class="weekly-report">
    <!-- 热量摄入分析 -->
    <view class="card">
      <view class="card-header">
        <text class="card-title">热量摄入分析</text>
      </view>
      <view class="chart-container">
        <l-echart ref="caloriesChartRef" @finished="initCaloriesChart"></l-echart>
      </view>
      <view class="stats-grid">
        <view class="stat-item">
          <text class="stat-label">日均摄入热量</text>
          <text class="stat-value">{{ weeklyData.avgCalories }}</text>
          <text class="stat-unit">千卡/天</text>
        </view>
        <view class="stat-item">
          <text class="stat-label">目标达成</text>
          <text class="stat-value success"
            >{{ ((weeklyData.avgCalories / weeklyData.targetCalories) * 100 || 0).toFixed(1) }}%</text
          >
          <text class="stat-unit">目标: {{ weeklyData.targetCalories }}千卡</text>
        </view>
      </view>
    </view>

    <!-- 营养素分析 -->
    <view class="card">
      <view class="card-header">
        <text class="card-title">营养素分析</text>
      </view>
      <view class="chart-container">
        <l-echart ref="nutrientsCharttRef" @finished="initNutrientsChart"></l-echart>
      </view>
      <view class="nutrition-scores">
        <view v-for="(value, key) in weeklyData.nutritionScore" :key="key" class="score-item">
          <text class="score-label">{{ getNutrientLabel(key) }}</text>
          <view class="score-progress">
            <progress :percent="value" :show-info="false" class="progress-bar" :activeColor="getProgressColor(value)" />
            <text class="score-value">{{ value }}%</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-row">
      <view class="stat-card deficit-card">
        <view class="stat-icon-wrapper">
          <uni-icons type="fire-filled" size="24" color="#f56c6c"></uni-icons>
        </view>
        <view class="stat-content">
          <text class="stat-card-label">热量缺口累积</text>
          <view class="stat-value-unit">
            <text class="stat-card-value danger">{{ weeklyData.calorieDeficit }}</text>
            <text class="stat-card-unit">千卡</text>
          </view>
        </view>
      </view>
      <view class="stat-card sugar-card">
        <view class="stat-icon-wrapper">
          <uni-icons type="info-filled" size="24" color="#e6a23c"></uni-icons>
        </view>
        <view class="stat-content">
          <text class="stat-card-label">日均添加糖</text>
          <view class="stat-value-unit">
            <text class="stat-card-value warning">{{ weeklyData.avgSugar }}</text>
            <text class="stat-card-unit">g</text>
          </view>
          <text class="stat-sub-text">建议 ≤ 50g/天</text>
        </view>
      </view>
      <view class="stat-card range-card">
        <view class="stat-header">
          <uni-icons type="calendar-filled" size="16" color="#667eea"></uni-icons>
          <text class="stat-card-label">报告周期</text>
        </view>
        <text class="stat-card-value primary range-text">{{ weeklyData.weekRange }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch, unref, watchEffect } from "vue";
// 仅在小程序环境下引入 ECharts
// #ifdef MP
import echarts from "../../../../static/echarts.min.js";
// #endif
// #ifndef MP
const echarts = null; // H5 和 App 环境不需要手动引入
// #endif

const props = defineProps({
  weeklyData: {
    type: Object,
  },
});

// 获取营养素标签
const getNutrientLabel = (key) => {
  const labels = {
    carbs: "碳水化合物",
    protein: "蛋白质",
    fat: "脂肪",
    fiber: "膳食纤维",
    vitamin: "维生素",
  };
  return labels[key] || key;
};

// 获取进度条颜色
const getProgressColor = (value) => {
  if (value >= 80) return "#67c23a";
  if (value >= 60) return "#e6a23c";
  return "#f56c6c";
};

const useCaloriesChart = () => {
  const caloriesChartRef = ref(null);
  let caloriesCharts = null;

  const initCaloriesChart = async () => {
    // 初始化图表
    if (!caloriesChartRef.value) return;
    try {
      caloriesCharts = await caloriesChartRef.value.init(echarts);

      const option = {
        animation: true,
        animationDuration: 800,
        color: ["#409eff", "#67c23a"],
        tooltip: {
          trigger: "axis",
          confine: true,
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          borderWidth: 0,
          padding: 10,
          textStyle: {
            color: "#333",
            fontSize: 12,
          },
          axisPointer: {
            type: "shadow",
            shadowStyle: {
              color: "rgba(0,0,0,0.05)",
            },
          },
        },
        legend: {
          data: ["实际摄入", "目标摄入"],
          top: 0,
          right: 10,
          itemWidth: 15,
          itemHeight: 10,
          textStyle: {
            fontSize: 11,
          },
        },
        grid: {
          top: 35,
          left: "2%",
          right: "4%",
          bottom: "3%",
          containLabel: true,
        },
        xAxis: {
          type: "category",
          data: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
          axisLabel: {
            fontSize: 11, // 字体缩小
            color: "#666",
            margin: 10,
          },
          axisLine: {
            lineStyle: {
              color: "#e0e6ed",
            },
          },
          axisTick: {
            show: false,
          },
        },
        yAxis: {
          type: "value",
          name: "热量(千卡)",
          nameLocation: "end",
          nameTextStyle: {
            color: "#999",
            fontSize: 11,
            align: "center",
          },
          nameGap: 15,
          splitLine: {
            lineStyle: {
              color: "#f0f5ff",
              type: "dashed",
            },
          },
          axisLabel: {
            fontSize: 10,
            color: "#999",
            formatter: (v) => Math.round(v),
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
            name: "实际摄入",
            type: "bar",
            barWidth: "40%",
            itemStyle: {
              borderRadius: [4, 4, 0, 0],
              color: "#409eff",
            },
          },
          {
            name: "目标摄入",
            type: "line",
            smooth: true,
            showSymbol: false,
            symbol: "circle",
            symbolSize: 8,
            itemStyle: {
              color: "#67c23a",
            },
            lineStyle: {
              type: "dashed",
              width: 2,
              opacity: 0.8,
            },
          },
        ],
      };
      caloriesCharts.setOption(option);

      // 若有图表数据则设置图表数据
      if (props.weeklyData) {
        setCaloriesChart(props.weeklyData);
      }
    } catch (error) {
      console.error("图表初始化失败:", error);
    }
  };

  // 2. 设置图表数据
  const setCaloriesChart = (weeklyData) => {
    caloriesCharts.setOption({
      series: [{ data: weeklyData.dailyCalories }, { data: new Array(7).fill(weeklyData.targetCalories) }],
    });
  };

  // 1. ------------------------
  watchEffect(() => {
    // 如果没有数据和图表实例则什么也不做
    if (!props.weeklyData || !caloriesCharts) {
      return;
    }

    // 执行图表更新
    setCaloriesChart(props.weeklyData);
  });
  // -----------------------

  return {
    initCaloriesChart,
    caloriesChartRef,
  };
};

const { initCaloriesChart, caloriesChartRef } = useCaloriesChart();

const useNutrientsChart = () => {
  const nutrientsCharttRef = ref(null);
  const nutrientsChart = ref(null);

  const initNutrientsChart = async () => {
    if (!nutrientsCharttRef.value) return;
    const indicators = [
      {
        name: "碳水化合物",
        min: 0,
        max: 100,
      },
      {
        name: "蛋白质",
        min: 0,
        max: 100,
      },
      {
        name: "脂肪",
        min: 0,
        max: 100,
      },
      {
        name: "膳食纤维",
        min: 0,
        max: 100,
      },
      {
        name: "维生素",
        min: 0,
        max: 100,
      },
    ];
    const option = {
      animation: true,
      animationDuration: 2000,
      animationEasing: "cubicOut",
      animationDelay: (idx) => idx * 100,
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderColor: "#e4e7ed",
        borderWidth: 1,
        borderRadius: 8,
        padding: [8, 12],
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        textStyle: {
          color: "#333",
          fontSize: 12,
        },
        formatter: (params) => {
          const values = params.value;
          let listHtml =
            '<div style="font-weight: bold; margin-bottom: 6px; color: #1a5f9e; font-size: 13px;">营养达标率</div>';

          indicators.forEach((item, index) => {
            const val = values[index];
            const color = val >= 80 ? "#67c23a" : val >= 60 ? "#e6a23c" : "#f56c6c";
            listHtml += `
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; min-width: 140px;">
                <span style="color: #606266; font-size: 12px;">${item.name}</span>
                <span style="color: ${color}; font-weight: bold; font-size: 12px;">${val}%</span>
              </div>
             `;
          });

          return listHtml;
        },
      },
      radar: {
        indicator: indicators.map((item) => ({
          ...item,
          color: "#606266",
        })),
        shape: "polygon",
        splitNumber: 4,
        radius: "55%",
        center: ["50%", "50%"],
        axisNameGap: 10,
        alignTicks: false, // 禁用刻度对齐，避免警告
        axisName: {
          color: "#2c3e50",
          fontSize: 14,
          fontWeight: "600",
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: [0, 8],
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          borderRadius: 8,
          rich: {},
        },
        splitLine: {
          lineStyle: {
            color: "rgba(26, 95, 158, 0.15)",
            width: 2,
            type: "solid",
          },
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: [
              "rgba(26, 95, 158, 0.08)",
              "rgba(26, 95, 158, 0.06)",
              "rgba(26, 95, 158, 0.04)",
              "rgba(26, 95, 158, 0.02)",
            ],
          },
        },
        axisLine: {
          lineStyle: {
            color: "rgba(26, 95, 158, 0.3)",
            width: 2,
          },
        },
      },
      series: [
        {
          type: "radar",
        },
      ],
    };

    try {
      nutrientsChart.value = await nutrientsCharttRef.value.init(echarts);

      nutrientsChart.value.setOption(option);
    } catch (error) {
      console.error("图表初始化失败:", error);
    }
  };

  const setNutrientsChart = (weeklyData) => {
    nutrientsChart.value.setOption({
      series: [
        {
          type: "radar",
          data: [
            {
              value: [
                weeklyData.nutritionScore.carbs || 0,
                weeklyData.nutritionScore.protein || 0,
                weeklyData.nutritionScore.fat || 0,
                weeklyData.nutritionScore.fiber || 0,
                weeklyData.nutritionScore.vitamin || 0,
              ],
              name: "营养摄入达标率",
              areaStyle: {
                opacity: 0.9,
              },
              itemStyle: {
                color: "#fff",
                borderWidth: 3,
                borderColor: "#1a5f9e",
                shadowColor: "rgba(26, 95, 158, 0.6)",
                shadowBlur: 20,
              },
              lineStyle: {
                width: 3,
                color: "#1a5f9e",
                shadowColor: "rgba(26, 95, 158, 0.4)",
                shadowBlur: 10,
                cap: "round",
                join: "round",
              },
              symbol: "circle",
              symbolSize: 10,
              label: {
                show: true,
                fontSize: 12,
                fontWeight: "bold",
                color: "#1a5f9e",
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                padding: [4, 8],
                borderRadius: 6,
                formatter: "{c}%",
                distance: 10,
              },
              emphasis: {
                areaStyle: {},
                itemStyle: {
                  borderWidth: 5,
                  shadowBlur: 25,
                  shadowColor: "rgba(26, 95, 158, 0.8)",
                },
                lineStyle: {
                  width: 4,
                  shadowBlur: 15,
                },
                label: {
                  show: true,
                  fontSize: 14,
                  fontWeight: "bold",
                },
              },
            },
          ],
        },
      ],
    });
  };

  watch([() => props.weeklyData, nutrientsChart], ([data, nutrientsChart]) => {
    if (!data || !nutrientsChart) {
      return;
    }
    setNutrientsChart(data);
  });
  return {
    nutrientsCharttRef,
    initNutrientsChart,
  };
};

const { nutrientsCharttRef, initNutrientsChart } = useNutrientsChart();
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
  margin-bottom: 30rpx;
  background-color: #fafafa;
  border-radius: 16rpx;
  padding: 20rpx;
}

.chart {
  width: 100%;
  height: 100%;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.stat-item {
  background-color: #f9f9f9;
  border-radius: 12rpx;
  padding: 20rpx;
  text-align: center;
  transition: all 0.3s ease;
}

.stat-item:active {
  transform: scale(0.98);
}

.stat-label {
  font-size: 24rpx;
  color: #666;
  display: block;
  margin-bottom: 10rpx;
}

.stat-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #409eff;
  display: block;
  margin-bottom: 5rpx;
}

.stat-value.success {
  color: #67c23a;
}

.stat-value.warning {
  color: #e6a23c;
}

.stat-value.danger {
  color: #f56c6c;
}

.stat-unit {
  font-size: 22rpx;
  color: #999;
  display: block;
}

.nutrition-scores {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.score-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.score-label {
  font-size: 26rpx;
  color: #666;
  width: 140rpx;
}

.score-progress {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 10rpx;
}

.progress-bar {
  flex: 1;
  height: 12rpx;
  background-color: #f0f0f0;
  border-radius: 6rpx;
}

.score-value {
  font-size: 24rpx;
  font-weight: bold;
  width: 60rpx;
  text-align: right;
}

.stats-row {
  display: flex;
  gap: 20rpx;
  flex-wrap: wrap;
}

.stat-card {
  flex: 1;
  min-width: 280rpx;
  background-color: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 20rpx;
  border: 2rpx solid transparent;
}

.stat-card:active {
  transform: scale(0.98);
}

.stat-card.deficit-card {
  background: linear-gradient(to right bottom, #fff5f5, #fff);
  border-color: #fde2e2;
}

.stat-card.sugar-card {
  background: linear-gradient(to right bottom, #fdf6ec, #fff);
  border-color: #faecd8;
}

/* Range card specific styling */
.stat-card.range-card {
  flex-basis: 100%;
  /* Make it separate row if wrapped, or full width if needed */
  background: linear-gradient(to right, #f0f5ff, #f6f8ff);
  border-color: #d9ecff;
  flex-direction: column;
  align-items: flex-start;
  gap: 10rpx;
}

.stat-icon-wrapper {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.deficit-card .stat-icon-wrapper {
  background-color: #fef0f0;
}

.sugar-card .stat-icon-wrapper {
  background-color: #fdf6ec;
}

.stat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 5rpx;
}

.stat-card-label {
  font-size: 24rpx;
  color: #606266;
  font-weight: 500;
}

.stat-value-unit {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}

.stat-card-value {
  font-size: 38rpx;
  font-weight: 800;
  line-height: 1.2;
}

.stat-card-value.danger {
  color: #f56c6c;
}

.stat-card-value.warning {
  color: #e6a23c;
}

.stat-card-value.primary {
  color: #667eea;
}

.stat-card-unit {
  font-size: 22rpx;
  color: #909399;
}

.stat-sub-text {
  font-size: 20rpx;
  color: #909399;
  margin-top: 4rpx;
}

.range-text {
  font-size: 30rpx !important;
  font-family: "Roboto", sans-serif;
  letter-spacing: 0.5rpx;
}
</style>
