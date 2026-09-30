<!--
  等待节点表单：等待毫秒与随机上限。

  等待节点用来控制采集节奏：串行流程里插在两个抓取节点之间，按毫秒等待以降低对目标站点的压力；
  填了随机上限后每次等待落在 [下限, 上限] 区间内，避免固定间隔被识别为机器行为。
  循环四参数由 paramContext 统一排在末尾。
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

/** 等待节点专属参数，按后端 meta 的下发顺序排列 */
const { fields, valueOf, pairsOfParam } = useShapeFieldList(
  () => props.node,
  () => props.meta,
  ["millis", "maxMillis"],
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
 * <p>等待毫秒与随机上限在后端 meta 里都没有 tip，这里补上「是什么 / 怎么用 / 例子」，
 * 只作用于本表单，不改后端。</p>
 */
const EXTRA_TIPS: Record<string, string> = {
  millis: "每次执行到这里固定等待的毫秒数（1000 = 1 秒）；填 0 或留空表示不等待。例：3000 表示等 3 秒再继续。",
  maxMillis:
    "填写后会从「等待毫秒」到「随机上限」之间随机取值再等待，避免固定间隔被识别；小于等于下限时按固定值等待。例：下限 1000、上限 3000，每次等 1~3 秒。",
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
    节奏控制：串行流程里插在两个抓取节点之间，按毫秒等待以降低对目标站点的压力；
    填了「随机上限」后每次等待会在区间内随机，避免固定间隔被识别为机器行为。
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

/* 前端补充的参数说明：后端 meta 没给 tip，或 tip 只当占位符时补一句「是什么 / 怎么用」 */
.field-tip {
  margin-top: 3px;
  font-size: 11px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}
</style>
