<template>
  <uni-popup ref="popup" type="bottom" background-color="#fff">
    <view class="popup-content">
      <view class="popup-header">
        <text class="title">健康档案详情</text>
        <uni-icons type="closeempty" size="24" @click="close"></uni-icons>
      </view>
      <scroll-view scroll-y class="popup-scroll">
        <view class="detail-body">
          <!-- 基本信息 -->
          <view class="detail-section">
            <view class="section-title">基本信息</view>
            <view class="info-grid">
              <view class="info-item">
                <text class="l">姓名</text>
                <text class="v">{{ student.studentName }}</text>
              </view>
              <view class="info-item">
                <text class="l">性别</text>
                <text class="v">{{ student.gender }}</text>
              </view>
              <view class="info-item">
                <text class="l">学号</text>
                <text class="v">{{ student.studentId }}</text>
              </view>
              <view class="info-item">
                <text class="l">视力</text>
                <text class="v">{{ student.vision }}</text>
              </view>
            </view>
          </view>
          <!-- 图表 -->
          <view class="detail-section">
            <view class="section-title">近7日营养摄入趋势</view>
            <view class="chart-wrapper">
              <l-echart ref="chartRef"></l-echart>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
  </uni-popup>
</template>

<script setup>
import { ref, nextTick } from "vue";

// #ifdef MP
import echarts from "@/static/echarts.min.js";
// #endif
// #ifndef MP
const echarts = null;
// #endif

const props = defineProps({
  student: Object,
});

const popup = ref(null);
const chartRef = ref(null);

const open = async () => {
  popup.value.open();
  setTimeout(async () => {
    initChart();
  }, 0);
};

const close = () => {
  popup.value.close();
};

const initChart = async () => {
  if (!chartRef.value) {
    return;
  }
  const chart = await chartRef.value.init(echarts);

  console.log(props.student, ">>");

  chart.setOption({
  tooltip: {
    trigger: "axis",
    // 添加单位显示，让提示框更专业
    formatter: function (params) {
      let result = params[0].name + '<br/>';
      params.forEach(function (item) {
        let unit = item.seriesName === '热量' ? ' kcal' : (item.seriesName === '蛋白质' ? ' g' : ' %');
        result += item.marker + item.seriesName + ": " + item.value + unit + '<br/>';
      });
      return result;
    }
  },
  legend: {
    data: ["热量", "蛋白质", "维生素"],
    top: 0
  },
  grid: {
    left: "3%",
    right: "4%",
    bottom: "3%",
    top: "15%",
    containLabel: true
  },
  xAxis: {
    type: "category",
    data: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
    axisLine: { lineStyle: { color: "#888" } }
  },
  // --- 关键修改：双 Y 轴 ---
  yAxis: [
    {
      type: "value",
      name: "热量 (kcal)",
      position: "left",
      min: 1500, // 设置最小值，避免曲线看起来太扁
      max: 2800,
      axisLabel: { color: "#666" }
    },
    {
      type: "value",
      name: "营养含量",
      position: "right",
      min: 40,
      max: 120, // 适配蛋白质和维生素的范围
      axisLabel: { formatter: '{value}', color: "#666" },
      splitLine: { show: false } // 右侧不显示分割线，保持背景整洁
    }
  ],
  series: [
    {
      name: "热量",
      type: "line",
      yAxisIndex: 0, // 绑定到左侧 Y 轴
      // 模拟逻辑：周五周六聚餐热量飙升，周日稍微节食
      data: [1850, 1820, 1900, 1880, 2450, 2380, 1650],
      smooth: true,
      symbolSize: 8,
      itemStyle: { color: "#f59e0b" },
      lineStyle: { width: 3 }
    },
    {
      name: "蛋白质",
      type: "line",
      yAxisIndex: 1, // 绑定到右侧 Y 轴
      // 模拟逻辑：周五吃高热量垃圾食品，蛋白质反而可能下降；周一健身日摄入高
      data: [85, 82, 78, 80, 55, 60, 75],
      smooth: true,
      symbolSize: 6,
      itemStyle: { color: "#10b981" },
      lineStyle: { width: 2.5 }
    },
    {
      name: "维生素",
      type: "line",
      yAxisIndex: 1, // 绑定到右侧 Y 轴
      // 模拟逻辑：假设这是“每日推荐摄入百分比”，周末吃蔬菜少，数值下降
      data: [92, 95, 88, 85, 65, 70, 98],
      smooth: true,
      symbolSize: 6,
      itemStyle: { color: "#3b82f6" },
      lineStyle: { width: 2.5 }
    },
  ],
});
};

defineExpose({ open, close });
</script>

<style lang="scss" scoped>
.popup-content {
  background: #fff;
  border-radius: 40rpx 40rpx 0 0;
  height: 85vh;
  display: flex;
  flex-direction: column;

  .popup-header {
    padding: 40rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1rpx solid #f1f5f9;
    .title {
      font-size: 32rpx;
      font-weight: bold;
    }
  }

  .popup-scroll {
    flex: 1;
    padding: 30rpx;
  }
}

.detail-section {
  margin-bottom: 40rpx;
  .section-title {
    font-size: 28rpx;
    font-weight: bold;
    color: #1e293b;
    margin-bottom: 20rpx;
    padding-left: 16rpx;
    border-left: 6rpx solid #4facfe;
  }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  .info-item {
    background: #f8fafc;
    padding: 24rpx;
    border-radius: 16rpx;
    .l {
      font-size: 24rpx;
      color: #64748b;
      display: block;
      margin-bottom: 4rpx;
    }
    .v {
      font-size: 30rpx;
      font-weight: 600;
      color: #1e293b;
    }
  }
}

.chart-wrapper {
  height: 500rpx;
  background: #f8fafc;
  border-radius: 16rpx;
  padding: 20rpx;
}
</style>
