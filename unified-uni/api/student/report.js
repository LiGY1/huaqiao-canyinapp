// /api/auth.js
import request from "@/utils/request.js";

export const getTodayNutrition = () => {
  return request({
    url: "/student/nutrition/today",
  });
};

export const getMealStatus = () => {
  return request({
    url: "/student/nutrition/meal-status",
  });
};

/**
 * 获取周报
 * @returns
 */
export const getWeeklyReport = () => {
  return request({
    url: "/student/nutrition/weekly-report",
  });
};

export const getMonthlyReport = () => {
  return request({
    url: "/student/nutrition/monthly-report",
  });
};

/**
 * 获取ai分析报告
 * @returns
 */
export const getAiReportApi = (data = {}) => {
  return request({
    url: "/student/nutrition/ai-reports",
    data,
  });
};

/**
 * ai生成报告
 */
export const generateAIReport = (data) => {
  return request({
    url: "/student/nutrition/ai-report",
    method: "POST",
    data,
  });
};
