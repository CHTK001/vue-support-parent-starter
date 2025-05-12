/**
 * 标记点相关类型定义
 */

import type { DataType } from ".";

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
 * 标记点配置选项
 */
export interface MarkerOptions {
  id: string;
  position: [number, number]; // [经度, 纬度]
  dataType?: DataType; // 类型，默认为'marker'
  icon?: string; // 图标URL或SVG字符串
  iconType?: 'url' | 'svg' | 'base64' | 'default'; // 图标类型，默认为'default'
  title?: string; // 标题
  clickable?: boolean; // 是否可点击
  clusterMode?: MarkerClusterMode; // 聚合模式
  visible?: boolean; // 是否可见
  zIndex?: number; // 层级
  data?: any; // 附加数据
  template?: string; // 点击弹窗模板
  usePopover?: boolean; // 是否使用popover显示标题，默认false
  showPopover?: boolean; // 是否默认显示popover，默认false
  isPopoverOpen?: boolean; // 内部属性：当前popover是否打开，默认false
  group?: string; // 标记点分组，用于按组管理标记点的显示/隐藏
  style?: {
    scale?: number;
    anchor?: [number, number];
    offset?: [number, number];
    rotation?: number;
    textColor?: string;
    textOutlineColor?: string;
    textOutlineWidth?: number;
    textFont?: string;
    textOffsetY?: number;
  };
}

/**
 * 标记点事件处理函数
 */
export interface MarkerEventHandler {
  (coordinates: number[], data: MarkerOptions): void;
} 