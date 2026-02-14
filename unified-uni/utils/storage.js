// /utils/storage.js
import { STORAGE_KEYS } from "./constants";

/**
 * 统一存储工具
 * 封装uni-app存储操作
 */
class Storage {
  /**
   * 设置token
   * @param {string} token - token值
   * @param {boolean} remember - 是否记住
   */
  setToken(token, remember = false) {
    uni.setStorageSync(STORAGE_KEYS.TOKEN, token);
  }

  /**
   * 获取token
   * @returns {string|null} token值
   */
  getToken() {
    return uni.getStorageSync(STORAGE_KEYS.TOKEN) || null;
  }

  /**
   * 移除token
   */
  removeToken() {
    uni.removeStorageSync(STORAGE_KEYS.TOKEN);
  }

  /**
   * 设置用户信息
   * @param {object} userInfo - 用户信息
   * @param {boolean} remember - 是否记住
   */
  setUserInfo(userInfo, remember = false) {
    if (userInfo && userInfo.name) {
      const name = userInfo.name;
      userInfo.name = name.substring(0, 1) + new Array(name.length - 1).fill("*").join("");
    }
    uni.setStorageSync(STORAGE_KEYS.USER_INFO, userInfo);
  }

  /**
   * 获取用户信息
   * @returns {object|null} 用户信息
   */
  getUserInfo() {
    const value = uni.getStorageSync(STORAGE_KEYS.USER_INFO);
    if (!value) return null;
    try {
      return typeof value === "string" ? JSON.parse(value) : value;
    } catch (e) {
      console.error("解析用户信息失败:", e);
      return null;
    }
  }

  /**
   * 移除用户信息
   */
  removeUserInfo() {
    uni.removeStorageSync(STORAGE_KEYS.USER_INFO);
  }

  /**
   * 清除所有认证信息
   */
  clearAuth() {
    this.removeToken();
    this.removeUserInfo();
    this.setRememberMe(false);
    this.removeSavedUsername();
  }

  /**
   * 设置主题
   * @param {string} theme - 主题值 ('light' | 'dark')
   */
  setTheme(theme) {
    uni.setStorageSync(STORAGE_KEYS.THEME, theme);
  }

  /**
   * 获取主题
   * @returns {string} 主题值
   */
  getTheme() {
    return uni.getStorageSync(STORAGE_KEYS.THEME) || "light";
  }

  /**
   * 设置记住我状态
   * @param {boolean} remember - 是否记住
   */
  setRememberMe(remember) {
    if (remember) {
      uni.setStorageSync(STORAGE_KEYS.REMEMBER_ME, "true");
    } else {
      uni.removeStorageSync(STORAGE_KEYS.REMEMBER_ME);
    }
  }

  /**
   * 获取记住我状态
   * @returns {boolean}
   */
  getRememberMe() {
    return uni.getStorageSync(STORAGE_KEYS.REMEMBER_ME) === "true";
  }

  /**
   * 设置保存的用户名
   * @param {string} username - 用户名
   */
  setSavedUsername(username) {
    uni.setStorageSync(STORAGE_KEYS.SAVED_USERNAME, username);
  }

  /**
   * 获取保存的用户名
   * @returns {string|null}
   */
  getSavedUsername() {
    return uni.getStorageSync(STORAGE_KEYS.SAVED_USERNAME);
  }

  /**
   * 移除保存的用户名
   */
  removeSavedUsername() {
    uni.removeStorageSync(STORAGE_KEYS.SAVED_USERNAME);
  }
}

export default new Storage();
