<!--
  去重节点表单：主键表达式与判重范围。

  去重节点用业务主键判断条目是否已采过，命中就终止当前分支（不再往下派发），兄弟分支不受影响；
  主键写法必须与采集平台节点一致，典型接法是 抓取 → 去重(${url}) → 抽取 → 采集平台落库。
  循环四参数由 LoopFields 以「循环迭代」分节展示（NodeParamForm 统一渲染）。
  两个参数在后端 meta 里讲了写法，这里用 extraTips 补上命中后的行为与跨流程注意事项。
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

/** 前端补充的参数说明：后端 meta 讲了主键写法与判重范围，这里补命中后的行为与跨流程注意 */
const EXTRA_TIPS: Record<string, string> = {
  key: "命中已采过的值会终止本分支（不再往下派发），兄弟分支不受影响；主键求值为空会直接报错。",
  scope: "跨流程会与其它流程共用同一份已采集合，慎用：可能跳过别的流程采过的条目。",
};
</script>

<template>
  <NodeParamForm
    :node="node"
    :meta="meta"
    :ctx="ctx"
    :section="section"
    :own-param-names="['key', 'scope']"
    :extra-tips="EXTRA_TIPS"
    intro="去重：用业务主键判断条目是否已采过，命中就终止当前分支（不再往下派发），兄弟分支不受影响；主键写法必须与采集平台节点一致，通常接在抓取之后、采集平台落库之前。"
    @set-param="(param: CollectParamMeta, value: unknown) => emit('set-param', param, value)"
    @set-pairs="(param: CollectParamMeta, pairs: ParamPair[]) => emit('set-pairs', param, pairs)"
  />
</template>
