<template>
  <view class="student-selector">
    <view class="selector-header">
      <text class="label">选择学生进行针对性咨询 (可多选)</text>
      <text class="count" v-if="selectedCount > 0">已选 {{ selectedCount }} 人</text>
    </view>
    
    <scroll-view scroll-x class="selected-scroll" v-if="selectedList.length > 0">
      <view class="selected-tags">
        <view v-for="name in selectedList" :key="name" class="tag" @click="removeStudent(name)">
          {{ name }} <uni-icons type="closeempty" size="12" color="#4facfe"></uni-icons>
        </view>
      </view>
    </scroll-view>

    <view class="dropdown-trigger" @click="showPicker = true">
      <uni-icons type="staff" size="18" color="#4facfe"></uni-icons>
      <text class="placeholder">{{ selectedList.length > 0 ? '添加学生...' : '请选择学生...' }}</text>
      <uni-icons type="bottom" size="14" color="#999"></uni-icons>
    </view>

    <!-- 学生选择列表弹窗 -->
    <uni-popup ref="pickerPopup" type="bottom" background-color="#fff">
      <view class="picker-content">
        <view class="picker-header">
          <text class="picker-title">选择学生</text>
          <text class="confirm" @click="closePicker">确定</text>
        </view>
        <view class="search-bar">
          <uni-icons type="search" size="16" color="#999"></uni-icons>
          <input v-model="searchKey" placeholder="搜索学生..." class="search-input" />
        </view>
        <scroll-view scroll-y class="student-list">
          <view 
            v-for="student in filteredStudents" 
            :key="student.id" 
            class="student-item"
            :class="{ active: isSelected(student.name) }"
            @click="toggleStudent(student.name)"
          >
            <view class="info">
              <text class="sn">{{ student.name }}</text>
              <text class="sc">{{ student.class || '未分配班级' }}</text>
            </view>
            <uni-icons v-if="isSelected(student.name)" type="checkmarkempty" size="20" color="#4facfe"></uni-icons>
          </view>
          <view v-if="filteredStudents.length === 0" class="empty">暂无相关学生</view>
        </scroll-view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  students: {
    type: Array,
    default: () => []
  },
  modelValue: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:modelValue']);

const pickerPopup = ref(null);
const showPicker = ref(false);
const searchKey = ref('');

const selectedList = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const selectedCount = computed(() => selectedList.value.length);

const filteredStudents = computed(() => {
  if (!searchKey.value) return props.students;
  return props.students.filter(s => s.name.includes(searchKey.value) || (s.class && s.class.includes(searchKey.value)));
});

const isSelected = (name) => selectedList.value.includes(name);

const toggleStudent = (name) => {
  const index = selectedList.value.indexOf(name);
  if (index > -1) {
    selectedList.value.splice(index, 1);
  } else {
    selectedList.value.push(name);
  }
};

const removeStudent = (name) => {
  const index = selectedList.value.indexOf(name);
  if (index > -1) {
    selectedList.value.splice(index, 1);
  }
};

const closePicker = () => {
  pickerPopup.value.close();
};

watch(showPicker, (val) => {
  if (val) {
    pickerPopup.value.open();
    showPicker.value = false;
  }
});
</script>

<style lang="scss" scoped>
.student-selector {
  padding: 20rpx;
  background-color: #f8fafc;
  border-bottom: 1rpx solid #edf2f7;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;
  .label { font-size: 24rpx; color: #64748b; }
  .count { font-size: 24rpx; color: #4facfe; font-weight: bold; }
}

.selected-scroll {
  white-space: nowrap;
  margin-bottom: 16rpx;
}

.selected-tags {
  display: flex;
  gap: 12rpx;
  .tag {
    background: #e0f2fe;
    color: #0369a1;
    font-size: 22rpx;
    padding: 6rpx 16rpx;
    border-radius: 30rpx;
    display: flex;
    align-items: center;
    gap: 6rpx;
  }
}

.dropdown-trigger {
  background: #fff;
  height: 72rpx;
  border-radius: 36rpx;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  border: 1rpx solid #e2e8f0;
  .placeholder { flex: 1; margin-left: 12rpx; font-size: 26rpx; color: #94a3b8; }
}

.picker-content {
  height: 70vh;
  display: flex;
  flex-direction: column;
}

.picker-header {
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1rpx solid #f1f5f9;
  .picker-title { font-size: 32rpx; font-weight: bold; }
  .confirm { color: #4facfe; font-size: 28rpx; font-weight: 500; }
}

.search-bar {
  padding: 20rpx 30rpx;
  background: #f8fafc;
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin: 20rpx;
  border-radius: 12rpx;
  .search-input { flex: 1; font-size: 28rpx; }
}

.student-list {
  flex: 1;
  padding: 0 30rpx;
}

.student-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f1f5f9;
  &.active { .sn { color: #4facfe; } }
  .info {
    display: flex;
    flex-direction: column;
    .sn { font-size: 30rpx; font-weight: 500; color: #1e293b; }
    .sc { font-size: 24rpx; color: #94a3b8; margin-top: 4rpx; }
  }
}

.empty {
  padding: 100rpx 0;
  text-align: center;
  color: #94a3b8;
  font-size: 28rpx;
}
</style>
