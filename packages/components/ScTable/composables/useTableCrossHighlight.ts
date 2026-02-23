/**
 * useTableCrossHighlight - 十字高亮优化 composable
 * 使用 CSS 变量驱动，减少 DOM 操作，提升性能
 * @author AI Assistant
 * @version 1.0.0
 */
import { ref, computed, watch, onUnmounted, nextTick, type Ref, type ComputedRef } from 'vue';

export interface CrossHighlightOptions {
  /** 是否启用 */
  enabled?: boolean;
  /** 高亮颜色（CSS 变量或颜色值） */
  highlightColor?: string;
  /** 交叉点颜色 */
  intersectionColor?: string;
  /** 边框颜色（CSS 变量或颜色值） */
  borderColor?: string;
  /** 边框宽度 */
  borderWidth?: number;
  /** 是否显示边框 */
  showBorder?: boolean;
}

export interface CrossHighlightState {
  /** 高亮行索引 */
  rowIndex: number;
  /** 高亮列索引 */
  colIndex: number;
  /** 高亮列属性名 */
  colProp: string | null;
}

export interface CrossHighlightReturn {
  /** 是否启用 */
  isEnabled: Ref<boolean>;
  /** 当前高亮状态 */
  highlightState: Ref<CrossHighlightState>;
  /** 是否有活动高亮 */
  hasHighlight: ComputedRef<boolean>;
  /** CSS 变量对象（用于 :style 绑定） */
  cssVars: ComputedRef<Record<string, string>>;
  /** 处理单元格点击 */
  handleCellClick: (rowIndex: number, colIndex: number, colProp?: string) => void;
  /** 清除高亮 */
  clearHighlight: () => void;
  /** 切换启用状态 */
  toggleEnabled: (value?: boolean) => void;
  /** 检查行是否高亮 */
  isRowHighlighted: (rowIndex: number) => boolean;
  /** 检查列是否高亮 */
  isColHighlighted: (colIndex: number) => boolean;
  /** 检查单元格是否为交叉点 */
  isIntersection: (rowIndex: number, colIndex: number) => boolean;
  /** 获取单元格高亮类名 */
  getCellClass: (rowIndex: number, colIndex: number) => string;
  /** 获取行高亮类名 */
  getRowClass: (rowIndex: number) => string;
}

/**
 * 十字高亮优化 composable
 */
export function useTableCrossHighlight(options: CrossHighlightOptions = {}): CrossHighlightReturn {
  const {
    enabled = false,
    highlightColor = 'var(--el-color-primary-light-9)',
    intersectionColor = 'var(--el-color-primary-light-7)',
    borderColor = 'var(--el-color-primary)',
    borderWidth = 3,
    showBorder = true,
  } = options;

  const isEnabled = ref(enabled);

  const highlightState = ref<CrossHighlightState>({
    rowIndex: -1,
    colIndex: -1,
    colProp: null,
  });

  /** 是否有活动高亮 */
  const hasHighlight = computed(() => {
    return highlightState.value.rowIndex >= 0 && highlightState.value.colIndex >= 0;
  });

  /**
   * CSS 变量对象
   * 通过 CSS 变量控制高亮，避免直接操作 DOM
   */
  const cssVars = computed(() => {
    const state = highlightState.value;
    return {
      '--cross-highlight-row': state.rowIndex >= 0 ? String(state.rowIndex) : '-1',
      '--cross-highlight-col': state.colIndex >= 0 ? String(state.colIndex) : '-1',
      '--cross-highlight-color': highlightColor,
      '--cross-intersection-color': intersectionColor,
      '--cross-border-color': borderColor,
      '--cross-border-width': `${borderWidth}px`,
      '--cross-border-display': showBorder ? 'block' : 'none',
    };
  });

  /**
   * 处理单元格点击
   */
  const handleCellClick = (rowIndex: number, colIndex: number, colProp?: string): void => {
    if (!isEnabled.value) return;

    // 点击同一位置则清除高亮
    if (highlightState.value.rowIndex === rowIndex && highlightState.value.colIndex === colIndex) {
      clearHighlight();
      return;
    }

    highlightState.value = {
      rowIndex,
      colIndex,
      colProp: colProp || null,
    };
  };

  /**
   * 清除高亮
   */
  const clearHighlight = (): void => {
    highlightState.value = {
      rowIndex: -1,
      colIndex: -1,
      colProp: null,
    };
  };

  /**
   * 切换启用状态
   */
  const toggleEnabled = (value?: boolean): void => {
    isEnabled.value = value !== undefined ? value : !isEnabled.value;
    if (!isEnabled.value) {
      clearHighlight();
    }
  };

  /**
   * 检查行是否高亮
   */
  const isRowHighlighted = (rowIndex: number): boolean => {
    return isEnabled.value && highlightState.value.rowIndex === rowIndex;
  };

  /**
   * 检查列是否高亮
   */
  const isColHighlighted = (colIndex: number): boolean => {
    return isEnabled.value && highlightState.value.colIndex === colIndex;
  };

  /**
   * 检查单元格是否为交叉点
   */
  const isIntersection = (rowIndex: number, colIndex: number): boolean => {
    return isRowHighlighted(rowIndex) && isColHighlighted(colIndex);
  };

  /**
   * 获取单元格高亮类名
   * 返回字符串，用于 :class 绑定
   */
  const getCellClass = (rowIndex: number, colIndex: number): string => {
    if (!isEnabled.value || !hasHighlight.value) return '';

    const classes: string[] = [];

    if (isRowHighlighted(rowIndex)) {
      classes.push('cross-highlight-row-cell');
    }

    if (isColHighlighted(colIndex)) {
      classes.push('cross-highlight-col-cell');
    }

    if (isIntersection(rowIndex, colIndex)) {
      classes.push('cross-highlight-intersection');
    }

    return classes.join(' ');
  };

  /**
   * 获取行高亮类名
   */
  const getRowClass = (rowIndex: number): string => {
    if (!isEnabled.value || !hasHighlight.value) return '';
    
    if (isRowHighlighted(rowIndex)) {
      return 'cross-highlight-row';
    }
    
    return '';
  };

  // 监听启用状态变化
  watch(isEnabled, (newVal) => {
    if (!newVal) {
      clearHighlight();
    }
  });

  return {
    isEnabled,
    highlightState,
    hasHighlight,
    cssVars,
    handleCellClick,
    clearHighlight,
    toggleEnabled,
    isRowHighlighted,
    isColHighlighted,
    isIntersection,
    getCellClass,
    getRowClass,
  };
}

/**
 * 生成十字高亮的 CSS 样式（可注入到组件中）
 */
export const crossHighlightStyles = `
/* 十字高亮基础样式 - 使用 CSS 变量驱动 */
.cross-highlight-enabled {
  --cross-highlight-color: var(--el-color-primary-light-9);
  --cross-intersection-color: var(--el-color-primary-light-7);
  --cross-border-width: 3px;
  --cross-border-color: var(--el-color-primary);
}

/* 行高亮 */
.cross-highlight-row {
  background: var(--cross-highlight-color) !important;
  position: relative;
}

.cross-highlight-row::before,
.cross-highlight-row::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: var(--cross-border-width);
  background: var(--cross-border-color);
  pointer-events: none;
  z-index: 2;
}

.cross-highlight-row::before {
  top: 0;
}

.cross-highlight-row::after {
  bottom: 0;
}

/* 行内单元格 */
.cross-highlight-row-cell {
  background: var(--cross-highlight-color) !important;
}

/* 列高亮单元格 */
.cross-highlight-col-cell {
  background: var(--cross-highlight-color) !important;
  position: relative;
}

.cross-highlight-col-cell::before,
.cross-highlight-col-cell::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: var(--cross-border-width);
  background: var(--cross-border-color);
  pointer-events: none;
}

.cross-highlight-col-cell::before {
  left: 0;
}

.cross-highlight-col-cell::after {
  right: 0;
}

/* 交叉点 */
.cross-highlight-intersection {
  background: var(--cross-intersection-color) !important;
  box-shadow: inset 0 0 0 var(--cross-border-width) var(--cross-border-color);
  position: relative;
  z-index: 3;
}

/* 交叉点不需要列的左右边框 */
.cross-highlight-intersection::before,
.cross-highlight-intersection::after {
  display: none;
}
`;

export default useTableCrossHighlight;
