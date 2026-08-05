<template>
  <div class="re-switch-default">
    <span v-if="title" class="re-switch-default__title">{{ title }}</span>
    <ElSwitch v-bind="$attrs" v-model="modelValue" />
  </div>
</template>

<script setup lang="ts">
import { ElSwitch } from "element-plus";

defineOptions({ name: "DefaultReSwitch", inheritAttrs: true });

const props = defineProps<{
  title?: string;
}>();

const modelValue = defineModel<boolean | string | number>({ default: false });
</script>

<style lang="scss" scoped>
.re-switch-default {
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