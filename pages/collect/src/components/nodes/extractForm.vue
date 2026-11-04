<!--
  抽取节点表单：抽取来源、抽取模式、行选择器（仅列表模式）。

  属性面板改为页签外壳后（components/NodeFormTabs.vue），本组件只负责**输入参数**页签；
  出参变量名、循环四参数、抽取字段弹框都在其它页签里，统一由 NodeParamForm 渲染 ——
  原先这里自己也渲染一遍循环分节与字段弹框，等于同一份控件有两处实现。

  「行选择器」只在列表模式显示：它是列表模式用来把来源切成多行的（如 CSS 的 li.item、
  JSON 的 data.items）；单条模式下它不起作用，摆在表单里只会让人以为必须填 —— 实测用户正是
  这么被绕住的。收起而不是删除：切回列表模式时它还按原值在（后端契约不变）。
-->
<script setup lang="ts">
import { computed } from "vue";
import NodeAlert from "./NodeAlert.vue";
import NodeParamForm from "./NodeParamForm.vue";
import ParamField from "./ParamField.vue";
import { isInputParam, useShapeFieldList } from "./paramContext";
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
  /** 分区渲染：input / output / loop / advanced；缺省按 input 处理（本组件只负责输入参数页签） */
  section?: "all" | "input" | "output" | "loop" | "advanced";
}>();

const emit = defineEmits<{
  (e: "set-param", param: CollectParamMeta, value: unknown): void;
  (e: "set-pairs", param: CollectParamMeta, pairs: ParamPair[]): void;
}>();

/** 节点级说明：与其它节点表单同一份文案，页签外壳每个页签都会显示一次 */
const INTRO =
  "抽取节点：把上游抓到的内容按「字段」解析成行列数据 —— 每行一个字段，"
  + "声明用哪种解析器（CSS / XPath / JSONPath / 正则…）以及取值表达式；结果供写库、输出或循环节点使用。";

/** 抽取节点专属参数，按后端 meta 的下发顺序排列 */
const { fields, valueOf, pairsOfParam } = useShapeFieldList(
  () => props.node,
  () => props.meta,
  ["source", "mode", "rowExpression", "outputVariable"],
);

/** 是否列表抽行模式（只有列表模式才有「行选择器」） */
const isListMode = computed(() => String(valueOf("mode") || "").trim().toLowerCase() === "list");

/** 输入参数页签里真正渲染的行：输入参数，且「行选择器」只在列表模式出现 */
const visibleFields = computed(() =>
  fields.value.filter(param => isInputParam(param) && (param.name !== "rowExpression" || isListMode.value)),
);
</script>

<template>
  <NodeAlert kind="intro">{{ INTRO }}</NodeAlert>

  <!-- 出参变量名 / 抽取字段 / 循环 / 高级配置：统一交给 NodeParamForm 的分区渲染 -->
  <NodeParamForm
    v-if="section && section !== 'input'"
    :node="node"
    :meta="meta"
    :ctx="ctx"
    :section="section"
    :own-param-names="['source', 'mode', 'rowExpression', 'outputVariable']"
    @set-param="(param: CollectParamMeta, value: unknown) => emit('set-param', param, value)"
    @set-pairs="(param: CollectParamMeta, pairs: ParamPair[]) => emit('set-pairs', param, pairs)"
  />

  <!-- 输入参数页签：抽取来源 / 抽取模式 / 行选择器（随模式显隐） -->
  <template v-else>
    <ParamField
      v-for="param in visibleFields"
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
</template>
