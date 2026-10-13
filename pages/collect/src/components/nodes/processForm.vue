<!--
  子流程节点表单：目标子流程、传入变量、继承 / 回写策略、出参前缀与超时毫秒。
  参数顺序由 paramContext 统一决定（必填置顶）；循环四参数由 LoopFields 以「循环迭代」分节展示。
  writeBack 在后端 meta 里讲了三种策略的取舍，但没说回写只落在当前令牌作用域，这里用
  extraTips 补一句并行分支的注意事项，只作用于本表单，不改后端。
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

/** 前端补充的参数说明：回写只写当前令牌作用域，并行分支同时回写同名变量会互相覆盖 */
const EXTRA_TIPS: Record<string, string> = {
  writeBack:
    "回写只写当前令牌作用域、不写父流程全局变量：并行分支同时回写同名变量会互相覆盖，需要跨分支共享时请在子流程节点后加一个变量节点转一次。",
};
</script>

<template>
  <NodeParamForm
    :node="node"
    :meta="meta"
    :ctx="ctx"
    :own-param-names="['flowId', 'pass:变量名', 'inherit', 'writeBack', 'outputPrefix', 'timeout']"
    :extra-tips="EXTRA_TIPS"
    intro="子流程调用：在当前任务里同步执行另一条已存在的流程 — 子流程不单独占任务行，节点日志与采集记录都并入本任务；跑完按「变量回写」把变量并回当前作用域，子流程失败时可按异常边流转容错。"
    @set-param="(param: CollectParamMeta, value: unknown) => emit('set-param', param, value)"
    @set-pairs="(param: CollectParamMeta, pairs: ParamPair[]) => emit('set-pairs', param, pairs)"
  />
</template>
