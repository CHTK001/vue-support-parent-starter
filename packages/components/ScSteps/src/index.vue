<template>
  <component :is="currentComponent || ElSteps" :active="active" :process-status="processStatus" :finish-status="finishStatus" :align-center="alignCenter" :direction="direction" :space="space" :simple="simple">
    <template v-if="$slots.default" #default>
      <slot />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ScSteps 步骤条组件
 * 封装 Element Plus Steps 与 PixelUI PxSteps
 * 在 data-skin 为 8bit 时自动切换为像素风步骤条
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
