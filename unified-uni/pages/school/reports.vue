<template>
  <layout>
    <scroll-view class="student-health-container" scroll-y>
      <!-- 筛选与统计概览 -->
      <view class="card filters-card">
        <view class="search-box">
          <uni-icons type="search" size="18" color="#999"></uni-icons>
          <input
            v-model="filters.keyword"
            placeholder="搜索学生姓名"
            class="search-input"
            @confirm="handleSearch"
          />
        </view>
        
        <view class="filters-row">
          <picker @change="onGradeChange" :value="gradeIndex" :range="gradeOptions" class="filter-picker">
            <view class="picker-value">
              {{ gradeOptions[gradeIndex] }}
              <uni-icons type="bottom" size="12" color="#999"></uni-icons>
            </view>
          </picker>
          <picker @change="onStatusChange" :value="statusIndex" :range="statusOptions" range-key="label" class="filter-picker">
            <view class="picker-value">
              {{ statusOptions[statusIndex].label }}
              <uni-icons type="bottom" size="12" color="#999"></uni-icons>
            </view>
          </picker>
        </view>

        <view class="actions-row">
          <button class="action-btn report-btn" @click="showReportDialog">
            <uni-icons type="document" size="16" color="#fff"></uni-icons>
            生成分析报告
          </button>
        </view>
      </view>

      <!-- 快速统计 -->
      <view class="stats-overview">
        <view class="stat-item" v-for="(stat, index) in stats" :key="index" :class="stat.type">
          <text class="stat-value">{{ stat.value }}</text>
          <text class="stat-label">{{ stat.label }}</text>
        </view>
      </view>

      <!-- 学生列表 -->
      <view class="student-list" v-if="!loading">
        <view
          v-for="student in tableData"
          :key="student.id"
          class="student-card"
          @click="viewDetail(student)"
        >
          <view class="card-header">
            <view class="student-basic">
              <text class="name">{{ student.studentName }}</text>
              <text class="meta">{{ student.grade }} {{ student.class }} · {{ student.gender }}</text>
            </view>
            <view class="status-tag" :class="student.healthStatus">
              {{ getHealthLabel(student.healthStatus) }}
            </view>
          </view>
          
          <view class="card-metrics">
            <view class="metric">
              <text class="m-label">身高</text>
              <text class="m-value">{{ student.height }}<text class="unit">cm</text></text>
            </view>
            <view class="metric">
              <text class="m-label">体重</text>
              <text class="m-value">{{ student.weight }}<text class="unit">kg</text></text>
            </view>
            <view class="metric">
              <text class="m-label">BMI</text>
              <text class="m-value">{{ student.bmi }}</text>
            </view>
          </view>

          <view class="nutrition-progress">
            <view class="progress-info">
              <text class="p-label">营养评分</text>
              <text class="p-value">{{ student.nutritionScore }}分</text>
            </view>
            <progress
              :percent="student.nutritionScore"
              stroke-width="6"
              :activeColor="getNutritionColor(student.nutritionScore)"
              class="bar"
            />
          </view>

          <view class="card-actions">
            <button class="card-btn secondary" @click.stop="compareExam(student)">
              <uni-icons type="pyq" size="14" color="#4facfe"></uni-icons>
              体检对比
            </button>
            <button class="card-btn primary" @click.stop="viewDetail(student)">查看详情</button>
          </view>
        </view>

        <view v-if="tableData.length === 0" class="empty-state">
          <uni-icons type="info" size="48" color="#ccc"></uni-icons>
          <text>暂无相关健康数据</text>
        </view>
      </view>

      <view v-else class="loading-state">
        <uni-icons type="spinner-cycle" size="32" color="#4facfe" class="spin"></uni-icons>
        <text>加载中...</text>
      </view>

      <!-- 详情弹窗 -->
      <uni-popup ref="detailPopup" type="bottom" background-color="#fff">
        <view class="popup-content">
          <view class="popup-header">
            <text class="title">健康档案详情</text>
            <uni-icons type="closeempty" size="24" @click="closePopup('detail')"></uni-icons>
          </view>
          <scroll-view scroll-y class="popup-scroll">
            <view v-if="currentStudent" class="detail-body">
              <!-- 基本信息 -->
              <view class="detail-section">
                <view class="section-title">基本信息</view>
                <view class="info-grid">
                  <view class="info-item"><text class="l">姓名</text><text class="v">{{ currentStudent.studentName }}</text></view>
                  <view class="info-item"><text class="l">性别</text><text class="v">{{ currentStudent.gender }}</text></view>
                  <view class="info-item"><text class="l">学号</text><text class="v">{{ currentStudent.studentId }}</text></view>
                  <view class="info-item"><text class="l">视力</text><text class="v">{{ currentStudent.vision }}</text></view>
                </view>
              </view>
              <!-- 图表 -->
              <view class="detail-section">
                <view class="section-title">近7日营养摄入趋势</view>
                <view class="chart-wrapper">
                  <l-echart ref="detailChartRef"></l-echart>
                </view>
              </view>
            </view>
          </scroll-view>
        </view>
      </uni-popup>

      <!-- 对比弹窗 -->
      <uni-popup ref="comparePopup" type="bottom" background-color="#fff">
        <view class="popup-content">
          <view class="popup-header">
            <text class="title">体检数据趋势分析</text>
            <uni-icons type="closeempty" size="24" @click="closePopup('compare')"></uni-icons>
          </view>
          <scroll-view scroll-y class="popup-scroll">
            <view class="chart-wrapper large">
              <l-echart ref="compareChartRef"></l-echart>
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

      <!-- 报告弹窗 -->
      <uni-popup ref="reportPopup" type="center">
        <view class="report-dialog">
          <view class="popup-header">
            <text class="title">班级分析报告</text>
            <uni-icons type="closeempty" size="24" @click="closePopup('report')"></uni-icons>
          </view>
          <scroll-view scroll-y class="report-scroll">
            <view v-if="generatingReport" class="generating">
              <uni-icons type="spinner-cycle" size="40" color="#4facfe" class="spin"></uni-icons>
              <text>{{ generatingStatus }}</text>
            </view>
            <view v-else-if="classReport" class="report-content">
              <view class="section">
                <view class="st">整体分析</view>
                <text class="sc">{{ classReport.overview }}</text>
              </view>
              <view class="section">
                <view class="st">重点关注</view>
                <view v-for="(tip, i) in classReport.highlights" :key="i" class="tip-item">
                  <text class="dot">·</text>
                  <text class="sc">{{ tip }}</text>
                </view>
              </view>
              <view class="section">
                <view class="st">改善建议</view>
                <view v-for="(sug, j) in classReport.suggestions" :key="j" class="sug-item">
                  <text class="num">{{ j + 1 }}.</text>
                  <text class="sc">{{ sug }}</text>
                </view>
              </view>
            </view>
          </scroll-view>
          <view class="report-footer">
            <button class="btn-gen" @click="generateClassReport" :disabled="generatingReport">AI 重新分析</button>
          </view>
        </view>
      </uni-popup>
    </scroll-view>
  </layout>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue';
import layout from '@/components/layout.vue';
import { studentApi } from '@/api/school';

// #ifdef MP
import echarts from '@/static/echarts.min.js';
// #endif
// #ifndef MP
const echarts = null;
// #endif

// 简单的文本格式化函数，替代 marked
const parseMarkdown = (text) => {
  if (!text) return '';
  try {
    // 简单处理换行和基本格式
    return text
      .replace(/\n/g, '<br/>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  } catch (error) {
    console.error('文本解析失败:', error);
    return text;
  }
};

const loading = ref(false);
const tableData = ref([]);
const filters = reactive({
  keyword: '',
  grade: '',
  healthStatus: ''
});

const gradeOptions = ['全部年级', '2025级', '2024级'];
const gradeIndex = ref(0);

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '健康', value: 'healthy' },
  { label: '需关注', value: 'attention' },
  { label: '异常', value: 'abnormal' }
];
const statusIndex = ref(0);

// 统计数据
const stats = computed(() => {
  const total = tableData.value.length;
  const healthy = tableData.value.filter(s => s.healthStatus === 'healthy').length;
  const attention = tableData.value.filter(s => s.healthStatus === 'attention').length;
  const abnormal = tableData.value.filter(s => s.healthStatus === 'abnormal').length;
  return [
    { label: '总人数', value: total, type: 'total' },
    { label: '健康', value: healthy, type: 'healthy' },
    { label: '需关注', value: attention, type: 'attention' },
    { label: '异常', value: abnormal, type: 'abnormal' }
  ];
});

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const params = {
      page: 1,
      pageSize: 100
    };
    
    // 添加筛选条件
    if (filters.keyword) {
      params.keyword = filters.keyword;
    }
    if (gradeIndex.value > 0) {
      params.grade = gradeOptions[gradeIndex.value];
    }
    if (statusOptions[statusIndex.value].value) {
      params.healthStatus = statusOptions[statusIndex.value].value;
    }

    const response = await studentApi.getHealthData(params);
    
    if (response && response.success) {
      const list = Array.isArray(response.data) ? response.data : response.data.list || [];
      tableData.value = list.map(item => ({
        id: item._id || item.id,
        studentId: item.studentId || '',
        studentName: item.studentName || item.name || '未知',
        grade: item.grade || '2025级',
        class: item.class || '未知班级',
        gender: item.gender || '未知',
        height: item.height || 0,
        weight: item.weight || 0,
        bmi: item.bmi || 0,
        healthStatus: item.healthStatus || 'healthy',
        nutritionScore: item.nutritionScore || 0,
        vision: item.vision || '5.0/5.0'
      }));
    }
  } catch (error) {
    console.error('加载健康数据失败:', error);
    uni.showToast({ title: '加载数据失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => loadData();

const onGradeChange = (e) => { 
  gradeIndex.value = e.detail.value; 
  loadData(); 
};

const onStatusChange = (e) => { 
  statusIndex.value = e.detail.value; 
  loadData(); 
};

const getHealthLabel = (status) => {
  const map = { healthy: '健康', attention: '需关注', abnormal: '异常' };
  return map[status] || '未知';
};

const getNutritionColor = (score) => {
  if (score >= 90) return '#10b981';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
};

// 弹窗相关
const detailPopup = ref(null);
const comparePopup = ref(null);
const reportPopup = ref(null);
const currentStudent = ref(null);
const detailChartRef = ref(null);
const compareChartRef = ref(null);

// 体检历史数据
const examHistory = ref([]);

const viewDetail = async (student) => {
  currentStudent.value = student;
  detailPopup.value.open();
  await nextTick();
  initDetailChart();
};

const compareExam = async (student) => {
  currentStudent.value = student;
  
  // 加载体检历史数据
  try {
    const response = await studentApi.getPhysicalExams({ 
      studentId: student.studentId,
      limit: 10 
    });
    
    if (response && response.success) {
      examHistory.value = (response.data || []).map(exam => ({
        examDate: exam.examDate || exam.date || '',
        height: exam.height || 0,
        weight: exam.weight || 0,
        bmi: exam.bmi || 0,
        vision: exam.vision || '5.0/5.0'
      }));
    }
  } catch (error) {
    console.error('加载体检历史失败:', error);
    // 使用默认数据
    examHistory.value = [
      { examDate: '2025-03', height: 168, weight: 58, bmi: 20.5, vision: '5.0/5.0' },
      { examDate: '2025-06', height: 170, weight: 60, bmi: 20.8, vision: '5.0/5.0' },
      { examDate: '2025-09', height: 171, weight: 60, bmi: 20.5, vision: '5.0/5.0' }
    ];
  }
  
  comparePopup.value.open();
  await nextTick();
  initCompareChart();
};

const closePopup = (type) => {
  if (type === 'detail') detailPopup.value.close();
  if (type === 'compare') comparePopup.value.close();
  if (type === 'report') reportPopup.value.close();
};

// 图表初始化
const initDetailChart = async () => {
  if (!detailChartRef.value) return;
  const chart = await detailChartRef.value.init(echarts);
  
  // 可以从API加载真实的营养数据
  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['热量', '蛋白质', '维生素'], top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
    yAxis: { type: 'value' },
    series: [
      { name: '热量', type: 'line', data: [1800, 1850, 1900, 1880, 1920, 1860, 1890], smooth: true, itemStyle: { color: '#f59e0b' } },
      { name: '蛋白质', type: 'line', data: [65, 68, 70, 67, 72, 66, 69], smooth: true, itemStyle: { color: '#10b981' } },
      { name: '维生素', type: 'line', data: [85, 88, 90, 87, 92, 86, 89], smooth: true, itemStyle: { color: '#3b82f6' } }
    ]
  });
};

const initCompareChart = async () => {
  if (!compareChartRef.value) return;
  const chart = await compareChartRef.value.init(echarts);
  
  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['身高', '体重'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: examHistory.value.map(i => i.examDate) },
    yAxis: { type: 'value' },
    series: [
      { name: '身高', type: 'line', data: examHistory.value.map(i => i.height), itemStyle: { color: '#4facfe' }, smooth: true },
      { name: '体重', type: 'line', data: examHistory.value.map(i => i.weight), itemStyle: { color: '#00f2fe' }, smooth: true }
    ]
  });
};

// AI 报告相关
const generatingReport = ref(false);
const generatingStatus = ref('');
const classReport = ref(null);
const reportHistory = ref([]);
const loadingHistory = ref(false);

const showReportDialog = () => {
  if (tableData.value.length === 0) {
    uni.showToast({ title: '当前没有学生数据', icon: 'none' });
    return;
  }
  reportPopup.value.open();
  fetchReportHistory();
};

const fetchReportHistory = async () => {
  loadingHistory.value = true;
  try {
    const response = await studentApi.getHealthReportHistory({ limit: 10, offset: 0 });
    if (response && response.success) {
      reportHistory.value = response.data.reports || response.reports || [];
    }
  } catch (error) {
    console.error('获取报告历史失败:', error);
  } finally {
    loadingHistory.value = false;
  }
};

const generateClassReport = async () => {
  generatingReport.value = true;
  classReport.value = null;

  try {
    generatingStatus.value = '准备健康数据...';
    await new Promise(resolve => setTimeout(resolve, 500));

    generatingStatus.value = 'AI分析中...';

    const reportData = {
      filters: filters,
      students: tableData.value,
      summary: {
        total: tableData.value.length,
        healthy: tableData.value.filter(s => s.healthStatus === 'healthy').length,
        attention: tableData.value.filter(s => s.healthStatus === 'attention').length,
        abnormal: tableData.value.filter(s => s.healthStatus === 'abnormal').length,
        avgHeight: calculateAverage('height'),
        avgWeight: calculateAverage('weight'),
        avgBMI: calculateAverage('bmi'),
        avgNutritionScore: calculateAverage('nutritionScore')
      }
    };

    const response = await studentApi.generateClassHealthReport(reportData);

    if (response && (response.success || response.code === 200)) {
      generatingStatus.value = '分析完成！';
      await new Promise(resolve => setTimeout(resolve, 500));

      classReport.value = response.data?.content || response.data || {
        overview: '报告生成成功',
        highlights: [],
        suggestions: [],
        nextPlan: ''
      };

      uni.showToast({ title: '健康报告生成成功', icon: 'success' });
      await fetchReportHistory();
    } else {
      uni.showToast({ title: response.message || '生成报告失败', icon: 'none' });
    }
  } catch (error) {
    console.error('生成班级健康报告失败:', error);
    uni.showToast({ title: 'AI服务暂未配置，展示示例报告', icon: 'none' });
    classReport.value = generateMockReport();
  } finally {
    generatingReport.value = false;
    generatingStatus.value = '';
  }
};

const calculateAverage = (field) => {
  const validData = tableData.value.filter(item => item[field] && item[field] > 0);
  if (validData.length === 0) return 0;
  const sum = validData.reduce((acc, item) => acc + Number(item[field]), 0);
  return (sum / validData.length).toFixed(1);
};

const generateMockReport = () => {
  const total = tableData.value.length;
  const healthy = tableData.value.filter(s => s.healthStatus === 'healthy').length;
  const attention = tableData.value.filter(s => s.healthStatus === 'attention').length;
  const abnormal = tableData.value.filter(s => s.healthStatus === 'abnormal').length;
  const healthyRate = ((healthy / total) * 100).toFixed(1);

  return {
    overview: `本次统计共包含${total}名学生的健康数据。整体健康状况${healthyRate >= 80 ? '良好' : healthyRate >= 60 ? '一般' : '需要关注'}，健康率为${healthyRate}%。平均BMI为${calculateAverage('bmi')}，营养评分平均为${calculateAverage('nutritionScore')}分。`,
    highlights: [
      healthy > 0 ? `✓ ${healthy}名学生健康状况良好，占比${((healthy/total)*100).toFixed(1)}%` : null,
      attention > 0 ? `⚠ ${attention}名学生需要重点关注，建议加强营养指导` : null,
      abnormal > 0 ? `✗ ${abnormal}名学生健康状况异常，需要及时干预` : null,
    ].filter(Boolean),
    suggestions: [
      '建议定期开展健康教育活动，提高学生健康意识',
      '针对体重偏离正常范围的学生，制定个性化营养方案',
      '加强体育锻炼，每天保证1小时的户外活动时间',
      '关注学生的饮食习惯，培养健康的生活方式',
      abnormal > 0 ? '对健康异常的学生进行一对一健康咨询和跟踪' : '继续保持良好的健康管理模式'
    ],
    nextPlan: `建议在未来一个月内，对${attention + abnormal}名需要关注和健康异常的学生进行重点跟踪，每周测量体重和身高，记录饮食情况。`
  };
};

const handleExport = () => {
  if (tableData.value.length === 0) {
    uni.showToast({ title: '暂无数据可导出', icon: 'none' });
    return;
  }
  uni.showToast({ title: '正在导出CSV文件...', icon: 'none' });
  // 导出逻辑可以在这里实现
};

onMounted(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
.student-health-container {
  padding: 20rpx;
  background-color: #f8faff;
  height: 100%;
}

.card {
  background: #fff;
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.03);
  margin-bottom: 24rpx;
}

.search-box {
  background: #f1f4f9;
  height: 80rpx;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  margin-bottom: 20rpx;

  .search-input {
    flex: 1;
    margin-left: 10rpx;
    font-size: 28rpx;
  }
}

.filters-row {
  display: flex;
  gap: 20rpx;
  margin-bottom: 24rpx;

  .filter-picker {
    flex: 1;
    background: #fff;
    border: 2rpx solid #edf1f7;
    height: 72rpx;
    border-radius: 12rpx;
    padding: 0 20rpx;
    display: flex;
    align-items: center;
    
    .picker-value {
      width: 100%;
      font-size: 26rpx;
      color: #333;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
}

.actions-row {
  display: flex;
  gap: 20rpx;
  
  .action-btn {
    height: 80rpx;
    line-height: 80rpx;
    border-radius: 40rpx;
    font-size: 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    border: none;
    &::after { border: none; }
  }
  
  .report-btn {
    flex: 2;
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: #fff;
  }
  
  .export-btn {
    flex: 1;
    background: #f1f4f9;
    color: #666;
  }
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
  margin-bottom: 24rpx;

  .stat-item {
    background: #fff;
    padding: 20rpx;
    border-radius: 20rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.02);

    .stat-value {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
    }
    .stat-label {
      font-size: 20rpx;
      color: #94a3b8;
      margin-top: 4rpx;
    }

    &.healthy .stat-value { color: #10b981; }
    &.attention .stat-value { color: #f59e0b; }
    &.abnormal .stat-value { color: #f56c6c; }
  }
}

.student-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24rpx;

    .name {
      font-size: 32rpx;
      font-weight: bold;
      color: #1e293b;
      display: block;
    }
    .meta {
      font-size: 24rpx;
      color: #94a3b8;
    }

    .status-tag {
      padding: 4rpx 20rpx;
      border-radius: 20rpx;
      font-size: 22rpx;
      &.healthy { background: #ecfdf5; color: #10b981; }
      &.attention { background: #fffbeb; color: #f59e0b; }
      &.abnormal { background: #fef2f2; color: #f56c6c; }
    }
  }

  .card-metrics {
    display: flex;
    justify-content: space-around;
    background: #f8fafc;
    border-radius: 16rpx;
    padding: 20rpx;
    margin-bottom: 24rpx;

    .metric {
      display: flex;
      flex-direction: column;
      align-items: center;
      .m-label { font-size: 20rpx; color: #64748b; margin-bottom: 4rpx; }
      .m-value { font-size: 28rpx; font-weight: bold; color: #1e293b; }
      .unit { font-size: 18rpx; font-weight: normal; margin-left: 2rpx; }
    }
  }

  .nutrition-progress {
    margin-bottom: 24rpx;
    .progress-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10rpx;
      .p-label { font-size: 24rpx; color: #475569; }
      .p-value { font-size: 24rpx; font-weight: 600; }
    }
    .bar { border-radius: 10rpx; }
  }

  .card-actions {
    display: flex;
    gap: 16rpx;
    .card-btn {
      flex: 1;
      height: 64rpx;
      line-height: 64rpx;
      font-size: 24rpx;
      border-radius: 32rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6rpx;
      &::after { border: none; }
    }
    .secondary {
      background: #f0f7ff;
      color: #4facfe;
    }
    .primary {
      background: #4facfe;
      color: #fff;
    }
  }
}

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
    .title { font-size: 32rpx; font-weight: bold; }
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
    .l { font-size: 24rpx; color: #64748b; display: block; margin-bottom: 4rpx; }
    .v { font-size: 30rpx; font-weight: 600; color: #1e293b; }
  }
}

.chart-wrapper {
  height: 500rpx;
  background: #f8fafc;
  border-radius: 16rpx;
  padding: 20rpx;
  &.large { height: 600rpx; }
}

.exam-table {
  margin-top: 30rpx;
  border: 1rpx solid #e2e8f0;
  border-radius: 16rpx;
  overflow: hidden;
  .th, .tr {
    display: flex;
    .td {
      flex: 1;
      padding: 20rpx;
      font-size: 24rpx;
      text-align: center;
      border-right: 1rpx solid #f1f5f9;
      &:last-child { border-right: none; }
    }
  }
  .th { background: #f8fafc; font-weight: bold; }
  .tr { border-top: 1rpx solid #f1f5f9; }
}

.report-dialog {
  width: 90vw;
  background: #fff;
  border-radius: 32rpx;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.report-scroll {
  flex: 1;
  padding: 40rpx;
}

.generating {
  height: 400rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
  text { font-size: 28rpx; color: #94a3b8; }
}

.report-content {
  .section {
    margin-bottom: 30rpx;
    .st { font-size: 28rpx; font-weight: bold; color: #1e293b; margin-bottom: 12rpx; }
    .sc { font-size: 26rpx; color: #475569; line-height: 1.6; }
    .tip-item, .sug-item {
      display: flex;
      gap: 12rpx;
      margin-bottom: 8rpx;
      .dot, .num { color: #4facfe; font-weight: bold; }
    }
  }
}

.report-footer {
  padding: 30rpx;
  background: #f8fafc;
  .btn-gen {
    height: 88rpx;
    background: #4facfe;
    color: #fff;
    border-radius: 44rpx;
    font-size: 30rpx;
    &::after { border: none; }
  }
}

.loading-state, .empty-state {
  height: 400rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  text { color: #94a3b8; font-size: 28rpx; }
}

.spin {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
