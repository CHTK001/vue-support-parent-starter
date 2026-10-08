<!--
  抽取节点表单：抽取来源、抽取模式、行选择器、出参变量名，以及抽取字段（弹框内配置）。
  参数顺序由 paramContext 统一决定（必填置顶、循环参数在末尾）。
-->
<script setup lang="ts">
import {
  computed,
  ref } from "vue";
import { ElDialog,
} from "element-plus";
import ReButton from "@repo/ui/re-button";
import FieldTable from "../FieldTable.vue";
import ParamField from "./ParamField.vue";
import { useShapeFieldList } from "./paramContext";
import type { NodeForm, NodeFormContext } from "./paramContext";
import type { ParamPair } from "../../utils/dsl";
import type { CollectParamMeta, CollectShapeMeta } from "../../types/collect";
import ReDialog from "@repo/ui/re-dialog";

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

/**
 * 实际渲染的参数：**「行选择器」只在列表模式显示**。
 *
 * <p>它是列表模式用来把来源切成多行的（如 CSS 的 li.item、JSON 的 data.items）；单条模式下
 * 它不起作用，摆在表单里只会让人以为必须填 —— 实测用户正是这么被绕住的。收起而不是删除：
 * 切回列表模式时它还按原值在（后端契约不变）。</p>
 */
const isListMode = computed(() => String(valueOf("mode") || "").trim().toLowerCase() === "list");
const visibleFields = computed(() =>
  fields.value.filter(param => param.name !== "rowExpression" || isListMode.value),
);

/** 抽取字段弹框开关 */
const fieldsOpen = ref(false);

/**
 * 字段摘要文案，与「字段映射」控件保持同一形态（「N 个字段（类型）」+「配置」）。
 *
 * <p>字段表原先整张铺在属性面板里，十几个字段比其它所有参数加起来都长，面板被撑爆；
 * 收进弹框后这里只留一行摘要，需要改的时候再点开。</p>
 */
const fieldSummary = computed(() => {
  const list = props.node.fields ?? [];
  if (!list.length) {
    // 抽取节点没有字段就等于什么都没抽；这里必须是显式告警，不能只写「未配置」。
    return "未配置字段 —— 抽取节点至少要声明一个字段，否则节点跑完什么都不会产出";
  }
  const types = [...new Set(list.map(field => (field.parserType || "CSS").toUpperCase()))];
  return `${list.length} 个字段（${types.join(" / ")}）`;
});
</script>

<template>
  <div class="field field-wide node-intro">
    抽取节点：把上游抓到的内容按「字段」解析成行列数据 —— 每行一个字段，
    声明用哪种解析器（CSS / XPath / JSONPath / 正则…）以及取值表达式；结果供写库、输出或循环节点使用。
  </div>

  <ParamField
    v-for="param in visibleFields"
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
    <div class="field-label">抽取字段<span class="req">*</span></div>
    <div class="field-summary" :class="{ 'summary-missing': !node.fields?.length }">
      <span class="summary-text">{{ fieldSummary }}</span>
      <ReButton text type="primary" @click="fieldsOpen = true">配置</ReButton>
    </div>
    <!-- append-to-body：属性面板自身可能有 overflow/transform，弹框留在面板内会被裁掉 -->
    <ReDialog v-model="fieldsOpen" title="抽取字段" width="1400px" top="10px" append-to-body>
      <FieldTable
        :model-value="node.fields"
        :preview-url="ctx.previewUrl"
        :load-preview="ctx.loadPreview"
        :placeholder-groups="ctx.placeholderGroups"
        @update:model-value="ctx.writeFields"
      />
    </ReDialog>
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

/* 摘要行与字段映射控件同形：左侧文本、右侧「配置」 */
.field-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  padding: 0 10px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
}

.summary-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 13px;
  color: var(--el-text-color-regular);
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 必填星号与「未配置」告警：抽取节点没有字段等于没抽，要一眼看见 */
.req {
  margin-left: 2px;
  color: var(--el-color-danger);
}

.summary-missing {
  background: var(--el-color-danger-light-9);
  border-color: var(--el-color-danger-light-5);
}

.summary-missing .summary-text {
  color: var(--el-color-danger);
}

/* 节点级说明：与其它节点表单同一形态（左侧 2px 主色竖条 + 浅底） */
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
