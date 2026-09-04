<script setup lang="ts">
/**
 * ReProgress —— 单个进度条（纯展示，支持自定义颜色 / 状态）
 *
 * 设计要点：
 *   - 玻璃质感 + 渐变填充
 *   - 实时平滑动画（cubic-bezier 250ms）
 *   - 流光效果（实时模式 stripe 动画）
 *   - 状态色彩：primary / success / warning / danger / info
 *   - 失败抖动震动
 */
import { computed } from "vue";
import "../shared/modern-vars.css";
import type { ReProgressColor, ReProgressStatus } from "./types";

defineOptions({ name: "ReProgress", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    /** 进度 0~1 */
    progress?: number;
    /** 颜色预设 */
    color?: ReProgressColor;
    /** 状态 */
    status?: ReProgressStatus;
    /** 是否显示文字 */
    showText?: boolean;
    /** 高度 px */
    height?: number;
    /** 是否启用流光（实时模式） */
    stripe?: boolean;
  }>(),
  {
    progress: 0,
    color: "primary",
    status: "running",
    showText: false,
    height: 6,
    stripe: true,
  },
);

const percent = computed(() => Math.round(Math.max(0, Math.min(1, props.progress)) * 100));

const fillClass = computed(() => ({
  "re-progress__fill--primary": props.color === "primary",
  "re-progress__fill--success": props.color === "success",
  "re-progress__fill--warning": props.color === "warning",
  "re-progress__fill--danger": props.color === "danger",
  "re-progress__fill--info": props.color === "info",
  "re-progress__fill--pending": props.status === "pending",
  "re-progress__fill--indeterminate": props.status === "running" && props.progress === 0,
  "re-progress__fill--shaking": props.status === "failed",
}));
</script>

<template>
  <div
    :class="['re-progress', `re-progress--${status}`]"
    :style="{ height: height + 'px' }"
    role="progressbar"
    :aria-valuenow="percent"
    aria-valuemin="0"
    aria-valuemax="100"
    v-bind="$attrs"
  >
    <div
      :class="['re-progress__fill', fillClass, { 're-progress__fill--stripe': stripe && status === 'running' }]"
      :style="{ width: `${Math.max(0, Math.min(100, percent))}%` }"
    />
  </div>
</template>

<style scoped>
.re-progress {
  position: relative;
  width: 100%;
  background: var(--rm-bg-subtle);
  border-radius: var(--rm-radius-full);
  overflow: hidden;
  box-shadow: inset 0 1px 0 rgba(15, 23, 42, 0.04);
}

.re-progress__fill {
  position: relative;
  height: 100%;
  border-radius: var(--rm-radius-full);
  transition: width 250ms var(--rm-ease), background 250ms var(--rm-ease);
  overflow: hidden;
}

/* Colors */
.re-progress__fill--primary { background: var(--rm-primary); }
.re-progress__fill--success { background: var(--rm-success); }
.re-progress__fill--warning { background: var(--rm-warning); }
.re-progress__fill--danger { background: var(--rm-danger); }
.re-progress__fill--info { background: var(--rm-info); }
.re-progress__fill--pending { background: var(--rm-border); }

/* Stripe 流光 */
.re-progress__fill--stripe::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 40%;
  background: color-mix(in srgb, var(--rm-text-white) 30%, transparent);
  border-radius: inherit;
  animation: re-progress-stripe 1.6s var(--rm-ease) infinite;
}

@keyframes re-progress-stripe {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(260%); }
}

/* Indeterminate 未确定进度 */
.re-progress__fill--indeterminate {
  width: 35% !important;
  animation: re-progress-indeterminate 1.4s var(--rm-ease) infinite;
}

@keyframes re-progress-indeterminate {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(285%); }
}

/* 失败抖动 */
.re-progress--failed {
  animation: re-progress-shake 0.4s var(--rm-ease);
}
@keyframes re-progress-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-3px); }
  40% { transform: translateX(3px); }
  60% { transform: translateX(-2px); }
  80% { transform: translateX(2px); }
}

@media (prefers-reduced-motion: reduce) {
  .re-progress__fill,
  .re-progress__fill--stripe::after,
  .re-progress__fill--indeterminate,
  .re-progress--failed {
    animation: none;
  }
}
</style>