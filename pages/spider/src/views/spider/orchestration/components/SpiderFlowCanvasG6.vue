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
  (e: "node-moved", payload: { nodeId: string; position: { x: number; y: number } }): void;
}>();

const containerRef = ref<HTMLElement>();
let graph: Graph | null = null;
let resizeObserver: ResizeObserver | null = null;
let edgeAnimations: any[] = [];
let domClickHandler: ((e: MouseEvent) => void) | null = null;

// ── Theme ──
const TYPE_COLORS: Record<string, string> = {
  START: "#10b981",
  END: "#ef4444",
  PAGE_ACCESS: "#3b82f6",
  URL_PARSE: "#6366f1",
  DATA_PARSE: "#8b5cf6",
  SAVE_RESULT: "#14b8a6",
  ASYNC_SAVE: "#0891b2",
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
  ASYNC_SAVE: "💾",
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

function isDiamondType(typeLabel?: string): boolean {
  return typeLabel === "CONDITION";
}

function isSubFlowType(typeLabel?: string): boolean {
  return typeLabel === "SUB_FLOW";
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
  if (visited) return "#22c55e";
  if (status === "RUNNING") return "#3b82f6";
  if (status === "SUCCESS") return "#22c55e";
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
  const nodeId = data.id || "";
  const isRunning = status === "RUNNING";
  const isSuccess = status === "SUCCESS";
  const isFailed = status === "FAILED";

  let borderColor = color;
  let statusClass = "";
  if (isRunning) { borderColor = "#3b82f6"; statusClass = " g6-circle--running"; }
  else if (isFailed) { borderColor = "#ef4444"; statusClass = " g6-circle--failed"; }
  else if (isSuccess) { borderColor = "#22c55e"; statusClass = " g6-circle--success"; }

  const iconHtml = isRunning ? '<span class="g6-circle__spinner"></span>' : `<span class="g6-circle__icon">${icon}</span>`;

  return `
    <div class="g6-circle${selected ? " g6-circle--selected" : ""}${statusClass}" style="--clr: ${color}; --bdr: ${borderColor};" data-node-id="${escapeHtml(nodeId)}">
      <div class="g6-circle__inner">
        ${iconHtml}
      </div>
      <span class="g6-circle__label">${escapeHtml(label)}</span>
      ${isRunning ? '<div class="g6-circle__pulse"></div>' : ""}
    </div>
  `;
}

function buildSubFlowHtml(data: any, selected: boolean): string {
  const color = "#06b6d4";
  const icon = "📎";
  const label = data.label || "";
  const nodeId = data.id || "";
  const status = data.runtimeStatus || "";
  const isRunning = status === "RUNNING";
  const isFailed = status === "FAILED";
  const isSuccess = status === "SUCCESS";
  const isWaitManual = status === "WAIT_MANUAL";
  const statusColor = getStatusColor(status);

  let borderColor = "#99f6e4";
  let statusClass = "";
  if (selected) borderColor = "#3b82f6";
  else if (isRunning) { borderColor = "#3b82f6"; statusClass = " g6-subflow--running"; }
  else if (isFailed) { borderColor = "#ef4444"; statusClass = " g6-subflow--failed"; }
  else if (isSuccess) { borderColor = "#22c55e"; statusClass = " g6-subflow--success"; }
  else if (isWaitManual) { borderColor = "#eab308"; statusClass = " g6-subflow--wait-manual"; }

  const showDot = !!status && status !== "PENDING" && status !== "WAITING";

  return `
    <div class="g6-subflow${selected ? " g6-subflow--selected" : ""}${statusClass}" style="--clr: ${color}; --bdr: ${borderColor};" data-node-id="${escapeHtml(nodeId)}">
      <div class="g6-subflow__container">
        <div class="g6-subflow__header">
          ${isRunning ? '<span class="g6-rect__spinner"></span>' : isWaitManual ? '<span class="g6-rect__spinner g6-rect__spinner--warn"></span>' : `<span class="g6-subflow__icon">${icon}</span>`}
          <span class="g6-subflow__title">${escapeHtml(label)}</span>
          <span class="g6-subflow__badge">SUB</span>
        </div>
        <div class="g6-subflow__body">
          <span class="g6-subflow__label">子流程容器</span>
        </div>
      </div>
      ${showDot ? `<span class="g6-rect__dot" style="background: ${statusColor};"></span>` : ""}
      ${isRunning ? '<div class="g6-rect__pulse"></div>' : ""}
      ${isWaitManual ? '<div class="g6-rect__pulse g6-pulse--warning"></div>' : ""}
    </div>
  `;
}

function buildRectHtml(data: any, selected: boolean): string {
  // SUB_FLOW nodes get a larger container appearance
  if (isSubFlowType(data.typeLabel)) {
    return buildSubFlowHtml(data, selected);
  }
  const type = data.typeLabel || "";
  const color = getTypeColor(type);
  const icon = getTypeIcon(type);
  const label = data.label || "";
  const nodeId = data.id || "";
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
    <div class="g6-rect${selected ? " g6-rect--selected" : ""}${statusClass}" style="--clr: ${color}; --bdr: ${borderColor};" data-node-id="${escapeHtml(nodeId)}">
      <div class="g6-rect__accent" style="background: ${color};"></div>
      <div class="g6-rect__body">
        <div class="g6-rect__row">
          ${isRunning ? '<span class="g6-rect__spinner"></span>' : isWaitManual ? '<span class="g6-rect__spinner g6-rect__spinner--warn"></span>' : `<span class="g6-rect__icon">${icon}</span>`}
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

function buildDiamondHtml(data: any, selected: boolean): string {
  const type = data.typeLabel || "";
  const color = getTypeColor(type);
  const icon = getTypeIcon(type);
  const label = data.label || "";
  const nodeId = data.id || "";
  const status = data.runtimeStatus || "";
  const isRunning = status === "RUNNING";
  const isFailed = status === "FAILED";
  const isSuccess = status === "SUCCESS";
  const isWaitManual = status === "WAIT_MANUAL";

  let borderColor = color;
  let statusClass = "";
  if (selected) { borderColor = "#3b82f6"; statusClass = " g6-diamond--selected"; }
  else if (isRunning) { borderColor = "#3b82f6"; statusClass = " g6-diamond--running"; }
  else if (isFailed) { borderColor = "#ef4444"; statusClass = " g6-diamond--failed"; }
  else if (isSuccess) { borderColor = "#22c55e"; statusClass = " g6-diamond--success"; }
  else if (isWaitManual) { borderColor = "#eab308"; statusClass = " g6-diamond--wait-manual"; }

  return `
    <div class="g6-diamond${selected ? " g6-diamond--selected" : ""}${statusClass}" style="--clr: ${color}; --bdr: ${borderColor};" data-node-id="${escapeHtml(nodeId)}">
      <div class="g6-diamond__shell">
        <div class="g6-diamond__body">
          ${isRunning ? '<span class="g6-diamond__spinner"></span>' : `<span class="g6-diamond__icon">${icon}</span>`}
        </div>
      </div>
      <span class="g6-diamond__label">${escapeHtml(label)}</span>
      ${isRunning ? '<div class="g6-diamond__pulse"></div>' : ""}
      ${isWaitManual ? '<div class="g6-diamond__pulse g6-pulse--warning"></div>' : ""}
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
    node: {
      type: "html",
      style: {
        size: (d: any) => {
          const t = d.data?.typeLabel;
          if (d.data?.containerSize) return d.data.containerSize;
          if (isCircleType(t)) return [60, 60];
          if (isDiamondType(t)) return [140, 120];
          return [170, 52];
        },
        innerHTML: (d: any) => {
          const t = d.data?.typeLabel;
          const sel = d.data?.id === props.selectedNodeId;
          if (isCircleType(t)) return buildCircleHtml(d.data, sel);
          if (isDiamondType(t)) return buildDiamondHtml(d.data, sel);
          return buildRectHtml(d.data, sel);
        },
      },
    },
    edge: {
      type: "line",
      style: {
        stroke: (d: any) => getEdgeStroke(d.data?.runtimeStatus, d.data?.visited),
        lineWidth: (d: any) => d.data?.runtimeStatus === "RUNNING" || d.data?.runtimeStatus === "WAIT_MANUAL" ? 3 : 2,
        lineDash: (d: any) => d.data?.runtimeStatus === "RUNNING" || d.data?.runtimeStatus === "WAIT_MANUAL" ? [8, 5] : undefined,
        lineDashOffset: 0,
        endArrow: (d: any) => {
          const s = getEdgeStroke(d.data?.runtimeStatus, d.data?.visited);
          return { path: "M 0,0 L 8,4 L 0,8 Z", fill: s, stroke: "#fff", lineWidth: 0.5 };
        },
        radius: 12,
      },
    },
    behaviors: ["drag-canvas", "zoom-canvas", "drag-element"],
  });

  graph.on("node:dragstart", (event: any) => {
    const id = event?.target?.id;
    if (!id) return;

    // 找到所属的 SUB_FLOW 容器节点
    const containerNode = props.nodes.find(n =>
      n.type === "SUB_FLOW" && (n.id === id || id.startsWith(`${n.id}_`))
    );
    if (!containerNode || !isSubFlowType(containerNode.typeLabel)) return;

    const parentData = graph!.getNodeData(containerNode.id);
    if (!parentData) return;

    // 记录所有子节点（含容器本身）的起始位置
    const childIds = props.nodes
      .filter(n => n.id.startsWith(`${containerNode.id}_`))
      .map(n => n.id);

    // 用实际被拖拽的节点计算位移（子节点在 DOM 层之上，容器本身不会被 drag-element 直接拖拽）
    const draggedData = graph!.getNodeData(id);
    if (!draggedData) return;

    const childStartPositions = new Map<string, { x: number; y: number }>();
    for (const childId of childIds) {
      const childData = graph!.getNodeData(childId);
      if (childData) {
        childStartPositions.set(childId, {
          x: childData.x ?? childData.style?.x ?? 0,
          y: childData.y ?? childData.style?.y ?? 0,
        });
      }
    }

    (graph as any).__subflowDragState = {
      parentId: containerNode.id,
      draggedChildId: id,
      startParentX: parentData.x ?? parentData.style?.x ?? 0,
      startParentY: parentData.y ?? parentData.style?.y ?? 0,
      startChildX: draggedData.x ?? draggedData.style?.x ?? 0,
      startChildY: draggedData.y ?? draggedData.style?.y ?? 0,
      childStartPositions,
    };
  });

  graph.on("node:drag", (event: any) => {
    const dragState = (graph as any).__subflowDragState;
    if (!dragState) return;

    // 以被拖拽的子节点当前位置计算位移
    const draggedData = graph!.getNodeData(dragState.draggedChildId);
    if (!draggedData) return;

    const cx = draggedData.x ?? draggedData.style?.x ?? 0;
    const cy = draggedData.y ?? draggedData.style?.y ?? 0;
    const dx = cx - dragState.startChildX;
    const dy = cy - dragState.startChildY;
    if (dx === 0 && dy === 0) return;

    const updates = [
      { id: dragState.parentId, style: { x: dragState.startParentX + dx, y: dragState.startParentY + dy } },
      ...Array.from(dragState.childStartPositions.entries()).map(([childId, startPos]) => ({
        id: childId,
        style: { x: startPos.x + dx, y: startPos.y + dy },
      })),
    ];

    graph!.updateNodeData(updates);
    graph!.draw();
  });

  graph.on("node:dragend", (event: any) => {
    delete (graph as any).__subflowDragState;

    const id = event?.target?.id;
    if (id) {
      const pos = graph?.getNodeData(id);
      if (pos) {
        emit("node-moved", { nodeId: id, position: { x: pos.x || pos.style?.x, y: pos.y || pos.style?.y } });
      }
    }
  });

  applyData();
  graph.render().then(() => {
    graph.fitView();
    startEdgeAnimations();
    // DOM click delegation for HTML nodes (G6 canvas events don't fire for DOM clicks on HTML elements)
    if (containerRef.value && !domClickHandler) {
      domClickHandler = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const nodeEl = target.closest("[data-node-id]") as HTMLElement | null;
        if (nodeEl?.dataset?.nodeId) {
          // Click animation: add class, remove after animation
          nodeEl.classList.add("g6-node--clicked");
          setTimeout(() => nodeEl.classList.remove("g6-node--clicked"), 400);
          emit("node-click", nodeEl.dataset.nodeId);
        } else {
          emit("pane-click");
        }
      };
      containerRef.value.addEventListener("click", domClickHandler);
    }
  });
}

function applyData() {
  if (!graph) return;
  graph.setData({
    nodes: props.nodes.map((n) => ({
      id: n.id,
      data: n,
      style: { x: n.position.x, y: n.position.y },
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

  // Build set of RUNNING node IDs — only animate edges targeting a running node
  const runningNodeIds = new Set(
    props.nodes.filter(n => n.runtimeStatus === "RUNNING").map(n => n.id)
  );

  for (const edge of props.edges) {
    if (edge.runtimeStatus !== "RUNNING" && edge.runtimeStatus !== "WAIT_MANUAL") continue;
    // Only animate the edge whose target is a RUNNING node (the "active" traversal edge)
    // This prevents multiple edges from animating simultaneously during execution/replay
    if (!runningNodeIds.has(edge.target)) continue;
    try {
      const element = (graph as any).context.element.getElement(edge.id);
      if (!element) continue;
      const keyShape = element.getShape("key");
      if (!keyShape || typeof keyShape.animate !== "function") continue;
      const anim = keyShape.animate(
        [{ lineDashOffset: -30 }, { lineDashOffset: 0 }],
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
  if (containerRef.value && domClickHandler) {
    containerRef.value.removeEventListener("click", domClickHandler);
    domClickHandler = null;
  }
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
    graph.render().then(() => {
      startEdgeAnimations();
      graph.fitView();
    });
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
  z-index: 2;
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
  animation: g6-node-running-breath 1.2s ease-in-out infinite;
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
   Diamond nodes (CONDITION)
   ═══════════════════════════════════════ */
:deep(.g6-diamond) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 140px;
  height: 120px;
  cursor: pointer;
  position: relative;
  z-index: 2;
  box-sizing: border-box;
}

:deep(.g6-diamond__shell) {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.g6-diamond__body) {
  width: 64px;
  height: 64px;
  transform: rotate(45deg);
  border-radius: 14px;
  background: color-mix(in srgb, var(--clr, #f59e0b) 18%, #fff);
  border: 2.5px solid var(--bdr, var(--clr, #f59e0b));
  box-shadow: 0 4px 14px rgba(0,0,0,0.10);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.3s, box-shadow 0.3s;
  box-sizing: border-box;
}

:deep(.g6-diamond--selected .g6-diamond__body) {
  box-shadow: 0 0 0 3px rgba(59,130,246,0.25), 0 4px 14px rgba(0,0,0,0.14) !important;
  border-color: #3b82f6 !important;
}

:deep(.g6-diamond--running .g6-diamond__body) {
  border-color: #3b82f6;
  border-width: 3px;
  box-shadow: 0 0 0 4px rgba(59,130,246,0.2);
  animation: g6-node-running-breath 1.2s ease-in-out infinite;
}

:deep(.g6-diamond--success .g6-diamond__body) {
  border-color: #22c55e;
  border-width: 3px;
  box-shadow: 0 0 0 4px rgba(34,197,94,0.2);
}

:deep(.g6-diamond--failed .g6-diamond__body) {
  border-color: #ef4444;
  border-width: 3px;
  box-shadow: 0 0 0 4px rgba(239,68,68,0.2);
}

:deep(.g6-diamond--wait-manual .g6-diamond__body) {
  border-color: #eab308;
  border-width: 3px;
  box-shadow: 0 0 0 4px rgba(234,179,8,0.2);
}

:deep(.g6-diamond__icon) {
  font-size: 18px;
  line-height: 1;
  transform: rotate(-45deg);
  color: var(--clr, #f59e0b);
}

:deep(.g6-diamond__spinner) {
  width: 18px;
  height: 18px;
  border: 2.5px solid rgba(245, 158, 11, 0.25);
  border-top-color: #f59e0b;
  border-radius: 50%;
  animation: g6-spin 0.7s linear infinite;
  transform: rotate(-45deg);
}

:deep(.g6-diamond__label) {
  font-size: 10px;
  font-weight: 700;
  color: #1e293b;
  text-align: center;
  line-height: 1.2;
  margin-top: 4px;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.g6-diamond__pulse) {
  position: absolute;
  top: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 76px;
  height: 76px;
  border-radius: 50%;
  pointer-events: none;
  animation: g6-pulse-diamond 1.5s ease-in-out infinite;
}

@keyframes g6-pulse-diamond {
  0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.25); }
  50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); }
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
  z-index: 2;
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
  animation: g6-node-running-breath 1.2s ease-in-out infinite;
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
  animation: g6-node-wait-manual-breath 1.6s ease-in-out infinite;
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
   Sub-flow container nodes
   ═══════════════════════════════════════ */
:deep(.g6-subflow) {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  border-radius: 14px;
  border: 2px dashed var(--bdr, #99f6e4);
  overflow: hidden;
  cursor: pointer;
  position: relative;
  z-index: 0;
  transition: border-color 0.3s, box-shadow 0.3s;
  box-shadow: 0 1px 6px rgba(6, 182, 212, 0.08);
  box-sizing: border-box;
}

:deep(.g6-subflow--selected) {
  border-color: #3b82f6 !important;
  border-style: solid !important;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.15), 0 2px 8px rgba(6,182,212,0.12) !important;
}

:deep(.g6-subflow--running) {
  border-color: #3b82f6;
  border-style: solid;
  border-width: 2.5px;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.2), 0 1px 6px rgba(6,182,212,0.1);
  animation: g6-node-running-breath 1.2s ease-in-out infinite;
}

:deep(.g6-subflow--success) {
  border-color: #22c55e;
  border-style: solid;
  border-width: 2.5px;
  box-shadow: 0 0 0 3px rgba(34,197,94,0.2), 0 1px 6px rgba(6,182,212,0.1);
}

:deep(.g6-subflow--failed) {
  border-color: #ef4444;
  border-style: solid;
  border-width: 2.5px;
  box-shadow: 0 0 0 3px rgba(239,68,68,0.2), 0 1px 6px rgba(6,182,212,0.1);
}

:deep(.g6-subflow--wait-manual) {
  border-color: #eab308;
  border-style: solid;
  border-width: 2.5px;
  box-shadow: 0 0 0 3px rgba(234,179,8,0.2), 0 1px 6px rgba(6,182,212,0.1);
  animation: g6-node-wait-manual-breath 1.6s ease-in-out infinite;
}

:deep(.g6-subflow__container) {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

:deep(.g6-subflow__header) {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-bottom: 1px solid color-mix(in srgb, #06b6d4 15%, transparent);
  flex-shrink: 0;
}

:deep(.g6-subflow__icon) {
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
}

:deep(.g6-subflow__title) {
  font-size: 12px;
  font-weight: 600;
  color: #155e75;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

:deep(.g6-subflow__badge) {
  font-size: 8px;
  font-weight: 700;
  color: #fff;
  background: #06b6d4;
  padding: 1px 6px;
  border-radius: 4px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  flex-shrink: 0;
}

:deep(.g6-subflow__body) {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
}

:deep(.g6-subflow__label) {
  font-size: 11px;
  font-weight: 500;
  color: color-mix(in srgb, #06b6d4 50%, transparent);
  letter-spacing: 0.5px;
}

/* ═══════════════════════════════════════
   Running spinner
   ═══════════════════════════════════════ */
:deep(.g6-rect__spinner) {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(59, 130, 246, 0.2);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: g6-spin 0.7s linear infinite;
  flex-shrink: 0;
}

:deep(.g6-rect__spinner--warn) {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(234, 179, 8, 0.25);
  border-top-color: #eab308;
  border-radius: 50%;
  animation: g6-spin 0.9s linear infinite;
  flex-shrink: 0;
}

:deep(.g6-circle__spinner) {
  width: 18px;
  height: 18px;
  border: 2.5px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: g6-spin 0.7s linear infinite;
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
   Click animation
   ═══════════════════════════════════════ */
:deep(.g6-node--clicked) {
  animation: g6-node-click-pop 0.35s ease-out;
}

@keyframes g6-node-click-pop {
  0% { transform: scale(1); }
  30% { transform: scale(1.08); }
  100% { transform: scale(1); }
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
  0%, 100% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.35); }
  50% { box-shadow: 0 0 0 10px rgba(234, 179, 8, 0); }
}

@keyframes g6-dot-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.7; }
}

@keyframes g6-spin {
  to { transform: rotate(360deg); }
}

@keyframes g6-node-running-breath {
  0%, 100% { box-shadow: 0 0 0 3px rgba(59,130,246,0.2), 0 0 12px rgba(59,130,246,0.15); }
  50% { box-shadow: 0 0 0 6px rgba(59,130,246,0.35), 0 0 24px rgba(59,130,246,0.25); }
}

@keyframes g6-node-wait-manual-breath {
  0%, 100% { box-shadow: 0 0 0 3px rgba(234,179,8,0.15), 0 0 10px rgba(234,179,8,0.08); }
  50% { box-shadow: 0 0 0 6px rgba(234,179,8,0.3), 0 0 20px rgba(234,179,8,0.18); }
}
</style>
