// /utils/request.js
import storage from "./storage";
import { ERROR_MESSAGES, API_CODES } from "./constants";

// 1. 定义基础配置
// 注意：小程序和App必须使用完整的绝对路径，不能使用 /api 这种相对路径
// 开发环境可以在这里切换，或者使用环境变量
// export const BASE_URL = "http://192.168.5.254:8088/api";
// export const BASE_URL = "http://120.76.52.145:8000/api";
export const BASE_URL = "http://192.168.2.103:8080/api";

const TIMEOUT = 50000;

/**
 * 核心请求函数
 */
const request = (options) => {
  return new Promise((resolve, reject) => {
    // 2. 请求拦截器逻辑：获取 Token 并添加到 Header
    const token = storage.getToken();

    const header = {
      "Content-Type": "application/json",
      ...options.header,
    };

    if (token) {
      header.Authorization = `Bearer ${token}`;
    }

    // 发起请求
    uni.request({
      url: BASE_URL + options.url,
      method: options.method || "GET",
      data: options.data || {},
      header: header,
      timeout: TIMEOUT,
      success: (res) => {
        // 3. 响应拦截器逻辑
        const { statusCode, data } = res;

        // 判定请求是否成功 (根据你的后端约定，通常 2xx 为 HTTP 成功)
        if (statusCode >= 200 && statusCode < 300) {
          // 直接返回 response.data，与原代码保持一致
          resolve(data);
        } else {
          // 处理 HTTP 错误状态码
          handleError(statusCode, data);
          reject(data);
        }
      },
      fail: (err) => {
        // 网络层面的失败（断网、DNS解析失败等）
        uni.showToast({
          title: ERROR_MESSAGES.NETWORK_ERROR,
          icon: "none",
        });
        reject(err);
      },
    });
  });
};

/**
 * 统一错误处理
 */
const handleError = (statusCode, data) => {
  const message = data?.message || ERROR_MESSAGES.REQUEST_FAILED;

  console.error(`API Error: ${statusCode}`, message);

  // 401 鉴权失败处理
  if (statusCode === API_CODES.UNAUTHORIZED) {
    // 清除本地存储
    storage.clearAuth();

    // 如果当前不在登录页，跳转回登录页
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    if (currentPage && currentPage.route !== "pages/login/login") {
      uni.reLaunch({
        url: "/pages/login/login",
      });
    }
    return;
  }

  // 403 权限不足处理
  if (statusCode === API_CODES.FORBIDDEN) {
    uni.showToast({
      title: ERROR_MESSAGES.NO_PERMISSION,
      icon: "none",
      duration: 2000,
    });
    return;
  }

  // 404 资源不存在处理
  if (statusCode === API_CODES.NOT_FOUND) {
    uni.showToast({
      title: ERROR_MESSAGES.RESOURCE_NOT_FOUND,
      icon: "none",
      duration: 2000,
    });
    return;
  }

  // 500 服务器错误处理
  if (statusCode === API_CODES.SERVER_ERROR) {
    uni.showToast({
      title: ERROR_MESSAGES.SERVER_ERROR,
      icon: "none",
      duration: 2000,
    });
    return;
  }

  // 其他错误统一提示
  uni.showToast({
    title: message,
    icon: "none",
    duration: 2000,
  });
};

export default request;
