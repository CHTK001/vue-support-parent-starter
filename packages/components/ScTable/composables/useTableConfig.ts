/**
 * ScTable 配置管理 Composable
 * 处理表格配置、列配置、localStorage 持久化等
 */
import { ref, reactive, computed, watch, onMounted, onUnmounted, type Ref } from 'vue';
import { localStorageProxy } from '@repo/utils';

export interface ColumnConfig {
  prop: string;
  label: string;
  visible: boolean;
  width?: number;
  fixed?: 'left' | 'right' | boolean;
  sortable?: boolean;
  order?: number;
}

export interface TableConfigState {
  /** 列配置 */
  columns: ColumnConfig[];
  /** 是否显示序号列 */
  showIndex: boolean;
  /** 是否显示选择列 */
  showSelection: boolean;
  /** 是否显示边框 */
  border: boolean;
  /** 是否显示斑马纹 */
  stripe: boolean;
  /** 表格尺寸 */
  size: 'large' | 'default' | 'small';
  /** 行高 */
  rowHeight: number;
  /** 列宽调整后是否保存 */
  saveColumnWidth: boolean;
}

export interface UseTableConfigOptions {
  /** 存储 key */
  storageKey: string;
  /** 初始列配置 */
  initialColumns?: ColumnConfig[];
  /** 是否自动保存 */
  autoSave?: boolean;
  /** 防抖延迟 */
  debounceDelay?: number;
}

export function useTableConfig(options: UseTableConfigOptions) {
  const {
    storageKey,
    initialColumns = [],
    autoSave = true,
    debounceDelay = 300,
  } = options;
  
  // 配置状态
  const configState = reactive<TableConfigState>({
    columns: [],
    showIndex: true,
    showSelection: false,
    border: true,
    stripe: false,
    size: 'default',
    rowHeight: 50,
    saveColumnWidth: true,
  });
  
  // 配置弹窗显示状态
  const configDialogVisible = ref(false);
  
  // 防抖定时器
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  
  // 存储 key
  const configStorageKey = computed(() => `${storageKey}_config`);
  
  /**
   * 从 localStorage 加载配置
   */
  const loadConfig = () => {
    try {
      const saved = localStorageProxy().getItem(configStorageKey.value);
      if (saved) {
        // 合并配置，保留用户自定义
        Object.assign(configState, saved);
        
        // 如果有初始列但没有保存的列配置，使用初始列
        if (initialColumns.length && !saved.columns?.length) {
          configState.columns = initialColumns.map((col, index) => ({
            ...col,
            visible: col.visible !== false,
            order: index,
          }));
        }
      } else if (initialColumns.length) {
        // 没有保存的配置，使用初始列
        configState.columns = initialColumns.map((col, index) => ({
          ...col,
          visible: col.visible !== false,
          order: index,
        }));
      }
    } catch (error) {
      console.error('加载表格配置失败:', error);
    }
  };
  
  /**
   * 保存配置到 localStorage
   */
  const saveConfig = () => {
    if (!autoSave) return;
    
    // 清除之前的定时器
    if (saveTimer) {
      clearTimeout(saveTimer);
    }
    
    // 防抖保存
    saveTimer = setTimeout(() => {
      try {
        localStorageProxy().setItem(configStorageKey.value, {
          ...configState,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error('保存表格配置失败:', error);
      }
    }, debounceDelay);
  };
  
  /**
   * 立即保存配置（无防抖）
   */
  const saveConfigImmediately = () => {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    
    try {
      localStorageProxy().setItem(configStorageKey.value, {
        ...configState,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('保存表格配置失败:', error);
    }
  };
  
  /**
   * 重置配置为默认值
   */
  const resetConfig = () => {
    configState.columns = initialColumns.map((col, index) => ({
      ...col,
      visible: col.visible !== false,
      order: index,
    }));
    configState.showIndex = true;
    configState.showSelection = false;
    configState.border = true;
    configState.stripe = false;
    configState.size = 'default';
    configState.rowHeight = 50;
    configState.saveColumnWidth = true;
    
    saveConfigImmediately();
  };
  
  /**
   * 清除保存的配置
   */
  const clearConfig = () => {
    try {
      localStorageProxy().removeItem(configStorageKey.value);
    } catch (error) {
      console.error('清除表格配置失败:', error);
    }
  };
  
  /**
   * 更新列可见性
   */
  const setColumnVisible = (prop: string, visible: boolean) => {
    const column = configState.columns.find(col => col.prop === prop);
    if (column) {
      column.visible = visible;
      saveConfig();
    }
  };
  
  /**
   * 批量更新列可见性
   */
  const setColumnsVisible = (visibleProps: string[]) => {
    configState.columns.forEach(col => {
      col.visible = visibleProps.includes(col.prop);
    });
    saveConfig();
  };
  
  /**
   * 更新列宽
   */
  const setColumnWidth = (prop: string, width: number) => {
    if (!configState.saveColumnWidth) return;
    
    const column = configState.columns.find(col => col.prop === prop);
    if (column) {
      column.width = width;
      saveConfig();
    }
  };
  
  /**
   * 更新列顺序
   */
  const setColumnOrder = (props: string[]) => {
    props.forEach((prop, index) => {
      const column = configState.columns.find(col => col.prop === prop);
      if (column) {
        column.order = index;
      }
    });
    configState.columns.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    saveConfig();
  };
  
  /**
   * 更新列固定状态
   */
  const setColumnFixed = (prop: string, fixed: 'left' | 'right' | boolean) => {
    const column = configState.columns.find(col => col.prop === prop);
    if (column) {
      column.fixed = fixed;
      saveConfig();
    }
  };
  
  /**
   * 获取可见列
   */
  const visibleColumns = computed(() => 
    configState.columns
      .filter(col => col.visible)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  );
  
  /**
   * 更新整体配置
   */
  const updateConfig = (config: Partial<TableConfigState>) => {
    Object.assign(configState, config);
    saveConfig();
  };
  
  /**
   * 打开配置弹窗
   */
  const openConfigDialog = () => {
    configDialogVisible.value = true;
  };
  
  /**
   * 关闭配置弹窗
   */
  const closeConfigDialog = () => {
    configDialogVisible.value = false;
  };
  
  /**
   * 初始化列配置
   */
  const initColumns = (columns: ColumnConfig[]) => {
    // 保留已有配置，合并新列
    const existingMap = new Map(configState.columns.map(col => [col.prop, col]));
    
    configState.columns = columns.map((col, index) => {
      const existing = existingMap.get(col.prop);
      if (existing) {
        return {
          ...col,
          ...existing,
          label: col.label, // 始终使用新的 label
        };
      }
      return {
        ...col,
        visible: col.visible !== false,
        order: index,
      };
    });
  };
  
  // 组件卸载时清理
  onUnmounted(() => {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
  });
  
  return {
    // 状态
    configState,
    configDialogVisible,
    visibleColumns,
    // 方法
    loadConfig,
    saveConfig,
    saveConfigImmediately,
    resetConfig,
    clearConfig,
    setColumnVisible,
    setColumnsVisible,
    setColumnWidth,
    setColumnOrder,
    setColumnFixed,
    updateConfig,
    openConfigDialog,
    closeConfigDialog,
    initColumns,
  };
}
