<script setup lang="ts">
/**
 * ReBadge Modern 布局 —— 现代化扁平徽标
 *
 * 设计要点：
 *   - 极致扁平、圆角胶囊
 *   - 渐变 + 内白色高光 + 主色发光阴影
 *   - dot 模式带呼吸光晕
 *   - 数字等宽（tabular-nums）
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
      :style="color ? { '--rm-badge-custom-bg': color } : undefined"
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
  --rm-badge-bg: var(--rm-primary);
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
  border: 2px solid var(--rm-bg);
  border-radius: var(--rm-radius-full);
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
  white-space: nowrap;
  color: var(--rm-text-white);
  background: var(--rm-badge-bg);
  box-sizing: border-box;
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--rm-text-white) 22%, transparent),
    0 2px 6px color-mix(in srgb, var(--rm-badge-bg) 35%, transparent);
  transition: box-shadow var(--rm-transition);
}

.rm-badge__content--dot {
  min-width: 10px;
  width: 10px;
  height: 10px;
  padding: 0;
  border-width: 2px;
}

.rm-badge__content--primary { --rm-badge-bg: var(--rm-primary); }
.rm-badge__content--success { --rm-badge-bg: var(--rm-success); }
.rm-badge__content--warning { --rm-badge-bg: var(--rm-warning); }
.rm-badge__content--danger { --rm-badge-bg: var(--rm-danger); }
.rm-badge__content--info { --rm-badge-bg: var(--rm-info); }
.rm-badge__content[style*="--rm-badge-custom-bg"] {
  --rm-badge-bg: var(--rm-badge-custom-bg);
}

.rm-badge__content--breath {
  animation: rm-badge-pulse 1.8s var(--rm-ease) infinite;
}

@keyframes rm-badge-pulse {
  0% {
    box-shadow:
      inset 0 1px 0 color-mix(in srgb, var(--rm-text-white) 22%, transparent),
      0 0 0 0 color-mix(in srgb, var(--rm-badge-bg) 60%, transparent),
      0 2px 6px color-mix(in srgb, var(--rm-badge-bg) 35%, transparent);
    opacity: 0.95;
  }
  70% {
    box-shadow:
      inset 0 1px 0 color-mix(in srgb, var(--rm-text-white) 22%, transparent),
      0 0 0 8px transparent,
      0 2px 6px color-mix(in srgb, var(--rm-badge-bg) 35%, transparent);
    opacity: 0.7;
  }
  100% {
    box-shadow:
      inset 0 1px 0 color-mix(in srgb, var(--rm-text-white) 22%, transparent),
      0 0 0 0 transparent,
      0 2px 6px color-mix(in srgb, var(--rm-badge-bg) 35%, transparent);
    opacity: 0.95;
  }
}

@media (prefers-reduced-motion: reduce) {
  .rm-badge__content,
  .rm-badge__content--breath {
    transition: none;
    animation: none;
  }
}
</style>