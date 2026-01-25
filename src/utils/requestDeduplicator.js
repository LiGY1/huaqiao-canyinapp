/**
 * 请求去重器
 * 防止短时间内的重复查询浪费资源
 */

class RequestDeduplicator {
  constructor() {
    // 进行中的请求
    this.pendingRequests = new Map();
    // 请求统计
    this.stats = {
      deduplicated: 0,  // 去重次数
      saved: 0          // 节省的查询次数
    };
  }
  
  /**
   * 去重执行：如果相同请求正在执行，等待其结果
   */
  async deduplicate(key, executor) {
    // 检查是否有相同请求正在执行
    if (this.pendingRequests.has(key)) {
      this.stats.deduplicated++;
      this.stats.saved++;
      
      if (process.env.CACHE_DEBUG === 'true') {
        console.log(`[去重] 等待进行中的请求: ${key}`);
      }
      
      // 等待正在执行的请求完成
      return await this.pendingRequests.get(key);
    }
    
    // 创建新的请求Promise
    const promise = this._executeRequest(key, executor);
    this.pendingRequests.set(key, promise);
    
    try {
      const result = await promise;
      return result;
    } finally {
      // 请求完成后移除
      this.pendingRequests.delete(key);
    }
  }
  
  /**
   * 执行实际请求
   */
  async _executeRequest(key, executor) {
    try {
      const result = await executor();
      return result;
    } catch (error) {
      // 将错误传递给所有等待的请求
      throw error;
    }
  }
  
  /**
   * 获取统计信息
   */
  getStats() {
    return {
      ...this.stats,
      pendingCount: this.pendingRequests.size
    };
  }
  
  /**
   * 重置统计
   */
  resetStats() {
    this.stats.deduplicated = 0;
    this.stats.saved = 0;
  }
}

// 导出单例
const deduplicator = new RequestDeduplicator();

module.exports = deduplicator;

