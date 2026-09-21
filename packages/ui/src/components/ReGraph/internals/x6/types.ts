/**
 * ReGraph X6 数据契约
 *
 * 与 @relation-graph 解耦的通用数据模型，便于从老数据结构平滑迁移。
 * 节点 / 连线字段与 X6 的 Node.Metadata / Edge.Metadata 一一对应。
 */

/** 节点类型（可用于 agent-flow 调色板与样式区分） */
export type ReGraphNodeType =
  | "default"
  | "start"
  | "end"
  | "llm"
  | "knowledge"
  | "tool"
  | "condition"
  | "code"
  | "http"
  | "input"
  | "output"
  | (string & {});

/** 图节点数据（用户传入） */
export interface ReGraphNode {
  /** 节点 id（必填，唯一） */
  id: string;
  /** 节点文本 / 标题 */
  text?: string;
  /** 节点类型（决定图标与配色，默认 default） */
  type?: ReGraphNodeType;
  /** 节点级颜色覆盖（优先级高于 type 默认色） */
  color?: string;
  /** 节点级图标覆盖（emoji / 字符） */
  icon?: string;
  /** 固定 x 坐标（fixed / 自定义布局使用） */
  x?: number;
  /** 固定 y 坐标 */
  y?: number;
  /** 节点宽度 */
  width?: number;
  /** 节点高度 */
  height?: number;
  /** 自定义样式（X6 attrs 覆盖，如 { body: { rx: 12 }, label: { fill: '#fff' } }） */
  style?: Record<string, unknown>;
  /** 任意业务数据，渲染插槽可读取 */
  data?: Record<string, unknown>;
  /** 是否锁定（不参与力导向 / 不可拖拽） */
  locked?: boolean;
  /** 是否隐藏 */
  hidden?: boolean;
}

/** 图连线数据（用户传入） */
export interface ReGraphEdge {
  /** 连线 id（可选，自动生成） */
  id?: string;
  /** 起点节点 id */
  from: string;
  /** 终点节点 id */
  to: string;
  /** 连线文本 / 标签 */
  text?: string;
  /** 起点锚点（top / right / bottom / left） */
  fromPort?: string;
  /** 终点锚点 */
  toPort?: string;
  /** 连线样式覆盖（X6 attrs，如 { line: { stroke: '#f00', strokeWidth: 2 } }） */
  style?: Record<string, unknown>;
  /** 是否播放流动动画（虚线流动） */
  animated?: boolean;
  /** 任意业务数据 */
  data?: Record<string, unknown>;
}

/** 完整图数据 */
export interface ReGraphData {
  /** 根节点 id（用于 tree / center 布局） */
  rootId?: string;
  /** 节点列表 */
  nodes: ReGraphNode[];
  /** 连线列表 */
  edges: ReGraphEdge[];
}

/** 布局模式（与原 ReGraph mode 对齐） */
/** 图布局模式枚举（对应 X6 布局算法） */
export enum ReGraphMode {
  FORCE = 'force',
  MIND = 'mind',
  TREE = 'tree',
  CIRCLE = 'circle',
  CENTER = 'center',
  FIXED = 'fixed',
  RELATION = 'relation',
}

/** 布局模式的入参类型：枚举本身，或等价的字面量取值 */
export type ReGraphModeInput = ReGraphMode | `${ReGraphMode}`;

const GRAPH_MODE_VALUES = Object.values(ReGraphMode) as string[];

/** 把字面量 / 远端配置归一化为 ReGraphMode，未知值回落 FORCE */
export function normalizeReGraphMode(value: ReGraphModeInput | string | undefined): ReGraphMode {
  return GRAPH_MODE_VALUES.includes(value ?? '')
    ? (value as ReGraphMode)
    : ReGraphMode.FORCE;
}

/** 工具栏功能开关 */
export interface ReGraphToolbarOptions {
  search?: boolean;
  layout?: boolean;
  zoom?: boolean;
  fit?: boolean;
  collapseAll?: boolean;
  expandAll?: boolean;
  importExport?: boolean;
  history?: boolean;
  minimap?: boolean;
  palette?: boolean;
}

/**
 * RelationGraph 通用配置
 *
 * 通过单一 config 对象驱动不同 X6 组件 / 布局 / 能力，等价于各独立 prop 的合集。
 * 优先级：config 中的字段覆盖同名独立 prop。
 */
export interface ReGraphConfig {
  /** 布局模式（决定使用哪个 X6 布局组件） */
  mode?: ReGraphMode;
  /** 是否可编辑（显示调色板、允许连线） */
  editable?: boolean;
  /** 强制显示调色板 */
  palette?: boolean;
  /** 显示完整工具栏 */
  showToolbar?: boolean;
  /** 显示小地图 */
  showMinimap?: boolean;
  /** 全部边流动动画 */
  animated?: boolean;
  /** 工具栏开关 */
  toolbar?: ReGraphToolbarOptions;
  /** 自定义调色板 / 节点组件映射 */
  nodeTypes?: ReGraphNodeTypeDef[];
  /** 容器高度 */
  height?: string | number;
  /** 容器宽度 */
  width?: string | number;
}

/** 调色板节点定义（agent-flow 风格） */
export interface ReGraphNodeTypeDef {
  /** 类型 key */
  type: ReGraphNodeType;
  /** 展示名称 */
  label: string;
  /** 图标（emoji / 字符） */
  icon: string;
  /** 主题色 */
  color: string;
}

/** 搜索模式 */
export type ReGraphSearchMode = "highlight" | "path";

/** 节点右键菜单动作 */
export type ReGraphNodeMenuAction =
  | "expand"
  | "collapse"
  | "lock"
  | "unlock"
  | "hide"
  | "show"
  | "focus"
  | "remove";

/** 远程扩线接口：调用方按需实现 */
export interface ReGraphExpandPayload {
  nodes: ReGraphNode[];
  edges: ReGraphEdge[];
}
export type ReGraphExpandFetcher = (
  nodeId: string,
) => Promise<ReGraphExpandPayload>;

/** X6 序列化后的图 JSON（toJSON / fromJSON） */
export interface ReGraphSerialized {
  version: string;
  exportTime: string;
  mode: ReGraphMode;
  cells: unknown[];
}
