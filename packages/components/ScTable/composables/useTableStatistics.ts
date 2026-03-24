/**
 * useTableStatistics - 数据统计 composable
 * 支持列统计功能（求和/平均/最大/最小/计数）
 */
import { ref, computed, type Ref, type ComputedRef } from 'vue';

/** 统计类型 */
export type StatType = 'sum' | 'avg' | 'max' | 'min' | 'count';

/** 列统计配置 */
export interface ColumnStatConfig {
  /** 列键名 */
  column: string;
  /** 统计类型 */
  types: StatType[];
  /** 小数位数 */
  precision?: number;
  /** 格式化函数 */
  formatter?: (value: number, type: StatType) => string;
}

/** 统计结果 */
export interface StatResult {
  column: string;
  type: StatType;
  value: number;
  formatted: string;
}

/** 统计选项 */
export interface StatisticsOptions {
  /** 是否启用 */
  enabled?: boolean;
  /** 列统计配置 */
  columns?: ColumnStatConfig[];
  /** 默认小数位数 */
  defaultPrecision?: number;
}

/** 统计返回值 */
export interface StatisticsReturn {
  /** 是否启用 */
  isEnabled: Ref<boolean>;
  /** 列统计配置 */
  columnConfigs: Ref<ColumnStatConfig[]>;
  /** 统计结果 */
  results: Ref<Map<string, StatResult[]>>;
  /** 计算统计 */
  calculate: (data: any[]) => void;
  /** 获取列统计结果 */
  getColumnStats: (column: string) => StatResult[];
  /** 获取单个统计值 */
  getStatValue: (column: string, type: StatType) => number | null;
  /** 添加列统计配置 */
  addColumnConfig: (config: ColumnStatConfig) => void;
  /** 移除列统计配置 */
  removeColumnConfig: (column: string) => void;
  /** 清除结果 */
  clearResults: () => void;
}

/**
 * 数据统计 composable
 */
export function useTableStatistics(options: StatisticsOptions = {}): StatisticsReturn {
  const {
    enabled = false,
    columns = [],
    defaultPrecision = 2,
  } = options;

  const isEnabled = ref(enabled);
  const columnConfigs = ref<ColumnStatConfig[]>([...columns]);
  const results = ref<Map<string, StatResult[]>>(new Map());

  /**
   * 格式化数值
   */
  const formatValue = (value: number, precision: number): string => {
    if (isNaN(value) || !isFinite(value)) return '-';
    return value.toFixed(precision);
  };

  /**
   * 计算单列统计
   */
  const calculateColumn = (data: any[], config: ColumnStatConfig): StatResult[] => {
    const values = data
      .map(row => row[config.column])
      .filter(v => v !== null && v !== undefined && !isNaN(Number(v)))
      .map(Number);

    const precision = config.precision ?? defaultPrecision;
    const statResults: StatResult[] = [];

    config.types.forEach(type => {
      let value = 0;

      switch (type) {
        case 'sum':
          value = values.reduce((acc, v) => acc + v, 0);
          break;
        case 'avg':
          value = values.length > 0 ? values.reduce((acc, v) => acc + v, 0) / values.length : 0;
          break;
        case 'max':
          value = values.length > 0 ? Math.max(...values) : 0;
          break;
        case 'min':
          value = values.length > 0 ? Math.min(...values) : 0;
          break;
        case 'count':
          value = values.length;
          break;
      }

      const formatted = config.formatter
        ? config.formatter(value, type)
        : formatValue(value, type === 'count' ? 0 : precision);

      statResults.push({
        column: config.column,
        type,
        value,
        formatted,
      });
    });

    return statResults;
  };

  /**
   * 计算所有统计
   */
  const calculate = (data: any[]): void => {
    if (!isEnabled.value) return;
    
    results.value.clear();

    columnConfigs.value.forEach(config => {
      const columnResults = calculateColumn(data, config);
      results.value.set(config.column, columnResults);
    });
  };

  /**
   * 获取列统计结果
   */
  const getColumnStats = (column: string): StatResult[] => {
    return results.value.get(column) || [];
  };

  /**
   * 获取单个统计值
   */
  const getStatValue = (column: string, type: StatType): number | null => {
    const columnStats = results.value.get(column);
    if (!columnStats) return null;
    
    const stat = columnStats.find(s => s.type === type);
    return stat?.value ?? null;
  };

  /**
   * 添加列统计配置
   */
  const addColumnConfig = (config: ColumnStatConfig): void => {
    const exists = columnConfigs.value.find(c => c.column === config.column);
    if (exists) {
      // 更新现有配置
      Object.assign(exists, config);
    } else {
      columnConfigs.value.push(config);
    }
  };

  /**
   * 移除列统计配置
   */
  const removeColumnConfig = (column: string): void => {
    const index = columnConfigs.value.findIndex(c => c.column === column);
    if (index > -1) {
      columnConfigs.value.splice(index, 1);
      results.value.delete(column);
    }
  };

  /**
   * 清除结果
   */
  const clearResults = (): void => {
    results.value.clear();
  };

  return {
    isEnabled,
    columnConfigs,
    results,
    calculate,
    getColumnStats,
    getStatValue,
    addColumnConfig,
    removeColumnConfig,
    clearResults,
  };
}

export default useTableStatistics;
