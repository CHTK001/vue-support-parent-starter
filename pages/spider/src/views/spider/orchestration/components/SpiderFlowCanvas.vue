<template>
  <div class="spider-flow-canvas">
    <VueFlow
      :nodes="flowNodes"
      :edges="flowEdges"
      :node-types="nodeTypes"
      :edge-types="edgeTypes"
      :default-viewport="{ x: 0, y: 0, zoom: 1.2 }"
      fit-view-on-init
      @node-click="onNodeClick"
      @pane-click="onPaneClick"
    >
      <Background :gap="20" :size="1" pattern-color="#e2e8f0" />
    </VueFlow>
  </div>
</template>

<script setup lang="ts">
import { computed, h, markRaw } from "vue";
import { VueFlow } from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import "@vue-flow/core/dist/style.css";
import "@vue-flow/core/dist/theme-default.css";
import RoundedRectangleNode from "./RoundedRectangleNode.vue";
import AnimatedFlowEdge from "./AnimatedFlowEdge.vue";

interface SpiderCanvasNode {
  id: string;
  type?: string;
  label: string;
  icon?: string;
  typeLabel?: string;
  position: { x: number; y: number };
  runtimeStatus?: string;
  parentId?: string;
}

interface SpiderCanvasEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  visited?: boolean;
  runtimeStatus?: string;
}

const props = defineProps<{
  nodes: SpiderCanvasNode[];
  edges: SpiderCanvasEdge[];
}>();

const emit = defineEmits<{
  (e: "node-click", nodeId: string): void;
  (e: "pane-click"): void;
}>();

const nodeTypes = {
  spiderNode: markRaw(RoundedRectangleNode),
};

const edgeTypes = {
  spiderEdge: markRaw(AnimatedFlowEdge),
};

const flowNodes = computed(() =>
  props.nodes.map((n) => ({
    id: n.id,
    type: "spiderNode",
    position: n.position,
    data: {
      label: n.label,
      icon: n.icon,
      typeLabel: n.typeLabel,
      runtimeStatus: n.runtimeStatus,
    },
  })),
);

const flowEdges = computed(() =>
  props.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: "spiderEdge",
    label: e.label || "",
    data: {
      visited: e.visited,
      runtimeStatus: e.runtimeStatus,
    },
  })),
);

function onNodeClick(event: { node: { id: string } }) {
  emit("node-click", event.node.id);
}

function onPaneClick() {
  emit("pane-click");
}
</script>

<style scoped>
.spider-flow-canvas {
  width: 100%;
  height: 100%;
  min-height: 500px;
  background: var(--spider-canvas-bg, #f8fafc);
  border-radius: 16px;
  overflow: hidden;
}
</style>
