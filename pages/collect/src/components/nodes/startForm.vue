<!--
  开始节点表单：只暴露种子 URL。
  开始节点的职责就是「声明种子」，循环与集合变量名对它没有意义
  （循环参数由 CollectShapeMetas 追加给所有节点，这里用 includeLoop=false 摘掉；
  集合变量名固定默认 urlList，会作为流程变量出现在插入占位清单里，无需再暴露一个输入框）。
-->
<script setup lang="ts">
import ParamField from "./ParamField.vue";
import { useShapeFieldList } from "./paramContext";
import type { NodeForm, NodeFormContext } from "./paramContext";
import type { ParamPair } from "../../utils/dsl";
import type { CollectParamMeta, CollectShapeMeta } from "../../types/collect";

const props = defineProps<{
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

/** 开始节点专属参数：只有种子 URL */
const { fields, valueOf, pairsOfParam } = useShapeFieldList(
  () => props.node,
  () => props.meta,
  ["urls"],
  { includeLoop: false },
);
</script>

<template>
  <ParamField
    v-for="param in fields"
    :key="param.name"
    :param="param"
    :value="valueOf(param.name)"
    :pairs="pairsOfParam(param.name)"
    :node-id="node.id"
    :ctx="ctx"
    @update="(value: unknown) => emit('set-param', param, value)"
    @pairs="(value: ParamPair[]) => emit('set-pairs', param, value)"
  />
</template>
