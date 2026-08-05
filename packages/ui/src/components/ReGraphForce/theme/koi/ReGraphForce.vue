<script setup lang="ts">
/**
 * ReGraphForce koi 主题 —— 力导向图（精简版）
 */
import { computed, onBeforeUnmount, shallowRef, watch } from "vue";
import RelationGraph, {
  type RGJsonData,
  type RGNode,
  type RGNodeSlotProps,
  type RGOptions,
} from "@relation-graph/vue3";
import "@relation-graph/vue3/style.css";
import {
  LayoutDefaults,
  ReGraphDefaults,
  buildContainerStyle,
  buildFinalData,
} from "../../../ReGraph/internals";

defineOptions({ name: "ReGraphForce" });

const props = withDefaults(
  defineProps<{
    data?: RGJsonData;
    nodes?: import("@relation-graph/vue3").JsonNode[];
    lines?: import("@relation-graph/vue3").JsonLine[];
    options?: RGOptions;
    height?: string | number;
    width?: string | number;
    debug?: boolean;
    editable?: boolean;
  }>(),
  ReGraphDefaults,
);

const emit = defineEmits<{
  (e: "ready", instance: unknown): void;
  (e: "node-click", node: RGNode, ev: unknown): void;
  (e: "line-click", line: unknown, link: unknown, ev: unknown): void;
}>();

const instance = shallowRef<unknown>(null);

const finalOptions = computed<RGOptions>(() => {
  const userOpts = props.options ?? {};
  return {
    debug: props.debug,
    showDebugPanel: false,
    defaultNodeWidth: 50,
    defaultNodeHeight: 50,
    ...userOpts,
    layout: { ...LayoutDefaults.force, ...(userOpts.layout ?? {}) } as RGOptions["layout"],
  };
});

const finalData = computed<RGJsonData>(() => buildFinalData(props.data, props.nodes, props.lines));
const containerStyle = computed(() => buildContainerStyle(props.width, props.height));

async function onReady(ins: unknown) {
  instance.value = ins;
  emit("ready", ins);
}

function onNodeClick(node: RGNode, ev: unknown) {
  emit("node-click", node, ev);
}

function onLineClick(line: unknown, link: unknown, ev: unknown) {
  emit("line-click", line, link, ev);
}

watch(() => props.data, async () => {
  const ins = instance.value as { refresh?: () => Promise<void> } | null;
  if (ins && typeof ins.refresh === "function") await ins.refresh();
});

onBeforeUnmount(() => {
  instance.value = null;
});
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
          <div class="re-graph-koi__node">{{ node.text }}</div>
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