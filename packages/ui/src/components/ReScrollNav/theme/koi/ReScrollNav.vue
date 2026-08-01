<script setup lang="ts">
/**
 * ReScrollNav koi 主题 —— 横向可滚动导航壳层（KoiScrollNav 移植）
 *
 * 与 default 主题保持相同 API，结构独立：手写 viewport 滚动 + 左右翻页按钮，
 * 样式走 el 主题变量，隐藏原生滚动条。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from "vue";
import { ArrowLeft, ArrowRight } from "@element-plus/icons-vue";
import type { ReScrollNavExpose } from "../types";

defineOptions({ name: "ReScrollNav", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    scrollStep?: number;
    wheelFactor?: number;
    height?: string;
    gap?: number;
    iconSize?: number;
    showButtonsWhenOverflow?: boolean;
    alwaysShowButtons?: boolean;
    prevAriaLabel?: string;
    nextAriaLabel?: string;
    activeSelector?: string;
  }>(),
  {
    scrollStep: 200,
    wheelFactor: 0.5,
    height: "40px",
    gap: 6,
    iconSize: 14,
    showButtonsWhenOverflow: true,
    alwaysShowButtons: false,
    prevAriaLabel: "向左滚动",
    nextAriaLabel: "向右滚动",
    activeSelector: "",
  },
);

const viewportRef = ref<HTMLElement | null>(null);
const scrollable = ref(false);
const canScrollPrev = ref(false);
const canScrollNext = ref(false);

let resizeObserver: ResizeObserver | undefined;

const rootStyle = computed<CSSProperties>(() => ({ height: props.height }));
const trackStyle = computed<CSSProperties>(() => ({ gap: `${props.gap}px` }));
const showNavButtons = computed(
  () => props.alwaysShowButtons || (props.showButtonsWhenOverflow && scrollable.value),
);

const getViewport = () => viewportRef.value;

const updateScrollState = () => {
  const el = getViewport();
  if (!el) {
    scrollable.value = false;
    canScrollPrev.value = false;
    canScrollNext.value = false;
    return;
  }
  const { scrollLeft, scrollWidth, clientWidth } = el;
  const overflow = scrollWidth - clientWidth > 2;
  scrollable.value = overflow;
  canScrollPrev.value = overflow && scrollLeft > 2;
  canScrollNext.value = overflow && scrollLeft + clientWidth < scrollWidth - 2;
};

const scrollByDirection = (direction: "prev" | "next") => {
  const el = getViewport();
  if (!el) return;
  const delta = direction === "prev" ? -props.scrollStep : props.scrollStep;
  el.scrollBy({ left: delta, behavior: "smooth" });
};

const scrollToSelector = (selector: string) => {
  const wrap = getViewport();
  if (!wrap || !selector) return;
  const target = wrap.querySelector(selector) as HTMLElement | null;
  target?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
};

const handleWheel = (e: WheelEvent) => {
  const el = getViewport();
  if (!el) return;
  el.scrollLeft += (e.deltaY + e.deltaX) * props.wheelFactor;
  updateScrollState();
};

const bindResizeObserver = () => {
  const el = getViewport();
  if (!el || typeof ResizeObserver === "undefined") return;
  resizeObserver?.disconnect();
  resizeObserver = new ResizeObserver(() => updateScrollState());
  resizeObserver.observe(el);
};

watch(
  () => props.activeSelector,
  (selector) => {
    if (!selector) return;
    nextTick(() => scrollToSelector(selector));
  },
);

onMounted(() => {
  nextTick(() => {
    updateScrollState();
    if (props.activeSelector) scrollToSelector(props.activeSelector);
    bindResizeObserver();
  });
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});

defineExpose<ReScrollNavExpose>({
  updateScrollState,
  scrollByDirection,
  scrollToSelector,
  scrollable,
  canScrollPrev,
  canScrollNext,
});
</script>

<template>
  <div class="koi-scroll-nav" :class="{ 'is-scrollable': scrollable }" :style="rootStyle">
    <button
      v-show="showNavButtons"
      type="button"
      class="koi-scroll-nav__btn"
      :class="{ 'is-disabled': !canScrollPrev }"
      :disabled="!canScrollPrev"
      :aria-label="prevAriaLabel"
      @click="scrollByDirection('prev')"
    >
      <el-icon :size="iconSize"><ArrowLeft /></el-icon>
    </button>
    <div ref="viewportRef" class="koi-scroll-nav__viewport" @scroll="updateScrollState" @wheel.prevent="handleWheel">
      <div class="koi-scroll-nav__track" :style="trackStyle">
        <slot />
      </div>
    </div>
    <button
      v-show="showNavButtons"
      type="button"
      class="koi-scroll-nav__btn"
      :class="{ 'is-disabled': !canScrollNext }"
      :disabled="!canScrollNext"
      :aria-label="nextAriaLabel"
      @click="scrollByDirection('next')"
    >
      <el-icon :size="iconSize"><ArrowRight /></el-icon>
    </button>
  </div>
</template>

<style scoped lang="scss">
.koi-scroll-nav {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: 4px;
  user-select: none;
  box-sizing: border-box;

  &.is-scrollable .koi-scroll-nav__viewport {
    margin: 0 2px;
  }
}

.koi-scroll-nav__btn {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background: color-mix(in srgb, var(--el-bg-color) 82%, transparent);
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  outline: none;
  box-sizing: border-box;
  transition: color 0.15s ease, border-color 0.15s ease, background-color 0.15s ease;

  &:not(.is-disabled):hover {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary);
    background: var(--el-fill-color-light);
  }

  &.is-disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
}

.koi-scroll-nav__viewport {
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.koi-scroll-nav__track {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 2px 4px;
  box-sizing: border-box;
}
</style>
