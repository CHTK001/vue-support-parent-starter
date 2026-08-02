<template>
  <div ref="root" class="re-image" :class="{ 'is-loaded': loaded, 'is-error': error }">
    <img
      v-if="!error"
      :src="src"
      :alt="alt"
      :style="imgStyle"
      :class="['re-image__img', { 'is-clickable': preview }]"
      @load="handleLoad"
      @error="handleError"
      @click="handlePreview"
    />
    <div v-else class="re-image__error">
      <span class="re-image__error-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M2 25V3h20v22H2zm2-2h16V5H4v18z" />
          <path d="M7.5 11.5l3-3 3 3 3-3 3 3" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
        </svg>
      </span>
      <span class="re-image__error-text">{{ fallbackText }}</span>
    </div>
    <div v-if="loading && !loaded && !error" class="re-image__loading">
      <div class="re-image__spinner" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ReImage —— 图片组件
 *
 * 基于 viewerjs，支持预览、懒加载、错误处理、加载占位
 *   <ReImage src="url" :preview="true" />
 */
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import Viewer from "viewerjs";

interface Props {
  /** 图片地址 */
  src: string;
  /** alt */
  alt?: string;
  /** 宽度 */
  width?: string | number;
  /** 高度 */
  height?: string | number;
  /** 圆角 */
  radius?: string | number;
  /** 对象适配 */
  fit?: "fill" | "contain" | "cover" | "none" | "scale-down";
  /** 是否可点击预览 */
  preview?: boolean;
  /** 预览图片列表（多图预览） */
  previewList?: string[];
  /** 是否懒加载 */
  lazy?: boolean;
  /** 显示加载占位 */
  loading?: boolean;
  /** 加载失败文案 */
  fallbackText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  alt: "",
  fit: "cover",
  preview: true,
  lazy: false,
  loading: true,
  fallbackText: "加载失败",
});

const root = ref<HTMLElement | null>(null);
const loaded = ref(false);
const error = ref(false);
let viewerInstance: Viewer | null = null;

const imgStyle = computed(() => ({
  width: typeof props.width === "number" ? `${props.width}px` : props.width ?? "100%",
  height: typeof props.height === "number" ? `${props.height}px` : props.height ?? "auto",
  borderRadius: typeof props.radius === "number" ? `${props.radius}px` : props.radius,
  objectFit: props.fit,
}));

const handleLoad = () => {
  loaded.value = true;
  error.value = false;
};

const handleError = () => {
  loaded.value = false;
  error.value = true;
};

const handlePreview = () => {
  if (!props.preview || !root.value) return;
  if (viewerInstance) {
    viewerInstance.show();
    return;
  }
  viewerInstance = new Viewer(root.value, {
    url: (img: HTMLImageElement) => img.src,
    hidden: () => {
      viewerInstance?.destroy();
      viewerInstance = null;
    },
  });
  viewerInstance.show();
};

onMounted(() => {
  if (props.lazy && "loading" in HTMLImageElement.prototype) {
    const img = root.value?.querySelector("img");
    if (img) {
      img.loading = "lazy";
    }
  }
});

onBeforeUnmount(() => {
  if (viewerInstance) {
    viewerInstance.destroy();
    viewerInstance = null;
  }
});

watch(
  () => props.src,
  () => {
    loaded.value = false;
    error.value = false;
  },
);
</script>

<style scoped>
.re-image {
  position: relative;
  display: inline-block;
  overflow: hidden;
  background: var(--el-fill-color-light);
}

.re-image__img {
  display: block;
  transition: opacity 0.3s ease;
  opacity: 0;
}

.re-image.is-loaded .re-image__img {
  opacity: 1;
}

.re-image__img.is-clickable {
  cursor: zoom-in;
}

.re-image__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 100px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter);
}

.re-image__error-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.5;
}

.re-image__error-icon svg {
  width: 100%;
  height: 100%;
}

.re-image__error-text {
  margin-top: 8px;
  font-size: 12px;
}

.re-image__loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
}

.re-image__spinner {
  width: 28px;
  height: 28px;
  border: 2px solid var(--el-border-color-lighter);
  border-top-color: var(--el-color-primary);
  border-radius: 50%;
  animation: re-image-spin 0.8s linear infinite;
}

@keyframes re-image-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
