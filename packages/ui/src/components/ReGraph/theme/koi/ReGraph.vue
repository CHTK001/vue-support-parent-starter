<script setup lang="ts">
/**
 * ReGraph koi 主题 —— 精简关系图组件
 *
 * 与 default 主题差异：
 *   - 移除工具栏/小地图插槽，专注核心渲染
 *   - 默认模式为 relation（中心布局），更适合仪表盘场景
 *   - 节点文本统一样式
 */
import { computed, ref, shallowRef } from "vue";
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
  }>(),
  {
    data: undefined,
    nodes: undefined,
    lines: undefined,
    options: undefined,
    height: "100%",
    width: "100%",
    debug: false,
  },
);

const emit = defineEmits<{
  (e: "ready", instance: unknown): void;
  (e: "node-click", node: RGNode, e: RGUserEvent): void;
  (e: "line-click", line: RGLine, link: RGLink, e: RGUserEvent): void;
}>();

const instance = shallowRef<unknown>(null);

const finalOptions = computed<RGOptions>(() => {
  const base: RGOptions = {
    debug: props.debug,
    showDebugPanel: false,
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
    layout: { ...base.layout, ...(userOpts.layout ?? {}) } as RGOptions["layout"],
  };
});

const finalData = computed<RGJsonData>(() => {
  if (props.data) return props.data;
  return {
    rootId: "",
    nodes: props.nodes ?? [],
    lines: props.lines ?? [],
  } as RGJsonData;
});

const containerStyle = computed<Record<string, string>>(() => ({
  width: typeof props.width === "number" ? `${props.width}px` : props.width,
  height: typeof props.height === "number" ? `${props.height}px` : props.height,
}));

async function onReady(ins: unknown) {
  instance.value = ins;
  emit("ready", ins);
}

function onNodeClick(node: RGNode, e: RGUserEvent) {
  emit("node-click", node, e);
}

function onLineClick(line: RGLine, link: RGLink, e: RGUserEvent) {
  emit("line-click", line, link, e);
}
</script>

<template>
  <div class="re-graph-koi" :style="containerStyle">
    <RelationGraph
      :data="finalData"
      :options="finalOptions"
      @ready="onReady"
      @node-click="onNodeClick"
      @line-click="onLineClick"
    >
      <template #node="{ node }: RGNodeSlotProps">
        <slot name="node" :node="node">
          <div class="re-graph-koi__node">
            {{ node.text }}
          </div>
        </slot>
      </template>
    </RelationGraph>
  </div>
</template>

<style scoped>
.re-graph-koi {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 200px;
  overflow: hidden;
  border-radius: 6px;
  background: var(--el-fill-color-blank, #fff);
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
</style>