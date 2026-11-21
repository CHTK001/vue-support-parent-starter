<script setup lang="ts">
/**
 * 链路追踪：GET /v2/logger/traces 按 traceId 聚合摘要 + 选中链路的事件时间轴。
 *
 * - 摘要表：条数 / 错误数 / 起止 / 耗时 / 涉及应用实例，最近发生的排前；
 * - 点行或输入 traceId 直查：GET /events?traceId=... 拉全量事件，按时间排序
 *   渲染瀑布时间轴（条形位置 = 相对首条事件的偏移，宽度 = 与下一条的间隔）；
 * - 支持路由查询参数 ?traceId=... 直达（检索页「查看链路」跳转入口）。
 */
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
import { fetchApps, fetchEvents, fetchTraces, type LoggerAppInfo, type LoggerEvent, type LoggerTraceSummary } from "../api/logger";
import { formatTs } from "../utils/format";
import LevelTag from "../components/LevelTag.vue";
import { normLevel } from "../api/logger";

const route = useRoute();

const traces = ref<LoggerTraceSummary[]>([]);
const apps = ref<LoggerAppInfo[]>([]);
const appFilter = ref("");
const limit = ref(50);
const loading = ref(false);
const traceInput = ref("");
const selected = ref<LoggerTraceSummary | null>(null);
const traceEvents = ref<LoggerEvent[]>([]);
const detailLoading = ref(false);

const columns: ReTableColumn[] = [
  { prop: "traceId", label: "TraceId", minWidth: 260, showOverflowTooltip: true },
  { prop: "count", label: "事件数", width: 90, align: "right" },
  { prop: "errorCount", label: "错误数", width: 90, align: "right" },
  { prop: "firstTs", label: "开始时间", width: 170 },
  { prop: "durationMs", label: "耗时", width: 110, align: "right" },
  { prop: "apps", label: "应用", minWidth: 160, showOverflowTooltip: true },
  { prop: "instances", label: "实例", minWidth: 160, showOverflowTooltip: true },
];

/** 摘要行展示适配（apps/instances 数组转逗号串，时间转展示格式） */
const tableRows = computed<Record<string, unknown>[]>(() =>
  traces.value.map((row) => ({
    ...row,
    firstTs: formatTs(row.firstTs, true),
    durationMs: formatDuration(row.durationMs),
    apps: (row.apps ?? []).join(", ") || "-",
    instances: (row.instances ?? []).join(", ") || "-",
  })),
);

function formatDuration(ms?: number): string {
  const value = Number(ms ?? 0);
  if (!Number.isFinite(value) || value <= 0) return "0ms";
  if (value < 1000) return `${value}ms`;
  return `${(value / 1000).toFixed(2)}s`;
}

async function loadTraces(): Promise<void> {
  loading.value = true;
  try {
    traces.value = (await fetchTraces(appFilter.value || undefined, limit.value)) ?? [];
  } catch {
    // 错误提示由 http 层统一弹出
  } finally {
    loading.value = false;
  }
}

/** 按时间升序整理事件（ts 兼容字符串/数字） */
function sortedEvents(items: LoggerEvent[]): LoggerEvent[] {
  return [...items].sort((a, b) => Number(a.ts ?? 0) - Number(b.ts ?? 0));
}

/** 选中摘要行：按 traceId 拉取事件渲染时间轴 */
async function selectTrace(row: LoggerTraceSummary): Promise<void> {
  if (!row?.traceId) return;
  selected.value = row;
  traceInput.value = row.traceId;
  await loadTraceEvents(row.traceId);
}

/** 直查 traceId：事件拉回来后用事件本身合成摘要（不依赖 /traces 是否已收录） */
async function selectByTraceId(): Promise<void> {
  const traceId = traceInput.value.trim();
  if (!traceId) return;
  selected.value = { traceId };
  await loadTraceEvents(traceId);
}

async function loadTraceEvents(traceId: string): Promise<void> {
  detailLoading.value = true;
  try {
    const resp = await fetchEvents({ traceId, limit: 500 });
    traceEvents.value = sortedEvents(resp.items ?? []);
    const events = traceEvents.value;
    if (events.length > 0) {
      const firstTs = Number(events[0].ts ?? 0);
      const lastTs = Number(events[events.length - 1].ts ?? firstTs);
      selected.value = {
        ...selected.value,
        traceId,
        count: events.length,
        errorCount: events.filter((item) => normLevel(item.level) === "ERROR").length,
        firstTs,
        lastTs,
        durationMs: Math.max(0, lastTs - firstTs),
        apps: Array.from(new Set(events.map((item) => item.app || "").filter(Boolean))),
        instances: Array.from(new Set(events.map((item) => item.instance || "").filter(Boolean))),
      };
    }
  } catch {
    // 错误提示由 http 层统一弹出
  } finally {
    detailLoading.value = false;
  }
}

/** 瀑布时间轴几何：left = 相对首条偏移占比，width = 与下一条间隔占比（保底可见） */
function barStyle(event: LoggerEvent, index: number): Record<string, string> {
  const events = traceEvents.value;
  const firstTs = Number(events[0]?.ts ?? 0);
  const span = Math.max(1, Number(events[events.length - 1]?.ts ?? firstTs) - firstTs);
  const left = (Number(event.ts ?? firstTs) - firstTs) / span;
  const nextTs = index + 1 < events.length ? Number(events[index + 1].ts ?? event.ts) : Number(event.ts);
  const width = Math.min(1 - left, Math.max(0.015, (nextTs - Number(event.ts ?? firstTs)) / span));
  return { left: `${(left * 100).toFixed(2)}%`, width: `${(Math.max(0.008, width) * 100).toFixed(2)}%` };
}

const summary = computed<LoggerTraceSummary | null>(() => selected.value);

onMounted(async () => {
  try {
    apps.value = (await fetchApps()) ?? [];
  } catch {
    // 错误提示由 http 层统一弹出
  }
  // 检索页「查看链路」等入口：?traceId=xxx 直达
  const queryTraceId = typeof route.query.traceId === "string" ? route.query.traceId.trim() : "";
  if (queryTraceId) {
    traceInput.value = queryTraceId;
    await selectByTraceId();
  }
  await loadTraces();
});
</script>

<template>
  <div class="trace-view logger-scope">
    <!-- 工具条：应用过滤 + 条数 + traceId 直查 + 刷新 -->
    <div class="logger-card trace-toolbar">
      <div class="toolbar-field">
        <span class="field-label">应用</span>
        <el-select v-model="appFilter" clearable filterable placeholder="全部应用" class="field-mid" @change="loadTraces">
          <el-option v-for="item in apps" :key="item.app" :label="item.app" :value="item.app ?? ''" />
        </el-select>
      </div>
      <div class="toolbar-field">
        <span class="field-label">条数</span>
        <el-select v-model="limit" class="field-mini" @change="loadTraces">
          <el-option :value="50" label="50" />
          <el-option :value="100" label="100" />
          <el-option :value="200" label="200" />
        </el-select>
      </div>
      <div class="toolbar-field trace-input-field">
        <span class="field-label">TraceId</span>
        <el-input
          v-model="traceInput"
          clearable
          placeholder="输入 traceId 直查链路"
          class="field-wide trace-input"
          @keyup.enter="selectByTraceId"
        />
        <el-button type="primary" plain @click="selectByTraceId">查询链路</el-button>
      </div>
      <div class="toolbar-actions">
        <el-button size="small" plain :loading="loading" @click="loadTraces">刷新</el-button>
      </div>
    </div>

    <!-- 摘要表：点行下钻时间轴 -->
    <div class="logger-card">
      <div class="trace-hint">最近链路（按 traceId 聚合，最近发生的排前；点击行查看时间轴）</div>
      <ReTable :columns="columns" :data="tableRows" :loading="loading" @row-click="(row: Record<string, unknown>) => selectTrace(row as unknown as LoggerTraceSummary)">
        <template #col-traceId="{ row }">
          <span class="trace-id">{{ row.traceId || "-" }}</span>
        </template>
        <template #col-errorCount="{ row }">
          <span class="error-count" :class="{ 'is-error': Number(row.errorCount) > 0 }">{{ row.errorCount ?? 0 }}</span>
        </template>
      </ReTable>
    </div>

    <!-- 选中链路：摘要 + 事件瀑布时间轴 -->
    <div v-if="summary" class="logger-card trace-detail">
      <div class="trace-detail-head">
        <span class="trace-detail-title">链路时间轴</span>
        <span class="trace-id">{{ summary.traceId }}</span>
        <el-tag size="small" effect="light">事件 {{ summary.count ?? 0 }}</el-tag>
        <el-tag size="small" effect="light" type="danger">错误 {{ summary.errorCount ?? 0 }}</el-tag>
        <el-tag size="small" effect="light">耗时 {{ formatDuration(summary.durationMs) }}</el-tag>
        <el-tag v-if="(summary.apps ?? []).length > 0" size="small" effect="light" type="info">{{ (summary.apps ?? []).join(", ") }}</el-tag>
      </div>
      <div v-loading="detailLoading" class="trace-timeline">
        <el-empty v-if="traceEvents.length === 0 && !detailLoading" description="该链路暂无事件" :image-size="64" />
        <div v-for="(event, index) in traceEvents" :key="`${event.ts}-${index}`" class="trace-row" :class="{ 'is-error': normLevel(event.level) === 'ERROR' }">
          <span class="trace-ts">{{ formatTs(event.ts, true) }}</span>
          <span class="trace-bar-track">
            <span class="trace-bar" :class="`trace-bar--${normLevel(event.level).toLowerCase()}`" :style="barStyle(event, index)"></span>
          </span>
          <LevelTag :level="event.level" />
          <span class="trace-app">{{ event.app || "-" }}</span>
          <span class="trace-msg" :title="event.message">{{ event.logger || "-" }} · {{ event.message || "-" }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.trace-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px 20px;
}

.toolbar-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-label {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.field-mid {
  width: 180px;
}

.field-mini {
  width: 96px;
}

.field-wide {
  width: 320px;
}

.trace-input-field {
  flex: 1;
  min-width: 380px;
}

.trace-input :deep(.el-input__inner) {
  font-family: var(--font-mono);
}

.toolbar-actions {
  margin-left: auto;
}

.trace-hint {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.trace-detail {
  margin-top: 16px;
}

.trace-detail-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-bottom: 12px;
}

.trace-detail-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.trace-timeline {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 60px;
  max-height: 480px;
  overflow: auto;
  padding: 4px 0;
}

.trace-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  padding: 3px 6px;
  border-radius: 6px;
}

.trace-row:hover {
  background: var(--bg-hover);
}

.trace-row.is-error {
  background: rgba(245, 108, 108, 0.06);
}

.trace-ts {
  width: 150px;
  flex: none;
  font-family: var(--font-mono);
  color: var(--text-secondary);
}

.trace-bar-track {
  position: relative;
  flex: 1;
  height: 10px;
  background: var(--bg-sunken);
  border-radius: 5px;
  overflow: hidden;
}

.trace-bar {
  position: absolute;
  top: 2px;
  height: 6px;
  border-radius: 3px;
  background: var(--log-level-info);
}

.trace-bar--error {
  background: var(--log-level-error);
}

.trace-bar--warn {
  background: var(--log-level-warn);
}

.trace-bar--debug,
.trace-bar--trace {
  background: var(--log-level-debug);
}

.trace-app {
  width: 130px;
  flex: none;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trace-msg {
  flex: 1;
  min-width: 0;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-mono);
}
</style>
