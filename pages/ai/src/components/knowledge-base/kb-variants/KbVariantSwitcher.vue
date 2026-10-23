<script setup lang="ts">
/**
 * 知识库重构 —— 变体切换器（Phase 2 专用，选定后删除）。
 *
 * <p>右下角常驻胶囊，切换时写回 `?variant=` 并派发 `kb-variant-change` 事件，
 * 与模型选择器探索期同一套交互口径，用户无需改代码即可对比五个方向。</p>
 */
import { computed } from 'vue'

const props = defineProps<{
  /** 当前变体 key */
  current: string
}>()

const ITEMS = [
  { key: 'pipeline', label: '流水线' },
  { key: 'atlas', label: '图谱图集' },
  { key: 'ledger', label: '档案台' },
  { key: 'canvas', label: '卡片画布' },
  { key: 'compact', label: '紧凑控制台' },
] as const

const index = computed(() => ITEMS.findIndex((i) => i.key === props.current))

/**
 * 切换变体：同步 URL 后派发事件（预览页监听并重建组件）。
 *
 * @param key 目标变体
 */
function pick(key: string) {
  const url = new URL(window.location.href)
  url.searchParams.set('variant', key)
  history.replaceState(null, '', url)
  window.dispatchEvent(new CustomEvent('kb-variant-change', { detail: key }))
}

/** 键盘：←/→ 循环切换，方便快速比对 */
function onKey(e: KeyboardEvent) {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
  const tag = (e.target as HTMLElement)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return
  const next = (index.value + (e.key === 'ArrowRight' ? 1 : ITEMS.length - 1)) % ITEMS.length
  pick(ITEMS[next].key)
}

window.addEventListener('keydown', onKey)
</script>

<template>
  <div class="kbs" role="tablist" aria-label="知识库设计方向">
    <button
      v-for="it in ITEMS"
      :key="it.key"
      type="button"
      role="tab"
      class="kbs__item"
      :class="{ 'is-active': current === it.key }"
      :aria-selected="current === it.key"
      @click="pick(it.key)"
    >{{ it.label }}</button>
  </div>
</template>

<style scoped>
.kbs {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 5000;
  display: flex;
  gap: 2px;
  padding: 4px;
  background: color-mix(in srgb, var(--bg-container, #fff) 88%, transparent);
  backdrop-filter: blur(12px) saturate(160%);
  -webkit-backdrop-filter: blur(12px) saturate(160%);
  border: 1px solid var(--border-default, #e3e6ef);
  border-radius: var(--el-radius-full, 9999px);
  box-shadow: var(--shadow-lg, 0 8px 24px rgba(15, 18, 33, 0.12));
}

.kbs__item {
  appearance: none;
  border: 0;
  background: none;
  cursor: pointer;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  color: var(--text-secondary, #5c6270);
  border-radius: var(--el-radius-full, 9999px);
  transition: background-color 150ms var(--ease-out, ease-out), color 150ms var(--ease-out, ease-out);
}

.kbs__item:hover {
  color: var(--text-primary, #1f2430);
  background: var(--bg-hover, #f1f5fb);
}

.kbs__item.is-active {
  color: var(--text-inverse, #fff);
  background: var(--brand-600, #2563eb);
}

.kbs__item:focus-visible {
  outline: 2px solid var(--brand-500, #3b82f6);
  outline-offset: 2px;
}

html.dark .kbs {
  background: color-mix(in srgb, var(--bg-container, #1a1d27) 88%, transparent);
  border-color: var(--border-default, rgba(255, 255, 255, 0.12));
}

@media (max-width: 640px) {
  .kbs {
    right: 10px;
    bottom: 10px;
    max-width: calc(100vw - 20px);
    overflow-x: auto;
  }

  .kbs__item {
    padding: 6px 9px;
    font-size: 11px;
    white-space: nowrap;
  }
}
</style>
