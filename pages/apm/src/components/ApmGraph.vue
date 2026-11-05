<!--
  ApmGraph —— 服务调用关系图（总览与「拓扑」页签共用一套画法）。

  为什么抽成组件：总览页把图画在点阵画布上、拓扑页把它放进整块卡片里，
  两处的节点着色、边宽、浮层内容必须完全一致 —— 否则同一个系统在两页
  看起来像两个系统。这里只负责「画」，外层容器决定它多大。

  布局用 echarts 的 force，不自己迭代：OAP 的节点量级是几十个，
  内置 repulsion 足够，也避免再引入一个布局依赖。

  两条必须记住的 OAP 事实（都踩过）：
    1. 调用边的 calls / avgMs / errorRate 在「该边没有指标数据」时返回 -1；
       -1 直接进 `1 + log2(1 + calls)` 会得到 -Infinity，线宽非法 → 整条边不画。
       所以所有数值先过 {@link num} 归一成非负；
    2. 节点 id 是 base64 实体串（`YXBtLWRlbW8tYQ==.1`），边的 source/target
       引用的是这个 id 而不是 name —— 数据项必须写 `id`，否则边连不上。
-->
<template>
  <ReChart v-if="nodes.length" type="custom" engine="echarts" :option="option" :height="height" />
  <div v-else class="apm-graph__empty">{{ emptyText }}</div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { EChartsOption } from "echarts";
import ReChart from "@repo/ui/re-chart";
import type { ApmTopologyCall, ApmTopologyNode } from "../api/apmApi";
import { useApmPalette } from "../composables/useApmPalette";
import { fmtMs, fmtNum, fmtPercent } from "../utils/format";

const props = withDefaults(
  defineProps<{
    nodes: ApmTopologyNode[];
    calls: ApmTopologyCall[];
    /** 图高，透传给 ReChart */
    height?: string;
    /** 空态文案 */
    emptyText?: string;
    /** 节点标签字号（画布小的场景要更小） */
    labelSize?: number;
  }>(),
  {
    height: "300px",
    emptyText: "该时间窗口内没有调用关系",
    labelSize: 10,
  },
);

const palette = useApmPalette();

/** OAP 的 -1 是「没有数据」的哨兵值，画图时必须归零（否则线宽算出 NaN） */
function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** 节点 id → 名字（边上只有 id） */
const nameMap = computed(() => {
  const map = new Map<string, string>();
  for (const node of props.nodes) {
    map.set(node.id, node.name);
  }
  return map;
});

function nodeName(id: string): string {
  return nameMap.value.get(id) || id;
}

const option = computed<EChartsOption>(() => {
  const p = palette.value;
  const calls = props.calls;

  // 节点大小按「出入边调用量」的对数缩放：线性缩放会让小服务缩成针尖
  const weight = new Map<string, number>();
  for (const call of calls) {
    const n = num(call.calls);
    weight.set(call.source, (weight.get(call.source) ?? 0) + n);
    weight.set(call.target, (weight.get(call.target) ?? 0) + n);
  }
  const maxWeight = Math.max(1, ...[...weight.values()]);
  // 全部边都没有指标时（calls 全为 -1），节点统一用中号，不要全缩成 16px
  const noTraffic = maxWeight <= 1;

  return {
    backgroundColor: "transparent",
    animationDuration: 420,
    tooltip: {
      trigger: "item",
      backgroundColor: p.surface,
      borderColor: p.line,
      textStyle: { color: p.text, fontSize: 11 },
      formatter: (params: any) => {
        if (params.dataType === "edge") {
          const data = params.data;
          return [
            `${nodeName(data.source)} → ${nodeName(data.target)}`,
            `调用量 ${data.calls > 0 ? fmtNum(data.calls) : "—"}`,
            `平均耗时 ${data.avgMs > 0 ? fmtMs(data.avgMs) : "—"}`,
            `错误率 ${data.avgMs >= 0 && data.errorRate >= 0 ? fmtPercent(data.errorRate) : "—"}`,
          ].join("<br/>");
        }
        const data = params.data;
        return [
          `<b>${data.name}</b>`,
          `类型 ${data.type || "—"}`,
          data.virtual ? "来源 推断（非部署实例）" : "来源 已部署",
        ].join("<br/>");
      },
    },
    series: [
      {
        type: "graph",
        layout: "force",
        left: 24,
        right: 24,
        top: 24,
        bottom: 24,
        roam: true,
        draggable: true,
        force: { repulsion: 520, edgeLength: [110, 170], gravity: 0.18 },
        label: {
          show: true,
          position: "bottom",
          distance: 6,
          fontSize: props.labelSize,
          color: p.text,
          formatter: (params: any) => params.data.name,
        },
        edgeSymbol: ["none", "arrow"],
        edgeSymbolSize: 6,
        emphasis: { focus: "adjacency", scale: 1.05 },
        itemStyle: { borderWidth: 1.8 },
        data: props.nodes.map((node) => {
          const own = weight.get(node.id) ?? 0;
          const ratio = noTraffic ? 0.35 : Math.log2(1 + own) / Math.log2(1 + maxWeight);
          const size = 26 + ratio * 22;
          const self = node.self || node.isSelf;
          const virtual = node.isReal === false;
          return {
            id: node.id,
            name: node.name,
            symbolSize: Number.isFinite(size) ? Math.round(size) : 24,
            type: node.type,
            layer: node.layer,
            calls: own,
            virtual,
            itemStyle: {
              // 半透明填充 + 实色描边：深浅两种底色下都能看清，
              // 也不需要为暗色主题再维护一套色值
              color: self
                ? "rgba(217, 139, 0, 0.20)"
                : virtual
                  ? "rgba(120, 134, 148, 0.12)"
                  : "rgba(31, 122, 224, 0.14)",
              borderColor: self ? p.warn : virtual ? p.faint : p.primary,
              borderType: virtual ? "dashed" : "solid",
            },
            label: { color: p.text },
          };
        }),
        links: calls.map((call) => {
          const traffic = num(call.calls);
          const rate = num(call.errorRate);
          return {
            source: call.source,
            target: call.target,
            calls: traffic,
            avgMs: num(call.avgMs),
            errorRate: call.errorRate,
            lineStyle: {
              width: Math.min(4.5, 1.6 + Math.log2(1 + traffic) * 0.45),
              color: rate > 0 ? p.bad : p.primary,
              opacity: rate > 0 ? 0.85 : 0.5,
              curveness: 0.1,
            },
          };
        }),
      },
    ],
  } as EChartsOption;
});
</script>

<style scoped>
.apm-graph__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 160px;
  padding: 16px;
  text-align: center;
  font-size: 11.5px;
  color: var(--el-text-color-placeholder);
}
</style>
