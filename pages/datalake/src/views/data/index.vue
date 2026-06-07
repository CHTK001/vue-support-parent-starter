<template>
  <div class="data-page">
    <!-- 查询面板 -->
    <div class="page-panel">
      <div class="panel-header">
        <div class="panel-title">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#38bdf8" stroke-width="1.5">
            <path d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" />
          </svg>
          <span>数据查询</span>
        </div>
      </div>
      <div class="query-form">
        <div class="form-group">
          <label>Pipeline ID</label>
          <el-select v-model="queryForm.pipelineId" filterable allow-create default-first-option clearable placeholder="选择或输入 Pipeline ID" class="pipeline-select" @keyup.enter="handleQuery">
            <el-option v-for="item in pipelineOptions" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
        </div>
        <div class="form-group form-group--small">
          <label>每页条数</label>
          <input v-model.number="queryForm.limit" type="number" min="1" max="1000" class="form-input" @change="handlePageSizeChange" @keyup.enter="handleQuery" />
        </div>
        <div class="form-group form-group--small">
          <label>偏移量</label>
          <input v-model.number="queryForm.offset" type="number" min="0" class="form-input" />
        </div>
        <button class="btn-ghost" :class="{ loading }" :disabled="loading" @click="handleQuery">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          {{ loading ? '查询中...' : '查询' }}
        </button>
      </div>
    </div>

    <!-- 查询结果 -->
    <div class="page-panel result-panel">
      <div class="panel-header">
        <div class="panel-title">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#38bdf8" stroke-width="1.5">
            <path d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7" />
            <path d="M16 3H8a3 3 0 0 0-3 3v1h14V6a3 3 0 0 0-3-3z" />
          </svg>
          <span>查询结果</span>
          <span v-if="result" class="panel-badge">{{ result.total }} 条</span>
        </div>
        <div v-if="result" class="result-range">{{ pageStart }}-{{ pageEnd }} / {{ result.total }}</div>
      </div>

      <div v-if="!result && !loading" class="empty-state">
        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1" style="opacity: 0.2">
          <path d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" />
        </svg>
        <p>输入 Pipeline ID 开始查询数据</p>
      </div>

      <div v-else class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 260px">Trace ID</th>
              <th style="width: 160px">Pipeline ID</th>
              <th style="width: 90px">状态</th>
              <th>数据</th>
              <th style="width: 150px">时间</th>
              <th style="width: 60px" class="center">重试</th>
              <th style="width: 60px" class="center">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in result?.data || []" :key="row.traceId">
              <td>
                <span class="mono text-xs trace-id" @click="handleTrace(row.traceId)">{{ row.traceId }}</span>
              </td>
              <td>
                <span class="mono text-xs">{{ row.pipelineId }}</span>
              </td>
              <td>
                <span class="state-tag" :class="stateClass(row.state)">{{ row.state }}</span>
              </td>
              <td>
                <div class="data-tags">
                  <template v-if="row.parsed && Object.keys(row.parsed).length > 0">
                    <span v-for="(v, k) in row.parsed" :key="k" class="data-tag">
                      <span class="dt-key">{{ k }}</span>
                      <span class="dt-val">{{ v }}</span>
                    </span>
                  </template>
                  <span v-else class="text-muted">-</span>
                </div>
              </td>
              <td class="text-xs text-dim">{{ new Date(row.timestamp).toLocaleString() }}</td>
              <td class="center mono">{{ row.retryCount }}</td>
              <td class="center">
                <button class="btn-trace" @click="handleTrace(row.traceId)" title="链路追踪">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
                  </svg>
                </button>
              </td>
            </tr>
            <tr v-if="(result?.data || []).length === 0">
              <td colspan="7" class="empty-row">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="result" class="pagination-bar">
        <button class="page-btn" :disabled="loading || queryForm.offset <= 0" @click="handleFirstPage">首页</button>
        <button class="page-btn" :disabled="loading || queryForm.offset <= 0" @click="handlePrevPage">上一页</button>
        <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
        <button class="page-btn" :disabled="loading || !hasNextPage" @click="handleNextPage">下一页</button>
        <button class="page-btn" :disabled="loading || !hasNextPage" @click="handleLastPage">末页</button>
      </div>
    </div>

    <!-- Trace 对话框 -->
    <Transition name="fade">
      <div v-if="traceResult" class="trace-overlay" @click.self="traceResult = null">
        <div class="trace-dialog">
          <div class="trace-dialog-header">
            <span class="trace-dialog-title">链路追踪</span>
            <button class="btn-close" @click="traceResult = null">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div class="trace-grid">
            <div class="trace-field">
              <span class="tf-label">Trace ID</span>
              <span class="tf-value mono">{{ traceResult.traceId }}</span>
            </div>
            <div class="trace-field">
              <span class="tf-label">状态</span>
              <span class="tf-value" :class="stateClass(traceResult.state)">{{ traceResult.state }}</span>
            </div>
            <div class="trace-field">
              <span class="tf-label">Pipeline ID</span>
              <span class="tf-value">{{ traceResult.pipelineId || '-' }}</span>
            </div>
            <div class="trace-field">
              <span class="tf-label">设备 ID</span>
              <span class="tf-value">{{ traceResult.deviceId }}</span>
            </div>
            <div class="trace-field">
              <span class="tf-label">重试次数</span>
              <span class="tf-value">{{ traceResult.retryCount }}</span>
            </div>
            <div class="trace-field">
              <span class="tf-label">时间</span>
              <span class="tf-value">{{ traceResult.timestamp ? new Date(traceResult.timestamp).toLocaleString() : '-' }}</span>
            </div>
          </div>
          <div v-if="traceResult.traceLog?.length" class="trace-logs">
            <span class="tl-title">Trace Log</span>
            <div class="tl-list">
              <div v-for="(log, i) in traceResult.traceLog" :key="i" class="tl-item">
                <span class="tl-index">{{ i + 1 }}</span>
                <span>{{ log }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { fetchDataQuery, fetchTrace } from "../../api/data";
import { fetchPipelineList } from "../../api/pipeline";
import type { QueryResult, DataEnvelope, ScGraph } from "../../types";

defineOptions({ name: "DatalakeDataPage" });

const loading = ref(false);
const traceLoading = ref(false);
const traceResult = ref<DataEnvelope | null>(null);
const result = ref<QueryResult | null>(null);
const pipelines = ref<ScGraph[]>([]);

const queryForm = reactive({ pipelineId: "", limit: 20, offset: 0 });

const pipelineOptions = computed(() =>
  pipelines.value.map((pipeline) => ({
    id: pipeline.id,
    label: `${pipeline.name || pipeline.id}${pipeline.description ? ` · ${pipeline.description}` : ""}`,
  })),
);

const pageSize = computed(() => {
  const limit = Number(queryForm.limit);
  return Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 1000) : 20;
});
const currentPage = computed(() => Math.floor(Math.max(0, Number(queryForm.offset) || 0) / pageSize.value) + 1);
const totalPages = computed(() => Math.max(1, Math.ceil((result.value?.total || 0) / pageSize.value)));
const pageStart = computed(() => (result.value?.total ? Math.min((Number(queryForm.offset) || 0) + 1, result.value.total) : 0));
const pageEnd = computed(() => (result.value?.total ? Math.min((Number(queryForm.offset) || 0) + (result.value.data?.length || 0), result.value.total) : 0));
const hasNextPage = computed(() => !!result.value && (Number(queryForm.offset) || 0) + pageSize.value < result.value.total);

async function loadPipelines() {
  try {
    const { data } = await fetchPipelineList();
    pipelines.value = (data as any)?.data || data || [];
  } catch {
    pipelines.value = [];
  }
}

const handleQuery = async () => {
  if (!queryForm.pipelineId) {
    ElMessage.warning("请输入 Pipeline ID");
    return;
  }
  queryForm.limit = pageSize.value;
  queryForm.offset = Math.max(0, Number(queryForm.offset) || 0);
  loading.value = true;
  try {
    const { data } = await fetchDataQuery(queryForm);
    result.value = data || null;
  } catch (e: any) {
    ElMessage.error(e?.msg || "查询失败");
  } finally {
    loading.value = false;
  }
};

function handlePageSizeChange() {
  queryForm.offset = 0;
  if (queryForm.pipelineId) {
    handleQuery();
  }
}

function handleFirstPage() {
  queryForm.offset = 0;
  handleQuery();
}

function handlePrevPage() {
  queryForm.offset = Math.max(0, (Number(queryForm.offset) || 0) - pageSize.value);
  handleQuery();
}

function handleNextPage() {
  if (!hasNextPage.value) return;
  queryForm.offset = (Number(queryForm.offset) || 0) + pageSize.value;
  handleQuery();
}

function handleLastPage() {
  if (!result.value?.total) return;
  queryForm.offset = Math.max(0, (totalPages.value - 1) * pageSize.value);
  handleQuery();
}

function stateClass(state?: string): string {
  const normalized = (state || "").toUpperCase();
  if (["SUCCESS", "PROCESSED", "RECEIVED"].includes(normalized)) return "success";
  if (["FAILED", "ERROR", "DEAD"].includes(normalized)) return "danger";
  if (["PENDING", "RETRYING", "RUNNING"].includes(normalized)) return "warning";
  return "info";
}

async function handleTrace(traceId?: string) {
  if (!traceId) return;
  traceLoading.value = true;
  try {
    const { data } = await fetchTrace(traceId);
    traceResult.value = data || null;
  } catch (e: any) {
    ElMessage.error(e?.msg || "加载链路追踪失败");
  } finally {
    traceLoading.value = false;
  }
}

onMounted(() => {
  loadPipelines();
});
</script>

<style scoped>
.data-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  animation: fadeIn 0.35s ease;
  font-family: "Space Mono", "Courier New", monospace;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

/* ===== 面板 ===== */
.page-panel {
  background: var(--dl-surface, rgba(12, 22, 44, 0.85));
  backdrop-filter: blur(4px);
  border: 1px solid var(--dl-border, rgba(0, 180, 255, 0.08));
  border-radius: 8px;
  overflow: hidden;
}
.result-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(0, 180, 255, 0.06);
}
.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.03em;
}
.panel-badge {
  font-size: 10px;
  color: #5a6478;
  background: rgba(0, 180, 255, 0.06);
  border: 1px solid rgba(0, 180, 255, 0.1);
  border-radius: 10px;
  padding: 0 8px;
  font-family: "Space Mono", monospace;
}
.result-range {
  font-size: 11px;
  color: #5a6478;
  font-family: "Space Mono", monospace;
}

/* ===== 查询表单 ===== */
.query-form {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding: 14px 16px;
  flex-wrap: wrap;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
  min-width: 140px;
}
.form-group--small { flex: 0 0 100px; min-width: 80px; }
.form-group label {
  font-size: 10px;
  color: #5a6478;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
}
.form-input {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 180, 255, 0.1);
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 12px;
  color: #e2e8f0;
  font-family: "Space Mono", monospace;
  outline: none;
  transition: border-color 0.2s;
  width: 100%;
  box-sizing: border-box;
}
.form-input:focus { border-color: rgba(0, 180, 255, 0.25); }
.form-input::placeholder { color: rgba(255, 255, 255, 0.2); }

/* ===== 幽灵按钮 ===== */
.btn-ghost {
  display: flex;
  align-items: center;
  gap: 5px;
  background: transparent;
  border: 1px solid rgba(0, 180, 255, 0.1);
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 11px;
  color: #94a3b8;
  cursor: pointer;
  font-family: "Space Mono", monospace;
  transition: all 0.2s;
  height: fit-content;
  white-space: nowrap;
}
.btn-ghost:hover {
  border-color: rgba(0, 180, 255, 0.25);
  color: #38bdf8;
}
.btn-ghost:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-ghost.loading svg {
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== 数据表格 ===== */
.data-table-wrap {
  flex: 1;
  min-height: 0;
  padding: 0;
  overflow: auto;
}
.data-table { width: 100%; border-collapse: collapse; }
.data-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  text-align: left;
  padding: 10px 14px;
  font-size: 10px;
  font-weight: 600;
  color: #5a6478;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: #081224;
  border-bottom: 1px solid rgba(0, 180, 255, 0.06);
}
.data-table th.center { text-align: center; }
.data-table td {
  padding: 10px 14px;
  font-size: 12px;
  color: #e2e8f0;
  border-bottom: 1px solid rgba(0, 180, 255, 0.03);
  vertical-align: middle;
}
.data-table tbody tr:hover { background: rgba(0, 180, 255, 0.03); }
.data-table tbody tr:last-child td { border-bottom: none; }

.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 14px;
  border-top: 1px solid rgba(0, 180, 255, 0.06);
  background: rgba(0, 0, 0, 0.16);
  flex-shrink: 0;
}
.page-btn {
  border: 1px solid rgba(0, 180, 255, 0.12);
  background: rgba(15, 23, 42, 0.56);
  color: #94a3b8;
  border-radius: 5px;
  padding: 4px 10px;
  font-size: 11px;
  font-family: "Space Mono", monospace;
  cursor: pointer;
  transition: all 0.2s;
}
.page-btn:hover:not(:disabled) {
  border-color: rgba(56, 189, 248, 0.35);
  color: #38bdf8;
}
.page-btn:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}
.page-info {
  min-width: 90px;
  text-align: center;
  font-size: 11px;
  color: #5a6478;
  font-family: "Space Mono", monospace;
}

.mono { font-family: "Space Mono", monospace; }
.text-xs { font-size: 11px; }
.text-dim { color: #94a3b8; }
.text-muted { color: #5a6478; }
.center { text-align: center; }

.empty-row {
  text-align: center;
  color: rgba(255, 255, 255, 0.15);
  padding: 40px 14px !important;
  font-size: 13px;
}

.state-tag {
  display: inline-block;
  font-size: 10px;
  font-weight: 500;
  padding: 2px 7px;
  border-radius: 4px;
}
.state-tag.success { color: #22c55e; background: rgba(34, 197, 94, 0.08); }
.state-tag.danger { color: #ef4444; background: rgba(239, 68, 68, 0.08); }
.state-tag.warning { color: #f59e0b; background: rgba(245, 158, 11, 0.08); }
.state-tag.info { color: #94a3b8; background: rgba(148, 163, 184, 0.08); }

.data-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.data-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  background: rgba(0, 180, 255, 0.05);
  border: 1px solid rgba(0, 180, 255, 0.1);
  border-radius: 4px;
  padding: 2px 6px;
}
.dt-key { color: #94a3b8; }
.dt-val { color: #38bdf8; font-family: "Space Mono", monospace; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 48px 20px;
  color: rgba(255, 255, 255, 0.2);
  font-size: 13px;
}

.trace-id {
  color: #38bdf8;
  cursor: pointer;
  transition: opacity 0.2s;
}
.trace-id:hover { opacity: 0.7; }

.btn-trace {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 5px;
  background: transparent;
  border: 1px solid rgba(0, 180, 255, 0.1);
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-trace:hover { border-color: rgba(0, 180, 255, 0.25); color: #38bdf8; }

/* ===== Trace 对话框 ===== */
.trace-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.trace-dialog {
  background: #0b1020;
  border: 1px solid rgba(0, 180, 255, 0.2);
  border-radius: 8px;
  width: 100%;
  max-width: 620px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 0 40px rgba(0, 180, 255, 0.08);
}
.trace-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(0, 180, 255, 0.06);
}
.trace-dialog-title { font-size: 13px; font-weight: 600; color: #e2e8f0; }

.btn-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 5px;
  background: transparent;
  border: 1px solid transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-close:hover { border-color: rgba(0, 180, 255, 0.1); color: #ef4444; }

.trace-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
}
.trace-field {
  padding: 10px 14px;
  border-bottom: 1px solid rgba(0, 180, 255, 0.03);
  border-right: 1px solid rgba(0, 180, 255, 0.03);
}
.trace-field:nth-child(3n) { border-right: none; }
.tf-label {
  display: block;
  font-size: 9px;
  color: #5a6478;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 3px;
}
.tf-value { font-size: 12px; color: #e2e8f0; word-break: break-all; }
.tf-value.mono { font-family: "Space Mono", monospace; font-size: 11px; }
.tf-value.success { color: #22c55e; }
.tf-value.danger { color: #ef4444; }
.tf-value.warning { color: #f59e0b; }

.trace-logs { border-top: 1px solid rgba(0, 180, 255, 0.04); }
.tl-title {
  display: block;
  padding: 10px 14px 6px;
  font-size: 10px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.tl-list { padding: 0 14px 10px; }
.tl-item {
  display: flex;
  gap: 10px;
  padding: 5px 0;
  font-size: 11px;
  color: #94a3b8;
  border-bottom: 1px solid rgba(0, 180, 255, 0.02);
}
.tl-item:last-child { border-bottom: none; }
.tl-index {
  color: #5a6478;
  font-family: "Space Mono", monospace;
  font-size: 10px;
  min-width: 20px;
  flex-shrink: 0;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
