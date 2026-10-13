<!--
  注释节点表单：流程批注。

  注释不参与执行、不影响数据，只用于在设计器里标注流程意图，文字会出现在节点日志摘要里。
  注释属于 NON_LOOP_SHAPES，循环四参数由 NodeParamForm 里的 LoopFields 自门控不渲染。
  textarea 的后端 tip 只当占位符，这里用 extraTips 补一句常驻说明。
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

/** 前端补充的参数说明：后端 meta 的 tip 对 textarea 只当占位符，这里补常驻说明 */
const EXTRA_TIPS: Record<string, string> = {
  comment: "写给你自己或同事看的说明，不参与执行，只显示在节点日志摘要里；例：此处先用登录态抓详情。",
};
</script>

<template>
  <NodeParamForm
    :node="node"
    :meta="meta"
    :ctx="ctx"
    :own-param-names="['comment']"
    :extra-tips="EXTRA_TIPS"
    intro="流程批注：只做说明，不进入执行、不影响数据；文字会显示在节点日志摘要里，方便回看当时的意图，也可作为连线的中转点把两条分支画在同一位置。"
    @set-param="(param: CollectParamMeta, value: unknown) => emit('set-param', param, value)"
    @set-pairs="(param: CollectParamMeta, pairs: ParamPair[]) => emit('set-pairs', param, pairs)"
  />
</template>
