<template>
  <div class="dlq-page">
    <div class="page-panel">
      <div class="panel-header">
        <div class="panel-title">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#f59e0b" stroke-width="1.5">
            <path d="M12 9v2m0 4h.01m-6.93 5h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
          </svg>
          <span>死信队列</span>
          <span class="panel-badge">{{ list.length }}</span>
        </div>
        <div class="header-actions">
          <button class="btn-ghost" :class="{ loading }" @click="loadData" :disabled="loading">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            刷新
          </button>
          <button class="btn-danger" @click="handleClear">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            清空全部
          </button>
        </div>
      </div>

      <div v-if="list.length === 0 && !loading" class="empty-state">
        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1" style="opacity: 0.2">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
        </svg>
        <p>死信队列为空</p>
      </div>

      <div v-else class="dlq-list">
        <div v-for="item in list" :key="item.id" class="dlq-card">
          <div class="dlq-card-left">
            <div class="dlq-id">#{{ item.id }}</div>
            <div class="dlq-info">
              <div class="dlq-row">
                <span class="dlq-label">Trace ID</span>
                <span class="dlq-value mono">{{ item.traceId }}</span>
              </div>
              <div class="dlq-row">
                <span class="dlq-label">Pipeline ID</span>
                <span class="dlq-value">{{ item.pipelineId }}</span>
              </div>
              <div class="dlq-error">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#ef4444" stroke-width="2">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{{ item.errorMessage }}</span>
              </div>
            </div>
          </div>
          <div class="dlq-card-right">
            <div class="dlq-fail-count">
              <span class="fail-num">{{ item.failCount }}</span>
              <span class="fail-label">次失败</span>
            </div>
            <div class="dlq-actions">
              <button class="btn-action retry" @click="handleRetry(item.id)">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                重试
              </button>
              <button class="btn-action delete" @click="handleDelete(item.id)">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                删除
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="list.length > 0" class="pagination">
        <button class="page-btn" :disabled="page <= 1" @click="page--; loadData()">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span class="page-info">{{ page }}</span>
        <button class="page-btn" :disabled="list.length < 20" @click="page++; loadData()">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { fetchDlqList, fetchRetryDlq, fetchDeleteDlq, fetchClearDlq } from "../../api/dlq";
import type { DlqEntry } from "../../types";

defineOptions({ name: "DatalakeDlqPage" });

const loading = ref(false);
const list = ref<DlqEntry[]>([]);
const page = ref(1);

const loadData = async () => {
  loading.value = true;
  try {
    const { data } = await fetchDlqList(page.value);
    list.value = data?.data || [];
  } catch {} finally {
    loading.value = false;
  }
};

const handleRetry = async (id: number) => {
  try { await fetchRetryDlq(id); ElMessage.success("重试成功"); loadData(); }
  catch (e: any) { ElMessage.error(e?.msg || "重试失败"); }
};

const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm("确定删除该死信记录？", "确认删除", {
      confirmButtonText: "删除", cancelButtonText: "取消", type: "warning",
    });
    await fetchDeleteDlq(id);
    ElMessage.success("删除成功");
    loadData();
  } catch { /* 取消操作 */ }
};

const handleClear = async () => {
  try {
    await ElMessageBox.confirm("确定清空所有死信记录？此操作不可恢复。", "确认清空", {
      confirmButtonText: "清空", cancelButtonText: "取消", type: "error",
    });
    await fetchClearDlq();
    ElMessage.success("清空成功");
    page.value = 1;
    loadData();
  } catch { /* 取消操作 */ }
};

onMounted(loadData);
</script>

<style scoped>
.dlq-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
.header-actions { display: flex; gap: 8px; }

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

.btn-danger {
  display: flex;
  align-items: center;
  gap: 5px;
  background: transparent;
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 11px;
  color: #ef4444;
  cursor: pointer;
  font-family: "Space Mono", monospace;
  transition: all 0.2s;
}
.btn-danger:hover { border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.06); }

/* ===== 空状态 ===== */
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

/* ===== 死信列表 ===== */
.dlq-list {
  display: flex;
  flex-direction: column;
}
.dlq-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(0, 180, 255, 0.04);
  transition: background 0.2s;
}
.dlq-card:last-child { border-bottom: none; }
.dlq-card:hover { background: rgba(0, 180, 255, 0.03); }

.dlq-card-left { display: flex; align-items: flex-start; gap: 14px; flex: 1; min-width: 0; }
.dlq-card-right { display: flex; align-items: center; gap: 20px; flex-shrink: 0; margin-left: 16px; }

.dlq-id {
  font-size: 11px;
  color: #5a6478;
  font-family: "Space Mono", monospace;
  min-width: 40px;
  flex-shrink: 0;
  padding-top: 1px;
}

.dlq-info { display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 0; }

.dlq-row { display: flex; align-items: baseline; gap: 10px; }
.dlq-label {
  font-size: 9px;
  color: #5a6478;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  min-width: 70px;
  flex-shrink: 0;
}
.dlq-value {
  font-size: 12px;
  color: #e2e8f0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dlq-value.mono { font-family: "Space Mono", monospace; font-size: 11px; color: #38bdf8; }

.dlq-error {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 11px;
  color: #f87171;
  line-height: 1.5;
  margin-top: 2px;
}
.dlq-error svg { flex-shrink: 0; margin-top: 1px; }

.dlq-fail-count {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  min-width: 50px;
}
.fail-num {
  font-size: 20px;
  font-weight: 700;
  font-family: "Space Mono", monospace;
  color: #f59e0b;
  line-height: 1;
}
.fail-label {
  font-size: 9px;
  color: #5a6478;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.dlq-actions { display: flex; gap: 6px; }

.btn-action {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border-radius: 5px;
  border: 1px solid;
  padding: 5px 10px;
  font-size: 11px;
  cursor: pointer;
  font-family: "Space Mono", monospace;
  transition: all 0.2s;
}
.btn-action.retry {
  color: #22c55e;
  border-color: rgba(34, 197, 94, 0.2);
}
.btn-action.retry:hover { border-color: rgba(34, 197, 94, 0.4); background: rgba(34, 197, 94, 0.06); }
.btn-action.delete {
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.2);
}
.btn-action.delete:hover { border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.06); }

/* ===== 分页 ===== */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 14px;
  border-top: 1px solid rgba(0, 180, 255, 0.04);
}
.page-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid rgba(0, 180, 255, 0.1);
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
}
.page-btn:hover:not(:disabled) { border-color: rgba(0, 180, 255, 0.25); color: #38bdf8; }
.page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.page-info {
  font-size: 13px;
  font-family: "Space Mono", monospace;
  color: #94a3b8;
  min-width: 30px;
  text-align: center;
}
</style>
