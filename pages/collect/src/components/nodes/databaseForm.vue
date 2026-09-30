<!--
  数据库节点表单：来源集合、目标数据源 / 表、写入方式、字段映射、主键列与每批行数。
  参数顺序由 paramContext 统一决定（必填置顶、循环四参数在末尾）。
  表单额外补两块说明：来源集合与每批行数的真实语义、主键列必须先在字段映射里声明。
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

/** 数据库节点专属参数，按后端 meta 的下发顺序排列 */
const { fields, valueOf, pairsOfParam } = useShapeFieldList(
  () => props.node,
  () => props.meta,
  ["source", "datasource", "table", "mode", "column:目标列", "key:主键列", "batchSize"],
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
 * <p>后端 meta 的 tip 对 textarea 只当占位符（输入后即消失），「每批行数」的 tip 又容易被
 * 误解成总量上限，主键列的校验时机也没说清；这里逐条补一句，只作用于本表单，不改后端。</p>
 */
const EXTRA_TIPS: Record<string, string> = {
  source: "填集合表达式，例 ${rows}；也接受单条映射（按一行处理）。抽取、SQL、链接节点的出参可直接喂进来。",
  mode: "追加 = 只插入；覆盖 = 先清空整表再插入（不需要主键）；按主键更新 = 先按主键查、再改或插（必须先声明 key: 主键列）。三者的写入语义不同，不是同一件事。",
  batchSize:
    "写入批次大小，默认 500：把结果集合按这个大小切片、每片一次数据库批提交。它不是总量上限 —— 抓了 400 行、这里填 200，就是分 2 批写两次；值全部走预编译绑定，按主键更新时每批一个事务。",
  "key:主键列":
    "只在「按主键更新」时生效：这里填的列必须先在「字段映射」里声明为某个目标列，否则会在建表 / 写数之前直接报错；联合主键填多条，右侧值留空。选「覆盖」时这一项会被忽略。",
};

/**
 * 写入方式的中文标签 —— 暂时保留为「待接线」，不要直接改这里的映射。
 *
 * <p>后端的 {@code CollectParamMeta.options} 类型是 {@code string[]}，label 与值共用同一个字符串，
 * 所以前端无法表达「值=update、显示=按主键更新」。要让下拉显示中文，必须先做二选一：</p>
 * <ul>
 *   <li>前端：把 {@code CollectParamMeta.options} 放宽为 {@code (string | { value; label })[]}，
 *       并让 ParamField 的 select 分支兼容两种形态（改 types/collect.ts + ParamField）；</li>
 *   <li>后端：给 metas 增加可带 label 的选项形态，让「写入方式」下发中文标签（需重新构建发布）。</li>
 * </ul>
 */
const MODE_LABELS: Record<string, string> = {
  append: "追加（只插入）",
  replace: "覆盖（先清空整表）",
  update: "按主键更新（改或插）",
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
    批量入库：把上游产出的集合整批写进目标表。表不存在会自动建、缺列会自动补，列类型按这一批
    实际取值推断；本节点不产采集记录，写入行数看节点摘要。
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
