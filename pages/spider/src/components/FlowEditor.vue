<template>
  <section
    class="flow-editor"
    :class="[
      `flow-editor--${mode}`,
      `flow-editor--palette-${computedPalettePosition}`,
    ]"
  >
    <!-- 左侧栏 -->
    <aside
      v-if="showPalette && computedPalettePosition === 'left'"
      class="flow-editor__palette"
    >
      <FlowEditorPalette :items="palette" :display-mode="paletteDisplayMode" />
    </aside>

    <!-- 画布区域 -->
    <div class="flow-editor__canvas-wrap">
      <div
        ref="containerRef"
        class="flow-editor__canvas"
        @dragover.prevent
        @drop.prevent="onCanvasDrop"
      />
    </div>

    <!-- 右侧栏 -->
    <aside
      v-if="showPalette && computedPalettePosition === 'right'"
      class="flow-editor__palette"
    >
      <FlowEditorPalette :items="palette" :display-mode="paletteDisplayMode" />
    </aside>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { Graph } from "@antv/g6";
import FlowEditorPalette from "./FlowEditorPalette.vue";

export interface FlowEditorPaletteItem {
  type: string;
  title: string;
  detail?: string;
  color?: string;
  icon?: string;
  disabled?: boolean;
}

export interface FlowEditorNode {
  id: string;
  type?: string;
  label: string;
  icon?: string;
  typeLabel?: string;
  position: { x: number; y: number };
  runtimeStatus?: string;
  displayInfo?: string;
  errorMessage?: string;
  containerSize?: [number, number];
}

export interface FlowEditorEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  visited?: boolean;
  runtimeStatus?: string;
}

const props = withDefaults(defineProps<{
  mode?: "preview" | "edit";
  nodes: FlowEditorNode[];
  edges: FlowEditorEdge[];
  palette?: FlowEditorPaletteItem[];
  palettePosition?: "left" | "right";
  paletteDisplayMode?: "list" | "icon";
  selectedNodeId?: string | null;
}>(), {
  mode: "preview",
  palettePosition: "left",
  paletteDisplayMode: "list",
  selectedNodeId: null,
});

const emit = defineEmits<{
  (e: "node-click", nodeId: string): void;
  (e: "pane-click"): void;
  (e: "node-moved", payload: { nodeId: string; position: { x: number; y: number } }): void;
  (e: "node-drop", payload: { type: string; position: { x: number; y: number } }): void;
  (e: "node-remove", nodeId: string): void;
  (e: "edge-remove", edgeId: string): void;
}>();

const computedPalettePosition = computed(() => props.palettePosition);
const showPalette = computed(() => props.mode === "edit" && props.palette && props.palette.length > 0);
const readonly = computed(() => props.mode === "preview");

const containerRef = ref<HTMLElement>();
let graph: Graph | null = null;
let resizeObserver: ResizeObserver | null = null;
let edgeAnimations: any[] = [];
let domClickHandler: ((e: MouseEvent) => void) | null = null;
let domContextHandler: ((e: MouseEvent) => void) | null = null;
let domDblClickHandler: ((e: MouseEvent) => void) | null = null;

function isDarkTheme(): boolean {
  return document.documentElement.getAttribute("data-theme") !== "light";
}

function getEdgeLabelBg(): string {
  return isDarkTheme() ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.95)";
}

// ── Theme ──
const TYPE_COLORS: Record<string, string> = {
  START: "#10b981",
  END: "#ef4444",
  PAGE_ACCESS: "#3b82f6",
  AI_PAGE_ACCESS: "#7c3aed",
  BROWSER_AGENT: "#8b5cf6",
  URL_PARSE: "#6366f1",
  DATA_PARSE: "#8b5cf6",
  SAVE_RESULT: "#14b8a6",
  ASYNC_SAVE: "#0891b2",
  CONDITION: "#f59e0b",
  DOWNLOADER: "#64748b",
  SUB_FLOW: "#06b6d4",
  HUMAN_INTERVENE: "#f97316",
};

// Inline SVG path data for each node type (from Remix Icon via @iconify-icons/ri)
const TYPE_SVGS: Record<string, string> = {
  START: `<path fill="currentColor" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10Zm0-2a8 8 0 1 0 0-16a8 8 0 0 0 0 16ZM10.622 8.415l4.879 3.252a.4.4 0 0 1 0 .666l-4.88 3.252a.4.4 0 0 1-.621-.332V8.747a.4.4 0 0 1 .622-.332Z"/>`,
  END: `<path fill="currentColor" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10Zm0-2a8 8 0 1 0 0-16a8 8 0 0 0 0 16ZM9 9h6v6H9V9Z"/>`,
  PAGE_ACCESS: `<path fill="currentColor" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10Zm-2.29-2.333A17.9 17.9 0 0 1 8.027 13H4.062a8.008 8.008 0 0 0 5.648 6.667ZM10.03 13c.151 2.439.848 4.73 1.97 6.752A15.905 15.905 0 0 0 13.97 13h-3.94Zm9.908 0h-3.965a17.9 17.9 0 0 1-1.683 6.667A8.008 8.008 0 0 0 19.938 13ZM4.062 11h3.965A17.9 17.9 0 0 1 9.71 4.333A8.008 8.008 0 0 0 4.062 11Zm5.969 0h3.938A15.905 15.905 0 0 0 12 4.248A15.905 15.905 0 0 0 10.03 11Zm4.259-6.667A17.9 17.9 0 0 1 15.973 11h3.965a8.008 8.008 0 0 0-5.648-6.667Z"/>`,
  AI_PAGE_ACCESS: `<path fill="currentColor" d="M13.5 2c0 .444-.193.843-.5 1.118V5h5a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3h5V3.118A1.5 1.5 0 1 1 13.5 2ZM6 7a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H6Zm-4 3H0v6h2v-6Zm20 0h2v6h-2v-6ZM9 14.5a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3Zm6 0a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3Z"/>`,
  BROWSER_AGENT: `<path fill="currentColor" d="m10.364 19.833l1.93-3.342a4.499 4.499 0 0 1-4.234-2.315L4.795 8.52a8.003 8.003 0 0 0 5.57 11.313Zm2.226.146A8 8 0 0 0 19.602 9.5h-3.86c.479.715.758 1.575.758 2.5c0 .848-.234 1.64-.642 2.318l-3.268 5.66Zm1.553-6.691l.022-.038a2.5 2.5 0 1 0-4.354-.042l.024.042a2.499 2.499 0 0 0 4.308.037Zm-8.108-6.62l1.928 3.34A4.5 4.5 0 0 1 12 7.5h6.615A7.992 7.992 0 0 0 12 4a7.98 7.98 0 0 0-5.965 2.669ZM12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10Z"/>`,
  URL_PARSE: `<path fill="currentColor" d="m18.364 15.535l-1.414-1.414l1.414-1.414a5 5 0 0 0-7.07-7.071L9.878 7.05L8.465 5.636l1.414-1.414a7 7 0 0 1 9.9 9.9l-1.415 1.413Zm-2.828 2.829l-1.414 1.414a7 7 0 1 1-9.9-9.9l1.414-1.414l1.415 1.414l-1.415 1.415a5 5 0 0 0 7.071 7.07l1.415-1.413l1.414 1.414Zm-.707-10.607l1.414 1.414l-7.071 7.072l-1.414-1.415l7.07-7.07Z"/>`,
  DATA_PARSE: `<path fill="currentColor" d="m18.031 16.617l4.283 4.282l-1.415 1.415l-4.282-4.283A8.96 8.96 0 0 1 11 20c-4.968 0-9-4.032-9-9s4.032-9 9-9s9 4.032 9 9a8.96 8.96 0 0 1-1.969 5.617Zm-2.006-.742A6.977 6.977 0 0 0 18 11c0-3.867-3.133-7-7-7s-7 3.133-7 7s3.133 7 7 7a6.977 6.977 0 0 0 4.875-1.975l.15-.15Zm-3.847-8.699a2 2 0 1 0 2.646 2.646a4 4 0 1 1-2.646-2.646Z"/>`,
  SAVE_RESULT: `<path fill="currentColor" d="M5 12.5c0 .313.461.858 1.53 1.393C7.914 14.585 9.877 15 12 15c2.123 0 4.086-.415 5.47-1.107c1.069-.535 1.53-1.08 1.53-1.393v-2.171C17.35 11.349 14.827 12 12 12s-5.35-.652-7-1.671V12.5Zm14 2.829C17.35 16.349 14.827 17 12 17s-5.35-.652-7-1.671V17.5c0 .313.461.858 1.53 1.393C7.914 19.585 9.877 20 12 20c2.123 0 4.086-.415 5.47-1.107c1.069-.535 1.53-1.08 1.53-1.393v-2.171ZM3 17.5v-10C3 5.015 7.03 3 12 3s9 2.015 9 4.5v10c0 2.485-4.03 4.5-9 4.5s-9-2.015-9-4.5Zm9-7.5c2.123 0 4.086-.415 5.47-1.107C18.538 8.358 19 7.813 19 7.5c0-.313-.461-.858-1.53-1.393C16.085 5.415 14.123 5 12 5c-2.123 0-4.086.415-5.47 1.107C5.461 6.642 5 7.187 5 7.5c0 .313.461.858 1.53 1.393C7.914 9.585 9.877 10 12 10Z"/>`,
  ASYNC_SAVE: `<path fill="currentColor" d="M7 19v-6h10v6h2V7.828L16.172 5H5v14h2ZM4 3h13l4 4v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm5 12v4h6v-4H9Z"/>`,
  CONDITION: `<path fill="currentColor" d="M7.105 15.21A3.001 3.001 0 1 1 5 15.17V8.83a3.001 3.001 0 1 1 2 0V12c.836-.628 1.874-1 3-1h4a3.001 3.001 0 0 0 2.895-2.21a3.001 3.001 0 1 1 2.032.064A5.002 5.002 0 0 1 14 13h-4a3.001 3.001 0 0 0-2.895 2.21ZM6 17a1 1 0 1 0 0 2a1 1 0 0 0 0-2ZM6 5a1 1 0 1 0 0 2a1 1 0 0 0 0-2Zm12 0a1 1 0 1 0 0 2a1 1 0 0 0 0-2Z"/>`,
  DOWNLOADER: `<path fill="currentColor" d="M13 10h5l-6 6l-6-6h5V3h2v7Zm-9 9h16v-7h2v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-8h2v7Z"/>`,
  SUB_FLOW: `<path fill="currentColor" d="M6 21.5A3.5 3.5 0 1 1 9.355 17H15v-2h2V9.242L14.757 7H9v2H3V3h6v2h5.757L18 1.756L22.243 6L19 9.241V15h2v6h-6v-2H9.355A3.502 3.502 0 0 1 6 21.5Zm0-5a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3Zm13 .5h-2v2h2v-2ZM18 4.586L16.586 6L18 7.414L19.414 6L18 4.586ZM7 5H5v2h2V5Z"/>`,
  HUMAN_INTERVENE: `<path fill="currentColor" d="m17.841 15.659l.176.177l.178-.177a2.25 2.25 0 1 1 3.181 3.182L18.018 22.2l-3.359-3.359a2.25 2.25 0 1 1 3.182-3.182ZM12 14v2a6 6 0 0 0-6 6H4a8 8 0 0 1 7.75-7.996L12 14Zm0-13c3.315 0 6 2.685 6 6a5.998 5.998 0 0 1-5.775 5.996L12 13c-3.315 0-6-2.685-6-6a5.998 5.998 0 0 1 5.775-5.996L12 1Zm0 2C9.79 3 8 4.79 8 7s1.79 4 4 4s4-1.79 4-4s-1.79-4-4-4Z"/>`,
};

const FALLBACK_SVG = `<path fill="currentColor" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12s4.477 10 10 10Z"/>`;

/** Render an inline SVG icon element */
function renderSvgIcon(svgBody: string, size = 16): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" style="display:inline-block;vertical-align:middle">${svgBody}</svg>`;
}

function getTypeColor(typeLabel?: string): string {
  return (typeLabel && TYPE_COLORS[typeLabel]) || "#6b7280";
}

function getTypeIcon(typeLabel?: string): string {
  const body = (typeLabel && TYPE_SVGS[typeLabel]) || FALLBACK_SVG;
  return renderSvgIcon(body);
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
  if (status === "FAILED") return "#ef4444";
  if (visited) return "#22c55e";
  if (status === "RUNNING") return "#3b82f6";
  if (status === "SUCCESS") return "#22c55e";
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
  const nodeId = data.id || "";
  const selClass = selected ? " g6-circle--selected" : "";
  return `
    <div class="g6-circle${selClass}" style="--clr: ${color}; --bdr: ${color};" data-node-id="${escapeHtml(nodeId)}">
      <div class="g6-circle__inner">
          <span class="g6-circle__icon">${icon}</span>
        <span class="g6-circle__spinner"></span>
      </div>
      <span class="g6-circle__label">${escapeHtml(label)}</span>
      <div class="g6-circle__pulse"></div>
    </div>
  `;
}

function buildSubFlowHtml(data: any, selected: boolean): string {
  const color = "#06b6d4";
  const icon = renderSvgIcon(TYPE_SVGS.SUB_FLOW);
  const label = data.label || "";
  const nodeId = data.id || "";
  const selClass = selected ? " g6-subflow--selected" : "";
  return `
    <div class="g6-subflow${selClass}" style="--clr: ${color}; --bdr: #99f6e4;" data-node-id="${escapeHtml(nodeId)}">
      <div class="g6-subflow__container">
        <div class="g6-subflow__header">
          <span class="g6-subflow__icon">${icon}</span>
          <span class="g6-rect__spinner"></span>
          <span class="g6-subflow__title">${escapeHtml(label)}</span>
          <span class="g6-subflow__badge">SUB</span>
        </div>
        <div class="g6-subflow__body">
          <span class="g6-subflow__label">子流程容器</span>
        </div>
      </div>
      <span class="g6-rect__dot"></span>
      <div class="g6-rect__pulse"></div>
      <div class="g6-rect__pulse g6-pulse--warning"></div>
    </div>
  `;
}

function buildRectHtml(data: any, selected: boolean): string {
  if (isSubFlowType(data.typeLabel)) return buildSubFlowHtml(data, selected);
  const type = data.typeLabel || "";
  const color = getTypeColor(type);
  const icon = getTypeIcon(type);
  const label = data.label || "";
  const nodeId = data.id || "";
  const selClass = selected ? " g6-rect--selected" : "";
  return `
    <div class="g6-rect${selClass}" style="--clr: ${color}; --bdr: #e2e8f0;" data-node-id="${escapeHtml(nodeId)}">
      <span class="g6-rect__tooltip g6-tooltip--${type.toLowerCase()}" data-visible="false"></span>
      <div class="g6-rect__clip">
        <div class="g6-rect__accent" style="background: ${color};"></div>
        <div class="g6-rect__body">
          <div class="g6-rect__row">
            <span class="g6-rect__icon">${icon}</span>
            <span class="g6-rect__spinner"></span>
            <span class="g6-rect__title">${escapeHtml(label)}</span>
          </div>
          <span class="g6-rect__type">${escapeHtml(data.typeLabel || "")}</span>
        </div>
      </div>
      <span class="g6-rect__dot"></span>
      <div class="g6-rect__pulse"></div>
    </div>
  `;
}

function buildDiamondHtml(data: any, selected: boolean): string {
  const type = data.typeLabel || "";
  const color = getTypeColor(type);
  const icon = getTypeIcon(type);
  const label = data.label || "";
  const nodeId = data.id || "";
  const selClass = selected ? " g6-diamond--selected" : "";
  return `
    <div class="g6-diamond${selClass}" style="--clr: ${color}; --bdr: ${color};" data-node-id="${escapeHtml(nodeId)}">
      <span class="g6-diamond__tooltip g6-tooltip--condition" data-visible="false"></span>
      <div class="g6-diamond__shell">
        <div class="g6-diamond__body">
          <span class="g6-diamond__icon">${icon}</span>
          <span class="g6-diamond__spinner"></span>
        </div>
      </div>
      <span class="g6-diamond__label">${escapeHtml(label)}</span>
      <div class="g6-diamond__pulse"></div>
    </div>
  `;
}

function applyRuntimeClasses(nodes: FlowEditorNode[]) {
  for (const node of nodes) {
    const el = document.querySelector<HTMLElement>(`[data-node-id="${node.id}"]`);
    if (!el) continue;
    const t = node.typeLabel || "";
    const prefix = isCircleType(t) ? "g6-circle"
      : isDiamondType(t) ? "g6-diamond"
      : isSubFlowType(t) ? "g6-subflow"
      : "g6-rect";

    el.classList.remove(`${prefix}--running`, `${prefix}--success`, `${prefix}--failed`, `${prefix}--wait-manual`);
    if (node.runtimeStatus === "RUNNING") el.classList.add(`${prefix}--running`);
    else if (node.runtimeStatus === "SUCCESS") el.classList.add(`${prefix}--success`);
    else if (node.runtimeStatus === "FAILED") el.classList.add(`${prefix}--failed`);
    else if (node.runtimeStatus === "WAIT_MANUAL") el.classList.add(`${prefix}--wait-manual`);

    const statusBdr = node.runtimeStatus === "RUNNING" ? "#3b82f6"
      : node.runtimeStatus === "SUCCESS" ? "#22c55e"
      : node.runtimeStatus === "FAILED" ? "#ef4444"
      : node.runtimeStatus === "WAIT_MANUAL" ? "#eab308"
      : getTypeColor(t);
    if (node.runtimeStatus && node.runtimeStatus !== "PENDING" && node.runtimeStatus !== "WAITING") {
      el.style.setProperty("--bdr", statusBdr);
    } else {
      el.style.setProperty("--bdr", getTypeColor(t));
    }

    const dot = el.querySelector<HTMLElement>(".g6-rect__dot");
    if (dot) {
      dot.style.background = getStatusColor(node.runtimeStatus);
      dot.style.display = (node.runtimeStatus && node.runtimeStatus !== "PENDING" && node.runtimeStatus !== "WAITING") ? "" : "none";
    }

    const tipPrefix = isDiamondType(t) ? "g6-diamond" : "g6-rect";
    const tip = el.querySelector<HTMLElement>(`.${tipPrefix}__tooltip`);
    if (tip) {
      let tipText = "";
      let showTip = false;
      const status = node.runtimeStatus || "";
      if (status === "RUNNING" && node.displayInfo) {
        tipText = node.displayInfo; showTip = true;
        tip.classList.remove("g6-tooltip--has-error");
      } else if (status === "FAILED" && node.errorMessage) {
        tipText = node.errorMessage.length > 25 ? node.errorMessage.substring(0, 25) + "…" : node.errorMessage;
        showTip = true;
        tip.classList.add("g6-tooltip--has-error");
      } else if (status === "SUCCESS") {
        tipText = node.displayInfo || "执行成功"; showTip = true;
        tip.classList.remove("g6-tooltip--has-error");
      } else if (status === "WAIT_MANUAL") {
        tipText = "等待人工处理"; showTip = true;
        tip.classList.remove("g6-tooltip--has-error");
      } else {
        tip.classList.remove("g6-tooltip--has-error");
      }
      tip.textContent = tipText;
      tip.dataset.visible = showTip ? "true" : "false";
    }
  }
}

// ── Drop handler ──
function onCanvasDrop(e: DragEvent) {
  if (props.mode !== "edit" || !graph) return;
  const type = e.dataTransfer?.getData("text/plain");
  if (!type) return;
  const rect = containerRef.value?.getBoundingClientRect();
  if (!rect) return;
  try {
    const canvasPos = (graph as any).clientToCanvas({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    emit("node-drop", { type, position: { x: canvasPos.x, y: canvasPos.y } });
  } catch {
    const pos = graph.getCanvasByClient(e.clientX - rect.left, e.clientY - rect.top);
    emit("node-drop", { type, position: { x: pos.x, y: pos.y } });
  }
}

// ── G6 init ──
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
          if (d.data?.containerSize) return d.data.containerSize;
          const t = d.data?.typeLabel;
          if (isCircleType(t)) return [60, 60];
          if (isDiamondType(t)) return [140, 120];
          return [170, d.data?.displayInfo ? 68 : 52];
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
        stroke: (d: any) => {
          const edge = d.data;
          if (!edge) return "#94a3b8";
          if (props.nodes.some(n => (n.id === d.source || n.id === d.target) && n.runtimeStatus === "FAILED")) return "#ef4444";
          return getEdgeStroke(edge.runtimeStatus, edge.visited);
        },
        lineWidth: (d: any) => d.data?.runtimeStatus === "RUNNING" || d.data?.runtimeStatus === "WAIT_MANUAL" ? 3 : 2,
        lineDash: (d: any) => d.data?.runtimeStatus === "RUNNING" || d.data?.runtimeStatus === "WAIT_MANUAL" ? [8, 5] : undefined,
        lineDashOffset: 0,
        endArrow: (d: any) => {
          const edge = d.data;
          let s = "#94a3b8";
          if (edge) {
            if (props.nodes.some(n => (n.id === d.source || n.id === d.target) && n.runtimeStatus === "FAILED")) s = "#ef4444";
            else s = getEdgeStroke(edge.runtimeStatus, edge.visited);
          }
          return { path: "M 0,0 L 8,4 L 0,8 Z", fill: s, stroke: "#fff", lineWidth: 0.5 };
        },
        radius: 12,
        labelText: (d: any) => d.data?.label || "",
        labelFontSize: 13,
        labelFill: "#d97706",
        labelFontWeight: 700,
        labelBackground: true,
        labelBackgroundFill: getEdgeLabelBg(),
        labelBackgroundOpacity: 0.95,
        labelBackgroundCornerRadius: 4,
        labelPadding: [4, 10],
        labelPlacement: "center",
      },
    },
    behaviors: readonly.value
      ? ["drag-canvas", "zoom-canvas"]
      : ["drag-canvas", "zoom-canvas", "drag-element"],
  });

  // Sub-flow drag sync
  graph.on("node:dragstart", (event: any) => {
    const id = event?.target?.id;
    if (!id) return;
    const containerNode = props.nodes.find(n => n.type === "SUB_FLOW" && (n.id === id || id.startsWith(`${n.id}_`)));
    if (!containerNode || !isSubFlowType(containerNode.typeLabel)) return;
    const parentData = graph!.getNodeData(containerNode.id);
    if (!parentData) return;
    const childIds = props.nodes.filter(n => n.id.startsWith(`${containerNode.id}_`)).map(n => n.id);
    const draggedData = graph!.getNodeData(id);
    if (!draggedData) return;
    const childStartPositions = new Map<string, { x: number; y: number }>();
    for (const childId of childIds) {
      const childData = graph!.getNodeData(childId);
      if (childData) childStartPositions.set(childId, { x: childData.x ?? childData.style?.x ?? 0, y: childData.y ?? childData.style?.y ?? 0 });
    }
    (graph as any).__subflowDragState = {
      parentId: containerNode.id, draggedChildId: id,
      startParentX: parentData.x ?? parentData.style?.x ?? 0,
      startParentY: parentData.y ?? parentData.style?.y ?? 0,
      startChildX: draggedData.x ?? draggedData.style?.x ?? 0,
      startChildY: draggedData.y ?? draggedData.style?.y ?? 0,
      childStartPositions,
    };
  });

  graph.on("node:drag", (event: any) => {
    const ds = (graph as any).__subflowDragState;
    if (!ds) return;
    const dd = graph!.getNodeData(ds.draggedChildId);
    if (!dd) return;
    const dx = (dd.x ?? dd.style?.x ?? 0) - ds.startChildX;
    const dy = (dd.y ?? dd.style?.y ?? 0) - ds.startChildY;
    if (dx === 0 && dy === 0) return;
    const updates = [
      { id: ds.parentId, style: { x: ds.startParentX + dx, y: ds.startParentY + dy } },
      ...Array.from(ds.childStartPositions.entries()).map(([cid, sp]) => ({ id: cid, style: { x: sp.x + dx, y: sp.y + dy } })),
    ];
    graph!.updateNodeData(updates);
    graph!.draw();
  });

  graph.on("node:dragend", () => {
    delete (graph as any).__subflowDragState;
  });

  applyData();
  graph.render().then(() => {
    graph.fitView();
    startEdgeAnimations();
    applyRuntimeClasses(props.nodes);

    // DOM click → emit node-click
    if (containerRef.value && !domClickHandler) {
      domClickHandler = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const nodeEl = target.closest("[data-node-id]") as HTMLElement | null;
        if (nodeEl?.dataset?.nodeId) {
          nodeEl.classList.add("g6-node--clicked");
          setTimeout(() => nodeEl.classList.remove("g6-node--clicked"), 400);
          emit("node-click", nodeEl.dataset.nodeId);
        } else {
          emit("pane-click");
        }
      };
      containerRef.value.addEventListener("click", domClickHandler);
    }

    // Edit mode: context menu → node-remove
    if (props.mode === "edit" && containerRef.value && !domContextHandler) {
      domContextHandler = (e: MouseEvent) => {
        e.preventDefault();
        const nodeEl = (e.target as HTMLElement).closest("[data-node-id]") as HTMLElement | null;
        if (nodeEl?.dataset?.nodeId) emit("node-remove", nodeEl.dataset.nodeId);
      };
      containerRef.value.addEventListener("contextmenu", domContextHandler);
    }

    // Edit mode: double-click edge → emit edge-remove
    if (props.mode === "edit" && containerRef.value && !domDblClickHandler) {
      domDblClickHandler = (_e: MouseEvent) => {
        // G6 edge double-click is handled on graph event below
      };
    }
  });

  // G6 edge double-click → edge-remove
  if (props.mode === "edit") {
    graph.on("edge:dblclick", (event: any) => {
      const edgeData = event?.item?._data || event?.item?.data;
      if (edgeData?.id) emit("edge-remove", edgeData.id);
    });
  }
}

function applyData() {
  if (!graph) return;
  graph.setData({
    nodes: props.nodes.map(n => ({
      id: n.id,
      data: n,
      style: { x: n.position.x, y: n.position.y },
    })),
    edges: props.edges.map(e => ({
      id: e.id, source: e.source, target: e.target, data: e,
      style: { labelText: e.label || "" },
    })),
  });
}

function stopEdgeAnimations() {
  for (const anim of edgeAnimations) { try { anim.cancel(); } catch {} }
  edgeAnimations = [];
}

function startEdgeAnimations() {
  stopEdgeAnimations();
  if (!graph || graph.destroyed) return;
  const runningNodeIds = new Set(props.nodes.filter(n => n.runtimeStatus === "RUNNING").map(n => n.id));
  for (const edge of props.edges) {
    if (edge.runtimeStatus !== "RUNNING" && edge.runtimeStatus !== "WAIT_MANUAL") continue;
    if (!runningNodeIds.has(edge.target)) continue;
    try {
      const element = (graph as any).context.element.getElement(edge.id);
      if (!element) continue;
      const keyShape = element.getShape("key");
      if (!keyShape || typeof keyShape.animate !== "function") continue;
      edgeAnimations.push(
        keyShape.animate(
          [{ lineDashOffset: 0 }, { lineDashOffset: -26 }],
          { duration: 600, iterations: Infinity, easing: "linear" },
        )
      );
    } catch {}
  }
}

function destroyGraph() {
  stopEdgeAnimations();
  if (containerRef.value && domClickHandler) {
    containerRef.value.removeEventListener("click", domClickHandler);
    domClickHandler = null;
  }
  if (containerRef.value && domContextHandler) {
    containerRef.value.removeEventListener("contextmenu", domContextHandler);
    domContextHandler = null;
  }
  if (graph) { graph.destroy(); graph = null; }
}

// ── Watchers ──
watch(
  () => [
    props.nodes.length, props.edges.length,
    props.nodes.map(n => n.id).join(","),
    props.edges.map(e => e.id).join(","),
  ],
  () => {
    if (!graph || graph.destroyed) return;
    applyData();
    graph.render().then(() => { startEdgeAnimations(); graph.fitView(); applyRuntimeClasses(props.nodes); });
  },
);

watch(
  () => [...props.nodes.map(n => n.runtimeStatus), ...props.edges.map(e => `${e.runtimeStatus}|${e.visited}`)].join(","),
  () => {
    if (!graph || graph.destroyed) return;
    graph.updateNodeData(props.nodes.map(n => ({ id: n.id, data: { ...n } })));
    graph.updateEdgeData(props.edges.map(e => ({ id: e.id, data: { ...e } })));
    graph.draw().then(() => applyRuntimeClasses(props.nodes));
    startEdgeAnimations();
  },
);

watch(
  () => props.selectedNodeId,
  () => {
    if (!graph || graph.destroyed) return;
    graph.render().then(() => { applyRuntimeClasses(props.nodes); startEdgeAnimations(); });
  },
);

onMounted(() => {
  nextTick(() => initGraph());
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (graph && !graph.destroyed && width > 0 && height > 0) graph.resize(width, height);
      }
    });
    resizeObserver.observe(containerRef.value);
  }
});

onBeforeUnmount(() => {
  destroyGraph();
  if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null; }
});
</script>

<style scoped>
/* ═══════════════════════════════════════
   Layout
   ═══════════════════════════════════════ */
.flow-editor {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--lay-surface-alt, #f1f5f9);
  border-radius: 12px;
}
.flow-editor--palette-right {
  flex-direction: row-reverse;
}

/* ── Palette sidebar ── */
.flow-editor__palette {
  width: 220px;
  flex-shrink: 0;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
  background: var(--lay-surface-bg, #fff);
}
.flow-editor--palette-right .flow-editor__palette {
  border-right: none;
  border-left: 1px solid rgba(0, 0, 0, 0.06);
}

/* ── Canvas wrapper ── */
.flow-editor__canvas-wrap {
  flex: 1;
  min-width: 0;
  position: relative;
}
.flow-editor__canvas {
  width: 100%;
  height: 100%;
  min-height: 400px;
  overflow: hidden;
  position: relative;
}
</style>

<style>
/* ═══════════════════════════════════════
   G6 Node Styles (unscoped — applied to G6 HTML overlay)
   ═══════════════════════════════════════ */

/* ── Circle nodes ── */
.g6-circle {
  width: 60px; height: 60px;
  border-radius: 50%;
  background: linear-gradient(145deg, var(--clr), color-mix(in srgb, var(--clr) 75%, #000));
  border: 3px solid var(--bdr, var(--clr));
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  cursor: pointer; position: relative; z-index: 2;
  transition: border-color 0.3s, box-shadow 0.3s;
  box-shadow: 0 3px 10px rgba(0,0,0,0.12); box-sizing: border-box;
}
.g6-circle--selected {
  box-shadow: 0 0 0 3px rgba(59,130,246,0.3), 0 4px 14px rgba(0,0,0,0.18) !important;
  border-color: #3b82f6 !important;
}
.g6-circle--running {
  border-color: #3b82f6; border-width: 4px;
  box-shadow: 0 0 0 4px rgba(59,130,246,0.2), 0 3px 10px rgba(0,0,0,0.12);
  animation: g6-node-running-breath 1.2s ease-in-out infinite;
}
.g6-circle--success { border-color: #22c55e; border-width: 4px; box-shadow: 0 0 0 4px rgba(34,197,94,0.2), 0 3px 10px rgba(0,0,0,0.12); }
.g6-circle--failed { border-color: #ef4444; border-width: 4px; box-shadow: 0 0 0 4px rgba(239,68,68,0.2), 0 3px 10px rgba(0,0,0,0.12); }
.g6-circle__inner { width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; margin-top: -2px; }
.g6-circle__icon { font-size: 14px; line-height: 1; color: #fff; }
.g6-circle__label { font-size: 9px; font-weight: 600; color: #fff; margin-top: 2px; white-space: nowrap; letter-spacing: 0.3px; }
.g6-circle__pulse { position: absolute; inset: -4px; border-radius: 50%; pointer-events: none; animation: g6-pulse-circle 1.5s ease-in-out infinite; }
.g6-circle:hover { transform: scale(1.05); box-shadow: 0 4px 14px rgba(0,0,0,0.18); }

/* ── Diamond nodes ── */
.g6-diamond { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 140px; height: 120px; cursor: pointer; position: relative; z-index: 2; box-sizing: border-box; }
.g6-diamond__shell { position: relative; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; }
.g6-diamond__body { width: 64px; height: 64px; transform: rotate(45deg); border-radius: 14px; background: color-mix(in srgb, var(--clr, #f59e0b) 18%, var(--lay-card-bg, #fff)); border: 2.5px solid var(--bdr, var(--clr, #f59e0b)); box-shadow: 0 4px 14px rgba(0,0,0,0.10); display: flex; align-items: center; justify-content: center; transition: border-color 0.3s, box-shadow 0.3s; box-sizing: border-box; }
.g6-diamond--selected .g6-diamond__body { box-shadow: 0 0 0 3px rgba(59,130,246,0.25), 0 4px 14px rgba(0,0,0,0.14) !important; border-color: #3b82f6 !important; }
.g6-diamond--running .g6-diamond__body { border-color: #3b82f6; border-width: 3px; box-shadow: 0 0 0 4px rgba(59,130,246,0.2); animation: g6-node-running-breath 1.2s ease-in-out infinite; }
.g6-diamond--success .g6-diamond__body { border-color: #22c55e; border-width: 3px; box-shadow: 0 0 0 4px rgba(34,197,94,0.2); }
.g6-diamond--failed .g6-diamond__body { border-color: #ef4444; border-width: 3px; box-shadow: 0 0 0 4px rgba(239,68,68,0.2); }
.g6-diamond--wait-manual .g6-diamond__body { border-color: #eab308; border-width: 3px; box-shadow: 0 0 0 4px rgba(234,179,8,0.2); }
.g6-diamond__icon { font-size: 18px; line-height: 1; transform: rotate(-45deg); color: var(--clr, #f59e0b); }
.g6-diamond__spinner { width: 18px; height: 18px; border: 2.5px solid rgba(245,158,11,0.25); border-top-color: #f59e0b; border-radius: 50%; animation: g6-spin 0.7s linear infinite; transform: rotate(-45deg); }
.g6-diamond__label { font-size: 10px; font-weight: 700; color: var(--lay-text-primary, #1e293b); text-align: center; line-height: 1.2; margin-top: 4px; max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.g6-diamond__pulse { position: absolute; top: -2px; left: 50%; transform: translateX(-50%); width: 76px; height: 76px; border-radius: 50%; pointer-events: none; animation: g6-pulse-diamond 1.5s ease-in-out infinite; }

@keyframes g6-pulse-diamond {
  0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.25); }
  50% { box-shadow: 0 0 0 8px rgba(59,130,246,0); }
}

/* ── Rect nodes ── */
.g6-rect { display: flex; width: 170px; height: 52px; border-radius: 10px; background: var(--lay-card-bg, #fff); border: 2px solid var(--bdr, var(--lay-border, #e2e8f0)); overflow: visible; cursor: pointer; position: relative; z-index: 2; transition: border-color 0.3s, box-shadow 0.3s; box-shadow: 0 1px 4px rgba(0,0,0,0.06); box-sizing: border-box; }

.g6-rect__clip { position: absolute; inset: 0; border-radius: 10px; overflow: hidden; pointer-events: none; }
.g6-rect--selected { border-color: #3b82f6 !important; border-width: 2.5px !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.15), 0 2px 8px rgba(59,130,246,0.1) !important; }
.g6-rect--running { border-color: #3b82f6; border-width: 3px; box-shadow: 0 0 0 3px rgba(59,130,246,0.2), 0 1px 4px rgba(0,0,0,0.06); animation: g6-node-running-breath 1.2s ease-in-out infinite; }
.g6-rect--success { border-color: #22c55e; border-width: 3px; box-shadow: 0 0 0 3px rgba(34,197,94,0.2), 0 1px 4px rgba(0,0,0,0.06); }
.g6-rect--failed { border-color: #ef4444; border-width: 3px; box-shadow: 0 0 0 3px rgba(239,68,68,0.2), 0 1px 4px rgba(0,0,0,0.06); }
.g6-rect--wait-manual { border-color: #eab308; border-width: 3px; box-shadow: 0 0 0 3px rgba(234,179,8,0.2), 0 1px 4px rgba(0,0,0,0.06); animation: g6-node-wait-manual-breath 1.6s ease-in-out infinite; }
.g6-rect__accent { width: 4px; flex-shrink: 0; }
.g6-rect__body { flex: 1; padding: 6px 10px; display: flex; flex-direction: column; justify-content: center; min-width: 0; }
.g6-rect__row { display: flex; align-items: center; gap: 6px; }
.g6-rect__icon { font-size: 13px; line-height: 1; flex-shrink: 0; }
.g6-rect__title { font-size: 12px; font-weight: 600; color: var(--lay-text-primary, #1e293b); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.g6-rect__type { font-size: 10px; font-weight: 500; color: var(--lay-text-placeholder, #94a3b8); margin-top: 1px; letter-spacing: 0.3px; text-transform: uppercase; }

/* ── Tooltips ── */
.g6-rect__tooltip, .g6-diamond__tooltip {
  position: absolute; bottom: calc(100% + 10px); left: 50%; transform: translateX(-50%);
  padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 600;
  white-space: nowrap; max-width: 300px; overflow: hidden; text-overflow: ellipsis;
  pointer-events: none; box-shadow: 0 3px 10px rgba(0,0,0,0.15); line-height: 1.4; z-index: 10;
  display: none; background: var(--clr, #3b82f6); color: #fff;
}
.g6-rect__tooltip[data-visible="true"], .g6-diamond__tooltip[data-visible="true"] { display: block; }
.g6-rect--success .g6-rect__tooltip[data-visible="true"] { display: none; }
.g6-rect--success:hover .g6-rect__tooltip[data-visible="true"] { display: block; background: #22c55e; }
.g6-tooltip--has-error { background: #ef4444 !important; color: #fff !important; }
.g6-rect__dot { position: absolute; top: -5px; right: -5px; width: 10px; height: 10px; border-radius: 50%; border: 2px solid #fff; z-index: 2; transition: background 0.3s; }
.g6-rect__pulse { position: absolute; inset: -3px; border-radius: 12px; pointer-events: none; animation: g6-pulse-rect 1.5s ease-in-out infinite; }
.g6-pulse--warning { animation: g6-pulse-warning 2s ease-in-out infinite; }

/* ── Sub-flow ── */
.g6-subflow { display: flex; flex-direction: column; width: 100%; height: 100%; border-radius: 14px; border: 2px dashed var(--bdr, #99f6e4); overflow: hidden; cursor: pointer; position: relative; z-index: 0; transition: border-color 0.3s, box-shadow 0.3s; box-shadow: 0 1px 6px rgba(6,182,212,0.08); box-sizing: border-box; }
.g6-subflow--selected { border-color: #3b82f6 !important; border-style: solid !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.15), 0 2px 8px rgba(6,182,212,0.12) !important; }
.g6-subflow--running { border-color: #3b82f6; border-style: solid; border-width: 2.5px; box-shadow: 0 0 0 3px rgba(59,130,246,0.2), 0 1px 6px rgba(6,182,212,0.1); animation: g6-node-running-breath 1.2s ease-in-out infinite; }
.g6-subflow--success { border-color: #22c55e; border-style: solid; border-width: 2.5px; box-shadow: 0 0 0 3px rgba(34,197,94,0.2), 0 1px 6px rgba(6,182,212,0.1); }
.g6-subflow--failed { border-color: #ef4444; border-style: solid; border-width: 2.5px; box-shadow: 0 0 0 3px rgba(239,68,68,0.2), 0 1px 6px rgba(6,182,212,0.1); }
.g6-subflow--wait-manual { border-color: #eab308; border-style: solid; border-width: 2.5px; box-shadow: 0 0 0 3px rgba(234,179,8,0.2), 0 1px 6px rgba(6,182,212,0.1); animation: g6-node-wait-manual-breath 1.6s ease-in-out infinite; }
.g6-subflow__container { display: flex; flex-direction: column; width: 100%; height: 100%; }
.g6-subflow__header { display: flex; align-items: center; gap: 6px; padding: 8px 12px; border-bottom: 1px solid color-mix(in srgb, #06b6d4 15%, transparent); flex-shrink: 0; }
.g6-subflow__icon { font-size: 14px; line-height: 1; flex-shrink: 0; }
.g6-subflow__title { font-size: 12px; font-weight: 600; color: var(--lay-text-primary, #155e75); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
.g6-subflow__badge { font-size: 8px; font-weight: 700; color: #fff; background: #06b6d4; padding: 1px 6px; border-radius: 4px; letter-spacing: 0.5px; text-transform: uppercase; flex-shrink: 0; }
.g6-subflow__body { flex: 1; display: flex; align-items: center; justify-content: center; min-height: 40px; }
.g6-subflow__label { font-size: 11px; font-weight: 500; color: color-mix(in srgb, #06b6d4 50%, transparent); letter-spacing: 0.5px; }

/* ── Spinner ── */
.g6-rect__spinner { width: 14px; height: 14px; border: 2px solid rgba(59,130,246,0.2); border-top-color: #3b82f6; border-radius: 50%; animation: g6-spin 0.7s linear infinite; flex-shrink: 0; }
.g6-circle__spinner { width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: g6-spin 0.7s linear infinite; }
.g6-diamond__spinner { width: 18px; height: 18px; border: 2.5px solid rgba(245,158,11,0.25); border-top-color: #f59e0b; border-radius: 50%; animation: g6-spin 0.7s linear infinite; transform: rotate(-45deg); }

.g6-rect__spinner, .g6-circle__spinner, .g6-diamond__spinner { display: none; }
.g6-rect__pulse, .g6-circle__pulse, .g6-diamond__pulse { display: none; }

.g6-rect--running .g6-rect__icon, .g6-circle--running .g6-circle__icon, .g6-diamond--running .g6-diamond__icon { display: none; }
.g6-rect--running .g6-rect__spinner, .g6-circle--running .g6-circle__spinner, .g6-diamond--running .g6-diamond__spinner { display: inline-block; }
.g6-rect--running .g6-rect__pulse, .g6-circle--running .g6-circle__pulse, .g6-diamond--running .g6-diamond__pulse { display: block; }

.g6-subflow .g6-rect__spinner { display: none; }
.g6-subflow--running .g6-rect__spinner { display: inline-block; }
.g6-subflow--running .g6-subflow__icon { display: none; }

.g6-rect--wait-manual .g6-rect__icon, .g6-diamond--wait-manual .g6-diamond__icon { display: none; }
.g6-rect--wait-manual .g6-rect__spinner, .g6-diamond--wait-manual .g6-diamond__spinner { display: inline-block; border-top-color: #eab308; border-color: rgba(234,179,8,0.25); animation-duration: 0.9s; }

/* ── Click animation ── */
.g6-node--clicked { animation: g6-node-click-pop 0.35s ease-out; }

@keyframes g6-pulse-circle {
  0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.3); }
  50% { box-shadow: 0 0 0 8px rgba(59,130,246,0); }
}
@keyframes g6-pulse-rect {
  0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.25); }
  50% { box-shadow: 0 0 0 6px rgba(59,130,246,0); }
}
@keyframes g6-pulse-warning {
  0%, 100% { box-shadow: 0 0 0 0 rgba(234,179,8,0.35); }
  50% { box-shadow: 0 0 0 10px rgba(234,179,8,0); }
}
@keyframes g6-spin { to { transform: rotate(360deg); } }
@keyframes g6-node-running-breath {
  0%, 100% { box-shadow: 0 0 0 3px rgba(59,130,246,0.2), 0 0 12px rgba(59,130,246,0.15); }
  50% { box-shadow: 0 0 0 6px rgba(59,130,246,0.35), 0 0 24px rgba(59,130,246,0.25); }
}
@keyframes g6-node-wait-manual-breath {
  0%, 100% { box-shadow: 0 0 0 3px rgba(234,179,8,0.15), 0 0 10px rgba(234,179,8,0.08); }
  50% { box-shadow: 0 0 0 6px rgba(234,179,8,0.3), 0 0 20px rgba(234,179,8,0.18); }
}
@keyframes g6-node-click-pop {
  0% { transform: scale(1); }
  30% { transform: scale(1.08); }
  100% { transform: scale(1); }
}
</style>
