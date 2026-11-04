<!--
  判断节点表单：判断表达式 + 结果变量名 + 出边条件写法提示。
  循环四参数由 LoopFields 以「循环迭代」分节展示（NodeParamForm 统一渲染）。

  这里特意给判断节点写了专属表单而不是回落通用表单：判断节点**必须**配合出边条件使用 ——
  求值结果写进结果变量，出边再用 `${结果变量名}` 分流。通用表单只能把参数逐个摆出来，
  没法按「当前实际填的变量名」说清出边该写什么，用户只能靠猜；而猜错的表现是
  「分支永远走同一条」且页面上不报任何错（判断节点本身成功、出边条件静默不成立）。
  所以这里把结果变量名读出来，直接在默认插槽里给出两条出边的写法。
-->
<script setup lang="ts">
import { computed } from "vue";
import NodeParamForm from "./NodeParamForm.vue";
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
  /** 分区渲染：input / output / loop / advanced；缺省 all 保持旧行为（页签外壳逐页签下发） */
  section?: "all" | "input" | "output" | "loop" | "advanced";
}>();

const emit = defineEmits<{
  (e: "set-param", param: CollectParamMeta, value: unknown): void;
  (e: "set-pairs", param: CollectParamMeta, pairs: ParamPair[]): void;
}>();

const { valueOf } = useShapeFieldList(
  () => props.node,
  () => props.meta,
  ["expression", "outputVariable"],
);

/** 结果变量名；留空时与后端 CollectConditionExecutor.DEFAULT_OUTPUT 一致 */
const resultVariable = computed(() => valueOf("outputVariable").trim() || "conditionResult");

/** 真分支的出边条件写法：填结果变量本身即可 */
const trueEdgeCondition = computed(() => "${" + resultVariable.value + "}");

/** 假分支的出边条件写法：留空表示默认；显式写死也可读 */
const falseEdgeCondition = computed(() => "${" + resultVariable.value + " == false}");
</script>

<template>
  <NodeParamForm
    :node="node"
    :meta="meta"
    :ctx="ctx"
    :section="section"
    :own-param-names="['expression', 'outputVariable']"
    intro="判断节点：对下面的表达式求值，把结果写进结果变量；出边按该变量的真假分流 — 真分支填 ${结果变量名}，假分支留空。判断节点两条出边都要连到下游，否则流程会被校验拦下。"
    @set-param="(param: CollectParamMeta, value: unknown) => emit('set-param', param, value)"
    @set-pairs="(param: CollectParamMeta, pairs: ParamPair[]) => emit('set-pairs', param, pairs)"
  >
    <div class="field field-wide">
      <div class="field-label">出边条件怎么写</div>
      <div class="edge-hint">
        真分支填 <code>{{ trueEdgeCondition }}</code>
        ，假分支留空（也可写 <code>{{ falseEdgeCondition }}</code>）。
        两条出边都没有条件时，判断节点会两条都走。
      </div>
    </div>
  </NodeParamForm>
</template>

<style scoped>
/* 出边条件提示：与各节点表单的提示块同一形态，主色 code 徽标 */
.edge-hint {
  padding: 6px 8px;
  font-size: 12px;
  line-height: 1.7;
  /* 原为 #4e5969 / #f7f8fa：写死色值不跟随主题，改用令牌 */
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

.edge-hint code {
  padding: 0 3px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  /* 原先写死 #0e7490 / #eef6f8：不跟随主题，暗色下对比不足；改用主色令牌 */
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 3px;
}
</style>
