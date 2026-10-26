<template>
  <div class="pv-mg pv-mg--cards">
    <!-- 大标题 + 可读说明句，右上是主动作 -->
    <header class="cd-head">
      <div class="cd-head__text">
        <p class="cd-head__eyebrow">{{ spec.entity?.plural || '管理' }}</p>
        <h1 class="cd-head__title">{{ spec.label }}</h1>
        <p class="cd-head__sub">{{ spec.subtitle }}</p>
      </div>
      <div class="cd-head__actions">
        <button v-if="spec.secondaryAction" class="cd-btn cd-btn--ghost" type="button">
          {{ spec.secondaryAction }}
        </button>
        <button class="cd-btn cd-btn--primary" type="button">{{ spec.primaryAction }}</button>
      </div>
    </header>

    <!-- 读数带：大数字 + 底注，靠留白分组 -->
    <section class="cd-ribbon">
      <div v-for="s in spec.stats" :key="s.label" class="cd-ribbon__cell">
        <span class="cd-ribbon__value">{{ s.value }}</span>
        <span class="cd-ribbon__label">{{ s.label }}</span>
        <span class="cd-ribbon__hint" :data-tone="s.tone || 'flat'">{{ s.hint }}</span>
      </div>
    </section>

    <!-- 筛选 + 视图切换 -->
    <div class="cd-tools">
      <div class="cd-chips">
        <button
          v-for="(f, i) in spec.filters"
          :key="f"
          type="button"
          class="cd-chip"
          :class="{ 'is-on': i === 0 }"
        >{{ f }}</button>
      </div>
      <div class="cd-tools__right">
        <span class="cd-muted">{{ spec.rows?.length }} 个{{ spec.entity?.singular }}</span>
        <span class="cd-view">
          <button class="cd-view__btn is-on" type="button" title="卡片">▤</button>
          <button class="cd-view__btn" type="button" title="列表">☰</button>
        </span>
      </div>
    </div>

    <!-- 卡片栅格 -->
    <div class="cd-grid">
      <article v-for="(r, i) in spec.rows" :key="r.id" class="cd-card" :data-status="r.status || 'off'">
        <div class="cd-card__head">
          <span class="cd-avatar" :data-i="i % 4">{{ initials(r.cells[spec.columns?.[0]?.key || 'name']) }}</span>
          <div class="cd-card__id">
            <h2 class="cd-card__name">{{ r.cells[spec.columns?.[0]?.key || 'name'] }}</h2>
            <span class="cd-card__kind">{{ r.cells['kind'] || r.cells['platform'] || r.cells['login'] }}</span>
          </div>
          <span class="cd-pill" :data-s="r.status || 'off'">{{ r.cells['state'] || labelOf(r.status) }}</span>
        </div>

        <p v-if="r.note" class="cd-card__note">{{ r.note }}</p>

        <dl class="cd-metrics">
          <div v-for="c in metricCols" :key="c.key" class="cd-metric">
            <dt>{{ c.label }}</dt>
            <dd>{{ r.cells[c.key] }}</dd>
          </div>
        </dl>

        <div class="cd-card__foot">
          <span class="cd-card__meta">{{ r.cells['sync'] || r.cells['last'] || '—' }}</span>
          <button class="cd-link" type="button">管理 →</button>
        </div>
      </article>

      <!-- 新增占位卡：让栅格收口，也给唯一主操作一个落点 -->
      <button class="cd-card cd-card--add" type="button">
        <span class="cd-add__icon">+</span>
        <span class="cd-add__text">{{ spec.primaryAction }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PageSpec } from '../specs'

const props = defineProps<{ spec: PageSpec }>()

/** 卡片里的三个读数：跳过标识列与状态列 */
const metricCols = computed(() =>
  (props.spec.columns || []).filter((c) => !['name', 'kind', 'state', 'platform', 'login'].includes(c.key)).slice(0, 3),
)

function initials(name?: string): string {
  if (!name) return '·'
  return name.trim().slice(0, 1)
}

function labelOf(s?: string): string {
  return s === 'on' ? '已连接' : s === 'warn' ? '待处理' : '未连接'
}
</script>

<style scoped>
.pv-mg {
  height: 100%;
  min-height: 0;
  overflow: auto;
  background: var(--bg-page);
  color: var(--text-primary);
  padding: 28px 32px 36px;
  font-size: 13px;
}

/* ---------- 头部 ---------- */
.cd-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  max-width: 1360px;
  margin: 0 auto;
}

.cd-head__text { min-width: 0; }

.cd-head__eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--brand-600);
}

.cd-head__title {
  margin: 0;
  font-size: 27px;
  line-height: 1.15;
  font-weight: 650;
  letter-spacing: -0.025em;
}

.cd-head__sub {
  margin: 8px 0 0;
  max-width: 62ch;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-secondary);
}

.cd-head__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
  padding-top: 18px;
}

.cd-btn {
  height: 34px;
  padding: 0 16px;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  font-size: 13px;
  font-weight: 550;
  cursor: pointer;
}

.cd-btn--primary {
  background: var(--brand-600);
  color: #fff;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.22);
}

.cd-btn--ghost {
  background: var(--bg-container);
  border-color: var(--border-default);
  color: var(--text-secondary);
}

/* ---------- 读数带 ---------- */
.cd-ribbon {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  max-width: 1360px;
  margin: 26px auto 0;
  padding: 18px 0;
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
}

.cd-ribbon__cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 22px;
  border-left: 1px solid var(--border-subtle);
}

.cd-ribbon__cell:first-child { padding-left: 0; border-left: 0; }

.cd-ribbon__value {
  font-size: 30px;
  font-weight: 640;
  line-height: 1.05;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}

.cd-ribbon__label { font-size: 12px; color: var(--text-secondary); }
.cd-ribbon__hint { font-size: 11px; color: var(--text-tertiary); }
.cd-ribbon__hint[data-tone='up'] { color: var(--status-success); }
.cd-ribbon__hint[data-tone='down'] { color: var(--status-error); }

/* ---------- 工具条 ---------- */
.cd-tools {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  max-width: 1360px;
  margin: 20px auto 14px;
  flex-wrap: wrap;
}

.cd-chips { display: flex; gap: 6px; flex-wrap: wrap; }

.cd-chip {
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--border-default);
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
}

.cd-chip.is-on {
  background: var(--text-primary);
  border-color: var(--text-primary);
  color: var(--bg-container);
  font-weight: 550;
}

.cd-tools__right { display: flex; align-items: center; gap: 12px; }
.cd-muted { font-size: 11.5px; color: var(--text-tertiary); }

.cd-view {
  display: inline-flex;
  padding: 2px;
  border-radius: var(--radius-md);
  background: var(--bg-fill);
}

.cd-view__btn {
  width: 26px;
  height: 24px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  font-size: 11px;
}

.cd-view__btn.is-on {
  background: var(--bg-container);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
}

/* ---------- 卡片栅格 ---------- */
.cd-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(316px, 1fr));
  gap: 14px;
  max-width: 1360px;
  margin: 0 auto;
}

.cd-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 16px 12px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-container);
  text-align: left;
  transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}

.cd-card:hover {
  border-color: var(--brand-200);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.07);
  transform: translateY(-1px);
}

.cd-card__head {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}

.cd-avatar {
  width: 38px;
  height: 38px;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  font-size: 16px;
  font-weight: 600;
  background: var(--brand-50);
  color: var(--brand-700);
}

.cd-avatar[data-i='1'] { background: rgba(22, 163, 74, 0.1); color: #15803d; }
.cd-avatar[data-i='2'] { background: rgba(245, 158, 11, 0.12); color: #b45309; }
.cd-avatar[data-i='3'] { background: rgba(109, 40, 217, 0.1); color: #6d28d9; }

.cd-card__id { min-width: 0; flex: 1; }

.cd-card__name {
  margin: 0;
  font-size: 14.5px;
  font-weight: 600;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cd-card__kind {
  font-size: 11.5px;
  color: var(--text-tertiary);
}

.cd-pill {
  flex: none;
  height: 22px;
  padding: 0 9px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  font-size: 11px;
  background: var(--bg-fill);
  color: var(--text-secondary);
}

.cd-pill[data-s='on'] { background: rgba(22, 163, 74, 0.1); color: #15803d; }
.cd-pill[data-s='warn'] { background: rgba(245, 158, 11, 0.13); color: #b45309; }

.cd-card__note {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: var(--text-tertiary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 37px;
}

.cd-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
  padding: 10px 0;
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
}

.cd-metric { display: flex; flex-direction: column; gap: 1px; min-width: 0; }

.cd-metric dt {
  font-size: 10.5px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cd-metric dd {
  margin: 0;
  font-size: 13.5px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}

.cd-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.cd-card__meta { font-size: 11px; color: var(--text-tertiary); }

.cd-link {
  border: 0;
  background: transparent;
  padding: 0;
  font-size: 12px;
  font-weight: 550;
  color: var(--brand-600);
  cursor: pointer;
}

/* 新增卡 */
.cd-card--add {
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 168px;
  border-style: dashed;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
}

.cd-add__icon {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--bg-fill);
  font-size: 18px;
  line-height: 1;
}

.cd-add__text { font-size: 12.5px; }

@media (max-width: 900px) {
  .pv-mg { padding: 20px 16px 28px; }
  .cd-head { flex-direction: column; gap: 10px; }
  .cd-head__actions { padding-top: 0; }
  .cd-ribbon { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 16px; }
  .cd-ribbon__cell:nth-child(3) { padding-left: 0; border-left: 0; }
}
</style>