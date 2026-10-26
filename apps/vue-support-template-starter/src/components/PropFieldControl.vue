<!--
  PropFieldControl —— 单个参数字段的输入控件

  从 PropPanel 抽出来，好让「常用参数」与「高级参数（折叠）」两处复用同一套控件，
  不必把 v-if 链复制两份。

  只负责渲染控件与回传值，不持有状态：值从 props.value 进，变化通过 change 事件出。
-->
<template>
  <!-- boolean -->
  <ReSwitch
    v-if="field.type === 'boolean'"
    layout="square"
    :title="field.label"
    :model-value="Boolean(value ?? field.default)"
    @update:model-value="(val: boolean | string | number) => emit('change', Boolean(val))"
  />

  <!-- string -->
  <el-input
    v-else-if="field.type === 'string'"
    :model-value="stringValue(value ?? field.default)"
    :placeholder="field.description || '输入文字'"
    @update:model-value="(val: string) => emit('change', val)"
  />

  <!-- number -->
  <el-input-number
    v-else-if="field.type === 'number'"
    :model-value="numberValue(value ?? field.default)"
    :placeholder="field.description || '输入数字'"
    @update:model-value="(val: number) => emit('change', val)"
  />

  <!-- dataset：分段控件直接切换数据集（替代多个 json 输入框） -->
  <div v-else-if="field.type === 'dataset'" class="prop-dataset">
    <el-segmented
      :model-value="currentDataset"
      :options="datasetLabels"
      size="small"
      block
      @change="(val: string | number | boolean) => emit('dataset', String(val))"
    />
    <p v-if="datasetHint" class="prop-dataset__hint">{{ datasetHint }}</p>
  </div>

  <!-- json -->
  <el-input
    v-else-if="field.type === 'json'"
    :model-value="jsonValue(value ?? field.default)"
    type="textarea"
    :rows="field.advanced ? 8 : 3"
    :placeholder="field.description || 'JSON 格式数据'"
    @update:model-value="(val: string) => emit('json', val)"
  />

  <!-- select：统一使用 ReSelect square 布局 -->
  <ReSelect
    v-else-if="field.type === 'select'"
    layout="square"
    :model-value="String(value ?? field.default)"
    :options="selectOptions"
    :size="16"
    @update:model-value="(val: any) => emit('change', val)"
  />

  <!-- color -->
  <el-color-picker
    v-else-if="field.type === 'color'"
    :model-value="(value as string) ?? (field.default as string)"
    @update:model-value="(val: string) => emit('change', val)"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PropField } from "../templates";

const props = defineProps<{
  field: PropField;
  /** 当前值（由父组件从 TemplateState.values 里取） */
  value: unknown;
}>();

const emit = defineEmits<{
  /** 单字段值变化 */
  (e: "change", value: unknown): void;
  /** json 文本变化（父组件负责解析） */
  (e: "json", text: string): void;
  /** dataset 档位切换（父组件负责一次性写入多个字段） */
  (e: "dataset", label: string): void;
}>();

const stringValue = (v: unknown) => (v === undefined || v === null ? "" : String(v));
const numberValue = (v: unknown) => (typeof v === "number" ? v : 0);

/** 模板选项转 ReSelect 选项（保留图标） */
const selectOptions = computed(() =>
  (props.field.options ?? []).map((opt) => ({
    label: opt.label,
    value: opt.value,
    icon: opt.icon,
  })),
);

const jsonValue = (v: unknown) => {
  if (v === undefined || v === null || v === "") return "";
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
};

/* ---------- dataset ---------- */

const datasetLabels = computed(() => (props.field.datasets ?? []).map((d) => d.label));

/**
 * 当前选中的数据集档位
 *
 * <p>父组件把档位 label 存在 {@code values[field.key]} 里（见 createInitialState），
 * 所以这里就是「取出来、确认它仍是合法档位」；label 失效（比如 JSON 被手改成
 * 非示例数据）时返回空串，让分段控件如实显示为未选中，而不是强留一个与实际
 * 数据不符的高亮。</p>
 */
const currentDataset = computed(() => {
  const raw = typeof props.value === "string" ? props.value : "";
  return datasetLabels.value.includes(raw) ? raw : "";
});

/** 当前档位的行为说明（未选中任何档位时退回字段自身的说明） */
const datasetHint = computed(() => {
  const label = currentDataset.value;
  if (!label) return props.field.description ?? "";
  return (props.field.datasets ?? []).find((d) => d.label === label)?.hint ?? props.field.description ?? "";
});
</script>

<style scoped>
.prop-dataset {
  width: 100%;
}

.prop-dataset :deep(.el-segmented) {
  width: 100%;
  --el-segmented-item-selected-bg-color: var(--el-color-primary);
  --el-segmented-item-selected-color: #fff;
}

.prop-dataset__hint {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}
</style>
