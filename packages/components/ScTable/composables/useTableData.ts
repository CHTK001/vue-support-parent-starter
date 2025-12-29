/**
 * ScTable 数据管理 Composable
 * 处理数据获取、排序、筛选、统计等
 */
import { ref, computed, shallowRef, watch, onUnmounted, type Ref, type ShallowRef } from 'vue';

export interface SortState {
  prop: string;
  order: 'ascending' | 'descending' | null;
}

export interface FilterState {
  [key: string]: any[];
}

export interface StatisticData {
  [key: string]: number | string;
}

export interface UseTableDataOptions<T = any> {
  /** 初始数据 */
  initialData?: T[];
  /** 远程数据获取函数 */
  fetchData?: (params: FetchParams) => Promise<{ data: T[]; total: number }>;
  /** 是否在初始化时自动加载 */
  autoLoad?: boolean;
  /** 数据唯一键 */
  rowKey?: string | ((row: T) => string);
  /** 默认排序 */
  defaultSort?: SortState;
  /** 数据变化回调 */
  onDataChange?: (data: T[]) => void;
  /** 统计数据获取函数 */
  fetchStatistic?: (params: FetchParams) => Promise<StatisticData>;
}

export interface FetchParams {
  page: number;
  pageSize: number;
  sort?: SortState;
  filters?: FilterState;
  searchKeyword?: string;
  [key: string]: any;
}

export function useTableData<T = any>(options: UseTableDataOptions<T> = {}) {
  const {
    initialData = [],
    fetchData,
    autoLoad = false,
    rowKey = 'id',
    defaultSort,
    onDataChange,
    fetchStatistic,
  } = options;
  
  // 数据状态（使用 shallowRef 提升大数据量性能）
  const tableData: ShallowRef<T[]> = shallowRef([...initialData]);
  const total = ref(0);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  
  // 排序状态
  const sortState = ref<SortState | null>(defaultSort || null);
  
  // 筛选状态
  const filterState = ref<FilterState>({});
  
  // 搜索关键词
  const searchKeyword = ref('');
  
  // 统计数据
  const statisticData = ref<StatisticData>({});
  
  // 加载次数（用于判断是否首次加载）
  const loadCount = ref(0);
  
  // 是否有数据
  const hasData = computed(() => tableData.value.length > 0);
  
  // 是否为空（加载完成后无数据）
  const isEmpty = computed(() => !loading.value && loadCount.value > 0 && !hasData.value);
  
  // 获取行唯一键
  const getRowKey = (row: T): string => {
    if (typeof rowKey === 'function') {
      return rowKey(row);
    }
    return (row as any)[rowKey];
  };
  
  /**
   * 获取数据
   */
  const getData = async (params: Partial<FetchParams> = {}) => {
    if (!fetchData) {
      console.warn('未配置 fetchData 函数');
      return;
    }
    
    loading.value = true;
    error.value = null;
    
    try {
      const fetchParams: FetchParams = {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 10,
        sort: sortState.value || undefined,
        filters: Object.keys(filterState.value).length ? filterState.value : undefined,
        searchKeyword: searchKeyword.value || undefined,
        ...params,
      };
      
      const result = await fetchData(fetchParams);
      
      tableData.value = result.data;
      total.value = result.total;
      loadCount.value++;
      
      onDataChange?.(result.data);
    } catch (e) {
      error.value = e as Error;
      console.error('获取表格数据失败:', e);
    } finally {
      loading.value = false;
    }
  };
  
  /**
   * 获取统计数据
   */
  const getStatistic = async (params: Partial<FetchParams> = {}) => {
    if (!fetchStatistic) return;
    
    try {
      const fetchParams: FetchParams = {
        page: 1,
        pageSize: 10,
        sort: sortState.value || undefined,
        filters: Object.keys(filterState.value).length ? filterState.value : undefined,
        searchKeyword: searchKeyword.value || undefined,
        ...params,
      };
      
      statisticData.value = await fetchStatistic(fetchParams);
    } catch (e) {
      console.error('获取统计数据失败:', e);
    }
  };
  
  /**
   * 刷新数据（保持当前参数）
   */
  const refresh = async (params: Partial<FetchParams> = {}) => {
    await getData(params);
  };
  
  /**
   * 设置本地数据
   */
  const setData = (data: T[]) => {
    tableData.value = [...data];
    total.value = data.length;
    onDataChange?.(data);
  };
  
  /**
   * 追加数据（滚动加载）
   */
  const appendData = (data: T[]) => {
    tableData.value = [...tableData.value, ...data];
    onDataChange?.(tableData.value);
  };
  
  /**
   * 更新单行数据
   */
  const updateRow = (key: string, data: Partial<T>) => {
    const index = tableData.value.findIndex(row => getRowKey(row) === key);
    if (index !== -1) {
      const newData = [...tableData.value];
      newData[index] = { ...newData[index], ...data };
      tableData.value = newData;
      onDataChange?.(tableData.value);
    }
  };
  
  /**
   * 删除单行数据
   */
  const removeRow = (key: string) => {
    const index = tableData.value.findIndex(row => getRowKey(row) === key);
    if (index !== -1) {
      const newData = [...tableData.value];
      newData.splice(index, 1);
      tableData.value = newData;
      total.value--;
      onDataChange?.(tableData.value);
    }
  };
  
  /**
   * 批量删除数据
   */
  const removeRows = (keys: string[]) => {
    const keySet = new Set(keys);
    const newData = tableData.value.filter(row => !keySet.has(getRowKey(row)));
    tableData.value = newData;
    total.value -= keys.length;
    onDataChange?.(tableData.value);
  };
  
  /**
   * 插入单行数据
   */
  const insertRow = (data: T, index?: number) => {
    const newData = [...tableData.value];
    if (index === undefined || index >= newData.length) {
      newData.push(data);
    } else {
      newData.splice(index, 0, data);
    }
    tableData.value = newData;
    total.value++;
    onDataChange?.(tableData.value);
  };
  
  /**
   * 设置排序
   */
  const setSort = (sort: SortState | null) => {
    sortState.value = sort;
  };
  
  /**
   * 处理排序变化
   */
  const handleSortChange = ({ prop, order }: { prop: string; order: 'ascending' | 'descending' | null }) => {
    if (order) {
      sortState.value = { prop, order };
    } else {
      sortState.value = null;
    }
  };
  
  /**
   * 设置筛选
   */
  const setFilter = (prop: string, values: any[]) => {
    if (values.length) {
      filterState.value = { ...filterState.value, [prop]: values };
    } else {
      const newFilters = { ...filterState.value };
      delete newFilters[prop];
      filterState.value = newFilters;
    }
  };
  
  /**
   * 清除所有筛选
   */
  const clearFilters = () => {
    filterState.value = {};
  };
  
  /**
   * 设置搜索关键词
   */
  const setSearchKeyword = (keyword: string) => {
    searchKeyword.value = keyword;
  };
  
  /**
   * 本地排序（前端排序）
   */
  const sortLocal = (data: T[], sort: SortState): T[] => {
    if (!sort.prop || !sort.order) return data;
    
    return [...data].sort((a, b) => {
      const aVal = (a as any)[sort.prop];
      const bVal = (b as any)[sort.prop];
      
      let result = 0;
      if (aVal === bVal) {
        result = 0;
      } else if (aVal === null || aVal === undefined) {
        result = 1;
      } else if (bVal === null || bVal === undefined) {
        result = -1;
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        result = aVal - bVal;
      } else {
        result = String(aVal).localeCompare(String(bVal));
      }
      
      return sort.order === 'ascending' ? result : -result;
    });
  };
  
  /**
   * 本地筛选（前端筛选）
   */
  const filterLocal = (data: T[], filters: FilterState): T[] => {
    if (!Object.keys(filters).length) return data;
    
    return data.filter(row => {
      return Object.entries(filters).every(([prop, values]) => {
        if (!values.length) return true;
        const rowVal = (row as any)[prop];
        return values.includes(rowVal);
      });
    });
  };
  
  /**
   * 本地搜索（前端搜索）
   */
  const searchLocal = (data: T[], keyword: string, searchProps?: string[]): T[] => {
    if (!keyword) return data;
    
    const lowerKeyword = keyword.toLowerCase();
    
    return data.filter(row => {
      const props = searchProps || Object.keys(row as any);
      return props.some(prop => {
        const val = (row as any)[prop];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(lowerKeyword);
      });
    });
  };
  
  /**
   * 获取处理后的数据（本地排序+筛选+搜索）
   */
  const getProcessedData = (searchProps?: string[]): T[] => {
    let result = tableData.value;
    
    // 应用筛选
    result = filterLocal(result, filterState.value);
    
    // 应用搜索
    if (searchKeyword.value) {
      result = searchLocal(result, searchKeyword.value, searchProps);
    }
    
    // 应用排序
    if (sortState.value) {
      result = sortLocal(result, sortState.value);
    }
    
    return result;
  };
  
  /**
   * 清空数据
   */
  const clearData = () => {
    tableData.value = [];
    total.value = 0;
    error.value = null;
  };
  
  /**
   * 重置状态
   */
  const reset = () => {
    clearData();
    sortState.value = defaultSort || null;
    filterState.value = {};
    searchKeyword.value = '';
    loadCount.value = 0;
  };
  
  return {
    // 状态
    tableData,
    total,
    loading,
    error,
    sortState,
    filterState,
    searchKeyword,
    statisticData,
    loadCount,
    // 计算属性
    hasData,
    isEmpty,
    // 方法
    getRowKey,
    getData,
    getStatistic,
    refresh,
    setData,
    appendData,
    updateRow,
    removeRow,
    removeRows,
    insertRow,
    setSort,
    handleSortChange,
    setFilter,
    clearFilters,
    setSearchKeyword,
    sortLocal,
    filterLocal,
    searchLocal,
    getProcessedData,
    clearData,
    reset,
  };
}
