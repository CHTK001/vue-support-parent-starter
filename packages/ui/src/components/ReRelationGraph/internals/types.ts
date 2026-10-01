/**
 * ReRelationGraph 类型定义（G6 v5）
 *
 * <p>数据模型刻意做了两层：顶层给「业务字段」用 {@code data}，视觉属性放 {@code style}，
 * 与 G6 v5 的 {@code { id, data, style }} 结构一致，避免业务数据与渲染参数混在一起。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */

/** 节点原型（G6 v5 内置节点类型） */
export type RelationNodeType =
  | "circle"
  | "rect"
  | "ellipse"
  | "image"
  | "html"
  | "star"
  | "triangle"
  | "diamond"
  | "donut"
  | "hexagon";

/** 边类型（G6 v5 内置）
 *
 * <p>{@code cubic-radial} 需要**树形数据**：G6 内部取 {@code model.getRootsData()[0]} 作参照，
 * 普通关系图没有树根会抛 "Tree structure not found"。</p>
 */
export type RelationEdgeType =
  | "line"
  | "polyline"
  | "quadratic"
  | "cubic"
  | "cubic-horizontal"
  | "cubic-vertical"
  | "cubic-radial";

/** 关系图节点 */
export interface RelationNode {
  /** 唯一标识（必填） */
  id: string;
  /** 显示名称，缺省用 id */
  label?: string;
  /** 节点原型，缺省 circle */
  type?: RelationNodeType;
  /** 图片地址：type=image 时使用；其它类型会作为头像背景绘制在图元内 */
  image?: string;
  /**
   * 大小：数字为正方形边长；数组为 [宽, 高]。
   * 省略时由全局配置或 G6 默认推导
   */
  size?: number | [number, number];
  /** 分组名：用于「同组高亮」。**不是** combo 容器归属 */
  group?: string;
  /**
   * combo 容器 id：填了才会把节点放进该容器。
   *
   * <p>刻意与 {@link #group} 分开：分组高亮是纯视觉逻辑，放进容器会改变布局与坐标，
   * 早先把两者合成一个字段，导致 G6 去 setParent 一个并不存在的 combo 而整图渲染失败。</p>
   */
  combo?: string;
  /** 是否固定：固定后拖拽不改位置（力导布局下尤其有用） */
  fixed?: boolean;
  /** 视觉覆盖（G6 style，如 fill/stroke/lineWidth/labelText 等） */
  style?: Record<string, unknown>;
  /** 业务数据：原样保留，不在图上渲染 */
  data?: Record<string, unknown>;
}

/** 关系图边 */
export interface RelationEdge {
  /** 唯一标识；省略时按 `source->target` 自动生成 */
  id?: string;
  /** 起点节点 id */
  source: string;
  /** 终点节点 id */
  target: string;
  /** 显示文本 */
  label?: string;
  /** 边类型，缺省 line */
  type?: RelationEdgeType;
  /** 是否有方向（true 时画箭头） */
  directed?: boolean;
  /** 是否动态流动效果 */
  animated?: boolean;
  /** 分组名 */
  group?: string;
  /** 视觉覆盖 */
  style?: Record<string, unknown>;
  /** 业务数据 */
  data?: Record<string, unknown>;
}

/** 分组（combo）容器 */
export interface RelationCombo {
  /** 唯一标识 */
  id: string;
  /** 显示名称 */
  label?: string;
  /** 容器原型 */
  type?: "circle" | "rect";
  /** 视觉覆盖 */
  style?: Record<string, unknown>;
  /** 业务数据 */
  data?: Record<string, unknown>;
}

/** 图数据 */
export interface RelationGraphData {
  nodes?: RelationNode[];
  edges?: RelationEdge[];
  combos?: RelationCombo[];
}

/** 悬停高亮模式 */
export type RelationHighlightMode =
  /** 不高亮 */
  | "none"
  /** 同组高亮，其余淡出 */
  | "group"
  /** 相邻（直接相连）高亮，其余淡出 */
  | "adjacent"
  /** 同组 + 相邻都高亮 */
  | "both";

/** 布局名（G6 v5 内置） */
export type RelationLayoutName =
  | "force"
  | "d3-force"
  | "force-atlas2"
  | "fruchterman"
  | "mds"
  | "circular"
  | "concentric"
  | "radial"
  | "grid"
  | "random"
  | "dagre"
  | "antv-dagre"
  | "combo-combined"
  | "compact-box"
  | "dendrogram"
  | "indented"
  | "mindmap"
  | "fishbone"
  | "snake";

/** 工具栏可切换的布局（带中文名）
 *
 * <p><strong>层级布局需要树形数据</strong>：{@code compact-box / dendrogram / indented / mindmap / fishbone}
 * 在 G6 里都走 {@code getRoots(TREE_KEY)}，套在普通关系图上会抛
 * "Tree structure not found for treeKey: tree"（该异常在 G6 内部异步抛出，组件侧 try/catch 拦不住）。
 * 给树形数据用时再选这几项。</p>
 */
export const RELATION_LAYOUTS: Array<{ value: RelationLayoutName; label: string; needTree?: boolean }> = [
  { value: "force", label: "力导向" },
  { value: "d3-force", label: "D3 力导向" },
  { value: "force-atlas2", label: "ForceAtlas2" },
  { value: "fruchterman", label: "Fruchterman" },
  { value: "mds", label: "MDS 降维" },
  { value: "circular", label: "环形" },
  { value: "concentric", label: "同心圆" },
  { value: "radial", label: "辐射" },
  { value: "grid", label: "网格" },
  { value: "random", label: "随机" },
  { value: "dagre", label: "有向分层" },
  { value: "antv-dagre", label: "有向分层(antv)" },
  { value: "snake", label: "蛇形" },
  { value: "compact-box", label: "紧凑树", needTree: true },
  { value: "dendrogram", label: "树状图", needTree: true },
  { value: "indented", label: "缩进树", needTree: true },
  { value: "mindmap", label: "思维导图", needTree: true },
  { value: "fishbone", label: "鱼骨图", needTree: true },
];

/** 图实例最小接口（对外暴露的能力） */
export interface RelationGraphApi {
  addNode: (node: RelationNode) => Promise<void>;
  addEdge: (edge: RelationEdge) => Promise<void>;
  updateNode: (node: RelationNode) => Promise<void>;
  updateEdge: (edge: RelationEdge) => Promise<void>;
  removeNode: (id: string) => Promise<void>;
  removeEdge: (id: string) => Promise<void>;
  setData: (data: RelationGraphData) => Promise<void>;
  getData: () => RelationGraphData;
  setLayout: (name: RelationLayoutName, options?: Record<string, unknown>) => Promise<void>;
  getLayout: () => string;
  fitView: () => Promise<void>;
  zoomIn: () => Promise<void>;
  zoomOut: () => Promise<void>;
  zoomTo: (ratio: number) => Promise<void>;
  centerOn: (id: string) => Promise<void>;
  select: (ids: string[]) => void;
  getSelection: () => string[];
  clearSelection: () => void;
  highlight: (ids: string[]) => void;
  clearHighlight: () => void;
  getInstance: () => unknown;
}
