<!--
  节点参数统一 Tab 外壳：基础信息 / 输入参数 / 输出参数 / 循环 / 高级配置。
  内层仍由各 shape 表单按 section 分区渲染，写回事件原样透传。
-->
<script setup lang="ts">
import { computed, ref } from "vue";
import ReInput from "@repo/ui/re-input";
import type { Component } from "vue";
import type { NodeForm, NodeFormContext } from "./nodes/paramContext";
import type { CollectParamMeta, CollectShapeMeta, CollectTaskLog } from "../../types/collect";
import type { ParamPair } from "../../utils/dsl";

const props = defineProps<{
  node: NodeForm;
  meta: CollectShapeMeta;
  ctx: NodeFormContext;
  activeForm: Component;
  stateText: (id: string) => string;
  selectedState?: CollectTaskLog | null;
  renameNode: (name: string) => void;
}>();

const emit = defineEmits<{
  (e: "set-param", param: CollectParamMeta, value: unknown): void;
  (e: "set-pairs", param: CollectParamMeta, pairs: ParamPair[]): void;
}>();

type TabKey = "basic" | "input" | "output" | "loop" | "advanced";

const ADVANCED = new Set([
  "timeout", "retry", "retryInterval", "proxy", "userAgent", "fetcher", "saveDocument",
  "batchSize", "onBatchError", "writeBack", "outputPrefix", "maxTokens", "temperature",
]);
const LOOP = new Set(["loopCount", "loopVariableName", "loopItemVariableName", "loopParallel"]);

const hasOutput = computed(
  () =>
    props.meta.params.some(
      p =>
        p.name === "outputVariable" ||
        p.name.startsWith("column:") ||
        p.name.startsWith("cell:") ||
        p.name.startsWith("key:"),
    ) || props.meta.fieldEditor,
);

const hasLoop = computed(() => props.meta.params.some(p => LOOP.has(p.name)));

const hasAdvanced = computed(() => props.meta.params.some(p => ADVANCED.has(p.name)));

const hasInput = computed(() =>
  props.meta.params.some(
    p =>
      p.name !== "outputVariable" &&
      !p.name.startsWith("column:") &&
      !p.name.startsWith("cell:") &&
      !p.name.startsWith("key:") &&
      !ADVANCED.has(p.name) &&
      !LOOP.has(p.name),
  ),
);

const tabs = computed<TabKey[]>(() => {
  const list: TabKey[] = ["basic"];
  if (hasInput.value) list.push("input");
  if (hasOutput.value) list.push("output");
  if (hasLoop.value) list.push("loop");
  if (hasAdvanced.value) list.push("advanced");
  return list;
});

const active = ref<TabKey>("basic");
const current = computed<TabKey>(() => (tabs.value.includes(active.value) ? active.value : tabs.value[0] || "basic"));

const TAB_LABELS: Record<TabKey, string> = {
  basic: "基础信息",
  input: "输入参数",
  output: "输出参数",
  loop: "循环",
  advanced: "高级配置",
};

function emitParam(param: CollectParamMeta, value: unknown): void {
  emit("set-param", param, value);
}

function emitPairs(param: CollectParamMeta, pairs: ParamPair[]): void {
  emit("set-pairs", param, pairs);
}
</script>

<template>
  <div class="node-tabs">
    <div class="node-tabs__bar" role="tablist" aria-label="节点参数分区">
      <button
        v-for="tab in tabs"
        :key="tab"
        role="tab"
        class="node-tabs__tab"
        :class="{ 'is-active': current === tab }"
        :aria-selected="current === tab"
        @click="active = tab"
      >
        {{ TAB_LABELS[tab] }}
      </button>
    </div>

    <div class="node-tabs__pane" role="tabpanel">
      <!-- 基础信息 -->
      <div v-if="current === 'basic'" class="pane-grid">
        <div class="field">
          <div class="field-label">节点名称</div>
          <ReInput :model-value="node.name" @update:model-value="renameNode" />
        </div>
        <div class="field">
          <div class="field-label">节点 ID / 类型</div>
          <ReInput disabled :model-value="`${node.id} · ${meta.label}`" />
        </div>
        <div v-if="selectedState" class="field field-wide">
          <div class="field-label">最近执行</div>
          <span class="field-state" :class="`state-${selectedState.collectTaskLogStatus}`">
            {{ stateText(node.id) }}
            <em v-if="selectedState.collectTaskLogMessage">{{ selectedState.collectTaskLogMessage }}</em>
          </span>
        </div>
        <div v-if="meta.description" class="field field-wide">
          <div class="field-tip">{{ meta.description }}</div>
        </div>
      </div>

      <!-- 各分区交给 shape 表单，section 控制 NodeParamForm 只渲染对应内容 -->
      <component
        :is="activeForm"
        v-for="tab in (['input', 'output', 'loop', 'advanced'] as const)"
        :key="tab"
        v-show="current === tab"
        :node="node"
        :meta="meta"
        :ctx="ctx"
        :section="tab"
        @set-param="emitParam"
        @set-pairs="emitPairs"
      />
    </div>
  </div>
</template>

<style scoped>
.node-tabs {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}
.node-tabs__bar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.node-tabs__tab {
  border: 1px solid transparent;
  background: transparent;
  padding: 5px 10px;
  font-size: 12px;
  line-height: 1;
  color: var(--el-text-color-secondary);
  border-radius: 6px;
  cursor: pointer;
}
.node-tabs__tab:hover {
  background: var(--el-fill-color-light);
}
.node-tabs__tab.is-active {
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  border-color: color-mix(in srgb, var(--el-color-primary) 28%, transparent);
  color: var(--el-color-primary);
  font-weight: 600;
}
.node-tabs__pane {
  min-width: 0;
}
.field {
  min-width: 0;
}
.field-wide {
  grid-column: 1 / -1;
}
.field-label {
  margin-bottom: 3px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.field-tip {
  margin-top: 3px;
  font-size: 11px;
  line-height: 1.45;
  overflow-wrap: anywhere;
  word-break: break-word;
  color: var(--el-text-color-secondary);
}
.field-state {
  display: block;
  font-size: 12px;
}
.field-state em {
  display: block;
  margin-top: 4px;
  font-style: normal;
  color: var(--el-text-color-secondary);
}
.pane-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
}
</style>