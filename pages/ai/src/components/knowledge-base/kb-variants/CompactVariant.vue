<script setup lang="ts">
/**
 * 方向 5「Compact（紧凑控制台）」。
 *
 * <p><b>核心判断</b>：知识库管理员真正要回答的是「300 篇文档里哪几篇失败了、token 花在哪」
 * 这类<b>运维</b>问题，不是「阅读」问题。本方向放弃一切装饰：无卡片、无插画、无衬线，
 * 只有表格、数字与状态。</p>
 *
 * <p><b>签名元素</b>：表格内每行 <code>totalTokens</code> 的<b>迷你条形</b> —— 2px 高、
 * 相对全库最大值缩放，让数字有形状，扫一眼就能定位"最贵的那几篇"。</p>
 *
 * <p><b>数据全覆盖</b>：本方向把几乎全部字段上屏（含此前从未展示的 totalChunks、
 * totalTokens、processedAt、errorMessage、chunkMaxSize 等），可作为其它方向的"字段字典"。</p>
 *
 * <p>Phase 2 探索稿 —— mock 数据，不动真实逻辑。</p>
 */
import { computed, ref } from 'vue'
import { MOCK_KBS, MOCK_FILES, MOCK_ENTITIES, MOCK_RELATIONS, ENTITY_LABEL, STATUS_LABEL } from './mockData'
import { fmtNum, fmtSize, fmtAgo, STATUS_TOKEN } from './shared'

const kb = MOCK_KBS[0]
const files = MOCK_FILES

/** 排序：默认按 token 降序（运维视角最关心消耗） */
type SortKey = 'name' | 'status' | 'chunks' | 'tokens' | 'time'
const sortKey = ref<SortKey>('tokens')
const sortDesc = ref(true)

const maxTokens = computed(() => Math.max(...files.map((f) => f.totalTokens), 1))

const sorted = computed(() => {
  const arr = [...files]
  arr.sort((a, b) => {
    const pick = (f: typeof a) =>
      sortKey.value === 'name' ? f.displayName
        : sortKey.value === 'status' ? f.processingStatus
          : sortKey.value === 'chunks' ? f.totalChunks
            : sortKey.value === 'tokens' ? f.totalTokens
              : f.uploadedAt
    const x = pick(a)
    const y = pick(b)
    const r = typeof x === 'number' && typeof y === 'number'
      ? x - y
      : String(x).localeCompare(String(y), 'zh')
    return sortDesc.value ? -r : r
  })
  return arr
})

function sortBy(k: SortKey) {
  if (sortKey.value === k) sortDesc.value = !sortDesc.value
  else {
    sortKey.value = k
    sortDesc.value = k !== 'name'
  }
}

/** 顶部数字带 */
const kpi = computed(() => {
  const done = files.filter((f) => f.processingStatus === 'completed')
  const tokens = files.reduce((a, f) => a + f.totalTokens, 0)
  const chunks = files.reduce((a, f) => a + f.totalChunks, 0)
  return [
    { k: '文档', v: files.length, s: `${done.length} 已索引` },
    { k: '切块', v: fmtNum(chunks), s: `上限 ${kb.chunkMaxSize} 字` },
    { k: 'Tokens', v: fmtNum(tokens), s: `${(tokens / Math.max(chunks, 1)).toFixed(0)} / 块` },
    { k: '实体', v: MOCK_ENTITIES.length, s: `${MOCK_RELATIONS.length} 关系` },
    { k: '失败', v: files.filter((f) => f.processingStatus === 'failed').length, s: '需处理', bad: true },
  ]
})

/** 密度切换（运维台常见需求） */
const dense = ref(true)
</script>

<template>
  <div class="cp" :class="{ 'is-dense': dense }">
    <!-- ================= 工具条 ================= -->
    <header class="cp__bar">
      <h1 class="cp__title">{{ kb.name }}</h1>
      <span class="cp__sep" />
      <span class="cp__meta">{{ kb.chunkMaxSize }}/{{ kb.chunkOverlapSize }}/{{ kb.chunkMinSize }} 字</span>
      <span v-if="!kb.isActive" class="cp__off">已停用</span>
      <div class="cp__spacer" />
      <button type="button" class="cp__tog" :class="{ 'is-on': dense }" @click="dense = !dense">紧凑</button>
      <button type="button" class="cp__tog">导出</button>
      <button type="button" class="cp__tog cp__tog--pri">上传</button>
    </header>

    <!-- ================= KPI 带 ================= -->
    <div class="cp__kpi">
      <div v-for="k in kpi" :key="k.k" class="kpi" :class="{ 'is-bad': k.bad && k.v }">
        <span class="kpi__k">{{ k.k }}</span>
        <b class="kpi__v">{{ k.v }}</b>
        <span class="kpi__s">{{ k.s }}</span>
      </div>
    </div>

    <!-- ================= 主表 ================= -->
    <div class="cp__tablewrap">
      <table class="tbl">
        <thead>
          <tr>
            <th class="col-name" @click="sortBy('name')">文档<em v-if="sortKey === 'name'">{{ sortDesc ? '↓' : '↑' }}</em></th>
            <th class="col-st" @click="sortBy('status')">状态<em v-if="sortKey === 'status'">{{ sortDesc ? '↓' : '↑' }}</em></th>
            <th class="col-n" @click="sortBy('chunks')">切块<em v-if="sortKey === 'chunks'">{{ sortDesc ? '↓' : '↑' }}</em></th>
            <th class="col-tok" @click="sortBy('tokens')">Tokens<em v-if="sortKey === 'tokens'">{{ sortDesc ? '↓' : '↑' }}</em></th>
            <th class="col-n">大小</th>
            <th class="col-t" @click="sortBy('time')">上传<em v-if="sortKey === 'time'">{{ sortDesc ? '↓' : '↑' }}</em></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="f in sorted" :key="f.id" :class="`row--${STATUS_TOKEN[f.processingStatus]}`">
            <td class="col-name">
              <span class="ext">{{ f.fileExtension.toUpperCase() }}</span>
              <span class="nm" :title="f.displayName">{{ f.displayName }}</span>
              <span v-if="f.processingStatus === 'failed'" class="err" :title="f.errorMessage">{{ f.errorMessage }}</span>
              <span v-else-if="f.processingStatus === 'processing'" class="prog">{{ f.currentStep }}</span>
            </td>
            <td class="col-st">
              <span class="st" :data-tone="STATUS_TOKEN[f.processingStatus]">
                {{ STATUS_LABEL[f.processingStatus] }}
                <i v-if="f.processingStatus === 'processing'">{{ f.progressPercentage }}%</i>
              </span>
            </td>
            <td class="col-n num">{{ f.totalChunks || '—' }}</td>
            <td class="col-tok">
              <span class="num">{{ fmtNum(f.totalTokens) || '—' }}</span>
              <!-- 签名元素：迷你条形 -->
              <span class="micro" aria-hidden="true">
                <i :style="{ width: `${(f.totalTokens / maxTokens) * 100}%` }" />
              </span>
            </td>
            <td class="col-n num dim">{{ fmtSize(f.fileSize) }}</td>
            <td class="col-t num dim">{{ fmtAgo(f.uploadedAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ================= 脚注：实体统计压成一行 ================= -->
    <footer class="cp__foot">
      <span class="foot__label">实体类型</span>
      <span v-for="e in MOCK_ENTITIES.slice(0, 6)" :key="e.id" class="foot__ent">
        {{ e.text }}<i>{{ ENTITY_LABEL[e.type] }}·{{ e.degree }}</i>
      </span>
    </footer>
  </div>
</template>

<style scoped>
.cp {
  --c-ink: var(--text-primary, #17191f);
  --c-ink2: var(--text-secondary, #5c6270);
  --c-ink3: var(--text-tertiary, #8b8f9c);
  --c-card: var(--bg-container, #fff);
  --c-line: var(--border-subtle, #eceef4);
  --c-line2: var(--border-default, #e0e3ea);
  --c-mono: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;

  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--bg-page, #fbfbfd);
  color: var(--c-ink);
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 12.5px;
}

/* ---------- 工具条 ---------- */
.cp__bar {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--c-line2);
  background: var(--c-card);
}

.cp__title {
  margin: 0;
  font-size: 13px;
  font-weight: 650;
}

.cp__sep {
  width: 1px;
  height: 12px;
  background: var(--c-line2);
}

.cp__meta {
  font-size: 11px;
  color: var(--c-ink3);
  font-family: var(--c-mono);
}

.cp__off {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 3px;
  border: 1px solid var(--c-line2);
  color: var(--c-ink3);
}

.cp__spacer { flex: 1; }

.cp__tog {
  appearance: none;
  cursor: pointer;
  border: 1px solid var(--c-line2);
  background: var(--c-card);
  color: var(--c-ink2);
  font-size: 11px;
  padding: 3px 9px;
  border-radius: var(--radius-sm, 4px);
}

.cp__tog:hover { border-color: var(--c-ink3); }

.cp__tog.is-on {
  background: var(--bg-fill, #eef1f6);
  color: var(--c-ink);
}

.cp__tog--pri {
  background: var(--brand-600, #2563eb);
  border-color: var(--brand-600, #2563eb);
  color: #fff;
}

/* ---------- KPI ---------- */
.cp__kpi {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  border-bottom: 1px solid var(--c-line2);
}

.kpi {
  display: flex;
  align-items: baseline;
  gap: 7px;
  padding: 9px 14px;
  flex-wrap: wrap;
}

.kpi + .kpi { border-left: 1px solid var(--c-line); }

.kpi__k {
  font-size: 10px;
  color: var(--c-ink3);
  flex-shrink: 0;
}

.kpi__v {
  font-family: var(--c-mono);
  font-size: 15px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  margin-left: auto;
}

.kpi__s {
  flex-basis: 100%;
  font-size: 10px;
  color: var(--c-ink3);
}

.kpi.is-bad .kpi__v { color: var(--status-error, #dc2626); }

/* ---------- 表 ---------- */
.cp__tablewrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: var(--c-card);
}

.tbl {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.tbl thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--c-card);
  text-align: left;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--c-ink3);
  padding: 7px 10px;
  border-bottom: 1px solid var(--c-line2);
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
}

.tbl thead th em {
  font-style: normal;
  margin-left: 3px;
  color: var(--brand-600, #2563eb);
}

.tbl tbody td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--c-line);
  vertical-align: top;
}

.cp.is-dense .tbl tbody td { padding: 5px 10px; }

.tbl tbody tr:hover { background: var(--bg-hover, #f7f8fb); }

.col-name { width: 40%; }
.col-st { width: 96px; }
.col-n { width: 64px; text-align: right; }
.col-tok { width: 132px; }
.col-t { width: 78px; text-align: right; }

.col-name .ext {
  display: inline-block;
  min-width: 26px;
  margin-right: 7px;
  font-family: var(--c-mono);
  font-size: 9px;
  font-weight: 600;
  padding: 1px 3px;
  border-radius: 2px;
  background: var(--bg-fill, #eef1f6);
  color: var(--c-ink2);
  text-align: center;
}

.col-name .nm {
  font-size: 12.5px;
  color: var(--c-ink);
}

.col-name .err,
.col-name .prog {
  display: block;
  margin: 2px 0 0 33px;
  font-size: 10.5px;
  line-height: 1.4;
  color: var(--status-error, #dc2626);
}

.col-name .prog { color: var(--status-warning, #b45309); }

.num {
  font-family: var(--c-mono);
  font-variant-numeric: tabular-nums;
  font-size: 11.5px;
  text-align: right;
}

.dim { color: var(--c-ink3); }

.col-tok {
  display: flex;
  align-items: center;
  gap: 7px;
  justify-content: flex-end;
}

.col-tok .num { flex-shrink: 0; }

/* 签名元素：迷你条形 */
.micro {
  width: 44px;
  height: 2px;
  border-radius: 1px;
  background: var(--bg-fill, #eef1f6);
  overflow: hidden;
  flex-shrink: 0;
}

.micro i {
  display: block;
  height: 100%;
  border-radius: 1px;
  background: var(--brand-500, #3b82f6);
}

.row--error .micro i { background: var(--status-error, #dc2626); }
.row--warning .micro i { background: var(--status-warning, #b45309); }

.st {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--c-ink2);
  white-space: nowrap;
}

.st::before {
  content: '';
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--status-info, #64748b);
}

.st[data-tone='success']::before { background: var(--status-success, #15803d); }
.st[data-tone='warning']::before { background: var(--status-warning, #b45309); }
.st[data-tone='error']::before { background: var(--status-error, #dc2626); }
.st[data-tone='error'] { color: var(--status-error, #dc2626); }

.st i {
  font-style: normal;
  font-family: var(--c-mono);
  font-size: 10px;
  color: var(--c-ink3);
}

/* ---------- 脚注 ---------- */
.cp__foot {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 7px 14px;
  border-top: 1px solid var(--c-line2);
  background: var(--c-card);
}

.foot__label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--c-ink3);
}

.foot__ent {
  font-size: 11px;
  color: var(--c-ink2);
  padding: 2px 7px;
  border-radius: 3px;
  background: var(--bg-fill, #f1f3f8);
}

.foot__ent i {
  font-style: normal;
  font-size: 9.5px;
  color: var(--c-ink3);
  margin-left: 4px;
}

/* ---------- 暗色 ---------- */
html.dark .cp {
  --c-ink: var(--text-primary, #e8edf6);
  --c-ink2: var(--text-secondary, #9aa6bd);
  --c-ink3: var(--text-tertiary, #76839c);
  --c-card: var(--bg-container, #1a1d27);
  --c-line: var(--border-subtle, rgba(255, 255, 255, 0.06));
  --c-line2: var(--border-default, rgba(255, 255, 255, 0.12));
}

/* ---------- 响应式 ----------
 * 关键：隐藏列必须同时作用于 th 与 td（此前只隐藏 td，导致表头与单元格错位、
 * 名称列被挤到 40% 宽而每行只排几个字）。窄屏改为「名称 + token」两列。 */
@media (max-width: 1080px) {
  .col-n, .col-t { display: none; }
}

@media (max-width: 820px) {
  .col-st { display: none; }
  .col-name { width: auto; }
  .col-tok { width: 108px; }
  .cp__kpi { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .kpi:nth-child(n + 4) { display: none; }
}

@media (max-width: 700px) {
  .cp__kpi { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .kpi:nth-child(n + 3) { display: none; }
  .cp__bar { flex-wrap: wrap; }
  .cp__meta { display: none; }
  .col-name .nm { white-space: normal; }
  .micro { width: 28px; }
}

@media (prefers-reduced-motion: reduce) {
  .cp__tog { transition: none; }
}
</style>
