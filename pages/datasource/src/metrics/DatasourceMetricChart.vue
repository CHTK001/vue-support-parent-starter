<template>
  <div ref="el" class="ds-metric-echart" :style="{ height: `${height}px` }" />
</template>

<script setup lang="ts">
/**
 * 数据源监控指标图（ECharts）。
 *
 * <p><strong>为什么上下两块坐标系而不是一个</strong>：延迟是毫秒（几十~几千），
 * 连通与否是 0/1。放进同一个 y 轴，连通性会被压成贴着底轴的一条直线，
 * 「中间那次失败」根本看不出来；共用一套刻度又会让延迟读数失真。
 * 上下分开，各自一条轴，是这两类量唯一诚实的画法。</p>
 *
 * <p><strong>连通性用状态条而不是折线</strong>：连通与否不是连续量，
 * 折线会在失败与成功之间斜插一段「正在连接」，而这是不存在的状态。
 * 状态条每个采样点是一格，高=连通、低=不通、缺格=未判定。</p>
 *
 * <p><strong>连接数走右轴虚线</strong>：延迟（毫秒）与连接数（个）量纲不同，
 * 共轴会把其中一方压平；虚线弱化是它是背景量，不与延迟曲线抢视觉权重。
 * 取不到连接数的类型画成缺格（null 断线），不补 0 —— 0 会被读成
 * 「没有客户端在连」，与事实相反。</p>
 *
 * <p><strong>断点不连线</strong>：失败与未判定都给 `null`，
 * {@code connectNulls: false} 让延迟曲线在那一刻断开 ——
 * 「没测出来」画成一条穿过空洞的斜线，等于凭空捏造了一段延迟数据。</p>
 *
 * @author CH
 * @since 4.0.0.43
 */
import { computed, ref, watch } from "vue";
import type { EChartsOption } from "echarts";
import { token, useEchart } from "../components/console/charts/useEchart";
import type { DatasourceMetricPoint } from "../api";

/** 延迟曲线用的数据对 */
type Pair = [number, number | null];

/** 失败点：时间戳 → 失败原因（供 tooltip 显示，不进曲线） */
type Failure = [number, string];

const props = withDefaults(
  defineProps<{
    /** 采样点（已按时间升序） */
    points: DatasourceMetricPoint[];
    /** 画布高度（px） */
    height?: number;
  }>(),
  { height: 220 },
);

const el = ref<HTMLElement | null>(null);

const elRef = computed(() => el.value);

/** ISO 字符串 → 毫秒时间戳；解析不了就返回 null，让该点变成断点而不是 NaN */
function toTs(time: string | null): number | null {
  if (!time) {
    return null;
  }
  const v = Date.parse(time);
  return Number.isNaN(v) ? null : v;
}

const build = (): EChartsOption => {
  const axisColor = token("--text-secondary");
  const splitColor = token("--border-subtle");
  const tipBg = token("--bg-elevated") || token("--bg-container");
  const okColor = token("--status-success");
  const badColor = token("--status-error");

  // 三个序列各自过滤：时间解析不了的点直接剔除（而不是画成 NaN 断点，
  // 那会让整条线在图上凭空少一截却看不出原因）
  const connect: Pair[] = [];
  const session: Pair[] = [];
  const health: Pair[] = [];
  const connections: Pair[] = [];
  const failures: Failure[] = [];
  for (const p of props.points) {
    const ts = toTs(p.time);
    if (ts === null) {
      continue;
    }
    connect.push([ts, p.connectLatencyMs ?? null]);
    session.push([ts, p.sessionLatencyMs ?? null]);
    // 连通性：成功 1 / 失败 0 / 未判定 null（缺格）
    health.push([ts, p.success === null ? null : p.success ? 1 : 0]);
    // 连接数：null 缺格 —— 该类型（或设置了密码的 redis）拿不到就不画，
    // 比补 0 诚实：0 会被读成「没有客户端在连」
    connections.push([ts, p.connectionCount ?? null]);
    if (p.success === false) {
      failures.push([ts, p.errorMessage || "连接失败"]);
    }
  }

  const LATENCY_H = 62;

  // 显式标注成 EChartsOption["series"]：不标的话数组元素会被推成各自的字面量
  // 联合类型（line 的 showSymbol 与 bar 的 barWidth 互不相容），
  // 结果是整个数组赋不进 series 字段 —— 报的是「数组」不兼容而不是某一项，
  // 定位起来很绕。
  const series: NonNullable<EChartsOption["series"]> = [
    {
      name: "建连延迟",
      type: "line",
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: connect,
      showSymbol: false,
      // 采样间隔 60s，满窗也就几百点，lttb 的保峰价值不大，
      // 但开着不花钱，且窗口拉长时它能挡住浏览器卡顿
      sampling: "lttb",
      connectNulls: false,
      lineStyle: { width: 2, color: token("--metric-db") },
      itemStyle: { color: token("--metric-db") },
    },
    {
      name: "会话延迟",
      type: "line",
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: session,
      showSymbol: false,
      sampling: "lttb",
      connectNulls: false,
      lineStyle: { width: 2, color: token("--metric-net") },
      itemStyle: { color: token("--metric-net") },
    },
    {
      name: "连接数",
      type: "line",
      xAxisIndex: 0,
      // 双 y 轴：延迟（毫秒）与连接数（个）量纲不同，塞同一轴
      // 会让其中一方被压成贴轴直线；右轴独立刻度才都读得清。
      yAxisIndex: 1,
      data: connections,
      showSymbol: false,
      sampling: "lttb",
      connectNulls: false,
      // 虚线弱化：它是背景量（「当时有多少客户端连着」），
      // 不该和主角延迟曲线抢视觉权重
      lineStyle: { width: 1.5, type: "dashed", color: token("--metric-redis") },
      itemStyle: { color: token("--metric-redis") },
    },
    {
      name: "连通性",
      type: "bar",
      xAxisIndex: 1,
      yAxisIndex: 2,
      data: health.map(([ts, v]) => ({
        value: [ts, v ?? 0.5],
        // 未判定用中性色：它是「没结论」，既不是成功也不是失败，
        // 涂成红色会让人以为刚出过故障
        itemStyle: {
          color: v === null ? token("--text-tertiary") : v === 1 ? okColor : badColor,
        },
      })),
      barWidth: "60%",
    },
  ];

  return {
    animation: false,
    grid: [
      { left: "3%", right: "8%", top: 18, height: LATENCY_H, containLabel: true },
      { left: "3%", right: "8%", top: 18 + LATENCY_H + 34, height: 34, containLabel: true },
    ],
    tooltip: {
      trigger: "axis",
      backgroundColor: tipBg,
      borderColor: splitColor,
      textStyle: { color: axisColor, fontSize: 12 },
      // 失败原因按点挂在同一时刻上，axis 触发时靠它显示；没有就只显延迟
      formatter: (params: unknown) => {
        const arr = Array.isArray(params) ? params : [params];
        const first = arr[0] as { value?: unknown; axisValue?: unknown } | undefined;
        const ts = Number(first?.axisValue ?? NaN);
        if (!Number.isFinite(ts)) {
          return "";
        }
        const at = failures.find(f => f[0] === ts);
        const time = new Date(ts).toLocaleString("zh-CN", { hour12: false });
        const lines = arr.map((raw: unknown) => {
          const item = raw as { seriesName?: string; value?: unknown; color?: string };
          const pair = Array.isArray(item.value) ? (item.value as Pair) : null;
          const v = pair ? pair[1] : (item.value as number | null);
          const text = v === null || v === undefined ? "—" : String(Math.round(v));
          const unit = item.seriesName?.includes("延迟") ? " ms" : item.seriesName === "连接数" ? " 个" : "";
          return `${item.seriesName}: ${text}${unit}`;
        });
        if (at) {
          lines.push(`失败原因: ${at[1]}`);
        }
        return [time, ...lines].join("<br/>");
      },
    },
    axisPointer: { link: [{ xAxisIndex: "all" }] },
    xAxis: [
      {
        type: "time",
        gridIndex: 0,
        axisLine: { lineStyle: { color: splitColor } },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
      },
      {
        type: "time",
        gridIndex: 1,
        axisLine: { lineStyle: { color: splitColor } },
        axisTick: { show: false },
        axisLabel: {
          color: axisColor,
          fontSize: 11,
          hideOverlap: true,
          formatter: (v: number) => new Date(v).toLocaleTimeString("zh-CN", { hour12: false }),
        },
        splitLine: { show: false },
      },
    ],
    yAxis: [
      {
        type: "value",
        gridIndex: 0,
        // 延迟不可能为负，最小值钉在 0；不钉的话 ECharts 会自动从略低于最小值起画，
        // 读起来像是「延迟有过负数」
        min: 0,
        name: "延迟 (ms)",
        nameTextStyle: { color: axisColor, fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: axisColor, fontSize: 11 },
        splitLine: { lineStyle: { color: splitColor, type: "dashed" } },
      },
      {
        type: "value",
        gridIndex: 0,
        // 连接数右轴：整数刻度且最小为 0；minInterval=1 防止出现 0.5 个连接的刻度
        min: 0,
        minInterval: 1,
        name: "连接数",
        nameTextStyle: { color: axisColor, fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: axisColor, fontSize: 11 },
        splitLine: { show: false },
      },
      {
        type: "value",
        gridIndex: 1,
        min: 0,
        max: 1,
        interval: 1,
        name: "连通",
        nameTextStyle: { color: axisColor, fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false },
        // 只画两个刻度值；第三个中间刻度对 0/1 这种二值量没有意义
        axisLabel: { color: axisColor, fontSize: 11, showMinLabel: true, showMaxLabel: true },
        splitLine: { show: false },
      },
    ],
    series,
  };
};

const { render } = useEchart(elRef, build);

// SSE 每轮追加一个点 / 首屏趋势到达 / 切换数据源后重绘。
// 必须 deep：points 传进来的是数组，每轮是整个替换成新数组，
// 浅 watch 能触发；但同一批点被就地改写时只有 deep 能看见。
watch(() => [props.points, props.height], render, { deep: true });
</script>

<style scoped>
.ds-metric-echart {
  width: 100%;
}
</style>