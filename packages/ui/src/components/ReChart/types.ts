import type { EChartsOption } from "echarts";

/**
 * ReChart 统一图表面板类型（与具体渲染引擎解耦）。
 *
 * ReChart 是一层极薄的「面板 + 引擎」门面：
 *  - 面板仅承载 engine / type / option / data 等通用 props，以及 loading / error 骨架；
 *  - 渲染完全交给引擎（echarts / d3），引擎内部决定如何把 data 变成图。
 *
 * 这样调用方既可以用常见图类型的 option 直出（echarts 引擎），
 * 也可以用统一的 {@link ReChartFlowData} 结构让 d3 / G6 引擎直接画流线图。
 */

/** 支持的图表面板类型 */
export type ReChartType =
  | "line" // 折线
  | "area" // 面积（折线 + 渐变填充）
  | "bar" // 柱状
  | "pie" // 饼/环
  | "donut" // 环形（饼 + 内半径）
  | "radar" // 雷达
  | "funnel" // 漏斗
  | "scatter" // 散点
  | "gauge" // 仪表盘（仅 echarts）
  | "sankey" // 桑基（.antv 流线）
  | "heatmap" // 热力图（仅 echarts）
  | "custom" // 完全由 option 决定，type 只作标注
  | "flow" // 资金流/流线图（G6，独立于 echarts/d3）
  | "topology" // 链路拓扑（自绘 SVG：连线流动动画 + 在用线路高亮 + 小鸟搬运）
  | "context"; // 上下文窗口（同一份数据的两种画法：面积图 / 点阵图）

/** 聚合面板使用的渲染引擎 */
export type ReChartEngine = "echarts" | "d3";

/** 流线图（资金流 / 决策流 / 流程图）节点数据结构 */
export interface ReChartFlowNode {
  id: string;
  name: string;
  label?: string;
  currency?: string;
  /** 涨跌占比（0~1），用于百分比着色 */
  variableValue?: number;
  /** 涨幅标记（决定三角形朝向） */
  variableUp?: boolean;
  /** 状态 → 默认调色板 key：B/R/Y/G/DI */
  status?: string;
  /** 自定义节点背景色 */
  color?: string;
  /** 进度条完成度（0~1） */
  rate?: number;
  children?: ReChartFlowNode[];
}

/** 流线图数据：树结构（与 @antv/g6 的 treeToGraphData 期望一致） */
export interface ReChartFlowData {
  root?: ReChartFlowNode;
  /** 直接传入 root 亦可（data.root ?? data） */
  [key: string]: unknown;
}

/** 桑基图数据（echarts / d3 引擎共用） */
export interface ReChartSankeyData {
  nodes: { name: string; [key: string]: unknown }[];
  links: { source: string | number; target: string | number; value: number }[];
}

/**
 * 组件统一 props。
 * 面板只持有描述性配置；echarts 依赖的完整 option 用 {@link option} 透传。
 */
export interface ReChartProps {
  /** 图表面板类型 */
  type?: ReChartType;
  /** 渲染引擎（flow 类型忽略此值，固定走 G6） */
  engine?: ReChartEngine;
  /** 当 type="flow" 时的流线图数据（G6） */
  data?: ReChartFlowData | ReChartFlowNode;
  /** echarts 引擎直接透传的完整 option（优先于自动生成的简版 option） */
  option?: EChartsOption;
  /** d3 引擎的桑基数据 */
  sankey?: ReChartSankeyData;
  /** echarts 简版数据：类目 / 数值 / 名称 / 系列 */
  categories?: string[];
  values?: number[] | number[][];
  name?: string;
  series?: import("./engines/echarts").ChartSimpleSeries;
  /** 高度 / 宽度 */
  height?: string;
  width?: string;
  /** 主题（light / dark） */
  theme?: "light" | "dark";
  /** 自动 resize */
  autoResize?: boolean;
  /** 骨架最小高度 */
  minHeight?: string;
  /** 显示引擎切换 */
  engineSelector?: boolean;
}

/** 事件：echarts 引擎转发点击 / 悬停 */
export interface ReChartEmit {
  (e: "ready", payload: { engine: ReChartEngine; instance: unknown }): void;
  (e: "click", params: unknown): void;
  (e: "mouseover", params: unknown): void;
  (e: "mouseout", params: unknown): void;
}

/* ==================== 多视图（图标切换） ==================== */

/**
 * 一个视图面板：一个图标按钮 + 一份数据 + 一种图类型。
 *
 * **数据格式强约束**：`data` 的**所有视图必须同形状**，由 `type` 决定形状校验器。
 * 形状不符且**没有** `transform` 时不渲染（告警 + 空态），本组件不做任何隐式猜测；
 * 上游形状不同时，必须给出 {@link ViewPane.transform} 显式归一。
 *
 * ```ts
 * // 形状一致：直接给
 * { key: "route", type: "topology", icon: Connection, label: "链路", data: routeMap }
 * // 形状不同：显式 transform 归一
 * { key: "route", type: "topology", icon: Connection, data: raw.asIs, transform: toRouteMap }
 * ```
 */
export interface ViewPane<TData = unknown> {
  /** 视图唯一键 */
  key: string;
  /** 该视图的图类型；不填时沿用面板的 {@link ReChartProps.type} */
  type?: ReChartType;
  /** 图标：可直接给组件（markRaw 包一层），也可给已加载/懒加载组件的 Promise */
  icon?: unknown;
  /** 悬停提示与无障碍标签 */
  label?: string;
  /** 视图数据（形状须与 type 的契约一致） */
  data?: TData;
  /** 上游形状与契约不一致时的显式归一函数；给了就一定是它说了算 */
  transform?: (raw: TData) => unknown;
  /** 面板级覆盖：echarts 完整 option / categories / values / series 等 */
  options?: Partial<ReChartProps>;
}

/* ==================== 链路拓扑（topology） ==================== */

/** 拓扑节点状态：正常 / 正在使用 / 受限 / 离线 */
export type TopologyNodeStatus = "idle" | "active" | "limited" | "offline";

/** 拓扑节点 */
export interface TopologyNode {
  id: string;
  /** 主标题 */
  label: string;
  /** 次标题（地址、型号等） */
  detail?: string;
  /** 分组列（相同 kind 的节点放同一列，列序按首次出现） */
  kind?: string;
  /** 节点状态，默认 idle */
  status?: TopologyNodeStatus;
  /** 节点角标（最多展示 2 条） */
  meta?: string[];
}

/** 拓扑连线 */
export interface TopologyEdge {
  /** 起点节点 id */
  from: string;
  /** 终点节点 id */
  to: string;
  /** 是否为当前正在使用的线路；true 时流动动画加速 + 小鸟搬运 */
  active?: boolean;
  /** 连线状态，默认 idle */
  status?: TopologyNodeStatus;
  /** 连线上的标注 */
  label?: string;
}

/** 链路拓扑数据（type="topology" 的唯一合法形状） */
export interface ReChartTopologyData {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}

/* ==================== 上下文窗口（context） ==================== */

/** 上下文切片类别（决定配色） */
export type ContextSliceKind = "file" | "image" | "tool" | "turn" | "prompt" | "free" | "other";

/** 上下文窗口的一个切片（一个对象/工具/文件占用的 token） */
export interface ContextSlice {
  key: string;
  label: string;
  /** 占用 token 数 */
  tokens: number;
  kind?: ContextSliceKind;
}

/** 上下文窗口数据（type="context" 的唯一合法形状） */
export interface ReChartContextData {
  /** 已用 token */
  used: number;
  /** 窗口总量 token */
  total: number;
  /** 明细切片；未给出 kind="free" 的切片时由 total - used 自动补出 */
  slices: ContextSlice[];
  /** 数据来源说明 */
  source?: {
    name?: string;
    /** 分组 / 会话名 */
    group?: string;
    /** 状态文案，等于 "实时" 时显示实时徽标 */
    status?: string;
  };
}