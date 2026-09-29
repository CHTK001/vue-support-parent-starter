<!--
  通用回落节点表单：shape 没有专门表单文件时使用。

  与拆分前的通用渲染等价——按 meta.params 的顺序逐个渲染，并保留 fieldEditor 的抽取字段块。
-->
<script setup lang="ts">
import FieldTable from "../FieldTable.vue";
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

/** names 传空：orderedParams 依次输出循环四参数与 meta 里的其余参数，顺序与通用渲染一致 */
const { fields, valueOf, pairsOfParam } = useShapeFieldList(
  () => props.node,
  () => props.meta,
  [],
);
</script>

<template>
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
  <div v-if="meta.fieldEditor" class="field field-wide">
    <div class="field-label">抽取字段</div>
    <FieldTable :model-value="node.fields" @update:model-value="ctx.writeFields" />
  </div>
</template>

<style scoped>
/* 字段容器样式与 ParamField 保持一致（通用表单同样可能带抽取字段块） */
.field {
  min-width: 0;
}

.field-wide {
  grid-column: 1 / -1;
}

.field-label {
  margin-bottom: 3px;
  font-size: 12px;
  color: #86909c;
}
</style>
