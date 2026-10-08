<!--
  输出节点表单：逐条集合、业务表数据源 / 表、字段映射、业务主键与来源地址。
  参数顺序由 paramContext 统一决定（必填置顶）；循环四参数由 LoopFields 以「循环迭代」分节展示。
-->
<script setup lang="ts">
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

/** 输出节点专属参数，按后端 meta 的下发顺序排列（业务表参数名是 targetTable） */
const { fields, valueOf, pairsOfParam } = useShapeFieldList(
  () => props.node,
  () => props.meta,
  ["each", "datasource", "targetTable", "cell:字段名", "key", "url"],
);
</script>

<template>
  <div class="field field-wide node-intro">
    落采集记录：把字段写成一条条采集结果。填了「逐条集合」就按集合逐条产出，留空则按当前令牌
    产出一条；填了「业务表」再镜像一份到该表（表不存在自动建、缺列自动补），记录数看任务详情的采集记录数。
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
</template>

<style scoped>
/* 参数容器：与 ParamField / genericForm 的字段样式保持一致 */
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
</style>
