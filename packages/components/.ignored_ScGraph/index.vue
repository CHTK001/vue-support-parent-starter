<template>
  <div class="sc-graph" :style="{ height }">
    <div ref="containerRef" class="sc-graph__canvas" :style="canvasStyle"></div>
    <div v-if="!hasData" class="sc-graph__empty">
      <slot name="empty">
        <IconifyIconOnline icon="ri:bubble-chart-line" class="empty-icon" />
        <p>暂无图谱数据</p>
      </slot>
    </div>
    <GraphToolbar
      v-if="showToolbar"
      :layout="currentLayout"
      :show-minimap="currentShowMinimap"
      :focus-mode="focusModeState"
      :edge-animation="edgeAnimationActive"
      :mode-3d="mode3dActive"
      :show-node-labels="showNodeLabels"
      :show-edge-labels="showEdgeLabels"
      @update:layout="handleLayoutChange"
      @update:minimap="handleMinimapToggle"
      @update:focus-mode="(val: 'none' | 'group' | 'relation') => focusModeState = val"
      @update:edge-animation="handleEdgeAnimationToggle"
      @update:mode-3d="handleMode3dToggle"
      @update:node-labels="handleNodeLabelsToggle"
      @update:edge-labels="handleEdgeLabelsToggle"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @fit-view="fitView"
    />
    <div v-if="$slots.sidebar" class="sc-graph__sidebar">
      <slot name="sidebar" :typeColors="typeColorMap" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch, nextTick, computed } from "vue";
import { Graph } from "@antv/g6";
import GraphToolbar from "./components/GraphToolbar.vue";
import { IconifyIconOnline } from "@repo/components/IconifyIconOnline";

// ── Props ────────────────────────────────────────────────────────

const props = withDefaults(defineProps<{
  nodes?: { id: string; label: string; group?: string; img?: string; weight?: number; data?: any }[];
  edges?: { id?: string; from?: string; to?: string; source?: string; target?: string; label?: string; data?: any }[];
  layout?: "force" | "circular" | "radial" | "dagre";
  showMinimap?: boolean;
  showToolbar?: boolean;
  focusMode?: "none" | "group" | "relation";
  edgeAnimation?: boolean;
  mode3d?: boolean;
  height?: string;
}>(), {
  nodes: () => [],
  edges: () => [],
  layout: "force",
  showMinimap: false,
  showToolbar: true,
  focusMode: "none",
  edgeAnimation: false,
  mode3d: false,
  height: "100%",
});

const emit = defineEmits<{
  (e: "node-click", nodeId: string, nodeData: any): void;
  (e: "canvas-click"): void;
  (e: "node-select", nodeId: string | null): void;
  (e: "node-multi-select", nodeIds: string[]): void;
  (e: "expand-node", nodeId: string): void;
  (e: "delete-node", nodeId: string): void;
  (e: "delete-edge", edgeId: string): void;
  (e: "create-relation", sourceId: string, targetId: string): void;
}>();

// ── Internal State ───────────────────────────────────────────────

const containerRef = ref<HTMLElement | null>(null);
let graphInstance: Graph | null = null;

const currentLayout = ref(props.layout);
const currentShowMinimap = ref(props.showMinimap);
const focusModeState = ref(props.focusMode);

const typeColorMap = reactive<Record<string, string>>({});

const hasData = computed(() => props.nodes.length > 0);

// Selection state
const selectedNode = ref<string | null>(null);
const multiSelectedNodes = ref<Set<string>>(new Set());
const selectionOrder = ref<string[]>([]);

// Edge animation
const edgeAnimationActive = ref(props.edgeAnimation);
let edgeAnimations: any[] = [];

// 3D mode (disabled — G6 does not support 3D)
const mode3dActive = ref(false);
// Label visibility toggles
const showNodeLabels = ref(true);
const showEdgeLabels = ref(true);

const canvasStyle = computed(() => ({}));

// Track dimmed elements for focus mode
let dimmedElements = new Set<string>();

const typeColors = ["#409eff","#67c23a","#e6a23c","#f56c6c","#909399","#b37feb","#36cfc9","#ff85c0","#ffc069","#95de64"];

// ── Layout Presets ───────────────────────────────────────────────

const layoutPresets: Record<string, any> = {
  force: { type: "force", linkDistance: 120, preventOverlap: true, nodeSpacing: 20, nodeStrength: 200, edgeStrength: 0.05, iterations: 200, alpha: 0.3, alphaDecay: 0.02 },
  circular: { type: "circular" },
  radial: { type: "radial" },
  dagre: { type: "dagre", rankdir: "LR", nodesep: 20, ranksep: 60 },
};

// ── Resize Observer ──────────────────────────────────────────────

let resizeObserver: ResizeObserver | null = null;

// ── Graph Lifecycle ──────────────────────────────────────────────

function destroyGraph() {
  if (graphInstance) {
    graphInstance.destroy();
    graphInstance = null;
  }
}

function initGraph() {
  destroyGraph();
  if (!containerRef.value) return;
  createGraph();
  updateGraphData();
}

function createGraph() {
  if (!containerRef.value) return;
  const container = containerRef.value;
  const width = container.clientWidth || 800;
  const height = Math.max(400, container.parentElement?.clientHeight || 600);

  const plugins: any[] = [];
  if (currentShowMinimap.value) {
    plugins.push({ type: "minimap", size: [200, 150] });
  }

  // Context menu
  plugins.push({
    type: 'contextmenu',
    trigger: 'contextmenu',
    getItems: (event: any) => {
      const targetType = event.targetType;
      if (targetType === 'node') {
        const items: any[] = [{ name: '展开节点', value: 'expand' }];
        if (multiSelectedNodes.value.size >= 2) {
          items.push({ name: '创建关系（按选择顺序）', value: 'create-relation' });
        }
        items.push({ name: '删除节点', value: 'delete-node' });
        return items;
      }
      if (targetType === 'edge') {
        return [{ name: '删除关系', value: 'delete-edge' }];
      }
      return [];
    },
    onClick: (value: string, target: any) => {
      handleContextMenuAction(value, target);
    },
  });

  graphInstance = new Graph({
    container,
    width,
    height,
    data: { nodes: [], edges: [] },
    autoResize: false,
    layout: layoutPresets[currentLayout.value] || layoutPresets.force,
    node: {
      state: {
        selected: {
          fill: "#e6a23c",
          stroke: "#e6a23c",
          lineWidth: 3,
          labelFontWeight: "bold",
          labelFill: "#e6a23c",
          shadowBlur: 12,
          shadowColor: "rgba(230, 162, 60, 0.6)",
          shadowOffsetX: 0,
          shadowOffsetY: 0,
        },
        dimmed: {
          opacity: 0.04,
          labelOpacity: 0.04,
          fillOpacity: 0.04,
          iconOpacity: 0.04,
        },
        "multi-selected": {
          stroke: "#67c23a",
          lineWidth: 4,
          labelFontWeight: "bold",
          labelFill: "#67c23a",
          shadowBlur: 12,
          shadowColor: "rgba(103, 194, 58, 0.6)",
          shadowOffsetX: 0,
          shadowOffsetY: 0,
        },
      },
    },
    edge: {
      state: {
        highlight: {
          stroke: "#e6a23c",
          lineWidth: 3,
          shadowBlur: 8,
          shadowColor: "rgba(230, 162, 60, 0.5)",
        },
        dimmed: {
          opacity: 0.04,
          labelOpacity: 0.04,
        },
      },
    },
    behaviors: ["drag-canvas", "zoom-canvas", "drag-element"],
    plugins,
  });

  // Events — click selection
  graphInstance.on("node:click", (event: any) => {
    const nodeId = event.target?.id || event.itemId;
    if (!nodeId) return;

    const isCtrl = event.originalEvent?.ctrlKey || event.originalEvent?.metaKey;

    if (isCtrl) {
      // Ctrl+click: toggle multi-select
      if (multiSelectedNodes.value.has(nodeId)) {
        multiSelectedNodes.value.delete(nodeId);
        selectionOrder.value = selectionOrder.value.filter(id => id !== nodeId);
        graphInstance?.setElementState(nodeId, []);
      } else {
        multiSelectedNodes.value.add(nodeId);
        selectionOrder.value.push(nodeId);
        graphInstance?.setElementState(nodeId, "multi-selected");
      }
      emit("node-multi-select", [...multiSelectedNodes.value]);
      const nodeData = props.nodes.find(n => n.id === nodeId) || null;
      emit("node-click", nodeId, nodeData);
      return;
    }

    // Plain click: toggle single select
    clearMultiSelect();
    if (selectedNode.value === nodeId) {
      // Deselect
      clearHighlight();
      selectedNode.value = null;
      emit("node-select", null);
    } else {
      // Select
      clearHighlight();
      highlightConnected(nodeId);
      selectedNode.value = nodeId;
      const nodeData = props.nodes.find(n => n.id === nodeId) || null;
      emit("node-click", nodeId, nodeData);
      emit("node-select", nodeId);
    }
  });

  graphInstance.on("canvas:click", () => {
    clearHighlight();
    clearDimmed();
    clearMultiSelect();
    selectedNode.value = null;
    emit("canvas-click");
    emit("node-select", null);
  });

  // Focus mode: mouseenter → dim non-target nodes
  graphInstance.on("node:mouseenter", (event: any) => {
    const nodeId = event.target?.id || event.itemId;
    if (!nodeId || focusModeState.value === "none") return;

    const allNodeIds = props.nodes.map(n => n.id);
    const allEdgeIds = props.edges.map(e => e.id || `${e.source || e.from}->${e.target || e.to}`);

    // Start with all dimmed
    const dimmedNodes = new Set(allNodeIds);
    const dimmedEdges = new Set(allEdgeIds);
    dimmedNodes.delete(nodeId);

    if (focusModeState.value === "group") {
      // Group mode: keep nodes of the same group visible
      const currentNode = props.nodes.find(n => n.id === nodeId);
      if (currentNode?.group) {
        props.nodes.forEach(n => {
          if (n.group === currentNode.group) {
            dimmedNodes.delete(n.id);
          }
        });
        // Also keep edges between visible nodes visible
        const visibleNodeIds = new Set(props.nodes.filter(n => n.group === currentNode.group).map(n => n.id));
        visibleNodeIds.add(nodeId);
        props.edges.forEach(e => {
          const src = e.source || e.from;
          const tgt = e.target || e.to;
          if (src && tgt && visibleNodeIds.has(src) && visibleNodeIds.has(tgt)) {
            dimmedEdges.delete(e.id || `${src}->${tgt}`);
          }
        });
      }
    } else if (focusModeState.value === "relation") {
      // Relation mode: keep directly connected nodes visible
      const connectedNodes = new Set<string>([nodeId]);
      const connectedEdges = new Set<string>();
      props.edges.forEach(e => {
        const src = e.source || e.from;
        const tgt = e.target || e.to;
        if (src === nodeId || tgt === nodeId) {
          connectedNodes.add(src as string);
          connectedNodes.add(tgt as string);
          connectedEdges.add(e.id || `${src}->${tgt}`);
        }
      });
      connectedNodes.forEach(id => dimmedNodes.delete(id));
      connectedEdges.forEach(id => dimmedEdges.delete(id));
    }

    // Apply dimmed state (clear first for clean state)
    clearDimmed();
    const newDimmed = new Set([...dimmedNodes, ...dimmedEdges]);
    newDimmed.forEach(id => {
      graphInstance?.setElementState(id, "dimmed");
      dimmedElements.add(id);
    });
  });

  graphInstance.on("node:mouseleave", () => {
    clearDimmed();
    if (focusModeState.value !== "none") {
      clearHighlight();
    }
  });
}

function clearMultiSelect() {
  multiSelectedNodes.value.forEach(id => graphInstance?.setElementState(id, []));
  multiSelectedNodes.value.clear();
  selectionOrder.value = [];
  emit("node-multi-select", []);
}

// ── Context Menu ──────────────────────────────────────────────

function handleContextMenuAction(value: string, target: any) {
  const nodeId = target?.id || target?.target?.id;
  switch (value) {
    case 'expand':
      emit("expand-node", nodeId);
      break;
    case 'create-relation':
      if (selectionOrder.value.length >= 2) {
        emit("create-relation", selectionOrder.value[0], selectionOrder.value[1]);
      }
      break;
    case 'delete-node':
      emit("delete-node", nodeId);
      break;
    case 'delete-edge':
      emit("delete-edge", nodeId);
      break;
  }
}

// ── Edge Animation ────────────────────────────────────────────

function applyEdgeAnimation() {
  if (!graphInstance || !edgeAnimationActive.value) return;
  const data = graphInstance.getData();
  if (data?.edges) {
    data.edges.forEach((edgeData: any) => {
      try {
        const element = (graphInstance as any).context.element.getElement(edgeData.id);
        if (!element) return;
        const keyShape = element.getShape("key");
        if (!keyShape || typeof keyShape.animate !== "function") return;
        element.updateStyle({ lineDash: [8, 5], lineDashOffset: 0 });
        const anim = keyShape.animate(
          [{ lineDashOffset: 0 }, { lineDashOffset: -26 }],
          { duration: 600, iterations: Infinity, easing: "linear" },
        );
        edgeAnimations.push(anim);
      } catch { /* ignore */ }
    });
  }
}

function stopEdgeAnimation() {
  for (const anim of edgeAnimations) {
    try { anim.cancel(); } catch { /* already done */ }
  }
  edgeAnimations = [];
  if (!graphInstance) return;
  const data = graphInstance.getData();
  if (data?.edges) {
    data.edges.forEach((edgeData: any) => {
      try {
        const element = (graphInstance as any).context.element.getElement(edgeData.id);
        if (!element) return;
        element.updateStyle({ lineDash: undefined, lineDashOffset: undefined });
      } catch { /* ignore */ }
    });
  }
}

// ── 3D Mode ───────────────────────────────────────────────────


function buildGraphData() {
  if (props.nodes.length === 0) return { nodes: [], edges: [] };

  // Build type color map
  const types = [...new Set(props.nodes.map(n => n.group || "default"))];
  types.forEach((t, i) => { typeColorMap[t] = typeColors[i % typeColors.length]; });

  const g6Nodes = props.nodes.map((n, idx) => {
    const weight = n.weight ?? 1;
    const baseSize = n.img ? 40 : 26;
    // 权重缩放：每个权重等级增加 3px，封顶 60px
    const size = Math.min(60, baseSize + Math.min(weight - 1, 10) * 3);
    const iconScale = size / Math.max(baseSize, 1);
    return {
      id: n.id,
      label: n.label,
      data: { group: n.group, weight, index: idx, ...(n.data || {}) },
      style: {
        fill: typeColorMap[n.group || "default"] || "#409eff",
        labelText: showNodeLabels.value ? n.label : "",
        labelPlacement: "bottom" as const,
        labelOffsetY: 6,
        labelFontSize: 11,
        labelFill: "#606266",
        labelFontWeight: "500",
        size: size,
        stroke: "#fff",
        lineWidth: 2.5,
        cursor: "pointer",
        icon: !!n.img,
        iconSrc: n.img || undefined,
        iconWidth: n.img ? Math.round(32 * iconScale) : undefined,
        iconHeight: n.img ? Math.round(32 * iconScale) : undefined,
        shadowBlur: 6,
        shadowColor: "rgba(0,0,0,0.12)",
        shadowOffsetX: 0,
        shadowOffsetY: 2,
      },
    };
  });

  const g6Edges = props.edges.map(e => {
    const weight = e.data?.weight ?? 1;
    const lineWidth = Math.max(0.8, Math.min(3, weight * 2 + 0.3));
    return {
      id: e.id || `${e.from || e.source}->${e.to || e.target}`,
      source: e.source || e.from || "",
      target: e.target || e.to || "",
      data: { label: e.label || "", ...(e.data || {}) },
      style: {
        stroke: "#999",
        lineWidth,
        endArrow: { size: 7, fill: "#999" },
        labelText: showEdgeLabels.value ? (e.label || "") : "",
        labelFontSize: 10,
        labelFill: "#999",
        labelBackground: true,
        labelBackgroundFill: "#fff",
        labelBackgroundOpacity: 0.85,
        cursor: "pointer",
      },
    };
  });

  return { nodes: g6Nodes, edges: g6Edges };
}

function updateGraphData() {
  if (!graphInstance) return;
  stopEdgeAnimation();
  const { nodes, edges } = buildGraphData();
  graphInstance.setData({ nodes, edges });
  graphInstance.render();
  if (nodes.length > 0) {
    setTimeout(() => graphInstance?.fitView(50), 50);
  }
  setTimeout(() => applyEdgeAnimation(), 100);
}

function refreshGraphLayout() {
  if (!graphInstance) return;
  graphInstance.setLayout(layoutPresets[currentLayout.value] || layoutPresets.force);
  graphInstance.render();
  setTimeout(() => graphInstance?.fitView(50), 200);
  setTimeout(() => applyEdgeAnimation(), 300);
}

function highlightConnected(nodeId: string) {
  if (!graphInstance) return;
  clearHighlight();
  graphInstance.setElementState(nodeId, "selected");
  (props.edges || []).forEach(e => {
    const source = e.source || e.from;
    const target = e.target || e.to;
    if (source === nodeId || target === nodeId) {
      const edgeId = e.id || `${source}->${target}`;
      graphInstance?.setElementState(edgeId, "highlight");
    }
  });
}

function clearHighlight() {
  if (!graphInstance) return;
  if (selectedNode.value) {
    graphInstance.setElementState(selectedNode.value, []);
  }
  (props.edges || []).forEach(e => {
    const source = e.source || e.from;
    const target = e.target || e.to;
    if (source && target) {
      const edgeId = e.id || `${source}->${target}`;
      graphInstance?.setElementState(edgeId, []);
    }
  });
}

function clearDimmed() {
  if (!graphInstance) return;
  dimmedElements.forEach(id => graphInstance?.setElementState(id, []));
  dimmedElements.clear();
}

// ── Toolbar Actions ──────────────────────────────────────────────

function handleLayoutChange(layout: "force" | "circular" | "radial" | "dagre") {
  currentLayout.value = layout;
}

function handleMinimapToggle(show: boolean) {
  currentShowMinimap.value = show;
}

function handleEdgeAnimationToggle(val: boolean) {
  edgeAnimationActive.value = val;
  nextTick(() => {
    if (val) applyEdgeAnimation();
    else stopEdgeAnimation();
  });
}

function handleMode3dToggle(_val: boolean) {
  // G6 does not support 3D rendering — no-op
}

function handleNodeLabelsToggle(val: boolean) {
  showNodeLabels.value = val;
  nextTick(() => { if (graphInstance) refreshGraphLayout(); });
}

function handleEdgeLabelsToggle(val: boolean) {
  showEdgeLabels.value = val;
  nextTick(() => { if (graphInstance) refreshGraphLayout(); });
}

function zoomIn() {
  graphInstance?.zoom(1.2);
}

function zoomOut() {
  graphInstance?.zoom(1 / 1.2);
}

function fitView() {
  graphInstance?.fitView(50);
}

// ── Expose Methods ───────────────────────────────────────────────

defineExpose({
  fitView,
  zoomIn,
  zoomOut,
  getGraphInstance: () => graphInstance,
  setLayout: handleLayoutChange,
  setMinimap: handleMinimapToggle,
  setEdgeAnimation: handleEdgeAnimationToggle,
  setMode3d: handleMode3dToggle,
  clearMultiSelect,
  getSelectedNode: () => selectedNode.value,
  getMultiSelectedNodes: () => [...multiSelectedNodes.value],
});

// ── Watchers ─────────────────────────────────────────────────────

// Data changes → update graph data (no destroy)
watch(
  () => [props.nodes, props.edges],
  () => { nextTick(() => updateGraphData()); },
  { deep: false },
);

// Layout type change → change layout (no destroy)
watch(currentLayout, () => {
  if (graphInstance) {
    refreshGraphLayout();
  } else {
    nextTick(() => initGraph());
  }
});

// Minimap toggle → needs destroy+recreate (plugin change)
watch(currentShowMinimap, () => {
  nextTick(() => initGraph());
});

// Edge animation prop change
watch(() => props.edgeAnimation, (val) => {
  handleEdgeAnimationToggle(val);
});

// ── Lifecycle ────────────────────────────────────────────────────

onMounted(() => {
  nextTick(() => initGraph());

  // Setup resize observer
  if (containerRef.value) {
    const parent = containerRef.value.parentElement;
    if (parent) {
      resizeObserver = new ResizeObserver(() => {
        if (graphInstance && containerRef.value) {
          const w = containerRef.value.clientWidth;
          const h = containerRef.value.clientHeight;
          if (w > 0 && h > 0) {
            graphInstance.resize(w, h);
          }
        }
      });
      resizeObserver.observe(parent);
    }
  }
});

onUnmounted(() => {
  stopEdgeAnimation();
  destroyGraph();
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});
</script>

<style scoped lang="scss">
.sc-graph {
  position: relative;
  width: 100%;
  min-height: 400px;

  &__canvas {
    width: 100%;
    height: 100%;
    min-height: 400px;
    background-image: radial-gradient(circle, var(--el-border-color-lighter, #e4e7ed) 0.8px, transparent 0.8px);
    background-size: 20px 20px;
  }

  &__empty {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: var(--el-text-color-secondary, #909399);
    pointer-events: none;

    :deep(p) {
      margin: 0;
      font-size: 14px;
      color: var(--el-text-color-placeholder);
    }

    :deep(.empty-icon) {
      font-size: 48px;
      opacity: 0.5;
    }
  }

  &__sidebar {
    position: absolute;
    top: 56px;
    left: 12px;
    z-index: 10;
    pointer-events: none;

    > * {
      pointer-events: auto;
    }
  }
}
</style>
