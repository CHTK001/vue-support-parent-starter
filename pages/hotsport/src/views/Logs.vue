<template>
  <div class="view">
    <!-- 工具栏：标题 + 记录数 + 全局动作 -->
    <div class="view-toolbar">
      <div class="toolbar-left">
        <span class="section-label">日志</span>
        <span class="match-hint">
          <template v-if="!loading">{{ total.toLocaleString() }} 条 · 第 {{ page }} 页</template>
          <template v-else>加载中…</template>
        </span>
      </div>
      <div class="toolbar-right">
        <el-switch
          v-model="autoRefresh"
          class="auto-switch"
          active-text="自动刷新"
          :disabled="liveStream"
        />
        <el-button round @click="exportCsvFull">
          <el-icon class="btn-icon"><Download /></el-icon>导出 CSV（全量）
        </el-button>
        <el-button type="primary" round :loading="injecting" @click="doInjectLog">
          <el-icon class="btn-icon"><Plus /></el-icon>写入一条日志
        </el-button>
        <el-button round :loading="loading" @click="doServerSearch">
          <el-icon class="btn-icon"><Refresh /></el-icon>刷新
        </el-button>
      </div>
    </div>

    <!-- 筛选栏：查询条件与动作分离，窄屏自然换行 -->
    <div class="filter-bar">
      <div class="filter-field level-field">
        <label class="filter-label" for="log-level">级别</label>
        <el-select id="log-level" v-model="filterLevel" placeholder="全部级别" clearable>
          <el-option label="ERROR" value="ERROR" />
          <el-option label="WARN" value="WARN" />
          <el-option label="INFO" value="INFO" />
          <el-option label="DEBUG" value="DEBUG" />
        </el-select>
      </div>

      <div class="filter-field keyword-field">
        <label class="filter-label" for="log-keyword">关键词</label>
        <el-input
          id="log-keyword"
          v-model="keyword"
          placeholder="消息 / Logger / 类名"
          clearable
          :prefix-icon="Search"
          @keyup.enter="doServerSearch"
        />
      </div>

      <div class="filter-field trace-field">
        <label class="filter-label" for="log-trace">Trace ID</label>
        <el-input
          id="log-trace"
          v-model="traceIdSearch"
          placeholder="按 traceId 精确过滤"
          clearable
          @keyup.enter="doServerSearch"
        />
      </div>

      <div class="filter-field time-field">
        <label class="filter-label">时间范围</label>
        <el-date-picker
          v-model="filters.range"
          type="datetimerange"
          range-separator="~"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
        />
      </div>

      <div class="filter-actions">
        <span class="match-hint">
          {{ keyword || traceIdSearch || filterLevel ? `服务端命中 ${total} 条` : `共 ${total} 条` }}
        </span>
        <el-button text @click="resetFilters">重置</el-button>
        <el-button type="primary" round :loading="loading" @click="doServerSearch">
          <el-icon class="btn-icon"><Search /></el-icon>查询
        </el-button>
      </div>
    </div>

    <!-- 级别分布：点级别卡片即按该级别过滤 -->
    <div class="level-bar" v-if="logStats.length">
      <span class="section-label">级别分布</span>
      <div class="level-cards">
        <button
          v-for="s in logStats"
          :key="s.level"
          type="button"
          class="level-card"
          :aria-pressed="filterLevel === s.level"
          @click="toggleLevel(s.level)"
        >
          <span class="lvl" :class="levelClass(s.level)">{{ s.level }}</span>
          <span class="mono level-count">{{ s.count }}</span>
          <span class="mono muted level-pct">{{ s.percent.toFixed(1) }}%</span>
        </button>
      </div>
      <span class="match-hint level-tip">点级别可快速过滤</span>
    </div>

    <!-- 实时日志流（SSE log 事件，仅保留最近 50 条，最新在上） -->
    <div class="live-panel" v-if="liveStream">
      <div class="live-head">
        <span class="section-label">实时日志流</span>
        <span class="live-dot">推流中</span>
        <span class="match-hint">最近 {{ liveItems.length }} 条 · 最新在上</span>
      </div>
      <div class="live-list">
        <div v-for="(r, i) in liveItems" :key="`${r.timestamp}-${i}`" class="live-row">
          <span class="lvl" :class="levelClass(r.level)">{{ r.level }}</span>
          <span class="muted mono live-time">{{ r.timestamp }}</span>
          <span class="mono live-logger">{{ r.logger }}</span>
          <span class="live-msg">{{ r.message }}</span>
        </div>
        <div v-if="!liveItems.length" class="panel-empty live-empty">等待实时日志…</div>
      </div>
    </div>

    <div class="table-panel">
      <!-- 表格统一 ReTable（engine="element" 沿用原 el-table 的 DOM）；分页由下方 el-pagination 自管 -->
      <ReTable
        :data="items as unknown as Record<string, unknown>[]"
        :columns="logColumns"
        :loading="loading"
        engine="element"
        :pagination="false"
        :toolbar="false"
        :settings="{ border: false }"
        :layout-table="{ minHeight: 0 }"
        :row-class-name="logRowClass"
        class="apm-table log-table"
        empty-text="暂无日志记录，试试放宽筛选条件"
      >
        <template #col-timestamp="{ row }">
          <span class="muted mono">{{ row.timestamp }}</span>
        </template>
        <template #col-level="{ row }">
          <span class="lvl" :class="levelClass(String(row.level ?? ''))">
            {{ row.level || "—" }}
          </span>
        </template>
        <template #col-logger="{ row }">
          <span class="mono">{{ row.logger }}</span>
        </template>
        <template #col-method="{ row }">
          <span class="mono muted">{{ row.className ? row.className + "." : "" }}{{ row.methodName }}</span>
        </template>
        <template #col-message="{ row }">
          <span class="msg-text">
            <template v-for="(p, i) in highlightParts(row.message)" :key="i">
              <mark v-if="p.hit" class="kw-hit">{{ p.text }}</mark>
              <template v-else>{{ p.text }}</template>
            </template>
          </span>
        </template>
        <template #col-traceId="{ row }">
          <button
            v-if="row.traceId"
            type="button"
            class="trace-link"
            :title="`查看 ${traceIdOf(row)} 的调用链路`"
            @click="openTrace(traceIdOf(row))"
          >
            <code class="mono">{{ shortId(traceIdOf(row)) }}</code>
          </button>
          <span v-else class="muted">—</span>
        </template>
        <template #col-spanCount="{ row }">
          <span v-if="row.traceId" class="mono span-count-badge">
            {{ spanCountOf(row) }}
          </span>
          <span v-else class="muted">—</span>
        </template>
      </ReTable>

      <div class="pager">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="size"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="() => load()"
          @current-change="() => load()"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ROUTE_PREFIX } from "../config";

import { Refresh, Download, Search, Plus } from "@element-plus/icons-vue";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
import { pageLogs, exportLogsCsv, injectLog, getLogStats, getTraceDetail } from "../api/apmApi";
import type { LogRecord, LogLevelStat } from "../api/apmApi";
import { useRealtimeLog } from "../composables/useRealtime";

const router = useRouter();
const route = useRoute();

/** 点击 traceId 跳调用链路页（带 traceId 查询参数） */
function openTrace(traceId: string) {
  router.push({ path: ROUTE_PREFIX + "/traces", query: { traceId } });
}

const items = ref<LogRecord[]>([]);
const total = ref(0);
const page = ref(1);
const size = ref(20);
const loading = ref(false);
const filterLevel = ref("");
const keyword = ref("");
const traceIdSearch = ref("");
const filters = reactive({ range: null as [Date, Date] | null });

/**
 * 列配置：原来散在模板里的 6 个 el-table-column 收敛到这里。
 *
 * <p>标题都是写死文案（没有 t()），用普通常量即可。「时间 / 级别 / 方法 / 消息 / Trace》
 * 五列原 el-table-column 没有 prop，这里补稳定合成 prop（method 汇总 className+methodName），
 * 其余沿用行数据字段名，模板里一一对应 #col-&lt;prop&gt; 插槽。</p>
 */
const logColumns: ReTableColumn[] = [
  { prop: "timestamp", label: "时间", width: 160, slot: "timestamp" },
  { prop: "level", label: "级别", width: 96, slot: "level" },
  { prop: "logger", label: "Logger", minWidth: 180, slot: "logger" },
  { prop: "method", label: "方法", minWidth: 160, slot: "method" },
  { prop: "message", label: "消息", minWidth: 280, slot: "message" },
  { prop: "traceId", label: "Trace", width: 160, slot: "traceId" },
  { prop: "spanCount", label: "关联 Span", width: 96, align: "center", slot: "spanCount" },
];

/** 插槽里的 row 是宽类型（unknown）：traceId 收窄成 string 再传给 openTrace / shortId */
function traceIdOf(row: Record<string, unknown>): string {
  return String(row.traceId ?? "");
}

/** 按 traceId 缓存 span 数量，避免重复请求 */
const spanCountCache = new Map<string, { count: number; expire: number }>();

/** 查某 traceId 的关联 span 数（5s 缓存） */
async function getSpanCount(row: Record<string, unknown>): Promise<number> {
  const tid = traceIdOf(row);
  if (!tid) return 0;
  const cached = spanCountCache.get(tid);
  if (cached && cached.expire > Date.now()) return cached.count;
  try {
    const spans = await getTraceDetail(tid);
    const count = Array.isArray(spans) ? spans.length : 0;
    spanCountCache.set(tid, { count, expire: Date.now() + 5000 });
    return count;
  } catch {
    return 0;
  }
}

/** 异步填充 spanCount 缓存（不阻塞渲染） */
function prefetchSpanCounts() {
  items.value.forEach((item) => {
    const row = item as unknown as Record<string, unknown>;
    if (row.traceId) {
      getSpanCount(row);
    }
  });
}

/** 同步取缓存值（渲染时用，加载中显示 "…"） */
function spanCountOf(row: Record<string, unknown>): number | string {
  const tid = traceIdOf(row);
  if (!tid) return 0;
  return spanCountCache.get(tid)?.count ?? "…";
}

/** 服务端搜索：把关键字/traceId/时间范围传给后端 /logs 过滤 */
function doServerSearch() {
  page.value = 1;
  load();
}

/**
 * 拉取日志列表。
 * @param silent 自动刷新/轮询时置 true：不显示加载遮罩、不弹错误提示，避免每 5s 闪一下。
 */
async function load(silent = false) {
  if (!silent) loading.value = true;
  try {
    const res = await pageLogs({
      page: page.value,
      size: size.value,
      level: filterLevel.value || undefined,
      keyword: keyword.value.trim() || undefined,
      traceId: traceIdSearch.value.trim() || undefined,
      startTime: filters.range?.[0] ? new Date(filters.range[0]).getTime() : undefined,
      endTime: filters.range?.[1] ? new Date(filters.range[1]).getTime() : undefined,
    });
    items.value = res.items;
    total.value = res.total;
    loadLogStats();
    prefetchSpanCounts(); // 异步预取 spanCount
  } catch {
    if (!silent) message.error("加载日志失败");
  } finally {
    if (!silent) loading.value = false;
  }
}

// ---- 注入 ----
const injecting = ref(false);
const logSeq = ref(0);

async function doInjectLog() {
  injecting.value = true;
  try {
    logSeq.value++;
    const lv = ["INFO", "WARN", "ERROR"][logSeq.value % 3];
    await injectLog(lv, `手动写入的${lv}日志 #${logSeq.value}`);
    message.success(`已写入一条 ${lv} 日志`);
    await load();
  } catch {
    message.error("写入失败");
  } finally {
    injecting.value = false;
  }
}

/** 后端全量 CSV 导出（带当前全部筛选条件） */
function exportCsvFull() {
  exportLogsCsv({
    level: filterLevel.value || undefined,
    keyword: keyword.value.trim() || undefined,
    traceId: traceIdSearch.value.trim() || undefined,
    startTime: filters.range?.[0] ? new Date(filters.range[0]).getTime() : undefined,
    endTime: filters.range?.[1] ? new Date(filters.range[1]).getTime() : undefined,
  });
}

/** 清空所有筛选并回到第一页（级别由 watch 触发重查，这里只重置不重复请求） */
function resetFilters() {
  keyword.value = "";
  traceIdSearch.value = "";
  filters.range = null;
  page.value = 1;
  if (filterLevel.value) {
    filterLevel.value = "";
  } else {
    load();
  }
}

// ---- 自动刷新（默认关闭） ----
const autoRefresh = ref(false);
let autoTimer: number | undefined;

/** 开关切换：开启后每 5s 静默拉取一次，关闭立即停表 */
watch(autoRefresh, (on) => {
  if (autoTimer) {
    window.clearInterval(autoTimer);
    autoTimer = undefined;
  }
  if (on) {
    autoTimer = window.setInterval(() => load(true), 5000);
  }
});

// ---- 级别分布 ----
const logStats = ref<LogLevelStat[]>([]);

async function loadLogStats() {
  try {
    logStats.value = (await getLogStats()) || [];
  } catch {
    logStats.value = [];
  }
}

/** 点级别卡片切换过滤：再次点击已选级别即取消 */
function toggleLevel(level: string) {
  filterLevel.value = filterLevel.value === level ? "" : level;
}

// ---- 实时日志流（统一走 useRealtime composable，不再自建 EventSource）----
const {
  active: liveStream,
  items: liveItems,
  start: startLiveStream,
  stop: stopLiveStream,
  clear: clearLiveStream,
} = useRealtimeLog({ maxItems: 50 });

function toggleLiveStream(on: boolean) {
  if (on) {
    // 实时流走全站单例通道，关掉轮询避免两路同时刷新
    autoRefresh.value = false;
    clearLiveStream();
    startLiveStream();
  } else {
    stopLiveStream();
  }
}

onBeforeUnmount(() => {
  stopLiveStream();
  if (autoTimer) {
    window.clearInterval(autoTimer);
    autoTimer = undefined;
  }
});

/** 级别 → 语义色档位（ERROR/WARN/INFO/DEBUG 四档，其余按 DEBUG 处理） */
function levelClass(level: string | undefined): string {
  switch ((level || "").toUpperCase()) {
    case "ERROR":
    case "FATAL":
      return "lvl-error";
    case "WARN":
    case "WARNING":
      return "lvl-warn";
    case "INFO":
      return "lvl-info";
    default:
      return "lvl-debug";
  }
}

/** 错误行整行淡红底，扫读时优先被看到 */
function logRowClass({ row }: { row: Record<string, unknown> }): string {
  return String(row.level ?? "").toUpperCase() === "ERROR" ? "row-error" : "";
}

/** 关键词高亮分段结果（命中段标记 hit，模板用 <mark> 渲染，不经 v-html） */
interface HighlightPart {
  text: string;
  hit: boolean;
}

/** 按当前关键词切分文本：大小写不敏感，保留原文大小写 */
function highlightParts(text: unknown): HighlightPart[] {
  const raw = String(text ?? "");
  const kw = keyword.value.trim();
  if (!kw || !raw) return [{ text: raw, hit: false }];

  const needle = kw.toLowerCase();
  const lower = raw.toLowerCase();
  const parts: HighlightPart[] = [];
  let from = 0;
  let idx = lower.indexOf(needle);

  while (idx !== -1) {
    if (idx > from) parts.push({ text: raw.slice(from, idx), hit: false });
    parts.push({ text: raw.slice(idx, idx + kw.length), hit: true });
    from = idx + kw.length;
    idx = lower.indexOf(needle, from);
  }
  if (from < raw.length) parts.push({ text: raw.slice(from), hit: false });
  return parts;
}

function shortId(id: string) {
  return id ? id.slice(0, 12) : "—";
}

watch(filterLevel, () => {
  doServerSearch();
});

onMounted(() => {
  // 从全局搜索进入：/logs?keyword=xxx 自动应用
  const qKw = String(route.query.keyword ?? "");
  if (qKw) {
    keyword.value = qKw;
  }
  load();
});
</script>

<style scoped>
/* 骨架与 .view/.view-toolbar/.filter-bar/.pager/.table-panel/.mono/.muted 等
   通用类统一由 styles/layout.css 提供，本文件只保留本页独有样式。 */

.btn-icon {
  margin-right: 4px;
  vertical-align: -2px;
}

.auto-switch {
  margin-right: var(--apm-space-2);
}

/* 筛选字段宽度：关键词最宽，时间范围独占一档 */
.level-field {
  width: 130px;
}
.keyword-field {
  width: 240px;
}
.trace-field {
  width: 200px;
}
.time-field {
  width: 320px;
}

/* 表头与消息列 */
.msg-text {
  color: var(--text-secondary, var(--apm-fg-regular));
  word-break: break-word;
}

/* 关键词命中：琥珀底 + 主文本色，深色底上比浏览器默认黄色可读 */
.kw-hit {
  padding: 0 2px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--status-warning, var(--apm-warning)) 26%, transparent);
  color: var(--text-primary, var(--apm-fg));
}

/* 级别徽标：色点 + 等宽文字，四级语义色（错误/警告/正常/调试） */
.lvl {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 1px 8px;
  border-radius: 999px;
  font-family: var(--apm-font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  line-height: 18px;
  white-space: nowrap;
}

.lvl::before {
  content: "";
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 999px;
  background: currentColor;
}

.lvl-error {
  color: var(--status-error, var(--apm-danger));
  background: var(--status-error, var(--apm-danger-bg));
}

.lvl-warn {
  color: var(--status-warning, var(--apm-warning));
  background: var(--status-warning, var(--apm-warning-bg));
}

.lvl-info {
  color: var(--brand-500, var(--apm-accent));
  background: var(--brand-500, var(--apm-accent-subtle));
}

.lvl-debug {
  color: var(--text-tertiary, var(--apm-muted));
  background: var(--bg-fill, var(--apm-neutral-bg));
}

/* ERROR 行整体淡红底，行内文字仍按令牌取色 */
.log-table :deep(.row-error) {
  background: var(--status-error, var(--apm-danger-bg));
}

/* ---- trace 跳转 ---- */
.trace-link {
  border: 0;
  padding: 0;
  background: none;
  cursor: pointer;
  color: var(--brand-500, var(--apm-accent));
  transition: color var(--apm-t-fast);
}

.trace-link:hover {
  color: var(--brand-600, var(--apm-accent-hover));
}

.trace-link:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--brand-500, var(--apm-accent-subtle));
  border-radius: var(--apm-radius-sm);
}

/* 关联 Span 徽标 */
.span-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--brand-500, var(--apm-accent-subtle));
  color: var(--brand-500, var(--apm-accent));
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* ---- 级别分布条 ---- */
.level-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--apm-space-3);
  padding: var(--apm-space-3) var(--apm-space-4);
  background: var(--bg-container, var(--apm-panel));
  border-radius: var(--apm-radius-lg);
  box-shadow: var(--apm-shadow-card);
}

.level-cards {
  display: flex;
  flex-wrap: wrap;
  gap: var(--apm-space-2);
}

/* 可点筛选卡：选中态用主色描边+淡底，与普通标签区分 */
.level-card {
  display: inline-flex;
  align-items: center;
  gap: var(--apm-space-2);
  padding: 4px 10px;
  border: 1px solid var(--border-subtle, var(--apm-border-soft));
  border-radius: 999px;
  background: transparent;
  color: var(--text-secondary, var(--apm-fg-regular));
  font: inherit;
  cursor: pointer;
  transition: background var(--apm-t-fast), border-color var(--apm-t-fast);
}

.level-card:hover {
  background: var(--bg-hover, var(--apm-panel-active));
}

.level-card:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--brand-500, var(--apm-accent-subtle));
}

.level-card[aria-pressed="true"] {
  border-color: color-mix(in srgb, var(--brand-500, var(--apm-accent)) 46%, transparent);
  background: var(--brand-500, var(--apm-accent-subtle));
}

.level-count {
  color: var(--text-primary, var(--apm-fg));
  font-weight: 700;
}

.level-pct {
  font-size: 11px;
}

.level-tip {
  margin-left: auto;
}

/* ---- 实时日志流 ---- */
.live-panel {
  display: flex;
  flex-direction: column;
  gap: var(--apm-space-3);
  padding: var(--apm-space-4) var(--apm-space-5);
  background: var(--bg-container, var(--apm-panel));
  border-radius: var(--apm-radius-lg);
  box-shadow: var(--apm-shadow-card);
}

.live-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--apm-space-3);
}

.live-list {
  max-height: 260px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--apm-space-1);
}

.live-row {
  display: flex;
  align-items: center;
  gap: var(--apm-space-2);
  padding: 4px 8px;
  border-radius: var(--apm-radius-sm);
  background: var(--bg-elevated, var(--apm-panel-raised));
}

.live-time {
  width: 150px;
  flex-shrink: 0;
}

.live-logger {
  color: var(--text-tertiary, var(--apm-muted));
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
}

.live-msg {
  font-size: 12px;
  color: var(--text-secondary, var(--apm-fg-regular));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

/* 空态沿用 layout.css 的 .panel-empty，只压掉默认 140px 撑高 */
.live-empty {
  min-height: 96px;
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .trace-link,
  .level-card {
    transition: none;
  }
  .view :deep(.el-skeleton__item),
  .view :deep(.el-loading-spinner),
  .live-dot::before {
    animation: none;
    transition: none;
  }
}
</style>
