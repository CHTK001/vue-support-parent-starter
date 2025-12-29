/**
 * useTableRowMerge - 行合并 composable
 * 相同值的行自动合并
 */
import { ref, computed, type Ref, type ComputedRef } from 'vue';

/** 合并信息 */
export interface MergeInfo {
  /** 行索引 */
  rowIndex: number;
  /** 列键名 */
  column: string;
  /** 合并行数 */
  rowspan: number;
  /** 合并列数 */
  colspan: number;
}

/** 行合并选项 */
export interface RowMergeOptions {
  /** 是否启用 */
  enabled?: boolean;
  /** 需要合并的列 */
  mergeColumns?: string[];
  /** 合并策略：'value'按值合并, 'custom'自定义 */
  strategy?: 'value' | 'custom';
  /** 自定义合并判断函数 */
  customMerge?: (row1: any, row2: any, column: string) => boolean;
}

/** 行合并返回值 */
export interface RowMergeReturn {
  /** 是否启用 */
  isEnabled: Ref<boolean>;
  /** 需要合并的列 */
  mergeColumns: Ref<string[]>;
  /** 合并信息缓存 */
  mergeCache: Ref<Map<string, MergeInfo>>;
  /** 计算合并信息 */
  calculate: (data: any[]) => void;
  /** 获取单元格合并信息 */
  getMergeInfo: (rowIndex: number, column: string) => { rowspan: number; colspan: number };
  /** 检查单元格是否需要隐藏（被合并） */
  isCellHidden: (rowIndex: number, column: string) => boolean;
  /** 添加合并列 */
  addMergeColumn: (column: string) => void;
  /** 移除合并列 */
  removeMergeColumn: (column: string) => void;
  /** 清除缓存 */
  clearCache: () => void;
  /** span-method 方法（用于 el-table） */
  spanMethod: (params: { row: any; column: any; rowIndex: number; columnIndex: number }) => number[] | { rowspan: number; colspan: number } | void;
}

/**
 * 行合并 composable
 */
export function useTableRowMerge(options: RowMergeOptions = {}): RowMergeReturn {
  const {
    enabled = false,
    mergeColumns: initialColumns = [],
    strategy = 'value',
    customMerge,
  } = options;

  const isEnabled = ref(enabled);
  const mergeColumns = ref<string[]>([...initialColumns]);
  const mergeCache = ref<Map<string, MergeInfo>>(new Map());

  // 内部数据引用
  let cachedData: any[] = [];

  /**
   * 生成缓存键
   */
  const getCacheKey = (rowIndex: number, column: string): string => {
    return `${rowIndex}-${column}`;
  };

  /**
   * 判断两行是否可以合并
   */
  const canMerge = (row1: any, row2: any, column: string): boolean => {
    if (strategy === 'custom' && customMerge) {
      return customMerge(row1, row2, column);
    }
    // 默认按值合并
    return JSON.stringify(row1[column]) === JSON.stringify(row2[column]);
  };

  /**
   * 计算合并信息
   */
  const calculate = (data: any[]): void => {
    if (!isEnabled.value) return;

    cachedData = data;
    mergeCache.value.clear();

    if (data.length === 0 || mergeColumns.value.length === 0) return;

    mergeColumns.value.forEach(column => {
      let startIndex = 0;
      let mergeCount = 1;

      for (let i = 1; i <= data.length; i++) {
        const shouldMerge = i < data.length && canMerge(data[startIndex], data[i], column);

        if (shouldMerge) {
          mergeCount++;
        } else {
          // 记录合并信息
          if (mergeCount > 1) {
            // 第一个单元格显示合并
            mergeCache.value.set(getCacheKey(startIndex, column), {
              rowIndex: startIndex,
              column,
              rowspan: mergeCount,
              colspan: 1,
            });

            // 其他单元格隐藏
            for (let j = startIndex + 1; j < startIndex + mergeCount; j++) {
              mergeCache.value.set(getCacheKey(j, column), {
                rowIndex: j,
                column,
                rowspan: 0,
                colspan: 0,
              });
            }
          }

          // 重置
          startIndex = i;
          mergeCount = 1;
        }
      }
    });
  };

  /**
   * 获取单元格合并信息
   */
  const getMergeInfo = (rowIndex: number, column: string): { rowspan: number; colspan: number } => {
    const key = getCacheKey(rowIndex, column);
    const info = mergeCache.value.get(key);
    
    if (info) {
      return { rowspan: info.rowspan, colspan: info.colspan };
    }
    
    return { rowspan: 1, colspan: 1 };
  };

  /**
   * 检查单元格是否需要隐藏
   */
  const isCellHidden = (rowIndex: number, column: string): boolean => {
    const info = getMergeInfo(rowIndex, column);
    return info.rowspan === 0 || info.colspan === 0;
  };

  /**
   * 添加合并列
   */
  const addMergeColumn = (column: string): void => {
    if (!mergeColumns.value.includes(column)) {
      mergeColumns.value.push(column);
      // 重新计算
      if (cachedData.length > 0) {
        calculate(cachedData);
      }
    }
  };

  /**
   * 移除合并列
   */
  const removeMergeColumn = (column: string): void => {
    const index = mergeColumns.value.indexOf(column);
    if (index > -1) {
      mergeColumns.value.splice(index, 1);
      // 重新计算
      if (cachedData.length > 0) {
        calculate(cachedData);
      }
    }
  };

  /**
   * 清除缓存
   */
  const clearCache = (): void => {
    mergeCache.value.clear();
    cachedData = [];
  };

  /**
   * span-method 方法（用于 el-table）
   */
  const spanMethod = (params: {
    row: any;
    column: any;
    rowIndex: number;
    columnIndex: number;
  }): number[] | { rowspan: number; colspan: number } | void => {
    if (!isEnabled.value) return;

    const { column, rowIndex } = params;
    const columnKey = column.property;

    if (!columnKey || !mergeColumns.value.includes(columnKey)) {
      return;
    }

    const info = getMergeInfo(rowIndex, columnKey);
    
    if (info.rowspan === 0) {
      return [0, 0];
    }
    
    if (info.rowspan > 1) {
      return [info.rowspan, 1];
    }
  };

  return {
    isEnabled,
    mergeColumns,
    mergeCache,
    calculate,
    getMergeInfo,
    isCellHidden,
    addMergeColumn,
    removeMergeColumn,
    clearCache,
    spanMethod,
  };
}

export default useTableRowMerge;
