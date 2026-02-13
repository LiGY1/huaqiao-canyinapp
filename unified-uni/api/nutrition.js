import request from "@/utils/request";

export const nutritionApi = {
  getTodayNutrition: () => {
    return request({
      url: "/student/nutrition/today",
    });
  },

  getMealStatus: () => {
    return request({
      url: "/student/nutrition/meal-status",
    });
  },

  getWeeklyReport: () => {
    return request({
      url: "/student/nutrition/weekly-report",
    });
  },

  getMonthlyReport: () => {
    return request({
      url: "/student/nutrition/monthly-report",
    });
  },

  generateAIReport: () => {
    return request({
      url: "/student/nutrition/ai-report",
    });
  },
};
