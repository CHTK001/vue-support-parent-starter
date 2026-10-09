<!--
  ReSwitch · radio 布局 —— 用 ReRadioGroup（分段单选）表达「开 / 关」两态。

  <p>与 el-switch 的区别是**语义可见**：开关要靠位置猜哪边是开，分段单选把两个
  选项文字都摆出来（默认「是 / 否」），一眼读出当前值，也方便在密集表单里对齐。
  数据库控制台的布尔列（可空 / 主键 / 唯一 / 自增…）都走这一档。</p>

  <p>取值口径：本布局只认布尔两态，读的时候把 1/"1"/"true" 归一成 true，
  写的时候一律写回 boolean —— 上层若绑的是字符串/数字开关，切过一次就会被
  归一（见 {@link normalized}），这是刻意的：分段单选没有第三态可显示。</p>
-->
<script setup lang="ts">
import { computed } from "vue";
import { ReRadioButton, ReRadioGroup } from "../../ReKit/index";

defineOptions({ name: "RadioReSwitch", inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /** 左侧标题（ReSwitch 通用布局 props） */
    title?: string;
    /** 「开」的文案 */
    radioOnLabel?: string;
    /** 「关」的文案 */
    radioOffLabel?: string;
  }>(),
  {
    title: "",
    radioOnLabel: "是",
    radioOffLabel: "否",
  },
);

const modelValue = defineModel<boolean | string | number>({ default: false });

/** 归一：只有 true/"true"/1/"1" 算开，其余一律算关（分段单选只能二选一） */
const normalized = computed(() =>
  modelValue.value === true || modelValue.value === "true" || modelValue.value === 1 || modelValue.value === "1",
);

function onUpdate(value: unknown): void {
  modelValue.value = value === true || value === "true" || value === 1 || value === "1";
}
</script>

<template>
  <div class="re-switch-radio">
    <span v-if="props.title" class="re-switch-radio__title">{{ props.title }}</span>
    <ReRadioGroup
      :model-value="normalized"
      v-bind="$attrs"
      @update:model-value="onUpdate"
    >
      <ReRadioButton :value="true">{{ props.radioOnLabel }}</ReRadioButton>
      <ReRadioButton :value="false">{{ props.radioOffLabel }}</ReRadioButton>
    </ReRadioGroup>
  </div>
</template>

<style lang="scss" scoped>
.re-switch-radio {
  display: inline-flex;
  align-items: center;
  gap: 12px;

  &__title {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    white-space: nowrap;
    user-select: none;
  }
}
</style>
