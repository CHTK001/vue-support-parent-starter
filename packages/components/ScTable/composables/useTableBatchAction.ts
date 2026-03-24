/**
 * useTableBatchAction - 批量操作 composable
 * 管理批量操作工具栏
 */
import { ref, computed, type Ref, type ComputedRef } from 'vue';

/** 批量操作项 */
export interface BatchAction {
  /** 操作键名 */
  key: string;
  /** 显示文本 */
  label: string;
  /** 图标 */
  icon?: string;
  /** 类型：primary/success/warning/danger/info */
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default';
  /** 是否禁用 */
  disabled?: boolean | ((selectedRows: any[]) => boolean);
  /** 是否需要确认 */
  confirm?: boolean;
  /** 确认提示文本 */
  confirmText?: string;
  /** 点击处理函数 */
  handler?: (selectedRows: any[]) => void | Promise<void>;
}

/** 批量操作选项 */
export interface BatchActionOptions {
  /** 是否启用 */
  enabled?: boolean;
  /** 操作项列表 */
  actions?: BatchAction[];
  /** 显示选中数量 */
  showCount?: boolean;
  /** 是否在无选中时隐藏工具栏 */
  hideWhenEmpty?: boolean;
}

/** 批量操作返回值 */
export interface BatchActionReturn {
  /** 是否启用 */
  isEnabled: Ref<boolean>;
  /** 操作项列表 */
  actions: Ref<BatchAction[]>;
  /** 选中的行 */
  selectedRows: Ref<any[]>;
  /** 选中数量 */
  selectedCount: ComputedRef<number>;
  /** 是否有选中 */
  hasSelected: ComputedRef<boolean>;
  /** 是否显示工具栏 */
  showToolbar: ComputedRef<boolean>;
  /** 设置选中的行 */
  setSelectedRows: (rows: any[]) => void;
  /** 清空选中 */
  clearSelected: () => void;
  /** 执行操作 */
  executeAction: (actionKey: string) => Promise<void>;
  /** 添加操作项 */
  addAction: (action: BatchAction) => void;
  /** 移除操作项 */
  removeAction: (actionKey: string) => void;
  /** 检查操作是否禁用 */
  isActionDisabled: (action: BatchAction) => boolean;
}

/**
 * 批量操作 composable
 */
export function useTableBatchAction(options: BatchActionOptions = {}): BatchActionReturn {
  const {
    enabled = false,
    actions: initialActions = [],
    showCount = true,
    hideWhenEmpty = true,
  } = options;

  const isEnabled = ref(enabled);
  const actions = ref<BatchAction[]>([...initialActions]);
  const selectedRows = ref<any[]>([]);

  /** 选中数量 */
  const selectedCount = computed(() => selectedRows.value.length);

  /** 是否有选中 */
  const hasSelected = computed(() => selectedRows.value.length > 0);

  /** 是否显示工具栏 */
  const showToolbar = computed(() => {
    if (!isEnabled.value) return false;
    if (hideWhenEmpty && !hasSelected.value) return false;
    return true;
  });

  /**
   * 设置选中的行
   */
  const setSelectedRows = (rows: any[]): void => {
    selectedRows.value = rows;
  };

  /**
   * 清空选中
   */
  const clearSelected = (): void => {
    selectedRows.value = [];
  };

  /**
   * 检查操作是否禁用
   */
  const isActionDisabled = (action: BatchAction): boolean => {
    if (typeof action.disabled === 'function') {
      return action.disabled(selectedRows.value);
    }
    return action.disabled ?? false;
  };

  /**
   * 执行操作
   */
  const executeAction = async (actionKey: string): Promise<void> => {
    const action = actions.value.find(a => a.key === actionKey);
    if (!action) {
      console.warn(`[useTableBatchAction] Action not found: ${actionKey}`);
      return;
    }

    if (isActionDisabled(action)) {
      console.warn(`[useTableBatchAction] Action is disabled: ${actionKey}`);
      return;
    }

    if (action.handler) {
      await action.handler(selectedRows.value);
    }
  };

  /**
   * 添加操作项
   */
  const addAction = (action: BatchAction): void => {
    const exists = actions.value.find(a => a.key === action.key);
    if (exists) {
      console.warn(`[useTableBatchAction] Action already exists: ${action.key}`);
      return;
    }
    actions.value.push(action);
  };

  /**
   * 移除操作项
   */
  const removeAction = (actionKey: string): void => {
    const index = actions.value.findIndex(a => a.key === actionKey);
    if (index > -1) {
      actions.value.splice(index, 1);
    }
  };

  return {
    isEnabled,
    actions,
    selectedRows,
    selectedCount,
    hasSelected,
    showToolbar,
    setSelectedRows,
    clearSelected,
    executeAction,
    addAction,
    removeAction,
    isActionDisabled,
  };
}

export default useTableBatchAction;
