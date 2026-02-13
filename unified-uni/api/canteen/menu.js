import request from "@/utils/request";

export const getDishList = (params) => {
  return request({
    url: "/canteen/menu/dishes",
    method: "GET",
    params,
  });
};

export const getDishDetail = (id) => {
  return request({
    url: `/canteen/menu/dishes/${id}`,
    method: "GET",
  });
};

export const createDish = (data) => {
  return request({
    url: "/canteen/menu/dishes",
    method: "POST",
    data,
  });
};

export const updateDish = (id, data) => {
  return request({
    url: `/canteen/menu/dishes/${id}`,
    method: "PUT",
    data,
  });
};

// 更新菜品状态（快捷方法，内部使用 updateDish）
export const updateDishStatus = (id, status) => {
  return updateDish(id, { status });
};

export const deleteDish = (id) => {
  return request({
    url: `/canteen/menu/dishes/${id}`,
    method: "DELETE",
  });
};

export const getCategories = () => {
  return request({
    url: "/canteen/menu/categories",
    method: "GET",
  });
};

export const updateCategory = (id, data) => {
  return request({
    url: `/canteen/menu/categories/${id}`,
    method: "PUT",
    data,
  });
};

export const uploadDishImage = (filePath) => {
  return uni.uploadFile({
    url: "/canteen/menu/upload",
    filePath,
    name: "file",
  });
};
