/**
 * 标记点类型定义
 * @description 定义标记点相关的类型和接口
 */

import type { DataType } from ".";

/**
 * 标记点聚合模式枚举
 */
export enum MarkerClusterMode {
  /** 不参与聚合，仅在普通图层显示 */
  NONE = "none",
  /** 参与聚合，在聚合模式下聚合显示 */
  CLUSTER = "cluster",
  /** 同时在普通图层和聚合图层显示 */
  BOTH = "both",
}

/**
 * 标记点状态
 */
export enum MarkerStatus {
  NORMAL = "normal", // 正常
  SELECTED = "selected", // 选中
  HOVER = "hover", // 悬停
  HIDDEN = "hidden", // 隐藏
  DISABLED = "disabled", // 禁用
}

/**
 * 标记点图标选项
 */
export interface MarkerIconOptions {
  [key: string]: any;
  iconUrl?: string;
  iconSize?: [number, number];
  iconAnchor?: [number, number];
  popupAnchor?: [number, number];
  shadowUrl?: string;
  shadowSize?: [number, number];
  shadowAnchor?: [number, number];
  className?: string;
  html?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  svgIcon?: string;
}

/**
 * 标记点选项
 */
export interface MarkerOptions {
  [key: string]: any;
  id?: string;
  position: [number, number];
  title?: string;
  text?: string;
  icon?: any;
  draggable?: boolean;
}

/**
 * 标记点配置
 */
export interface MarkerConfig {
  scaleWithZoom?: boolean; // 是否随缩放级别调整大小
  groupIcon?: Record<string, MarkerIconOptions>; // 分组图标
  baseZoom?: number; // 基准缩放级别
  zoomFactor?: number; // 缩放系数
  minScale?: number; // 最小缩放比例
  maxScale?: number; // 最大缩放比例
  useCanvas?: boolean; // 是否使用Canvas渲染
  clusterOptions?: any; // 聚合选项
  defaultIcon?: MarkerIconOptions; // 默认图标
}

/**
 * 聚合点功能的配置
 */
export interface ClusterOptions {
  enabled?: boolean; // 是否启用聚合
  maxClusterRadius?: number; // 最大聚合半径
  showCoverageOnHover?: boolean; // 悬停时显示聚合范围
  zoomToBoundsOnClick?: boolean; // 点击聚合点时缩放到边界
  spiderfyOnMaxZoom?: boolean; // 在最大缩放级别时是否展开
  disableClusteringAtZoom?: number; // 在特定缩放级别禁用聚合
  animate?: boolean; // 是否动画
  iconCreateFunction?: Function; // 创建图标的函数
  showCount?: boolean; // 是否显示聚合数量
  color?: string; // 聚合点颜色
  animateAddingMarkers?: boolean; // 添加标记时是否显示动画
  onClusterClick?: (features: any[], coordinate: number[]) => void; // 聚合点击回调
}

/**
 * 标记点样式选项
 */
export interface MarkerStyleOptions {
  /** 图标缩放比例 */
  scale?: number;
  /** 图标锚点 [x, y] 范围0-1 */
  anchor?: [number, number];
  /** 图标偏移 [x, y] 像素 */
  offset?: [number, number];
  /** 图标旋转角度（弧度） */
  rotation?: number;
  /** 文字颜色 */
  textColor?: string;
  /** 文字外边框颜色 */
  textOutlineColor?: string;
  /** 文字外边框宽度 */
  textOutlineWidth?: number;
  /** 文字字体 */
  textFont?: string;
  /** 文字Y轴偏移 */
  textOffsetY?: number;
}

/**
 * 标记点事件处理函数
 */
export interface MarkerEventHandler {
  (coordinates: number[], data: MarkerOptions): void;
}
