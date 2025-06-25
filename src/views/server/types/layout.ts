/**
 * 布局相关类型定义
 */

import type { ComponentPosition } from './component';

// 布局项接口
export interface LayoutItem {
  i: string;                    // 组件唯一标识
  x: number;                    // X坐标
  y: number;                    // Y坐标
  w: number;                    // 宽度
  h: number;                    // 高度
  minW?: number;                // 最小宽度
  maxW?: number;                // 最大宽度
  minH?: number;                // 最小高度
  maxH?: number;                // 最大高度
  static?: boolean;             // 是否静态（不可拖拽调整）
  isDraggable?: boolean;        // 是否可拖拽
  isResizable?: boolean;        // 是否可调整大小
  componentType?: string;       // 组件类型
  componentId?: number;         // 组件ID
  [key: string]: any;           // 其他组件数据
}

// 布局配置接口
export interface LayoutConfig {
  layout: LayoutItem[];         // 布局项数组
  colNum: number;               // 列数
  rowHeight: number;            // 行高
  margin: [number, number];     // 边距 [x, y]
  containerPadding: [number, number]; // 容器内边距
  isDraggable: boolean;         // 是否可拖拽
  isResizable: boolean;         // 是否可调整大小
  isMirrored: boolean;          // 是否镜像
  verticalCompact: boolean;     // 是否垂直紧凑
  useCSSTransforms: boolean;    // 是否使用CSS变换
  responsive: boolean;          // 是否响应式
  breakpoints?: LayoutBreakpoints; // 响应式断点
}

// 响应式断点配置
export interface LayoutBreakpoints {
  lg: number;   // 大屏幕
  md: number;   // 中等屏幕
  sm: number;   // 小屏幕
  xs: number;   // 超小屏幕
  xxs: number;  // 极小屏幕
}

// 响应式布局配置
export interface ResponsiveLayoutConfig {
  lg: LayoutItem[];
  md: LayoutItem[];
  sm: LayoutItem[];
  xs: LayoutItem[];
  xxs: LayoutItem[];
}

// 布局模板接口
export interface LayoutTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  preview?: string;
  config: LayoutConfig;
  responsiveConfig?: ResponsiveLayoutConfig;
  components: LayoutTemplateComponent[];
  createTime: string;
  updateTime: string;
  version: string;
  author?: string;
  isDefault?: boolean;
  isPublic?: boolean;
}

// 布局模板组件
export interface LayoutTemplateComponent {
  id: string;
  name: string;
  title: string;
  type: string;
  position: ComponentPosition;
  config: any;
  dataSource?: {
    type: string;
    expression: string;
  };
}

// 布局操作历史
export interface LayoutHistory {
  id: string;
  action: LayoutAction;
  timestamp: number;
  layout: LayoutItem[];
  description?: string;
  userId?: string;
}

// 布局操作类型
export type LayoutAction = 
  | 'create'
  | 'update'
  | 'delete'
  | 'move'
  | 'resize'
  | 'add_component'
  | 'remove_component'
  | 'import'
  | 'export'
  | 'reset';

// 布局导出配置
export interface LayoutExportConfig {
  includeData: boolean;         // 是否包含数据
  includeComponents: boolean;   // 是否包含组件配置
  format: 'json' | 'yaml';     // 导出格式
  compression: boolean;         // 是否压缩
}

// 布局导入结果
export interface LayoutImportResult {
  success: boolean;
  message: string;
  layout?: LayoutTemplate;
  errors?: string[];
  warnings?: string[];
}

// 布局验证结果
export interface LayoutValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions?: string[];
}

// 布局统计信息
export interface LayoutStatistics {
  totalComponents: number;
  componentsByType: Record<string, number>;
  layoutDensity: number;        // 布局密度
  averageComponentSize: {
    width: number;
    height: number;
  };
  emptyAreas: ComponentPosition[]; // 空白区域
}

// 布局编辑器状态
export interface LayoutEditorState {
  mode: 'view' | 'edit' | 'preview';
  selectedComponent?: string;
  clipboard?: LayoutItem[];
  history: LayoutHistory[];
  historyIndex: number;
  isDirty: boolean;             // 是否有未保存的更改
  isLoading: boolean;
  error?: string;
}

// 布局编辑器配置
export interface LayoutEditorConfig {
  showGrid: boolean;            // 显示网格
  snapToGrid: boolean;          // 对齐网格
  showRuler: boolean;           // 显示标尺
  showGuides: boolean;          // 显示参考线
  autoSave: boolean;            // 自动保存
  autoSaveInterval: number;     // 自动保存间隔（秒）
  maxHistorySize: number;       // 最大历史记录数
  enableKeyboardShortcuts: boolean; // 启用键盘快捷键
}

// 布局事件接口
export interface LayoutEvent {
  type: string;
  layout: LayoutItem[];
  item?: LayoutItem;
  oldItem?: LayoutItem;
  placeholder?: LayoutItem;
  event?: Event;
}

// 布局约束接口
export interface LayoutConstraints {
  minComponents?: number;       // 最少组件数
  maxComponents?: number;       // 最多组件数
  allowedTypes?: string[];      // 允许的组件类型
  forbiddenTypes?: string[];    // 禁止的组件类型
  requiredComponents?: string[]; // 必需的组件
  maxWidth?: number;            // 最大宽度
  maxHeight?: number;           // 最大高度
  aspectRatio?: number;         // 宽高比
}

// 布局性能配置
export interface LayoutPerformanceConfig {
  enableVirtualization: boolean; // 启用虚拟化
  renderThreshold: number;       // 渲染阈值
  updateThrottle: number;        // 更新节流时间
  enableLazyLoading: boolean;    // 启用懒加载
  cacheSize: number;             // 缓存大小
}

// 布局主题配置
export interface LayoutTheme {
  name: string;
  colors: {
    background: string;
    grid: string;
    border: string;
    selected: string;
    hover: string;
    placeholder: string;
  };
  spacing: {
    margin: number;
    padding: number;
    gap: number;
  };
  typography: {
    fontSize: number;
    fontFamily: string;
    fontWeight: string;
  };
}
