<template>
  <div ref="containerRef" class="spider-flow-canvas-g6"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { Graph } from "@antv/g6";

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
  selectedNodeId?: string | null;
}>();

const emit = defineEmits<{
  (e: "node-click", nodeId: string): void;
  (e: "pane-click"): void;
}>();

const containerRef = ref<HTMLElement>();
let graph: Graph | null = null;
let resizeObserver: ResizeObserver | null = null;
let edgeAnimations: any[] = [];

// ── Theme ──
const TYPE_COLORS: Record<string, string> = {
  START: "#10b981",
  END: "#ef4444",
  PAGE_ACCESS: "#3b82f6",
  URL_PARSE: "#6366f1",
  DATA_PARSE: "#8b5cf6",
  SAVE_RESULT: "#14b8a6",
  CONDITION: "#f59e0b",
  DOWNLOADER: "#64748b",
  SUB_FLOW: "#06b6d4",
  HUMAN_INTERVENE: "#f97316",
};

const TYPE_ICONS: Record<string, string> = {
  START: "▶",
  END: "■",
  PAGE_ACCESS: "🌐",
  URL_PARSE: "🔗",
  DATA_PARSE: "🔍",
  SAVE_RESULT: "🗃",
  CONDITION: "⚙",
  DOWNLOADER: "⬇",
  SUB_FLOW: "📎",
  HUMAN_INTERVENE: "✏",
};

function getTypeColor(typeLabel?: string): string {
  return (typeLabel && TYPE_COLORS[typeLabel]) || "#6b7280";
}

function getTypeIcon(typeLabel?: string): string {
  return (typeLabel && TYPE_ICONS[typeLabel]) || "●";
}

function isCircleType(typeLabel?: string): boolean {
  return typeLabel === "START" || typeLabel === "END";
}

// ── Status ──
function getStatusColor(status?: string): string {
  switch (status) {
    case "SUCCESS": return "#22c55e";
    case "FAILED": return "#ef4444";
    case "WAIT_MANUAL": return "#eab308";
    case "RUNNING": return "#3b82f6";
    default: return "#d1d5db";
  }
}

function getEdgeStroke(status?: string, visited?: boolean): string {
  if (status === "RUNNING") return "#3b82f6";
  if (status === "SUCCESS" || visited) return "#22c55e";
  if (status === "FAILED") return "#ef4444";
  if (status === "WAIT_MANUAL") return "#eab308";
  return "#94a3b8";
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ── Builders ──
function buildCircleHtml(data: any, selected: boolean): string {
  const type = data.typeLabel || "";
  const color = getTypeColor(type);
  const icon = getTypeIcon(type);
  const label = data.label || "";
  const status = data.runtimeStatus || "";
  const isRunning = status === "RUNNING";
  const isSuccess = status === "SUCCESS";
  const isFailed = status === "FAILED";

  let borderColor = color;
  let statusClass = "";
  if (isRunning) { borderColor = "#3b82f6"; statusClass = " g6-circle--running"; }
  else if (isFailed) { borderColor = "#ef4444"; statusClass = " g6-circle--failed"; }
  else if (isSuccess) { borderColor = "#22c55e"; statusClass = " g6-circle--success"; }

  return `
    <div class="g6-circle${selected ? " g6-circle--selected" : ""}${statusClass}" style="--clr: ${color}; --bdr: ${borderColor};">
      <div class="g6-circle__inner">
        <span class="g6-circle__icon">${icon}</span>
      </div>
      <span class="g6-circle__label">${escapeHtml(label)}</span>
      ${isRunning ? '<div class="g6-circle__pulse"></div>' : ""}
    </div>
  `;
}

function buildRectHtml(data: any, selected: boolean): string {
  const type = data.typeLabel || "";
  const color = getTypeColor(type);
  const icon = getTypeIcon(type);
  const label = data.label || "";
  const status = data.runtimeStatus || "";
  const isRunning = status === "RUNNING";
  const isFailed = status === "FAILED";
  const isSuccess = status === "SUCCESS";
  const isWaitManual = status === "WAIT_MANUAL";
  const statusColor = getStatusColor(status);

  let borderColor = "#e2e8f0";
  let statusClass = "";
  if (selected) borderColor = "#3b82f6";
  else if (isRunning) { borderColor = "#3b82f6"; statusClass = " g6-rect--running"; }
  else if (isFailed) { borderColor = "#ef4444"; statusClass = " g6-rect--failed"; }
  else if (isSuccess) { borderColor = "#22c55e"; statusClass = " g6-rect--success"; }
  else if (isWaitManual) { borderColor = "#eab308"; statusClass = " g6-rect--wait-manual"; }

  const showDot = !!status && status !== "PENDING" && status !== "WAITING";

  return `
    <div class="g6-rect${selected ? " g6-rect--selected" : ""}${statusClass}" style="--clr: ${color}; --bdr: ${borderColor};">
      <div class="g6-rect__accent" style="background: ${color};"></div>
      <div class="g6-rect__body">
        <div class="g6-rect__row">
          <span class="g6-rect__icon">${icon}</span>
          <span class="g6-rect__title">${escapeHtml(label)}</span>
        </div>
        <span class="g6-rect__type">${escapeHtml(data.typeLabel || "")}</span>
      </div>
      ${showDot ? `<span class="g6-rect__dot" style="background: ${statusColor};"></span>` : ""}
      ${isRunning ? '<div class="g6-rect__pulse"></div>' : ""}
      ${isWaitManual ? '<div class="g6-rect__pulse g6-pulse--warning"></div>' : ""}
    </div>
  `;
}

// ── G6 ──
function initGraph() {
  if (!containerRef.value) return;
  destroyGraph();

  graph = new Graph({
    container: containerRef.value,
    width: containerRef.value.clientWidth,
    height: containerRef.value.clientHeight,
    autoResize: false,
    layout: {
      type: "dagre",
      rankdir: "TB",
      nodesep: 40,
      ranksep: 80,
    },
    node: {
      type: "html",
      style: {
        size: (d: any) => {
          const t = d.data?.typeLabel;
          return isCircleType(t) ? [60, 60] : [170, 52];
        },
        innerHTML: (d: any) => {
          const t = d.data?.typeLabel;
          const sel = d.data?.id === props.selectedNodeId;
          return isCircleType(t) ? buildCircleHtml(d.data, sel) : buildRectHtml(d.data, sel);
        },
      },
    },
    edge: {
      type: "line",
      style: {
        stroke: (d: any) => getEdgeStroke(d.data?.runtimeStatus, d.data?.visited),
        lineWidth: (d: any) => d.data?.runtimeStatus === "RUNNING" ? 3 : 2,
        lineDash: (d: any) => d.data?.runtimeStatus === "RUNNING" ? [6, 4] : undefined,
        endArrow: (d: any) => {
          const s = getEdgeStroke(d.data?.runtimeStatus, d.data?.visited);
          return { path: "M 0,0 L 8,4 L 0,8 Z", fill: s, stroke: "#fff", lineWidth: 0.5 };
        },
        radius: 12,
      },
    },
    behaviors: ["drag-canvas", "zoom-canvas"],
  });

  graph.on("node:click", (event: any) => {
    const id = event?.element?.id;
    if (id) emit("node-click", id);
  });

  graph.on("canvas:click", () => {
    emit("pane-click");
  });

  applyData();
  graph.render().then(() => startEdgeAnimations());
}

function applyData() {
  if (!graph) return;
  graph.setData({
    nodes: props.nodes.map((n) => ({
      id: n.id,
      data: n,
    })),
    edges: props.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      data: e,
    })),
  });
}

function stopEdgeAnimations() {
  for (const anim of edgeAnimations) {
    try { anim.cancel(); } catch { /* already done */ }
  }
  edgeAnimations = [];
}

function startEdgeAnimations() {
  stopEdgeAnimations();
  if (!graph || graph.destroyed) return;

  for (const edge of props.edges) {
    if (edge.runtimeStatus !== "RUNNING") continue;
    try {
      const element = (graph as any).context.element.getElement(edge.id);
      if (!element) continue;
      const keyShape = element.getShape("key");
      if (!keyShape || typeof keyShape.animate !== "function") continue;
      const anim = keyShape.animate(
        [{ lineDashOffset: 0 }, { lineDashOffset: -30 }],
        { duration: 800, iterations: Infinity, easing: "linear" },
      );
      edgeAnimations.push(anim);
    } catch {
      // element not yet created or already destroyed
    }
  }
}

function destroyGraph() {
  stopEdgeAnimations();
  if (graph) {
    graph.destroy();
    graph = null;
  }
}

watch(
  () => [props.nodes.length, props.edges.length, [...props.nodes.map((n) => n.runtimeStatus), ...props.edges.map((e) => e.runtimeStatus)].join(",")],
  () => {
    if (!graph || graph.destroyed) return;
    applyData();
    graph.render().then(() => startEdgeAnimations());
  },
);

watch(
  () => props.selectedNodeId,
  () => {
    if (!graph || graph.destroyed) return;
    graph.render();
  },
);

onMounted(() => {
  nextTick(() => initGraph());
  if (containerRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (graph && !graph.destroyed && width > 0 && height > 0) {
          graph.resize(width, height);
        }
      }
    });
    resizeObserver.observe(containerRef.value);
  }
});

onBeforeUnmount(() => {
  destroyGraph();
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});
</script>

<style scoped>
.spider-flow-canvas-g6 {
  width: 100%;
  height: 100%;
  min-height: 500px;
  background: var(--spider-canvas-bg, #f1f5f9);
  border-radius: 16px;
  overflow: hidden;
}

/* ═══════════════════════════════════════
   Circle nodes (START / END)
   ═══════════════════════════════════════ */
:deep(.g6-circle) {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(145deg, var(--clr), color-mix(in srgb, var(--clr) 75%, #000));
  border: 3px solid var(--bdr, var(--clr));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: border-color 0.3s, box-shadow 0.3s;
  box-shadow: 0 3px 10px rgba(0,0,0,0.12);
  box-sizing: border-box;
}

:deep(.g6-circle--selected) {
  box-shadow: 0 0 0 3px rgba(59,130,246,0.3), 0 4px 14px rgba(0,0,0,0.18) !important;
  border-color: #3b82f6 !important;
}

:deep(.g6-circle--running) {
  border-color: #3b82f6;
  border-width: 4px;
  box-shadow: 0 0 0 4px rgba(59,130,246,0.2), 0 3px 10px rgba(0,0,0,0.12);
}

:deep(.g6-circle--success) {
  border-color: #22c55e;
  border-width: 4px;
  box-shadow: 0 0 0 4px rgba(34,197,94,0.2), 0 3px 10px rgba(0,0,0,0.12);
}

:deep(.g6-circle--failed) {
  border-color: #ef4444;
  border-width: 4px;
  box-shadow: 0 0 0 4px rgba(239,68,68,0.2), 0 3px 10px rgba(0,0,0,0.12);
}

:deep(.g6-circle__inner) {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -2px;
}

:deep(.g6-circle__icon) {
  font-size: 14px;
  line-height: 1;
  color: #fff;
}

:deep(.g6-circle__label) {
  font-size: 9px;
  font-weight: 600;
  color: #fff;
  margin-top: 2px;
  white-space: nowrap;
  letter-spacing: 0.3px;
}

:deep(.g6-circle__pulse) {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  pointer-events: none;
  animation: g6-pulse-circle 1.5s ease-in-out infinite;
}

/* ═══════════════════════════════════════
   Rect nodes (all other types)
   ═══════════════════════════════════════ */
:deep(.g6-rect) {
  display: flex;
  width: 170px;
  height: 52px;
  border-radius: 10px;
  background: #fff;
  border: 2px solid var(--bdr, #e2e8f0);
  overflow: hidden;
  cursor: pointer;
  position: relative;
  transition: border-color 0.3s, box-shadow 0.3s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  box-sizing: border-box;
}

:deep(.g6-rect--selected) {
  border-color: #3b82f6 !important;
  border-width: 2.5px !important;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.15), 0 2px 8px rgba(59,130,246,0.1) !important;
}

/* ── Status border overrides ── */
:deep(.g6-rect--running) {
  border-color: #3b82f6;
  border-width: 3px;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.2), 0 1px 4px rgba(0,0,0,0.06);
}

:deep(.g6-rect--success) {
  border-color: #22c55e;
  border-width: 3px;
  box-shadow: 0 0 0 3px rgba(34,197,94,0.2), 0 1px 4px rgba(0,0,0,0.06);
}

:deep(.g6-rect--failed) {
  border-color: #ef4444;
  border-width: 3px;
  box-shadow: 0 0 0 3px rgba(239,68,68,0.2), 0 1px 4px rgba(0,0,0,0.06);
}

:deep(.g6-rect--wait-manual) {
  border-color: #eab308;
  border-width: 3px;
  box-shadow: 0 0 0 3px rgba(234,179,8,0.2), 0 1px 4px rgba(0,0,0,0.06);
}

:deep(.g6-rect__accent) {
  width: 4px;
  flex-shrink: 0;
}

:deep(.g6-rect__body) {
  flex: 1;
  padding: 6px 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

:deep(.g6-rect__row) {
  display: flex;
  align-items: center;
  gap: 6px;
}

:deep(.g6-rect__icon) {
  font-size: 13px;
  line-height: 1;
  flex-shrink: 0;
}

:deep(.g6-rect__title) {
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.g6-rect__type) {
  font-size: 10px;
  font-weight: 500;
  color: #94a3b8;
  margin-top: 1px;
  padding-left: 0;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

:deep(.g6-rect__dot) {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid #fff;
  z-index: 2;
  transition: background 0.3s;
}

:deep(.g6-rect__pulse) {
  position: absolute;
  inset: -3px;
  border-radius: 12px;
  pointer-events: none;
  animation: g6-pulse-rect 1.5s ease-in-out infinite;
}

:deep(.g6-pulse--warning) {
  animation: g6-pulse-warning 2s ease-in-out infinite;
}

/* ═══════════════════════════════════════
   Hover effects
   ═══════════════════════════════════════ */
:deep(.g6-circle:hover) {
  transform: scale(1.05);
  box-shadow: 0 4px 14px rgba(0,0,0,0.18);
}

:deep(.g6-rect:hover) {
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

/* ═══════════════════════════════════════
   Selected node status overrides
   ═══════════════════════════════════════ */
:deep(.g6-circle--selected .g6-circle__label) {
  color: #fff;
}

:deep(.g6-rect--selected .g6-rect__title) {
  color: #1e293b;
}

/* ── Hover over status nodes ── */
:deep(.g6-rect--success:hover) {
  box-shadow: 0 0 0 4px rgba(34,197,94,0.3), 0 2px 8px rgba(34,197,94,0.15) !important;
}
:deep(.g6-rect--failed:hover) {
  box-shadow: 0 0 0 4px rgba(239,68,68,0.3), 0 2px 8px rgba(239,68,68,0.15) !important;
}
:deep(.g6-rect--wait-manual:hover) {
  box-shadow: 0 0 0 4px rgba(234,179,8,0.3), 0 2px 8px rgba(234,179,8,0.15) !important;
}
:deep(.g6-rect--running:hover) {
  box-shadow: 0 0 0 4px rgba(59,130,246,0.3), 0 2px 8px rgba(59,130,246,0.15) !important;
}
</style>

<style>
@keyframes g6-pulse-circle {
  0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.3); }
  50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); }
}

@keyframes g6-pulse-rect {
  0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.25); }
  50% { box-shadow: 0 0 0 6px rgba(59, 130, 246, 0); }
}

@keyframes g6-pulse-warning {
  0%, 100% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.3); }
  50% { box-shadow: 0 0 0 6px rgba(234, 179, 8, 0); }
}

@keyframes g6-dot-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.7; }
}
</style>
