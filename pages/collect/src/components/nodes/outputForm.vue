<!--
  输出节点表单：逐条集合、业务表数据源 / 表、字段映射、业务主键与来源地址。
  参数顺序由 paramContext 统一决定（必填置顶）；循环四参数由 LoopFields 以「循环迭代」分节展示。
  通用渲染（ParamField 循环 + LoopFields + 公共样式）已收敛到 NodeParamForm，这里只声明
  专属参数顺序与节点说明，并把参数 / pairs 事件转发给 FlowDesigner 写回。
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
    :own-param-names="['each', 'datasource', 'targetTable', 'cell:字段名', 'key', 'url']"
    intro="落采集记录：把字段写成一条条采集结果。填了「逐条集合」就按集合逐条产出，留空则按当前令牌产出一条；填了「业务表」再镜像一份到该表（表不存在自动建、缺列自动补），记录数看任务详情的采集记录数。"
    @set-param="(param: CollectParamMeta, value: unknown) => emit('set-param', param, value)"
    @set-pairs="(param: CollectParamMeta, pairs: ParamPair[]) => emit('set-pairs', param, pairs)"
  />
</template>
