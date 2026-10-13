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

/** 视图模式
 *
 * <p>{@code 2d} 是 G6 画布（全部能力）；{@code 3d} 是 vue-force-graph-3d 力导向视图，
 * 只覆盖子集：布局固定为 3D 力导向、无小地图、无双击事件、无 combo 容器
 * （详见 internals/ForceGraph3D.vue 顶部说明）。</p>
 */
export type RelationViewMode = "2d" | "3d";

/** 工具栏按钮 key（用于按需显示某个开关） */
export type RelationToolbarItem =
  | "layout"
  | "layoutSettings"
  | "group"
  | "minimap"
  | "highlight"
  | "hoverFocus"
  | "fit"
  | "undo"
  | "redo"
  | "connect"
  | "export"
  | "mode"
  | "delete";

/** 工具栏定位：类似地图工具条的四个角 / 顶部居中 */
export type RelationToolbarPosition =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left"
  | "top-center";

/** 右键菜单上下文 */
export interface RelationContextMenuContext {
  /** 菜单目标类型 */
  kind: "node" | "edge" | "canvas";
  /** 目标元素 id（canvas 时为空串） */
  id: string;
  /** 目标节点（kind=node 时可能为 null） */
  node: RelationNode | null;
  /** 目标边（kind=edge 时可能为 null） */
  edge: RelationEdge | null;
  /** 当前多选中的节点 id */
  selectedIds: string[];
  /** 组件实例 API，供自定义菜单项调用 */
  api: RelationGraphApi;
}

/** 自定义右键菜单项：支持名字 / 图标 / 回调 */
export interface RelationContextMenuItem {
  /** 唯一标识 */
  key: string;
  /** 显示名称 */
  label: string;
  /** 图标名（ReIcon 支持的名称，如 "Search"/"Expand"），可省略 */
  icon?: string;
  /** 是否显示；布尔值或按当前上下文求值 */
  show?: boolean | ((ctx: RelationContextMenuContext) => boolean);
  /** 是否禁用；布尔值或按当前上下文求值 */
  disabled?: boolean | ((ctx: RelationContextMenuContext) => boolean);
  /** 点击回调，返回 Promise 时组件会等待完成后再收菜单 */
  handler?: (ctx: RelationContextMenuContext) => void | Promise<void>;
}

/** 图谱视图偏好（可持久化到后台） */
export interface RelationGraphSettings {
  /** 布局名 */
  layout?: RelationLayoutName;
  /** 布局参数 */
  layoutOptions?: Record<string, unknown>;
  /** 是否显示分组容器 */
  showGroups?: boolean;
  /** 是否显示小地图 */
  minimap?: boolean;
  /** 悬停高亮模式 */
  highlight?: RelationHighlightMode;
  /** 悬停时是否隐藏其它节点 */
  hoverFocus?: boolean;
  /** 右键扩线默认深度 */
  expandDepth?: number;
  /** 最大加载深度 */
  maxDepth?: number;
  /** 是否开启部分加载 */
  partial?: boolean;
  /** 业务扩展字段原样透传 */
  [key: string]: unknown;
}

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
  /**
   * 展开布局调参面板。
   *
   * <p>供 {@code toolbar=false} 的调用方在自己的工具栏上放按钮驱动；
   * {@code tunable=false} 时为空操作。</p>
   */
  openTuning: () => void;
  /** 收起布局调参面板 */
  closeTuning: () => void;
  /** 切换布局调参面板开合 */
  toggleTuning: () => void;
  /** 以当前调参值立即重跑一次布局 */
  applyLayoutTuning: () => Promise<void>;
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
  /** 切换 2D/3D 视图（3D 为 vue-force-graph-3d 力导向） */
  setMode: (mode: RelationViewMode) => Promise<void> | void;
  /** 当前视图模式 */
  getMode: () => RelationViewMode;
  getInstance: () => unknown;

  // ===== 2026-10-07 补齐：搜索 / 定位 / 导出 / 编辑 / 历史 =====

  /**
   * 按关键字（label / id，不区分大小写）检索节点，并高亮命中节点。
   * @returns 命中节点 id 列表
   */
  search: (keyword: string) => string[];
  /**
   * 聚焦并选中某个节点（2D 用 G6 focusElement，3D 用 centerOn）。
   */
  locate: (id: string) => Promise<void>;

  /**
   * 导出图片为 dataURL。
   * <p>2D 用 G6 toDataURL；3D 用 three.js WebGLRenderer 画布。
   * 节点内容插槽（DOM）不包含在内。</p>
   * @param type  'png' | 'jpeg'，默认 png
   * @param quality jpeg 品质 (0-1)
   */
  exportImage: (type?: "png" | "jpeg", quality?: number) => Promise<string>;

  /** 切换「拖边连线」模式（仅 2D 且 editable 时生效） */
  setConnectMode: (on: boolean) => void;
  /** 当前是否处于「拖边连线」模式 */
  getConnectMode: () => boolean;

  /** 撤销上一步编辑（2D 画布数据变更；3D 视图同步） */
  undo: () => Promise<void>;
  /** 重做上一步被撤销的编辑 */
  redo: () => Promise<void>;
  /** 是否可撤销 */
  canUndo: () => boolean;
  /** 是否可重做 */
  canRedo: () => boolean;
  /** 清空撤销 / 重做历史 */
  clearHistory: () => void;

  // ===== 2026-10-13 补齐：显示开关 / 扩线 / 最短路径 / 详情 / 偏好持久化 =====

  /** 切换「显示分组容器」 */
  setShowGroups: (on: boolean) => Promise<void>;
  /** 当前是否显示分组容器 */
  getShowGroups: () => boolean;
  /** 切换小地图（重建图实例生效） */
  setMinimap: (on: boolean) => Promise<void>;
  /** 当前小地图开关状态 */
  getMinimap: () => boolean;
  /** 切换悬停高亮模式（none/group/adjacent/both，重建图实例生效） */
  setHighlightMode: (mode: RelationHighlightMode) => Promise<void>;
  /** 当前悬停高亮模式 */
  getHighlightMode: () => RelationHighlightMode;
  /** 切换「悬停隐藏其它节点」 */
  setHoverFocus: (on: boolean) => Promise<void>;
  /** 当前是否悬停隐藏其它节点 */
  getHoverFocus: () => boolean;

  /**
   * 右键扩线：把某节点的邻居数据合并进当前子图。
   *
   * <p>数据来源优先取 {@code loadNeighbors} prop；未配置时返回 false
   * 并派发 {@code node-expand} 事件，由调用方自行处理。</p>
   * @param id    目标节点 id
   * @param depth 本次扩线的深度（默认 1）
   * @return 是否成功合并
   */
  expandNode: (id: string, depth?: number) => Promise<boolean>;

  /**
   * 显示多选节点之间的最短路径（高亮路径，其它节点置灰/隐藏）。
   *
   * @param ids 节点 id 列表；缺省用当前选中集
   * @return 路径经过的节点 id 列表
   */
  showShortestPath: (ids?: string[]) => Promise<string[]>;

  /** 清除最短路径高亮，恢复原图显示 */
  restorePath: () => Promise<void>;

  /** 打开右侧详情面板（懒加载时异步拉取详情） */
  openDetail: (id: string) => Promise<void>;
  /** 关闭右侧详情面板 */
  closeDetail: () => void;

  /** 收集当前视图偏好 */
  getSettings: () => RelationGraphSettings;
  /** 应用一份视图偏好（从后台读出的） */
  applySettings: (settings: RelationGraphSettings) => Promise<void>;
  /** 保存当前视图偏好到后台（经 saveSettings prop / settings-change 事件） */
  saveSettings: () => Promise<void>;
}
