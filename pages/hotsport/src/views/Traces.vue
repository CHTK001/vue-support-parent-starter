<template>
  <div class="view">
    <!-- 操作条：无标题大卡 -->
    <div class="view-bar">
      <span class="match-hint">
        <template v-if="!loading">
          {{ total.toLocaleString() }} 条链路 · {{ methodNodeCount.toLocaleString() }} 个方法层节点 ·
          第 {{ page }} 页
        </template>
        <template v-else>加载中…</template>
      </span>
      <div class="view-bar__actions">
        <el-button round @click="toggleExpandAll">
          {{ expandAll ? "收起全部" : "展开全部" }}
        </el-button>
        <el-button round @click="exportCsvFull">
          <el-icon class="btn-icon"><Download /></el-icon>导出 CSV
        </el-button>
        <el-button round :loading="loading" @click="load">
          <el-icon class="btn-icon"><Refresh /></el-icon>刷新
        </el-button>
      </div>
    </div>

    <!-- 数据来源说明：树层级全部来自真实记录，没有方法层数据时如实说明 -->
    <div v-if="!loading && !total && filters.traceId" class="tree-hint">
      最近 {{ TRACE_LIMIT }} 条链路里没有 traceId 含「{{ filters.traceId }}」的记录。
    </div>
    <div v-else-if="!loading && !methodNodeCount && total" class="tree-hint">
      首层是真实 HTTP 请求；本进程暂未产生 class.method 级记录，因此暂无子层节点。
    </div>

    <!-- 筛选栏：查询条件与动作分离，窄屏自然换行 -->
    <div class="filter-bar">
      <div class="filter-field trace-search-field">
        <label class="filter-label" for="tr-trace">Trace ID</label>
        <el-input
          id="tr-trace"
          v-model="traceSearch"
          placeholder="按 traceId 搜索"
          clearable
          @keyup.enter="applyTraceSearch"
        />
      </div>

      <div class="filter-field">
        <label class="filter-label" for="tr-source">源端</label>
        <el-input id="tr-source" v-model="filters.source" placeholder="如 127.0.0.1" clearable />
      </div>

      <div class="filter-field">
        <label class="filter-label" for="tr-protocol">协议</label>
        <el-input id="tr-protocol" v-model="filters.protocol" placeholder="HTTP / AGENT" clearable />
      </div>

      <div class="filter-field">
        <label class="filter-label" for="tr-op">操作</label>
        <el-input id="tr-op" v-model="filters.operation" placeholder="如 /api/apm/stats" clearable />
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
      <!--
        可展开树表：首层 = 真实 HTTP 请求（METHOD URL），子层 = 真实 class.method。
        层级由后端按真实 parentSpanId 嵌套，前端不做任何补造。
      -->
      <ReTable
        :key="treeKey"
        :data="pagedRoots as unknown as Record<string, unknown>[]"
        :columns="traceColumns"
        :loading="loading"
        engine="element"
        :pagination="false"
        :toolbar="false"
        :settings="{ border: false }"
        :layout-table="{ minHeight: 0 }"
        :row-class-name="rowClass"
        row-key="id"
        :tree-props="{ children: 'children' }"
        :default-expand-all="expandAll"
        class="apm-table trace-table"
        empty-text="暂无调用链路：本进程还没有产生任何真实请求"
      >
        <!-- 首层：METHOD URL cost xxx ms；子层：class.method cost xxx ms -->
        <template #col-label="{ row }">
          <div class="call-cell" :class="row.kind === 'http' ? 'is-root' : 'is-method'">
            <span class="call-dot" :class="row.kind === 'http' ? 'dot-http' : 'dot-method'" aria-hidden="true" />
            <code class="mono call-name" :title="String(row.label ?? '')">{{ displayName(row) }}</code>
            <span class="call-cost mono" :class="durClass(row.durationMs)">
              cost {{ fmtMs(row.durationMs) }} ms
            </span>
          </div>
        </template>

        <!-- 甘特条：left/width 全部按真实 offsetPercent/percentWidth 定位 -->
        <template #col-gantt="{ row }">
          <span class="gantt-track" :title="ganttTitle(row)">
            <i
              class="gantt-bar"
              :class="row.kind === 'http' ? 'bar-http' : 'bar-method'"
              :style="{ left: (row.offsetPercent ?? 0) + '%', width: (row.percentWidth ?? 0) + '%' }"
            />
          </span>
        </template>

        <template #col-protocol="{ row }">
          <el-tag effect="plain" round size="small">{{ row.protocol || "—" }}</el-tag>
        </template>

        <template #col-status="{ row }">
          <el-tag :type="row.status === 'OK' ? 'success' : 'danger'" round size="small">
            {{ row.status || "OK" }}
          </el-tag>
        </template>

        <template #col-startTime="{ row }">
          <span class="muted">{{ row.startTime || "—" }}</span>
        </template>

        <template #col-traceId="{ row }">
          <div v-if="row.kind === 'http' && row.traceId" class="trace-id-cell">
            <el-tooltip :content="String(row.traceId)" placement="top" :show-after="400">
              <code class="mono trace-link" @click.stop="openWaterfall(String(row.traceId))">
                {{ shortId(String(row.traceId)) }}
              </code>
            </el-tooltip>
            <el-icon class="copy-btn" @click.stop="copyId(String(row.traceId))">
              <CopyDocument />
            </el-icon>
          </div>
          <span v-else class="muted">—</span>
        </template>

        <template #col-actions="{ row }">
          <div v-if="row.kind === 'http' && row.traceId" class="row-actions">
            <el-button link type="primary" @click.stop="openWaterfall(String(row.traceId))">
              瀑布
            </el-button>
            <el-button link type="primary" @click.stop="openDetail(row)">详情</el-button>
          </div>
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
          @size-change="onSizeChange"
          @current-change="onPageChange"
        />
      </div>
    </div>

    <!-- Trace 详情抽屉：展示该链路全部真实传输记录 -->
    <el-drawer v-model="detailVisible" :title="`链路详情 · ${detailTraceId || ''}`" size="640px">
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
        <el-empty v-if="!detailLoading && detailSpans.length === 0" description="该链路无 span 数据" />
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
import { computed, onMounted, reactive, ref } from "vue";
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
import { getTracesTree, getTraceWaterfall, exportTransmissionsCsv } from "../api/apmApi";
import type { TraceTreeItem, TransmissionQuery, WaterfallSpan } from "../api/apmApi";

const router = useRouter();
const route = useRoute();

/** 一次拉取的链路条数上限：树要在前端整体成树，故一次取够再本地分页 */
const TRACE_LIMIT = 500;

const roots = ref<TraceTreeItem[]>([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const traceSearch = ref("");
/** 展开状态：el-table 的 default-expand-all 只在挂载时生效，切换时靠 key 重建 */
const expandAll = ref(false);
const treeKey = ref(0);

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

const traceColumns: ReTableColumn[] = [
  { prop: "label", label: "调用（METHOD URL / class.method）", minWidth: 330, slot: "label" },
  { prop: "gantt", label: "时间轴", minWidth: 180, slot: "gantt" },
  { prop: "protocol", label: "协议", width: 96, slot: "protocol" },
  { prop: "status", label: "状态", width: 80, align: "center", slot: "status" },
  { prop: "startTime", label: "开始时间", width: 160, slot: "startTime" },
  { prop: "traceId", label: "Trace ID", minWidth: 190, slot: "traceId" },
  { prop: "actions", label: "操作", width: 112, align: "center", slot: "actions" },
];

/** 遍历整棵树，统计子层（方法级）节点数 */
function countMethodNodes(nodes: TraceTreeItem[]): number {
  let n = 0;
  for (const node of nodes) {
    if (node.kind === "method") n += 1;
    if (node.children?.length) n += countMethodNodes(node.children);
  }
  return n;
}

const methodNodeCount = computed(() => countMethodNodes(roots.value));

/** 客户端筛选：全部条件都作用在首层（链路）节点上，子层随父节点一起展示 */
const filteredRoots = computed<TraceTreeItem[]>(() => {
  const lower = (v: string) => v.trim().toLowerCase();
  const tid = lower(filters.traceId);
  const src = lower(filters.source);
  const proto = lower(filters.protocol);
  const op = lower(filters.operation);
  const min = filters.durationMin;
  const max = filters.durationMax;
  const range = filters.range;
  const t0 = range && range.length === 2 ? new Date(range[0]).getTime() : null;
  const t1 = range && range.length === 2 ? new Date(range[1]).getTime() : null;

  return roots.value.filter((row) => {
    if (tid && !String(row.traceId ?? "").toLowerCase().includes(tid)) return false;
    if (src && !String(row.source ?? "").toLowerCase().includes(src)) return false;
    if (proto && !String(row.protocol ?? "").toLowerCase().includes(proto)) return false;
    if (op && !String(row.operation ?? row.label ?? "").toLowerCase().includes(op)) return false;
    if (min != null && Number(row.durationMs ?? 0) < min) return false;
    if (max != null && Number(row.durationMs ?? 0) > max) return false;
    if (filters.errorOnly && !row.error) return false;
    if (t0 != null && t1 != null) {
      const ts = row.startTime ? new Date(row.startTime).getTime() : 0;
      if (!(ts >= t0 && ts <= t1)) return false;
    }
    return true;
  });
});

const total = computed(() => filteredRoots.value.length);

const pagedRoots = computed<TraceTreeItem[]>(() => {
  const start = (page.value - 1) * size.value;
  return filteredRoots.value.slice(start, start + size.value);
});

/** 按 traceId 搜索（本地过滤，无需再打接口） */
function applyTraceSearch() {
  filters.traceId = traceSearch.value.trim();
  page.value = 1;
}

function onPageChange() {
  // 换页时保持展开状态不变
}

function onSizeChange() {
  page.value = 1;
}

function toggleExpandAll() {
  expandAll.value = !expandAll.value;
  treeKey.value += 1;
}

/** 跳瀑布详情页 */
function openWaterfall(traceId: string) {
  if (!traceId) return;
  detailVisible.value = false;
  router.push({ path: ROUTE_PREFIX + "/traces/detail", query: { traceId } });
}

async function load() {
  loading.value = true;
  try {
    roots.value = (await getTracesTree(TRACE_LIMIT)) || [];
    // 首层变少时把页码收回到有效范围
    const maxPage = Math.max(1, Math.ceil(filteredRoots.value.length / size.value));
    if (page.value > maxPage) page.value = maxPage;
  } catch {
    message.error("加载调用链路失败");
    roots.value = [];
  } finally {
    loading.value = false;
  }
}

async function exportCsvFull() {
  // 导出仍走传输记录接口：一条记录一行，保留全部筛选条件
  const q: TransmissionQuery = {};
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
}

/* ---- 筛选收藏 ---- */
/** 本页已保存的筛选名称列表 */
const savedFilterNames = computed<string[]>(() => {
  try {
    const raw = localStorage.getItem(`apm-saved-filters-traces`);
    if (!raw) return [];
    return (JSON.parse(raw) as { name: string }[]).map((f) => f.name);
  } catch {
    return [];
  }
});

/** 保存当前筛选条件到 localStorage */
function saveCurrentFilter() {
  const name = window.prompt("请输入筛选收藏名称：");
  if (!name?.trim()) return;
  try {
    const raw = localStorage.getItem(`apm-saved-filters-traces`);
    const list: { name: string; source: string; protocol: string; operation: string; errorOnly: boolean }[] =
      raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((f) => f.name === name.trim());
    const entry = {
      name: name.trim(),
      source: filters.source,
      protocol: filters.protocol,
      operation: filters.operation,
      errorOnly: filters.errorOnly,
    };
    if (idx >= 0) list[idx] = entry;
    else list.push(entry);
    localStorage.setItem(`apm-saved-filters-traces`, JSON.stringify(list));
  } catch {
    /* 忽略 */
  }
}

/** 恢复已保存的筛选 */
function applySavedFilter(name: string) {
  try {
    const raw = localStorage.getItem(`apm-saved-filters-traces`);
    if (!raw) return;
    const list = JSON.parse(raw) as {
      name: string;
      source: string;
      protocol: string;
      operation: string;
      errorOnly: boolean;
    }[];
    const saved = list.find((f) => f.name === name);
    if (!saved) return;
    filters.source = saved.source ?? "";
    filters.protocol = saved.protocol ?? "";
    filters.operation = saved.operation ?? "";
    filters.errorOnly = saved.errorOnly ?? false;
    page.value = 1;
  } catch {
    /* 忽略 */
  }
}

function shortId(id: string) {
  if (!id) return "—";
  // traceId 形如 trace-http-<hex>，前段全部相同，只截头会让每行看起来一样
  if (id.length <= 24) return id;
  return `${id.slice(0, 10)}…${id.slice(-10)}`;
}

/**
 * 调用列展示名。
 *
 * <p>首层就是真实请求行（{@code METHOD URL}）；子层用真实 {@code class.method}，
 * 类名取简名以免整列被包名挤掉方法名，完整全限定名放在 title 里。</p>
 */
function displayName(row: Record<string, unknown>): string {
  const label = String(row.label ?? "");
  if (row.kind === "method" && row.className) {
    const full = String(row.className);
    const simple = full.slice(full.lastIndexOf(".") + 1);
    const method = String(row.methodName ?? "");
    return method ? `${simple}.${method}` : simple;
  }
  return label;
}

/** 耗时展示：<10ms 保留一位小数，其余取整 */
function fmtMs(ms: number | undefined): string {
  const v = Number(ms ?? 0);
  if (!Number.isFinite(v)) return "0";
  return v < 10 ? v.toFixed(1) : String(Math.round(v));
}

/** 耗时四档：正常 / 偏慢 / 慢 / 严重（阈值按 APM 常用口径） */
function durClass(ms: number | undefined): string {
  const v = Number(ms ?? 0);
  if (v >= 3000) return "crit";
  if (v >= 1000) return "slow";
  if (v >= 300) return "mid";
  return "fast";
}

/** 甘特条悬浮说明：真实偏移与耗时 */
function ganttTitle(row: Record<string, unknown>): string {
  const offset = Number(row.offsetMs ?? 0);
  const duration = Number(row.durationMs ?? 0);
  const totalMs = Number(row.traceTotalMs ?? 0);
  return `偏移 ${offset} ms · 耗时 ${duration} ms · 链路总计 ${totalMs} ms`;
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

function rowClass({ row }: { row: Record<string, unknown> }) {
  return row.error ? "row-error" : "";
}

// ---- Trace 详情抽屉 ----

const detailVisible = ref(false);
const detailLoading = ref(false);
const detailTraceId = ref("");
const detailSpans = ref<WaterfallSpan[]>([]);

async function openDetail(row: Record<string, unknown>) {
  const traceId = String(row.traceId ?? "");
  if (!traceId) return;
  detailTraceId.value = traceId;
  detailVisible.value = true;
  detailLoading.value = true;
  detailSpans.value = [];
  try {
    // 用瀑布接口：与树/瀑布页同一份数据，含真实方法层 span
    const wf = await getTraceWaterfall(traceId);
    detailSpans.value = wf?.spans ?? [];
  } catch {
    message.error("加载链路详情失败");
  } finally {
    detailLoading.value = false;
  }
}

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

/* 数据来源提示：只在确实没有子层数据时出现 */
.tree-hint {
  padding: 8px 12px;
  border-radius: var(--radius-md, var(--apm-radius-md));
  border: 1px solid var(--border-subtle, var(--apm-border-soft));
  background: color-mix(in srgb, var(--status-warning, #d97706) 10%, transparent);
  color: var(--text-secondary, var(--apm-fg-regular));
  font-size: 12px;
  line-height: 1.6;
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

/* ---- 调用树单元格 ---- */
.call-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.call-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-http {
  background: var(--brand-500, var(--apm-accent));
}

.dot-method {
  background: color-mix(in srgb, var(--brand-500, #2563eb) 45%, transparent);
}

.call-name {
  font-family: var(--apm-font-mono);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.call-cell.is-root .call-name {
  font-weight: 600;
  color: var(--text-primary, var(--apm-fg));
}

.call-cell.is-method .call-name {
  color: var(--text-secondary, var(--apm-fg-regular));
}

.call-cost {
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  font-size: 12px;
}

.call-cost.fast {
  color: var(--status-success, var(--apm-success));
}
.call-cost.mid {
  color: var(--text-secondary, var(--apm-fg-regular));
}
.call-cost.slow {
  color: var(--status-warning, var(--apm-warning));
}
.call-cost.crit {
  color: var(--status-error, var(--apm-danger));
  font-weight: 600;
}

/* ---- 甘特条 ---- */
.gantt-track {
  position: relative;
  display: block;
  height: 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--text-primary, #0f172a) 8%, transparent);
}

.gantt-bar {
  position: absolute;
  top: 0;
  height: 100%;
  min-width: 3px;
  border-radius: 999px;
}

.bar-http {
  background: var(--brand-500, var(--apm-accent));
}

.bar-method {
  background: color-mix(in srgb, var(--brand-500, #2563eb) 55%, transparent);
}

/* ---- Trace ID 单元格 ---- */
.trace-id-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.trace-id-cell .trace-link {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
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

/* 错误行：淡红底承载语义 */
.trace-table :deep(.row-error) {
  background: color-mix(in srgb, var(--status-error, #dc2626) 10%, transparent);
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
