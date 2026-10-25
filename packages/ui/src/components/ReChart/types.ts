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
  | "flow"; // 资金流/流线图（G6，独立于 echarts/d3）

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