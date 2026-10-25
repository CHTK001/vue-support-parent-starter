/**
 * ReFlowGraph 数据契约
 *
 * 刻意与采集平台的流程 DSL 对齐（nodes[].shape / edges[].from|to / params），
 * 上层页面拿到 getData() 后几乎不需要转换即可提交后端。
 */

/** 节点类型定义（调色板一项；通常由后端 /designer/metas 驱动） */
export interface FlowNodeTypeDef {
  /** 类型标识，落到节点 shape 上 */
  type: string;
  /** 中文名 */
  label: string;
  /** 分组名，调色板按组分段 */
  group?: string;
  /** 图标：24×24 viewBox 的 SVG path d，缺省用通用图形 */
  path?: string;
  /**
   * 节点图片 URL，与 `path` 二选一。
   *
   * 给了 `image` 时卡片左侧渲染 `<img>` 而不是 SVG path 图标；两者都给时 `image` 优先。
   * 内部业务图（应用图标、处理器图标之类）用这个比硬凑 path 方便。
   */
  image?: string;
  /** 主色 */
  color?: string;
  /** 气泡说明 */
  tips?: string;
  /** 不可删除 / 不可重命名（如开始节点） */
  fixed?: boolean;
}

/** 画布节点 */
export interface FlowNode {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  /** 业务参数，原样透传给后端 */
  data?: Record<string, unknown>;
}

/**
 * 连线语义色（对齐 spider-flow 的四种出边口径）
 * - normal    正常流：绿
 * - exception 异常流：红
 * - condition 条件流：蓝
 * - else      其余分支：灰
 */
export type FlowEdgeKind = "normal" | "exception" | "condition" | "else";

/** 画布连线 */
export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  /** 起点锚（top/right/bottom/left），缺省 bottom */
  fromPort?: string;
  /** 终点锚，缺省 top */
  toPort?: string;
  kind?: FlowEdgeKind;
  label?: string;
  /** false = 不传递变量 → 虚线 */
  transfer?: boolean;
  data?: Record<string, unknown>;
}

/** 整图数据 */
export interface FlowGraphData {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

/** 结构自检结果 */
export interface FlowStructureIssue {
  level: "error" | "warning";
  code: "NO_START" | "MULTI_START" | "NO_END" | "MULTI_END" | "DANGLING" | "ISOLATED" | "SELF_LOOP";
  message: string;
  cellId?: string;
}

/** 当前选中对象 */
export type FlowSelection =
  | { kind: "node"; node: FlowNode }
  | { kind: "edge"; edge: FlowEdge }
  | null;

/** 内置右键菜单动作名 */
export type FlowMenuAction =
  | "rename"
  | "locate"
  | "copy"
  | "delete"
  | "delete-edge"
  | "locate-edge"
  | "add";

/**
 * 右键菜单项。
 *
 * 两种用法二选一：给 `action` 走内置实现，或给 `onClick` 自己处理。
 * 两者都给了则以 `action` 为准（内置实现会先跑，`onClick` 不再触发）。
 */
export interface FlowMenuItem {
  /** 唯一 key，v-for 用 */
  key: string;
  /** 显示文案 */
  label: string;
  /** 内置动作；给了就走内置实现 */
  action?: FlowMenuAction;
  /**
   * `action: "add"` 时要添加的节点类型。
   *
   * 与 nodeTypes 里的 type 对应，落点取右键处坐标。
   */
  addType?: string;
  /** 二级子菜单项；存在时该项只作为展开入口，不执行 action */
  children?: FlowMenuItem[];
  /**
   * 自定义回调；`action` 缺省时才生效。
   *
   * `node` 是被右键的那个节点（节点菜单上恒非 null）；`edge` 是被右键的连线
   * （连线菜单上非 null）。两者随菜单上下文而定。
   */
  onClick?: (ctx: { node: FlowNode | null; edge: FlowEdge | null; event: MouseEvent }) => void;
  /** 危险项（删除），走红色样式 */
  danger?: boolean;
  /** 禁用项：置灰且不触发 */
  disabled?: boolean;
  /** 分组标题项：渲染成分隔标题，不可点 */
  header?: string;
}
