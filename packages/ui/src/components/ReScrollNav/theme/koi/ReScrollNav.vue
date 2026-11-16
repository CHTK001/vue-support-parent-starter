<script setup lang="ts">
/**
 * ReScrollNav koi 主题 —— 横向可滚动导航壳层（KoiScrollNav 移植）
 *
 * 与 default 主题保持相同 API，结构独立：手写 viewport 滚动 + 左右翻页按钮，
 * 样式走 el 主题变量，隐藏原生滚动条。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from "vue";
import { ArrowLeft, ArrowRight } from "@element-plus/icons-vue";
import type { ReScrollNavExpose } from "../../types";

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

/**
 * 把指定元素（当前页签）滚进视口。
 *
 * <p>不用 {@code scrollIntoView}：它按「调用瞬间」的布局算滚动量，而两侧翻页按钮
 * 是溢出后才出现（{@code v-show}）的——按钮一显形 viewport 的 clientWidth 立刻缩掉
 * 38×2px，刚滚到位的页签又被裁掉一截（多页签验收实测右边缘溢出 70px，再调一次
 * 才对齐）。这里自己用 rect 差值算 scrollLeft，再由 {@link realignActive} 在布局
 * 变化后补一次，结果与「按钮先渲染还是先滚动」无关。</p>
 *
 * <p>只滚 viewport 自身：{@code scrollIntoView} 会顺带滚动祖先滚动容器，
 * 页签栏不该把页面一起推走。</p>
 */
const scrollToSelector = (selector: string) => {
  const wrap = getViewport();
  if (!wrap || !selector) return;
  const target = wrap.querySelector(selector) as HTMLElement | null;
  if (!target) return;
  // 目标在滚动内容里的左右边界：rect 差值 + 当前 scrollLeft
  // （offsetLeft 是相对 track 的，减容器偏移实测偏差 200px 以上）
  const wrapRect = wrap.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const left = targetRect.left - wrapRect.left + wrap.scrollLeft;
  const right = left + targetRect.width;
  if (left < wrap.scrollLeft) {
    wrap.scrollTo({ left, behavior: "smooth" });
  } else if (right > wrap.scrollLeft + wrap.clientWidth) {
    wrap.scrollTo({ left: right - wrap.clientWidth, behavior: "smooth" });
  }
};

/**
 * 布局变化后重新对齐当前页签（幂等：已完整可见时不动）。
 *
 * <p>翻页按钮显隐、窗口缩放、页签增删都会改 viewport 的 clientWidth 或页签位置，
 * 一次滚动不足以保证「滚完那一刻」仍然完整可见，所以这些时机都补一次。</p>
 */
const realignActive = () => {
  if (!props.activeSelector) return;
  nextTick(() => scrollToSelector(props.activeSelector));
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
  resizeObserver = new ResizeObserver(() => {
    updateScrollState();
    // 视口宽度变了（翻页按钮显隐、窗口缩放）：当前页签可能又被裁掉一截
    realignActive();
  });
  resizeObserver.observe(el);
};

watch(
  () => props.activeSelector,
  (selector) => {
    if (!selector) return;
    realignActive();
  },
);

// 溢出状态翻转意味着一侧多出 38px 的翻页按钮，viewport 立刻变窄
watch(scrollable, () => realignActive());

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
