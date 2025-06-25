/**
 * 组件相关类型定义
 */

// 组件类型枚举
export const COMPONENT_TYPES = {
  CARD: 'card',
  GAUGE: 'gauge',
  LINE_CHART: 'line',
  BAR_CHART: 'bar',
  PIE_CHART: 'pie',
  TABLE: 'table',
  TEXT: 'text',
  PROGRESS: 'progress',
  METRIC: 'metric',
} as const;

export type ComponentType = typeof COMPONENT_TYPES[keyof typeof COMPONENT_TYPES];

// 数据源类型枚举
export const DATA_SOURCE_TYPES = {
  SQL: 'sql',
  PROMETHEUS: 'prometheus',
  API: 'api',
  STATIC: 'static',
  REALTIME: 'realtime',
} as const;

export type DataSourceType = typeof DATA_SOURCE_TYPES[keyof typeof DATA_SOURCE_TYPES];

// 表达式类型枚举
export const EXPRESSION_TYPES = {
  SQL: 'sql',
  PROMETHEUS: 'prometheus',
  JAVASCRIPT: 'javascript',
  TEMPLATE: 'template',
} as const;

export type ExpressionType = typeof EXPRESSION_TYPES[keyof typeof EXPRESSION_TYPES];

// 组件详情配置接口
export interface ServerDetailComponent {
  monitorSysGenServerDetailComponentId?: number;
  monitorSysGenServerId: number;
  monitorSysGenServerDetailComponentName: string;
  monitorSysGenServerDetailComponentTitle: string;
  monitorSysGenServerDetailComponentType: string;
  monitorSysGenServerDetailComponentExpressionType: string;
  monitorSysGenServerDetailComponentExpression: string;
  monitorSysGenServerDetailComponentPosition?: string;
  monitorSysGenServerDetailComponentChartConfig?: string;
  monitorSysGenServerDetailComponentRefreshInterval?: number;
  monitorSysGenServerDetailComponentEnabled?: number;
  monitorSysGenServerDetailComponentSortOrder?: number;
  monitorSysGenServerDetailComponentDesc?: string;
  monitorSysGenServerDetailComponentCreateTime?: string;
  monitorSysGenServerDetailComponentUpdateTime?: string;
}

// 组件配置表单接口
export interface ComponentConfigForm {
  name: string;
  title: string;
  type: ComponentType;
  dataSourceType: DataSourceType;
  expressionType: ExpressionType;
  expression: string;
  description?: string;
  refreshInterval: number;
  enabled: boolean;
  sortOrder: number;
  position: ComponentPosition;
  chartConfig: ChartConfig;
}

// 组件位置配置
export interface ComponentPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

// 图表配置接口
export interface ChartConfig {
  // 通用配置
  theme?: string;
  backgroundColor?: string;
  title?: ChartTitleConfig;
  legend?: ChartLegendConfig;
  tooltip?: ChartTooltipConfig;
  
  // 坐标轴配置（适用于线图、柱图等）
  xAxis?: ChartAxisConfig;
  yAxis?: ChartAxisConfig;
  
  // 系列配置
  series?: ChartSeriesConfig[];
  
  // 仪表盘特有配置
  gauge?: GaugeConfig;
  
  // 表格特有配置
  table?: TableConfig;
  
  // 卡片特有配置
  card?: CardConfig;
}

// 图表标题配置
export interface ChartTitleConfig {
  show: boolean;
  text?: string;
  textStyle?: {
    color?: string;
    fontSize?: number;
    fontWeight?: string;
  };
  left?: string | number;
  top?: string | number;
}

// 图表图例配置
export interface ChartLegendConfig {
  show: boolean;
  type?: 'plain' | 'scroll';
  orient?: 'horizontal' | 'vertical';
  left?: string | number;
  top?: string | number;
  right?: string | number;
  bottom?: string | number;
}

// 图表提示框配置
export interface ChartTooltipConfig {
  show: boolean;
  trigger?: 'item' | 'axis' | 'none';
  formatter?: string;
}

// 图表坐标轴配置
export interface ChartAxisConfig {
  show: boolean;
  type?: 'category' | 'value' | 'time' | 'log';
  name?: string;
  nameLocation?: 'start' | 'middle' | 'end';
  min?: number | string;
  max?: number | string;
  axisLabel?: {
    show?: boolean;
    formatter?: string;
    rotate?: number;
  };
}

// 图表系列配置
export interface ChartSeriesConfig {
  name: string;
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'gauge';
  data?: any[];
  color?: string;
  smooth?: boolean;
  stack?: string;
  areaStyle?: any;
  itemStyle?: any;
  lineStyle?: any;
  label?: {
    show?: boolean;
    position?: string;
    formatter?: string;
  };
}

// 仪表盘配置
export interface GaugeConfig {
  min: number;
  max: number;
  splitNumber: number;
  radius?: string;
  startAngle?: number;
  endAngle?: number;
  clockwise?: boolean;
  axisLine?: {
    lineStyle?: {
      width?: number;
      color?: Array<[number, string]>;
    };
  };
  pointer?: {
    length?: string;
    width?: number;
  };
  detail?: {
    formatter?: string;
    fontSize?: number;
    color?: string;
  };
}

// 表格配置
export interface TableConfig {
  columns: TableColumnConfig[];
  pagination?: {
    enabled: boolean;
    pageSize: number;
  };
  stripe?: boolean;
  border?: boolean;
  size?: 'large' | 'default' | 'small';
  maxHeight?: number;
}

// 表格列配置
export interface TableColumnConfig {
  prop: string;
  label: string;
  width?: number;
  minWidth?: number;
  fixed?: 'left' | 'right';
  sortable?: boolean;
  formatter?: string;
  align?: 'left' | 'center' | 'right';
  type?: 'selection' | 'index' | 'expand';
}

// 卡片配置
export interface CardConfig {
  showIcon?: boolean;
  icon?: string;
  iconColor?: string;
  valueFormat?: string;
  unit?: string;
  trend?: {
    show: boolean;
    type?: 'up' | 'down' | 'flat';
    value?: number;
    format?: string;
  };
  thresholds?: Array<{
    value: number;
    color: string;
    operator: '>' | '>=' | '<' | '<=' | '==' | '!=';
  }>;
}

// 组件数据接口
export interface ComponentData {
  timestamp: number;
  values: Record<string, any>;
  series?: Array<{
    name: string;
    data: Array<{
      timestamp: number;
      value: any;
    }>;
  }>;
}

// 组件模板接口
export interface ComponentTemplate {
  id: string;
  name: string;
  description?: string;
  type: ComponentType;
  config: ComponentConfigForm;
  preview?: string;
  category?: string;
  tags?: string[];
}

// 组件验证结果
export interface ComponentValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
