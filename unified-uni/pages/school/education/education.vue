<template>
  <layout>
    <view class="education-page">
      <view class="tab-header">
        <view 
          v-for="(tab, index) in tabs" 
          :key="index"
          class="tab-item"
          :class="{ active: activeIndex === index }"
          @click="activeIndex = index"
        >
          <text>{{ tab.label }}</text>
          <view class="active-bar" v-if="activeIndex === index"></view>
        </view>
      </view>

      <view class="panel-content">
        <CoursesPanel v-if="activeIndex === 0" />
        <NotificationsPanel v-else-if="activeIndex === 1" />
        <MaterialsPanel v-else-if="activeIndex === 2" />
      </view>
    </view>
  </layout>
</template>

<script setup>
import { ref } from 'vue';
import layout from '@/components/layout.vue';
import CoursesPanel from './components/coursesPanel.vue';
import NotificationsPanel from './components/notificationsPanel.vue';
import MaterialsPanel from './components/materialsPanel.vue';

const tabs = [
  { label: '营养课程', name: 'courses' },
  { label: '班会推送', name: 'notifications' },
  { label: '教育材料', name: 'materials' }
];

const activeIndex = ref(0);
</script>

<style lang="scss" scoped>
.education-page {
  min-height: calc(100vh - 120rpx);
  background-color: #f8f9fa;
  display: flex;
  flex-direction: column;
}

.tab-header {
  display: flex;
  background-color: #fff;
  padding: 0 40rpx;
  border-bottom: 1rpx solid #eee;
  position: sticky;
  top: 0;
  z-index: 10;

  .tab-item {
    flex: 1;
    height: 90rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    font-size: 28rpx;
    color: #666;
    transition: all 0.3s;

    &.active {
      color: #4facfe;
      font-weight: bold;
    }

    .active-bar {
      position: absolute;
      bottom: 0;
      width: 40rpx;
      height: 6rpx;
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      border-radius: 3rpx;
    }
  }
}

.panel-content {
  flex: 1;
  padding: 20rpx;
}
</style>
