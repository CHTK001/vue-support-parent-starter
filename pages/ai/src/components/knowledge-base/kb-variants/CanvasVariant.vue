<script setup lang="ts">
/**
 * 方向 4「Canvas（卡片画布）」。
 *
 * <p><b>核心判断</b>：面向「同时要盯很多材料」的研究型用户（备课 / 命题 / 教研）。
 * 每个知识库、每份文档、每次问答都是一张可拖拽的卡片，用户自己决定工作台长什么样。
 * 7 个 Tab 退化为「卡片类型筛选」。</p>
 *
 * <p><b>签名元素</b>：卡片之间的<b>连接线</b> —— 把「文档卡」拖到「问答卡」上即建立
 * 引用关系（本稿用 SVG 连线模拟，拖拽后实时重算）。</p>
 *
 * <p><b>代价（已在方向文档里标注）</b>：触屏难用、自由布局容易变乱（故提供「重置布局」）、
 * 实现成本最高。此方向更适合作为长期演进，本稿用于对比其信息组织方式。</p>
 *
 * <p>Phase 2 探索稿 —— mock 数据，不动真实逻辑。拖拽用 Pointer Events + transform，
 * 只改 GPU 属性；布局可持久化到 localStorage（本稿内存态即可）。</p>
 */
import { computed, ref } from 'vue'
import { MOCK_KBS, MOCK_FILES, MOCK_ENTITIES, MOCK_TURNS, STATUS_LABEL } from './mockData'
import { fmtNum, STATUS_TOKEN } from './shared'

/** 卡片类型 */
type CardKind = 'kb' | 'doc' | 'ask' | 'graph'

interface Card {
  id: string
  kind: CardKind
  title: string
  /** 画布坐标（px） */
  x: number
  y: number
  /** 尺寸档：SM / LG */
  size: 'sm' | 'lg'
  /** 加宽卡（图谱卡独占一块横向空间，避免画布右侧留白） */
  wide?: boolean
  /** 关联：从本卡片指向他卡的引用线 */
  links: string[]
  /** 附加数据（按 kind 取用） */
  data?: Record<string, unknown>
}

const initialCards: Card[] = [
  {
    id: 'c-kb',
    kind: 'kb',
    title: MOCK_KBS[0].name,
    x: 28,
    y: 24,
    size: 'lg',
    links: [],
    data: { desc: MOCK_KBS[0].description },
  },
  {
    id: 'c-f1',
    kind: 'doc',
    title: MOCK_FILES[0].displayName,
    x: 404,
    y: 24,
    size: 'sm',
    links: [],
    data: { ...MOCK_FILES[0] },
  },
  {
    id: 'c-f2',
    kind: 'doc',
    title: MOCK_FILES[1].displayName,
    x: 404,
    y: 208,
    size: 'sm',
    links: [],
    data: { ...MOCK_FILES[1] },
  },
  {
    id: 'c-f3',
    kind: 'doc',
    title: MOCK_FILES[3].displayName,
    x: 404,
    y: 392,
    size: 'sm',
    links: [],
    data: { ...MOCK_FILES[3] },
  },
  {
    id: 'c-ask',
    kind: 'ask',
    title: MOCK_TURNS[0].question,
    x: 28,
    y: 280,
    size: 'lg',
    links: ['c-f1', 'c-f2'],
    data: { ...MOCK_TURNS[0] },
  },
  {
    id: 'c-graph',
    kind: 'graph',
    title: '实体与关系',
    x: 800,
    y: 130,
    size: 'lg',
    wide: true,
    links: [],
    data: { nodes: MOCK_ENTITIES.length },
  },
]

const cards = ref<Card[]>(initialCards.map((c) => ({ ...c })))
const activeId = ref<string | null>(null)
const dragging = ref<string | null>(null)

/** 卡片类型筛选（替代 7 个 Tab） */
const kindFilter = ref<CardKind | 'all'>('all')
const visible = computed(() =>
  kindFilter.value === 'all' ? cards.value : cards.value.filter((c) => c.kind === kindFilter.value),
)

const FILTERS: Array<{ key: CardKind | 'all'; label: string; n: number }> = [
  { key: 'all', label: '全部', n: cards.value.length },
  { key: 'kb', label: '知识库', n: cards.value.filter((c) => c.kind === 'kb').length },
  { key: 'doc', label: '文档', n: cards.value.filter((c) => c.kind === 'doc').length },
  { key: 'ask', label: '问答', n: cards.value.filter((c) => c.kind === 'ask').length },
  { key: 'graph', label: '图谱', n: cards.value.filter((c) => c.kind === 'graph').length },
]

/** 卡片尺寸（px）：与 CSS 保持一致，用于画连线 */
const SIZE = { sm: { w: 352, h: 168 }, lg: { w: 352, h: 240 }, wide: { w: 560, h: 240 } }

const sizeOf = (c: Card) => (c.wide ? SIZE.wide : SIZE[c.size])

/** 连线：从源卡右中 → 目标卡左中（贝塞尔） */
const links = computed(() => {
  const out: Array<{ d: string; id: string }> = []
  for (const c of cards.value) {
    for (const t of c.links) {
      const to = cards.value.find((x) => x.id === t)
      if (!to) continue
      if (kindFilter.value !== 'all' && c.kind !== kindFilter.value && to.kind !== kindFilter.value) continue
      const a = sizeOf(c)
      const b = sizeOf(to)
      const x1 = c.x + a.w
      const y1 = c.y + a.h / 2
      const x2 = to.x
      const y2 = to.y + b.h / 2
      const mx = (x1 + x2) / 2
      out.push({ id: `${c.id}-${to.id}`, d: `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}` })
    }
  }
  return out
})

/* ---------------- 拖拽 ---------------- */
let start = { x: 0, y: 0, cx: 0, cy: 0 }

function onDown(e: PointerEvent, c: Card) {
  // 卡片内按钮/输入不触发拖拽
  if ((e.target as HTMLElement).closest('button, input')) return
  dragging.value = c.id
  activeId.value = c.id
  start = { x: e.clientX, y: e.clientY, cx: c.x, cy: c.y }
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onMove(e: PointerEvent) {
  if (!dragging.value) return
  const c = cards.value.find((x) => x.id === dragging.value)
  if (!c) return
  c.x = Math.max(0, start.cx + (e.clientX - start.x))
  c.y = Math.max(0, start.cy + (e.clientY - start.y))
}

function onUp() {
  dragging.value = null
}

/** 重置布局 */
function reset() {
  cards.value = initialCards.map((c) => ({ ...c }))
}

/** 尺寸切换 */
function toggleSize(c: Card) {
  c.size = c.size === 'sm' ? 'lg' : 'sm'
}

/** 画布尺寸（自适应内容） */
const canvasSize = computed(() => {
  const w = Math.max(...cards.value.map((c) => c.x + sizeOf(c).w)) + 40
  const h = Math.max(...cards.value.map((c) => c.y + sizeOf(c).h)) + 80
  return { w: Math.max(w, 900), h: Math.max(h, 520) }
})

const kindLabel: Record<CardKind, string> = { kb: '知识库', doc: '文档', ask: '问答', graph: '图谱' }
</script>

<template>
  <div class="cv">
    <!-- ================= 工具条 ================= -->
    <header class="cv__bar">
      <div class="cv__filters" role="tablist">
        <button
          v-for="f in FILTERS"
          :key="f.key"
          type="button"
          role="tab"
          class="cv__filter"
          :class="{ 'is-on': kindFilter === f.key }"
          :aria-selected="kindFilter === f.key"
          @click="kindFilter = f.key"
        >
          {{ f.label }}<em>{{ f.n }}</em>
        </button>
      </div>
      <div class="cv__spacer" />
      <button type="button" class="cv__act" @click="reset">重置布局</button>
      <button type="button" class="cv__act cv__act--pri">+ 卡片</button>
    </header>

    <!-- ================= 画布 ================= -->
    <div class="cv__viewport">
      <div
        class="cv__board"
        :style="{ width: `${canvasSize.w}px`, height: `${canvasSize.h}px` }"
        @pointermove="onMove"
        @pointerup="onUp"
        @pointercancel="onUp"
      >
        <!-- 点阵底纹 -->
        <div class="cv__dots" aria-hidden="true" />

        <!-- 连线（签名元素） -->
        <svg class="cv__links" :width="canvasSize.w" :height="canvasSize.h" aria-hidden="true">
          <path v-for="l in links" :key="l.id" :d="l.d" />
        </svg>

        <!-- 卡片 -->
        <article
          v-for="c in visible"
          :key="c.id"
          class="crd"
          :class="[`crd--${c.kind}`, `crd--${c.size}`, { 'is-drag': dragging === c.id, 'is-on': activeId === c.id, 'is-wide': c.wide }]"
          :style="{ transform: `translate3d(${c.x}px, ${c.y}px, 0)` }"
          @pointerdown="onDown($event, c)"
        >
          <header class="crd__head">
            <span class="crd__kind">{{ kindLabel[c.kind] }}</span>
            <button type="button" class="crd__size" @click.stop="toggleSize(c)">{{ c.size === 'sm' ? '↕' : '↕' }}</button>
          </header>

          <h3 class="crd__title">{{ c.title }}</h3>

          <!-- 知识库卡 -->
          <template v-if="c.kind === 'kb'">
            <p class="crd__desc">{{ c.data?.desc }}</p>
            <div class="crd__row">
              <span>{{ MOCK_FILES.length }} 文档</span>
              <span>{{ MOCK_ENTITIES.length }} 实体</span>
              <span>公开</span>
            </div>
          </template>

          <!-- 文档卡 -->
          <template v-else-if="c.kind === 'doc'">
            <div class="crd__row">
              <span class="crd__st" :data-tone="STATUS_TOKEN[String(c.data?.processingStatus)]">
                {{ STATUS_LABEL[String(c.data?.processingStatus) as keyof typeof STATUS_LABEL] }}
              </span>
              <span class="crd__num">{{ fmtNum(Number(c.data?.totalChunks) || 0) }} 块</span>
              <span class="crd__num">{{ fmtNum(Number(c.data?.totalTokens) || 0) }} tok</span>
            </div>
            <p v-if="c.data?.errorMessage" class="crd__err">{{ c.data.errorMessage }}</p>
            <div v-else-if="c.data?.processingStatus === 'processing'" class="crd__bar">
              <i :style="{ width: `${c.data?.progressPercentage}%` }" />
            </div>
          </template>

          <!-- 问答卡 -->
          <template v-else-if="c.kind === 'ask'">
            <p class="crd__answer">{{ String(c.data?.answer).split('\n')[0] }}</p>
            <div class="crd__row">
              <span v-for="ci in (c.data?.citations as Array<{ index: number; fileName: string }>)" :key="ci.index" class="crd__cite">
                [{{ ci.index }}] {{ ci.fileName }}
              </span>
            </div>
          </template>

          <!-- 图谱卡：中心节点 + 放射状叶片，读作"一个实体连着若干关系" -->
          <template v-else>
            <div class="crd__mini" aria-hidden="true">
              <span class="crd__mini-hub" />
              <span
                v-for="(e, i) in MOCK_ENTITIES.slice(0, 7)"
                :key="e.id"
                class="crd__mini-leaf"
                :style="{
                  transform: `rotate(${(i / 7) * 360}deg) translateX(${34 + e.degree * 2.4}px)`,
                  '--leaf': `${4 + Math.min(5, e.degree / 4)}px`,
                }"
              />
            </div>
            <p class="crd__num">{{ c.data?.nodes }} 节点 · {{ MOCK_ENTITIES.length }} 类型</p>
          </template>
        </article>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cv {
  --v-ink: var(--text-primary, #17191f);
  --v-ink2: var(--text-secondary, #5c6270);
  --v-ink3: var(--text-tertiary, #8b8f9c);
  --v-card: var(--bg-container, #fff);
  --v-line: var(--border-default, #e6e8ee);
  --v-canvas: var(--bg-fill, #f4f6fa);
  --v-blue: var(--brand-600, #2563eb);
  --v-mono: 'JetBrains Mono', Consolas, monospace;

  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--bg-page, #fbfbfd);
  color: var(--v-ink);
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* ---------- 工具条 ---------- */
.cv__bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  border-bottom: 1px solid var(--v-line);
  background: var(--v-card);
}

.cv__filters {
  display: flex;
  gap: 2px;
  padding: 3px;
  border-radius: 999px;
  background: var(--bg-fill, #f1f3f8);
}

.cv__filter {
  appearance: none;
  cursor: pointer;
  border: 0;
  background: none;
  padding: 4px 11px;
  font-size: 12px;
  color: var(--v-ink2);
  border-radius: 999px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: background-color 150ms var(--ease-out, ease-out);
}

.cv__filter em {
  font-style: normal;
  font-family: var(--v-mono);
  font-size: 10px;
  color: var(--v-ink3);
}

.cv__filter.is-on {
  background: var(--v-card);
  color: var(--v-ink);
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(15, 18, 33, 0.1));
}

.cv__spacer { flex: 1; }

.cv__act {
  appearance: none;
  cursor: pointer;
  border: 1px solid var(--v-line);
  background: var(--v-card);
  color: var(--v-ink2);
  font-size: 11.5px;
  padding: 4px 10px;
  border-radius: var(--radius-sm, 6px);
}

.cv__act--pri {
  background: var(--v-blue);
  border-color: var(--v-blue);
  color: #fff;
  font-weight: 600;
}

/* ---------- 画布 ---------- */
.cv__viewport {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: var(--v-canvas);
}

.cv__board {
  position: relative;
  touch-action: none;
}

.cv__dots {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, color-mix(in srgb, var(--v-ink3) 32%, transparent) 1px, transparent 1px);
  background-size: 18px 18px;
  opacity: 0.5;
  pointer-events: none;
}

.cv__links {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.cv__links path {
  fill: none;
  stroke: color-mix(in srgb, var(--v-blue) 46%, transparent);
  stroke-width: 1.4;
  stroke-dasharray: 4 4;
}

/* ---------- 卡片 ---------- */
.crd {
  position: absolute;
  top: 0;
  left: 0;
  width: 352px;
  box-sizing: border-box;
  padding: 11px 13px 13px;
  border-radius: var(--radius-lg, 12px);
  background: var(--v-card);
  border: 1px solid var(--v-line);
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(15, 18, 33, 0.06));
  cursor: grab;
  user-select: none;
  transition: box-shadow 160ms var(--ease-out, ease-out), border-color 160ms var(--ease-out, ease-out);
  will-change: transform;
}

.crd--sm { min-height: 168px; }
.crd--lg { min-height: 240px; }

/* 加宽卡：图谱卡用，填满画布右侧 */
.crd.is-wide {
  width: 560px;
}

.crd.is-wide .crd__mini {
  height: 150px;
}

/* 每类卡片一个极浅的品牌色顶边（5% 强度，克制） */
.crd--kb { border-top: 3px solid var(--v-blue); }
.crd--doc { border-top: 3px solid #0d9488; }
.crd--ask { border-top: 3px solid #d97706; }
.crd--graph { border-top: 3px solid #7c3aed; }

.crd.is-on {
  border-color: color-mix(in srgb, var(--v-blue) 54%, var(--v-line));
  box-shadow: var(--shadow-md, 0 8px 20px rgba(15, 18, 33, 0.12));
}

.crd.is-drag {
  cursor: grabbing;
  transform-origin: center;
  box-shadow: var(--shadow-lg, 0 18px 36px rgba(15, 18, 33, 0.2));
  z-index: 5;
}

.crd__head {
  display: flex;
  align-items: center;
  gap: 6px;
}

.crd__kind {
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--v-ink3);
}

.crd__size {
  margin-left: auto;
  appearance: none;
  border: 1px solid var(--v-line);
  background: var(--v-card);
  color: var(--v-ink3);
  cursor: pointer;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  font-size: 10px;
  line-height: 1;
}

.crd__title {
  margin: 5px 0 8px;
  font-size: 13.5px;
  font-weight: 650;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.crd__desc,
.crd__answer {
  margin: 0 0 9px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--v-ink2);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.crd__row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 10.5px;
  color: var(--v-ink3);
}

.crd__row .crd__num,
.crd__num {
  font-family: var(--v-mono);
  font-size: 10.5px;
  color: var(--v-ink2);
}

.crd__st {
  padding: 1px 6px;
  border-radius: 3px;
  background: var(--bg-fill, #f1f3f8);
}

.crd__st[data-tone='success'] { background: color-mix(in srgb, var(--status-success, #15803d) 12%, transparent); color: var(--status-success, #15803d); }
.crd__st[data-tone='warning'] { background: color-mix(in srgb, var(--status-warning, #b45309) 14%, transparent); color: var(--status-warning, #b45309); }
.crd__st[data-tone='error'] { background: color-mix(in srgb, var(--status-error, #dc2626) 12%, transparent); color: var(--status-error, #dc2626); }

.crd__err {
  margin: 7px 0 0;
  font-size: 10.5px;
  line-height: 1.45;
  color: var(--status-error, #dc2626);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.crd__bar {
  margin-top: 8px;
  height: 3px;
  border-radius: 2px;
  background: color-mix(in srgb, var(--status-warning, #b45309) 16%, transparent);
  overflow: hidden;
}

.crd__bar i {
  display: block;
  height: 100%;
  background: var(--status-warning, #b45309);
  border-radius: 2px;
}

.crd__cite {
  font-family: var(--v-mono);
  font-size: 10px;
  color: var(--v-blue);
  padding: 1px 5px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--v-blue) 10%, transparent);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 图谱卡迷你放射状 */
.crd__mini {
  position: relative;
  height: 104px;
  margin: 4px 0 8px;
  border-radius: var(--radius-md, 8px);
  background: radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--v-blue) 9%, transparent), transparent 72%);
  overflow: hidden;
}

.crd__mini-hub {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 11px;
  height: 11px;
  margin: -5.5px 0 0 -5.5px;
  border-radius: 50%;
  background: var(--v-blue);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--v-blue) 16%, transparent);
}

/* 叶片：相对中心旋转后沿 X 轴外推，形成放射状 */
.crd__mini-leaf {
  position: absolute;
  left: 50%;
  top: 50%;
  width: var(--leaf);
  height: var(--leaf);
  margin: calc(var(--leaf) / -2) 0 0 calc(var(--leaf) / -2);
  border-radius: 50%;
  background: color-mix(in srgb, var(--v-blue) 62%, transparent);
  transform-origin: center;
}

/* ---------- 暗色 ---------- */
html.dark .cv {
  --v-ink: var(--text-primary, #e8edf6);
  --v-ink2: var(--text-secondary, #9aa6bd);
  --v-ink3: var(--text-tertiary, #76839c);
  --v-card: var(--bg-container, #1a1d27);
  --v-line: var(--border-default, rgba(255, 255, 255, 0.12));
  --v-canvas: var(--bg-page, #12141b);
  --v-blue: var(--brand-400, #60a5fa);
}

/* ---------- 响应式：画布可横向滚动，卡片收窄 ---------- */
@media (max-width: 760px) {
  .cv__bar { flex-wrap: wrap; }
  .cv__filters { overflow-x: auto; max-width: 100%; }
  .crd { width: 280px; }
  .crd.is-wide { width: 280px; }
  .crd.is-wide .crd__mini { height: 104px; }
}

@media (prefers-reduced-motion: reduce) {
  .crd { transition: none; }
}
</style>
