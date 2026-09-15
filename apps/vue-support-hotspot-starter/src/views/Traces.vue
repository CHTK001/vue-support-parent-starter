<template>
  <div class="view">
    <div class="view-toolbar">
      <div class="toolbar-left">
        <span class="section-label">调用链路（传输记录）</span>
        <el-input
          v-model="traceSearch"
          placeholder="按 traceId 搜索"
          clearable
          size="small"
          class="filter-input trace-search"
          @keyup.enter="applyTraceSearch"
        />
        <el-button v-if="traceSearch" size="small" text type="primary" @click="applyTraceSearch">
          搜索
        </el-button>
        <el-input
          v-model="filters.source"
          placeholder="源端"
          clearable
          size="small"
          class="filter-input"
        />
        <el-input
          v-model="filters.protocol"
          placeholder="协议"
          clearable
          size="small"
          class="filter-input"
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
        <el-checkbox v-model="filters.errorOnly" size="small">仅看错误</el-checkbox>
      </div>
      <div class="toolbar-right">
        <el-button size="small" round @click="exportCsvFull">
          <el-icon class="mr-1"><Download /></el-icon>导出 CSV（全量）
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
        :row-class-name="rowClass"
        class="apm-table trace-table"
        empty-text="暂无传输记录（Agent 未注入或无数据）"
        @row-click="openDetail"
      >
        <el-table-column label="Trace ID" width="200">
          <template #default="{ row }">
            <div class="trace-id-cell">
              <code class="mono trace-link" @click.stop="openWaterfall(row.traceId)">
                {{ shortId(row.traceId) }}
              </code>
              <el-button link size="small" type="primary" @click.stop="openWaterfall(row.traceId)">
                瀑布
              </el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="源 → 目标" min-width="260">
          <template #default="{ row }">
            <div class="edge">
              <span class="edge-endpoint">{{ row.source || "—" }}</span>
              <el-icon class="edge-arrow"><Right /></el-icon>
              <span class="edge-endpoint target">{{ row.target || "—" }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="protocol" label="协议" width="110">
          <template #default="{ row }">
            <el-tag size="small" effect="plain" round>{{ row.protocol || "—" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="耗时" width="90" align="center">
          <template #default="{ row }">
            <span class="mono">{{ row.durationMs }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 'OK' ? 'success' : 'danger'"
              size="small"
              round
            >
              {{ row.status || "OK" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="160">
          <template #default="{ row }">
            <span class="muted">{{ row.startTime || "—" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="错误" min-width="180">
          <template #default="{ row }">
            <span v-if="row.errorMessage" class="err-text" :title="row.errorMessage">
              {{ row.errorType }}: {{ row.errorMessage }}
            </span>
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

    <!-- Trace 详情抽屉：点击行打开，展示整条链路全部 span -->
    <el-drawer
      v-model="detailVisible"
      :title="`链路详情 · ${detailTraceId || ''}`"
      size="640px"
    >
      <div v-if="detailTraceId" class="drawer-actions">
        <el-button size="small" round type="primary" @click="openWaterfall(detailTraceId)">
          <el-icon class="mr-1"><Right /></el-icon>查看瀑布图
        </el-button>
      </div>
      <div v-loading="detailLoading" class="detail-body">
        <el-empty v-if="!detailLoading && detailSpans.length === 0" description="该链路无 span 数据" />
        <div v-for="(span, i) in detailSpans" :key="span.spanId || i" class="span-card">
          <div class="span-head">
            <span class="span-idx">#{{ i + 1 }}</span>
            <el-tag :type="span.status === 'OK' ? 'success' : 'danger'" size="small" round>
              {{ span.status || "OK" }}
            </el-tag>
            <span class="span-duration mono">{{ span.durationMs }} ms</span>
          </div>
          <div class="span-grid">
            <div class="span-row"><span class="k">spanId</span><code class="mono">{{ span.spanId }}</code></div>
            <div class="span-row"><span class="k">parent</span><code class="mono">{{ span.parentSpanId || "—" }}</code></div>
            <div class="span-row"><span class="k">源端</span><span>{{ span.source || "—" }}</span></div>
            <div class="span-row"><span class="k">目标</span><span>{{ span.target || "—" }}</span></div>
            <div class="span-row"><span class="k">协议</span><span>{{ span.protocol || "—" }} <template v-if="span.software">[{{ span.software }}]</template></span></div>
            <div class="span-row"><span class="k">操作</span><span>{{ span.operation || "—" }}</span></div>
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
import { onMounted, reactive, ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { Refresh, Right, Download } from "@element-plus/icons-vue";
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

/** 按 traceId 服务端搜索（后端 /transmissions 已支持 traceId 参数过滤） */
function applyTraceSearch() {
  const kw = traceSearch.value.trim();
  if (!kw) {
    filters.traceId = "";
  } else {
    filters.traceId = kw;
  }
  page.value = 1;
  load();
}

/** 跳瀑布详情页 */
function openWaterfall(traceId: string) {
  if (!traceId) return;
  detailVisible.value = false;
  router.push({ path: "/traces/detail", query: { traceId } });
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

async function load() {
  loading.value = true;
  try {
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
    const res = await pageTransmissions(q);
    items.value = res.items;
    total.value = res.total;
  } catch {
    ElMessage.error("加载调用链路失败");
  } finally {
    loading.value = false;
  }
}

/** 后端全量 CSV 导出（带当前筛选条件，绕过分页限制） */
function exportCsvFull() {
  const params: TransmissionQuery = {};
  if (filters.source) params.source = filters.source;
  if (filters.protocol) params.protocol = filters.protocol;
  if (filters.errorOnly) params.errorOnly = true;
  if (filters.traceId) params.traceId = filters.traceId;
  if (filters.operation) params.operation = filters.operation;
  if (filters.durationMin != null) params.durationMin = filters.durationMin;
  if (filters.durationMax != null) params.durationMax = filters.durationMax;
  if (filters.range && filters.range.length === 2) {
    params.startTime = new Date(filters.range[0]).getTime();
    params.endTime = new Date(filters.range[1]).getTime();
  }
  exportTransmissionsCsv(params);
}

function shortId(id: string) {
  return id ? id.slice(0, 12) : "—";
}

function rowClass({ row }: { row: TransmissionRecord }) {
  return row.errorMessage ? "row-error" : "row-clickable";
}

// ---- Trace 详情抽屉 ----

const detailVisible = ref(false);
const detailLoading = ref(false);
const detailTraceId = ref("");
const detailSpans = ref<TransmissionRecord[]>([]);

async function openDetail(row: TransmissionRecord) {
  if (!row?.traceId) return;
  detailTraceId.value = row.traceId;
  detailVisible.value = true;
  detailLoading.value = true;
  detailSpans.value = [];
  try {
    detailSpans.value = (await getTraceDetail(row.traceId)) || [];
  } catch {
    ElMessage.error("加载链路详情失败");
  } finally {
    detailLoading.value = false;
  }
}

watch(
  () => [filters.source, filters.protocol, filters.errorOnly, filters.range],
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
  gap: 10px;
  flex-wrap: wrap;
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

.filter-input {
  width: 140px;
}

.trace-search {
  width: 180px;
}

.mr-1 {
  margin-right: 4px;
  vertical-align: -2px;
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

.trace-id-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.trace-link {
  cursor: pointer;
  transition: opacity 0.15s;
}

.trace-link:hover {
  opacity: 0.7;
}

.mono {
  font-family: "JetBrains Mono", Consolas, monospace;
  font-size: 12px;
  color: var(--apm-accent);
}

.muted {
  color: var(--apm-muted);
  font-size: 12px;
}

.edge {
  display: flex;
  align-items: center;
  gap: 6px;
}

.edge-endpoint {
  font-family: "JetBrains Mono", Consolas, monospace;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 150px;
}

.edge-endpoint.target {
  color: var(--apm-accent);
}

.edge-arrow {
  color: var(--apm-muted);
  flex-shrink: 0;
}

.err-text {
  color: var(--apm-danger);
  font-size: 12px;
  cursor: help;
}

.pager {
  display: flex;
  justify-content: flex-end;
  padding: 10px 8px 4px;
}

.trace-table :deep(.row-clickable) {
  cursor: pointer;
}

.trace-table :deep(.row-error) {
  cursor: pointer;
  background: rgba(239, 68, 68, 0.05);
}

/* ---- 详情抽屉 ---- */
.drawer-actions {
  margin-bottom: 12px;
  display: flex;
  gap: 8px;
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.span-card {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.02);
}

.span-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.span-idx {
  font-size: 12px;
  color: rgba(230, 237, 247, 0.45);
  min-width: 28px;
}

.span-duration {
  margin-left: auto;
  color: var(--apm-accent, #3b82f6);
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
  color: rgba(230, 237, 247, 0.45);
  min-width: 52px;
  flex-shrink: 0;
}

.span-error {
  margin-top: 10px;
  border-top: 1px dashed rgba(239, 68, 68, 0.35);
  padding-top: 8px;
}

.span-error-title {
  color: var(--apm-danger, #ef4444);
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
}

.span-error-msg {
  color: var(--apm-danger, #ef4444);
  font-size: 11px;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  font-family: "JetBrains Mono", Consolas, monospace;
}
</style>

<style>
/* Trace 详情抽屉：Element Plus 抽屉默认白底，覆盖为深色主题
   （抽屉 teleport 到 body，scoped 样式覆盖不到容器，须用全局样式） */
.el-drawer {
  --el-drawer-bg-color: var(--apm-panel, #131a2b);
  background: var(--apm-panel, #131a2b);
  color: var(--apm-fg, #e6edf7);
}

.el-drawer__header {
  color: var(--apm-fg, #e6edf7);
  margin-bottom: 12px;
  border-bottom: 1px solid var(--apm-border, rgba(255, 255, 255, 0.08));
  padding-bottom: 12px;
}

.el-drawer__body {
  background: var(--apm-bg, #0b0f1a);
  color: var(--apm-fg, #e6edf7);
}
</style>
