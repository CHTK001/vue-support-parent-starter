/**
 * 用量看板 · 三张图（每日模型堆叠 / Token 趋势 / 模型延迟）
 *
 * <p>堆叠柱与延迟图其实是同一个数据结构：**日期 × 模型** 的矩阵，只是
 * 一个格子里放「用量」、另一个放「首字延迟」。所以两者共用 {@link pivotDateModel}
 * 做透视，只有「怎么算格子值」和「怎么画」不同。</p>
 */

import { computed } from "vue";
import type { EChartsOption } from "echarts";
import type { ChartType, ModelTrendRow, TrendRow } from "./types";
import type { UsageFormat } from "./format";

/** 堆叠柱与延迟图各保留几条模型线（其余并成「其他」/直接不画） */
export const MODEL_BAR_TOP_N = 8;
export const MODEL_LATENCY_TOP_N = 6;

/** 同一模型在不同日期必须拿到同一个颜色，故颜色按模型名做稳定映射而非按下标 */
const MODEL_COLORS = [
  "#5B8FF9", "#5AD8A6", "#5D7092", "#F6BD16", "#6F5EF9",
  "#6DC8EC", "#945FB9", "#FF9845", "#1E9493", "#FF99C3",
  "#269A99", "#8D6DFF", "#E8684A", "#4EA3D1", "#C9A227",
];

/** 模型名 -> 颜色。按首次出现顺序占坑，保证跨刷新/跨筛选不跳色 */
export function createModelPalette() {
  const map = new Map<string, string>();
  return function colorOfModel(model: string): string {
    const key = model || "未知模型";
    let c = map.get(key);
    if (!c) {
      c = MODEL_COLORS[map.size % MODEL_COLORS.length];
      map.set(key, c);
    }
    return c;
  };
}

interface PivotResult {
  /** 升序日期 */
  dates: string[];
  /** 每个模型在每天的值（缺格为 null） */
  cells: Map<string, Map<string, number | null>>;
  /** 模型 -> 区间内权重（用于挑前 N） */
  weight: Map<string, number>;
}

/**
 * 透视成「日期 × 模型」矩阵。
 *
 * @param valueOf  取格子值；返回 null 表示该格无样本（画图时应断点）
 * @param weightOf 取权重（挑前 N 名用）
 */
export function pivotDateModel(
  rows: ModelTrendRow[],
  valueOf: (r: ModelTrendRow) => number | null,
  weightOf: (r: ModelTrendRow) => number,
): PivotResult {
  const cells = new Map<string, Map<string, number | null>>();
  const weight = new Map<string, number>();
  for (const r of rows) {
    const date = String(r.date || "").slice(0, 10);
    if (!date) continue;
    const model = String(r.model || "").trim() || "未知模型";
    weight.set(model, (weight.get(model) || 0) + (Number(weightOf(r)) || 0));
    const v = valueOf(r);
    if (v == null) continue;
    let day = cells.get(date);
    if (!day) { day = new Map(); cells.set(date, day); }
    day.set(model, v);
  }
  return { dates: [...cells.keys()].sort(), cells, weight };
}

/** 按权重取前 N 个模型名 */
function topModels(weight: Map<string, number>, n: number): string[] {
  return [...weight.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([m]) => m);
}

export interface ChartContext {
  fmt: UsageFormat;
  surfaceBg: () => string;
  colorOfModel: (model: string) => string;
}

/** Token 趋势：输入 / 输出 / 缓存读取（缓存是输入的子集，画虚线不堆叠） */
export function buildTrendOption(rows: TrendRow[], fmt: UsageFormat): EChartsOption {
  return {
    tooltip: {
      trigger: "axis",
      confine: true,
      axisPointer: { type: "line", lineStyle: { type: "dashed" } },
      valueFormatter: (v: any) => fmt.fmtToken(v),
    },
    legend: { data: ["输入 Token", "输出 Token", "缓存读取"], top: 0 },
    grid: { left: 56, right: 44, top: 40, bottom: 32 },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: rows.map((r) => (r.date.length > 10 ? r.date.slice(11, 16) : r.date)),
    },
    yAxis: { type: "value", axisLabel: { formatter: (v: number) => fmt.fmtToken(v) } },
    series: [
      {
        name: "输入 Token", type: "line", smooth: true, showSymbol: false,
        data: rows.map((r) => r.input), areaStyle: { opacity: 0.12 },
      },
      {
        name: "输出 Token", type: "line", smooth: true, showSymbol: false,
        data: rows.map((r) => r.output), areaStyle: { opacity: 0.12 },
      },
      {
        name: "缓存读取", type: "line", smooth: true, showSymbol: false,
        data: rows.map((r) => r.cached),
        lineStyle: { type: "dashed", width: 2 },
        areaStyle: { opacity: 0.06 },
      },
    ],
  };
}

/** 每日模型用量：堆叠柱，Top N 之外并成「其他」 */
export function buildModelBarOption(
  rows: ModelTrendRow[],
  metric: ChartType,
  ctx: ChartContext,
): EChartsOption {
  const { fmt } = ctx;
  const valueOf = (r: ModelTrendRow) =>
    (metric === "token" ? Number(r.totalTokens) || 0 : Number(r.totalCost) || 0);
  // 用量为 0 的格子不参与透视（否则会撑出一整天空列）
  const pivot = pivotDateModel(rows, (r) => valueOf(r), valueOf);
  const { dates, cells, weight } = pivot;

  const keep = topModels(weight, MODEL_BAR_TOP_N);
  const keepSet = new Set(keep);
  const series = keep.map((model) => ({
    model,
    data: dates.map((d) => cells.get(d)?.get(model) || 0),
  }));
  if (weight.size > MODEL_BAR_TOP_N) {
    series.push({
      model: "其他",
      data: dates.map((d) => {
        let sum = 0;
        for (const [m, v] of cells.get(d) || []) if (!keepSet.has(m)) sum += Number(v) || 0;
        return sum;
      }),
    });
  }

  return {
    tooltip: {
      trigger: "axis",
      confine: true,
      axisPointer: { type: "shadow", shadowStyle: { color: "rgba(0,0,0,0.04)" } },
      valueFormatter: (v: any) => (metric === "token" ? fmt.fmtToken(v) : `${fmt.currencySymbol.value}${fmt.money(v)}`),
    },
    legend: { type: "scroll", top: 0, icon: "circle" },
    grid: { left: 60, right: 44, top: 40, bottom: 40, containLabel: false },
    xAxis: {
      type: "category",
      data: dates,
      axisLabel: {
        hideOverlap: true,
        formatter: (v: string) => (dates.length > 14 ? String(v).slice(5) : v),
      },
      axisTick: { alignWithLabel: true },
    },
    yAxis: {
      type: "value",
      name: metric === "token" ? "Token" : `费用(${fmt.currencySymbol.value})`,
      nameTextStyle: { fontSize: 11, color: "var(--el-text-color-secondary)" },
      axisLabel: { formatter: (v: number) => (metric === "token" ? fmt.fmtToken(v) : fmt.money(v)) },
      splitLine: { lineStyle: { type: "dashed" } },
    },
    series: series.map((s) => ({
      name: s.model,
      type: "bar",
      stack: "usage",
      barMaxWidth: 34,
      itemStyle: {
        color: ctx.colorOfModel(s.model),
        borderColor: ctx.surfaceBg(),
        borderWidth: 1,
      },
      emphasis: { focus: "series" },
      data: s.data,
    })),
  };
}

/** 延迟矩阵（导出给「有没有数据」的判断用） */
export function buildLatencyMatrix(rows: ModelTrendRow[]) {
  const pivot = pivotDateModel(
    rows,
    (r) => {
      const v = r.avgFirstTokenLatency;
      return v == null || !Number.isFinite(v) || v <= 0 ? null : Math.round(v);
    },
    (r) => Number(r.totalTokens) || 0,
  );
  const keep = topModels(pivot.weight, MODEL_LATENCY_TOP_N);
  return {
    dates: pivot.dates,
    series: keep.map((model) => ({
      model,
      data: pivot.dates.map((d) => pivot.cells.get(d)?.get(model) ?? null),
    })),
  };
}

/**
 * 模型延迟图：一天一个点、一个模型一条线，纵轴为「平均首字延迟（ms）」。
 *
 * <p>为什么画首字延迟而不是总耗时：总耗时随输出长度线性增长，同一个模型写得长一点
 * 就会显得「更慢」，跨模型比较没有意义；首字延迟衡量的是「多久开始响应」，
 * 与生成长度无关，才是用户真正感知到的那个「卡不卡」。</p>
 *
 * <p>缺测的格子返回 null 而不是 0：ECharts 遇 null 会断线，正好表达「这天没测到」。</p>
 */
export function buildLatencyOption(
  matrix: ReturnType<typeof buildLatencyMatrix>,
  ctx: ChartContext,
): EChartsOption {
  const { dates, series } = matrix;
  return {
    tooltip: {
      trigger: "axis",
      confine: true,
      valueFormatter: (v: any) => (v == null ? "—" : ctx.fmt.formatLatency(v)),
    },
    legend: { top: 0, type: "scroll" },
    grid: { left: 56, right: 44, top: 40, bottom: 32 },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: dates.map((d) => (d.length > 10 ? d.slice(11, 16) : d)),
    },
    yAxis: { type: "value", name: "ms", axisLabel: { formatter: (v: number) => `${v}` } },
    series: series.map((s) => ({
      name: s.model,
      type: "line",
      smooth: true,
      showSymbol: true,
      symbolSize: 5,
      connectNulls: false,
      data: s.data,
      color: ctx.colorOfModel(s.model),
    })),
  };
}

/** 便于组合式函数按需取用的三个 option 工厂 */
export function useUsageCharts(
  modelTrendRows: () => ModelTrendRow[],
  modelBarMetric: () => ChartType,
  trendRows: () => TrendRow[],
  ctx: ChartContext,
) {
  const modelBarMatrix = computed(() => {
    const valueOf = (r: ModelTrendRow) =>
      (modelBarMetric() === "token" ? Number(r.totalTokens) || 0 : Number(r.totalCost) || 0);
    const p = pivotDateModel(modelTrendRows(), valueOf, valueOf);
    return { dates: p.dates, cells: p.cells, weight: p.weight };
  });

  const modelBarOption = computed(() => buildModelBarOption(modelTrendRows(), modelBarMetric(), ctx));
  const modelBarDates = computed(() => modelBarMatrix.value.dates);
  const trendOption = computed(() => buildTrendOption(trendRows(), ctx.fmt));
  const latencyMatrix = computed(() => buildLatencyMatrix(modelTrendRows()));
  const latencyDates = computed(() => latencyMatrix.value.dates);
  /** 有延迟样本的模型数（用来区分「没数据」与「有数据但都没测到延迟」） */
  const latencyModelCount = computed(() => latencyMatrix.value.series.length);
  const latencyOption = computed(() => buildLatencyOption(latencyMatrix.value, ctx));

  return {
    modelBarDates,
    modelBarOption,
    trendOption,
    latencyDates,
    latencyModelCount,
    latencyOption,
  };
}
