<!--
  轨迹明细：按 系统 / 上下文 / 助手 / 工具 分组列出点事件与区间事件。

  「用户」一组不在这里：轨迹表记录的是 Agent 执行过程，不含用户输入，
  用户消息由会话消息接口提供。

  每一行都是按钮，点开后弹出浮层显示全部正文与元信息（右上角 × 关闭，
  底部不再放关闭按钮 —— 用户口径 2026-11-13）。
-->
<template>
  <div class="trace-detail">
    <div v-if="!hasAny" class="trace-empty">本次运行没有可展示的轨迹明细。</div>

    <section v-for="group in groups" v-else :key="group.key" class="detail-group">
      <header class="detail-head">
        <span class="detail-title">{{ group.label }}</span>
        <span class="detail-count">{{ rowsOf(group.key).length }}</span>
      </header>
      <div v-if="rowsOf(group.key).length === 0" class="detail-none">无</div>
      <button v-for="row in rowsOf(group.key)" :key="row.key" type="button" class="detail-row"
        :title="row.text || ''" :aria-label="`${row.label} 查看完整内容`" @click="selected = row">
        <span class="detail-time">{{ formatClock(row.time) }}</span>
        <span class="detail-offset">+{{ formatDuration(row.offsetMs) }}</span>
        <span class="detail-kind">{{ row.label }}</span>
        <span v-if="row.badge" class="detail-badge">{{ row.badge }}</span>
        <span class="detail-text">{{ row.text || "—" }}</span>
        <span class="detail-chevron">›</span>
      </button>
    </section>

    <!-- 行详情浮层：一行里塞不下的正文、全部候选文本与元信息都在这里 -->
    <Teleport to="body">
      <div v-if="selected" class="td-overlay" @click.self="selected = null">
        <section class="td-modal" role="dialog" aria-modal="true" :aria-label="selected.label">
          <header class="td-modal-head">
            <span class="td-modal-title">{{ selected.label }}</span>
            <span class="td-modal-when">{{ formatClock(selected.time) }} · +{{ formatDuration(selected.offsetMs) }}</span>
            <button type="button" class="td-modal-close" aria-label="关闭详情" @click="selected = null">×</button>
          </header>
          <div v-if="selected.meta.length" class="td-modal-tags">
            <span v-for="item in selected.meta" :key="item.label" class="td-modal-tag">
              {{ item.label }}：{{ item.value }}
            </span>
          </div>
          <pre v-if="!selected.detail.length" class="td-modal-body">（该条目没有可展示的正文）</pre>
          <pre v-for="(chunk, i) in selected.detail" :key="i" class="td-modal-body">{{ chunk }}</pre>
          <footer class="td-modal-foot">
            <span class="td-modal-count">共 {{ selected.detail.length }} 段</span>
          </footer>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import {
  TRACE_GROUPS,
  formatClock,
  formatDuration,
  groupOfKind,
  kindLabel,
  type TraceGroup,
  type TraceModel,
} from "./traceTypes";

const props = defineProps<{ model: TraceModel }>();

const groups = TRACE_GROUPS;

interface DetailRow {
  key: string;
  group: TraceGroup;
  time: number;
  offsetMs: number;
  label: string;
  text?: string | null;
  /** 附加标记，如「未闭合」「第2轮」「820ms」 */
  badge?: string;
  /** 详情浮层里的全部正文（区间事件可能有多个片段） */
  detail: string[];
  /** 详情浮层的元信息 */
  meta: Array<{ label: string; value: string }>;
}

/** 当前打开详情的行；null = 浮层关闭 */
const selected = ref<DetailRow | null>(null);

/**
 * 明细行 = 点事件 + 区间事件。
 *
 * 区间事件按其开始时间排入，并带上时长/轮次标记，
 * 这样「甘特图上那根横条」和「这里到底发生了什么」能在同一张表里对上。
 */
const rows = computed<DetailRow[]>(() => {
  const out: DetailRow[] = props.model.points.map((p) => ({
    key: `p-${p.seq}-${p.kind}`,
    group: p.group,
    time: p.time,
    offsetMs: p.offsetMs,
    label: p.label,
    text: p.toolName ? `${p.toolName}${p.text ? '：' + p.text : ''}` : p.text,
    detail: p.text ? [String(p.text)] : [],
    meta: p.toolName ? [{ label: '工具', value: String(p.toolName) }] : [],
  }));
  for (const s of props.model.spans) {
    const badges: string[] = [];
    if (!s.closed) badges.push("未闭合");
    if (s.turn !== null) badges.push(`第${s.turn}轮`);
    if (s.closed) badges.push(formatDuration(s.durationMs));
    out.push({
      key: `s-${s.spanId}`,
      group: groupOfKind(s.kind),
      time: s.start,
      offsetMs: s.start - props.model.start,
      label: s.toolName || kindLabel(s.kind),
      text: s.texts[s.texts.length - 1] ?? null,
      badge: badges.join(" · ") || undefined,
      detail: (s.texts || []).filter((t) => !!t).map(String),
      meta: [
        ...(s.toolName ? [{ label: '工具', value: String(s.toolName) }] : []),
        { label: '时长', value: formatDuration(s.durationMs) },
        ...(s.turn !== null ? [{ label: '轮次', value: `第${s.turn}轮` }] : []),
      ],
    });
  }
  return out.sort((a, b) => a.time - b.time || a.key.localeCompare(b.key));
});

const grouped = computed(() => {
  const map = new Map<TraceGroup, DetailRow[]>();
  for (const g of groups) map.set(g.key, []);
  for (const row of rows.value) {
    map.get(row.group)?.push(row);
  }
  return map;
});

function rowsOf(group: TraceGroup): DetailRow[] {
  return grouped.value.get(group) ?? [];
}

const hasAny = computed(() => rows.value.length > 0);
</script>

<style scoped>
.trace-detail {
  padding: 12px 16px 20px;
  font-size: 12px;
}

.trace-empty {
  padding: 24px 0;
  text-align: center;
  color: var(--el-text-color-secondary);
}

.detail-group {
  margin-bottom: 14px;
}

.detail-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.detail-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.detail-count {
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}

.detail-none {
  padding: 6px 0;
  color: var(--el-text-color-secondary);
}

.detail-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  width: 100%;
  padding: 3px 0;
  border: none;
  border-bottom: 1px dashed var(--el-border-color-lighter);
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.detail-row:hover {
  background: var(--el-fill-color-light);
}

.detail-time {
  flex: 0 0 88px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}

.detail-offset {
  flex: 0 0 60px;
  color: var(--el-text-color-placeholder);
  font-variant-numeric: tabular-nums;
}

.detail-kind {
  flex: 0 0 72px;
  color: var(--el-text-color-regular);
}

.detail-badge {
  flex: 0 0 auto;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.detail-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-primary);
}

.detail-chevron {
  flex: none;
  color: var(--el-text-color-placeholder);
}

/* ===== 详情浮层 ===== */
.td-overlay {
  position: fixed;
  inset: 0;
  z-index: 2100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, #0f172a 34%, transparent);
}

.td-modal {
  width: min(680px, calc(100vw - 32px));
  max-height: calc(100vh - 80px);
  overflow: auto;
  padding: 14px 16px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--radius-lg, 14px);
  background: var(--el-bg-color-overlay);
  box-shadow: var(--el-box-shadow-dark);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.td-modal-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.td-modal-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.td-modal-when {
  flex: none;
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}

.td-modal-close {
  flex: none;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}

.td-modal-close:hover { background: var(--el-fill-color-light); }

.td-modal-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.td-modal-tag {
  padding: 1px 7px;
  border-radius: 5px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 11.5px;
}

.td-modal-body {
  margin: 0;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--el-fill-color-lighter, var(--el-fill-color-light));
  color: var(--el-text-color-regular);
  font-family: var(--font-mono, Consolas, monospace);
  font-size: 12px;
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-all;
}

.td-modal-foot {
  display: flex;
  justify-content: flex-end;
  padding-top: 2px;
}

.td-modal-count {
  font-size: 11.5px;
  color: var(--el-text-color-placeholder);
}
</style>
