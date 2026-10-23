<template>
  <!-- 设计探索期切换器：右下角浮动胶囊。
       只在 DEV 下渲染，Phase 3 会整体删除。 -->
  <div v-if="visible" class="dv-switch" role="group" aria-label="设计变体切换">
    <button
      v-for="v in VARIANTS"
      :key="v.key"
      type="button"
      class="dv-switch__btn"
      :class="{ 'is-on': current === v.key }"
      :title="v.desc"
      :aria-pressed="current === v.key"
      @click="pick(v.key)"
    >
      <span class="dv-switch__dot" :data-v="v.key" />
      {{ v.label }}
    </button>
    <button type="button" class="dv-switch__toggle" :title="collapsed ? '展开' : '收起'" @click="collapsed = !collapsed">
      {{ collapsed ? '▾' : '▴' }}
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * 全站美化变体切换器（设计探索临时组件 — Phase 3 删除）。
 *
 * <p>切换方式：写 `data-dv` 到 &lt;html&gt;，配套样式在 styles/design-variants/*.css，
 * 全部由 html[data-dv="…"] 限定作用域，因此「不选」（original）就是改动前原样。</p>
 *
 * <p>也支持键盘 `[` / `]` 前后切换，方便截图对比。</p>
 */
import { onMounted, onUnmounted, ref } from 'vue'

interface VariantItem {
  key: string
  label: string
  desc: string
}

const VARIANTS: VariantItem[] = [
  { key: 'original', label: '原样', desc: '不做任何改动（对照组）' },
  { key: 'console', label: 'Console', desc: '固定工具条 + 描边卡片 + 紧凑密度' },
  { key: 'brief', label: 'Brief', desc: '大标题 + 行动式说明 + 引导式空态' },
  { key: 'metrics', label: 'Metrics', desc: '大号等宽数字优先，表格降级' },
  { key: 'workspace', label: 'Workspace', desc: '主区 + 右侧上下文侧栏' },
  { key: 'calm', label: 'Calm', desc: '去边框去阴影，只靠留白与字重' },
]

const STORAGE_KEY = 'dv-preview-variant'
const visible = ref(import.meta.env.DEV)
const collapsed = ref(false)
const current = ref('original')
/** 监听 <html data-dv> 的外部变更（截图脚本会直接改属性） */
let observer: MutationObserver | null = null

function apply(key: string): void {
  const root = document.documentElement
  if (key === 'original') {
    root.removeAttribute('data-dv')
  } else {
    root.setAttribute('data-dv', key)
  }
}

function pick(key: string): void {
  current.value = key
  apply(key)
  try {
    localStorage.setItem(STORAGE_KEY, key)
  } catch {
    /* 忽略：无痕模式下不可写 */
  }
}

function step(delta: number): void {
  const i = VARIANTS.findIndex((v) => v.key === current.value)
  const next = (i + delta + VARIANTS.length) % VARIANTS.length
  pick(VARIANTS[next].key)
}

function onKey(e: KeyboardEvent): void {
  // 输入中或带修饰键时不抢键
  const t = e.target as HTMLElement | null
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
  if (e.metaKey || e.ctrlKey || e.altKey) return
  if (e.key === '[') {
    e.preventDefault()
    step(-1)
  } else if (e.key === ']') {
    e.preventDefault()
    step(1)
  }
}

onMounted(() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && VARIANTS.some((v) => v.key === saved)) pick(saved)
  } catch {
    /* 忽略 */
  }
  window.addEventListener('keydown', onKey)
  // 外部（截图脚本 / 控制台）直接改 <html data-dv> 时，让高亮跟着同步
  observer = new MutationObserver(() => {
    const attr = document.documentElement.getAttribute('data-dv') || 'original'
    if (attr !== current.value) current.value = attr
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-dv'] })
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  observer?.disconnect()
})

// 说明：不 watch current 回写 data-dv —— pick() 已经写过一次，
// 再加 watch 会和 MutationObserver 形成回环（外部改 → current → watch → 再写）。
</script>

<style scoped>
.dv-switch {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 9000;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.88);
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 28px rgba(15, 23, 42, 0.28);
}

.dv-switch__btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgba(255, 255, 255, 0.72);
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  transition: background 140ms ease, color 140ms ease;
  white-space: nowrap;
}

.dv-switch__btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.dv-switch__btn.is-on {
  background: #fff;
  color: #0f172a;
}

.dv-switch__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.55;
}

.dv-switch__btn.is-on .dv-switch__dot {
  opacity: 1;
  background: #2563eb;
}

.dv-switch__toggle {
  padding: 4px 7px;
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
  cursor: pointer;
}

.dv-switch__toggle:hover {
  color: #fff;
}

@media (max-width: 760px) {
  .dv-switch {
    left: 10px;
    right: 10px;
    bottom: 10px;
    overflow-x: auto;
    justify-content: flex-start;
  }
}
</style>

