<!--
  判断节点表单：判断表达式 + 结果变量名。
  循环四参数由 LoopFields 以「循环迭代」分节展示。

  这里特意给判断节点写了专属表单而不是回落通用表单：判断节点**必须**配合出边条件使用 ——
  求值结果写进结果变量，出边再用 `${结果变量名}` 分流。通用表单只能把参数逐个摆出来，
  没法按「当前实际填的变量名」说清出边该写什么，用户只能靠猜；而猜错的表现是
  「分支永远走同一条」且页面上不报任何错（判断节点本身成功、出边条件静默不成立）。
  所以这里把结果变量名读出来，直接给出两条出边的写法。
-->
<script setup lang="ts">
import { computed } from "vue";
import ParamField from "./ParamField.vue";
import LoopFields from "./LoopFields.vue";
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

/** 判断节点专属参数，按后端 meta 的下发顺序排列 */
const { fields, valueOf, pairsOfParam } = useShapeFieldList(
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
  <div class="field field-wide node-intro">
    判断节点：对下面的表达式求值，把结果写进结果变量；出边按该变量的真假分流 ——
    真分支填 ${结果变量名}，假分支留空。判断节点两条出边都要连到下游，否则流程会被校验拦下。
  </div>

  <ParamField
    v-for="param in fields"
    :key="param.name"
    :param="param"
    :value="valueOf(param.name)"
    :pairs="pairsOfParam(param.name)"
    :node-id="node.id"
    :ctx="ctx"
    @update="(value: unknown) => emit('set-param', param, value)"
    @pairs="(value: ParamPair[]) => emit('set-pairs', param, value)"
  />

  <!-- 循环迭代分节：留空单次执行 -->
  <LoopFields
    :node="node"
    :meta="meta"
    :ctx="ctx"
    @set-param="(param: CollectParamMeta, value: unknown) => emit('set-param', param, value)"
    @set-pairs="(param: CollectParamMeta, pairs: ParamPair[]) => emit('set-pairs', param, pairs)"
  />

  <div class="field field-wide">
    <div class="field-label">出边条件怎么写</div>
    <div class="edge-hint">
      真分支填 <code>{{ trueEdgeCondition }}</code>
      ，假分支留空（也可写 <code>{{ falseEdgeCondition }}</code>）。
      两条出边都没有条件时，判断节点会两条都走。
    </div>
  </div>
</template>

<style scoped>
/* 容器样式与 ParamField / genericForm 保持一致 */
.field {
  min-width: 0;
}

.field-wide {
  grid-column: 1 / -1;
}

.field-label {
  margin-bottom: 3px;
  font-size: 12px;
  /* 写死的 #86909c 不跟随主题；改用 koi 体系令牌 */
  color: var(--el-text-color-secondary);
}

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
  /* 原先写死 #0e7490 / #eef6f8：不跟随主题，暗色下与底色对比不足；改用主色令牌 */
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 3px;
}

/* 节点级说明：与其它节点表单同一形态（左侧 2px 主色竖条 + 浅底） */
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
</style>
