<template>
  <div v-show="store.activeWebview" class="browser-preview-placeholder">
    <!-- 浏览器导航栏 -->
    <div class="browser-toolbar">
      <!-- 导航按钮组 -->
      <div class="nav-btn-group">
        <button
          class="nav-btn"
          :title="t('chat.workspace.back')"
          :disabled="!store.canGoBack"
          @click="goBack"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <button
          class="nav-btn"
          :title="t('chat.workspace.forward')"
          :disabled="!store.canGoForward"
          @click="goForward"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
        <button
          class="nav-btn"
          :title="store.isLoading ? t('chat.workspace.stop') : t('chat.workspace.refresh')"
          @click="store.isLoading ? stopLoading() : refresh()"
        >
          <!-- 刷新图标 / 停止图标 -->
          <svg v-if="!store.isLoading" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- 地址栏 -->
      <div class="address-bar-wrapper" :class="{ focused: addressFocused }">
        <svg class="security-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <input
          ref="addressBarRef"
          v-model="addressInput"
          class="address-input"
          type="text"
          :placeholder="t('chat.workspace.inputUrlPlaceholder')"
          autocomplete="none"
          spellcheck="false"
          @focus="addressFocused = true"
          @blur="addressFocused = false"
          @keydown.enter="navigateToUrl"
        />
        <span v-if="store.isLoading" class="loading-spinner"></span>
      </div>

      <!-- 静音切换按钮 -->
      <button class="nav-btn" :title="store.isMuted ? t('chat.workspace.unmute') : t('chat.workspace.mute')" @click="store.toggleMuted()">
        <!-- 静音状态：喇叭带斜线 -->
        <svg v-if="store.isMuted" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <line x1="23" y1="9" x2="17" y2="15"/>
          <line x1="17" y1="9" x2="23" y2="15"/>
        </svg>
        <!-- 非静音状态：喇叭带声波 -->
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
      </button>
    </div>

    <!-- 空壳占位区域：webview 实际覆盖在此区域上方（由 BrowserWebviewLayer 定位） -->
    <div ref="placeholderRef" class="placeholder-body"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBrowserWebviewStore } from '@/stores/browserWebview'

const { t } = useI18n()
const store = useBrowserWebviewStore()

const placeholderRef = ref<HTMLElement>()
const addressBarRef = ref<HTMLInputElement>()
const addressInput = ref('')
const addressFocused = ref(false)

let resizeObserver: ResizeObserver | null = null
let rafId: number | null = null

/**
 * 通过 ResizeObserver + requestAnimationFrame 实时报告占位区域坐标
 */
function updateRect(): void {
  if (rafId !== null) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(() => {
    const el = placeholderRef.value
    if (!el) return
    const rect = el.getBoundingClientRect()
    store.setPreviewRect({
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    })
  })
}

// ── 浏览器导航操作 ──

function goBack(): void {
  const wv = store.activeWebviewEl as ElectronWebviewElement | null
  if (wv && wv.canGoBack) wv.goBack()
}

function goForward(): void {
  const wv = store.activeWebviewEl as ElectronWebviewElement | null
  if (wv && wv.canGoForward) wv.goForward()
}

function refresh(): void {
  const wv = store.activeWebviewEl as ElectronWebviewElement | null
  if (wv) wv.reload()
}

function stopLoading(): void {
  const wv = store.activeWebviewEl as ElectronWebviewElement | null
  if (wv) wv.stop()
}

async function navigateToUrl(): Promise<void> {
  const wv = store.activeWebviewEl as ElectronWebviewElement | null
  if (!wv) return

  let target = addressInput.value.trim()
  if (!target) return

  // URL 格式判断：有协议头或包含域名特征
  if (!/^https?:\/\//.test(target) && !/^file:\/\//.test(target)) {
    if (/\s/.test(target) || !target.includes('.')) {
      // 包含空格或无点号 → 视为搜索
      target = 'https://www.bing.com/search?q=' + encodeURIComponent(target)
    } else {
      target = 'https://' + target
    }
  }

  try {
    await wv.loadURL(target)
  } catch (error) {
    // Chromium may reject loadURL on a redirect or aborted navigation;
    // the webview navigation events remain the source of truth.
    console.warn('浏览器导航请求失败:', error)
  }
  addressBarRef.value?.blur()
}

function close(): void {
  store.setActive(null)
  store.setPreviewRect(null)
}

// ── 监听活跃 webview URL 变化，同步地址栏 ──

watch(
  () => store.activeWebview?.url,
  (url) => {
    // 地址栏未聚焦时自动同步当前 URL
    if (!addressFocused.value) {
      // about: 内部页显示为空，提示用户输入
      addressInput.value = url && !url.startsWith('about:') ? url : ''
    }
  },
)

// 监听活跃窗口变化
watch(
  () => store.activeWindowId,
  async () => {
    if (store.activeWindowId) {
      await nextTick()
      updateRect()
      // 同步地址栏（about: 内部页显示为空）
      const url = store.activeWebview?.url || ''
      addressInput.value = url && !url.startsWith('about:') ? url : ''
    } else {
      store.setPreviewRect(null)
    }
  },
)

onMounted(() => {
  resizeObserver = new ResizeObserver(updateRect)
  if (placeholderRef.value) {
    resizeObserver.observe(placeholderRef.value)
  }
  window.addEventListener('resize', updateRect)
  if (store.activeWindowId) {
    updateRect()
    addressInput.value = store.activeWebview?.url || ''
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  if (rafId !== null) cancelAnimationFrame(rafId)
  window.removeEventListener('resize', updateRect)
  store.setPreviewRect(null)
})
</script>

<style scoped>
/* ============================================================================
   令牌口径（与本批 8 个聊天组件统一）：
   1. 颜色走 --el-*（refactor.css 已把 --el-* 映射到 --color-* 主题层，
      9 套配色换肤时自动跟随）。
   2. 本文件原先用的 --color-text-secondary / --color-hover-bg / --color-bg-primary
      三个名字在全仓（含 public/themes/*.css 与 src/styles/*.css）都**没有任何定义**，
      属于死变量：真正生效的一直是后面的 hex 兜底。这里改判到语义正确的
      --el-* 令牌上，顺手把这三个死名字清掉。
   3. 容器不加投影（koi 规约）；本文件唯一允许的 box-shadow 是键盘焦点环。
   4. 圆角、过渡时长统一取 --el-radius-* / --el-transition-duration 令牌。
   ============================================================================ */

.browser-preview-placeholder {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

/* ── 导航栏 ── */
.browser-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
  height: 36px;
  flex-shrink: 0;
  background: transparent;
  border-bottom: 1px solid var(--el-border-color);
}

/* 导航按钮组 */
.nav-btn-group {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.nav-btn {
  width: 26px;
  height: 26px;
  border: none;
  /* 原值 6px → sm 档 */
  border-radius: var(--el-radius-sm, 6px);
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background-color var(--el-transition-duration-fast, 0.2s) ease,
    color var(--el-transition-duration-fast, 0.2s) ease;
}

/* 键盘焦点环：26px 的裸按钮上默认 outline 太弱，改用主色光环 */
.nav-btn:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.nav-btn:hover:not(:disabled) {
  background: var(--el-fill-color);
}

.nav-btn:active:not(:disabled) {
  background: var(--el-fill-color-dark);
}

.nav-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.dark .nav-btn {
  color: var(--el-text-color-regular);
}

.dark .nav-btn:hover:not(:disabled) {
  background: var(--el-fill-color);
}

/* 危险操作（关闭）：浅红底 + 红字，用 danger 令牌派生 */
.close-btn:hover {
  background: color-mix(in srgb, var(--el-color-danger) 10%, transparent);
  color: var(--el-color-danger);
}

/* 地址栏 */
.address-bar-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 4px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  /* 原值 14px，最近的档位是 lg 12px */
  border-radius: var(--el-radius-lg, 12px);
  padding: 0 10px;
  height: 26px;
  transition:
    border-color var(--el-transition-duration-fast, 0.2s) ease,
    box-shadow var(--el-transition-duration-fast, 0.2s) ease;
}

/* 输入框本身 outline: none，焦点指示上提到包裹层（含点击聚焦，范围更清晰） */
.address-bar-wrapper:focus-within {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.address-bar-wrapper.focused {
  border-color: var(--el-color-primary);
}

.dark .address-bar-wrapper {
  background: var(--el-bg-color);
  border-color: var(--el-border-color);
}

.security-icon {
  width: 11px;
  height: 11px;
  opacity: 0.5;
  flex-shrink: 0;
}

.address-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 12px;
  color: inherit;
  font-family: inherit;
  min-width: 0;
}

.address-input::placeholder {
  opacity: 0.5;
}

/* 加载旋转动画：0.6s 是「转速」不是交互过渡时长，故不取
   --el-transition-duration（那会让加载圈慢到看着像卡住） */
.loading-spinner {
  width: 12px;
  height: 12px;
  border: 1.5px solid var(--el-border-color);
  border-top-color: var(--el-color-primary);
  /* 原值 50%（圆形）→ full 档 */
  border-radius: var(--el-radius-full, 9999px);
  animation: spin 0.6s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 占位主体 */
.placeholder-body {
  flex: 1;
  min-height: 0;
  /* 空壳：webview 会覆盖在此区域上方 */
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .nav-btn,
  .address-bar-wrapper {
    transition: none;
  }
  .loading-spinner {
    animation: none;
  }
}
</style>
