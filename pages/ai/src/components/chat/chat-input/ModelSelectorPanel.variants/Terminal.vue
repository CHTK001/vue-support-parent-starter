<script setup lang="ts">
/**
 * 变体 3「Terminal（终端）」：等宽字体 + 深色终端卡。
 * 模型显示为 provider/model 裸名，行尾状态灯；悬停弹出深色终端风信息卡。
 * 为最懂技术的用户服务——图标缩小到 16px 内联，强化技术语义。
 * Phase 2 探索稿 — mock 数据，不动真实逻辑。
 */
import { ref } from 'vue'
import ModelIcon from './ModelIcon.vue'
import { MOCK_MODELS, fmtPrice, fmtContext, fmtDate, type MockModel } from './mockData'

const models = ref<MockModel[]>(MOCK_MODELS)
const selectedId = ref('openai:gpt-5')
const hoverModel = ref<MockModel | null>(null)
let closeTimer: number | undefined

const FEAT_LABEL: Record<string, string> = { tools: 'tools', thinking: 'thinking', 'web-search': 'search' }

function rawName(m: MockModel): string { return `${m.provider}/${m.modelName}` }
function select(m: MockModel) { selectedId.value = m.id }
function enter(m: MockModel) {
  window.clearTimeout(closeTimer)
  hoverModel.value = m
}
function leave() {
  closeTimer = window.setTimeout(() => { hoverModel.value = null }, 160)
}
</script>

<template>
  <div class="tm">
    <div class="tm-list">
      <div v-for="m in models" :key="m.id"
        class="tm-row"
        :class="{ 'tm-row-active': m.id === selectedId, 'tm-row-hover': hoverModel?.id === m.id }"
        @click="select(m)" @mouseenter="enter(m)" @mouseleave="leave">
        <span class="tm-gutter"></span>
        <ModelIcon :logo="m.logo" :name="m.modelName" :size="16" />
        <span class="tm-name">{{ rawName(m) }}</span>
        <span class="tm-meta">ctx {{ fmtContext(m.contextWindow) || '?' }} · in {{ fmtPrice(m.priceIn) }} · out {{ fmtPrice(m.priceOut) }}</span>
        <span class="tm-dot"></span>
      </div>
    </div>

    <!-- 深色终端卡 -->
    <Teleport to="body">
      <div v-if="hoverModel" class="tm-tip" :style="{ left: 'calc(50% + 260px)', top: '15%' }" @mouseenter="enter(hoverModel)" @mouseleave="leave">
        <div class="tm-tip-title"># {{ rawName(hoverModel) }}</div>
        <div class="tm-tip-line"><span>context</span><b>{{ fmtContext(hoverModel.contextWindow) }}</b></div>
        <div class="tm-tip-line"><span>max_out</span><b>{{ fmtContext(hoverModel.maxOutput) }}</b></div>
        <div class="tm-tip-line"><span>price_in</span><b>{{ fmtPrice(hoverModel.priceIn) }}/1M</b></div>
        <div class="tm-tip-line"><span>price_out</span><b>{{ fmtPrice(hoverModel.priceOut) }}/1M</b></div>
        <div class="tm-tip-line"><span>cache_r</span><b>{{ fmtPrice(hoverModel.priceCacheRead) }}/1M</b></div>
        <div class="tm-tip-line"><span>cache_w</span><b>{{ fmtPrice(hoverModel.priceCacheWrite) }}/1M</b></div>
        <div class="tm-tip-line"><span>input</span><b>{{ hoverModel.inputModalities.join(' ') }}</b></div>
        <div class="tm-tip-line"><span>output</span><b>{{ hoverModel.outputModalities.join(' ') }}</b></div>
        <div class="tm-tip-line"><span>features</span><b>{{ hoverModel.features.map(f => FEAT_LABEL[f] || f).join(' ') || '—' }}</b></div>
        <div class="tm-tip-line"><span>knowledge</span><b>{{ hoverModel.knowledgeCutoff || '—' }}</b></div>
        <div class="tm-tip-line"><span>released</span><b>{{ fmtDate(hoverModel.releaseDate) }}</b></div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.tm {
  --mi-mono: ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Code', Consolas, monospace;
  --term-bg: var(--terminal-bg, #0d1117);
  /* 终端语义色：深底上的正文/次要文字，沿用 koi 的 --text-inverse 族，缺失时回退 GitHub 深色主题灰 */
  --term-fg: var(--text-inverse, #c9d1d9);
  --term-fg2: var(--text-tertiary, #8b949e);
  --term-accent: var(--brand-500, #6d5dfc);
  --term-green: var(--pulse-online, #2fbf71);
  display: flex; flex-direction: column;
  padding: 8px;
  background: var(--term-bg);
  font-family: var(--mi-mono);
  color: var(--term-fg);
}

.tm-list { display: flex; flex-direction: column; gap: 1px; }
.tm-row {
  display: grid;
  grid-template-columns: 10px 16px minmax(0, 1fr) auto 10px;
  gap: 8px;
  align-items: center;
  padding: 5px 10px;
  border-left: 2px solid transparent;
  cursor: pointer;
  font-size: 12px;
  line-height: 1.6;
}
.tm-row:hover, .tm-row-hover { background: rgba(255, 255, 255, 0.04); }
.tm-row-active {
  border-left-color: var(--term-accent);
  background: color-mix(in srgb, var(--term-accent) 12%, transparent);
}
.tm-gutter { display: block; }
.tm-name { color: var(--term-fg); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tm-meta {
  font-size: 10px;
  color: var(--term-fg2);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
/* 状态灯：在线呼吸（沿用 koi tokens 的 pdot 口径） */
.tm-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--term-green);
  animation: tm-breathe 1.6s ease-in-out infinite;
}
@keyframes tm-breathe {
  0%, 100% { box-shadow: 0 0 0 0 rgba(47, 191, 113, 0.35); }
  50% { box-shadow: 0 0 0 4px rgba(47, 191, 113, 0.12); }
}
@media (prefers-reduced-motion: reduce) {
  .tm-dot { animation: none; }
}

/* 深色终端卡 */
.tm-tip {
  position: fixed;
  z-index: 3000;
  width: 260px;
  padding: 12px 14px;
  background: var(--term-bg);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  font-family: var(--mi-mono);
  font-size: 11px;
  color: var(--term-fg);
}
.tm-tip-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--term-accent);
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.12);
}
.tm-tip-line {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 1px 0;
  color: var(--term-fg2);
}
.tm-tip-line b {
  font-weight: 400;
  color: var(--term-fg);
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
</style>




