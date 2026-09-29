<!--
  链接节点表单：页面来源、选择器、取值属性、过滤正则、转绝对地址与出参变量名。
  循环四参数由 paramContext 统一排在最前。
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

/** 链接节点专属参数，按后端 meta 的下发顺序排列 */
const { fields, valueOf, pairsOfParam } = useShapeFieldList(
  () => props.node,
  () => props.meta,
  ["source", "selector", "attribute", "pattern", "absolute", "limit", "outputVariable"],
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
