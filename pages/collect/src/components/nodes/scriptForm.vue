<!--
  脚本节点表单：脚本正文、输出变量名、作用域与超时毫秒。
  参数顺序由 paramContext 统一决定（必填置顶、循环四参数在末尾）。
  脚本属于高危节点（服务器任意代码执行），表单顶部固定展示一条警示条（契约 §4.4）。
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

/** 脚本节点专属参数，按后端 meta 的下发顺序排列 */
const { fields, valueOf, pairsOfParam } = useShapeFieldList(
  () => props.node,
  () => props.meta,
  ["script", "outputVariable", "scope", "timeout"],
);

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
  <div class="field field-wide node-intro">
    脚本加工：用 Groovy 脚本处理上游变量并产出新变量 —— 上游变量按名字直接引用，fn 调内置函数，
    最后一条表达式即返回值。
  </div>

  <div class="field field-wide node-danger">
    <strong>高危：等同于在服务器上执行任意代码。</strong>
    脚本是 Groovy，能读环境变量与文件、发起网络请求、调用任意 JVM 类 —— 能配这个节点就等于拥有
    服务器权限。目前产品内没有开关能关掉这个节点类型（只有部署侧的全局配置
    <code>plugin.collect.script.enable</code>，默认开启且只对运维可见），把关只能落在
    「谁能登控制台 / 谁能配流程」：能用，但等于把服务器权限交给配流程的人，只给可信的人配。
  </div>

  <div
    v-for="param in fields"
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
