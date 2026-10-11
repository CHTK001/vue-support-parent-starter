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

/** 是否已偏离 schema 默认值（面板头部有总计数，字段级标记让「改了哪几项」一眼可见） */
const changed = computed(() => {
  const v = props.value;
  if (v === undefined || v === null || v === '') return false;
  return String(v) !== String(props.field.defaultValue ?? '');
});
</script>

<template>
  <div class="fc-field">
    <div class="fc-label">
      <span class="fc-name">{{ field.name }}</span>
      <!-- 已偏离默认值时打标记：原先只能靠逐个输入框比对 schema 才能发现改过什么 -->
      <span v-if="changed" class="fc-changed" title="已修改（与默认值不同）">已改</span>
    </div>
    <div v-if="field.desc" class="fc-hint">{{ field.desc }}</div>

    <ReSwitch
      v-if="field.type === 'boolean'"
      class="fc-control fc-control--switch"
      :model-value="asBool"
      @change="(v: any) => emit('update', v ? 'true' : 'false')"
    />
    <ReSelect
      v-else-if="field.type === 'enum' && options.length"
      class="fc-control"
      :model-value="effective"
      :data="options"
      @change="(v: any) => emit('update', String(v))"
    />
    <ReInput
      v-else
      class="fc-control"
      :model-value="effective"
      :placeholder="field.desc || field.name"
      @update:model-value="(v: any) => emit('update', String(v ?? ''))"
    />
  </div>
</template>

<style scoped lang="scss">
/* 纵向堆叠而非「标签左 / 控件右」的 space-between：
   后者的标签宽度随文案伸缩，同一栅格行里各字段的控件起始 x 坐标各不相同，
   整片表单看上去参差不齐。改为上下堆叠后，每个控件都从字段块左边缘起算，
   栅格再等分列宽 → 控件起始位置逐列对齐。 */
.fc-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.fc-label {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.fc-name {
  font-size: 13px;
  line-height: 1.3;
  color: var(--el-text-color-primary);
  font-family: ui-monospace, SFMono-Regular, monospace;
  overflow-wrap: anywhere;
}
/* 「已改」标记：12px 以下的浅底圆角标签，不与字段名争视觉层级 */
.fc-changed {
  flex-shrink: 0;
  font-size: 11px;
  line-height: 1;
  padding: 2px 6px;
  border-radius: var(--el-radius-xs, 4px);
  background: color-mix(in srgb, var(--el-color-warning) 14%, transparent);
  color: var(--el-color-warning-dark-2);
}
.fc-hint {
  font-size: 11px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}
/* 控件统一占满字段块宽度，栅格各列因此视觉等宽 */
.fc-control {
  width: 100%;
}
/* 开关自身宽度固定，居中反而像没对齐；左对齐才与上方控件左边缘同线 */
.fc-control--switch {
  width: auto;
  margin-top: 2px;
}
</style>
