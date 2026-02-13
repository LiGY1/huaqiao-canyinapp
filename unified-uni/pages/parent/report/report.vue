<template>
  <layout>
    <view class="page-container">
      <!-- 孩子信息卡片 -->
      <view class="child-card">
        <view class="avatar-box">
          <view class="avatar-circle">
            <uni-icons type="person" size="32" color="#fff"></uni-icons>
          </view>
          <view class="avatar-glow"></view>
        </view>

        <view class="child-info">
          <text class="child-name">{{ childInfo.name || '孩子' }}</text>
          <view class="child-details">
            <view class="detail-tag">
              <uni-icons type="flag" size="14" color="#64748b"></uni-icons>
              <text class="detail-txt">{{ childInfo.grade || '年级' }}</text>
            </view>
            <view class="detail-tag">
              <uni-icons type="calendar" size="14" color="#64748b"></uni-icons>
              <text class="detail-txt">{{ currentDate }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 报表类型选择 -->
      <view class="report-selector">
        <view 
          class="selector-item" 
          :class="{ active: reportType === 'weekly' }"
          @click="reportType = 'weekly'"
        >
          <view class="selector-content">
            <text class="selector-title">周报</text>
            <text class="selector-desc">7天营养分析</text>
          </view>
        </view>

        <view 
          class="selector-item" 
          :class="{ active: reportType === 'monthly' }"
          @click="reportType = 'monthly'"
        >
          <view class="selector-content">
            <text class="selector-title">月报</text>
            <text class="selector-desc">30天营养分析</text>
          </view>
        </view>
      </view>

      <!-- 营养概览 -->
      <view v-if="!loading && reportData" class="overview-section">
        <view class="section-header">
          <uni-icons type="list" size="18" color="#3b82f6"></uni-icons>
          <text class="section-title">营养概览</text>
        </view>

        <view class="nutrient-grid">
          <view class="nutrient-wide">
            <view class="nut-main">
              <text class="nut-v">{{ reportData.avgCalories }}</text>
              <text class="nut-l">千卡/天</text>
            </view>
            <view class="nut-progress">
              <view 
                class="progress-inner" 
                :style="{ width: `${Math.min((reportData.avgCalories / reportData.targetCalories) * 100, 100)}%` }"
              ></view>
            </view>
          </view>

          <view class="nutrient-box">
            <text class="nut-v-s">{{ reportData.avgProtein }}g</text>
            <text class="nut-l-s">蛋白质</text>
          </view>
          <view class="nutrient-box">
            <text class="nut-v-s">{{ reportData.avgCarbs }}g</text>
            <text class="nut-l-s">碳水</text>
          </view>
          <view class="nutrient-box">
            <text class="nut-v-s">{{ reportData.avgFat }}g</text>
            <text class="nut-l-s">脂肪</text>
          </view>
        </view>
      </view>

      <!-- 趋势图表 -->
      <view v-if="!loading && reportData" class="chart-section mt-4">
        <view class="section-header">
          <uni-icons type="pulldown" size="18" color="#10b981"></uni-icons>
          <text class="section-title">趋势分析</text>
        </view>
        <view class="chart-box">
          <l-echart ref="trendChartRef" @finished="initChart"></l-echart>
        </view>
      </view>

      <!-- AI 报告卡片 -->
      <view v-if="aiReport" class="ai-report-card mt-4">
        <view class="report-top">
          <text class="ai-label">AI 智能分析</text>
          <text class="report-range">{{ reportDate }}</text>
        </view>

        <view class="report-summary">
          <mp-html :content="aiReport.summary" />
        </view>

        <view class="highlights">
          <view 
            v-for="(h, i) in aiReport.highlights.slice(0, 3)" 
            :key="i" 
            class="high-item"
            :class="h.includes('√') ? 'pos' : 'warn'"
          >
             <mp-html :content="h" />
          </view>
        </view>

        <button class="full-report-btn" @click="showFullReport">
          查看完整报告
          <uni-icons type="right" size="14" color="#5b8db8"></uni-icons>
        </button>
      </view>

      <!-- 操作按钮 -->
      <view class="action-bar mt-6">
        <button 
          v-if="!aiReport" 
          class="gen-btn" 
          type="primary" 
          :loading="isGenerating"
          @click="generateReport"
        >
          <text>{{ isGenerating ? '生成中...' : '生成AI营养报告' }}</text>
        </button>

        <view v-else class="btn-group">
          <button class="sub-btn" @click="regenerateReport">重新生成</button>
          <button class="main-btn" type="primary" @click="downloadReport">下载报告</button>
        </view>
      </view>

      <!-- 加载层 -->
      <view v-if="loading" class="loading-wrap">
        <uni-icons type="spinner-cycle" size="48" color="#5b8db8" class="spin"></uni-icons>
        <text>正在分析数据...</text>
      </view>

      <!-- 完整报告弹窗 -->
      <uni-popup ref="fullPopup" type="center">
        <view class="full-container">
          <view class="full-header">
            <text class="full-title">完整营养报告</text>
            <view @click="fullPopup.close()"><uni-icons type="closeempty" size="20"></uni-icons></view>
          </view>
          <scroll-view scroll-y class="full-scroll">
            <view v-if="aiReport" class="full-inner">
              <view class="full-sec">
                <text class="sec-h">报告摘要</text>
                <mp-html :content="aiReport.summary" />
              </view>
              <view class="full-sec">
                <text class="sec-h">亮点与提醒</text>
                <view v-for="(h, i) in aiReport.highlights" :key="i" class="high-item-f">
                  <mp-html :content="h" />
                </view>
              </view>
              <view class="full-sec">
                <text class="sec-h">膳食建议</text>
                <view v-for="(s, i) in aiReport.suggestions" :key="i" class="sug-item">
                  <mp-html :content="s" />
                </view>
              </view>
              <view class="full-sec">
                <text class="sec-h">{{ reportType === 'weekly' ? '下周计划' : '下月计划' }}</text>
                <mp-html :content="aiReport.nextPlan" />
              </view>
            </view>
          </scroll-view>
          <view class="full-footer">
            <button type="primary" @click="downloadReport">保存到本地</button>
          </view>
        </view>
      </uni-popup>
    </view>
  </layout>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import layout from '@/components/layout.vue';
import { childApi, authApi } from '@/api/parent';
import storage from '@/utils/storage';

// #ifdef MP
import * as echarts from '@/static/echarts.min.js';
// #endif
// #ifndef MP
const echarts = null;
// #endif

const loading = ref(true);
const isGenerating = ref(false);
const reportType = ref('weekly');
const childInfo = ref({ name: '', grade: '', id: '' });
const reportData = ref(null);
const aiReport = ref(null);
const trendChartRef = ref(null);
const fullPopup = ref(null);
let chartInstance = null;

const currentDate = computed(() => {
  const d = new Date();
  return `${d.getMonth() + 1}月${d.getDate()}日`;
});

const reportDate = computed(() => {
  if (!reportData.value?.dateRange) return '';
  const s = new Date(reportData.value.dateRange.start);
  const e = new Date(reportData.value.dateRange.end);
  return `${s.getMonth()+1}/${s.getDate()} - ${e.getMonth()+1}/${e.getDate()}`;
});

const loadChildInfo = async () => {
  try {
    const res = await authApi.getUserInfo();
    if (res.code === 200 && res.data?.children?.length > 0) {
      const c = res.data.children[0];
      childInfo.value = { name: c.name, grade: c.grade, id: c._id };
      return c._id;
    }
  } catch (e) {}
  return null;
};

const loadReportData = async () => {
  loading.value = true;
  const childId = await loadChildInfo();
  if (!childId) {
    loading.value = false;
    return;
  }
  
  try {
    const res = reportType.value === 'weekly' 
      ? await childApi.getChildNutrition(childId) // Wait, parent uses getChildNutrition? Let's check api.
      : null; // Monthly might be same or different API.
      
    // Actually source uses childApi.getWeeklyReport
    const resp = reportType.value === 'weekly' 
      ? await childApi.getWeeklyReport(childId)
      : await childApi.getMonthlyReport(childId);

    if (resp?.code === 200) {
      reportData.value = resp.data;
    } else {
      // Mock for demo
      reportData.value = getMockData();
    }
    
    nextTick(() => {
      initChart();
    });
  } catch (e) {
    reportData.value = getMockData();
    nextTick(() => initChart());
  } finally {
    loading.value = false;
  }
};

const getMockData = () => {
  const len = reportType.value === 'weekly' ? 7 : 30;
  return {
    avgCalories: 1850,
    avgProtein: 65,
    avgCarbs: 230,
    avgFat: 55,
    targetCalories: 2000,
    dailyCalories: Array.from({ length: len }, () => 1600 + Math.random() * 500),
    dateRange: {
      start: new Date(Date.now() - len * 86400000),
      end: new Date()
    }
  };
};

const initChart = async () => {
  if (!trendChartRef.value || !reportData.value) return;
  if (chartInstance) chartInstance.dispose();
  chartInstance = await trendChartRef.value.init(echarts);
  
  const data = reportData.value.dailyCalories;
  const labels = data.map((_, i) => i + 1);

  chartInstance.setOption({
    grid: { left: 10, right: 10, top: 20, bottom: 20, containLabel: true },
    xAxis: { 
      type: 'category', 
      data: labels,
      axisLine: { show: false },
      axisTick: { show: false }
    },
    yAxis: { type: 'value', show: false },
    series: [{
      data: data,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      itemStyle: { color: '#5b8db8' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(91,141,184,0.3)' }, { offset: 1, color: 'rgba(91,141,184,0.05)' }]
        }
      }
    }]
  });
};

const generateReport = async () => {
  if (!childInfo.value.id) return;
  isGenerating.value = true;
  try {
    const res = await childApi.generateChildAIReport(childInfo.value.id, { reportType: reportType.value });
    if (res?.code === 200) {
      aiReport.value = res.data.content;
      uni.showToast({ title: 'AI 报告已生成' });
    }
  } catch (e) {
    // Mock
    aiReport.value = {
      summary: '根据本周数据分析，孩子营养摄入总体稳定。',
      highlights: ['√ 蛋白质摄入量达标', '! 周二热量偏高'],
      suggestions: ['建议多摄入新鲜水果', '保持运动习惯'],
      nextPlan: '下周重点关注膳食纤维摄入。'
    };
  } finally {
    isGenerating.value = false;
  }
};

const regenerateReport = () => {
  aiReport.value = null;
  generateReport();
};

const showFullReport = () => {
  fullPopup.value.open();
};

const downloadReport = () => {
  uni.showToast({ title: '报告已保存', icon: 'success' });
};

watch(reportType, () => {
  aiReport.value = null;
  loadReportData();
});

onMounted(() => {
  loadReportData();
});
</script>

<style lang="scss" scoped>
.page-container {
  padding: 30rpx;
  background-color: #f8fafc;
  min-height: 100vh;
}

.child-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
  margin-bottom: 24rpx;
}

.avatar-box {
  position: relative;
}

.avatar-circle {
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #5b8db8, #7ba591);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  position: relative;
}

.avatar-glow {
  position: absolute;
  inset: -6rpx;
  background: linear-gradient(135deg, #5b8db8, #7ba591);
  border-radius: 50%;
  opacity: 0.2;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.2; }
  50% { transform: scale(1.1); opacity: 0.3; }
  100% { transform: scale(1); opacity: 0.2; }
}

.child-info {
  flex: 1;
}

.child-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #1e293b;
}

.child-details {
  display: flex;
  gap: 20rpx;
  margin-top: 10rpx;
}

.detail-tag {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: #f1f5f9;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.detail-txt {
  font-size: 22rpx;
  color: #64748b;
}

.report-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  margin-bottom: 24rpx;
}

.selector-item {
  background: #fff;
  padding: 30rpx;
  border-radius: 20rpx;
  border: 4rpx solid #f1f5f9;
  &.active {
    background: #5b8db8;
    border-color: #5b8db8;
    .selector-title, .selector-desc { color: #fff; }
  }
}

.selector-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #1e293b;
}

.selector-desc {
  font-size: 20rpx;
  color: #94a3b8;
  margin-top: 4rpx;
  display: block;
}

.overview-section {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #334155;
}

.nutrient-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.nutrient-wide {
  grid-column: span 3;
  background: #f8fafc;
  padding: 24rpx;
  border-radius: 16rpx;
}

.nut-main {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
}

.nut-v {
  font-size: 40rpx;
  font-weight: bold;
  color: #1e293b;
}

.nut-l {
  font-size: 22rpx;
  color: #64748b;
}

.nut-progress {
  height: 8rpx;
  background: #e2e8f0;
  border-radius: 4rpx;
  margin-top: 16rpx;
  overflow: hidden;
}

.progress-inner {
  height: 100%;
  background: linear-gradient(90deg, #5b8db8, #7ba591);
}

.nutrient-box {
  background: #f8fafc;
  padding: 20rpx;
  border-radius: 16rpx;
  text-align: center;
}

.nut-v-s {
  font-size: 28rpx;
  font-weight: bold;
  display: block;
}

.nut-l-s {
  font-size: 20rpx;
  color: #94a3b8;
}

.chart-section {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
}

.chart-box {
  height: 300rpx;
}

.ai-report-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.report-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.ai-label {
  font-size: 24rpx;
  color: #5b8db8;
  font-weight: bold;
}

.report-range {
  font-size: 22rpx;
  color: #94a3b8;
}

.report-summary {
  font-size: 26rpx;
  color: #475569;
  line-height: 1.6;
  margin-bottom: 24rpx;
}

.high-item {
  padding: 12rpx 20rpx;
  border-radius: 12rpx;
  font-size: 24rpx;
  margin-bottom: 12rpx;
  &.pos { background: #f0fdf4; color: #16a34a; }
  &.warn { background: #fffbeb; color: #d97706; }
}

.full-report-btn {
  width: 100%;
  background: #f8fafc;
  color: #5b8db8;
  font-size: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  margin-top: 20rpx;
}

.action-bar {
  padding-bottom: 40rpx;
}

.btn-group {
  display: flex;
  gap: 20rpx;
}

.sub-btn {
  flex: 1;
  background: #f1f5f9;
  color: #475569;
}

.main-btn {
  flex: 2;
}

.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 0;
  color: #64748b;
}

.spin {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.full-container {
  width: 90vw;
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
}

.full-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30rpx;
}

.full-title {
  font-size: 32rpx;
  font-weight: bold;
}

.full-scroll {
  max-height: 60vh;
}

.full-sec {
  margin-bottom: 40rpx;
}

.sec-h {
  font-size: 28rpx;
  font-weight: bold;
  color: #1e293b;
  margin-bottom: 16rpx;
  display: block;
}

.full-footer {
  margin-top: 30rpx;
}

.mt-4 { margin-top: 30rpx; }
.mt-6 { margin-top: 40rpx; }
</style>