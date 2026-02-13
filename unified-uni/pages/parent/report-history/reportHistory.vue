<template>
  <layout>
    <scroll-view class="scroll-container" :scroll-y="true">
      <view class="page-container">
        <!-- 筛选栏 -->
        <view class="filter-bar">
          <view class="filter-title">
            <uni-icons type="folder-add" size="20" color="#2c3e50"></uni-icons>
            <text class="title-text">历史报告</text>
          </view>

          <view class="filter-actions">
            <picker @change="onFilterChange" :value="filterIndex" :range="filterOptions" range-key="label">
              <view class="picker-view">
                <text>{{ filterOptions[filterIndex].label }}</text>
                <uni-icons type="bottom" size="12" color="#64748b"></uni-icons>
              </view>
            </picker>
            <view class="refresh-btn" @click="loadReports">
              <uni-icons type="refresh" size="18" color="#64748b"></uni-icons>
            </view>
          </view>
        </view>

        <!-- 孩子选择器 -->
        <view v-if="children.length > 1" class="child-selector">
          <text class="selector-label">选择孩子：</text>
          <scroll-view scroll-x class="child-tabs">
            <view
              v-for="child in children"
              :key="child._id"
              class="child-tab"
              :class="{ active: selectedChildId === child._id }"
              @click="selectChild(child._id)"
            >
              {{ child.name }}
            </view>
          </scroll-view>
        </view>

        <!-- 报告列表 -->
        <view v-if="!loading && reports.length > 0" class="reports-list">
          <view v-for="report in reports" :key="report._id" class="report-card" @click="viewReport(report)">
            <view class="report-header">
              <view class="report-meta">
                <view class="report-title">
                  {{ report.childName }} 的{{ report.reportType === "weekly" ? "周" : "月" }}报
                </view>
                <text class="report-date">{{ formatDateRange(report.dateRange) }}</text>
              </view>
              <view class="more-btn" @click.stop="showActions(report)">
                <uni-icons type="more-filled" size="18" color="#64748b"></uni-icons>
              </view>
            </view>

            <view class="report-summary">
              <view class="summary-item">
                <text class="summary-val">{{ report.dataSummary?.avgCalories || 0 }}</text>
                <text class="summary-lab">千卡</text>
              </view>
              <view class="summary-item">
                <text class="summary-val">{{ report.dataSummary?.avgProtein || 0 }}g</text>
                <text class="summary-lab">蛋白质</text>
              </view>
              <view class="summary-item">
                <text class="summary-val">{{ report.dataSummary?.avgCarbs || 0 }}g</text>
                <text class="summary-lab">碳水</text>
              </view>
              <view class="summary-item">
                <text class="summary-val">{{ report.dataSummary?.avgFat || 0 }}g</text>
                <text class="summary-lab">脂肪</text>
              </view>
            </view>

            <view class="report-footer">
              <view class="status-badge" :class="report.status">
                {{ getStatusText(report.status) }}
              </view>
              <text class="create-date">{{ formatDate(report.createdAt) }}</text>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-else-if="!loading && reports.length === 0" class="empty-state">
          <uni-icons type="info" size="64" color="#e5e7eb"></uni-icons>
          <text class="empty-text">暂无历史报告</text>
          <text class="empty-desc">前往首页生成第一份报告吧</text>
          <button class="goto-home-btn" @click="goHome">返回首页</button>
        </view>

        <!-- 加载中 -->
        <view v-if="loading" class="loading-box">
          <uni-icons type="spinner-cycle" size="32" color="#5b8db8" class="loading-icon"></uni-icons>
          <text>加载中...</text>
        </view>

        <!-- 报告详情弹出层 -->
        <uni-popup ref="detailPopup" type="bottom">
          <view class="detail-container">
            <view class="detail-header">
              <text class="detail-title">{{ currentReport?.childName }} 的营养报告</text>
              <view class="close-btn" @click="closeDetail">
                <uni-icons type="closeempty" size="20" color="#94a3b8"></uni-icons>
              </view>
            </view>

            <scroll-view scroll-y class="detail-content">
              <view v-if="currentReport" class="report-body">
                <view class="info-row">
                  <text class="type-badge" :class="currentReport.reportType">
                    {{ currentReport.reportType === "weekly" ? "周报" : "月报" }}
                  </text>
                  <text class="date-text">{{ formatDateRange(currentReport.dateRange) }}</text>
                </view>

                <view class="stats-row">
                  <view class="stat-box">
                    <text class="stat-v">{{ currentReport.dataSummary?.avgCalories }}</text>
                    <text class="stat-l">千卡/天</text>
                  </view>
                  <view class="stat-box">
                    <text class="stat-v">{{ currentReport.dataSummary?.avgProtein }}g</text>
                    <text class="stat-l">蛋白质</text>
                  </view>
                  <view class="stat-box">
                    <text class="stat-v">{{ currentReport.dataSummary?.avgCarbs }}g</text>
                    <text class="stat-l">碳水</text>
                  </view>
                  <view class="stat-box">
                    <text class="stat-v">{{ currentReport.dataSummary?.avgFat }}g</text>
                    <text class="stat-l">脂肪</text>
                  </view>
                </view>

                <view v-if="currentReport.content" class="md-content">
                  <view v-if="currentReport.content.summary" class="section">
                    <text class="section-h">报告摘要</text>
                    <text class="section-p">{{ currentReport.content.summary }}</text>
                  </view>

                  <view v-if="currentReport.content.highlights?.length" class="section">
                    <text class="section-h">亮点与提醒</text>
                    <view v-for="(h, i) in currentReport.content.highlights" :key="i" class="highlight-item">
                      {{ h }}
                    </view>
                  </view>

                  <view v-if="currentReport.content.suggestions?.length" class="section">
                    <text class="section-h">营养建议</text>
                    <view v-for="(s, i) in currentReport.content.suggestions" :key="i" class="suggestion-item">
                      • {{ s }}
                    </view>
                  </view>
                </view>
              </view>
            </scroll-view>

            <view class="detail-footer">
              <button class="download-btn" type="primary" @click="downloadReport(currentReport)">下载报告</button>
            </view>
          </view>
        </uni-popup>
      </view>
    </scroll-view>
  </layout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import layout from "@/components/layout.vue";
import { childApi, authApi } from "@/api/parent";

const loading = ref(false);
const reports = ref([]);
const children = ref([]);
const selectedChildId = ref("");
const filterIndex = ref(0);
const filterOptions = [
  { label: "全部", value: "" },
  { label: "周报", value: "weekly" },
  { label: "月报", value: "monthly" },
];

const currentReport = ref(null);
const detailPopup = ref(null);

const onFilterChange = (e) => {
  filterIndex.value = e.detail.value;
  loadReports();
};

const selectChild = (childId) => {
  selectedChildId.value = childId;
  loadReports();
};

const loadChildren = async () => {
  try {
    const res = await authApi.getUserInfo();
    if (res.code === 200 && res.data?.children?.length > 0) {
      children.value = res.data.children;
      selectedChildId.value = children.value[0]._id;
    }
  } catch (e) {}
};

const loadReports = async () => {
  if (!selectedChildId.value) return;
  loading.value = true;
  try {
    const res = await childApi.getChildAIReports(selectedChildId.value, {
      reportType: filterOptions[filterIndex.value].value || undefined,
    });
    if (res.code === 200) {
      reports.value = res.data || [];
      const child = children.value.find((c) => c._id === selectedChildId.value);
      reports.value.forEach((r) => (r.childName = child?.name || "孩子"));
    }
  } catch (e) {
  } finally {
    loading.value = false;
  }
};

const viewReport = (report) => {
  currentReport.value = report;
  detailPopup.value.open();
};

const closeDetail = () => {
  detailPopup.value.close();
};

const showActions = (report) => {
  uni.showActionSheet({
    itemList: ["查看报告", "删除报告"],
    itemColor: "#2c3e50",
    success: (res) => {
      if (res.tapIndex === 0) viewReport(report);
      else if (res.tapIndex === 1) downloadReport(report);
      else if (res.tapIndex === 2) deleteReport(report);
    },
  });
};

const downloadReport = (report) => {
  uni.showToast({ title: "正在生成本地报告", icon: "none" });
  // Mock download
};

const deleteReport = (report) => {
  uni.showModal({
    title: "确认删除",
    content: "确定要删除这份报告吗？",
    confirmColor: "#ef4444",
    success: (res) => {
      if (res.confirm) {
        uni.showToast({ title: "删除成功" });
        loadReports();
      }
    },
  });
};

const goHome = () => {
  uni.switchTab({ url: "/pages/parent/home/home" });
};

const formatDateRange = (range) => {
  if (!range) return "";
  const s = new Date(range.start);
  const e = new Date(range.end);
  return `${s.getMonth() + 1}/${s.getDate()} - ${e.getMonth() + 1}/${e.getDate()}`;
};

const formatDate = (date) => {
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const getStatusText = (status) => {
  const map = { completed: "已完成", generating: "生成中", failed: "失败" };
  return map[status] || status;
};

onMounted(async () => {
  await loadChildren();
  loadReports();
});
</script>

<style lang="scss" scoped>
.scroll-container {
  height: 100%;
}
.page-container {
  padding: 30rpx;
  background-color: #f8fafc;
  min-height: 100vh;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 24rpx 30rpx;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  margin-bottom: 24rpx;
}

.filter-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.title-text {
  font-size: 30rpx;
  font-weight: bold;
  color: #1e293b;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.picker-view {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 26rpx;
  color: #64748b;
  background: #f1f5f9;
  padding: 8rpx 20rpx;
  border-radius: 12rpx;
}

.refresh-btn {
  padding: 8rpx;
}

.child-selector {
  background: #fff;
  padding: 24rpx 30rpx;
  border-radius: 20rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.selector-label {
  font-size: 24rpx;
  color: #94a3b8;
  margin-bottom: 16rpx;
  display: block;
}

.child-tabs {
  white-space: nowrap;
}

.child-tab {
  display: inline-block;
  padding: 12rpx 30rpx;
  background: #f1f5f9;
  color: #64748b;
  font-size: 26rpx;
  border-radius: 16rpx;
  margin-right: 16rpx;
  &.active {
    background: #5b8db8;
    color: #fff;
  }
}

.report-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.report-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.report-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #1e293b;
}

.report-date {
  font-size: 24rpx;
  color: #94a3b8;
  margin-top: 4rpx;
  display: block;
}

.report-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: #f8fafc;
  padding: 20rpx;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.summary-val {
  font-size: 28rpx;
  font-weight: bold;
  color: #1e293b;
}

.summary-lab {
  font-size: 20rpx;
  color: #94a3b8;
  margin-top: 4rpx;
}

.report-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20rpx;
  border-top: 1rpx solid #f1f5f9;
}

.status-badge {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  &.completed {
    background: #eefdf3;
    color: #16a34a;
  }
}

.create-date {
  font-size: 22rpx;
  color: #cbd5e1;
}

.detail-container {
  background: #fff;
  border-top-left-radius: 32rpx;
  border-top-right-radius: 32rpx;
  padding: 40rpx 30rpx;
  max-height: 80vh;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.detail-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #1e293b;
}

.detail-content {
  height: 60vh;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 30rpx;
}

.type-badge {
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  color: #fff;
  &.weekly {
    background: #3b82f6;
  }
  &.monthly {
    background: #8b5cf6;
  }
}

.date-text {
  font-size: 26rpx;
  color: #64748b;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  margin-bottom: 40rpx;
}

.stat-box {
  background: #f1f5f9;
  padding: 24rpx;
  border-radius: 16rpx;
  text-align: center;
}

.stat-v {
  font-size: 36rpx;
  font-weight: bold;
  color: #1e293b;
  display: block;
}

.stat-l {
  font-size: 22rpx;
  color: #64748b;
}

.section {
  margin-bottom: 30rpx;
}

.section-h {
  font-size: 28rpx;
  font-weight: bold;
  color: #1e293b;
  margin-bottom: 12rpx;
  display: block;
}

.section-p {
  font-size: 26rpx;
  color: #475569;
  line-height: 1.6;
}

.detail-footer {
  margin-top: 30rpx;
}

.download-btn {
  width: 100%;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 0;
}

.goto-home-btn {
  background: #5b8db8;
  color: #fff;
  margin-top: 40rpx;
}

.loading-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx;
  color: #64748b;
}

.loading-icon {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
