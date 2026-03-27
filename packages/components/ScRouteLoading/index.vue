<template>
  <!-- 路由加载时保持 HTML loader 可见，不额外渲染 -->
  <!-- 开发环境切换器 -->
  <div v-if="isDev && showDevSwitcher" class="dev-loader-switch">
    <div class="trigger" title="加载动画预览" @click="showPanel = !showPanel">⚙️</div>
    <div v-if="showPanel" class="panel">
      <div class="panel-header">
        <span class="panel-title">加载动画预览</span>
        <span class="panel-desc">选择加载动画样式</span>
      </div>
      <div class="panel-body">
        <div v-for="style in loaderStyles" :key="style.key" class="style-option" :class="{ active: currentStyle === style.key }" @click="changeStyle(style.key)">
          <div class="preview-mini">
            <div class="loader-preview-inner" :style="getPreviewScaleStyle(style.previewScale)" v-html="renderLoaderPreviewMarkup(style.key)" />
          </div>
          <div class="style-copy">
            <span class="style-name">{{ style.name }}</span>
            <span class="style-desc">{{ style.description }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ScRouteLoading - 路由加载动画组件
 *
 * 统一使用 HTML loader，不再额外渲染加载动画
 * 仅在开发环境提供样式切换器
 */
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { getLoaderStyleEntries, LOADER_APP_CONTAINER_ID, LOADER_APP_STYLE_ID, LOADER_APP_STYLE_TEXT, LOADER_PREVIEW_STYLE_TEXT, renderLoaderMarkup, renderLoaderPreviewMarkup } from "./loader-manager";

interface Props {
  showDevSwitcher?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showDevSwitcher: true
});

const isDev = import.meta.env.DEV;
const router = useRouter();
const showPanel = ref(false);
const currentStyle = ref(localStorage.getItem("sys-loader-style") || "default");
const loaderStyles = getLoaderStyleEntries();

let previewStyleTag: HTMLStyleElement | null = null;
let removeBeforeEach: (() => void) | undefined;
let removeAfterEach: (() => void) | undefined;

const ensureStyleTag = (id: string, cssText: string) => {
  if (typeof document === "undefined") {
    return null;
  }

  let styleTag = document.getElementById(id) as HTMLStyleElement | null;
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = id;
    document.head.appendChild(styleTag);
  }

  if (styleTag.textContent !== cssText) {
    styleTag.textContent = cssText;
  }

  return styleTag;
};

const ensureHTMLLoader = () => {
  if (typeof document === "undefined") {
    return null;
  }

  ensureStyleTag(LOADER_APP_STYLE_ID, LOADER_APP_STYLE_TEXT);

  let loaderEl = document.getElementById(LOADER_APP_CONTAINER_ID) as HTMLDivElement | null;

  if (!loaderEl) {
    loaderEl = document.createElement("div");
    loaderEl.id = LOADER_APP_CONTAINER_ID;
    document.body.appendChild(loaderEl);
  }

  loaderEl.className = "";
  loaderEl.innerHTML = renderLoaderMarkup(currentStyle.value);
  return loaderEl;
};

const getPreviewScaleStyle = (scale = 1) => ({
  "--loader-preview-scale": String(scale)
});

const changeStyle = (key: string) => {
  currentStyle.value = key;
  localStorage.setItem("sys-loader-style", key);

  const loaderEl = document.getElementById(LOADER_APP_CONTAINER_ID);
  if (loaderEl) {
    loaderEl.innerHTML = renderLoaderMarkup(key);
  }

  // 提示用户刷新页面
  if (window.confirm("加载样式已更改，需要刷新页面才能生效。是否立即刷新？")) {
    window.location.reload();
  }
};

// 路由守卫：显示/隐藏 HTML loader
const showHTMLLoader = () => {
  const loaderEl = ensureHTMLLoader();
  if (loaderEl) {
    loaderEl.style.display = "flex";
  }
};

const hideHTMLLoader = () => {
  const loaderEl = document.getElementById(LOADER_APP_CONTAINER_ID);
  if (loaderEl) {
    loaderEl.style.display = "none";
  }
};

onMounted(async () => {
  previewStyleTag = ensureStyleTag("route-loader-preview-style", LOADER_PREVIEW_STYLE_TEXT);

  // 初始加载时显示 loader
  showHTMLLoader();

  try {
    await router.isReady();
    hideHTMLLoader();
  } catch (error) {
    console.error("[ScRouteLoading] 路由准备失败:", error);
    hideHTMLLoader();
  }

  // 路由守卫
  removeBeforeEach = router.beforeEach(() => {
    showHTMLLoader();
    return true;
  });

  removeAfterEach = router.afterEach(() => {
    hideHTMLLoader();
  });
});

onUnmounted(() => {
  removeBeforeEach?.();
  removeAfterEach?.();

  if (previewStyleTag?.parentNode) {
    previewStyleTag.parentNode.removeChild(previewStyleTag);
  }
  previewStyleTag = null;
});

defineExpose({
  show: showHTMLLoader,
  hide: hideHTMLLoader
});
</script>

<style scoped>
.dev-loader-switch {
  position: fixed;
  bottom: 20px;
  right: 80px;
  z-index: 99999;
}

.trigger {
  width: 40px;
  height: 40px;
  background: rgba(15, 23, 42, 0.7);
  color: #f9fafb;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  backdrop-filter: blur(10px);
  box-shadow:
    0 6px 18px rgba(15, 23, 42, 0.55),
    0 0 0 1px rgba(148, 163, 184, 0.65);
  transition: all 0.25s ease;
  user-select: none;
}

.trigger:hover {
  background: rgba(15, 23, 42, 0.92);
  transform: translateY(-2px) rotate(90deg);
  box-shadow:
    0 12px 30px rgba(15, 23, 42, 0.75),
    0 0 0 1px rgba(148, 163, 184, 0.85);
}

.panel {
  position: absolute;
  bottom: 52px;
  right: 0;
  width: 320px;
  max-width: 90vw;
  border-radius: 18px;
  background: radial-gradient(circle at top left, rgba(148, 163, 184, 0.18), transparent), rgba(15, 23, 42, 0.95);
  box-shadow:
    0 20px 50px rgba(15, 23, 42, 0.9),
    0 0 0 1px rgba(148, 163, 184, 0.7);
  color: #e5e7eb;
  padding: 10px 12px 12px;
  backdrop-filter: blur(20px);
  animation: slide-up 0.2s ease-out;
}

.panel-header {
  display: flex;
  flex-direction: column;
  padding: 4px 8px 6px;
  border-bottom: 1px solid rgba(55, 65, 81, 0.85);
  margin-bottom: 8px;
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
}

.panel-desc {
  margin-top: 2px;
  font-size: 11px;
  color: #9ca3af;
}

.panel-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px;
}

.style-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(31, 41, 55, 0.5);
  border: 1px solid rgba(55, 65, 81, 0.8);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.style-option:hover {
  background: rgba(31, 41, 55, 0.8);
  border-color: rgba(64, 110, 235, 0.6);
  transform: translateX(4px);
}

.style-option.active {
  background: rgba(64, 110, 235, 0.2);
  border-color: #406eeb;
}

.preview-mini {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  flex-shrink: 0;
}

.loader-preview-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  transform: scale(var(--loader-preview-scale, 1));
  transform-origin: center;
}

.style-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.style-name {
  font-size: 13px;
  font-weight: 500;
}

.style-desc {
  margin-top: 2px;
  font-size: 11px;
  color: #9ca3af;
  line-height: 1.4;
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
