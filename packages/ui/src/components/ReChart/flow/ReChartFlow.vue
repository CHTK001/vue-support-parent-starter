<template>
  <div ref="container" class="re-chart-flow" :style="{ height, width }" />
</template>

<script setup lang="ts">
/**
 * ReChartFlow —— 基于 @antv/g6 绘制的资金流/流线图。
 *
 * 直接复刻官方「资金流向图」示例（tree-node 自定义节点 + indented 布局 +
 * cubic-horizontal 边），这里只把它包装成 Vue 组件，并从 data 生成 G6 树数据。
 *
 * 数据模型为树结构 {@link ReChartFlowNode}，字段与官方决策树一致：
 *   name / label(金额) / currency / variableValue(涨跌%) / variableUp /
 *   variableName / status(B/R/Y/G/DI) / rate(进度)。
 */
import { onMounted, onBeforeUnmount, watch, ref } from "vue";
import { Graph, treeToGraphData } from "@antv/g6";
import type { ReChartFlowNode } from "../types";
import { ensureIconFont, FLOW_GREY, registerTreeNode } from "./treeNode";

interface Props {
  data?: ReChartFlowNode | { root?: ReChartFlowNode };
  height?: string;
  width?: string;
  /** 缩进像素量 */
  indent?: number;
  /** 折叠深度阈值 */
  collapseDepth?: number;
  /** 初始是否启用缩放 / 拖拽 */
  zoom?: boolean;
  drag?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  height: "100%",
  width: "100%",
  indent: 300,
  collapseDepth: 2,
  zoom: true,
  drag: true,
});

const emit = defineEmits<{
  (e: "ready", instance: unknown): void;
}>();

const container = ref<HTMLDivElement | null>(null);
let graphInstance: Graph | null = null;

/** 读根元素 CSS 变量（G6 canvas 不认 var(--x)，须解析成具体颜色） */
function readCssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/**
 * 换主题色后重建画布。
 *
 * <p>节点/边的颜色都是 G6 draw 钩子里现读 CSS 变量解析出来的，主题色写在
 * `<html>` 行内样式上，props 不变不会重绘 —— 重建一次让全部子形重新取色。</p>
 */
const themeTick = ref(0);
let themeStyleObserver: MutationObserver | null = null;

function normalizeData(): ReChartFlowNode | null {
  const d = props.data as any;
  if (!d) return null;
  return d.root ?? d;
}

function wireGraph(root: ReChartFlowNode | null) {
  if (!container.value) return;
  ensureIconFont();
  registerTreeNode();

  graphInstance?.destroy();
  graphInstance = null;

  const data = root
    ? treeToGraphData(root, {
        getNodeData: (datum: any, depth: number) => {
          if (!datum.style) datum.style = {};
          datum.style.collapsed = depth >= props.collapseDepth;
          if (!datum.children) return datum;
          const children = datum.children.map((c: any) => c.id);
          return { ...datum, children };
        },
      })
    : { nodes: [], edges: [] };

  graphInstance = new Graph({
    container: container.value,
    autoFit: "view",
    data,
    node: {
      type: "tree-node",
      style: {
        size: [202, 60],
        ports: [{ placement: "left" }, { placement: "right" }],
        radius: 4,
      },
    },
    edge: { type: "cubic-horizontal", style: { stroke: readCssVar("--border-default", FLOW_GREY) } },
    layout: {
      type: "indented",
      direction: "LR",
      dropCap: false,
      indent: props.indent,
      getHeight: () => 60,
      preLayout: false,
    },
    behaviors: [
      ...(props.zoom ? ["zoom-canvas"] : []),
      ...(props.drag ? ["drag-canvas"] : []),
    ] as any,
  });

  graphInstance.render().then(() => emit("ready", graphInstance));
}

onMounted(() => {
  wireGraph(normalizeData());
  if (typeof MutationObserver !== "undefined" && typeof document !== "undefined") {
    themeStyleObserver = new MutationObserver(() => {
      themeTick.value += 1;
    });
    themeStyleObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style", "class"],
    });
  }
});

onBeforeUnmount(() => {
  themeStyleObserver?.disconnect();
  themeStyleObserver = null;
  graphInstance?.destroy();
  graphInstance = null;
});

watch(
  () => props.data,
  (val) => wireGraph(normalizeData()),
  { deep: true },
);

watch(themeTick, () => wireGraph(normalizeData()));
</script>

<style scoped>
.re-chart-flow {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>