<template>
  <view class="student-card" @click="$emit('click', student)">
    <view class="card-header">
      <view class="student-basic">
        <text class="name">{{ student.studentName }}</text>
        <text class="meta">{{ student.grade }} {{ student.class }} · {{ student.gender }}</text>
      </view>
      <view class="status-tag" :class="student.healthStatus">
        {{ getHealthLabel(student.healthStatus) }}
      </view>
    </view>

    <view class="card-metrics">
      <view class="metric">
        <text class="m-label">身高</text>
        <text class="m-value">{{ student.height }}<text class="unit">cm</text></text>
      </view>
      <view class="metric">
        <text class="m-label">体重</text>
        <text class="m-value">{{ student.weight }}<text class="unit">kg</text></text>
      </view>
      <view class="metric">
        <text class="m-label">BMI</text>
        <text class="m-value">{{ student.bmi }}</text>
      </view>
    </view>

    <view class="nutrition-progress">
      <view class="progress-info">
        <text class="p-label">营养评分</text>
        <text class="p-value">{{ student.nutritionScore }}分</text>
      </view>
      <progress
        :percent="student.nutritionScore"
        stroke-width="6"
        :activeColor="getNutritionColor(student.nutritionScore)"
        class="bar"
      />
    </view>

    <view class="card-actions">
      <button class="card-btn secondary" @click.stop="$emit('compare', student)">
        <uni-icons type="pyq" size="14" color="#4facfe"></uni-icons>
        体检对比
      </button>
      <button class="card-btn primary" @click.stop="$emit('detail', student)">查看详情</button>
    </view>
  </view>
</template>

<script setup>
defineProps({
  student: {
    type: Object,
    required: true
  }
})

defineEmits(['click', 'detail', 'compare'])

const getHealthLabel = (status) => {
  const map = { healthy: '健康', attention: '需关注', abnormal: '异常' }
  return map[status] || '未知'
}

const getNutritionColor = (score) => {
  if (score >= 90) return '#10b981'
  if (score >= 60) return '#f59e0b'
  return '#ef4444'
}
</script>

<style lang="scss" scoped>
.student-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24rpx;

    .name {
      font-size: 32rpx;
      font-weight: bold;
      color: #1e293b;
      display: block;
    }
    .meta {
      font-size: 24rpx;
      color: #94a3b8;
    }

    .status-tag {
      padding: 4rpx 20rpx;
      border-radius: 20rpx;
      font-size: 22rpx;
      &.healthy {
        background: #ecfdf5;
        color: #10b981;
      }
      &.attention {
        background: #fffbeb;
        color: #f59e0b;
      }
      &.abnormal {
        background: #fef2f2;
        color: #f56c6c;
      }
    }
  }

  .card-metrics {
    display: flex;
    justify-content: space-around;
    background: #f8fafc;
    border-radius: 16rpx;
    padding: 20rpx;
    margin-bottom: 24rpx;

    .metric {
      display: flex;
      flex-direction: column;
      align-items: center;
      .m-label {
        font-size: 20rpx;
        color: #64748b;
        margin-bottom: 4rpx;
      }
      .m-value {
        font-size: 28rpx;
        font-weight: bold;
        color: #1e293b;
      }
      .unit {
        font-size: 18rpx;
        font-weight: normal;
        margin-left: 2rpx;
      }
    }
  }

  .nutrition-progress {
    margin-bottom: 24rpx;
    .progress-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10rpx;
      .p-label {
        font-size: 24rpx;
        color: #475569;
      }
      .p-value {
        font-size: 24rpx;
        font-weight: 600;
      }
    }
    .bar {
      border-radius: 10rpx;
    }
  }

  .card-actions {
    display: flex;
    gap: 16rpx;
    .card-btn {
      flex: 1;
      height: 64rpx;
      line-height: 64rpx;
      font-size: 24rpx;
      border-radius: 32rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6rpx;
      &::after {
        border: none;
      }
    }
    .secondary {
      background: #f0f7ff;
      color: #4facfe;
    }
    .primary {
      background: #4facfe;
      color: #fff;
    }
  }
}
</style>
