<script setup lang="ts">
/**
 * ReCard default 主题 —— 卡片组件（el-card 封装）
 *
 * 透传 el-card 全部能力，风格贴合 Vercel/Linear（低饱和、留白）。
 */
import { ElCard } from "element-plus";

defineOptions({ name: "ReCard", inheritAttrs: true });

defineProps<{
  header?: string;
  shadow?: "always" | "hover" | "never";
  bodyStyle?: Record<string, string>;
}>();
</script>

<template>
  <ElCard v-bind="$attrs" :header="header" :shadow="shadow" :body-style="bodyStyle" class="re-card">
    <template v-if="header" #header>{{ header }}</template>
    <slot />
  </ElCard>
</template>
