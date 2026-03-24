/**
 * useTableColumnSearch - 列搜索 composable
 * 支持表头列搜索功能
 */
import { ref, computed, type Ref, type ComputedRef } from 'vue';

/** 列搜索选项 */
export interface ColumnSearchOptions {
  /** 是否启用 */
  enabled?: boolean;
  /** 可搜索的列 */
  searchableColumns?: string[];
  /** 搜索延迟（毫秒） */
  debounce?: number;
  /** 是否区分大小写 */
  caseSensitive?: boolean;
}

/** 列搜索返回值 */
export interface ColumnSearchReturn {
  /** 是否启用 */
  isEnabled: Ref<boolean>;
  /** 搜索值 Map */
  searchValues: Ref<Map<string, string>>;
  /** 是否有搜索条件 */
  hasSearch: ComputedRef<boolean>;
  /** 搜索条件数量 */
  searchCount: ComputedRef<number>;
  /** 设置列搜索值 */
  setSearchValue: (columnKey: string, value: string) => void;
  /** 清除列搜索 */
  clearSearchValue: (columnKey: string) => void;
  /** 清除所有搜索 */
  clearAllSearch: () => void;
  /** 获取列搜索值 */
  getSearchValue: (columnKey: string) => string;
  /** 检查列是否可搜索 */
  isColumnSearchable: (columnKey: string) => boolean;
  /** 过滤数据 */
  filterData: (data: any[]) => any[];
  /** 获取搜索参数（用于远程搜索） */
  getSearchParams: () => Record<string, string>;
}

/**
 * 列搜索 composable
 */
export function useTableColumnSearch(options: ColumnSearchOptions = {}): ColumnSearchReturn {
  const {
    enabled = false,
    searchableColumns = [],
    debounce = 300,
    caseSensitive = false,
  } = options;

  const isEnabled = ref(enabled);
  const searchValues = ref<Map<string, string>>(new Map());

  /** 是否有搜索条件 */
  const hasSearch = computed(() => {
    for (const value of searchValues.value.values()) {
      if (value.trim()) return true;
    }
    return false;
  });

  /** 搜索条件数量 */
  const searchCount = computed(() => {
    let count = 0;
    for (const value of searchValues.value.values()) {
      if (value.trim()) count++;
    }
    return count;
  });

  /**
   * 检查列是否可搜索
   */
  const isColumnSearchable = (columnKey: string): boolean => {
    if (searchableColumns.length === 0) return true;
    return searchableColumns.includes(columnKey);
  };

  /**
   * 设置列搜索值
   */
  const setSearchValue = (columnKey: string, value: string): void => {
    if (!isEnabled.value) return;
    if (!isColumnSearchable(columnKey)) return;
    searchValues.value.set(columnKey, value);
  };

  /**
   * 清除列搜索
   */
  const clearSearchValue = (columnKey: string): void => {
    searchValues.value.delete(columnKey);
  };

  /**
   * 清除所有搜索
   */
  const clearAllSearch = (): void => {
    searchValues.value.clear();
  };

  /**
   * 获取列搜索值
   */
  const getSearchValue = (columnKey: string): string => {
    return searchValues.value.get(columnKey) || '';
  };

  /**
   * 过滤数据（本地搜索）
   */
  const filterData = (data: any[]): any[] => {
    if (!hasSearch.value) return data;

    return data.filter(row => {
      for (const [columnKey, searchValue] of searchValues.value.entries()) {
        const trimmedValue = searchValue.trim();
        if (!trimmedValue) continue;

        const cellValue = row[columnKey];
        if (cellValue === null || cellValue === undefined) return false;

        const cellStr = String(cellValue);
        const searchStr = trimmedValue;

        if (caseSensitive) {
          if (!cellStr.includes(searchStr)) return false;
        } else {
          if (!cellStr.toLowerCase().includes(searchStr.toLowerCase())) return false;
        }
      }
      return true;
    });
  };

  /**
   * 获取搜索参数（用于远程搜索）
   */
  const getSearchParams = (): Record<string, string> => {
    const params: Record<string, string> = {};
    for (const [columnKey, value] of searchValues.value.entries()) {
      const trimmedValue = value.trim();
      if (trimmedValue) {
        params[columnKey] = trimmedValue;
      }
    }
    return params;
  };

  return {
    isEnabled,
    searchValues,
    hasSearch,
    searchCount,
    setSearchValue,
    clearSearchValue,
    clearAllSearch,
    getSearchValue,
    isColumnSearchable,
    filterData,
    getSearchParams,
  };
}

export default useTableColumnSearch;
