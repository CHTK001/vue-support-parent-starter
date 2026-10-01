<script setup lang="ts">
/**
 * ServerFilter 单个参数字段行 —— 按 schema 类型渲染控件。
 *
 * 抽成独立组件的原因：文件服务器 / 服务发现 / 通用 schema 三种面板都要渲染同一批控件，
 * 若各自内联一份 switch/select/input 标记，改一次控件行为要同步改三处。
 *
 * 取值语义与旧实现保持一致：参数缺省时回落到 schema 的 defaultValue，
 * 因此父组件只需回传当前值，不必先把默认值填满。
 */
import { computed } from 'vue';
import type { FilterParamSchema } from '../../api';

const props = defineProps<{
  /** 字段 schema */
  field: FilterParamSchema;
  /** 当前值（原始字符串） */
  value?: string | null;
}>();

const emit = defineEmits<{
  (e: 'update', value: string): void;
}>();

/** 有效取值：优先实配值，其次 schema 默认值 */
const effective = computed(() => {
  const v = props.value;
  if (v !== undefined && v !== null) return v;
  return props.field.defaultValue ?? '';
});

/** 布尔判定：空值视为开（历史实现如此，保持兼容） */
const asBool = computed(() => {
  const v = String(effective.value).trim().toLowerCase();
  return v === '' || v === 'true' || v === '1' || v === 'yes' || v === 'on';
});

/** 枚举候选 */
const options = computed(() =>
  (props.field.options ?? []).map(o => ({ label: o, value: o })),
);
</script>

<template>
  <div class="fc-field">
    <div class="fc-label">
      <span>{{ field.name }}</span>
      <span class="fc-hint">{{ field.desc }}</span>
    </div>
    <ReSwitch
      v-if="field.type === 'boolean'"
      :model-value="asBool"
      @change="(v: any) => emit('update', v ? 'true' : 'false')"
    />
    <ReSelect
      v-else-if="field.type === 'enum' && options.length"
      :model-value="effective"
      :data="options"
      style="width: 100%"
      @change="(v: any) => emit('update', String(v))"
    />
    <ReInput
      v-else
      :model-value="effective"
      :placeholder="field.desc || field.name"
      @update:model-value="(v: any) => emit('update', String(v ?? ''))"
    />
  </div>
</template>

<style scoped lang="scss">
.fc-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 32px;
}
.fc-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.fc-label > span:first-child {
  font-size: 13px;
  color: var(--el-text-color-primary);
  font-family: ui-monospace, SFMono-Regular, monospace;
}
.fc-hint {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
</style>
