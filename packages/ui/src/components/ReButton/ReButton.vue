<script setup lang="ts">
/**
 * ReButton —— 按钮组件
 *
 * 透传 el-button 全部 props / emits / slots。
 * 增加 loading 状态自动绑定。
 */
import { useSlots } from "vue";
import { ElButton } from "element-plus";

defineOptions({ name: "ReButton", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    type?: "primary" | "success" | "warning" | "info" | "danger" | "text" | "";
    size?: "large" | "default" | "small";
    plain?: boolean;
    round?: boolean;
    circle?: boolean;
    loading?: boolean;
    disabled?: boolean;
    icon?: string;
    link?: boolean;
    text?: boolean;
    bg?: boolean;
    nativeType?: "button" | "submit" | "reset";
  }>(),
  {
    type: "",
    size: "",
    plain: false,
    round: false,
    circle: false,
    loading: false,
    disabled: false,
    icon: "",
    link: false,
    text: false,
    bg: false,
    nativeType: "button",
  },
);

defineEmits<{
  (e: "click", evt: MouseEvent): void;
}>();

useSlots();
</script>

<template>
  <ElButton
    v-bind="props"
    :native-type="nativeType"
    @click="(e: MouseEvent) => $emit('click', e)"
  >
    <slot />
  </ElButton>
</template>
