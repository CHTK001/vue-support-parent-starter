<template>
  <component
    :key="`badge-${currentSkin}`"
    :is="currentComponent || ElBadge"
    :value="value"
    :max="max"
    :is-dot="isDot"
    :dot="isDot"
    :hidden="hidden"
    :type="type"
    :show-zero="showZero"
    :color="color"
    :offset="offset"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
    <template v-if="$slots.content" #content>
      <slot name="content" />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ScBadge 徽章组件
 * 封装 Element Plus Badge
 * 支持根据 data-skin 切换主题化组件样式
 */
import type { PropType } from "vue";
import { ElBadge } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

const props = defineProps({
  value: {
    type: [String, Number],
    default: ""
  },
  max: {
    type: Number,
    default: 99
  },
  isDot: {
    type: Boolean,
    default: false
  },
  hidden: {
    type: Boolean,
    default: false
  },
  type: {
    type: String as PropType<"primary" | "success" | "warning" | "danger" | "info">,
    default: "danger"
  },
  showZero: {
    type: Boolean,
    default: true
  },
  color: {
    type: String,
    default: ""
  },
  offset: {
    type: Array as unknown as PropType<[number, number]>,
    default: undefined
  }
});

const { currentComponent, currentSkin } = useThemeComponent("ElBadge");
</script>
