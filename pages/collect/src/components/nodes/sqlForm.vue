<!--
  SQL 节点表单：SQL 语句、数据源与结果变量名。
  参数顺序由 paramContext 统一决定（必填置顶）；循环四参数由 LoopFields 以「循环迭代」分节展示。
  SQL 属于高危节点，表单顶部固定展示一条警示条（契约 §4.4）。
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
  /** 分区渲染：input / output / loop / advanced；缺省 all 保持旧行为 */
  section?: "all" | "input" | "output" | "loop" | "advanced";
}>();

const emit = defineEmits<{
  (e: "set-param", param: CollectParamMeta, value: unknown): void;
  (e: "set-pairs", param: CollectParamMeta, pairs: ParamPair[]): void;
}>();

/** SQL 节点专属参数，按后端 meta 的下发顺序排列 */
const { fields, valueOf, pairsOfParam } = useShapeFieldList(
  () => props.node,
  () => props.meta,
  ["statement", "datasource", "outputVariable"],
);

/**
 * 不在界面上暴露的参数：SQL 查询结果默认写进 data（同 rows，旧流程留空时按 CollectSqlExecutor.DEFAULT_OUTPUT 兜底），
 * 下游用 ${data} 引用即可，多数流程不需要改名 —— 常显一个「结果变量名」只会增加噪音。
 * 只摘界面、不删数据：已有流程若改过名字，仍按其值运行。
 */
const HIDDEN_PARAMS = ["outputVariable"];

/** 实际渲染的参数（上面那个已被摘掉） */
const visibleFields = computed(() => fields.value.filter(param => !HIDDEN_PARAMS.includes(param.name)));

/**
 * 参数是否整行展示。
 *
 * <p>与 ParamField 内的宽控件判定保持一致（textarea / pairs / mapping / table）。
 * 外层属性面板是网格布局，字段被容器包一层后，宽控件必须由容器来占满整行。</p>
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
  <template v-if="section === 'loop'">
    <LoopFields
      :node="node"
      :meta="meta"
      :ctx="ctx"
      @set-param="(param: CollectParamMeta, value: unknown) => emit('set-param', param, value)"
      @set-pairs="(param: CollectParamMeta, pairs: ParamPair[]) => emit('set-pairs', param, pairs)"
    />
  </template>

  <template v-else-if="section === 'output'">
    <div class="field field-wide node-intro">
      SQL 查询结果写入 <code>data</code>（同 <code>rows</code>），供下游节点直接引用。
    </div>
  </template>

  <template v-else-if="section === 'advanced'">
    <div class="field field-wide node-intro">SQL 节点暂无独立高级配置，超时与超时策略统一在面板「高级配置」页签。 </div>
  </template>

  <template v-else>
  <div class="field field-wide node-intro">
    读写数据库：在指定数据源上执行一条 SQL。查询结果作为行集合写入出参变量，可给下游循环节点当循环集合。
  </div>

  <div class="field field-wide node-danger">
    <strong>高危：等同于在数据库上执行任意语句。</strong>
    整段 SQL 支持 <code>${}</code> 插值，且<strong>不做语句白名单</strong> —— 建表 / 删表（DDL）、
    DELETE、UPDATE 都能跑；当插值来自采集到的页面内容时，页面内容可以影响语句结构，存在注入面。
    能用，但等于把数据库权限交给配流程的人，只给可信的人配。
  </div>

  <div
    v-for="param in visibleFields"
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

  <!-- 循环迭代分节：留空单次执行，查询结果集合可逐项迭代 -->
  <LoopFields
    :node="node"
    :meta="meta"
    :ctx="ctx"
    @set-param="(param: CollectParamMeta, value: unknown) => emit('set-param', param, value)"
    @set-pairs="(param: CollectParamMeta, pairs: ParamPair[]) => emit('set-pairs', param, pairs)"
  />
  </template>
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

/*
  高危警示：danger 文本 + danger-light-9 底 + 左侧 2px 竖条（契约 §4.4）。
  只用 Element Plus 令牌，不写死主题色。
*/
.node-danger {
  padding: 8px 10px 8px 12px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  border-left: 2px solid var(--el-color-danger);
  border-radius: 6px;
}

.node-danger strong {
  font-weight: 600;
}

.node-danger code {
  padding: 0 3px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  background: var(--el-fill-color-lighter);
  border-radius: 3px;
}

/* 前端补充的参数说明：后端 meta 没给 tip，或 tip 只当占位符时补一句「是什么 / 怎么用」 */
.field-tip {
  margin-top: 3px;
  font-size: 11px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}
</style>
