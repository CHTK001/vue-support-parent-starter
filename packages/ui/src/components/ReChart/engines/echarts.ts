/**
 * echarts 引擎 —— 把 ReChart 的通用描述（type + option + 简版数据）转成 EChartsOption。
 *
 * 设计目标：
 *  1. 完整 option 直通：调用方传了 `option` 就按它来（浅合并默认配置，可完整覆盖）；
 *  2. 默认配置兜底：常用类型（line/bar/pie/radar/funnel…）不填坐标轴/图例/tooltip
 *     也能直接出图，省掉每次重复的 min/max/grid 那一堆配置；
 *  3. 简版数据直出：`categories` + `series` 即可画折线/柱状/面积/散点/饼/漏斗/雷达。
 *
 * 主题色不再在这里注入 —— ReEcharts 渲染时已用 CSS 变量注入 element 主色板，
 * 这里只负责「业务结构」，避免两处都改色导致打架。
 */
import type { EChartsOption } from "echarts";
import type { ReChartType, ReChartSankeyData } from "../types";

/** 简版 x-y 数据（折线 / 柱状 / 面积 / 散点） */
export interface ChartSimpleData {
  /** 类目轴数据（x 轴或雷达的指标名） */
  categories?: string[];
  /** 值轴数据 */
  values?: number[] | number[][];
  /** 系列列表（未传则用 { values } 兜成一个系列） */
  series?: ChartSimpleSeries;
  /** 系列名（未传 series 时给兜底系列取名） */
  name?: string;
}

/** 单个系列：数值 / 名称 / 显式类型 / 自定义颜色（可扩展余下字段透传） */
export interface ChartSimpleSeriesItem {
  name?: string;
  data: number[] | number[][];
  type?: string;
  color?: string;
  itemStyle?: Record<string, unknown>;
  areaStyle?: Record<string, unknown> | boolean;
  [k: string]: unknown;
}
export type ChartSimpleSeries = ChartSimpleSeriesItem[];

const DEFAULT_GRID = { left: 12, right: 16, top: 28, bottom: 8, containLabel: true } as const;

const DEFAULT_SPLIT_LINE = { lineStyle: { type: [4, 4] as [number, number], opacity: 0.3 } } as const;

/** line / bar / area / scatter 共享的直角坐标系默认 option（可被 option 覆盖）。
 *  文字/坐标颜色不在此设 —— 由 ReEcharts 全局注入 textStyle + color 主题板。 */
function cartesianBase(option: EChartsOption): EChartsOption {
  return {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: { top: 0, right: 0, itemWidth: 12, itemHeight: 8 },
    grid: DEFAULT_GRID,
    xAxis: { type: "category", boundaryGap: true, splitLine: { show: false }, axisTick: { show: false } },
    yAxis: { type: "value", splitLine: DEFAULT_SPLIT_LINE },
    ...option,
  };
}

/** 从 series 推断每个系列的 type（未显式 type 时用面板类型；散点/面积有各自缺省） */
function resolveSeriesType(type: ReChartType, item: ChartSimpleSeriesItem): string {
  if (item.type) return item.type;
  if (type === "area") return "line";
  if (type === "donut") return "pie";
  return type;
}

/** 给某个 series 渲染「面积/渐变」增强（area 类型专用） */
function withAreaFill(series: ChartSimpleSeriesItem[], from: "top" | "center" = "center"): void {
  for (const s of series) {
    s.areaStyle = s.areaStyle === undefined
      ? {
          opacity: 0.18,
          shadowBlur: 4,
          shadowColor: "rgba(0,0,0,0.06)",
          ...(from === "center" ? { origin: "start" } : {}),
        }
      : s.areaStyle;
  }
}

/**
 * 由通用描述生成 echarts option。
 *
 * @param type 面板类型
 * @param source
 *   - `option`：调用方完整 option（最优先，与类型默认做浅合并后使用）；
 *   - `sankey`：桑基数据（nodes + links）；
 *   - `simple`：简版数据（categories / values / series）。
 */
export function buildEchartsOption(
  type: ReChartType,
  source: { option?: EChartsOption; sankey?: ReChartSankeyData; simple?: ChartSimpleData },
): EChartsOption {
  const { option, sankey, simple } = source;

  // 1) 桑基：sankey 数据 → 自动 option
  if (type === "sankey" && sankey && !option) {
    return {
      tooltip: { trigger: "item", triggerOn: "mousemove" },
      series: [
        {
          type: "sankey",
          data: sankey.nodes.map((n) => ({ name: n.name })),
          links: sankey.links,
          emphasis: { focus: "adjacency" },
          lineStyle: { color: "gradient", curveness: 0.5 },
        },
      ],
    } as EChartsOption;
  }

  // 简版数据缺省时，series 默认为空数组
  const series = simple?.series ?? (simple?.values ? [{ name: simple.name, data: simple.values } as ChartSimpleSeriesItem] : []);

  // 2) 完整 option：最高优先 —— 与「该类型的默认骨架」浅合并，允许调用方整段覆盖
  if (option) {
    const merged = {
      tooltip: { show: true },
      ...(type === "line" || type === "bar" || type === "area" || type === "scatter"
        ? cartesianBase({})
        : {}),
      ...option,
    };
    return merged as EChartsOption;
  }

  // 3) 系列型图表（折线/面积/柱/散点/饼/环形/漏斗）
  switch (type) {
    case "line":
    case "bar":
    case "area": {
      if (type === "area") withAreaFill(series);
      const base = cartesianBase({});
      // 合并 series 与用户显式配置（坐标轴这些都走默认）
      (base as Record<string, unknown>).series = series.map((s) => ({
        type: resolveSeriesType(type, s),
        smooth: type === "line" || type === "area",
        barMaxWidth: 28,
        ...s,
      }));
      return base as EChartsOption;
    }
    case "scatter": {
      return {
        tooltip: { trigger: "item" },
        legend: { top: 0, right: 0 },
        grid: DEFAULT_GRID,
        xAxis: { type: "value", splitLine: DEFAULT_SPLIT_LINE },
        yAxis: { type: "value", splitLine: DEFAULT_SPLIT_LINE },
        series: series.map((s) => ({ type: "scatter", symbolSize: 10, ...s })),
      } as EChartsOption;
    }
    case "pie":
    case "donut": {
      return {
        tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
        legend: { bottom: 0, left: "center" },
        series: [
          {
            type: "pie",
            radius: type === "donut" ? ["42%", "68%"] : ["0%", "68%"],
            center: ["50%", "44%"],
            avoidLabelOverlap: true,
            itemStyle: { borderRadius: 4, borderWidth: 1 },
            label: { show: true },
            emphasis: { label: { show: true, fontWeight: 600 } },
            ...series[0],
            data: series[0]?.data ?? (simple?.values as number[])?.map((v, i) => ({
              name: (simple?.categories ?? [])[i] ?? `项${i + 1}`,
              value: v,
            })) ?? [],
          },
        ],
      } as EChartsOption;
    }
    case "funnel": {
      return {
        tooltip: { trigger: "item" },
        legend: { bottom: 0, left: "center" },
        series: [
          {
            type: "funnel",
            left: "12%",
            width: "70%",
            min: 0,
            max: "dataMax",
            gap: 2,
            sort: "descending",
            label: { show: true, position: "inside" },
            itemStyle: { borderWidth: 1 },
            ...series[0],
            data: series[0]?.data ?? (simple?.values as number[])?.map((v, i) => ({
              name: (simple?.categories ?? [])[i] ?? `项${i + 1}`,
              value: v,
            })) ?? [],
          },
        ],
      } as EChartsOption;
    }
    case "radar": {
      return {
        tooltip: { trigger: "item" },
        legend: { bottom: 0, left: "center" },
        radar: {
          indicator: (simple?.categories ?? []).map((name) => ({ name, max: 100 })),
          splitArea: { areaStyle: { opacity: 0.05 } },
        },
        series: series.map((s) => ({ type: "radar", ...s, symbolSize: 4 })),
      } as EChartsOption;
    }
    default:
      break;
  }

  // 4) 未知类型且没传完整 option：给一个可渲染的空壳
  return {} as EChartsOption;
}