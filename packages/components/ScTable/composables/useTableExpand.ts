/**
 * useTableExpand - 表格行展开 composable
 * 管理行展开状态
 */
import { ref, computed, type Ref, type ComputedRef } from 'vue';

/** 展开选项 */
export interface ExpandOptions {
  /** 是否启用展开 */
  enabled?: boolean;
  /** 手风琴模式（同时只展开一行） */
  accordion?: boolean;
  /** 默认展开的行键值 */
  defaultExpandKeys?: (string | number)[];
  /** 行键字段名 */
  rowKey?: string;
}

/** 展开返回值 */
export interface ExpandReturn {
  /** 是否启用 */
  isEnabled: Ref<boolean>;
  /** 是否手风琴模式 */
  isAccordion: Ref<boolean>;
  /** 展开的行键值数组 */
  expandedRowKeys: Ref<(string | number)[]>;
  /** 是否有展开的行 */
  hasExpanded: ComputedRef<boolean>;
  /** 展开行数量 */
  expandedCount: ComputedRef<number>;
  /** 展开指定行 */
  expand: (rowKey: string | number) => void;
  /** 收起指定行 */
  collapse: (rowKey: string | number) => void;
  /** 切换行展开状态 */
  toggle: (rowKey: string | number) => void;
  /** 展开所有行 */
  expandAll: (rowKeys: (string | number)[]) => void;
  /** 收起所有行 */
  collapseAll: () => void;
  /** 检查行是否展开 */
  isExpanded: (rowKey: string | number) => boolean;
  /** 设置展开的行 */
  setExpandedKeys: (keys: (string | number)[]) => void;
  /** 获取行键值 */
  getRowKey: (row: any) => string | number;
}

/**
 * 表格行展开 composable
 */
export function useTableExpand(options: ExpandOptions = {}): ExpandReturn {
  const {
    enabled = false,
    accordion = false,
    defaultExpandKeys = [],
    rowKey = 'id',
  } = options;

  const isEnabled = ref(enabled);
  const isAccordion = ref(accordion);
  const expandedRowKeys = ref<(string | number)[]>([...defaultExpandKeys]);

  /** 是否有展开的行 */
  const hasExpanded = computed(() => expandedRowKeys.value.length > 0);

  /** 展开行数量 */
  const expandedCount = computed(() => expandedRowKeys.value.length);

  /**
   * 获取行键值
   */
  const getRowKey = (row: any): string | number => {
    return row[rowKey];
  };

  /**
   * 检查行是否展开
   */
  const isExpanded = (key: string | number): boolean => {
    return expandedRowKeys.value.includes(key);
  };

  /**
   * 展开指定行
   */
  const expand = (key: string | number): void => {
    if (!isEnabled.value) return;

    if (isAccordion.value) {
      // 手风琴模式：只展开一行
      expandedRowKeys.value = [key];
    } else {
      if (!isExpanded(key)) {
        expandedRowKeys.value.push(key);
      }
    }
  };

  /**
   * 收起指定行
   */
  const collapse = (key: string | number): void => {
    const index = expandedRowKeys.value.indexOf(key);
    if (index > -1) {
      expandedRowKeys.value.splice(index, 1);
    }
  };

  /**
   * 切换行展开状态
   */
  const toggle = (key: string | number): void => {
    if (isExpanded(key)) {
      collapse(key);
    } else {
      expand(key);
    }
  };

  /**
   * 展开所有行
   */
  const expandAll = (rowKeys: (string | number)[]): void => {
    if (!isEnabled.value) return;

    if (isAccordion.value) {
      // 手风琴模式只展开第一行
      expandedRowKeys.value = rowKeys.length > 0 ? [rowKeys[0]] : [];
    } else {
      expandedRowKeys.value = [...rowKeys];
    }
  };

  /**
   * 收起所有行
   */
  const collapseAll = (): void => {
    expandedRowKeys.value = [];
  };

  /**
   * 设置展开的行
   */
  const setExpandedKeys = (keys: (string | number)[]): void => {
    if (isAccordion.value && keys.length > 1) {
      expandedRowKeys.value = [keys[0]];
    } else {
      expandedRowKeys.value = [...keys];
    }
  };

  return {
    isEnabled,
    isAccordion,
    expandedRowKeys,
    hasExpanded,
    expandedCount,
    expand,
    collapse,
    toggle,
    expandAll,
    collapseAll,
    isExpanded,
    setExpandedKeys,
    getRowKey,
  };
}

export default useTableExpand;
