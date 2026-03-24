/**
 * useTableLocalPagination - 本地分页/静态数据模式 composable
 * 首次查询获取全量数据后，后续翻页在前端进行
 * @author AI Assistant
 * @version 1.0.0
 * @since 2025-12-29
 */
import { ref, computed, shallowRef, type Ref, type ComputedRef } from 'vue';

export interface LocalPaginationOptions<T = any> {
  /** 每页条数 */
  pageSize?: number;
  /** 初始页码 */
  initialPage?: number;
  /** 数据获取函数 */
  fetchData?: () => Promise<T[]>;
  /** 是否启用 */
  enabled?: boolean;
}

export interface LocalPaginationReturn<T = any> {
  /** 全量数据（原始数据） */
  fullData: Ref<T[]>;
  /** 当前页数据 */
  pageData: ComputedRef<T[]>;
  /** 当前页码 */
  currentPage: Ref<number>;
  /** 每页条数 */
  pageSize: Ref<number>;
  /** 总条数 */
  total: ComputedRef<number>;
  /** 总页数 */
  totalPages: ComputedRef<number>;
  /** 是否启用本地分页 */
  isEnabled: Ref<boolean>;
  /** 是否正在加载 */
  isLoading: Ref<boolean>;
  /** 是否已加载数据 */
  isLoaded: Ref<boolean>;
  /** 设置全量数据 */
  setFullData: (data: T[]) => void;
  /** 追加数据（用于增量加载场景） */
  appendData: (data: T[]) => void;
  /** 清空数据 */
  clearData: () => void;
  /** 跳转到指定页 */
  goToPage: (page: number) => void;
  /** 上一页 */
  prevPage: () => void;
  /** 下一页 */
  nextPage: () => void;
  /** 刷新数据（重新获取） */
  refresh: () => Promise<void>;
  /** 重置分页（回到第一页） */
  resetPagination: () => void;
  /** 本地搜索/过滤 */
  filterData: (predicate: (item: T) => boolean) => void;
  /** 清除过滤 */
  clearFilter: () => void;
  /** 本地排序 */
  sortData: (compareFn: (a: T, b: T) => number) => void;
  /** 获取指定页数据（不改变当前页） */
  getPageData: (page: number) => T[];
}

/**
 * 本地分页/静态数据模式 composable
 * @param options 配置选项
 * @returns LocalPaginationReturn
 */
export function useTableLocalPagination<T = any>(
  options: LocalPaginationOptions<T> = {}
): LocalPaginationReturn<T> {
  const {
    pageSize: initialPageSize = 10,
    initialPage = 1,
    fetchData,
    enabled = true,
  } = options;

  // 使用 shallowRef 优化大数据性能
  const fullData = shallowRef<T[]>([]);
  const filteredData = shallowRef<T[]>([]);
  const currentPage = ref(initialPage);
  const pageSize = ref(initialPageSize);
  const isEnabled = ref(enabled);
  const isLoading = ref(false);
  const isLoaded = ref(false);
  const isFiltered = ref(false);

  /**
   * 获取当前使用的数据源（过滤后或原始数据）
   */
  const activeData = computed(() => {
    return isFiltered.value ? filteredData.value : fullData.value;
  });

  /**
   * 总条数
   */
  const total = computed(() => activeData.value.length);

  /**
   * 总页数
   */
  const totalPages = computed(() => {
    return Math.ceil(total.value / pageSize.value) || 1;
  });

  /**
   * 当前页数据
   */
  const pageData = computed(() => {
    if (!isEnabled.value) return activeData.value;
    
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return activeData.value.slice(start, end);
  });

  /**
   * 获取指定页数据
   */
  const getPageData = (page: number): T[] => {
    const validPage = Math.max(1, Math.min(page, totalPages.value));
    const start = (validPage - 1) * pageSize.value;
    const end = start + pageSize.value;
    return activeData.value.slice(start, end);
  };

  /**
   * 设置全量数据
   */
  const setFullData = (data: T[]) => {
    fullData.value = data;
    isLoaded.value = true;
    // 重置过滤状态
    isFiltered.value = false;
    filteredData.value = [];
    // 确保当前页有效
    if (currentPage.value > totalPages.value) {
      currentPage.value = Math.max(1, totalPages.value);
    }
  };

  /**
   * 追加数据
   */
  const appendData = (data: T[]) => {
    fullData.value = [...fullData.value, ...data];
  };

  /**
   * 清空数据
   */
  const clearData = () => {
    fullData.value = [];
    filteredData.value = [];
    isLoaded.value = false;
    isFiltered.value = false;
    currentPage.value = 1;
  };

  /**
   * 跳转到指定页
   */
  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages.value));
    currentPage.value = validPage;
  };

  /**
   * 上一页
   */
  const prevPage = () => {
    if (currentPage.value > 1) {
      currentPage.value--;
    }
  };

  /**
   * 下一页
   */
  const nextPage = () => {
    if (currentPage.value < totalPages.value) {
      currentPage.value++;
    }
  };

  /**
   * 刷新数据
   */
  const refresh = async () => {
    if (!fetchData) {
      console.warn('[useTableLocalPagination] fetchData 函数未提供，无法刷新');
      return;
    }

    isLoading.value = true;
    try {
      const data = await fetchData();
      setFullData(data);
    } catch (error) {
      console.error('[useTableLocalPagination] 数据加载失败:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 重置分页
   */
  const resetPagination = () => {
    currentPage.value = 1;
    isFiltered.value = false;
    filteredData.value = [];
  };

  /**
   * 本地过滤
   */
  const filterData = (predicate: (item: T) => boolean) => {
    filteredData.value = fullData.value.filter(predicate);
    isFiltered.value = true;
    // 过滤后回到第一页
    currentPage.value = 1;
  };

  /**
   * 清除过滤
   */
  const clearFilter = () => {
    isFiltered.value = false;
    filteredData.value = [];
    currentPage.value = 1;
  };

  /**
   * 本地排序
   */
  const sortData = (compareFn: (a: T, b: T) => number) => {
    if (isFiltered.value) {
      filteredData.value = [...filteredData.value].sort(compareFn);
    } else {
      fullData.value = [...fullData.value].sort(compareFn);
    }
  };

  return {
    fullData,
    pageData,
    currentPage,
    pageSize,
    total,
    totalPages,
    isEnabled,
    isLoading,
    isLoaded,
    setFullData,
    appendData,
    clearData,
    goToPage,
    prevPage,
    nextPage,
    refresh,
    resetPagination,
    filterData,
    clearFilter,
    sortData,
    getPageData,
  };
}

export default useTableLocalPagination;
