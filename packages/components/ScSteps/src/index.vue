<template>
  <component
    :is="currentComponent || ElSteps"
    :active="active"
    :process-status="processStatus"
    :finish-status="finishStatus"
    :align-center="alignCenter"
    :direction="direction"
    :space="space"
    :simple="simple"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ScSteps 步骤条组件
 * 封装 Element Plus Steps
 * 支持根据 data-skin 切换主题化组件样式
 */
import { computed } from "vue";
import type { PropType } from "vue";
import { ElSteps } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

defineProps({
  active: {
    type: Number,
    default: 0
  },
  processStatus: {
    type: String as PropType<"wait" | "process" | "finish" | "error" | "success">,
    default: "process"
  },
  finishStatus: {
    type: String as PropType<"wait" | "process" | "finish" | "error" | "success">,
    default: "finish"
  },
  alignCenter: {
    type: Boolean,
    default: false
  },
  direction: {
    type: String as PropType<"horizontal" | "vertical">,
    default: "horizontal"
  },
  space: {
    type: [Number, String],
    default: undefined
  },
  simple: {
    type: Boolean,
    default: false
  }
});

const { currentComponent } = useThemeComponent("ElSteps");
</script>
