/**
 * 面板类型
 */
export type PanelType = 'default' | 'card' | 'border' | 'shadow' | 'custom';

/**
 * 面板大小
 */
export type PanelSize = 'default' | 'small' | 'large';

/**
 * 面板主题
 */
export type PanelTheme = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

/**
 * 面板头部位置
 */
export type PanelHeaderPosition = 'top' | 'left' | 'right' | 'bottom';

/**
 * 面板配置选项
 */
export interface PanelOptions {
  // 面板类型
  type: PanelType;
  // 面板标题
  title?: string;
  // 面板大小
  size?: PanelSize;
  // 面板主题
  theme?: PanelTheme;
  // 是否可折叠
  collapsible?: boolean;
  // 是否默认折叠
  collapsed?: boolean;
  // 是否有边框
  bordered?: boolean;
  // 是否有阴影
  shadow?: boolean;
  // 面板高度
  height?: string | number;
  // 面板宽度
  width?: string | number;
  // 头部位置
  headerPosition?: PanelHeaderPosition;
  // 是否显示头部
  showHeader?: boolean;
  // 是否显示底部
  showFooter?: boolean;
  // 自定义类名
  className?: string;
  // 自定义样式
  style?: Record<string, any>;
  // 是否加载中
  loading?: boolean;
  // 头部额外内容
  headerExtra?: any;
  // 底部额外内容
  footerExtra?: any;
} 