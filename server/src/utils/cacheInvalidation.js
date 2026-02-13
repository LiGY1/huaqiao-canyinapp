/**
 * 缓存失效管理器
 * 确保数据更新后自动清除相关缓存，保证数据一致性
 */

const cache = require('./cache');

/**
 * 清除用户相关的所有缓存
 */
async function invalidateUserCache(userId) {
  if (!userId) return;
  
  try {
    // 清除用户相关的所有缓存模式
    await Promise.all([
      // 学生自查缓存
      cache.delPattern(`*role:query:student*${userId}*`),
      cache.delPattern(`*studentId:${userId}*`),
      
      // 教师查询缓存（包含该学生）
      cache.delPattern(`*role:query:teacher*`),
      
      // 家长查询缓存（包含该学生）
      cache.delPattern(`*role:query:parent*${userId}*`)
    ]);
    
    if (process.env.CACHE_DEBUG === 'true') {
      console.log(`[缓存失效] 已清除用户 ${userId} 的相关缓存`);
    }
  } catch (error) {
    console.error('[缓存失效] 清除用户缓存失败:', error.message);
  }
}

/**
 * 清除教师相关的所有缓存
 */
async function invalidateTeacherCache(teacherName) {
  if (!teacherName) return;
  
  try {
    await cache.delPattern(`*role:query:teacher*${teacherName}*`);
    
    if (process.env.CACHE_DEBUG === 'true') {
      console.log(`[缓存失效] 已清除教师 ${teacherName} 的相关缓存`);
    }
  } catch (error) {
    console.error('[缓存失效] 清除教师缓存失败:', error.message);
  }
}

/**
 * 清除班级相关的所有缓存
 */
async function invalidateClassCache(className) {
  if (!className) return;
  
  try {
    // 清除该班级的所有教师查询缓存
    await cache.delPattern(`*role:query:teacher*${className}*`);
    
    if (process.env.CACHE_DEBUG === 'true') {
      console.log(`[缓存失效] 已清除班级 ${className} 的相关缓存`);
    }
  } catch (error) {
    console.error('[缓存失效] 清除班级缓存失败:', error.message);
  }
}

/**
 * 订单创建/更新时的缓存失效
 */
async function invalidateOrderCache(order) {
  if (!order) return;
  
  try {
    const tasks = [];
    
    // 清除学生自己的缓存
    if (order.user) {
      tasks.push(invalidateUserCache(order.user));
    }
    
    // 如果是家长代订，清除学生的缓存
    if (order.studentUser) {
      tasks.push(invalidateUserCache(order.studentUser));
    }
    
    // 执行所有清除任务
    await Promise.all(tasks);
    
    if (process.env.CACHE_DEBUG === 'true') {
      console.log(`[缓存失效] 订单 ${order.orderNumber} 相关缓存已清除`);
    }
  } catch (error) {
    console.error('[缓存失效] 清除订单缓存失败:', error.message);
  }
}

/**
 * 批量清除订单缓存（性能优化版）
 */
async function invalidateOrderCacheBatch(orders) {
  if (!orders || orders.length === 0) return;
  
  try {
    const userIds = new Set();
    
    // 收集所有需要清除缓存的用户ID
    orders.forEach(order => {
      if (order.user) userIds.add(order.user.toString());
      if (order.studentUser) userIds.add(order.studentUser.toString());
    });
    
    // 批量清除
    await Promise.all([...userIds].map(userId => invalidateUserCache(userId)));
    
    if (process.env.CACHE_DEBUG === 'true') {
      console.log(`[缓存失效] 批量清除 ${orders.length} 个订单的缓存 (${userIds.size} 个用户)`);
    }
  } catch (error) {
    console.error('[缓存失效] 批量清除订单缓存失败:', error.message);
  }
}

/**
 * 用户信息更新时的缓存失效
 */
async function invalidateUserInfoCache(userId) {
  if (!userId) return;
  
  try {
    // 清除所有与该用户相关的查询缓存
    await Promise.all([
      cache.delPattern(`*${userId}*`),
      cache.delPattern(`*role:query:*`)  // 清除所有角色查询缓存（因为包含用户信息）
    ]);
    
    if (process.env.CACHE_DEBUG === 'true') {
      console.log(`[缓存失效] 用户 ${userId} 信息更新，已清除相关缓存`);
    }
  } catch (error) {
    console.error('[缓存失效] 清除用户信息缓存失败:', error.message);
  }
}

/**
 * 清除所有角色查询缓存（慎用）
 */
async function invalidateAllRoleQueryCache() {
  try {
    await cache.delPattern('*role:query:*');
    
    console.log('[缓存失效] 已清除所有角色查询缓存');
  } catch (error) {
    console.error('[缓存失效] 清除所有角色查询缓存失败:', error.message);
  }
}

module.exports = {
  invalidateUserCache,
  invalidateTeacherCache,
  invalidateClassCache,
  invalidateOrderCache,
  invalidateOrderCacheBatch,
  invalidateUserInfoCache,
  invalidateAllRoleQueryCache
};

