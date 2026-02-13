/**
 * 角色查询接口的缓存管理工具
 * 提供缓存失效、预热等功能
 */

const cache = require('./cache');
const logger = require('./logger');

/**
 * 清除教师相关的缓存
 * @param {String} teacherName - 教师姓名
 */
async function invalidateTeacherCache(teacherName) {
  try {
    const pattern = `role:query:teacher:${teacherName}*`;
    const deletedCount = await cache.delPattern(pattern);
    if (deletedCount > 0) {
      logger.success('缓存清除', `已清除教师缓存: ${teacherName}`, `删除了 ${deletedCount} 个缓存键`);
    } else {
      logger.info('缓存清除', `教师缓存: ${teacherName}`, '无匹配的缓存键');
    }
  } catch (error) {
    logger.error('缓存清除', `清除教师缓存失败: ${teacherName}`, error.message);
  }
}

/**
 * 清除学生相关的缓存
 * @param {String} studentName - 学生姓名
 * @param {String} studentId - 学号
 */
async function invalidateStudentCache(studentName, studentId) {
  try {
    let totalDeleted = 0;
    
    // 清除学生自己的缓存
    const studentPattern = `role:query:student:${studentName}:${studentId}*`;
    totalDeleted += await cache.delPattern(studentPattern);
    
    // 清除家长查询该学生的缓存
    const parentPattern = `role:query:parent:*:student:${studentName}:${studentId}*`;
    totalDeleted += await cache.delPattern(parentPattern);
    
    // 清除教师查询该学生的缓存（需要知道班级或教师）
    const teacherPattern = `role:query:teacher:*:student:${studentName}*`;
    totalDeleted += await cache.delPattern(teacherPattern);
    
    if (totalDeleted > 0) {
      logger.success('缓存清除', `已清除学生相关缓存: ${studentName} (${studentId})`, `删除了 ${totalDeleted} 个缓存键`);
    } else {
      logger.info('缓存清除', `学生缓存: ${studentName} (${studentId})`, '无匹配的缓存键');
    }
  } catch (error) {
    logger.error('缓存清除', `清除学生缓存失败: ${studentName} (${studentId})`, error.message);
  }
}

/**
 * 清除家长相关的缓存
 * @param {String} parentName - 家长姓名
 */
async function invalidateParentCache(parentName) {
  try {
    const pattern = `role:query:parent:parent:${parentName}*`;
    const deletedCount = await cache.delPattern(pattern);
    if (deletedCount > 0) {
      logger.success('缓存清除', `已清除家长缓存: ${parentName}`, `删除了 ${deletedCount} 个缓存键`);
    } else {
      logger.info('缓存清除', `家长缓存: ${parentName}`, '无匹配的缓存键');
    }
  } catch (error) {
    logger.error('缓存清除', `清除家长缓存失败: ${parentName}`, error.message);
  }
}

/**
 * 清除班级相关的所有缓存
 * @param {String} className - 班级名称
 */
async function invalidateClassCache(className) {
  try {
    // 清除教师查询该班级的缓存
    const pattern = `role:query:teacher:*`;
    const deletedCount = await cache.delPattern(pattern);
    if (deletedCount > 0) {
      logger.success('缓存清除', `已清除班级相关缓存: ${className}`, `删除了 ${deletedCount} 个缓存键`);
    } else {
      logger.info('缓存清除', `班级缓存: ${className}`, '无匹配的缓存键');
    }
  } catch (error) {
    logger.error('缓存清除', `清除班级缓存失败: ${className}`, error.message);
  }
}

/**
 * 当订单创建/更新时清除相关缓存
 * @param {ObjectId} studentUserId - 学生用户ID
 */
async function invalidateOrderCache(studentUserId) {
  try {
    // 需要通过studentUserId查找学生信息来清除缓存
    const User = require('../models/User');
    const student = await User.findById(studentUserId).select('name studentId').lean();
    
    if (student) {
      await invalidateStudentCache(student.name, student.studentId);
      logger.info('缓存清除', `订单相关缓存已清除`, `学生: ${student.name} (${student.studentId})`);
    } else {
      logger.warn('缓存清除', `订单相关缓存清除`, `未找到学生信息: ${studentUserId}`);
    }
  } catch (error) {
    logger.error('缓存清除', `清除订单缓存失败: 学生ID ${studentUserId}`, error.message);
  }
}

/**
 * 清除所有角色查询缓存
 */
async function invalidateAllRoleQueryCache() {
  try {
    const pattern = 'role:query:*';
    const deletedCount = await cache.delPattern(pattern);
    if (deletedCount > 0) {
      logger.success('缓存清除', '已清除所有角色查询缓存', `删除了 ${deletedCount} 个缓存键`);
    } else {
      logger.info('缓存清除', '所有角色查询缓存', '无匹配的缓存键');
    }
    return deletedCount;
  } catch (error) {
    logger.error('缓存清除', '清除所有角色查询缓存失败', error.message);
    throw error;
  }
}

/**
 * 获取缓存统计
 */
function getCacheStats() {
  return cache.getCacheStats();
}

/**
 * 获取缓存连接状态
 */
function getCacheStatus() {
  return cache.getConnectionStatus();
}

module.exports = {
  invalidateTeacherCache,
  invalidateStudentCache,
  invalidateParentCache,
  invalidateClassCache,
  invalidateOrderCache,
  invalidateAllRoleQueryCache,
  getCacheStats,
  getCacheStatus
};

