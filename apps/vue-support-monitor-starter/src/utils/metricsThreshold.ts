/**
 * 指标阈值配置
 * 用于定义CPU、内存、磁盘等指标的颜色阈值
 */

export interface ThresholdLevel {
  /** 正常阈值（绿色）- 低于此值显示绿色 */
  normal: number;
  /** 警告阈值（黄色）- 介于normal和critical之间显示黄色 */
  warning: number;
  /** 危险阈值（红色）- 高于此值显示红色 */
  critical: number;
}

export interface MetricsThresholdConfig {
  cpu: ThresholdLevel;
  memory: ThresholdLevel;
  disk: ThresholdLevel;
  temperature: ThresholdLevel;
  network: ThresholdLevel;
}

/**
 * 默认阈值配置
 * 与后端配置保持一致
 */
export const DEFAULT_THRESHOLDS: MetricsThresholdConfig = {
  // CPU使用率阈值配置
  cpu: {
    normal: 50.0,
    warning: 80.0,
    critical: 90.0,
  },
  // 内存使用率阈值配置
  memory: {
    normal: 60.0,
    warning: 80.0,
    critical: 90.0,
  },
  // 磁盘使用率阈值配置
  disk: {
    normal: 70.0,
    warning: 85.0,
    critical: 95.0,
  },
  // 温度阈值配置
  temperature: {
    normal: 50.0,
    warning: 70.0,
    critical: 85.0,
  },
  // 网络使用率阈值配置（基于带宽百分比）
  network: {
    normal: 60.0,
    warning: 80.0,
    critical: 90.0,
  },
};

/**
 * 颜色级别枚举
 */
export enum ColorLevel {
  NORMAL = 'normal',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

/**
 * 颜色代码映射
 */
export const COLOR_CODES = {
  [ColorLevel.NORMAL]: '#67c23a',   // 绿色
  [ColorLevel.WARNING]: '#e6a23c',  // 黄色
  [ColorLevel.CRITICAL]: '#f56c6c', // 红色
};

/**
 * Element Plus 类型映射
 */
export const ELEMENT_TYPES = {
  [ColorLevel.NORMAL]: 'success',
  [ColorLevel.WARNING]: 'warning',
  [ColorLevel.CRITICAL]: 'danger',
};

/**
 * 阈值工具类
 */
export class ThresholdUtils {
  private static thresholds: MetricsThresholdConfig = DEFAULT_THRESHOLDS;

  /**
   * 设置阈值配置
   */
  static setThresholds(config: Partial<MetricsThresholdConfig>) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...config };
  }

  /**
   * 获取指定指标的阈值配置
   */
  static getThreshold(metricType: keyof MetricsThresholdConfig): ThresholdLevel {
    return this.thresholds[metricType];
  }

  /**
   * 根据值获取颜色级别
   */
  static getColorLevel(metricType: keyof MetricsThresholdConfig, value: number | null | undefined): ColorLevel {
    if (value == null) {
      return ColorLevel.NORMAL;
    }

    const threshold = this.getThreshold(metricType);
    if (value >= threshold.critical) {
      return ColorLevel.CRITICAL;
    } else if (value >= threshold.warning) {
      return ColorLevel.WARNING;
    } else {
      return ColorLevel.NORMAL;
    }
  }

  /**
   * 根据值获取颜色代码
   */
  static getColorCode(metricType: keyof MetricsThresholdConfig, value: number | null | undefined): string {
    const level = this.getColorLevel(metricType, value);
    return COLOR_CODES[level];
  }

  /**
   * 根据值获取Element Plus类型
   */
  static getElementType(metricType: keyof MetricsThresholdConfig, value: number | null | undefined): string {
    const level = this.getColorLevel(metricType, value);
    return ELEMENT_TYPES[level];
  }

  /**
   * 根据值获取CSS类名
   */
  static getColorClass(metricType: keyof MetricsThresholdConfig, value: number | null | undefined): string {
    const level = this.getColorLevel(metricType, value);
    return `threshold-${level}`;
  }

  /**
   * 获取Element Plus进度条颜色配置
   */
  static getProgressColor(metricType: keyof MetricsThresholdConfig): Record<string, string> {
    const threshold = this.getThreshold(metricType);
    
    return {
      '0%': COLOR_CODES[ColorLevel.NORMAL],
      [`${threshold.normal}%`]: COLOR_CODES[ColorLevel.NORMAL],
      [`${threshold.warning}%`]: COLOR_CODES[ColorLevel.WARNING],
      [`${threshold.critical}%`]: COLOR_CODES[ColorLevel.CRITICAL],
      '100%': COLOR_CODES[ColorLevel.CRITICAL],
    };
  }

  /**
   * 检查指标是否超过警告阈值
   */
  static isWarningLevel(metricType: keyof MetricsThresholdConfig, value: number | null | undefined): boolean {
    if (value == null) return false;
    const threshold = this.getThreshold(metricType);
    return value >= threshold.warning;
  }

  /**
   * 检查指标是否超过危险阈值
   */
  static isCriticalLevel(metricType: keyof MetricsThresholdConfig, value: number | null | undefined): boolean {
    if (value == null) return false;
    const threshold = this.getThreshold(metricType);
    return value >= threshold.critical;
  }

  /**
   * 获取阈值描述文本
   */
  static getThresholdDescription(metricType: keyof MetricsThresholdConfig, value: number | null | undefined): string {
    if (value == null) return '数据无效';

    const level = this.getColorLevel(metricType, value);
    const metricName = this.getMetricDisplayName(metricType);

    switch (level) {
      case ColorLevel.NORMAL:
        return `${metricName}正常`;
      case ColorLevel.WARNING:
        return `${metricName}偏高，建议关注`;
      case ColorLevel.CRITICAL:
        return `${metricName}过高，需要处理`;
      default:
        return `${metricName}状态未知`;
    }
  }

  /**
   * 获取指标显示名称
   */
  private static getMetricDisplayName(metricType: keyof MetricsThresholdConfig): string {
    const nameMap = {
      cpu: 'CPU使用率',
      memory: '内存使用率',
      disk: '磁盘使用率',
      temperature: '温度',
      network: '网络使用率',
    };
    return nameMap[metricType] || metricType;
  }

  /**
   * 获取所有阈值配置
   */
  static getAllThresholds(): MetricsThresholdConfig {
    return { ...this.thresholds };
  }
}

/**
 * 便捷函数：获取颜色代码
 */
export function getMetricColor(metricType: keyof MetricsThresholdConfig, value: number | null | undefined): string {
  return ThresholdUtils.getColorCode(metricType, value);
}

/**
 * 便捷函数：获取颜色级别
 */
export function getMetricColorLevel(metricType: keyof MetricsThresholdConfig, value: number | null | undefined): ColorLevel {
  return ThresholdUtils.getColorLevel(metricType, value);
}

/**
 * 便捷函数：获取Element Plus类型
 */
export function getMetricElementType(metricType: keyof MetricsThresholdConfig, value: number | null | undefined): string {
  return ThresholdUtils.getElementType(metricType, value);
}

/**
 * 便捷函数：获取CSS类名
 */
export function getMetricColorClass(metricType: keyof MetricsThresholdConfig, value: number | null | undefined): string {
  return ThresholdUtils.getColorClass(metricType, value);
}

/**
 * 便捷函数：获取进度条颜色
 */
export function getMetricProgressColor(metricType: keyof MetricsThresholdConfig): Record<string, string> {
  return ThresholdUtils.getProgressColor(metricType);
}
