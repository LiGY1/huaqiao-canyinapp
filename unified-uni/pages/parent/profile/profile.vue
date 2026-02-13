<template>
  <layout>
    <view class="page-container">
      <!-- 家长信息 -->
      <view class="profile-card">
        <view class="profile-header">
          <view class="name-box">
            <text class="user-name">{{ userInfo.name || "家长姓名" }}</text>
            <text class="user-role">家长身份 · 家庭监护人</text>
          </view>
          <button class="edit-btn" size="mini" @click="showEditProfile">编辑资料</button>
        </view>

        <view class="info-grid">
          <view class="info-item">
            <uni-icons type="person" size="16" color="#3b82f6"></uni-icons>
            <text class="info-txt">监护孩子: {{ childInfo.name }}</text>
          </view>
          <view class="info-item">
            <uni-icons type="phone" size="16" color="#10b981"></uni-icons>
            <text class="info-txt">{{ userInfo.phone || "未设置手机号" }}</text>
          </view>
        </view>
      </view>

      <!-- 孩子档案 -->
      <view v-if="hasChildren" class="section-card mt-4">
        <view class="section-header">
          <text class="section-title">孩子档案</text>
          <button class="edit-btn" size="mini" @click="showEditChild">编辑档案</button>
        </view>

        <view class="archive-grid">
          <!-- 基本信息 -->
          <view class="archive-group">
            <view class="group-title">
              <uni-icons type="info" size="16" color="#3b82f6"></uni-icons>
              <text class="title-txt">基本信息</text>
            </view>
            <view class="base-info-row">
              <view class="base-item">
                <text class="label">姓名</text>
                <text class="val">{{ childInfo.name }}</text>
              </view>
              <view class="base-item">
                <text class="label">性别</text>
                <text class="val">{{ childInfo.gender || "男" }}</text>
              </view>
              <view class="base-item">
                <text class="label">出生</text>
                <text class="val">{{ formatDate(childInfo.birthDate) || "2014-01-01" }}</text>
              </view>
              <view class="base-item">
                <text class="label">班级</text>
                <text class="val">{{ childInfo.grade }} · {{ childInfo.class }}</text>
              </view>
            </view>
          </view>

          <!-- 身体数据 -->
          <view class="archive-group mt-3">
            <view class="group-title">
              <uni-icons type="staff" size="16" color="#10b981"></uni-icons>
              <text class="title-txt">身体数据</text>
            </view>
            <view class="body-stats">
              <view class="stat-pill bg-blue-light">
                <text class="pill-l">身高</text>
                <text class="pill-v">{{ formatNumber(childInfo.height || 145) }}cm</text>
              </view>
              <view class="stat-pill bg-green-light">
                <text class="pill-l">体重</text>
                <text class="pill-v">{{ formatNumber(childInfo.weight || 35) }}kg</text>
              </view>
              <view class="stat-pill bg-purple-light">
                <text class="pill-l">BMI</text>
                <text class="pill-v">{{ calculateBMI() }}</text>
              </view>
              <view class="stat-pill bg-amber-light">
                <text class="pill-l">健康</text>
                <text class="pill-v">{{ childInfo.healthStatus || "良好" }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 今日营养摄入 -->
        <view class="nutrition-section mt-4">
          <view class="group-title justify-between">
            <view class="title-left">
              <uni-icons type="fire" size="16" color="#ef4444"></uni-icons>
              <text class="title-txt">今日营养摄入</text>
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
      </view>

      <!-- 未绑定学生 -->
      <view v-if="!hasChildren" class="empty-card mt-4">
        <uni-icons type="link" size="64" color="#cbd5e1"></uni-icons>
        <text class="empty-title">您还未绑定学生</text>
        <text class="empty-desc">请先绑定学生后查看孩子档案</text>
        <button class="bind-btn" type="primary" @click="goToBind">立即绑定学生</button>
      </view>

      <!-- 提醒设置 -->
      <view v-if="hasChildren" class="section-card mt-4">
        <view class="section-header">
          <text class="section-title">健康提醒设置</text>
        </view>

        <view class="reminders-grid">
          <view class="rem-group bg-amber-50">
            <view class="group-title">
              <uni-icons type="notification" size="16" color="#f59e0b"></uni-icons>
              <text class="title-txt">用餐提醒</text>
            </view>
            <view class="rem-list">
              <view class="rem-item">
                <text class="rem-l">早餐提醒</text>
                <switch :checked="reminders.breakfast" @change="(e) => toggleReminder('breakfast', e)" scale-7 />
              </view>
              <view class="rem-item">
                <text class="rem-l">午餐提醒</text>
                <switch :checked="reminders.lunch" @change="(e) => toggleReminder('lunch', e)" scale-7 />
              </view>
              <view class="rem-item">
                <text class="rem-l">晚餐提醒</text>
                <switch :checked="reminders.dinner" @change="(e) => toggleReminder('dinner', e)" scale-7 />
              </view>
            </view>
          </view>

          <view class="rem-group bg-purple-50">
            <view class="group-title">
              <uni-icons type="calendar" size="16" color="#8b5cf6"></uni-icons>
              <text class="title-txt">营养提醒</text>
            </view>
            <view class="rem-list">
              <view class="rem-item">
                <text class="rem-l">每日总结</text>
                <switch :checked="reminders.dailySummary" @change="(e) => toggleReminder('dailySummary', e)" scale-7 />
              </view>
              <view class="rem-item">
                <text class="rem-l">不足提醒</text>
                <switch
                  :checked="reminders.nutritionAlert"
                  @change="(e) => toggleReminder('nutritionAlert', e)"
                  scale-7
                />
              </view>
              <view class="rem-item">
                <text class="rem-l">健康贴士</text>
                <switch :checked="reminders.healthTips" @change="(e) => toggleReminder('healthTips', e)" scale-7 />
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 账户操作 -->
      <view class="white-card mt-4 mb-10 p-6">
        <text class="section-title mb-4 block">账户操作</text>
        <button class="logout-btn" type="warn" plain @click="handleLogout">退出登录</button>
      </view>

      <!-- 编辑弹窗 (UniApp popups) -->
      <uni-popup ref="editProfilePopup" type="center">
        <view class="modal-content">
          <text class="modal-title">编辑家长资料</text>
          <view class="form-item">
            <text class="form-label">姓名</text>
            <input class="form-input" v-model="userInfo.name" placeholder="请输入姓名" />
          </view>
          <view class="form-item">
            <text class="form-label">手机号</text>
            <input class="form-input" v-model="userInfo.phone" placeholder="请输入手机号" />
          </view>
          <view class="modal-footer">
            <button class="cancel-btn" @click="closeEditProfile">取消</button>
            <button class="confirm-btn" type="primary" @click="saveProfile">保存</button>
          </view>
        </view>
      </uni-popup>

      <uni-popup ref="editChildPopup" type="center">
        <view class="modal-content wide">
          <text class="modal-title">编辑孩子档案</text>
          <scroll-view scroll-y class="form-scroll">
            <view class="grid-form">
              <view class="form-item">
                <text class="form-label">姓名</text>
                <input class="form-input" v-model="childInfo.name" />
              </view>
              <view class="form-item">
                <text class="form-label">性别</text>
                <picker @change="onGenderChange" :value="childInfo.gender === '女' ? 1 : 0" :range="['男', '女']">
                  <view class="picker-box">{{ childInfo.gender || "男" }}</view>
                </picker>
              </view>
              <view class="form-item">
                <text class="form-label">出生日期</text>
                <picker mode="date" @change="onBirthChange" :value="childInfo.birthDate">
                  <view class="picker-box">{{ childInfo.birthDate || "2014-01-01" }}</view>
                </picker>
              </view>
              <view class="form-item">
                <text class="form-label">年级</text>
                <input class="form-input" v-model="childInfo.grade" />
              </view>
              <view class="form-item mitad">
                <text class="form-label">身高(cm)</text>
                <input class="form-input" type="digit" v-model="childInfo.height" />
              </view>
              <view class="form-item mitad">
                <text class="form-label">体重(kg)</text>
                <input class="form-input" type="digit" v-model="childInfo.weight" />
              </view>
            </view>
          </scroll-view>
          <view class="modal-footer">
            <button class="cancel-btn" @click="closeEditChild">取消</button>
            <button class="confirm-btn" type="primary" @click="saveChild">保存</button>
          </view>
        </view>
      </uni-popup>
    </view>
  </layout>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import layout from "@/components/layout.vue";
import { authApi, childApi, nutritionApi } from "@/api/parent";
import storage from "@/utils/storage";

const userInfo = ref({ name: "", phone: "", avatar: "", email: "" });
const childInfo = ref({
  name: "",
  gender: "",
  birthDate: "",
  grade: "",
  class: "",
  school: "",
  height: 0,
  weight: 0,
  healthStatus: "",
});
const hasChildren = ref(false);
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

const reminders = ref({
  breakfast: true,
  lunch: true,
  dinner: true,
  dailySummary: true,
  nutritionAlert: false,
  healthTips: true,
});

const editProfilePopup = ref(null);
const editChildPopup = ref(null);

const formatNumber = (val, d = 1) => parseFloat(val || 0).toFixed(d);
const formatDate = (s) => (s ? new Date(s).toLocaleDateString() : "");
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const getPercentage = (c, t) => (t ? Math.round((c / t) * 100) : 0);
const isOverIntake = (k) => nutritionData.value[k] > nutritionData.value[`target${capitalize(k)}`];
const hasOverIntake = computed(() => nutrientList.some((n) => isOverIntake(n.key)));
const overIntakeCount = computed(() => nutrientList.filter((n) => isOverIntake(n.key)).length);

const calculateBMI = () => {
  const h = childInfo.value.height / 100;
  const w = childInfo.value.weight;
  return h > 0 ? (w / (h * h)).toFixed(1) : "0.0";
};

const loadData = async () => {
  try {
    const res = await authApi.getUserInfo();
    if (res.code === 200 && res.data) {
      userInfo.value = {
        name: res.data.name || "",
        phone: res.data.phone || "",
        avatar: res.data.avatar || "",
        email: res.data.email || "",
      };
      const children = res.data.children || [];
      if (children.length > 0) {
        hasChildren.value = true;
        const c = children[0];
        childInfo.value = { ...c, healthStatus: "良好" };
        loadNutrition(c._id);
      }
    }
  } catch (e) {}
};

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

const showEditProfile = () => editProfilePopup.value.open();
const closeEditProfile = () => editProfilePopup.value.close();
const saveProfile = () => {
  uni.showToast({ title: "保存成功" });
  closeEditProfile();
};

const showEditChild = () => editChildPopup.value.open();
const closeEditChild = () => editChildPopup.value.close();
const saveChild = () => {
  uni.showToast({ title: "保存成功" });
  closeEditChild();
};

const onGenderChange = (e) => {
  childInfo.value.gender = e.detail.value === 1 ? "女" : "男";
};

const onBirthChange = (e) => {
  childInfo.value.birthDate = e.detail.value;
};

const toggleReminder = async (key, e) => {
  reminders.value[key] = e.detail.value;
  try {
    await authApi.saveReminderSettings(reminders.value);
  } catch (err) {}
};

const goToBind = () => uni.navigateTo({ url: "/pages/parent/bind-child/bindChild" });

const handleLogout = () => {
  uni.showModal({
    title: "退出登录",
    content: "确定要退出登录吗？",
    success: (res) => {
      if (res.confirm) {
        storage.removeToken();
        storage.removeUserInfo();
        uni.reLaunch({ url: "/pages/login/login" });
      }
    },
  });
};

onMounted(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
.page-container {
  padding: 30rpx;
  background-color: #f8fafc;
  height: 100%;
  overflow: auto;
}

.profile-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30rpx;
}

.user-name {
  font-size: 40rpx;
  font-weight: bold;
  color: #1e293b;
  display: block;
}

.user-role {
  font-size: 24rpx;
  color: #64748b;
  margin-top: 8rpx;
  display: block;
}

.edit-btn {
  background: #eff6ff;
  color: #3b82f6;
  border: none;
  border-radius: 12rpx;
  padding: 10rpx 24rpx;
  font-size: 24rpx;
  &::after {
    border: none;
  }
}

.info-grid {
  display: flex;
  gap: 30rpx;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.info-txt {
  font-size: 24rpx;
  color: #64748b;
}

.section-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #1e293b;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.title-txt {
  font-size: 28rpx;
  font-weight: bold;
  color: #475569;
}

.base-info-row {
  display: flex;
  justify-content: space-between;
  background: #f8fafc;
  padding: 24rpx;
  border-radius: 16rpx;
}

.base-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.label {
  font-size: 20rpx;
  color: #94a3b8;
  margin-bottom: 4rpx;
}

.val {
  font-size: 24rpx;
  font-weight: bold;
  color: #1e293b;
}

.body-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
}

.stat-pill {
  padding: 16rpx;
  border-radius: 16rpx;
  text-align: center;
}

.bg-blue-light {
  background: #eff6ff;
  color: #3b82f6;
}
.bg-green-light {
  background: #f0fdf4;
  color: #10b981;
}
.bg-purple-light {
  background: #faf5ff;
  color: #8b5cf6;
}
.bg-amber-light {
  background: #fffbeb;
  color: #f59e0b;
}

.pill-l {
  font-size: 18rpx;
  display: block;
}
.pill-v {
  font-size: 24rpx;
  font-weight: bold;
}

.over-badge {
  background: #fef2f2;
  color: #ef4444;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.nut-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
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
  gap: 4rpx;
  margin-bottom: 8rpx;
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

.reminders-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.rem-group {
  padding: 24rpx;
  border-radius: 20rpx;
}

.bg-amber-50 {
  background: #fffbeb;
}
.bg-purple-50 {
  background: #faf5ff;
}

.rem-list {
  margin-top: 20rpx;
}

.rem-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.rem-l {
  font-size: 24rpx;
  color: #475569;
}

.logout-btn {
  width: 100%;
  border-radius: 20rpx;
}

.empty-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 80rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #475569;
  margin-top: 30rpx;
}
.empty-desc {
  font-size: 26rpx;
  color: #94a3b8;
  margin-top: 10rpx;
  margin-bottom: 40rpx;
}

.modal-content {
  background: #fff;
  width: 80vw;
  border-radius: 32rpx;
  padding: 40rpx;
  &.wide {
    width: 90vw;
  }
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  text-align: center;
  margin-bottom: 40rpx;
  display: block;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  font-size: 26rpx;
  color: #64748b;
  margin-bottom: 12rpx;
  display: block;
}

.form-input {
  background: #f1f5f9;
  height: 80rpx;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
}

.picker-box {
  background: #f1f5f9;
  height: 80rpx;
  border-radius: 12rpx;
  padding: 0 24rpx;
  line-height: 80rpx;
  font-size: 28rpx;
}

.modal-footer {
  display: flex;
  gap: 20rpx;
  margin-top: 40rpx;
}

.cancel-btn,
.confirm-btn {
  flex: 1;
}

.mt-4 {
  margin-top: 30rpx;
}
.mt-3 {
  margin-top: 24rpx;
}
.mb-10 {
  margin-bottom: 100rpx;
}
.spin {
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
