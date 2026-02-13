/**
 * 数据压缩助手
 * 减少缓存内存占用和网络传输
 */

const zlib = require('zlib');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);
const brotliCompress = promisify(zlib.brotliCompress);
const brotliDecompress = promisify(zlib.brotliDecompress);

class CompressionHelper {
  constructor() {
    // 压缩阈值：大于1KB才压缩
    this.compressionThreshold = 1024;
    // 使用Brotli（更好的压缩率）
    this.useBrotli = true;
    // 压缩统计
    this.stats = {
      compressed: 0,
      decompressed: 0,
      savedBytes: 0
    };
  }
  
  /**
   * 压缩数据
   */
  async compress(data) {
    if (!data) return null;
    
    try {
      const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
      const originalSize = Buffer.byteLength(jsonString, 'utf8');
      
      // 小于阈值不压缩
      if (originalSize < this.compressionThreshold) {
        return {
          compressed: false,
          data: jsonString
        };
      }
      
      const buffer = Buffer.from(jsonString, 'utf8');
      const compressed = this.useBrotli 
        ? await brotliCompress(buffer, {
            params: {
              [zlib.constants.BROTLI_PARAM_QUALITY]: 4  // 快速压缩
            }
          })
        : await gzip(buffer);
      
      const compressedSize = compressed.length;
      this.stats.compressed++;
      this.stats.savedBytes += (originalSize - compressedSize);
      
      if (process.env.CACHE_DEBUG === 'true') {
        const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
        console.log(`[压缩] ${originalSize}B → ${compressedSize}B (节省 ${ratio}%)`);
      }
      
      return {
        compressed: true,
        data: compressed.toString('base64'),
        algorithm: this.useBrotli ? 'brotli' : 'gzip'
      };
    } catch (error) {
      console.error('[压缩] 压缩失败:', error.message);
      return {
        compressed: false,
        data: typeof data === 'string' ? data : JSON.stringify(data)
      };
    }
  }
  
  /**
   * 解压数据
   */
  async decompress(compressedData) {
    if (!compressedData) return null;
    
    try {
      // 未压缩的数据直接返回
      if (!compressedData.compressed) {
        return typeof compressedData.data === 'string' 
          ? JSON.parse(compressedData.data)
          : compressedData.data;
      }
      
      const buffer = Buffer.from(compressedData.data, 'base64');
      const decompressed = compressedData.algorithm === 'brotli'
        ? await brotliDecompress(buffer)
        : await gunzip(buffer);
      
      this.stats.decompressed++;
      
      return JSON.parse(decompressed.toString('utf8'));
    } catch (error) {
      console.error('[压缩] 解压失败:', error.message);
      return null;
    }
  }
  
  /**
   * 智能压缩：自动判断是否需要压缩
   */
  async smartCompress(data) {
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
    const size = Buffer.byteLength(jsonString, 'utf8');
    
    // 大于阈值才压缩
    if (size > this.compressionThreshold) {
      return await this.compress(data);
    }
    
    return {
      compressed: false,
      data: jsonString
    };
  }
  
  /**
   * 获取统计信息
   */
  getStats() {
    return {
      ...this.stats,
      savedKB: (this.stats.savedBytes / 1024).toFixed(2),
      savedMB: (this.stats.savedBytes / 1024 / 1024).toFixed(2)
    };
  }
}

// 导出单例
const compressionHelper = new CompressionHelper();

module.exports = compressionHelper;

