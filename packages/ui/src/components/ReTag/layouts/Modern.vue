<script setup lang="ts">
/**
 * ReTag Modern 布局 —— 现代化扁平标签
 *
 * 设计特点：
 *   - 纯色块背景（浅色底 + 深色字）
 *   - 大圆角胶囊型
 *   - 无边框 / 极细边框
 *   - 状态点 / 图标 / 关闭按钮
 */
import { computed } from "vue";
import "../../shared/modern-vars.css";

defineOptions({ name: "ReTagModern", inheritAttrs: true });

export interface ReTagMapItem {
  label?: string;
  type?: "primary" | "success" | "warning" | "info" | "danger" | "";
  color?: string;
  icon?: string;
}

const props = withDefaults(
  defineProps<{
    type?: "primary" | "success" | "warning" | "info" | "danger" | "";
    size?: "large" | "default" | "small";
    closable?: boolean;
    disableTransitions?: boolean;
    hit?: boolean;
    color?: string;
    effect?: "dark" | "light" | "plain";
    round?: boolean;
    value?: string | number;
    map?: Record<string, ReTagMapItem>;
    icon?: string;
    dot?: boolean;
    dotColor?: string;
  }>(),
  {
    type: "",
    size: "default",
    closable: false,
    disableTransitions: false,
    hit: false,
    color: "",
    effect: "light",
    round: false,
    value: "",
    map: () => ({}),
    icon: "",
    dot: false,
    dotColor: "",
  },
);

const mapped = computed<ReTagMapItem | null>(() => {
  if (props.value === "" || props.value == null || !props.map) return null;
  return props.map[String(props.value)] ?? null;
});

const displayType = computed(() => mapped.value?.type ?? props.type);
const displayColor = computed(() => mapped.value?.color ?? props.color);
const displayIcon = computed(() => mapped.value?.icon ?? props.icon);
const displayText = computed(() => mapped.value?.label);

const emit = defineEmits<{
  (e: "close", e2: MouseEvent): void;
  (e: "click", e2: MouseEvent): void;
}>();

function onClose(e: MouseEvent): void {
  e.stopPropagation();
  emit("close", e);
}
</script>

<template>
  <span
    :class="[
      'rm-tag',
      `rm-tag--${displayType || 'default'}`,
      `rm-tag--${size || 'default'}`,
      `rm-tag--${effect}`,
      {
        'rm-tag--round': round,
        'rm-tag--hit': hit,
        'rm-tag--closable': closable,
      },
    ]"
    :style="displayColor ? { '--rm-tag-custom': displayColor } : undefined"
    v-bind="$attrs"
    @click="(e: MouseEvent) => emit('click', e)"
  >
    <span v-if="dot" class="rm-tag__dot" :style="{ background: dotColor || undefined }" />
    <slot>{{ displayText }}</slot>
    <button v-if="closable" class="rm-tag__close" type="button" @click="onClose">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
    </button>
  </span>
</template>

<style scoped>
.rm-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 24px;
  padding: 0 10px;
  border-radius: var(--rm-radius-sm);
  font-size: var(--rm-font-sm);
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  cursor: default;
  transition:
    background var(--rm-transition),
    color var(--rm-transition),
    border-color var(--rm-transition),
    box-shadow var(--rm-transition),
    transform var(--rm-transition);
  border: 1px solid transparent;
  box-sizing: border-box;
  letter-spacing: 0.02em;
}

/* Sizes */
.rm-tag--small { height: 20px; padding: 0 8px; font-size: var(--rm-font-xs); border-radius: var(--rm-radius-xs); }
.rm-tag--large { height: 30px; padding: 0 14px; font-size: var(--rm-font-md); border-radius: var(--rm-radius); }

/* Round */
.rm-tag--round { border-radius: var(--rm-radius-full); }

/* ---- Light Effect (default) ---- */
.rm-tag--light.rm-tag--primary {
  background: var(--rm-primary-light-9);
  color: var(--rm-primary);
}
.rm-tag--light.rm-tag--success {
  background: var(--rm-success-light);
  color: var(--rm-success);
}
.rm-tag--light.rm-tag--warning {
  background: var(--rm-warning-light);
  color: var(--rm-warning);
}
.rm-tag--light.rm-tag--danger {
  background: var(--rm-danger-light);
  color: var(--rm-danger);
}
.rm-tag--light.rm-tag--info {
  background: var(--rm-info-light);
  color: var(--rm-info);
}
.rm-tag--light.rm-tag--default,
.rm-tag--light {
  background: var(--rm-bg-subtle);
  color: var(--rm-text-regular);
}

/* ---- Dark Effect (实色扁平) ---- */
.rm-tag--dark.rm-tag--primary {
  background: var(--rm-primary);
  color: var(--rm-text-white);
  box-shadow: none;
}
.rm-tag--dark.rm-tag--success {
  background: var(--rm-success);
  color: var(--rm-text-white);
  box-shadow: none;
}
.rm-tag--dark.rm-tag--warning {
  background: var(--rm-warning);
  color: var(--rm-text-white);
  box-shadow: none;
}
.rm-tag--dark.rm-tag--danger {
  background: var(--rm-danger);
  color: var(--rm-text-white);
  box-shadow: none;
}
.rm-tag--dark.rm-tag--info {
  background: var(--rm-info);
  color: var(--rm-text-white);
  box-shadow: none;
}
.rm-tag--dark.rm-tag--default,
.rm-tag--dark {
  background: var(--rm-text-regular);
  color: var(--rm-text-white);
  box-shadow: none;
}

/* ---- Plain Effect ---- */
.rm-tag--plain { background: transparent; }
.rm-tag--plain.rm-tag--primary { border-color: var(--rm-primary); color: var(--rm-primary); }
.rm-tag--plain.rm-tag--success { border-color: var(--rm-success); color: var(--rm-success); }
.rm-tag--plain.rm-tag--warning { border-color: var(--rm-warning); color: var(--rm-warning); }
.rm-tag--plain.rm-tag--danger { border-color: var(--rm-danger); color: var(--rm-danger); }
.rm-tag--plain.rm-tag--info { border-color: var(--rm-info); color: var(--rm-info); }
.rm-tag--plain.rm-tag--default,
.rm-tag--plain { border-color: var(--rm-border); color: var(--rm-text-regular); }

/* Custom color override */
.rm-tag[style*="--rm-tag-custom"] {
  background: color-mix(in srgb, var(--rm-tag-custom) 12%, transparent);
  color: var(--rm-tag-custom);
}

/* Hit */
.rm-tag--hit { border: 1px solid currentColor; }

/* Clickable hover */
.rm-tag[style*="cursor: pointer"],
.rm-tag.rm-tag--clickable:hover {
  background: color-mix(in srgb, currentColor 8%, var(--rm-bg));
}

/* Dot */
.rm-tag__dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
  box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 15%, transparent);
}

/* Close */
.rm-tag__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  color: currentColor;
  opacity: 0.6;
  border-radius: 50%;
  transition: opacity var(--rm-transition), background var(--rm-transition);
  margin-left: 2px;
}
.rm-tag__close:hover {
  opacity: 1;
  background: color-mix(in srgb, currentColor 15%, transparent);
}
.rm-tag__close svg { width: 12px; height: 12px; }

@media (prefers-reduced-motion: reduce) {
  .rm-tag,
  .rm-tag__close {
    transition: none;
  }
  .rm-tag:hover {
    transform: none;
  }
}
</style>
