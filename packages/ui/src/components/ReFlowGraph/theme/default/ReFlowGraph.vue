<script setup lang="ts">
/**
 * ReFlowGraph —— 可视化流程设计器（X6 内核，spider-flow 同款交互）
 *
 * 一个页面内完成整条流程：左侧调色板（点击或拖拽入板）→ 画布连磁吸出正交彩线 →
 * 点节点/连线后面板区直接编辑参数（表单由 #properties 插槽提供，组件不猜业务）。
 *
 * 提供能力：撤销重做、框选、复制粘贴、辅助线、就地改名、右键菜单、结构预检、
 * 缩放/适配/网格/小地图、PNG 导出、JSON 导入导出。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from "vue";
import ReButton from "../../../ReButton/ReButton.vue";
import { FlowGraphEngine } from "../../internals/engine";
import { resolveFlowIcon } from "../../internals/icons";
import type { FlowEdge, FlowGraphData, FlowNode, FlowNodeTypeDef, FlowSelection, FlowStructureIssue } from "../../internals/types";

defineOptions({ name: "ReFlowGraph" });

const props = withDefaults(
  defineProps<{
    /** 整图数据 */
    data?: FlowGraphData;
    /** 调色板节点类型（一般由后端 metas 驱动） */
    nodeTypes?: FlowNodeTypeDef[];
    /** 只读 */
    readonly?: boolean;
    height?: string | number;
    width?: string | number;
    showToolbar?: boolean;
    showPalette?: boolean;
    /** 底部属性停靠区，只读视图可关掉 */
    showProperties?: boolean;
    /** 开始 / 结束节点类型名，结构预检用 */
    startType?: string;
    endType?: string;
    /** 面板区标题 */
    propertiesTitle?: string;
  }>(),
  {
    data: () => ({ nodes: [], edges: [] }),
    nodeTypes: () => [],
    readonly: false,
    height: "100%",
    width: "100%",
    showToolbar: true,
    showPalette: true,
    showProperties: true,
    startType: "start",
    endType: "end",
    propertiesTitle: "属性",
  },
);

const emit = defineEmits<{
  (e: "ready", engine: FlowGraphEngine): void;
  (e: "change", data: FlowGraphData): void;
  (e: "select", selection: FlowSelection): void;
  (e: "node-click", node: FlowNode, ev: MouseEvent): void;
  (e: "node-dblclick", node: FlowNode, ev: MouseEvent): void;
  (e: "node-contextmenu", node: FlowNode, ev: MouseEvent): void;
  (e: "edge-click", edge: FlowEdge, ev: MouseEvent): void;
  (e: "edge-connected", edge: FlowEdge): void;
  (e: "history-change", state: { canUndo: boolean; canRedo: boolean }): void;
}>();

const canvasRef = ref<HTMLDivElement | null>(null);
const minimapRef = ref<HTMLDivElement | null>(null);
const engine = shallowRef<FlowGraphEngine | null>(null);

const ui = reactive({
  minimap: false,
  grid: true,
  collapsed: false,
  propsHeight: 236,
  scale: 1,
  canUndo: false,
  canRedo: false,
  nodes: 0,
  edges: 0,
});
const selection = ref<FlowSelection>(null);
const issues = ref<FlowStructureIssue[]>([]);
const rename = reactive({ visible: false, value: "", id: "", left: 0, top: 0, width: 120 });
const menu = reactive({ visible: false, x: 0, y: 0, node: null as FlowNode | null });

const shellStyle = computed(() => ({
  height: typeof props.height === "number" ? `${props.height}px` : props.height,
  width: typeof props.width === "number" ? `${props.width}px` : props.width,
}));

/** 调色板按 group 分段 */
const palette = computed(() => {
  const groups: { name: string; items: FlowNodeTypeDef[] }[] = [];
  props.nodeTypes.forEach((t) => {
    const name = t.group ?? "节点";
    let bucket = groups.find((g) => g.name === name);
    if (!bucket) {
      bucket = { name, items: [] };
      groups.push(bucket);
    }
    bucket.items.push(t);
  });
  return groups;
});

function iconOf(t: FlowNodeTypeDef): string {
  return t.path ?? resolveFlowIcon(t.type);
}

/** 调色板项的主色（CSS 变量） */
function chipStyle(t: FlowNodeTypeDef): Record<string, string> {
  return { "--chip-color": t.color || "#4f7cff" };
}

/**
 * 画布结构签名。父级常把 change 事件的数据回写进 props.data，
 * 用它判断是否真的换了一张图，避免自激重载丢掉撤销栈和选中态。
 */
function sigOf(d: FlowGraphData): string {
  return JSON.stringify([
    (d.nodes ?? []).map((n) => [n.id, n.type, n.label, n.x, n.y]),
    (d.edges ?? []).map((e) => [e.id, e.from, e.to, e.kind, e.label, e.transfer]),
  ]);
}

function syncStat() {
  if (!engine.value) return;
  const d = engine.value.getData();
  ui.nodes = d.nodes.length;
  ui.edges = d.edges.length;
}

onMounted(async () => {
  await nextTick();
  if (!canvasRef.value) return;
  engine.value = new FlowGraphEngine({
    container: canvasRef.value,
    minimapContainer: minimapRef.value,
    nodeTypes: props.nodeTypes,
    readonly: props.readonly,
    grid: true,
    handlers: {
      onReady: (eng) => {
        eng.setData(props.data ?? { nodes: [], edges: [] });
        applied = sigOf(props.data ?? { nodes: [], edges: [] });
        syncStat();
        emit("ready", eng);
      },
      onSelect: (sel) => {
        selection.value = sel;
        emit("select", sel);
      },
      onChange: (data) => {
        syncStat();
        emit("change", data);
      },
      onNodeClick: (node, ev) => emit("node-click", node, ev),
      onNodeDblClick: (node) => startRename(node.id),
      onNodeContextMenu: (node, ev) => {
        menu.visible = true;
        menu.x = ev.clientX;
        menu.y = ev.clientY;
        menu.node = node;
        emit("node-contextmenu", node, ev);
      },
      onEdgeClick: (edge, ev) => emit("edge-click", edge, ev),
      onEdgeConnected: (edge) => emit("edge-connected", edge),
      onHistoryChange: (state) => {
        ui.canUndo = state.canUndo;
        ui.canRedo = state.canRedo;
        emit("history-change", state);
      },
    },
  });
});

onBeforeUnmount(() => {
  engine.value?.dispose();
  engine.value = null;
});

let applied = sigOf({ nodes: [], edges: [] });

watch(
  () => props.data,
  () => {
    if (!engine.value) return;
    const next = sigOf(props.data ?? { nodes: [], edges: [] });
    if (next === applied) return;
    applied = next;
    engine.value.setData(props.data ?? { nodes: [], edges: [] });
    syncStat();
  },
  { deep: true },
);

// ------------------------------------------------------------
// 画布动作
// ------------------------------------------------------------
function addAtCenter(type: string) {
  const node = engine.value?.addNode(type);
  if (node) issues.value = [];
}

function onDrop(ev: DragEvent) {
  ev.preventDefault();
  const type = ev.dataTransfer?.getData("application/x-flow-type") || ev.dataTransfer?.getData("text/plain");
  if (!type || !engine.value) return;
  const p = engine.value.toLocalPoint(ev.clientX, ev.clientY);
  engine.value.addNode(type, p.x, p.y);
  issues.value = [];
}

function allowDragOver(ev: DragEvent) {
  ev.preventDefault();
  if (ev.dataTransfer) ev.dataTransfer.dropEffect = "copy";
}

function startRename(id: string) {
  if (!engine.value) return;
  const rect = engine.value.nodeClientRect(id);
  const node = engine.value.getData().nodes.find((n) => n.id === id);
  if (!rect || !node) return;
  rename.visible = true;
  rename.id = id;
  rename.value = node.label;
  rename.left = rect.left + rect.width / 2 - 70;
  rename.top = rect.top + rect.height + 4;
  rename.width = 140;
  nextTick(() => {
    const el = document.getElementById("flow-rename-input") as HTMLInputElement | null;
    el?.focus();
    el?.select();
  });
}

function commitRename() {
  if (rename.visible && engine.value) engine.value.updateNode(rename.id, { label: rename.value.trim() || "未命名" });
  rename.visible = false;
}

function cancelRename() {
  rename.visible = false;
}

function toggleGrid() {
  ui.grid = !ui.grid;
  if (!engine.value) return;
  if (ui.grid) engine.value.graph.showGrid();
  else engine.value.graph.hideGrid();
}

function runCheck(): FlowStructureIssue[] {
  issues.value = engine.value?.checkStructure(props.startType, props.endType) ?? [];
  return issues.value;
}

function zoom(delta: number) {
  engine.value?.zoomBy(delta);
  ui.scale = engine.value?.getScale() ?? 1;
}

function fit() {
  engine.value?.fitCenter();
  ui.scale = engine.value?.getScale() ?? 1;
}

function resetZoom() {
  engine.value?.resetZoom();
  ui.scale = 1;
}

function removeSelected() {
  engine.value?.removeSelected();
}

function copySelected() {
  engine.value?.copySelected(false);
}

function pasteCells() {
  engine.value?.paste();
}

function menuAction(action: "rename" | "locate" | "copy" | "delete") {
  const node = menu.node;
  menu.visible = false;
  if (!node || !engine.value) return;
  if (action === "rename") startRename(node.id);
  if (action === "locate") engine.value.focusNode(node.id);
  if (action === "copy") {
    engine.value.selectNode(node.id);
    copySelected();
  }
  if (action === "delete") {
    engine.value.removeNodes([node.id]);
    syncStat();
  }
}

// 面板区拖高
function startResize(ev: MouseEvent) {
  ev.preventDefault();
  const startY = ev.clientY;
  const startH = ui.propsHeight;
  const move = (e: MouseEvent) => {
    ui.propsHeight = Math.min(520, Math.max(120, startH - (e.clientY - startY)));
  };
  const up = () => {
    window.removeEventListener("mousemove", move);
    window.removeEventListener("mouseup", up);
  };
  window.addEventListener("mousemove", move);
  window.addEventListener("mouseup", up);
}

function closeMenu() {
  menu.visible = false;
}

onMounted(() => window.addEventListener("click", closeMenu));
onBeforeUnmount(() => window.removeEventListener("click", closeMenu));

defineExpose({
  engine,
  addNode: (type: string) => engine.value?.addNode(type) ?? null,
  check: runCheck,
  getData: (): FlowGraphData => engine.value?.getData() ?? { nodes: [], edges: [] },
  exportPNG: (name?: string) => engine.value?.exportPNG(name),
  focus: (id: string) => engine.value?.focusNode(id),
  issues,
});
</script>

<template>
  <div class="flow-shell" :style="shellStyle">
    <!-- 工具条 -->
    <div v-if="showToolbar" class="flow-toolbar">
      <div class="flow-tb-group">
        <ReButton layout="square" icon="RefreshLeft" :disabled="!ui.canUndo" @click="engine?.undo()">撤销</ReButton>
        <ReButton layout="square" icon="RefreshRight" :disabled="!ui.canRedo" @click="engine?.redo()">重做</ReButton>
      </div>
      <i class="flow-tb-sep" />
      <div class="flow-tb-group">
        <ReButton layout="square" icon="ZoomIn" @click="zoom(0.15)">放大</ReButton>
        <ReButton layout="square" icon="ZoomOut" @click="zoom(-0.15)">缩小</ReButton>
        <ReButton layout="square" icon="Aim" @click="resetZoom">1:1</ReButton>
        <ReButton layout="square" icon="FullScreen" @click="fit">适应画布</ReButton>
      </div>
      <i class="flow-tb-sep" />
      <div class="flow-tb-group">
        <ReButton layout="square" icon="Grid" :type="ui.grid ? 'primary' : ''" @click="toggleGrid">网格</ReButton>
        <ReButton layout="square" icon="Histogram" :type="ui.minimap ? 'primary' : ''" @click="ui.minimap = !ui.minimap">缩略图</ReButton>
        <ReButton v-if="!readonly" layout="square" icon="CircleCheck" @click="runCheck">结构校验</ReButton>
      </div>
      <div class="flow-tb-spacer" />
      <div class="flow-tb-stat">
        <span>{{ ui.nodes }} 节点</span><i>/</i><span>{{ ui.edges }} 连线</span><i>/</i>
        <span>{{ Math.round(ui.scale * 100) }}%</span>
      </div>
      <div class="flow-tb-group"><slot name="toolbar" :engine="engine" /></div>
    </div>

    <!-- 主体 -->
    <div class="flow-main">
      <aside v-if="showPalette && !readonly" class="flow-palette">
        <div v-for="g in palette" :key="g.name" class="flow-palette-group">
          <div class="flow-palette-title">{{ g.name }}</div>
          <div class="flow-palette-items">
            <div
              v-for="t in g.items"
              :key="t.type"
              class="flow-chip"
              :style="chipStyle(t)"
              :title="t.tips || t.label"
              draggable="true"
              @dragstart="
                $event.dataTransfer?.setData('application/x-flow-type', t.type);
                $event.dataTransfer?.setData('text/plain', t.type);
              "
              @click="addAtCenter(t.type)"
            >
              <span class="flow-chip-badge">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7"
                     stroke-linecap="round" stroke-linejoin="round">
                  <path :d="iconOf(t)" />
                </svg>
              </span>
              <span class="flow-chip-label">{{ t.label }}</span>
            </div>
          </div>
        </div>
      </aside>

      <div class="flow-canvas-wrap">
        <div
          ref="canvasRef"
          class="flow-canvas"
          
          @dragover="allowDragOver"
          @drop="onDrop"
        />
        <div v-show="ui.minimap" class="flow-minimap">
          <div ref="minimapRef" />
        </div>
        <div v-if="!ui.nodes && !readonly" class="flow-empty">
          <div class="flow-empty-title">从左侧拖入节点开始编排</div>
          <div class="flow-empty-sub">拖动节点边缘的圆点可连线，空格 + 拖拽平移画布，Ctrl + 滚轮缩放</div>
        </div>
      </div>
    </div>

    <!-- 停靠属性面板 -->
    <section v-if="showProperties" class="flow-props" :style="{ height: ui.collapsed ? '34px' : ui.propsHeight + 'px' }">
      <div class="flow-props-head" @mousedown="startResize">
        <span class="flow-props-grip" />
        <span class="flow-props-title">
          {{ propertiesTitle }}
          <em v-if="selection">{{ selection.kind === 'node' ? selection.node.label : '连线' }}</em>
          <em v-else class="muted">未选中</em>
        </span>
        <ReButton layout="square" size="small" :icon="ui.collapsed ? 'ArrowUp' : 'ArrowDown'"
                  @click="ui.collapsed = !ui.collapsed">
          {{ ui.collapsed ? '展开' : '收起' }}
        </ReButton>
      </div>
      <div v-show="!ui.collapsed" class="flow-props-body">
        <slot name="properties" :selection="selection" :node="selection?.kind === 'node' ? selection.node : null"
              :edge="selection?.kind === 'edge' ? selection.edge : null" :node-types="nodeTypes" :engine="engine">
          <div class="flow-props-hint">选中节点或连线后在此编辑参数</div>
        </slot>
      </div>
    </section>

    <!-- 结构问题 -->
    <div v-if="issues.length" class="flow-issues">
      <div v-for="(it, i) in issues" :key="i" class="flow-issue" :class="it.level" @click="it.cellId && engine?.focusNode(it.cellId)">
        {{ it.message }}
      </div>
    </div>

    <!-- 就地改名 -->
    <input v-if="rename.visible" id="flow-rename-input" v-model="rename.value" class="flow-rename"
           :style="{ left: rename.left + 'px', top: rename.top + 'px', width: rename.width + 'px' }"
           @keyup.enter="commitRename" @keyup.esc="cancelRename" @blur="commitRename" />

    <!-- 右键菜单 -->
    <ul v-if="menu.visible" class="flow-menu" :style="{ left: menu.x + 'px', top: menu.y + 'px' }" @click.stop>
      <li @click="menuAction('rename')">重命名</li>
      <li @click="menuAction('locate')">定位</li>
      <li @click="menuAction('copy')">复制</li>
      <li class="danger" @click="menuAction('delete')">删除</li>
    </ul>
  </div>
</template>

<style scoped>
.flow-shell {
  --flow-accent: #4f7cff;
  --flow-chrome: #1f2429;
  --flow-chrome-2: #272d34;
  --flow-line: #e8eaef;
  --flow-font: "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f7f8fa;
  border: 1px solid var(--flow-line);
  border-radius: 10px;
  font-family: var(--flow-font);
}
.flow-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 42px;
  flex: none;
  padding: 0 10px;
  background: linear-gradient(180deg, var(--flow-chrome-2), var(--flow-chrome));
}
.flow-tb-group { display: flex; align-items: center; gap: 4px; }
.flow-tb-sep { width: 1px; height: 18px; margin: 0 4px; background: rgba(255, 255, 255, 0.12); }
.flow-tb-spacer { flex: 1; }
.flow-tb-stat { display: flex; gap: 6px; font-size: 12px; color: #98a2ad; font-variant-numeric: tabular-nums; }
.flow-tb-stat i { font-style: normal; opacity: 0.4; }
.flow-main { display: flex; flex: 1; min-height: 0; }
.flow-palette {
  width: 148px;
  flex: none;
  overflow-y: auto;
  padding: 8px;
  background: #fff;
  border-right: 1px solid var(--flow-line);
}
.flow-palette-title { margin: 6px 2px; font-size: 11px; letter-spacing: 0.5px; color: #a4abb5; }
.flow-palette-items { display: flex; flex-direction: column; gap: 4px; }
.flow-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 7px;
  font-size: 12px;
  color: #4e5969;
  cursor: grab;
  border: 1px solid transparent;
  border-radius: 7px;
  transition: all 0.16s ease;
}
.flow-chip:hover { color: var(--chip-color); background: color-mix(in srgb, var(--chip-color) 8%, #fff); border-color: color-mix(in srgb, var(--chip-color) 32%, #fff); }
.flow-chip:active { cursor: grabbing; transform: scale(0.98); }
.flow-chip-badge {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  color: #fff;
  background: var(--chip-color);
  border-radius: 6px;
}
.flow-chip-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.flow-canvas-wrap { position: relative; flex: 1; min-width: 0; }
.flow-canvas { position: absolute; inset: 0; }
.flow-minimap {
  position: absolute;
  right: 12px;
  bottom: 12px;
  padding: 6px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--flow-line);
  border-radius: 8px;
  box-shadow: 0 6px 18px rgba(15, 23, 32, 0.08);
}
.flow-empty { position: absolute; inset: 0; display: grid; place-content: center; gap: 6px; text-align: center; pointer-events: none; }
.flow-empty-title { font-size: 14px; color: #8f98a3; }
.flow-empty-sub { font-size: 12px; color: #b2b9c2; }
.flow-props {
  display: flex;
  flex-direction: column;
  flex: none;
  background: #fff;
  border-top: 1px solid var(--flow-line);
}
.flow-props-head {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  flex: none;
  padding: 0 10px;
  cursor: ns-resize;
  background: #fbfcfd;
  border-bottom: 1px solid var(--flow-line);
  user-select: none;
}
.flow-props-grip { width: 26px; height: 3px; border-radius: 2px; background: #d6dae0; }
.flow-props-title { flex: 1; font-size: 12px; color: #4e5969; }
.flow-props-title em { margin-left: 6px; font-style: normal; color: var(--flow-accent); }
.flow-props-title em.muted { color: #a4abb5; }
.flow-props-body { flex: 1; min-height: 0; overflow: auto; padding: 10px 12px; }
.flow-props-hint { font-size: 12px; color: #a4abb5; }
.flow-issues {
  position: absolute;
  left: 50%;
  bottom: 12px;
  z-index: 6;
  display: grid;
  gap: 4px;
  width: min(560px, 82%);
  transform: translateX(-50%);
}
.flow-issue {
  padding: 6px 10px;
  font-size: 12px;
  color: #b26a1f;
  cursor: pointer;
  background: rgba(255, 247, 232, 0.96);
  border: 1px solid #f7d9a8;
  border-radius: 6px;
}
.flow-issue.error { color: #c9403f; background: rgba(255, 240, 240, 0.96); border-color: #f5b9b9; }
.flow-rename {
  position: fixed;
  z-index: 20;
  padding: 3px 6px;
  font-size: 12px;
  text-align: center;
  border: 1px solid var(--flow-accent);
  border-radius: 5px;
  box-shadow: 0 4px 12px rgba(79, 124, 255, 0.2);
}
.flow-menu {
  position: fixed;
  z-index: 30;
  min-width: 128px;
  margin: 0;
  padding: 4px;
  font-size: 12px;
  list-style: none;
  background: #fff;
  border: 1px solid var(--flow-line);
  border-radius: 8px;
  box-shadow: 0 10px 28px rgba(15, 23, 32, 0.14);
}
.flow-menu li { padding: 6px 10px; color: #4e5969; cursor: pointer; border-radius: 5px; }
.flow-menu li:hover { background: #f2f6ff; color: var(--flow-accent); }
.flow-menu li.danger:hover { background: #fff1f0; color: #c9403f; }
:deep(.x6-port-body) { opacity: 0; transition: opacity 0.14s ease; }
:deep(.x6-node:hover .x6-port-body),
:deep(.x6-edge:hover) { cursor: pointer; }
</style>
