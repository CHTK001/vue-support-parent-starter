/**
 * 工具相关配置
 */
import { Component } from 'vue';
import {
  ZOOM_IN_ICON,
  ZOOM_OUT_ICON,
  FULL_VIEW_ICON,
  MEASURE_ICON,
  POLYGON_ICON,
  DELETE_ICON,
  LAYER_SWITCH_ICON,
  MARKER_VISIBLE_ICON,
  LOCATION_ICON,
  DEBUG_ICON,
  COORDINATE_ICON
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
  title?: string;
  name?: string;
  className?: string;
  tooltip?: string;
  show?: boolean;
  active?: boolean;
  disabled?: boolean;
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
      id: 'coordinate',
      type: 'toggle',
      icon: COORDINATE_ICON,
      title: '坐标',
      name: '坐标'
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
  }
};