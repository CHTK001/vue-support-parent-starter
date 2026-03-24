/**
 * ScTable 缓存管理 Composable
 * 解决内存泄漏问题，统一管理数据缓存
 * 支持 LRU 淘汰和自动过期
 */
import { ref, computed, onUnmounted } from 'vue';

/** 缓存项接口 */
export interface CacheItem<T = any[]> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccess: number;
}

/** 缓存配置 */
export interface UseTableCacheOptions {
  /** 缓存存储键 */
  storageKey: string;
  /** 最大缓存页数，超出后使用 LRU 策略淘汰 */
  maxCachePages?: number;
  /** 缓存过期时间（毫秒），0 表示不过期 */
  cacheExpiry?: number;
  /** 是否启用访问统计 */
  enableStats?: boolean;
}

/** 缓存统计信息 */
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalSize: number;
  oldestEntry: number | null;
  newestEntry: number | null;
}

// 全局缓存注册表 - 使用 Map 存储每个命名空间的缓存
const CACHE_REGISTRY = new Map<string, Map<number, CacheItem>>();

// 缓存统计
const CACHE_STATS = new Map<string, { hits: number; misses: number }>();

// 定期清理过期缓存的间隔（60秒）
const CLEANUP_INTERVAL = 60 * 1000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;
let activeInstances = 0;

/**
 * 启动全局缓存清理定时器
 */
const startCleanupTimer = () => {
  if (cleanupTimer) return;
  
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    
    CACHE_REGISTRY.forEach((cache, namespace) => {
      // 检查并清理过期的缓存项
      cache.forEach((item, page) => {
        // 默认 5 分钟过期
        if (now - item.timestamp > 5 * 60 * 1000) {
          cache.delete(page);
        }
      });
      
      // 如果命名空间为空，删除整个命名空间
      if (cache.size === 0) {
        CACHE_REGISTRY.delete(namespace);
        CACHE_STATS.delete(namespace);
      }
    });
  }, CLEANUP_INTERVAL);
};

/**
 * 停止全局缓存清理定时器
 */
const stopCleanupTimer = () => {
  if (cleanupTimer && activeInstances === 0) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
};

/**
 * ScTable 缓存管理 Composable
 */
export function useTableCache(options: UseTableCacheOptions) {
  const { 
    storageKey,
    maxCachePages = 10,
    cacheExpiry = 5 * 60 * 1000, // 默认 5 分钟
    enableStats = false,
  } = options;
  
  // 组件实例计数
  activeInstances++;
  startCleanupTimer();
  
  // 初始化统计
  if (enableStats && !CACHE_STATS.has(storageKey)) {
    CACHE_STATS.set(storageKey, { hits: 0, misses: 0 });
  }
  
  /**
   * 获取命名空间缓存
   */
  const getNamespaceCache = (): Map<number, CacheItem> => {
    if (!CACHE_REGISTRY.has(storageKey)) {
      CACHE_REGISTRY.set(storageKey, new Map());
    }
    return CACHE_REGISTRY.get(storageKey)!;
  };
  
  /**
   * 检查缓存项是否过期
   */
  const isExpired = (item: CacheItem): boolean => {
    if (cacheExpiry === 0) return false;
    return Date.now() - item.timestamp > cacheExpiry;
  };
  
  /**
   * LRU 淘汰 - 删除最久未访问的项
   */
  const evictLRU = (cache: Map<number, CacheItem>): void => {
    if (cache.size <= maxCachePages) return;
    
    let oldestPage = -1;
    let oldestAccess = Infinity;
    
    cache.forEach((item, page) => {
      if (item.lastAccess < oldestAccess) {
        oldestAccess = item.lastAccess;
        oldestPage = page;
      }
    });
    
    if (oldestPage !== -1) {
      cache.delete(oldestPage);
    }
  };
  
  /**
   * 获取缓存数据
   */
  const getCache = (page: number): any[] | undefined => {
    const cache = getNamespaceCache();
    const item = cache.get(page);
    
    if (!item) {
      if (enableStats) {
        const stats = CACHE_STATS.get(storageKey);
        if (stats) stats.misses++;
      }
      return undefined;
    }
    
    // 检查过期
    if (isExpired(item)) {
      cache.delete(page);
      if (enableStats) {
        const stats = CACHE_STATS.get(storageKey);
        if (stats) stats.misses++;
      }
      return undefined;
    }
    
    // 更新访问信息
    item.accessCount++;
    item.lastAccess = Date.now();
    
    if (enableStats) {
      const stats = CACHE_STATS.get(storageKey);
      if (stats) stats.hits++;
    }
    
    return item.data;
  };
  
  /**
   * 设置缓存数据
   */
  const setCache = (page: number, data: any[]): void => {
    const cache = getNamespaceCache();
    const now = Date.now();
    
    // LRU 淘汰
    evictLRU(cache);
    
    cache.set(page, {
      data,
      timestamp: now,
      accessCount: 1,
      lastAccess: now,
    });
  };
  
  /**
   * 检查是否有缓存
   */
  const hasCache = (page: number): boolean => {
    const cache = getNamespaceCache();
    const item = cache.get(page);
    
    if (!item) return false;
    if (isExpired(item)) {
      cache.delete(page);
      return false;
    }
    
    return true;
  };
  
  /**
   * 清除命名空间缓存
   */
  const clearCache = (): void => {
    CACHE_REGISTRY.delete(storageKey);
    CACHE_STATS.delete(storageKey);
  };
  
  /**
   * 清除所有缓存
   */
  const clearAllCache = (): void => {
    CACHE_REGISTRY.clear();
    CACHE_STATS.clear();
  };
  
  /**
   * 获取缓存大小
   */
  const getCacheSize = (): number => {
    return getNamespaceCache().size;
  };
  
  /**
   * 获取缓存统计信息
   */
  const getStats = (): CacheStats => {
    const cache = getNamespaceCache();
    const stats = CACHE_STATS.get(storageKey) || { hits: 0, misses: 0 };
    
    let oldestEntry: number | null = null;
    let newestEntry: number | null = null;
    let oldestTime = Infinity;
    let newestTime = 0;
    
    cache.forEach((item, page) => {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestEntry = page;
      }
      if (item.timestamp > newestTime) {
        newestTime = item.timestamp;
        newestEntry = page;
      }
    });
    
    const total = stats.hits + stats.misses;
    
    return {
      hits: stats.hits,
      misses: stats.misses,
      hitRate: total > 0 ? Math.round((stats.hits / total) * 100) : 0,
      totalSize: cache.size,
      oldestEntry,
      newestEntry,
    };
  };
  
  /**
   * 清理过期缓存
   */
  const cleanupExpired = (): number => {
    const cache = getNamespaceCache();
    let cleaned = 0;
    
    cache.forEach((item, page) => {
      if (isExpired(item)) {
        cache.delete(page);
        cleaned++;
      }
    });
    
    return cleaned;
  };
  
  // 组件卸载时清理
  onUnmounted(() => {
    clearCache();
    activeInstances--;
    stopCleanupTimer();
  });
  
  return {
    // 方法
    getCache,
    setCache,
    hasCache,
    clearCache,
    clearAllCache,
    getCacheSize,
    getStats,
    cleanupExpired,
  };
}

/**
 * 获取缓存注册表（用于调试）
 */
export const getCacheRegistry = () => CACHE_REGISTRY;

/**
 * 获取全局缓存统计
 */
export const getGlobalCacheStats = () => {
  const stats: Record<string, CacheStats & { namespace: string }> = {};
  
  CACHE_REGISTRY.forEach((cache, namespace) => {
    const nsStats = CACHE_STATS.get(namespace) || { hits: 0, misses: 0 };
    const total = nsStats.hits + nsStats.misses;
    
    stats[namespace] = {
      namespace,
      hits: nsStats.hits,
      misses: nsStats.misses,
      hitRate: total > 0 ? Math.round((nsStats.hits / total) * 100) : 0,
      totalSize: cache.size,
      oldestEntry: null,
      newestEntry: null,
    };
  });
  
  return stats;
};
