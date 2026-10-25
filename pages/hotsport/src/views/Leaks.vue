<template>
  <div class="view">
    <div class="view-toolbar">
      <div class="toolbar-left">
        <span class="section-label">资源泄漏</span>
        <span class="match-hint">
          <template v-if="!loading">{{ total.toLocaleString() }} 条 · 第 {{ page }} 页</template>
          <template v-else>加载中…</template>
        </span>
      </div>
      <div class="toolbar-right">
        <el-button round @click="exportCsvFull">
          <el-icon class="btn-icon"><Download /></el-icon>导出 CSV
        </el-button>
        <el-button type="primary" round :loading="injecting" @click="doInjectLeak">
          <el-icon class="btn-icon"><Plus /></el-icon>制造一条泄漏
        </el-button>
        <el-button round :loading="loading" @click="load">
          <el-icon class="btn-icon"><Refresh /></el-icon>刷新
        </el-button>
      </div>
    </div>

    <!-- 概览：把"现在有多少活跃泄漏"直接摊在顶部 -->
    <div class="stat-row">
      <ReStatCard
        size="compact"
        title="当前页泄漏"
        :value="items.length"
        :desc="`共 ${total.toLocaleString()} 条记录`"
        :icon="Warning"
        icon-color="var(--apm-warning)"
      />
      <ReStatCard
        size="compact"
        title="活跃未关闭"
        :value="activeCount"
        :desc="activeCount ? '存在未释放资源' : '当前页均已关闭'"
        :icon="CircleClose"
        :icon-color="activeCount ? 'var(--apm-danger)' : 'var(--apm-success)'"
      />
      <ReStatCard
        size="compact"
        title="最久存活"
        :value="`${(maxAgeMs / 1000).toFixed(1)} s`"
        desc="当前页最长未释放时长"
        :icon="Timer"
        :icon-color="maxAgeMs > 30000 ? 'var(--apm-danger)' : 'var(--apm-accent)'"
      />
      <ReStatCard
        size="compact"
        title="主要类型"
        :value="dominantType"
        desc="当前页出现最多的泄漏类型"
        :icon="Files"
        icon-color="var(--apm-accent-alt)"
      />
    </div>

    <div class="filter-bar">
      <div class="filter-field">
        <label class="filter-label">类型</label>
        <el-select v-model="filterType" placeholder="全部" clearable>
          <el-option label="File" value="File" />
          <el-option label="Socket" value="Socket" />
          <el-option label="Connection" value="Connection" />
          <el-option label="Thread" value="Thread" />
        </el-select>
      </div>

      <div class="filter-field">
        <label class="filter-label" for="leak-res">资源名</label>
        <el-input id="leak-res" v-model="resourceNameSearch" placeholder="搜索资源名" clearable />
      </div>

      <div class="filter-field">
        <label class="filter-label" for="leak-thread">线程</label>
        <el-input id="leak-thread" v-model="threadSearch" placeholder="搜索线程" clearable />
      </div>

      <div class="filter-field time-field">
        <label class="filter-label">检测时间</label>
        <el-date-picker
          v-model="range"
          type="datetimerange"
          range-separator="~"
          start-placeholder="开始"
          end-placeholder="结束"
        />
      </div>

      <div class="filter-field check-field">
        <label class="filter-label">状态</label>
        <el-checkbox v-model="activeOnly">仅看活跃</el-checkbox>
      </div>

      <div class="filter-actions">
        <el-button text @click="resetFilters">重置</el-button>
      </div>
    </div>

    <div class="table-panel">
      <ReTable
        :data="items as unknown as Record<string, unknown>[]"
        :columns="leakColumns"
        :loading="loading"
        engine="element"
        :pagination="false"
        :toolbar="false"
        :settings="{ border: false }"
        :layout-table="{ minHeight: 0 }"
        class="apm-table"
        empty-text="暂无泄漏记录"
      >
        <template #col-resourceType="{ row }">
          <el-tag :type="typeTagOf(row)" round size="small">
            {{ row.resourceType }}
          </el-tag>
        </template>
        <template #col-resourceName="{ row }">
          <span class="mono">{{ row.resourceName }}</span>
        </template>
        <template #col-thread="{ row }">
          <span class="mono muted">{{ row.thread || "—" }}</span>
        </template>
        <template #col-ageMs="{ row }">
          <div class="age-cell">
            <span class="age-bar">
              <i
                :class="ageClass(ageMsOf(row))"
                :style="{ width: agePercent(ageMsOf(row)) + '%' }"
              />
            </span>
            <span class="mono age-num" :class="ageClass(ageMsOf(row))">
              {{ (ageMsOf(row) / 1000).toFixed(1) }}s
            </span>
          </div>
        </template>
        <template #col-active="{ row }">
          <el-tag :type="row.active ? 'danger' : 'info'" effect="plain" size="small">
            {{ row.active ? "活跃" : "已关闭" }}
          </el-tag>
        </template>
        <template #col-detectedAt="{ row }">
          <span class="muted">{{ row.detectedAt || "—" }}</span>
        </template>
        <template #col-stackTrace="{ row }">
          <el-popover v-if="row.stackTrace" trigger="hover" width="420" placement="left">
            <template #reference>
              <el-button text type="primary" size="small">展开</el-button>
            </template>
            <pre class="stack">{{ row.stackTrace }}</pre>
          </el-popover>
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
          @size-change="load"
          @current-change="load"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { computed, onMounted, ref, watch } from "vue";

import {
  CircleClose,
  Download,
  Files,
  Plus,
  Refresh,
  Timer,
  Warning,
} from "@element-plus/icons-vue";
import ReTable from "@repo/ui/re-table";
import ReStatCard from "@repo/ui/re-stat-card";
import type { ReTableColumn } from "@repo/ui/re-table";
import { pageLeaks, exportLeaksCsv, injectLeak } from "../api/apmApi";
import type { LeakRecord, LeakQuery } from "../api/apmApi";

const items = ref<LeakRecord[]>([]);
const total = ref(0);
const page = ref(1);
const size = ref(20);
const loading = ref(false);
const filterType = ref("");
const resourceNameSearch = ref("");
const threadSearch = ref("");
const activeOnly = ref(false);
const range = ref<[Date, Date] | null>(null);

/** 顶部概览：全部基于当前页数据，不额外打接口 */
const activeCount = computed(() => items.value.filter((r) => r.active).length);
const maxAgeMs = computed(() =>
  items.value.reduce((max, r) => Math.max(max, Number(r.ageMs ?? 0)), 0),
);
const dominantType = computed(() => {
  if (!items.value.length) return "—";
  const tally = new Map<string, number>();
  for (const r of items.value) {
    const k = String(r.resourceType || "未知");
    tally.set(k, (tally.get(k) ?? 0) + 1);
  }
  let best = "—";
  let bestN = -1;
  for (const [k, n] of tally) {
    if (n > bestN) {
      best = k;
      bestN = n;
    }
  }
  return best;
});

const leakColumns: ReTableColumn[] = [
  { prop: "resourceType", label: "类型", width: 120, slot: "resourceType" },
  { prop: "resourceName", label: "资源", minWidth: 200, slot: "resourceName" },
  { prop: "thread", label: "线程", minWidth: 140, slot: "thread" },
  { prop: "ageMs", label: "存活", width: 150, align: "right", slot: "ageMs", sortable: true },
  { prop: "active", label: "状态", width: 80, align: "center", slot: "active" },
  { prop: "detectedAt", label: "检测时间", width: 160, slot: "detectedAt" },
  { prop: "stackTrace", label: "调用栈", width: 90, align: "center", slot: "stackTrace" },
];

/** 插槽里的 row 是宽类型（unknown）：类型取色前先收窄成 string */
function typeTagOf(row: Record<string, unknown>) {
  return typeTag(String(row.resourceType ?? ""));
}

/** 插槽里的 row 是宽类型（unknown）：存活毫秒是算术入参，先收窄成 number */
function ageMsOf(row: Record<string, unknown>): number {
  return Number(row.ageMs ?? 0);
}

/** 组装查询条件：load 与 CSV 导出共用，避免两处筛选逻辑漂移（原来导出漏了 activeOnly） */
function buildQuery(): LeakQuery {
  return {
    page: page.value,
    size: size.value,
    resourceType: filterType.value || undefined,
    resourceName: resourceNameSearch.value.trim() || undefined,
    thread: threadSearch.value.trim() || undefined,
    activeOnly: activeOnly.value || undefined,
    startTime: range.value?.[0] ? new Date(range.value[0]).getTime() : undefined,
    endTime: range.value?.[1] ? new Date(range.value[1]).getTime() : undefined,
  };
}

async function load() {
  loading.value = true;
  try {
    const res = await pageLeaks(buildQuery());
    items.value = res.items;
    total.value = res.total;
  } catch {
    message.error("加载泄漏记录失败");
  } finally {
    loading.value = false;
  }
}

function typeTag(t: string) {
  switch (t) {
    case "File":
      return "warning";
    case "Socket":
      return "danger";
    case "Connection":
      return "primary";
    case "Thread":
      return "success";
    default:
      return "info";
  }
}

/** 存活 0~60s 映射到 0~100% */
function agePercent(ageMs: number) {
  return Math.min(100, Math.round((ageMs / 60000) * 100));
}

/** 存活三档：>30s 危险、>10s 警告，其余正常（阈值沿用原口径，改为令牌色） */
function ageClass(ageMs: number): string {
  if (ageMs > 30000) return "danger";
  if (ageMs > 10000) return "warning";
  return "ok";
}

/** 重置全部筛选 */
function resetFilters() {
  filterType.value = "";
  resourceNameSearch.value = "";
  threadSearch.value = "";
  activeOnly.value = false;
  range.value = null;
}

onMounted(load);

watch(
  () => [filterType.value, resourceNameSearch.value, threadSearch.value, activeOnly.value, range.value],
  () => {
    page.value = 1;
    load();
  },
);

// ---- 注入 ----
const injecting = ref(false);
const leakSeq = ref(0);

async function doInjectLeak() {
  injecting.value = true;
  try {
    leakSeq.value++;
    const kinds = ["File", "Socket", "Connection", "Thread"];
    const kind = kinds[leakSeq.value % kinds.length];
    await injectLeak(kind, `${kind.toLowerCase()}-manual-${leakSeq.value}`);
    message.success(`已制造一条 ${kind} 泄漏记录`);
    await load();
  } catch {
    message.error("写入失败");
  } finally {
    injecting.value = false;
  }
}

/** 后端全量 CSV 导出（带当前全部筛选条件） */
function exportCsvFull() {
  const q: LeakQuery = { ...buildQuery() };
  delete q.page;
  delete q.size;
  exportLeaksCsv(q);
}
</script>

<style scoped>
/* 骨架与 .filter-bar/.filter-field/.pager 由 styles/layout.css 提供 */

.btn-icon {
  margin-right: 4px;
  vertical-align: -2px;
}

.filter-field {
  width: 150px;
}
.time-field {
  width: 320px;
}
.check-field {
  width: auto;
}

.table-panel {
  overflow: hidden;
}

/* 存活时长：数值 + 进度条，超阈值变色 */
.age-cell {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--apm-space-2);
}

.age-bar {
  position: relative;
  width: 60px;
  height: 4px;
  flex-shrink: 0;
  border-radius: 999px;
  background: var(--apm-border-soft);
  overflow: hidden;
}

.age-bar > i {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 999px;
  transition: width var(--apm-t-base);
}

.age-bar > i.ok {
  background: var(--apm-success);
}
.age-bar > i.warning {
  background: var(--apm-warning);
}
.age-bar > i.danger {
  background: var(--apm-danger);
}

.age-num {
  min-width: 52px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.age-num.ok { color: var(--apm-fg-regular); }
.age-num.warning { color: var(--apm-warning); }
.age-num.danger { color: var(--apm-danger); font-weight: 600; }

.stack {
  font-family: var(--apm-font-mono);
  font-size: 11px;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  max-height: 300px;
  overflow-y: auto;
  color: var(--apm-fg);
}

@media (prefers-reduced-motion: reduce) {
  .age-bar > i {
    transition: none;
  }
  .view :deep(.el-skeleton__item),
  .view :deep(.el-loading-spinner) {
    animation: none;
    transition: none;
  }
}
</style>
