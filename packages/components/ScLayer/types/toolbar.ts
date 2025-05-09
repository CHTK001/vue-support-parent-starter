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
} from './icon';

/**
 * 工具栏类型定义
 */

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

// 工具类型
export type ToolType = 'button' | 'toggle' | 'dropdown' | 'separator' | 'menu';

// 工具项接口
export interface ToolItem {
  id: string;
  type: ToolType;
  icon?: string | Component;
  activeIcon?: string | Component;
  title?: string;
  name?: string;
  className?: string;
  tooltip?: string;
  show?: boolean;
  active?: boolean;
  disabled?: boolean;
  multi?: boolean;  // 是否可以与其它工具同时激活
  children?: ToolItem[];
}

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

// 轨迹播放器配置选项
export interface TrackPlayerConfigOptions {
  loop: boolean;          // 是否循环播放
  speed: number;          // 默认播放速度(km/h)
  withCamera: boolean;    // 是否跟随相机
  speedFactor: number;    // 速度因子
  showNodes: boolean;     // 是否显示节点（静态点位）
  showNodeAnchors: boolean;// 是否显示节点锚点（当showNodes设置为true时有效）
  showNodeNames: boolean; // 是否显示节点名称（静态点位名称）
  showPointNames: boolean;// 是否显示点位名称（移动点位名称）
  showSpeed: boolean;     // 是否显示移动速度
  showNodeSpeed: boolean; // 是否显示节点速度
}

// 工具栏配置接口
export interface ToolbarConfig {
  position?: ToolbarPosition;
  direction?: ToolbarDirection;
  showCollapse?: boolean;
  collapsed?: boolean;
  items?: ToolItem[];
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
      name: '测距'
    },
    {
      id: 'layer-switch',
      type: 'toggle',
      icon: LAYER_SWITCH_ICON,
      title: '图层切换',
      name: '图层',
      multi: true  // 图层切换工具可以与其它工具同时激活
    },
    {
      id: 'coordinate',
      type: 'toggle',
      icon: COORDINATE_ICON,
      title: '坐标',
      name: '坐标',
      multi: true  // 坐标工具可以与其它工具同时激活
    },
    {
      id: 'overview',
      type: 'toggle',
      icon: EAGLE_EYE_ICON,
      title: '鹰眼',
      name: '鹰眼',
      multi: true  // 鹰眼工具可以与其它工具同时激活
    },
    {
      id: 'track-player',
      type: 'toggle',
      icon: TRACK_PLAYER_ICON,
      title: '轨迹播放器',
      name: '轨迹',
      multi: true  // 轨迹播放器可以与其它工具同时激活
    },
    {
      id: 'marker-toggle',
      type: 'toggle',
      icon: MARKER_ICON,
      activeIcon: HIDDEN_MARKER_ICON,
      title: '显示/隐藏标记点',
      name: '标记点',
      multi: true  // 标记点工具可以与其它工具同时激活
    },
    {
      id: 'label-toggle',
      type: 'toggle',
      icon: POPOVER_TOGGLE_ICON,
      title: '显示/隐藏标签',
      name: '标签',
      multi: true  // 标签工具可以与其它工具同时激活
    },
    {
      id: 'cluster',
      type: 'toggle',
      icon: CLUSTER_ICON,
      title: '标记点聚合',
      name: '聚合',
      multi: true  // 聚合工具可以与其它工具同时激活
    },
    {
      id: 'draw-rectangle',
      type: 'toggle',
      icon: RECTANGLE_ICON,
      title: '绘制矩形',
      name: '矩形'
    },
    {
      id: 'draw-square',
      type: 'toggle',
      icon: SQUARE_ICON,
      title: '绘制正方形',
      name: '正方形'
    },
    {
      id: 'draw-circle',
      type: 'toggle',
      icon: CIRCLE_ICON,
      title: '绘制圆形',
      name: '圆形'
    },
    {
      id: 'draw-polygon',
      type: 'toggle',
      icon: POLYGON_ICON,
      title: '绘制多边形',
      name: '多边形'
    },
    {
      id: 'draw-line',
      type: 'toggle',
      icon: POLYLINE_ICON,
      title: '绘制线段',
      name: '线段'
    },
    {
      id: 'clear-shapes',
      type: 'toggle',
      icon: CLEAR_ICON,
      title: '删除模式 - 点击要素删除',
      name: '删除',
      className: 'delete-btn',
      multi: true
    }
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
