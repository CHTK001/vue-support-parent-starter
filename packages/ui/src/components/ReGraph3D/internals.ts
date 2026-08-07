/**
 * ReGraph3D —— 3D 力导向关系图
 *
 * 基于 three.js + d3-force-3d 实现（与 3d-force-graph 算法一致），
 * 不依赖外部 3d-force-graph npm 包。
 *
 * 数据契约：
 *   nodes: { id: string; text?: string; group?: string; val?: number; color?: string; data?: any }[]
 *   links: { source: string; target: string; text?: string; color?: string; width?: number }[]
 */
import type { Component } from "vue";

export interface Graph3DNode {
  id: string;
  /** 显示文本 */
  text?: string;
  /** 节点分组（用于着色） */
  group?: string;
  /** 节点度数（决定大小） */
  val?: number;
  /** 节点颜色（覆盖 group 默认色） */
  color?: string;
  /** 自定义扩展数据 */
  data?: Record<string, unknown>;
}

export interface Graph3DLink {
  /** 起点节点 id */
  source: string;
  /** 终点节点 id */
  target: string;
  /** 连线文本 */
  text?: string;
  /** 连线颜色 */
  color?: string;
  /** 连线宽度 */
  width?: number;
}

export interface Graph3DData {
  nodes: Graph3DNode[];
  links: Graph3DLink[];
}

export interface ReGraph3DProps {
  data?: Graph3DData;
  nodes?: Graph3DNode[];
  links?: Graph3DLink[];
  height?: string | number;
  width?: string | number;
  /** 节点配色（按 group） */
  nodeColors?: Record<string, string>;
  /** 节点尺寸基数 */
  nodeRelSize?: number;
  /** 背景色（CSS 颜色，'transparent' = 透明） */
  backgroundColor?: string;
  /** 是否显示节点文本 */
  showNodeLabel?: boolean;
  /** 是否显示连线文本 */
  showLinkLabel?: boolean;
  /** 连线宽度 */
  linkWidth?: number;
  /** 连线方向箭头长度（0 = 不显示） */
  linkArrowLength?: number;
  /** 力学参数 */
  forceChargeStrength?: number;
  forceLinkDistance?: number;
  forceCenterStrength?: number;
  /** 初始相机距离 */
  cameraDistance?: number;
  /** 自动旋转 */
  autoRotate?: boolean;
  /** 是否启用交互（拖拽旋转/缩放） */
  interactive?: boolean;
  /** 是否显示调试信息 */
  debug?: boolean;
}

export interface ReGraph3DEmits {
  (e: "ready", instance: unknown): void;
  (e: "node-click", node: Graph3DNode): void;
  (e: "node-hover", node: Graph3DNode | null): void;
  (e: "link-click", link: Graph3DLink): void;
}

export const ReGraph3DDefaultTheme = "default";

export type ThemedReGraph3DMap = Record<string, () => Promise<{ default: Component }>>;
