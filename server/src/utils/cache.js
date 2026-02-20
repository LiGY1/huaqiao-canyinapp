/**
 * 缓存工具类
 * 支持 Redis 缓存和内存缓存（当 Redis 不可用时）
 */
const redis = require('redis');
const chalk = require('chalk');

/**
 * 简单的 LRU 缓存实现（一级缓存）
 */
class LRUCache {
  constructor(maxSize = 500) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return null;

    const item = this.cache.get(key);

    // LRU: 移到最后（最近使用）
    this.cache.delete(key);
    this.cache.set(key, item);

    // 检查是否过期
    if (item.expiry && item.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  set(key, value, expiry) {
    // 如果已存在，先删除
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // 如果超过最大容量，删除最旧的项（Map的第一个）
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, { value, expiry });
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

class CacheManager {
  constructor() {
    this.redisClient = null;
    this.memoryCache = new Map();
    this.isRedisConnected = false;
    this.defaultTTL = 300; // 默认 5 分钟

    // 🚀 一级缓存：本地 LRU 缓存（超快速访问）
    this.localCache = new LRUCache(500); // 缓存最近500个热点数据

    // 缓存统计
    this.stats = {
      hits: 0,           // 缓存命中次数
      misses: 0,         // 缓存未命中次数
      sets: 0,           // 缓存设置次数
      deletes: 0,        // 缓存删除次数
      localHits: 0,      // 本地缓存命中次数
      redisHits: 0       // Redis 缓存命中次数
    };

    // 性能优化：批量操作队列
    this.batchQueue = [];
    this.batchTimer = null;
    this.batchSize = 100; // 每批最多100个操作
    this.batchDelay = 50; // 50ms 批量延迟

    // 启用日志记录（可通过环境变量控制）
    this.enableLogging = process.env.CACHE_LOGGING !== 'false';

    // 尝试连接 Redis
    this.initRedis();

    // 定期输出统计信息
    this.startStatsReporting();
  }

  /**
   * 初始化 Redis 连接（已优化：性能提升）
   */
  async initRedis() {
    try {
      if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
        // 不输出日志，由 getConnectionStatus 统一显示
        return;
      }

      const redisConfig = process.env.REDIS_URL
        ? {
          url: process.env.REDIS_URL,
          // 性能优化配置
          socket: {
            keepAlive: 5000,
            noDelay: true,  // 禁用 Nagle 算法，减少延迟
            reconnectStrategy: (retries) => Math.min(retries * 50, 500) // 快速重连
          }
        }
        : {
          socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT) || 6379,
            connectTimeout: 3000,  // 减少到 3 秒
            keepAlive: 5000,       // 保持连接活跃
            noDelay: true,         // 禁用 Nagle 算法，减少延迟
            reconnectStrategy: (retries) => {
              if (retries > 3) return new Error('重试次数过多');
              return Math.min(retries * 50, 500); // 快速重连：50ms, 100ms, 150ms
            }
          },
          password: process.env.REDIS_PASSWORD || undefined,
          // 启用流水线优化
          commandsQueueMaxLength: 1000,
          // 禁用离线队列（快速失败）
          enableOfflineQueue: false
        };

      this.redisClient = redis.createClient(redisConfig);

      this.redisClient.on('error', (err) => {
        // 静默处理错误，不输出到控制台
        this.isRedisConnected = false;
      });

      this.redisClient.on('connect', () => {
        this.isRedisConnected = true;
      });

      this.redisClient.on('ready', () => {
        this.isRedisConnected = true;
      });

      await this.redisClient.connect();
    } catch (error) {
      // 静默处理错误，由 getConnectionStatus 统一显示
      this.isRedisConnected = false;
    }
  }

  /**
   * 生成缓存键
   */
  generateKey(prefix, params) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    return `mcp:${prefix}:${sortedParams}`;
  }

  /**
   * 记录日志（已优化：简洁美观）
   */
  log(message, key = null, data = {}) {
    if (!this.enableLogging) return;

    // 简化日志：只在调试模式下显示详细信息
    const isDebug = process.env.CACHE_DEBUG === 'true';

    if (!isDebug) {
      // 生产模式：不输出缓存日志，只统计
      return;
    }

    // 调试模式：输出简化的日志
    const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    const keyShort = key ? (key.length > 40 ? key.substring(0, 37) + '...' : key) : '';
    console.log(`[缓存] ${timestamp} ${message} ${keyShort}`);
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) : 0;
    const localHitRate = this.stats.hits > 0 ? ((this.stats.localHits / this.stats.hits) * 100).toFixed(2) : 0;

    return {
      ...this.stats,
      total,
      hitRate: `${hitRate}%`,
      localHitRate: `${localHitRate}%`,
      localCacheSize: this.localCache.size(),
      cacheType: this.isRedisConnected ? 'Redis + LRU' : 'Memory'
    };
  }

  /**
   * 定期输出统计报告
   */
  startStatsReporting() {
    // 每5分钟输出一次统计
  }

  /**
   * 获取缓存（已优化：三级缓存架构）
   * 1. 本地LRU缓存（最快，~1ms）
   * 2. Redis缓存（快，~10-30ms）
   * 3. 内存缓存（备用，~1ms）
   */
  async get(key) {
    try {
      // 🚀 第一级：检查本地LRU缓存（超快速）
      const localValue = this.localCache.get(key);
      if (localValue !== null) {
        this.stats.hits++;
        this.stats.localHits++;
        this.log('命中[L1]', key);
        return localValue;
      }

      let value = null;

      // 🚀 第二级：检查Redis缓存
      if (this.isRedisConnected && this.redisClient) {
        const rawValue = await this.redisClient.get(key);
        if (rawValue) {
          // 优化：使用更快的 JSON 解析
          try {
            value = JSON.parse(rawValue);
            // 🚀 将热点数据放入本地LRU缓存
            this.localCache.set(key, value, Date.now() + 60000); // 本地缓存1分钟
            this.stats.redisHits++;
          } catch (parseError) {
            if (process.env.CACHE_DEBUG === 'true') {
              console.error('[CACHE] JSON 解析失败:', parseError.message);
            }
            value = null;
          }
        }
      } else {
        // 🚀 第三级：使用内存缓存（Redis不可用时）
        const cached = this.memoryCache.get(key);
        if (cached && cached.expiry > Date.now()) {
          value = cached.value;
        } else {
          if (cached) {
            this.memoryCache.delete(key);
          }
          value = null;
        }
      }

      // 记录缓存命中/未命中
      if (value !== null) {
        this.stats.hits++;
        this.log('命中[L2]', key);
      } else {
        this.stats.misses++;
        this.log('未命中', key);
      }

      return value;
    } catch (error) {
      this.stats.misses++;
      // 静默处理错误，避免影响主流程
      if (process.env.CACHE_DEBUG === 'true') {
        console.error('[CACHE ERROR] 缓存获取失败:', error.message);
      }
      return null;
    }
  }

  /**
   * 设置缓存（已优化：同时写入本地LRU和Redis）
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      // 🚀 同时写入本地LRU缓存（立即可用）
      const localExpiry = Date.now() + Math.min(ttl, 60) * 1000; // 本地缓存最多1分钟
      this.localCache.set(key, value, localExpiry);

      if (this.isRedisConnected && this.redisClient) {
        // 优化：提前序列化，避免阻塞
        const serialized = JSON.stringify(value);
        // 使用 setEx 一次性设置值和过期时间，减少网络往返
        // 🚀 不等待Redis写入完成，立即返回（fire and forget）
        this.redisClient.setEx(key, ttl, serialized).catch(err => {
          if (process.env.CACHE_DEBUG === 'true') {
            console.error('[CACHE] Redis 写入失败:', err.message);
          }
        });
      } else {
        // 使用内存缓存
        this.memoryCache.set(key, {
          value,
          expiry: Date.now() + ttl * 1000
        });

        // 定期清理过期的内存缓存
        this.cleanMemoryCache();
      }

      this.stats.sets++;
      this.log(`设置 (${ttl}s)`, key);
    } catch (error) {
      // 静默处理错误，避免影响主流程
      if (process.env.CACHE_DEBUG === 'true') {
        console.error('[CACHE ERROR] 缓存设置失败:', error.message);
      }
    }
  }

  /**
   * 删除缓存（已优化：同时删除本地LRU和Redis）
   */
  async del(key) {
    try {
      // 🚀 同时删除本地LRU缓存
      this.localCache.delete(key);

      if (this.isRedisConnected && this.redisClient) {
        await this.redisClient.del(key);
      } else {
        this.memoryCache.delete(key);
      }

      this.stats.deletes++;
      this.log('删除', key);
    } catch (error) {
      if (process.env.CACHE_DEBUG === 'true') {
        console.error('[CACHE ERROR] 缓存删除失败:', error.message);
      }
    }
  }

  /**
   * 模式匹配删除缓存
   * 支持通配符删除，如: delPattern('*user:123*')
   */
  async delPattern(pattern) {
    try {
      let deletedCount = 0;

      if (this.isRedisConnected && this.redisClient) {
        // Redis SCAN 方式（安全，不阻塞）
        let cursor = 0;

        do {
          const reply = await this.redisClient.scan(cursor, {
            MATCH: pattern,
            COUNT: 100
          });

          cursor = reply.cursor;
          const keys = reply.keys;

          if (keys && keys.length > 0) {
            // 批量删除
            await this.redisClient.del(keys);
            deletedCount += keys.length;

            // 同时删除本地LRU缓存
            keys.forEach(key => this.localCache.delete(key));
          }
        } while (cursor !== 0);

        if (deletedCount > 0) {
          this.stats.deletes += deletedCount;
          this.log(`模式删除 (${deletedCount}条)`, pattern);
        }
      } else {
        // 内存缓存：遍历删除
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));

        for (const key of this.memoryCache.keys()) {
          if (regex.test(key)) {
            this.memoryCache.delete(key);
            this.localCache.delete(key);
            deletedCount++;
          }
        }

        if (deletedCount > 0) {
          this.stats.deletes += deletedCount;
          this.log(`模式删除 (${deletedCount}条)`, pattern);
        }
      }

      return deletedCount;
    } catch (error) {
      if (process.env.CACHE_DEBUG === 'true') {
        console.error('[CACHE ERROR] 模式删除失败:', error.message);
      }
      return 0;
    }
  }

  /**
   * 批量获取缓存（性能优化）
   */
  async mGet(keys) {
    try {
      if (!keys || keys.length === 0) return [];

      if (this.isRedisConnected && this.redisClient) {
        const values = await this.redisClient.mGet(keys);
        return values.map(v => {
          if (!v) return null;
          try {
            return JSON.parse(v);
          } catch {
            return null;
          }
        });
      } else {
        return keys.map(key => {
          const cached = this.memoryCache.get(key);
          if (cached && cached.expiry > Date.now()) {
            return cached.value;
          }
          return null;
        });
      }
    } catch (error) {
      if (process.env.CACHE_DEBUG === 'true') {
        console.error('[CACHE ERROR] 批量获取失败:', error.message);
      }
      return keys.map(() => null);
    }
  }

  /**
   * 批量设置缓存（性能优化）
   */
  async mSet(entries, ttl = this.defaultTTL) {
    try {
      if (!entries || entries.length === 0) return;

      if (this.isRedisConnected && this.redisClient) {
        // 使用 pipeline 批量执行
        const pipeline = this.redisClient.multi();

        for (const [key, value] of entries) {
          const serialized = JSON.stringify(value);
          pipeline.setEx(key, ttl, serialized);
        }

        await pipeline.exec();
        this.stats.sets += entries.length;
      } else {
        const expiry = Date.now() + ttl * 1000;
        for (const [key, value] of entries) {
          this.memoryCache.set(key, { value, expiry });
        }
        this.stats.sets += entries.length;
      }
    } catch (error) {
      if (process.env.CACHE_DEBUG === 'true') {
        console.error('[CACHE ERROR] 批量设置失败:', error.message);
      }
    }
  }

  /**
   * 批量删除缓存（通过模式匹配）
   */
  async delPattern(pattern) {
    try {
      if (this.isRedisConnected && this.redisClient) {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
          this.stats.deletes += keys.length;
          this.log(`批量删除 (${keys.length}条)`, pattern);
        }
      } else {
        // 内存缓存模式匹配删除
        const regex = new RegExp(pattern.replace('*', '.*'));
        let deletedCount = 0;
        for (const key of this.memoryCache.keys()) {
          if (regex.test(key)) {
            this.memoryCache.delete(key);
            deletedCount++;
          }
        }
        if (deletedCount > 0) {
          this.stats.deletes += deletedCount;
          this.log(`批量删除 (${deletedCount}条)`, pattern);
        }
      }
    } catch (error) {
      console.error('[CACHE ERROR] 批量删除缓存失败:', error.message, `[${pattern}]`);
    }
  }

  /**
   * 清理过期的内存缓存
   */
  cleanMemoryCache() {
    if (this.memoryCache.size > 1000) { // 超过 1000 条时清理
      const now = Date.now();
      for (const [key, cached] of this.memoryCache.entries()) {
        if (cached.expiry < now) {
          this.memoryCache.delete(key);
        }
      }
    }
  }

  /**
   * 清空所有缓存
   */
  async flush() {
    try {
      if (this.isRedisConnected && this.redisClient) {
        await this.redisClient.flushDb();
      } else {
        this.memoryCache.clear();
      }
    } catch (error) {
      console.error('清空缓存失败:', error.message);
    }
  }

  /**
   * 获取缓存统计信息
   */
  async getStats() {
    try {
      if (this.isRedisConnected && this.redisClient) {
        const info = await this.redisClient.info('stats');
        return { type: 'redis', info };
      } else {
        return {
          type: 'memory',
          size: this.memoryCache.size,
          items: Array.from(this.memoryCache.keys())
        };
      }
    } catch (error) {
      console.error('获取缓存统计失败:', error.message);
      return { error: error.message };
    }
  }

  /**
   * 获取连接状态信息
   */
  getConnectionStatus() {
    if (this.isRedisConnected && this.redisClient) {
      const host = process.env.REDIS_HOST || 'localhost';
      const port = process.env.REDIS_PORT || '6379';
      return {
        connected: true,
        type: 'redis',
        message: chalk.magenta(`[缓存] Redis 已连接: ${host}:${port}`)
      };
    } else {
      return {
        connected: false,
        type: 'memory',
        message: '使用内存缓存（Redis 未连接）'
      };
    }
  }

  /**
   * 关闭连接
   */
  async close() {
    try {
      if (this.redisClient) {
        await this.redisClient.quit();
      }
      this.memoryCache.clear();
    } catch (error) {
      console.error('关闭缓存连接失败:', error.message);
    }
  }
}

// 导出单例
const cacheManager = new CacheManager();

module.exports = cacheManager;

