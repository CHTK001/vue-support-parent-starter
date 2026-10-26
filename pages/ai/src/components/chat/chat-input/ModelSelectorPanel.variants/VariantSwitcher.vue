<script setup lang="ts">
/**
 * 设计探索浮动切换器（仅 Phase 2 使用，选定后删除）。
 * 右下角悬浮：5 个变体 pill，点击 dispatch 自定义事件 + 同步 URL。
 */
import { ref } from 'vue'

const props = defineProps<{
  current: string
}>()

const VARIANTS: Array<{ key: string; label: string; hint: string }> = [
  { key: 'catalog', label: '名录', hint: '对账式三栏列表' },
  { key: 'briefing', label: '简报', hint: '卡片网格 + 价格胶囊' },
  { key: 'terminal', label: '终端', hint: '等宽深色控制台式' },
  { key: 'aurora', label: '极光', hint: '渐变图标 + 毛玻璃' },
  { key: 'ledger', label: '账本', hint: '左选右看常驻双栏' },
]

function pick(key: string) {
  if (key === props.current) return
  const url = new URL(window.location.href)
  url.searchParams.set('variant', key)
  window.history.replaceState(null, '', url.toString())
  window.dispatchEvent(new CustomEvent('mvp-variant-change', { detail: key }))
}
</script>

<template>
  <div class="mvp-switcher" role="tablist">
    <button
      v-for="v in VARIANTS"
      :key="v.key"
      type="button"
      class="mvp-switcher__item"
      :class="{ 'is-active': props.current === v.key }"
      :aria-selected="props.current === v.key"
      :title="v.hint"
      role="tab"
      @click="pick(v.key)"
    >
      <span class="mvp-switcher__dot"></span>
      {{ v.label }}
    </button>
  </div>
</template>

<style scoped>
/* 令牌口径：全部走 koi 体系（--brand-* / --bg-* / --text-* / --border-* / --radius-* / --shadow-*），
   带 --el-* 兜底，koi 与 default 主题下都不裸奔。 */
.mvp-switcher {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 4000;
  display: flex;
  gap: 4px;
  padding: 6px;
  background: color-mix(in srgb, var(--bg-elevated, var(--el-bg-color-overlay, #fff)) 85%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-default, var(--el-border-color-lighter, #e3e6ef));
  border-radius: var(--el-radius-full, 9999px);
  box-shadow: var(--shadow-md, 0 4px 12px rgba(15, 18, 33, 0.06));
}

.mvp-switcher__item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border: none;
  border-radius: var(--el-radius-full, 9999px);
  background: transparent;
  color: var(--text-secondary, var(--el-text-color-secondary, #5c6270));
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.mvp-switcher__item:hover {
  background: var(--bg-hover, var(--el-fill-color-light, #f5f7fa));
  color: var(--text-primary, var(--el-text-color-primary, #1f2430));
}

.mvp-switcher__item.is-active {
  background: var(--brand-500, var(--el-color-primary, #6d5dfc));
  color: var(--text-inverse, #fff);
}

.mvp-switcher__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.5;
}

.mvp-switcher__item.is-active .mvp-switcher__dot {
  opacity: 1;
}
</style>
