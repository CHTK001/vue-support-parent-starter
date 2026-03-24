/**
 * 标记点相关类型定义
 */

import type { DataType } from ".";
import { CoordSystem } from "./coordinate";

/**
 * 标记点聚合模式枚举
 */
export enum MarkerClusterMode {
  /** 不参与聚合，仅在普通图层显示 */
  NONE = 'none',
  /** 参与聚合，在聚合模式下聚合显示 */
  CLUSTER = 'cluster',
  /** 同时在普通图层和聚合图层显示 */
  BOTH = 'both'
}

/**
 * 标记点全局配置
 */
export interface MarkerConfig {
  /** 图标大小是否受到zoom影响，默认true */
  scaleWithZoom?: boolean;
  /** 分组图标集合，用于根据group设置图标 */
  groupIcon?: Record<string, string>;
  /** 缩放系数，默认0.05，正值表示放大时图标变小，负值表示放大时图标变大 */
  zoomFactor?: number;
  /** 最小缩放比例，默认0.7 */
  minScale?: number;
  /** 最大缩放比例，默认1.5 */
  maxScale?: number;
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
 * 标记点按钮
 */
export interface MarkerButton {
  icon: string;
  title: string;
  onClick: () => void;
}

/**
 * 标记点选项配置
 */
export interface MarkerOptions {
  /** 标记点ID，如果不提供则自动生成 */
  id?: string;
  /** 标记点位置，[lon, lat] */
  position: [number, number];
  /** 标记点坐标系统，默认为 WGS84 */
  coordSystem?: CoordSystem;
  /** 标记点大小，[width, height] */
  size?: [number, number];
  /** 标记点图标URL或Data URL */
  icon?: string;
  /** 图标类型: url, svg, base64, default, photo */
  iconType?: 'url' | 'svg' | 'base64' | 'default' | 'photo';
  /** 标记点样式配置 */
  style?: MarkerStyleOptions;
  /** 标记点标题 */
  title?: string;
  /** 标记点描述 */
  description?: string;
  /** 是否可见 */
  visible?: boolean;
  /** 是否可点击 */
  clickable?: boolean;
  /** 是否可拖动 */
  draggable?: boolean;
  /** 标记点自定义数据 */
  data?: Record<string, any>;
  /** 标记点图层顺序 */
  zIndex?: number;
  /** 标记点分组 */
  group?: string;
  /** 标记点聚合模式 */
  clusterMode?: MarkerClusterMode;
  /** 是否显示popover (true: 显示, false: 不显示, undefined: 不使用popover功能) */
  showPopover?: boolean;
  /** 是否已经显示了popover (内部状态) */
  isPopoverOpen?: boolean;
  /** 自定义的渲染模板 */
  content?: string;
  /** 数据类型 */
  dataType?: DataType;
  /** 标记点按钮 */
  buttons?: MarkerButton[];
  /** 导航配置 */
  navigation?: NavigationOptions;
  /** 标记点动画配置 */
  animation?: MarkerAnimation;
}

export interface MarkerAnimation {
  type: 'pulse' | 'drop' | 'bounce' | 'flash';
  options?: {
    duration?: number;
    easing?: string;
    scale?: number;
    color?: string;
    amplitude?: number;
  };
}

/**
 * 标记点事件处理函数
 */
export interface MarkerEventHandler {
  (coordinates: number[], data: MarkerOptions): void;
}

// 导航配置
export interface NavigationOptions {
  enabled?: boolean;
  icon?: string;
  color?: string;
  lineStyle?: {
    color?: string;
    width?: number;
    dashArray?: number[];
  };
}

// 添加默认导出
export default {
  MarkerClusterMode
};
