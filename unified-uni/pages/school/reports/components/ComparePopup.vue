<template>
  <uni-popup ref="popup" type="bottom" background-color="#fff">
    <view class="popup-content">
      <view class="popup-header">
        <text class="title">体检数据趋势分析</text>
        <uni-icons type="closeempty" size="24" @click="close"></uni-icons>
      </view>
      <scroll-view scroll-y class="popup-scroll">
        <view class="chart-wrapper large">
          <l-echart ref="chartRef"></l-echart>
        </view>
        <view class="exam-table" v-if="examHistory.length">
          <view class="th">
            <text class="td">日期</text>
            <text class="td">身高</text>
            <text class="td">体重</text>
            <text class="td">BMI</text>
          </view>
          <view v-for="(exam, idx) in examHistory" :key="idx" class="tr">
            <text class="td">{{ exam.examDate }}</text>
            <text class="td">{{ exam.height }}</text>
            <text class="td">{{ exam.weight }}</text>
            <text class="td">{{ exam.bmi }}</text>
          </view>
        </view>
      </scroll-view>
    </view>
  </uni-popup>
</template>

<script setup>
import { ref, nextTick } from 'vue'

// #ifdef MP
import echarts from '@/static/echarts.min.js'
// #endif
// #ifndef MP
const echarts = null
// #endif

const props = defineProps({
  examHistory: {
    type: Array,
    default: () => []
  }
})

const popup = ref(null)
const chartRef = ref(null)

const open = async () => {
  popup.value.open()
  await nextTick()
  initChart()
}

const close = () => {
  popup.value.close()
}

const initChart = async () => {
  if (!chartRef.value || !props.examHistory.length) return
  const chart = await chartRef.value.init(echarts)

  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['身高', '体重'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: props.examHistory.map(i => i.examDate) },
    yAxis: { type: 'value' },
    series: [
      {
        name: '身高',
        type: 'line',
        data: props.examHistory.map(i => i.height),
        itemStyle: { color: '#4facfe' },
        smooth: true
      },
      {
        name: '体重',
        type: 'line',
        data: props.examHistory.map(i => i.weight),
        itemStyle: { color: '#00f2fe' },
        smooth: true
      }
    ]
  })
}

defineExpose({ open, close })
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

.chart-wrapper {
  height: 500rpx;
  background: #f8fafc;
  border-radius: 16rpx;
  padding: 20rpx;
  &.large {
    height: 600rpx;
  }
}

.exam-table {
  margin-top: 30rpx;
  border: 1rpx solid #e2e8f0;
  border-radius: 16rpx;
  overflow: hidden;
  .th,
  .tr {
    display: flex;
    .td {
      flex: 1;
      padding: 20rpx;
      font-size: 24rpx;
      text-align: center;
      border-right: 1rpx solid #f1f5f9;
      &:last-child {
        border-right: none;
      }
    }
  }
  .th {
    background: #f8fafc;
    font-weight: bold;
  }
  .tr {
    border-top: 1rpx solid #f1f5f9;
  }
}
</style>
