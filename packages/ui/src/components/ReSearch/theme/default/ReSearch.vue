<script setup lang="ts">
/**
 * ReSearch default 主题 —— 简洁搜索折叠组件
 */
import { ref, onMounted, computed, defineAsyncComponent, type CSSProperties } from "vue";
import { ArrowDown } from "@element-plus/icons-vue";
import "../../shared/research-vars.css";

const ModernLayout = defineAsyncComponent(() => import("../../layouts/Modern.vue"));

defineOptions({ name: "ReSearch", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    isExpanded?: boolean;
    showSearch?: boolean;
    layout?: "default" | "modern";
    mode?: 1 | 2;
    bordered?: boolean;
    showLabel?: boolean;
    tooltipText?: string;
    padding?: string;
  }>(),
  {
    isExpanded: false,
    showSearch: true,
    layout: "default",
    mode: 1,
    bordered: false,
    showLabel: false,
    tooltipText: "搜索",
    padding: "12px 18px 4px",
  },
);

const showExpanded = ref(false);

const toggleExpanded = () => {
  showExpanded.value = !showExpanded.value;
};

const tooltipContent = computed(() => (showExpanded.value ? "收起" : props.tooltipText));

const triggerIconClass = computed(() => ({
  "re-search__icon--expanded": showExpanded.value,
}));

const containerStyle = computed<CSSProperties>(() => {
  const base: CSSProperties = { padding: props.padding };
  if (props.mode === 2) base["--label-width"] = "100px";
  return base;
});

onMounted(() => {
  if (props.isExpanded !== undefined) {
    showExpanded.value = props.isExpanded;
  }
});
</script>

<template>
  <ModernLayout
    v-if="layout === 'modern'"
    :is-expanded="isExpanded"
    :show-search="showSearch"
    :bordered="bordered"
    :mode="mode"
    :show-label="showLabel"
    :tooltip-text="tooltipText"
    :padding="padding"
  >
    <slot />
    <template #footer>
      <slot name="footer" />
    </template>
    <template #action>
      <slot name="action" />
    </template>
  </ModernLayout>

  <transition v-else name="re-search-collapse">
    <div
      v-show="showSearch"
      class="re-search"
      :class="{
        're-search--bordered': bordered,
        're-search--expanded': showExpanded,
        're-search--form': mode === 2,
      }"
      :style="containerStyle"
    >
      <div class="re-search__divider" />

      <el-collapse-transition>
        <div
          v-if="showExpanded"
          class="re-search__content"
          :class="{ 're-search__content--form': mode === 2 }"
        >
          <slot />
        </div>
      </el-collapse-transition>

      <div class="re-search__footer">
        <div class="re-search__footer-left">
          <slot name="footer" />
        </div>
        <div class="re-search__spacer" />
        <el-tooltip
          :content="tooltipContent"
          placement="top"
          :show-after="100"
          popper-class="re-search__tooltip"
        >
          <div
            class="re-search__trigger"
            :class="{ 're-search__trigger--label': showLabel }"
            @click="toggleExpanded"
            role="button"
            :aria-expanded="showExpanded"
            :aria-label="tooltipContent"
            tabindex="0"
            @keydown.enter.prevent="toggleExpanded"
            @keydown.space.prevent="toggleExpanded"
          >
            <slot name="action">
              <el-icon :size="14" :class="triggerIconClass">
                <ArrowDown />
              </el-icon>
              <span v-if="showLabel" class="re-search__label">
                {{ tooltipContent }}
              </span>
            </slot>
          </div>
        </el-tooltip>
      </div>
    </div>
  </transition>
</template>

<style scoped lang="scss">
.re-search {
  margin: 4px 4px 0;
  overflow: hidden;
  color: var(--rs-text);
  background: var(--rs-bg-card);
  border: 1px solid transparent;
  border-radius: var(--rs-radius-md);
  transition: border-color var(--rs-transition), box-shadow var(--rs-transition);
}

.re-search--bordered {
  border: 1px solid var(--rs-border);
  box-shadow: var(--rs-shadow-xs);
}

.re-search--bordered.re-search--expanded {
  border-color: var(--rs-border-hover);
  box-shadow: var(--rs-shadow-sm);
}

.re-search--form {
  .re-search__content--form :deep(> *:not(.el-row)) {
    display: grid;
    grid-template-columns: var(--label-width) 1fr;
    align-items: center;
    gap: 12px;
    padding: 6px 4px;
  }
}

.re-search__divider {
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 44px;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent 0%,
    var(--rs-border) 12%,
    var(--rs-border) 88%,
    transparent 100%
  );
  opacity: 0;
  transform: scaleY(0);
  transform-origin: center;
  transition: opacity 0.25s ease, transform 0.3s ease;
}

.re-search--expanded .re-search__divider {
  opacity: 1;
  transform: scaleY(1);
}

.re-search__content {
  padding: 0 2px 10px;
}

.re-search__footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0 2px;
}

.re-search__footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.re-search__spacer {
  flex: 1;
}

.re-search__trigger {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  cursor: pointer;
  border-radius: var(--rs-radius-full);
  color: var(--rs-color-icon);
  background: var(--rs-bg-hover);
  font-size: var(--rs-font-sm);
  font-weight: 500;
  user-select: none;
  white-space: nowrap;
  border: 1px solid transparent;
  transition:
    background var(--rs-transition),
    color var(--rs-transition),
    border-color var(--rs-transition),
    box-shadow var(--rs-transition),
    transform var(--rs-transition);

  .re-search__icon--expanded {
    transform: rotate(180deg);
  }

  &:hover {
    background: var(--rs-primary-tint);
    color: var(--rs-primary);
    border-color: var(--rs-primary-outline);
    box-shadow: var(--rs-shadow-sm);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
    box-shadow: none;
    background: color-mix(in srgb, var(--rs-primary) 14%, var(--rs-bg-hover));
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--rs-primary) 20%, transparent);
  }
}

.re-search__trigger--label {
  padding: 5px 14px;
  font-size: var(--rs-font);
}

.re-search__label {
  font-size: var(--rs-font-sm);
}

.re-search__tooltip {
  font-size: 12px;
}

.re-search-collapse-enter-active,
.re-search-collapse-leave-active {
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1),
             opacity 0.2s ease;
}

.re-search-collapse-enter-from {
  transform: translateY(-6px);
  opacity: 0;
}

.re-search-collapse-leave-to {
  transform: translateY(-4px);
  opacity: 0;
}
</style>
