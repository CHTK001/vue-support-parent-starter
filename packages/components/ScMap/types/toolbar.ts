/**
 * 工具相关配置
 */
import { Component } from 'vue';
import {
  ZOOM_IN_ICON,
  ZOOM_OUT_ICON,
  FULL_VIEW_ICON,
  DELETE_ICON,
  LAYER_SWITCH_ICON,
  MARKER_VISIBLE_ICON,
  LOCATION_ICON,
  DEBUG_ICON,
  CIRCLE_ICON,
  RECTANGLE_ICON,
  LABEL_ICON,
  MARKER_ICON,
  EAGLE_EYE_ICON,
  COORDINATE_ICON,
  MEASURE_ICON,
  CLEAR_ICON,
  LINE_ICON,
  POLYGON_ICON,
  POPOVER_TOGGLE_ICON,
  HIDDEN_MARKER_ICON,
  CLUSTER_ICON,
  SQUARE_ICON,
  POLYLINE_ICON,
  TRACK_PLAYER_ICON,
  GRID_ICON,
  GEOHASH_GRID_ICON,
  H3_GRID_ICON,
  HEATMAP_ICON,
  FLIGHT_LINE_ICON,
  SHOW_MARKERS_ICON,
  HIDE_MARKERS_LABEL_ICON,
  EDIT_ICON,
} from './icon';
import type { TrackPlayerConfigOptions } from './track';

/**
 * 工具栏类型定义
 * @description 定义地图工具栏相关的类型和接口
 */

// 工具类型
export type ToolType = 'button' | 'toggle' | 'menu' | 'submenu' | 'separator';

// 工具栏位置
export type ToolbarPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'bottom' | 'left' | 'right';

// 基础工具项接口
export interface ToolItem {
  id: string;
  title: string;
  icon?: string;
  type: ToolType;
  show?: boolean;
  active?: boolean;
  disabled?: boolean;
  multi?: boolean;
  children?: ToolItem[];
}

// 工具栏基础配置（临时定义，将被下方完整定义替代）
export interface ToolbarConfig {
  position?: ToolbarPosition;
  collapsed?: boolean;
  collapsible?: boolean;
  showTitle?: boolean;
  items?: ToolItem[];
}

// 默认工具栏配置
export const DEFAULT_TOOLBAR_CONFIG: ToolbarConfig = {
  position: 'top-right',
  collapsed: false,
  collapsible: true,
  showTitle: true,
  items: []
};

// 工具栏回调函数类型
export type ToolbarCallback = (
  toolId: string, active: boolean, toolType: string, data?: any
) => void;

// 工具状态变化回调函数类型
export type ToolStateChangeCallback = (
  toolId: string, active: boolean, toolType: string, data?: any
) => void;

// 坐标工具配置
export interface CoordinateToolConfig {
  showDecimal?: boolean; // 是否显示坐标小数位数选择器
  showProjected?: boolean; // 是否显示投影坐标
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'; // 坐标面板位置
  decimals?: number; // 小数位数
}

// 测距工具配置
export interface MeasureToolConfig {
  showArea?: boolean; // 是否显示面积测量选项
  showSegment?: boolean; // 是否显示分段距离
  clearOnComplete?: boolean; // 测量完成后是否自动清除
}

// 工具栏配置接口
export interface ToolbarConfig {
  position?: ToolbarPosition;  // 工具栏位置
  showLabels?: boolean;        // 是否显示标签
  style?: 'default' | 'mini' | 'text'; // 样式类型
  tools?: ToolItem[];          // 工具项列表
  collapsed?: boolean;         // 是否折叠
  draggable?: boolean;         // 是否可拖拽
  // 坐标工具配置
  coordinateConfig?: CoordinateToolConfig;
  // 测距工具配置
  measureConfig?: MeasureToolConfig;
  // 轨迹播放器配置
  trackPlayerConfig?: TrackPlayerConfigOptions;
}

// 添加自定义工具的选项
export interface AddToolOptions {
  position?: 'start' | 'end';
  before?: string;
  after?: string;
}
