<template>
  <view class="student-list" v-if="!loading">
    <!-- 1. 使用v-for循环渲染学生卡片 -->
    <!-- 2. 为每个卡片传递stu对象 -->
    <!-- 3. 绑定key值 -->
    <StudentCard
      v-for="stu in props.students"
      :student="stu"
      :key="stu.id"
      @detail="$emit('detail', stu)"
      @compare="$emit('compare', stu)"
    />

    <view v-if="students.length === 0" class="empty-state">
      <uni-icons type="info" size="48" color="#ccc"></uni-icons>
      <text>暂无相关健康数据</text>
    </view>
  </view>

  <view v-else class="loading-state">
    <uni-icons type="spinner-cycle" size="32" color="#4facfe" class="spin"></uni-icons>
    <text>加载中...</text>
  </view>
</template>

<script setup>
import StudentCard from "./StudentCard.vue";

const props = defineProps({
  // 1. 已定义好接收参数
  students: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["detail", "compare"]);
</script>

<style lang="scss" scoped>
.student-list {
  min-height: 200rpx;
}

.loading-state,
.empty-state {
  height: 400rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  text {
    color: #94a3b8;
    font-size: 28rpx;
  }
}

.spin {
  animation: rotate 2s linear infinite;
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
