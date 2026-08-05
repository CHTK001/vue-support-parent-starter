<script setup lang="ts">
/**
 * ReSwitch Modern 布局 —— 现代化扁平开关
 *
 * 设计特点：
 *   - 扁平圆形滑块
 *   - 柔和背景色过渡
 *   - 可选标题
 */
import "../../shared/modern-vars.css";

defineOptions({ name: "ModernReSwitch", inheritAttrs: true });

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

function toggle(): void {
  if (props.disabled) return;
  modelValue.value = !modelValue.value;
}

const isActive = () => Boolean(modelValue.value);
</script>

<template>
  <div
    :class="['rm-switch', { 'rm-switch--active': isActive(), 'rm-switch--disabled': disabled }]"
    v-bind="$attrs"
  >
    <div v-if="title" class="rm-switch__info" @click="toggle">
      <span class="rm-switch__title">{{ title }}</span>
      <span v-if="sub" class="rm-switch__sub">{{ sub }}</span>
      <span v-if="description" class="rm-switch__desc">{{ description }}</span>
    </div>
    <button class="rm-switch__track" type="button" :disabled="disabled" @click="toggle">
      <span class="rm-switch__thumb" />
    </button>
  </div>
</template>

<style scoped>
.rm-switch {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}
.rm-switch--disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }

.rm-switch__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.rm-switch__title {
  font-size: var(--rm-font-md);
  font-weight: 500;
  color: var(--rm-text);
  line-height: 1.4;
}
.rm-switch__sub {
  font-size: var(--rm-font-sm);
  font-weight: 500;
  color: var(--rm-text-regular);
}
.rm-switch__desc {
  font-size: var(--rm-font-sm);
  color: var(--rm-text-secondary);
  line-height: 1.3;
}

/* Track */
.rm-switch__track {
  position: relative;
  width: 44px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: var(--rm-radius-full);
  background: var(--rm-border);
  cursor: pointer;
  transition: background var(--rm-transition);
  flex-shrink: 0;
}
.rm-switch--active .rm-switch__track { background: var(--rm-primary); }

/* Thumb */
.rm-switch__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: transform var(--rm-transition);
}
.rm-switch--active .rm-switch__thumb { transform: translateX(20px); }
</style>
