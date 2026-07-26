<template>
  <section
    class="sc-relation-graph"
    :class="`sc-relation-graph--${mode}`"
  >
    <div v-if="showPalette" class="sc-relation-graph__sidebar">
      <div
        v-for="item in props.palette"
        :key="item.kind"
        class="palette-item"
        :class="{ 'palette-item--disabled': item.disabled }"
        :style="{ '--palette-color': item.color }"
        draggable="true"
        @dragstart.prevent="onPaletteDragStart(item.kind!, $event)"
      >
        <span class="palette-item__icon" v-html="getIconSvg(item.icon)" />
        <span class="palette-item__label">{{ item.title }}</span>
      </div>
    </div>

    <div
      ref="canvasRef"
      class="sc-relation-graph__canvas"
      @dragover.prevent
      @drop.prevent="onCanvasDrop"
    >
      <RGProvider>
<RelationGraph
         :options="graphOptions"
         :initialData="graphData"
         @onNodeClick="onNodeClick"
         @onLineClick="onLineClick"
         @onCanvasClick="onCanvasClick"
         @onNodeDragEnd="onNodeDragEnd"
         @onNodeDragging="onNodeDragging"
         @onReady="onReady"
       >
         <!-- 自定义节点 -->
         <template #node="slotProps">
           <SpiderGraphNode
             :node="slotProps.node"
             :mode="props.mode"
             @delete="onNodeDelete(slotProps.node.id)"
           />
         </template>
         <!-- 视图（小地图） -->
         <template #view>
           <RGMiniView />
         </template>
       </RelationGraph>
      </RGProvider>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, markRaw, nextTick, reactive, ref } from "vue";
import {
  RelationGraph,
  RGProvider,
  RGMiniView,
  type JsonNode,
  type JsonLine,
  type RGOptions,
  type RGNode,
  type RGLine,
  type RGLink,
} from "@relation-graph/vue";
import { getLfNodeType, getNodeSize } from "@repo/components/ScFlowEditor/FlowEditorNodeDefs";
import type { ScRelationGraphNode, ScRelationGraphEdge, ScRelationGraphPaletteItem } from "./types";
import SpiderGraphNode from "./SpiderGraphNode.vue";

const props = withDefaults(defineProps<{
  mode?: "preview" | "edit";
  nodes: ScRelationGraphNode[];
  edges: ScRelationGraphEdge[];
  palette?: ScRelationGraphPaletteItem[];
  palettePosition?: "left" | "right";
  selectedNodeId?: string | null;
  selectedEdgeId?: string | null;
  interactionMode?: "free" | "organizer";
}>(), {
  mode: "preview",
  palettePosition: "left",
  selectedNodeId: null,
  selectedEdgeId: null,
});

const emit = defineEmits<{
  (e: "node-click", nodeId: string): void;
  (e: "edge-click", edgeId: string): void;
  (e: "pane-click"): void;
  (e: "node-moved", payload: { nodeId: string; position: { x: number; y: number } }): void;
  (e: "node-drop", payload: { kind: string; position: { x: number; y: number } }): void;
  (e: "node-remove", nodeId: string): void;
  (e: "edge-remove", edgeId: string): void;
  (e: "edge-create", payload: { source: string; target: string }): void;
  (e: "apply-layout", positions: { nodeId: string; position: { x: number; y: number } }[]): void;
}>();

const canvasRef = ref<HTMLElement | null>(null);
const graphInstance = ref<any>(null);

const showPalette = computed(
  () => props.mode === "edit" && !!props.palette && props.palette.length > 0,
);

const graphOptions = reactive<RGOptions>({
  instanceId: `spider-graph-${Math.random().toString(36).slice(2, 8)}`,
  showToolBar: false,
  backgroundColor: "transparent",
  wheelEventAction: "zoom",
  dragEventAction: "move",
  disableDragNode: props.mode === "preview",
  disableDragLine: true,
  disableNodePointEvent: false,
  disableLinePointEvent: false,
  defaultNodeColor: "transparent",
  defaultNodeBorderColor: "transparent",
  defaultNodeBorderWidth: 0,
  defaultNodeShape: 1,
  defaultLineColor: "#94a3b8",
  defaultLineWidth: 2,
  defaultLineShape: 6,
  layout: {
    layoutName: "fixed",
  },
  placeOtherGroup: true,
  minCanvasZoom: 10,
  maxCanvasZoom: 400,
});

const graphData = computed(() => {
  const nodes: JsonNode[] = props.nodes.map((n) => ({
    id: n.id,
    text: n.label || n.id,
    x: n.position.x,
    y: n.position.y,
    width: getNodeSize(n.type).width,
    height: getNodeSize(n.type).height,
    nodeShape: getNodeShape(n.type),
    color: "transparent",
    borderColor: "transparent",
    borderWidth: 0,
    data: {
      kind: n.kind,
      runtimeStatus: n.runtimeStatus,
      displayInfo: n.displayInfo,
      errorMessage: n.errorMessage,
      executionRound: n.executionRound,
      icon: n.icon,
      label: n.label,
      htmlContent: n.htmlContent,
      imageUrl: n.imageUrl,
      containerSize: n.containerSize,
    },
  }));
  const lines: JsonLine[] = props.edges.map((e) => ({
    id: e.id,
    from: e.source,
    to: e.target,
    text: e.label || "",
    color: getEdgeColor(e.runtimeStatus, e.visited),
    lineWidth: getEdgeWidth(e.runtimeStatus, e.visited),
    lineShape: 6,
    data: {
      runtimeStatus: e.runtimeStatus,
      visited: e.visited,
      label: e.label,
    },
  }));
  return {
    rootId: props.nodes[0]?.id || "root",
    nodes,
    lines,
  };
});

function getNodeShape(type?: string): number {
  switch (type) {
    case "flow-circle":
    case "START":
    case "END":
      return 0;
    case "flow-diamond":
    case "CONDITION":
      return 1;
    default:
      return 1;
  }
}

function getNodeSize(type?: string): { width: number; height: number } {
  switch (type) {
    case "flow-circle":
    case "START":
    case "END":
      return { width: 60, height: 60 };
    case "flow-diamond":
    case "CONDITION":
      return { width: 140, height: 120 };
    case "flow-subflow":
    case "SUB_FLOW":
      return { width: 260, height: 100 };
    case "flow-image":
    case "IMAGE":
      return { width: 200, height: 160 };
    default:
      return { width: 210, height: 60 };
  }
}

function getNodeSizeByKind(kind: string): { width: number; height: number } {
  const lfType = getLfNodeType(kind) || "flow-rect";
  return getNodeSize(lfType);
}

function getEdgeColor(status?: string, visited?: boolean): string {
  if (status === "RUNNING") return "#3b82f6";
  if (status === "SUCCESS") return "#22c55e";
  if (status === "FAILED") return "#ef4444";
  if (status === "WAIT_MANUAL") return "#eab308";
  if (visited) return "#22c55e";
  return "#94a3b8";
}

function getEdgeWidth(status?: string, visited?: boolean): number {
  if (["RUNNING", "SUCCESS", "FAILED", "WAIT_MANUAL"].includes(status || "")) return 2.5;
  if (visited) return 2.5;
  return 2;
}

const ICON_SVGS: Record<string, string> = {
  START:
    '<path fill="currentColor" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10Zm0-2a8 8 0 1 0 0-16a8 8 0 0 0 0 16ZM10.622 8.415l4.879 3.252a.4.4 0 0 1 0 .666l-4.88 3.252a.4.4 0 0 1-.621-.332V8.747a.4.4 0 0 1 .622-.332Z"/>',
  PAGE_ACCESS:
    '<path fill="currentColor" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10Zm-2.29-2.333A17.9 17.9 0 0 1 8.027 13H4.062a8.008 8.008 0 0 0 5.648 6.667ZM10.03 13c.151 2.439.848 4.73 1.97 6.752A15.905 15.905 0 0 0 13.97 13h-3.94Zm9.908 0h-3.965a17.9 17.9 0 0 1-1.683 6.667A8.008 8.008 0 0 0 19.938 13ZM4.062 11h3.965A17.9 17.9 0 0 1 9.71 4.333A8.008 8.008 0 0 0 4.062 11Zm5.969 0h3.938A15.905 15.905 0 0 0 12 4.248A15.905 15.905 0 0 0 10.03 11Zm4.259-6.667A17.9 17.9 0 0 1 15.973 11h3.965a8.008 8.008 0 0 0-5.648-6.667Z"/>',
  AI_PAGE_ACCESS:
    '<path fill="currentColor" d="M13.5 2c0 .444-.193.843-.5 1.118V5h5a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3h5V3.118A1.5 1.5 0 1 1 13.5 2ZM6 7a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H6Zm-4 3H0v6h2v-6Zm20 0h2v6h-2v-6ZM9 14.5a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3Zm6 0a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3Z"/>',
  URL_PARSE:
    '<path fill="currentColor" d="m18.364 15.535l-1.414-1.414l1.414-1.414a5 5 0 0 0-7.07-7.071L9.878 7.05L8.465 5.636l1.414-1.414a7 7 0 0 1 9.9 9.9l-1.415 1.413Zm-2.828 2.829l-1.414 1.414a7 7 0 1 1-9.9-9.9l1.414-1.414l1.415 1.414l-1.415 1.415a5 5 0 0 0 7.071 7.07l1.415-1.413l1.414 1.414Zm-.707-10.607l1.414 1.414l-7.071 7.072l-1.414-1.415l7.07-7.07Z"/>',
  DATA_PARSE:
    '<path fill="currentColor" d="m18.031 16.617l4.283 4.282l-1.415 1.415l-4.282-4.283A8.96 8.96 0 0 1 11 20c-4.968 0-9-4.032-9-9s4.032-9 9-9s9 4.032 9 9a8.96 8.96 0 0 1-1.969 5.617Zm-2.006-.742A6.977 6.977 0 0 0 18 11c0-3.867-3.133-7-7-7s-7 3.133-7 7s3.133 7 7 7a6.977 6.977 0 0 0 4.875-1.975l.15-.15Zm-3.847-8.699a2 2 0 1 0 2.646 2.646a4 4 0 1 1-2.646-2.646Z"/>',
  SAVE_RESULT:
    '<path fill="currentColor" d="M5 12.5c0 .313.461.858 1.53 1.393C7.914 14.585 9.877 15 12 15c2.123 0 4.086-.415 5.47-1.107c1.069-.535 1.53-1.08 1.53-1.393v-2.171C17.35 11.349 14.827 12 12 12s-5.35-.652-7-1.671V12.5Zm14 2.829C17.35 16.349 14.827 17 12 17s-5.35-.652-7-1.671V17.5c0 .313.461.858 1.53 1.393C7.914 19.585 9.877 20 12 20c2.123 0 4.086-.415 5.47-1.107c1.069-.535 1.53-1.08 1.53-1.393v-2.171ZM3 17.5v-10C3 5.015 7.03 3 12 3s9 2.015 9 4.5v10c0 2.485-4.03 4.5-9 4.5s-9-2.015-9-4.5Zm9-7.5c2.123 0 4.086-.415 5.47-1.107C18.538 8.358 19 7.813 19 7.5c0-.313-.461-.858-1.53-1.393C16.085 5.415 14.123 5 12 5c-2.123 0-4.086.415-5.47 1.107C5.461 6.642 5 7.187 5 7.5c0 .313.461.858 1.53 1.393C7.914 9.585 9.877 10 12 10Z"/>',
  ASYNC_SAVE:
    '<path fill="currentColor" d="M7 19v-6h10v6h2V7.828L16.172 5H5v14h2ZM4 3h13l4 4v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm5 12v4h6v-4H9Z"/>',
  CONDITION:
    '<path fill="currentColor" d="M7.105 15.21A3.001 3.001 0 1 1 5 15.17V8.83a3.001 3.001 0 1 1 2 0V12c.836-.628 1.874-1 3-1h4a3.001 3.001 0 0 0 2.895-2.21a3.001 3.001 0 1 1 2.032.064A5.002 5.002 0 0 1 14 13h-4a3.001 3.001 0 0 0-2.895 2.21ZM6 17a1 1 0 1 0 0 2a1 1 0 0 0 0-2ZM6 5a1 1 0 1 0 0 2a1 1 0 0 0 0-2Zm12 0a1 1 0 1 0 0 2a1 1 0 0 0 0-2Z"/>',
  DOWNLOADER:
    '<path fill="currentColor" d="M13 10h5l-6 6l-6-6h5V3h2v7Zm-9 9h16v-7h2v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-8h2v7Z"/>',
  HUMAN_INTERVENE:
    '<path fill="currentColor" d="m17.841 15.659l.176.177l.178-.177a2.25 2.25 0 1 1 3.181 3.182L18.018 22.2l-3.359-3.359a2.25 2.25 0 1 1 3.182-3.182ZM12 14v2a6 6 0 0 0-6 6H4a8 8 0 0 1 7.75-7.996L12 14Zm0-13c3.315 0 6 2.685 6 6a5.998 5.998 0 0 1-5.775 5.996L12 13c-3.315 0-6-2.685-6-6a5.998 5.998 0 0 1 5.775-5.996L12 1Zm0 2C9.79 3 8 4.79 8 7s1.79 4 4 4s4-1.79 4-4s-1.79-4-4-4Z"/>',
  SUB_FLOW:
    '<path fill="currentColor" d="M6 21.5A3.5 3.5 0 1 1 9.355 17H15v-2h2V9.242L14.757 7H9v2H3V3h6v2h5.757L18 1.756L22.243 6L19 9.241V15h2v6h-6v-2H9.355A3.502 3.502 0 0 1 6 21.5Zm0-5a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-5Zm13 .5h-2v2h2v-2ZM18 4.586L16.586 6L18 7.414L19.414 6L18 4.586ZM7 5H5v2h2V5Z"/>',
  STRUCTURE:
    '<path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2ZM0 12C0 5.37 5.37 0 12 0S24 5.37 24 12 18.63 24 12 24 0 18.63 0 12Zm4.24 2.14A8.1 8.1 0 0 1 12 4a8.1 8.1 0 0 1 7.76 6.14A10 10 0 0 0 12 2a10 10 0 0 0-7.76 12.14ZM12 22a10 10 0 0 0 7.76-12.14A8.1 8.1 0 0 1 12 20a8.1 8.1 0 0 1-7.76-6.14A10 10 0 0 0 12 22Z"/>',
  FALLBACK:
    '<path fill="currentColor" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12s4.477 10 10 10Z"/>',
};

function getIconSvg(iconName?: string): string {
  const body =
    iconName && ICON_SVGS[iconName] ? ICON_SVGS[iconName] : ICON_SVGS.FALLBACK;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">${body}</svg>`;
}

function onPaletteDragStart(kind: string, e: DragEvent) {
  e.dataTransfer?.setData("text/plain", kind);
}

function onCanvasDrop(e: DragEvent) {
  if (props.mode !== "edit") return;
  const kind = e.dataTransfer?.getData("text/plain");
  if (!kind) return;
  const canvasEl = canvasRef.value;
  if (!canvasEl) return;

  const rect = canvasEl.getBoundingClientRect();
  const size = getNodeSizeByKind(kind);
  const x = e.clientX - rect.left - size.width / 2;
  const y = e.clientY - rect.top - size.height / 2;

  emit("node-drop", {
    kind,
    position: { x, y },
  });
}

function onNodeDelete(nodeId: string) {
  emit("node-remove", nodeId);
}

function onNodeClick(node: RGNode, e: MouseEvent) {
  emit("node-click", node.id);
}

function onLineClick(line: RGLine, link: RGLink, e: MouseEvent) {
  emit("edge-click", line.id);
}

function onCanvasClick(e: MouseEvent) {
  emit("pane-click");
}

function onNodeDragEnd(node: RGNode, e: MouseEvent, x_buff: number, y_buff: number) {
  emit("node-moved", {
    nodeId: node.id,
    position: {
      x: node.x,
      y: node.y,
    },
  });
}

function onNodeDragging(node: RGNode, newX: number, newY: number, buffX: number, buffY: number, e: MouseEvent) {
  return { x: newX, y: newY };
}

function onReady(instance: any) {
  graphInstance.value = markRaw(instance);
}

function deleteSelected() {
  if (props.selectedNodeId) {
    emit("node-remove", props.selectedNodeId);
  }
}

function fitView() {
  nextTick(() => {
    graphInstance.value?.moveToCenter();
    graphInstance.value?.zoomToFit();
  });
}

defineExpose({ deleteSelected, fitView });
</script>

<style scoped>
.sc-relation-graph {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--fe-bg, var(--el-bg-color, #070b14));
}
.sc-relation-graph__sidebar {
  width: 220px;
  flex-shrink: 0;
  overflow-y: auto;
  border-right: 1px solid var(--el-border-color, #1e2a45);
  padding: 12px;
  background: var(--el-bg-color-overlay, #0f1525);
}
.palette-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin-bottom: 8px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--palette-color, #64748b) 18%, transparent);
  border: 1px solid color-mix(in srgb, var(--palette-color, #64748b) 35%, transparent);
  cursor: grab;
  user-select: none;
  transition: background 0.2s, border-color 0.2s, transform 0.15s;
}
.palette-item:hover {
  background: color-mix(in srgb, var(--palette-color, #64748b) 28%, transparent);
  border-color: color-mix(in srgb, var(--palette-color, #64748b) 55%, transparent);
  transform: translateY(-1px);
}
.palette-item--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
.palette-item__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--palette-color, #64748b) 25%, transparent);
  color: var(--palette-color, #64748b);
}
.palette-item__icon :deep(svg) {
  width: 16px;
  height: 16px;
}
.palette-item__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary, #e8edf5);
  line-height: 1.2;
}
.sc-relation-graph__canvas {
  flex: 1;
  min-width: 0;
  min-height: 0;
  position: relative;
}
.sc-relation-graph__canvas :deep(.rg-canvas) {
  background: transparent !important;
}
</style>
