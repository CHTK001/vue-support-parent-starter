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
// 工具栏位置
export enum ToolbarPosition {
  TOP_LEFT = 'top-left',
  TOP_RIGHT = 'top-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_RIGHT = 'bottom-right',
  TOP_CENTER = 'top-center',
  BOTTOM_CENTER = 'bottom-center',
  LEFT_CENTER = 'left-center',
  RIGHT_CENTER = 'right-center'
}

// 工具栏方向
export enum ToolbarDirection {
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical'
}

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
  className?: string;      // 添加自定义类名
  activeIcon?: string | Component;  // 添加激活状态图标
  tooltip?: string;        // 添加工具提示文本
  name?: string;           // 添加工具名称
}

// 工具栏基础配置（临时定义，将被下方完整定义替代）
export interface ToolbarConfig {
  position?: ToolbarPosition;
  direction?: ToolbarDirection;
  itemsPerLine?: number;
  size?: number;
  showCollapse?: boolean;
  collapsed?: boolean;
  collapsible?: boolean;
  showTitle?: boolean;
  items?: ToolItem[];
}


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
  direction?: ToolbarDirection; // 工具栏方向
  itemsPerLine?: number;       // 每行/列显示的工具数量
  size?: number;               // 工具按钮大小
  showCollapse?: boolean;      // 是否显示折叠按钮
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
  items?: ToolItem[];          // 工具项列表，与tools同义
}

// 添加自定义工具的选项
export interface AddToolOptions {
  position?: 'start' | 'end';
  before?: string;
  after?: string;
}

// 默认工具栏配置
export const DEFAULT_TOOLBAR_CONFIG: ToolbarConfig = {
  position: ToolbarPosition.TOP_LEFT,
  direction: ToolbarDirection.HORIZONTAL,
  showCollapse: true,
  collapsed: false,
  items: [
    {
      id: 'measure',
      type: 'toggle',
      icon: MEASURE_ICON,
      title: '测距',
      tooltip: '测量距离',
      multi: false
    },
    {
      id: 'coordinate',
      type: 'toggle',
      icon: COORDINATE_ICON,
      title: '坐标',
      tooltip: '显示坐标信息',
      multi: true
    },
    {
      id: 'overview',
      type: 'toggle',
      icon: EAGLE_EYE_ICON,
      title: '鹰眼',
      tooltip: '显示鹰眼地图',
      multi: true
    },
    {
      id: 'layer-switch',
      type: 'toggle',
      icon: LAYER_SWITCH_ICON,
      title: '图层',
      tooltip: '切换地图图层',
      multi: true
    },
    {
      id: 'clear-shapes',
      type: 'toggle',
      icon: DELETE_ICON,
      title: '删除',
      tooltip: '删除图形或标记',
      multi: false,
      className: 'delete-btn'
    },
    {
      id: 'marker-toggle',
      type: 'toggle',
      icon: MARKER_VISIBLE_ICON,
      activeIcon: HIDDEN_MARKER_ICON,
      title: '标记',
      tooltip: '显示/隐藏标记点',
      multi: true
    },
    {
      id: 'label-toggle',
      type: 'toggle',
      icon: SHOW_MARKERS_ICON,
       activeIcon: HIDE_MARKERS_LABEL_ICON,
      title: '标签',
      tooltip: '显示/隐藏标签',
      multi: true
    },
    {
      id: 'cluster',
      type: 'toggle',
      icon: CLUSTER_ICON,
      title: '聚合',
      tooltip: '标记点聚合',
      multi: true
    },
    {
      id: 'draw-rectangle',
      type: 'toggle',
      icon: RECTANGLE_ICON,
      title: '矩形',
      tooltip: '绘制矩形',
      multi: false
    },
    {
      id: 'draw-square',
      type: 'toggle',
      icon: SQUARE_ICON,
      title: '正方形',
      tooltip: '绘制正方形',
      multi: false
    },
    {
      id: 'draw-circle',
      type: 'toggle',
      icon: CIRCLE_ICON,
      title: '圆形',
      tooltip: '绘制圆形',
      multi: false
    },
    {
      id: 'draw-polygon',
      type: 'toggle',
      icon: POLYGON_ICON,
      title: '多边形',
      tooltip: '绘制多边形',
      multi: false
    },
    {
      id: 'draw-line',
      type: 'toggle',
      icon: POLYLINE_ICON,
      title: '线段',
      tooltip: '绘制线段',
      multi: false
    },
    
    {
      id: 'track-player',
      type: 'toggle',
      icon: TRACK_PLAYER_ICON,
      title: '轨迹',
      tooltip: '轨迹播放器',
      multi: true
    },
    {
      id: 'grid',
      type: 'button',
      icon: GRID_ICON,
      title: '网格',
      tooltip: '网格工具',
      multi: true,
      children: [
        {
          id: 'grid-geohash',
          type: 'toggle',
          icon: GEOHASH_GRID_ICON,
          title: 'GeoHash',
          tooltip: 'GeoHash网格',
          multi: true
        },
        {
          id: 'grid-h3',
          type: 'toggle',
          icon: H3_GRID_ICON,
          title: 'H3',
          tooltip: 'H3蜂窝网格',
          multi: true
        }
      ]
    },
    {
      id: 'heatmap',
      type: 'toggle',
      icon: HEATMAP_ICON,
      title: '热力图',
      tooltip: '显示热力图',
      multi: true
    },
    {
      id: 'flight-line',
      type: 'toggle',
      icon: FLIGHT_LINE_ICON,
      title: '飞线图',
      tooltip: '显示飞线图',
      multi: true
    },
  ],
  // 默认坐标工具配置
  coordinateConfig: {
    showDecimal: true,
    showProjected: true,
    position: 'bottom-right',
    decimals: 8
  },
  // 默认测距工具配置
  measureConfig: {
    showArea: true,
    showSegment: true,
    clearOnComplete: false
  },
  // 默认轨迹播放器配置
  trackPlayerConfig: {
    loop: false,          // 是否循环播放
    speed: 50,            // 默认播放速度(km/h)
    withCamera: false,     // 是否跟随相机
    speedFactor: 1.0,     // 速度因子
    showNodes: false,     // 是否显示节点（静态点位）
    showNodeAnchors: false,// 是否显示节点锚点（当showNodes设置为true时有效）
    showNodeNames: false, // 是否显示节点名称（静态点位名称）
    showPointNames: true, // 是否显示点位名称（移动点位名称）
    showSpeed: true,      // 是否显示移动速度
    showNodeSpeed: true   // 是否显示节点速度
  }
};
