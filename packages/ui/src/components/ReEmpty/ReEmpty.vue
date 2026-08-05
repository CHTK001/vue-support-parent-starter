<template>
  <!-- Modern 布局（异步加载） -->
  <ModernLayout
    v-if="layout === 'modern'"
    :description="description"
    :image="image"
    :image-size="imageSize"
    v-bind="$attrs"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
    <template v-if="$slots.image" #image>
      <slot name="image" />
    </template>
    <template v-if="$slots.description" #description>
      <slot name="description" />
    </template>
  </ModernLayout>

  <!-- 默认 el-empty 布局 -->
  <el-empty
    v-else
    v-bind="$attrs"
    :image="image"
    :image-size="imageSize"
    :description="description"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
    <template v-if="$slots.image" #image>
      <slot name="image" />
    </template>
    <template v-if="$slots.description" #description>
      <slot name="description" />
    </template>
  </el-empty>
</template>

<script setup lang="ts">
/**
 * ReEmpty —— 空状态组件
 *
 * 透传 el-empty 全部能力。
 *   - layout：布局变体，"el"（默认，el-empty）/ "modern"（现代化扁平空状态，异步加载）
 */
import { defineAsyncComponent } from "vue";

/** Modern 布局组件（按需异步加载） */
const ModernLayout = defineAsyncComponent(() => import("./layouts/Modern.vue"));

defineOptions({ name: "ReEmpty" });

withDefaults(
  defineProps<{
    /** 布局变体："el"（默认 el-empty）/ "modern"（现代化扁平空状态） */
    layout?: "el" | "modern";
    image?: string;
    imageSize?: number;
    description?: string;
  }>(),
  {
    layout: "el",
    image: undefined,
    imageSize: undefined,
    description: undefined,
  },
);
</script>
