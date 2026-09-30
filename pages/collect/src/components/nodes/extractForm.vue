<!--
  抽取节点表单：抽取来源、抽取模式、行选择器、出参变量名，并内嵌抽取字段编辑器。
  循环四参数由 paramContext 统一排在最前。
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

/** 抽取节点专属参数，按后端 meta 的下发顺序排列 */
const { fields, valueOf, pairsOfParam } = useShapeFieldList(
  () => props.node,
  () => props.meta,
  ["source", "mode", "rowExpression", "outputVariable"],
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
    <FieldTable
      :model-value="node.fields"
      :preview-url="ctx.previewUrl"
      :load-preview="ctx.loadPreview"
      :placeholder-groups="ctx.placeholderGroups"
      @update:model-value="ctx.writeFields"
    />
  </div>
</template>

<style scoped>
/* 字段容器样式与 ParamField 保持一致：抽取字段块是本表单独有的整行字段 */
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
