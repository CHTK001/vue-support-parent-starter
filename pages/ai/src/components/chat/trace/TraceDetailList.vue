<template>
  <!--
    轨迹明细：按 系统 / 上下文 / 助手 / 工具 分组列出点事件与区间事件。

    「用户」一组不在这里：轨迹表记录的是 Agent 执行过程，不含用户输入，
    用户消息由会话消息接口提供。把两者混在一张表里会让人以为这里也是消息记录。
  -->
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
            <button type="button" class="td-foot-btn" @click="selected = null">关闭</button>
          </footer>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
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
}

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
  color: #9ca3af;
}

.detail-group {
  margin-bottom: 14px;
}

.detail-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #f3f4f6;
}

.detail-title {
  font-weight: 600;
  color: #111827;
}

.detail-count {
  color: #9ca3af;
  font-variant-numeric: tabular-nums;
}

.detail-none {
  padding: 6px 0;
  color: #9ca3af;
}

.detail-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 3px 0;
  border-bottom: 1px dashed #f9fafb;
}

.detail-time {
  flex: 0 0 88px;
  color: #6b7280;
  font-variant-numeric: tabular-nums;
}

.detail-offset {
  flex: 0 0 60px;
  color: #9ca3af;
  font-variant-numeric: tabular-nums;
}

.detail-kind {
  flex: 0 0 72px;
  color: #374151;
}

.detail-badge {
  flex: 0 0 auto;
  padding: 0 6px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 11px;
}

.detail-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #111827;
}
</style>
