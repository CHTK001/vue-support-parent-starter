<template>
  <component
    :is="currentComponent || ElAlert"
    :title="title"
    :type="type"
    :description="description"
    :closable="closable"
    :center="center"
    :close-text="closeText"
    :show-icon="showIcon"
    :effect="effect"
    @close="handleClose"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
    <template v-if="$slots.title" #title>
      <slot name="title" />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ScAlert 警告组件
 * 封装 Element Plus Alert
 * 支持根据 data-skin 切换主题化组件样式
 */
import { computed } from "vue";
import type { PropType } from "vue";
import { ElAlert } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

defineProps({
  title: {
    type: String,
    default: ""
  },
  type: {
    type: String as PropType<"success" | "warning" | "info" | "error">,
    default: "info"
  },
  description: {
    type: String,
    default: ""
  },
  closable: {
    type: Boolean,
    default: true
  },
  center: {
    type: Boolean,
    default: false
  },
  closeText: {
    type: String,
    default: ""
  },
  showIcon: {
    type: Boolean,
    default: false
  },
  effect: {
    type: String as PropType<"light" | "dark">,
    default: "light"
  }
});

const emit = defineEmits(["close"]);

const { currentComponent } = useThemeComponent("ElAlert");

const handleClose = () => {
  emit("close");
};
</script>
