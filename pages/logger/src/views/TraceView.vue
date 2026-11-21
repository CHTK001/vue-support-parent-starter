<script setup lang="ts">
/**
 * 链路追踪（树状展示）：GET /v2/logger/traces 按 traceId 聚合摘要 + 树表逐条下钻。
 *
 * - 树表第一层 = trace 根节点（条数 / 错误数 / 起止 / 耗时 / 涉及应用实例，最近发生的排前）；
 * - 展开根节点懒加载该链路的事件（GET /events?traceId=...），父子按 traceId 关联；
 * - 事件行再点展开列查看详情：完整消息 / 堆栈 / MDC / 线程 / 实例；
 * - 点根行仍联动下方瀑布时间轴（保留原有时间轴视图）；
 * - 支持路由查询参数 ?traceId=... 直达（检索页「查看链路」跳转入口）。
 *
 * 引擎说明：树形懒加载只有 element 引擎完整支持（el-table 原生 lazy + load，
 * 经 $attrs 透传），vxe 引擎的 tree-config 翻译层尚未带 loadMethod，故本页固定
 * engine="element"。
 */
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
import { fetchApps, fetchEvents, fetchTraces, normLevel, type LoggerAppInfo, type LoggerEvent, type LoggerTraceSummary } from "../api/logger";
import { formatTs } from "../utils/format";
import LevelTag from "../components/LevelTag.vue";

const route = useRoute();

/** 树表行：kind 区分 trace 根与事件子节点；与 Record 交叉以直接喂给 ReTable 的 data */
type TraceTreeRow = Record<string, unknown> & {
  key: string;
  kind: "trace" | "event";
  traceId: string;
  /** trace 根字段 */
  count?: number;
  errorCount?: number;
  firstTs?: number;
  lastTs?: number;
  durationMs?: number;
  apps?: string[];
  instances?: string[];
  /** 事件字段（ts/level 等拍平，便于列渲染） */
  ts?: LoggerEvent["ts"];
  level?: string;
  app?: string;
  instance?: string;
  logger?: string;
  message?: string;
  event?: LoggerEvent;
  /** el-table 懒加载树：根节点标记还有子节点（事件） */
  hasChildren?: boolean;
};

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
  { prop: "name", label: "链路 / 事件", minWidth: 300, showOverflowTooltip: true },
  { prop: "count", label: "事件数", width: 90, align: "right" },
  { prop: "errorCount", label: "错误数", width: 90, align: "right" },
  { prop: "firstTs", label: "时间", width: 170 },
  { prop: "durationMs", label: "耗时", width: 110, align: "right" },
  { prop: "app", label: "应用", minWidth: 150, showOverflowTooltip: true },
  { prop: "instance", label: "实例", minWidth: 150, showOverflowTooltip: true },
];

/** trace 摘要 → 树根行 */
function toTraceRow(summary: LoggerTraceSummary, index: number): TraceTreeRow {
  return {
    key: `t:${summary.traceId ?? index}`,
    kind: "trace",
    traceId: summary.traceId ?? "",
    count: summary.count ?? 0,
    errorCount: summary.errorCount ?? 0,
    firstTs: summary.firstTs,
    lastTs: summary.lastTs,
    durationMs: summary.durationMs,
    apps: summary.apps ?? [],
    instances: summary.instances ?? [],
    hasChildren: true,
  };
}

/** 事件 → 树子节点行（拍平展示字段，保留原始 event 供详情展开） */
function toEventRow(traceId: string, event: LoggerEvent, index: number): TraceTreeRow {
  return {
    key: `e:${traceId}:${index}:${String(event.ts ?? "")}`,
    kind: "event",
    traceId,
    ts: event.ts,
    level: normLevel(event.level),
    app: event.app ?? "",
    instance: event.instance ?? "",
    logger: event.logger ?? "",
    message: event.message ?? "",
    event,
  };
}

/** 树数据：/traces 摘要作为根节点列表 */
const treeRows = computed<Record<string, unknown>[]>(() => traces.value.map(toTraceRow));

/**
 * el-table 懒加载：展开 trace 根节点时按 traceId 拉取事件列表。
 * lazy / load 两个 prop 不是 ReTable 的声明属性，会经 $attrs 透传到 el-table。
 */
function loadEventChildren(
  row: Record<string, unknown>,
  _treeNode: unknown,
  resolve: (data: Record<string, unknown>[]) => void,
): void {
  const traceRow = row as TraceTreeRow;
  if (traceRow.kind !== "trace" || !traceRow.traceId) {
    resolve([]);
    return;
  }
  const traceId = traceRow.traceId;
  fetchEvents({ traceId, limit: 500 })
    .then((resp) => {
      const events = sortedEvents(resp.items ?? []);
      resolve(events.map((event, index) => toEventRow(traceId, event, index)));
    })
    .catch(() => resolve([]));
}

const treeProps = {
  children: "children",
  hasChildren: "hasChildren",
};

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

/** 点树根行：按 traceId 拉取事件渲染时间轴（事件行点击不处理，详情走展开列） */
function onRowClick(row: Record<string, unknown>): void {
  const traceRow = row as TraceTreeRow;
  if (traceRow.kind !== "trace" || !traceRow.traceId) return;
  selected.value = {
    traceId: traceRow.traceId,
    count: Number(traceRow.count ?? 0),
    errorCount: Number(traceRow.errorCount ?? 0),
    firstTs: Number(traceRow.firstTs ?? 0),
    lastTs: Number(traceRow.lastTs ?? 0),
    durationMs: Number(traceRow.durationMs ?? 0),
    apps: Array.isArray(traceRow.apps) ? (traceRow.apps as string[]) : [],
    instances: Array.isArray(traceRow.instances) ? (traceRow.instances as string[]) : [],
  };
  traceInput.value = traceRow.traceId;
  void loadTraceEvents(traceRow.traceId);
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

/** 模板里把插槽给的 row 还原成树行类型 */
function tr(row: unknown): TraceTreeRow {
  return row as TraceTreeRow;
}

/** MDC 键值对（详情展开用） */
function mdcEntries(event?: LoggerEvent): Array<[string, string]> {
  const mdc = event?.mdc;
  if (!mdc || typeof mdc !== "object") return [];
  return Object.entries(mdc).map(([key, value]) => [key, value == null ? "" : String(value)]);
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

    <!-- 链路树：trace 根 → 懒加载事件子节点 → 事件行展开详情 -->
    <div class="logger-card">
      <div class="trace-hint">最近链路（按 traceId 聚合，最近发生的排前；展开行逐条查看事件，点事件行左侧箭头看详情）</div>
      <ReTable
        engine="element"
        row-key="key"
        :columns="columns"
        :data="treeRows"
        :loading="loading"
        :tree-props="treeProps"
        :lazy="true"
        :load="loadEventChildren"
        :expandable="true"
        :expand-width="44"
        @row-click="onRowClick"
      >
        <template #col-name="{ row }">
          <template v-if="tr(row).kind === 'trace'">
            <span class="trace-id">{{ tr(row).traceId || "-" }}</span>
          </template>
          <template v-else>
            <span class="event-cell">
              <LevelTag :level="tr(row).level" />
              <span class="event-msg" :title="tr(row).message">{{ tr(row).logger || "-" }} · {{ tr(row).message || "-" }}</span>
            </span>
          </template>
        </template>
        <template #col-count="{ row }">
          <span>{{ tr(row).kind === "trace" ? tr(row).count ?? 0 : "" }}</span>
        </template>
        <template #col-errorCount="{ row }">
          <span
            v-if="tr(row).kind === 'trace'"
            class="error-count"
            :class="{ 'is-error': Number(tr(row).errorCount) > 0 }"
          >{{ tr(row).errorCount ?? 0 }}</span>
        </template>
        <template #col-firstTs="{ row }">
          <span>{{ tr(row).kind === "trace" ? formatTs(tr(row).firstTs, true) : formatTs(tr(row).ts, true) }}</span>
        </template>
        <template #col-durationMs="{ row }">
          <span>{{ tr(row).kind === "trace" ? formatDuration(tr(row).durationMs) : "" }}</span>
        </template>
        <template #col-app="{ row }">
          <span>{{ tr(row).kind === "trace" ? (tr(row).apps ?? []).join(", ") || "-" : tr(row).app || "-" }}</span>
        </template>
        <template #col-instance="{ row }">
          <span>{{ tr(row).kind === "trace" ? (tr(row).instances ?? []).join(", ") || "-" : tr(row).instance || "-" }}</span>
        </template>
        <!-- 展开详情：事件行给全量字段；trace 根给导读提示 -->
        <template #expand="{ row }">
          <div v-if="tr(row).kind === 'event' && tr(row).event" class="event-detail">
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">时间</span>
                <span>{{ formatTs(tr(row).event?.ts, true) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">级别</span>
                <LevelTag :level="tr(row).event?.level" />
              </div>
              <div class="detail-item">
                <span class="detail-label">应用</span>
                <span>{{ tr(row).event?.app || "-" }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">实例</span>
                <span>{{ tr(row).event?.instance || "-" }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">线程</span>
                <span>{{ tr(row).event?.thread || "-" }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Logger</span>
                <span class="mono">{{ tr(row).event?.logger || "-" }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">TraceId</span>
                <span class="mono">{{ tr(row).traceId }}</span>
              </div>
            </div>
            <div class="detail-block">
              <span class="detail-label">消息</span>
              <pre class="detail-pre">{{ tr(row).event?.message || "-" }}</pre>
            </div>
            <div v-if="tr(row).event?.stacktrace" class="detail-block">
              <span class="detail-label">堆栈</span>
              <pre class="detail-pre detail-stack">{{ tr(row).event?.stacktrace }}</pre>
            </div>
            <div v-if="mdcEntries(tr(row).event).length > 0" class="detail-block">
              <span class="detail-label">MDC</span>
              <div class="mdc-chips">
                <el-tag v-for="pair in mdcEntries(tr(row).event)" :key="pair[0]" size="small" effect="plain" class="mdc-chip">
                  {{ pair[0] }}={{ pair[1] }}
                </el-tag>
              </div>
            </div>
          </div>
          <div v-else class="trace-expand-hint">
            该链路共 {{ tr(row).count ?? 0 }} 条事件（错误 {{ tr(row).errorCount ?? 0 }} 条）；
            展开左侧树节点可逐条查看事件，点击根行在下方时间轴中定位。
          </div>
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

.trace-id {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-primary);
}

.error-count {
  color: var(--text-secondary);
}

.error-count.is-error {
  color: var(--log-level-error);
  font-weight: 600;
}

.event-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  max-width: 100%;
}

.event-msg {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-primary);
}

/* 事件详情展开区 */
.event-detail {
  padding: 6px 10px 10px 46px;
}

.detail-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 24px;
  margin-bottom: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-primary);
}

.detail-label {
  font-size: 12px;
  color: var(--text-muted);
}

.detail-label::after {
  content: ":";
}

.mono {
  font-family: var(--font-mono);
}

.detail-block {
  margin-bottom: 8px;
}

.detail-pre {
  margin: 4px 0 0;
  padding: 8px 10px;
  background: var(--bg-sunken);
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow: auto;
}

.detail-stack {
  color: var(--log-level-error);
}

.mdc-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.mdc-chip {
  font-family: var(--font-mono);
}

.trace-expand-hint {
  padding: 6px 10px;
  font-size: 12px;
  color: var(--text-muted);
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
