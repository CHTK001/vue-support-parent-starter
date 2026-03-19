<template>
  <component
    :is="renderComponent"
    v-bind="componentProps"
    class="sc-themed-card"
    :class="[
      `sc-themed-card--${themeKey}`,
      `sc-themed-card--layout-${layout}`,
      `sc-themed-card--render-${renderAs}`,
      hoverable && 'sc-themed-card--hoverable',
    ]"
    @click="handleClick"
  >
    <template v-for="(_, name) in $slots" #[name]="slotData">
      <slot :name="name" v-bind="slotData || {}" />
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElCard } from "element-plus";
import DefaultLayout from "../layouts/Default.vue";
import MediaLayout from "../layouts/Media.vue";
import HeaderContentLayout from "../layouts/HeaderContent.vue";
import Panel3D from "../layouts/Panel3D.vue";
import CompactLayout from "../layouts/Compact.vue";
import StatsLayout from "../layouts/Stats.vue";
import StatsSimpleLayout from "../layouts/StatsSimple.vue";
import TechLayout from "../layouts/Tech.vue";
import { useCardProps } from "../composables/useCardProps";
import { scCardProps } from "../cardProps";

const props = defineProps({
  ...scCardProps,
  themeKey: {
    type: String,
    required: true,
  },
});

const emit = defineEmits<{
  (e: "click", event: MouseEvent): void;
}>();

const renderComponent = computed(() => {
  if (props.renderAs === "el-card") {
    return ElCard;
  }

  switch (props.layout) {
    case "media":
      return MediaLayout;
    case "header-content":
      return HeaderContentLayout;
    case "panel-3d":
      return Panel3D;
    case "compact":
      return CompactLayout;
    case "stats":
      return StatsLayout;
    case "stats-simple":
      return StatsSimpleLayout;
    case "tech":
      return TechLayout;
    case "custom":
      return props.customComponent || DefaultLayout;
    default:
      return DefaultLayout;
  }
});

const componentProps = useCardProps(props as any);

const handleClick = (event: MouseEvent) => {
  emit("click", event);
};
</script>

<style scoped lang="scss">
.sc-themed-card {
  --sc-card-surface: var(--sc-theme-card-surface, var(--sc-theme-surface, rgba(255, 255, 255, 0.92)));
  --sc-card-surface-alt: var(--sc-theme-card-surface-alt, color-mix(in srgb, var(--sc-card-surface) 86%, transparent));
  --sc-card-border: var(--sc-theme-card-border, var(--sc-theme-border, rgba(15, 23, 42, 0.12)));
  --sc-card-text: var(--sc-theme-card-text, var(--sc-theme-text, var(--el-text-color-primary, #111827)));
  --sc-card-text-muted: var(--sc-theme-card-text-muted, var(--sc-theme-text-muted, var(--el-text-color-secondary, #6b7280)));
  --sc-card-shadow: var(--sc-theme-card-shadow, var(--sc-theme-shadow, 0 18px 42px -28px rgba(15, 23, 42, 0.42)));
  --sc-card-accent: var(--sc-theme-card-accent, var(--sc-theme-accent, rgba(59, 130, 246, 0.32)));
  --sc-card-accent-strong: var(--sc-theme-card-accent-strong, color-mix(in srgb, var(--sc-card-accent) 82%, white));
  --sc-card-radius: var(--sc-theme-card-radius, 20px);
  --sc-card-font: var(--sc-theme-font-accent, inherit);

  position: relative;
  overflow: hidden;
  border-radius: var(--sc-card-radius) !important;
  border: 1px solid var(--sc-card-border) !important;
  background: var(--sc-card-surface) !important;
  color: var(--sc-card-text) !important;
  box-shadow: var(--sc-card-shadow) !important;
  font-family: var(--sc-card-font);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease;

  &::before,
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
  }

  &::before {
    background: linear-gradient(135deg, var(--sc-card-accent), transparent 48%);
    opacity: 0.45;
  }

  &::after {
    inset: auto -12% 54% 42%;
    height: 180px;
    background: radial-gradient(circle, var(--sc-card-accent), transparent 70%);
    opacity: 0.22;
  }

  &.sc-themed-card--hoverable:hover {
    transform: translateY(-2px);
    box-shadow: 0 24px 48px -30px color-mix(in srgb, var(--sc-card-accent) 42%, rgba(0, 0, 0, 0.28)) !important;
  }

  :is([class*="__header"], [class*="__content"], [class*="__body"], [class*="__footer"], [class*="__info"], [class*="__media"]) {
    position: relative;
    z-index: 1;
  }

  :is([class*="__title"], [class*="__value"], [class*="__status"], [class*="__icon"]) {
    color: var(--sc-card-text) !important;
  }

  :is([class*="__subtitle"], [class*="__label"], [class*="__meta"], [class*="__footer"], [class*="__description"]) {
    color: var(--sc-card-text-muted) !important;
  }

  &.sc-themed-card--8bit {
    --sc-card-radius: 4px;
    image-rendering: pixelated;

    &::before,
    &::after {
      opacity: 0;
    }
  }

  &.sc-themed-card--spring-festival::before {
    background:
      linear-gradient(135deg, rgba(255, 215, 0, 0.16), transparent 40%),
      linear-gradient(315deg, rgba(157, 2, 8, 0.22), transparent 60%);
  }

  &.sc-themed-card--spring-festival::after {
    inset: 12px;
    border: 1px solid rgba(255, 215, 0, 0.22);
    border-radius: calc(var(--sc-card-radius) - 8px);
    background: none;
    opacity: 1;
  }

  &.sc-themed-card--christmas::before {
    background:
      radial-gradient(circle at 15% 18%, rgba(255, 255, 255, 0.16) 0 2px, transparent 3px),
      radial-gradient(circle at 75% 32%, rgba(255, 225, 138, 0.18) 0 2px, transparent 3px),
      linear-gradient(135deg, rgba(19, 78, 42, 0.2), transparent 52%);
    opacity: 0.72;
  }

  &.sc-themed-card--future-tech::before {
    background:
      linear-gradient(rgba(61, 125, 91, 0.12) 1px, transparent 1px),
      linear-gradient(90deg, rgba(61, 125, 91, 0.12) 1px, transparent 1px);
    background-size: 18px 18px;
    opacity: 0.55;
  }

  &.sc-themed-card--future-tech::after {
    inset: 1px;
    border: 1px solid rgba(86, 153, 117, 0.28);
    border-radius: calc(var(--sc-card-radius) - 1px);
    background: none;
    opacity: 1;
  }

  &.sc-themed-card--halloween::before {
    background:
      linear-gradient(135deg, rgba(255, 128, 0, 0.18), transparent 42%),
      linear-gradient(45deg, rgba(94, 33, 130, 0.26), transparent 56%);
  }
}
</style>
