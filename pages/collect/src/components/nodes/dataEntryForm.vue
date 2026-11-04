<!--
  数据录入节点：纯数据提供者，与开始节点同一类语义。
  录入数据按数据格式（CSV / JSONL / HTTP JSON / 文本）解析后作为出参集合交给下游，
  不再承担建表、目标数据源、目标表职责。
-->
<script setup lang="ts">
import NodeParamForm from "./NodeParamForm.vue";
import type { NodeForm, NodeFormContext } from "./paramContext";
import type { ParamPair } from "../../utils/dsl";
import type { CollectParamMeta, CollectShapeMeta } from "../../types/collect";

defineProps<{
  node: NodeForm;
  meta: CollectShapeMeta;
  ctx: NodeFormContext;
  /** 分区渲染：input / output / loop / advanced；缺省 all 保持旧行为（页签外壳逐页签下发） */
  section?: "all" | "input" | "output" | "loop" | "advanced";
}>();

const emit = defineEmits<{
  (e: "set-param", param: CollectParamMeta, value: unknown): void;
  (e: "set-pairs", param: CollectParamMeta, pairs: ParamPair[]): void;
}>();

const EXTRA_TIPS: Record<string, string> = {
  rows:
    "按「数据格式」解析：CSV 首行表头、JSONL 每行一条 JSON、HTTP JSON 提供数组或对象、纯文本每行收进 value 列；支持 ${} 拼接。",
  outputVariable: "本节点产出的集合变量名，默认 data；下游用 ${data} 引用整批行。",
};
</script>

<template>
  <NodeParamForm
    :node="node"
    :meta="meta"
    :ctx="ctx"
    :section="section"
    :own-param-names="['rows', 'format', 'outputVariable']"
    :extra-tips="EXTRA_TIPS"
    intro="外部数据源：录入/粘贴 CSV、JSONL、HTTP JSON 或文本，作为流程行数据供给下游；本节点不建表、不写库。"
    @set-param="(param: CollectParamMeta, value: unknown) => emit('set-param', param, value)"
    @set-pairs="(param: CollectParamMeta, pairs: ParamPair[]) => emit('set-pairs', param, pairs)"
  />
</template>