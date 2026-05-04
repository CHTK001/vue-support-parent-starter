/**
 * ScFlowEditor 类型定义
 *
 * 提供可视化节点编辑器的公共类型定义。
 * 本模块仅包含对外契约类型，编辑器引擎内部类型不对外暴露。
 */

/**
 * 节点形状类型
 * - 'circle': 圆形节点（用于 START/END）
 * - 'pulse': 脉动效果节点（用于 HUMAN_INTERVENE）
 * - 'diamond': 菱形节点（用于 CONDITION）
 */
export type NodeShape = "circle" | "pulse" | "diamond" | "icon-box";

/**
 * 预定义节点类型映射（元数据）
 *
 * 用于左侧节点面板和默认节点创建。
 */
export const NodeTypes = {
  input: { label: "输入", icon: "ri:login-box-line", color: "#10b981" },
  output: { label: "输出", icon: "ri:logout-box-line", color: "#f59e0b" },
  process: { label: "处理", icon: "ri:settings-3-line", color: "#6366f1" },
  condition: { label: "条件", icon: "ri:git-branch-line", color: "#8b5cf6" },
  merge: { label: "合并", icon: "ri:git-merge-line", color: "#ec4899" },
  delay: { label: "延迟", icon: "ri:time-line", color: "#14b8a6" },
} as const;

/**
 * 节点类型名称
 */
export type NodeTypeName = keyof typeof NodeTypes;

/**
 * 节点配置对象
 */
export interface NodeConfig {
  type: NodeTypeName;
  label?: string;
  position?: { x: number; y: number };
  data?: Record<string, any>;
}

/**
 * 连接配置对象
 */
export interface ConnectionConfig {
  id?: string;
  sourceId: string;
  sourceOutput: string;
  targetId: string;
  targetInput: string;
  label?: string;
  runtimeStatus?: string;
  visited?: boolean;
}

/**
 * 编辑器数据格式
 *
 * 用于保存/加载编辑器状态的数据结构。
 */
export interface EditorData {
  nodes: Array<{
    id: string;
    type: NodeTypeName;
    label: string;
    position: { x: number; y: number };
    controls?: Record<string, any>;
    shape?: NodeShape;
    icon?: string;
    image?: string;
  }>;
  connections: ConnectionConfig[];
}

/**
 * 编辑器配置选项
 */
export interface EditorConfig {
  readonly?: boolean;
  minimap?: boolean;
  contextMenu?: boolean;
  autoArrange?: boolean;
  reroute?: boolean;
  background?: "dots" | "lines" | "none";
  zoom?: { min: number; max: number };
  customNodeTypes?: Record<string, any>;
  nodeMenuItems?: Array<{
    label: string;
    type: NodeTypeName;
    icon?: string;
  }>;
}

/**
 * 基础节点接口（兼容旧版类型引用）
 *
 * 仅保留 id/label/nodeType 等通用字段，不再继承 Rete 基类。
 */
export interface BaseNode {
  id: string;
  label: string;
  nodeType: string;
  nodeTypeName?: NodeTypeName;
  nodeIcon?: string;
  nodeColor?: string;
  nodeShape?: NodeShape;
  width?: number;
  height?: number;
  [key: string]: any;
}

/**
 * Vue Flow 自定义节点 data 载荷
 */
export interface SpiderNodeData {
  nodeType: NodeTypeName;
  label: string;
  icon?: string;
  image?: string;
  color?: string;
  shape?: NodeShape;
  controls?: Record<string, any>;
  [key: string]: any;
}

/**
 * 编辑器实例对象
 */
export interface EditorInstance {
  /** Vue Flow 实例引用 */
  vueFlowRef?: any;
}

/**
 * 编辑器事件类型定义
 */
export interface EditorEvents {
  "node-created": (node: any) => void;
  "node-removed": (node: any) => void;
  "node-selected": (node: any) => void;
  "connection-created": (connection: any) => void;
  "connection-removed": (connection: any) => void;
  "data-changed": (data: EditorData) => void;
  "zoom-changed": (zoom: number) => void;
}

