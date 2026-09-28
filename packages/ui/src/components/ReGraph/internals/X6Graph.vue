<script setup lang="ts">
/**
 * X6Graph —— ReGraph 的 X6 内核承载组件（agent-flow 风格）
 *
 * 内部封装 X6GraphEngine，提供：
 *   - 多模式布局：force / mind / tree / circle / center / fixed / relation
 *   - agent-flow 节点调色板（左侧拖拽生成节点，editable 模式）
 *   - 工具栏：搜索高亮 / 路径模式 / 缩放 / 适配 / 重排 / 折叠展开 / 撤销重做 / 导入导出 / 小地图
 *   - 节点右键菜单：扩线 / 折叠 / 锁定 / 隐藏 / 删除 / 定位
 *   - 端口连线、缩略图、历史回溯、JSON 导入导出、PNG 导出
 *
 * 主题组件（ReGraph default / koi 及各 ReGraph* 变体）均以不同 props 复用本组件，
 * 只有被选中的主题实现会被打包。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  ArrowLeft,
  ArrowRight,
  Connection,
  Delete,
  Download,
  Expand,
  Folder,
  FullScreen,
  Histogram,
  Lock,
  Position,
  Refresh,
  Search,
  Unlock,
  Upload,
  ZoomIn,
  ZoomOut,
} from "@element-plus/icons-vue";
import {
  DEFAULT_NODE_TYPES,
  ReGraphMode,
  normalizeReGraphMode,
  type ReGraphConfig,
  type ReGraphData,
  type ReGraphEdge,
  type ReGraphExpandFetcher,
  type ReGraphModeInput,
  type ReGraphNode,
  type ReGraphNodeMenuAction,
  type ReGraphNodeTypeDef,
  type ReGraphSearchMode,
  type ReGraphToolbarOptions,
  X6GraphEngine,
} from "../internals/x6";
import { resolvePreset, type GraphPreset } from "../internals/x6/graphPresets";
import {
  buildContainerStyle,
  buildFinalData,
} from "../internals";

const props = withDefaults(
  defineProps<{
    /** 布局模式 */
    mode?: ReGraphModeInput;
    /** 完整数据 */
    data?: ReGraphData;
    /** 节点列表 */
    nodes?: ReGraphNode[];
    /** 连线列表 */
    edges?: ReGraphEdge[];
    /** 容器高度 */
    height?: string | number;
    /** 容器宽度 */
    width?: string | number;
    /** 是否可编辑（显示调色板、允许连线） */
    editable?: boolean;
    /** 强制显示调色板（与 editable 独立） */
    palette?: boolean;
    /** 显示完整工具栏 */
    showToolbar?: boolean;
    /** 精简模式（koi 风格：仅搜索栏 + 轻交互） */
    minimal?: boolean;
    /** 显示小地图 */
    showMinimap?: boolean;
    /** 显示搜索栏（minimal 下生效） */
    showSearch?: boolean;
    /** 工具栏功能开关 */
    toolbar?: ReGraphToolbarOptions;
    /** 远程扩线接口 */
    fetchExpand?: ReGraphExpandFetcher;
    /** 启用历史回溯 */
    enableHistory?: boolean;
    /** 自定义调色板节点类型 */
    nodeTypes?: ReGraphNodeTypeDef[];
    /** 全部边默认播放流动动画 */
    animated?: boolean;
    /** RelationGraph 通用配置（覆盖同名独立 prop） */
    config?: ReGraphConfig;
    /** 调试 */
    debug?: boolean;
  }>(),
  {
    mode: ReGraphMode.FORCE,
    data: undefined,
    nodes: undefined,
    edges: undefined,
    height: "100%",
    width: "100%",
    editable: false,
    palette: false,
    showToolbar: true,
    minimal: false,
    showMinimap: false,
    showSearch: true,
    toolbar: () => ({
      search: true,
      layout: true,
      zoom: true,
      fit: true,
      collapseAll: true,
      expandAll: true,
      importExport: true,
      history: true,
      minimap: true,
      palette: true,
    }),
    fetchExpand: undefined,
    enableHistory: true,
    nodeTypes: () => DEFAULT_NODE_TYPES,
    animated: false,
    config: undefined,
    debug: false,
  },
);

const emit = defineEmits<{
  (e: "ready", instance: X6GraphEngine): void;
  (e: "node-click", node: ReGraphNode, ev: MouseEvent): void;
  (e: "node-dblclick", node: ReGraphNode, ev: MouseEvent): void;
  (e: "node-contextmenu", node: ReGraphNode, ev: MouseEvent): void;
  (e: "edge-click", edge: ReGraphEdge, ev: MouseEvent): void;
  (e: "layout-change", name: ReGraphMode): void;
  (e: "search-change", keyword: string, matched: ReGraphNode[]): void;
  (e: "expand", node: ReGraphNode, payload: { nodes: ReGraphNode[]; edges: ReGraphEdge[] }): void;
  (e: "node-menu", action: ReGraphNodeMenuAction, node: ReGraphNode): void;
}>();

const engine = shallowRef<X6GraphEngine | null>(null);
const canvasRef = ref<HTMLDivElement | null>(null);
const paletteRef = ref<HTMLDivElement | null>(null);
const minimapRef = ref<HTMLDivElement | null>(null);

const containerStyle = computed(() => buildContainerStyle(
  props.config?.width ?? props.width,
  props.config?.height ?? props.height,
));
const showPalette = computed(() => props.config?.palette ?? ((props.config?.editable ?? props.editable) && (props.config?.toolbar ?? props.toolbar)?.palette !== false));

/** 通用 config：config 中的字段覆盖同名独立 prop */
const resolved = computed(() => {
  const cfg = props.config ?? {};
  return {
    mode: normalizeReGraphMode(cfg.mode ?? props.mode),
    editable: cfg.editable ?? props.editable,
    palette: cfg.palette ?? props.palette,
    showToolbar: cfg.showToolbar ?? props.showToolbar,
    showMinimap: cfg.showMinimap ?? props.showMinimap,
    animated: cfg.animated ?? props.animated,
    toolbar: { ...props.toolbar, ...cfg.toolbar },
    nodeTypes: cfg.nodeTypes ?? props.nodeTypes,
  };
});

const preset = computed<GraphPreset>(() => resolvePreset(resolved.value.mode));

const search = reactive({ keyword: "", mode: "highlight" as ReGraphSearchMode, matched: [] as ReGraphNode[] });
const contextMenu = reactive({ visible: false, x: 0, y: 0, node: null as ReGraphNode | null });
const stat = reactive({ nodes: 0, edges: 0, loading: 0 });
const fileInputRef = ref<HTMLInputElement | null>(null);
const loadingMap = reactive<Record<string, boolean>>({});

function buildData(): ReGraphData {
  return buildFinalData(props.data, props.nodes, props.edges);
}

function refreshStat() {
  if (!engine.value) return;
  const d = engine.value.getData();
  stat.nodes = d.nodes.length;
  stat.edges = d.edges.length;
}

onMounted(async () => {
  await nextTick();
  if (!canvasRef.value) return;
  engine.value = new X6GraphEngine({
    container: canvasRef.value,
    paletteContainer: showPalette.value ? paletteRef.value : null,
    minimapContainer: resolved.value.showMinimap ? minimapRef.value : null,
    paletteTypes: resolved.value.nodeTypes,
    editable: resolved.value.editable,
    mode: resolved.value.mode,
    animated: resolved.value.animated,
    edgeRouter: preset.value.edgeRouter,
    edgeConnector: preset.value.edgeConnector,
    handlers: {
      onReady: (eng) => {
        eng.setData(buildData());
        refreshStat();
        emit("ready", eng);
      },
      onNodeClick: (node, ev) => emit("node-click", node, ev),
      onNodeDblClick: (node, ev) => {
        emit("node-dblclick", node, ev);
        void expandNode(node);
      },
      onNodeContextMenu: (node, ev) => {
        contextMenu.visible = true;
        contextMenu.x = ev.clientX;
        contextMenu.y = ev.clientY;
        contextMenu.node = node;
        emit("node-contextmenu", node, ev);
      },
      onEdgeClick: (edge, ev) => emit("edge-click", edge, ev),
      onCellChanged: () => refreshStat(),
    },
  });
});

watch(
  () => [props.data, props.nodes, props.edges],
  () => {
    if (engine.value) {
      engine.value.setData(buildData());
      refreshStat();
    }
  },
  { deep: true },
);

watch(
  () => [resolved.value.mode, resolved.value.animated],
  ([m, a]) => {
    if (!engine.value) return;
    engine.value.setMode(m as ReGraphMode);
    engine.value.applyPreset(preset.value);
    engine.value.animateEdges(!!a);
    engine.value.zoomToFit();
    emit("layout-change", m as ReGraphMode);
  },
);

onBeforeUnmount(() => {
  engine.value?.dispose();
  engine.value = null;
});

// ============================================================
// 搜索
// ============================================================
function runSearch(value: string) {
  search.keyword = value;
  if (!engine.value) return;
  if (!value.trim()) {
    clearSearch();
    return;
  }
  const matchedIds = engine.value.highlight(value, search.mode);
  const allNodes = engine.value.getData().nodes;
  search.matched = allNodes.filter((n) => matchedIds.includes(n.id));
  emit("search-change", value, search.matched);
}
function clearSearch() {
  search.keyword = "";
  search.matched = [];
  engine.value?.clearHighlight();
  emit("search-change", "", []);
}
function toggleSearchMode() {
  search.mode = search.mode === "highlight" ? "path" : "highlight";
  if (search.keyword) runSearch(search.keyword);
}

// ============================================================
// 工具栏动作
// ============================================================
function doZoom(delta: number) {
  engine.value?.zoomBy(delta);
}
function doFit() {
  engine.value?.zoomToFit();
  engine.value?.centerContent();
}
function doRelayout() {
  engine.value?.relayout();
  engine.value?.zoomToFit();
}
function doCollapseAll() {
  engine.value?.graph.getNodes().forEach((n) => engine.value?.hideNode(n.id));
}
function doExpandAll() {
  engine.value?.graph.getNodes().forEach((n) => engine.value?.showNode(n.id));
}
function undo() {
  engine.value?.undo();
}
function redo() {
  engine.value?.redo();
}

// ============================================================
// 导入 / 导出
// ============================================================
function exportJSON() {
  if (!engine.value) return;
  const payload = engine.value.toJSON();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `x6-graph-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  ElMessage.success("图谱已导出");
}
function triggerImport() {
  fileInputRef.value?.click();
}
async function handleImportFile(ev: Event) {
  const input = ev.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !engine.value) return;
  try {
    const text = await file.text();
    engine.value.fromJSON(JSON.parse(text));
    refreshStat();
    ElMessage.success("图谱已导入");
  } catch (err) {
    ElMessage.error(`导入失败：${err instanceof Error ? err.message : String(err)}`);
  } finally {
    input.value = "";
  }
}
async function exportPNG() {
  await engine.value?.exportPNG(`x6-graph-${Date.now()}.png`);
}

// ============================================================
// 右键菜单
// ============================================================
function closeContextMenu() {
  contextMenu.visible = false;
}
function onCanvasClick() {
  if (contextMenu.visible) closeContextMenu();
}
async function handleMenuAction(action: ReGraphNodeMenuAction) {
  const node = contextMenu.node;
  closeContextMenu();
  if (!node || !engine.value) return;
  emit("node-menu", action, node);
  if (action === "expand") {
    await expandNode(node);
    return;
  }
  engine.value.handleMenuAction(action, node);
}
async function expandNode(node: ReGraphNode) {
  const fetchExpand = props.fetchExpand;
  if (!fetchExpand) {
    ElMessage.info("未配置 fetchExpand，无法扩线");
    return;
  }
  if (!engine.value) return;
  if (loadingMap[node.id]) return;
  loadingMap[node.id] = true;
  stat.loading += 1;
  try {
    const payload = await engine.value.expand(node.id, fetchExpand);
    refreshStat();
    emit("expand", node, payload);
    ElMessage.success(`已扩展 ${payload.nodes.length} 个节点`);
  } catch (err) {
    ElMessage.error(`扩线失败：${err instanceof Error ? err.message : String(err)}`);
  } finally {
    delete loadingMap[node.id];
    stat.loading -= 1;
  }
}

defineExpose({
  engine,
  addNode: (n: ReGraphNode) => engine.value?.addNode(n),
  addEdge: (e: ReGraphEdge) => engine.value?.addEdge(e),
  removeNodeById: (id: string) => engine.value?.removeNodeById(id),
  removeEdgeById: (id: string) => engine.value?.removeEdgeById(id),
  getNodeById: (id: string) => engine.value?.getNodeById(id),
  updateNode: (id: string, patch: Partial<ReGraphNode>) => engine.value?.updateNode(id, patch),
  undo,
  redo,
  canUndo: () => engine.value?.canUndo() ?? false,
  canRedo: () => engine.value?.canRedo() ?? false,
  zoomBy: doZoom,
  zoomToFit: doFit,
  relayout: doRelayout,
  runSearch,
  clearSearch,
  toJSON: () => engine.value?.toJSON(),
  fromJSON: (j: never) => engine.value?.fromJSON(j),
  exportJSON,
  exportPNG,
  getData: () => engine.value?.getData(),
  setData: (d: ReGraphData) => engine.value?.setData(d),
});
</script>

<template>
  <div class="x6rg" :style="containerStyle" @click="onCanvasClick">
    <!-- 左侧调色板（agent-flow 风格） -->
    <div v-if="showPalette" ref="paletteRef" class="x6rg__palette" />

    <div class="x6rg__main">
      <!-- 工具栏 -->
      <div v-if="resolved.showToolbar && !minimal" class="x6rg__toolbar">
        <div class="x6rg__toolbar-left">
          <template v-if="resolved.toolbar.search !== false">
            <div class="x6rg__search">
              <el-input
                v-model="search.keyword"
                placeholder="搜索节点（逗号分隔）"
                clearable

                @input="runSearch"
                @clear="clearSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <el-button-group >
                <el-button :type="search.mode === 'highlight' ? 'primary' : 'default'" @click="toggleSearchMode">
                  高亮
                </el-button>
                <el-button :type="search.mode === 'path' ? 'primary' : 'default'" @click="toggleSearchMode">
                  路径
                </el-button>
              </el-button-group>
            </div>
          </template>
        </div>
        <div class="x6rg__toolbar-right">
          <template v-if="resolved.toolbar.zoom !== false">
            <el-button-group >
              <el-button @click="doZoom(20)"><el-icon><ZoomIn /></el-icon></el-button>
              <el-button @click="doZoom(-20)"><el-icon><ZoomOut /></el-icon></el-button>
              <el-button @click="doFit"><el-icon><FullScreen /></el-icon></el-button>
            </el-button-group>
          </template>
          <template v-if="resolved.toolbar.collapseAll !== false || resolved.toolbar.expandAll !== false">
            <el-button-group >
              <el-button v-if="resolved.toolbar.collapseAll !== false" @click="doCollapseAll"><el-icon><Folder /></el-icon>折叠</el-button>
              <el-button v-if="resolved.toolbar.expandAll !== false" @click="doExpandAll"><el-icon><Expand /></el-icon>展开</el-button>
            </el-button-group>
          </template>
          <template v-if="resolved.toolbar.layout !== false">
            <el-button @click="doRelayout"><el-icon><Refresh /></el-icon>重排</el-button>
          </template>
          <template v-if="resolved.toolbar.history !== false && enableHistory">
            <el-button-group >
              <el-button :disabled="!engine || !engine.canUndo()" @click="undo"><el-icon><ArrowLeft /></el-icon>撤销</el-button>
              <el-button :disabled="!engine || !engine.canRedo()" @click="redo"><el-icon><ArrowRight /></el-icon>重做</el-button>
            </el-button-group>
          </template>
          <template v-if="resolved.toolbar.importExport !== false">
            <el-button-group >
              <el-button @click="triggerImport"><el-icon><Upload /></el-icon>导入</el-button>
              <el-button @click="exportJSON"><el-icon><Download /></el-icon>导出</el-button>
              <el-button @click="exportPNG">PNG</el-button>
            </el-button-group>
          </template>
          <template v-if="resolved.toolbar.minimap !== false && resolved.showMinimap">
            <span class="x6rg__minimap-tag">小地图</span>
          </template>
          <slot name="toolbar" :engine="engine" />
        </div>
      </div>

      <!-- 精简搜索栏（koi 风格） -->
      <div v-if="minimal && showSearch" class="x6rg__searchbar">
        <el-input
          v-model="search.keyword"
          placeholder="搜索节点"

          clearable
          @input="runSearch"
          @clear="clearSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <span v-if="search.matched.length" class="x6rg__count">{{ search.matched.length }} 个匹配</span>
      </div>

      <!-- 画布 -->
      <div ref="canvasRef" class="x6rg__canvas" />

      <!-- 小地图 -->
      <div v-if="resolved.showMinimap" ref="minimapRef" class="x6rg__minimap" />

      <!-- 右键菜单 -->
      <div
        v-if="contextMenu.visible"
        class="x6rg__context-menu"
        :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
        @click.stop
      >
        <div class="x6rg__context-menu-title">{{ contextMenu.node?.text }}</div>
        <div class="x6rg__context-menu-item" @click="handleMenuAction('expand')"><el-icon><Connection /></el-icon><span>扩展节点</span></div>
        <div class="x6rg__context-menu-item" @click="handleMenuAction('lock')"><el-icon><Lock /></el-icon><span>锁定位置</span></div>
        <div class="x6rg__context-menu-item" @click="handleMenuAction('unlock')"><el-icon><Unlock /></el-icon><span>解锁位置</span></div>
        <div class="x6rg__context-menu-item" @click="handleMenuAction('focus')"><el-icon><Position /></el-icon><span>定位到此节点</span></div>
        <div class="x6rg__context-menu-item" @click="handleMenuAction('hide')"><el-icon><Histogram /></el-icon><span>隐藏节点</span></div>
        <div class="x6rg__context-menu-item x6rg__context-menu-item--danger" @click="handleMenuAction('remove')"><el-icon><Delete /></el-icon><span>删除节点</span></div>
      </div>
    </div>

    <input ref="fileInputRef" type="file" accept="application/json" hidden @change="handleImportFile" />

    <!-- 状态栏 -->
    <div v-if="resolved.showToolbar && !minimal" class="x6rg__statusbar">
      <span>节点 {{ stat.nodes }}</span>
      <span>连线 {{ stat.edges }}</span>
      <span v-if="search.matched.length">匹配 {{ search.matched.length }}</span>
      <span v-if="stat.loading">加载中 {{ stat.loading }}</span>
      <slot name="status" :data="engine?.getData()" :engine="engine" />
    </div>
  </div>
</template>

<style scoped>
.x6rg {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 320px;
  overflow: hidden;
  border-radius: var(--el-border-radius-base, 8px);
  background: var(--el-bg-color, #fff);
}
.x6rg__palette {
  width: 220px;
  flex-shrink: 0;
  border-right: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color-page);
  overflow: auto;
}
.x6rg__main {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.x6rg__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color-page);
  flex-shrink: 0;
}
.x6rg__toolbar-left,
.x6rg__toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.x6rg__search {
  display: flex;
  align-items: center;
  gap: 6px;
}
.x6rg__search :deep(.el-input) {
  width: 220px;
}
.x6rg__searchbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color-page);
}
.x6rg__searchbar :deep(.el-input) {
  flex: 1;
  max-width: 320px;
}
.x6rg__count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.x6rg__canvas {
  position: relative;
  flex: 1;
  min-height: 0;
  background:
    radial-gradient(circle, rgba(0, 0, 0, 0.04) 1px, transparent 1px) 0 0 / 20px 20px;
}
.x6rg__minimap {
  position: absolute;
  right: 12px;
  bottom: 12px;
  width: 200px;
  height: 140px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  background: var(--el-bg-color-overlay, #fff);
  overflow: hidden;
  z-index: 5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.x6rg__minimap-tag {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.x6rg__context-menu {
  position: fixed;
  z-index: 1000;
  min-width: 160px;
  background: var(--el-bg-color-overlay, #fff);
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base, 8px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  padding: 4px;
  font-size: 13px;
  color: var(--el-text-color-primary);
}
.x6rg__context-menu-title {
  padding: 6px 10px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.x6rg__context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  cursor: pointer;
  transition: background 0.12s ease;
}
.x6rg__context-menu-item:hover {
  background: var(--el-fill-color-light);
}
.x6rg__context-menu-item--danger {
  color: var(--el-color-danger);
}
.x6rg__context-menu-item--danger:hover {
  background: var(--el-color-danger-light-9);
}
.x6rg__statusbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 6px 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  border-top: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color-page);
  flex-shrink: 0;
}
</style>
