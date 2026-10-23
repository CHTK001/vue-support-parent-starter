<script setup lang="ts">
/**
 * 方向 2「Atlas（图谱图集）」。
 *
 * <p><b>核心判断</b>：知识图谱是这个产品最有价值的资产，却藏在第 4 个 Tab 里，
 * 而且只有打开「知识图谱」才能看到。本方向把图谱提升为<b>主视图</b>，
 * 切换 Tab 等于<b>切换图层</b>（文档层 / 实体层 / 关系层 / 问答层），地图本身不换。</p>
 *
 * <p><b>布局</b>：地图占主体（深墨蓝画布），右栏是「图例 + 选中对象档案」。
 * 实体按类型着色（复用 entityTypeStats 的语义），节点半径按 degree 缩放。</p>
 *
 * <p><b>签名元素</b>：图层切换时地图做「交叉淡入 + 轻微缩放」（像换一张地图胶片），
 * 右下角有比例尺（当前节点数 / 全量）。</p>
 *
 * <p><b>为什么不用 G6</b>：真实实现里已有 {@code ReRelationGraph}（@repo/ui，G6 内核），
 * 本探索稿用纯 CSS 绝对定位模拟同一套「节点 + 边」的视觉，以便在无图谱依赖下先定风格；
 * Phase 3 落地时把画布换回 ReRelationGraph，外层图例/档案栏/图层切换直接复用。</p>
 *
 * <p>Phase 2 探索稿 —— mock 数据，不动真实逻辑。</p>
 */
import { computed, ref } from 'vue'
import { MOCK_KBS, MOCK_FILES, MOCK_ENTITIES, MOCK_RELATIONS, MOCK_TURNS, ENTITY_LABEL, STATUS_LABEL } from './mockData'
import { fmtNum, fmtShort } from './shared'

const kb = MOCK_KBS[0]

/** 四个图层（= 原 7 个 Tab 的重新归并） */
const LAYERS = [
  { key: 'docs', label: '文档层', hint: '每篇文档是一个标注点' },
  { key: 'entities', label: '实体层', hint: '节点大小 = 关系条数' },
  { key: 'relations', label: '关系层', hint: '边 = 抽取出的语义关系' },
  { key: 'ask', label: '问答层', hint: '答案落在地图上的位置' },
] as const

const layer = ref<(typeof LAYERS)[number]['key']>('entities')

/**
 * 实体节点坐标：手工布局（真实实现由 G6 力导向给出）。
 * 铺开到 8%–92% 的横向区间，避免此前全部挤在画布中央一小块。
 */
const NODE_XY: Record<string, { x: number; y: number }> = {
  'e-1': { x: 50, y: 44 },
  'e-2': { x: 26, y: 26 },
  'e-3': { x: 76, y: 22 },
  'e-4': { x: 63, y: 66 },
  'e-5': { x: 22, y: 60 },
  'e-6': { x: 38, y: 52 },
  'e-7': { x: 78, y: 48 },
  'e-8': { x: 12, y: 40 },
  'e-9': { x: 52, y: 84 },
  'e-10': { x: 30, y: 78 },
}

/** 类型 → 色（语义固定，不随图层变化） */
const TYPE_COLOR: Record<string, string> = {
  person: '#5eead4',
  event: '#fbbf24',
  place: '#60a5fa',
  organization: '#c084fc',
  concept: '#f472b6',
  work: '#a3e635',
}

const activeId = ref('e-1')
const active = computed(() => MOCK_ENTITIES.find((e) => e.id === activeId.value) || MOCK_ENTITIES[0])

/** 当前选中实体的邻居（用于高亮边） */
const neighborEdges = computed(() =>
  MOCK_RELATIONS.filter((r) => r.from === activeId.value || r.to === activeId.value),
)

/** 实体类型分布（真实字段 entityTypeStats 同口径） */
const typeStats = computed(() => {
  const m = new Map<string, number>()
  MOCK_ENTITIES.forEach((e) => m.set(e.type, (m.get(e.type) || 0) + 1))
  const total = MOCK_ENTITIES.length
  return [...m.entries()]
    .map(([type, count]) => ({ type, count, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
})

/** 文档层：文档 → 半径按 chunks */
const docPoints = computed(() =>
  MOCK_FILES.map((f, i) => {
    const angle = (i / MOCK_FILES.length) * Math.PI * 2
    return {
      ...f,
      x: 50 + Math.cos(angle) * 26,
      y: 48 + Math.sin(angle) * 26,
      r: Math.max(8, Math.min(20, Math.sqrt(f.totalChunks || 1) * 2.2)),
    }
  }),
)

/** 选中实体所在文档（mock：固定取第一份） */
const activeDocs = computed(() => MOCK_FILES.filter((f) => f.processingStatus === 'completed').slice(0, 2))

const entityById = (id: string) => MOCK_ENTITIES.find((e) => e.id === id)
</script>

<template>
  <div class="at">
    <!-- ================= 顶栏：库 + 图层 ================= -->
    <header class="at__head">
      <div class="at__id">
        <h1>{{ kb.name }}</h1>
        <p>{{ kb.description }}</p>
      </div>
      <nav class="at__layers" role="tablist" aria-label="图层">
        <button
          v-for="l in LAYERS"
          :key="l.key"
          type="button"
          role="tab"
          class="at__layer"
          :class="{ 'is-on': layer === l.key }"
          :aria-selected="layer === l.key"
          @click="layer = l.key"
        >{{ l.label }}</button>
      </nav>
    </header>

    <div class="at__body">
      <!-- ================= 地图 ================= -->
      <div class="map" :data-layer="layer">
        <p class="map__hint">{{ LAYERS.find((l) => l.key === layer)?.hint }}</p>

        <!-- 实体层 / 关系层：共用同一张图，关系层额外显示边标签 -->
        <div v-if="layer === 'entities' || layer === 'relations'" class="map__stage map__stage--fade" :key="layer">
          <svg class="map__edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <line
              v-for="(r, i) in MOCK_RELATIONS"
              :key="i"
              :x1="NODE_XY[r.from]?.x"
              :y1="NODE_XY[r.from]?.y"
              :x2="NODE_XY[r.to]?.x"
              :y2="NODE_XY[r.to]?.y"
              :class="{ 'is-lit': neighborEdges.includes(r) }"
              vector-effect="non-scaling-stroke"
            />
          </svg>

          <!-- 边标签只在关系层出现 -->
          <template v-if="layer === 'relations'">
            <span
              v-for="(r, i) in MOCK_RELATIONS"
              :key="'l' + i"
              class="map__edge-label"
              :class="{ 'is-lit': neighborEdges.includes(r) }"
              :style="{
                left: `${((NODE_XY[r.from]?.x + NODE_XY[r.to]?.x) / 2)}%`,
                top: `${((NODE_XY[r.from]?.y + NODE_XY[r.to]?.y) / 2)}%`,
              }"
            >{{ r.text }}</span>
          </template>

          <button
            v-for="e in MOCK_ENTITIES"
            :key="e.id"
            type="button"
            class="node"
            :class="{ 'is-on': e.id === activeId, 'is-near': neighborEdges.some((r) => r.from === e.id || r.to === e.id) }"
            :style="{
              left: `${NODE_XY[e.id].x}%`,
              top: `${NODE_XY[e.id].y}%`,
              '--nc': TYPE_COLOR[e.type],
              '--nr': `${10 + Math.min(14, e.degree * 0.9)}px`,
            }"
            @click="activeId = e.id"
          >
            <span class="node__dot" />
            <span class="node__label">{{ e.text }}</span>
          </button>
        </div>

        <!-- 文档层 -->
        <div v-else-if="layer === 'docs'" class="map__stage map__stage--fade" key="docs">
          <button
            v-for="d in docPoints"
            :key="d.id"
            type="button"
            class="docpt"
            :style="{ left: `${d.x}%`, top: `${d.y}%`, '--dr': `${d.r}px` }"
            :data-status="d.processingStatus"
          >
            <span class="docpt__dot" />
            <span class="docpt__name">{{ d.displayName }}</span>
            <span class="docpt__n">{{ d.totalChunks || '—' }} 块</span>
          </button>
        </div>

        <!-- 问答层 -->
        <div v-else class="map__stage map__stage--fade" key="ask">
          <div class="qa-const">
            <p class="qa-const__q">{{ MOCK_TURNS[0].question }}</p>
            <div class="qa-const__chip" v-for="c in MOCK_TURNS[0].citations" :key="c.index">
              <b>[{{ c.index }}]</b>
              <span>{{ c.fileName }}</span>
              <em>{{ (c.score * 100).toFixed(0) }}%</em>
            </div>
          </div>
        </div>

        <!-- 比例尺（签名元素的另一半） -->
        <div class="map__scale">
          <span class="map__scale-bar" />
          <span>{{ MOCK_ENTITIES.length }} / {{ MOCK_RELATIONS.length }}</span>
        </div>
      </div>

      <!-- ================= 右栏：图例 + 档案 ================= -->
      <aside class="side">
        <section class="side__block">
          <h2>图例 · 实体类型</h2>
          <ul class="legend">
            <li v-for="s in typeStats" :key="s.type">
              <span class="legend__dot" :style="{ background: TYPE_COLOR[s.type] }" />
              <span class="legend__name">{{ ENTITY_LABEL[s.type] }}</span>
              <span class="legend__bar"><i :style="{ width: `${s.pct}%`, background: TYPE_COLOR[s.type] }" /></span>
              <span class="legend__n">{{ s.count }}</span>
            </li>
          </ul>
        </section>

        <section class="side__block side__block--grow">
          <h2>档案 · {{ active.text }}</h2>
          <p class="side__type" :style="{ color: TYPE_COLOR[active.type] }">{{ ENTITY_LABEL[active.type] }}</p>
          <dl class="side__kv">
            <div><dt>关系数</dt><dd>{{ active.degree }}</dd></div>
            <div><dt>所在文档</dt><dd>{{ activeDocs.length }}</dd></div>
          </dl>
          <ul class="side__rel">
            <li v-for="(r, i) in neighborEdges.slice(0, 5)" :key="i">
              <span>{{ entityById(r.from)?.text }}</span>
              <em>{{ r.text }}</em>
              <span>{{ entityById(r.to)?.text }}</span>
            </li>
          </ul>
        </section>

        <section class="side__block">
          <h2>库规模</h2>
          <p class="side__totals">
            {{ MOCK_FILES.length }} 文档 · {{ fmtNum(MOCK_FILES.reduce((a, f) => a + f.totalChunks, 0)) }} 块 ·
            {{ fmtShort(MOCK_FILES.reduce((a, f) => a + f.totalTokens, 0)) }} tokens
          </p>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.at {
  --a-ink: var(--text-primary, #17191f);
  --a-ink2: var(--text-secondary, #5c6270);
  --a-ink3: var(--text-tertiary, #8b8f9c);
  --a-card: var(--bg-container, #fff);
  --a-line: var(--border-default, #e6e8ee);
  --a-mono: 'JetBrains Mono', Consolas, monospace;

  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--bg-page, #fbfbfd);
  color: var(--a-ink);
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* ---------- 顶栏 ---------- */
.at__head {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--a-line);
  background: var(--a-card);
  flex-wrap: wrap;
}

.at__id h1 {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
}

.at__id p {
  margin: 2px 0 0;
  font-size: 11.5px;
  color: var(--a-ink3);
}

.at__layers {
  margin-left: auto;
  display: flex;
  gap: 2px;
  padding: 3px;
  border-radius: 999px;
  background: var(--bg-fill, #f1f3f8);
}

.at__layer {
  appearance: none;
  cursor: pointer;
  border: 0;
  background: none;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--a-ink2);
  border-radius: 999px;
  transition: background-color 160ms var(--ease-out, ease-out), color 160ms var(--ease-out, ease-out);
}

.at__layer.is-on {
  background: var(--a-card);
  color: var(--a-ink);
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(15, 18, 33, 0.1));
}

/* ---------- 主体 ---------- */
.at__body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
}

/* ---------- 地图：深色只在画布内 ---------- */
.map {
  position: relative;
  margin: 12px;
  border-radius: var(--radius-lg, 12px);
  background:
    radial-gradient(120% 80% at 50% 0%, #1a2438 0%, #0d1117 55%, #090c12 100%);
  overflow: hidden;
  min-height: 380px;
}

/* 网格底纹：地图的"经纬" */
.map::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
  background-size: 28px 28px;
  mask-image: radial-gradient(80% 70% at 50% 50%, #000 40%, transparent 100%);
  pointer-events: none;
}

.map__hint {
  position: absolute;
  top: 10px;
  left: 12px;
  margin: 0;
  font-size: 10.5px;
  color: rgba(255, 255, 255, 0.45);
  font-family: var(--a-mono);
  z-index: 2;
}

.map__stage {
  position: absolute;
  inset: 0;
}

/* 签名元素：切换图层时交叉淡入 + 轻微缩放 */
.map__stage--fade {
  animation: layer-in 320ms var(--ease-out, ease-out) both;
}

@keyframes layer-in {
  from { opacity: 0; transform: scale(0.985); }
  to { opacity: 1; transform: scale(1); }
}

.map__edges {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.map__edges line {
  stroke: rgba(255, 255, 255, 0.14);
  stroke-width: 1;
  transition: stroke 180ms var(--ease-out, ease-out);
}

.map__edges line.is-lit {
  stroke: rgba(94, 234, 212, 0.7);
}

.map__edge-label {
  position: absolute;
  transform: translate(-50%, -50%);
  font-size: 9.5px;
  font-family: var(--a-mono);
  color: rgba(255, 255, 255, 0.42);
  background: rgba(9, 12, 18, 0.72);
  padding: 1px 4px;
  border-radius: 3px;
  white-space: nowrap;
  pointer-events: none;
}

.map__edge-label.is-lit {
  color: #5eead4;
}

/* 节点 */
.node {
  position: absolute;
  transform: translate(-50%, -50%);
  appearance: none;
  border: 0;
  background: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 0;
  opacity: 0.72;
  transition: opacity 180ms var(--ease-out, ease-out);
}

.node:hover,
.node.is-on,
.node.is-near {
  opacity: 1;
}

.node__dot {
  width: var(--nr);
  height: var(--nr);
  border-radius: 50%;
  background: radial-gradient(circle at 34% 30%, color-mix(in srgb, var(--nc) 92%, #fff), var(--nc));
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--nc) 22%, transparent), 0 0 14px color-mix(in srgb, var(--nc) 42%, transparent);
  transition: transform 180ms var(--ease-out, ease-out);
}

.node:hover .node__dot,
.node.is-on .node__dot {
  transform: scale(1.12);
}

.node__label {
  font-size: 10.5px;
  color: rgba(255, 255, 255, 0.82);
  white-space: nowrap;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
}

.node.is-on .node__label {
  color: #fff;
  font-weight: 600;
}

/* 文档层标注点 */
.docpt {
  position: absolute;
  transform: translate(-50%, -50%);
  appearance: none;
  border: 0;
  background: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 0;
}

.docpt__dot {
  width: var(--dr);
  height: var(--dr);
  border-radius: 50%;
  background: color-mix(in srgb, #60a5fa 24%, transparent);
  border: 1.5px solid #60a5fa;
}

.docpt[data-status='failed'] .docpt__dot {
  border-color: #f87171;
  background: rgba(248, 113, 113, 0.18);
}

.docpt[data-status='processing'] .docpt__dot,
.docpt[data-status='queued'] .docpt__dot {
  border-color: #fbbf24;
  background: rgba(251, 191, 36, 0.18);
}

.docpt__name {
  max-width: 120px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.78);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.75);
}

.docpt__n {
  font-size: 9px;
  font-family: var(--a-mono);
  color: rgba(255, 255, 255, 0.45);
}

/* 问答层 */
.qa-const {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  padding: 10% 12%;
}

.qa-const__q {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  line-height: 1.5;
}

.qa-const__chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 11px;
  border-radius: var(--radius-md, 8px);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
}

.qa-const__chip b {
  color: #5eead4;
  font-family: var(--a-mono);
}

.qa-const__chip span { flex: 1; }

.qa-const__chip em {
  font-style: normal;
  font-family: var(--a-mono);
  font-size: 10.5px;
  color: rgba(255, 255, 255, 0.5);
}

/* 比例尺 */
.map__scale {
  position: absolute;
  right: 12px;
  bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-family: var(--a-mono);
  color: rgba(255, 255, 255, 0.45);
  z-index: 2;
}

.map__scale-bar {
  width: 34px;
  height: 5px;
  border-left: 1px solid rgba(255, 255, 255, 0.4);
  border-right: 1px solid rgba(255, 255, 255, 0.4);
  border-bottom: 1px solid rgba(255, 255, 255, 0.4);
}

/* ---------- 右栏 ---------- */
.side {
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--a-line);
  background: var(--a-card);
  overflow-y: auto;
  /* 右栏独立滚动：底部"库规模"不再被容器裁掉 */
  min-height: 0;
  padding-bottom: 8px;
}

.side__block {
  padding: 13px 14px;
}

.side__block + .side__block {
  border-top: 1px solid var(--border-subtle, #f0f2f7);
}

.side__block h2 {
  margin: 0 0 8px;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--a-ink3);
}

.side__block--grow { flex: 1; }

.legend {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.legend li {
  display: grid;
  grid-template-columns: 7px 52px minmax(0, 1fr) 18px;
  align-items: center;
  gap: 7px;
  font-size: 11.5px;
}

.legend__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.legend__name { color: var(--a-ink2); }

.legend__bar {
  height: 3px;
  border-radius: 2px;
  background: var(--bg-fill, #eef1f6);
  overflow: hidden;
}

.legend__bar i {
  display: block;
  height: 100%;
  border-radius: 2px;
}

.legend__n {
  text-align: right;
  font-family: var(--a-mono);
  font-size: 10.5px;
  color: var(--a-ink3);
}

.side__type {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
}

.side__kv {
  margin: 0 0 10px;
  display: flex;
  gap: 14px;
}

.side__kv div {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.side__kv dt {
  font-size: 10px;
  color: var(--a-ink3);
}

.side__kv dd {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  font-family: var(--a-mono);
}

.side__rel {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.side__rel li {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: var(--a-ink2);
  flex-wrap: wrap;
}

.side__rel em {
  font-style: normal;
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 3px;
  background: var(--bg-fill, #f1f3f8);
  color: var(--a-ink3);
}

.side__totals {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--a-ink2);
  font-family: var(--a-mono);
}

/* ---------- 暗色 ---------- */
html.dark .at {
  --a-ink: var(--text-primary, #e8edf6);
  --a-ink2: var(--text-secondary, #9aa6bd);
  --a-ink3: var(--text-tertiary, #76839c);
  --a-card: var(--bg-container, #1a1d27);
  --a-line: var(--border-default, rgba(255, 255, 255, 0.12));
}

/* ---------- 响应式 ---------- */
@media (max-width: 1080px) {
  .at__body { grid-template-columns: minmax(0, 1fr) 240px; }
}

@media (max-width: 820px) {
  .at__body { grid-template-columns: 1fr; }
  .side {
    border-left: 0;
    border-top: 1px solid var(--a-line);
    max-height: 46vh;
  }
  .map { min-height: 300px; }
  .at__layers { margin-left: 0; width: 100%; overflow-x: auto; }
  .at__layer { white-space: nowrap; }
}

@media (prefers-reduced-motion: reduce) {
  .map__stage--fade { animation: none; }
  .node__dot { transition: none; }
}
</style>
