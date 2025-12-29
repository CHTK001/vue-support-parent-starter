/**
 * ScTable 缓存管理 Composable
 * 解决内存泄漏问题，统一管理数据缓存
 */
import { ref, computed, onUnmounted } from 'vue';

// 使用 WeakMap 存储组件实例相关缓存，便于 GC
const CACHE_REGISTRY = new Map<string, Map<number, any[]>>();

export interface UseTableCacheOptions {
  /** 缓存命名空间（tableId 或 tableName） */
  namespace: string;
  /** 是否启用缓存 */
  enabled: boolean;
  /** 缓存页数 */
  pageCount: number;
}

export function useTableCache(options: UseTableCacheOptions) {
  const { namespace, enabled, pageCount } = options;
  
  // 响应式配置
  const cacheEnabled = ref(enabled);
  const cachePageCount = ref(pageCount);
  
  // 获取命名空间缓存
  const getNamespaceCache = (): Map<number, any[]> => {
    if (!CACHE_REGISTRY.has(namespace)) {
      CACHE_REGISTRY.set(namespace, new Map());
    }
    return CACHE_REGISTRY.get(namespace)!;
  };
  
  // 获取缓存数据
  const getCachedData = (page: number): any[] | undefined => {
    if (!cacheEnabled.value) return undefined;
    return getNamespaceCache().get(page);
  };
  
  // 设置缓存数据
  const setCachedData = (page: number, data: any[]) => {
    if (!cacheEnabled.value) return;
    
    const cache = getNamespaceCache();
    cache.set(page, data);
    
    // 清理超出范围的缓存（保留当前页前后各 cachePageCount 页）
    const minPage = Math.max(1, page - cachePageCount.value);
    const maxPage = page + cachePageCount.value;
    
    for (const [cachedPage] of cache) {
      if (cachedPage < minPage || cachedPage > maxPage) {
        cache.delete(cachedPage);
      }
    }
  };
  
  // 批量设置缓存（预取多页）
  const setBatchCachedData = (startPage: number, allData: any[], pageSize: number) => {
    if (!cacheEnabled.value) return;
    
    const cache = getNamespaceCache();
    const totalPages = Math.ceil(allData.length / pageSize);
    
    for (let i = 0; i < totalPages && i < cachePageCount.value; i++) {
      const pageNo = startPage + i;
      const start = i * pageSize;
      const end = start + pageSize;
      const pageData = allData.slice(start, end);
      
      if (pageData.length > 0) {
        cache.set(pageNo, pageData);
      }
    }
  };
  
  // 检查是否命中缓存
  const hasCachedData = (page: number): boolean => {
    if (!cacheEnabled.value) return false;
    return getNamespaceCache().has(page);
  };
  
  // 清除命名空间缓存
  const clearCache = () => {
    CACHE_REGISTRY.delete(namespace);
  };
  
  // 清除所有缓存
  const clearAllCache = () => {
    CACHE_REGISTRY.clear();
  };
  
  // 获取缓存大小
  const getCacheSize = (): number => {
    return getNamespaceCache().size;
  };
  
  // 更新缓存配置
  const updateCacheConfig = (config: { enabled?: boolean; pageCount?: number }) => {
    if (config.enabled !== undefined) {
      cacheEnabled.value = config.enabled;
      if (!config.enabled) {
        clearCache();
      }
    }
    if (config.pageCount !== undefined) {
      cachePageCount.value = config.pageCount;
    }
  };
  
  // 组件卸载时清理缓存（解决内存泄漏）
  onUnmounted(() => {
    clearCache();
  });
  
  return {
    // 状态
    cacheEnabled,
    cachePageCount,
    // 方法
    getCachedData,
    setCachedData,
    setBatchCachedData,
    hasCachedData,
    clearCache,
    clearAllCache,
    getCacheSize,
    updateCacheConfig,
  };
}

// 导出缓存注册表（用于调试）
export const getCacheRegistry = () => CACHE_REGISTRY;
