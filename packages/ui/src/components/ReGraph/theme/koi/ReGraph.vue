<script setup lang="ts">
/**
 * ReGraph koi 主题 —— 精简关系图组件
 *
 * 与 default 主题差异：
 *   - 顶部只保留一个轻量搜索框（高亮模式）
 *   - 右键菜单精简：扩展节点、定位、隐藏、删除
 *   - 节点文本统一样式
 *   - 适合仪表盘场景，只读+轻交互
 */
import {
  computed,
  onBeforeUnmount,
  reactive,
  ref,
  shallowRef,
} from "vue";
import { ElMessage } from "element-plus";
import {
  Connection,
  Delete,
  Position,
  Search,
} from "@element-plus/icons-vue";
import RelationGraph, {
  type JsonLine,
  type JsonNode,
  type RGJsonData,
  type RGLine,
  type RGLink,
  type RGNode,
  type RGNodeSlotProps,
  type RGOptions,
  type RGUserEvent,
} from "@relation-graph/vue3";
import "@relation-graph/vue3/style.css";
import {
  buildContainerStyle,
  buildFinalData,
  fuzzyMatchNodes,
  splitKeywords,
} from "../../internals";
import type { ExpandFetcher } from "../../internals";

defineOptions({ name: "ReGraph" });

const props = withDefaults(
  defineProps<{
    /** 节点/连线数据 */
    data?: RGJsonData;
    /** 节点列表 */
    nodes?: JsonNode[];
    /** 连线列表 */
    lines?: JsonLine[];
    /** 图配置 */
    options?: RGOptions;
    /** 容器高度 */
    height?: string | number;
    /** 容器宽度 */
    width?: string | number;
    /** 是否显示调试信息 */
    debug?: boolean;
    /** 是否显示搜索框 */
    showSearch?: boolean;
    /** 远程扩线接口 */
    fetchExpand?: ExpandFetcher;
  }>(),
  {
    data: undefined,
    nodes: undefined,
    lines: undefined,
    options: undefined,
    height: "100%",
    width: "100%",
    debug: false,
    showSearch: true,
    fetchExpand: undefined,
  },
);

const emit = defineEmits<{
  (e: "ready", instance: unknown): void;
  (e: "node-click", node: RGNode, ev: RGUserEvent): void;
  (e: "line-click", line: RGLine, link: RGLink, ev: RGUserEvent): void;
  (e: "expand", node: JsonNode, payload: { nodes: JsonNode[]; links: JsonLine[] }): void;
}>();

const instance = shallowRef<unknown>(null);

const internalData = reactive<{ nodes: JsonNode[]; lines: JsonLine[] }>({
  nodes: [],
  lines: [],
});

const search = reactive({
  keyword: "",
  matched: [] as JsonNode[],
});

const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  node: null as JsonNode | null,
});

const loadingMap = reactive<Record<string, boolean>>({});

const finalOptions = computed<RGOptions>(() => {
  const base: RGOptions = {
    debug: props.debug,
    defaultLineShape: 1,
    defaultNodeShape: 0,
    defaultNodeWidth: 50,
    defaultNodeHeight: 50,
    defaultLineTextOnPath: true,
    layout: { layoutName: "center" } as RGOptions["layout"],
  };
  const userOpts = props.options ?? {};
  return {
    ...base,
    ...userOpts,
    layout: {
      ...base.layout,
      ...(userOpts.layout ?? {}),
    } as RGOptions["layout"],
  };
});

const finalData = computed<RGJsonData>(() => {
  if (props.data) return props.data;
  return {
    rootId: "",
    nodes: internalData.nodes.length ? internalData.nodes : (props.nodes ?? []),
    lines: internalData.lines.length ? internalData.lines : (props.lines ?? []),
  } as RGJsonData;
});

const containerStyle = computed(() => buildContainerStyle(props.width, props.height));

async function onReady(ins: unknown) {
  instance.value = ins;
  const incoming = props.data ?? {
    nodes: props.nodes ?? [],
    lines: props.lines ?? [],
  };
  internalData.nodes = [...(incoming.nodes ?? [])];
  internalData.lines = [...(incoming.lines ?? [])];
  emit("ready", ins);
}

function onNodeClick(node: RGNode, ev: RGUserEvent) {
  emit("node-click", node, ev);
}

function onLineClick(line: RGLine, link: RGLink, ev: RGUserEvent) {
  emit("line-click", line, link, ev);
}

// ============================================================
// 搜索高亮（仅高亮模式，路径模式不提供）
// ============================================================

async function runSearch(value: string) {
  search.keyword = value;
  if (!value.trim()) {
    await clearSearch();
    return;
  }
  const allNodes = (finalData.value.nodes ?? []) as JsonNode[];
  const keywords = splitKeywords(value);
  const matched = new Set<string>();
  keywords.forEach((kw) => {
    fuzzyMatchNodes(allNodes, kw).forEach((n) => matched.add(n.id));
  });
  const matchedNodes = allNodes.filter((n) => matched.has(n.id));
  search.matched = matchedNodes;
  const ins = instance.value as
    | {
        clearHighlight?: () => Promise<void>;
        setOthersDim?: (dim: boolean, opacity?: number) => Promise<void>;
        setNodesHighlight?: (ids: string[], style?: unknown) => Promise<void>;
      }
    | null;
  if (!ins) return;
  if (typeof ins.clearHighlight === "function") await ins.clearHighlight();
  if (typeof ins.setOthersDim === "function") await ins.setOthersDim(true, 0.15);
  if (typeof ins.setNodesHighlight === "function") {
    await ins.setNodesHighlight(matchedNodes.map((n) => n.id), {
      borderColor: "#ff6600",
      borderWidth: 3,
    });
  }
}

async function clearSearch() {
  search.keyword = "";
  search.matched = [];
  const ins = instance.value as
    | {
        clearHighlight?: () => Promise<void>;
        setOthersDim?: (dim: boolean) => Promise<void>;
      }
    | null;
  if (!ins) return;
  if (typeof ins.clearHighlight === "function") await ins.clearHighlight();
  if (typeof ins.setOthersDim === "function") await ins.setOthersDim(false);
}

// ============================================================
// 右键菜单（精简：扩展 / 定位 / 隐藏 / 删除）
// ============================================================

function onNodeContextMenu(node: JsonNode, ev: MouseEvent) {
  contextMenu.visible = true;
  contextMenu.x = ev.clientX;
  contextMenu.y = ev.clientY;
  contextMenu.node = node;
  ev.preventDefault();
}

function closeContextMenu() {
  contextMenu.visible = false;
}

async function handleMenuAction(action: "expand" | "focus" | "hide" | "remove") {
  const node = contextMenu.node;
  closeContextMenu();
  if (!node) return;
  const ins = instance.value as
    | {
        focusNodeById?: (id: string) => Promise<void>;
        hideNode?: (id: string) => Promise<void>;
        removeNodeById?: (id: string) => Promise<void>;
        addNodes?: (n: JsonNode[]) => Promise<void>;
        addLines?: (l: JsonLine[]) => Promise<void>;
        doLayout?: () => Promise<void>;
        getNodes?: () => RGNode[];
        getLinks?: () => RGLink[];
      }
    | null;
  if (!ins) return;
  if (action === "expand") {
    if (!props.fetchExpand) {
      ElMessage.info("未配置 fetchExpand，无法扩线");
      return;
    }
    if (loadingMap[node.id]) return;
    loadingMap[node.id] = true;
    try {
      const payload = await props.fetchExpand(node.id);
      const existingNodeIds = new Set(
        (ins.getNodes?.() ?? []).map((n) => (n as RGNode).id),
      );
      const existingLineKeys = new Set(
        (ins.getLinks?.() ?? []).map((l) => {
          const line = l as unknown as RGLine & { from?: string; to?: string };
          return `${line.from ?? ""}-${line.to ?? ""}`;
        }),
      );
      const newNodes = payload.nodes.filter((n) => !existingNodeIds.has(n.id));
      const newLines = payload.links.filter((l) => {
        const s = l.from ?? (l as { source?: string }).source;
        const t = l.to ?? (l as { target?: string }).target;
        return s && t && !existingLineKeys.has(`${s}-${t}`);
      });
      if (newNodes.length && typeof ins.addNodes === "function") {
        await ins.addNodes(newNodes);
      }
      if (newLines.length && typeof ins.addLines === "function") {
        await ins.addLines(newLines);
      }
      if (typeof ins.doLayout === "function") await ins.doLayout();
      internalData.nodes.push(...newNodes);
      internalData.lines.push(...newLines);
      emit("expand", node, payload);
    } finally {
      delete loadingMap[node.id];
    }
    return;
  }
  if (action === "focus" && typeof ins.focusNodeById === "function") {
    await ins.focusNodeById(node.id);
    return;
  }
  if (action === "hide" && typeof ins.hideNode === "function") {
    await ins.hideNode(node.id);
    return;
  }
  if (action === "remove" && typeof ins.removeNodeById === "function") {
    await ins.removeNodeById(node.id);
  }
}

function onCanvasClick() {
  if (contextMenu.visible) closeContextMenu();
}

onBeforeUnmount(() => {
  instance.value = null;
  contextMenu.visible = false;
});

defineExpose({
  instance,
  runSearch,
  clearSearch,
});
</script>

<template>
  <div class="re-graph-koi" :style="containerStyle" @click="onCanvasClick">
    <div v-if="showSearch" class="re-graph-koi__searchbar">
      <el-input
        v-model="search.keyword"
        placeholder="搜索节点"
        size="small"
        clearable
        @input="runSearch"
        @clear="clearSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <span v-if="search.matched.length" class="re-graph-koi__count">
        {{ search.matched.length }} 个匹配
      </span>
    </div>

    <div class="re-graph-koi__canvas">
      <RelationGraph
        :data="finalData"
        :options="finalOptions"
        @ready="onReady"
        @node-click="onNodeClick"
        @line-click="onLineClick"
        @node-contextmenu="onNodeContextMenu"
      >
        <template #node="{ node }: RGNodeSlotProps">
          <slot name="node" :node="node">
            <div class="re-graph-koi__node">{{ node.text }}</div>
          </slot>
        </template>

        <template v-if="$slots.view" #view>
          <slot name="view" :instance="instance" />
        </template>
      </RelationGraph>

      <div
        v-if="contextMenu.visible"
        class="re-graph-koi__context-menu"
        :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
        @click.stop
      >
        <div class="re-graph-koi__menu-item" @click="handleMenuAction('expand')">
          <el-icon><Connection /></el-icon>
          <span>扩展节点</span>
        </div>
        <div class="re-graph-koi__menu-item" @click="handleMenuAction('focus')">
          <el-icon><Position /></el-icon>
          <span>定位</span>
        </div>
        <div class="re-graph-koi__menu-item" @click="handleMenuAction('hide')">
          <span>隐藏</span>
        </div>
        <div
          class="re-graph-koi__menu-item re-graph-koi__menu-item--danger"
          @click="handleMenuAction('remove')"
        >
          <el-icon><Delete /></el-icon>
          <span>删除</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.re-graph-koi {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 240px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: var(--el-border-radius-base, 8px);
  background: var(--el-fill-color-blank, #fff);
}
.re-graph-koi__searchbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color-page);
}
.re-graph-koi__searchbar :deep(.el-input) {
  flex: 1;
  max-width: 320px;
}
.re-graph-koi__count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.re-graph-koi__canvas {
  position: relative;
  flex: 1;
  min-height: 0;
}

.re-graph-koi__node {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px 6px;
  font-size: 12px;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

.re-graph-koi__context-menu {
  position: fixed;
  z-index: 1000;
  min-width: 140px;
  background: var(--el-bg-color-overlay, #fff);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 4px;
  font-size: 13px;
  color: var(--el-text-color-primary);
}
.re-graph-koi__menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  cursor: pointer;
  transition: background 0.12s ease;
}
.re-graph-koi__menu-item:hover {
  background: var(--el-fill-color-light);
}
.re-graph-koi__menu-item--danger {
  color: var(--el-color-danger);
}
</style>
