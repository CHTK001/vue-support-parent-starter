<template>
  <span
    :class="[
      're-badge-pill',
      `re-badge-pill--${type}`,
      { 're-badge-pill--dot': isDot, 're-badge-pill--hidden': hidden },
    ]"
    :style="customStyle"
  >
    <span v-if="!isDot && showValue" class="re-badge-pill__value">{{ displayValue }}</span>
    <span v-else-if="isDot" class="re-badge-pill__dot" :class="{ 're-badge-pill__dot--breath': breath }" />
    <slot />
  </span>
</template>

<script setup lang="ts">
/**
 * PillBadge —— 药丸式徽标布局
 *
 * 以圆角药丸形态显示，支持数字/文字/纯圆点模式。
 */
import { computed } from "vue";
import type { CSSProperties } from "vue";

defineOptions({ name: "PillBadge", inheritAttrs: true });

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
    type: "danger",
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
    return { background: props.color, borderColor: props.color };
  }
  return {};
});
</script>

<style scoped>
.re-badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
  white-space: nowrap;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.re-badge-pill--hidden {
  display: none;
}

/* 类型颜色 */
.re-badge-pill--primary { background: var(--el-color-primary-light-9, #ecf5ff); color: var(--el-color-primary, #409eff); border-color: var(--el-color-primary-light-7, #a0cfff); }
.re-badge-pill--success { background: var(--el-color-success-light-9, #f0f9eb); color: var(--el-color-success, #67c23a); border-color: var(--el-color-success-light-7, #b3e19d); }
.re-badge-pill--warning { background: var(--el-color-warning-light-9, #fdf6ec); color: var(--el-color-warning, #e6a23c); border-color: var(--el-color-warning-light-7, #f3d19e); }
.re-badge-pill--danger { background: var(--el-color-danger-light-9, #fef0f0); color: var(--el-color-danger, #f56c6c); border-color: var(--el-color-danger-light-7, #fbc4c4); }
.re-badge-pill--info { background: var(--el-color-info-light-9, #f4f4f5); color: var(--el-color-info, #909399); border-color: var(--el-color-info-light-7, #d3d4d6); }

/* 圆点模式 */
.re-badge-pill--dot {
  padding: 2px 4px;
}
.re-badge-pill__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}
.re-badge-pill__dot--breath {
  animation: pill-breath 1.8s ease-out infinite;
}
@keyframes pill-breath {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}

.re-badge-pill__value {
  font-variant-numeric: tabular-nums;
}
</style>
