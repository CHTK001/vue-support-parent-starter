/**
 * useTablePrefetch - 表格数据预加载 composable
 * 访问当前页时后台预加载下N页数据
 * @author AI Assistant
 * @version 1.0.0
 * @since 2025-12-29
 */
import { ref, watch, onUnmounted, type Ref } from 'vue';

export interface PrefetchOptions {
  /** 是否启用预加载 */
  enabled?: boolean;
  /** 预加载页数（当前页后的N页） */
  prefetchCount?: number;
  /** 预加载延迟（毫秒），避免快速翻页时的不必要请求 */
  delay?: number;
  /** 缓存过期时间（毫秒），0表示不过期 */
  cacheExpiry?: number;
  /** 最大缓存页数 */
  maxCachePages?: number;
}

export interface PageData<T = any> {
  data: T[];
  total: number;
  timestamp: number;
}

export interface FetchParams {
  page: number;
  pageSize: number;
  [key: string]: any;
}

export interface PrefetchReturn<T = any> {
  /** 是否启用 */
  isEnabled: Ref<boolean>;
  /** 预加载页数 */
  prefetchCount: Ref<number>;
  /** 正在预加载的页码集合 */
  prefetchingPages: Ref<Set<number>>;
  /** 初始化预加载（设置数据获取函数） */
  initPrefetch: (fetchFn: (params: FetchParams) => Promise<{ data: T[]; total: number }>) => void;
  /** 获取页面数据（优先从缓存获取） */
  getPageData: (page: number, pageSize: number, params?: Record<string, any>) => Promise<PageData<T> | null>;
  /** 触发预加载 */
  triggerPrefetch: (currentPage: number, pageSize: number, total: number, params?: Record<string, any>) => void;
  /** 检查缓存是否命中 */
  hasCache: (page: number) => boolean;
  /** 获取缓存数据 */
  getCacheData: (page: number) => PageData<T> | null;
  /** 设置缓存数据 */
  setCacheData: (page: number, data: PageData<T>) => void;
  /** 清空缓存 */
  clearCache: () => void;
  /** 清除指定页缓存 */
  removeCachePage: (page: number) => void;
  /** 切换启用状态 */
  toggleEnabled: (value?: boolean) => void;
  /** 获取缓存统计 */
  getCacheStats: () => { size: number; pages: number[] };
}

/**
 * 表格数据预加载 composable
 * @param options 配置选项
 * @returns PrefetchReturn
 */
export function useTablePrefetch<T = any>(options: PrefetchOptions = {}): PrefetchReturn<T> {
  const {
    enabled = true,
    prefetchCount: initialPrefetchCount = 3,
    delay = 300,
    cacheExpiry = 5 * 60 * 1000, // 5分钟
    maxCachePages = 10,
  } = options;

  const isEnabled = ref(enabled);
  const prefetchCount = ref(initialPrefetchCount);
  const prefetchingPages = ref<Set<number>>(new Set());
  
  // 缓存存储
  const cache = new Map<number, PageData<T>>();
  
  // 数据获取函数
  let fetchDataFn: ((params: FetchParams) => Promise<{ data: T[]; total: number }>) | null = null;
  
  // 预加载定时器
  let prefetchTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * 初始化预加载
   */
  const initPrefetch = (
    fetchFn: (params: FetchParams) => Promise<{ data: T[]; total: number }>
  ) => {
    fetchDataFn = fetchFn;
  };

  /**
   * 检查缓存是否有效
   */
  const isCacheValid = (pageData: PageData<T>): boolean => {
    if (cacheExpiry === 0) return true;
    return Date.now() - pageData.timestamp < cacheExpiry;
  };

  /**
   * 检查缓存是否命中
   */
  const hasCache = (page: number): boolean => {
    const pageData = cache.get(page);
    if (!pageData) return false;
    return isCacheValid(pageData);
  };

  /**
   * 获取缓存数据
   */
  const getCacheData = (page: number): PageData<T> | null => {
    const pageData = cache.get(page);
    if (!pageData || !isCacheValid(pageData)) {
      cache.delete(page);
      return null;
    }
    return pageData;
  };

  /**
   * 设置缓存数据
   */
  const setCacheData = (page: number, data: PageData<T>) => {
    // 检查缓存大小，超出时删除最旧的
    if (cache.size >= maxCachePages) {
      // 找到最旧的缓存页
      let oldestPage = -1;
      let oldestTime = Infinity;
      cache.forEach((value, key) => {
        if (value.timestamp < oldestTime) {
          oldestTime = value.timestamp;
          oldestPage = key;
        }
      });
      if (oldestPage !== -1) {
        cache.delete(oldestPage);
      }
    }
    
    cache.set(page, {
      ...data,
      timestamp: Date.now(),
    });
  };

  /**
   * 清空缓存
   */
  const clearCache = () => {
    cache.clear();
    prefetchingPages.value.clear();
  };

  /**
   * 清除指定页缓存
   */
  const removeCachePage = (page: number) => {
    cache.delete(page);
  };

  /**
   * 获取页面数据（优先从缓存获取）
   */
  const getPageData = async (
    page: number,
    pageSize: number,
    params: Record<string, any> = {}
  ): Promise<PageData<T> | null> => {
    // 优先从缓存获取
    const cachedData = getCacheData(page);
    if (cachedData) {
      return cachedData;
    }

    // 缓存未命中，从服务器获取
    if (!fetchDataFn) {
      console.warn('[useTablePrefetch] fetchDataFn 未初始化');
      return null;
    }

    try {
      const result = await fetchDataFn({ page, pageSize, ...params });
      const pageData: PageData<T> = {
        data: result.data,
        total: result.total,
        timestamp: Date.now(),
      };
      
      // 存入缓存
      setCacheData(page, pageData);
      
      return pageData;
    } catch (error) {
      console.error('[useTablePrefetch] 数据加载失败:', error);
      return null;
    }
  };

  /**
   * 预加载单个页面
   */
  const prefetchPage = async (
    page: number,
    pageSize: number,
    params: Record<string, any> = {}
  ): Promise<void> => {
    // 已有缓存或正在加载，跳过
    if (hasCache(page) || prefetchingPages.value.has(page)) {
      return;
    }

    if (!fetchDataFn) return;

    prefetchingPages.value.add(page);

    try {
      const result = await fetchDataFn({ page, pageSize, ...params });
      const pageData: PageData<T> = {
        data: result.data,
        total: result.total,
        timestamp: Date.now(),
      };
      setCacheData(page, pageData);
    } catch (error) {
      // 预加载失败静默处理，不影响用户操作
      console.debug('[useTablePrefetch] 预加载失败:', page, error);
    } finally {
      prefetchingPages.value.delete(page);
    }
  };

  /**
   * 触发预加载
   */
  const triggerPrefetch = (
    currentPage: number,
    pageSize: number,
    total: number,
    params: Record<string, any> = {}
  ) => {
    if (!isEnabled.value || !fetchDataFn) return;

    // 清除之前的定时器
    if (prefetchTimer) {
      clearTimeout(prefetchTimer);
    }

    // 延迟执行预加载，避免快速翻页时的不必要请求
    prefetchTimer = setTimeout(() => {
      const totalPages = Math.ceil(total / pageSize);
      const pagesToPrefetch: number[] = [];

      // 收集需要预加载的页码
      for (let i = 1; i <= prefetchCount.value; i++) {
        const nextPage = currentPage + i;
        if (nextPage <= totalPages && !hasCache(nextPage)) {
          pagesToPrefetch.push(nextPage);
        }
      }

      // 并行预加载（限制并发数）
      const maxConcurrent = 2;
      let loadingCount = 0;
      
      const loadNext = () => {
        while (loadingCount < maxConcurrent && pagesToPrefetch.length > 0) {
          const page = pagesToPrefetch.shift();
          if (page) {
            loadingCount++;
            prefetchPage(page, pageSize, params).finally(() => {
              loadingCount--;
              loadNext();
            });
          }
        }
      };

      loadNext();
    }, delay);
  };

  /**
   * 切换启用状态
   */
  const toggleEnabled = (value?: boolean) => {
    isEnabled.value = value !== undefined ? value : !isEnabled.value;
    if (!isEnabled.value) {
      // 禁用时清除定时器
      if (prefetchTimer) {
        clearTimeout(prefetchTimer);
        prefetchTimer = null;
      }
    }
  };

  /**
   * 获取缓存统计
   */
  const getCacheStats = () => {
    const pages: number[] = [];
    cache.forEach((_, key) => pages.push(key));
    return {
      size: cache.size,
      pages: pages.sort((a, b) => a - b),
    };
  };

  // 组件卸载时清理
  onUnmounted(() => {
    if (prefetchTimer) {
      clearTimeout(prefetchTimer);
    }
    cache.clear();
    prefetchingPages.value.clear();
  });

  return {
    isEnabled,
    prefetchCount,
    prefetchingPages,
    initPrefetch,
    getPageData,
    triggerPrefetch,
    hasCache,
    getCacheData,
    setCacheData,
    clearCache,
    removeCachePage,
    toggleEnabled,
    getCacheStats,
  };
}

export default useTablePrefetch;
