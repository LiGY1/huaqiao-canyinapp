<template>
  <view class="panel student-panel">
    <view class="panel-header">
      <uni-icons type="person" size="18" color="#4facfe"></uni-icons>
      <text class="panel-title">学生每周营养数据</text>
    </view>

    <view class="student-selector">
      <view class="selector-wrapper" @click="toggleDropdown">
        <view class="selected-student">
          <view class="student-avatar-small">
            <uni-icons type="person-filled" size="16" color="#3b82f6"></uni-icons>
          </view>
          <view class="selected-info">
            <text class="selected-name">{{ selectedStudentName }}</text>
            <text class="selected-id">{{ selectedStudentIdText }}</text>
          </view>
        </view>
        <uni-icons :type="dropdownVisible ? 'up' : 'down'" size="14" color="#94a3b8"></uni-icons>
      </view>

      <view v-if="dropdownVisible" class="dropdown-panel">
        <view class="search-box">
          <uni-icons type="search" size="14" color="#94a3b8"></uni-icons>
          <input 
            class="search-input" 
            v-model="searchKeyword" 
            placeholder="搜索学生姓名或学号"
            @input="handleSearch"
          />
          <view v-if="searchKeyword" class="clear-btn" @click.stop="clearSearch">
            <uni-icons type="clear" size="12" color="#94a3b8"></uni-icons>
          </view>
        </view>

        <scroll-view scroll-y class="student-list-scroll">
          <view 
            v-for="student in filteredStudents" 
            :key="student.id"
            class="student-item"
            :class="{ active: selectedStudentId === student.id }"
            @click.stop="selectStudent(student)"
          >
            <view class="student-avatar-small">
              <uni-icons type="person-filled" size="16" :color="selectedStudentId === student.id ? '#3b82f6' : '#94a3b8'"></uni-icons>
            </view>
            <view class="student-item-info">
              <text class="student-item-name">{{ student.name }}</text>
              <text class="student-item-id">{{ student.studentId }}</text>
            </view>
            <view v-if="selectedStudentId === student.id" class="check-mark">
              <uni-icons type="checkmarkempty" size="14" color="#3b82f6"></uni-icons>
            </view>
          </view>
          <view v-if="filteredStudents.length === 0" class="empty-result">
            <text class="empty-text">未找到匹配的学生</text>
          </view>
        </scroll-view>
      </view>
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
import { ref, computed } from 'vue';

const props = defineProps({
  studentList: { type: Array, default: () => [] },
  selectedStudentId: { type: [String, Number], default: null },
  weekDateRange: { type: String, default: "" },
});

const emit = defineEmits(['select-student', 'change-week']);

const dropdownVisible = ref(false);
const searchKeyword = ref('');

const selectedStudent = computed(() => {
  return props.studentList.find(s => s.id === props.selectedStudentId);
});

const selectedStudentName = computed(() => {
  return selectedStudent.value?.name || '请选择学生';
});

const selectedStudentIdText = computed(() => {
  return selectedStudent.value?.studentId || '';
});

const filteredStudents = computed(() => {
  if (!searchKeyword.value.trim()) {
    return props.studentList;
  }
  const keyword = searchKeyword.value.toLowerCase();
  return props.studentList.filter(student => 
    student.name.toLowerCase().includes(keyword) || 
    student.studentId.toLowerCase().includes(keyword)
  );
});

const toggleDropdown = () => {
  dropdownVisible.value = !dropdownVisible.value;
  if (!dropdownVisible.value) {
    searchKeyword.value = '';
  }
};

const selectStudent = (student) => {
  emit('select-student', student.id);
  dropdownVisible.value = false;
  searchKeyword.value = '';
};

const handleSearch = () => {
  // 搜索逻辑已在 computed 中处理
};

const clearSearch = () => {
  searchKeyword.value = '';
};
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
  position: relative;
}
.selector-wrapper {
  background: #f8fafc;
  border: 2rpx solid #e2e8f0;
  border-radius: 16rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}
.selected-student {
  display: flex;
  align-items: center;
  gap: 20rpx;
  flex: 1;
}
.student-avatar-small {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #e0f2fe;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.selected-info {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}
.selected-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #1e293b;
}
.selected-id {
  font-size: 22rpx;
  color: #64748b;
}
.dropdown-panel {
  position: absolute;
  top: 110rpx;
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
  z-index: 100;
  overflow: hidden;
}
.search-box {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 24rpx;
  border-bottom: 1rpx solid #e2e8f0;
  background: #f8fafc;
}
.search-input {
  flex: 1;
  font-size: 26rpx;
  color: #1e293b;
  background: transparent;
}
.clear-btn {
  width: 32rpx;
  height: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e2e8f0;
  border-radius: 50%;
}
.student-list-scroll {
  max-height: 500rpx;
}
.student-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx;
  border-bottom: 1rpx solid #f1f5f9;
  position: relative;
}
.student-item:last-child {
  border-bottom: none;
}
.student-item.active {
  background: #eff6ff;
}
.student-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}
.student-item-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #1e293b;
}
.student-item-id {
  font-size: 22rpx;
  color: #64748b;
}
.check-mark {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  background: #dbeafe;
  display: flex;
  align-items: center;
  justify-content: center;
}
.empty-result {
  padding: 60rpx 24rpx;
  text-align: center;
}
.empty-text {
  font-size: 26rpx;
  color: #94a3b8;
}
.week-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40rpx;
  margin-top: 30rpx;
  padding-top: 30rpx;
  border-top: 1rpx solid #e2e8f0;
}
.nav-btn {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1rpx solid #e2e8f0;
}
.week-range {
  font-size: 26rpx;
  color: #475569;
  font-weight: 500;
}
</style>
