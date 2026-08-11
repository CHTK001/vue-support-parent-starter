<script setup lang="ts">
/**
 * ReSwitch Modern 布局 —— 现代化扁平开关
 *
 * 设计要点：
 *   - 极致扁平胶囊轨道（active 渐变 + 内白色高光 + 主色发光）
 *   - 圆形滑块（白底 + 阴影 + 弹性位移）
 *   - 焦点环（focus-visible 4px 主色 ring）
 *   - 标题 + 副标题 + 描述 三层排版
 *   - 禁用态灰度
 */
import { computed } from "vue";
import "../../shared/modern-vars.css";

defineOptions({ name: "ReSwitchModern", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    title?: string;
    sub?: string;
    tip?: string;
    description?: string;
    disabled?: boolean;
  }>(),
  {
    title: "",
    sub: "",
    tip: "",
    description: "",
    disabled: false,
  },
);

const modelValue = defineModel<boolean | string | number>({ default: false });

const isActive = computed(() => Boolean(modelValue.value));

function toggle(): void {
  if (props.disabled) return;
  modelValue.value = !modelValue.value;
}
</script>

<template>
  <div
    :class="['rm-switch', { 'rm-switch--active': isActive, 'rm-switch--disabled': disabled }]"
    v-bind="$attrs"
  >
    <div v-if="title || sub || description" class="rm-switch__info" @click="toggle">
      <span class="rm-switch__title">{{ title }}</span>
      <span v-if="sub" class="rm-switch__sub">{{ sub }}</span>
      <span v-if="description" class="rm-switch__desc">{{ description }}</span>
    </div>
    <button
      type="button"
      class="rm-switch__track"
      :disabled="disabled"
      :aria-pressed="isActive"
      @click="toggle"
    >
      <span class="rm-switch__thumb" />
    </button>
  </div>
</template>

<style scoped>
.rm-switch {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  user-select: none;
  font-family: inherit;
}
.rm-switch--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.rm-switch__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.rm-switch__title {
  font-size: var(--rm-font-md);
  font-weight: 600;
  color: var(--rm-text);
  line-height: 1.4;
  letter-spacing: 0.01em;
  transition: color var(--rm-transition);
}
.rm-switch--active .rm-switch__title { color: var(--rm-primary); }
.rm-switch__sub {
  font-size: var(--rm-font-sm);
  font-weight: 500;
  color: var(--rm-text-regular);
}
.rm-switch__desc {
  font-size: var(--rm-font-sm);
  color: var(--rm-text-secondary);
  line-height: 1.4;
}

/* Track */
.rm-switch__track {
  position: relative;
  flex-shrink: 0;
  width: 44px;
  height: 24px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--rm-radius-full);
  background: var(--rm-border);
  cursor: pointer;
  transition:
    background var(--rm-transition-slow),
    box-shadow var(--rm-transition-slow),
    border-color var(--rm-transition);
  outline: none;
}
.rm-switch__track:hover:not(:disabled) {
  background: color-mix(in srgb, var(--rm-border) 70%, var(--rm-text-secondary));
}
.rm-switch__track:focus-visible {
  box-shadow:
    0 0 0 4px color-mix(in srgb, var(--rm-primary) 22%, transparent);
}

.rm-switch--active .rm-switch__track {
  background: linear-gradient(135deg, var(--rm-primary) 0%, var(--rm-primary-hover) 100%);
  border-color: transparent;
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--rm-text-white) 25%, transparent),
    0 4px 12px color-mix(in srgb, var(--rm-primary) 35%, transparent);
}
.rm-switch--active .rm-switch__track:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--rm-primary-hover) 0%, var(--rm-primary) 100%);
}

/* Thumb */
.rm-switch__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  box-shadow:
    0 1px 3px rgba(15, 23, 42, 0.2),
    0 1px 2px rgba(15, 23, 42, 0.08);
  transition: transform var(--rm-transition-slow);
}
.rm-switch--active .rm-switch__thumb {
  transform: translateX(20px);
  box-shadow:
    0 2px 6px rgba(15, 23, 42, 0.18),
    0 1px 3px rgba(15, 23, 42, 0.08);
}

@media (prefers-reduced-motion: reduce) {
  .rm-switch__track,
  .rm-switch__thumb,
  .rm-switch__title {
    transition: none;
  }
}
</style>