<template>
  <view class="all-meals-container">
    <Loading :show="props.meals.length === 0" />

    <!-- 侧边导航栏 -->
    <scroll-view scroll-y class="category-sidebar">
      <view
        v-for="(cat, index) in categories"
        :key="cat.id"
        class="category-item"
        :class="{ active: currentCategory === cat.id }"
        @click="scrollToCategory(cat.id)"
      >
        <text class="category-name">{{ cat.name }}</text>
      </view>
    </scroll-view>

    <!-- 菜品列表 -->
    <scroll-view scroll-y class="meals-content" :scroll-into-view="scrollIntoId" @scroll="onScroll">
      <!-- 节气信息卡片 -->
      <view v-for="cat in categories" :key="cat.id" :id="'cat-' + cat.id" class="category-section">
        <view class="section-header">
          <text class="section-title">{{ cat.name }}</text>
          <view v-if="cat.id === 'seasonal' && solarTermInfo" class="solar-term-info">
            <view class="solar-term-badge" :style="{ backgroundColor: solarTermInfo.color.secondary }">
              <text class="solar-term-name" :style="{ color: solarTermInfo.color.primary }">
                {{ solarTermInfo.name }}
              </text>
              <text class="solar-term-en">{{ solarTermInfo.enName }}</text>
            </view>
            <text class="solar-term-desc">{{ solarTermInfo.description }}</text>
            <text class="solar-term-tips">💡 {{ solarTermInfo.healthTips }}</text>

            <!-- 推荐统计 -->
            <view v-if="solarTermDishes.length > 0" class="solar-term-stats">
              <text class="stats-title">为您推荐 {{ solarTermDishes.length }} 道菜品</text>
            </view>
          </view>
        </view>

        <view v-if="groupedMeals[cat.id] && groupedMeals[cat.id].length > 0" class="meals-list">
          <view v-for="meal in groupedMeals[cat.id]" :key="meal.id" class="meal-horizontal-card">
            <LazyImage :src="meal.image" class="meal-thumb"></LazyImage>
            <view class="meal-info">
              <view class="meal-title-row">
                <text class="meal-name">{{ meal.name }}</text>
                <!-- 节气推荐标签 -->
                <text v-if="meal.isSeasonalRecommend && meal.matchType === 'term'" class="seasonal-tag term-match">
                  节气推荐
                </text>
                <text
                  v-else-if="meal.isSeasonalRecommend && meal.matchType === 'smart'"
                  class="seasonal-tag smart-match"
                >
                  智能推荐
                </text>
                <text v-else-if="meal.seasonal" class="seasonal-tag">当季</text>
              </view>

              <!-- 推荐理由 -->
              <view v-if="meal.seasonalReason" class="seasonal-reason">
                <text>{{ meal.seasonalReason }}</text>
              </view>

              <view class="meal-nutrition-row">
                <text>{{ meal.nutrition?.calories || meal.calories || 0 }}千卡</text>
                <text>蛋白{{ meal.nutrition?.protein || meal.protein || 0 }}g</text>
              </view>

              <view class="meal-bottom-row">
                <text class="meal-price">¥{{ Number(meal.price).toFixed(2) }}</text>

                <view class="quantity-selector">
                  <uni-transition mode-class="fade" :show="getQuantity(meal.id) > 0">
                    <view class="control-group">
                      <view class="minus-btn" @click.stop="onDecreaseQuantity(meal)">
                        <uni-icons type="minus-filled" size="26" color="#cbd5e1"></uni-icons>
                      </view>
                      <text class="quantity">{{ getQuantity(meal.id) }}</text>
                    </view>
                  </uni-transition>
                  <view class="add-btn" @click.stop="onAddToCart(meal)">
                    <uni-icons type="plusempty" size="18" color="white"></uni-icons>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
        <view v-else class="empty-category">
          <text>暂无此分类菜品</text>
        </view>
      </view>

      <!-- 底部留空，方便最后一个分类也能滚到顶部 -->
      <view class="bottom-spacer"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import LazyImage from "@/components/LazyImage/index.vue";
import Loading from "@/components/Loading/index.vue";
import { getCurrentSolarTerm, getSolarTermDishes } from "@/api/meal.js";

const props = defineProps({
  meals: {
    type: Array,
    default: () => [],
  },
  cartItems: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["add-to-cart", "decrease-quantity"]);

// 节气信息
const solarTermInfo = ref(null);
// 节气推荐菜品
const solarTermDishes = ref([]);
// 加载状态
const loadingSolarTerm = ref(false);

const onAddToCart = (meal) => {
  emit("add-to-cart", meal);
};

const onDecreaseQuantity = (meal) => {
  const cartItem = props.cartItems.find((item) => item.id === meal.id);
  if (cartItem) {
    emit("decrease-quantity", cartItem);
  }
};

const getQuantity = (mealId) => {
  const item = props.cartItems.find((item) => item.id === mealId);
  return item ? item.quantity : 0;
};

// 获取节气信息和推荐菜品
const fetchSolarTermData = async () => {
  loadingSolarTerm.value = true;
  try {
    const { data } = await getSolarTermDishes();

    if (data) {
      solarTermInfo.value = data.solarTerm;
      solarTermDishes.value = data.dishes;
    }
  } catch (error) {
    console.error("获取节气数据失败:", error);
  } finally {
    loadingSolarTerm.value = false;
  }
};

// 组件挂载时获取节气数据
onMounted(() => {
  fetchSolarTermData();
});

const currentCategory = ref("");
const scrollIntoId = ref("");
const isManualScrolling = ref(false);

const categoryOrder = ["seasonal", "meat", "mixed", "vegetable", "staple", "soup", "dessert", "beverage"];

const categoryNameMap = {
  seasonal: "当季特色",
  meat: "精选荤菜",
  vegetable: "清新素菜",
  mixed: "荤素搭配",
  staple: "特色主食",
  soup: "营养汤品",
  dessert: "精美甜点",
  beverage: "清爽饮品",
  other: "其他",
};

// 获取所有存在的分类
const categories = computed(() => {
  const existingCats = new Set();

  // 添加原有菜品的分类（排除 seasonal）
  props.meals.forEach((m) => {
    const cat = m.category || "other";
    if (cat !== "seasonal") {
      // 排除 seasonal 分类
      existingCats.add(cat);
    }
  });

  // 如果有节气推荐菜品，添加 seasonal 分类
  if (solarTermDishes.value.length > 0) {
    existingCats.add("seasonal");
  }

  const sortedCats = categoryOrder.filter((id) => existingCats.has(id));

  // 添加不在 order 中的剩余分类
  existingCats.forEach((id) => {
    if (!categoryOrder.includes(id)) {
      sortedCats.push(id);
    }
  });

  return sortedCats.map((id) => ({
    id,
    name: categoryNameMap[id] || id,
  }));
});

// 分组后的菜品
const groupedMeals = computed(() => {
  const groups = {};

  // 处理原有菜品（排除 seasonal 分类）
  props.meals.forEach((meal) => {
    const cat = meal.category || "other";
    // 跳过 seasonal 分类的菜品，这些菜品将被节气推荐接口返回的菜品替代
    if (cat === "seasonal") {
      return;
    }
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(meal);
  });

  // 只使用节气推荐接口返回的菜品作为 seasonal 分类
  if (solarTermDishes.value.length > 0) {
    groups.seasonal = solarTermDishes.value.map((dish) => ({
      ...dish,
      id: dish.id || dish._id,
      category: "seasonal",
      // 保留推荐信息
      isSeasonalRecommend: true,
      recommendScore: dish.recommendScore,
      matchType: dish.matchType,
      seasonalReason: dish.seasonalReason,
    }));

    // 按推荐分数排序
    groups.seasonal.sort((a, b) => {
      const scoreA = a.recommendScore || 0;
      const scoreB = b.recommendScore || 0;
      return scoreB - scoreA;
    });
  }

  return groups;
});

// 初始化当前分类
watch(
  categories,
  (newCats) => {
    if (newCats.length > 0 && !currentCategory.value) {
      currentCategory.value = newCats[0].id;
    }
  },
  { immediate: true },
);

// 注册 getCurrentInstance
import { getCurrentInstance } from "vue";
const instance = getCurrentInstance();

const sectionTops = ref([]);

// 计算每个分类区域相对于 scroll-view 顶部的偏移量
const calcSectionTops = () => {
  const query = uni.createSelectorQuery().in(instance);

  // 先获取容器的 top
  query.select(".meals-content").boundingClientRect();
  // 获取所有 section 的 top
  query.selectAll(".category-section").boundingClientRect();

  query.exec((res) => {
    const containerRect = res[0];
    const sectionRects = res[1];

    if (containerRect && sectionRects) {
      const containerTop = containerRect.top;
      sectionTops.value = sectionRects.map((rect, index) => ({
        // 这里的 top 是相对于 scroll-view 内容顶部的
        top: rect.top - containerTop,
        id: categories.value[index].id,
      }));
    }
  });
};

// 监听页面及数据变化，计算高度
watch(
  () => props.meals,
  () => {
    setTimeout(() => {
      calcSectionTops();
    }, 500); // 增加延迟确保 DOM 渲染完成
  },
  { deep: true, immediate: true },
);

const scrollToCategory = (id) => {
  isManualScrolling.value = true;
  currentCategory.value = id;
  scrollIntoId.value = "cat-" + id;

  // 延迟恢复自动联动，防止点击触发的滚动导致的抖动
  setTimeout(() => {
    isManualScrolling.value = false;
  }, 1000);
};

// 监听滚动实现联动
const onScroll = (e) => {
  if (isManualScrolling.value) return;

  const scrollTop = e.detail.scrollTop;
  const offset = 10; // 偏移干扰量

  // 寻找当前滚动位置所在的分类
  // 从后往前找，找到第一个 top 小于等于 scrollTop 的即为当前分类
  let activeId = categories.value[0]?.id;

  for (let i = sectionTops.value.length - 1; i >= 0; i--) {
    if (scrollTop >= sectionTops.value[i].top - offset) {
      activeId = sectionTops.value[i].id;
      break;
    }
  }

  if (activeId && currentCategory.value !== activeId) {
    currentCategory.value = activeId;
  }
};
</script>

<style scoped>
.all-meals-container {
  display: flex;
  flex: 1;
  min-height: 0;
  background-color: #fff;
  border-radius: 32rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.05);
  position: relative;
}

/* 侧边栏 */
.category-sidebar {
  width: 180rpx;
  background-color: #f8f9fa;
  height: 100%;
}

.category-item {
  padding: 30rpx 20rpx;
  text-align: center;
  position: relative;
  transition: all 0.2s ease;
}

.category-item.active {
  background-color: #fff;
  font-weight: 700;
  color: #3b82f6;
}

.category-item.active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 30%;
  height: 40%;
  width: 8rpx;
  background: #3b82f6;
  border-radius: 0 4rpx 4rpx 0;
}

.category-name {
  font-size: 26rpx;
  color: #64748b;
}

.active .category-name {
  color: #3b82f6;
}

/* 列表区域 */
.meals-content {
  flex: 1;
  height: 100%;
  padding: 20rpx;
}

.category-section {
  padding-bottom: 40rpx;
}

.section-header {
  margin-bottom: 20rpx;
  padding: 10rpx 0;
}

.section-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #1e293b;
  position: relative;
}

/* 节气信息样式 */
.solar-term-info {
  margin-top: 16rpx;
  padding: 20rpx;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-radius: 16rpx;
  border-left: 6rpx solid #10b981;
}

.solar-term-badge {
  display: inline-flex;
  align-items: center;
  gap: 12rpx;
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  margin-bottom: 12rpx;
}

.solar-term-name {
  font-size: 28rpx;
  font-weight: 700;
}

.solar-term-en {
  font-size: 20rpx;
  color: #64748b;
  text-transform: capitalize;
}

.solar-term-desc {
  display: block;
  font-size: 24rpx;
  color: #475569;
  margin-bottom: 8rpx;
  line-height: 1.5;
}

.solar-term-tips {
  display: block;
  font-size: 22rpx;
  color: #059669;
  line-height: 1.6;
}

.solar-term-stats {
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx dashed #a7f3d0;
}

.stats-title {
  font-size: 24rpx;
  color: #059669;
  font-weight: 600;
}

.meals-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

/* 水平卡片样式 */
.meal-horizontal-card {
  display: flex;
  padding: 10rpx;
}

.meal-thumb {
  width: 160rpx;
  height: 160rpx;
  border-radius: 16rpx;
  flex-shrink: 0;
  margin-right: 20rpx;
}

.meal-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.meal-title-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.meal-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #1e293b;
}

.seasonal-tag {
  font-size: 20rpx;
  background: #fef3c7;
  color: #d97706;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  white-space: nowrap;
}

/* 不同匹配类型的标签样式 */
.term-match {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #d97706;
  font-weight: 600;
}

.season-match {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #2563eb;
  font-weight: 600;
}

.smart-match {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #059669;
  font-weight: 600;
}

/* 推荐理由 */
.seasonal-reason {
  font-size: 22rpx;
  color: #059669;
  margin: 6rpx 0;
  line-height: 1.4;
}

.meal-nutrition-row {
  font-size: 22rpx;
  color: #94a3b8;
  display: flex;
  gap: 16rpx;
}

.meal-bottom-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meal-price {
  font-size: 32rpx;
  font-weight: 700;
  color: #ef4444;
}

.quantity-selector {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.minus-btn {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.minus-btn:active {
  transform: scale(0.8);
}

.quantity {
  font-size: 32rpx;
  font-weight: 700;
  color: #1e293b;
  min-width: 40rpx;
  text-align: center;
}

.add-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  width: 52rpx;
  height: 52rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(59, 130, 246, 0.3);
  transition: all 0.2s ease;
}

.add-btn:active {
  transform: scale(0.9);
}

.empty-category {
  padding: 40rpx;
  text-align: center;
  font-size: 24rpx;
  color: #94a3b8;
}

.bottom-spacer {
  height: 200rpx;
}
</style>
