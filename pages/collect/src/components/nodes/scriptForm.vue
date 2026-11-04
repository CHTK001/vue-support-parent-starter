<!--
  脚本节点表单：脚本正文与作用域。

  属性面板改为页签外壳后（components/NodeFormTabs.vue），本组件只负责**输入参数**页签；
  出参变量名在「输出参数」页签、超时在「高级配置」页签，统一由 NodeParamForm 渲染。

  脚本属于高危节点（服务器任意代码执行），说明条与警示条在每个页签顶部都显示（契约 §4.4）。
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
  "脚本加工：用 Groovy 脚本处理上游变量并产出新变量 —— 上游变量按名字直接引用，fn 调内置函数，"
  + "最后一条表达式即返回值。";

/** 脚本节点专属参数，按后端 meta 的下发顺序排列 */
const { fields, valueOf, pairsOfParam } = useShapeFieldList(
  () => props.node,
  () => props.meta,
  ["script", "outputVariable", "scope", "timeout"],
);

/** 输入参数页签：脚本正文与作用域（出参变量名归「输出参数」，超时归「高级配置」） */
const inputFields = computed(() => fields.value.filter(isInputParam));

/**
 * 前端补充的参数说明。
 *
 * <p>脚本正文是 textarea，后端 meta 的 tip 只当占位符（输入后即消失）；作用域在后端 meta 里
 * 没有 tip。这里各补一句「是什么 / 怎么用」，只作用于本表单，不改后端。</p>
 */
const EXTRA_TIPS: Record<string, string> = {
  script:
    "上游变量按名字直接引用，最后一条表达式就是返回值：返回 Map 时整份并入变量表，返回标量时写进「输出变量名」；也可直接往可写的 vars 里塞键值。另外还能读 flowId / taskId / taskNo / nodeId。",
  scope:
    "脚本产出的变量写在哪：仅本分支（默认）只在本令牌及其下游可见；写入全局则整次执行共享，并行分支写同名变量会互相覆盖。",
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
    <strong>高危：等同于在服务器上执行任意代码。</strong>
    脚本是 Groovy，能读环境变量与文件、发起网络请求、调用任意 JVM 类 —— 能配这个节点就等于拥有
    服务器权限。目前产品内没有开关能关掉这个节点类型（只有部署侧的全局配置
    <code>plugin.collect.script.enable</code>，默认开启且只对运维可见），把关只能落在
    「谁能登控制台 / 谁能配流程」：能用，但等于把服务器权限交给配流程的人，只给可信的人配。
  </NodeAlert>

  <!-- 出参变量名 / 超时：统一交给 NodeParamForm 的分区渲染 -->
  <NodeParamForm
    v-if="section && section !== 'input'"
    :node="node"
    :meta="meta"
    :ctx="ctx"
    :section="section"
    :own-param-names="['script', 'outputVariable', 'scope', 'timeout']"
    :extra-tips="EXTRA_TIPS"
    @set-param="(param: CollectParamMeta, value: unknown) => emit('set-param', param, value)"
    @set-pairs="(param: CollectParamMeta, pairs: ParamPair[]) => emit('set-pairs', param, pairs)"
  />

  <!-- 输入参数页签：脚本正文 + 作用域 -->
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
