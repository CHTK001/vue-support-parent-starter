<template>
  <section
    class="flow-editor"
    :class="`flow-editor--${mode}`"
  >
    <!-- 顶部工具栏 -->
    <FlowEditorHeader
      :mode="mode"
      title="工作流编辑器"
      :show-right-panel="showRightPanel"
      :show-bottom-panel="showBottomPanel"
      :show-minimap="showMinimap"
      :saving="saving"
      :last-save-time="lastSaveTime"
      @toggle-right-panel="showRightPanel = !showRightPanel"
      @toggle-bottom-panel="showBottomPanel = !showBottomPanel"
      @toggle-minimap="showMinimap = !showMinimap"
      @save="emit('save')"
      @auto-layout="onAutoLayout"
    />

    <div class="flow-editor__body">
      <!-- 左侧栏（可折叠） -->
      <div v-if="showPalette" class="flow-editor__sidebar-wrap" :class="{ 'flow-editor__sidebar-wrap--collapsed': sidebarCollapsed }" :style="{ width: sidebarCollapsed ? '0px' : sidebarWidth + 'px' }">
        <slot name="sidebar" :mode="mode" :palette="palette" :workflows="workflows" :active-workflow-id="activeWorkflowId">
          <FlowEditorSidebar
            :mode="mode"
            :palette="palette"
            :workflows="workflows"
            :active-workflow-id="activeWorkflowId"
            @select-workflow="emit('select-workflow', $event)"
            @create-workflow="emit('create-workflow')"
            @import-workflow="emit('import-workflow')"
            @export-workflow="emit('export-workflow')"
          />
        </slot>
      </div>
      <!-- 侧栏折叠触发按钮（浮动在边界上） -->
      <button
        v-if="showPalette"
        class="flow-editor__fold-trigger flow-editor__fold-trigger--sidebar"
        :class="{ 'flow-editor__fold-trigger--collapsed': sidebarCollapsed }"
        :style="{ left: sidebarCollapsed ? '0px' : sidebarWidth + 'px' }"
        @click="sidebarCollapsed = !sidebarCollapsed"
        :title="sidebarCollapsed ? '展开侧栏' : '折叠侧栏'"
      >
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
          <path v-if="!sidebarCollapsed" d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path v-else d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <!-- 画布区域 -->
      <div class="flow-editor__center">
        <div ref="canvasWrapRef" class="flow-editor__canvas-wrap" @dragover.prevent @drop.prevent="onCanvasDrop">
          <!-- LogicFlow 容器 -->
          <div ref="lfContainerRef" class="flow-editor__canvas lf-graph-custom" />

          <!-- 浮动工具栏（右上角） -->
          <div v-if="showToolbar" class="fe-toolbar" :class="[`fe-toolbar--${toolbarPosition}`, `fe-toolbar--${toolbarOrientation}`]">
            <!-- 缩放 -->
            <div class="fe-toolbar__group">
              <button class="fe-toolbar__btn" @click="zoomOut" title="缩小">
                <svg viewBox="0 0 16 16" width="15" height="15" fill="none"><path d="M3 8h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
              </button>
              <span class="fe-toolbar__zoom-text">{{ zoomPercent }}%</span>
              <button class="fe-toolbar__btn" @click="zoomIn" title="放大">
                <svg viewBox="0 0 16 16" width="15" height="15" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
              </button>
              <button class="fe-toolbar__btn" @click="fitView" title="适应画布">
                <svg viewBox="0 0 16 16" width="15" height="15" fill="none"><path d="M2 4V2h2M14 4V2h-2M2 12v2h2M14 12v2h-2M5 8h6M8 5v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              </button>
            </div>

            <div class="fe-toolbar__divider" />

            <!-- 显示 -->
            <div class="fe-toolbar__group">
              <button class="fe-toolbar__btn" :class="{ 'fe-toolbar__btn--active': showMinimap }" @click="showMinimap = !showMinimap" title="小地图">
                <svg viewBox="0 0 16 16" width="15" height="15" fill="none"><rect x="1.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="9.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="1.5" y="9.5" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="9.5" y="9.5" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/></svg>
              </button>
              <button class="fe-toolbar__btn" @click="toggleFullscreen" title="全屏">
                <svg viewBox="0 0 16 16" width="15" height="15" fill="none"><path d="M2 6V3h3M11 3h3v3M2 10v3h3M11 13h3v-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>
          </div>

          <!-- 右侧折叠时展开按钮 -->
          <button
            v-if="!showRightPanel && (selectedNode || selectedEdge)"
            class="flow-editor__fold-trigger flow-editor__fold-trigger--props-closed"
            @click="showRightPanel = true"
            title="打开属性面板"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
              <path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <!-- 编辑提示 -->
          <div v-if="mode === 'edit'" class="flow-editor__edit-hint">
            拖拽端口连线 · 双击边删除 · Del 键删除节点
          </div>
        </div>

        <!-- 底部日志面板 -->
        <div
          v-if="showBottomPanel"
          class="flow-editor__log-wrap"
          :style="{ height: logPanelHeight + 'px' }"
        >
          <div
            class="flow-editor__resize-handle flow-editor__resize-handle--h"
            @mousedown.prevent="onLogResizeStart"
          />
          <FlowEditorLogPanel :logs="logs" @clear="emit('log-clear')" />
        </div>
      </div>

      <!-- 右侧属性面板（flex 布局，非 overlay） -->
      <Transition name="props-fade">
        <div v-if="showRightPanel && (selectedNode || selectedEdge)" class="flow-editor__props-wrap">
          <button class="flow-editor__fold-trigger flow-editor__fold-trigger--props" @click="onPropsClose" title="折叠属性面板">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
              <path d="M11 3l-5 5 5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <slot name="property-panel" :node="selectedNode" :edge="selectedEdge" :close="onPropsClose">
            <div class="fe-props__inner">
              <FlowEditorProperties
                :node="selectedNode"
                :edge="selectedEdge"
                @close="onPropsClose"
                @update:node="onPropsUpdate"
                @update:edge="onEdgeUpdate"
              />
              <div v-if="$slots['property-panel-bottom']" class="fe-props__custom-section">
                <slot name="property-panel-bottom" :node="selectedNode" :edge="selectedEdge" :close="onPropsClose" />
              </div>
            </div>
          </slot>
        </div>
      </Transition>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick, shallowRef } from "vue";
import LogicFlow from "@logicflow/core";
import "@logicflow/core/dist/index.css";
import FlowEditorHeader from "./FlowEditorHeader.vue";
import FlowEditorSidebar from "./FlowEditorSidebar.vue";
import FlowEditorProperties from "./FlowEditorProperties.vue";
import FlowEditorLogPanel from "./FlowEditorLogPanel.vue";
import type { LogEntry } from "./FlowEditorLogPanel.vue";
import type { WorkflowItem } from "./FlowEditorSidebar.vue";
import { registerAllNodes, getLfNodeType, getNodeSize } from "./FlowEditorNodeDefs";
import { registerEdge } from "./FlowEditorEdgeDef";

// ── Types ──
export interface FlowEditorPaletteItem {
  kind: string;
  title: string;
  detail?: string;
  color?: string;
  icon?: string;
  disabled?: boolean;
}

export interface FlowEditorNode {
  id: string;
  type?: 'flow-rect' | 'flow-circle' | 'flow-diamond' | 'flow-subflow' | 'flow-image';
  label: string;
  icon?: string;
  kind?: string;
  position: { x: number; y: number };
  runtimeStatus?: string;
  displayInfo?: string;
  errorMessage?: string;
  containerSize?: [number, number];
  htmlContent?: string;
  imageUrl?: string;
}

export interface FlowEditorEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  visited?: boolean;
  runtimeStatus?: string;
}

export interface AutoLayoutPosition {
  nodeId: string;
  position: { x: number; y: number };
}

// ── Props ──
const props = withDefaults(defineProps<{
  mode?: "preview" | "edit";
  nodes: FlowEditorNode[];
  edges: FlowEditorEdge[];
  palette?: FlowEditorPaletteItem[];
  palettePosition?: "left" | "right";
  paletteDisplayMode?: "list" | "icon";
  sidebarWidth?: number;
  selectedNodeId?: string | null;
  selectedEdgeId?: string | null;
  edgeType?: "line" | "polyline";
  nodeResizable?: boolean;
  nodeRotatable?: boolean;
  showToolbar?: boolean;
  toolbarPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  toolbarOrientation?: "horizontal" | "vertical";
  workflows?: WorkflowItem[];
  activeWorkflowId?: string | null;
  logs?: LogEntry[];
  saving?: boolean;
  lastSaveTime?: string;
}>(), {
  mode: "preview",
  palettePosition: "left",
  paletteDisplayMode: "list",
  sidebarWidth: 220,
  selectedNodeId: null,
  selectedEdgeId: null,
  edgeType: "line",
  nodeResizable: true,
  nodeRotatable: true,
  showToolbar: true,
  toolbarPosition: "top-left",
  toolbarOrientation: "horizontal",
  saving: false,
  lastSaveTime: "",
  logs: () => [],
  workflows: () => [],
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
  (e: "edge-update", payload: { edgeId: string; data: Partial<FlowEditorEdge> }): void;
  (e: "save"): void;
  (e: "select-workflow", id: string): void;
  (e: "create-workflow"): void;
  (e: "import-workflow"): void;
  (e: "export-workflow"): void;
  (e: "log-clear"): void;
  (e: "apply-layout", positions: AutoLayoutPosition[]): void;
}>();

// ── Panel state ──
const sidebarCollapsed = ref(false);
const showRightPanel = ref(false);
const showBottomPanel = ref(false);
const showMinimap = ref(true);
const logPanelHeight = ref(180);
const isResizingLog = ref(false);

// ── Toolbar state ──
const zoomPercent = ref(100);

// ── Computed ──
const showPalette = computed(() => props.mode === "edit" && props.palette && props.palette.length > 0);
const readonly = computed(() => props.mode === "preview");

const selectedNode = computed(() => {
  if (!props.selectedNodeId) return null;
  return props.nodes.find(n => n.id === props.selectedNodeId) || null;
});

const selectedEdge = computed(() => {
  if (!props.selectedEdgeId) return null;
  return props.edges.find(e => e.id === props.selectedEdgeId) || null;
});

// ── LogicFlow ──
const lfContainerRef = ref<HTMLElement>();
const canvasWrapRef = ref<HTMLElement>();
const lfRef = shallowRef<LogicFlow | null>(null);
let skipNextRender = false;
let initTimer: ReturnType<typeof setTimeout> | null = null;

function buildGraphData() {
  const lfNodes = props.nodes.map(n => {
    const lfType = n.type || getLfNodeType(n.kind);
    const [w, h] = getNodeSize(lfType, n.containerSize);
    return {
      id: n.id,
      type: lfType,
      x: n.position.x + w / 2,
      y: n.position.y + h / 2,
      properties: {
        label: n.label || "",
        kind: n.kind || "",
        runtimeStatus: n.runtimeStatus || "",
        icon: n.icon || "",
        displayInfo: n.displayInfo || "",
        errorMessage: n.errorMessage || "",
        mode: props.mode,
        containerSize: n.containerSize,
        htmlContent: n.htmlContent || "",
        imageUrl: n.imageUrl || "",
      },
    };
  });

  const lfEdges = props.edges.map(e => ({
    id: e.id,
    type: "flow-edge",
    sourceNodeId: e.source,
    targetNodeId: e.target,
    text: e.label ? { value: e.label } : undefined,
    properties: {
      runtimeStatus: e.runtimeStatus || "",
      visited: e.visited || false,
      label: e.label || "",
    },
  }));

  return { nodes: lfNodes, edges: lfEdges };
}

function renderGraph() {
  const lf = lfRef.value;
  if (!lf) return;
  const data = buildGraphData();
  lf.clearData();
  lf.render(data);
}

function renderGraphAndFit() {
  const lf = lfRef.value;
  if (!lf) return;
  const data = buildGraphData();
  lf.clearData();
  lf.render(data);
  setTimeout(() => lf.fitView({ vertical: true, horizontal: true }), 50);
}

onMounted(() => {
  if (!lfContainerRef.value) return;

  const lf = new LogicFlow({
    container: lfContainerRef.value,
    width: "100%",
    height: "100%",
    background: { color: "#070b14" },
    // 网格点样式使用 CSS radial-gradient 实现，避免 LogicFlow SVG pattern 的 NaN 问题
    isSilentMode: props.mode === "preview",
    stopScrollGraph: false,
    stopZoomGraph: false,
    style: {
      rect: { stroke: "transparent" },
      circle: { stroke: "transparent" },
      polygon: { stroke: "transparent" },
      text: { fill: "#e8edf5" },
      edgeText: { fill: "#fbbf24" },
      edge: { stroke: "#94a3b8" },
    },
    edgeTextEdit: false,
    nodeTextEdit: false,
    hideAnchors: props.mode === "preview",
    adjustEdge: false,
  });

  // 注册自定义节点和边
  registerAllNodes(lf, { resizable: props.nodeResizable, rotatable: props.nodeRotatable });
  registerEdge(lf, props.edgeType === "line");

  // ── 事件绑定 ──
  lf.on("node:click", ({ data }: any) => {
    emit("node-click", data.id);
  });

  lf.on("edge:click", ({ data }: any) => {
    emit("edge-click", data.id);
  });

  lf.on("blank:click", () => {
    emit("pane-click");
  });

  lf.on("node:drop", ({ data }: any) => {
    const model = lf.getNodeModelById(data.id);
    if (!model) return;
    skipNextRender = true;
    emit("node-moved", {
      nodeId: data.id,
      position: {
        x: data.x - model.width / 2,
        y: data.y - model.height / 2,
      },
    });
  });

  lf.on("connection:add", ({ data }: any) => {
    if (data.sourceNodeId && data.targetNodeId) {
      skipNextRender = true;
      emit("edge-create", {
        source: data.sourceNodeId,
        target: data.targetNodeId,
      });
    }
  });

  lf.on("custom:node-remove", ({ nodeId }: any) => {
    if (nodeId) {
      lf.deleteNode(nodeId);
      skipNextRender = true;
      emit("node-remove", nodeId);
    }
  });

  lf.on("node:delete", ({ data }: any) => {
    skipNextRender = true;
    emit("node-remove", data.id);
  });

  lf.on("edge:delete", ({ data }: any) => {
    skipNextRender = true;
    emit("edge-remove", data.id);
  });

  lfRef.value = lf;

  // 渲染初始数据
  renderGraphAndFit();
});

// ── Watch props ──
watch([() => props.nodes, () => props.edges], () => {
  if (skipNextRender || !lfRef.value) {
    skipNextRender = false;
    return;
  }
  renderGraph();
}, { deep: true });

// ── Watch mode ──
watch(() => props.mode, (newMode) => {
  const lf = lfRef.value;
  if (!lf) return;
  const isSilent = newMode === "preview";
  lf.updateEditConfig({
    isSilentMode: isSilent,
    hideAnchors: isSilent,
  });
  // 更新所有节点的 mode 属性以切换删除按钮显示
  props.nodes.forEach(n => {
    lf.setProperties(n.id, { mode: newMode });
  });
});

// ── Watch selectedNodeId ──
watch(() => props.selectedNodeId, (newId) => {
  if (newId && !showRightPanel.value) {
    showRightPanel.value = true;
  }
});

// ── Watch selectedEdgeId ──
watch(() => props.selectedEdgeId, (newId) => {
  if (newId && !showRightPanel.value) {
    showRightPanel.value = true;
  }
});

// ── Canvas Drop (from palette) ──
function onCanvasDrop(e: DragEvent) {
  if (props.mode !== "edit") return;
  const kind = e.dataTransfer?.getData("text/plain");
  if (!kind) return;
  const lf = lfRef.value;
  if (!lf) return;

  const point = lf.graphModel.getPointByClient({ x: e.clientX, y: e.clientY });
  const lfType = getLfNodeType(kind);
  const [w, h] = getNodeSize(lfType);

  // 发出 top-left 位置给父组件
  emit("node-drop", {
    kind,
    position: { x: point.x - w / 2, y: point.y - h / 2 },
  });
}

// ── Property panel ──
function onPropsClose() {
  showRightPanel.value = false;
  emit("pane-click");
}

function onPropsUpdate(payload: { nodeId: string; data: Partial<FlowEditorNode> }) {
  const node = props.nodes.find(n => n.id === payload.nodeId);
  emit("node-moved", {
    nodeId: payload.nodeId,
    position: payload.data.position || node?.position || { x: 0, y: 0 },
  });
}

function onEdgeUpdate(payload: { edgeId: string; data: Partial<FlowEditorEdge> }) {
  emit("edge-update", payload);
}

// ── Log panel resize ──
function onLogResizeStart(e: MouseEvent) {
  isResizingLog.value = true;
  const startY = e.clientY;
  const startH = logPanelHeight.value;
  function onMove(ev: MouseEvent) {
    const dy = startY - ev.clientY;
    logPanelHeight.value = Math.max(80, Math.min(500, startH + dy));
  }
  function onUp() {
    isResizingLog.value = false;
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
  }
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
}

// ── Keyboard ──
function onKeyDown(e: KeyboardEvent) {
  if ((e.key === "Delete" || e.key === "Backspace") && props.selectedNodeId && props.mode === "edit") {
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
    e.preventDefault();
    emit("node-remove", props.selectedNodeId);
  }
}

onMounted(() => {
  window.addEventListener("keydown", onKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeyDown);
  if (lfRef.value) {
    lfRef.value.clearData();
    lfRef.value = null;
  }
  if (initTimer) clearTimeout(initTimer);
});

// ── Auto layout ──
function onAutoLayout() {
  if (props.nodes.length === 0) return;

  // Build adjacency graph
  const children = new Map<string, string[]>();
  const parents = new Map<string, string[]>();
  const allIds = new Set(props.nodes.map(n => n.id));
  for (const id of allIds) { children.set(id, []); parents.set(id, []); }
  for (const edge of props.edges) {
    if (children.has(edge.source) && allIds.has(edge.target)) {
      children.get(edge.source)!.push(edge.target);
      parents.get(edge.target)!.push(edge.source);
    }
  }

  // Find root nodes: START type or nodes with no incoming edges
  const startIds = props.nodes
    .filter(n => n.kind === 'START' || (parents.get(n.id)?.length === 0))
    .map(n => n.id);
  if (startIds.length === 0 && props.nodes.length > 0) startIds.push(props.nodes[0].id);

  // BFS assign layers
  const layer = new Map<string, number>();
  const queue: string[] = [];
  for (const sid of startIds) { layer.set(sid, 0); queue.push(sid); }
  while (queue.length > 0) {
    const cur = queue.shift()!;
    const curLayer = layer.get(cur) ?? 0;
    for (const child of children.get(cur) || []) {
      const existing = layer.get(child);
      if (existing === undefined || existing < curLayer + 1) {
        layer.set(child, curLayer + 1);
        queue.push(child);
      }
    }
  }
  for (const id of allIds) { if (!layer.has(id)) layer.set(id, 0); }

  // Group by layer
  const layerGroups = new Map<number, string[]>();
  for (const [id, l] of layer) {
    if (!layerGroups.has(l)) layerGroups.set(l, []);
    layerGroups.get(l)!.push(id);
  }
  const sortedLayers = [...layerGroups.entries()].sort((a, b) => a[0] - b[0]);

  // Compute positions
  const spacingX = 260, spacingY = 100;
  const startX = 60, startY = 180;
  const positions: AutoLayoutPosition[] = [];

  for (const [layerIndex, nodeIds] of sortedLayers) {
    const count = nodeIds.length;
    const totalH = (count - 1) * spacingY;
    const baseY = startY - totalH / 2;
    for (let i = 0; i < count; i++) {
      positions.push({
        nodeId: nodeIds[i],
        position: { x: startX + layerIndex * spacingX, y: baseY + i * spacingY },
      });
    }
  }

  emit("apply-layout", positions);
}

// ── Expose ──
function deleteSelected() {
  if (props.selectedNodeId) emit("node-remove", props.selectedNodeId);
}
function fitView() {
  const lf = lfRef.value;
  if (lf) {
    lf.fitView({ vertical: true, horizontal: true });
    zoomPercent.value = Math.round((lf.graphModel.transform.zoom || 1) * 100);
  }
}

// ── Toolbar ──
function zoomIn() {
  const lf = lfRef.value;
  if (!lf) return;
  const cur = lf.graphModel.transform.zoom || 1;
  const next = Math.min(cur + 0.15, 3);
  lf.zoom(next);
  zoomPercent.value = Math.round(next * 100);
}
function zoomOut() {
  const lf = lfRef.value;
  if (!lf) return;
  const cur = lf.graphModel.transform.zoom || 1;
  const next = Math.max(cur - 0.15, 0.2);
  lf.zoom(next);
  zoomPercent.value = Math.round(next * 100);
}
function toggleFullscreen() {
  const el = canvasWrapRef.value?.closest('.flow-editor');
  if (!el) return;
  if (!document.fullscreenElement) {
    el.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}
defineExpose({ deleteSelected, fitView, zoomIn, zoomOut, toggleFullscreen });
</script>

<style>
/* ═══════════════════════════════════════════
   FlowEditor 基础样式 (原 .vf- → .lf-)
   包含所有自定义节点和边的全局样式
   ═══════════════════════════════════════════ */
.flow-editor {
  --fe-bg: var(--el-bg-color, #070b14);
  --fe-surface: var(--el-fill-color, #0b0f1a);
  --fe-border: var(--el-border-color, #1e2a45);
  --fe-text: var(--el-text-color-primary, #e8edf5);
  --fe-text-secondary: var(--el-text-color-secondary, #8892a8);
  --fe-text-muted: var(--el-text-color-placeholder, #5a6478);
  --fe-accent: var(--el-color-primary, #3b82f6);
  --fe-accent-light: var(--el-color-primary-light-3, #60a5fa);
}

.flow-editor {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--fe-bg);
  color: var(--fe-text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.flow-editor__body {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
  position: relative;
}

.flow-editor__center {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.flow-editor__canvas-wrap {
  flex: 1;
  min-height: 0;
  height: 0;
  position: relative;
  background: var(--fe-bg);
}

.flow-editor__canvas {
  width: 100%;
  height: 100%;
  min-height: 200px;
  display: flex;
  /* CSS 网格点背景，替代 LogicFlow grid（避免 SVG pattern NaN） */
  background-image: radial-gradient(circle, #1e2a45 1px, transparent 1px);
  background-size: 20px 20px;
}

.flow-editor__canvas > div {
  width: 100%;
  height: 100%;
}

/* ── LogicFlow 覆盖主题 ── */
.lf-graph-custom .lf-graph {
  background: transparent !important;
  height: 100% !important;
}

/* ── Minimap (LogicFlow 原生) ── */
/* 使用 @logicflow/extension 的 MiniMap 需要额外配置 */

/* ── 预览模式隐藏锚点 ── */
.flow-editor--preview .lf-node-anchor {
  display: none !important;
}

/* ── 编辑提示 ── */
.flow-editor__edit-hint {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 14px;
  background: color-mix(in srgb, var(--el-bg-color, #070b14) 85%, transparent);
  backdrop-filter: blur(8px);
  border: 1px solid var(--el-border-color, #1e2a45);
  border-radius: 6px;
  font-size: 11px;
  color: var(--el-text-color-placeholder, #5a6478);
  white-space: nowrap;
  z-index: 10;
  pointer-events: none;
}

/* ── Resize handles ── */
.flow-editor__resize-handle {
  position: absolute;
  z-index: 50;
  transition: background 0.15s;
}
.flow-editor__resize-handle--h {
  top: -3px;
  left: 0;
  right: 0;
  height: 6px;
  cursor: ns-resize;
}
.flow-editor__resize-handle--h:hover {
  background: color-mix(in srgb, var(--el-color-primary) 30%, transparent);
}
.flow-editor__resize-handle--v {
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: ew-resize;
}
.flow-editor__resize-handle--v:hover {
  background: color-mix(in srgb, var(--el-color-primary) 30%, transparent);
}

/* ── Log wrap ── */
.flow-editor__log-wrap {
  position: relative;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.flow-editor__log-wrap > .fe-log {
  flex: 1;
  min-height: 0;
}

/* ── Property panel (flex 布局) ── */
.flow-editor__props-wrap {
  width: 280px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
  background: var(--el-bg-color-overlay, #0f1525);
  border-left: 1px solid var(--el-border-color, #1e2a45);
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.4);
  position: relative;
}

.fe-props__inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.fe-props__custom-section {
  border-top: 1px solid var(--el-border-color, #1e2a45);
  overflow-y: auto;
  flex-shrink: 0;
}

.props-fade-enter-active,
.props-fade-leave-active {
  transition: all 0.25s ease;
}
.props-fade-enter-from,
.props-fade-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* ── Sidebar wrapper ── */
.flow-editor__sidebar-wrap {
  min-width: 0;
  display: flex;
  position: relative;
  flex-shrink: 0;
  contain: layout paint;
  overflow: hidden;
  transition: width 0.25s ease;
  border-right: 1px solid var(--el-border-color, #1e2a45);
}
.flow-editor__sidebar-wrap--collapsed {
  min-width: 0;
  border-right: none;
  contain: layout paint;
  overflow: hidden;
}

.flow-editor__fold-trigger {
  z-index: 20;
  width: 20px;
  height: 28px;
  border: 1px solid var(--el-border-color, #1e2a45);
  background: var(--el-bg-color-overlay, #0f1525);
  color: var(--el-text-color-secondary, #8892a8);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s, background 0.15s;
  padding: 0;
  outline: none;
}
.flow-editor__fold-trigger:hover {
  color: var(--el-color-primary, #3b82f6);
  background: color-mix(in srgb, var(--el-bg-color-overlay) 92%, var(--el-color-primary));
}
.flow-editor__fold-trigger--sidebar {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  border-radius: 0 6px 6px 0;
  border-left: none;
  margin-left: -1px;
  z-index: 25;
}
.flow-editor__fold-trigger--sidebar.flow-editor__fold-trigger--collapsed {
  border-radius: 0 6px 6px 0;
  border-left: 1px solid var(--el-border-color, #1e2a45);
  margin-left: -1px;
}
.flow-editor__fold-trigger--props {
  position: absolute;
  top: 50%;
  right: -10px;
  transform: translateY(-50%);
  border-radius: 0 6px 6px 0;
  border-left: none;
  z-index: 35;
}
.flow-editor__fold-trigger--props-closed {
  position: absolute;
  top: 8px;
  right: 0;
  border-radius: 6px;
}

/* ═══════════════════════════════════════════
   RECT 节点样式 (原 FlowNodeRect.vue)
   ═══════════════════════════════════════════ */
.lf-rect {
  display: flex; align-items: stretch;
  width: 210px; height: 60px;
  border-radius: 14px;
  background: var(--fe-surface, var(--el-fill-color, #0f1525));
  border: 2px solid var(--bdr, var(--clr, var(--el-border-color, #1e2a45)));
  overflow: visible;
  cursor: pointer;
  position: relative;
  transition: border-color 0.3s, box-shadow 0.3s, transform 0.15s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  box-sizing: border-box;
}
.lf-rect::before {
  content: '';
  position: absolute; left: 0; top: 2px; bottom: 2px;
  width: 4px;
  background: var(--clr, #3b82f6);
  border-radius: 10px 0 0 10px;
}
.lf-rect:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.12); }

.lf-rect .lf-node--selected { border-color: var(--el-color-primary, #3b82f6) !important; border-width: 2.5px !important; box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 18%, transparent), 0 4px 16px color-mix(in srgb, var(--el-color-primary) 12%, transparent) !important; }
.lf-node--running { border-color: var(--el-color-primary, #3b82f6); border-width: 3px; box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-color-primary) 20%, transparent), 0 2px 8px rgba(0,0,0,0.08); animation: lf-node-breath 1.2s ease-in-out infinite; }
.lf-node--success { border-color: var(--el-color-success, #22c55e); border-width: 3px; box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-color-success) 20%, transparent), 0 2px 8px rgba(0,0,0,0.08); }
.lf-node--failed { border-color: var(--el-color-danger, #ef4444); border-width: 3px; box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-color-danger) 20%, transparent), 0 2px 8px rgba(0,0,0,0.08); }
.lf-node--wait-manual { border-color: var(--el-color-warning, #eab308); border-width: 3px; box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-color-warning) 20%, transparent), 0 2px 8px rgba(0,0,0,0.08); animation: lf-node-wait-manual 1.6s ease-in-out infinite; }

.lf-rect__body {
  flex: 1;
  padding: 0 14px 0 18px;
  display: flex; align-items: center; gap: 10px;
  min-width: 0;
}
.lf-rect__icon-wrap {
  width: 32px; height: 32px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.lf-rect__icon { font-size: 16px; line-height: 1; color: var(--clr, #3b82f6); display: flex; }
.lf-rect__info {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 2px;
}
.lf-rect__title { font-size: 13px; font-weight: 600; color: var(--fe-text, var(--el-text-color-primary, #e8edf5)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lf-rect__type { font-size: 10px; font-weight: 600; color: var(--fe-text-muted, var(--el-text-color-placeholder, #5a6478)); letter-spacing: 0.5px; text-transform: uppercase; }
.lf-rect__spinner { display: none; width: 16px; height: 16px; border: 2px solid color-mix(in srgb, var(--el-color-primary) 20%, transparent); border-top-color: var(--el-color-primary, #3b82f6); border-radius: 50%; animation: lf-spin 0.7s linear infinite; }
.lf-node--running .lf-rect__icon { display: none; }
.lf-node--running .lf-rect__spinner { display: inline-block; }
.lf-node--wait-manual .lf-rect__icon { display: none; }
.lf-node--wait-manual .lf-rect__spinner { display: inline-block; border-top-color: var(--el-color-warning, #eab308); border-color: color-mix(in srgb, var(--el-color-warning) 25%, transparent); animation-duration: 0.9s; }

.lf-rect__dot {
  position: absolute; top: -5px; right: -5px;
  width: 10px; height: 10px; border-radius: 50%;
  border: 2px solid var(--el-bg-color, #fff); z-index: 2;
  transition: background 0.3s;
}

.lf-rect__tooltip {
  position: absolute; bottom: calc(100% + 10px); left: 50%; transform: translateX(-50%);
  padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 600;
  white-space: nowrap; max-width: 300px; overflow: hidden; text-overflow: ellipsis;
  pointer-events: none; box-shadow: 0 3px 10px rgba(0,0,0,0.15); line-height: 1.4; z-index: 100;
  display: none; background: var(--clr, #3b82f6); color: #fff;
}
.lf-node--success .lf-rect__tooltip { display: none; }
.lf-rect:hover .lf-rect__tooltip { display: block; }
.lf-node--success:hover .lf-rect__tooltip { display: block; background: var(--el-color-success, #22c55e); }
.lf-tooltip--has-error { background: var(--el-color-danger, #ef4444) !important; color: var(--el-color-white, #fff) !important; }

.lf-rect__pulse { display: none; position: absolute; inset: -3px; border-radius: 16px; pointer-events: none; animation: lf-pulse-rect 1.5s ease-in-out infinite; }
.lf-pulse--warning { animation: lf-pulse-warning 2s ease-in-out infinite; }
.lf-node--running .lf-rect__pulse { display: block; }

/* ── 删除按钮 ── */
.lf-node__del {
  display: none; position: absolute; top: -8px; right: -8px;
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--el-color-danger, #ef4444); color: var(--el-color-white, #fff);
  border: 2px solid var(--el-bg-color, #fff);
  cursor: pointer; z-index: 20;
  font-size: 12px; font-weight: 700; line-height: 1;
  align-items: center; justify-content: center;
  padding: 0; box-shadow: 0 2px 6px rgba(239,68,68,0.35);
  transition: transform 0.15s, box-shadow 0.15s;
}
.lf-rect:hover .lf-node__del { display: flex; }
.lf-circle:hover .lf-node__del { display: flex; }
.lf-diamond:hover .lf-node__del { display: flex; }
.lf-subflow:hover .lf-node__del { display: flex; }
.lf-node__del:hover { transform: scale(1.2); box-shadow: 0 3px 10px rgba(239,68,68,0.5); }

.lf-node-anchor {
  width: 8px !important; height: 8px !important;
  border: 2px solid var(--fe-border, var(--el-border-color, #1e2a45)) !important;
  background: var(--fe-accent, var(--el-color-primary, #3b82f6)) !important;
  transition: transform 0.15s;
}
.lf-node-anchor:hover { transform: scale(1.4); }

/* ═══════════════════════════════════════════
   CIRCLE 节点样式 (START/END)
   ═══════════════════════════════════════════ */
.lf-circle {
  width: 60px; height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, color-mix(in srgb, var(--clr) 92%, #fff), var(--clr));
  border: 3px solid var(--bdr, var(--clr));
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  cursor: pointer; position: relative;
  transition: border-color 0.3s, box-shadow 0.3s, transform 0.15s;
  box-shadow: 0 3px 12px color-mix(in srgb, var(--clr, #3b82f6) 25%, transparent);
  box-sizing: border-box;
}
.lf-circle.lf-node--selected {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 30%, transparent), 0 4px 16px rgba(0,0,0,0.18) !important;
  border-color: var(--el-color-primary, #3b82f6) !important;
}
.lf-circle.lf-node--running {
  border-color: var(--el-color-primary, #3b82f6); border-width: 4px;
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-color-primary) 25%, transparent);
  animation: lf-node-breath 1.2s ease-in-out infinite;
}
.lf-circle.lf-node--success { border-color: var(--el-color-success, #22c55e); border-width: 4px; box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-color-success) 25%, transparent); }
.lf-circle.lf-node--failed { border-color: var(--el-color-danger, #ef4444); border-width: 4px; box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-color-danger) 25%, transparent); }
.lf-circle:hover { transform: scale(1.08); box-shadow: 0 6px 20px rgba(0,0,0,0.18); }

.lf-circle__inner { width: 28px; height: 28px; border-radius: 50%; background: color-mix(in srgb, var(--el-bg-color, #fff) 25%, transparent); display: flex; align-items: center; justify-content: center; }
.lf-circle__icon { font-size: 15px; line-height: 1; color: var(--el-color-white, #fff); display: flex; }
.lf-circle__label { font-size: 9px; font-weight: 600; color: var(--el-color-white, #fff); margin-top: 2px; white-space: nowrap; letter-spacing: 0.3px; }
.lf-circle__spinner { display: none; width: 18px; height: 18px; border: 2.5px solid color-mix(in srgb, var(--el-color-white, #fff) 30%, transparent); border-top-color: var(--el-color-white, #fff); border-radius: 50%; animation: lf-spin 0.7s linear infinite; }
.lf-circle.lf-node--running .lf-circle__icon { display: none; }
.lf-circle.lf-node--running .lf-circle__spinner { display: inline-block; }
.lf-circle__pulse { display: none; position: absolute; inset: -4px; border-radius: 50%; pointer-events: none; animation: lf-pulse-circle 1.5s ease-in-out infinite; }
.lf-circle.lf-node--running .lf-circle__pulse { display: block; }

/* ═══════════════════════════════════════════
   DIAMOND 节点样式 (CONDITION)
   ═══════════════════════════════════════════ */
.lf-diamond {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  width: 140px; height: 120px; cursor: pointer; position: relative; box-sizing: border-box;
}
.lf-diamond__shell { position: relative; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; }
.lf-diamond__body {
  width: 64px; height: 64px; transform: rotate(45deg); border-radius: 14px;
  background: var(--fe-surface, var(--el-fill-color, #0f1525));
  border: 2.5px solid var(--bdr, var(--clr, #f59e0b));
  box-shadow: 0 4px 16px color-mix(in srgb, var(--clr, #f59e0b) 12%, transparent);
  display: flex; align-items: center; justify-content: center;
  transition: border-color 0.3s, box-shadow 0.3s, transform 0.15s; box-sizing: border-box;
}
.lf-diamond:hover .lf-diamond__body { transform: rotate(45deg) scale(1.03); }
.lf-diamond.lf-node--selected .lf-diamond__body {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 25%, transparent), 0 4px 16px color-mix(in srgb, var(--el-color-primary) 14%, transparent) !important;
  border-color: var(--el-color-primary, #3b82f6) !important;
}
.lf-diamond.lf-node--running .lf-diamond__body {
  border-color: var(--el-color-primary, #3b82f6); border-width: 3px;
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-color-primary) 20%, transparent);
  animation: lf-node-breath 1.2s ease-in-out infinite;
}
.lf-diamond.lf-node--success .lf-diamond__body { border-color: var(--el-color-success, #22c55e); border-width: 3px; box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-color-success) 20%, transparent); }
.lf-diamond.lf-node--failed .lf-diamond__body { border-color: var(--el-color-danger, #ef4444); border-width: 3px; box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-color-danger) 20%, transparent); }
.lf-diamond.lf-node--wait-manual .lf-diamond__body { border-color: var(--el-color-warning, #eab308); border-width: 3px; box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-color-warning) 20%, transparent); }

.lf-diamond__icon {
  font-size: 20px; line-height: 1;
  transform: rotate(-45deg);
  color: var(--clr, #f59e0b);
  display: flex;
}
.lf-diamond__spinner {
  display: none; width: 18px; height: 18px;
  border: 2.5px solid color-mix(in srgb, var(--el-color-warning) 25%, transparent); border-top-color: var(--el-color-warning, #f59e0b);
  border-radius: 50%; animation: lf-spin 0.7s linear infinite;
  transform: rotate(-45deg);
}
.lf-diamond.lf-node--running .lf-diamond__icon { display: none; }
.lf-diamond.lf-node--running .lf-diamond__spinner { display: inline-block; }
.lf-diamond.lf-node--wait-manual .lf-diamond__icon { display: none; }
.lf-diamond.lf-node--wait-manual .lf-diamond__spinner { display: inline-block; border-top-color: var(--el-color-warning, #eab308); border-color: color-mix(in srgb, var(--el-color-warning) 25%, transparent); animation-duration: 0.9s; }

.lf-diamond__label {
  font-size: 10px; font-weight: 700; color: var(--fe-text, var(--el-text-color-primary, #e8edf5));
  text-align: center; line-height: 1.2; margin-top: 6px;
  max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.lf-diamond__pulse { display: none; position: absolute; top: -2px; left: 50%; transform: translateX(-50%); width: 76px; height: 76px; border-radius: 50%; pointer-events: none; animation: lf-pulse-diamond 1.5s ease-in-out infinite; }
.lf-diamond.lf-node--running .lf-diamond__pulse { display: block; }

/* ═══════════════════════════════════════════
   SUBFLOW 节点样式
   ═══════════════════════════════════════════ */
.lf-subflow {
  display: flex; flex-direction: column;
  width: 100%; height: 100%;
  border-radius: 14px;
  border: 2px dashed var(--bdr, #99f6e4);
  overflow: visible; cursor: pointer;
  position: relative;
  transition: border-color 0.3s, box-shadow 0.3s, transform 0.15s;
  box-shadow: 0 2px 8px color-mix(in srgb, #06b6d4 10%, transparent);
  box-sizing: border-box;
  background: var(--fe-surface, var(--el-fill-color, #0b0f1a));
}
.lf-subflow:hover { transform: translateY(-1px); box-shadow: 0 4px 16px color-mix(in srgb, #06b6d4 15%, transparent); }
.lf-subflow.lf-node--selected {
  border-color: var(--el-color-primary, #3b82f6) !important; border-style: solid !important;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 18%, transparent), 0 4px 16px color-mix(in srgb, #06b6d4 15%, transparent) !important;
}
.lf-subflow.lf-node--running {
  border-color: var(--el-color-primary, #3b82f6); border-style: solid; border-width: 2.5px;
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-color-primary) 20%, transparent);
  animation: lf-node-breath 1.2s ease-in-out infinite;
}
.lf-subflow.lf-node--success { border-color: var(--el-color-success, #22c55e); border-style: solid; border-width: 2.5px; }
.lf-subflow.lf-node--failed { border-color: var(--el-color-danger, #ef4444); border-style: solid; border-width: 2.5px; }
.lf-subflow.lf-node--wait-manual { border-color: var(--el-color-warning, #eab308); border-style: solid; border-width: 2.5px; animation: lf-node-wait-manual 1.6s ease-in-out infinite; }

.lf-subflow__container { display: flex; flex-direction: column; width: 100%; height: 100%; }
.lf-subflow__header {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid color-mix(in srgb, #06b6d4 15%, transparent);
  flex-shrink: 0;
}
.lf-subflow__icon { font-size: 15px; line-height: 1; flex-shrink: 0; display: flex; color: #06b6d4; }
.lf-subflow__spinner { display: none; width: 16px; height: 16px; border: 2px solid color-mix(in srgb, #06b6d4 20%, transparent); border-top-color: #06b6d4; border-radius: 50%; animation: lf-spin 0.7s linear infinite; flex-shrink: 0; }
.lf-subflow.lf-node--running .lf-subflow__icon { display: none; }
.lf-subflow.lf-node--running .lf-subflow__spinner { display: inline-block; }
.lf-subflow__title {
  font-size: 13px; font-weight: 600; color: var(--el-text-color-primary, #155e75);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;
}
.lf-subflow__badge {
  font-size: 9px; font-weight: 700; color: var(--el-color-white, #fff); background: #06b6d4;
  padding: 2px 8px; border-radius: 6px; letter-spacing: 0.5px; text-transform: uppercase; flex-shrink: 0;
}
.lf-subflow__body { flex: 1; display: flex; align-items: center; justify-content: center; min-height: 40px; }
.lf-subflow__label { font-size: 11px; font-weight: 500; color: color-mix(in srgb, #06b6d4 50%, transparent); letter-spacing: 0.5px; }

/* ── 图片节点 ── */
.lf-image {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  border: 2px solid var(--bdr, var(--clr, #a855f7));
  background: rgba(0,0,0,0.3);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}
.lf-image:hover { transform: translateY(-1px); box-shadow: 0 4px 16px color-mix(in srgb, #a855f7 15%, transparent); }
.lf-image.lf-node--selected { border-color: var(--el-color-primary, #3b82f6) !important; border-width: 2.5px !important; box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 18%, transparent), 0 4px 16px color-mix(in srgb, var(--el-color-primary) 12%, transparent) !important; }
.lf-image.lf-node--running { border-color: var(--el-color-primary, #3b82f6); box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-primary) 20%, transparent); }
.lf-image.lf-node--success { border-color: var(--el-color-success, #22c55e); }
.lf-image.lf-node--failed { border-color: var(--el-color-danger, #ef4444); }
.lf-image.lf-node--wait-manual { border-color: var(--el-color-warning, #eab308); animation: lf-node-wait-manual 1.6s ease-in-out infinite; }
.lf-image__container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  min-height: 0;
}
.lf-image__img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
.lf-image__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: color-mix(in srgb, #a855f7 45%, transparent);
  font-size: 11px;
  font-weight: 500;
}
.lf-image__title {
  display: block;
  padding: 4px 8px;
  font-size: 10px;
  font-weight: 600;
  color: var(--fe-text-muted, var(--el-text-color-placeholder, #5a6478));
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-top: 1px solid color-mix(in srgb, var(--el-border-color) 20%, transparent);
  background: rgba(0,0,0,0.15);
}
.lf-image:hover .lf-node__del { display: flex; }

/* ── 边动画 ── */
.lf-edge-animation {
  stroke-dashoffset: 100%;
  animation: lf-edge-dash 5s linear infinite;
}
@keyframes lf-edge-dash {
  to { stroke-dashoffset: 0; }
}

/* ── 通用动画关键帧 ── */
@keyframes lf-spin { to { transform: rotate(360deg); } }
@keyframes lf-node-breath {
  0%, 100% { box-shadow: 0 0 0 3px rgba(59,130,246,0.2), 0 0 12px rgba(59,130,246,0.15); }
  50% { box-shadow: 0 0 0 6px rgba(59,130,246,0.35), 0 0 24px rgba(59,130,246,0.25); }
}
@keyframes lf-node-wait-manual {
  0%, 100% { box-shadow: 0 0 0 3px rgba(234,179,8,0.15), 0 0 10px rgba(234,179,8,0.08); }
  50% { box-shadow: 0 0 0 6px rgba(234,179,8,0.3), 0 0 20px rgba(234,179,8,0.18); }
}
@keyframes lf-pulse-rect {
  0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.25); }
  50% { box-shadow: 0 0 0 6px rgba(59,130,246,0); }
}
@keyframes lf-pulse-warning {
  0%, 100% { box-shadow: 0 0 0 0 rgba(234,179,8,0.35); }
  50% { box-shadow: 0 0 0 10px rgba(234,179,8,0); }
}
@keyframes lf-pulse-circle {
  0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--el-color-primary) 30%, transparent); }
  50% { box-shadow: 0 0 0 8px color-mix(in srgb, var(--el-color-primary) 0%, transparent); }
}
@keyframes lf-pulse-diamond {
  0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--el-color-primary) 25%, transparent); }
  50% { box-shadow: 0 0 0 8px color-mix(in srgb, var(--el-color-primary) 0%, transparent); }
}

/* ═══════════════════════════════════════════
   浮动工具栏 (画布右上角)
   ═══════════════════════════════════════════ */
.fe-toolbar {
  position: absolute;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 6px;
  background: color-mix(in srgb, var(--el-bg-color-overlay, #0f1525) 92%, transparent);
  backdrop-filter: blur(12px);
  border: 1px solid var(--el-border-color, #1e2a45);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  user-select: none;
  pointer-events: auto;
  transition: opacity 0.2s;
}

/* 四角定位 */
.fe-toolbar--top-left { top: 12px; left: 12px; }
.fe-toolbar--top-right { top: 12px; right: 12px; }
.fe-toolbar--bottom-left { bottom: 12px; left: 12px; }
.fe-toolbar--bottom-right { bottom: 12px; right: 12px; }

/* 垂直方向 */
.fe-toolbar--vertical { flex-direction: column; }

.fe-toolbar__group {
  display: flex;
  align-items: center;
  gap: 1px;
}

.fe-toolbar__btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--el-text-color-secondary, #8892a8);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  padding: 0;
}

.fe-toolbar__btn:hover {
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  color: var(--el-text-color-primary, #e8edf5);
  border-color: color-mix(in srgb, var(--el-color-primary) 20%, transparent);
}

.fe-toolbar__btn--active {
  background: color-mix(in srgb, var(--el-color-primary) 18%, transparent);
  color: var(--el-color-primary-light-3, #60a5fa);
  border-color: color-mix(in srgb, var(--el-color-primary) 30%, transparent);
}

.fe-toolbar__zoom-text {
  min-width: 34px;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-secondary, #8892a8);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.2px;
}

.fe-toolbar__divider {
  width: 1px;
  height: 18px;
  background: var(--el-border-color, #1e2a45);
  margin: 0 4px;
  flex-shrink: 0;
}
</style>
