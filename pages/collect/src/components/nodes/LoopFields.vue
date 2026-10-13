<!--
  「循环迭代」分节：把循环四参数从字段流里拆出来独立成节。

  <p>背景（用户反馈「节点的循环是啥干啥的」）：循环四参数原先混在表单字段流里，
  既挤占头部位置，又看不出与本节点专属参数的边界，像一堆没用的输入框。
  现在 orderedParams 不再输出循环参数（参数流只剩本节点的参数），可循环节点
  统一在本分节里渲染；start / end / comment 不是可迭代单元，整节不出现
  （loopParamsOf 门控 + NON_LOOP_SHAPES 双保险，pw-forms 红线：start 面板
  不得出现任何循环 label）。</p>

  <p>单根节点且跨满整行（grid-column: 1 / -1），内部再开一层与 .pane-grid 同
  规格的子网格（同列宽与 gap），字段落位与面板其它字段对齐。</p>
-->
<script setup lang="ts">
import { computed } from "vue";
import ParamField from "./ParamField.vue";
import SectionHead from "./SectionHead.vue";
import { loopParamsOf } from "./paramContext";
import type { NodeForm, NodeFormContext } from "./paramContext";
import { pairPrefix, pairsOf } from "../../utils/dsl";
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

/** 本 shape 实际下发的循环参数；start / end / comment 为空 → 整节不渲染 */
const loopParams = computed(() => loopParamsOf(props.meta));

const valueOf = (name: string): string =>
  props.node.params.find(item => item.name === name)?.value ?? "";

const pairsOfParam = (name: string): ParamPair[] =>
  pairsOf({ params: props.node.params }, pairPrefix(name));

/**
 * 参数是否整行展示（与各表单的 isWide 判定同口径）。
 *
 * @param param 参数元数据
 * @returns 是则返回 true
 */
function isWide(param: CollectParamMeta): boolean {
  return (
    param.type === "textarea" ||
    param.type === "pairs" ||
    param.type === "mapping" ||
    param.type === "table"
  );
}
</script>

<template>
  <div v-if="loopParams.length" class="loop-seg">
    <SectionHead
      title="逐条处理（循环）"
      hint="上游一批数据（多行/多网址）逐条跑：填 ${data} 或 ${url} 循环，每轮用 ${item} 取当前条、${index} 取第几条；留空只跑一次"
    />
    <div
      v-for="param in loopParams"
      :key="param.name"
      class="field"
      :class="{ 'field-wide': isWide(param) }"
    >
      <ParamField
        :param="param"
        :value="valueOf(param.name)"
        :pairs="pairsOfParam(param.name)"
        :node-id="node.id"
        :ctx="ctx"
        @update="(value: unknown) => emit('set-param', param, value)"
        @pairs="(value: ParamPair[]) => emit('set-pairs', param, value)"
      />
    </div>
  </div>
</template>

<style scoped>
/* 跨满整行：分节头 + 子网格整体占一行，内部字段按与面板同规格的子网格落位 */
.loop-seg {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 10px 14px;
  align-content: start;
  padding-top: 2px;
}

/* 子网格里的分节头自带 grid-column: 1 / -1，占满整行 */
.field {
  min-width: 0;
}

.field-wide {
  grid-column: 1 / -1;
}
</style>
