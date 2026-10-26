<template>
  <div class="pv-mg pv-mg--split">
    <!-- 左：实体列常驻 -->
    <aside class="sp-rail">
      <div class="sp-rail__head">
        <div class="sp-rail__titlewrap">
          <h1 class="sp-rail__title">{{ spec.label }}</h1>
          <span class="sp-rail__count">{{ spec.rows?.length }}</span>
        </div>
        <button class="sp-add" type="button" :title="spec.primaryAction">+</button>
      </div>

      <div class="sp-search">
        <span class="sp-search__icon">⌕</span>
        <span class="sp-search__ph">搜索{{ spec.entity?.singular }}</span>
      </div>

      <nav class="sp-list" aria-label="实体列表">
        <button
          v-for="(r, i) in spec.rows"
          :key="r.id"
          type="button"
          class="sp-item"
          :class="{ 'is-on': selected?.id === r.id }"
          @click="selected = r"
        >
          <span class="sp-item__dot" :data-s="r.status || 'off'" />
          <span class="sp-item__body">
            <span class="sp-item__name">{{ r.cells[firstKey] }}</span>
            <span class="sp-item__meta">{{ r.note || r.cells['kind'] || r.cells['platform'] }}</span>
          </span>
          <span class="sp-item__tail">{{ tailOf(r, i) }}</span>
        </button>
      </nav>

      <div class="sp-rail__foot">
        <button class="sp-rail__more" type="button">管理分组与排序</button>
      </div>
    </aside>

    <!-- 右：详情 -->
    <main v-if="selected" class="sp-detail">
      <header class="sp-detail__head">
        <div class="sp-detail__id">
          <span class="sp-detail__kind">{{ kindOf(selected) }}</span>
          <h2 class="sp-detail__name">{{ selected.cells[firstKey] }}</h2>
          <p class="sp-detail__note">{{ selected.note || spec.subtitle }}</p>
        </div>
        <div class="sp-detail__actions">
          <span class="sp-pill" :data-s="selected.status || 'off'">{{ stateOf(selected) }}</span>
          <button class="sp-btn sp-btn--ghost" type="button">测试连接</button>
          <button class="sp-btn sp-btn--primary" type="button">编辑</button>
        </div>
      </header>

      <div class="sp-detail__grid">
        <div class="sp-detail__main">
          <!-- 读数块：有边框，与「台账」的无框读数区分开 -->
          <div class="sp-tiles">
            <div v-for="c in metricCols" :key="c.key" class="sp-tile">
              <span class="sp-tile__label">{{ c.label }}</span>
              <span class="sp-tile__value">{{ selected.cells[c.key] }}</span>
            </div>
            <div class="sp-tile">
              <span class="sp-tile__label">归属</span>
              <span class="sp-tile__value sp-tile__value--text">{{ kindOf(selected) }}</span>
            </div>
          </div>

          <section class="sp-sub">
            <div class="sp-sub__head">
              <h3 class="sp-sub__title">关联{{ spec.entity?.singular }}明细</h3>
              <span class="sp-muted">共 {{ children.length }} 项 · 按最近更新排序</span>
            </div>
            <div class="sp-tablewrap">
              <table class="sp-table">
                <thead>
                  <tr>
                    <th>名称</th>
                    <th v-for="c in metricCols" :key="c.key" :class="{ 'is-num': c.numeric }">{{ c.label }}</th>
                    <th class="is-num">状态</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in children" :key="r.id">
                    <td>
                      <span class="sp-dot" :data-s="r.status || 'off'" />
                      {{ r.cells[firstKey] }}
                    </td>
                    <td v-for="c in metricCols" :key="c.key" :class="{ 'is-num': c.numeric }">{{ r.cells[c.key] }}</td>
                    <td class="is-num"><span class="sp-mini" :data-s="r.status || 'off'">{{ stateOf(r) }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <!-- 右栏：活动 -->
        <aside class="sp-side">
          <h3 class="sp-side__title">最近活动</h3>
          <ol class="sp-timeline">
            <li v-for="(a, i) in activities" :key="i" class="sp-timeline__item">
              <span class="sp-timeline__dot" :data-i="i % 4" />
              <span class="sp-timeline__body">
                <span class="sp-timeline__text">{{ a.text }}</span>
                <span class="sp-timeline__time">{{ a.time }}</span>
              </span>
            </li>
          </ol>

          <div class="sp-side__note">
            <span class="sp-side__note-title">当前筛选</span>
            <div class="sp-side__chips">
              <button v-for="(f, i) in spec.filters.slice(0, 3)" :key="f" type="button" class="sp-chip" :class="{ 'is-on': i === 0 }">
                {{ f }}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { PageSpec, SpecRow } from '../specs'

const props = defineProps<{ spec: PageSpec }>()

const firstKey = computed(() => props.spec.columns?.[0]?.key || 'name')
const metricCols = computed(() =>
  (props.spec.columns || []).filter((c) => !['name', 'kind', 'state', 'platform', 'login'].includes(c.key)).slice(0, 3),
)

const selected = ref<SpecRow | undefined>(props.spec.rows?.[0])

watch(
  () => props.spec,
  (s) => (selected.value = s.rows?.[0]),
)

const children = computed(() => (props.spec.rows || []).filter((r) => r.id !== selected.value?.id))
const activities = computed(() => [
  { text: `${selected.value?.cells[firstKey.value] || '该实体'} 完成一次同步`, time: '12 分钟前' },
  { text: '密钥轮换成功，旧凭据已失效', time: '1 小时前' },
  { text: '探活检测通过 · 首字延迟 412 ms', time: '3 小时前' },
  { text: '成员「陈默」修改了限额配置', time: '昨天 18:22' },
])

function tailOf(r: SpecRow, i: number): string {
  return r.cells['quota'] || r.cells['latency'] || r.cells['messages'] || r.cells['models'] || String(i + 1)
}

function kindOf(r: SpecRow): string {
  return r.cells['kind'] || r.cells['platform'] || r.cells['login'] || props.spec.entity?.singular || '实体'
}

function stateOf(r: SpecRow): string {
  if (r.cells['state']) return r.cells['state']
  return r.status === 'on' ? '正常' : r.status === 'warn' ? '待处理' : '未启用'
}
</script>

<style scoped>
.pv-mg {
  display: grid;
  grid-template-columns: 316px minmax(0, 1fr);
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--bg-page);
  color: var(--text-primary);
  font-size: 13px;
}

/* ---------- 左栏 ---------- */
.sp-rail {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--bg-container);
  border-right: 1px solid var(--border-default);
}

.sp-rail__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 14px 10px;
}

.sp-rail__titlewrap { display: flex; align-items: baseline; gap: 8px; }

.sp-rail__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.sp-rail__count {
  font-size: 11px;
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
}

.sp-add {
  width: 26px;
  height: 26px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-default);
  background: var(--bg-container);
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
}

.sp-search {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 14px 8px;
  height: 30px;
  padding: 0 9px;
  border-radius: var(--radius-md);
  background: var(--bg-fill);
  color: var(--text-tertiary);
  font-size: 12px;
}

.sp-search__icon { font-size: 13px; }

.sp-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 0 8px 8px;
}

.sp-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 9px 8px 9px 10px;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  text-align: left;
  cursor: pointer;
  color: inherit;
}

.sp-item:hover { background: var(--bg-hover); }

.sp-item.is-on { background: var(--brand-50); }

.sp-item.is-on::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--brand-600);
}

.sp-item__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex: none;
  background: var(--status-offline);
}

.sp-item__dot[data-s='on'] { background: var(--status-success); }
.sp-item__dot[data-s='warn'] { background: var(--status-warning); }

.sp-item__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }

.sp-item__name {
  font-size: 12.5px;
  font-weight: 550;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sp-item__meta {
  font-size: 11px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sp-item__tail {
  flex: none;
  font-size: 10.5px;
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
}

.sp-rail__foot { padding: 8px 14px 12px; border-top: 1px solid var(--border-subtle); }

.sp-rail__more {
  border: 0;
  background: transparent;
  padding: 0;
  font-size: 11.5px;
  color: var(--text-tertiary);
  cursor: pointer;
}

/* ---------- 右栏详情 ---------- */
.sp-detail {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: auto;
  padding: 20px 24px 24px;
}

.sp-detail__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-subtle);
}

.sp-detail__id { min-width: 0; }

.sp-detail__kind {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--brand-600);
}

.sp-detail__name {
  margin: 4px 0 0;
  font-size: 21px;
  font-weight: 650;
  letter-spacing: -0.02em;
}

.sp-detail__note {
  margin: 5px 0 0;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--text-secondary);
  max-width: 70ch;
}

.sp-detail__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
  padding-top: 4px;
}

.sp-pill {
  height: 22px;
  padding: 0 9px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  font-size: 11px;
  background: var(--bg-fill);
  color: var(--text-secondary);
}

.sp-pill[data-s='on'] { background: rgba(22, 163, 74, 0.1); color: #15803d; }
.sp-pill[data-s='warn'] { background: rgba(245, 158, 11, 0.13); color: #b45309; }

.sp-btn {
  height: 30px;
  padding: 0 13px;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  font-size: 12.5px;
  font-weight: 550;
  cursor: pointer;
}

.sp-btn--primary { background: var(--brand-600); color: #fff; }
.sp-btn--ghost { background: var(--bg-container); border-color: var(--border-default); color: var(--text-secondary); }

.sp-detail__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 268px;
  gap: 22px;
  padding-top: 18px;
}

.sp-detail__main { min-width: 0; }

.sp-tiles {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.sp-tile {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 13px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-container);
}

.sp-tile__label { font-size: 11px; color: var(--text-tertiary); }

.sp-tile__value {
  font-size: 18px;
  font-weight: 620;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.sp-tile__value--text { font-size: 14px; font-weight: 550; }

.sp-sub { margin-top: 22px; }

.sp-sub__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.sp-sub__title { margin: 0; font-size: 13px; font-weight: 600; }

.sp-muted { font-size: 11px; color: var(--text-tertiary); }

.sp-tablewrap {
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-container);
}

.sp-table { width: 100%; border-collapse: collapse; table-layout: fixed; }

.sp-table th {
  padding: 8px 12px;
  text-align: left;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-tertiary);
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border-default);
  white-space: nowrap;
}

.sp-table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sp-table tr:last-child td { border-bottom: 0; }
.sp-table td:first-child { color: var(--text-primary); font-weight: 500; }
.sp-table th.is-num, .sp-table td.is-num { text-align: right; font-variant-numeric: tabular-nums; }

.sp-dot {
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  margin-right: 7px;
  vertical-align: middle;
  background: var(--status-offline);
}

.sp-dot[data-s='on'] { background: var(--status-success); }
.sp-dot[data-s='warn'] { background: var(--status-warning); }

.sp-mini { font-size: 11px; color: var(--text-tertiary); }
.sp-mini[data-s='on'] { color: var(--status-success); }
.sp-mini[data-s='warn'] { color: var(--status-warning); }

/* 右栏 */
.sp-side {
  border-left: 1px solid var(--border-subtle);
  padding-left: 18px;
  min-width: 0;
}

.sp-side__title {
  margin: 2px 0 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.sp-timeline { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }

.sp-timeline__item { display: flex; gap: 9px; }

.sp-timeline__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-top: 5px;
  flex: none;
  background: var(--brand-400);
}

.sp-timeline__dot[data-i='1'] { background: var(--status-success); }
.sp-timeline__dot[data-i='2'] { background: var(--status-warning); }
.sp-timeline__dot[data-i='3'] { background: var(--text-tertiary); }

.sp-timeline__body { display: flex; flex-direction: column; gap: 1px; }

.sp-timeline__text { font-size: 12px; line-height: 1.5; color: var(--text-secondary); }
.sp-timeline__time { font-size: 10.5px; color: var(--text-tertiary); }

.sp-side__note { margin-top: 20px; padding-top: 14px; border-top: 1px solid var(--border-subtle); }

.sp-side__note-title { font-size: 11px; color: var(--text-tertiary); }

.sp-side__chips { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }

.sp-chip {
  height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  border: 1px solid var(--border-default);
  background: transparent;
  color: var(--text-secondary);
  font-size: 11px;
  cursor: pointer;
}

.sp-chip.is-on { background: var(--brand-50); border-color: var(--brand-200); color: var(--brand-700); }

@media (max-width: 1100px) {
  .sp-detail__grid { grid-template-columns: minmax(0, 1fr); }
  .sp-side { border-left: 0; padding-left: 0; border-top: 1px solid var(--border-subtle); padding-top: 14px; }
}

@media (max-width: 820px) {
  .pv-mg { grid-template-columns: 240px minmax(0, 1fr); }
  .sp-detail { padding: 16px; }
  .sp-tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>