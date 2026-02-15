<template>
  <layout>
    <scroll-view class="student-health-container" scroll-y>
      <!-- 筛选与统计概览 -->
      <FilterCard
        v-model:keyword="filters.keyword"
        v-model:gradeIndex="gradeIndex"
        v-model:statusIndex="statusIndex"
        :gradeOptions="gradeOptions"
        :statusOptions="statusOptions"
        @search="handleSearch"
        @generate-report="showReportDialog"
      />

      <!-- 快速统计 -->
      <StatsOverview :stats="stats" />

      <!-- 学生列表 -->
      <!-- 4. 将数据传递给学生列表组件 -->
      <StudentList :students="tableData" :loading="loading" @detail="viewDetail" @compare="compareExam" />

      <!-- 详情弹窗 -->
      <DetailPopup ref="detailPopupRef" :student="currentStudent" />

      <!-- 对比弹窗 -->
      <ComparePopup ref="comparePopupRef" :examHistory="examHistory" />

      <!-- 报告弹窗 -->
      <ReportPopup
        ref="reportPopupRef"
        :report="classReport"
        :generating="generatingReport"
        :status="generatingStatus"
        @generate="generateClassReport"
      />
    </scroll-view>
  </layout>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import layout from "@/components/layout.vue";
import { studentApi } from "@/api/school";
import FilterCard from "./components/FilterCard.vue";
import StatsOverview from "./components/StatsOverview.vue";
import StudentList from "./components/StudentList.vue";
import DetailPopup from "./components/DetailPopup.vue";
import ComparePopup from "./components/ComparePopup.vue";
import ReportPopup from "./components/ReportPopup.vue";

const loading = ref(false);
const filters = reactive({
  keyword: "",
  grade: "",
  healthStatus: "",
});

// 1. 定义响应式数据
const tableData = ref([]);

// 加载数据
const loadData = async () => {
  loading.value = true;

  try {
    // 1. 构建查询参数
    const params = buildQueryParams();

    // 2. 调用api获取数据
    const { data } = await studentApi.getHealthData(params);

    // 3. 更新响应式数据
    tableData.value = data;
  } catch (error) {
    console.error("加载健康数据失败:", error);
    uni.showToast({ title: "加载数据失败", icon: "none" });
  } finally {
    loading.value = false;
  }
};

const gradeOptions = ["全部年级", "2025级", "2024级"];
const gradeIndex = ref(0);

const statusOptions = [
  { label: "全部状态", value: "" },
  { label: "健康", value: "healthy" },
  { label: "需关注", value: "attention" },
  { label: "异常", value: "abnormal" },
];
const statusIndex = ref(0);

// 统计数据
const stats = computed(() => {
  const total = tableData.value.length;
  const healthy = tableData.value.filter((s) => s.healthStatus === "healthy").length;
  const attention = tableData.value.filter((s) => s.healthStatus === "attention").length;
  const abnormal = tableData.value.filter((s) => s.healthStatus === "abnormal").length;
  return [
    { label: "总人数", value: total, type: "total" },
    { label: "健康", value: healthy, type: "healthy" },
    { label: "需关注", value: attention, type: "attention" },
    { label: "异常", value: abnormal, type: "abnormal" },
  ];
});

// 构建查询参数
const buildQueryParams = () => {
  const params = { page: 1, pageSize: 100 };

  if (filters.keyword) {
    params.keyword = filters.keyword;
  }

  if (gradeIndex.value > 0) {
    params.grade = gradeOptions[gradeIndex.value];
  }

  const selectedStatus = statusOptions[statusIndex.value].value;
  if (selectedStatus) {
    params.healthStatus = selectedStatus;
  }

  return params;
};

const handleSearch = () => loadData();

// 弹窗相关
const detailPopupRef = ref(null);
const comparePopupRef = ref(null);
const reportPopupRef = ref(null);
const currentStudent = ref(null);
const examHistory = ref([]);

const viewDetail = async (student) => {
  currentStudent.value = student;
  detailPopupRef.value.open();
};

const compareExam = async (student) => {
  currentStudent.value = student;

  try {
    const response = await studentApi.getPhysicalExams({
      studentId: student.studentId,
      limit: 10,
    });

    if (response && response.success) {
      examHistory.value = (response.data || []).map((exam) => ({
        examDate: exam.examDate || exam.date || "",
        height: exam.height || 0,
        weight: exam.weight || 0,
        bmi: exam.bmi || 0,
        vision: exam.vision || "5.0/5.0",
      }));
    }
  } catch (error) {
    console.error("加载体检历史失败:", error);
  }

  comparePopupRef.value.open();
};

// AI 报告相关
const generatingReport = ref(false);
const generatingStatus = ref("");
const classReport = ref(null);

const showReportDialog = () => {
  if (tableData.value.length === 0) {
    uni.showToast({ title: "当前没有学生数据", icon: "none" });
    return;
  }
  reportPopupRef.value.open();
};

const generateClassReport = async () => {
  generatingReport.value = true;
  classReport.value = null;

  try {
    generatingStatus.value = "准备健康数据...";
    await new Promise((resolve) => setTimeout(resolve, 500));

    generatingStatus.value = "AI分析中...";

    const reportData = {
      filters: filters,
      students: tableData.value,
      summary: {
        total: tableData.value.length,
        healthy: tableData.value.filter((s) => s.healthStatus === "healthy").length,
        attention: tableData.value.filter((s) => s.healthStatus === "attention").length,
        abnormal: tableData.value.filter((s) => s.healthStatus === "abnormal").length,
        avgHeight: calculateAverage("height"),
        avgWeight: calculateAverage("weight"),
        avgBMI: calculateAverage("bmi"),
        avgNutritionScore: calculateAverage("nutritionScore"),
      },
    };

    const response = await studentApi.generateClassHealthReport(reportData);

    if (response && (response.success || response.code === 200)) {
      generatingStatus.value = "分析完成！";
      await new Promise((resolve) => setTimeout(resolve, 500));

      classReport.value = response.data?.content ||
        response.data || {
          overview: "报告生成成功",
          highlights: [],
          suggestions: [],
          nextPlan: "",
        };

      uni.showToast({ title: "健康报告生成成功", icon: "success" });
    } else {
      uni.showToast({ title: response.message || "生成报告失败", icon: "none" });
    }
  } catch (error) {
    console.error("生成班级健康报告失败:", error);
    uni.showToast({ title: "AI服务暂未配置，展示示例报告", icon: "none" });
    classReport.value = generateMockReport();
  } finally {
    generatingReport.value = false;
    generatingStatus.value = "";
  }
};

const calculateAverage = (field) => {
  const validData = tableData.value.filter((item) => item[field] && item[field] > 0);
  if (validData.length === 0) return 0;
  const sum = validData.reduce((acc, item) => acc + Number(item[field]), 0);
  return (sum / validData.length).toFixed(1);
};

const generateMockReport = () => {
  const total = tableData.value.length;
  const healthy = tableData.value.filter((s) => s.healthStatus === "healthy").length;
  const attention = tableData.value.filter((s) => s.healthStatus === "attention").length;
  const abnormal = tableData.value.filter((s) => s.healthStatus === "abnormal").length;
  const healthyRate = ((healthy / total) * 100).toFixed(1);

  return {
    overview: `本次统计共包含${total}名学生的健康数据。整体健康状况${
      healthyRate >= 80 ? "良好" : healthyRate >= 60 ? "一般" : "需要关注"
    }，健康率为${healthyRate}%。平均BMI为${calculateAverage("bmi")}，营养评分平均为${calculateAverage(
      "nutritionScore",
    )}分。`,
    highlights: [
      healthy > 0 ? `✓ ${healthy}名学生健康状况良好，占比${((healthy / total) * 100).toFixed(1)}%` : null,
      attention > 0 ? `⚠ ${attention}名学生需要重点关注，建议加强营养指导` : null,
      abnormal > 0 ? `✗ ${abnormal}名学生健康状况异常，需要及时干预` : null,
    ].filter(Boolean),
    suggestions: [
      "建议定期开展健康教育活动，提高学生健康意识",
      "针对体重偏离正常范围的学生，制定个性化营养方案",
      "加强体育锻炼，每天保证1小时的户外活动时间",
      "关注学生的饮食习惯，培养健康的生活方式",
      abnormal > 0 ? "对健康异常的学生进行一对一健康咨询和跟踪" : "继续保持良好的健康管理模式",
    ],
    nextPlan: `建议在未来一个月内，对${
      attention + abnormal
    }名需要关注和健康异常的学生进行重点跟踪，每周测量体重和身高，记录饮食情况。`,
  };
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
</style>
