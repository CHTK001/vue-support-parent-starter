/**
 * 工具相关配置
 */
import type { Component } from 'vue';
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
   */
  type?: 'button' | 'menu';
  /**
   * 子菜单项，仅当type为menu时有效
   */
  children?: ToolItem[];
}

// 面板位置类型
export type ToolbarPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

// 面板方向类型
export type ToolbarDirection = 'horizontal' | 'vertical';
