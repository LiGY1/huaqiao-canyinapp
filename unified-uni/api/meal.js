import request from "@/utils/request";
import { delay } from "@/utils/tool";

// 获取菜品列表
export const getMealList = async (type = "all") => {
  try {
    const res = await request({
      url: "/student/meals",
      method: "GET",
      data: { category: type },
    });
    await delay(2000);
    return res;
  } catch (error) {
    console.error("获取菜品列表失败:", error);
    // 返回模拟数据
    return {
      code: 200,
      success: true,
      data: [
        {
          id: "1",
          name: "宫保鸡丁",
          category: "meat",
          price: 18.0,
          image: "https://via.placeholder.com/150",
          nutrition: {
            calories: 280,
            protein: 22,
            fat: 18,
            carbs: 12,
            fiber: 2,
          },
          seasonal: false,
          ingredients: ["鸡肉", "花生", "青椒", "红椒"],
        },
        {
          id: "2",
          name: "清炒时蔬",
          category: "vegetable",
          price: 12.0,
          image: "https://via.placeholder.com/150",
          nutrition: {
            calories: 80,
            protein: 3,
            fat: 5,
            carbs: 10,
            fiber: 5,
          },
          seasonal: true,
          solarTerm: "立冬",
          nutritionDescription: "富含维生素和膳食纤维",
          ingredients: ["菠菜", "胡萝卜", "木耳"],
        },
        {
          id: "3",
          name: "番茄鸡蛋面",
          category: "staple",
          price: 15.0,
          image: "https://via.placeholder.com/150",
          nutrition: {
            calories: 320,
            protein: 12,
            fat: 10,
            carbs: 50,
            fiber: 3,
          },
          seasonal: false,
          ingredients: ["面条", "番茄", "鸡蛋"],
        },
        {
          id: "4",
          name: "红烧肉",
          category: "meat",
          price: 22.0,
          image: "https://via.placeholder.com/150",
          nutrition: {
            calories: 380,
            protein: 25,
            fat: 30,
            carbs: 8,
            fiber: 1,
          },
          seasonal: false,
          ingredients: ["五花肉", "生抽", "老抽", "冰糖"],
        },
        {
          id: "5",
          name: "冬瓜排骨汤",
          category: "soup",
          price: 16.0,
          image: "https://via.placeholder.com/150",
          nutrition: {
            calories: 120,
            protein: 15,
            fat: 5,
            carbs: 8,
            fiber: 3,
          },
          seasonal: true,
          solarTerm: "立冬",
          nutritionDescription: "清热利湿，营养丰富",
          ingredients: ["排骨", "冬瓜", "生姜"],
        },
        {
          id: "6",
          name: "鱼香肉丝",
          category: "mixed",
          price: 19.0,
          image: "https://via.placeholder.com/150",
          nutrition: {
            calories: 260,
            protein: 20,
            fat: 16,
            carbs: 15,
            fiber: 4,
          },
          seasonal: false,
          ingredients: ["猪肉", "木耳", "胡萝卜", "青椒"],
        },
      ],
    };
  }
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
  try {
    const res = await request({
      url: "/student/meals/current-solar-term",
      method: "GET",
    });
    return res;
  } catch (error) {
    console.error("获取节气信息失败:", error);
    // 返回模拟数据
    return {
      code: 200,
      success: true,
      data: {
        name: "立冬",
        color: {
          tag: "success",
        },
      },
    };
  }
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
