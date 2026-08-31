/**
 * useTableBatchAction - 批量操作 composable
 * 
 * 封装批量删除、导出、审核等操作的状态与方法
 */
import { shallowRef, ref, computed, type Ref, type ComputedRef } from "vue";
import { log } from "@repo/utils";

export interface BatchAction<T = any> {
  key: string;
  label: string;
  handler: (selected: T[]) => void | Promise<void>;
  /** 是否需要确认 */
  confirm?: boolean;
  confirmMessage?: string;
  /** 操作前可以进一步筛选 */
  filter?: (selected: T[]) => T[];
  disabled?: (selected: T[]) => boolean;
}

export interface BatchActionOptions<T = any> {
  actions?: BatchAction<T>[];
  /** 批量操作前的确认模式：'none' | 'confirm' | 'custom' */
  confirmMode?: "none" | "confirm" | "custom";
}

export interface BatchActionReturn<T = any> {
  selected: Ref<T[]>;
  selectedCount: ComputedRef<number>;
  hasSelected: ComputedRef<boolean>;
  isProcessing: Ref<boolean>;
  actions: Ref<BatchAction<T>[]>;
  setSelected: (rows: T[]) => void;
  addSelected: (rows: T[]) => void;
  removeSelected: (rows: T[]) => void;
  clearSelected: () => void;
  isSelected: (row: T, key?: keyof T) => boolean;
  execute: (actionKey: string) => Promise<void>;
  registerAction: (action: BatchAction<T>) => void;
  unregisterAction: (actionKey: string) => void;
}

export function useTableBatchAction<T = any>(
  options: BatchActionOptions<T> = {},
): BatchActionReturn<T> {
  const { actions: initialActions = [], confirmMode = "confirm" } = options;

  const selected = shallowRef<T[]>([]);
  const isProcessing = ref(false);
  const actions = shallowRef<BatchAction<T>[]>(initialActions);

  const selectedCount = computed(() => selected.value.length);
  const hasSelected = computed(() => selected.value.length > 0);

  const setSelected = (rows: T[]) => {
    selected.value = rows;
  };

  const addSelected = (rows: T[]) => {
    const existing = new Set(selected.value);
    for (const row of rows) {
      if (!existing.has(row)) {
        selected.value.push(row);
        existing.add(row);
      }
    }
  };

  const removeSelected = (rows: T[]) => {
    const toRemove = new Set(rows);
    selected.value = selected.value.filter(row => !toRemove.has(row));
  };

  const clearSelected = () => {
    selected.value = [];
  };

  const isSelected = (row: T, key?: keyof T): boolean => {
    if (key) {
      const rowId = row[key];
      return selected.value.some(s => s[key] === rowId);
    }
    return selected.value.includes(row);
  };

  const execute = async (actionKey: string): Promise<void> => {
    const action = actions.value.find(a => a.key === actionKey);
    if (!action) {
      log.warn(`[useTableBatchAction] Action "${actionKey}" not found`);
      return;
    }

    if (action.disabled && action.disabled(selected.value)) {
      return;
    }

    let target = selected.value;
    if (action.filter) {
      target = action.filter(target);
    }

    if (target.length === 0) {
      log.warn(`[useTableBatchAction] No items to process after filter`);
      return;
    }

    if (action.confirm || confirmMode === "confirm") {
      const message = action.confirmMessage || `确认执行 "${action.label}" 操作？`;
      if (!window.confirm(message)) {
        return;
      }
    }

    isProcessing.value = true;
    try {
      await action.handler(target);
      clearSelected();
    } finally {
      isProcessing.value = false;
    }
  };

  const registerAction = (action: BatchAction<T>) => {
    const existing = actions.value.findIndex(a => a.key === action.key);
    if (existing >= 0) {
      actions.value[existing] = action;
    } else {
      actions.value.push(action);
    }
  };

  const unregisterAction = (actionKey: string) => {
    actions.value = actions.value.filter(a => a.key !== actionKey);
  };

  return {
    selected,
    selectedCount,
    hasSelected,
    isProcessing,
    actions,
    setSelected,
    addSelected,
    removeSelected,
    clearSelected,
    isSelected,
    execute,
    registerAction,
    unregisterAction,
  };
}

export default useTableBatchAction;