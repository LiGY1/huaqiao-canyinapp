/**
 * 智能缓存预热机制
 * 预测并预先加载可能需要的数据
 */

const cache = require('./cache');

/**
 * 预热策略：根据访问模式预测下一次查询
 */
class CachePreheater {
  constructor() {
    // 访问模式统计
    this.accessPatterns = new Map();
    // 预热队列
    this.preheatQueue = [];
    // 预热中的任务
    this.preheating = new Set();
    // 启用状态
    this.enabled = process.env.CACHE_PREHEAT !== 'false';
  }
  
  /**
   * 记录访问模式
   */
  recordAccess(key, relatedKeys = []) {
    if (!this.enabled) return;
    
    if (!this.accessPatterns.has(key)) {
      this.accessPatterns.set(key, {
        count: 0,
        relatedKeys: new Set(),
        lastAccess: Date.now()
      });
    }
    
    const pattern = this.accessPatterns.get(key);
    pattern.count++;
    pattern.lastAccess = Date.now();
    
    // 记录相关键（经常一起访问的）
    relatedKeys.forEach(rk => pattern.relatedKeys.add(rk));
    
    // 清理旧的访问模式（超过1小时）
    if (this.accessPatterns.size > 1000) {
      this.cleanOldPatterns();
    }
  }
  
  /**
   * 智能预热：根据当前访问预测下一次查询
   */
  async smartPreheat(currentKey, dataFetcher) {
    if (!this.enabled) return;
    
    const pattern = this.accessPatterns.get(currentKey);
    if (!pattern || pattern.relatedKeys.size === 0) return;
    
    // 预热相关键
    for (const relatedKey of pattern.relatedKeys) {
      // 避免重复预热
      if (this.preheating.has(relatedKey)) continue;
      
      // 检查是否已缓存
      const cached = await cache.get(relatedKey);
      if (cached) continue;
      
      // 异步预热（不阻塞主流程）
      this.preheatAsync(relatedKey, dataFetcher);
    }
  }
  
  /**
   * 异步预热单个键
   */
  async preheatAsync(key, dataFetcher) {
    if (this.preheating.has(key)) return;
    
    this.preheating.add(key);
    
    try {
      // 异步获取数据并缓存
      const data = await dataFetcher(key);
      if (data) {
        await cache.set(key, data, 300); // 5分钟
        
        if (process.env.CACHE_DEBUG === 'true') {
          console.log(`[预热] 已预热缓存: ${key}`);
        }
      }
    } catch (error) {
      if (process.env.CACHE_DEBUG === 'true') {
        console.error(`[预热] 预热失败: ${key}`, error.message);
      }
    } finally {
      this.preheating.delete(key);
    }
  }
  
  /**
   * 批量预热：预热一组键
   */
  async batchPreheat(keys, dataFetcher) {
    if (!this.enabled) return;
    
    const tasks = keys.map(key => this.preheatAsync(key, dataFetcher));
    await Promise.allSettled(tasks);
  }
  
  /**
   * 清理旧的访问模式
   */
  cleanOldPatterns() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    for (const [key, pattern] of this.accessPatterns.entries()) {
      if (pattern.lastAccess < oneHourAgo) {
        this.accessPatterns.delete(key);
      }
    }
  }
  
  /**
   * 热点数据预热：定期预热访问频繁的数据
   */
  async preheatHotData(dataFetcher) {
    if (!this.enabled) return;
    
    // 找出访问最频繁的前20个键
    const hotKeys = Array.from(this.accessPatterns.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20)
      .map(([key]) => key);
    
    // 预热热点数据
    await this.batchPreheat(hotKeys, dataFetcher);
  }
  
  /**
   * 获取统计信息
   */
  getStats() {
    return {
      totalPatterns: this.accessPatterns.size,
      preheatingCount: this.preheating.size,
      queueSize: this.preheatQueue.length,
      enabled: this.enabled
    };
  }
}

// 导出单例
const preheater = new CachePreheater();

module.exports = preheater;

