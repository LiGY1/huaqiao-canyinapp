/**
 * 数据访问过滤器
 * 根据用户角色返回数据访问过滤条件
 */

const { USER_ROLES } = require('../config/constants');

/**
 * 根据用户角色返回数据访问过滤条件
 * @param {Object} dataScope - 数据范围对象
 * @returns {Object} 包含各类数据过滤条件的对象
 */
exports.applyDataScopeFilter = function(dataScope) {
  const { role, userId, managedClasses, children, studentId } = dataScope;

  // 默认过滤器（无限制）
  let studentFilter = {};
  let teacherFilter = {};
  let parentFilter = {};
  let orderFilter = {};

  switch (role) {
    case USER_ROLES.PRINCIPAL:
      // 校长：可以查看整个学校的完整信息（暂时无限制，如需按学校过滤可添加 schoolId）
      // 如果有 schoolId 字段，可以添加：
      // studentFilter.schoolId = user.schoolId;
      // teacherFilter.schoolId = user.schoolId;
      // parentFilter.schoolId = user.schoolId;
      break;

    case USER_ROLES.TEACHER:
      // 老师：仅能查看自己管理班级的学生
      if (managedClasses && managedClasses.length > 0) {
        studentFilter.class = { $in: managedClasses };
        // 订单过滤：需要先查询学生ID，然后过滤订单（在具体函数中实现）
      } else {
        // 如果没有管理班级，返回空结果
        studentFilter._id = { $in: [] };
      }
      // 教师只能查看自己管理班级的家长（通过学生关联）
      parentFilter._teacher_scope_check = true;  // 标记需要特殊处理
      break;

    case USER_ROLES.STUDENT:
      // 学生：仅能查看自己的数据
      studentFilter._id = userId;
      if (studentId) {
        studentFilter.studentId = studentId;
      }
      // 订单过滤：只能看自己的订单
      orderFilter.user = userId;
      // 学生可以看自己的家长
      parentFilter.children = userId;
      break;

    case USER_ROLES.PARENT:
      // 家长：仅能查看自己孩子的数据
      if (children && children.length > 0) {
        studentFilter._id = { $in: children };
        // 订单过滤：只能看孩子的订单
        orderFilter.user = { $in: children };
      } else {
        // 如果没有绑定孩子，返回空结果
        studentFilter._id = { $in: [] };
        orderFilter.user = { $in: [] };
      }
      // 家长可以看到自己
      parentFilter._id = userId;
      break;

    default:
      // 未知角色：拒绝访问
      studentFilter._id = { $in: [] };
      teacherFilter._id = { $in: [] };
      parentFilter._id = { $in: [] };
      orderFilter._id = { $in: [] };
  }

  return {
    studentFilter,
    teacherFilter,
    parentFilter,
    orderFilter,
    role,
    userId,
    managedClasses,
    children
  };
};

/**
 * 检查用户是否有权限访问特定视图
 * @param {String} role - 用户角色
 * @param {String} view - 视图类型
 * @returns {Object} { allowed: boolean, message: string }
 */
exports.checkViewAccess = function(role, view) {
  // 校长可以访问所有视图
  if (role === USER_ROLES.PRINCIPAL) {
    return { allowed: true };
  }

  // 教师可以访问的视图
  if (role === USER_ROLES.TEACHER) {
    const allowedViews = ['overview', 'students', 'parents', 'orders', 'nutrition', 'search', 'smart', 'role-query', 'help'];
    if (allowedViews.includes(view)) {
      return { allowed: true };
    }
    return { 
      allowed: false, 
      message: `教师角色无权访问 ${view} 视图，仅可访问：${allowedViews.join(', ')}` 
    };
  }

  // 学生可以访问的视图
  if (role === USER_ROLES.STUDENT) {
    const allowedViews = ['overview', 'student-detail', 'orders', 'nutrition', 'smart', 'help'];
    if (allowedViews.includes(view)) {
      return { allowed: true };
    }
    return { 
      allowed: false, 
      message: `学生角色无权访问 ${view} 视图，仅可访问：${allowedViews.join(', ')}` 
    };
  }

  // 家长可以访问的视图
  if (role === USER_ROLES.PARENT) {
    const allowedViews = ['overview', 'students', 'orders', 'nutrition', 'smart', 'role-query', 'help'];
    if (allowedViews.includes(view)) {
      return { allowed: true };
    }
    return { 
      allowed: false, 
      message: `家长角色无权访问 ${view} 视图，仅可访问：${allowedViews.join(', ')}` 
    };
  }

  return { allowed: false, message: '未知角色' };
};

