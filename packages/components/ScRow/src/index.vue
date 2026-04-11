<template>
  <component :is="currentComponent || ElRow" :gutter="gutter" :tag="tag" :justify="justify" :align="align" :wrap="wrap">
    <template v-if="$slots.default" #default>
      <slot />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ScRow 行布局组件
 * 封装 Element Plus Row
 * 支持根据 data-skin 切换主题化组件样式
 */
import { computed } from "vue";
import type { PropType } from "vue";
import { ElRow } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

defineProps({
  gutter: {
    type: Number,
    default: 0
  },
  tag: {
    type: String,
    default: "div"
  },
  justify: {
    type: String as PropType<"start" | "end" | "center" | "space-around" | "space-between" | "space-evenly">,
    default: "start"
  },
  align: {
    type: String as PropType<"top" | "middle" | "bottom">,
    default: "top"
  },
  wrap: {
    type: Boolean,
    default: false
  }
});

const { currentComponent } = useThemeComponent("ElRow");
</script>
