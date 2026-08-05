<script setup lang="ts">
/**
 * ReGraphMind default 主题 —— 思维导图
 */
import { computed, onBeforeUnmount, shallowRef, watch } from "vue";
import RelationGraph, {
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
  LayoutDefaults,
  ReGraphDefaults,
  buildContainerStyle,
  buildFinalData,
} from "../../../ReGraph/internals";

defineOptions({ name: "ReGraphMind" });

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
  (e: "node-click", node: RGNode, ev: RGUserEvent): void;
  (e: "line-click", line: RGLine, link: RGLink, ev: RGUserEvent): void;
}>();

const instance = shallowRef<unknown>(null);

const finalOptions = computed<RGOptions>(() => {
  const userOpts = props.options ?? {};
  return {
    debug: props.debug,
    showDebugPanel: false,
    defaultLineShape: 1,
    defaultNodeShape: 0,
    defaultNodeWidth: 80,
    defaultNodeHeight: 36,
    defaultLineTextOnPath: true,
    defaultExpandHolderPosition: "right",
    ...userOpts,
    layout: { ...LayoutDefaults.mind, ...(userOpts.layout ?? {}) } as RGOptions["layout"],
  };
});

const finalData = computed<RGJsonData>(() => buildFinalData(props.data, props.nodes, props.lines));
const containerStyle = computed(() => buildContainerStyle(props.width, props.height));

async function onReady(ins: unknown) {
  instance.value = ins;
  emit("ready", ins);
}

function onNodeClick(node: RGNode, ev: RGUserEvent) {
  emit("node-click", node, ev);
}

function onLineClick(line: RGLine, link: RGLink, ev: RGUserEvent) {
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
  <div class="re-graph re-graph--mind" :style="containerStyle">
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
      <template v-if="$slots.view" #view>
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
  color: var(--el-text-color-primary);
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
</style>