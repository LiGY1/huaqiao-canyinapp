<template>
  <view class="dining-type-selector">
    <view 
      v-for="(type, index) in diningTypes" 
      :key="index"
      class="dining-type-item"
      :class="{ active: modelValue === type.value }"
      @click="handleSelect(type.value)"
    >
      <text class="dining-type-icon">{{ type.icon }}</text>
      <text class="dining-type-text">{{ type.label }}</text>
    </view>
  </view>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: 'dine-in'
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

const diningTypes = [
  { label: '堂食', value: 'dine-in', icon: '🍽️' },
  { label: '外卖', value: 'takeout', icon: '🛵' },
  { label: '打包带走', value: 'takeaway', icon: '🥡' }
];

const handleSelect = (value) => {
  emit('update:modelValue', value);
  emit('change', value);
  
  const selectedType = diningTypes.find(t => t.value === value);
  // uni.showToast({
  //   title: `已选择${selectedType.label}`,
  //   icon: 'none',
  //   duration: 1500
  // });
};
</script>

<style scoped>
.dining-type-selector {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.dining-type-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20rpx 10rpx;
  border-radius: 12rpx;
  transition: all 0.3s ease;
  cursor: pointer;
}

.dining-type-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.4);
}

.dining-type-icon {
  font-size: 48rpx;
  margin-bottom: 8rpx;
  transition: transform 0.3s ease;
}

.dining-type-item.active .dining-type-icon {
  transform: scale(1.1);
}

.dining-type-text {
  font-size: 26rpx;
  color: #333333;
  font-weight: 500;
  transition: color 0.3s ease;
}

.dining-type-item.active .dining-type-text {
  color: #ffffff;
  font-weight: 600;
}
</style>
