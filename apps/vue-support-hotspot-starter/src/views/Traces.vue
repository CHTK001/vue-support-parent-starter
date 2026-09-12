<template>
  <div class="view">
    <div class="view-toolbar">
      <div class="toolbar-left">
        <span class="section-label">调用链路（传输记录）</span>
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
        <el-button size="small" round @click="exportJson">
          <el-icon class="mr-1"><Download /></el-icon>JSON
        </el-button>
        <el-button size="small" round @click="exportCsv">
          <el-icon class="mr-1"><Download /></el-icon>CSV
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
        class="apm-table"
        empty-text="暂无传输记录（Agent 未注入或无数据）"
      >
        <el-table-column prop="traceId" label="Trace ID" width="150">
          <template #default="{ row }">
            <code class="mono">{{ shortId(row.traceId) }}</code>
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { Refresh, Right, Download } from "@element-plus/icons-vue";
import { pageTransmissions, toCsv, download } from "../api/apmApi";
import type { TransmissionQuery, TransmissionRecord } from "../api/apmApi";

const items = ref<TransmissionRecord[]>([]);
const total = ref(0);
const page = ref(1);
const size = ref(20);
const loading = ref(false);

const filters = reactive({
  source: "",
  protocol: "",
  errorOnly: false,
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

function exportJson() {
  download(`traces-${Date.now()}.json`, JSON.stringify(items.value, null, 2), "application/json");
}

function exportCsv() {
  const csv = toCsv(items.value as unknown as Record<string, unknown>[], [
    "traceId", "spanId", "source", "target", "protocol", "status", "durationMs", "startTime", "errorType",
  ]);
  download(`traces-${Date.now()}.csv`, csv, "text/csv");
}

function shortId(id: string) {
  return id ? id.slice(0, 12) : "—";
}

function rowClass() {
  return "";
}

watch(
  () => [filters.source, filters.protocol, filters.errorOnly, filters.range],
  () => {
    page.value = 1;
    load();
  },
);

onMounted(load);
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
</style>
