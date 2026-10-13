<!--
  结束节点表单：没有专属参数，只有说明。

  结束节点本身不执行任何操作，作用是「显式收束」—— 每条分支的末端都必须收到一个结束节点，
  结构校验据此判断流程有没有走到头。参数与循环分节都由 NodeParamForm 统一处理
  （end 属于 NON_LOOP_SHAPES，LoopFields 自门控不渲染）；这里只补一句说明，
  并把 NodeParamForm 的参数 / pairs 事件原样转发给 FlowDesigner 写回。
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
    intro="流程终点：本身不执行任何操作，用来把「分支走到头了」画出来；每条分支的末端都必须收到一个结束节点。结束节点没有可配置项，把它放在每条分支的最末端即可，流程才算收束完整。"
    @set-param="(param: CollectParamMeta, value: unknown) => emit('set-param', param, value)"
    @set-pairs="(param: CollectParamMeta, pairs: ParamPair[]) => emit('set-pairs', param, pairs)"
  />
</template>
