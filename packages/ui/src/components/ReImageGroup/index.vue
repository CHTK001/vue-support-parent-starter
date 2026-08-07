<template>
  <div ref="root" class="re-image-group" :class="[`re-image-group--${layout}`]" :style="rootStyle">
    <div
      v-for="(item, index) in normalizedList"
      :key="index"
      :ref="(el) => registerItem(el as HTMLElement | null, index)"
      class="re-image-group__item"
      :style="itemStyle(item, index)"
    >
      <div v-if="!visibleMap[index]" class="re-image-group__placeholder" :style="placeholderStyle(item)" />
      <img
        v-else
        :src="resolveSrc(item)"
        :alt="resolveAlt(item)"
        :style="imgInnerStyle"
        class="re-image-group__img"
        :class="{ 'is-clickable': preview }"
        @load="(e) => handleLoad(e, index)"
        @error="(e) => handleError(e, index)"
        @click="(e) => handlePreview(e, index)"
      />
      <div v-if="visibleMap[index] && loadingMap[index] && !loadedMap[index]" class="re-image-group__loading">
        <div class="re-image-group__spinner" />
      </div>
      <div v-if="visibleMap[index] && errorMap[index]" class="re-image-group__error">
        <span class="re-image-group__error-text">{{ fallbackText }}</span>
      </div>
    </div>
    <div v-if="!normalizedList.length" class="re-image-group__empty">{{ emptyText }}</div>
  </div>
</template>

<script setup lang="ts">
/**
 * ReImageGroup —— 图片列表/画廊
 *
 * - 异步懒加载：图片节点首次进入视口才赋值 src，避免一次性加载全部图片
 * - 布局：grid（等高网格） / masonry（按原图比例瀑布流）
 * - 预览：点击调起 viewerjs，传入全量 src-list 作为可切换图集
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import Viewer from "viewerjs";

/** 单个图片项（字符串 = 纯 url；对象 = 带 width/height/alt） */
export interface ImageGroupItem {
  src: string;
  alt?: string;
  /** 原图宽（masonry 用） */
  width?: number;
  /** 原图高（masonry 用） */
  height?: number;
}

type ListInput = string | ImageGroupItem;

const props = withDefaults(
  defineProps<{
    /** 图片列表：字符串数组或对象数组 */
    srcList?: ListInput[];
    /** 兼容 Element Plus 命名 */
    previewSrcList?: string[];
    /** 布局：grid 等高 / masonry 瀑布流 */
    layout?: "grid" | "masonry";
    /** 列数（grid 模式生效） */
    columns?: number;
    /** 间距 */
    gap?: number;
    /** 圆角 */
    radius?: number;
    /** 固定行高（grid 模式生效，px） */
    rowHeight?: number;
    /** 对象适配 */
    fit?: "fill" | "contain" | "cover" | "none" | "scale-down";
    /** 是否可点击预览 */
    preview?: boolean;
    /** 懒加载：进入视口前不加载图片；关闭后立即加载全部 */
    lazy?: boolean;
    /** 视口外扩像素（提前触发） */
    rootMargin?: string;
    /** 显示加载占位（spinner） */
    loading?: boolean;
    /** 加载失败文案 */
    fallbackText?: string;
    /** 容器为空时文案 */
    emptyText?: string;
  }>(),
  {
    srcList: () => [],
    previewSrcList: () => [],
    layout: "grid",
    columns: 3,
    gap: 8,
    radius: 6,
    rowHeight: 160,
    fit: "cover",
    preview: true,
    lazy: true,
    rootMargin: "200px",
    loading: true,
    fallbackText: "加载失败",
    emptyText: "暂无图片",
  },
);

const root = ref<HTMLElement | null>(null);
const itemRefs = new Map<number, HTMLElement>();
const visibleMap = reactive<Record<number, boolean>>({});
const loadingMap = reactive<Record<number, boolean>>({});
const loadedMap = reactive<Record<number, boolean>>({});
const errorMap = reactive<Record<number, boolean>>({});

let observer: IntersectionObserver | null = null;
let viewerInstance: Viewer | null = null;

/** 统一输出：字符串 -> { src }, 对象 -> 透传 */
const normalizedList = computed<ImageGroupItem[]>(() => {
  const fromSrc = (props.srcList ?? []).map(toImageItem);
  if (fromSrc.length) return fromSrc;
  return (props.previewSrcList ?? []).map((s) => ({ src: s }));
});

function toImageItem(item: ListInput): ImageGroupItem {
  if (typeof item === "string") return { src: item };
  return item;
}

function resolveSrc(item: ImageGroupItem): string {
  return item.src;
}

function resolveAlt(item: ImageGroupItem): string {
  return item.alt ?? "";
}

/** 占位背景色 = 原图比例（masonry） / 固定高宽比（grid） */
function placeholderStyle(item: ImageGroupItem) {
  if (props.layout === "masonry" && item.width && item.height) {
    const ratio = (item.height / item.width) * 100;
    return { paddingBottom: `${ratio}%`, borderRadius: `${props.radius}px` };
  }
  return { height: `${props.rowHeight}px`, borderRadius: `${props.radius}px` };
}

const imgInnerStyle = computed(() => ({
  objectFit: props.fit,
  borderRadius: `${props.radius}px`,
}));

/** 容器整体样式 */
const rootStyle = computed(() => ({
  display: "grid",
  gridTemplateColumns:
    props.layout === "grid"
      ? `repeat(${Math.max(1, props.columns)}, minmax(0, 1fr))`
      : `repeat(${Math.max(1, props.columns)}, minmax(0, 1fr))`,
  gridAutoRows: props.layout === "masonry" ? "auto" : `${props.rowHeight}px`,
  columnGap: `${props.gap}px`,
  rowGap: `${props.gap}px`,
}));

/** masonry 模式按原图比例撑开 */
function itemStyle(item: ImageGroupItem, _index: number) {
  if (props.layout === "masonry" && item.width && item.height) {
    return { gridRow: `span ${Math.max(1, Math.round(item.height / 100))}` };
  }
  return {};
}

function registerItem(el: HTMLElement | null, index: number) {
  if (el) {
    itemRefs.set(index, el);
  } else {
    itemRefs.delete(index);
  }
}

function ensureObserver() {
  if (observer || typeof IntersectionObserver === "undefined") return;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const idxAttr = entry.target.getAttribute("data-idx");
        const idx = idxAttr ? Number(idxAttr) : NaN;
        if (!Number.isFinite(idx)) continue;
        if (entry.isIntersecting) {
          visibleMap[idx] = true;
          loadingMap[idx] = true;
          observer?.unobserve(entry.target);
        }
      }
    },
    { rootMargin: props.rootMargin, threshold: 0.01 },
  );
}

function observeAll() {
  if (!observer) return;
  itemRefs.forEach((el, idx) => {
    el.setAttribute("data-idx", String(idx));
    observer!.observe(el);
  });
}

function unobserveAll() {
  observer?.disconnect();
  observer = null;
}

function handleLoad(_e: Event, index: number) {
  loadedMap[index] = true;
  errorMap[index] = false;
  loadingMap[index] = false;
}

function handleError(_e: Event, index: number) {
  loadedMap[index] = false;
  errorMap[index] = true;
  loadingMap[index] = false;
}

/** 点击预览：viewerjs 实例化一次，传全量 url 作为可切换图集 */
function handlePreview(e: MouseEvent, index: number) {
  if (!props.preview) return;
  e.stopPropagation();
  if (viewerInstance) {
    viewerInstance.show();
    viewerInstance.view(index);
    return;
  }
  if (!root.value) return;
  const urls = normalizedList.value.map((it) => it.src);
  viewerInstance = new Viewer(root.value, {
    url: (img: HTMLImageElement) => img.src,
    hidden: () => {
      viewerInstance?.destroy();
      viewerInstance = null;
    },
  });
  viewerInstance.show();
  viewerInstance.view(index);
}

onMounted(() => {
  if (!props.lazy) {
    // 关闭懒加载：所有项立即可见
    normalizedList.value.forEach((_, i) => {
      visibleMap[i] = true;
      loadingMap[i] = true;
    });
    return;
  }
  ensureObserver();
  // 等下一帧 DOM 完成渲染后再 observe
  requestAnimationFrame(observeAll);
});

onBeforeUnmount(() => {
  unobserveAll();
  if (viewerInstance) {
    viewerInstance.destroy();
    viewerInstance = null;
  }
});

/** 数据变化时重建观察 + 清空旧状态 */
watch(
  () => normalizedList.value.length,
  () => {
    // 重置可见/加载/错误状态
    Object.keys(visibleMap).forEach((k) => delete visibleMap[Number(k)]);
    Object.keys(loadingMap).forEach((k) => delete loadingMap[Number(k)]);
    Object.keys(loadedMap).forEach((k) => delete loadedMap[Number(k)]);
    Object.keys(errorMap).forEach((k) => delete errorMap[Number(k)]);
    if (!props.lazy) {
      normalizedList.value.forEach((_, i) => {
        visibleMap[i] = true;
        loadingMap[i] = true;
      });
      return;
    }
    unobserveAll();
    ensureObserver();
    requestAnimationFrame(observeAll);
  },
);
</script>

<style scoped>
.re-image-group {
  width: 100%;
}

.re-image-group__item {
  position: relative;
  overflow: hidden;
  background: var(--el-fill-color-light);
  min-height: 0;
}

.re-image-group__placeholder {
  width: 100%;
  height: 100%;
  background: var(--el-fill-color-lighter);
  position: relative;
}

.re-image-group__img {
  display: block;
  width: 100%;
  height: 100%;
  transition: opacity 0.3s ease;
  opacity: 0;
}

.re-image-group__img[src]:not([src=""]) {
  opacity: 1;
}

.re-image-group__img.is-clickable {
  cursor: zoom-in;
}

.re-image-group__loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
  pointer-events: none;
}

.re-image-group__spinner {
  width: 22px;
  height: 22px;
  border: 2px solid var(--el-border-color-lighter);
  border-top-color: var(--el-color-primary);
  border-radius: 50%;
  animation: re-image-group-spin 0.8s linear infinite;
}

@keyframes re-image-group-spin {
  to {
    transform: rotate(360deg);
  }
}

.re-image-group__error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.re-image-group__empty {
  padding: 24px;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  background: var(--el-fill-color-lighter);
  border-radius: var(--el-border-radius-base);
}
</style>
