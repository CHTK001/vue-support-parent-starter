<script setup lang="ts">
/**
 * ReDropdownItem —— 下拉菜单项（el-dropdown-item 薄封装）
 */
import { ElDropdownItem } from "element-plus";

defineOptions({ name: "ReDropdownItem", inheritAttrs: true });

withDefaults(
  defineProps<{
    disabled?: boolean;
    divided?: boolean;
    command?: string | number | object;
  }>(),
  {
    disabled: false,
    divided: false,
    command: undefined,
  },
);
</script>

<template>
  <ElDropdownItem v-bind="$attrs" :disabled="disabled" :divided="divided" :command="command" class="re-dropdown-item">
    <slot />
  </ElDropdownItem>
</template>

<style scoped>
.re-dropdown-item {
  border-radius: var(--rm-radius-sm, 6px);
}
</style>