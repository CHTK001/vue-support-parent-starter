/**
 * useTableSelection - 跨页选择管理 composable
 * 
 * 支持跨页选择缓存、全选/清空、恢复选中状态
 */
import { ref, computed, nextTick, type Ref, type ComputedRef } from "vue";

export interface UseTableSelectionOptions {
  tableRef?: Ref<any>;
  rowKey?: string;
}

export interface UseTableSelectionReturn {
  /** 跨页选择缓存 { page: selectedRows[] } */
  selectionCache: Ref<Record<number, any[]>>;
  /** 所有选中行数量 */
  selectionCount: ComputedRef<number>;
  /** 是否有选中行 */
  hasSelection: ComputedRef<boolean>;
  /** 当前页选择变化回调 */
  onSelectionChange: (currentPage: number, selectedRows: any[]) => void;
  /** 获取所有选中的行（跨页） */
  getAllSelection: () => any[];
  /** 获取指定页选中的行 */
  getCurrentSelection: (currentPage: number) => any[];
  /** 获取选中行的 key 列表 */
  getSelectionKeys: <T = any>() => T[];
  /** 清除所有选择 */
  clearSelection: () => void;
  /** 清除指定页的选择 */
  clearPageSelection: (page: number) => void;
  /** 切换行选择状态 */
  toggleRowSelection: (row: any, selected?: boolean) => void;
  /** 切换全选 */
  toggleAllSelection: () => void;
  /** 恢复页面选择状态（分页切换后调用） */
  restorePageSelection: (currentPage: number) => void;
  /** 判断行是否被选中 */
  isRowSelected: (row: any) => boolean;
  /** 获取所有选中行的原始数据 */
  selectedRows: ComputedRef<any[]>;
}

export function useTableSelection(options: UseTableSelectionOptions = {}): UseTableSelectionReturn {
  const { tableRef, rowKey = "id" } = options;

  const selectionCache = ref<Record<number, any[]>>({});

  const onSelectionChange = (currentPage: number, selectedRows: any[]) => {
    selectionCache.value[currentPage] = selectedRows;
  };

  const getAllSelection = (): any[] => {
    return Object.values(selectionCache.value).flat();
  };

  const getCurrentSelection = (currentPage: number): any[] => {
    return selectionCache.value[currentPage] || [];
  };

  const getSelectionKeys = <T = any>(): T[] => {
    return getAllSelection().map(row => row[rowKey] as T);
  };

  const clearSelection = () => {
    tableRef?.value?.clearSelection();
    selectionCache.value = {};
  };

  const clearPageSelection = (page: number) => {
    delete selectionCache.value[page];
  };

  const toggleRowSelection = (row: any, selected?: boolean) => {
    tableRef?.value?.toggleRowSelection(row, selected);
  };

  const toggleAllSelection = () => {
    tableRef?.value?.toggleAllSelection();
  };

  const restorePageSelection = (currentPage: number) => {
    nextTick(() => {
      const selectedRows = selectionCache.value[currentPage];
      if (selectedRows && selectedRows.length > 0) {
        selectedRows.forEach(row => {
          tableRef?.value?.toggleRowSelection(row, true);
        });
      }
    });
  };

  const isRowSelected = (row: any): boolean => {
    const allSelected = getAllSelection();
    return allSelected.some(selected => selected[rowKey] === row[rowKey]);
  };

  const selectionCount = computed(() => getAllSelection().length);
  const hasSelection = computed(() => selectionCount.value > 0);
  const selectedRows = computed(() => getAllSelection());

  return {
    selectionCache,
    selectionCount,
    hasSelection,
    selectedRows,
    onSelectionChange,
    getAllSelection,
    getCurrentSelection,
    getSelectionKeys,
    clearSelection,
    clearPageSelection,
    toggleRowSelection,
    toggleAllSelection,
    restorePageSelection,
    isRowSelected,
  };
}

export default useTableSelection;