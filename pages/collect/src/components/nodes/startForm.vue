<!--
  开始节点表单：流程入口，声明种子 URL。

  开始节点是流程的入口：每行一个种子 URL，流程会以列表里的每个地址各自跑一遍下游。
  urls 为必填；集合变量名（outputVariable，引擎默认 urlList）按需求不在界面上暴露 ——
  它由 orderedParams 的末段兜底带出，这里用 HIDDEN_PARAMS 摘掉，数据不动。
  开始节点不是可迭代单元，循环四参数用 includeLoop=false 摘掉。
-->
<script setup lang="ts">
import ParamField from "./ParamField.vue";
import { useShapeFieldList } from "./paramContext";
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
}>();

const emit = defineEmits<{
  (e: "set-param", param: CollectParamMeta, value: unknown): void;
  (e: "set-pairs", param: CollectParamMeta, pairs: ParamPair[]): void;
}>();

/** 开始节点专属参数：种子 URL；outputVariable 由 orderedParams 的兜底段带出 */
const { fields, valueOf, pairsOfParam } = useShapeFieldList(
  () => props.node,
  () => props.meta,
  ["urls"],
  { includeLoop: false },
);

/**
 * 参数是否整行展示。
 *
 * <p>与 ParamField 内的宽控件判定保持一致（textarea / pairs / mapping / table）。
 * 外层属性面板是网格布局，字段被容器包一层后，宽控件必须由容器来占满整行，
 * 否则 textarea 会被挤进 230px 的网格列里。</p>
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

/**
 * 不在开始节点界面上暴露的参数。
 *
 * <p>{@code outputVariable} 决定集合变量名，引擎侧有默认值 {@code urlList}（{@code CollectStartExecutor.DEFAULT_OUTPUT}），
 * 而 {@code orderedParams} 的末段兜底会把它带出来。需求是「开始节点只留节点名称 + 种子 URL」，
 * 所以这里只把它从界面上摘掉：**不删数据**，已有流程若设过自定义变量名依旧照原样运行。</p>
 */
const HIDDEN_PARAMS = ["outputVariable"];

/**
 * 前端补充的参数说明。
 *
 * <p>后端 meta 的 tip 对 textarea 只当占位符（输入后即消失），有的参数又没有 tip，
 * 这里按参数名补一句「这是什么 / 怎么用 / 例子」，只作用于本表单，不改后端。</p>
 */
const EXTRA_TIPS: Record<string, string> = {
  urls: "每行一个种子 URL，支持 ${变量} 拼接；例：https://a.com/list?page=${page}。空行会被自动忽略。",
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
  <div class="field field-wide node-intro">
    流程入口：定义种子 URL 列表（每行一个），流程会以列表里的每个地址各自跑一遍下游；
    结果写入 urlList（首条另存为 url），供后续节点引用。
  </div>

  <div
    v-for="param in fields.filter(item => item.name !== HIDDEN_PARAMS[0])"
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
    <div v-if="extraTip(param.name)" class="field-tip">{{ extraTip(param.name) }}</div>
  </div>
</template>

<style scoped>
/* 参数容器：与 ParamField / genericForm 的字段样式保持一致，宽控件由容器占满整行 */
.field {
  min-width: 0;
}

.field-wide {
  grid-column: 1 / -1;
}

/* 节点级说明：一眼看清这个节点在流程里扮演什么角色 */
.node-intro {
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-left: 2px solid var(--el-color-primary);
  border-radius: var(--el-radius-md, 8px);
  transition: border-color 200ms, background-color 200ms;
}

/* 前端补充的参数说明：后端 meta 没给 tip，或 tip 只当占位符时补一句「是什么 / 怎么用」 */
.field-tip {
  margin-top: 3px;
  font-size: 11px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}
</style>
