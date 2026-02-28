import { reactive, ref, computed } from 'vue';
import cart from '@/utils/cart';

export function useCart() {
  const popup = ref(null);

  // 1. 响应式状态
  const cartState = reactive({
    items: [...cart.items],
  });

  // 2. 同步函数
  const syncCartState = () => {
    cartState.items = [...cart.items];
  };

  // 3. 计算属性
  const cartTotalItems = computed(() => {
    return cartState.items.reduce((total, item) => total + item.quantity, 0);
  });

  const cartTotalPrice = computed(() => {
    return cartState.items.reduce((total, item) => total + item.price * item.quantity, 0);
  });

  const totalNutrition = computed(() => {
    const nutrition = { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 };
    cartState.items.forEach((item) => {
      // 兼容两种数据结构：直接字段或nutrition对象
      const calories = item.calories ?? item.nutrition?.calories ?? 0;
      const protein = item.protein ?? item.nutrition?.protein ?? 0;
      const fat = item.fat ?? item.nutrition?.fat ?? 0;
      const carbs = item.carbs ?? item.nutrition?.carbs ?? 0;
      const fiber = item.fiber ?? item.nutrition?.fiber ?? 0;
      
      nutrition.calories += calories * item.quantity;
      nutrition.protein += protein * item.quantity;
      nutrition.fat += fat * item.quantity;
      nutrition.carbs += carbs * item.quantity;
      nutrition.fiber += fiber * item.quantity;
    });
    // 保留一位小数
    Object.keys(nutrition).forEach((key) => {
      nutrition[key] = Math.round(nutrition[key] * 10) / 10;
    });
    return nutrition;
  });

  // 4. 操作方法
  const addToCart = (meal) => {
    cart.addItem(meal);
    syncCartState();
  };

  const increaseQuantity = (item) => {
    cart.updateQuantity(item.id, item.quantity + 1);
    syncCartState();
  };

  const decreaseQuantity = (item) => {
    if (item.quantity > 1) {
      cart.updateQuantity(item.id, item.quantity - 1);
    } else {
      cart.removeItem(item.id);
    }
    syncCartState();
  };

  const removeItemFromCart = (itemId) => {
    cart.removeItem(itemId);
    syncCartState();
  };

  const toggleCart = () => popup.value?.open('bottom');
  const closeCart = () => popup.value?.close();

  return {
    popup,
    cartState,
    syncCartState,
    cartTotalItems,
    cartTotalPrice,
    totalNutrition,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
    removeItemFromCart,
    toggleCart,
    closeCart
  };
}