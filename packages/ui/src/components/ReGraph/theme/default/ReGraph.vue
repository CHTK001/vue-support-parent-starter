<script setup lang="ts">
/**
 * ReGraph default 主题 —— 关系图全能组件
 *
 * 封装 @relation-graph/vue3，提供：
 *   - data / options / instance 全套 props 透传
 *   - mode 预设：force（力导向）/ mind（思维导图）/ tree（树状）/ relation（关系图）
 *   - 支持插槽：node、line、view、toolbar
 *   - emit 事件：ready、node-click、line-click、layout-change
 *
 * 使用：
 *   <ReGraph :data="graphData" mode="force" :options="options" @ready="onReady" />
 *   <ReGraph mode="mind" :data="mindData" />
 */
import { computed, onBeforeUnmount, ref, shallowRef, watch } from "vue";
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

defineOptions({ name: "ReGraph", inheritAttrs: true });

/** 预设布局模式 */
export type ReGraphMode =
  | "force"
  | "mind"
  | "tree"
  | "circle"
  | "center"
  | "fixed"
  | "relation";

const props = withDefaults(
  defineProps<{
    /** 预设模式（决定默认布局与配置），可被 options.layoutName 覆盖 */
    mode?: ReGraphMode;
    /** 节点/连线数据 */
    data?: RGJsonData;
    /** 节点列表（与 data.nodes 二选一） */
    nodes?: JsonNode[];
    /** 连线列表（与 data.lines 二选一） */
    lines?: JsonLine[];
    /** 图配置 */
    options?: RGOptions;
    /** 容器高度 */
    height?: string | number;
    /** 容器宽度 */
    width?: string | number;
    /** 是否显示工具栏（缩放/居中/全屏） */
    showToolbar?: boolean;
    /** 是否显示小地图 */
    showMiniView?: boolean;
    /** 是否启用编辑模式（拖拽节点/创建连线） */
    editable?: boolean;
    /** 是否显示调试信息 */
    debug?: boolean;
  }>(),
  {
    mode: "force",
    data: undefined,
    nodes: undefined,
    lines: undefined,
    options: undefined,
    height: "100%",
    width: "100%",
    showToolbar: true,
    showMiniView: false,
    editable: false,
    debug: false,
  },
);

const emit = defineEmits<{
  /** 图实例初始化完成 */
  (e: "ready", instance: unknown): void;
  /** 节点点击 */
  (e: "node-click", node: RGNode, e: RGUserEvent): void;
  /** 连线点击 */
  (e: "line-click", line: RGLine, link: RGLink, e: RGUserEvent): void;
  /** 布局切换 */
  (e: "layout-change", name: string): void;
}>();

/** relation-graph 实例引用 */
const instance = shallowRef<unknown>(null);

/** 当前模式对应的默认 options */
function buildDefaultOptions(mode: ReGraphMode): RGOptions {
  const base: RGOptions = {
    debug: props.debug,
    showDebugPanel: false,
    defaultLineShape: 1,
    defaultNodeShape: 0,
    defaultNodeWidth: 60,
    defaultNodeHeight: 60,
    defaultLineTextOnPath: true,
    defaultExpandHolderPosition: "right",
    reLayoutWhenExpandedOrCollapsed: true,
  };

  switch (mode) {
    case "force":
      return {
        ...base,
        layout: {
          layoutName: "force",
          force_node_repulsion: 1000,
          force_line_elastic: 100,
          force_friction: 0.6,
          preventNodeOverlap: true,
          preventOverlapInnerPadding: 20,
        } as RGOptions["layout"],
      };
    case "mind":
      return {
        ...base,
        layout: {
          layoutName: "mindmap",
        } as RGOptions["layout"],
      };
    case "tree":
      return {
        ...base,
        layout: {
          layoutName: "tree",
          from: "top",
          distance_coefficient: 1.2,
        } as RGOptions["layout"],
      };
    case "circle":
      return {
        ...base,
        layout: { layoutName: "circle" } as RGOptions["layout"],
      };
    case "center":
      return {
        ...base,
        layout: { layoutName: "center" } as RGOptions["layout"],
      };
    case "fixed":
      return {
        ...base,
        layout: { layoutName: "fixed" } as RGOptions["layout"],
      };
    case "relation":
    default:
      return {
        ...base,
        layout: { layoutName: "center" } as RGOptions["layout"],
      };
  }
}

/** 最终 options：用户传入优先，否则按 mode 生成 */
const finalOptions = computed<RGOptions>(() => {
  const userOpts = props.options ?? {};
  const modeOpts = buildDefaultOptions(props.mode);
  return {
    ...modeOpts,
    ...userOpts,
    layout: { ...modeOpts.layout, ...(userOpts.layout ?? {}) } as RGOptions["layout"],
  };
});

/** 最终 data：data 优先，否则组装 nodes/lines */
const finalData = computed<RGJsonData>(() => {
  if (props.data) return props.data;
  return {
    rootId: "",
    nodes: props.nodes ?? [],
    lines: props.lines ?? [],
  } as RGJsonData;
});

/** 容器样式 */
const containerStyle = computed<Record<string, string>>(() => ({
  width: typeof props.width === "number" ? `${props.width}px` : props.width,
  height: typeof props.height === "number" ? `${props.height}px` : props.height,
}));

/** 等待实例就绪 */
async function onReady(ins: unknown) {
  instance.value = ins;
  emit("ready", ins);
}

/** 节点点击 */
function onNodeClick(node: RGNode, e: RGUserEvent) {
  emit("node-click", node, e);
}

/** 连线点击 */
function onLineClick(line: RGLine, link: RGLink, e: RGUserEvent) {
  emit("line-click", line, link, e);
}

/** mode 切换时重新布局 */
watch(
  () => props.mode,
  async () => {
    const ins = instance.value as { refresh?: () => Promise<void>; setOptions?: (o: RGOptions) => Promise<void> } | null;
    if (!ins) return;
    if (typeof ins.setOptions === "function") {
      await ins.setOptions(finalOptions.value);
    }
    if (typeof ins.refresh === "function") {
      await ins.refresh();
    }
  },
);

onBeforeUnmount(() => {
  instance.value = null;
});
</script>

<template>
  <div class="re-graph" :style="containerStyle">
    <RelationGraph
      :data="finalData"
      :options="finalOptions"
      @ready="onReady"
      @node-click="onNodeClick"
      @line-click="onLineClick"
    >
      <template #node="{ node, checked, dragging }: RGNodeSlotProps">
        <slot name="node" :node="node" :checked="checked" :dragging="dragging">
          <div class="re-graph__default-node">
            <span>{{ node.text }}</span>
          </div>
        </slot>
      </template>

      <template v-if="showToolbar || showMiniView" #view>
        <slot name="view" />
      </template>

      <template v-if="$slots.toolbar" #toolbar>
        <slot name="toolbar" :instance="instance" />
      </template>
    </RelationGraph>
  </div>
</template>

<style scoped>
.re-graph {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 200px;
  overflow: hidden;
  border-radius: var(--el-border-radius-base, 8px);
  background: var(--el-bg-color, #fff);
}
.re-graph :deep(.rel-map) {
  background: var(--el-bg-color, #fff);
}
.re-graph__default-node {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  font-size: 13px;
  color: var(--el-text-color-primary, #1f2329);
  background: var(--el-color-primary-light-9, #f5f7fa);
  border: 1px solid var(--el-border-color-light, #e4e7ed);
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
</style>