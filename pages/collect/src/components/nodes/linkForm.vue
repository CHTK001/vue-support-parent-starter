<!--
  链接节点表单：页面来源、选择器、取值属性、过滤正则、转绝对地址与出参变量名。
  参数顺序由 paramContext 统一决定（必填置顶）；循环四参数由 LoopFields 以「循环迭代」分节展示。
  后端 meta 讲了各参数怎么填，但没说节点还会额外产出首条链接变量，这里用 extraTips 补一句。
-->
<script setup lang="ts">
import NodeParamForm from "./NodeParamForm.vue";
import type { NodeForm, NodeFormContext } from "./paramContext";
import type { ParamPair } from "../../utils/dsl";
import type { CollectParamMeta, CollectShapeMeta } from "../../types/collect";

defineProps<{
  /** 当前节点的表单镜像 */
  node: NodeForm;
  /** 该 shape 的参数元数据 */
  meta: CollectShapeMeta;
  /** 表单共享上下文 */
  ctx: NodeFormContext;
  /** 分区渲染：input / output / loop / advanced；缺省 all 保持旧行为（页签外壳逐页签下发） */
  section?: "all" | "input" | "output" | "loop" | "advanced";
}>();

const emit = defineEmits<{
  (e: "set-param", param: CollectParamMeta, value: unknown): void;
  (e: "set-pairs", param: CollectParamMeta, pairs: ParamPair[]): void;
}>();

/** 前端补充的参数说明：节点还会把第一个链接写入 ${link} */
const EXTRA_TIPS: Record<string, string> = {
  outputVariable:
    "除这里命名的出参变量外，节点还会把找到的第一个链接写入 ${link}，可在后续抓取节点里直接引用。",
};
</script>

<template>
  <NodeParamForm
    :node="node"
    :meta="meta"
    :ctx="ctx"
    :section="section"
    :own-param-names="['source', 'selector', 'attribute', 'pattern', 'absolute', 'limit', 'outputVariable']"
    :extra-tips="EXTRA_TIPS"
    intro="链接抽取：从当前页面（默认 ${respDoc}）按选择器抽出链接、去重后写入出参变量，供下游循环节点逐条抓取 — 这是「列表页 → 详情页」两跳采集的标准接法。"
    @set-param="(param: CollectParamMeta, value: unknown) => emit('set-param', param, value)"
    @set-pairs="(param: CollectParamMeta, pairs: ParamPair[]) => emit('set-pairs', param, pairs)"
  />
</template>
