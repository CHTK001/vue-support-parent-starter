<script setup lang="ts">
/**
 * ReAvatar —— 头像（el-avatar 封装）
 */
import { ElAvatar } from "element-plus";
import "../shared/modern-vars.css";

defineOptions({ name: "ReAvatar", inheritAttrs: true });

withDefaults(
  defineProps<{
    size?: number | string;
    shape?: "circle" | "square";
    src?: string;
    fit?: "fill" | "contain" | "cover" | "none" | "scale-down";
    alt?: string;
  }>(),
  {
    size: 40,
    shape: "circle",
    src: "",
    fit: "cover",
    alt: "",
  },
);
</script>

<template>
  <ElAvatar
    v-bind="$attrs"
    :size="size"
    :shape="shape"
    :src="src"
    :fit="fit"
    :alt="alt"
    class="re-avatar"
  >
    <slot />
  </ElAvatar>
</template>

<style scoped>
.re-avatar {
  background: color-mix(in srgb, var(--rm-primary) 12%, transparent);
  color: var(--rm-primary);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--rm-primary) 20%, transparent);
}
</style>