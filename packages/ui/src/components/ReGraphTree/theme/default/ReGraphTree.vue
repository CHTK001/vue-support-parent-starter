<script setup lang="ts">
import { computed } from "vue";
import X6Graph from "../../../ReGraph/internals/X6Graph.vue";
import type {
  ReGraphData,
  ReGraphEdge,
  ReGraphExpandFetcher,
  ReGraphNode,
} from "../../../ReGraph/internals/x6";

defineOptions({ name: "ReGraphTree" });

const props = withDefaults(
  defineProps<{
    data?: ReGraphData;
    nodes?: ReGraphNode[];
    lines?: ReGraphEdge[];
    edges?: ReGraphEdge[];
    options?: Record<string, unknown>;
    height?: string | number;
    width?: string | number;
    debug?: boolean;
    editable?: boolean;
    showToolbar?: boolean;
    showMinimap?: boolean;
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
    showToolbar: false,
    showMinimap: false,
    fetchExpand: undefined,
  },
);

const emit = defineEmits<{
  (e: "ready", instance: unknown): void;
  (e: "node-click", node: ReGraphNode, ev: MouseEvent): void;
  (e: "edge-click", edge: ReGraphEdge, ev: MouseEvent): void;
}>();

const edges = computed<ReGraphEdge[] | undefined>(() => props.edges ?? props.lines);
</script>

<template>
  <X6Graph
    mode="tree"
    :data="data"
    :nodes="nodes"
    :edges="edges"
    :options="options"
    :height="height"
    :width="width"
    :editable="editable"
    :palette="editable"
    :show-toolbar="showToolbar"
    :show-minimap="showMinimap"
    :debug="debug"
    :fetch-expand="fetchExpand"
    @ready="(e: unknown) => emit('ready', e)"
    @node-click="(n, ev) => emit('node-click', n, ev)"
    @edge-click="(e, ev) => emit('edge-click', e, ev)"
  />
</template>
