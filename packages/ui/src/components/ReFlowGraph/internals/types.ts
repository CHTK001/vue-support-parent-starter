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
