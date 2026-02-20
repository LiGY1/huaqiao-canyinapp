<template>
  <layout>
    <scroll-view class="page-container" :scroll-y="true">
      <!-- 欢迎卡片 -->
      <view class="welcome-card">
        <view class="welcome-header">
          <view class="user-info">
            <text class="user-name">{{ userInfo?.name || "家长" }}</text>
            <text class="greeting">{{ greeting }}</text>
            <view class="role-badge">
              <uni-icons type="person" size="14" color="#1e40af"></uni-icons>
              <text class="role-text">家长端</text>
            </view>
          </view>
          <view class="datetime-info">
            <text class="date">{{ currentDate }}</text>
            <text class="time">{{ currentTime }}</text>
            <view class="weather">
              <!-- <uni-icons type="sunny" size="16" color="#fbbf24"></uni-icons> -->
              <text class="weather-text">{{ weatherInfo }}</text>
            </view>
          </view>
        </view>

        <!-- 孩子概况 (已绑定) -->
        <view v-if="hasChildren" class="child-overview">
          <view class="overview-header">
            <uni-icons type="person" size="20" color="#10b981"></uni-icons>
            <text class="overview-title">孩子今日概况 - {{ childInfo.name }}</text>
          </view>
          <view class="stats-grid">
            <view class="stat-item">
              <text class="stat-value text-green">{{ childStatus.mealsCompleted }}/3</text>
              <text class="stat-label">完成餐数</text>
            </view>
            <view class="stat-item">
              <text class="stat-value text-blue">{{ childStatus.nutritionScore }}%</text>
              <text class="stat-label">营养完成度</text>
            </view>
            <view class="stat-item">
              <text class="stat-value text-purple">{{ childInfo.class || "未设置" }}</text>
              <text class="stat-label">孩子班级</text>
            </view>
          </view>

          <!-- 三餐状态 -->
          <view class="meal-status-section">
            <text class="meal-status-title">今日用餐情况</text>
            <view class="meal-status-grid">
              <view class="meal-status-item" :class="{ eaten: mealStatus.breakfast.eaten }">
                <view class="meal-icon">🌅</view>
                <text class="meal-name">早餐</text>
                <text v-if="mealStatus.breakfast.eaten" class="meal-badge eaten-badge">已用餐</text>
                <text v-else class="meal-badge not-eaten-badge">未用餐</text>
                <view v-if="mealStatus.breakfast.eaten && mealStatus.breakfast.items.length > 0" class="meal-items">
                  <text class="meal-item" v-for="(item, index) in mealStatus.breakfast.items" :key="index">{{ item }}</text>
                </view>
              </view>
              
              <view class="meal-status-item" :class="{ eaten: mealStatus.lunch.eaten }">
                <view class="meal-icon">☀️</view>
                <text class="meal-name">午餐</text>
                <text v-if="mealStatus.lunch.eaten" class="meal-badge eaten-badge">已用餐</text>
                <text v-else class="meal-badge not-eaten-badge">未用餐</text>
                <view v-if="mealStatus.lunch.eaten && mealStatus.lunch.items.length > 0" class="meal-items">
                  <text class="meal-item" v-for="(item, index) in mealStatus.lunch.items" :key="index">{{ item }}</text>
                </view>
              </view>
              
              <view class="meal-status-item" :class="{ eaten: mealStatus.dinner.eaten }">
                <view class="meal-icon">🌙</view>
                <text class="meal-name">晚餐</text>
                <text v-if="mealStatus.dinner.eaten" class="meal-badge eaten-badge">已用餐</text>
                <text v-else class="meal-badge not-eaten-badge">未用餐</text>
                <view v-if="mealStatus.dinner.eaten && mealStatus.dinner.items.length > 0" class="meal-items">
                  <text class="meal-item" v-for="(item, index) in mealStatus.dinner.items" :key="index">{{ item }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- <view class="report-actions">
            <view class="action-row">
              <button class="report-btn weekly" @click="handleGenerateReport('weekly')" :disabled="isGenerating">
                <uni-icons
                  v-if="!isGenerating || reportTypeGenerating !== 'weekly'"
                  type="paperplane"
                  size="16"
                  color="#fff"
                ></uni-icons>
                <view v-else class="loading-icon"></view>
                <text>{{ isGenerating && reportTypeGenerating === "weekly" ? "生成中..." : "生成周报" }}</text>
              </button>
              <button class="report-btn monthly" @click="handleGenerateReport('monthly')" :disabled="isGenerating">
                <uni-icons
                  v-if="!isGenerating || reportTypeGenerating !== 'monthly'"
                  type="calendar"
                  size="16"
                  color="#fff"
                ></uni-icons>
                <view v-else class="loading-icon"></view>
                <text>{{ isGenerating && reportTypeGenerating === "monthly" ? "生成中..." : "生成月报" }}</text>
              </button>
            </view>
            <button class="history-btn" @click="goToReportHistory">
              <uni-icons type="list" size="16" color="#374151"></uni-icons>
              <text>查看历史报告</text>
            </button>
          </view> -->
        </view>
        <view v-else class="no-child-card">
          <view class="warning-info">
            <uni-icons type="warn" size="20" color="#f59e0b"></uni-icons>
            <view class="warning-text-group">
              <text class="warning-title">您还未绑定学生</text>
              <text class="warning-sub">请先绑定学生后查看相关信息</text>
            </view>
          </view>
          <button class="bind-btn" type="primary" size="mini" @click="goToBindChild">立即绑定</button>
        </view>
      </view>

      <!-- 今日营养摄入 -->
      <view v-if="hasChildren" class="nutrition-card">
        <view class="card-header">
          <view class="title-left">
            <uni-icons type="fire" size="20" color="#ef4444"></uni-icons>
            <text class="card-title">今日营养摄入</text>
          </view>
          <view v-if="hasOverIntake" class="over-badge">{{ overIntakeCount }}项超标</view>
        </view>

        <view v-if="nutritionLoading" class="loading-box">
          <uni-icons type="spinner-cycle" size="24" color="#94a3b8" class="spin"></uni-icons>
          <text class="loading-txt">加载中...</text>
        </view>

        <view v-else class="nut-grid">
          <view v-for="nut in nutrientList" :key="nut.key" class="nut-card" :style="{ background: nut.gradient }">
            <view class="nut-header">
              <text class="nut-name">{{ nut.label }}</text>
              <view v-if="isOverIntake(nut.key)" class="warn-dot">超标!</view>
            </view>
            <view class="nut-main">
              <text class="nut-val">{{ formatNumber(nutritionData[nut.key]) }}</text>
              <text class="nut-unit">{{ nut.unit }}</text>
            </view>
            <view class="nut-goal">目标: {{ nutritionData[`target${capitalize(nut.key)}`] }}{{ nut.unit }}</view>
            <view class="nut-prog">
              <view
                class="nut-prog-inner"
                :style="{
                  width: `${Math.min(
                    100,
                    getPercentage(nutritionData[nut.key], nutritionData[`target${capitalize(nut.key)}`])
                  )}%`,
                }"
              ></view>
            </view>
          </view>
        </view>
      </view>

      <!-- 报告弹窗 -->
      <uni-popup ref="reportPopup" type="center">
        <view class="report-dialog">
          <view class="dialog-header">
            <text class="dialog-title">营养报告</text>
            <uni-icons type="closeempty" size="20" color="#999" @click="closeReportDialog"></uni-icons>
          </view>

          <scroll-view v-if="currentReport" scroll-y="true" class="dialog-content">
            <view class="nutrition-mini-cards">
              <view class="mini-card">
                <text class="mini-value">{{ currentReport.dataSummary.avgCalories }}</text>
                <text class="mini-label">千卡</text>
              </view>
              <view class="mini-card">
                <text class="mini-value">{{ currentReport.dataSummary.avgProtein }}g</text>
                <text class="mini-label">蛋白质</text>
              </view>
              <view class="mini-card">
                <text class="mini-value">{{ currentReport.dataSummary.avgFat }}g</text>
                <text class="mini-label">脂肪</text>
              </view>
              <view class="mini-card">
                <text class="mini-value">{{ currentReport.dataSummary.avgCarbs }}g</text>
                <text class="mini-label">碳水</text>
              </view>
            </view>

            <view v-if="currentReport.content" class="ai-sections">
              <view v-if="currentReport.content.summary" class="section">
                <text class="section-title">报告摘要</text>
                <text class="section-text">{{ currentReport.content.summary }}</text>
              </view>

              <view v-if="currentReport.content.highlights && currentReport.content.highlights.length" class="section">
                <text class="section-title">重点提醒</text>
                <view class="highlight-list">
                  <view v-for="(h, i) in currentReport.content.highlights" :key="i" class="highlight-item">
                    <view class="dot"></view>
                    <text class="highlight-text">{{ h }}</text>
                  </view>
                </view>
              </view>

              <view
                v-if="currentReport.content.suggestions && currentReport.content.suggestions.length"
                class="section"
              >
                <text class="section-title">营养建议</text>
                <view class="suggestion-list">
                  <view v-for="(s, i) in currentReport.content.suggestions" :key="i" class="suggestion-item">
                    <text class="bullet">•</text>
                    <text class="suggestion-text">{{ s }}</text>
                  </view>
                </view>
              </view>
            </view>
          </scroll-view>

          <view class="dialog-footer">
            <button class="footer-btn" @click="closeReportDialog">关闭</button>
            <button class="footer-btn" @click="viewReportHistory">历史报告</button>
            <button class="footer-btn primary" @click="downloadReport">下载</button>
          </view>
        </view>
      </uni-popup>
    </scroll-view>
  </layout>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import layout from "@/components/layout.vue";
import storage from "@/utils/storage";
import { authApi, childApi, nutritionApi } from "@/api/parent";

// 状态
const userInfo = ref(storage.getUserInfo() || {});
const hasChildren = ref(false);
const isGenerating = ref(false);
const reportTypeGenerating = ref("");
const reportDialogVisible = ref(false);
const currentReport = ref(null);
const reportPopup = ref(null);

const childInfo = ref({
  name: "",
  grade: "",
  school: "",
  class: "",
});

const childStatus = ref({
  mealsCompleted: 0,
  nutritionScore: 0,
});

// 三餐状态
const mealStatus = ref({
  breakfast: { eaten: false, items: [] },
  lunch: { eaten: false, items: [] },
  dinner: { eaten: false, items: [] }
});

// 营养数据
const nutritionLoading = ref(false);
const nutritionData = ref({
  calories: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
  fiber: 0,
  vitaminC: 0,
  iron: 0,
  targetCalories: 2000,
  targetProtein: 75,
  targetFat: 60,
  targetCarbs: 250,
  targetFiber: 25,
  targetVitaminC: 100,
  targetIron: 15,
});

const nutrientList = [
  { key: "calories", label: "热量", unit: "千卡", gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
  { key: "protein", label: "蛋白质", unit: "g", gradient: "linear-gradient(135deg, #9c27b0 0%, #673ab7 100%)" },
  { key: "fat", label: "脂肪", unit: "g", gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
  { key: "fiber", label: "膳食纤维", unit: "g", gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" },
  { key: "vitaminC", label: "维度C", unit: "mg", gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { key: "iron", label: "铁", unit: "mg", gradient: "linear-gradient(135deg, #FF9800 0%, #FF5722 100%)" },
];

// 时间和天气
const currentDate = ref("");
const currentTime = ref("");
const weatherInfo = ref("晴朗 22°C");
const greeting = ref("你好");

// 方法
const updateTime = () => {
  const now = new Date();
  currentDate.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
  currentTime.value = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const hour = now.getHours();
  if (hour >= 0 && hour < 6) greeting.value = "凌晨好，记得休息！";
  else if (hour >= 6 && hour < 12) greeting.value = "早上好，准备好学习了吗？";
  else if (hour >= 12 && hour < 14) greeting.value = "中午好，吃饭休息吧！";
  else if (hour >= 14 && hour < 18) greeting.value = "下午好，保持专注！";
  else greeting.value = "晚上好，早点休息！";
};

// 营养相关方法
const formatNumber = (val, d = 1) => parseFloat(val || 0).toFixed(d);
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const getPercentage = (c, t) => (t ? Math.round((c / t) * 100) : 0);
const isOverIntake = (k) => nutritionData.value[k] > nutritionData.value[`target${capitalize(k)}`];
const hasOverIntake = computed(() => nutrientList.some((n) => isOverIntake(n.key)));
const overIntakeCount = computed(() => nutrientList.filter((n) => isOverIntake(n.key)).length);

const loadNutrition = async (id) => {
  nutritionLoading.value = true;
  try {
    const res = await nutritionApi.getChildNutrition(id);
    if (res.code === 200 && res.data) {
      const d = res.data;
      nutritionData.value = {
        calories: d.intake?.calories || 0,
        protein: d.intake?.protein || 0,
        fat: d.intake?.fat || 0,
        carbs: d.intake?.carbs || 0,
        fiber: d.intake?.fiber || 0,
        vitaminC: d.intake?.vitaminC || 0,
        iron: d.intake?.iron || 0,
        targetCalories: d.target?.calories || 2000,
        targetProtein: d.target?.protein || 75,
        targetFat: d.target?.fat || 60,
        targetCarbs: d.target?.carbs || 250,
        targetFiber: d.target?.fiber || 25,
        targetVitaminC: d.target?.vitaminC || 100,
        targetIron: d.target?.iron || 15,
      };
    }
  } catch (e) {
  } finally {
    nutritionLoading.value = false;
  }
};

const fetchChildNutrition = async () => {
  try {
    const userRes = await authApi.getUserInfo();
    if (userRes.code === 200 && userRes.data) {
      storage.setUserInfo(userRes.data);
      userInfo.value = userRes.data;

      const children = userRes.data.children || [];
      if (children.length === 0) {
        hasChildren.value = false;
        return;
      }

      hasChildren.value = true;
      const firstChild = children[0];
      const childId = firstChild._id;

      childInfo.value = {
        name: firstChild.name || "孩子",
        grade: firstChild.grade || "未设置",
        school: firstChild.school || "学校",
        class: firstChild.class || "未设置",
      };

      const res = await childApi.getChildNutrition(childId);
      if (res.code === 200) {
        childInfo.value.class = res.data?.childInfo?.class || firstChild.class || "未设置";

        const intake = res.data.intake || {};
        const target = res.data.target || {};

        childStatus.value.nutritionScore = target.calories ? Math.round((intake.calories / target.calories) * 100) : 0;

        const meals = res.data.meals || [];
        const mealTypes = new Set();
        meals.forEach((meal) => {
          if (meal && meal.mealType && ["breakfast", "lunch", "dinner"].includes(meal.mealType)) {
            mealTypes.add(meal.mealType);
          }
        });
        childStatus.value.mealsCompleted = mealTypes.size;

        // 更新三餐状态
        if (res.data.mealStatus) {
          mealStatus.value = res.data.mealStatus;
        }
      }

      // 加载营养数据
      loadNutrition(childId);
    }
  } catch (error) {
    console.error("获取营养数据失败:", error);
  }
};

const handleGenerateReport = async (reportType) => {
  if (isGenerating.value) return;

  try {
    isGenerating.value = true;
    reportTypeGenerating.value = reportType;

    const children = userInfo.value.children || [];
    if (children.length > 0) {
      const childId = children[0]._id;
      uni.showToast({ title: "报告生成中..." });

      const res = await childApi.generateChildAIReport(childId, { reportType });

      if (res.code === 200) {
        uni.showToast({ title: "生成成功" });
        currentReport.value = res.data;
        reportPopup.value.open();
      } else {
        uni.showToast({ title: res.message || "生成失败", icon: "none" });
      }
    } else {
      uni.showToast({ title: "请先绑定孩子", icon: "none" });
    }
  } catch (error) {
    uni.showToast({ title: "发生错误", icon: "none" });
  } finally {
    isGenerating.value = false;
    reportTypeGenerating.value = "";
  }
};

const closeReportDialog = () => {
  reportPopup.value.close();
};

const goToReportHistory = () => {
  uni.navigateTo({ url: "/pages/parent/report-history/reportHistory" });
};

const goToBindChild = () => {
  uni.navigateTo({ url: "/pages/parent/bind-child/bindChild" });
};

const viewReportHistory = () => {
  closeReportDialog();
  goToReportHistory();
};

const downloadReport = () => {
  if (!currentReport.value) return;

  let text = `报告: ${currentReport.value.childName}\n类型: ${currentReport.value.reportType}\n热量: ${currentReport.value.dataSummary.avgCalories}\n...`;
  uni.setClipboardData({
    data: text,
    success: () => uni.showToast({ title: "已复制到剪贴板" }),
  });
};

onMounted(() => {
  updateTime();
  setInterval(updateTime, 60000);
  fetchChildNutrition();
});
</script>

<style lang="scss" scoped>
.page-container {
  height: 100%;
  padding: 20rpx;
  background-color: #f8fafc;
}

.welcome-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.welcome-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30rpx;
}

.user-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #1f2937;
  display: block;
}

.greeting {
  font-size: 26rpx;
  color: #6b7280;
  margin-top: 4rpx;
  display: block;
}

.role-badge {
  display: flex;
  align-items: center;
  background-color: #eff6ff;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  margin-top: 10rpx;
  width: fit-content;
}

.role-text {
  font-size: 20rpx;
  color: #1e40af;
  margin-left: 6rpx;
}

.datetime-info {
  text-align: right;
}

.date,
.time {
  display: block;
  font-size: 24rpx;
  color: #6b7280;
}

.weather {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 6rpx;
}

.weather-text {
  font-size: 22rpx;
  color: #6b7280;
  margin-left: 4rpx;
}

.child-overview {
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  border-radius: 16rpx;
  padding: 24rpx;
  border: 1rpx solid #d1fae5;
}

.overview-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.overview-title {
  font-size: 26rpx;
  font-weight: 500;
  color: #374151;
  margin-left: 10rpx;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin-bottom: 24rpx;
}

.stats-grid .stat-item {
  margin-right: 20rpx;
}

.stats-grid .stat-item:last-child {
  margin-right: 0;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
}

.text-green {
  color: #10b981;
}
.text-blue {
  color: #3b82f6;
}
.text-purple {
  color: #8b5cf6;
}

.stat-label {
  font-size: 20rpx;
  color: #6b7280;
  margin-top: 4rpx;
}

.meal-status-section {
  margin-top: 30rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid #d1fae5;
}

.meal-status-title {
  font-size: 24rpx;
  font-weight: 600;
  color: #374151;
  margin-bottom: 16rpx;
  display: block;
}

.meal-status-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.meal-status-item {
  background: #ffffff;
  border-radius: 12rpx;
  padding: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 2rpx solid #e5e7eb;
  transition: all 0.3s;

  &.eaten {
    border-color: #10b981;
    background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
  }
}

.meal-icon {
  font-size: 32rpx;
  margin-bottom: 8rpx;
}

.meal-name {
  font-size: 22rpx;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8rpx;
}

.meal-badge {
  font-size: 18rpx;
  padding: 4rpx 12rpx;
  border-radius: 10rpx;
  font-weight: 500;
}

.eaten-badge {
  background: #d1fae5;
  color: #059669;
}

.not-eaten-badge {
  background: #fee2e2;
  color: #dc2626;
}

.meal-items {
  margin-top: 12rpx;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.meal-item {
  font-size: 18rpx;
  color: #6b7280;
  background: #f9fafb;
  padding: 4rpx 8rpx;
  border-radius: 6rpx;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.report-actions {
  display: flex;
  flex-direction: column;
}

.report-actions > * {
  margin-bottom: 16rpx;
}

.report-actions > *:last-child {
  margin-bottom: 0;
}

.action-row {
  display: flex;
}

.action-row > * {
  margin-right: 16rpx;
}

.action-row > *:last-child {
  margin-right: 0;
}

.report-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: #fff;
  border: none;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);

  &.weekly {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  }
  &.monthly {
    background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%);
  }

  &:active {
    opacity: 0.85;
    transform: scale(0.98);
  }

  &[disabled] {
    opacity: 0.6;
  }
}

.report-btn text {
  color: #fff;
  text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.1);
}

.report-btn uni-icons,
.report-btn .loading-icon {
  margin-right: 8rpx;
}

.history-btn {
  width: 100%;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f3f4f6;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: 500;
  color: #374151;
  border: 1rpx solid #e5e7eb;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);

  &:active {
    background-color: #e5e7eb;
  }
}

.history-btn uni-icons {
  margin-right: 8rpx;
}

.no-child-card {
  background: linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%);
  border-radius: 16rpx;
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1rpx solid #fef3c7;
}

.warning-info {
  display: flex;
  align-items: flex-start;
}

.warning-info uni-icons {
  margin-right: 16rpx;
}

.warning-text-group {
  display: flex;
  flex-direction: column;
}

.warning-title {
  font-size: 26rpx;
  font-weight: bold;
  color: #92400e;
}

.warning-sub {
  font-size: 22rpx;
  color: #d97706;
  margin-top: 4rpx;
}

.bind-btn {
  margin: 0;
}

.nutrition-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.title-left {
  display: flex;
  align-items: center;
}

.title-left uni-icons {
  margin-right: 12rpx;
}

.over-badge {
  background: #fef2f2;
  color: #ef4444;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.loading-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 0;
}

.loading-txt {
  font-size: 24rpx;
  color: #94a3b8;
  margin-top: 16rpx;
}

.nut-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
}

.nut-grid .nut-card {
  margin-right: 20rpx;
  margin-bottom: 20rpx;
}

.nut-grid .nut-card:nth-child(2n) {
  margin-right: 0;
}

.nut-card {
  padding: 24rpx;
  border-radius: 20rpx;
  color: #fff;
  position: relative;
}

.nut-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.nut-name {
  font-size: 22rpx;
  opacity: 0.9;
}

.warn-dot {
  width: 60rpx;
  height: 40rpx;
  background: #ef4444;
  border-radius: 15rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18rpx;
  font-weight: bold;
}

.nut-main {
  display: flex;
  align-items: baseline;
  margin-bottom: 8rpx;
}

.nut-main .nut-unit {
  margin-left: 4rpx;
}

.nut-val {
  font-size: 32rpx;
  font-weight: bold;
}

.nut-unit {
  font-size: 18rpx;
  opacity: 0.8;
}

.nut-goal {
  font-size: 18rpx;
  opacity: 0.7;
}

.nut-prog {
  height: 6rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3rpx;
  margin-top: 12rpx;
  overflow: hidden;
}

.nut-prog-inner {
  height: 100%;
  background: #fff;
}

.quick-actions-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.card-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #1f2937;
  display: block;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
}

.actions-grid .action-item {
  margin-right: 20rpx;
  margin-bottom: 20rpx;
}

.actions-grid .action-item:nth-child(2n) {
  margin-right: 0;
}

.action-item {
  border-radius: 20rpx;
  padding: 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  &:active {
    transform: scale(0.98);
  }
}

.action-item uni-icons {
  margin-bottom: 12rpx;
}

.action-label {
  font-size: 26rpx;
  font-weight: 500;
  color: #fff;
}

.report-dialog {
  width: 650rpx;
  background-color: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.dialog-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #1f2937;
}

.dialog-content {
  flex: 1;
  overflow: auto;
}

.nutrition-mini-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  margin-bottom: 30rpx;
}

.nutrition-mini-cards .mini-card {
  margin-right: 10rpx;
}

.nutrition-mini-cards .mini-card:nth-child(4n) {
  margin-right: 0;
}

.mini-card {
  background-color: #f8fafc;
  padding: 16rpx 8rpx;
  border-radius: 12rpx;
  text-align: center;
}

.mini-value {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #3b82f6;
}

.mini-label {
  font-size: 18rpx;
  color: #64748b;
  margin-top: 4rpx;
}

.ai-sections {
  .section {
    margin-bottom: 24rpx;
  }
  .section-title {
    font-size: 28rpx;
    font-weight: bold;
    color: #334155;
    margin-bottom: 12rpx;
    display: block;
    border-left: 6rpx solid #3b82f6;
    padding-left: 16rpx;
  }
  .section-text {
    font-size: 24rpx;
    color: #475569;
    line-height: 1.6;
  }
}

.highlight-list,
.suggestion-list {
  display: flex;
  flex-direction: column;
}

.highlight-list > *,
.suggestion-list > * {
  margin-bottom: 12rpx;
}

.highlight-list > *:last-child,
.suggestion-list > *:last-child {
  margin-bottom: 0;
}

.highlight-item,
.suggestion-item {
  display: flex;
}

.highlight-item .dot,
.suggestion-item .bullet {
  margin-right: 12rpx;
}

.dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background-color: #3b82f6;
  margin-top: 12rpx;
}

.highlight-text,
.suggestion-text {
  flex: 1;
  font-size: 24rpx;
  color: #475569;
}

.bullet {
  color: #3b82f6;
  font-weight: bold;
}

.dialog-footer {
  display: flex;
  margin-top: 30rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f1f5f9;
}

.dialog-footer .footer-btn {
  margin-right: 16rpx;
}

.dialog-footer .footer-btn:last-child {
  margin-right: 0;
}

.footer-btn {
  flex: 1;
  height: 70rpx;
  line-height: 70rpx;
  font-size: 24rpx;
  border-radius: 35rpx;
  background-color: #f1f5f9;
  color: #475569;

  &.primary {
    background-color: #3b82f6;
    color: #fff;
  }

  &::after {
    border: none;
  }
}

.loading-icon {
  width: 16rpx;
  height: 16rpx;
  border: 2rpx solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.spin {
  animation: spin 1s linear infinite;
}

</style>
