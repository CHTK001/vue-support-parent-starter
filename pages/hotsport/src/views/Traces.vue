<template>
  <div class="view">
    <!-- 工具栏：标题 + 记录数 + 全局动作 -->
    <div class="view-toolbar">
      <div class="toolbar-left">
        <span class="section-label">调用链路</span>
        <span class="match-hint">
          <template v-if="!loading">{{ total.toLocaleString() }} 条 · 第 {{ page }} 页</template>
          <template v-else>加载中…</template>
        </span>
      </div>
      <div class="toolbar-right">
        <el-button round @click="exportCsvFull">
          <el-icon class="btn-icon"><Download /></el-icon>导出 CSV
        </el-button>
        <el-button round :loading="loading" @click="load">
          <el-icon class="btn-icon"><Refresh /></el-icon>刷新
        </el-button>
      </div>
    </div>

    <!-- 筛选栏：查询条件与动作分离，窄屏自然换行 -->
    <div class="filter-bar">
      <div class="filter-field trace-search-field">
        <label class="filter-label" for="tr-trace">Trace ID</label>
        <el-input
          id="tr-trace"
          v-model="traceSearch"
          placeholder="按 traceId 精确搜索"
          clearable
          @keyup.enter="applyTraceSearch"
        />
      </div>

      <div class="filter-field">
        <label class="filter-label" for="tr-source">源端</label>
        <el-input id="tr-source" v-model="filters.source" placeholder="如 payment" clearable />
      </div>

      <div class="filter-field">
        <label class="filter-label" for="tr-protocol">协议</label>
        <el-input id="tr-protocol" v-model="filters.protocol" placeholder="HTTP / AGENT" clearable />
      </div>

      <div class="filter-field">
        <label class="filter-label" for="tr-op">操作</label>
        <el-input id="tr-op" v-model="filters.operation" placeholder="如 /pay/callback" clearable />
      </div>

      <div class="filter-field">
        <label class="filter-label">耗时区间 (ms)</label>
        <div class="range-pair">
          <el-input-number
            v-model="filters.durationMin"
            :min="0"
            :controls="false"
            placeholder="最小"
            class="range-input"
          />
          <span class="range-sep">~</span>
          <el-input-number
            v-model="filters.durationMax"
            :min="0"
            :controls="false"
            placeholder="最大"
            class="range-input"
          />
        </div>
      </div>

      <div class="filter-field time-field">
        <label class="filter-label">时间范围</label>
        <el-date-picker
          v-model="filters.range"
          type="datetimerange"
          range-separator="~"
          start-placeholder="开始"
          end-placeholder="结束"
        />
      </div>

      <div class="filter-field check-field">
        <label class="filter-label">状态</label>
        <el-checkbox v-model="filters.errorOnly">仅看错误</el-checkbox>
      </div>

      <div class="filter-actions">
        <el-dropdown v-if="savedFilterNames.length" trigger="click" @command="applySavedFilter">
          <el-button text size="small" type="primary">
            收藏筛选 <el-icon><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="f in savedFilterNames" :key="f" :command="f">
                {{ f }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button text size="small" @click="saveCurrentFilter">保存当前筛选</el-button>
        <el-button text @click="resetFilters">重置</el-button>
        <el-button type="primary" round :loading="loading" @click="applyTraceSearch">
          <el-icon class="btn-icon"><Search /></el-icon>查询
        </el-button>
      </div>
    </div>

    <div class="table-panel">
      <ReTable
        :data="items as unknown as Record<string, unknown>[]"
        :columns="traceColumns"
        :loading="loading"
        engine="element"
        :pagination="false"
        :toolbar="false"
        :settings="{ border: false }"
        :layout-table="{ minHeight: 0 }"
        :row-class-name="rowClass"
        class="apm-table trace-table"
        empty-text="暂无传输记录（Agent 未注入或无数据）"
        @row-click="openDetail"
      >
        <template #col-traceId="{ row }">
          <div class="trace-id-cell">
            <code class="mono trace-link" @click.stop="openWaterfall(traceIdOf(row))">
              {{ shortId(traceIdOf(row)) }}
            </code>
            <el-tooltip content="复制完整 traceId" placement="top" :show-after="400">
              <el-icon class="copy-btn" @click.stop="copyId(traceIdOf(row))">
                <CopyDocument />
              </el-icon>
            </el-tooltip>
            <el-button link type="primary" @click.stop="openWaterfall(traceIdOf(row))">
              瀑布
            </el-button>
          </div>
        </template>

        <template #col-route="{ row }">
          <div class="edge">
            <span class="edge-endpoint">{{ row.source || "—" }}</span>
            <el-icon class="edge-arrow"><Right /></el-icon>
            <span class="edge-endpoint target">{{ row.target || "—" }}</span>
          </div>
        </template>

        <template #col-protocol="{ row }">
          <el-tag effect="plain" round size="small">{{ row.protocol || "—" }}</el-tag>
        </template>

        <template #col-durationMs="{ row }">
          <span class="mono dur-val" :class="durClass(row.durationMs)">
            {{ row.durationMs }}
          </span>
        </template>

        <template #col-status="{ row }">
          <el-tag :type="row.status === 'OK' ? 'success' : 'danger'" round size="small">
            {{ row.status || "OK" }}
          </el-tag>
        </template>

        <template #col-startTime="{ row }">
          <span class="muted">{{ row.startTime || "—" }}</span>
        </template>

        <template #col-errorMessage="{ row }">
          <span v-if="row.errorMessage" class="err-text" :title="row.errorMessage">
            {{ row.errorType }}: {{ row.errorMessage }}
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
          @size-change="load"
          @current-change="load"
        />
      </div>
    </div>

    <!-- Trace 详情抽屉：点击行打开，展示整条链路全部 span -->
    <el-drawer
      v-model="detailVisible"
      :title="`链路详情 · ${detailTraceId || ''}`"
      size="640px"
    >
      <div v-if="detailTraceId" class="drawer-actions">
        <el-button round type="primary" @click="openWaterfall(detailTraceId)">
          <el-icon class="btn-icon"><Right /></el-icon>查看瀑布图
        </el-button>
        <el-button round @click="copyId(detailTraceId)">
          <el-icon class="btn-icon"><CopyDocument /></el-icon>复制 traceId
        </el-button>
        <span class="drawer-count mono">{{ detailSpans.length }} 个 span</span>
      </div>

      <div v-loading="detailLoading" class="detail-body">
        <el-empty
          v-if="!detailLoading && detailSpans.length === 0"
          description="该链路无 span 数据"
        />
        <div v-for="(span, i) in detailSpans" :key="span.spanId || i" class="span-card">
          <div class="span-head">
            <span class="span-idx">#{{ i + 1 }}</span>
            <el-tag :type="span.status === 'OK' ? 'success' : 'danger'" round size="small">
              {{ span.status || "OK" }}
            </el-tag>
            <code class="span-op">{{ span.operation || span.target || "—" }}</code>
            <span class="span-duration mono">{{ span.durationMs }} ms</span>
          </div>
          <div class="span-grid">
            <div class="span-row"><span class="k">spanId</span><code class="mono">{{ span.spanId }}</code></div>
            <div class="span-row"><span class="k">parent</span><code class="mono">{{ span.parentSpanId || "—" }}</code></div>
            <div class="span-row"><span class="k">源端</span><span>{{ span.source || "—" }}</span></div>
            <div class="span-row"><span class="k">目标</span><span>{{ span.target || "—" }}</span></div>
            <div class="span-row"><span class="k">协议</span><span>{{ span.protocol || "—" }} <template v-if="span.software">[{{ span.software }}]</template></span></div>
            <div class="span-row"><span class="k">时间</span><span>{{ span.startTime }} → {{ span.endTime }}</span></div>
            <div class="span-row"><span class="k">流量</span><span>↑{{ span.bytesOut }} B / ↓{{ span.bytesIn }} B</span></div>
          </div>
          <div v-if="span.errorMessage" class="span-error">
            <div class="span-error-title">{{ span.errorType || "ERROR" }}</div>
            <pre class="span-error-msg">{{ span.errorMessage }}</pre>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ROUTE_PREFIX } from "../config";

import {
  CopyDocument,
  Download,
  Refresh,
  Right,
  Search,
  ArrowDown,
} from "@element-plus/icons-vue";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
import { pageTransmissions, getTraceDetail, exportTransmissionsCsv } from "../api/apmApi";
import type { TransmissionQuery, TransmissionRecord } from "../api/apmApi";

const router = useRouter();
const route = useRoute();

const items = ref<TransmissionRecord[]>([]);
const total = ref(0);
const page = ref(1);
const size = ref(20);
const loading = ref(false);
const traceSearch = ref("");

const traceColumns: ReTableColumn[] = [
  { prop: "traceId", label: "Trace ID", width: 220, slot: "traceId" },
  { prop: "route", label: "源 → 目标", minWidth: 260, slot: "route" },
  { prop: "protocol", label: "协议", width: 110, slot: "protocol" },
  { prop: "durationMs", label: "耗时", width: 100, align: "right", slot: "durationMs", sortable: true },
  { prop: "status", label: "状态", width: 90, align: "center", slot: "status" },
  { prop: "startTime", label: "开始时间", width: 160, slot: "startTime" },
  { prop: "errorMessage", label: "错误", minWidth: 180, slot: "errorMessage" },
];

/** 插槽 / 行事件里的 row 是宽类型（unknown）：取 traceId 前先收窄成 string */
function traceIdOf(row: Record<string, unknown>): string {
  return String(row.traceId ?? "");
}

/** 按 traceId 服务端搜索（后端 /transmissions 已支持 traceId 参数过滤） */
function applyTraceSearch() {
  filters.traceId = traceSearch.value.trim();
  page.value = 1;
  load();
}

/** 跳瀑布详情页 */
function openWaterfall(traceId: string) {
  if (!traceId) return;
  detailVisible.value = false;
  router.push({ path: ROUTE_PREFIX + "/traces/detail", query: { traceId } });
}

const filters = reactive({
  source: "",
  protocol: "",
  errorOnly: false,
  traceId: "",
  operation: "",
  durationMin: null as number | null,
  durationMax: null as number | null,
  range: null as [Date, Date] | null,
});

/** 组装查询条件：load 与 CSV 导出共用，避免两处筛选逻辑漂移 */
function buildQuery(): TransmissionQuery {
  const q: TransmissionQuery = {
    page: page.value,
    size: size.value,
  };
  if (filters.source) q.source = filters.source;
  if (filters.protocol) q.protocol = filters.protocol;
  if (filters.errorOnly) q.errorOnly = true;
  if (filters.traceId) q.traceId = filters.traceId;
  if (filters.operation) q.operation = filters.operation;
  if (filters.durationMin != null) q.durationMin = filters.durationMin;
  if (filters.durationMax != null) q.durationMax = filters.durationMax;
  if (filters.range && filters.range.length === 2) {
    q.startTime = new Date(filters.range[0]).getTime();
    q.endTime = new Date(filters.range[1]).getTime();
  }
  return q;
}

async function load() {
  loading.value = true;
  try {
    const res = await pageTransmissions(buildQuery());
    items.value = res.items;
    total.value = res.total;
  } catch {
    message.error("加载调用链路失败");
  } finally {
    loading.value = false;
  }
}

async function exportCsvFull() {
  // 导出不带分页，只带筛选条件
  const q: TransmissionQuery = { ...buildQuery() };
  delete q.page;
  delete q.size;
  exportTransmissionsCsv(q);
}

/** 清空所有筛选并回到第一页 */
function resetFilters() {
  traceSearch.value = "";
  filters.source = "";
  filters.protocol = "";
  filters.operation = "";
  filters.errorOnly = false;
  filters.traceId = "";
  filters.durationMin = null;
  filters.durationMax = null;
  filters.range = null;
  page.value = 1;
  load();
}

/* ---- 筛选收藏 ---- */
/** 本页已保存的筛选名称列表 */
const savedFilterNames = computed<string[]>(() => {
  try {
    const raw = localStorage.getItem(`apm-saved-filters-traces`);
    if (!raw) return [];
    return (JSON.parse(raw) as { name: string }[]).map((f) => f.name);
  } catch { return []; }
});

/** 保存当前筛选条件到 localStorage */
function saveCurrentFilter() {
  const name = window.prompt("请输入筛选收藏名称：");
  if (!name?.trim()) return;
  try {
    const raw = localStorage.getItem(`apm-saved-filters-traces`);
    const list: { name: string; source: string; protocol: string; operation: string; errorOnly: boolean }[] = raw ? JSON.parse(raw) : [];
    // 覆盖同名，追加新名
    const idx = list.findIndex((f) => f.name === name.trim());
    const entry = { name: name.trim(), source: filters.source, protocol: filters.protocol, operation: filters.operation, errorOnly: filters.errorOnly };
    if (idx >= 0) list[idx] = entry;
    else list.push(entry);
    localStorage.setItem(`apm-saved-filters-traces`, JSON.stringify(list));
  } catch { /* 忽略 */ }
}

/** 恢复已保存的筛选 */
function applySavedFilter(name: string) {
  try {
    const raw = localStorage.getItem(`apm-saved-filters-traces`);
    if (!raw) return;
    const list = JSON.parse(raw) as { name: string; source: string; protocol: string; operation: string; errorOnly: boolean }[];
    const saved = list.find((f) => f.name === name);
    if (!saved) return;
    filters.source = saved.source ?? "";
    filters.protocol = saved.protocol ?? "";
    filters.operation = saved.operation ?? "";
    filters.errorOnly = saved.errorOnly ?? false;
    page.value = 1;
    load();
  } catch { /* 忽略 */ }
}

function shortId(id: string) {
  return id ? id.slice(0, 12) : "—";
}

/** 耗时四档：正常 / 偏慢 / 慢 / 严重（阈值按 APM 常用口径） */
function durClass(ms: number | undefined): string {
  const v = Number(ms ?? 0);
  if (v >= 3000) return "crit";
  if (v >= 1000) return "slow";
  if (v >= 300) return "mid";
  return "fast";
}

async function copyId(id: string) {
  if (!id) return;
  try {
    await navigator.clipboard.writeText(id);
    message.success("已复制 traceId");
  } catch {
    message.error("复制失败，请手动选中");
  }
}

function rowClass({ row }: { row: TransmissionRecord }) {
  return row.errorMessage ? "row-error" : "row-clickable";
}

// ---- Trace 详情抽屉 ----

const detailVisible = ref(false);
const detailLoading = ref(false);
const detailTraceId = ref("");
const detailSpans = ref<TransmissionRecord[]>([]);

async function openDetail(row: Record<string, unknown>) {
  const traceId = traceIdOf(row);
  if (!traceId) return;
  detailTraceId.value = traceId;
  detailVisible.value = true;
  detailLoading.value = true;
  detailSpans.value = [];
  try {
    detailSpans.value = (await getTraceDetail(traceId)) || [];
  } catch {
    message.error("加载链路详情失败");
  } finally {
    detailLoading.value = false;
  }
}

// 只有"会改变结果集"的条件才自动重查；traceId/耗时/时间由「查询」按钮显式提交，
// 否则每敲一个字符都会打一次接口。
watch(
  () => [filters.source, filters.protocol, filters.errorOnly],
  () => {
    page.value = 1;
    load();
  },
);

onMounted(() => {
  // 从全局搜索进入：/traces?traceId=xxx 自动应用
  const qTrace = String(route.query.traceId ?? "");
  if (qTrace) {
    filters.traceId = qTrace;
    traceSearch.value = qTrace;
  }
  load();
});
</script>

<style scoped>
/* 骨架与 .filter-bar/.filter-field/.pager 统一由 styles/layout.css 提供。
   颜色/圆角已迁移为 koi 令牌，未加载 koi 时回退 --apm-*。 */

.btn-icon {
  margin-right: 4px;
  vertical-align: -2px;
}

/* 筛选字段宽度：Trace ID 更长，时间范围独占一档，其余等宽 */
.trace-search-field {
  width: 200px;
}
.filter-field {
  width: 132px;
}
.time-field {
  width: 320px;
}
.check-field {
  width: auto;
}
.range-pair {
  display: flex;
  align-items: center;
  gap: 4px;
}
.range-input {
  width: 62px;
}
.range-sep {
  color: var(--text-tertiary, var(--apm-muted));
}

/* ---- 表格单元 ---- */
.trace-id-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* <code> 承载点击跳转：可点元素必须有手型光标与键盘焦点环 */
.trace-link {
  cursor: pointer;
  outline: none;
  color: var(--brand-500, var(--apm-accent));
  transition: opacity var(--apm-t-fast);
}

.trace-link:focus-visible {
  box-shadow: 0 0 0 3px var(--apm-accent-subtle);
}

.trace-link:hover {
  opacity: 0.72;
}

.copy-btn {
  cursor: pointer;
  color: var(--text-tertiary, var(--apm-muted));
  opacity: 0;
  transition: opacity var(--apm-t-fast), color var(--apm-t-fast);
}

/* 复制按钮常隐，悬停整行才出现，避免每行都是图标噪音 */
.trace-table :deep(.el-table__row:hover) .copy-btn {
  opacity: 1;
}

.copy-btn:hover {
  color: var(--brand-500, var(--apm-accent));
}

.edge {
  display: flex;
  align-items: center;
  gap: 6px;
}

.edge-endpoint {
  font-family: var(--apm-font-mono);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 150px;
}

.edge-endpoint.target {
  color: var(--brand-500, var(--apm-accent));
}

.edge-arrow {
  color: var(--text-tertiary, var(--apm-muted));
  flex-shrink: 0;
}

/* 耗时四档着色：扫一眼就能定位慢请求 */
.dur-val {
  font-variant-numeric: tabular-nums;
}
.dur-val.fast {
  color: var(--status-success, var(--apm-success));
}
.dur-val.mid {
  color: var(--text-secondary, var(--apm-fg-regular));
}
.dur-val.slow {
  color: var(--status-warning, var(--apm-warning));
}
.dur-val.crit {
  color: var(--status-error, var(--apm-danger));
  font-weight: 600;
}

.trace-table :deep(.row-clickable) {
  cursor: pointer;
}

/* 错误行：淡红底承载语义，行本身仍可点 */
.trace-table :deep(.row-error) {
  cursor: pointer;
  background: var(--apm-danger-bg);
}

/* ---- 详情抽屉 ---- */
.drawer-actions {
  margin-bottom: var(--apm-space-3);
  display: flex;
  align-items: center;
  gap: var(--apm-space-2);
}

.drawer-count {
  margin-left: auto;
  color: var(--text-tertiary, var(--apm-muted));
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: var(--apm-space-3);
}

.span-card {
  border: 1px solid var(--border-subtle, var(--apm-border-soft));
  border-radius: var(--radius-md, var(--apm-radius-md));
  padding: var(--apm-space-3);
  background: var(--bg-elevated, var(--apm-panel-raised));
}

.span-head {
  display: flex;
  align-items: center;
  gap: var(--apm-space-2);
  margin-bottom: var(--apm-space-2);
}

.span-idx {
  font-size: 12px;
  color: var(--text-tertiary, var(--apm-muted));
  min-width: 28px;
}

.span-op {
  font-family: var(--apm-font-mono);
  font-size: 12px;
  color: var(--text-primary, var(--apm-fg));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.span-duration {
  margin-left: auto;
  color: var(--brand-500, var(--apm-accent));
  font-weight: 600;
}

.span-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.span-row {
  display: flex;
  gap: 10px;
  font-size: 12px;
  line-height: 1.6;
}

.span-row .k {
  color: var(--text-tertiary, var(--apm-muted));
  min-width: 52px;
  flex-shrink: 0;
}

.span-error {
  margin-top: var(--apm-space-2);
  border-top: 1px dashed var(--apm-danger-bg);
  padding-top: var(--apm-space-2);
}

.span-error-title {
  color: var(--status-error, var(--apm-danger));
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
}

.span-error-msg {
  color: var(--status-error, var(--apm-danger));
  font-size: 11px;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  font-family: var(--apm-font-mono);
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .trace-link,
  .copy-btn {
    transition: none;
  }
  .detail-body :deep(.el-loading-spinner) {
    animation: none;
    transition: none;
  }
}
</style>

<style>
/* 抽屉 teleport 到 body，scoped 样式覆盖不到容器，须用全局样式。
   颜色已迁移为 koi 令牌，未加载 koi 时回退 --apm-*。 */
.el-drawer {
  --el-drawer-bg-color: var(--bg-container, var(--apm-panel));
  background: var(--bg-container, var(--apm-panel));
  color: var(--text-primary, var(--apm-fg));
}

.el-drawer__header {
  color: var(--text-primary, var(--apm-fg));
  margin-bottom: 12px;
  border-bottom: 1px solid var(--border-default, var(--apm-border));
  padding-bottom: 12px;
}

.el-drawer__body {
  background: var(--bg-container, var(--apm-panel));
  color: var(--text-primary, var(--apm-fg));
}
</style>
