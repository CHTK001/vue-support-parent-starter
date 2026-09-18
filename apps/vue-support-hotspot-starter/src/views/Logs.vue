<template>
  <div class="view">
    <div class="view-toolbar">
      <div class="toolbar-left">
        <span class="section-label">日志</span>
        <el-select v-model="filterLevel" placeholder="级别" clearable size="small" class="filter-select">
          <el-option label="ERROR" value="ERROR" />
          <el-option label="WARN" value="WARN" />
          <el-option label="INFO" value="INFO" />
          <el-option label="DEBUG" value="DEBUG" />
        </el-select>
        <el-input
          v-model="keyword"
          placeholder="服务端搜索：消息 / Logger / 类名"
          clearable
          size="small"
          class="filter-input"
          :prefix-icon="Search"
          @keyup.enter="doServerSearch"
        />
        <el-input
          v-model="traceIdSearch"
          placeholder="按 traceId 精确过滤"
          clearable
          size="small"
          class="filter-input trace-filter"
          @keyup.enter="doServerSearch"
        />
        <el-date-picker
          v-model="filters.range"
          type="datetimerange"
          range-separator="~"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          size="small"
          style="width: 320px"
        />
        <el-button size="small" round :loading="loading" @click="doServerSearch">搜索</el-button>
        <span class="match-hint" v-if="keyword || traceIdSearch">服务端命中 {{ total }} 条</span>
      </div>
      <div class="toolbar-right">
        <el-switch
          v-model="liveStream"
          active-text="实时日志流"
          class="live-switch"
          @change="toggleLiveStream"
        />
        <el-button size="small" round @click="exportCsvFull">
          <el-icon class="mr-1"><Download /></el-icon>导出 CSV（全量）
        </el-button>
        <el-button size="small" type="primary" round :loading="injecting" @click="doInjectLog">
          <el-icon class="mr-1"><Plus /></el-icon>写入一条日志
        </el-button>
        <el-button size="small" round :loading="loading" @click="load">
          <el-icon class="mr-1"><Refresh /></el-icon>刷新
        </el-button>
      </div>
    </div>

    <!-- 级别分布条 -->
    <div class="level-bar" v-if="logStats.length">
      <span class="section-label">级别分布</span>
      <div class="level-cards">
        <div v-for="s in logStats" :key="s.level" class="level-card">
          <el-tag :type="levelTag(s.level)" size="small" round>{{ s.level }}</el-tag>
          <span class="mono level-count">{{ s.count }}</span>
          <span class="mono muted level-pct">{{ s.percent.toFixed(1) }}%</span>
        </div>
      </div>
    </div>

    <!-- 实时日志流（SSE log 事件，仅保留最近 50 条） -->
    <div class="live-panel" v-if="liveStream">
      <div class="panel-head-row">
        <span class="section-label">实时日志流</span>
        <span class="muted hint-text">最近 {{ liveItems.length }} 条 · 自动滚动</span>
      </div>
      <div class="live-list">
        <div v-for="(r, i) in liveItems" :key="i" class="live-row">
          <el-tag :type="levelTag(r.level)" size="small" round>{{ r.level }}</el-tag>
          <span class="muted mono live-time">{{ r.timestamp }}</span>
          <span class="mono live-logger">{{ r.logger }}</span>
          <span :class="{ 'err-text': r.level === 'ERROR' }" class="live-msg">{{ r.message }}</span>
        </div>
        <div v-if="!liveItems.length" class="muted live-empty">等待实时日志…</div>
      </div>
    </div>

    <div class="table-panel">
      <el-table
        v-loading="loading"
        :data="items"
        class="apm-table"
        empty-text="暂无日志记录"
      >
        <el-table-column label="时间" width="160">
          <template #default="{ row }">
            <span class="muted mono">{{ row.timestamp }}</span>
          </template>
        </el-table-column>
        <el-table-column label="级别" width="90">
          <template #default="{ row }">
            <el-tag :type="levelTag(row.level)" size="small" round>
              {{ row.level }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="logger" label="Logger" min-width="180">
          <template #default="{ row }">
            <span class="mono">{{ row.logger }}</span>
          </template>
        </el-table-column>
        <el-table-column label="方法" min-width="160">
          <template #default="{ row }">
            <span class="mono muted">{{ row.className ? row.className + "." : "" }}{{ row.methodName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="消息" min-width="280">
          <template #default="{ row }">
            <span :class="{ 'err-text': row.level === 'ERROR' }">{{ row.message }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Trace" width="160">
          <template #default="{ row }">
            <a v-if="row.traceId" class="trace-link" @click="openTrace(row.traceId)">
              <code class="mono">{{ shortId(row.traceId) }}</code>
            </a>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="size"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="load"
          @current-change="load"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { Refresh, Download, Search, Plus } from "@element-plus/icons-vue";
import { pageLogs, exportLogsCsv, injectLog, getLogStats } from "../api/apmApi";
import type { LogRecord, LogLevelStat } from "../api/apmApi";

const router = useRouter();
const route = useRoute();

/** 点击 traceId 跳调用链路页（带 traceId 查询参数） */
function openTrace(traceId: string) {
  router.push({ path: "/traces", query: { traceId } });
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

/** 服务端搜索：把关键字/traceId/时间范围传给后端 /logs 过滤 */
function doServerSearch() {
  page.value = 1;
  load();
}

async function load() {
  loading.value = true;
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
  } catch {
    ElMessage.error("加载日志失败");
  } finally {
    loading.value = false;
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
    ElMessage.success(`已写入一条 ${lv} 日志`);
    await load();
  } catch {
    ElMessage.error("写入失败");
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

// ---- 级别分布 ----
const logStats = ref<LogLevelStat[]>([]);

async function loadLogStats() {
  try {
    logStats.value = (await getLogStats()) || [];
  } catch {
    logStats.value = [];
  }
}

// ---- 实时日志流（SSE log 事件）----
const liveStream = ref(false);
const liveItems = ref<LogRecord[]>([]);
let logEventSource: EventSource | null = null;

function toggleLiveStream(on: boolean) {
  if (on) {
    liveItems.value = [];
    logEventSource = new EventSource("/api/apm/stream?intervalMs=3000");
    logEventSource.addEventListener("log", (ev: MessageEvent) => {
      try {
        const raw = JSON.parse(ev.data as string);
        const rec: LogRecord = (raw && typeof raw === "object" && "items" in raw)
          ? (raw.items[0] as LogRecord)
          : (raw as LogRecord);
        if (rec && (rec.level || rec.message)) {
          liveItems.value.unshift(rec);
          if (liveItems.value.length > 50) liveItems.value.pop();
        }
      } catch {
        /* 忽略畸形帧 */
      }
    });
  } else {
    logEventSource?.close();
    logEventSource = null;
  }
}

onBeforeUnmount(() => {
  logEventSource?.close();
  logEventSource = null;
});

function levelTag(level: string) {
  switch ((level || "").toUpperCase()) {
    case "ERROR":
      return "danger";
    case "WARN":
      return "warning";
    case "DEBUG":
      return "info";
    default:
      return "success";
  }
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
.view {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.view-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-label {
  font-size: 14px;
  font-weight: 600;
}

.mr-1 {
  margin-right: 4px;
  vertical-align: -2px;
}

.live-switch {
  margin-right: 4px;
}

.filter-select {
  width: 120px;
}

.filter-input {
  width: 220px;
}

.match-hint {
  font-size: 12px;
  color: var(--apm-muted);
  white-space: nowrap;
}

.table-panel {
  background: var(--apm-panel);
  border: 1px solid var(--apm-border);
  border-radius: 14px;
  padding: 8px;
}

.apm-table {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-row-hover-bg-color: rgba(255, 255, 255, 0.04);
  --el-table-border-color: var(--apm-border);
  --el-table-header-bg-color: rgba(255, 255, 255, 0.03);
  --el-table-text-color: var(--apm-fg);
  --el-table-header-text-color: var(--apm-muted);
}

.mono {
  font-family: "JetBrains Mono", Consolas, monospace;
  font-size: 12px;
}

.trace-link {
  cursor: pointer;
  text-decoration: none;
  color: var(--apm-accent);
  transition: opacity 0.15s;
}

.trace-link:hover {
  opacity: 0.7;
}

.muted {
  color: var(--apm-muted);
}

.err-text {
  color: var(--apm-danger);
}

.pager {
  display: flex;
  justify-content: flex-end;
  padding: 10px 8px 4px;
}

/* 级别分布条 */
.level-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--apm-panel);
  border: 1px solid var(--apm-border);
  border-radius: 12px;
  padding: 10px 14px;
}

.level-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.level-card {
  display: flex;
  align-items: center;
  gap: 6px;
}

.level-count {
  font-size: 14px;
  font-weight: 700;
  color: var(--apm-fg);
}

.level-pct {
  font-size: 11px;
}

/* 实时日志流 */
.live-panel {
  background: var(--apm-panel);
  border: 1px solid var(--apm-border);
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.panel-head-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hint-text {
  font-size: 11px;
}

.live-list {
  max-height: 220px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.live-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.03);
}

.live-time {
  width: 150px;
  flex-shrink: 0;
}

.live-logger {
  color: var(--apm-muted);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
}

.live-msg {
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.live-empty {
  font-size: 12px;
  padding: 12px 0;
  text-align: center;
}
</style>
