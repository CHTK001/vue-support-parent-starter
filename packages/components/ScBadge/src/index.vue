<template>
  <component :is="currentComponent || ElBadge" :value="value" :max="max" :is-dot="isDot" :hidden="hidden" :type="type" :show-zero="showZero" :color="color" :offset="offset">
    <template v-if="$slots.default" #default>
      <slot />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ScBadge 徽章组件
 * 封装 Element Plus Badge 与 PixelUI PxBadge
 * 在 data-skin 为 8bit 时自动切换为像素风徽章
 */
import { computed } from "vue";
import type { PropType } from "vue";
import { ElBadge } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

defineProps({
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
    type: Array as PropType<[number, number]>,
    default: undefined
  }
});

const { currentComponent } = useThemeComponent("ElBadge");


</script>
