<template>
  <div class="sc-image-wrapper" :class="wrapperClass" @click="handlePreview">
    <el-image
      v-bind="$attrs"
      :src="src"
      :fit="fit"
      :loading="loading"
      :lazy="lazy"
      :scroll-container="scrollContainer"
      :preview-src-list="previewDisabled ? [] : computedPreviewList"
      :initial-index="initialIndex"
      :close-on-press-escape="closeOnPressEscape"
      :z-index="zIndex"
      :preview-teleported="previewTeleported"
      :hide-on-click-modal="hideOnClickModal"
      class="sc-image"
      @load="handleLoad"
      @error="handleError"
    >
      <template v-if="$slots.placeholder" #placeholder>
        <slot name="placeholder" />
      </template>
      <template v-else #placeholder>
        <div class="sc-image-placeholder">
          <IconifyIconOnline :icon="placeholderIcon" class="placeholder-icon" />
          <span v-if="placeholderText" class="placeholder-text">{{ placeholderText }}</span>
        </div>
      </template>

      <template v-if="$slots.error" #error>
        <slot name="error" />
      </template>
      <template v-else #error>
        <div class="sc-image-error">
          <IconifyIconOnline :icon="errorIcon" class="error-icon" />
          <span v-if="errorText" class="error-text">{{ errorText }}</span>
        </div>
      </template>

      <template v-if="$slots.viewer" #viewer>
        <slot name="viewer" />
      </template>
    </el-image>

    <!-- 图片遮罩层 -->
    <div v-if="showMask" class="sc-image-mask">
      <div class="mask-actions">
        <IconifyIconOnline v-if="!previewDisabled" icon="ep:zoom-in" class="mask-icon" @click.stop="handlePreview" />
        <IconifyIconOnline v-if="downloadable" icon="ep:download" class="mask-icon" @click.stop="handleDownload" />
      </div>
    </div>

    <!-- 海报模式装饰 -->
    <div v-if="theme === 'poster'" class="sc-image-poster-frame" />
  </div>
</template>

<script setup lang="ts">
/**
 * ScImage 图片组件
 * 封装 el-image，支持 PhotoSwipe 预览和多种主题
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */
import { ref, computed, onMounted, onUnmounted } from "vue";
import type { ImageFit } from "element-plus";
import PhotoSwipeLightbox from "photoswipe/lightbox";
import "photoswipe/style.css";

const props = withDefaults(
  defineProps<{
    /** 图片源 */
    src?: string;
    /** 图片填充模式 */
    fit?: ImageFit;
    /** 加载状态 */
    loading?: "eager" | "lazy";
    /** 是否懒加载 */
    lazy?: boolean;
    /** 滚动容器 */
    scrollContainer?: string | HTMLElement;
    /** 预览图片列表 */
    previewSrcList?: string[];
    /** 初始预览索引 */
    initialIndex?: number;
    /** ESC 关闭预览 */
    closeOnPressEscape?: boolean;
    /** z-index */
    zIndex?: number;
    /** 预览是否插入 body */
    previewTeleported?: boolean;
    /** 点击遮罩关闭 */
    hideOnClickModal?: boolean;
    /** 禁用预览 */
    previewDisabled?: boolean;
    /** 默认占位图标 */
    placeholderIcon?: string;
    /** 占位文本 */
    placeholderText?: string;
    /** 错误图标 */
    errorIcon?: string;
    /** 错误文本 */
    errorText?: string;
    /** 是否显示遮罩 */
    showMask?: boolean;
    /** 是否可下载 */
    downloadable?: boolean;
    /** 主题 */
    theme?: "default" | "poster" | "card" | "avatar";
    /** 使用 PhotoSwipe */
    usePhotoSwipe?: boolean;
    /** PhotoSwipe 配置 */
    photoSwipeOptions?: any;
  }>(),
  {
    src: "",
    fit: "cover",
    loading: "lazy",
    lazy: false,
    previewSrcList: () => [],
    initialIndex: 0,
    closeOnPressEscape: true,
    zIndex: 2000,
    previewTeleported: true,
    hideOnClickModal: false,
    previewDisabled: false,
    placeholderIcon: "ep:picture",
    placeholderText: "加载中...",
    errorIcon: "ep:picture-filled",
    errorText: "加载失败",
    showMask: true,
    downloadable: true,
    theme: "default",
    usePhotoSwipe: true,
    photoSwipeOptions: () => ({})
  }
);

const emit = defineEmits<{
  load: [event: Event];
  error: [event: Event];
  preview: [];
  download: [];
}>();

let lightbox: PhotoSwipeLightbox | null = null;

const wrapperClass = computed(() => [
  `sc-image-wrapper--${props.theme}`,
  {
    "sc-image-wrapper--mask": props.showMask
  }
]);

const computedPreviewList = computed(() => {
  if (props.previewSrcList.length > 0) {
    return props.previewSrcList;
  }
  return props.src ? [props.src] : [];
});

/**
 * 初始化 PhotoSwipe
 */
function initPhotoSwipe(): void {
  if (!props.usePhotoSwipe || props.previewDisabled) return;

  lightbox = new PhotoSwipeLightbox({
    gallery: ".sc-image-wrapper",
    children: ".sc-image",
    pswpModule: () => import("photoswipe"),
    ...props.photoSwipeOptions
  });

  lightbox.init();
}

/**
 * 销毁 PhotoSwipe
 */
function destroyPhotoSwipe(): void {
  if (lightbox) {
    lightbox.destroy();
    lightbox = null;
  }
}

function handleLoad(event: Event): void {
  emit("load", event);
}

function handleError(event: Event): void {
  emit("error", event);
}

function handlePreview(): void {
  if (!props.previewDisabled) {
    emit("preview");
  }
}

function handleDownload(): void {
  if (props.src) {
    const link = document.createElement("a");
    link.href = props.src;
    link.download = props.src.split("/").pop() || "image";
    link.click();
    emit("download");
  }
}

onMounted(() => {
  if (props.usePhotoSwipe) {
    initPhotoSwipe();
  }
});

onUnmounted(() => {
  destroyPhotoSwipe();
});
</script>

<style lang="scss" scoped>
.sc-image-wrapper {
  position: relative;
  display: inline-block;
  border-radius: 4px;
  overflow: hidden;

  &--poster {
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);

    &::after {
      content: "";
      position: absolute;
      inset: 0;
      border: 8px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      pointer-events: none;
    }
  }

  &--card {
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    transition: all 0.3s;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
    }
  }

  &--avatar {
    border-radius: 50%;
    overflow: hidden;
  }

  &--mask:hover {
    .sc-image-mask {
      opacity: 1;
    }
  }
}

.sc-image {
  display: block;
  width: 100%;
  height: 100%;
}

.sc-image-placeholder,
.sc-image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);

  .placeholder-icon,
  .error-icon {
    font-size: 48px;
    margin-bottom: 8px;
  }

  .placeholder-text,
  .error-text {
    font-size: 12px;
  }
}

.sc-image-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;

  .mask-actions {
    display: flex;
    gap: 16px;
  }

  .mask-icon {
    font-size: 24px;
    color: white;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      transform: scale(1.2);
    }
  }
}

.sc-image-poster-frame {
  position: absolute;
  inset: -4px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  pointer-events: none;
}
</style>
