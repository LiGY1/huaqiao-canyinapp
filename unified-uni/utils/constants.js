/**
 * 统一常量定义
 * 所有模块共享的常量
 */

// 存储键名
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER_INFO: 'userInfo',
  THEME: 'theme',
  REMEMBER_ME: 'remember_me',
  SAVED_USERNAME: 'saved_username',
  SAVED_ROLE_TYPE: 'saved_role_type'
}

// 角色类型
export const ROLE_TYPES = {
  STUDENT: 'student',
  PARENT: 'parent',
  SCHOOL: 'school',
  CANTEEN: 'canteen',
  ADMIN: 'admin',
  PRINCIPAL: 'principal',
  TEACHER: 'teacher'
}

// 路由前缀
export const ROUTE_PREFIXES = {
  STUDENT: '/pages/student',
  PARENT: '/pages/parent',
  TEACHER: '/pages/teacher',
  SCHOOL: '/pages/school',
  CANTEEN: '/pages/canteen'
}

// 主题模式
export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark'
}

// API响应码
export const API_CODES = {
  SUCCESS: 200,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500
}

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络错误，请检查网络连接',
  LOGIN_EXPIRED: '登录已过期，请重新登录',
  NO_PERMISSION: '没有权限访问',
  RESOURCE_NOT_FOUND: '请求的资源不存在',
  SERVER_ERROR: '服务器错误',
  REQUEST_FAILED: '请求失败',
  LOGIN_FAILED: '登录失败，请检查用户名和密码',
  REGISTER_FAILED: '注册失败，请稍后重试',
  TIMEOUT: '请求超时，请稍后重试',
  TIMEOUT_AI: '请求超时，AI报告生成需要较长时间，请稍后重试'
}

// 成功消息
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: '登录成功',
  LOGOUT_SUCCESS: '退出登录成功',
  REGISTER_SUCCESS: '注册成功',
  SAVE_SUCCESS: '保存成功',
  DELETE_SUCCESS: '删除成功',
  UPDATE_SUCCESS: '更新成功',
  OPERATION_SUCCESS: '操作成功'
}

// 默认配置
export const DEFAULT_CONFIG = {
  API_TIMEOUT: 10000,
  API_TIMEOUT_LONG: 90000, // 用于AI等长时间操作
  PAGE_SIZE: 10,
  THEME: THEME_MODES.LIGHT
}