<script setup lang="ts">
import { computed, ref } from "vue";
import ReInput from "@repo/ui/re-input";
import ReIcon from "@repo/ui/re-icon";
import type { Component } from "vue";
import {
  isAdvancedParamName,
  isInputParam,
  isLoopParamName,
  isOutputParamName,
} from "./nodes/paramContext";
import type { NodeForm, NodeFormContext } from "./nodes/paramContext";
import type { CollectParamMeta, CollectShapeMeta, CollectTaskLog } from "../types/collect";
import type { ParamPair } from "../utils/dsl";

const props = defineProps<{
  node: NodeForm;
  meta: CollectShapeMeta;
  ctx: NodeFormContext;
  activeForm: Component;
  stateText: (id: string) => string;
  selectedState?: CollectTaskLog | null;
  renameNode: (name: string | number | null | undefined) => void;
}>();

const emit = defineEmits<{
  (e: "set-param", param: CollectParamMeta, value: unknown): void;
  (e: "set-pairs", param: CollectParamMeta, pairs: ParamPair[]): void;
}>();

type TabKey = "basic" | "input" | "output" | "loop" | "advanced";

/** 数据库节点的输出组：目标数据源/表/写入方式与字段映射放同一 Tab */
const DATABASE_OUTPUT = new Set(["datasource", "table", "mode", "batchSize", "onBatchError"]);
function isDatabaseOutput(p: { name: string }): boolean {
  return (
    DATABASE_OUTPUT.has(p.name) ||
    p.name.startsWith("column:") ||
    p.name.startsWith("key:")
  );
}

const hasOutput = computed(
  () =>
    props.meta.shape === "database"
      ? props.meta.params.some(isDatabaseOutput)
      : props.meta.params.some(p => isOutputParamName(p.name)) || props.meta.fieldEditor,
);
const hasLoop = computed(() => props.meta.params.some(p => isLoopParamName(p.name)));
const hasAdvanced = computed(() =>
  props.meta.params.some(
    p =>
      isAdvancedParamName(p.name) &&
      !(props.meta.shape === "database" && DATABASE_OUTPUT.has(p.name)),
  ),
);
const hasInput = computed(() =>
  props.meta.shape === "database"
    ? props.meta.params.some(p => p.name === "source")
    : props.meta.params.some(isInputParam),
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

const nodeInfo = computed(() =>
  [props.meta.description, props.meta.outputVariable].filter(Boolean).join("\n"),
);

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
      <div v-if="current === 'basic'" class="pane-grid">
        <div class="field">
          <div class="field-label">节点名称</div>
          <ReInput :model-value="node.name" @update:model-value="renameNode" />
        </div>
        <div class="field">
          <div class="field-label">
            节点 ID / 类型
            <el-tooltip v-if="nodeInfo" :content="nodeInfo" placement="top" :show-after="200" :teleported="true">
              <span class="label-tip"><ReIcon name="InfoFilled" :size="13" /></span>
            </el-tooltip>
          </div>
          <ReInput disabled :model-value="`${node.id} · ${meta.label}`" />
        </div>
        <div v-if="selectedState" class="field field-wide">
          <div class="field-label">最近执行</div>
          <span class="field-state" :class="`state-${selectedState.collectTaskLogStatus}`">
            {{ stateText(node.id) }}
            <em v-if="selectedState.collectTaskLogMessage">{{ selectedState.collectTaskLogMessage }}</em>
          </span>
        </div>
      </div>

      <!--
        页签内容＝该 shape 的**专属表单**（FlowDesigner 通过 activeForm 下发，未登记的类型回落到通用表单）。
        之前这里写死只渲染通用 NodeParamForm，于是 FORM_BY_SHAPE 里的 19 个专属表单全成了死代码：
        抓取节点的发送条、判断节点的出边条件提示、SQL 的高危警示、抽取节点的字段弹框都进不了界面。
        每个页签把 section 传下去，由表单自己决定这一页显示哪些参数（其余页签统一委派 NodeParamForm）。
      -->
      <component
        :is="activeForm"
        v-if="current === 'input' || current === 'output' || current === 'loop' || current === 'advanced'"
        :node="node"
        :meta="meta"
        :ctx="ctx"
        :section="current"
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

/* label 右侧的信息图标：备注全部收进 tooltip，不占输入区版面 */
.label-tip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: var(--el-text-color-secondary);
  cursor: help;
  border-radius: 50%;
}

.label-tip:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
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
  grid-template-columns: 1fr;
  gap: 10px 12px;
}
</style>