<!--
  节点参数表单的统一外壳。

  各 shape 表单此前的共同样板：声明同一套 props/emits、调 useShapeFieldList、
  v-for 渲染 ParamField、再来一份 LoopFields，外加复制粘贴的 .field/.field-wide/
  .node-intro 样式。差异其实只有三处——专属参数顺序、节点级说明、个别补充提示——
  于是全部收敛到这一个组件：

    * ownParamNames：本 shape 专属参数顺序（其余后端参数由 orderedParams 兜底追加）；
    * intro：节点级说明（左侧主色竖条 + 浅底），留空不渲染；
    * extraTips：按参数名补充一句前端说明（后端 meta 没讲到的取舍）。

  ParamField 自身根元素就是 .field 且自带 field-wide 判定（textarea / pairs / mapping /
  table / outputVariable），因此这里**直接**渲染 ParamField、不再套一层 .field 容器——
  旧表单普遍双重包裹（.field.field-wide > .field）是冗余。只有带补充提示的参数才包一层，
  以便把提示排在参数正下方，行为与旧 processForm 一致。

  循环迭代分节（LoopFields）与抽取字段块（FieldTable）对所有可迭代 / 带 fieldEditor 的
  shape 通用，也在这里统一渲染；形状真正特有的区段走默认插槽，排在最后。
-->
<script setup lang="ts">
import FieldTable from "../FieldTable.vue";
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
  /** 本 shape 专属参数名，按期望展示顺序；其余后端参数由 orderedParams 兜底追加 */
  ownParamNames?: string[];
  /** 节点级说明；留空则不渲染说明条 */
  intro?: string;
  /** 按参数名补充的前端说明；key 为参数名 */
  extraTips?: Record<string, string>;
}>();

const emit = defineEmits<{
  (e: "set-param", param: CollectParamMeta, value: unknown): void;
  (e: "set-pairs", param: CollectParamMeta, pairs: ParamPair[]): void;
}>();

/** 专属参数顺序给空数组：orderedParams 按必填前置输出 meta 其余参数（循环四参数已剥离走 LoopFields） */
const { fields, valueOf, pairsOfParam } = useShapeFieldList(
  () => props.node,
  () => props.meta,
  props.ownParamNames ?? [],
);
</script>

<template>
  <div v-if="intro" class="field field-wide node-intro">{{ intro }}</div>

  <template v-for="param in fields" :key="param.name">
    <ParamField
      v-if="!extraTips || !extraTips[param.name]"
      :param="param"
      :value="valueOf(param.name)"
      :pairs="pairsOfParam(param.name)"
      :node-id="node.id"
      :ctx="ctx"
      @update="(value: unknown) => emit('set-param', param, value)"
      @pairs="(value: ParamPair[]) => emit('set-pairs', param, value)"
    />
    <div v-else class="field field-wide">
      <ParamField
        :param="param"
        :value="valueOf(param.name)"
        :pairs="pairsOfParam(param.name)"
        :node-id="node.id"
        :ctx="ctx"
        @update="(value: unknown) => emit('set-param', param, value)"
        @pairs="(value: ParamPair[]) => emit('set-pairs', param, value)"
      />
      <div class="field-tip">{{ extraTips[param.name] }}</div>
    </div>
  </template>

  <!-- 循环迭代分节：留空单次执行；start / end / comment 由 NON_LOOP_SHAPES 门控不渲染 -->
  <LoopFields
    :node="node"
    :meta="meta"
    :ctx="ctx"
    @set-param="(param: CollectParamMeta, value: unknown) => emit('set-param', param, value)"
    @set-pairs="(param: CollectParamMeta, pairs: ParamPair[]) => emit('set-pairs', param, pairs)"
  />

  <div v-if="meta.fieldEditor" class="field field-wide">
    <div class="field-label">抽取字段</div>
    <FieldTable
      :model-value="node.fields"
      :placeholder-groups="ctx.placeholderGroups"
      @update:model-value="ctx.writeFields"
    />
  </div>

  <!-- 形状特有的额外区段，排在循环分节与抽取字段之后 -->
  <slot />
</template>

<style scoped>
/* 字段容器：ParamField 根元素同样是 .field，这里只补最小宽度，宽度由 ParamField 自判 */
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

/* 前端补充的参数说明：后端 meta 没给 tip 时补一句「是什么 / 怎么用」 */
.field-tip {
  margin-top: 3px;
  font-size: 11px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}

/* 节点级说明：左侧 2px 主色竖条 + 浅底，与各节点表单同一形态 */
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
