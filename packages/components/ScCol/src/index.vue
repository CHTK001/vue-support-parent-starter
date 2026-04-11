<template>
  <component :is="currentComponent || ElCol" :xs="xs" :sm="sm" :md="md" :lg="lg" :xl="xl" :tag="tag" :span="span" :offset="offset" :pull="pull" :push="push">
    <template v-if="$slots.default" #default>
      <slot />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ScCol 列布局组件
 * 封装 Element Plus Col
 * 支持根据 data-skin 切换主题化组件样式
 */
import { computed } from "vue";
import type { PropType } from "vue";
import { ElCol } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

type ResponsiveValue = number | { span?: number; offset?: number; pull?: number; push?: number };

defineProps({
  xs: {
    type: [Number, Object] as PropType<ResponsiveValue>,
    default: undefined
  },
  sm: {
    type: [Number, Object] as PropType<ResponsiveValue>,
    default: undefined
  },
  md: {
    type: [Number, Object] as PropType<ResponsiveValue>,
    default: undefined
  },
  lg: {
    type: [Number, Object] as PropType<ResponsiveValue>,
    default: undefined
  },
  xl: {
    type: [Number, Object] as PropType<ResponsiveValue>,
    default: undefined
  },
  tag: {
    type: String,
    default: "div"
  },
  span: {
    type: Number,
    default: 24
  },
  offset: {
    type: Number,
    default: 0
  },
  pull: {
    type: Number,
    default: 0
  },
  push: {
    type: Number,
    default: 0
  }
});

const { currentComponent } = useThemeComponent("ElCol");
</script>
