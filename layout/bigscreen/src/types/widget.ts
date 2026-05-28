/**
 * 大屏编辑器核心类型定义
 * @author CH
 * @version 1.0.0
 * @since 2026-05-26
 */

/** 唯一标识符 */
export type WidgetId = string;

/** Widget 类型键（必须匹配注册的 WidgetTypeDefinition.type） */
export type WidgetTypeKey = string;

/** Widget 分类 */
export type WidgetCategory =
  | "panel"
  | "panel-title"
  | "header"
  | "decoration"
  | "geometry"
  | "chart"
  | "text"
  | "digital"
  | "iframe"
  | "custom";

/** 配置面板字段类型 */
export type ConfigFieldType = "text" | "number" | "boolean" | "select" | "slider" | "color" | "textarea";

/** 配置面板字段定义 */
export interface ConfigFieldDefinition {
  key: string;
  label: string;
  type: ConfigFieldType;
  defaultValue?: unknown;
  options?: Array<{ label: string; value: unknown }>;
  min?: number;
  max?: number;
  step?: number;
  group?: string;
  visibleWhen?: (widget: WidgetConfig) => boolean;
}

/** Widget 类型定义（用于注册表和 palette） */
export interface WidgetTypeDefinition {
  type: WidgetTypeKey;
  label: string;
  category: WidgetCategory;
  icon: string;
  description?: string;
  variants: string[];
  defaultVariant: string;
  defaultConfig: Partial<WidgetConfig>;
  minWidth: number;
  minHeight: number;
  defaultWidth: number;
  defaultHeight: number;
  supportsDataBinding: boolean;
  configFields: ConfigFieldDefinition[];
  renderComponent: (variant: string) => string;
}

/** 位置和尺寸 (canvas 坐标) */
export interface WidgetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 数据绑定配置 */
export interface DataBindingConfig {
  apiUrl?: string;
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: string;
  /** 轮询间隔 (毫秒)，0 = 不轮询 */
  refreshInterval: number;
  /** 响应数据 JSONPath 提取路径 */
  dataPath?: string;
  /** 最近一次拉取的数据（缓存，不序列化到 localStorage） */
  _cachedData?: unknown;
}

/** 滚动字幕配置 */
export interface ScrollingTextConfig {
  content: string;
  speed: number;
  direction: "left" | "right" | "up" | "down";
  fontSize: number;
  color: string;
}

/** 数字显示屏配置 */
export interface DigitalNumberConfig {
  value: number | string;
  digitCount: number;
  label: string;
  prefix?: string;
  suffix?: string;
}

/** iframe 容器配置 */
export interface IframeConfig {
  src: string;
  allowFullscreen: boolean;
  sandbox: string;
}

/** 自定义 CSS */
export interface CustomCSS {
  enabled: boolean;
  styles: string;
}

/** 单个 Widget 实例完整配置 */
export interface WidgetConfig {
  id: WidgetId;
  type: WidgetTypeKey;
  variant: string;
  rect: WidgetRect;
  title: string;
  icon?: string;
  zIndex: number;
  visible: boolean;
  locked: boolean;
  opacity: number;

  // 功能配置（仅特定类型相关）
  dataBinding?: DataBindingConfig;
  scrollingText?: ScrollingTextConfig;
  digitalNumber?: DigitalNumberConfig;
  iframe?: IframeConfig;
  customCSS?: CustomCSS;

  // TechUI 外观覆盖
  glow?: boolean;
  glowOpacity?: number;
  backgroundOpacity?: number;
  decorationColorAlt?: boolean;
}

/** 大屏项目（持久化到 localStorage） */
export interface BigScreenProject {
  version: number;
  name: string;
  createdAt: number;
  updatedAt: number;
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  backgroundImage?: string;
  widgets: WidgetConfig[];
  gridSize: number;
  snapToGrid: boolean;
}

/** 已保存的大屏配置条目 */
export interface BigScreenConfigEntry {
  guid: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  project: BigScreenProject;
}
