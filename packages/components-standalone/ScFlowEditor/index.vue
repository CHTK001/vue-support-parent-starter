<template>
  <div class="sc-flow-editor" :class="{ 'is-fullscreen': isFullscreen }">
    <!-- 工具栏 -->
    <div class="editor-toolbar" v-if="showToolbar">
      <div class="toolbar-left">
        <slot name="toolbar-left">
          <ScButton size="small" @click="handleUndo" :disabled="!canUndo">
            <ScTooltip content="撤销" placement="bottom">
              <IconifyIconOnline icon="ri:arrow-go-back-line" />
            </ScTooltip>
          </ScButton>
          <ScButton size="small" @click="handleRedo" :disabled="!canRedo">
            <ScTooltip content="重做" placement="bottom">
              <IconifyIconOnline icon="ri:arrow-go-forward-line" />
            </ScTooltip>
          </ScButton>
          <ScDivider direction="vertical" />
          <ScButton size="small" @click="handleZoomIn">
            <ScTooltip content="放大" placement="bottom">
              <IconifyIconOnline icon="ri:zoom-in-line" />
            </ScTooltip>
          </ScButton>
          <ScButton size="small" @click="handleZoomOut">
            <ScTooltip content="缩小" placement="bottom">
              <IconifyIconOnline icon="ri:zoom-out-line" />
            </ScTooltip>
          </ScButton>
          <ScButton size="small" @click="handleZoomFit">
            <ScTooltip content="适应画布" placement="bottom">
              <IconifyIconOnline icon="ri:aspect-ratio-line" />
            </ScTooltip>
          </ScButton>
          <ScDivider direction="vertical" />
          <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
        </slot>
      </div>
      <div class="toolbar-center">
        <slot name="toolbar-center" />
      </div>
      <div class="toolbar-right">
        <slot name="toolbar-right">
          <ScButton v-if="autoArrange" size="small" @click="handleArrange">
            <ScTooltip content="自动排列" placement="bottom">
              <IconifyIconOnline icon="ri:layout-grid-line" />
            </ScTooltip>
          </ScButton>
          <ScDivider v-if="autoArrange" direction="vertical" />
          <ScButton size="small" @click="handleClear">
            <ScTooltip content="清空画布" placement="bottom">
              <IconifyIconOnline icon="ri:delete-bin-line" />
            </ScTooltip>
          </ScButton>
          <ScButton size="small" @click="toggleFullscreen">
            <ScTooltip content="全屏" placement="bottom">
              <IconifyIconOnline
                :icon="isFullscreen ? 'ri:fullscreen-exit-line' : 'ri:fullscreen-line'"
              />
            </ScTooltip>
          </ScButton>
        </slot>
      </div>
    </div>

    <!-- 编辑器主体 -->
    <div class="editor-main">
      <!-- 左侧节点面板 -->
      <div class="node-panel" v-if="showNodePanel">
        <div class="panel-header"><span>节点</span></div>
        <div class="panel-content">
          <div
            v-for="item in nodeMenuItems"
            :key="item.type"
            class="node-item"
            draggable="true"
            @dragstart="(e) => handleDragStart(e, item)"
            @click="handleAddNode(item.type)"
          >
            <div class="node-item-icon" :style="{ background: getNodeColor(item.type) }">
              <IconifyIconOnline :icon="item.icon || 'ri:box-3-line'" />
            </div>
            <span class="node-item-label">{{ item.label }}</span>
          </div>
        </div>
      </div>

      <!-- 画布区域（Vue Flow） -->
      <div class="editor-canvas">
        <VueFlow
          id="sc-flow-editor"
          v-model:nodes="nodes"
          v-model:edges="edges"
          :min-zoom="zoom.min"
          :max-zoom="zoom.max"
          :default-viewport="{ zoom: 1 }"
          :fit-view-on-init="false"
          @connect="onConnect"
          @node-click="onNodeClick"
          @edge-context-menu="handleEdgeContextMenu"
        >
          <Background :variant="bgVariant" />
          <Controls v-if="showToolbar" />
          <MiniMap v-if="minimap" />
          <template #node-spider="nodeProps">
            <slot name="node" v-bind="nodeProps">
              <SpiderNode
                :id="nodeProps.id"
                :data="nodeProps.data"
                :selected="Boolean(nodeProps.selected)"
                :readonly="readonly"
              />
            </slot>
          </template>
        </VueFlow>
      </div>

      <!-- 右侧属性面板 -->
      <div class="property-panel" v-if="showPropertyPanel && selectedNode">
        <div class="panel-header">
          <span>属性</span>
          <ScButton text size="small" @click="selectedNode = null">
            <IconifyIconOnline icon="ri:close-line" />
          </ScButton>
        </div>
        <div class="panel-content">
          <slot name="property-panel" :node="selectedNode">
            <ScForm label-position="top" size="small">
              <ScFormItem label="节点ID">
                <ScInput :model-value="selectedNode.id" disabled />
              </ScFormItem>
              <ScFormItem label="节点名称">
                <ScInput v-model="selectedNode.label" @change="handleNodeLabelChange" />
              </ScFormItem>
              <ScFormItem label="节点类型">
                <ScInput :model-value="selectedNode.nodeType" disabled />
              </ScFormItem>
            </ScForm>
          </slot>
        </div>
      </div>
    </div>

    <!-- 状态栏 -->
    <div class="editor-statusbar" v-if="showStatusbar">
      <div class="statusbar-left">
        <span class="status-item">
          <IconifyIconOnline icon="ri:box-3-line" />
          {{ nodeCount }} 个节点
        </span>
        <span class="status-item">
          <IconifyIconOnline icon="ri:link" />
          {{ connectionCount }} 个连接
        </span>
      </div>
      <div class="statusbar-right">
        <span class="status-item" v-if="selectedNode">选中: {{ selectedNode.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, type PropType } from "vue";
import { ElMessageBox } from "element-plus";
import { VueFlow } from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import { Controls } from "@vue-flow/controls";
import { MiniMap } from "@vue-flow/minimap";
import "@vue-flow/core/dist/style.css";
import "@vue-flow/core/dist/theme-default.css";
import "@vue-flow/controls/dist/style.css";
import "@vue-flow/minimap/dist/style.css";

import { useFlowEditor } from "./useFlowEditor";
import type { ConnectionConfig, EditorData, NodeTypeName, BaseNode } from "./types";
import SpiderNode from "./components/SpiderNode.vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import ScButton from "@repo/components/ScButton/index";
import ScDivider from "@repo/components/ScDivider/index";
import ScForm from "@repo/components/ScForm/index";
import ScFormItem from "@repo/components/ScFormItem/index";
import ScInput from "@repo/components/ScInput/index";
import ScTooltip from "@repo/components/ScTooltip/index";

defineOptions({ name: "ScFlowEditor" });

const props = defineProps({
  modelValue: { type: Object as PropType<EditorData>, default: () => ({ nodes: [], connections: [] }) },
  nodes: { type: Array as PropType<EditorData["nodes"]>, default: undefined },
  edges: { type: Array as PropType<ConnectionConfig[]>, default: undefined },
  readonly: { type: Boolean, default: false },
  showToolbar: { type: Boolean, default: true },
  showNodePanel: { type: Boolean, default: true },
  showPropertyPanel: { type: Boolean, default: true },
  showStatusbar: { type: Boolean, default: true },
  minimap: { type: Boolean, default: false },
  contextMenu: { type: Boolean, default: true },
  autoArrange: { type: Boolean, default: true },
  background: { type: String as PropType<"dots" | "lines" | "none">, default: "dots" },
  zoom: { type: Object as PropType<{ min: number; max: number }>, default: () => ({ min: 0.2, max: 2 }) },
  nodeMenuItems: {
    type: Array as PropType<Array<{ label: string; type: NodeTypeName; icon?: string }>>,
    default: () => [
      { label: "输入", type: "input", icon: "ri:login-box-line" },
      { label: "输出", type: "output", icon: "ri:logout-box-line" },
      { label: "处理", type: "process", icon: "ri:settings-3-line" },
      { label: "条件", type: "condition", icon: "ri:git-branch-line" },
      { label: "合并", type: "merge", icon: "ri:git-merge-line" },
      { label: "结构化", type: "structure", icon: "ri:database-2-line" },
    ],
  },
});

const emit = defineEmits<{
  "update:modelValue": [data: EditorData];
  "update:nodes": [nodes: EditorData["nodes"]];
  "update:edges": [edges: ConnectionConfig[]];
  "node-created": [node: BaseNode];
  "node-removed": [node: BaseNode];
  "node-selected": [node: BaseNode | null];
  "data-changed": [data: EditorData];
  "edge-contextmenu": [payload: any];
}>();

const isFullscreen = ref(false);
const canUndo = ref(false);
const canRedo = ref(false);

const resolvedExternalData = computed<EditorData>(() => {
  if (Array.isArray(props.nodes) || Array.isArray(props.edges)) {
    return {
      nodes: Array.isArray(props.nodes) ? props.nodes : [],
      connections: Array.isArray(props.edges) ? props.edges : [],
    };
  }
  return props.modelValue;
});

const {
  nodes,
  edges,
  initialized,
  loading,
  selectedNode,
  zoomLevel,
  init,
  destroy,
  addNode,
  removeNode,
  removeConnection,
  getData,
  loadData,
  clear,
  arrange,
  zoomToFit,
  setZoom,
  undo,
  redo,
  registerNode,
  onConnect,
  onNodeClick,
} = useFlowEditor({
  readonly: props.readonly,
  minimap: props.minimap,
  contextMenu: props.contextMenu,
  autoArrange: props.autoArrange,
  zoom: props.zoom,
  initialData: resolvedExternalData.value,
  onDataChange: (data) => {
    emit("update:modelValue", data);
    emit("update:nodes", data.nodes);
    emit("update:edges", data.connections);
    emit("data-changed", data);
  },
  onNodeSelect: (node) => {
    emit("node-selected", node);
  },
});

// 计算节点/连线数量
const nodeCount = computed(() => nodes.value.length);
const connectionCount = computed(() => edges.value.length);

// 背景变体
const bgVariant = computed(() => {
  if (props.background === "none") return undefined;
  return props.background;
});

function getNodeColor(type: NodeTypeName): string {
  const colors: Record<string, string> = {
    input: "#10b981", output: "#f59e0b", process: "#6366f1",
    condition: "#8b5cf6", merge: "#ec4899", delay: "#14b8a6",
  };
  return colors[type] || "#6366f1";
}

function handleUndo() { undo(); canUndo.value = false; canRedo.value = true; }
function handleRedo() { redo(); canUndo.value = true; canRedo.value = false; }
function handleZoomIn() { setZoom(Math.min(zoomLevel.value * 1.2, props.zoom.max)); }
function handleZoomOut() { setZoom(Math.max(zoomLevel.value / 1.2, props.zoom.min)); }
function handleZoomFit() { zoomToFit(); }
async function handleArrange() { await arrange(); }

async function handleClear() {
  try {
    await ElMessageBox.confirm("确定要清空画布吗？此操作不可撤销。", "清空确认", { type: "warning" });
    await clear();
  } catch { /* cancel */ }
}

function toggleFullscreen() { isFullscreen.value = !isFullscreen.value; }

async function handleAddNode(type: NodeTypeName) {
  const node = await addNode(type);
  if (node) emit("node-created", node);
}

async function handleEdgeContextMenu(payload: any) {
  payload?.event?.preventDefault?.();
  payload?.event?.stopPropagation?.();
  emit("edge-contextmenu", payload);
}

function handleNodeLabelChange() {
  if (selectedNode.value) {
    emit("update:modelValue", getData());
  }
}

let draggedNodeType: NodeTypeName | null = null;

function handleDragStart(e: DragEvent, item: { type: NodeTypeName }) {
  draggedNodeType = item.type;
  if (e.dataTransfer) e.dataTransfer.effectAllowed = "copy";
}

function onNodeLabelEdit(nodeId: string, newLabel: string) {
  const idx = nodes.value.findIndex((n) => n.id === nodeId);
  if (idx >= 0) {
    nodes.value[idx] = {
      ...nodes.value[idx],
      data: { ...nodes.value[idx].data, label: newLabel },
    };
  }
  emit("update:modelValue", getData());
}

// 初始化
onMounted(async () => {
  await init();
});

// 外部数据变化同步
let isInternalUpdate = false;
watch(
  () => resolvedExternalData.value,
  async (newData, oldData) => {
    if (isInternalUpdate) return;
    if (initialized.value && newData && newData !== oldData) {
      isInternalUpdate = true;
      try { await loadData(newData); }
      finally { isInternalUpdate = false; }
    }
  },
);

defineExpose({
  getData,
  loadData,
  clear,
  addNode,
  removeNode,
  removeConnection,
  arrange,
  zoomToFit,
  setZoom,
  undo,
  redo,
  editorInstance: { vueFlowRef: null },
  registerNode,
});
</script>

<style scoped lang="scss">
.sc-flow-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 500px;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;
  position: relative;

  &.is-fullscreen {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 2000;
    border-radius: 0;
    border: none;
  }
}

.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  z-index: 10;

  .toolbar-left, .toolbar-center, .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .zoom-level {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    min-width: 45px;
    text-align: center;
  }
}

.editor-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.node-panel {
  width: 180px;
  background: var(--el-fill-color-lighter);
  border-right: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;

  .panel-header {
    padding: 12px 16px;
    font-weight: 600;
    font-size: 13px;
    color: var(--el-text-color-primary);
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }

  .node-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 4px;

    &:hover { background: var(--el-fill-color); }
    &:active { transform: scale(0.98); }
  }

  .node-item-icon {
    width: 32px; height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 16px;
  }

  .node-item-label {
    font-size: 13px;
    color: var(--el-text-color-primary);
  }
}

.editor-canvas {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.property-panel {
  width: 260px;
  background: var(--el-fill-color-lighter);
  border-left: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    font-weight: 600;
    font-size: 13px;
    color: var(--el-text-color-primary);
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }
}

.editor-statusbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: var(--el-fill-color-lighter);
  border-top: 1px solid var(--el-border-color-lighter);
  font-size: 12px;
  color: var(--el-text-color-secondary);

  .statusbar-left, .statusbar-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .status-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}
</style>


