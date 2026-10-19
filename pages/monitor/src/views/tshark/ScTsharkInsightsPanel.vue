<!--
  异常诊断面板

  会话的「体检表」：连接重置、ICMP 不可达、重传、乱序、零窗口、DNS 解析失败、
  HTTP 4xx/5xx、TLS 告警。计数来自后端 SQL（走的是同一份显示过滤），
  每行都带一条等价的过滤表达式 —— 点这一行就把它回填到过滤条并切到报文页。

  为什么不在这里再列一遍报文：报文表已经把分页 / 右键 / 生命周期做全了，
  这里只负责「指出哪里不对」，深挖交给报文页，避免同一份表格维护两套。
-->
<template>
  <div class="tshark-panel insight-panel">
    <div class="insight-summary">
      <div class="insight-summary__cell is-danger">
        <span class="insight-summary__value">{{ dangerCount }}</span>
        <span class="insight-summary__label">危险</span>
      </div>
      <div class="insight-summary__cell is-warning">
        <span class="insight-summary__value">{{ warningCount }}</span>
        <span class="insight-summary__label">警告</span>
      </div>
      <div class="insight-summary__cell is-info">
        <span class="insight-summary__value">{{ infoCount }}</span>
        <span class="insight-summary__label">提示</span>
      </div>
      <div class="insight-summary__cell">
        <span class="insight-summary__value">{{ totalCount }}</span>
        <span class="insight-summary__label">命中项</span>
      </div>
      <span class="tshark-panel__spacer" />
      <span class="insight-scope">
        {{ filtered ? '统计范围：当前显示过滤命中的报文' : '统计范围：本会话全部报文' }}
      </span>
    </div>

    <div class="tshark-panel__body">
      <div v-if="loading" v-loading="true" class="insight-loading" element-loading-text="正在体检…" />

      <ReEmpty
        v-else-if="anomalies.length === 0"
        :description="filtered ? '当前过滤下没有命中常见异常' : '没有命中常见异常，这条会话看起来很干净'"
        layout="modern"
      />

      <ul v-else class="insight-list">
        <li
          v-for="row in anomalies"
          :key="row.key"
          class="insight-row"
          :class="`is-${row.severity}`"
          tabindex="0"
          @click="pick(row)"
          @keydown.enter="pick(row)"
        >
          <span class="insight-row__dot" />
          <span class="insight-row__label">{{ row.label }}</span>
          <code v-if="row.filter" class="insight-row__filter" :title="`点击筛到报文：${row.filter}`">{{ row.filter }}</code>
          <span class="tshark-panel__spacer" />
          <span class="insight-row__count">{{ formatCount(row.count) }}</span>
          <span class="insight-row__go">筛到报文 →</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TsharkAnomaly } from './types'

const props = defineProps<{
  anomalies: TsharkAnomaly[]
  /** 当前是否带着显示过滤：决定「没有异常」的文案是「干净」还是「过滤后为空」 */
  filtered: boolean
  loading: boolean
}>()

const emit = defineEmits<{ (e: 'pick-anomaly', filter: string): void }>()

const dangerCount = computed(() => props.anomalies.filter(a => a.severity === 'danger').length)
const warningCount = computed(() => props.anomalies.filter(a => a.severity === 'warning').length)
const infoCount = computed(() => props.anomalies.filter(a => a.severity === 'info').length)
const totalCount = computed(() => props.anomalies.length)

function formatCount(n: number): string {
  return (n ?? 0).toLocaleString('en-US')
}

/**
 * 点击一行：把后端给的等价过滤表达式回填到过滤条。
 *
 * <p>没有 filter 的项（理论上不会出现）只做展示，不冒领一次「点了没反应」。</p>
 */
function pick(row: TsharkAnomaly) {
  const filter = (row.filter || '').trim()
  if (filter) emit('pick-anomaly', filter)
}
</script>

<style scoped>
.insight-summary {
  flex: none;
  display: flex;
  align-items: center;
  gap: 0;
  flex-wrap: wrap;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color);
  overflow: hidden;
}
.insight-summary__cell {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 8px 16px;
  min-width: 88px;
}
.insight-summary__cell + .insight-summary__cell {
  border-left: 1px solid var(--el-border-color-lighter);
}
.insight-summary__value {
  font-family: 'SF Mono', 'Cascadia Code', ui-monospace, monospace;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
}
.insight-summary__label {
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--el-text-color-placeholder);
}
.insight-summary__cell.is-danger .insight-summary__value { color: var(--el-color-danger); }
.insight-summary__cell.is-warning .insight-summary__value { color: var(--metric-disk, #f59e0b); }
.insight-summary__cell.is-info .insight-summary__value { color: var(--ts-run); }
.insight-scope {
  padding: 0 14px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.insight-loading { min-height: 160px; }
.insight-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.insight-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-bg-color);
  cursor: pointer;
  outline: none;
  transition: background-color var(--el-transition-duration-fast, 0.2s) ease,
    border-color var(--el-transition-duration-fast, 0.2s) ease;
  --insight-c: var(--el-text-color-secondary);
}
.insight-row.is-danger { --insight-c: var(--el-color-danger); }
.insight-row.is-warning { --insight-c: var(--metric-disk, #f59e0b); }
.insight-row.is-info { --insight-c: var(--ts-run); }
.insight-row:hover {
  background: color-mix(in srgb, var(--insight-c) 6%, var(--el-bg-color));
  border-color: color-mix(in srgb, var(--insight-c) 28%, transparent);
}
.insight-row:focus-visible {
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--insight-c) 32%, transparent);
}
.insight-row__dot {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--insight-c);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--insight-c) 16%, transparent);
}
.insight-row__label {
  flex: none;
  min-width: 132px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.insight-row__filter {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 1px 7px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-family: 'SF Mono', 'Cascadia Code', ui-monospace, monospace;
  font-size: 10.5px;
}
.insight-row__count {
  flex: none;
  font-family: 'SF Mono', 'Cascadia Code', ui-monospace, monospace;
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--insight-c);
}
.insight-row__go {
  flex: none;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}
.insight-row:hover .insight-row__go { color: var(--insight-c); }

@media (prefers-reduced-motion: reduce) {
  .insight-row { transition: none; }
}
</style>
