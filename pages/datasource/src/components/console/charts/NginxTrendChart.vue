<template>
  <div ref="el" class="ngx-echart" :style="{ height: `${height}px` }" />
</template>

<script setup lang="ts">
/**
 * Nginx 指标趋势折线图（ECharts）。
 *
 * <p><strong>为什么用 `time` 轴而不是 `category` 轴</strong>：采集会缺点（SSH 抖动、
 * 被管主机重启），按序号排的类目轴会把时间轴拉歪——两点挨得近却可能隔了十分钟。
 * 时间轴按真实时刻定位，缺点就真的是缺点。</p>
 *
 * <p><strong>为什么交给 ECharts 降采样</strong>：30s 采集 × 24h = 2880 点/指标，
 * 24h 满窗时单序列近 3000 点。这里用 `sampling: 'lttb'`，它在渲染层按像素宽度抽点，
 * 既保住尖峰形状又不丢趋势；换成前端固定步长抽会真切掉毛刺。</p>
 *
 * <p><strong>断点不连线</strong>：worker 重启后累计计数归零，后端把该点的 `rate` 置 null。
 * `connectNulls: false` 让它断开而不是拉一条假的垂直线——否则「重启」会被读成「流量暴跌」。</p>
 *
 * <p><strong>为什么左右两块而不是同一个坐标系</strong>：左边的 24 小时趋势来自采集器落库，
 * 固定 24 小时窗口；右边的 URL 趋势直接扫 access log 尾部，时间跨度由日志密度决定——
 * 高流量时「最近 5000 行」可能只覆盖几分钟。两者时间尺度能差两个数量级，
 * 共用一个 x 轴的话 URL 曲线会挤在左边缘 1% 的宽度里，完全读不出来。
 * 所以用两个 grid 各自独立的时间轴，画在同一张画布上，tooltip 用 axisPointer 联动。</p>
 *
 * @author CH
 * @since 4.0.0
 */
import { computed, ref, watch } from "vue";
import type { EChartsOption } from "echarts";
import { token, useEchart, URL_TREND_COLORS, type TrendSeriesInput, type UrlTrendSeriesInput } from "./useEchart";

const props = withDefaults(
  defineProps<{
    /** 左侧：采集指标序列 */
    series: TrendSeriesInput[];
    /** 右侧：URL 访问序列；为空则只画左半边 */
    urlSeries?: UrlTrendSeriesInput[];
    /** 右侧序列的标题（画在分区上方） */
    urlTitle?: string;
    /** 画布高度（px） */
    height?: number;
  }>(),
  { urlSeries: () => [], urlTitle: "URL 访问趋势", height: 180 },
);

/** 有数据的序列；空序列会让 ECharts 画出空坐标系，看着像「图坏了」 */
const liveSeries = computed(() => props.series.filter(s => s.data.length > 0));
/** 只有真的有 URL 数据才启用右半边，否则左侧占满宽度 */
const hasUrl = computed(() => props.urlSeries.some(s => s.data.length > 0));

const el = ref<HTMLElement | null>(null);

const elRef = computed(() => el.value);

const build = (): EChartsOption => {
  const axisColor = token("--el-text-color-secondary");
  const splitColor = token("--el-border-color-lighter");
  const tipBg = token("--el-bg-color-overlay") || token("--el-bg-color");

  const urlLive = hasUrl.value ? props.urlSeries.filter(s => s.data.length > 0) : [];

  // 上下留白要放得下分区标题。原来 top 只有 16px，而标题默认画在 y=0 的
  // 高度里，于是右半边的标题和它 y 轴的 name（「次」）正好叠在同一行上。
  const GRID_TOP = 30;
  const grids: EChartsOption["grid"] = urlLive.length
    ? [
        { left: "2%", right: "46%", top: GRID_TOP, bottom: 24, containLabel: true },
        { left: "58%", right: "2%", top: GRID_TOP, bottom: 24, containLabel: true },
      ]
    : [{ left: "2%", right: "2%", top: GRID_TOP, bottom: 24, containLabel: true }];

  const timeAxis = (extra: Record<string, unknown> = {}) => ({
    type: "time" as const,
    axisLine: { lineStyle: { color: splitColor } },
    axisTick: { show: false },
    axisLabel: {
      color: axisColor,
      fontSize: 11,
      hideOverlap: true,
      formatter: (v: number) => new Date(v).toLocaleTimeString("zh-CN", { hour12: false }),
    },
    splitLine: { show: false },
    ...extra,
  });

  const valueAxis = (extra: Record<string, unknown> = {}) => ({
    type: "value" as const,
    // 速率是「每秒增量」，起点必须是 0：负数只会来自重启，已被后端置 null
    min: 0,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: axisColor, fontSize: 11 },
    splitLine: { lineStyle: { color: splitColor, type: "dashed" as const } },
    ...extra,
  });

  const areaFill = (c: string) => ({
    opacity: 0.14,
    color: {
      type: "linear" as const,
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [
        { offset: 0, color: c },
        { offset: 1, color: "transparent" },
      ],
    },
  });

  return {
    title: urlLive.length
      ? [
          {
            text: "24 小时采集指标",
            left: "2%",
            top: 2,
            textStyle: { color: axisColor, fontSize: 11, fontWeight: "normal" as const },
          },
          {
            text: props.urlTitle,
            left: "58%",
            top: 2,
            textStyle: { color: axisColor, fontSize: 11, fontWeight: "normal" as const },
          },
        ]
      : undefined,
    grid: grids,
    // 两块各自的坐标轴要声明 gridIndex，否则都落在第一个 grid 上叠在一起
    xAxis: urlLive.length ? [timeAxis(), timeAxis({ gridIndex: 1 })] : [timeAxis()],
    yAxis: urlLive.length
      ? [
          valueAxis(),
          // 单位放到轴的右上角外侧（nameGap），不占网格内的顶部空间，
          // 否则会和分区标题在同一行上叠字
          valueAxis({ gridIndex: 1, name: "次", nameLocation: "end" as const, nameGap: 8, nameTextStyle: { color: axisColor, fontSize: 10, align: "right" as const } }),
        ]
      : [valueAxis()],
    tooltip: {
      trigger: "axis",
      backgroundColor: tipBg,
      borderColor: splitColor,
      textStyle: { color: token("--text-primary") || token("--el-text-color-primary"), fontSize: 12 },
      // link 让十字线跨两块联动，方便对照「同一时刻的指标与 URL 命中」
      axisPointer: { type: "line", link: [{ xAxisIndex: "all" }], lineStyle: { color: axisColor, opacity: 0.4 } },
      formatter: (params: unknown) => {
        const arr = params as Array<{ axisValue: number; seriesName: string; value: [number, number | null] }>;
        if (!arr?.length) {
          return "";
        }
        const time = new Date(Number(arr[0].axisValue)).toLocaleString("zh-CN", { hour12: false });
        const rows = arr
          .filter(p => Array.isArray(p.value) && p.value[1] != null)
          .map(p => `${p.seriesName}: <b>${Number(p.value[1]).toFixed(2)}</b>`);
        return rows.length ? `${time}<br/>${rows.join("<br/>")}` : "";
      },
    },
    legend: { show: false },
    series: [
      ...liveSeries.value.map(s => {
        const c = token(s.color);
        return {
          name: s.label,
          type: "line" as const,
          data: s.data,
          xAxisIndex: 0,
          yAxisIndex: 0,
          showSymbol: false,
          symbol: "circle",
          symbolSize: 5,
          sampling: "lttb" as const,
          // 断点必须断开，否则重启会被画成一条垂直下坠
          connectNulls: false,
          smooth: 0.2,
          lineStyle: { width: 2, color: c },
          itemStyle: { color: c },
          emphasis: { focus: "series" as const },
          areaStyle: areaFill(c),
        };
      }),
      ...urlLive.map((s, i) => {
        // URL_TREND_COLORS 里是 CSS 变量名，必须经 token() 解析成实际颜色，
        // 直接塞给 lineStyle 会让 ECharts 认不出（画出来是默认色/透明）
        const c = token(URL_TREND_COLORS[i % URL_TREND_COLORS.length]);
        return {
          name: s.path,
          type: "line" as const,
          data: s.data,
          xAxisIndex: urlLive.length ? 1 : 0,
          yAxisIndex: urlLive.length ? 1 : 0,
          showSymbol: false,
          symbol: "circle",
          symbolSize: 4,
          connectNulls: false,
          smooth: 0.2,
          lineStyle: { width: 1.8, color: c },
          itemStyle: { color: c },
          emphasis: { focus: "series" as const },
          areaStyle: { opacity: 0.08, color: c },
        };
      }),
    ],
  };
};

const { render } = useEchart(elRef, build);

// props 变化（手动刷新、SSE 追加新点、图例开关、URL 趋势重算）后重绘
watch(() => [props.series, props.urlSeries, props.height], render, { deep: true });
</script>

<style scoped lang="scss">
.ngx-echart {
  width: 100%;

  /* 画布自身不带尺寸语义，给个最小高度避免容器塌成 0 时 init 拿到 0 宽高 */
  min-height: 80px;
}
</style>
