<script setup lang="ts">
/**
 * ReAlert —— 提示框（el-alert 封装）
 *
 * 扁平化风格：左色带 + 微色底 + 柔和阴影。
 */
import { ElAlert } from "element-plus";
import "../shared/modern-vars.css";

defineOptions({ name: "ReAlert", inheritAttrs: true });

withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    type?: "success" | "warning" | "info" | "error";
    closable?: boolean;
    closeText?: string;
    showIcon?: boolean;
    center?: boolean;
  }>(),
  {
    title: "",
    description: "",
    type: "info",
    closable: true,
    closeText: "",
    showIcon: true,
    center: false,
  },
);

const emit = defineEmits<{ (e: "close"): void }>();
</script>

<template>
  <ElAlert
    v-bind="$attrs"
    :title="title"
    :description="description"
    :type="type"
    :closable="closable"
    :close-text="closeText"
    :show-icon="showIcon"
    :center="center"
    class="re-alert"
    @close="emit('close')"
  >
    <template v-if="$slots.title" #title>
      <slot name="title" />
    </template>
    <template v-if="$slots.default" #default>
      <slot />
    </template>
  </ElAlert>
</template>

<style scoped>
.re-alert {
  border-radius: var(--rm-radius);
  font-weight: 500;
  box-shadow:
    inset 3px 0 0 currentColor,
    0 2px 10px rgba(15, 23, 42, 0.05);
  border: 1px solid var(--rm-border-light);
}
</style>