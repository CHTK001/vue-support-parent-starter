<template>
  <div
    class="koi-scroll-nav"
    :class="{ 'koi-scroll-nav--scrollable': scrollable }"
    :style="rootStyle"
  >
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
    <div
      ref="viewportRef"
      class="koi-scroll-nav__viewport"
      @scroll="updateScrollState"
      @wheel.prevent="handleWheel"
    >
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

<script setup lang="ts">
/**
 * KoiScrollNav · 横向可滚动导航壳层
 *
 * 适用：顶栏一级菜单、横向标签组、工具条按钮组等「子项过多需左右翻页」的场景。
 * 已全局注册，模板中可直接写 <KoiScrollNav>，无需 import。
 *
 * ── 结构 ──
 * [ 左翻页 ] · [ 横向滚动视口 + 默认插槽 ] · [ 右翻页 ]
 * 溢出时自动显示翻页钮；支持滚轮横向滑动；隐藏原生滚动条。
 *
 * ── 基础用法 ──
 * ```vue
 * <KoiScrollNav ref="navRef" class="flex-1 min-w-0">
 *   <button
 *     v-for="item in menuList"
 *     :key="item.id"
 *     type="button"
 *     class="my-nav-item"
 *     :class="{ 'is-active': activeId === item.id }"
 *     :data-nav-id="item.id"
 *     @click="activeId = item.id"
 *   >
 *     {{ item.label }}
 *   </button>
 * </KoiScrollNav>
 * ```
 *
 * ── 激活项自动滚入可视区（推荐）──
 * 子项上挂与选择器一致的 data 属性，把当前 id 传给 activeSelector：
 * ```vue
 * <KoiScrollNav
 *   :active-selector="activeId ? `[data-nav-id=\"${activeId}\"]` : ''"
 * >
 *   ...
 * </KoiScrollNav>
 * ```
 *
 * ── 父级宽度变化后手动刷新 ──
 * 侧栏收起、工具栏变宽等导致可用宽度变化时，在 nextTick 后调用：
 * ```ts
 * const navRef = ref<InstanceType<typeof KoiScrollNav> | null>(null);
 * watch(sidebarWidth, () => nextTick(() => navRef.value?.updateScrollState()));
 * ```
 *
 * ── 编程式滚动 ──
 * ```ts
 * navRef.value?.scrollByDirection('next'); // 'prev' | 'next'
 * navRef.value?.scrollToSelector('[data-nav-id="home"]');
 * ```
 *
 * ── Props ──
 * | 属性 | 说明 | 默认 |
 * |------|------|------|
 * | scrollStep | 点击翻页按钮每次滚动像素 | 200 |
 * | wheelFactor | 滚轮横向系数（deltaY + deltaX） | 0.5 |
 * | height | 根节点高度 | 40px |
 * | gap | 插槽内子项间距（px） | 6 |
 * | iconSize | 翻页图标尺寸 | 14 |
 * | showButtonsWhenOverflow | 仅溢出时显示翻页钮 | true |
 * | alwaysShowButtons | 始终显示翻页钮（不可滚时禁用） | false |
 * | activeSelector | 激活项选择器（相对 viewport） | '' |
 * | prevAriaLabel / nextAriaLabel | 翻页按钮无障碍文案 | 向左/向右滚动 |
 *
 * ── expose（ref 调用）──
 * | 方法/属性 | 说明 |
 * |-----------|------|
 * | updateScrollState() | 重新计算是否可滚动及左右是否可翻 |
 * | scrollByDirection('prev' \| 'next') | 平滑滚动一屏步长 |
 * | scrollToSelector(selector) | 将匹配节点滚入可视区 |
 * | scrollable / canScrollPrev / canScrollNext | 只读状态 ref |
 *
 * ── 注意 ──
 * 1. 父级需有宽度约束（如 flex-1 + min-width: 0），否则不会触发溢出翻页。
 * 2. 插槽子项建议 display: inline-flex; flex-shrink: 0，避免被压缩。
 * 3. activeSelector 必须是 viewport 内部的合法 CSS 选择器。
 * 4. 样式只负责壳层与翻页钮；菜单项/标签外观由插槽内容自行定义。
 *
 * ── 项目参考 ──
 * 混合布局顶栏一级菜单：src/layouts/LayoutOptimum/index.vue
 */
import { ArrowLeft, ArrowRight } from "@element-plus/icons-vue";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from "vue";

/** 组件对外暴露的能力（供 ref 类型标注） */
export type KoiScrollNavExpose = {
  updateScrollState: () => void;
  scrollByDirection: (direction: "prev" | "next") => void;
  scrollToSelector: (selector: string) => void;
  scrollable: Readonly<{ value: boolean }>;
  canScrollPrev: Readonly<{ value: boolean }>;
  canScrollNext: Readonly<{ value: boolean }>;
};

const props = withDefaults(
  defineProps<{
    /** 每次点击左侧/右侧翻页按钮时，横向滚动的像素距离 */
    scrollStep?: number;
    /** 鼠标滚轮横向滚动系数，实际位移 = (deltaY + deltaX) * wheelFactor */
    wheelFactor?: number;
    /** 根节点高度，建议与插槽内按钮高度接近，如 "40px"、"44px" */
    height?: string;
    /** 轨道内相邻子项间距（单位 px），通过 flex gap 作用在默认插槽根级子元素之间 */
    gap?: number;
    /** 左右翻页按钮内 el-icon 的 size */
    iconSize?: number;
    /** 为 true 时：仅当内容宽度超出视口才显示翻页按钮 */
    showButtonsWhenOverflow?: boolean;
    /** 为 true 时：翻页按钮始终显示；不可滚动时按钮为禁用态 */
    alwaysShowButtons?: boolean;
    /** 左侧翻页按钮 aria-label */
    prevAriaLabel?: string;
    /** 右侧翻页按钮 aria-label */
    nextAriaLabel?: string;
    /**
     * 当前激活项的 CSS 选择器（相对于内部 .koi-scroll-nav__viewport）
     * 变化后会自动 scrollIntoView，例如：`[data-nav-id="12"]`
     */
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
    activeSelector: ""
  }
);

const viewportRef = ref<HTMLElement | null>(null);
const scrollable = ref(false);
const canScrollPrev = ref(false);
const canScrollNext = ref(false);

let resizeObserver: ResizeObserver | undefined;

const rootStyle = computed<CSSProperties>(() => ({
  height: props.height
}));

const trackStyle = computed<CSSProperties>(() => ({
  gap: `${props.gap}px`
}));

const showNavButtons = computed(
  () => props.alwaysShowButtons || (props.showButtonsWhenOverflow && scrollable.value)
);

const getViewport = () => viewportRef.value;

/** 根据 scrollLeft / scrollWidth / clientWidth 更新可滚动与左右翻页可用状态 */
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

/** 点击翻页按钮时调用，direction 为 prev 向左、next 向右 */
const scrollByDirection = (direction: "prev" | "next") => {
  const el = getViewport();
  if (!el) return;
  const delta = direction === "prev" ? -props.scrollStep : props.scrollStep;
  el.scrollBy({ left: delta, behavior: "smooth" });
};

/** 将 viewport 内首个匹配 selector 的子节点滚入可视区域 */
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
  }
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

defineExpose<KoiScrollNavExpose>({
  updateScrollState,
  scrollByDirection,
  scrollToSelector,
  scrollable,
  canScrollPrev,
  canScrollNext
});
</script>

<style lang="scss" scoped>
/**
 * 默认仅提供壳层与翻页钮样式；插槽内按钮/标签请在使用处自定义 class。
 * 需要贴顶栏玻璃态时，可在外层再包一层并写 :deep(.koi-scroll-nav__btn) 覆盖。
 */
.koi-scroll-nav {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: 4px;
  user-select: none;
  box-sizing: border-box;

  &.koi-scroll-nav--scrollable .koi-scroll-nav__viewport {
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
  transition:
    color 0.15s ease,
    border-color 0.15s ease,
    background-color 0.15s ease;

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
