import request from "@/utils/request";

// 获取菜品列表
export const getMealList = async (type = "all") => {
  const res = await request({
    url: "/student/meals",
    method: "GET",
    data: { category: type },
  });
  return res;
};

// 提交订单
export const submitOrder = async (orderData) => {
  try {
    const res = await request({
      url: "/student/orders",
      method: "POST",
      data: orderData,
    });
    return res;
  } catch (error) {
    console.error("提交订单失败:", error);
    throw error;
  }
};

// 获取今日营养数据
export const getTodayNutrition = async () => {
  const res = await request({
    url: "/student/nutrition/today",
    method: "GET",
  });
  return res;
};

export const getRecommendApi = async () => {
  return await request({
    url: "/student/nutrition/getRecommend",
    method: "GET",
  });
};

// 获取订单详情
export const getOrderDetails = async (orderId) => {
  try {
    const res = await request({
      url: `/student/orders/${orderId}`,
      method: "GET",
    });
    return res;
  } catch (error) {
    console.error("获取订单详情失败:", error);
    throw error;
  }
};

// 获取当前节气信息
export const getCurrentSolarTerm = async () => {
  const res = await request({
    url: "/student/meals/current-solar-term",
    method: "GET",
  });
  return res;

};

// 获取用户余额
export const getBalance = async () => {
  try {
    const res = await request({
      url: "/student/user/balance",
      method: "GET",
    });
    return res;
  } catch (error) {
    console.error("获取余额失败:", error);
    // 返回模拟数据
    return {
      code: 200,
      success: true,
      data: {
        balance: 100.5,
      },
    };
  }
};
