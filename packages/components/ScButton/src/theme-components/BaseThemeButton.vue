<template>
  <component
    :is="ElButton"
    :size="size"
    :type="type"
    :theme="type"
    :plain="plain"
    :text="text"
    :bg="bg"
    :link="link"
    :round="round"
    :shape="circle ? 'circle' : 'rect'"
    :circle="circle"
    :loading="loading"
    :loading-icon="loadingIcon"
    :disabled="disabled"
    :icon="icon"
    :autofocus="autofocus"
    :native-type="nativeType"
    :auto-insert-space="autoInsertSpace"
    :color="color"
    :dark="dark"
    :tag="tag"
    class="sc-themed-button"
    :class="[
      `sc-themed-button--${themeKey}`,
      type && `sc-themed-button--type-${type}`,
      {
        'sc-themed-button--textual': text || link,
        'sc-themed-button--plain': plain,
      },
    ]"
    @click="handleClick"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
    <template v-if="$slots.loading" #loading>
      <slot name="loading" />
    </template>
    <template v-if="$slots.icon" #icon>
      <slot name="icon" />
    </template>
  </component>
</template>

<script setup lang="ts">
import { ElButton } from "element-plus";
import { scButtonProps } from "../buttonProps";

const props = defineProps({
  ...scButtonProps,
  themeKey: {
    type: String,
    required: true,
  },
});

const emit = defineEmits<{
  (e: "click", event: MouseEvent): void;
}>();

const handleClick = (event: MouseEvent) => {
  emit("click", event);
};
</script>

<style scoped lang="scss">
.sc-themed-button {
  --sc-button-bg: var(--sc-theme-button-bg, linear-gradient(135deg, #ffffff, #f3f4f6));
  --sc-button-bg-hover: var(--sc-theme-button-bg-hover, linear-gradient(135deg, #f8fafc, #e5e7eb));
  --sc-button-bg-active: var(--sc-theme-button-bg-active, linear-gradient(135deg, #e5e7eb, #d1d5db));
  --sc-button-text: var(--sc-theme-button-text, var(--el-text-color-primary, #1f2937));
  --sc-button-text-strong: var(--sc-theme-button-text-strong, var(--sc-button-text));
  --sc-button-border: var(--sc-theme-button-border, rgba(15, 23, 42, 0.12));
  --sc-button-shadow: var(--sc-theme-button-shadow, 0 10px 24px -18px rgba(15, 23, 42, 0.35));
  --sc-button-shadow-hover: var(--sc-theme-button-shadow-hover, 0 14px 30px -20px rgba(15, 23, 42, 0.45));
  --sc-button-glow: var(--sc-theme-button-glow, rgba(255, 255, 255, 0.2));
  --sc-button-radius: var(--sc-theme-button-radius, 14px);
  --sc-button-font: var(--sc-theme-font-accent, inherit);

  position: relative;
  overflow: hidden;
  border-radius: var(--sc-button-radius) !important;
  border-color: var(--sc-button-border) !important;
  color: var(--sc-button-text) !important;
  background: var(--sc-button-bg) !important;
  box-shadow: var(--sc-button-shadow) !important;
  font-family: var(--sc-button-font);
  font-weight: 700;
  letter-spacing: 0.02em;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;

  &::before {
    content: "";
    position: absolute;
    inset: 1px;
    border-radius: inherit;
    background: linear-gradient(135deg, var(--sc-button-glow), transparent 55%);
    opacity: 0.8;
    pointer-events: none;
  }

  &:hover:not(.is-disabled):not(.sc-themed-button--textual) {
    transform: translateY(-1px);
    background: var(--sc-button-bg-hover) !important;
    box-shadow: var(--sc-button-shadow-hover) !important;
    color: var(--sc-button-text-strong) !important;
  }

  &:active:not(.is-disabled):not(.sc-themed-button--textual) {
    transform: translateY(0);
    background: var(--sc-button-bg-active) !important;
  }

  &.is-disabled {
    opacity: 0.58;
    box-shadow: none !important;
  }

  &.sc-themed-button--plain,
  &.sc-themed-button--textual {
    background: transparent !important;
    box-shadow: none !important;
    border-color: color-mix(in srgb, var(--sc-button-border) 78%, transparent) !important;

    &::before {
      opacity: 0.4;
    }
  }

  &.sc-themed-button--textual:hover:not(.is-disabled) {
    background: color-mix(in srgb, var(--sc-button-text) 12%, transparent) !important;
  }

  &.sc-themed-button--8bit {
    --sc-button-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    image-rendering: pixelated;

    &::before {
      display: none;
    }
  }

  &.sc-themed-button--spring-festival {
    --sc-button-radius: 18px;
  }

  &.sc-themed-button--future-tech {
    --sc-button-radius: 12px;
    letter-spacing: 0.08em;
  }
}
</style>
