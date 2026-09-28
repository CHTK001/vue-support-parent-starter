<template>
  <span
    :class="[
      're-badge-status',
      `re-badge-status--${type}`,
      { 're-badge-status--hidden': hidden, 're-badge-status--pulse': breath },
    ]"
    :style="customStyle"
  >
    <span class="re-badge-status__dot" :class="{ 're-badge-status__dot--pulse': breath }" />
    <span v-if="showValue" class="re-badge-status__label">{{ displayValue }}</span>
    <slot />
  </span>
</template>

<script setup lang="ts">
/**
 * StatusBadge —— 状态指示器徽标
 *
 * 显示彩色圆点 + 文字标签，常用于表示在线状态、服务状态等。
 */
import { computed } from "vue";
import type { CSSProperties } from "vue";

defineOptions({ name: "StatusBadge", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    value?: string | number;
    max?: number;
    isDot?: boolean;
    hidden?: boolean;
    type?: string;
    showZero?: boolean;
    color?: string;
    breath?: boolean;
  }>(),
  {
    value: "",
    max: 99,
    isDot: false,
    hidden: false,
    type: "success",
    showZero: true,
    color: "",
    breath: false,
  },
);

const showValue = computed(() => {
  if (props.value === "" || props.value === null || props.value === undefined) return false;
  if (typeof props.value === "number" && props.value === 0 && !props.showZero) return false;
  return true;
});

const displayValue = computed(() => {
  if (typeof props.value === "number" && props.max && props.value > props.max) {
    return `${props.max}+`;
  }
  return String(props.value);
});

const customStyle = computed<CSSProperties>(() => {
  if (props.color) {
    return { "--status-color": props.color };
  }
  return {};
});
</script>

<style scoped>
.re-badge-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  line-height: 1;
  white-space: nowrap;
}
.re-badge-status--hidden {
  display: none;
}

.re-badge-status__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  position: relative;
}

/* 脉冲动画 */
.re-badge-status__dot--pulse::after {
  content: "";
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.4;
  animation: status-pulse 1.5s ease-out infinite;
}
@keyframes status-pulse {
  0% { transform: scale(1); opacity: 0.4; }
  100% { transform: scale(2); opacity: 0; }
}

.re-badge-status__label {
  font-weight: 500;
}

/* 类型颜色 */
.re-badge-status--primary { --status-color: var(--el-color-primary, #409eff); }
.re-badge-status--success { --status-color: var(--el-color-success, #67c23a); }
.re-badge-status--warning { --status-color: var(--el-color-warning, #e6a23c); }
.re-badge-status--danger { --status-color: var(--el-color-danger, #f56c6c); }
.re-badge-status--info { --status-color: var(--el-color-info, #909399); }

.re-badge-status .re-badge-status__dot {
  background: var(--status-color);
  color: var(--status-color);
}
.re-badge-status .re-badge-status__label {
  color: var(--el-text-color-primary, #303133);
}
</style>
