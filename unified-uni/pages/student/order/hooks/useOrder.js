import { ref } from 'vue';
import { submitOrder as submitOrderApi } from "@/api/meal";
import cart from "@/utils/cart";

export function useOrder(cartState, cartTotalPrice, syncCartState, closeCartCallback) {
  const submitting = ref(false);

  const submitOrder = async () => {
    if (cartState.items.length === 0) {
      uni.showToast({ title: "请先添加菜品到购物车", icon: "none" });
      return;
    }

    submitting.value = true;
    try {
      const hour = new Date().getHours();
      let mealType = "lunch";
      if (hour >= 6 && hour < 9) mealType = "breakfast";
      else if (hour >= 11 && hour < 14) mealType = "lunch";
      else if (hour >= 17 && hour < 20) mealType = "dinner";

      const orderData = {
        items: cartState.items.map((item) => ({
          dishId: item.id,
          quantity: item.quantity,
        })),
        mealType,
        scheduledDate: new Date(),
        location: { campus: "主校区", canteen: "第一食堂", floor: "1楼", window: "1号窗口" },
      };

      const res = await submitOrderApi(orderData);
      if (res.code === 200 || res.success) {
        uni.showToast({ title: `提交成功！`, icon: "success" });
        cart.clearCart();
        syncCartState();
        if(closeCartCallback) closeCartCallback();

        const orderId = res.data?.orderId || res.orderId;
        uni.navigateTo({ url: `/pages/student/order-status/orderStatus?orderId=${orderId}` });
      }
    } catch (error) {
      console.error("提交订单失败:", error);
      // 处理余额不足
      if (error.response?.status === 402 || error.response?.data?.code === 402) {
        const errorData = error.response?.data?.data || {};
        const balance = errorData.balance || 0;
        const required = errorData.required || cartTotalPrice.value; // 使用 .value 访问 Ref
        const shortage = errorData.shortage || required - balance;

        uni.showModal({
          title: "余额不足",
          content: `当前余额：¥${balance.toFixed(2)}\n订单金额：¥${required.toFixed(2)}\n还需充值：¥${shortage.toFixed(2)}`,
          confirmText: "去充值",
          success: (res) => {
            if (res.confirm) {
              if(closeCartCallback) closeCartCallback();
              uni.navigateTo({ url: "/pages/student/profile/profile" });
            }
          },
        });
      } else {
        uni.showToast({ title: error.response?.data?.message || "提交订单失败", icon: "none" });
      }
    } finally {
      submitting.value = false;
    }
  };

  return {
    submitting,
    submitOrder
  };
}