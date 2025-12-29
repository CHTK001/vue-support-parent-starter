/**
 * ScTable 选择管理 Composable
 * 处理行选择、跨页选择缓存等逻辑
 */
import { ref, computed, nextTick, type Ref } from 'vue';

export interface UseTableSelectionOptions {
  /** 表格引用 */
  tableRef: Ref<any>;
  /** 行标识字段 */
  rowKey?: string;
}

export function useTableSelection(options: UseTableSelectionOptions) {
  const { tableRef, rowKey = 'id' } = options;
  
  // 跨页选择缓存 { [page]: selectedRows[] }
  const selectionCache = ref<Record<number, any[]>>({});
  
  // 当前页选择变化
  const onSelectionChange = (currentPage: number, selectedRows: any[]) => {
    selectionCache.value[currentPage] = selectedRows;
  };
  
  // 获取所有选中的行（跨页）
  const getAllSelection = (): any[] => {
    return Object.values(selectionCache.value).flat();
  };
  
  // 获取当前页选中的行
  const getCurrentSelection = (currentPage: number): any[] => {
    return selectionCache.value[currentPage] || [];
  };
  
  // 获取选中行的 key 列表
  const getSelectionKeys = (): any[] => {
    return getAllSelection().map(row => row[rowKey]);
  };
  
  // 清除所有选择
  const clearSelection = () => {
    tableRef.value?.clearSelection();
    selectionCache.value = {};
  };
  
  // 清除指定页的选择
  const clearPageSelection = (page: number) => {
    delete selectionCache.value[page];
  };
  
  // 切换行选择状态
  const toggleRowSelection = (row: any, selected?: boolean) => {
    tableRef.value?.toggleRowSelection(row, selected);
  };
  
  // 全选切换
  const toggleAllSelection = () => {
    tableRef.value?.toggleAllSelection();
  };
  
  // 恢复页面选择状态（用于分页切换后）
  const restorePageSelection = (currentPage: number) => {
    nextTick(() => {
      const selectedRows = selectionCache.value[currentPage];
      if (selectedRows && selectedRows.length > 0) {
        selectedRows.forEach(row => {
          tableRef.value?.toggleRowSelection(row, true);
        });
      }
    });
  };
  
  // 设置当前行（单选模式）
  const setCurrentRow = (row: any) => {
    tableRef.value?.setCurrentRow(row);
  };
  
  // 判断行是否被选中
  const isRowSelected = (row: any): boolean => {
    const allSelected = getAllSelection();
    return allSelected.some(selected => selected[rowKey] === row[rowKey]);
  };
  
  // 获取选中行数量
  const selectionCount = computed(() => getAllSelection().length);
  
  // 判断是否有选中项
  const hasSelection = computed(() => selectionCount.value > 0);
  
  return {
    // 状态
    selectionCache,
    selectionCount,
    hasSelection,
    // 方法
    onSelectionChange,
    getAllSelection,
    getCurrentSelection,
    getSelectionKeys,
    clearSelection,
    clearPageSelection,
    toggleRowSelection,
    toggleAllSelection,
    restorePageSelection,
    setCurrentRow,
    isRowSelected,
  };
}
