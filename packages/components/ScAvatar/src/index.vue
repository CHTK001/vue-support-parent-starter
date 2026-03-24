<template>
  <component :is="currentComponent || ElAvatar" :size="size" :shape="shape" :icon="icon" :src="src" :alt="alt" :src-set="srcSet" :fit="fit" @error="handleError">
    <template v-if="$slots.default" #default>
      <slot />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ScAvatar 头像组件
 * 封装 Element Plus Avatar 与 PixelUI PxAvatar
 * 在 data-skin 为 8bit 时自动切换为像素风头像
 */
import { computed } from "vue";
import type { PropType } from "vue";
import { ElAvatar } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

defineProps({
  size: {
    type: [Number, String] as PropType<number | "large" | "default" | "small">,
    default: "default"
  },
  shape: {
    type: String as PropType<"circle" | "square">,
    default: "circle"
  },
  icon: {
    type: [String, Object],
    default: ""
  },
  src: {
    type: String,
    default: ""
  },
  alt: {
    type: String,
    default: ""
  },
  srcSet: {
    type: String,
    default: ""
  },
  fit: {
    type: String as PropType<"fill" | "contain" | "cover" | "none" | "scale-down">,
    default: "cover"
  }
});

const emit = defineEmits(["error"]);

const { currentComponent } = useThemeComponent("ElAvatar");



const handleError = (event: Event) => {
  emit("error", event);
  return true;
};
</script>
