<script setup lang="ts">
/**
 * ReButton Modern 布局 —— 现代化扁平按钮
 *
 * 设计特点：
 *   - 无边框阴影，纯色块 + 细边框
 *   - 大圆角（8px）
 *   - 平滑 hover/active 过渡
 *   - 支持 loading 旋转动画
 */
import "../../shared/modern-vars.css";

defineOptions({ name: "ReButtonModern", inheritAttrs: true });

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
    size: "default",
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

const emit = defineEmits<{
  (e: "click", evt: MouseEvent): void;
}>();

function onClick(e: MouseEvent): void {
  if (props.disabled || props.loading) return;
  emit("click", e);
}
</script>

<template>
  <button
    :type="(nativeType as any)"
    :disabled="disabled || loading"
    :class="[
      'rm-btn',
      `rm-btn--${type || 'default'}`,
      `rm-btn--${size || 'default'}`,
      {
        'rm-btn--plain': plain,
        'rm-btn--round': round,
        'rm-btn--circle': circle,
        'rm-btn--link': link,
        'rm-btn--text': text,
        'rm-btn--bg': bg,
        'is-loading': loading,
        'is-disabled': disabled,
      },
    ]"
    v-bind="$attrs"
    @click="onClick"
  >
    <span v-if="loading" class="rm-btn__spinner">
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="30 70" stroke-linecap="round" />
      </svg>
    </span>
    <span class="rm-btn__content">
      <slot />
    </span>
  </button>
</template>

<style scoped>
.rm-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: var(--rm-height);
  padding: var(--rm-padding);
  border: 1px solid var(--rm-border);
  border-radius: var(--rm-radius);
  background: var(--rm-bg);
  color: var(--rm-text-regular);
  font-size: var(--rm-font-md);
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  outline: none;
  transition:
    color var(--rm-transition),
    background var(--rm-transition),
    border-color var(--rm-transition),
    opacity var(--rm-transition);
  font-family: inherit;
}

/* ---- Sizes ---- */
.rm-btn--small {
  height: var(--rm-height-sm);
  padding: var(--rm-padding-sm);
  font-size: var(--rm-font-sm);
  border-radius: var(--rm-radius-sm);
}
.rm-btn--large {
  height: var(--rm-height-lg);
  padding: var(--rm-padding-lg);
  font-size: var(--rm-font-lg);
  border-radius: var(--rm-radius-md);
}

/* ---- Type Colors ---- */
.rm-btn--primary {
  background: var(--rm-primary);
  border-color: var(--rm-primary);
  color: var(--rm-text-white);
}
.rm-btn--primary:hover { background: var(--rm-primary-hover); border-color: var(--rm-primary-hover); }
.rm-btn--primary:active { background: var(--rm-primary-active); border-color: var(--rm-primary-active); }

.rm-btn--success { background: var(--rm-success); border-color: var(--rm-success); color: var(--rm-text-white); }
.rm-btn--success:hover { opacity: 0.85; }
.rm-btn--success:active { opacity: 0.75; }

.rm-btn--warning { background: var(--rm-warning); border-color: var(--rm-warning); color: var(--rm-text-white); }
.rm-btn--warning:hover { opacity: 0.85; }
.rm-btn--warning:active { opacity: 0.75; }

.rm-btn--danger { background: var(--rm-danger); border-color: var(--rm-danger); color: var(--rm-text-white); }
.rm-btn--danger:hover { opacity: 0.85; }
.rm-btn--danger:active { opacity: 0.75; }

.rm-btn--info { background: var(--rm-info); border-color: var(--rm-info); color: var(--rm-text-white); }
.rm-btn--info:hover { opacity: 0.85; }
.rm-btn--info:active { opacity: 0.75; }

.rm-btn--default:hover { color: var(--rm-primary); border-color: var(--rm-primary-hover); background: var(--rm-primary-light-9); }
.rm-btn--default:active { color: var(--rm-primary-active); }

/* ---- Plain ---- */
.rm-btn--plain.rm-btn--primary {
  background: var(--rm-primary-light-9);
  border-color: var(--rm-primary-light-8, var(--rm-primary-light-9));
  color: var(--rm-primary);
}
.rm-btn--plain.rm-btn--primary:hover { background: var(--rm-primary); color: var(--rm-text-white); }
.rm-btn--plain.rm-btn--success { background: var(--rm-success-light); color: var(--rm-success); }
.rm-btn--plain.rm-btn--success:hover { background: var(--rm-success); color: var(--rm-text-white); }
.rm-btn--plain.rm-btn--warning { background: var(--rm-warning-light); color: var(--rm-warning); }
.rm-btn--plain.rm-btn--warning:hover { background: var(--rm-warning); color: var(--rm-text-white); }
.rm-btn--plain.rm-btn--danger { background: var(--rm-danger-light); color: var(--rm-danger); }
.rm-btn--plain.rm-btn--danger:hover { background: var(--rm-danger); color: var(--rm-text-white); }
.rm-btn--plain.rm-btn--info { background: var(--rm-info-light); color: var(--rm-info); }
.rm-btn--plain.rm-btn--info:hover { background: var(--rm-info); color: var(--rm-text-white); }

/* ---- Link / Text ---- */
.rm-btn--link,
.rm-btn--text {
  border: none;
  background: transparent;
  padding: 0;
  height: auto;
}
.rm-btn--link { color: var(--rm-primary); }
.rm-btn--link:hover { color: var(--rm-primary-hover); }
.rm-btn--link:active { color: var(--rm-primary-active); }
.rm-btn--text:hover { color: var(--rm-primary); }

/* ---- Round / Circle ---- */
.rm-btn--round { border-radius: var(--rm-radius-full); }
.rm-btn--circle {
  border-radius: 50%;
  width: var(--rm-height);
  padding: 0;
}
.rm-btn--circle.rm-btn--small { width: var(--rm-height-sm); }
.rm-btn--circle.rm-btn--large { width: var(--rm-height-lg); }

/* ---- Bg ---- */
.rm-btn--bg.rm-btn--default { background: var(--rm-bg-subtle); }

/* ---- Disabled ---- */
.rm-btn.is-disabled,
.rm-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  pointer-events: none;
}

/* ---- Loading ---- */
.rm-btn.is-loading { cursor: wait; opacity: 0.8; }
.rm-btn__spinner {
  display: inline-flex;
  animation: rm-spin 0.8s linear infinite;
}
.rm-btn__spinner svg { width: 16px; height: 16px; }
.rm-btn--small .rm-btn__spinner svg { width: 14px; height: 14px; }
.rm-btn--large .rm-btn__spinner svg { width: 18px; height: 18px; }

@keyframes rm-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.rm-btn__content {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
