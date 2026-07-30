<template>
  <section class="spider-execution">
    <!-- Header -->
    <div class="spider-execution__header">
      <div class="spider-execution__header-left">
        <h2 class="spider-execution__title">执行日志</h2>
        <p class="spider-execution__subtitle">查看爬虫执行记录及运行详情</p>
      </div>
      <div class="spider-execution__toolbar">
        <div class="spider-execution__search">
          <el-icon :size="15"><Search /></el-icon>
          <select v-model="filterCode" class="spider-execution__select">
            <option value="">全部爬虫</option>
            <option v-for="d in allDefs" :key="d.spiderCode" :value="d.spiderCode">{{ d.spiderName }}</option>
          </select>
        </div>
        <button type="button" class="spider-execution__refresh-btn" :class="{ 'is-spinning': loading }" @click="loadExecutions">
          <el-icon :size="16"><Refresh /></el-icon>
        </button>
      </div>
    </div>

    <div class="spider-execution__hint" v-if="lastUpdate">
      <span class="spider-execution__hint-dot" />
      自动刷新 · 上次更新 {{ lastUpdate }}
    </div>

    <!-- Table -->
    <div class="spider-execution__table-wrap">
      <table v-if="filteredExecs.length" class="spider-execution__table">
        <thead>
          <tr>
            <th>批次号</th>
            <th>爬虫编码</th>
            <th>触发类型</th>
            <th>状态</th>
            <th>开始时间</th>
            <th>结束时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in filteredExecs" :key="row.spiderExecutionNo">
            <td class="cell-mono">{{ row.spiderExecutionNo }}</td>
            <td>{{ row.spiderDefinitionCode }}</td>
            <td>
              <span class="spider-execution__trigger-badge">{{ row.spiderTriggerType || '-' }}</span>
            </td>
            <td>
              <span class="spider-execution__status-pill" :class="statusClass(row.spiderExecutionStatus)">
                <span class="spider-execution__status-dot" />
                {{ row.spiderExecutionStatus || 'UNKNOWN' }}
              </span>
            </td>
            <td class="cell-mono">{{ formatTime(row.spiderStartedAt) }}</td>
            <td class="cell-mono">{{ formatTime(row.spiderFinishedAt) }}</td>
            <td>
              <div class="spider-execution__action-group">
                <button type="button" class="spider-execution__action-btn" @click="viewDetail(row)">
                  <el-icon :size="14"><View /></el-icon>
                  详情
                </button>
                <button
                  type="button"
                  class="spider-execution__action-btn"
                  @click="rerun(row)"
                  v-if="canRerun(row)"
                >
                  <el-icon :size="14"><RefreshRight /></el-icon>
                  重新运行
                </button>
                <button
                  type="button"
                  class="spider-execution__action-btn"
                  @click="pause(row)"
                  v-if="canPause(row)"
                >
                  <el-icon :size="14"><VideoPause /></el-icon>
                  暂停
                </button>
                <button
                  type="button"
                  class="spider-execution__action-btn"
                  @click="resume(row)"
                  v-if="canResume(row)"
                >
                  <el-icon :size="14"><VideoPlay /></el-icon>
                  恢复
                </button>
                <button
                  type="button"
                  class="spider-execution__action-btn spider-execution__action-btn--danger"
                  @click="deleteExecution(row)"
                >
                  <el-icon :size="14"><Delete /></el-icon>
                  删除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="spider-execution__empty">
        <el-icon :size="48" style="color: var(--el-text-color-placeholder)"><DocumentRemove /></el-icon>
        <p>{{ loading ? '加载中...' : '暂无执行记录' }}</p>
        <button v-if="!loading" type="button" class="spider-execution__load-btn" @click="loadExecutions">点击加载</button>
      </div>
    </div>

    <!-- Detail Drawer -->
    <div v-if="detailVisible" class="spider-execution__overlay" @click.self="detailVisible = false">
      <aside class="spider-execution__drawer">
        <div class="spider-execution__drawer-header">
          <h3>执行详情</h3>
          <button type="button" class="spider-execution__drawer-close" @click="detailVisible = false">
            <el-icon :size="18"><Close /></el-icon>
          </button>
        </div>
        <div class="spider-execution__drawer-body">
          <div v-if="detailExec" class="spider-execution__detail-grid">
            <div class="spider-execution__detail-field">
              <span class="spider-execution__detail-label">批次号</span>
              <span class="spider-execution__detail-value">{{ detailExec.spiderExecutionNo }}</span>
            </div>
            <div class="spider-execution__detail-field">
              <span class="spider-execution__detail-label">爬虫编码</span>
              <span class="spider-execution__detail-value">{{ detailExec.spiderDefinitionCode }}</span>
            </div>
            <div class="spider-execution__detail-field">
              <span class="spider-execution__detail-label">触发类型</span>
              <span class="spider-execution__detail-value">{{ detailExec.spiderTriggerType || '-' }}</span>
            </div>
            <div class="spider-execution__detail-field">
              <span class="spider-execution__detail-label">执行状态</span>
              <span class="spider-execution__status-pill" :class="statusClass(detailExec.spiderExecutionStatus)">
                <span class="spider-execution__status-dot" />{{ detailExec.spiderExecutionStatus || 'UNKNOWN' }}
              </span>
            </div>
            <div class="spider-execution__detail-field">
              <span class="spider-execution__detail-label">开始时间</span>
              <span class="spider-execution__detail-value">{{ formatTime(detailExec.spiderStartedAt) }}</span>
            </div>
            <div class="spider-execution__detail-field">
              <span class="spider-execution__detail-label">结束时间</span>
              <span class="spider-execution__detail-value">{{ formatTime(detailExec.spiderFinishedAt) }}</span>
            </div>
            <div class="spider-execution__detail-field">
              <span class="spider-execution__detail-label">是否需要人工介入</span>
              <span class="spider-execution__detail-value">{{ detailExec.spiderNeedManualIntervene ? '是' : '否' }}</span>
            </div>
            <div class="spider-execution__detail-field">
              <span class="spider-execution__detail-label">失败后继续</span>
              <span class="spider-execution__detail-value">{{ detailExec.spiderContinueOnFailure ? '是' : '否' }}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { deleteSpiderExecution, listSpiderExecutionRecords, listSpiderDefinitions, pauseSpiderExecution, rerunSpiderExecution, resumeSpiderExecution } from "../../../api/spider"
import type { SpiderDefinition, SpiderExecutionRecordView } from "../../../types/orchestration"

const loading = ref(false)
const executions = ref<SpiderExecutionRecordView[]>([])
const allDefs = ref<SpiderDefinition[]>([])
const filterCode = ref("")
const detailVisible = ref(false)
const detailExec = ref<SpiderExecutionRecordView | null>(null)
const lastUpdate = ref("")

let refreshTimer: ReturnType<typeof setInterval> | null = null

const filteredExecs = computed(() => {
  if (!filterCode.value) return executions.value
  return executions.value.filter(e => e.spiderDefinitionCode === filterCode.value)
})

async function loadExecutions() {
  loading.value = true
  try {
    const defs = await listSpiderDefinitions()
    allDefs.value = defs
    const results: SpiderExecutionRecordView[] = []
    for (const d of defs) {
      try {
        const execs = await listSpiderExecutionRecords(d.spiderCode, undefined, 10)
        results.push(...execs)
      } catch { /* skip */ }
    }
    results.sort((a, b) => {
      const ta = a.spiderStartedAt || a.createTime || ""
      const tb = b.spiderStartedAt || b.createTime || ""
      return tb.localeCompare(ta)
    })
    executions.value = results
    lastUpdate.value = new Date().toLocaleTimeString()
  } catch { /* ignore */ }
  loading.value = false
}

function viewDetail(row: SpiderExecutionRecordView) {
  detailExec.value = row
  detailVisible.value = true
}

function formatTime(t?: string): string {
  if (!t) return "-"
  return t.replace("T", " ")
}

function statusClass(s?: string): string {
  switch (s) {
    case "RUNNING": return "status--running"
    case "SUCCESS": return "status--success"
    case "FAILED": case "FAILURE": return "status--failure"
    case "WAITING": return "status--waiting"
    case "WAIT_MANUAL": return "status--waiting"
    case "PAUSED": return "status--waiting"
    default: return "status--unknown"
  }
}

function canRerun(row: SpiderExecutionRecordView) {
  return row.spiderExecutionStatus !== "RUNNING" && row.spiderExecutionStatus !== "WAITING"
}

function canPause(row: SpiderExecutionRecordView) {
  return row.spiderExecutionStatus === "RUNNING"
}

function canResume(row: SpiderExecutionRecordView) {
  return row.spiderExecutionStatus === "PAUSED"
}

async function rerun(row: SpiderExecutionRecordView) {
  try {
    await rerunSpiderExecution(row.spiderExecutionNo)
    ElMessage.success("已重新运行")
    await loadExecutions()
  } catch (e) {
    ElMessage.error(String((e as Error)?.message || e))
  }
}

async function pause(row: SpiderExecutionRecordView) {
  try {
    await pauseSpiderExecution(row.spiderExecutionNo)
    ElMessage.success("已暂停")
    await loadExecutions()
  } catch (e) {
    ElMessage.error(String((e as Error)?.message || e))
  }
}

async function resume(row: SpiderExecutionRecordView) {
  try {
    await resumeSpiderExecution(row.spiderExecutionNo)
    ElMessage.success("已恢复")
    await loadExecutions()
  } catch (e) {
    ElMessage.error(String((e as Error)?.message || e))
  }
}

async function deleteExecution(row: SpiderExecutionRecordView) {
  try {
    await ElMessageBox.confirm(
      `确认删除执行记录 ${row.spiderExecutionNo}？关联步骤、人工任务、截图和解析结果会一并清理。`,
      "删除执行记录",
      {
        confirmButtonText: "删除",
        cancelButtonText: "取消",
        type: "warning",
      },
    )
    await deleteSpiderExecution(row.spiderExecutionNo)
    if (detailExec.value?.spiderExecutionNo === row.spiderExecutionNo) {
      detailVisible.value = false
      detailExec.value = null
    }
    ElMessage.success("已删除")
    await loadExecutions()
  } catch (e) {
    if (String((e as Error)?.message || e).includes("cancel")) return
    if (e === "cancel" || e === "close") return
    ElMessage.error(String((e as Error)?.message || e))
  }
}

onMounted(() => {
  loadExecutions()
  refreshTimer = setInterval(loadExecutions, 15000)
})

onBeforeUnmount(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<style scoped lang="scss">
.spider-execution {
  padding: 24px 28px;
}

.spider-execution__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.spider-execution__title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.spider-execution__subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.spider-execution__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spider-execution__search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 8px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  color: var(--el-text-color-secondary);
}

.spider-execution__select {
  border: none;
  background: transparent;
  color: var(--el-text-color-primary);
  font-size: 13px;
  outline: none;
  min-width: 150px;
  option {
    background: var(--el-text-color-primary);
    color: var(--el-text-color-primary);
  }
}

.spider-execution__refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-bg-color);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
  }
  &.is-spinning svg { animation: spin 0.8s linear infinite; }
}

.spider-execution__hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}
.spider-execution__hint-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-success);
  animation: pulse-dot 2s ease-in-out infinite;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Table */
.spider-execution__table-wrap {
  border-radius: 12px;
  border: 1px solid var(--el-border-color);
  overflow: hidden;
  background: var(--el-bg-color);
}

.spider-execution__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  th {
    text-align: left;
    padding: 12px 14px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    background: color-mix(in srgb, var(--el-border-color) 30%, transparent);
    border-bottom: 1px solid var(--el-border-color);
    white-space: nowrap;
  }

  td {
    padding: 11px 14px;
    color: var(--el-text-color-primary);
    border-bottom: 1px solid color-mix(in srgb, var(--el-border-color) 50%, transparent);
  }

  tr:last-child td { border-bottom: none; }
  tr:hover td { background: color-mix(in srgb, var(--el-color-primary) 5%, transparent); }
}

.cell-mono {
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 12px;
}

.spider-execution__trigger-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  color: var(--el-color-primary);
}

.spider-execution__status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.spider-execution__status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status--running {
  background: color-mix(in srgb, var(--el-color-warning) 15%, transparent);
  color: var(--el-color-warning);
  .spider-execution__status-dot { background: var(--el-color-warning); animation: pulse 1.2s infinite; }
}
.status--success {
  background: color-mix(in srgb, var(--el-color-success) 15%, transparent);
  color: var(--el-color-success);
  .spider-execution__status-dot { background: var(--el-color-success); }
}
.status--failure {
  background: color-mix(in srgb, var(--el-color-danger) 15%, transparent);
  color: var(--el-color-danger);
  .spider-execution__status-dot { background: var(--el-color-danger); }
}
.status--waiting {
  background: color-mix(in srgb, var(--el-text-color-secondary) 15%, transparent);
  color: var(--el-text-color-placeholder);
  .spider-execution__status-dot { background: var(--el-text-color-secondary); }
}
.status--unknown {
  background: color-mix(in srgb, var(--el-text-color-secondary) 15%, transparent);
  color: var(--el-text-color-placeholder);
  .spider-execution__status-dot { background: var(--el-text-color-secondary); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.spider-execution__action-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.spider-execution__action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
  }
}

.spider-execution__action-btn--danger {
  color: var(--el-color-danger-light-3);
  border-color: color-mix(in srgb, var(--el-color-danger) 40%, var(--el-border-color));
  &:hover {
    border-color: var(--el-color-danger);
    color: var(--el-color-danger-light-5);
  }
}

.spider-execution__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px 20px;
  color: var(--el-text-color-tertiary);
  font-size: 14px;
}

.spider-execution__load-btn {
  padding: 6px 16px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  cursor: pointer;
  font-size: 13px;
}

/* Overlay & Drawer */
.spider-execution__overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: flex-end;
}

.spider-execution__drawer {
  width: 420px;
  max-width: 90vw;
  height: 100%;
  background: var(--el-bg-color);
  border-left: 1px solid var(--el-border-color);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.2s ease;
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.spider-execution__drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  border-bottom: 1px solid var(--el-border-color);
  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

.spider-execution__drawer-close {
  display: flex;
  padding: 4px;
  border: none;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  border-radius: 4px;
  &:hover { background: color-mix(in srgb, var(--el-border-color) 50%, transparent); }
}

.spider-execution__drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.spider-execution__detail-grid {
  display: grid;
  gap: 16px;
}

.spider-execution__detail-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.spider-execution__detail-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.spider-execution__detail-value {
  font-size: 14px;
  color: var(--el-text-color-primary);
}
</style>
