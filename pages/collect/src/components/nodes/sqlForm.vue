<!--
  SQL 节点表单：SQL 语句与数据源。

  属性面板改为页签外壳后（components/NodeFormTabs.vue），本组件只负责**输入参数**页签；
  出参变量名 / 批次失败策略在「输出参数」页签，超时与超时策略在「高级配置」页签，
  统一由 NodeParamForm 渲染 —— 原先这里自己也渲染一遍循环分节，
  等于同一份控件有两处实现。

  SQL 属于高危节点，说明条与警示条在每个页签顶部都显示（NodeAlert 放在页签分支之外的根本原因：
  「这个节点等于把数据库权限交出去」与当前看哪一页无关，不该跟着页签消失）。
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

/** 节点级说明：与其它节点表单同一份文案口径 */
const INTRO =
  "读写数据库：在指定数据源上执行一条 SQL。查询结果作为行集合写入出参变量，"
  + "可给下游循环节点当循环集合。";

/** SQL 节点专属参数，按后端 meta 的下发顺序排列 */
const { fields, valueOf, pairsOfParam } = useShapeFieldList(
  () => props.node,
  () => props.meta,
  ["statement", "datasource", "outputVariable"],
);

/** 输入参数页签：语句与数据源（出参变量名归「输出参数」，批次失败策略归「高级配置」） */
const inputFields = computed(() => fields.value.filter(isInputParam));

/**
 * 前端补充的参数说明。
 *
 * <p>SQL 语句是 textarea，后端 meta 的 tip 只当占位符（输入后即消失），这里补一句
 * 「是什么 / 怎么用 / 例子」，只作用于本表单，不改后端。</p>
 */
const EXTRA_TIPS: Record<string, string> = {
  statement:
    "一次只执行一条语句；整段支持 ${}，例：select * from t where dt='${dateNow(\"yyyy-MM-dd\")}'。SELECT / WITH / SHOW 开头按查询处理，结果写入出参变量；其余按更新处理，受影响行数看节点摘要。",
};

/**
 * 取某参数的补充说明。
 *
 * @param name 参数名
 * @returns 补充说明；没有则返回空串
 */
function extraTip(name: string): string {
  return EXTRA_TIPS[name] ?? "";
}
</script>

<template>
  <NodeAlert kind="intro">{{ INTRO }}</NodeAlert>

  <NodeAlert kind="danger">
    <strong>高危：等同于在数据库上执行任意语句。</strong>
    整段 SQL 支持 <code>${}</code> 插值，且<strong>不做语句白名单</strong> —— 建表 / 删表（DDL）、
    DELETE、UPDATE 都能跑；当插值来自采集到的页面内容时，页面内容可以影响语句结构，存在注入面。
    能用，但等于把数据库权限交给配流程的人，只给可信的人配。
  </NodeAlert>

  <!-- 出参变量名 / 超时策略：统一交给 NodeParamForm 的分区渲染 -->
  <NodeParamForm
    v-if="section && section !== 'input'"
    :node="node"
    :meta="meta"
    :ctx="ctx"
    :section="section"
    :own-param-names="['statement', 'datasource', 'outputVariable']"
    :extra-tips="EXTRA_TIPS"
    @set-param="(param: CollectParamMeta, value: unknown) => emit('set-param', param, value)"
    @set-pairs="(param: CollectParamMeta, pairs: ParamPair[]) => emit('set-pairs', param, pairs)"
  />

  <!-- 输入参数页签：语句 + 数据源 -->
  <template v-else>
    <ParamField
      v-for="param in inputFields"
      :key="param.name"
      :param="param"
      :hint="extraTip(param.name)"
      :value="valueOf(param.name)"
      :pairs="pairsOfParam(param.name)"
      :node-id="node.id"
      :ctx="ctx"
      @update="(value: unknown) => emit('set-param', param, value)"
      @pairs="(value: ParamPair[]) => emit('set-pairs', param, value)"
    />
  </template>
</template>
