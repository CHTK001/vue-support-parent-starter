<template>
  <component
    :is="currentComponent || ElTag"
    :type="normalizedType"
    :theme="normalizedType"
    :closable="closable"
    :disable-transitions="disableTransitions"
    :hit="hit"
    :color="color"
    :size="normalizedSize"
    :effect="effect"
    :round="round"
    @close="handleClose"
    @click="handleClick"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ScTag 标签组件
 * 封装 Element Plus Tag
 * 支持根据 data-skin 切换主题化组件样式
 */
import { computed } from "vue";
import type { PropType } from "vue";
import { ElTag } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

const props = defineProps({
  type: {
    type: String as PropType<
      "" | "primary" | "success" | "info" | "warning" | "danger"
    >,
    default: ""
  },
  closable: {
    type: Boolean,
    default: false
  },
  disableTransitions: {
    type: Boolean,
    default: false
  },
  hit: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: ""
  },
  size: {
    type: String as PropType<"" | "large" | "default" | "small">,
    default: ""
  },
  effect: {
    type: String as PropType<"dark" | "light" | "plain">,
    default: "light"
  },
  round: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["close", "click"]);

const { currentComponent } = useThemeComponent("ElTag");
const normalizedType = computed(() => props.type || undefined);
const normalizedSize = computed(() => props.size || undefined);

const handleClose = (event: MouseEvent) => {
  emit("close", event);
};

const handleClick = (event: MouseEvent) => {
  emit("click", event);
};
</script>
