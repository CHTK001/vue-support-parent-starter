<template>
  <component :is="currentComponent || ElLink" :type="type" :underline="underline" :disabled="disabled" :href="href" :icon="icon" :target="target" @click="handleClick">
    <template v-if="$slots.default" #default>
      <slot />
    </template>
    <template v-if="$slots.icon" #icon>
      <slot name="icon" />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ScLink 链接组件
 * 封装 Element Plus Link 与 PixelUI PxLink
 * 在 data-skin 为 8bit 时自动切换为像素风链接
 */
import { computed } from "vue";
import type { PropType } from "vue";
import { ElLink } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

defineProps({
  type: {
    type: String as PropType<"primary" | "success" | "warning" | "danger" | "info" | "default">,
    default: "default"
  },
  underline: {
    type: Boolean,
    default: true
  },
  disabled: {
    type: Boolean,
    default: false
  },
  href: {
    type: String,
    default: ""
  },
  icon: {
    type: [String, Object],
    default: ""
  },
  target: {
    type: String as PropType<"_blank" | "_parent" | "_self" | "_top">,
    default: "_self"
  }
});

const emit = defineEmits(["click"]);

const { currentComponent } = useThemeComponent("ElLink");



const handleClick = (event: MouseEvent) => {
  emit("click", event);
};
</script>
