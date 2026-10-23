<script setup lang="ts">
/**
 * 知识库重构 —— 独立预览页（Phase 2 专用，选定后删除）。
 *
 * <p><b>为什么要单独一页</b>：真实知识库页 {@code KnowledgeBasePage} 在 onMounted 里依赖
 * RAG 后端（{@code /v2/rag/status}、{@code fetchKnowledgeBases}、{@code loadOverview}），
 * 后端不可用时整页是「RAG 未配置」门禁，变体根本渲染不出来。本页只挂变体组件 +
 * mock 数据，路由 {@code /preview/knowledge-base?variant=}，不依赖登录与后端。</p>
 *
 * <p>外壳刻意做成「应用内容区」的尺寸（带系统顶栏占位的高），以便判断变体在真实
 * 可用高度下是否出现溢出/挤压。所有外壳颜色走 koi 令牌。</p>
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import KbVariantSwitcher from '@/components/knowledge-base/kb-variants/KbVariantSwitcher.vue'
import PipelineVariant from '@/components/knowledge-base/kb-variants/PipelineVariant.vue'
import AtlasVariant from '@/components/knowledge-base/kb-variants/AtlasVariant.vue'
import LedgerVariant from '@/components/knowledge-base/kb-variants/LedgerVariant.vue'
import CanvasVariant from '@/components/knowledge-base/kb-variants/CanvasVariant.vue'
import CompactVariant from '@/components/knowledge-base/kb-variants/CompactVariant.vue'

const VARIANTS = ['pipeline', 'atlas', 'ledger', 'canvas', 'compact'] as const
type VariantKey = (typeof VARIANTS)[number]

const INITIAL = (() => {
  const v = new URLSearchParams(window.location.search).get('variant') || 'pipeline'
  return ((VARIANTS as readonly string[]).includes(v) ? v : 'pipeline') as VariantKey
})()

const variant = ref<VariantKey>(INITIAL)

const current = computed(() => ({
  pipeline: PipelineVariant,
  atlas: AtlasVariant,
  ledger: LedgerVariant,
  canvas: CanvasVariant,
  compact: CompactVariant,
}[variant.value]))

const META: Record<VariantKey, { name: string; thesis: string }> = {
  pipeline: { name: '流水线', thesis: '知识库是一条加工线：入库 → 切块 → 向量化 → 抽取 → 成品' },
  atlas: { name: '图谱图集', thesis: '知识库是一个空间：图谱是主视图，其它视图是它的图层' },
  ledger: { name: '档案台', thesis: '找文档 → 读它 → 就它提问，三栏常驻不换页' },
  canvas: { name: '卡片画布', thesis: '工作台由你摆：卡片可拖拽、可连线、可缩放' },
  compact: { name: '紧凑控制台', thesis: '运维视角：一切以密度和速度为先，数字自带形状' },
}

function onChange(e: Event) {
  const k = (e as CustomEvent<string>).detail as VariantKey
  if ((VARIANTS as readonly string[]).includes(k)) variant.value = k
}

onMounted(() => window.addEventListener('kb-variant-change', onChange))
onUnmounted(() => window.removeEventListener('kb-variant-change', onChange))
</script>

<template>
  <div class="kbp">
    <header class="kbp__top">
      <div class="kbp__brand">
        <span class="kbp__dot" />
        知识库 · 设计探索
      </div>
      <div class="kbp__meta">
        <b>{{ META[variant].name }}</b>
        <span>{{ META[variant].thesis }}</span>
      </div>
      <div class="kbp__spacer" />
      <span class="kbp__hint">← → 切换</span>
    </header>

    <main class="kbp__stage">
      <component :is="current" :key="variant" />
    </main>

    <KbVariantSwitcher :current="variant" />
  </div>
</template>

<style scoped>
.kbp {
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 0;
  background: var(--bg-page, #fbfbfd);
  color: var(--text-primary, #17191f);
}

.kbp__top {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 9px 16px;
  border-bottom: 1px solid var(--border-default, #e6e8ee);
  background: var(--bg-container, #fff);
  flex-wrap: wrap;
}

.kbp__brand {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.kbp__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--brand-500, #3b82f6);
}

.kbp__meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.kbp__meta b {
  font-size: 12.5px;
  font-weight: 650;
}

.kbp__meta span {
  font-size: 11.5px;
  color: var(--text-tertiary, #8b8f9c);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kbp__spacer { flex: 1; }

.kbp__hint {
  font-size: 10.5px;
  font-family: 'JetBrains Mono', Consolas, monospace;
  color: var(--text-tertiary, #8b8f9c);
  padding: 2px 7px;
  border: 1px solid var(--border-subtle, #eceef4);
  border-radius: 4px;
}

.kbp__stage {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

html.dark .kbp__top {
  background: var(--bg-container, #1a1d27);
  border-color: var(--border-default, rgba(255, 255, 255, 0.12));
}

@media (max-width: 760px) {
  .kbp__meta span { display: none; }
  .kbp__hint { display: none; }
}
</style>
