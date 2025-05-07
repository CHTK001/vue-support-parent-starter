/**
 * 工具相关配置
 */
import type { Component } from 'vue';
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

// 工具栏配置接口
export interface ToolbarConfig {
  // 工具栏位置
  position?: ToolbarPosition;
  // 工具栏方向
  direction?: ToolbarDirection;
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
  /**
   * 切换状态（用于可切换工具如标记显示/隐藏）
   * - `true`: 表示处于"开"状态（如标记已隐藏）
   * - `false`或`undefined`: 表示处于"关"状态（如标记已显示）
   */
  toggleState?: boolean;
  /**
   * 切换状态时的替代图标，用于可切换工具
   */
  alternateIcon?: string | Component;
  /**
   * 保存工具原始图标，在切换状态时使用
   */
  originalIcon?: string | Component;
  /**
   * 自定义CSS类名，用于按钮样式定制
   */
  className?: string;
  /**
   * 工具类型，决定显示方式
   * - `button`: 普通按钮（默认）
   * - `menu`: 下拉菜单按钮，点击时显示子菜单
   * - `toggle`: 可切换状态的按钮
   */
  type?: 'button' | 'menu' | 'toggle';
  /**
   * 子菜单项，仅当type为menu时有效
   */
  children?: ToolItem[];
  /**
   * 工具是否禁用
   * - `true`: 工具已禁用，点击无效
   * - `false`或`undefined`: 工具可用
   */
  disabled?: boolean;
}

// 面板位置类型
export type ToolbarPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

// 面板方向类型
export type ToolbarDirection = 'horizontal' | 'vertical';
// 添加自定义工具
export interface AddToolOptions extends ToolItem {
  index?: number;
  position?: 'start' | 'end';
}

// 默认工具栏配置
export const DEFAULT_TOOLBAR_CONFIG: ToolbarConfig = {
  position: 'top-left',
  direction: 'horizontal',
  itemsPerLine: 8,
  size: 36,
  items: [
    {
      id: 'measure',
      name: '测量',
      icon: MEASURE_ICON,
      tooltip: '测量',
      type: 'toggle'
    },
    {
      id: 'draw',
      name: '绘制',
      icon: POLYGON_ICON,
      tooltip: '绘制',
      type: 'toggle',
      children: [
        {
          id: 'draw-point',
          name: '绘制点',
          icon: '<svg viewBox="0 0 1024 1024" width="16" height="16"><path d="M512 512m-96 0a96 96 0 1 0 192 0 96 96 0 1 0-192 0Z" fill="currentColor"></path></svg>',
          tooltip: '绘制点',
          type: 'toggle'
        },
        {
          id: 'draw-line',
          name: '绘制线',
          icon: '<svg viewBox="0 0 1024 1024" width="16" height="16"><path d="M904 476H120c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8z" fill="currentColor"></path></svg>',
          tooltip: '绘制线',
          type: 'toggle'
        },
        {
          id: 'draw-polygon',
          name: '绘制面',
          icon: '<svg viewBox="0 0 1024 1024" width="16" height="16"><path d="M880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32z m-40 728H184V184h656v656z" fill="currentColor"></path></svg>',
          tooltip: '绘制面',
          type: 'toggle'
        }
      ]
    },
    {
      id: 'clear',
      name: '清除',
      icon: DELETE_ICON,
      tooltip: '清除绘制',
      type: 'button'
    },
    {
      id: 'layer-switch',
      name: '图层切换',
      icon: LAYER_SWITCH_ICON,
      tooltip: '切换图层',
      type: 'menu',
      children: [
        {
          id: 'layer-normal',
          name: '标准图层',
          icon: '<svg viewBox="0 0 1024 1024" width="16" height="16"><path d="M904 476H120c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8z" fill="currentColor"></path></svg>',
          tooltip: '标准图层',
          type: 'button'
        },
        {
          id: 'layer-satellite',
          name: '卫星图层',
          icon: '<svg viewBox="0 0 1024 1024" width="16" height="16"><path d="M512 85.333333c-235.648 0-426.666667 191.018667-426.666667 426.666667s191.018667 426.666667 426.666667 426.666667 426.666667-191.018667 426.666667-426.666667S747.648 85.333333 512 85.333333z m0 810.666667c-211.733333 0-384-172.266667-384-384s172.266667-384 384-384 384 172.266667 384 384-172.266667 384-384 384z" fill="currentColor"></path></svg>',
          tooltip: '卫星图层',
          type: 'button'
        },
        {
          id: 'layer-hybrid',
          name: '混合图层',
          icon: '<svg viewBox="0 0 1024 1024" width="16" height="16"><path d="M170.666667 85.333333v853.333334h682.666666V85.333333H170.666667z m85.333333 768V170.666667h512v682.666666H256z" fill="currentColor"></path><path d="M682.666667 341.333333H341.333333v341.333334h341.333334V341.333333z m-85.333334 256h-170.666666v-170.666666h170.666666v170.666666z" fill="currentColor"></path></svg>',
          tooltip: '混合图层',
          type: 'button'
        }
      ]
    },
    {
      id: 'toggle-markers',
      name: '显示/隐藏标记',
      icon: MARKER_VISIBLE_ICON,
      tooltip: '显示/隐藏标记',
      type: 'toggle'
    },
    {
      id: 'coordinate',
      name: '坐标',
      icon: COORDINATE_ICON,
      tooltip: '显示坐标',
      type: 'toggle'
    }
  ],
  buttons: {
    measure: true,
    drawPoint: true,
    coordinate: true,
    zoomIn: true,
    zoomOut: true,
    fullView: true,
    layerSwitch: true,
    toggleMarkers: true
  }
};