<script setup lang="ts">
/**
 * ReBadge Modern 布局 —— 现代化扁平徽标
 *
 * 设计特点：
 *   - 扁平圆角徽标
 *   - 柔和配色
 *   - 现代尺寸
 */
import { computed } from "vue";
import "../../shared/modern-vars.css";

defineOptions({ name: "ReBadgeModern", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    value?: string | number;
    max?: number;
    isDot?: boolean;
    hidden?: boolean;
    type?: "primary" | "success" | "warning" | "info" | "danger";
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

const displayValue = computed<string>(() => {
  if (props.isDot) return "";
  if (props.value === "" || props.value == null) return "";
  if (typeof props.value === "number" && props.value > props.max) return `${props.max}+`;
  return String(props.value);
});

const shouldShow = computed(() => {
  if (props.hidden) return false;
  if (props.isDot) return true;
  if (props.value === 0 && !props.showZero) return false;
  return displayValue.value !== "";
});
</script>

<template>
  <div class="rm-badge" v-bind="$attrs">
    <slot />
    <sup
      v-if="shouldShow"
      :class="[
        'rm-badge__content',
        `rm-badge__content--${type}`,
        {
          'rm-badge__content--dot': isDot,
          'rm-badge__content--breath': breath && isDot,
        },
      ]"
      :style="color ? { background: color } : undefined"
    >
      {{ displayValue }}
    </sup>
  </div>
</template>

<style scoped>
.rm-badge {
  position: relative;
  display: inline-flex;
  vertical-align: middle;
}

.rm-badge__content {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1;
  transform: translate(50%, -50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: var(--rm-radius-full);
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  color: var(--rm-text-white);
  box-sizing: border-box;
}

.rm-badge__content--dot {
  min-width: 8px;
  width: 8px;
  height: 8px;
  padding: 0;
  border-radius: 50%;
}

.rm-badge__content--primary { background: var(--rm-primary); }
.rm-badge__content--success { background: var(--rm-success); }
.rm-badge__content--warning { background: var(--rm-warning); }
.rm-badge__content--danger { background: var(--rm-danger); }
.rm-badge__content--info { background: var(--rm-info); }

.rm-badge__content--breath {
  animation: rm-badge-pulse 1.8s ease-out infinite;
}

@keyframes rm-badge-pulse {
  0% { box-shadow: 0 0 0 0 currentColor; opacity: 0.9; }
  70% { box-shadow: 0 0 0 6px transparent; opacity: 0.4; }
  100% { box-shadow: 0 0 0 0 transparent; opacity: 0.9; }
}
</style>
