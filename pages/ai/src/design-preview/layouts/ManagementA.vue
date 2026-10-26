<template>
  <div class="pv-mg pv-mg--ledger">
    <!-- 贴边工具条：只有一条下分隔线，标题与操作同排 -->
    <header class="mg-head">
      <div class="mg-head__main">
        <h1 class="mg-head__title">{{ spec.label }}</h1>
        <span class="mg-head__count">{{ spec.stats[0]?.value }} {{ spec.entity?.plural || '项' }}</span>
      </div>
      <p class="mg-head__sub">{{ spec.subtitle }}</p>
      <div class="mg-head__actions">
        <button class="mg-btn mg-btn--ghost" type="button">{{ spec.secondaryAction }}</button>
        <button class="mg-btn mg-btn--primary" type="button">{{ spec.primaryAction }}</button>
      </div>
    </header>

    <div class="mg-body">
      <!-- 指标：一行等分，靠竖线分隔，不做成四张卡 -->
      <section class="mg-stats" aria-label="概览">
        <div v-for="s in spec.stats" :key="s.label" class="mg-stat">
          <span class="mg-stat__value">{{ s.value }}</span>
          <span class="mg-stat__label">{{ s.label }}</span>
          <span class="mg-stat__hint" :data-tone="s.tone || 'flat'">{{ s.hint }}</span>
        </div>
      </section>

      <!-- 工具条 -->
      <div class="mg-tools">
        <div class="mg-search">
          <span class="mg-search__icon">⌕</span>
          <span class="mg-search__ph">搜索{{ spec.entity?.singular || '名称' }}</span>
        </div>
        <div class="mg-chips">
          <button
            v-for="(f, i) in spec.filters"
            :key="f"
            type="button"
            class="mg-chip"
            :class="{ 'is-on': i === 0 }"
          >{{ f }}</button>
        </div>
        <div class="mg-tools__right">
          <span class="mg-muted">共 {{ total }} 条</span>
          <button class="mg-icon" type="button" title="刷新">↻</button>
          <button class="mg-icon" type="button" title="导出">↧</button>
          <button class="mg-icon" type="button" title="列设置">≡</button>
        </div>
      </div>

      <!-- 批量操作条：选中后才出现（Mock 里点第一列复选框即可看到） -->
      <div v-if="selected.size" class="mg-bulk">
        <span class="mg-bulk__count">已选 {{ selected.size }} 项</span>
        <button class="mg-bulk__btn" type="button">批量启用</button>
        <button class="mg-bulk__btn" type="button">批量停用</button>
        <button class="mg-bulk__btn" type="button">导出所选</button>
        <button class="mg-bulk__btn" type="button">删除</button>
        <button class="mg-bulk__close" type="button" @click="selected.clear()">取消选择</button>
      </div>

      <!-- 全宽表格 -->
      <div class="mg-tablewrap">
        <table class="mg-table">
          <thead>
            <tr>
              <th class="mg-check">
                <input type="checkbox" :checked="allChecked" @change="toggleAll" />
              </th>
              <th
                v-for="c in spec.columns"
                :key="c.key"
                :style="c.width ? { width: c.width } : undefined"
                :class="{ 'is-num': c.numeric }"
              >
                {{ c.label }}
                <span v-if="c.key === sortKey" class="mg-sort">{{ sortAsc ? '↑' : '↓' }}</span>
              </th>
              <th class="mg-ops">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in spec.rows" :key="r.id" :class="{ 'is-picked': selected.has(r.id) }">
              <td class="mg-check">
                <input type="checkbox" :checked="selected.has(r.id)" @change="toggle(r.id)" />
              </td>
              <td v-for="(c, ci) in spec.columns" :key="c.key" :class="{ 'is-num': c.numeric }">
                <template v-if="ci === 0">
                  <span class="mg-dot" :data-s="r.status || 'off'" />
                  <span class="mg-name">
                    <span class="mg-name__t">{{ r.cells[c.key] }}</span>
                    <span v-if="r.note" class="mg-name__n">{{ r.note }}</span>
                  </span>
                </template>
                <template v-else-if="c.key === 'state'">
                  <span class="mg-state" :data-s="r.status || 'off'">
                    {{ r.cells[c.key] }}
                  </span>
                </template>
                <template v-else>{{ r.cells[c.key] }}</template>
              </td>
              <td class="mg-ops">
                <button class="mg-op" type="button">编辑</button>
                <button class="mg-op" type="button">测试</button>
                <button class="mg-op mg-op--more" type="button" title="更多">⋯</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer class="mg-foot">
        <span class="mg-muted">显示 1–{{ spec.rows?.length }} 条，共 {{ total }} 条</span>
        <div class="mg-pager">
          <select class="mg-pagesize" aria-label="每页条数">
            <option>20 / 页</option>
            <option>50 / 页</option>
            <option>100 / 页</option>
          </select>
          <button class="mg-icon" type="button">‹</button>
          <button class="mg-icon is-on" type="button">1</button>
          <button class="mg-icon" type="button">2</button>
          <button class="mg-icon" type="button">›</button>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { PageSpec } from '../specs'

const props = defineProps<{ spec: PageSpec }>()

const selected = reactive(new Set<string>())
const sortKey = ref('name')
const sortAsc = ref(true)

const total = computed(() => {
  const raw = props.spec.stats[0]?.value || ''
  const n = Number(raw.replace(/[^\d.]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : props.spec.rows?.length || 0
})

const allChecked = computed(
  () => !!props.spec.rows?.length && props.spec.rows.every((r) => selected.has(r.id)),
)

function toggle(id: string): void {
  selected.has(id) ? selected.delete(id) : selected.add(id)
}

function toggleAll(e: Event): void {
  const on = (e.target as HTMLInputElement).checked
  selected.clear()
  if (on) props.spec.rows?.forEach((r) => selected.add(r.id))
}
</script>

<style scoped>
.pv-mg {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--bg-page);
  color: var(--text-primary);
  font-size: 13px;
}

/* ---------- 头部：贴边工具条 ---------- */
.mg-head {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 2px 24px;
  padding: 14px 24px 12px;
  border-bottom: 1px solid var(--border-default);
  background: var(--bg-container);
}

.mg-head__main {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}

.mg-head__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.mg-head__count {
  font-size: 12px;
  color: var(--text-tertiary);
}

.mg-head__sub {
  grid-column: 1;
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-secondary);
  max-width: 68ch;
}

.mg-head__actions {
  grid-column: 2;
  grid-row: 1 / span 2;
  display: flex;
  align-items: center;
  gap: 8px;
}

.mg-btn {
  height: 30px;
  padding: 0 13px;
  border-radius: var(--radius-md);
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 140ms ease, border-color 140ms ease;
}

.mg-btn--primary {
  background: var(--brand-600);
  color: #fff;
}

.mg-btn--primary:hover { background: var(--brand-700); }

.mg-btn--ghost {
  background: var(--bg-container);
  border-color: var(--border-default);
  color: var(--text-secondary);
}

.mg-btn--ghost:hover { background: var(--bg-hover); }

/* ---------- 主体 ---------- */
.mg-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0 24px 16px;
}

.mg-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-bottom: 1px solid var(--border-subtle);
}

.mg-stat {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 14px 16px 13px;
  border-left: 1px solid var(--border-subtle);
  min-width: 0;
}

.mg-stat:first-child { border-left: 0; padding-left: 0; }

.mg-stat__value {
  font-size: 23px;
  font-weight: 620;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  line-height: 1;
}

.mg-stat__label {
  font-size: 12px;
  color: var(--text-secondary);
}

.mg-stat__hint {
  margin-left: auto;
  font-size: 11px;
  color: var(--text-tertiary);
  white-space: nowrap;
}

.mg-stat__hint[data-tone='up'] { color: var(--status-success); }
.mg-stat__hint[data-tone='down'] { color: var(--status-error); }

/* ---------- 工具条 ---------- */
.mg-tools {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0 10px;
  flex-wrap: wrap;
}

.mg-search {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 30px;
  padding: 0 10px;
  width: 240px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-container);
  color: var(--text-tertiary);
}

.mg-search__icon { font-size: 14px; line-height: 1; }

.mg-chips { display: flex; gap: 6px; flex-wrap: wrap; }

.mg-chip {
  height: 26px;
  padding: 0 11px;
  border-radius: 999px;
  border: 1px solid var(--border-default);
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
}

.mg-chip.is-on {
  background: var(--brand-50);
  border-color: var(--brand-200);
  color: var(--brand-700);
  font-weight: 550;
}

.mg-tools__right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.mg-icon {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-default);
  background: var(--bg-container);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
}

.mg-icon.is-on {
  background: var(--brand-50);
  border-color: var(--brand-200);
  color: var(--brand-700);
}

/* ---------- 表格 ---------- */
.mg-tablewrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-container);
}

.mg-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.mg-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 9px 14px;
  text-align: left;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--text-tertiary);
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border-default);
  white-space: nowrap;
}

.mg-table th.is-num,
.mg-table td.is-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.mg-table td {
  padding: 9px 14px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 12.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mg-table tbody tr:last-child td { border-bottom: 0; }
.mg-table tbody tr:hover td { background: var(--bg-hover); }

.mg-table td:first-child {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--text-primary);
}

.mg-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex: none;
  background: var(--status-offline);
}

.mg-dot[data-s='on'] { background: var(--status-success); box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.12); }
.mg-dot[data-s='warn'] { background: var(--status-warning); box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.14); }

.mg-name { display: flex; flex-direction: column; gap: 1px; min-width: 0; }

.mg-name__t {
  font-weight: 550;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mg-name__n {
  font-size: 11px;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
}

.mg-state {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 11px;
  background: var(--bg-fill);
  color: var(--text-secondary);
}

.mg-state[data-s='on'] { background: rgba(22, 163, 74, 0.1); color: #15803d; }
.mg-state[data-s='warn'] { background: rgba(245, 158, 11, 0.12); color: #b45309; }

/* ---------- 底部 ---------- */
.mg-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
}

.mg-pager { display: flex; gap: 4px; }
.mg-muted { font-size: 11.5px; color: var(--text-tertiary); }

@media (max-width: 900px) {
  .mg-head { padding: 12px 16px 10px; }
  .mg-body { padding: 0 16px 12px; }
  .mg-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .mg-stat:nth-child(3) { border-left: 0; padding-left: 0; }
  .mg-search { width: 100%; }
}
</style>