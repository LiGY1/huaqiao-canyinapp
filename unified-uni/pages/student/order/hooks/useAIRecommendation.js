import { ref, computed } from "vue";
import { getRecommendApi } from "@/api/meal";
import cart from "@/utils/cart";

export function useAIRecommendation(syncCartState) {
  const loadingRecommendation = ref(false);
  const aiRecommendation = ref(null);
  const allRecommendedMeals = ref([]);
  const displayedMeals = ref([]);

  // 计算展示菜品的总营养
  const displayedMealsNutrition = computed(() => {
    const nutrition = {
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      fiber: 0,
    };

    displayedMeals.value.forEach((meal) => {
      nutrition.calories += meal.calories || 0;
      nutrition.protein += meal.protein || 0;
      nutrition.fat += meal.fat || 0;
      nutrition.carbs += meal.carbs || 0;
      nutrition.fiber += meal.fiber || 0;
    });

    Object.keys(nutrition).forEach((key) => {
      nutrition[key] = Math.round(nutrition[key]);
    });

    return nutrition;
  });

  /**
   * 刷新展示的推荐菜品 (随机更换组合)
   */
  const refreshDisplayedMeals = () => {
    if (allRecommendedMeals.value.length === 0) {
      displayedMeals.value = [];
      return;
    }

    // 随机逻辑：打乱数组后取前 3-4 个
    const count = Math.random() > 0.5 ? 4 : 3;

    const actualCount = Math.min(count, allRecommendedMeals.value.length);
    const shuffled = [...allRecommendedMeals.value];

    // Fisher-Yates Shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    displayedMeals.value = shuffled.slice(0, actualCount);

    uni.showToast({
      title: `已更换推荐方案`,
      icon: "success",
      duration: 2000,
    });
  };

  /**
   * 应用推荐到购物车
   */
  const applyToCart = () => {
    if (displayedMeals.value.length === 0) {
      uni.showToast({
        title: "没有可应用的菜品",
        icon: "none",
      });
      return;
    }

    // 清空购物车并添加推荐菜品
    cart.clearCart();
    displayedMeals.value.forEach((meal) => {
      cart.addItem(meal);
    });
    if (syncCartState) syncCartState();

    uni.showToast({
      title: `已应用 ${displayedMeals.value.length} 个推荐菜品`,
      icon: "success",
      duration: 2000,
    });
  };

  /**
   * 获取菜品推荐
   */
  const handleRecommend = async () => {
    loadingRecommendation.value = true;
    
    // 根据是否已有推荐，显示不同的提示
    const isRefresh = aiRecommendation.value !== null;
    
    try {
      const { data } = await getRecommendApi();
      const recommendation = data.suggestion;
      const { recommendedMeals } = recommendation;

      aiRecommendation.value = recommendation;
      allRecommendedMeals.value = recommendedMeals;
      displayedMeals.value = recommendedMeals;

      uni.showToast({ 
        title: isRefresh ? '已更换推荐方案！' : '推荐生成成功！', 
        icon: "success" 
      });
    } catch (error) {
      console.error(error);
      uni.showToast({ 
        title: isRefresh ? "更换推荐失败" : "推荐生成失败", 
        icon: "none" 
      });
    } finally {
      loadingRecommendation.value = false;
    }
  };

  const handleRecommendClick = async () => {
    // 每次都重新请求，获取新的推荐结果
    await handleRecommend();
  };

  return {
    loadingRecommendation,
    aiRecommendation,
    displayedMeals,
    displayedMealsNutrition,
    handleRecommendClick,
    applyToCart,
  };
}
