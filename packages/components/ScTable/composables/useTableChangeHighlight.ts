/**
 * useTableChangeHighlight - 变更高亮 composable
 * 数据变化时高亮显示
 */
import { ref, computed, type Ref, type ComputedRef } from 'vue';

/** 变更记录 */
export interface ChangeRecord {
  /** 行键值 */
  rowKey: string | number;
  /** 变更的列 */
  columns: string[];
  /** 变更时间 */
  timestamp: number;
  /** 变更类型 */
  type: 'add' | 'update' | 'delete';
}

/** 高亮选项 */
export interface ChangeHighlightOptions {
  /** 是否启用 */
  enabled?: boolean;
  /** 高亮持续时间（毫秒） */
  duration?: number;
  /** 行键字段名 */
  rowKey?: string;
  /** 是否高亮新增行 */
  highlightAdd?: boolean;
  /** 是否高亮更新行 */
  highlightUpdate?: boolean;
  /** 是否高亮删除行 */
  highlightDelete?: boolean;
}

/** 高亮返回值 */
export interface ChangeHighlightReturn {
  /** 是否启用 */
  isEnabled: Ref<boolean>;
  /** 高亮持续时间 */
  duration: Ref<number>;
  /** 变更记录 */
  changes: Ref<Map<string | number, ChangeRecord>>;
  /** 是否有变更 */
  hasChanges: ComputedRef<boolean>;
  /** 标记新增 */
  markAdd: (rowKey: string | number, columns?: string[]) => void;
  /** 标记更新 */
  markUpdate: (rowKey: string | number, columns: string[]) => void;
  /** 标记删除 */
  markDelete: (rowKey: string | number) => void;
  /** 清除行变更 */
  clearChange: (rowKey: string | number) => void;
  /** 清除所有变更 */
  clearAllChanges: () => void;
  /** 检查行是否高亮 */
  isRowHighlighted: (rowKey: string | number) => boolean;
  /** 检查单元格是否高亮 */
  isCellHighlighted: (rowKey: string | number, column: string) => boolean;
  /** 获取行变更类型 */
  getChangeType: (rowKey: string | number) => 'add' | 'update' | 'delete' | null;
  /** 获取行高亮类名 */
  getRowHighlightClass: (rowKey: string | number) => string;
  /** 比较数据变化并自动标记 */
  compareAndMark: (oldData: any[], newData: any[], keyField?: string) => void;
}

/**
 * 变更高亮 composable
 */
export function useTableChangeHighlight(options: ChangeHighlightOptions = {}): ChangeHighlightReturn {
  const {
    enabled = false,
    duration = 3000,
    rowKey = 'id',
    highlightAdd = true,
    highlightUpdate = true,
    highlightDelete = true,
  } = options;

  const isEnabled = ref(enabled);
  const highlightDuration = ref(duration);
  const changes = ref<Map<string | number, ChangeRecord>>(new Map());

  // 定时器Map
  const timers = new Map<string | number, ReturnType<typeof setTimeout>>();

  /** 是否有变更 */
  const hasChanges = computed(() => changes.value.size > 0);

  /**
   * 设置自动清除定时器
   */
  const setAutoCleanTimer = (key: string | number): void => {
    // 清除旧定时器
    const oldTimer = timers.get(key);
    if (oldTimer) {
      clearTimeout(oldTimer);
    }

    // 设置新定时器
    const timer = setTimeout(() => {
      changes.value.delete(key);
      timers.delete(key);
    }, highlightDuration.value);

    timers.set(key, timer);
  };

  /**
   * 标记新增
   */
  const markAdd = (rk: string | number, columns: string[] = []): void => {
    if (!isEnabled.value || !highlightAdd) return;

    changes.value.set(rk, {
      rowKey: rk,
      columns,
      timestamp: Date.now(),
      type: 'add',
    });

    setAutoCleanTimer(rk);
  };

  /**
   * 标记更新
   */
  const markUpdate = (rk: string | number, columns: string[]): void => {
    if (!isEnabled.value || !highlightUpdate) return;

    changes.value.set(rk, {
      rowKey: rk,
      columns,
      timestamp: Date.now(),
      type: 'update',
    });

    setAutoCleanTimer(rk);
  };

  /**
   * 标记删除
   */
  const markDelete = (rk: string | number): void => {
    if (!isEnabled.value || !highlightDelete) return;

    changes.value.set(rk, {
      rowKey: rk,
      columns: [],
      timestamp: Date.now(),
      type: 'delete',
    });

    setAutoCleanTimer(rk);
  };

  /**
   * 清除行变更
   */
  const clearChange = (rk: string | number): void => {
    changes.value.delete(rk);
    const timer = timers.get(rk);
    if (timer) {
      clearTimeout(timer);
      timers.delete(rk);
    }
  };

  /**
   * 清除所有变更
   */
  const clearAllChanges = (): void => {
    changes.value.clear();
    timers.forEach(timer => clearTimeout(timer));
    timers.clear();
  };

  /**
   * 检查行是否高亮
   */
  const isRowHighlighted = (rk: string | number): boolean => {
    return changes.value.has(rk);
  };

  /**
   * 检查单元格是否高亮
   */
  const isCellHighlighted = (rk: string | number, column: string): boolean => {
    const change = changes.value.get(rk);
    if (!change) return false;
    
    // 新增行整行高亮
    if (change.type === 'add') return true;
    
    // 更新行只高亮变更的列
    return change.columns.includes(column);
  };

  /**
   * 获取行变更类型
   */
  const getChangeType = (rk: string | number): 'add' | 'update' | 'delete' | null => {
    return changes.value.get(rk)?.type ?? null;
  };

  /**
   * 获取行高亮类名
   */
  const getRowHighlightClass = (rk: string | number): string => {
    const type = getChangeType(rk);
    if (!type) return '';
    
    return `highlight-${type}`;
  };

  /**
   * 比较数据变化并自动标记
   */
  const compareAndMark = (oldData: any[], newData: any[], keyField: string = rowKey): void => {
    if (!isEnabled.value) return;

    const oldMap = new Map(oldData.map(row => [row[keyField], row]));
    const newMap = new Map(newData.map(row => [row[keyField], row]));

    // 检查新增和更新
    newData.forEach(newRow => {
      const key = newRow[keyField];
      const oldRow = oldMap.get(key);

      if (!oldRow) {
        // 新增
        markAdd(key);
      } else {
        // 检查更新
        const changedColumns: string[] = [];
        Object.keys(newRow).forEach(col => {
          if (JSON.stringify(newRow[col]) !== JSON.stringify(oldRow[col])) {
            changedColumns.push(col);
          }
        });
        if (changedColumns.length > 0) {
          markUpdate(key, changedColumns);
        }
      }
    });

    // 检查删除
    oldData.forEach(oldRow => {
      const key = oldRow[keyField];
      if (!newMap.has(key)) {
        markDelete(key);
      }
    });
  };

  return {
    isEnabled,
    duration: highlightDuration,
    changes,
    hasChanges,
    markAdd,
    markUpdate,
    markDelete,
    clearChange,
    clearAllChanges,
    isRowHighlighted,
    isCellHighlighted,
    getChangeType,
    getRowHighlightClass,
    compareAndMark,
  };
}

export default useTableChangeHighlight;
