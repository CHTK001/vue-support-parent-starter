<script setup lang="ts">
/**
 * ReIcon —— 图标组件
 *
 * 通过名字从 @element-plus/icons-vue 动态解析图标组件渲染。
 */
import { computed } from "vue";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import { ElIcon } from "element-plus";

defineOptions({ name: "ReIcon", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    /** 图标名（@element-plus/icons-vue 的组件名，如 Search、Edit） */
    name: string;
    /** 图标尺寸（px） */
    size?: number | string;
    /** 图标颜色 */
    color?: string;
  }>(),
  {
    size: 16,
    color: "",
  },
);

/** 从图标库解析组件 */
const iconComponent = computed(() => {
  const icons = ElementPlusIconsVue as Record<string, unknown>;
  return icons[props.name] ?? null;
});
</script>

<template>
  <ElIcon v-bind="$attrs" :size="size" :color="color">
    <component :is="iconComponent" v-if="iconComponent" />
  </ElIcon>
</template>
