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
 * @description 定义工具栏的配置和工具项
 */

// 工具栏位置类型
export type ToolbarPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'left' | 'right';

// 工具类型
export type ToolType = 'default' | 'toggle' | 'button' | 'dropdown';

// 工具项接口
export interface ToolItem {
  id: string;               // 工具ID
  type?: ToolType;          // 工具类型
  icon?: string;            // 图标类名
  label?: string;           // 显示标签
  title?: string;           // 提示文本
  disabled?: boolean;       // 是否禁用
  hidden?: boolean;         // 是否隐藏
  children?: ToolItem[];    // 子工具项（用于下拉菜单）
  actions?: string[];       // 操作列表
  options?: any;            // 其他选项
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

// 默认工具栏配置
export const DEFAULT_TOOLBAR_CONFIG: ToolbarConfig = {
  position: 'top-right',
  showLabels: false,
  style: 'default',
  collapsed: false,
  draggable: false,
  tools: [
    {
      id: 'pan',
      type: 'toggle',
      icon: 'el-icon-rank',
      label: '平移',
      title: '平移地图'
    },
    {
      id: 'zoomIn',
      type: 'button',
      icon: 'el-icon-zoom-in',
      label: '放大',
      title: '放大地图'
    },
    {
      id: 'zoomOut',
      type: 'button',
      icon: 'el-icon-zoom-out',
      label: '缩小',
      title: '缩小地图'
    },
    {
      id: 'fullExtent',
      type: 'button',
      icon: 'el-icon-full-screen',
      label: '全图',
      title: '显示全图范围'
    },
    {
      id: 'measure',
      type: 'toggle',
      icon: 'el-icon-ruler',
      label: '测量',
      title: '测量距离和面积'
    },
    {
      id: 'draw',
      type: 'toggle',
      icon: 'el-icon-edit',
      label: '绘制',
      title: '绘制图形'
    },
    {
      id: 'marker',
      type: 'toggle',
      icon: 'el-icon-map-location',
      label: '标记',
      title: '添加标记点'
    },
    {
      id: 'coordinate',
      type: 'toggle',
      icon: 'el-icon-location',
      label: '坐标',
      title: '显示坐标信息'
    },
    {
      id: 'layer',
      type: 'toggle',
      icon: 'el-icon-menu',
      label: '图层',
      title: '图层管理'
    },
    {
      id: 'overview',
      type: 'toggle',
      icon: 'el-icon-picture-outline',
      label: '鹰眼',
      title: '显示鹰眼地图'
    },
    {
      id: 'trackPlayer',
      type: 'toggle',
      icon: 'el-icon-video-play',
      label: '轨迹',
      title: '轨迹播放器'
    },
    {
      id: 'flightLine',
      type: 'toggle',
      icon: 'el-icon-connection',
      label: '飞线',
      title: '飞线图管理'
    },
    {
      id: 'grid',
      type: 'toggle',
      icon: 'el-icon-grid',
      label: '网格',
      title: '显示网格'
    },
    {
      id: 'cluster',
      type: 'toggle',
      icon: 'el-icon-data-analysis',
      label: '聚合',
      title: '标记点聚合'
    },
    {
      id: 'heatmap',
      type: 'toggle',
      icon: 'el-icon-hot-water',
      label: '热力图',
      title: '显示热力图'
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
