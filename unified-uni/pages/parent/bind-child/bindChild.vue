<template>
  <layout>
    <view class="page-container">
      <!-- 已绑定学生 -->
      <view class="card">
        <view class="card-header">
          <uni-icons type="person" size="20" color="#10b981"></uni-icons>
          <text class="card-title">已绑定的学生</text>
        </view>

        <view v-if="boundChildren.length === 0" class="empty-state">
          <uni-icons type="person" size="64" color="#e5e7eb"></uni-icons>
          <text class="empty-text">暂未绑定任何学生</text>
          <text class="empty-subtext">请在下方输入学生学号进行绑定</text>
        </view>

        <view v-else class="child-list">
          <view v-for="child in boundChildren" :key="child._id" class="child-item">
            <view class="child-info">
              <text class="child-name">{{ child.name }}</text>
              <view class="child-details">
                <view class="detail-row">
                  <uni-icons type="postcard" size="14" color="#6b7280"></uni-icons>
                  <text class="detail-text">学号：{{ child.studentId }}</text>
                </view>
                <view class="detail-row">
                  <uni-icons type="flag" size="14" color="#6b7280"></uni-icons>
                  <text class="detail-text">{{ child.grade || '未设置' }} · {{ child.class || '未设置' }}</text>
                </view>
              </view>
            </view>
            <button class="unbind-btn" type="warn" size="mini" plain @click="handleUnbind(child._id)">解绑</button>
          </view>
        </view>
      </view>

      <!-- 绑定新学生 -->
      <view class="card mt-4">
        <view class="card-header">
          <uni-icons type="link" size="20" color="#3b82f6"></uni-icons>
          <text class="card-title">绑定新学生</text>
        </view>

        <view class="form-item">
          <text class="label">学生学号</text>
          <view class="input-group">
            <input 
              v-model="form.studentId" 
              placeholder="请输入学生学号" 
              class="input-field"
              @confirm="verifyStudentId"
            />
            <button 
              class="verify-btn" 
              type="primary" 
              size="mini" 
              :loading="verifying"
              @click="verifyStudentId"
            >
              {{ verifying ? '验证中' : '验证学号' }}
            </button>
          </view>
        </view>

        <view v-if="verifiedStudent" class="verified-card">
          <view class="verified-info">
            <uni-icons type="checkbox-filled" size="20" color="#10b981"></uni-icons>
            <view class="verified-text">
              <text class="verified-name">{{ verifiedStudent.name }}</text>
              <text class="verified-sub">{{ verifiedStudent.grade }} · {{ verifiedStudent.class }}</text>
            </view>
          </view>
          <text class="success-tag">验证成功</text>
        </view>

        <view class="action-group mt-6">
          <button 
            class="bind-btn" 
            type="primary" 
            :disabled="!verifiedStudent" 
            :loading="binding"
            @click="handleBind"
          >
            {{ verifiedStudent ? '确认绑定' : '请先验证学号' }}
          </button>
          <button class="reset-btn" @click="resetForm">重置</button>
        </view>

        <view v-if="!verifiedStudent && form.studentId" class="warning-tip mt-4">
          <uni-icons type="info" size="14" color="#f59e0b"></uni-icons>
          <text class="tip-text">请完成学号验证后操作</text>
        </view>
      </view>

      <!-- 绑定说明 -->
      <view class="instruction-card mt-4">
        <text class="instruction-title">绑定流程</text>
        <view class="steps">
          <view class="step-item">
            <text class="step-num">1</text>
            <text class="step-text">在此上方输入框输入学生学号</text>
          </view>
          <view class="step-item">
            <text class="step-num">2</text>
            <text class="step-text">点击"验证学号"按钮进行验证</text>
          </view>
          <view class="step-item">
            <text class="step-num">3</text>
            <text class="step-text">验证成功后，点击"确认绑定"完成绑定</text>
          </view>
        </view>
        <view class="footer-tip mt-4">
          <text class="footer-tip-text">提示：绑定后即可查看孩子的营养信息和用餐记录</text>
        </view>
      </view>
    </view>
  </layout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import layout from '@/components/layout.vue';
import storage from '@/utils/storage';
import { authApi } from '@/api/parent';

const verifying = ref(false);
const binding = ref(false);
const boundChildren = ref([]);
const verifiedStudent = ref(null);

const form = reactive({
  studentId: ''
});

const verifyStudentId = async () => {
  if (!form.studentId) {
    uni.showToast({ title: '请输入学号', icon: 'none' });
    return;
  }

  verifying.value = true;
  try {
    const res = await authApi.verifyStudent(form.studentId);
    if (res.code === 200 && res.data) {
      verifiedStudent.value = res.data;
      uni.showToast({ title: '验证成功' });
    } else {
      verifiedStudent.value = null;
      uni.showToast({ title: '未找到该学生', icon: 'none' });
    }
  } catch (error) {
    verifiedStudent.value = null;
    uni.showToast({ title: '验证失败', icon: 'none' });
  } finally {
    verifying.value = false;
  }
};

const handleBind = async () => {
  if (!verifiedStudent.value) return;

  binding.value = true;
  try {
    const res = await authApi.bindChild({ studentId: form.studentId });
    if (res.code === 200) {
      uni.showToast({ title: '绑定成功' });
      resetForm();
      fetchBoundChildren();
      updateUserInfo();
    } else {
      uni.showToast({ title: res.message || '绑定失败', icon: 'none' });
    }
  } catch (error) {
    uni.showToast({ title: '绑定出错', icon: 'none' });
  } finally {
    binding.value = false;
  }
};

const handleUnbind = (childId) => {
  uni.showModal({
    title: '提示',
    content: '确定要解绑该学生吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          const result = await authApi.unbindChild(childId);
          if (result.code === 200) {
            uni.showToast({ title: '解绑成功' });
            fetchBoundChildren();
            updateUserInfo();
          }
        } catch (e) {
          uni.showToast({ title: '解绑失败', icon: 'none' });
        }
      }
    }
  });
};

const resetForm = () => {
  form.studentId = '';
  verifiedStudent.value = null;
};

const fetchBoundChildren = async () => {
  try {
    const res = await authApi.getUserInfo();
    if (res.code === 200) {
      boundChildren.value = res.data.children || [];
    }
  } catch (e) {}
};

const updateUserInfo = async () => {
  try {
    const res = await authApi.getUserInfo();
    if (res.code === 200) {
      storage.setUserInfo(res.data);
    }
  } catch (e) {}
};

onMounted(() => {
  fetchBoundChildren();
});
</script>

<style lang="scss" scoped>
.page-container {
  padding: 30rpx;
  background-color: #f8fafc;
  min-height: 100vh;
}

.card {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 30rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #1f2937;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #6b7280;
  margin-top: 20rpx;
}

.empty-subtext {
  font-size: 24rpx;
  color: #9ca3af;
  margin-top: 10rpx;
}

.child-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.child-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  background-color: #f8fafc;
  border-radius: 16rpx;
  border: 1rpx solid #e2e8f0;
}

.child-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #1f2937;
  display: block;
}

.child-details {
  margin-top: 8rpx;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 4rpx;
}

.detail-text {
  font-size: 22rpx;
  color: #64748b;
}

.unbind-btn {
  margin: 0;
}

.form-item {
  margin-bottom: 30rpx;
}

.label {
  font-size: 26rpx;
  color: #4b5563;
  margin-bottom: 16rpx;
  display: block;
}

.input-group {
  display: flex;
  gap: 20rpx;
}

.input-field {
  flex: 1;
  height: 80rpx;
  background-color: #f1f5f9;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
}

.verify-btn {
  margin: 0;
  height: 80rpx;
  line-height: 80rpx;
  min-width: 160rpx;
}

.verified-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f0fdf4;
  padding: 24rpx;
  border-radius: 16rpx;
  border: 1rpx solid #dcfce7;
}

.verified-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.verified-text {
  display: flex;
  flex-direction: column;
}

.verified-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #166534;
}

.verified-sub {
  font-size: 22rpx;
  color: #15803d;
}

.success-tag {
  font-size: 20rpx;
  background-color: #22c55e;
  color: #fff;
  padding: 2rpx 12rpx;
  border-radius: 8rpx;
}

.action-group {
  display: flex;
  gap: 20rpx;
}

.bind-btn {
  flex: 2;
  margin: 0;
}

.reset-btn {
  flex: 1;
  margin: 0;
  background-color: #f1f5f9;
  color: #475569;
}

.warning-tip {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.tip-text {
  font-size: 24rpx;
  color: #d97706;
}

.instruction-card {
  padding: 30rpx;
  background-color: #eff6ff;
  border-radius: 20rpx;
  border: 1rpx solid #dbeafe;
}

.instruction-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #1e40af;
  margin-bottom: 20rpx;
  display: block;
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.step-num {
  width: 36rpx;
  height: 36rpx;
  background-color: #3b82f6;
  color: #fff;
  font-size: 22rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-text {
  font-size: 24rpx;
  color: #1e3a8a;
}

.footer-tip {
  border-top: 1rpx solid #bfdbfe;
  padding-top: 20rpx;
}

.footer-tip-text {
  font-size: 22rpx;
  color: #1d4ed8;
}

.mt-4 { margin-top: 30rpx; }
.mt-6 { margin-top: 40rpx; }
</style>
