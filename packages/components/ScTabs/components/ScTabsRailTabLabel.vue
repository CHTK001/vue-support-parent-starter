<template>
  <ElTooltip
    :content="tooltipText"
    placement="top"
    :show-after="300"
    :disabled="!tooltipText"
    effect="light"
  >
    <span class="sc-tabs__rail-label" role="img" :aria-label="tooltipText || String(item.name)">
      <!-- Iconify 图标 -->
      <IconifyIconOnline v-if="item.iconify" :icon="item.iconify" class="sc-tabs__rail-iconify" />

      <!-- Element Plus 图标 -->
      <ElIcon v-else-if="item.icon" class="sc-tabs__rail-el-icon">
        <component :is="item.icon" />
      </ElIcon>

      <!-- 无图标时的首字母兜底 -->
      <span v-else class="sc-tabs__rail-fallback">{{ fallbackGlyph }}</span>

      <!-- 关闭按钮 -->
      <span
        v-if="item.closable ?? railClosable"
        class="sc-tabs__rail-close"
        @click.stop="$emit('close', item.name)"
      >
        <svg viewBox="0 0 24 24" width="8" height="8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </span>
    </span>
  </ElTooltip>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElIcon, ElTooltip } from "element-plus";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import type { ScTabsRailItem } from "../types";

const props = defineProps<{
  item: ScTabsRailItem;
  railClosable: boolean;
}>();

defineEmits<{
  (e: "close", name: string | number): void;
}>();

const tooltipText = computed(
  () => props.item.title || props.item.label || String(props.item.name),
);

const fallbackGlyph = computed(() => {
  const t = tooltipText.value.trim();
  return t ? t.slice(0, 1) : "?";
});
</script>

<style scoped lang="scss">
.sc-tabs__rail-label {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  max-width: var(--sc-tabs-rail-item, 44px);
  max-height: var(--sc-tabs-rail-item, 44px);
  font-weight: 600;
  color: #4b5563;
  border-radius: 12px;
  transition: all 0.22s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: pointer;
  box-sizing: border-box;

  &:hover {
    background-color: #f4f5f9;
    transform: scale(0.96);
  }

  &:active {
    transform: scale(0.94);
  }
}

/* Iconify 图标 */
.sc-tabs__rail-iconify {
  font-size: var(--sc-tabs-rail-icon, 19px);
  color: #54687b;
  transition: color 0.2s;
}

/* Element 图标 */
.sc-tabs__rail-el-icon {
  font-size: var(--sc-tabs-rail-icon, 19px);
  color: #54687b;
  transition: color 0.2s;
}

/* 首字母兜底 */
.sc-tabs__rail-fallback {
  font-size: calc(var(--sc-tabs-rail-icon, 19px) * 0.85);
  font-weight: 600;
  color: #54687b;
  opacity: 0.9;
}

/* 关闭按钮 - 现代化样式 */
.sc-tabs__rail-close {
  position: absolute;
  top: -6px;
  right: -6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--sc-tabs-rail-close, 18px);
  height: var(--sc-tabs-rail-close, 18px);
  border-radius: 999px;
  background: #fff;
  color: #f43f5e;
  box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.18s ease;
  opacity: 0;
  transform: scale(0.8);

  .sc-tabs__rail-label:hover & {
    opacity: 1;
    transform: scale(1);
  }

  &:hover {
    background: #fef2f2;
    color: #e11d48;
    transform: scale(1.1);
  }
}
</style>