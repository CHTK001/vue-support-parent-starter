import { ref, watch, onUnmounted } from 'vue';

/**
 * 数值动画配置选项
 */
export interface NumberAnimationOptions {
  /** 动画持续时间（毫秒） */
  duration?: number;
  /** 动画缓动函数 */
  easing?: (t: number) => number;
  /** 数值格式化函数 */
  formatter?: (value: number) => string | number;
  /** 是否启用动画 */
  enabled?: boolean;
  /** 动画延迟（毫秒） */
  delay?: number;
}

/**
 * 默认缓动函数 - easeOutCubic
 */
const defaultEasing = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

/**
 * 数值动画组合式函数
 * 提供平滑的数值变化动画效果
 */
export function useNumberAnimation(
  initialValue: number = 0,
  options: NumberAnimationOptions = {}
) {
  const {
    duration = 800,
    easing = defaultEasing,
    formatter = (value: number) => Math.round(value * 100) / 100,
    enabled = true,
    delay = 0
  } = options;

  // 当前显示的数值
  const displayValue = ref(initialValue);
  // 目标数值
  const targetValue = ref(initialValue);
  // 动画状态
  const isAnimating = ref(false);
  
  let animationId: number | null = null;
  let timeoutId: number | null = null;

  /**
   * 启动动画
   */
  const startAnimation = (from: number, to: number) => {
    if (!enabled || from === to) {
      displayValue.value = to;
      return;
    }

    isAnimating.value = true;
    const startTime = performance.now();
    const difference = to - from;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 应用缓动函数
      const easedProgress = easing(progress);
      
      // 计算当前值
      const currentValue = from + (difference * easedProgress);
      displayValue.value = currentValue;

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        displayValue.value = to;
        isAnimating.value = false;
        animationId = null;
      }
    };

    if (delay > 0) {
      timeoutId = window.setTimeout(() => {
        animationId = requestAnimationFrame(animate);
      }, delay);
    } else {
      animationId = requestAnimationFrame(animate);
    }
  };

  /**
   * 停止动画
   */
  const stopAnimation = () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    isAnimating.value = false;
  };

  /**
   * 设置新的目标值
   */
  const setValue = (newValue: number) => {
    if (newValue === targetValue.value) return;
    
    const oldTarget = targetValue.value;
    targetValue.value = newValue;
    
    // 停止当前动画
    stopAnimation();
    
    // 从当前显示值开始新动画
    startAnimation(displayValue.value, newValue);
  };

  /**
   * 立即设置值（无动画）
   */
  const setValueImmediate = (newValue: number) => {
    stopAnimation();
    targetValue.value = newValue;
    displayValue.value = newValue;
  };

  /**
   * 获取格式化后的显示值
   */
  const formattedValue = ref(formatter(initialValue));
  
  // 监听显示值变化，更新格式化值
  watch(displayValue, (newValue) => {
    formattedValue.value = formatter(newValue);
  }, { immediate: true });

  // 清理函数
  onUnmounted(() => {
    stopAnimation();
  });

  return {
    /** 当前显示的数值 */
    displayValue,
    /** 目标数值 */
    targetValue,
    /** 格式化后的显示值 */
    formattedValue,
    /** 是否正在动画中 */
    isAnimating,
    /** 设置新值（带动画） */
    setValue,
    /** 立即设置值（无动画） */
    setValueImmediate,
    /** 停止动画 */
    stopAnimation
  };
}

/**
 * 百分比动画
 */
export function usePercentageAnimation(
  initialValue: number = 0,
  options: Omit<NumberAnimationOptions, 'formatter'> = {}
) {
  return useNumberAnimation(initialValue, {
    ...options,
    formatter: (value: number) => `${Math.round(value * 10) / 10}%`
  });
}

/**
 * 字节大小动画
 */
export function useBytesAnimation(
  initialValue: number = 0,
  options: Omit<NumberAnimationOptions, 'formatter'> = {}
) {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return useNumberAnimation(initialValue, {
    ...options,
    formatter: formatBytes
  });
}

/**
 * 整数动画
 */
export function useIntegerAnimation(
  initialValue: number = 0,
  options: Omit<NumberAnimationOptions, 'formatter'> = {}
) {
  return useNumberAnimation(initialValue, {
    ...options,
    formatter: (value: number) => Math.round(value)
  });
}

/**
 * 网络速度动画
 */
export function useNetworkSpeedAnimation(
  initialValue: number = 0,
  options: Omit<NumberAnimationOptions, 'formatter'> = {}
) {
  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond === 0) return '0 B/s';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return useNumberAnimation(initialValue, {
    ...options,
    formatter: formatSpeed
  });
}
