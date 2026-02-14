<template>
  <div class="student-health-container">
    <el-card class="filter-card">
      <el-form :inline="true" :model="filters">
        <template v-if="isTeacher">
          <el-form-item label="查询时间">
            <el-date-picker
              v-model="filters.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              :shortcuts="shortcuts"
              clearable
              style="width: 260px"
            />
          </el-form-item>
          <el-form-item label="学生姓名">
            <el-input
              v-model="filters.keyword"
              placeholder="请输入学生姓名"
              clearable
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item label="健康状态">
            <el-select v-model="filters.healthStatus" placeholder="请选择健康状态" clearable style="width: 150px">
              <el-option label="健康" value="healthy" />
              <el-option label="需关注" value="attention" />
              <el-option label="异常" value="abnormal" />
            </el-select>
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="查询时间">
            <el-date-picker
              v-model="filters.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              :shortcuts="shortcuts"
              clearable
              style="width: 260px"
            />
          </el-form-item>
          <el-form-item label="年级">
            <el-select v-model="filters.grade" placeholder="请选择年级" clearable style="width: 120px">
              <el-option label="2025级" value="2025级" />
            </el-select>
          </el-form-item>
          <el-form-item label="班级">
            <el-select v-model="filters.class" placeholder="请选择班级" clearable style="width: 150px">
              <el-option label="25网络1班" value="25网络1班" />
            </el-select>
          </el-form-item>
          <el-form-item label="学生姓名">
            <el-input
              v-model="filters.keyword"
              placeholder="请输入学生姓名"
              clearable
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item label="健康状态">
            <el-select v-model="filters.healthStatus" placeholder="请选择健康状态" clearable style="width: 150px">
              <el-option label="健康" value="healthy" />
              <el-option label="需关注" value="attention" />
              <el-option label="异常" value="abnormal" />
            </el-select>
          </el-form-item>
        </template>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="handleExport">
            <el-icon><Download /></el-icon>
            <span class="btn-text-full">导出</span>
            <span class="btn-text-mobile">导出</span>
          </el-button>
          <el-button type="warning" @click="showReportDialog" class="generate-report-btn">
            <el-icon><Document /></el-icon>
            <span class="btn-text-full">生成健康报告</span>
            <span class="btn-text-mobile">报告</span>
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card class="table-card">
      <el-table
        :data="tableData"
        style="width: 100%"
        v-loading="loading"
        @row-click="handleRowClick"
        class="desktop-table"
        :row-class-name="tableRowClassName"
      >
        <el-table-column prop="studentName" label="学生姓名" min-width="120" />
        <el-table-column prop="grade" label="年级班级" min-width="120">
          <template #default="{ row }">
            {{ row.grade }} {{ row.class }}
          </template>
        </el-table-column>
        <el-table-column prop="gender" label="性别" min-width="80" />
        <el-table-column prop="height" label="身高(cm)" min-width="100" />
        <el-table-column prop="weight" label="体重(kg)" min-width="100">
          <template #default="{ row }">
            {{ row.weight ? Number(row.weight).toFixed(1) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="bmi" label="BMI" min-width="80">
          <template #default="{ row }">
            {{ row.bmi ? row.bmi.toFixed(1) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="健康状态" min-width="120">
          <template #default="{ row }">
            <el-tag :type="getHealthTagType(row.healthStatus)">
              {{ getHealthLabel(row.healthStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="nutritionScore" label="营养评分" min-width="100">
          <template #default="{ row }">
            <el-progress
              :percentage="row.nutritionScore"
              :color="getNutritionColor(row.nutritionScore)"
              :show-text="false"
            />
            <span class="ml-2">{{ row.nutritionScore }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click.stop="viewDetail(row)">
              查看详情
            </el-button>
            <el-button size="small" type="success" link @click.stop="compareExam(row)">
              体检对比
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="mobile-card-list" v-loading="loading">
        <div
          v-for="row in tableData"
          :key="row.id"
          class="student-card"
          :class="{ 
            'abnormal-card': row.healthStatus === 'abnormal',
            'warning-card': row.healthStatus === 'attention'
          }"
          @click="handleRowClick(row)"
        >
          <div class="card-header">
            <div class="student-info">
              <h3 class="student-name">{{ row.studentName }}</h3>
              <span class="student-meta">{{ row.grade }} {{ row.class }} · {{ row.gender }}</span>
            </div>
            <el-tag :type="getHealthTagType(row.healthStatus)" size="small">
              {{ getHealthLabel(row.healthStatus) }}
            </el-tag>
          </div>
          <div class="card-content">
            <div class="info-row">
              <div class="info-item">
                <span class="info-label">身高</span>
                <span class="info-value">{{ row.height }}<span class="unit">cm</span></span>
              </div>
              <div class="info-item">
                <span class="info-label">体重</span>
                <span class="info-value">{{ row.weight ? Number(row.weight).toFixed(1) : '-' }}<span class="unit">kg</span></span>
              </div>
              <div class="info-item">
                <span class="info-label">BMI</span>
                <span class="info-value">{{ row.bmi ? row.bmi.toFixed(1) : '-' }}</span>
              </div>
            </div>
            <div class="nutrition-row">
              <span class="nutrition-label">营养评分</span>
              <div class="nutrition-progress">
                <el-progress
                  :percentage="row.nutritionScore"
                  :color="getNutritionColor(row.nutritionScore)"
                  :stroke-width="8"
                />
              </div>
            </div>
          </div>
          <div class="card-actions">
            <el-button size="small" type="primary" @click.stop="viewDetail(row)">
              <el-icon><View /></el-icon>
              详情
            </el-button>
            <el-button size="small" type="success" @click.stop="compareExam(row)">
              <el-icon><TrendCharts /></el-icon>
              对比
            </el-button>
          </div>
        </div>
        <div v-if="!loading && tableData.length === 0" class="empty-state">
          <el-icon :size="60"><DocumentCopy /></el-icon>
          <p>暂无数据</p>
        </div>
      </div>
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
          class="desktop-pagination"
        />
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
          class="mobile-pagination"
          :pager-count="5"
        />
      </div>
    </el-card>
    <el-dialog
      v-model="detailVisible"
      title="学生健康详情"
      width="800px"
      :close-on-click-modal="false"
      :lock-scroll="false"
      class="student-detail-dialog"
    >
      <div v-if="currentStudent" class="student-detail">
        <div class="detail-section">
          <h3 class="section-title">基本信息</h3>
          <el-descriptions :column="2" border class="desktop-descriptions">
            <el-descriptions-item label="姓名">{{ currentStudent.studentName }}</el-descriptions-item>
            <el-descriptions-item label="性别">{{ currentStudent.gender || '未知' }}</el-descriptions-item>
            <el-descriptions-item label="年级班级">
              {{ currentStudent.grade }} {{ currentStudent.class }}
            </el-descriptions-item>
            <el-descriptions-item label="学号">{{ currentStudent.studentId }}</el-descriptions-item>
          </el-descriptions>
          <div class="mobile-info-cards">
            <div class="mobile-info-card">
              <div class="info-card-label">姓名</div>
              <div class="info-card-value">{{ currentStudent.studentName }}</div>
            </div>
            <div class="mobile-info-card">
              <div class="info-card-label">性别</div>
              <div class="info-card-value">{{ currentStudent.gender || '未知' }}</div>
            </div>
            <div class="mobile-info-card">
              <div class="info-card-label">年级班级</div>
              <div class="info-card-value">{{ currentStudent.grade }} {{ currentStudent.class }}</div>
            </div>
            <div class="mobile-info-card">
              <div class="info-card-label">学号</div>
              <div class="info-card-value">{{ currentStudent.studentId }}</div>
            </div>
          </div>
        </div>
        <div class="detail-section">
          <h3 class="section-title">健康指标</h3>
          <div class="health-metrics">
            <div class="metric-item">
              <div class="metric-label">身高</div>
              <div class="metric-value">{{ currentStudent.height || '-' }} <span class="metric-unit">cm</span></div>
            </div>
            <div class="metric-item">
              <div class="metric-label">体重</div>
              <div class="metric-value">{{ currentStudent.weight ? Number(currentStudent.weight).toFixed(1) : '-' }} <span class="metric-unit">kg</span></div>
            </div>
            <div class="metric-item">
              <div class="metric-label">BMI</div>
              <div class="metric-value">{{ currentStudent.bmi ? currentStudent.bmi.toFixed(1) : '-' }}</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">视力</div>
              <div class="metric-value">{{ currentStudent.vision || '5.0/5.0' }}</div>
            </div>
          </div>
        </div>
        <div class="detail-section">
          <h3 class="section-title">近7日营养摄入</h3>
          <div ref="detailChartRef" class="detail-chart"></div>
        </div>
      </div>
    </el-dialog>
    <el-dialog
      v-model="compareVisible"
      title="体检数据对比"
      width="900px"
      :close-on-click-modal="false"
      :lock-scroll="false"
      class="exam-compare-dialog"
    >
      <div v-if="currentStudent" class="exam-compare">
        <el-tabs v-model="compareTab">
          <el-tab-pane label="趋势图" name="chart">
            <div ref="compareChartRef" class="compare-chart"></div>
          </el-tab-pane>
          <el-tab-pane label="数据表" name="table">
            <el-table :data="examHistory" border class="desktop-exam-table">
              <el-table-column prop="examDate" label="体检日期" width="120" />
              <el-table-column prop="height" label="身高(cm)" width="100" />
              <el-table-column prop="weight" label="体重(kg)" width="100">
                <template #default="{ row }">
                  {{ row.weight ? Number(row.weight).toFixed(1) : '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="bmi" label="BMI" width="80" />
              <el-table-column prop="vision" label="视力" width="100" />
              <el-table-column label="变化" width="150">
                <template #default="{ row, $index }">
                  <span v-if="$index > 0">
                    身高 {{ (row.height - examHistory[$index - 1].height).toFixed(1) }}cm
                  </span>
                </template>
              </el-table-column>
            </el-table>
            <div class="mobile-exam-cards">
              <div
                v-for="(exam, index) in examHistory"
                :key="index"
                class="exam-history-card"
              >
                <div class="exam-card-header">
                  <span class="exam-date">{{ exam.examDate }}</span>
                  <el-tag v-if="index === examHistory.length - 1" type="success" size="small">最新</el-tag>
                  <el-tag v-else size="small">第{{ examHistory.length - index }}次</el-tag>
                </div>
                <div class="exam-card-body">
                  <div class="exam-metric">
                    <span class="metric-label">身高</span>
                    <span class="metric-value">{{ exam.height }}<span class="unit">cm</span></span>
                  </div>
                  <div class="exam-metric">
                    <span class="metric-label">体重</span>
                    <span class="metric-value">{{ exam.weight ? Number(exam.weight).toFixed(1) : '-' }}<span class="unit">kg</span></span>
                  </div>
                  <div class="exam-metric">
                    <span class="metric-label">BMI</span>
                    <span class="metric-value">{{ exam.bmi }}</span>
                  </div>
                  <div class="exam-metric">
                    <span class="metric-label">视力</span>
                    <span class="metric-value">{{ exam.vision }}</span>
                  </div>
                </div>
                <div v-if="index > 0" class="exam-card-change">
                  <el-icon><TrendCharts /></el-icon>
                  <span>身高增长 {{ (exam.height - examHistory[index - 1].height).toFixed(1) }}cm</span>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
    <el-dialog
      v-model="reportVisible"
      title="班级健康报告"
      width="900px"
      :close-on-click-modal="false"
      :lock-scroll="false"
      class="health-report-dialog"
    >
      <div class="report-container">
        <div class="report-header">
          <div class="header-content">
            <h3 class="report-title">{{ getReportTitle() }}</h3>
            <p class="report-subtitle">基于当前筛选条件的学生健康数据分析</p>
          </div>
          <div class="report-actions">
            <button
              class="history-report-btn"
              @click="showReportHistoryDialog"
              v-if="reportHistory.length > 0"
            >
              <el-icon><Document /></el-icon>
              历史报告
              <span class="badge">{{ reportHistory.length }}</span>
            </button>
            <button
              class="generate-btn"
              :class="{ 'generating': generatingReport }"
              @click="generateClassReport"
              :disabled="generatingReport"
            >
              <span v-if="generatingReport" class="generating-text">
                <el-icon class="is-loading"><Loading /></el-icon>
                {{ generatingStatus }}
              </span>
              <span v-else>
                <el-icon><MagicStick /></el-icon>
                生成AI分析
              </span>
            </button>
          </div>
        </div>
        <div class="stats-overview">
          <div class="stat-card">
            <div class="stat-label">学生总数</div>
            <div class="stat-value primary">{{ tableData.length }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">健康学生</div>
            <div class="stat-value success">{{ getHealthCount('healthy') }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">需关注</div>
            <div class="stat-value warning">{{ getHealthCount('attention') }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">异常学生</div>
            <div class="stat-value danger">{{ getHealthCount('abnormal') }}</div>
          </div>
        </div>
        <div class="ai-report-section" v-if="classReport">
          <div class="report-block" v-if="classReport.overview">
            <h4 class="block-title">
              <el-icon><DataAnalysis /></el-icon>
              整体概况
            </h4>
            <div class="block-content markdown-content" v-html="parseMarkdown(classReport.overview)"></div>
          </div>
          <div class="report-block" v-if="classReport.highlights && classReport.highlights.length > 0">
            <h4 class="block-title">
              <el-icon><Warning /></el-icon>
              重点关注
            </h4>
            <div class="highlight-list">
              <div
                v-for="(item, index) in classReport.highlights"
                :key="index"
                class="highlight-item"
                :class="getHighlightClass(item)"
              >
                <span class="highlight-icon">{{ getHighlightIcon(item) }}</span>
                <span class="highlight-text markdown-content" v-html="parseMarkdown(item.replace(/^[]\s*/, ''))"></span>
              </div>
            </div>
          </div>
          <div class="report-block" v-if="classReport.suggestions && classReport.suggestions.length > 0">
            <h4 class="block-title">
              <el-icon><Notebook /></el-icon>
              改善建议
            </h4>
            <div class="suggestion-list">
              <div
                v-for="(suggestion, index) in classReport.suggestions"
                :key="index"
                class="suggestion-item"
              >
                <span class="suggestion-number">{{ index + 1 }}</span>
                <span class="suggestion-text markdown-content" v-html="parseMarkdown(suggestion)"></span>
              </div>
            </div>
          </div>
          <div class="report-block" v-if="classReport.nextPlan">
            <h4 class="block-title">
              <el-icon><Calendar /></el-icon>
              后续计划
            </h4>
            <div class="block-content plan-content markdown-content" v-html="parseMarkdown(classReport.nextPlan)"></div>
          </div>
        </div>
        <div v-else class="empty-report">
          <div class="empty-icon">
            <el-icon :size="60"><Document /></el-icon>
          </div>
          <p class="empty-text">点击上方按钮生成AI健康分析报告</p>
          <p class="empty-hint">报告将基于当前筛选的学生健康数据</p>
        </div>
      </div>
    </el-dialog>
    <el-dialog
      v-model="showHistoryModal"
      title="历史报告"
      width="900px"
      :close-on-click-modal="false"
      :lock-scroll="false"
      class="history-report-dialog"
    >
      <div v-if="loadingHistory" class="text-center py-12">
        <el-icon class="is-loading" :size="40"><Loading /></el-icon>
        <p class="text-gray-500 mt-4">加载中...</p>
      </div>
      <div v-else-if="reportHistory.length === 0" class="text-center py-12 text-gray-400">
        <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <el-icon :size="32"><Document /></el-icon>
        </div>
        <p class="text-base font-medium text-gray-600">暂无历史报告</p>
        <p class="text-sm text-gray-400 mt-2">生成第一份报告吧！</p>
      </div>
      <div v-else class="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
        <div
          v-for="(report, idx) in reportHistory"
          :key="report._id"
          class="history-report-card group cursor-pointer"
          @click="viewHistoryReport(report)"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <h4 class="text-base font-bold text-gray-800">
                  {{ report.scope }}
                </h4>
                <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  #{{ reportHistory.length - idx }}
                </span>
              </div>
              <p class="text-sm text-gray-500">
                生成于 {{ formatDate(report.createdAt) }}
              </p>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex gap-2 flex-wrap">
              <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                学生 {{ report.summary.total }}人
              </span>
              <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                健康率 {{ report.summary.healthyRate }}%
              </span>
            </div>
            <div class="text-blue-600 group-hover:text-blue-700 text-sm font-semibold flex items-center gap-1 transition-colors">
              <span>查看详情</span>
              <span class="text-xs group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { marked } from 'marked'
import {
  Search,
  Download,
  Document,
  MagicStick,
  Loading,
  DataAnalysis,
  Warning,
  Notebook,
  Calendar,
  View,
  TrendCharts,
  DocumentCopy
} from '@element-plus/icons-vue'
import { mergeChartOption, watchThemeChange } from '@school/utils/chartTheme'
import { studentApi } from '@school/api'
import { useUserStore } from '@school/stores/user'

marked.setOptions({
  gfm: true,
  breaks: true,
  smartLists: true,
  smartypants: false,
  xhtml: false,
  sanitize: false,
})

const parseMarkdown = (text) => {
  if (!text) return ''
  try {
    return marked.parse(text)
  } catch (error) {
    console.error('Markdown解析失败:', error)
    return text
  }
}

const userStore = useUserStore()
const isTeacher = computed(() => userStore.isTeacher)
const managedClasses = computed(() => userStore.getManagedClasses)

const loading = ref(false)
const detailVisible = ref(false)
const compareVisible = ref(false)
const compareTab = ref('chart')
const currentStudent = ref(null)

const reportVisible = ref(false)
const generatingReport = ref(false)
const generatingStatus = ref('')
const classReport = ref(null)
const reportHistory = ref([])
const showHistoryModal = ref(false)
const loadingHistory = ref(false)

const detailChartRef = ref()
const compareChartRef = ref()
let detailChart = null
let compareChart = null
let observers = []

const filters = ref({
  dateRange: null,
  grade: null,
  class: null,
  keyword: '',
  healthStatus: null
})

// 日期快捷选项
const shortcuts = [
  {
    text: '最近一周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    },
  },
  {
    text: '最近一个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    },
  },
  {
    text: '最近三个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
      return [start, end]
    },
  },
]

const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 30
})

const tableData = ref([])

const examHistory = ref([
  { examDate: '2025-03-15', height: 140, weight: 36, bmi: 18.4, vision: '5.0/5.0' },
  { examDate: '2025-06-15', height: 143, weight: 37, bmi: 18.1, vision: '5.0/5.0' },
  { examDate: '2025-09-15', height: 145, weight: 38, bmi: 18.1, vision: '5.0/5.0' }
])

const getHealthTagType = (status) => {
  const types = {
    healthy: 'success',
    attention: 'warning',
    abnormal: 'danger'
  }
  return types[status] || 'info'
}

const getHealthLabel = (status) => {
  const labels = {
    healthy: '健康',
    attention: '需关注',
    abnormal: '异常'
  }
  return labels[status] || '未知'
}

const tableRowClassName = ({ row }) => {
  if (row.healthStatus === 'abnormal') {
    return 'abnormal-row'
  }
  if (row.healthStatus === 'attention') {
    return 'warning-row'
  }
  return ''
}

const getNutritionColor = (score) => {
  // 营养评分颜色：90-100=绿色(健康)，60-90=橙色(需关注)，<60=红色(异常)
  if (score >= 90) return '#10b981' // 绿色
  if (score >= 60) return '#f59e0b' // 橙色
  return '#ef4444' // 红色
}

// 直接使用写死的数据
// 健康状态规则：营养评分 90-100=健康，60-90=需关注，<60=异常
let allHealthData = [
  { id: 1, studentId: 'S20250001', studentName: '张雨萱', grade: '2025级', class: '25网络1班', gender: '女', height: 155, weight: 59.7, bmi: 24.8, healthStatus: 'attention', nutritionScore: 68, vision: '5.0/5.0', lastExamDate: '2025-09-15' },
  { id: 2, studentId: 'S20250002', studentName: '李子轩', grade: '2025级', class: '25网络1班', gender: '男', height: 173, weight: 71.0, bmi: 23.7, healthStatus: 'attention', nutritionScore: 75, vision: '5.0/5.0', lastExamDate: '2025-09-15' },
  { id: 3, studentId: 'S20250003', studentName: '王欣怡', grade: '2025级', class: '25网络1班', gender: '女', height: 156, weight: 52.0, bmi: 21.4, healthStatus: 'attention', nutritionScore: 72, vision: '5.0/5.0', lastExamDate: '2025-09-15' },
  { id: 4, studentId: 'S20250004', studentName: '刘博文', grade: '2025级', class: '25网络1班', gender: '男', height: 171, weight: 60.0, bmi: 20.5, healthStatus: 'healthy', nutritionScore: 94, vision: '5.0/5.0', lastExamDate: '2025-09-15' },
  { id: 5, studentId: 'S20250005', studentName: '陈思琪', grade: '2025级', class: '25网络1班', gender: '女', height: 162, weight: 49.0, bmi: 18.7, healthStatus: 'healthy', nutritionScore: 92, vision: '5.0/5.0', lastExamDate: '2025-09-15' },
  { id: 6, studentId: 'S20250006', studentName: '杨俊杰', grade: '2025级', class: '25网络1班', gender: '男', height: 170, weight: 68.0, bmi: 23.5, healthStatus: 'healthy', nutritionScore: 91, vision: '5.0/5.0', lastExamDate: '2025-09-15' },
  { id: 7, studentId: 'S20250007', studentName: '赵嘉怡', grade: '2025级', class: '25网络1班', gender: '女', height: 158, weight: 52.0, bmi: 20.8, healthStatus: 'healthy', nutritionScore: 90, vision: '5.0/5.0', lastExamDate: '2025-09-15' },
  { id: 8, studentId: 'S20250008', studentName: '黄文昊', grade: '2025级', class: '25网络1班', gender: '男', height: 172, weight: 79.0, bmi: 26.7, healthStatus: 'healthy', nutritionScore: 96, vision: '5.0/5.0', lastExamDate: '2025-09-15' },
  { id: 9, studentId: 'S20250009', studentName: '周晓婷', grade: '2025级', class: '25网络1班', gender: '女', height: 163, weight: 58.0, bmi: 21.8, healthStatus: 'healthy', nutritionScore: 96, vision: '5.0/5.0', lastExamDate: '2025-09-15' },
  { id: 10, studentId: 'S20250010', studentName: '吴睿渊', grade: '2025级', class: '25网络1班', gender: '男', height: 175, weight: 68.0, bmi: 22.2, healthStatus: 'healthy', nutritionScore: 94, vision: '5.0/5.0', lastExamDate: '2025-09-15' },
  { id: 11, studentId: 'S20250011', studentName: '徐芳', grade: '2025级', class: '25网络1班', gender: '女', height: 165, weight: 57.0, bmi: 20.9, healthStatus: 'healthy', nutritionScore: 96, vision: '5.0/5.0', lastExamDate: '2025-09-15' },
  { id: 12, studentId: 'S20250012', studentName: '孙建国', grade: '2025级', class: '25网络1班', gender: '男', height: 173, weight: 66.0, bmi: 22.1, healthStatus: 'healthy', nutritionScore: 90, vision: '5.0/5.0', lastExamDate: '2025-09-15' },
  { id: 13, studentId: 'S20250013', studentName: '胡丽', grade: '2025级', class: '25网络1班', gender: '女', height: 160, weight: 52.0, bmi: 20.3, healthStatus: 'healthy', nutritionScore: 96, vision: '5.0/5.0', lastExamDate: '2025-09-15' },
  { id: 14, studentId: 'S20250014', studentName: '朱磊', grade: '2025级', class: '25网络1班', gender: '男', height: 169, weight: 60.0, bmi: 21.0, healthStatus: 'healthy', nutritionScore: 94, vision: '5.0/5.0', lastExamDate: '2025-09-15' },
  { id: 15, studentId: 'S20250015', studentName: '高秀英', grade: '2025级', class: '25网络1班', gender: '女', height: 162, weight: 55.0, bmi: 21.0, healthStatus: 'healthy', nutritionScore: 98, vision: '5.0/5.0', lastExamDate: '2025-09-15' },
  { id: 16, studentId: 'S20250016', studentName: '林涛', grade: '2025级', class: '25网络1班', gender: '男', height: 167, weight: 69.0, bmi: 24.7, healthStatus: 'healthy', nutritionScore: 90, vision: '5.0/5.0', lastExamDate: '2025-09-15' },
  { id: 17, studentId: 'S20250017', studentName: '李浩然', grade: '2025级', class: '25网络1班', gender: '男', height: 174, weight: 52.0, bmi: 17.2, healthStatus: 'healthy', nutritionScore: 94, vision: '5.0/5.0', lastExamDate: '2025-09-15' },
  { id: 18, studentId: 'S20250018', studentName: '郭超', grade: '2025级', class: '25网络1班', gender: '男', height: 173, weight: 61.0, bmi: 20.4, healthStatus: 'healthy', nutritionScore: 91, vision: '5.0/5.0', lastExamDate: '2025-09-15' },
  { id: 19, studentId: 'S20250019', studentName: '王宇轩', grade: '2025级', class: '25网络1班', gender: '男', height: 165, weight: 64.0, bmi: 23.5, healthStatus: 'healthy', nutritionScore: 96, vision: '5.0/5.0', lastExamDate: '2025-09-15' },
  { id: 20, studentId: 'S20250020', studentName: '罗勇', grade: '2025级', class: '25网络1班', gender: '男', height: 170, weight: 71.0, bmi: 24.6, healthStatus: 'healthy', nutritionScore: 94, vision: '5.0/5.0', lastExamDate: '2025-09-15' },
  { id: 21, studentId: 'S20250021', studentName: '张智宸', grade: '2025级', class: '25网络1班', gender: '男', height: 165, weight: 59.0, bmi: 21.7, healthStatus: 'healthy', nutritionScore: 99, vision: '5.0/5.0', lastExamDate: '2025-09-15' },
  { id: 22, studentId: 'S20250022', studentName: '宋子轩', grade: '2025级', class: '25网络1班', gender: '男', height: 175, weight: 63.0, bmi: 20.6, healthStatus: 'healthy', nutritionScore: 93, vision: '5.0/5.0', lastExamDate: '2025-09-15' },
  { id: 23, studentId: 'S20250023', studentName: '刘俊熙', grade: '2025级', class: '25网络1班', gender: '男', height: 167, weight: 64.0, bmi: 22.9, healthStatus: 'healthy', nutritionScore: 94, vision: '5.0/5.0', lastExamDate: '2025-09-15' },
  { id: 24, studentId: 'S20250024', studentName: '谢博文', grade: '2025级', class: '25网络1班', gender: '男', height: 167, weight: 61.0, bmi: 21.9, healthStatus: 'healthy', nutritionScore: 96, vision: '5.0/5.0', lastExamDate: '2025-09-15' },
  { id: 25, studentId: 'S20250025', studentName: '陈昊天', grade: '2025级', class: '25网络1班', gender: '男', height: 166, weight: 52.0, bmi: 18.9, healthStatus: 'healthy', nutritionScore: 91, vision: '5.0/5.0', lastExamDate: '2025-09-15' },
  { id: 26, studentId: 'S20250026', studentName: '唐俊杰', grade: '2025级', class: '25网络1班', gender: '男', height: 175, weight: 61.0, bmi: 19.9, healthStatus: 'abnormal', nutritionScore: 58, vision: '5.0/5.0', lastExamDate: '2025-09-15' },
  { id: 27, studentId: 'S20250027', studentName: '杨嘉懿', grade: '2025级', class: '25网络1班', gender: '男', height: 171, weight: 62.0, bmi: 21.2, healthStatus: 'healthy', nutritionScore: 90, vision: '5.0/5.0', lastExamDate: '2025-09-15' },
  { id: 28, studentId: 'S20250028', studentName: '于文昊', grade: '2025级', class: '25网络1班', gender: '男', height: 167, weight: 57.0, bmi: 20.4, healthStatus: 'healthy', nutritionScore: 94, vision: '5.0/5.0', lastExamDate: '2025-09-15' },
  { id: 29, studentId: 'S20250029', studentName: '赵子睿', grade: '2025级', class: '25网络1班', gender: '男', height: 170, weight: 59.0, bmi: 20.4, healthStatus: 'healthy', nutritionScore: 90, vision: '5.0/5.0', lastExamDate: '2025-09-15' },
  { id: 30, studentId: 'S20250030', studentName: '萧睿渊', grade: '2025级', class: '25网络1班', gender: '男', height: 173, weight: 74.0, bmi: 24.7, healthStatus: 'healthy', nutritionScore: 97, vision: '5.0/5.0', lastExamDate: '2025-09-15' }
]

const loadHealthData = async () => {
  // 直接使用写死的数据，不调用API
  loading.value = true
  setTimeout(() => {
    applyFilters()
    loading.value = false
  }, 300)
}

const applyFilters = () => {
  let filtered = [...allHealthData]

  if (filters.value.keyword) {
    const keyword = filters.value.keyword.toLowerCase()
    filtered = filtered.filter(item =>
      item.studentName.toLowerCase().includes(keyword)
    )
  }

  if (filters.value.grade) {
    filtered = filtered.filter(item => item.grade === filters.value.grade)
  }

  if (filters.value.class) {
    filtered = filtered.filter(item => item.class === filters.value.class)
  }

  if (filters.value.healthStatus) {
    filtered = filtered.filter(item => item.healthStatus === filters.value.healthStatus)
  }

  // 排序：异常 > 需关注 > 健康
  filtered.sort((a, b) => {
    const statusOrder = { abnormal: 0, attention: 1, healthy: 2 }
    return statusOrder[a.healthStatus] - statusOrder[b.healthStatus]
  })

  tableData.value = filtered
  pagination.value.total = filtered.length
}

const handleSearch = () => {
  loadHealthData()
}

const handleReset = () => {
  filters.value = {
    dateRange: null,
    grade: null,
    class: null,
    keyword: '',
    healthStatus: null
  }
  loadHealthData()
}

const handleExport = () => {
  if (tableData.value.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }

  try {

    const exportData = tableData.value.map(row => ({
      '学生姓名': row.studentName,
      '年级班级': `${row.grade} ${row.class}`,
      '性别': row.gender,
      '身高(cm)': row.height,
      '体重(kg)': row.weight ? Number(row.weight).toFixed(1) : '-',
      'BMI': row.bmi ? row.bmi.toFixed(1) : '-',
      '健康状态': getHealthLabel(row.healthStatus),
      '营养评分': row.nutritionScore
    }))

    const headers = Object.keys(exportData[0])
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => headers.map(header => {
        const value = row[header]

        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      }).join(','))
    ].join('\n')

    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })

    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)

    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const fileName = `学生健康数据_${dateStr}.csv`
    link.setAttribute('download', fileName)

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    ElMessage.success('导出成功')
  } catch (error) {
    console.error('Export error:', error)
    ElMessage.error('导出失败')
  }
}

const handleRowClick = (row) => {
  viewDetail(row)
}

const handleSizeChange = (size) => {
  pagination.value.pageSize = size
  handleSearch()
}

const handlePageChange = (page) => {
  pagination.value.page = page
  handleSearch()
}

const viewDetail = (row) => {
  currentStudent.value = row
  detailVisible.value = true
  setTimeout(() => {
    initDetailChart()
  }, 100)
}

const compareExam = (row) => {
  currentStudent.value = row
  compareVisible.value = true
  setTimeout(() => {
    initCompareChart()
  }, 100)
}

const showReportDialog = () => {
  if (tableData.value.length === 0) {
    ElMessage.warning('当前没有学生数据，请先查询')
    return
  }
  reportVisible.value = true

  fetchReportHistory()
}

const showReportHistoryDialog = () => {
  showHistoryModal.value = true
  fetchReportHistory()
}

const fetchReportHistory = async () => {
  loadingHistory.value = true
  try {
    const response = await studentApi.getHealthReportHistory({
      limit: 10,
      offset: 0
    })

    if (response.success || response.code === 200) {
      reportHistory.value = response.data.reports || response.reports || []
      console.log('加载历史报告:', reportHistory.value.length, '条')
    }
  } catch (error) {
    console.error('获取报告历史失败:', error)
  } finally {
    loadingHistory.value = false
  }
}

const viewHistoryReport = (report) => {
  classReport.value = report.content
  showHistoryModal.value = false
  reportVisible.value = true
  ElMessage.success('已加载历史报告')
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getReportTitle = () => {
  const parts = []
  if (filters.value.grade) {
    parts.push(`${filters.value.grade}年级`)
  }
  if (filters.value.class) {
    parts.push(`${filters.value.class}班`)
  }
  if (parts.length > 0) {
    return `${parts.join('')}健康分析报告`
  }
  if (isTeacher.value) {
    return '班级健康分析报告'
  }
  return '全校健康分析报告'
}

const getHealthCount = (status) => {
  return tableData.value.filter(student => student.healthStatus === status).length
}

const getHighlightClass = (item) => {
  if (item.startsWith('')) return 'highlight-success'
  if (item.startsWith('')) return 'highlight-warning'
  if (item.startsWith('')) return 'highlight-danger'
  return ''
}

const getHighlightIcon = (item) => {
  if (item.startsWith('')) return ''
  if (item.startsWith('')) return ''
  if (item.startsWith('')) return ''
  return '•'
}

const generateClassReport = async () => {
  generatingReport.value = true
  classReport.value = null

  try {

    generatingStatus.value = '准备健康数据...'
    await new Promise(resolve => setTimeout(resolve, 800))

    generatingStatus.value = '正在发送到AI...'
    await new Promise(resolve => setTimeout(resolve, 500))

    generatingStatus.value = 'AI分析中...'

    const reportData = {
      filters: filters.value,
      students: tableData.value,
      summary: {
        total: tableData.value.length,
        healthy: getHealthCount('healthy'),
        attention: getHealthCount('attention'),
        abnormal: getHealthCount('abnormal'),
        avgHeight: calculateAverage('height'),
        avgWeight: calculateAverage('weight'),
        avgBMI: calculateAverage('bmi'),
        avgNutritionScore: calculateAverage('nutritionScore')
      }
    }

    const response = await studentApi.generateClassHealthReport(reportData)

    if (response.success || response.code === 200) {

      generatingStatus.value = '分析完成！'
      await new Promise(resolve => setTimeout(resolve, 500))

      classReport.value = response.data?.content || response.data || {
        overview: '报告生成成功',
        highlights: [],
        suggestions: [],
        nextPlan: ''
      }

      ElMessage.success('健康报告生成成功！')

      await fetchReportHistory()
    } else {
      ElMessage.error(response.message || '生成报告失败')
    }
  } catch (error) {
    console.error('生成班级健康报告失败:', error)
    generatingStatus.value = '生成失败'
    await new Promise(resolve => setTimeout(resolve, 500))

    if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
      ElMessage.warning('AI服务暂未配置，展示示例报告')
      classReport.value = generateMockReport()
    } else {
      ElMessage.error(error.response?.data?.message || '生成报告失败，请稍后重试')
    }
  } finally {
    generatingReport.value = false
    generatingStatus.value = ''
  }
}

const calculateAverage = (field) => {
  const validData = tableData.value.filter(item => item[field] && item[field] > 0)
  if (validData.length === 0) return 0
  const sum = validData.reduce((acc, item) => acc + Number(item[field]), 0)
  return (sum / validData.length).toFixed(1)
}

const generateMockReport = () => {
  const total = tableData.value.length
  const healthy = getHealthCount('healthy')
  const attention = getHealthCount('attention')
  const abnormal = getHealthCount('abnormal')
  const healthyRate = ((healthy / total) * 100).toFixed(1)

  return {
    overview: `本次统计共包含${total}名学生的健康数据。整体健康状况${healthyRate >= 80 ? '良好' : healthyRate >= 60 ? '一般' : '需要关注'}，健康率为${healthyRate}%。平均BMI为${calculateAverage('bmi')}，营养评分平均为${calculateAverage('nutritionScore')}分。`,
    highlights: [
      healthy > 0 ? ` ${healthy}名学生健康状况良好，占比${((healthy/total)*100).toFixed(1)}%` : null,
      attention > 0 ? ` ${attention}名学生需要重点关注，建议加强营养指导` : null,
      abnormal > 0 ? ` ${abnormal}名学生健康状况异常，需要及时干预` : null,
    ].filter(Boolean),
    suggestions: [
      '建议定期开展健康教育活动，提高学生健康意识',
      '针对体重偏离正常范围的学生，制定个性化营养方案',
      '加强体育锻炼，每天保证1小时的户外活动时间',
      '关注学生的饮食习惯，培养健康的生活方式',
      abnormal > 0 ? '对健康异常的学生进行一对一健康咨询和跟踪' : '继续保持良好的健康管理模式'
    ],
    nextPlan: `建议在未来一个月内，对${attention + abnormal}名需要关注和健康异常的学生进行重点跟踪，每周测量体重和身高，记录饮食情况。同时，组织营养知识讲座和体育活动，提升全体学生的健康水平。定期与家长沟通，形成家校共育的健康管理机制。`
  }
}

const initDetailChart = () => {
  if (!detailChartRef.value) return

  detailChart = echarts.init(detailChartRef.value)

  const getOption = () => mergeChartOption({
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['热量', '蛋白质', '维生素']
    },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '热量',
        type: 'line',
        data: [1800, 1850, 1900, 1880, 1920, 1860, 1890],
        smooth: true
      },
      {
        name: '蛋白质',
        type: 'line',
        data: [65, 68, 70, 67, 72, 66, 69],
        smooth: true
      },
      {
        name: '维生素',
        type: 'line',
        data: [85, 88, 90, 87, 92, 86, 89],
        smooth: true
      }
    ]
  })

  detailChart.setOption(getOption())
  observers.push(watchThemeChange(detailChart, getOption))
}

const initCompareChart = () => {
  if (!compareChartRef.value) return

  compareChart = echarts.init(compareChartRef.value)

  const getOption = () => mergeChartOption({
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['身高', '体重', 'BMI']
    },
    xAxis: {
      type: 'category',
      data: examHistory.value.map(item => item.examDate)
    },
    yAxis: [
      {
        type: 'value',
        name: '身高/体重',
        position: 'left'
      },
      {
        type: 'value',
        name: 'BMI',
        position: 'right'
      }
    ],
    series: [
      {
        name: '身高',
        type: 'line',
        data: examHistory.value.map(item => item.height),
        smooth: true,
        itemStyle: { color: '#3b82f6' }
      },
      {
        name: '体重',
        type: 'line',
        data: examHistory.value.map(item => item.weight),
        smooth: true,
        itemStyle: { color: '#10b981' }
      },
      {
        name: 'BMI',
        type: 'line',
        yAxisIndex: 1,
        data: examHistory.value.map(item => item.bmi),
        smooth: true,
        itemStyle: { color: '#f59e0b' }
      }
    ]
  })

  compareChart.setOption(getOption())
  observers.push(watchThemeChange(compareChart, getOption))
}

onMounted(() => {
  // 初始化时直接加载写死的数据
  handleSearch()
})

onUnmounted(() => {

  observers.forEach(observer => observer?.disconnect())
  observers = []

  detailChart?.dispose()
  compareChart?.dispose()
})
</script>

<style scoped>

.student-health-container {
  padding: 0 20px;
  min-height: calc(100vh - 120px);
  max-width: 1600px;
  margin: 0 auto;
  overflow-x: hidden;
  box-sizing: border-box;
  width: 100%;
}

.filter-card {
  margin-bottom: 20px;
  border-radius: 16px;
  border: 1px solid var(--school-border);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  width: 100%;
}

.filter-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.filter-card :deep(.el-form) {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.filter-card :deep(.el-form-item) {
  margin-right: 0;
  margin-bottom: 0;
  flex: 0 0 auto;
}

.table-card {
  border-radius: 12px;
  background: var(--school-card-bg);
  border: 1px solid var(--school-border);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  overflow: visible;
  width: 100%;
}

:deep(.el-table .abnormal-row) {
  background-color: #fef0f0 !important;
  animation: pulse-red 2s ease-in-out infinite;
}

:deep(.el-table .warning-row) {
  background-color: #fdf6ec !important;
}

:deep(.el-table .abnormal-row:hover) {
  background-color: #fde2e2 !important;
}

:deep(.el-table .warning-row:hover) {
  background-color: #faecd8 !important;
}

@keyframes pulse-red {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
  }
}

.abnormal-card {
  border: 2px solid #f56c6c !important;
  background: linear-gradient(135deg, #fef0f0 0%, #ffffff 100%) !important;
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.2) !important;
  animation: pulse-red 2s ease-in-out infinite;
}

.abnormal-card .card-header {
  background: #fef0f0 !important;
}

.warning-card {
  border: 2px solid #e6a23c !important;
  background: linear-gradient(135deg, #fdf6ec 0%, #ffffff 100%) !important;
  box-shadow: 0 4px 12px rgba(230, 162, 60, 0.15) !important;
}

.warning-card .card-header {
  background: #fdf6ec !important;
}

.table-card :deep(.el-card__body) {
  padding: 20px;
  overflow-x: auto;
}

.desktop-table {
  width: 100%;
  min-width: 100%;
}

.desktop-table :deep(.el-table__inner-wrapper) {
  width: 100% !important;
}

.desktop-table :deep(.el-table) {
  width: 100%;
  table-layout: auto;
}

.desktop-table :deep(.el-table__header),
.desktop-table :deep(.el-table__body) {
  width: 100%;
  table-layout: auto;
}

.desktop-table :deep(.el-table__fixed-right) {
  right: 0;
}

.table-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.dark .table-card {
  background: var(--school-card-bg);
  border: 1px solid var(--school-border) !important;
}

.dark .filter-card {
  border: 1px solid var(--school-border) !important;
}

.dark .table-card:hover,
.dark .filter-card:hover {
  border: 1px solid var(--school-primary-light) !important;
}

.mobile-card-list {
  display: none;
}

.desktop-pagination {
  display: flex;
}

.mobile-pagination {
  display: none;
}

.btn-text-mobile {
  display: none;
}

.btn-text-full {
  display: inline;
}

.dark .table-card :deep(.el-table) {
  background-color: var(--school-card-bg);
}

.dark .table-card :deep(.el-table__inner-wrapper) {
  background-color: var(--school-card-bg);
}

.dark .table-card :deep(.el-scrollbar__wrap),
.dark .table-card :deep(.el-scrollbar__view) {
  background-color: transparent;
}

.pagination-container {
  margin-top: 20px;
  padding: 16px 0;
  display: flex;
  justify-content: flex-end;
  background: transparent;
}

.dark .pagination-container {
  background: transparent;
}

@media (max-width: 768px) {
  .pagination-container {
    justify-content: center;
    overflow-x: auto;
  }

  .pagination-container :deep(.el-pagination) {
    flex-wrap: wrap;
    justify-content: center;
  }
}

.student-detail {
  padding: 0;
}

.detail-section {
  margin-bottom: 28px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--school-text);
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title::before {
  content: '';
  width: 4px;
  height: 18px;
  background: linear-gradient(135deg, var(--school-primary), var(--school-primary-dark, #1976d2));
  border-radius: 2px;
}

.desktop-descriptions {
  display: table;
}

.mobile-info-cards {
  display: none;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.mobile-info-card {
  padding: 12px;
  background: var(--school-bg);
  border: 1px solid var(--school-border);
  border-radius: 8px;
  text-align: center;
}

.info-card-label {
  font-size: 11px;
  color: var(--school-text-muted);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-card-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--school-text);
}

.dark .mobile-info-card {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.1);
}

.detail-chart,
.compare-chart {
  height: 300px;
  width: 100%;
}

.metric-unit {
  font-size: 14px;
  font-weight: 500;
  color: var(--school-text-muted);
  margin-left: 2px;
}

.health-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  width: 100%;
  max-width: 100%;
}

.metric-item {
  text-align: center;
  padding: 20px 16px;
  background: var(--school-bg);
  border: 1px solid var(--school-border);
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

.metric-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--school-primary);
  opacity: 0;
  transition: opacity 0.3s;
}

.metric-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border-color: var(--school-primary);
}

.metric-item:hover::before {
  opacity: 1;
}

.dark .metric-item {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.1);
}

.dark .metric-item:hover {
  border-color: var(--school-primary);
}

.metric-label {
  font-size: 13px;
  color: var(--school-text-muted);
  margin-bottom: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--school-primary);
  line-height: 1.2;
}

.exam-compare {
  min-height: 400px;
  padding: 16px 0;
}

.desktop-exam-table {
  display: table;
}

.mobile-exam-cards {
  display: none;
  flex-direction: column;
  gap: 12px;
}

.exam-history-card {
  background: var(--school-card-bg);
  border: 1px solid var(--school-border);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
}

.exam-history-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: var(--school-primary);
}

.dark .exam-history-card {
  background: var(--school-card-bg);
  border-color: rgba(255, 255, 255, 0.1);
}

.exam-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--school-border);
}

.exam-date {
  font-size: 14px;
  font-weight: 600;
  color: var(--school-text);
}

.exam-card-body {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}

.exam-metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: var(--school-bg);
  border-radius: 6px;
}

.exam-metric .metric-label {
  font-size: 11px;
  color: var(--school-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.exam-metric .metric-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--school-primary);
}

.exam-metric .unit {
  font-size: 11px;
  font-weight: 500;
  color: var(--school-text-muted);
  margin-left: 2px;
}

.dark .exam-metric {
  background: rgba(255, 255, 255, 0.03);
}

.exam-card-change {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-radius: 6px;
  font-size: 12px;
  color: #16a34a;
  font-weight: 500;
}

.dark .exam-card-change {
  background: linear-gradient(135deg, #1a3a2a 0%, #1e4a35 100%);
  color: #4ade80;
}

.mobile-card-list {
  padding: 0;
}

.student-card {
  background: var(--school-card-bg);
  border: 1px solid var(--school-border);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.student-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: var(--school-primary);
}

.student-card:active {
  transform: translateY(0);
}

.dark .student-card {
  background: var(--school-card-bg);
  border-color: rgba(255, 255, 255, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--school-border);
}

.student-info {
  flex: 1;
}

.student-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--school-text);
  margin: 0 0 4px 0;
}

.student-meta {
  font-size: 13px;
  color: var(--school-text-muted);
}

.card-content {
  margin-bottom: 12px;
}

.info-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
  width: 100%;
}

.info-item {
  text-align: center;
  padding: 10px 8px;
  background: var(--school-bg);
  border-radius: 8px;
  border: 1px solid var(--school-border);
  box-sizing: border-box;
  min-width: 0;
}

.info-label {
  display: block;
  font-size: 11px;
  color: var(--school-text-muted);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: var(--school-primary);
}

.info-value .unit {
  font-size: 12px;
  font-weight: 500;
  color: var(--school-text-muted);
  margin-left: 2px;
}

.dark .info-item {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.1);
}

.nutrition-row {
  margin-bottom: 12px;
}

.nutrition-label {
  display: block;
  font-size: 12px;
  color: var(--school-text-muted);
  margin-bottom: 8px;
  font-weight: 500;
}

.nutrition-progress {
  width: 100%;
}

.exam-date {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--school-text-muted);
  padding: 8px 12px;
  background: var(--school-bg);
  border-radius: 6px;
}

.dark .exam-date {
  background: rgba(255, 255, 255, 0.03);
}

.card-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--school-border);
}

.card-actions .el-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--school-text-muted);
}

.empty-state .el-icon {
  color: #d1d5db;
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 14px;
  margin: 0;
}

@media (max-width: 768px) {
  .health-metrics {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .metric-item {
    padding: 16px 12px;
  }

  .metric-value {
    font-size: 20px;
  }

  .metric-label {
    font-size: 12px;
  }

  .desktop-table {
    display: none !important;
  }

  .mobile-card-list {
    display: block;
  }

  .desktop-pagination {
    display: none !important;
  }

  .mobile-pagination {
    display: flex !important;
    justify-content: center;
  }

  .filter-card {
    margin-bottom: 16px;
  }

  :deep(.el-dialog) {
    width: 95% !important;
    margin: 20px auto !important;
    border-radius: 12px;
    max-height: calc(100vh - 120px);
  }

  :deep(.el-dialog__header) {
    padding: 16px;
    font-size: 16px;
  }

  :deep(.el-dialog__body) {
    padding: 16px;
    max-height: calc(100vh - 200px);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  :deep(.student-detail-dialog .el-dialog) {
    width: 95vw !important;
    max-height: calc(100vh - 130px);
  }

  :deep(.student-detail-dialog .el-dialog__body) {
    padding: 12px;
    padding-bottom: 12px;
  }

  .student-detail {
    padding: 0 !important;
    margin: 0 !important;
  }

  .student-detail .detail-section {
    margin-bottom: 16px !important;
  }

  .student-detail .detail-section:last-child {
    margin-bottom: 0 !important;
  }

  .student-detail .section-title {
    margin-bottom: 12px !important;
    font-size: 15px !important;
  }

  .detail-chart {
    margin-bottom: 0 !important;
  }

  .desktop-descriptions {
    display: none !important;
  }

  .mobile-info-cards {
    display: grid !important;
    gap: 10px !important;
  }

  .mobile-info-card {
    padding: 10px !important;
  }

  .health-metrics {
    gap: 10px !important;
  }

  .metric-item {
    padding: 12px 10px !important;
  }

  .metric-label {
    font-size: 11px !important;
    margin-bottom: 4px !important;
  }

  .metric-value {
    font-size: 16px !important;
  }

  .detail-chart,
  .compare-chart {
    height: 220px !important;
  }

  :deep(.exam-compare-dialog .el-dialog) {
    width: 95vw !important;
    max-height: calc(100vh - 130px);
  }

  :deep(.exam-compare-dialog .el-dialog__body) {
    padding: 16px;
    padding-bottom: 20px;
  }

  .desktop-exam-table {
    display: none !important;
  }

  .mobile-exam-cards {
    display: flex !important;
  }

  .exam-compare {
    min-height: 200px;
    padding: 8px 0;
    margin-bottom: 0;
  }

  :deep(.health-report-dialog) {
    width: 100vw !important;
    height: 100vh !important;
    margin: 0 !important;
    border-radius: 0 !important;
  }

  :deep(.health-report-dialog .el-dialog__body) {
    padding-bottom: 80px;
    max-height: calc(100vh - 200px);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  :deep(.history-report-dialog) {
    width: 100vw !important;
    margin: 0 !important;
    border-radius: 0 !important;
  }

  :deep(.history-report-dialog .el-dialog__body) {
    padding-bottom: 80px;
    max-height: calc(100vh - 200px);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  :deep(.el-dialog:not(.health-report-dialog):not(.history-report-dialog)) {
    width: 95vw !important;
  }

  .filter-card :deep(.el-form) {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .filter-card :deep(.el-form-item) {
    margin-right: 0;
    margin-bottom: 0;
    width: 100%;
  }

  .filter-card :deep(.el-form-item__label) {
    width: 70px !important;
  }

  .filter-card :deep(.el-form-item__content) {
    flex: 1;
  }

  .filter-card :deep(.el-select),
  .filter-card :deep(.el-input) {
    width: 100% !important;
  }

  .filter-card :deep(.el-form-item:last-child) {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .filter-card :deep(.el-form-item:last-child .el-form-item__content) {
    display: flex;
    gap: 8px;
    width: 100%;
  }

  .filter-card :deep(.el-button) {
    flex: 1;
    margin-left: 0 !important;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  .filter-card :deep(.el-button .el-icon) {
    margin: 0;
  }
}

@media (max-width: 480px) {
  .health-metrics {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .metric-item {
    padding: 14px;
  }

  .metric-value {
    font-size: 18px;
  }

  .filter-card :deep(.el-form-item:last-child .el-form-item__content) {
    flex-direction: column;
    gap: 8px;
  }

  .filter-card :deep(.el-button) {
    width: 100%;
    margin-left: 0 !important;
    margin-bottom: 0 !important;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 10px 16px;
    font-size: 13px;
  }

  .filter-card :deep(.el-button .el-icon) {
    margin: 0;
  }

  .filter-card :deep(.el-button) {
    white-space: nowrap;
    overflow: hidden;
  }

  :deep(.el-table__cell) {
    padding: 8px 4px !important;
  }

  :deep(.el-button--small) {
    padding: 4px 8px;
    font-size: 12px;
  }

  button,
  .el-button {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  :deep(.el-table__row) {
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
}

.health-report-dialog :deep(.el-dialog__body) {
  padding: 0;
  background: linear-gradient(to bottom, var(--school-bg), var(--school-card-bg));
}

.report-container {
  padding: 32px 28px 24px;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px solid transparent;
  background: linear-gradient(to right, var(--school-border), transparent) no-repeat bottom;
  background-size: 100% 2px;
}

.dark .report-header {
  background: linear-gradient(to right, rgba(255, 255, 255, 0.1), transparent) no-repeat bottom;
  background-size: 100% 2px;
}

.header-content {
  flex: 1;
}

.report-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--school-text);
  margin: 0 0 10px 0;
  background: linear-gradient(135deg, var(--school-primary), var(--school-primary-dark, #1976d2));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.report-subtitle {
  font-size: 14px;
  color: var(--school-text-muted);
  margin: 0;
  opacity: 0.8;
}

.generate-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
}

.generate-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.generate-btn:hover:not(:disabled)::before {
  left: 100%;
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}

.generate-btn:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}

.generate-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  filter: grayscale(0.3);
}

.generate-btn.generating {
  animation: pulse 1.5s ease-in-out infinite, shimmer 2s linear infinite;
}

@keyframes shimmer {
  0% { filter: brightness(1); }
  50% { filter: brightness(1.1); }
  100% { filter: brightness(1); }
}

.generating-text {
  display: flex;
  align-items: center;
  gap: 6px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
  width: 100%;
  max-width: 100%;
}

.stat-card {
  padding: 20px 16px;
  background: var(--school-bg);
  border: 1px solid var(--school-border);
  border-radius: 12px;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--stat-color, #409eff), transparent);
  opacity: 0;
  transition: opacity 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border-color: var(--stat-color, var(--school-primary));
}

.stat-card:hover::before {
  opacity: 1;
}

.dark .stat-card {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.1);
}

.stat-label {
  font-size: 13px;
  color: var(--school-text-muted);
  margin-bottom: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
  background: linear-gradient(135deg, var(--stat-color), var(--stat-color-dark));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-value.primary {
  --stat-color: #409eff;
  --stat-color-dark: #337ecc;
  color: #409eff;
}

.stat-value.success {
  --stat-color: #67c23a;
  --stat-color-dark: #529b2e;
  color: #67c23a;
}

.stat-value.warning {
  --stat-color: #e6a23c;
  --stat-color-dark: #b88230;
  color: #e6a23c;
}

.stat-value.danger {
  --stat-color: #f56c6c;
  --stat-color-dark: #c45656;
  color: #f56c6c;
}

.ai-report-section {
  background: linear-gradient(135deg, var(--school-bg) 0%, rgba(var(--school-primary-rgb, 64, 158, 255), 0.02) 100%);
  border: 2px solid var(--school-border);
  border-radius: 20px;
  padding: 28px 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.dark .ai-report-section {
  background: linear-gradient(135deg, #1a1f2e 0%, rgba(64, 158, 255, 0.03) 100%);
  border-color: rgba(255, 255, 255, 0.1);
}

.report-block {
  margin-bottom: 32px;
  animation: fadeInUp 0.5s ease;
}

.report-block:last-child {
  margin-bottom: 0;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.block-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
  color: var(--school-text);
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--school-border);
}

.block-title .el-icon {
  font-size: 20px;
  color: var(--school-primary);
}

.block-content {
  font-size: 15px;
  line-height: 1.8;
  color: var(--school-text);
  margin: 0;
  text-align: justify;
}

.plan-content {
  padding: 20px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-left: 4px solid #3b82f6;
  border-radius: 12px;
  box-shadow: inset 0 2px 8px rgba(59, 130, 246, 0.1);
}

.dark .plan-content {
  background: linear-gradient(135deg, #1e3a5f 0%, #1e293b 100%);
  border-left-color: #3b82f6;
  box-shadow: inset 0 2px 8px rgba(59, 130, 246, 0.2);
}

.highlight-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.highlight-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 20px;
  border-radius: 12px;
  font-size: 15px;
  line-height: 1.7;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.highlight-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  transition: width 0.3s;
}

.highlight-item:hover {
  transform: translateX(6px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.highlight-item:hover::before {
  width: 6px;
}

.highlight-success {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 2px solid #bbf7d0;
}

.highlight-success::before {
  background: linear-gradient(180deg, #22c55e, #16a34a);
}

.highlight-warning {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border: 2px solid #fde68a;
}

.highlight-warning::before {
  background: linear-gradient(180deg, #f59e0b, #d97706);
}

.highlight-danger {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 2px solid #fecaca;
}

.highlight-danger::before {
  background: linear-gradient(180deg, #ef4444, #dc2626);
}

.dark .highlight-success {
  background: linear-gradient(135deg, #1a3a2a 0%, #1e4a35 100%);
  border-color: #22c55e40;
}

.dark .highlight-warning {
  background: linear-gradient(135deg, #3a2f1a 0%, #4a3a1e 100%);
  border-color: #f59e0b40;
}

.dark .highlight-danger {
  background: linear-gradient(135deg, #3a1a1a 0%, #4a1e1e 100%);
  border-color: #ef444440;
}

.highlight-icon {
  font-size: 20px;
  flex-shrink: 0;
  font-weight: 700;
}

.highlight-text {
  flex: 1;
  color: var(--school-text);
  font-weight: 500;
}

.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 15px;
  line-height: 1.7;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.suggestion-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0;
  background: linear-gradient(180deg, #3b82f6, #2563eb);
  transition: width 0.3s;
}

.suggestion-item:hover {
  transform: translateX(6px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.15);
  border-color: #3b82f6;
}

.suggestion-item:hover::before {
  width: 4px;
}

.dark .suggestion-item {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  border-color: rgba(255, 255, 255, 0.1);
}

.dark .suggestion-item:hover {
  border-color: #3b82f6;
}

.suggestion-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  transition: all 0.3s;
}

.suggestion-item:hover .suggestion-number {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

.suggestion-text {
  flex: 1;
  color: var(--school-text);
  font-weight: 500;
}

.empty-report {
  text-align: center;
  padding: 80px 20px;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.empty-icon {
  margin-bottom: 20px;
  color: #d1d5db;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.empty-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--school-text);
  margin-bottom: 10px;
}

.empty-hint {
  font-size: 14px;
  color: var(--school-text-muted);
  opacity: 0.7;
}

.report-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.history-report-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: #667eea;
  border: 2px solid rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.history-report-btn:hover {
  background: linear-gradient(135deg, #ffffff, rgba(255, 255, 255, 0.95));
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
  border-color: #667eea;
}

.history-report-btn:active {
  transform: translateY(0) scale(0.98);
}

.history-report-btn .badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 11px;
  font-size: 11px;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
}

.history-report-card {
  background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.history-report-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transform: scaleX(0);
  transition: transform 0.3s;
}

.history-report-card:hover {
  border-color: #667eea;
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.2);
  transform: translateY(-4px);
}

.history-report-card:hover::before {
  transform: scaleX(1);
}

.history-report-card:active {
  transform: translateY(-2px);
}

.history-report-card h4 {
  font-weight: 700;
  color: var(--school-text);
  transition: color 0.3s;
}

.history-report-card:hover h4 {
  color: #667eea;
}

.dark .history-report-card {
  background: linear-gradient(135deg, #1a1f2e 0%, #1e2330 100%);
  border-color: rgba(255, 255, 255, 0.1);
}

.dark .history-report-card:hover {
  border-color: #667eea;
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.3);
}

/* 超大屏幕 (大于 1600px) */
@media (min-width: 1601px) {
  .student-health-container {
    padding: 0 40px;
  }

  .desktop-table :deep(.el-table__body-wrapper) {
    overflow-x: hidden;
  }

  :deep(.el-dialog) {
    max-width: 1400px;
    margin: 40px auto !important;
  }

  .report-container {
    padding: 40px 48px;
  }

  .health-metrics {
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }
}

/* 大屏幕 (1025px - 1600px) */
@media (min-width: 1025px) and (max-width: 1600px) {
  .student-health-container {
    padding: 0 24px;
  }

  .desktop-table :deep(.el-table__body-wrapper) {
    overflow-x: auto;
  }

  :deep(.el-dialog) {
    max-width: 1200px;
    margin: 30px auto !important;
  }

  .report-container {
    padding: 32px 36px;
  }

  .health-metrics {
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;
  }
}

/* 平板和大屏手机 (小于等于 1024px) */
@media (max-width: 1024px) {
  .student-health-container {
    padding: 0 16px;
  }

  .filter-card :deep(.el-form) {
    gap: 12px;
  }

  .filter-card :deep(.el-input),
  .filter-card :deep(.el-select),
  .filter-card :deep(.el-date-editor) {
    min-width: 160px !important;
  }

  .table-card :deep(.el-card__body) {
    padding: 16px;
    overflow-x: auto;
  }

  .desktop-table {
    min-width: 900px;
  }
}

/* 平板和手机 (小于等于 768px) */
@media (max-width: 768px) {
  .student-health-container {
    padding: 0 12px;
  }

  .btn-text-mobile {
    display: inline;
  }

  .btn-text-full {
    display: none;
  }

  .filter-card {
    margin-bottom: 16px;
    border-radius: 12px;
  }

  .filter-card :deep(.el-form) {
    gap: 8px;
  }

  .filter-card :deep(.el-form-item) {
    width: 100%;
    flex: 1 1 100%;
    min-width: 0;
  }

  .filter-card :deep(.el-date-editor) {
    width: 100% !important;
  }

  .filter-card :deep(.el-date-editor .el-range-separator) {
    padding: 0 2px;
  }

  .filter-card :deep(.el-date-editor .el-range-input) {
    width: 40%;
  }

  .filter-card :deep(.el-form-item:last-child) {
    width: 100%;
  }

  .filter-card :deep(.el-form-item:last-child .el-form-item__content) {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .filter-card :deep(.el-button) {
    flex: 1 1 calc(50% - 4px);
    min-width: 0;
  }

  .filter-card :deep(.el-input),
  .filter-card :deep(.el-select) {
    width: 100% !important;
  }

  .table-card {
    border-radius: 12px;
  }

  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
    margin-bottom: 24px;
  }

  .report-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .report-actions {
    width: 100%;
    flex-direction: column;
  }

  .generate-btn,
  .history-report-btn {
    width: 100%;
    justify-content: center;
  }

  .stat-value {
    font-size: 24px;
  }

  .stat-label {
    font-size: 12px;
  }

  .report-container {
    padding: 16px;
  }

  .block-title {
    font-size: 14px;
  }

  .block-content {
    font-size: 13px;
  }

  .highlight-item,
  .suggestion-item {
    font-size: 13px;
    padding: 12px;
  }

  .report-title {
    font-size: 18px;
  }

  .report-subtitle {
    font-size: 12px;
  }

  :deep(.health-report-dialog) {
    width: 100vw !important;
    height: 100vh !important;
    margin: 0 !important;
  }

  :deep(.health-report-dialog .el-dialog__body) {
    max-height: calc(100vh - 120px);
    overflow-y: auto;
  }

  :deep(.history-report-dialog) {
    width: 100vw !important;
    margin: 0 !important;
  }

  :deep(.student-detail-dialog),
  :deep(.exam-compare-dialog) {
    width: 95vw !important;
    margin: 0 auto !important;
  }

  .history-report-card {
    padding: 12px;
  }

  .history-report-card h4 {
    font-size: 14px;
  }

  .history-report-card p {
    font-size: 12px;
  }

  .history-report-card:last-child {
    margin-bottom: 80px;
  }

  .table-card {
    border-radius: 8px;
    margin-bottom: 16px;
  }

  :deep(.el-pagination) {
    padding: 8px 0;
  }

  :deep(.el-pager li) {
    min-width: 28px;
    height: 28px;
    line-height: 28px;
    font-size: 12px;
  }
}

/* 小屏手机 (小于等于 480px) */
@media (max-width: 480px) {
  .student-health-container {
    padding: 0 10px;
  }

  .filter-card {
    margin-bottom: 12px;
    border-radius: 10px;
  }

  .filter-card :deep(.el-form-item__label) {
    font-size: 13px;
  }

  .filter-card :deep(.el-button) {
    flex: 1 1 100%;
    padding: 10px;
    font-size: 13px;
  }

  .generate-report-btn {
    order: -1;
  }

  .table-card {
    border-radius: 10px;
  }

  .stats-overview {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-value {
    font-size: 26px;
  }

  .stat-label {
    font-size: 13px;
  }

  .student-card {
    padding: 14px;
    margin-bottom: 10px;
  }

  .info-row {
    gap: 10px;
  }

  .info-item {
    padding: 8px 6px;
  }

  .info-value {
    font-size: 16px;
  }

  .student-name {
    font-size: 15px;
  }

  .student-meta {
    font-size: 12px;
  }

  .card-actions {
    gap: 6px;
  }

  .card-actions .el-button {
    font-size: 12px;
    padding: 8px 12px;
  }

  .detail-chart,
  .compare-chart {
    height: 250px;
  }
}

/* 超小屏手机 (小于等于 375px) */
@media (max-width: 375px) {
  .student-health-container {
    padding: 0 8px;
  }

  .filter-card {
    margin-bottom: 10px;
    border-radius: 8px;
  }

  .filter-card :deep(.el-button) {
    padding: 8px 10px;
    font-size: 12px;
  }

  .table-card {
    border-radius: 8px;
  }

  .stat-card {
    padding: 12px;
  }

  .stat-value {
    font-size: 22px;
  }

  .stat-label {
    font-size: 12px;
  }

  .report-title {
    font-size: 16px;
  }

  .report-subtitle {
    font-size: 11px;
  }

  .block-title {
    font-size: 13px;
  }

  .block-content {
    font-size: 12px;
  }

  .report-container {
    padding: 12px;
  }

  .student-card {
    padding: 12px;
    margin-bottom: 8px;
  }

  .info-row {
    gap: 8px;
    grid-template-columns: 1fr 1fr 1fr;
  }

  .info-item {
    padding: 8px 4px;
  }

  .info-label {
    font-size: 10px;
  }

  .info-value {
    font-size: 14px;
  }

  .info-value .unit {
    font-size: 10px;
  }

  .student-name {
    font-size: 14px;
  }

  .student-meta {
    font-size: 11px;
  }

  .card-actions {
    gap: 6px;
  }

  .card-actions .el-button {
    font-size: 11px;
    padding: 6px 10px;
  }

  .card-actions .el-button .el-icon {
    font-size: 12px;
  }

  .detail-chart,
  .compare-chart {
    height: 220px;
  }

  .section-title {
    font-size: 15px;
  }

  .metric-item {
    padding: 14px 10px;
  }

  .metric-value {
    font-size: 20px;
  }

  .metric-label {
    font-size: 11px;
  }

  .highlight-item,
  .suggestion-item {
    font-size: 12px;
    padding: 10px;
  }

  .suggestion-number {
    width: 20px;
    height: 20px;
    font-size: 11px;
  }

  .report-container {
    padding: 16px !important;
    padding-bottom: 40px !important;
    max-height: calc(100vh - 180px);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .ai-report-section {
    padding: 20px 16px;
    margin-bottom: 24px;
  }

  .empty-report {
    padding: 60px 20px 40px;
  }

  .student-detail {
    padding-bottom: 0 !important;
  }

  .exam-compare {
    padding-bottom: 0 !important;
    min-height: 200px;
  }
}

@media (max-width: 768px) and (orientation: landscape) {
  :deep(.el-dialog__body) {
    padding-bottom: 12px;
    max-height: calc(100vh - 150px);
  }

  .report-container {
    max-height: calc(100vh - 140px);
  }

  .student-detail,
  .exam-compare {
    padding-bottom: 0 !important;
  }
}

* {
  scroll-behavior: smooth;
}

@media (max-width: 768px) {
  .report-container::-webkit-scrollbar,
  :deep(.el-dialog__body)::-webkit-scrollbar {
    width: 4px;
  }

  .report-container::-webkit-scrollbar-thumb,
  :deep(.el-dialog__body)::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 2px;
  }

  :deep(.el-dialog__wrapper) {
    z-index: 3000 !important;
  }

  :deep(.el-overlay) {
    z-index: 2999 !important;
  }

  :deep(.el-dialog) {
    padding-bottom: env(safe-area-inset-bottom, 0);
  }

  .detail-section:last-child,
  .exam-compare {
    margin-bottom: 0 !important;
  }

  :deep(.el-descriptions) {
    margin-bottom: 12px;
  }

  .health-metrics,
  .exam-compare > div {
    margin-bottom: 0 !important;
  }
}

@supports (padding: max(0px)) {
  @media (max-width: 768px) {
    :deep(.el-dialog__body) {
      padding-bottom: max(12px, calc(env(safe-area-inset-bottom) + 12px)) !important;
    }

    .student-detail {
      padding-bottom: 0 !important;
    }

    .report-container {
      padding-bottom: max(20px, calc(env(safe-area-inset-bottom) + 12px)) !important;
    }

    :deep(.history-report-dialog .el-dialog__body) {
      padding-bottom: max(20px, calc(env(safe-area-inset-bottom) + 12px)) !important;
    }
  }
}

@media (max-width: 768px) {
  .report-block:last-child {
    margin-bottom: 20px;
  }

  .plan-content {
    margin-bottom: 16px;
  }
}

.markdown-content {
  line-height: 1.7;
  word-wrap: break-word;
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3,
.markdown-content h4,
.markdown-content h5,
.markdown-content h6 {
  margin-top: 1em;
  margin-bottom: 0.5em;
  font-weight: 700;
  line-height: 1.3;
  color: var(--school-text);
}

.markdown-content h1 { font-size: 1.8em; }
.markdown-content h2 { font-size: 1.5em; }
.markdown-content h3 { font-size: 1.3em; }
.markdown-content h4 { font-size: 1.1em; }
.markdown-content h5 { font-size: 1em; }
.markdown-content h6 { font-size: 0.9em; }

.markdown-content p {
  margin-bottom: 1em;
  color: var(--school-text);
}

.markdown-content strong {
  font-weight: 700;
  color: var(--school-text);
}

.markdown-content em {
  font-style: italic;
  color: var(--school-text-muted);
}

.markdown-content ul,
.markdown-content ol {
  margin-bottom: 1em;
  padding-left: 1.5em;
}

.markdown-content li {
  margin-bottom: 0.5em;
  line-height: 1.6;
  color: var(--school-text);
}

.markdown-content ul {
  list-style-type: disc;
}

.markdown-content ol {
  list-style-type: decimal;
}

.markdown-content a {
  color: var(--school-primary);
  text-decoration: none;
  transition: color 0.3s;
}

.markdown-content a:hover {
  color: var(--school-primary-dark);
  text-decoration: underline;
}

.markdown-content code {
  padding: 0.2em 0.4em;
  font-size: 0.9em;
  background-color: var(--school-code-bg, rgba(99, 102, 241, 0.1));
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
  color: #dc2626;
}

.markdown-content pre {
  padding: 1em;
  background-color: var(--school-pre-bg, #1f2937);
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 1em;
}

.markdown-content pre code {
  padding: 0;
  background-color: transparent;
  color: #e5e7eb;
  font-size: 0.85em;
}

.markdown-content blockquote {
  margin: 1em 0;
  padding: 0.8em 1em;
  border-left: 4px solid var(--school-primary);
  background-color: var(--school-blockquote-bg, rgba(99, 102, 241, 0.05));
  color: var(--school-text-muted);
  font-style: italic;
}

.markdown-content hr {
  margin: 1.5em 0;
  border: none;
  border-top: 2px solid var(--school-border);
}

.markdown-content table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1em;
}

.markdown-content th,
.markdown-content td {
  padding: 0.6em 1em;
  border: 1px solid var(--school-border);
  text-align: left;
}

.markdown-content th {
  background-color: var(--school-table-header-bg, rgba(99, 102, 241, 0.1));
  font-weight: 700;
  color: var(--school-text);
}

.markdown-content td {
  color: var(--school-text);
}

.markdown-content img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 1em 0;
}

.dark .markdown-content code {
  background-color: rgba(99, 102, 241, 0.2);
  color: #fca5a5;
}

.dark .markdown-content pre {
  background-color: #111827;
}

.dark .markdown-content blockquote {
  background-color: rgba(99, 102, 241, 0.1);
  border-left-color: var(--school-primary);
}

</style>

