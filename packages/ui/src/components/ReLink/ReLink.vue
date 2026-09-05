<script setup lang="ts">
/**
 * ReLink —— 链接（el-link 封装）
 */
import { ElLink } from "element-plus";

defineOptions({ name: "ReLink", inheritAttrs: true });

withDefaults(
  defineProps<{
    type?: "primary" | "success" | "warning" | "danger" | "info" | "default";
    underline?: boolean;
    disabled?: boolean;
    href?: string;
    target?: string;
  }>(),
  {
    type: "default",
    underline: true,
    disabled: false,
    href: undefined,
    target: "_blank",
  },
);
</script>

<template>
  <ElLink
    v-bind="$attrs"
    :type="type"
    :underline="underline"
    :disabled="disabled"
    :href="href"
    :target="target"
    class="re-link"
  >
    <slot />
  </ElLink>
</template>