/**
 * ScWindowModal 类型定义
 * @author CH
 * @version 1.0.0
 * @created 2024-01-15
 */

import type { Component } from "vue";

/**
 * 窗口实例接口
 */
export interface WindowInstance {
  /** 窗口唯一标识 */
  id: string;
  /** 窗口标题 */
  title: string;
  /** 窗口图标 */
  icon?: Component | string;
  /** 窗口组件 */
  component?: Component;
  /** 窗口HTML内容 */
  content?: string;
  /** 组件属性 */
  props?: Record<string, any>;
  /** X坐标 */
  x: number;
  /** Y坐标 */
  y: number;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
  /** 最小宽度 */
  minWidth: number;
  /** 最小高度 */
  minHeight: number;
  /** 最大宽度 */
  maxWidth?: number;
  /** 最大高度 */
  maxHeight?: number;
  /** 层级 */
  zIndex: number;
  /** 是否最大化 */
  maximized: boolean;
  /** 是否最小化 */
  minimized: boolean;
  /** 是否可见 */
  visible: boolean;
  /** 是否正在拖拽 */
  dragging: boolean;
  /** 是否正在缩放 */
  resizing: boolean;
  /** 动画状态 - 是否正在打开 */
  opening?: boolean;
  /** 动画状态 - 是否正在关闭 */
  closing?: boolean;
  /** 是否启用网格模式 */
  gridMode: boolean;
  /** 网格大小 */
  gridSize: number;
  /** 是否可拖拽 */
  draggable: boolean;
  /** 是否可缩放 */
  resizable: boolean;
  /** 是否可最大化 */
  maximizable: boolean;
  /** 是否可最小化 */
  minimizable: boolean;
  /** 是否可关闭 */
  closable: boolean;
  /** 是否启用磁吸 */
  magneticEnabled: boolean;
  /** 磁吸距离 */
  magneticDistance: number;
  /** 最大化前的位置和大小 */
  beforeMaximize?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** 恢复位置 */
  restorePosition?: { x: number; y: number } | null;
  /** 恢复尺寸 */
  restoreSize?: { width: number; height: number } | null;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
  /** 窗口最后激活时间 */
  lastActiveAt?: number;
  /** 关闭前回调 */
  beforeClose?: (window: WindowInstance) => boolean | Promise<boolean>;
  /** 关闭后回调 */
  onClosed?: (window: WindowInstance) => void;
  /** 最小化后回调 */
  onMinimized?: (window: WindowInstance) => void;
  /** 最大化后回调 */
  onMaximized?: (window: WindowInstance) => void;
  /** 恢复后回调 */
  onRestored?: (window: WindowInstance) => void;
}

/**
 * 窗口配置选项
 */
export interface WindowOptions {
  /** 窗口标识（可选，不提供则自动生成） */
  id?: string;
  /** 窗口标题 */
  title: string;
  /** 窗口图标 */
  icon?: Component | string;
  /** 窗口组件 */
  component?: Component;
  /** 窗口HTML内容 */
  content?: string;
  /** 组件属性 */
  props?: Record<string, any>;
  /** 初始X坐标 */
  x?: number;
  /** 初始Y坐标 */
  y?: number;
  /** 初始宽度 */
  width?: number;
  /** 初始高度 */
  height?: number;
  /** 最小宽度 */
  minWidth?: number;
  /** 最小高度 */
  minHeight?: number;
  /** 最大宽度 */
  maxWidth?: number;
  /** 最大高度 */
  maxHeight?: number;
  /** 是否启用网格模式 */
  gridMode?: boolean;
  /** 网格大小 */
  gridSize?: number;
  /** 是否可拖拽 */
  draggable?: boolean;
  /** 是否可缩放 */
  resizable?: boolean;
  /** 是否可最大化 */
  maximizable?: boolean;
  /** 是否可最小化 */
  minimizable?: boolean;
  /** 是否可关闭 */
  closable?: boolean;
  /** 是否启用磁吸 */
  magneticEnabled?: boolean;
  /** 磁吸距离 */
  magneticDistance?: number;
  /** 是否居中显示 */
  centered?: boolean;
}

/**
 * 缩放手柄配置
 */
export interface ResizeHandle {
  /** 位置 */
  position: "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
  /** 鼠标样式 */
  cursor: string;
}

/**
 * 拖拽状态
 */
export interface DragState {
  /** 是否正在拖拽 */
  isDragging: boolean;
  /** 窗口ID */
  windowId: string;
  /** 起始鼠标位置 */
  startMouseX: number;
  startMouseY: number;
  /** 起始窗口位置 */
  startWindowX: number;
  startWindowY: number;
  /** 偏移量 */
  offsetX: number;
  offsetY: number;
}

/**
 * 缩放状态
 */
export interface ResizeState {
  /** 是否正在缩放 */
  isResizing: boolean;
  /** 窗口ID */
  windowId: string;
  /** 缩放方向 */
  direction: string;
  /** 起始鼠标位置 */
  startMouseX: number;
  startMouseY: number;
  /** 起始窗口位置和大小 */
  startWindowX: number;
  startWindowY: number;
  startWindowWidth: number;
  startWindowHeight: number;
}

/**
 * 窗口管理器配置
 */
export interface WindowManagerConfig {
  /** 默认窗口宽度 */
  defaultWidth: number;
  /** 默认窗口高度 */
  defaultHeight: number;
  /** 默认最小宽度 */
  defaultMinWidth: number;
  /** 默认最小高度 */
  defaultMinHeight: number;
  /** 起始层级 */
  baseZIndex: number;
  /** 网格大小 */
  gridSize: number;
  /** 磁吸距离 */
  magneticDistance: number;
  /** 边缘检测距离 */
  edgeDetectionDistance: number;
  /** 动画持续时间 */
  animationDuration: number;
}

/**
 * 窗口事件类型
 */
export type WindowEventType = "created" | "opened" | "closed" | "minimized" | "maximized" | "restored" | "moved" | "resized" | "focused" | "blurred";

/**
 * 窗口事件数据
 */
export interface WindowEvent {
  /** 事件类型 */
  type: WindowEventType;
  /** 窗口实例 */
  window: WindowInstance;
  /** 事件时间戳 */
  timestamp: number;
  /** 额外数据 */
  data?: any;
}

/**
 * 窗口位置信息
 */
export interface WindowPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 边缘检测结果
 */
export interface EdgeDetectionResult {
  /** 是否触及边缘 */
  isEdge: boolean;
  /** 触及的边缘 */
  edges: ("top" | "right" | "bottom" | "left")[];
  /** 调整后的位置 */
  adjustedPosition: WindowPosition;
}

/**
 * 磁吸检测结果
 */
export interface MagneticResult {
  /** 是否触发磁吸 */
  isMagnetic: boolean;
  /** 磁吸到的边缘 */
  edge: "top" | "right" | "bottom" | "left" | null;
  /** 磁吸后的位置 */
  magneticPosition: WindowPosition;
}

/**
 * 窗口状态快照
 */
export interface WindowSnapshot {
  /** 窗口ID */
  id: string;
  /** 位置信息 */
  position: WindowPosition;
  /** 状态信息 */
  state: {
    maximized: boolean;
    minimized: boolean;
    zIndex: number;
  };
  /** 快照时间 */
  timestamp: number;
}

/**
 * 导出所有类型
 */
export type {
  DragState,
  EdgeDetectionResult,
  MagneticResult,
  ResizeHandle,
  ResizeState,
  WindowEvent,
  WindowEventType,
  WindowInstance,
  WindowManagerConfig,
  WindowOptions,
  WindowPosition,
  WindowSnapshot
};
