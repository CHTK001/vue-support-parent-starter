import type { Component } from 'vue';
// 单个地图类型接口
export interface MapTypeItem {
  name: string;       // 地图类型名称
  url: string;        // 瓦片图URL
  attribution: string; // 版权信息
  image?: string;     // 图层预览图片
}

// 地图类型集合接口
export interface MapTypes {
  [key: string]: MapTypeItem;
}


// 组件属性
export interface ScMapProps {
  // 地图高度
  height?: string;
  // 地图类型对象
  mapType?: Record<string, any>;
  // 当前图层类型
  layerType?: string;
  // 自定义URL（优先级高于mapType）
  url?: string;
  // 中心点
  center?: [number, number];
  // 缩放级别
  zoom?: number;
  // 是否可拖动
  dragging?: boolean;
  // 是否允许滚轮缩放
  scrollWheelZoom?: boolean;
  // API密钥（如果瓦片服务需要）
  apiKey?: string;
  // 是否显示工具栏
  showToolbar?: boolean;
  // 工具栏配置
  toolbarConfig?: ToolbarConfig;
  // 向下兼容 - 自定义工具列表
  toolbar?: ToolItem[];
}
// 工具栏配置接口
export interface ToolbarConfig {
  // 工具栏位置
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  // 工具栏方向
  direction?: 'horizontal' | 'vertical';
  // 每行/列显示的工具数量
  itemsPerLine?: number;
  // 工具栏按钮大小
  size?: number;
  // 自定义工具列表
  items?: ToolItem[];
  // 按钮开关配置
  buttons?: {
    measure?: boolean,
    drawPoint?: boolean,
    coordinate?: boolean,
    zoomIn?: boolean,
    zoomOut?: boolean,
    fullView?: boolean,
    layerSwitch?: boolean,
    toggleMarkers?: boolean
  };
}
// 工具按钮接口
export interface ToolItem {
  id: string;
  name: string;
  icon: string | Component;
  /**
   * 工具的激活状态
   * - `true`: 工具被激活
   * - `false`: 工具被隐藏，不会在工具栏中显示
   * - `undefined`: 工具可见但未激活
   */
  active?: boolean;
  tooltip?: string;
  handler?: () => void;
  /**
   * 是否支持与其他工具同时激活
   * - `true`: 该工具可以与其他工具同时处于激活状态
   * - `false`或`undefined`: 激活该工具时会停用其他工具
   */
  multi?: boolean;
  /**
   * 是否显示该工具
   * - `true`或`undefined`: 显示该工具
   * - `false`: 隐藏该工具，但仍保留在工具列表中
   */
  show?: boolean;
}

// 面板位置类型
export type ToolbarPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

// 面板方向类型
export type ToolbarDirection = 'horizontal' | 'vertical';

// 添加自定义工具
export interface AddToolOptions extends ToolItem {
  index?: number;
}
// 图层类型枚举
export enum LayerType {
  NORMAL = 'NORMAL',
  SATELLITE = 'SATELLITE',
  HYBRID = 'HYBRID',
  TRAFFIC = 'TRAFFIC',
  ROAD = 'ROAD'
}
