<!--
  等待节点表单：等待毫秒与随机上限。

  等待节点用来控制采集节奏：串行流程里插在两个抓取节点之间，按毫秒等待以降低对目标站点的压力；
  填了随机上限后每次等待落在 [下限, 上限] 区间内，避免固定间隔被识别为机器行为。
  循环四参数由 LoopFields 以「循环迭代」分节展示（NodeParamForm 统一渲染）。
  两个参数在后端 meta 里都没有 tip，这里用 extraTips 补「是什么 / 怎么用 / 例子」。
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
  /** 分区渲染：input / output / loop / advanced；缺省 all 保持旧行为 */
  section?: "all" | "input" | "output" | "loop" | "advanced";
}>();

const emit = defineEmits<{
  (e: "set-param", param: CollectParamMeta, value: unknown): void;
  (e: "set-pairs", param: CollectParamMeta, pairs: ParamPair[]): void;
}>();

/** 前端补充的参数说明：后端 meta 没给 tip，这里补「是什么 / 怎么用 / 例子」，只作用于本表单 */
const EXTRA_TIPS: Record<string, string> = {
  millis:
    "每次执行到这里固定等待的毫秒数（1000 = 1 秒）；填 0 或留空表示不等待。例：3000 表示等 3 秒再继续。",
  maxMillis:
    "填写后会从「等待毫秒」到「随机上限」之间随机取值再等待，避免固定间隔被识别；小于等于下限时按固定值等待。例：下限 1000、上限 3000，每次等 1~3 秒。",
};
</script>

<template>
  <NodeParamForm
    :node="node"
    :meta="meta"
    :ctx="ctx"
    :section="section"
    :own-param-names="['millis', 'maxMillis']"
    :extra-tips="EXTRA_TIPS"
    intro="节奏控制：串行流程里插在两个抓取节点之间，按毫秒等待以降低对目标站点的压力；填了「随机上限」后每次等待会在区间内随机，避免固定间隔被识别为机器行为。"
    @set-param="(param: CollectParamMeta, value: unknown) => emit('set-param', param, value)"
    @set-pairs="(param: CollectParamMeta, pairs: ParamPair[]) => emit('set-pairs', param, pairs)"
  />
</template>
