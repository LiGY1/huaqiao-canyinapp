<template>
  <layout>
    <scroll-view
      class="page-scroll"
      :scroll-y="true"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      :refresher-threshold="80"
      @refresherrefresh="onRefresherRefresh"
    >
      <view class="page-container">
        <WelcomeCard
          :user-info="userInfo"
          :greeting="greeting"
          :current-date="currentDate"
          :current-time="currentTime"
          :weather-info="weatherInfo"
          :daily-tip="dailyTip"
          :daily-goal-progress="dailyGoalProgress"
          :has-over-intake="hasOverIntake"
          :meal-status="mealStatus"
        />

        <NutritionCard
          :loading="loading"
          :load-error="loadError"
          :nutrients="nutrients"
          :nutrition-data="nutritionData"
          :is-over-intake="isOverIntake"
          :format-number="formatNumber"
          :capitalize="capitalize"
          :get-percentage="getPercentage"
          :fetch-nutrition-data="fetchNutritionData"
          :has-over-intake="hasOverIntake"
          :over-intake-items="overIntakeItems"
        />

        <SuggestionCard
          :suggestions="suggestions"
          :get-suggestion-class="getSuggestionClass"
          :get-suggestion-icon="getSuggestionIcon"
          :get-suggestion-color="getSuggestionColor"
        />
      </view>
    </scroll-view>
  </layout>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import layout from "@/components/layout.vue";
import WelcomeCard from "./components/WelcomeCard.vue";
import NutritionCard from "./components/NutritionCard.vue";
import SuggestionCard from "./components/SuggestionCard.vue";
import storage from "@/utils/storage";
import { nutritionApi } from "@/api/nutrition.js";

// 用户信息
const userInfo = ref(storage.getUserInfo() || {});

// 状态
const loading = ref(false);
const loadError = ref(false);
// 下拉刷新状态
const refreshing = ref(false);

// 营养数据
const nutritionData = ref({
  calories: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
  fiber: 0,
  vitaminC: 0,
  iron: 0,
  targetCalories: 2000,
  targetProtein: 75,
  targetFat: 60,
  targetCarbs: 250,
  targetFiber: 25,
  targetVitaminC: 100,
  targetIron: 15,
});

// 营养素配置
const nutrients = [
  { key: "calories", label: "热量", unit: "千卡", gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
  { key: "fat", label: "脂肪", unit: "g", gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
  { key: "fiber", label: "膳食纤维", unit: "g", gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" },
  { key: "vitaminC", label: "维生素C", unit: "mg", gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { key: "protein", label: "蛋白质", unit: "g", gradient: "linear-gradient(135deg, #9c27b0 0%, #673ab7 100%)" },
  { key: "iron", label: "铁", unit: "mg", gradient: "linear-gradient(135deg, #FF9800 0%, #FF5722 100%)" },
];

// 时间和天气
const currentDate = ref("");
const currentTime = ref("");
const weatherInfo = ref("晴朗 22°C");
const greeting = ref("早上好，准备好学习了吗？");
const dailyTip = ref("每天至少喝8杯水，保持身体水分平衡");
const dailyGoalProgress = ref(0);
const hasOverIntake = ref(false);
const overIntakeItems = ref([]);

// 早中晚餐状态
const mealStatus = ref({
  breakfast: false,
  lunch: false,
  dinner: false,
});

// 健康小贴士
const healthTips = [
  "每天至少喝8杯水，保持身体水分平衡",
  "多吃新鲜蔬菜和水果，补充维生素和矿物质",
  "适量运动，每天至少30分钟中等强度运动",
  "保持规律作息，早睡早起身体好",
  "少油少盐，清淡饮食更健康",
  "细嚼慢咽，有助于消化和营养吸收",
  "保持心情愉快，好心情是最好的良药",
  "定期体检，预防胜于治疗",
  "多吃全谷物，提供持久能量",
  "适量摄入优质蛋白质，维持肌肉健康",
];

// 计算属性：营养建议
const suggestions = computed(() => {
  const advice = [];

  // 加载中或加载失败时的默认建议
  if (loading.value || loadError.value) {
    return [
      "今天还未开始用餐，建议开始点餐补充营养",
      "注意饮水，每日至少8杯水（约2000ml）",
      "保持营养均衡，多吃蔬菜水果",
      "保持规律作息，充足睡眠有助于营养吸收",
    ];
  }

  // 未用餐时的建议
  if (nutritionData.value.calories === 0 && nutritionData.value.protein === 0) {
    return [
      "今天还未开始用餐，建议开始点餐补充营养",
      "注意饮水，每日至少8杯水（约2000ml）",
      "保持营养均衡，多吃蔬菜水果",
      "保持规律作息，充足睡眠有助于营养吸收",
    ];
  }

  // 计算各种营养百分比
  const caloriesPercent = Math.round((nutritionData.value.calories / nutritionData.value.targetCalories) * 100);
  const proteinPercent = Math.round((nutritionData.value.protein / nutritionData.value.targetProtein) * 100);
  const fatPercent = Math.round((nutritionData.value.fat / nutritionData.value.targetFat) * 100);
  const carbsPercent = Math.round((nutritionData.value.carbs / nutritionData.value.targetCarbs) * 100);
  const fiberPercent = Math.round((nutritionData.value.fiber / nutritionData.value.targetFiber) * 100);

  // 根据百分比生成建议
  if (caloriesPercent < 60) {
    advice.push(`热量摄入严重不足（仅${caloriesPercent}%），建议增加主食和优质蛋白质，保证每日三餐`);
  } else if (caloriesPercent > 130) {
    advice.push(`热量摄入超标${caloriesPercent - 100}%，请注意控制高热量食物，增加运动量`);
  }

  if (proteinPercent < 60) {
    advice.push(`蛋白质严重不足（${proteinPercent}%）！建议增加鸡蛋、鱼肉、豆制品等优质蛋白`);
  } else if (proteinPercent > 130) {
    advice.push(`蛋白质摄入过高，注意饮食平衡，避免加重肾脏负担`);
  }

  if (fatPercent > 130) {
    advice.push(
      `脂肪摄入超标${Math.round(nutritionData.value.fat - nutritionData.value.targetFat)}g，请减少油炸食品和肥肉`,
    );
  }

  if (fiberPercent < 60) {
    advice.push(`膳食纤维严重不足（${fiberPercent}%）！建议多吃蔬菜、水果和全谷物`);
  }

  // 补充通用建议
  while (advice.length < 4) {
    advice.push("保持规律作息，充足睡眠有助于营养吸收");
  }

  return advice;
});

// 方法：获取百分比
const getPercentage = (current, target) => {
  if (!target || target === 0) return 0;
  return Math.round((current / target) * 100);
};

// 方法：首字母大写
const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// 方法：格式化数字
const formatNumber = (value, decimals = 1) => {
  if (!value && value !== 0) return 0;
  const num = parseFloat(value);
  if (isNaN(num)) return 0;
  return num.toFixed(decimals);
};

// 方法：判断是否超标
const isOverIntake = (key) => {
  const current = nutritionData.value[key];
  const targetKey = `target${capitalize(key)}`;
  const target = nutritionData.value[targetKey];

  if (!target || target === 0) return false;

  return current > target;
};

// 方法：获取建议样式
const getSuggestionClass = (suggestion) => {
  if (suggestion.includes("严重") || suggestion.includes("超标")) {
    return "suggestion-item-danger";
  } else if (suggestion.includes("不足") || suggestion.includes("偏高") || suggestion.includes("过多")) {
    return "suggestion-item-warning";
  } else {
    return "suggestion-item-success";
  }
};

// 方法：获取建议图标
const getSuggestionIcon = (suggestion) => {
  if (suggestion.includes("严重") || suggestion.includes("超标")) {
    return "warn";
  } else if (suggestion.includes("不足") || suggestion.includes("偏高") || suggestion.includes("过多")) {
    return "warning";
  } else {
    return "success";
  }
};

// 方法：获取建议颜色
const getSuggestionColor = (suggestion) => {
  if (suggestion.includes("严重") || suggestion.includes("超标")) {
    return "#ef4444";
  } else if (suggestion.includes("不足") || suggestion.includes("偏高") || suggestion.includes("过多")) {
    return "#f59e0b";
  } else {
    return "#22c55e";
  }
};

// 方法：计算目标完成度
const calculateDailyGoalProgress = () => {
  const nutrientsKeys = ["calories", "protein", "fat", "carbs", "fiber", "vitaminC", "iron"];
  let totalPercentage = 0;
  let validNutrients = 0;

  nutrientsKeys.forEach((key) => {
    const current = nutritionData.value[key];
    const targetKey = `target${capitalize(key)}`;
    const target = nutritionData.value[targetKey];

    if (target && target > 0) {
      const percentage = (current / target) * 100;
      totalPercentage += percentage;
      validNutrients++;
    }
  });

  if (validNutrients === 0) return 0;

  return Math.round(totalPercentage / validNutrients);
};

// 方法：检查超标项目
const checkOverIntake = () => {
  const nutrientsKeys = ["calories", "protein", "fat", "carbs", "fiber", "vitaminC", "iron"];
  const overItems = [];

  nutrientsKeys.forEach((key) => {
    if (isOverIntake(key)) {
      const nutrient = nutrients.find((n) => n.key === key);
      if (nutrient) {
        overItems.push({
          key,
          label: nutrient.label,
          unit: nutrient.unit,
        });
      }
    }
  });

  overIntakeItems.value = overItems;
  hasOverIntake.value = overItems.length > 0;
};

// 方法：加载营养数据
const fetchNutritionData = async () => {
  loading.value = true;
  loadError.value = false;

  try {
    const res = await nutritionApi.getTodayNutrition();
    if (res.code === 200 && res.data) {
      const data = res.data;

      // 更新营养数据
      nutritionData.value = {
        calories: data.calories || 0,
        protein: data.protein || 0,
        fat: data.fat || 0,
        carbs: data.carbs || 0,
        fiber: data.fiber || 0,
        vitaminC: data.vitaminC || 0,
        iron: data.iron || 0,
        targetCalories: data.targetCalories || 2000,
        targetProtein: data.targetProtein || 75,
        targetFat: data.targetFat || 60,
        targetCarbs: data.targetCarbs || 250,
        targetFiber: data.targetFiber || 25,
        targetVitaminC: data.targetVitaminC || 100,
        targetIron: data.targetIron || 15,
      };

      // 更新餐次状态 if the API returns it, otherwise keep local mock or call another API?
      // Since the user focused on `getTodayNutrition`, I will check if `mealStatus` is in the response or not.
      // Usually "today nutrition" might include meal status.
      // If not, I might need to leave it or ask.
      // For now, I'll check if data.mealStatus exists.
      if (data.mealStatus) {
        mealStatus.value = data.mealStatus;
      }

      dailyGoalProgress.value = calculateDailyGoalProgress();
      checkOverIntake();
    } else {
      throw new Error(res.message || "获取数据失败");
    }
  } catch (error) {
    console.error("获取营养数据失败:", error);
    loadError.value = true;
  } finally {
    loading.value = false;
  }
};

// 下拉刷新处理
const onRefresherRefresh = async () => {
  // 启动刷新指示器（refresher-triggered 由 scroll-view 绑定）
  refreshing.value = true;
  try {
    await fetchNutritionData();
  } catch (e) {
    console.error("下拉刷新失败:", e);
  } finally {
    // 给一点缓冲时间，让刷新动画平滑收起
    setTimeout(() => {
      refreshing.value = false;
    }, 300);
  }
};
// 方法：更新时间
const updateTime = () => {
  const now = new Date();
  // 日期格式：2024-01-03
  currentDate.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
  // 时间格式：09:30
  currentTime.value = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // 更新问候语
  const hour = now.getHours();
  if (hour >= 0 && hour < 6) {
    greeting.value = "凌晨好，记得休息！";
  } else if (hour >= 6 && hour < 12) {
    greeting.value = "早上好，准备好学习了吗？";
  } else if (hour >= 12 && hour < 14) {
    greeting.value = "中午好，吃饭休息吧！";
  } else if (hour >= 14 && hour < 18) {
    greeting.value = "下午好，保持专注！";
  } else {
    greeting.value = "晚上好，早点休息！";
  }
};

// 方法：初始化欢迎数据
const initWelcomeData = () => {
  // 随机健康小贴士
  const randomTip = healthTips[Math.floor(Math.random() * healthTips.length)];
  dailyTip.value = randomTip;

  // 随机天气
  const weatherOptions = ["晴朗 22°C", "多云 20°C", "小雨 18°C", "阴天 19°C", "晴天 25°C"];
  const randomWeather = weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
  weatherInfo.value = randomWeather;

  updateTime();
};

// 生命周期：页面加载
onMounted(() => {
  fetchNutritionData();
  initWelcomeData();

  // 每分钟更新时间
  setInterval(updateTime, 60000);
});
</script>

<style lang="scss">
.page-container {
  padding: 20rpx;
  background-color: #f5f5f5;
  height: 100%;
}

.page-scroll {
  height: 100%;
}
</style>
