/**
 * 用量看板 · 环形总览 + 图例 + 明细
 *
 * <p>「模型用量分析」「分组用量分析」两个看板结构完全一致，只是数据源不同。
 * 所以这里做成**一份**状态工厂：调用方传进一个分布数据的 getter，拿回一份
 * 独立的（口径 / 悬停 / 环图 option / 表格列）状态，两份互不干扰。</p>
 */

import { ref, computed } from "vue";
import type { EChartsOption } from "echarts";
import type { ReTableColumn } from "@repo/ui/re-table";
import type { BoardData, BoardItem, ChartType, DistRow, HoverSlice } from "./types";
import { metricOf, barWidth } from "./distribution";
import type { UsageFormat } from "./format";

/**
 * 看板调色板。
 *
 * <p>为什么不用 `--el-color-primary` 这类 CSS 变量：ECharts 是 canvas 渲染，
 * `var()` 在 canvas 语境里不生效，必须给真实色值。这里集中一处，
 * 图例色点、明细表进度条、环形扇区取同一个函数 —— 三处颜色永远一致。</p>
 */
export const BOARD_PALETTE = [
  "#165DFF", // 主色蓝
  "#00B42A", // 成功绿
  "#FF7D00", // 警示橙
  "#722ED1", // 辅助紫
  "#F53F3F", // 危险红
  "#14C9C9", // 青
  "#F7BA1E", // 黄
  "#3491FA", // 浅蓝
  "#9FDB1D", // 黄绿
  "#D91AD9", // 品红
];

/** 第 n 项的稳定配色：按**排序后的名次**取色，不按数组下标，切指标时不跳色 */
export function boardColorByIndex(i: number): string {
  return BOARD_PALETTE[i % BOARD_PALETTE.length];
}

/** 环形图最多画几个扇区（其余聚合成「其他」） */
export const RING_TOP_N = 8;
/** 「其他」扇区的固定色（中性灰，不占调色板名次） */
export const OTHER_SLICE_COLOR = "#C9CDD4";

/**
 * 把分布数据整理成看板要的形状：按当前指标降序、算占比、分配稳定颜色。
 */
export function buildBoard(rows: DistRow[], type: ChartType): BoardData {
  const sorted = [...rows].sort((a, b) => metricOf(b, type) - metricOf(a, type));
  const total = sorted.reduce((s, r) => s + Math.max(0, metricOf(r, type)), 0);
  const items: BoardItem[] = sorted.map((r, i) => {
    const value = metricOf(r, type);
    return {
      name: r.name,
      value,
      pct: total > 0 ? (Math.max(0, value) / total) * 100 : 0,
      color: boardColorByIndex(i),
      row: r,
    };
  });
  const slices = items.slice(0, RING_TOP_N);
  const rest = items.slice(RING_TOP_N);
  if (rest.length) {
    slices.push({
      name: `其他 ${rest.length} 项`,
      value: rest.reduce((s, it) => s + it.value, 0),
      pct: rest.reduce((s, it) => s + it.pct, 0),
      color: OTHER_SLICE_COLOR,
      row: rest[0].row,
    });
  }
  return { items, slices, total };
}

/** 环心显示内容：有 hover 用 hover 的，否则用 Top1；空数据给占位符 */
export function ringTop(board: BoardData, hover: HoverSlice | null): { pct: string; name: string } {
  if (hover) return { pct: hover.pct.toFixed(1) + "%", name: hover.name };
  if (!board.items.length) return { pct: "—", name: "暂无数据" };
  const top = board.items[0];
  return { pct: top.pct.toFixed(1) + "%", name: top.name };
}

/** 名次 → 颜色（明细表用；找不到按末档兜底，避免 undefined 让背景变透明） */
export function boardColorOf(b: BoardData, name: string): string {
  const idx = b.items.findIndex((it) => it.name === name);
  return idx >= 0 ? b.items[idx].color : BOARD_PALETTE[BOARD_PALETTE.length - 1];
}

export interface BoardContext {
  /** 域所读取的唯一格式化来源（货币符号 / Token 单位会变，故按引用传） */
  fmt: UsageFormat;
  /** 卡片底色：扇区之间的间隙用它，深色模式下才不会露出一圈白边 */
  surfaceBg: () => string;
}

/** 一份看板状态（模型 / 分组各持一份，互不干扰） */
export function useBoardState(rows: () => DistRow[], ctx: BoardContext, nameLabel: string) {
  const chartType = ref<ChartType>("token");
  const hover = ref<HoverSlice | null>(null);

  const board = computed(() => buildBoard(rows(), chartType.value));

  function onRingHover(params: any) {
    if (!params || params.componentType !== "series" || params.name == null) {
      hover.value = null;
      return;
    }
    const pct = Number(params.percent);
    hover.value = { name: String(params.name), pct: Number.isFinite(pct) ? pct : 0 };
  }

  function onLegendHover(item: BoardItem | null) {
    hover.value = item ? { name: item.name, pct: item.pct } : null;
  }

  /**
   * 看板环形图。
   *
   * <p>三点与旧饼图不同：</p>
   * <ol>
   *   <li><b>不要图例</b>：图例改由右侧 DOM 列表承担。</li>
   *   <li><b>中心留空</b>：留给 DOM 覆盖层显示 Top1 占比。</li>
   *   <li><b>只画 {@link RING_TOP_N} 项</b>：其余并成「其他」，右侧图例渲染同一份 slices。</li>
   * </ol>
   */
  const ringOption = computed<EChartsOption>(() => {
    const b = board.value;
    const type = chartType.value;
    const { fmt } = ctx;
    const data = b.slices.map((it) => ({
      name: it.name,
      value: Number(it.value.toFixed(4)),
      itemStyle: { color: it.color },
    }));
    return {
      tooltip: {
        trigger: "item",
        confine: true,
        backgroundColor: "rgba(255,255,255,0.98)",
        borderColor: "#E5E6EB",
        borderWidth: 1,
        textStyle: { color: "#1D2129", fontSize: 12 },
        extraCssText: "box-shadow:0 6px 20px rgba(15,23,42,.12);border-radius:8px;padding:8px 10px;",
        formatter: (p: any) => {
          const v = type === "token" ? fmt.fmtToken(p.value) : `${fmt.currencySymbol.value}${fmt.money(p.value)}`;
          return `${p.marker}${p.name}<br/><b style="font-size:13px">${v}</b>&nbsp;&nbsp;<span style="color:#86909C">${Number(p.percent).toFixed(1)}%</span>`;
        },
      },
      legend: { show: false },
      series: [
        {
          type: "pie",
          radius: ["62%", "86%"],
          center: ["50%", "50%"],
          avoidLabelOverlap: false,
          // 扇区间隙用页面卡片色（不写死白色，深色模式下才不会露出一圈白边）
          itemStyle: { borderColor: ctx.surfaceBg(), borderWidth: 2, borderRadius: 4 },
          label: { show: false },
          labelLine: { show: false },
          emphasis: {
            scaleSize: 6,
            itemStyle: { shadowBlur: 14, shadowColor: "rgba(22,93,255,0.22)" },
          },
          data,
        },
      ],
    };
  });

  /** 看板明细表的列定义（比原分布表更紧凑；占比列由插槽画进度条） */
  const columns = computed<ReTableColumn[]>(() => [
    { prop: "name", label: nameLabel, minWidth: 120, showOverflowTooltip: true, slot: "name" },
    { prop: "requests", label: "请求", width: 76, align: "right", slot: "requests", sortable: true },
    { prop: "totalTokens", label: "Token", width: 92, align: "right", slot: "totalTokens", sortable: true },
    { prop: "cost", label: `费用(${ctx.fmt.currencySymbol.value})`, width: 92, align: "right", slot: "cost", sortable: true },
    { prop: "percent", label: "占比", width: 132, slot: "percent" },
  ]);

  /** 明细表里某一行的占比条宽 / 文案（都按当前口径） */
  function pctWidthOf(row: DistRow): string {
    const total = board.value.total;
    if (total <= 0) return "0%";
    return barWidth((metricOf(row, chartType.value) / total) * 100);
  }

  function pctTextOf(row: DistRow): string {
    const total = board.value.total;
    if (total <= 0) return "0.0%";
    return ((metricOf(row, chartType.value) / total) * 100).toFixed(1) + "%";
  }

  return {
    chartType,
    hover,
    board,
    ringOption,
    columns,
    onRingHover,
    onLegendHover,
    pctWidthOf,
    pctTextOf,
  };
}


/** 主卡右下角的迷你环形图：输入 / 输出占比 */
export function buildMiniRingOption(
  totalPromptTokens: number,
  totalCompletionTokens: number,
  fmt: UsageFormat,
  surfaceBg: string,
): EChartsOption {
  const input = Math.max(0, Number(totalPromptTokens) || 0);
  const output = Math.max(0, Number(totalCompletionTokens) || 0);
  const rest = Math.max(0, input + output);
  const data = rest > 0
    ? [
      { name: "输入", value: input, itemStyle: { color: "#165DFF" } },
      { name: "输出", value: output, itemStyle: { color: "#00B42A" } },
    ]
    : [{ name: "暂无", value: 1, itemStyle: { color: "#E5E6EB" } }];
  return {
    tooltip: {
      trigger: "item",
      confine: true,
      formatter: (p: any) => `${p.marker}${p.name} ${fmt.fmtToken(p.value)}（${Number(p.percent).toFixed(1)}%）`,
    },
    legend: { show: false },
    series: [
      {
        type: "pie",
        radius: ["66%", "92%"],
        center: ["50%", "50%"],
        silent: true,
        itemStyle: { borderColor: surfaceBg, borderWidth: 1.5 },
        label: { show: false },
        labelLine: { show: false },
        data,
      },
    ],
  };
}
