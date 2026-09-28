<!--
  抽取字段编辑器（仅 extract 节点，meta.fieldEditor=true 时出现）。

  对应 CollectExtractFieldDTO：name/parserType/expression/attribute/attrName/group/defaultValue。
  attribute 只在 CSS/JSON 解析下有意义，group 只在 REGEX 下有意义，按此收敛表单项。
-->
<script setup lang="ts">
import { computed } from "vue";
import ReButton from "@repo/ui/re-button";
import ReInput from "@repo/ui/re-input";
import ReInputNumber from "@repo/ui/re-input-number";
import ReSelect from "@repo/ui/re-select";
import type { CollectExtractField } from "../types/collect";

const props = defineProps<{ modelValue: CollectExtractField[] }>();
const emit = defineEmits<{ (event: "update:modelValue", value: CollectExtractField[]): void }>();

const PARSER_TYPES = ["CSS", "REGEX", "JSON", "TEXT", "HTML"].map(item => ({ value: item, label: item }));
const PARSER_HINTS: Record<string, string> = {
  CSS: "按 CSS 选择器命中元素，再取右侧的文本 / 属性 / HTML",
  REGEX: "正则匹配标记文本（元素取 outerHTML、纯文本取原文、响应取 JSON），不是页面可见文本",
  JSON: "按 JSON 路径取值，如 data.items[0].title",
  TEXT: "取来源可见文本；来源是纯文本且不含标记时原样返回",
  HTML: "取来源标记文本",
};
const ATTRIBUTES = [
  { value: "text", label: "文本 text" },
  { value: "attr", label: "属性 attr" },
  { value: "html", label: "内层 HTML" },
  { value: "outer", label: "外层 HTML" },
];

const fields = computed(() => props.modelValue ?? []);

function patch(index: number, changes: Partial<CollectExtractField>): void {
  emit(
    "update:modelValue",
    fields.value.map((field, i) => (i === index ? { ...field, ...changes } : field)),
  );
}

function remove(index: number): void {
  emit(
    "update:modelValue",
    fields.value.filter((_, i) => i !== index),
  );
}

function addField(): void {
  emit("update:modelValue", [
    ...fields.value,
    { name: "", parserType: "CSS", expression: "", attribute: "text", attrName: "", group: 1, defaultValue: "" },
  ]);
}
</script>

<template>
  <div class="collect-fields">
    <div v-for="(field, index) in fields" :key="index" class="collect-field-card">
      <div class="card-head">
        <ReInput

          placeholder="字段名"
          :model-value="field.name"
          @update:model-value="(value: unknown) => patch(index, { name: String(value ?? '') })"
        />
        <ReSelect

          class="head-parser"
          :model-value="field.parserType || 'CSS'"
          :options="PARSER_TYPES"
          @update:model-value="(value: string | number | (string | number)[] | null) => patch(index, { parserType: String(value ?? 'CSS') })"
        />
        <ReButton text type="danger" icon="Delete" @click="remove(index)">删</ReButton>
      </div>
      <ReInput

        placeholder="表达式：CSS 选择器 / 正则 / JSON 路径"
        :model-value="field.expression"
        @update:model-value="(value: unknown) => patch(index, { expression: String(value ?? '') })"
      />
      <div v-if="PARSER_HINTS[field.parserType || 'CSS']" class="card-hint">
        {{ PARSER_HINTS[field.parserType || "CSS"] }}
      </div>
      <div class="card-row">
        <ReSelect
          v-if="field.parserType !== 'REGEX'"

          class="head-attr"
          :model-value="field.attribute || 'text'"
          :options="ATTRIBUTES"
          @update:model-value="(value: string | number | (string | number)[] | null) => patch(index, { attribute: String(value ?? 'text') })"
        />
        <ReInput
          v-if="field.attribute === 'attr'"

          class="cell-grow"
          placeholder="属性名"
          :model-value="field.attrName"
          @update:model-value="(value: unknown) => patch(index, { attrName: String(value ?? '') })"
        />
        <ReInputNumber
          v-if="field.parserType === 'REGEX'"

          class="cell-group"
          :min="0"
          :controls="false"
          placeholder="组号"
          :model-value="field.group ?? 1"
          @update:model-value="(value: number | undefined) => patch(index, { group: Number(value ?? 1) })"
        />
        <ReInput

          class="cell-grow"
          placeholder="空值默认"
          :model-value="field.defaultValue"
          @update:model-value="(value: unknown) => patch(index, { defaultValue: String(value ?? '') })"
        />
      </div>
    </div>
    <ReButton plain icon="Plus" @click="addField">添加字段</ReButton>
  </div>
</template>

<style scoped>
.collect-field-card {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 7px 8px;
  margin-bottom: 6px;
  /* 原为写死的 #fbfcfe → #f6f8fb 亮色渐变，暗色模式下会是刺眼白块；
     改用「页面底色 → 更浅一档填充色」令牌渐变，保留原有的微渐变质感又能跟随主题 */
  background: linear-gradient(180deg, var(--el-bg-color), var(--el-fill-color-lighter));
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  transition:
    border-color var(--el-transition-duration-fast, 0.2s) ease,
    box-shadow var(--el-transition-duration-fast, 0.2s) ease;
}

/* 允许的两处投影之一：悬浮抬升反馈；静止态不加投影，边界由边框承载 */
.collect-field-card:hover {
  border-color: var(--el-color-primary-light-7);
  box-shadow: var(--el-box-shadow-light);
}

.card-head,
.card-row {
  display: flex;
  align-items: center;
  gap: 5px;
}

.head-parser {
  flex: 0 0 96px;
}

.card-hint {
  font-size: 11px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.head-attr {
  flex: 0 0 112px;
}

.cell-group {
  flex: 0 0 78px;
}

.cell-grow {
  flex: 1 1 auto;
  min-width: 0;
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .collect-field-card {
    transition: none;
  }
}
</style>
