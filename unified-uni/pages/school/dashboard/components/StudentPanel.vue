<template>
  <view class="panel student-panel">
    <view class="panel-header">
      <uni-icons type="person" size="18" color="#4facfe"></uni-icons>
      <text class="panel-title">学生每周营养数据</text>
    </view>

    <view class="student-selector">
      <scroll-view scroll-x class="student-scroll">
        <view class="student-list">
          <view
            v-for="student in studentList"
            :key="student.id"
            class="student-card"
            :class="{ active: selectedStudentId === student.id }"
            @click="$emit('select-student', student.id)"
          >
            <text class="student-name">{{ student.name }}</text>
            <text class="student-id">{{ student.studentId }}</text>
          </view>
        </view>
      </scroll-view>
    </view>
    <view class="week-nav" v-if="selectedStudentId">
      <view class="nav-btn" @click="$emit('change-week', -1)">
        <uni-icons type="left" size="16" color="#666"></uni-icons>
      </view>
      <text class="week-range">{{ weekDateRange }}</text>
      <view class="nav-btn" @click="$emit('change-week', 1)">
        <uni-icons type="right" size="16" color="#666"></uni-icons>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  studentList: { type: Array, default: () => [] },
  selectedStudentId: { type: [String, Number], default: null },
  weekDateRange: { type: String, default: "" },
});
</script>

<style scoped>
.panel {
  background: #fff;
  border-top-left-radius: 20rpx;
  border-top-right-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}
.panel-header {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
  gap: 12rpx;
}
.panel-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}
.student-selector {
  margin-bottom: 30rpx;
}
.student-scroll {
  white-space: nowrap;
}
.student-list {
  display: inline-flex;
  gap: 20rpx;
}
.student-card {
  background: #f8fafc;
  padding: 20rpx 30rpx;
  border-radius: 12rpx;
  border: 2rpx solid transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.student-card.active {
  background: #eff6ff;
  border-color: #3b82f6;
}
.student-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #1e293b;
}
.student-id {
  font-size: 22rpx;
  color: #64748b;
}
.week-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40rpx;
  margin-bottom: 30rpx;
}
.week-range {
  font-size: 24rpx;
  color: #666;
}
</style>
