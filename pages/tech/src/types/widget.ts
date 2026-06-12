/** 唯一标识符 */
export type WidgetId = string;
export type WidgetTypeKey = string;

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

export type ConfigFieldType = "text" | "number" | "boolean" | "select" | "slider" | "color" | "textarea";

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

export interface WidgetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DataBindingConfig {
  apiUrl?: string;
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: string;
  refreshInterval: number;
  dataPath?: string;
  _cachedData?: unknown;
}

export interface ScrollingTextConfig {
  content: string;
  speed: number;
  direction: "left" | "right" | "up" | "down";
  fontSize: number;
  color: string;
}

export interface DigitalNumberConfig {
  value: number | string;
  digitCount: number;
  label: string;
  prefix?: string;
  suffix?: string;
}

export interface IframeConfig {
  src: string;
  allowFullscreen: boolean;
  sandbox: string;
}

export interface CustomCSS {
  enabled: boolean;
  styles: string;
}

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
  dataBinding?: DataBindingConfig;
  scrollingText?: ScrollingTextConfig;
  digitalNumber?: DigitalNumberConfig;
  iframe?: IframeConfig;
  customCSS?: CustomCSS;
  glow?: boolean;
  glowOpacity?: number;
  backgroundOpacity?: number;
  decorationColorAlt?: boolean;
}

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

export interface BigScreenConfigEntry {
  guid: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  project: BigScreenProject;
}
