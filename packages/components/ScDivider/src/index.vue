<template>
  <component :is="currentComponent || ElDivider" :direction="direction" :content-position="contentPosition" :border-style="borderStyle">
    <template v-if="$slots.default" #default>
      <slot />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ScDivider 分割线组件
 * 封装 Element Plus Divider
 * 支持根据 data-skin 切换主题化组件样式
 */
import { computed } from "vue";
import type { PropType } from "vue";
import { ElDivider } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

defineProps({
  direction: {
    type: String as PropType<"horizontal" | "vertical">,
    default: "horizontal"
  },
  contentPosition: {
    type: String as PropType<"left" | "right" | "center">,
    default: "center"
  },
  borderStyle: {
    type: String as PropType<"none" | "solid" | "hidden" | "dashed" | "dotted">,
    default: "solid"
  }
});

const { currentComponent } = useThemeComponent("ElDivider");
</script>
