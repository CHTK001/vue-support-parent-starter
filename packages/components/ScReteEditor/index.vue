<template>
  <div class="sc-rete-editor" :class="{ 'is-fullscreen': isFullscreen }">
    <!-- 工具栏 -->
    <div class="editor-toolbar" v-if="showToolbar">
      <div class="toolbar-left">
        <slot name="toolbar-left">
          <el-button-group>
            <el-tooltip content="撤销" placement="bottom">
              <el-button size="small" @click="handleUndo" :disabled="!canUndo">
                <IconifyIconOnline icon="ri:arrow-go-back-line" />
              </el-button>
            </el-tooltip>
            <el-tooltip content="重做" placement="bottom">
              <el-button size="small" @click="handleRedo" :disabled="!canRedo">
                <IconifyIconOnline icon="ri:arrow-go-forward-line" />
              </el-button>
            </el-tooltip>
          </el-button-group>
          <el-divider direction="vertical" />
          <el-button-group>
            <el-tooltip content="放大" placement="bottom">
              <el-button size="small" @click="handleZoomIn">
                <IconifyIconOnline icon="ri:zoom-in-line" />
              </el-button>
            </el-tooltip>
            <el-tooltip content="缩小" placement="bottom">
              <el-button size="small" @click="handleZoomOut">
                <IconifyIconOnline icon="ri:zoom-out-line" />
              </el-button>
            </el-tooltip>
            <el-tooltip content="适应画布" placement="bottom">
              <el-button size="small" @click="handleZoomFit">
                <IconifyIconOnline icon="ri:aspect-ratio-line" />
              </el-button>
            </el-tooltip>
          </el-button-group>
          <el-divider direction="vertical" />
          <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
        </slot>
      </div>
      <div class="toolbar-center">
        <slot name="toolbar-center" />
      </div>
      <div class="toolbar-right">
        <slot name="toolbar-right">
          <el-button-group v-if="autoArrange">
            <el-tooltip content="自动排列" placement="bottom">
              <el-button size="small" @click="handleArrange">
                <IconifyIconOnline icon="ri:layout-grid-line" />
              </el-button>
            </el-tooltip>
          </el-button-group>
          <el-divider direction="vertical" v-if="autoArrange" />
          <el-button-group>
            <el-tooltip content="清空画布" placement="bottom">
              <el-button size="small" @click="handleClear">
                <IconifyIconOnline icon="ri:delete-bin-line" />
              </el-button>
            </el-tooltip>
            <el-tooltip content="全屏" placement="bottom">
              <el-button size="small" @click="toggleFullscreen">
                <IconifyIconOnline :icon="isFullscreen ? 'ri:fullscreen-exit-line' : 'ri:fullscreen-line'" />
              </el-button>
            </el-tooltip>
          </el-button-group>
        </slot>
      </div>
    </div>

    <!-- 编辑器主体 -->
    <div class="editor-main">
      <!-- 左侧节点面板 -->
      <div class="node-panel" v-if="showNodePanel">
        <div class="panel-header">
          <span>节点</span>
        </div>
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

      <!-- 画布区域 -->
      <div 
        class="editor-canvas"
        :class="{ 
          [`bg-${background}`]: true,
          'is-readonly': readonly 
        }"
        ref="containerRef"
        @drop="handleDrop"
        @dragover.prevent
      >
        <div v-if="loading" class="editor-loading">
          <el-icon class="is-loading">
            <IconifyIconOnline icon="ri:loader-4-line" />
          </el-icon>
          <span>加载中...</span>
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <div class="property-panel" v-if="showPropertyPanel && selectedNode">
        <div class="panel-header">
          <span>属性</span>
          <el-button text size="small" @click="selectedNode = null">
            <IconifyIconOnline icon="ri:close-line" />
          </el-button>
        </div>
        <div class="panel-content">
          <slot name="property-panel" :node="selectedNode">
            <el-form label-position="top" size="small">
              <el-form-item label="节点ID">
                <el-input :model-value="selectedNode.id" disabled />
              </el-form-item>
              <el-form-item label="节点名称">
                <el-input v-model="selectedNode.label" @change="handleNodeLabelChange" />
              </el-form-item>
              <el-form-item label="节点类型">
                <el-input :model-value="selectedNode.nodeType" disabled />
              </el-form-item>
            </el-form>
          </slot>
        </div>
      </div>
    </div>

    <!-- 小地图 -->
    <div class="editor-minimap" v-if="minimap && initialized">
      <div ref="minimapRef" class="minimap-container" />
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
        <span class="status-item" v-if="selectedNode">
          选中: {{ selectedNode.label }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, type PropType } from "vue";
import { ElMessageBox } from "element-plus";
import { useReteEditor, type UseReteEditorOptions } from "./useReteEditor";
import type { EditorData, NodeTypeName, BaseNode, EditorConfig } from "./types";

/**
 * ScReteEditor - 可视化节点编辑器组件
 * 
 * 基于 Rete.js 的拖拽式节点编辑器，支持：
 * - 节点拖拽、连接
 * - 右键菜单
 * - 小地图
 * - 自动排列
 * - 数据导入/导出
 * 
 * 可用方法: getData, loadData, clear, addNode, removeNode, arrange, zoomToFit, setZoom
 */
defineOptions({
  name: "ScReteEditor",
});

// Props 定义
const props = defineProps({
  /** 
   * 编辑器数据（v-model）
   * 
   * 支持双向绑定，数据格式见 EditorData 类型定义
   * 
   * @example
   * ```typescript
   * // 数据格式
   * const data = {
   *   nodes: [
   *     { id: 'node1', type: 'input', label: 'MySQL', position: { x: 100, y: 100 } },
   *     { id: 'node2', type: 'output', label: 'Redis', position: { x: 400, y: 100 } }
   *   ],
   *   connections: [
   *     { sourceId: 'node1', sourceOutput: 'output', targetId: 'node2', targetInput: 'input' }
   *   ]
   * }
   * ```
   */
  modelValue: {
    type: Object as PropType<EditorData>,
    default: () => ({ nodes: [], connections: [] }),
  },
  /** 
   * 是否只读模式
   * 
   * 启用后禁止所有编辑操作
   * @default false
   */
  readonly: {
    type: Boolean,
    default: false,
  },
  /** 
   * 是否显示顶部工具栏
   * 
   * 工具栏包含：撤销/重做、缩放、自动排列、清空、全屏等
   * @default true
   */
  showToolbar: {
    type: Boolean,
    default: true,
  },
  /** 
   * 是否显示左侧节点面板
   * 
   * 节点面板显示可拖拽的节点类型
   * @default true
   */
  showNodePanel: {
    type: Boolean,
    default: true,
  },
  /** 
   * 是否显示右侧属性面板
   * 
   * 选中节点后显示节点属性编辑面板
   * @default true
   */
  showPropertyPanel: {
    type: Boolean,
    default: true,
  },
  /** 
   * 是否显示底部状态栏
   * 
   * 状态栏显示节点数、连接数、选中节点等信息
   * @default true
   */
  showStatusbar: {
    type: Boolean,
    default: true,
  },
  /** 
   * 是否显示小地图
   * 
   * 小地图显示在右下角，方便概览和导航
   * @default false
   */
  minimap: {
    type: Boolean,
    default: false,
  },
  /** 
   * 是否启用右键菜单
   * 
   * 启用后可通过右键点击画布添加节点
   * @default true
   */
  contextMenu: {
    type: Boolean,
    default: true,
  },
  /** 
   * 是否启用自动排列功能
   * 
   * 启用后工具栏显示自动排列按钮
   * @default true
   */
  autoArrange: {
    type: Boolean,
    default: true,
  },
  /** 
   * 背景类型
   * 
   * - 'dots': 点阵背景（默认）
   * - 'lines': 网格线背景
   * - 'none': 无背景
   * @default 'dots'
   */
  background: {
    type: String as PropType<"dots" | "lines" | "none">,
    default: "dots",
  },
  /** 
   * 缩放范围限制
   * 
   * @example { min: 0.2, max: 2 } 表示 20%-200%
   * @default { min: 0.2, max: 2 }
   */
  zoom: {
    type: Object as PropType<{ min: number; max: number }>,
    default: () => ({ min: 0.2, max: 2 }),
  },
  /** 
   * 节点菜单项配置
   * 
   * 配置左侧节点面板和右键菜单中显示的节点类型
   * 
   * @example
   * ```typescript
   * // 自定义节点菜单
   * const nodeMenuItems = [
   *   { label: '数据源', type: 'input', icon: 'ri:database-2-line' },
   *   { label: '数据处理', type: 'process', icon: 'ri:settings-3-line' },
   *   { label: '输出目标', type: 'output', icon: 'ri:send-plane-line' }
   * ];
   * ```
   * @default 预定义 6 种节点类型
   */
  nodeMenuItems: {
    type: Array as PropType<Array<{ label: string; type: NodeTypeName; icon?: string }>>,
    default: () => [
      { label: "输入", type: "input", icon: "ri:login-box-line" },
      { label: "输出", type: "output", icon: "ri:logout-box-line" },
      { label: "处理", type: "process", icon: "ri:settings-3-line" },
      { label: "条件", type: "condition", icon: "ri:git-branch-line" },
      { label: "合并", type: "merge", icon: "ri:git-merge-line" },
      { label: "延迟", type: "delay", icon: "ri:time-line" },
    ],
  },
});

// Emits
const emit = defineEmits<{
  "update:modelValue": [data: EditorData];
  "node-created": [node: BaseNode];
  "node-removed": [node: BaseNode];
  "node-selected": [node: BaseNode | null];
  "data-changed": [data: EditorData];
}>();

// 全屏状态
const isFullscreen = ref(false);
const minimapRef = ref<HTMLElement>();

// 撤销/重做状态（占位）
const canUndo = ref(false);
const canRedo = ref(false);

// 使用 composable
const {
  containerRef,
  editorInstance,
  initialized,
  loading,
  selectedNode,
  zoomLevel,
  init,
  destroy,
  addNode,
  removeNode,
  getData,
  loadData,
  clear,
  arrange,
  zoomToFit,
  setZoom,
  undo,
  redo,
} = useReteEditor({
  readonly: props.readonly,
  minimap: props.minimap,
  contextMenu: props.contextMenu,
  autoArrange: props.autoArrange,
  zoom: props.zoom,
  initialData: props.modelValue,
  onDataChange: (data) => {
    emit("update:modelValue", data);
    emit("data-changed", data);
  },
  onNodeSelect: (node) => {
    emit("node-selected", node);
  },
});

// 计算属性
const nodeCount = computed(() => {
  return editorInstance.value?.editor.getNodes().length || 0;
});

const connectionCount = computed(() => {
  return editorInstance.value?.editor.getConnections().length || 0;
});

// 获取节点颜色
function getNodeColor(type: NodeTypeName): string {
  const colors: Record<NodeTypeName, string> = {
    input: "#10b981",
    output: "#f59e0b",
    process: "#6366f1",
    condition: "#8b5cf6",
    merge: "#ec4899",
    delay: "#14b8a6",
  };
  return colors[type] || "#6366f1";
}

// 工具栏操作
function handleUndo() {
  undo();
}

function handleRedo() {
  redo();
}

function handleZoomIn() {
  setZoom(Math.min(zoomLevel.value * 1.2, props.zoom.max));
}

function handleZoomOut() {
  setZoom(Math.max(zoomLevel.value / 1.2, props.zoom.min));
}

function handleZoomFit() {
  zoomToFit();
}

async function handleArrange() {
  await arrange();
}

async function handleClear() {
  try {
    await ElMessageBox.confirm("确定要清空画布吗？此操作不可撤销。", "清空确认", {
      type: "warning",
    });
    await clear();
  } catch {
    // 取消
  }
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value;
}

// 节点操作
async function handleAddNode(type: NodeTypeName) {
  const node = await addNode(type);
  if (node) {
    emit("node-created", node);
  }
}

function handleNodeLabelChange() {
  if (selectedNode.value) {
    // 触发更新
    emit("update:modelValue", getData());
  }
}

// 拖拽操作
let draggedNodeType: NodeTypeName | null = null;

function handleDragStart(e: DragEvent, item: { type: NodeTypeName }) {
  draggedNodeType = item.type;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = "copy";
  }
}

async function handleDrop(e: DragEvent) {
  if (!draggedNodeType || !containerRef.value) return;
  
  const rect = containerRef.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const node = await addNode(draggedNodeType, undefined, { x, y });
  if (node) {
    emit("node-created", node);
  }
  
  draggedNodeType = null;
}

// 监听数据变化
// 注意：不要使用 deep watch，否则会导致无限循环
// 因为 loadData 会触发 onDataChange -> emit update:modelValue -> 触发 watch -> loadData
let isInternalUpdate = false;
watch(
  () => props.modelValue,
  async (newData, oldData) => {
    // 跳过内部更新触发的变化
    if (isInternalUpdate) {
      return;
    }
    // 只有当引用变化时才加载（用户从外部传入新数据）
    if (initialized.value && newData && newData !== oldData) {
      isInternalUpdate = true;
      try {
        await loadData(newData);
      } finally {
        isInternalUpdate = false;
      }
    }
  }
);

// 生命周期
onMounted(() => {
  init();
});

// 暴露方法
defineExpose({
  /** 获取编辑器数据 */
  getData,
  /** 加载数据 */
  loadData,
  /** 清空画布 */
  clear,
  /** 添加节点 */
  addNode,
  /** 删除节点 */
  removeNode,
  /** 自动排列 */
  arrange,
  /** 缩放到适应 */
  zoomToFit,
  /** 设置缩放 */
  setZoom,
  /** 撤销 */
  undo,
  /** 重做 */
  redo,
  /** 编辑器实例 */
  editorInstance,
});
</script>

<style scoped lang="scss">
.sc-rete-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 500px;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;

  &.is-fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 2000;
    border-radius: 0;
    border: none;
  }
}

// 工具栏
.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);

  .toolbar-left,
  .toolbar-center,
  .toolbar-right {
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

  .el-divider--vertical {
    margin: 0 4px;
  }
}

// 主体
.editor-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

// 节点面板
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

    &:hover {
      background: var(--el-fill-color);
    }

    &:active {
      transform: scale(0.98);
    }
  }

  .node-item-icon {
    width: 32px;
    height: 32px;
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

// 画布
.editor-canvas {
  flex: 1;
  position: relative;
  overflow: hidden;

  &.bg-dots {
    background-image: radial-gradient(circle, var(--el-border-color-lighter) 1px, transparent 1px);
    background-size: 20px 20px;
  }

  &.bg-lines {
    background-image: 
      linear-gradient(var(--el-border-color-lighter) 1px, transparent 1px),
      linear-gradient(90deg, var(--el-border-color-lighter) 1px, transparent 1px);
    background-size: 20px 20px;
  }

  &.is-readonly {
    pointer-events: none;
    opacity: 0.8;
  }
}

.editor-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-secondary);

  .is-loading {
    font-size: 32px;
    animation: rotate 1s linear infinite;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 属性面板
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

// 小地图
.editor-minimap {
  position: absolute;
  right: 16px;
  bottom: 40px;
  width: 180px;
  height: 120px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  .minimap-container {
    width: 100%;
    height: 100%;
  }
}

// 状态栏
.editor-statusbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: var(--el-fill-color-lighter);
  border-top: 1px solid var(--el-border-color-lighter);
  font-size: 12px;
  color: var(--el-text-color-secondary);

  .statusbar-left,
  .statusbar-right {
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

// Rete.js 样式覆盖
:deep(.rete-context-menu) {
  background: var(--el-bg-color) !important;
  border: 1px solid var(--el-border-color-lighter) !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15) !important;
  padding: 4px !important;

  .item {
    padding: 8px 12px !important;
    border-radius: 4px !important;
    font-size: 13px !important;
    color: var(--el-text-color-primary) !important;

    &:hover {
      background: var(--el-fill-color) !important;
    }
  }

  input {
    margin: 4px !important;
    padding: 8px 12px !important;
    border: 1px solid var(--el-border-color) !important;
    border-radius: 6px !important;
    outline: none !important;

    &:focus {
      border-color: var(--el-color-primary) !important;
    }
  }
}

:deep(.connection) {
  stroke: var(--el-color-primary) !important;
  stroke-width: 3px !important;
}
</style>
