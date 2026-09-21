<script setup lang="ts">
/**
 * ReGraph default 主题 —— 基于 X6 的全能关系图组件
 *
 * 复用 X6Graph 内核，提供完整工具栏、搜索高亮 / 路径模式、节点右键菜单、
 * 代理流调色板（editable）、小地图、历史回溯与导入导出。
 * API 与原 relation-graph 版基本一致（lines 兼容为 edges 别名）。
 */
import { computed } from "vue";
import X6Graph from "../../internals/X6Graph.vue";
import {
  ReGraphMode,
  type ReGraphConfig,
  type ReGraphData,
  type ReGraphEdge,
  type ReGraphExpandFetcher,
  type ReGraphModeInput,
  type ReGraphNode,
  type ReGraphNodeMenuAction,
  type ReGraphToolbarOptions,
} from "../../internals/x6";

defineOptions({ name: "ReGraph", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    mode?: ReGraphModeInput;
    data?: ReGraphData;
    nodes?: ReGraphNode[];
    /** 连线列表（兼容旧 API，等价于 edges） */
    lines?: ReGraphEdge[];
    /** 连线列表 */
    edges?: ReGraphEdge[];
    options?: Record<string, unknown>;
    height?: string | number;
    width?: string | number;
    showToolbar?: boolean;
    /** 兼容旧 prop：显示小地图 */
    showMiniView?: boolean;
    showMinimap?: boolean;
    editable?: boolean;
    debug?: boolean;
    toolbar?: ReGraphToolbarOptions;
    fetchExpand?: ReGraphExpandFetcher;
    enableHistory?: boolean;
    maxHistorySize?: number;
    /** RelationGraph 通用配置（覆盖同名独立 prop） */
    config?: ReGraphConfig;
  }>(),
  {
    mode: ReGraphMode.FORCE,
    data: undefined,
    nodes: undefined,
    lines: undefined,
    edges: undefined,
    options: undefined,
    height: "100%",
    width: "100%",
    showToolbar: true,
    showMiniView: false,
    showMinimap: false,
    editable: false,
    debug: false,
    toolbar: undefined,
    fetchExpand: undefined,
    enableHistory: true,
    maxHistorySize: 50,
    config: undefined,
  },
);

const emit = defineEmits<{
  (e: "ready", instance: unknown): void;
  (e: "node-click", node: ReGraphNode, ev: MouseEvent): void;
  (e: "node-dblclick", node: ReGraphNode, ev: MouseEvent): void;
  (e: "node-contextmenu", node: ReGraphNode, ev: MouseEvent): void;
  (e: "edge-click", edge: ReGraphEdge, ev: MouseEvent): void;
  (e: "layout-change", name: string): void;
  (e: "search-change", keyword: string, matched: ReGraphNode[]): void;
  (e: "expand", node: ReGraphNode, payload: { nodes: ReGraphNode[]; edges: ReGraphEdge[] }): void;
  (e: "node-menu", action: ReGraphNodeMenuAction, node: ReGraphNode): void;
}>();

const edges = computed<ReGraphEdge[] | undefined>(() => props.edges ?? props.lines);
const showMap = computed(() => props.showMiniView || props.showMinimap);
</script>

<template>
  <X6Graph
    :mode="mode"
    :data="data"
    :nodes="nodes"
    :edges="edges"
    :options="options"
    :height="height"
    :width="width"
    :editable="editable"
    :palette="editable"
    :show-toolbar="showToolbar"
    :show-minimap="showMap"
    :debug="debug"
    :toolbar="toolbar"
    :fetch-expand="fetchExpand"
    :enable-history="enableHistory"
    :config="config"
    @ready="(e: unknown) => emit('ready', e)"
    @node-click="(n, ev) => emit('node-click', n, ev)"
    @node-dblclick="(n, ev) => emit('node-dblclick', n, ev)"
    @node-contextmenu="(n, ev) => emit('node-contextmenu', n, ev)"
    @edge-click="(e, ev) => emit('edge-click', e, ev)"
    @layout-change="(m) => emit('layout-change', m)"
    @search-change="(k, m) => emit('search-change', k, m)"
    @expand="(n, p) => emit('expand', n, p)"
    @node-menu="(a, n) => emit('node-menu', a, n)"
  >
    <template v-if="$slots.toolbar" #toolbar="slotProps">
      <slot name="toolbar" v-bind="slotProps" />
    </template>
    <template v-if="$slots.status" #status="slotProps">
      <slot name="status" v-bind="slotProps" />
    </template>
  </X6Graph>
</template>
