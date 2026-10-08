<!--
  结束节点表单：没有专属参数。

  结束节点本身不执行任何操作，作用是「显式收束」—— 每条分支的末端都必须收到一个结束节点，
  结构校验据此判断流程有没有走到头。因此这里没有可配项，只给说明，不留空白；
  它也不是可迭代单元，循环四参数由 NON_LOOP_SHAPES 门控，连分节都不出现。
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

/** 结束节点没有专属参数；它也不是可迭代单元，循环分节由 NON_LOOP_SHAPES 门控不渲染 */
const { fields, valueOf, pairsOfParam } = useShapeFieldList(
  () => props.node,
  () => props.meta,
  [],
);
</script>

<template>
  <div class="field field-wide node-intro">
    流程终点：本身不执行任何操作，用来把「分支走到头了」画出来；
    每条分支的末端都必须收到一个结束节点。
  </div>

  <div v-if="!fields.length" class="field field-wide node-empty">
    结束节点没有可配置项：把它放在每条分支的最末端即可，流程才算收束完整。
  </div>

  <div
    v-for="param in fields"
    :key="param.name"
    class="field field-wide"
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
  </div>
</template>

<style scoped>
/* 字段容器样式与 ParamField / genericForm 保持一致 */
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

/* 无参空态：不留白，明确告诉用户这个节点不需要配什么 */
.node-empty {
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter);
  border: 1px dashed var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
}
</style>
