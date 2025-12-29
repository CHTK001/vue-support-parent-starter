/**
 * ScTable 分页管理 Composable
 * 处理分页逻辑、页码记忆、滚动分页等
 */
import { ref, computed, watch, onUnmounted, nextTick, type Ref } from 'vue';
import { localStorageProxy } from '@repo/utils';

export interface UseTablePaginationOptions {
  /** 存储 key */
  storageKey: string;
  /** 初始页码 */
  initialPage?: number;
  /** 初始每页条数 */
  initialPageSize?: number;
  /** 每页条数选项 */
  pageSizeOptions?: number[];
  /** 是否启用页码记忆 */
  pageMemoryEnabled?: boolean;
  /** 分页类型 */
  paginationType?: 'default' | 'scroll';
  /** 是否自动加载（滚动分页） */
  autoLoad?: boolean;
  /** 加载距离（滚动分页） */
  loadDistance?: number;
  /** 布局类型 */
  layout?: string;
}

export function useTablePagination(options: UseTablePaginationOptions) {
  const {
    storageKey,
    initialPage = 1,
    initialPageSize = 10,
    pageSizeOptions = [10, 20, 30, 50, 100],
    pageMemoryEnabled = false,
    paginationType = 'default',
    autoLoad = true,
    loadDistance = 50,
    layout = 'table',
  } = options;
  
  // 响应式状态
  const currentPage = ref(initialPage);
  const pageSize = ref(initialPageSize);
  const pageSizes = ref(pageSizeOptions);
  const total = ref(0);
  const isLoading = ref(false);
  const memoryEnabled = ref(pageMemoryEnabled);
  
  // IntersectionObserver 引用
  const scrollObserver = ref<IntersectionObserver | null>(null);
  
  // 计算属性
  const totalPages = computed(() => Math.ceil(total.value / pageSize.value));
  const hasMore = computed(() => currentPage.value < totalPages.value);
  const isFirstPage = computed(() => currentPage.value === 1);
  const isLastPage = computed(() => currentPage.value >= totalPages.value);
  
  // 页码记忆存储 key
  const memoryStorageKey = computed(() => `${storageKey}_page_memory`);
  
  // 加载页码记忆
  const loadPageMemory = () => {
    if (!memoryEnabled.value) return;
    
    try {
      const memory = localStorageProxy().getItem(memoryStorageKey.value);
      if (memory?.currentPage && memory.currentPage > 0) {
        currentPage.value = memory.currentPage;
      }
    } catch (error) {
      console.error('加载页码记忆失败:', error);
    }
  };
  
  // 保存页码记忆
  const savePageMemory = () => {
    if (!memoryEnabled.value) return;
    
    try {
      localStorageProxy().setItem(memoryStorageKey.value, {
        currentPage: currentPage.value,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('保存页码记忆失败:', error);
    }
  };
  
  // 清除页码记忆
  const clearPageMemory = () => {
    try {
      localStorageProxy().removeItem(memoryStorageKey.value);
    } catch (error) {
      console.error('清除页码记忆失败:', error);
    }
  };
  
  // 更改当前页
  const setPage = (page: number) => {
    currentPage.value = Math.max(1, Math.min(page, totalPages.value || 1));
    savePageMemory();
  };
  
  // 下一页
  const nextPage = () => {
    if (!isLastPage.value) {
      setPage(currentPage.value + 1);
    }
  };
  
  // 上一页
  const prevPage = () => {
    if (!isFirstPage.value) {
      setPage(currentPage.value - 1);
    }
  };
  
  // 更改每页条数
  const setPageSize = (size: number) => {
    pageSize.value = size;
    currentPage.value = 1;
  };
  
  // 更新总数
  const setTotal = (count: number) => {
    total.value = count;
  };
  
  // 重置分页
  const resetPagination = () => {
    currentPage.value = 1;
    total.value = 0;
  };
  
  // 设置滚动监听（滚动分页）
  const setupScrollObserver = (targetSelector: string, onLoadMore: () => void) => {
    if (paginationType !== 'scroll' || !autoLoad || layout === 'table') return;
    
    removeScrollObserver();
    
    nextTick(() => {
      const target = document.querySelector(targetSelector);
      if (!target) return;
      
      scrollObserver.value = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry.isIntersecting && !isLoading.value && hasMore.value) {
            onLoadMore();
          }
        },
        { rootMargin: `0px 0px ${loadDistance}px 0px` }
      );
      
      scrollObserver.value.observe(target);
    });
  };
  
  // 移除滚动监听
  const removeScrollObserver = () => {
    if (scrollObserver.value) {
      scrollObserver.value.disconnect();
      scrollObserver.value = null;
    }
  };
  
  // 更新配置
  const updateConfig = (config: { pageMemoryEnabled?: boolean }) => {
    if (config.pageMemoryEnabled !== undefined) {
      memoryEnabled.value = config.pageMemoryEnabled;
    }
  };
  
  // 组件卸载时清理
  onUnmounted(() => {
    removeScrollObserver();
  });
  
  return {
    // 状态
    currentPage,
    pageSize,
    pageSizes,
    total,
    isLoading,
    memoryEnabled,
    // 计算属性
    totalPages,
    hasMore,
    isFirstPage,
    isLastPage,
    // 方法
    loadPageMemory,
    savePageMemory,
    clearPageMemory,
    setPage,
    nextPage,
    prevPage,
    setPageSize,
    setTotal,
    resetPagination,
    setupScrollObserver,
    removeScrollObserver,
    updateConfig,
  };
}
