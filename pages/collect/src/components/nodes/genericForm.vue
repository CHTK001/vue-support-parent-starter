<!--
  通用回落节点表单：shape 没有专门表单文件时使用。

  与拆分前的通用渲染等价——按 meta.params 的顺序逐个渲染，并保留 fieldEditor 的抽取字段块。
  通用渲染（ParamField 循环 + LoopFields + FieldTable + 公共样式）已全部收敛到 NodeParamForm，
  这里只是无说明、无专属参数顺序的极简回落。
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
</script>

<template>
  <NodeParamForm
    :node="node"
    :meta="meta"
    :ctx="ctx"
    @set-param="(param: CollectParamMeta, value: unknown) => emit('set-param', param, value)"
    @set-pairs="(param: CollectParamMeta, pairs: ParamPair[]) => emit('set-pairs', param, pairs)"
  />
</template>
