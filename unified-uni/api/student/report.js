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
 * @param {Object} data - 请求参数
 * @param {string} data.date - 日期参数（可选，格式：YYYY-MM-DD）
 * @returns
 */
export const getWeeklyReport = (data = {}) => {
  return request({
    url: "/student/nutrition/weekly-report",
    data,
  });
};

/**
 * 获取月报
 * @param {Object} data - 请求参数
 * @param {string} data.date - 日期参数（可选，格式：YYYY-MM-DD）
 * @returns
 */
export const getMonthlyReport = (data = {}) => {
  return request({
    url: "/student/nutrition/monthly-report",
    data,
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
