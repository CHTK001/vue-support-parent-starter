/**
 * useTablePerformance - 表格性能优化 composable
 * 提供防抖布局、性能监控、大数据量检测等功能
 * @author AI Assistant
 * @version 1.0.0
 */
import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue';

export interface PerformanceOptions {
  /** 是否启用性能监控（仅开发模式） */
  enableMonitor?: boolean;
  /** doLayout 防抖延迟（毫秒） */
  layoutDebounce?: number;
  /** 大数据量阈值（超过此数量提示切换虚拟滚动） */
  largeDataThreshold?: number;
  /** 渲染警告阈值（毫秒），超过此时间输出警告 */
  renderWarnThreshold?: number;
}

export interface PerformanceMetrics {
  /** 最近一次渲染耗时 */
  lastRenderTime: number;
  /** 平均渲染耗时 */
  avgRenderTime: number;
  /** 总渲染次数 */
  renderCount: number;
  /** 当前数据行数 */
  rowCount: number;
  /** 是否大数据量 */
  isLargeData: boolean;
}

export interface PerformanceReturn {
  /** 性能指标 */
  metrics: Ref<PerformanceMetrics>;
  /** 是否大数据量 */
  isLargeData: Ref<boolean>;
  /** 是否显示大数据量提示 */
  showLargeDataTip: Ref<boolean>;
  /** 防抖后的 doLayout */
  debouncedDoLayout: (layoutFn: () => void) => void;
  /** 开始计时 */
  startTiming: (label?: string) => void;
  /** 结束计时并记录 */
  endTiming: (label?: string) => number;
  /** 记录数据量 */
  recordDataSize: (count: number) => void;
  /** 关闭大数据量提示 */
  dismissLargeDataTip: () => void;
  /** 重置指标 */
  resetMetrics: () => void;
  /** 获取性能报告 */
  getReport: () => string;
}

/**
 * 表格性能优化 composable
 */
export function useTablePerformance(options: PerformanceOptions = {}): PerformanceReturn {
  const {
    enableMonitor = import.meta.env?.DEV ?? false,
    layoutDebounce = 50,
    largeDataThreshold = 500,
    renderWarnThreshold = 100,
  } = options;

  // 性能指标
  const metrics = ref<PerformanceMetrics>({
    lastRenderTime: 0,
    avgRenderTime: 0,
    renderCount: 0,
    rowCount: 0,
    isLargeData: false,
  });

  // 大数据量状态
  const isLargeData = ref(false);
  const showLargeDataTip = ref(false);
  const tipDismissed = ref(false);

  // 计时器
  let timingStart = 0;
  let timingLabel = '';
  const renderTimes: number[] = [];
  const MAX_RENDER_HISTORY = 10;

  // 防抖相关
  let layoutTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingLayoutFn: (() => void) | null = null;

  /**
   * 防抖后的 doLayout
   */
  const debouncedDoLayout = (layoutFn: () => void): void => {
    pendingLayoutFn = layoutFn;

    if (layoutTimer) {
      clearTimeout(layoutTimer);
    }

    layoutTimer = setTimeout(() => {
      if (pendingLayoutFn) {
        startTiming('doLayout');
        pendingLayoutFn();
        const time = endTiming('doLayout');
        
        if (enableMonitor && time > renderWarnThreshold) {
          console.warn(`[ScTable Performance] doLayout 耗时 ${time}ms，超过阈值 ${renderWarnThreshold}ms`);
        }
      }
      pendingLayoutFn = null;
      layoutTimer = null;
    }, layoutDebounce);
  };

  /**
   * 开始计时
   */
  const startTiming = (label = 'render'): void => {
    if (!enableMonitor) return;
    timingStart = performance.now();
    timingLabel = label;
  };

  /**
   * 结束计时并记录
   */
  const endTiming = (label = 'render'): number => {
    if (!enableMonitor || !timingStart) return 0;

    const elapsed = performance.now() - timingStart;
    timingStart = 0;

    // 记录渲染时间
    renderTimes.push(elapsed);
    if (renderTimes.length > MAX_RENDER_HISTORY) {
      renderTimes.shift();
    }

    // 更新指标
    metrics.value.lastRenderTime = Math.round(elapsed * 100) / 100;
    metrics.value.renderCount++;
    metrics.value.avgRenderTime = Math.round(
      (renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length) * 100
    ) / 100;

    // 开发模式输出
    if (enableMonitor && elapsed > renderWarnThreshold) {
      console.warn(`[ScTable Performance] ${label} 耗时 ${elapsed.toFixed(2)}ms`);
    }

    return elapsed;
  };

  /**
   * 记录数据量
   */
  const recordDataSize = (count: number): void => {
    metrics.value.rowCount = count;
    const wasLarge = isLargeData.value;
    isLargeData.value = count > largeDataThreshold;
    metrics.value.isLargeData = isLargeData.value;

    // 首次检测到大数据量时显示提示
    if (isLargeData.value && !wasLarge && !tipDismissed.value) {
      showLargeDataTip.value = true;
      
      if (enableMonitor) {
        console.warn(
          `[ScTable Performance] 检测到大数据量 (${count} 行)，建议使用虚拟滚动模式 (layout="virtual")`
        );
      }
    }
  };

  /**
   * 关闭大数据量提示
   */
  const dismissLargeDataTip = (): void => {
    showLargeDataTip.value = false;
    tipDismissed.value = true;
  };

  /**
   * 重置指标
   */
  const resetMetrics = (): void => {
    metrics.value = {
      lastRenderTime: 0,
      avgRenderTime: 0,
      renderCount: 0,
      rowCount: 0,
      isLargeData: false,
    };
    renderTimes.length = 0;
    isLargeData.value = false;
    showLargeDataTip.value = false;
    tipDismissed.value = false;
  };

  /**
   * 获取性能报告
   */
  const getReport = (): string => {
    const m = metrics.value;
    return `
ScTable 性能报告
================
数据行数: ${m.rowCount}
渲染次数: ${m.renderCount}
最近渲染耗时: ${m.lastRenderTime}ms
平均渲染耗时: ${m.avgRenderTime}ms
是否大数据量: ${m.isLargeData ? '是' : '否'}
大数据量阈值: ${largeDataThreshold}
渲染警告阈值: ${renderWarnThreshold}ms
    `.trim();
  };

  // 清理
  onUnmounted(() => {
    if (layoutTimer) {
      clearTimeout(layoutTimer);
      layoutTimer = null;
    }
  });

  return {
    metrics,
    isLargeData,
    showLargeDataTip,
    debouncedDoLayout,
    startTiming,
    endTiming,
    recordDataSize,
    dismissLargeDataTip,
    resetMetrics,
    getReport,
  };
}

/**
 * 创建简单防抖函数
 */
export function createDebounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };
}

/**
 * 创建节流函数
 */
export function createThrottle<T extends (...args: any[]) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    } else {
      // 确保最后一次调用会被执行
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        lastCall = Date.now();
        fn(...args);
        timer = null;
      }, limit - (now - lastCall));
    }
  };
}

/**
 * RAF 节流（用于滚动等高频事件）
 */
export function createRAFThrottle<T extends (...args: any[]) => void>(
  fn: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;

  return (...args: Parameters<T>) => {
    if (rafId) return;

    rafId = requestAnimationFrame(() => {
      fn(...args);
      rafId = null;
    });
  };
}

export default useTablePerformance;
