<script setup lang="ts">
/**
 * ES 集群监控趋势图（ECharts）
 *
 * <p>每次集群信息刷新时追加一个快照点，内存中保留最近 30 个点（约 30 分钟），
 * 画三条折线：活跃分片 / 未分配分片（红色警示）/ 文档总数。</p>
 *
 * <p>不使用外部时序库：集群快照由前端在内存中维护，每次 loadCluster 调用时追加，
 * 只依赖已有的 fetchEsCluster 接口。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, ref } from "vue";
import type { EChartsOption } from "echarts";
import { token, useEchart } from "./useEchart";
import type { EsCluster } from "../../../api/esManageApi";

/** 集群快照点 */
type ClusterSnapshot = {
  ts: number;       // 时间戳 ms
  activeShards: number;
  unassignedShards: number;
  totalDocs: number;
  status: string;   // green/yellow/red
};

const props = withDefaults(
  defineProps<{
    /** 当前集群信息（由父组件传入，每次 loadCluster 后刷新 prop） */
    cluster?: EsCluster | null;
  }>(),
  { cluster: null },
);

const MAX_POINTS = 30;
const snapshots = ref<ClusterSnapshot[]>([]);

/** 每次 cluster prop 变化时追加快照 */
function snapshot() {
  const c = props.cluster;
  if (!c) return;
  const docs = c.nodes.reduce((sum, n) => sum, 0); // 精确文档数由 indices 加总
  snapshots.value.push({
    ts: Date.now(),
    activeShards: c.activeShards,
    unassignedShards: c.unassignedShards,
    totalDocs: docs,
    status: c.status,
  });
  if (snapshots.value.length > MAX_POINTS) {
    snapshots.value = snapshots.value.slice(-MAX_POINTS);
  }
}

/** 外部调用：父组件在 loadCluster 完成后调用此方法追加快照 */
defineExpose({
  snapshot,
  get snapshotCount() { return snapshots.value.length; },
});

const el = ref<HTMLElement | null>(null);
const elRef = computed(() => el.value);

const build = (): EChartsOption => {
  const pts = snapshots.value;
  if (pts.length === 0) return {};
  const textColor = token("--text-secondary");
  const gridColor = token("--border-subtle");
  const okColor = token("--status-success");
  const warnColor = token("--status-warning");
  const dangerColor = token("--status-error");
  const primaryColor = token("--el-color-primary");

  const active: [number, number][] = pts.map(p => [p.ts, p.activeShards]);
  const unassigned: [number, number | null][] = pts.map(p => [p.ts, p.unassignedShards]);
  const statusColor: [number, string][] = pts.map(p => [
    p.ts,
    p.status === "green" ? okColor : p.status === "yellow" ? warnColor : p.status === "red" ? dangerColor : textColor,
  ]);

  return {
    backgroundColor: "transparent",
    grid: { top: 36, right: 60, bottom: 40, left: 60, containLabel: false },
    legend: {
      top: 4, right: 8,
      itemWidth: 12, itemHeight: 8,
      textStyle: { color: textColor, fontSize: 11 },
      data: ["活跃分片", "未分配分片", "集群健康"],
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: token("--el-bg-color-overlay"),
      borderColor: token("--el-border-color-lighter"),
      textStyle: { color: token("--el-text-color-regular"), fontSize: 12 },
      formatter(params: any) {
        if (!Array.isArray(params) || params.length === 0) return "";
        const ts = new Date(params[0].data[0]);
        const time = ts.toLocaleTimeString();
        let html = `<div style="font-size:11px;color:${token("--text-tertiary")};margin-bottom:4px">${time}</div>`;
        for (const p of params) {
          html += `<div style="display:flex;align-items:center;gap:6px;margin:2px 0">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
            <span style="flex:1">${p.seriesName}</span>
            <span style="font-family:monospace;font-weight:600">${p.data[1]}</span>
          </div>`;
        }
        return html;
      },
    },
    xAxis: {
      type: "time",
      splitLine: { show: false },
      axisLine: { lineStyle: { color: gridColor } },
      axisLabel: { color: textColor, fontSize: 10, formatter: (v: number) => new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      axisTick: { show: false },
    },
    yAxis: [
      {
        type: "value",
        name: "分片数",
        nameTextStyle: { color: textColor, fontSize: 10 },
        splitLine: { lineStyle: { color: gridColor, type: "dashed" } },
        axisLine: { show: false },
        axisLabel: { color: textColor, fontSize: 10 },
        axisTick: { show: false },
      },
    ],
    series: [
      {
        name: "活跃分片",
        type: "line",
        yAxisIndex: 0,
        data: active,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: okColor, width: 2 },
        areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: okColor + "30" }, { offset: 1, color: okColor + "05" }] } },
      },
      {
        name: "未分配分片",
        type: "line",
        yAxisIndex: 0,
        data: unassigned,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: dangerColor, width: 2, type: "dashed" as const },
        itemStyle: { color: dangerColor },
      },
    ],
  };
};

const { chart } = useEchart(elRef, build);
</script>

<template>
  <div class="es-cluster-chart">
    <div ref="el" class="es-cluster-chart-canvas" />
    <div v-if="snapshots.length === 0" class="es-cluster-chart-empty">
      <span>刷新集群信息后趋势图自动生成</span>
    </div>
  </div>
</template>

<style scoped>
.es-cluster-chart {
  position: relative;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 10%, var(--border-color, #e4e7ed));
  border-radius: var(--es-radius);
  background: color-mix(in srgb, var(--el-bg-color) 60%, transparent);
  backdrop-filter: blur(8px);
  overflow: hidden;
}
.es-cluster-chart-canvas {
  width: 100%;
  height: 200px;
}
.es-cluster-chart-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--text-tertiary);
}
</style>
