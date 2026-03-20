<template>
  <ScBadge v-if="showBadge" :value="badgeValue" :type="badgeType" :is-dot="isDot" class="menu-new-badge">
    <slot />
  </ScBadge>
  <slot v-else />
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  /** 是否显示徽章 */
  show?: boolean;
  /** 徽章值 */
  value?: string | number;
  /** 徽章类型 */
  type?: "primary" | "success" | "warning" | "danger" | "info";
  /** 是否显示小圆点 */
  dot?: boolean;
  /** 是否为新菜单项 */
  isNew?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  value: "",
  type: "danger",
  dot: false,
  isNew: false
});

const showBadge = computed(() => {
  return props.show || props.isNew || !!props.value;
});

const badgeValue = computed(() => {
  if (props.isNew) return "NEW";
  return props.value;
});

const badgeType = computed(() => {
  if (props.isNew) return "danger";
  return props.type;
});

const isDot = computed(() => {
  return props.dot && !props.value && !props.isNew;
});
</script>

<style lang="scss" scoped>
.menu-new-badge {
  :deep(.el-badge__content) {
    font-size: 10px;
    height: 16px;
    line-height: 16px;
    padding: 0 4px;
  }
}
</style>
