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
import { onMounted, reactive, ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { Refresh, Download, Search } from "@element-plus/icons-vue";
import { pageLogs, exportLogsCsv, injectLog } from "../api/apmApi";
import type { LogRecord } from "../api/apmApi";

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
</style>
