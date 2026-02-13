import { ref } from 'vue';
import { getMealList } from '@/api/meal';

// 工具函数：适配后端数据（导出以便其他 Hook 使用）
export const adaptMealData = (meal) => {
  return {
    id: meal._id || meal.id,
    name: meal.name,
    category: meal.category,
    price: meal.price,
    image: meal.image || "https://via.placeholder.com/150",
    calories: meal.nutrition?.calories || 0,
    protein: meal.nutrition?.protein || 0,
    fat: meal.nutrition?.fat || 0,
    carbs: meal.nutrition?.carbs || 0,
    fiber: meal.nutrition?.fiber || 0,
    matchScore: meal.matchScore || 0,
    seasonal: meal.seasonal || false,
    solarTerm: meal.solarTerm || "",
    nutritionDescription: meal.nutritionDescription || "",
    ingredients: meal.ingredients || [],
    isRecommended: meal.isRecommended || false,
  };
};

export function useMeals() {
  const meals = ref([]);
  const loading = ref(false);

  const fetchMeals = async () => {
    loading.value = true;
    try {
      const { data } = await getMealList();
      meals.value = Array.isArray(data) ? data.map(adaptMealData) : [];
    } catch (error) {
      console.error("获取菜品列表失败:", error);
      uni.showToast({ title: "获取菜品列表失败", icon: "none" });
    } finally {
      loading.value = false;
    }
  };

  return {
    meals,
    loading,
    fetchMeals,
    adaptMealData // 导出给组件或其他 Hook 使用
  };
}