<script setup lang="ts">
/**
 * 方向 1「Pipeline（流水线）」。
 *
 * <p><b>核心隐喻</b>：RAG 知识库本质是一条加工线 —— 文档进入 → 切块 → 向量化 →
 * 实体抽取 → 关系抽取 → 成品。现有 UI 只有一行「解析中 62%」的标签，用户看不见
 * 系统在做什么，也看不见失败原因与消耗（token / chunks 从未上屏）。</p>
 *
 * <p><b>布局</b>：四道工序横向泳道，文档是沿泳道前进的卡片；首屏顶部是「工序配方」
 * （chunkMaxSize / chunkOverlapSize / chunkMinSize + 采集来源），把库的加工参数
 * 从设置页提到主视图。成品区给出图谱/问答两个出口。</p>
 *
 * <p><b>签名</b>：泳道底部的传送带斜纹（repeating-linear-gradient），只在「处理中」
 * 的卡片下方以 1.6s 匀速左移；<code>prefers-reduced-motion</code> 下静止。</p>
 *
 * <p>Phase 2 探索稿 —— mock 数据，不动真实逻辑。</p>
 */
import { computed, ref } from 'vue'
import {
  MOCK_KBS, MOCK_FILES, MOCK_ENTITIES, MOCK_RELATIONS, MOCK_TURNS,
  ENTITY_LABEL, STATUS_LABEL, type MockFile,
} from './mockData'
import { fmtNum, fmtSize, fmtAgo } from './shared'

const kb = MOCK_KBS[0]
const files = ref<MockFile[]>(MOCK_FILES)
const turns = MOCK_TURNS

/** 四道工序（编号是真实顺序，不是装饰） */
const STAGES = [
  { key: 'intake', label: '入库', hint: '排队 · 类型识别', statuses: ['queued', 'pending'] },
  { key: 'chunk', label: '切块', hint: '按配方切分', statuses: [] },
  { key: 'embed', label: '向量化', hint: '写入向量索引', statuses: ['processing'] },
  { key: 'extract', label: '抽取', hint: '实体 · 关系', statuses: [] },
  { key: 'done', label: '成品', hint: '可检索可问答', statuses: ['completed'] },
] as const

/** 失败与完成分别归位：失败卡停在它出错的那道工序上（这里统一放在「向量化」段并标红） */
const stageOf = (f: MockFile): string => {
  if (f.processingStatus === 'completed') return 'done'
  if (f.processingStatus === 'failed') return 'embed'
  if (f.processingStatus === 'processing') return 'embed'
  return 'intake'
}

const byStage = computed(() =>
  STAGES.map((s) => ({ ...s, items: files.value.filter((f) => stageOf(f) === s.key) })),
)

/** 汇总：已索引 / 处理中 / 失败 */
const tally = computed(() => ({
  done: files.value.filter((f) => f.processingStatus === 'completed').length,
  running: files.value.filter((f) => f.processingStatus === 'processing' || f.processingStatus === 'queued').length,
  failed: files.value.filter((f) => f.processingStatus === 'failed').length,
  chunks: files.value.reduce((a, f) => a + f.totalChunks, 0),
  tokens: files.value.reduce((a, f) => a + f.totalTokens, 0),
}))

/** 配方：来自 KnowledgeBase 的 chunk/* 字段，此前只能在设置页看到 */
const recipe = computed(() => [
  { k: '切块上限', v: `${kb.chunkMaxSize} 字` },
  { k: '切块下限', v: `${kb.chunkMinSize} 字` },
  { k: '重叠', v: `${kb.chunkOverlapSize} 字` },
  { k: '采集', v: kb.sourceUrl ? `${kb.sourceUrl}（≤${kb.sourceMaxPages} 页）` : '未启用' },
])

const selected = ref<MockFile | null>(null)

/** 重试：mock 下把失败卡改回排队，证明「原地可恢复」 */
function retry(f: MockFile) {
  f.processingStatus = 'queued'
  f.progressPercentage = 0
  f.currentStep = '等待调度'
  f.errorMessage = null
}

const statusTone = (s: string) =>
  s === 'completed' ? 'ok' : s === 'failed' ? 'err' : s === 'processing' ? 'run' : 'wait'
</script>

<template>
  <div class="pipe">
    <!-- ================= 顶部：库身份 + 配方 ================= -->
    <header class="pipe__head">
      <div class="pipe__id">
        <h1 class="pipe__name">{{ kb.name }}</h1>
        <p class="pipe__desc">{{ kb.description }}</p>
      </div>
      <div class="pipe__tally">
        <span><b>{{ tally.done }}</b> 已索引</span>
        <span><b>{{ tally.running }}</b> 处理中</span>
        <span :class="{ 'is-bad': tally.failed }"><b>{{ tally.failed }}</b> 失败</span>
      </div>
    </header>

    <section class="pipe__recipe" aria-label="加工配方">
      <div v-for="r in recipe" :key="r.k" class="pipe__recipe-item">
        <span>{{ r.k }}</span>
        <b>{{ r.v }}</b>
      </div>
      <div class="pipe__recipe-item">
        <span>已生成</span>
        <b>{{ fmtNum(tally.chunks) }} 块 · {{ fmtNum(tally.tokens) }} tokens</b>
      </div>
    </section>

    <!-- ================= 泳道 ================= -->
    <div class="pipe__belt">
      <section v-for="(s, i) in byStage" :key="s.key" class="lane" :class="`lane--${s.key}`">
        <div class="lane__head">
          <span class="lane__no">{{ String(i + 1).padStart(2, '0') }}</span>
          <span class="lane__label">{{ s.label }}</span>
          <span class="lane__count">{{ s.items.length }}</span>
        </div>
        <p class="lane__hint">{{ s.hint }}</p>

        <div class="lane__body">
          <!-- 传送带：仅当该泳道有处理中/排队卡片时可见 -->
          <div
            v-if="s.items.some((f) => f.processingStatus === 'processing' || f.processingStatus === 'queued')"
            class="lane__conveyor"
            aria-hidden="true"
          />

          <article
            v-for="(f, ci) in s.items"
            :key="f.id"
            class="part"
            :class="[`part--${statusTone(f.processingStatus)}`, { 'is-open': selected?.id === f.id }]"
            :style="{ animationDelay: `${ci * 40}ms` }"
            tabindex="0"
            @click="selected = f"
            @keydown.enter="selected = f"
          >
            <div class="part__top">
              <span class="part__ext">{{ f.fileExtension.toUpperCase() }}</span>
              <span class="part__status">{{ STATUS_LABEL[f.processingStatus] }}</span>
            </div>
            <h3 class="part__name" :title="f.displayName">{{ f.displayName }}</h3>

            <!-- 处理中：进度条 + 当前步骤（currentStep 此前从未上屏） -->
            <template v-if="f.processingStatus === 'processing' || f.processingStatus === 'queued'">
              <div class="part__bar"><i :style="{ width: `${f.progressPercentage}%` }" /></div>
              <p class="part__step">{{ f.currentStep }} · {{ f.progressPercentage }}%</p>
            </template>

            <!-- 失败：错误原因 + 原地重试（errorMessage 此前从未上屏） -->
            <template v-else-if="f.processingStatus === 'failed'">
              <p class="part__err">{{ f.errorMessage }}</p>
              <button type="button" class="part__retry" @click.stop="retry(f)">重新解析</button>
            </template>

            <!-- 完成：产出物 -->
            <template v-else>
              <p class="part__out">
                {{ fmtNum(f.totalChunks) }} 块 · {{ fmtNum(f.totalTokens) }} tokens
              </p>
              <p class="part__meta">{{ fmtSize(f.fileSize) }} · {{ f.processedAt ? fmtAgo(f.processedAt) + '完成' : '' }}</p>
            </template>
          </article>

          <p v-if="!s.items.length" class="lane__empty">—</p>
        </div>
      </section>
    </div>

    <!-- ================= 成品区：两个出口 ================= -->
    <section class="out">
      <div class="out__card">
        <h2 class="out__title">图谱 <span>{{ MOCK_ENTITIES.length }} 实体 · {{ MOCK_RELATIONS.length }} 关系</span></h2>
        <ul class="out__ents">
          <li v-for="e in MOCK_ENTITIES.slice(0, 5)" :key="e.id">
            <span class="out__dot" :data-t="e.type" />{{ e.text }}
            <em>{{ ENTITY_LABEL[e.type] }}</em>
          </li>
        </ul>
      </div>
      <div class="out__card out__card--qa">
        <h2 class="out__title">问答 <span>{{ turns.length }} 轮</span></h2>
        <p class="out__q">{{ turns[0].question }}</p>
        <p class="out__a">{{ turns[0].answer.split('\n')[0] }}</p>
        <p class="out__el">耗时 {{ (turns[0].elapsed / 1000).toFixed(1) }}s · {{ turns[0].citations.length }} 处引用</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ============ 局部令牌：琥珀 = 正在流动，品牌蓝 = 已完成 ============ */
.pipe {
  --p-ink: var(--text-primary, #1b1d23);
  --p-ink2: var(--text-secondary, #5c6270);
  --p-ink3: var(--text-tertiary, #8b8f9c);
  --p-bg: var(--bg-page, #fbfbfd);
  --p-card: var(--bg-container, #ffffff);
  --p-line: var(--border-default, #e6e8ee);
  --p-blue: var(--brand-600, #2563eb);
  --p-blue-soft: var(--brand-50, #eef4ff);
  --p-amber: #b45309;
  --p-amber-soft: #fff8eb;
  --p-err: var(--status-error, #dc2626);
  --p-err-soft: #fef3f2;
  --p-ok: var(--status-success, #15803d);
  --p-mono: 'JetBrains Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;

  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 22px 24px 28px;
  background: var(--p-bg);
  color: var(--p-ink);
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  min-height: 100%;
  overflow-y: auto;
}

/* ---------- 顶部 ---------- */
.pipe__head {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  flex-wrap: wrap;
}

.pipe__name {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.pipe__desc {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--p-ink2);
}

.pipe__tally {
  margin-left: auto;
  display: flex;
  gap: 18px;
  font-size: 12px;
  color: var(--p-ink2);
}

.pipe__tally b {
  font-family: var(--p-mono);
  font-size: 16px;
  font-weight: 600;
  color: var(--p-ink);
  margin-right: 3px;
}

.pipe__tally .is-bad b {
  color: var(--p-err);
}

/* ---------- 配方条 ---------- */
.pipe__recipe {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  border: 1px solid var(--p-line);
  border-radius: var(--radius-md, 8px);
  background: var(--p-card);
  overflow: hidden;
}

.pipe__recipe-item {
  flex: 1 1 auto;
  padding: 9px 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 120px;
}

.pipe__recipe-item + .pipe__recipe-item {
  border-left: 1px solid var(--p-line);
}

.pipe__recipe-item span {
  font-size: 11px;
  color: var(--p-ink3);
  letter-spacing: 0.02em;
}

.pipe__recipe-item b {
  font-size: 12px;
  font-weight: 600;
  font-family: var(--p-mono);
  color: var(--p-ink);
}

/* ---------- 泳道 ---------- */
/*
 * 泳道：同高拉伸（视觉上是一条贯通的线），但用 min-height 贴合内容量，
 * 不再让 flex:1 把五列拉到满屏高度留下大片空白。
 * 传送带贴在每条泳道底部，贯通后连成一条完整流水线。
 */
.pipe__belt {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  align-items: stretch;
}

.lane {
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--p-card);
  border: 1px solid var(--p-line);
  border-radius: var(--radius-lg, 12px);
  overflow: hidden;
  /* 贴合内容：三条已索引卡片约 300px，空泳道保持紧凑但撑住传送带 */
  min-height: 208px;
}

.lane--done {
  border-color: color-mix(in srgb, var(--p-blue) 22%, var(--p-line));
}

.lane__head {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 12px 0;
}

.lane__no {
  font-family: var(--p-mono);
  font-size: 10px;
  color: var(--p-ink3);
  letter-spacing: 0.04em;
}

.lane__label {
  font-size: 13px;
  font-weight: 600;
}

.lane__count {
  margin-left: auto;
  font-family: var(--p-mono);
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--bg-fill, #f1f3f8);
  color: var(--p-ink2);
}

.lane--done .lane__count {
  background: var(--p-blue-soft);
  color: var(--p-blue);
}

.lane__hint {
  margin: 2px 12px 10px;
  font-size: 11px;
  color: var(--p-ink3);
}

.lane__body {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 10px 10px;
}

/* 签名元素：传送带斜纹 */
.lane__conveyor {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 22px;
  background-image: repeating-linear-gradient(
    135deg,
    color-mix(in srgb, var(--p-amber) 16%, transparent) 0 6px,
    transparent 6px 12px
  );
  background-size: 200% 100%;
  animation: belt 1.6s linear infinite;
  pointer-events: none;
}

@keyframes belt {
  from { background-position: 0 0; }
  to { background-position: -34px 0; }
}

.lane__empty {
  margin: 6px 0 0;
  text-align: center;
  font-size: 12px;
  color: var(--p-ink3);
}

/* ---------- 卡片（流水线上的物件） ---------- */
.part {
  position: relative;
  z-index: 1;
  padding: 9px 10px;
  border: 1px solid var(--p-line);
  border-radius: var(--radius-md, 8px);
  background: var(--p-card);
  cursor: pointer;
  animation: slide-in 240ms var(--ease-out, ease-out) both;
  transition: border-color 140ms var(--ease-out, ease-out), box-shadow 140ms var(--ease-out, ease-out);
}

.part:hover {
  border-color: color-mix(in srgb, var(--p-blue) 40%, var(--p-line));
}

.part.is-open {
  border-color: var(--p-blue);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--p-blue) 14%, transparent);
}

.part:focus-visible {
  outline: 2px solid var(--p-blue);
  outline-offset: 1px;
}

.part--run {
  border-color: color-mix(in srgb, var(--p-amber) 38%, var(--p-line));
  background: var(--p-amber-soft);
}

.part--err {
  border-color: color-mix(in srgb, var(--p-err) 38%, var(--p-line));
  background: var(--p-err-soft);
}

.part--ok {
  border-left: 2px solid var(--p-ok);
}

@keyframes slide-in {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}

.part__top {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.part__ext {
  font-family: var(--p-mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.05em;
  padding: 1px 4px;
  border-radius: var(--radius-sm, 4px);
  background: var(--bg-fill, #f1f3f8);
  color: var(--p-ink2);
}

.part__status {
  margin-left: auto;
  font-size: 10px;
  color: var(--p-ink3);
}

.part--run .part__status { color: var(--p-amber); font-weight: 600; }
.part--err .part__status { color: var(--p-err); font-weight: 600; }
.part--ok .part__status { color: var(--p-ok); }

.part__name {
  margin: 0;
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.part__bar {
  margin: 7px 0 4px;
  height: 3px;
  border-radius: 2px;
  background: color-mix(in srgb, var(--p-amber) 18%, transparent);
  overflow: hidden;
}

.part__bar i {
  display: block;
  height: 100%;
  background: var(--p-amber);
  border-radius: 2px;
  transition: width 300ms var(--ease-out, ease-out);
}

.part__step,
.part__out,
.part__meta,
.part__el {
  margin: 0;
  font-size: 11px;
  color: var(--p-ink2);
  font-family: var(--p-mono);
}

.part__meta {
  color: var(--p-ink3);
  font-size: 10.5px;
  margin-top: 2px;
}

.part__err {
  margin: 6px 0 6px;
  font-size: 11px;
  line-height: 1.45;
  color: color-mix(in srgb, var(--p-err) 82%, black);
}

.part__retry {
  appearance: none;
  cursor: pointer;
  border: 1px solid color-mix(in srgb, var(--p-err) 35%, transparent);
  background: var(--p-card);
  color: var(--p-err);
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: var(--radius-sm, 4px);
}

.part__retry:hover {
  background: color-mix(in srgb, var(--p-err) 8%, var(--p-card));
}

/* ---------- 成品出口 ---------- */
.out {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.out__card {
  padding: 12px 14px;
  background: var(--p-card);
  border: 1px solid var(--p-line);
  border-radius: var(--radius-lg, 12px);
}

.out__title {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.out__title span {
  font-size: 11px;
  font-weight: 400;
  color: var(--p-ink3);
  font-family: var(--p-mono);
}

.out__ents {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.out__ents li {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  padding: 3px 8px 3px 6px;
  border-radius: 999px;
  background: var(--bg-fill, #f1f3f8);
}

.out__ents em {
  font-style: normal;
  font-size: 10px;
  color: var(--p-ink3);
}

.out__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--p-blue);
}

.out__dot[data-t='event'] { background: #d97706; }
.out__dot[data-t='place'] { background: #0d9488; }
.out__dot[data-t='organization'] { background: #7c3aed; }
.out__dot[data-t='concept'] { background: #db2777; }

.out__q {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 600;
}

.out__a {
  margin: 0;
  font-size: 11.5px;
  color: var(--p-ink2);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.out__el {
  margin-top: 6px;
  color: var(--p-ink3);
}

/* ---------- 暗色 ---------- */
html.dark .pipe {
  --p-ink: var(--text-primary, #e8edf6);
  --p-ink2: var(--text-secondary, #9aa6bd);
  --p-ink3: var(--text-tertiary, #76839c);
  --p-bg: var(--bg-page, #0f1117);
  --p-card: var(--bg-container, #1a1d27);
  --p-line: var(--border-default, rgba(255, 255, 255, 0.12));
  --p-blue: var(--brand-400, #60a5fa);
  --p-blue-soft: color-mix(in srgb, var(--brand-400, #60a5fa) 16%, transparent);
  --p-amber: #fbbf24;
  --p-amber-soft: rgba(251, 191, 36, 0.1);
  --p-err: #f87171;
  --p-err-soft: rgba(248, 113, 113, 0.1);
  --p-ok: #4ade80;
}

html.dark .part__err {
  color: #fca5a5;
}

/* ---------- 响应式：五道泳道 → 竖向堆叠 ---------- */
@media (max-width: 1180px) {
  .pipe__belt {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .pipe {
    padding: 16px 14px 24px;
    gap: 14px;
  }

  .pipe__belt,
  .out {
    grid-template-columns: 1fr;
  }

  .lane__body {
    min-height: 0;
  }

  .pipe__tally {
    margin-left: 0;
    gap: 12px;
  }
}

/* ---------- 动效关闭 ---------- */
@media (prefers-reduced-motion: reduce) {
  .part {
    animation: none;
  }

  .lane__conveyor {
    animation: none;
  }

  .part__bar i {
    transition: none;
  }
}
</style>
