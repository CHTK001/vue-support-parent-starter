<!--
  链接节点表单：页面来源、选择器、取值属性、过滤正则、转绝对地址与出参变量名。
  参数顺序由 paramContext 统一决定（必填置顶、循环四参数在末尾）。
-->
<script setup lang="ts">
import ParamField from "./ParamField.vue";
import { LOOP_PARAM_NAMES, useShapeFieldList } from "./paramContext";
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

/** 链接节点专属参数，按后端 meta 的下发顺序排列 */
const { fields, valueOf, pairsOfParam } = useShapeFieldList(
  () => props.node,
  () => props.meta,
  ["source", "selector", "attribute", "pattern", "absolute", "limit", "outputVariable"],
);

/** 循环四参数名集合，用于给「循环」分段定位 */
const loopNames = new Set(LOOP_PARAM_NAMES);

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
 * 判断某个字段是不是「循环」分段的第一个参数。
 *
 * <p>循环四参数由 orderedParams 统一追加在末尾，位置固定；命中它时插一条分段标题，
 * 把节点自身参数与循环配置分开，避免用户把循环参数当成节点必填项。</p>
 *
 * @param index 字段在 fields 里的下标
 * @returns 是分段首项返回 true
 */
function startsLoopSegment(index: number): boolean {
  const list = fields.value;
  const current = list[index];
  const previous = list[index - 1];
  return (
    index > 0 &&
    current !== undefined &&
    previous !== undefined &&
    loopNames.has(current.name) &&
    !loopNames.has(previous.name)
  );
}

/**
 * 前端补充的参数说明。
 *
 * <p>后端 meta 讲了各参数怎么填，但没说节点还会额外产出首条链接变量；这里补一句，
 * 只作用于本表单，不改后端。</p>
 */
const EXTRA_TIPS: Record<string, string> = {
  outputVariable:
    "除这里命名的出参变量外，节点还会把找到的第一个链接写入 ${link}，可在后续抓取节点里直接引用。",
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
    链接抽取：从当前页面（默认 ${respDoc}）按选择器抽出链接、去重后写入出参变量，供下游循环节点
    逐条抓取 —— 这是「列表页 → 详情页」两跳采集的标准接法。
  </div>

  <template v-for="(param, index) in fields" :key="param.name">
    <div v-if="startsLoopSegment(index)" class="field field-wide group-title">循环</div>

    <div class="field" :class="{ 'field-wide': isWide(param) }">
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

/* 分组标题：把节点自身参数与末尾的循环四参数分开（契约 §3.2） */
.group-title {
  margin: 12px 0 6px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

/* 前端补充的参数说明：后端 meta 没给 tip，或 tip 只当占位符时补一句「是什么 / 怎么用」 */
.field-tip {
  margin-top: 3px;
  font-size: 11px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}
</style>
