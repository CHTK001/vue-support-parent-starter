<!--
  内置浏览器的「独立宿主」（用户口径 2026-11-13 第 4 条）。

  <p>浏览器原先只能画在工作区侧栏给的位置里，所以点「内置浏览器」必然把工作区
  带出来。这个组件提供一个不依赖侧栏的宿主：在视口中央画一个带标题栏的浮层，
  把 rect 交给 BrowserWebviewLayer，webview 就落在这里。</p>

  <p>工作区打开时不需要它（侧栏自己会 setPreviewRect），关闭浮层即恢复。</p>
-->
<template>
  <div v-if="visible" class="bsh-root">
    <div class="bsh-backdrop" @click="closeBrowser" />
    <div class="bsh-frame" :style="frameStyle" />
    <div class="bsh-bar" :style="barStyle">
      <span class="bsh-title" :title="title">{{ title }}</span>
      <button type="button" class="bsh-close" aria-label="关闭内置浏览器" @click="closeBrowser">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useBrowserWebviewStore } from '@/stores/browserWebview'

const store = useBrowserWebviewStore()
const visible = computed(() => store.standalone && !!store.activeWindowId)

const FRAME_W = 1120
const FRAME_H = 780
const BAR_H = 40

function frameRect(): { x: number; y: number; width: number; height: number } {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const width = Math.min(FRAME_W, Math.max(520, Math.round(vw * 0.84)))
  const height = Math.min(FRAME_H, Math.max(360, Math.round(vh * 0.8)))
  const x = Math.round((vw - width) / 2)
  const y = Math.round((vh - height) / 2)
  return { x, y, width, height }
}

const rect = ref(frameRect())
const frameStyle = computed(() => ({
  left: `${rect.value.x}px`,
  top: `${rect.value.y}px`,
  width: `${rect.value.width}px`,
  height: `${rect.value.height}px`,
}))
const barStyle = computed(() => ({
  left: `${rect.value.x}px`,
  top: `${rect.value.y}px`,
  width: `${rect.value.width}px`,
  height: `${BAR_H}px`,
}))

/** 把 webview 的位置让给浮层：标题栏以下才是页面区域 */
function applyRect(): void {
  const r = frameRect()
  rect.value = r
  store.setPreviewRect({ x: r.x, y: r.y + BAR_H, width: r.width, height: r.height - BAR_H })
}

const title = computed(() => {
  const wv = store.webviews.get(store.activeWindowId || '')
  return wv?.title || wv?.url || '内置浏览器'
})

function closeBrowser(): void {
  store.setStandalone(false)
  store.setPreviewRect(null)
  store.setActive(null)
}

function onResize(): void {
  applyRect()
  // rect 是普通对象，重算后需要触发布局：用一次 nextTick 重设 previewRect 即可
  void nextTick(applyRect)
}

watch(visible, (on) => {
  if (on) {
    void nextTick(applyRect)
    window.addEventListener('resize', onResize)
  } else {
    window.removeEventListener('resize', onResize)
    store.setPreviewRect(null)
  }
}, { immediate: true })

onMounted(() => { if (visible.value) void nextTick(applyRect) })
onBeforeUnmount(() => window.removeEventListener('resize', onResize))
</script>

<style scoped>
.bsh-backdrop {
  position: fixed;
  inset: 0;
  z-index: 38;
  background: color-mix(in srgb, var(--color-overlay, #0f172a) 32%, transparent);
}

.bsh-frame {
  position: fixed;
  z-index: 39;
  pointer-events: none;
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--el-box-shadow-dark);
  background: var(--el-bg-color-overlay);
}

.bsh-bar {
  position: fixed;
  z-index: 45;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 10px 0 14px;
  border-radius: var(--radius-lg, 12px) var(--radius-lg, 12px) 0 0;
  background: var(--el-bg-color-overlay);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.bsh-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12.5px;
  color: var(--el-text-color-regular);
}

.bsh-close {
  flex: none;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}

.bsh-close:hover {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}
</style>
