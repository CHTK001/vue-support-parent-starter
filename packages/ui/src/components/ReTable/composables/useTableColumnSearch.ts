/**
 * useTableColumnSearch - 列搜索 composable
 * 
 * 支持表头列搜索 + 本地过滤
 */
import { ref, computed, type Ref, type ComputedRef } from "vue";

export interface ColumnSearchOptions {
  enabled?: boolean;
  searchableColumns?: string[];
  debounce?: number;
  caseSensitive?: boolean;
}

export interface ColumnSearchReturn {
  isEnabled: Ref<boolean>;
  searchValues: Ref<Map<string, string>>;
  hasSearch: ComputedRef<boolean>;
  searchCount: ComputedRef<number>;
  setSearchValue: (columnKey: string, value: string) => void;
  clearSearchValue: (columnKey: string) => void;
  clearAllSearch: () => void;
  getSearchValue: (columnKey: string) => string;
  isColumnSearchable: (columnKey: string) => boolean;
  filterData: <T extends Record<string, any>>(data: T[]) => T[];
  getSearchParams: () => Record<string, string>;
}

export function useTableColumnSearch(options: ColumnSearchOptions = {}): ColumnSearchReturn {
  const { enabled = false, searchableColumns = [], debounce = 300, caseSensitive = false } = options;

  const isEnabled = ref(enabled);
  const searchValues = ref<Map<string, string>>(new Map());

  const hasSearch = computed(() => {
    for (const value of searchValues.value.values()) {
      if (value.trim()) return true;
    }
    return false;
  });

  const searchCount = computed(() => {
    let count = 0;
    for (const value of searchValues.value.values()) {
      if (value.trim()) count++;
    }
    return count;
  });

  const isColumnSearchable = (columnKey: string): boolean => {
    if (searchableColumns.length === 0) return true;
    return searchableColumns.includes(columnKey);
  };

  const setSearchValue = (columnKey: string, value: string): void => {
    if (!isEnabled.value) return;
    if (!isColumnSearchable(columnKey)) return;
    searchValues.value.set(columnKey, value);
  };

  const clearSearchValue = (columnKey: string): void => {
    searchValues.value.delete(columnKey);
  };

  const clearAllSearch = (): void => {
    searchValues.value.clear();
  };

  const getSearchValue = (columnKey: string): string => {
    return searchValues.value.get(columnKey) || "";
  };

  const filterData = <T extends Record<string, any>>(data: T[]): T[] => {
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