<template>
  <view class="courses-panel">
    <view class="action-bar" v-if="!isTeacher">
      <button class="add-btn" @click="showAddDialog">
        <uni-icons type="plus" size="18" color="#fff"></uni-icons>
        <text>创建营养课程</text>
      </button>
    </view>

    <view v-if="isTeacher" class="info-alert">
      <uni-icons type="info" size="20" color="#4facfe"></uni-icons>
      <text>这里显示校长推送的营养课程，点击查看详情学习</text>
    </view>

    <view class="courses-list">
      <view v-for="course in courses" :key="course.id" class="course-card">
        <view class="card-header">
          <text class="title">{{ course.title }}</text>
          <text class="status-tag" :class="course.status === '已发布' ? 'published' : 'draft'">
            {{ course.status }}
          </text>
        </view>
        
        <view class="course-body">
          <text class="desc">{{ course.description }}</text>
          <view class="info-grid">
            <view class="info-item">
              <uni-icons type="calendar" size="14" color="#999"></uni-icons>
              <text>{{ course.date }}</text>
            </view>
            <view class="info-item">
              <uni-icons type="staff" size="14" color="#999"></uni-icons>
              <text>{{ course.targetGrade }}</text>
            </view>
            <view class="info-item">
              <uni-icons type="spinner-cycle" size="14" color="#999"></uni-icons>
              <text>{{ course.duration }}分钟</text>
            </view>
          </view>
          
          <view class="stats-row">
            <text>已参与班级: {{ course.participantClasses }}</text>
            <text>完成率: {{ course.completionRate }}%</text>
          </view>
        </view>

        <view class="card-footer">
          <view class="footer-btn" @click="viewCourse(course)">查看详情</view>
          <template v-if="!isTeacher">
            <view v-if="course.status !== '已推送'" class="footer-btn primary" @click="publishCourse(course)">推送</view>
            <text v-else class="status-label">已推送</text>
            <view class="footer-btn warning" @click="editCourse(course)">编辑</view>
            <view class="footer-btn danger" @click="deleteCourse(course)">删除</view>
          </template>
        </view>
      </view>
      
      <view v-if="courses.length === 0" class="empty-state">
        <image src="/static/empty.png" mode="aspectFit" class="empty-img"></image>
        <text>暂无相关课程</text>
      </view>
    </view>

    <!-- 推送弹窗 -->
    <uni-popup ref="pushPopup" type="center">
      <view class="popup-content">
        <view class="popup-title">推送营养课程</view>
        <scroll-view scroll-y class="form-scroll">
          <view class="form-item">
            <text class="label">当前课程</text>
            <text class="value">{{ currentCourse?.title }}</text>
          </view>
          
          <view class="form-item row">
            <text class="label">推送到系统</text>
            <switch :checked="pushForm.pushToSystem" @change="e => pushForm.pushToSystem = e.detail.value" color="#4facfe" />
          </view>

          <view class="form-item row">
            <text class="label">推送到钉钉</text>
            <switch :checked="pushForm.pushToDingtalk" @change="e => pushForm.pushToDingtalk = e.detail.value" color="#4facfe" />
          </view>

          <view class="form-item" v-if="pushForm.pushToDingtalk || pushForm.pushToSystem">
            <text class="label">推送对象</text>
            <uni-data-select
              v-model="pushForm.targetGrade"
              :localdata="gradeOptions"
            ></uni-data-select>
          </view>
        </scroll-view>
        <view class="popup-footer">
          <button class="cancel" @click="closePushPopup">取消</button>
          <button class="confirm" @click="confirmPush">确认推送</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { educationApi } from '@/api/school/education';
import storage from '@/utils/storage';

const isTeacher = ref(true); // 实际应从store获取
const courses = ref([]);
const loading = ref(false);
const pushPopup = ref(null);
const currentCourse = ref(null);

const pushForm = ref({
  pushToSystem: true,
  pushToDingtalk: true,
  targetGrade: '全校'
});

const gradeOptions = [
  { value: '全校', text: '所有班主任' },
  { value: '2025级', text: '2025级班主任' }
];

const loadCourses = async () => {
  try {
    loading.value = true;
    const res = await educationApi.getMaterials({ type: 'course' });
    if (res.code === 200 || res.success) {
      const data = res.data?.list || res.data || [];
      courses.value = data.map(item => ({
        id: item._id || item.id,
        title: item.title,
        description: item.description || item.content,
        date: new Date(item.createdAt).toLocaleDateString(),
        targetGrade: item.targetGrades?.[0] || '全校',
        duration: item.duration || 45,
        participantClasses: item.readCount || 0,
        completionRate: item.completionRate || 0,
        status: item.isPublished ? '已推送' : '草稿'
      }));
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const viewCourse = (course) => {
  uni.showToast({ title: '详情开发中', icon: 'none' });
};

const publishCourse = (course) => {
  currentCourse.value = course;
  pushPopup.value.open();
};

const closePushPopup = () => {
  pushPopup.value.close();
};

const confirmPush = async () => {
  uni.showToast({ title: '推送已发送', icon: 'success' });
  closePushPopup();
};

const editCourse = (course) => {
  uni.showToast({ title: '编辑开发中', icon: 'none' });
};

const deleteCourse = (course) => {
  uni.showModal({
    title: '提示',
    content: '确定要删除该课程吗？',
    success: (res) => {
      if (res.confirm) {
        uni.showToast({ title: '已删除' });
      }
    }
  });
};

onMounted(() => {
  const userInfo = storage.getUserInfo();
  isTeacher.value = userInfo?.role === 'teacher';
  loadCourses();
});
</script>

<style lang="scss" scoped>
.courses-panel {
  padding: 10rpx 0;
}

.action-bar {
  margin-bottom: 20rpx;
  .add-btn {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: #fff;
    border-radius: 40rpx;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    font-size: 28rpx;
    &::after { border: none; }
  }
}

.info-alert {
  background-color: #e6f7ff;
  border: 1rpx solid #91d5ff;
  padding: 24rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 30rpx;
  text { font-size: 24rpx; color: #003a8c; }
}

.course-card {
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.card-header {
  padding: 24rpx 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1rpx solid #f1f5f9;
  .title { font-size: 32rpx; font-weight: bold; color: #1e293b; }
  .status-tag {
    font-size: 22rpx;
    padding: 4rpx 16rpx;
    border-radius: 20rpx;
    &.published { background: #ecfdf5; color: #10b981; }
    &.draft { background: #f1f5f9; color: #64748b; }
  }
}

.course-body {
  padding: 30rpx;
  .desc {
    font-size: 26rpx;
    color: #64748b;
    line-height: 1.6;
    margin-bottom: 24rpx;
    display: block;
  }
}

.info-grid {
  display: flex;
  gap: 30rpx;
  margin-bottom: 24rpx;
  .info-item {
    display: flex;
    align-items: center;
    gap: 8rpx;
    text { font-size: 24rpx; color: #94a3b8; }
  }
}

.stats-row {
  display: flex;
  justify-content: space-between;
  padding-top: 20rpx;
  border-top: 1rpx solid #f1f5f9;
  text { font-size: 24rpx; color: #64748b; }
}

.card-footer {
  padding: 20rpx 30rpx;
  background-color: #f8fafc;
  display: flex;
  justify-content: flex-end;
  gap: 20rpx;
  align-items: center;
  
  .footer-btn {
    font-size: 26rpx;
    color: #4facfe;
    &.primary { color: #10b981; }
    &.warning { color: #f59e0b; }
    &.danger { color: #ef4444; }
  }
  
  .status-label { font-size: 24rpx; color: #10b981; font-weight: 500; }
}

.popup-content {
  width: 650rpx;
  background-color: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
}

.popup-title {
  font-size: 32rpx;
  font-weight: bold;
  text-align: center;
  margin-bottom: 40rpx;
}

.form-item {
  margin-bottom: 30rpx;
  &.row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .label { font-size: 28rpx; color: #475569; margin-bottom: 12rpx; display: block; }
  .value { font-size: 30rpx; color: #1e293b; font-weight: bold; }
}

.popup-footer {
  display: flex;
  gap: 20rpx;
  margin-top: 40rpx;
  button {
    flex: 1;
    height: 80rpx;
    border-radius: 40rpx;
    font-size: 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    &::after { border: none; }
    &.cancel { background: #f1f5f9; color: #64748b; }
    &.confirm { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: #fff; }
  }
}

.empty-state {
  padding: 100rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  color: #94a3b8;
  font-size: 28rpx;
  .empty-img { width: 240rpx; height: 240rpx; opacity: 0.5; }
}
</style>
