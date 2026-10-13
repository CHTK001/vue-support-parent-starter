<!--
  变量节点表单：赋值键值对与作用域。

  变量节点把表达式的结果写进变量，供下游用 ${名} 引用；作用域可选「仅本分支」（默认）
  或「写入全局」（整次执行共享，用于累计计数、跨分支传值）。
  循环四参数由 LoopFields 以「循环迭代」分节展示（NodeParamForm 统一渲染）。
  赋值表与作用域在后端 meta 里 tip 不全，这里用 extraTips 补例子与可见范围。
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
}>();

const emit = defineEmits<{
  (e: "set-param", param: CollectParamMeta, value: unknown): void;
  (e: "set-pairs", param: CollectParamMeta, pairs: ParamPair[]): void;
}>();

/** 前端补充的参数说明：赋值表给例子，作用域讲可见范围 */
const EXTRA_TIPS: Record<string, string> = {
  "set:变量名":
    "例：count = ${count} + 1（计数自增）、url = ${url}（取上游值）；左侧变量名下游用 ${名} 引用。",
  scope:
    "作用域二选一：仅本分支（默认）只在本令牌及其下游可见；写入全局则整次执行共享，适合累计计数与跨分支传值。",
};
</script>

<template>
  <NodeParamForm
    :node="node"
    :meta="meta"
    :ctx="ctx"
    :own-param-names="['set:变量名', 'scope']"
    :extra-tips="EXTRA_TIPS"
    intro="变量赋值：把表达式的结果写进变量，供下游用 ${名} 引用；作用域可选「仅本分支」（默认，只有本令牌及下游可见）或「写入全局」（整次执行共享，用于累计计数、跨分支传值）。"
    @set-param="(param: CollectParamMeta, value: unknown) => emit('set-param', param, value)"
    @set-pairs="(param: CollectParamMeta, pairs: ParamPair[]) => emit('set-pairs', param, pairs)"
  />
</template>
