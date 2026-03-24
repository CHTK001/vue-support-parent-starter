/**
 * useTableEdit - 表格编辑 composable
 * 支持单元格编辑和行编辑模式
 */
import { ref, computed, type Ref, type ComputedRef } from 'vue';

/** 编辑模式 */
export type EditMode = 'cell' | 'row';

/** 编辑状态 */
export interface EditState {
  /** 行键值 */
  rowKey: string | number;
  /** 列键名（仅单元格模式） */
  columnKey?: string;
  /** 原始值 */
  originalValue: any;
  /** 当前值 */
  currentValue: any;
}

/** 编辑选项 */
export interface EditOptions {
  /** 是否启用 */
  enabled?: boolean;
  /** 编辑模式 */
  mode?: EditMode;
  /** 行键字段名 */
  rowKey?: string;
  /** 可编辑的列 */
  editableColumns?: string[];
  /** 编辑前验证 */
  beforeEdit?: (row: any, column?: string) => boolean | Promise<boolean>;
  /** 保存前验证 */
  beforeSave?: (row: any, changes: Record<string, any>) => boolean | Promise<boolean>;
}

/** 编辑返回值 */
export interface EditReturn {
  /** 是否启用 */
  isEnabled: Ref<boolean>;
  /** 编辑模式 */
  editMode: Ref<EditMode>;
  /** 当前编辑状态 */
  editingStates: Ref<Map<string, EditState>>;
  /** 是否有正在编辑的内容 */
  isEditing: ComputedRef<boolean>;
  /** 是否有未保存的更改 */
  hasChanges: ComputedRef<boolean>;
  /** 开始编辑单元格 */
  startCellEdit: (rowKey: string | number, columnKey: string, value: any) => void;
  /** 开始编辑行 */
  startRowEdit: (rowKey: string | number, row: any) => void;
  /** 更新编辑值 */
  updateEditValue: (rowKey: string | number, columnKey: string, value: any) => void;
  /** 取消编辑 */
  cancelEdit: (rowKey: string | number, columnKey?: string) => void;
  /** 取消所有编辑 */
  cancelAllEdits: () => void;
  /** 保存编辑 */
  saveEdit: (rowKey: string | number, columnKey?: string) => EditState | null;
  /** 保存所有编辑 */
  saveAllEdits: () => EditState[];
  /** 检查单元格是否在编辑 */
  isCellEditing: (rowKey: string | number, columnKey: string) => boolean;
  /** 检查行是否在编辑 */
  isRowEditing: (rowKey: string | number) => boolean;
  /** 检查列是否可编辑 */
  isColumnEditable: (columnKey: string) => boolean;
  /** 获取编辑值 */
  getEditValue: (rowKey: string | number, columnKey: string) => any;
  /** 获取行的所有更改 */
  getRowChanges: (rowKey: string | number) => Record<string, any>;
}

/**
 * 表格编辑 composable
 */
export function useTableEdit(options: EditOptions = {}): EditReturn {
  const {
    enabled = false,
    mode = 'cell',
    rowKey = 'id',
    editableColumns = [],
    beforeEdit,
    beforeSave,
  } = options;

  const isEnabled = ref(enabled);
  const editMode = ref<EditMode>(mode);
  const editingStates = ref<Map<string, EditState>>(new Map());

  /**
   * 生成编辑键
   */
  const getEditKey = (rowKey: string | number, columnKey?: string): string => {
    if (editMode.value === 'row' || !columnKey) {
      return `row-${rowKey}`;
    }
    return `cell-${rowKey}-${columnKey}`;
  };

  /** 是否有正在编辑的内容 */
  const isEditing = computed(() => editingStates.value.size > 0);

  /** 是否有未保存的更改 */
  const hasChanges = computed(() => {
    for (const state of editingStates.value.values()) {
      if (JSON.stringify(state.originalValue) !== JSON.stringify(state.currentValue)) {
        return true;
      }
    }
    return false;
  });

  /**
   * 检查列是否可编辑
   */
  const isColumnEditable = (columnKey: string): boolean => {
    if (editableColumns.length === 0) return true;
    return editableColumns.includes(columnKey);
  };

  /**
   * 开始编辑单元格
   */
  const startCellEdit = (rk: string | number, columnKey: string, value: any): void => {
    if (!isEnabled.value) return;
    if (!isColumnEditable(columnKey)) return;

    const key = getEditKey(rk, columnKey);
    editingStates.value.set(key, {
      rowKey: rk,
      columnKey,
      originalValue: value,
      currentValue: value,
    });
  };

  /**
   * 开始编辑行
   */
  const startRowEdit = (rk: string | number, row: any): void => {
    if (!isEnabled.value) return;

    const key = getEditKey(rk);
    editingStates.value.set(key, {
      rowKey: rk,
      originalValue: { ...row },
      currentValue: { ...row },
    });
  };

  /**
   * 更新编辑值
   */
  const updateEditValue = (rk: string | number, columnKey: string, value: any): void => {
    if (editMode.value === 'row') {
      const key = getEditKey(rk);
      const state = editingStates.value.get(key);
      if (state) {
        state.currentValue[columnKey] = value;
      }
    } else {
      const key = getEditKey(rk, columnKey);
      const state = editingStates.value.get(key);
      if (state) {
        state.currentValue = value;
      }
    }
  };

  /**
   * 取消编辑
   */
  const cancelEdit = (rk: string | number, columnKey?: string): void => {
    if (editMode.value === 'row') {
      const key = getEditKey(rk);
      editingStates.value.delete(key);
    } else if (columnKey) {
      const key = getEditKey(rk, columnKey);
      editingStates.value.delete(key);
    }
  };

  /**
   * 取消所有编辑
   */
  const cancelAllEdits = (): void => {
    editingStates.value.clear();
  };

  /**
   * 保存编辑
   */
  const saveEdit = (rk: string | number, columnKey?: string): EditState | null => {
    const key = editMode.value === 'row' ? getEditKey(rk) : getEditKey(rk, columnKey);
    const state = editingStates.value.get(key);
    
    if (state) {
      editingStates.value.delete(key);
      return state;
    }
    return null;
  };

  /**
   * 保存所有编辑
   */
  const saveAllEdits = (): EditState[] => {
    const states = Array.from(editingStates.value.values());
    editingStates.value.clear();
    return states;
  };

  /**
   * 检查单元格是否在编辑
   */
  const isCellEditing = (rk: string | number, columnKey: string): boolean => {
    if (editMode.value === 'row') {
      return editingStates.value.has(getEditKey(rk));
    }
    return editingStates.value.has(getEditKey(rk, columnKey));
  };

  /**
   * 检查行是否在编辑
   */
  const isRowEditing = (rk: string | number): boolean => {
    if (editMode.value === 'row') {
      return editingStates.value.has(getEditKey(rk));
    }
    // 单元格模式下检查是否有该行的任何单元格在编辑
    for (const key of editingStates.value.keys()) {
      if (key.startsWith(`cell-${rk}-`)) {
        return true;
      }
    }
    return false;
  };

  /**
   * 获取编辑值
   */
  const getEditValue = (rk: string | number, columnKey: string): any => {
    if (editMode.value === 'row') {
      const state = editingStates.value.get(getEditKey(rk));
      return state?.currentValue?.[columnKey];
    }
    const state = editingStates.value.get(getEditKey(rk, columnKey));
    return state?.currentValue;
  };

  /**
   * 获取行的所有更改
   */
  const getRowChanges = (rk: string | number): Record<string, any> => {
    const changes: Record<string, any> = {};
    
    if (editMode.value === 'row') {
      const state = editingStates.value.get(getEditKey(rk));
      if (state) {
        const original = state.originalValue;
        const current = state.currentValue;
        Object.keys(current).forEach(key => {
          if (JSON.stringify(original[key]) !== JSON.stringify(current[key])) {
            changes[key] = current[key];
          }
        });
      }
    } else {
      // 单元格模式：收集该行所有变更的单元格
      for (const [key, state] of editingStates.value.entries()) {
        if (state.rowKey === rk && state.columnKey) {
          if (JSON.stringify(state.originalValue) !== JSON.stringify(state.currentValue)) {
            changes[state.columnKey] = state.currentValue;
          }
        }
      }
    }
    
    return changes;
  };

  return {
    isEnabled,
    editMode,
    editingStates,
    isEditing,
    hasChanges,
    startCellEdit,
    startRowEdit,
    updateEditValue,
    cancelEdit,
    cancelAllEdits,
    saveEdit,
    saveAllEdits,
    isCellEditing,
    isRowEditing,
    isColumnEditable,
    getEditValue,
    getRowChanges,
  };
}

export default useTableEdit;
