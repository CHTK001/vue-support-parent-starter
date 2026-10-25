<script setup lang="ts">
/**
 * 设计探索独立预览页（Phase 2 专用，选定后删除）。
 *
 * <p><b>为什么单独一页：</b>把变体挂在真实的 ChatInput 里跑，会继承聊天页的
 * 几十个 watcher / 接口轮询；后端未启动时那套副作用会让 ChatInput 抛
 * "Maximum recursive updates exceeded"，连变体都渲染不出来，没法做视觉评审。
 * 这里只挂变体容器 + 切换器，路由 `preview/models?variant=`，不依赖登录与后端。</p>
 *
 * <p>令牌口径：预览页外壳同样只用 koi 体系变量（--bg-page / --text-* / --radius-*）。</p>
 */
import { onUnmounted, ref } from 'vue'
import ModelSelectorPanel from '@/components/chat/chat-input/ModelSelectorPanel.vue'

type VariantKey = 'catalog' | 'briefing' | 'terminal' | 'aurora' | 'ledger'
const VARIANTS = ['catalog', 'briefing', 'terminal', 'aurora', 'ledger'] as const

const initial = (new URLSearchParams(window.location.search).get('variant') || 'catalog') as VariantKey
const variant = ref<VariantKey>((VARIANTS as readonly string[]).includes(initial) ? initial : 'catalog')

function onChange(e: Event) {
  const key = (e as CustomEvent<string>).detail as VariantKey
  if ((VARIANTS as readonly string[]).includes(key)) variant.value = key
}

// 切换器通过 window 事件驱动（与面板内的监听口径一致）
window.addEventListener('mvp-variant-change', onChange)
onUnmounted(() => window.removeEventListener('mvp-variant-change', onChange))
</script>

<template>
  <div class="mvp-preview">
    <header class="mvp-preview__bar">
      <span class="mvp-preview__title">模型选择器 · 设计探索</span>
      <span class="mvp-preview__hint">图标（需求 1）· 悬停详情（需求 2）· koi 变量（需求 3）</span>
    </header>

    <main class="mvp-preview__stage">
      <div class="mvp-preview__card" :class="`mvp-preview__card--${variant}`">
        <ModelSelectorPanel
          :visible="false"
          :anchor-el="null"
          :models="[]"
          :providers="[]"
          :current-model-id="null"
          inline-stage
          :key="variant"
        />
      </div>
    </main>
  </div>
</template>

<style scoped>
.mvp-preview {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-page, #f6f7fb);
  color: var(--text-primary, #1f2430);
  font-family: 'KoiFont', Inter, 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.mvp-preview__bar {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border-default, #e3e6ef);
  background: var(--bg-container, #fff);
}

.mvp-preview__title {
  font-size: 14px;
  font-weight: 600;
}

.mvp-preview__hint {
  font-size: 12px;
  color: var(--text-tertiary, #8b8f9c);
}

.mvp-preview__stage {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 32px 16px 96px;
}

.mvp-preview__card {
  width: 480px;
  max-width: 100%;
  max-height: calc(100vh - 160px);
  /* 不要用 flex 容器：子项 .mvp 会塌成 0 高，卡片只剩边框 */
  /* 变体内容滚动，卡片本身保持圆角裁切 */
  overflow: auto;
  background: var(--bg-container, #fff);
  border: 1px solid var(--border-default, #e3e6ef);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--shadow-lg, 0 8px 24px rgba(15, 18, 33, 0.08));
}

/* 终端变体自带深底：外层同色，避免白框包深块 */
.mvp-preview__card--terminal {
  background: var(--terminal-bg, #0d1117);
  border-color: rgba(255, 255, 255, 0.08);
}

/* 账本变体需要更宽：左右双栏（必须排在基础 width 之后，否则被 480 覆盖） */
.mvp-preview__card--ledger {
  width: 720px;
  max-height: calc(100vh - 200px);
}

html.dark .mvp-preview {
  background: var(--bg-page, #0f1117);
}
html.dark .mvp-preview__bar,
html.dark .mvp-preview__card {
  background: var(--bg-container, #1a1d27);
  border-color: var(--border-default, rgba(255, 255, 255, 0.12));
}
html.dark .mvp-preview__card--terminal {
  background: var(--terminal-bg, #0d1117);
}
</style>




