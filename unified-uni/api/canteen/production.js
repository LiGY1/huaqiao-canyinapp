import request from "@/utils/request";

export const getProductionPlanList = (params) => {
  return request({
    url: "/canteen/production/plans",
    method: "GET",
    params,
  });
};

export const getProductionStatistics = (params) => {
  return request({
    url: "/canteen/production/statistics",
    method: "GET",
    params,
  });
};

export const createProductionPlan = (data) => {
  return request({
    url: "/canteen/production/plans",
    method: "POST",
    data,
  });
};

export const updateProductionProgress = (id, data) => {
  return request({
    url: `/canteen/production/plans/${id}/progress`,
    method: "PATCH",
    data,
  });
};

export const completeProduction = (id, data) => {
  return request({
    url: `/canteen/production/plans/${id}/complete`,
    method: "POST",
    data,
  });
};

export const startProduction = (id) => {
  return request({
    url: `/canteen/production/plans/${id}/start`,
    method: "POST",
  });
};

export const deleteProductionPlan = (id) => {
  return request({
    url: `/canteen/production/plans/${id}`,
    method: "DELETE",
  });
};

// 兼容旧命名：对外提供组件中使用的函数名映射
export const updateProgress = (id, data) => updateProductionProgress(id, data);
export const completePlan = (id, data) => completeProduction(id, data);
export const startPlan = (id) => startProduction(id);
export const deletePlan = (id) => deleteProductionPlan(id);

export const getAISuggestions = (params) => {
  return request({
    url: "/canteen/production/ai-suggestions",
    method: "GET",
    params,
  });
};
