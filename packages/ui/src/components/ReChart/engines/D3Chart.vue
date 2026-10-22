<template>
  <div ref="root" class="re-chart-d3" :style="{ height, width }">
    <svg :width="viewWidth" :height="viewHeight" role="img" :aria-label="ariaLabel">
      <g v-if="links.length">
        <!-- 连线（流线） -->
        <path
          v-for="(l, i) in links"
          :key="`l${i}`"
          :d="l.path"
          :fill="l.fill"
          :stroke="l.fill"
          stroke-opacity="0.5"
          fill-rule="evenodd"
        />
        <!-- 节点 -->
        <g v-for="(n, idx) in nodes" :key="n.key" @mouseover="onHover(n)" @mouseout="onOut">
          <rect
            :x="n.x0"
            :y="n.y0"
            :width="n.x1 - n.x0"
            :height="Math.max(1, n.y1 - n.y0)"
            :fill="n.fill"
            rx="3"
          />
          <text
            :x="n.textX"
            :y="(n.y0 + n.y1) / 2"
            :fill="textColor"
            font-size="12"
            :text-anchor="n.textAnchor"
            dominant-baseline="middle"
          >{{ n.name }}</text>
        </g>
      </g>
      <text v-else x="50%" y="50%" text-anchor="middle" :fill="textColor" font-size="13">
        {{ emptyText }}
      </text>
    </svg>
  </div>
</template>

<script setup lang="ts">
/**
 * D3 引擎 —— 基于 d3-sankey@0.12.3 渲染桑基/流线图。
 *
 * 独立于 echarts，便于在 ReChart 上通过 engine="d3" 切换渲染后端。
 * 数据约定：
 *   sankey.nodes = [{ name }]
 *   sankey.links = [{ source, target, value }]
 * link.source/target 指向 node.name（字符串）或节点索引。
 */
/// <reference path="../d3-sankey.d.ts" />
import { computed, onMounted, onBeforeUnmount, ref, watch, shallowRef } from "vue";
import { sankey, sankeyLeft, sankeyLinkHorizontal } from "d3-sankey";
import type { ReChartSankeyData } from "../types";

interface Props {
  sankey?: ReChartSankeyData;
  height?: string;
  width?: string;
  theme?: "light" | "dark";
  emptyText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  height: "100%",
  width: "100%",
  theme: "light",
  emptyText: "暂无数据（d3 引擎需传入 sankey 数据）",
});

const emit = defineEmits<{
  (e: "ready", instance: unknown): void;
}>();

const root = ref<HTMLDivElement | null>(null);
const viewWidth = ref(600);
const viewHeight = ref(400);

const textColor = computed(() => (props.theme === "dark" ? "#e5eaf3" : "#606266"));
const emptyText = computed(() => props.emptyText);
const ariaLabel = "桑基流线图";

type RenderNode = {
  key: string;
  name: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  fill: string;
  textX: number;
  textAnchor: string;
};
type RenderLink = { path: string; fill: string };

const nodes = shallowRef<RenderNode[]>([]);
const links = shallowRef<RenderLink[]>([]);

const readCssVar = (name: string, fallback: string): string => {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
};

function paletteColor(i: number): string {
  const base = [
    readCssVar("--el-color-primary", "#409eff"),
    readCssVar("--el-color-success", "#67c23a"),
    readCssVar("--el-color-warning", "#e6a23c"),
    readCssVar("--el-color-danger", "#f56c6c"),
    readCssVar("--el-color-info", "#909399"),
  ];
  return base[i % base.length];
}

function measure() {
  if (!root.value) return;
  const rect = root.value.getBoundingClientRect();
  viewWidth.value = Math.max(rect.width || 600, 60);
  viewHeight.value = Math.max(rect.height || 400, 60);
}

// d3-sankey@0.12 布局后 node/link 上的几何字段
type SNode = any;
type SLink = any;

function render() {
  if (!props.sankey || !props.sankey.nodes?.length || !props.sankey.links?.length) {
    nodes.value = [];
    links.value = [];
    return;
  }
  measure();
  const width = viewWidth.value;
  const height = viewHeight.value;

  try {
    const layout = sankey<SNode, SLink>()
      .nodeWidth(18)
      .nodePadding(16)
      .nodeAlign(sankeyLeft)
      .extent([
        [8, 8],
        [width - 8, height - 8],
      ])
      .nodeId((d: any) => String(d.name));

    const graph = layout({
      nodes: props.sankey.nodes as SNode[],
      links: props.sankey.links.map((l) => ({ ...l })) as SLink[],
    });

    const nodeList = graph.nodes as Array<SNode & {
      name: string;
      x0: number;
      x1: number;
      y0: number;
      y1: number;
      depth: number;
    }>;
    const linkList = graph.links as Array<SLink & {
      source: SNode;
      target: SNode;
      width: number;
    }>;

    const pathGen = sankeyLinkHorizontal<SNode>();

    const nodeView: RenderNode[] = nodeList.map((n, i) => {
      const x0 = n.x0 ?? 0;
      const x1 = n.x1 ?? 0;
      const y0 = n.y0 ?? 0;
      const y1 = n.y1 ?? 0;
      // 节点是否有出边：有则文字放右侧，否则放左侧（右侧主读方向）
      const hasOut = (n.sourceLinks?.length ?? 0) > 0;
      return {
        key: String(n.name),
        name: String(n.name ?? ""),
        x0,
        x1,
        y0,
        y1,
        fill: paletteColor(i),
        textX: hasOut ? x1 + 6 : x0 - 6,
        textAnchor: hasOut ? "start" : "end",
      };
    });

    const linkView: RenderLink[] = linkList.map((l, j) => ({
      path: pathGen(l),
      fill: paletteColor(j % Math.max(nodeList.length, 1)),
    }));

    nodes.value = nodeView;
    links.value = linkView;
    emit("ready", graph);
  } catch (e) {
    nodes.value = [];
    links.value = [];
    console.warn("[ReChart:d3] sankey 渲染失败", e);
  }
}

// 事件（暴露占位）
function onHover(_n: RenderNode) {
  /* 预留 hover 联动 */
}
function onOut() {
  /* 预留 */
}

let ro: ResizeObserver | null = null;

onMounted(() => {
  render();
  if (typeof ResizeObserver !== "undefined" && root.value) {
    ro = new ResizeObserver(() => render());
    ro.observe(root.value);
  }
});

onBeforeUnmount(() => ro?.disconnect());

watch(() => props.sankey, render, { deep: true });
watch([() => props.theme, viewWidth, viewHeight], render);
</script>

<style scoped>
.re-chart-d3 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.re-chart-d3 svg {
  display: block;
}
</style>