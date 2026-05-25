<template>
  <div class="exec-flow-panel">
    <div class="exec-flow-panel__header">
      <span class="exec-flow-panel__title">编排流程图</span>
      <span class="exec-flow-panel__hint">点击节点查看步骤详情</span>
    </div>
    <div class="exec-flow-panel__canvas" ref="canvasWrapperRef">
      <FlowEditor
        v-if="schema"
        mode="preview"
        :nodes="canvasNodes"
        :edges="canvasEdges"
        :selected-node-id="selectedNodeId"
        @node-click="onNodeClick"
      />
      <div v-else class="exec-flow-panel__empty">暂无编排数据</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import FlowEditor from "../../../../components/FlowEditor.vue";
import type { SpiderFlowSchema, SpiderExecutionStepView } from "../../../../types/orchestration";

const props = defineProps<{
  schema: SpiderFlowSchema | null;
  steps: SpiderExecutionStepView[];
  selectedNodeId: string | null;
}>();

const emit = defineEmits<{
  (e: "select-node", nodeId: string): void;
}>();

const canvasNodes = computed(() => {
  if (!props.schema) return [];
  return props.schema.nodes.map((n) => {
    const step = props.steps.find((s) => s.spiderNodeCode === n.id);
    return {
      id: n.id,
      type: n.type,
      label: n.title || n.type,
      typeLabel: n.type,
      position: n.position,
      runtimeStatus: step?.spiderStepStatus,
      displayInfo: step?.spiderDisplayInfo,
      errorMessage: step?.spiderErrorMessage,
    };
  });
});

const canvasEdges = computed(() => {
  if (!props.schema) return [];
  return props.schema.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    runtimeStatus: undefined as string | undefined,
    visited: undefined as boolean | undefined,
  }));
});

function onNodeClick(nodeId: string) {
  emit("select-node", nodeId);
}
</script>

<style scoped>
.exec-flow-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.exec-flow-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.exec-flow-panel__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--lay-text-primary);
}
.exec-flow-panel__hint {
  font-size: 10px;
  color: var(--lay-text-placeholder);
}
.exec-flow-panel__canvas {
  height: 400px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.06);
  background: rgba(0,0,0,0.15);
}
.exec-flow-panel__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--lay-text-placeholder);
  font-size: 13px;
}
</style>
