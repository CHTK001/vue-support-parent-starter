<script setup lang="ts">
/**
 * ReGraph koi 主题 —— 精简关系图组件（X6 版）
 *
 * 与 default 差异：仅保留轻量搜索栏（高亮模式）+ 节点右键菜单 + 拖拽连线，
 * 适合仪表盘只读/轻交互场景。API 与原 relation-graph koi 版一致。
 */
import { computed } from "vue";
import X6Graph from "../../internals/X6Graph.vue";
import type {
  ReGraphData,
  ReGraphEdge,
  ReGraphExpandFetcher,
  ReGraphNode,
} from "../../internals/x6";

defineOptions({ name: "ReGraph" });

const props = withDefaults(
  defineProps<{
    data?: ReGraphData;
    nodes?: ReGraphNode[];
    /** 连线列表（兼容旧 API） */
    lines?: ReGraphEdge[];
    edges?: ReGraphEdge[];
    options?: Record<string, unknown>;
    height?: string | number;
    width?: string | number;
    debug?: boolean;
    editable?: boolean;
    showSearch?: boolean;
    fetchExpand?: ReGraphExpandFetcher;
  }>(),
  {
    data: undefined,
    nodes: undefined,
    lines: undefined,
    edges: undefined,
    options: undefined,
    height: "100%",
    width: "100%",
    debug: false,
    editable: false,
    showSearch: true,
    fetchExpand: undefined,
  },
);

const emit = defineEmits<{
  (e: "ready", instance: unknown): void;
  (e: "node-click", node: ReGraphNode, ev: MouseEvent): void;
  (e: "node-dblclick", node: ReGraphNode, ev: MouseEvent): void;
  (e: "node-contextmenu", node: ReGraphNode, ev: MouseEvent): void;
  (e: "edge-click", edge: ReGraphEdge, ev: MouseEvent): void;
  (e: "expand", node: ReGraphNode, payload: { nodes: ReGraphNode[]; edges: ReGraphEdge[] }): void;
}>();

const edges = computed<ReGraphEdge[] | undefined>(() => props.edges ?? props.lines);
</script>

<template>
  <X6Graph
    mode="center"
    :data="data"
    :nodes="nodes"
    :edges="edges"
    :options="options"
    :height="height"
    :width="width"
    :debug="debug"
    :editable="editable"
    :minimal="true"
    :show-search="showSearch"
    :show-toolbar="false"
    :fetch-expand="fetchExpand"
    @ready="(e: unknown) => emit('ready', e)"
    @node-click="(n, ev) => emit('node-click', n, ev)"
    @node-dblclick="(n, ev) => emit('node-dblclick', n, ev)"
    @node-contextmenu="(n, ev) => emit('node-contextmenu', n, ev)"
    @edge-click="(e, ev) => emit('edge-click', e, ev)"
    @expand="(n, p) => emit('expand', n, p)"
  />
</template>
