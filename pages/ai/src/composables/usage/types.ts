/**
 * 用量看板 · 共享类型
 *
 * <p>指标口径（Token / 费用）贯穿图表、排行、明细三块，类型集中在这里，
 * 避免各模块各自用字符串字面量拼 "token" | "cost"。</p>
 */

/** 看板当前口径：按 Token 或按费用 */
export type ChartType = "token" | "cost";

/** 一条聚合后的分布行（模型 / 分组 / 应用都归一到这个形状） */
export interface DistRow {
  name: string;
  requests: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

/** 看板里的一个条目：分布行 + 当前口径的值 / 占比 / 稳定配色 */
export interface BoardItem {
  name: string;
  value: number;
  pct: number;
  color: string;
  row: DistRow;
}

/** 看板数据：全部条目（明细表用）+ 环图/图例共用的切片 */
export interface BoardData {
  items: BoardItem[];
  slices: BoardItem[];
  total: number;
}

/** 环心显示的悬停扇区（null = 没悬停，回落到 Top1） */
export interface HoverSlice {
  name: string;
  pct: number;
}

/** 每日模型用量的一行（后端 /usage/model-trend 原样） */
export interface ModelTrendRow {
  date: string;
  model: string;
  provider: string;
  totalTokens: number;
  totalCost: number;
  /** null 表示当天没实测样本（延迟图应断点，不能画成 0ms） */
  avgFirstTokenLatency: number | null;
  avgTotalLatency: number | null;
}

/** 每日趋势的一行（按天聚合后的输入/输出/缓存） */
export interface TrendRow {
  date: string;
  input: number;
  output: number;
  cached: number;
  total: number;
}

/** 时间筛选参数：空对象即「全部时间」 */
export interface TimeParams {
  startTime?: string;
  endTime?: string;
}

/** 时间快捷筛选键 */
export type QuickFilterKey = "today" | "7d" | "30d" | "all" | "custom";

/** 看板维度：模型 / 分组 */
export type BoardWhich = "model" | "group";
