<template>
  <view class="card filters-card">
    <view class="search-box">
      <uni-icons type="search" size="18" color="#999"></uni-icons>
      <input 
        :value="keyword" 
        @input="onKeywordChange"
        placeholder="搜索学生姓名" 
        class="search-input" 
        @confirm="$emit('search')" 
      />
    </view>

    <view class="filters-row">
      <picker 
        @change="onGradeChange" 
        :value="gradeIndex" 
        :range="gradeOptions" 
        class="filter-picker"
      >
        <view class="picker-value">
          {{ gradeOptions[gradeIndex] }}
          <uni-icons type="bottom" size="12" color="#999"></uni-icons>
        </view>
      </picker>
      <picker
        @change="onStatusChange"
        :value="statusIndex"
        :range="statusOptions"
        range-key="label"
        class="filter-picker"
      >
        <view class="picker-value">
          {{ statusOptions[statusIndex].label }}
          <uni-icons type="bottom" size="12" color="#999"></uni-icons>
        </view>
      </picker>
    </view>

    <view class="actions-row">
      <button class="action-btn report-btn" @click="$emit('generate-report')">
        <uni-icons type="document" size="16" color="#fff"></uni-icons>
        生成分析报告
      </button>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  keyword: String,
  gradeIndex: Number,
  statusIndex: Number,
  gradeOptions: Array,
  statusOptions: Array
})

const emit = defineEmits(['update:keyword', 'update:gradeIndex', 'update:statusIndex', 'search', 'generate-report'])

const onKeywordChange = (e) => {
  emit('update:keyword', e.detail.value)
}

const onGradeChange = (e) => {
  emit('update:gradeIndex', Number(e.detail.value))
  emit('search')
}

const onStatusChange = (e) => {
  emit('update:statusIndex', Number(e.detail.value))
  emit('search')
}
</script>

<style lang="scss" scoped>
.card {
  background: #fff;
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);
  margin-bottom: 24rpx;
}

.search-box {
  background: #f1f4f9;
  height: 80rpx;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  margin-bottom: 20rpx;

  .search-input {
    flex: 1;
    margin-left: 10rpx;
    font-size: 28rpx;
  }
}

.filters-row {
  display: flex;
  gap: 20rpx;
  margin-bottom: 24rpx;

  .filter-picker {
    flex: 1;
    background: #fff;
    border: 2rpx solid #edf1f7;
    height: 72rpx;
    border-radius: 12rpx;
    padding: 0 20rpx;
    display: flex;
    align-items: center;

    .picker-value {
      width: 100%;
      font-size: 26rpx;
      color: #333;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
}

.actions-row {
  display: flex;
  gap: 20rpx;

  .action-btn {
    height: 80rpx;
    line-height: 80rpx;
    border-radius: 40rpx;
    font-size: 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    border: none;
    &::after {
      border: none;
    }
  }

  .report-btn {
    flex: 2;
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: #fff;
  }
}
</style>
