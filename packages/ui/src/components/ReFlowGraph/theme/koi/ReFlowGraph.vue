<script setup lang="ts">
/**
 * ReFlowGraph koi 主题 —— 设计器的视图形态
 *
 * 只做一件事：把 editable 翻译成 readonly / showPalette，事件与实例方法透传给 default 外壳。
 * 具名插槽按外壳实际提供的 #properties / #toolbar 逐个转发，漏掉任一个页面就拿不到对应区域。
 */
import { computed, ref } from "vue";
import FlowShell from "../default/ReFlowGraph.vue";
import type { FlowGraphEngine } from "../../internals/engine";
import type { FlowEdge, FlowGraphData, FlowNode, FlowNodeTypeDef, FlowSelection, FlowStructureIssue } from "../../internals/types";

defineOptions({ name: "ReFlowGraph" });

const props = withDefaults(
  defineProps<{
    data?: FlowGraphData;
    nodeTypes?: FlowNodeTypeDef[];
    height?: string | number;
    width?: string | number;
    /** 需要现场编排时打开，默认只读 */
    editable?: boolean;
    showToolbar?: boolean;
    startType?: string;
    endType?: string;
    propertiesTitle?: string;
  }>(),
  {
    data: () => ({ nodes: [], edges: [] }),
    nodeTypes: () => [],
    height: "100%",
    width: "100%",
    editable: false,
    showToolbar: true,
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
  (e: "edge-click", edge: FlowEdge, ev: MouseEvent): void;
  (e: "edge-connected", edge: FlowEdge): void;
}>();

const shell = ref<InstanceType<typeof FlowShell> | null>(null);
const shellData = computed(() => props.data);

defineExpose({
  get engine(): FlowGraphEngine | null {
    return shell.value?.engine ?? null;
  },
  addNode: (type: string) => shell.value?.addNode(type) ?? null,
  check: (): FlowStructureIssue[] => shell.value?.check() ?? [],
  getData: (): FlowGraphData => shell.value?.getData() ?? { nodes: [], edges: [] },
  exportPNG: (name?: string) => shell.value?.exportPNG(name),
  focus: (id: string) => shell.value?.focus(id),
});
</script>

<template>
  <FlowShell
    ref="shell"
    :data="shellData"
    :node-types="nodeTypes"
    :height="height"
    :width="width"
    :show-toolbar="showToolbar"
    :show-palette="editable"
    :show-properties="editable"
    :readonly="!editable"
    :start-type="startType"
    :end-type="endType"
    :properties-title="propertiesTitle"
    @ready="(e: FlowGraphEngine) => emit('ready', e)"
    @change="(d: FlowGraphData) => emit('change', d)"
    @select="(s: FlowSelection) => emit('select', s)"
    @node-click="(n: FlowNode, ev: MouseEvent) => emit('node-click', n, ev)"
    @node-dblclick="(n: FlowNode, ev: MouseEvent) => emit('node-dblclick', n, ev)"
    @edge-click="(e: FlowEdge, ev: MouseEvent) => emit('edge-click', e, ev)"
    @edge-connected="(e: FlowEdge) => emit('edge-connected', e)"
  >
    <template #properties="slotProps">
      <slot name="properties" v-bind="slotProps" />
    </template>
    <template #toolbar="slotProps">
      <slot name="toolbar" v-bind="slotProps" />
    </template>
  </FlowShell>
</template>
