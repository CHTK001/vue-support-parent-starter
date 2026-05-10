<template>
  <div class="jc">
    <!-- Animated background decoration -->
    <div class="jc-bg-deco">
      <div class="jc-bg-circle jc-bg-circle--1" />
      <div class="jc-bg-circle jc-bg-circle--2" />
      <div class="jc-bg-circle jc-bg-circle--3" />
    </div>

    <!-- Dashboard / Overview -->
    <template v-if="view === 'dashboard'">
      <div class="jc-top">
        <div class="jc-top-left">
          <h1 class="jc-title">Job Console</h1>
          <p class="jc-subtitle">定时任务调度监控面板</p>
        </div>
        <div class="jc-top-right">
          <el-date-picker v-model="overviewDateRange" type="datetimerange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" format="YYYY-MM-DD HH:mm" value-format="x" style="width:340px" @change="onDateRangeChange" />
          <el-tooltip content="任务管理" placement="bottom">
            <button type="button" class="jc-settings-btn" @click="switchView('manage')">
              <el-icon><Setting /></el-icon>
            </button>
          </el-tooltip>
        </div>
      </div>

      <!-- Stat cards -->
      <div class="jc-cards">
        <div class="jc-card jc-card--total">
          <div class="jc-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg></div>
          <div class="jc-card-body">
            <span class="jc-card-num">{{ filteredTasks.length }}</span>
            <span class="jc-card-lbl">任务总数</span>
          </div>
        </div>
        <div class="jc-card jc-card--running">
          <div class="jc-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
          <div class="jc-card-body">
            <span class="jc-card-num">{{ runningCount }}</span>
            <span class="jc-card-lbl">运行中</span>
          </div>
        </div>
        <div class="jc-card jc-card--success">
          <div class="jc-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
          <div class="jc-card-body">
            <span class="jc-card-num">{{ successCount }}</span>
            <span class="jc-card-lbl">最近成功</span>
          </div>
        </div>
        <div class="jc-card jc-card--failure">
          <div class="jc-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div>
          <div class="jc-card-body">
            <span class="jc-card-num">{{ failureCount }}</span>
            <span class="jc-card-lbl">最近失败</span>
          </div>
        </div>
        <div class="jc-card jc-card--today">
          <div class="jc-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
          <div class="jc-card-body">
            <span class="jc-card-num">{{ todayExecutionCount }}</span>
            <span class="jc-card-lbl">今日执行</span>
          </div>
        </div>
      </div>

      <!-- Charts row -->
      <div class="jc-charts">
        <div class="jc-chart-card jc-chart-card--bar">
          <div class="jc-chart-card__header">
            <h3 class="jc-chart-card__title">任务执行统计</h3>
            <span class="jc-chart-card__desc">每个任务的成功 / 失败次数</span>
          </div>
          <div ref="chartBarRef" class="jc-chart-area" />
        </div>
        <div class="jc-chart-card jc-chart-card--pie">
          <div class="jc-chart-card__header">
            <h3 class="jc-chart-card__title">整体执行状态</h3>
            <span class="jc-chart-card__desc">全量日志成功 / 失败比例</span>
          </div>
          <div ref="chartStatusRef" class="jc-chart-area" />
        </div>
        <div class="jc-chart-card jc-chart-card--pie">
          <div class="jc-chart-card__header">
            <h3 class="jc-chart-card__title">今日执行趋势</h3>
            <span class="jc-chart-card__desc">今日各时段执行成功 / 失败</span>
          </div>
          <div ref="chartTrendRef" class="jc-chart-area" />
        </div>
      </div>

      <!-- Recent logs -->
      <div class="jc-section">
        <div class="jc-section-header">
          <h3 class="jc-section-title">最近执行</h3>
          <span v-if="logs.length" class="jc-section-badge">{{ logs.length > 10 ? '10' : logs.length }} / {{ logs.length }}</span>
        </div>
        <div v-if="!logs.length" class="jc-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" style="color:var(--jc-text-tertiary)"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          <p>暂无执行记录</p>
        </div>
        <TransitionGroup v-else name="log" tag="div" class="jc-log-list">
          <div v-for="(log, i) in logs.slice(0, 10)" :key="log.jobLogNo || i" class="jc-log-row" :style="{ '--i': i }">
            <span class="jc-log-badge" :class="log.jobLogExecuteCode === 'SUCCESS' ? 'badge--success' : 'badge--danger'">
              {{ log.jobLogExecuteCode || log.jobLogTriggerCode || '-' }}
            </span>
            <span class="jc-log-no">{{ log.jobLogNo }}</span>
            <span class="jc-log-msg">{{ log.jobLogTriggerMsg || '-' }}</span>
            <span class="jc-log-time">{{ formatTime(log.jobLogTriggerTime) }}</span>
          </div>
        </TransitionGroup>
      </div>
    </template>

    <!-- Manage -->
    <template v-if="view === 'manage'">
      <div class="jc-manage-header">
        <div class="jc-top-left">
          <el-button class="jc-back-btn" @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <div>
            <h2 class="jc-manage-title">任务管理</h2>
            <p class="jc-manage-subtitle">创建、编辑和管理定时任务</p>
          </div>
        </div>
        <el-button type="primary" class="jc-create-btn" @click="openEditor('create')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          新建任务
        </el-button>
      </div>

      <div class="jc-toolbar">
        <div class="jc-search">
          <svg class="jc-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input v-model="filters.keyword" placeholder="搜索编号 / 名称 / 描述" class="jc-search-input" />
        </div>
        <el-tooltip :content="includeDeleted ? '隐藏已删除任务' : '显示已删除任务'" placement="top">
          <button class="jc-filter-btn" :class="{ 'is-active': includeDeleted }" @click="toggleDeleted">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            <span>回收站</span>
          </button>
        </el-tooltip>
      </div>

      <div class="jc-table-wrap">
        <table class="jc-table">
          <thead>
            <tr>
              <th>编号</th>
              <th>名称</th>
              <th>描述</th>
              <th>状态</th>
              <th class="th-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in filteredTasks" :key="task.jobNo || task.taskKey" class="jc-table-row" :class="{ 'row-deleted': task.deleted }">
              <td class="cell-mono">{{ task.jobNo }}</td>
              <td class="cell-name">{{ task.taskName }}</td>
              <td class="cell-desc">{{ task.description || '-' }}</td>
              <td>
                <span v-if="task.deleted" class="jc-status status-deleted">
                  <span class="jc-status-dot" />
                  已删除
                </span>
                <span v-else class="jc-status" :class="task.enabled ? 'status-running' : 'status-stopped'">
                  <span class="jc-status-dot" />
                  {{ task.enabled ? '运行' : '停止' }}
                </span>
              </td>
              <td>
                <div class="jc-actions">
                  <el-tooltip :content="task.deleted ? '任务已删除' : '编辑'" placement="top">
                    <button class="jc-action-btn" :class="{ 'is-disabled': task.deleted }" :disabled="task.deleted" @click.stop="selectTask(task); openEditor('edit')">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                  </el-tooltip>
                  <el-tooltip v-if="!task.deleted" :content="task.enabled ? '停止' : '启动'" placement="top">
                    <button class="jc-action-btn" :class="task.enabled ? 'ac-pause' : 'ac-play'" @click.stop="selectTask(task); runAction(task.enabled ? 'stop' : 'start')">
                      <svg v-if="task.enabled" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                      <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </button>
                  </el-tooltip>
                  <el-tooltip :content="task.deleted ? '任务已删除' : '执行'" placement="top">
                    <button class="jc-action-btn ac-trigger" :class="{ 'is-disabled': task.deleted }" :disabled="task.deleted" @click.stop="selectTask(task); runAction('trigger')">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </button>
                  </el-tooltip>
                  <el-tooltip content="日志" placement="top">
                    <button class="jc-action-btn" @click.stop="selectTask(task); showLogs()">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    </button>
                  </el-tooltip>
                  <template v-if="task.deleted">
                    <el-tooltip content="恢复" placement="top">
                      <button class="jc-action-btn ac-success" @click.stop="selectTask(task); handleRestore(task.jobNo)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                      </button>
                    </el-tooltip>
                  </template>
                  <template v-else>
                    <el-tooltip content="删除" placement="top">
                      <button class="jc-action-btn ac-danger" @click.stop="selectTask(task); handleDelete()">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </el-tooltip>
                  </template>
                </div>
              </td>
            </tr>
            <tr v-if="!filteredTasks.length">
              <td colspan="5">
                <div class="jc-empty">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" style="color:var(--jc-text-tertiary)"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                  <p>暂无任务，点击右上角「新建」开始</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Log drawer -->
    <el-drawer v-model="logDrawer" :title="selectedTask?.taskName || selectedTask?.jobNo || '日志'" size="500px" class="jc-drawer">
      <div v-if="!taskLogs.length" class="jc-empty">暂无日志</div>
      <div v-for="log in taskLogs" :key="log.jobLogNo" class="jc-log-card">
        <div class="jc-log-card__top">
          <strong class="jc-log-card__no">{{ log.jobLogNo }}</strong>
          <el-tag :type="log.jobLogExecuteCode === 'SUCCESS' ? 'success' : 'danger'" size="small" round>
            {{ log.jobLogExecuteCode || log.jobLogTriggerCode || '-' }}
          </el-tag>
        </div>
        <p class="jc-log-card__msg">{{ log.jobLogTriggerMsg || '无消息' }}</p>
        <span class="jc-log-card__time">{{ formatTime(log.jobLogTriggerTime) }}</span>
      </div>
    </el-drawer>

    <!-- Editor dialog -->
    <el-dialog v-model="editorVisible" :title="editorMode === 'create' ? '新建任务' : '编辑任务'" width="580px" draggable class="jc-dialog" top="5vh">
      <el-form :model="form" label-position="top" size="small" class="jc-form">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="编号"><el-input v-model="form.jobNo" :disabled="editorMode==='edit'" placeholder="唯一编号" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="名称"><el-input v-model="form.jobName" placeholder="任务名称" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="描述"><el-input v-model="form.jobDesc" type="textarea" :rows="2" placeholder="任务描述" /></el-form-item>
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item label="调度类型"><el-select v-model="form.jobScheduleType" style="width:100%"><el-option label="CRON" value="CRON" /><el-option label="NONE" value="NONE" /></el-select></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="调度时间"><el-input v-model="form.jobScheduleTime" placeholder="0 * * * * ?" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="分发模式"><el-select v-model="form.jobDispatchMode" style="width:100%"><el-option label="LOCAL" value="LOCAL" /><el-option label="REMOTE" value="REMOTE" /></el-select></el-form-item></el-col>
        </el-row>
        <el-form-item label="执行 Bean"><el-input v-model="form.jobExecuteBean" placeholder="Bean 名称" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="editorVisible = false">取消</el-button>
        <el-button size="small" type="primary" :loading="savingJob" @click="saveJob">{{ editorMode === 'create' ? '创建' : '保存' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from "vue"
import { ArrowLeft, Setting } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { useJobConsole } from "./composables/useJobConsole"
import * as echarts from "echarts"

const view = ref<"dashboard" | "manage">("dashboard")
const logDrawer = ref(false)
const taskLogs = ref<any[]>([])
const overviewDateRange = ref<[number, number] | null>(null)

const {
  editorMode, editorVisible, filters, filteredTasks, form,
  includeDeleted, loadLogs, loadNamespaces, loadOverviewLogs, logs, namespace, namespaces,
  openEditor, overviewLogs, refreshTasks, restoreTask, runAction, saveJob, savingJob,
  selectedTask, settings, runningCount, successCount,
  failureCount, todayCount, todayExecutionCount,
} = useJobConsole({
  defaultApiRoot: "../job-console/api/",
  storageKey: "spring.pages.job-console.settings",
})

watch(namespaces, (vals) => {
  if (vals.length && !namespace.value) namespace.value = vals[0]
}, { immediate: true })

onMounted(async () => {
  await loadNamespaces()
  if (namespaces.value.length && !namespace.value) namespace.value = namespaces.value[0]
})

/* ─── Charts ─── */
const chartBarRef = ref<HTMLDivElement>()
const chartStatusRef = ref<HTMLDivElement>()
const chartTrendRef = ref<HTMLDivElement>()
let chartBar: echarts.ECharts | null = null
let chartStatus: echarts.ECharts | null = null
let chartTrend: echarts.ECharts | null = null

function disposeCharts() {
  chartBar?.dispose(); chartBar = null
  chartStatus?.dispose(); chartStatus = null
  chartTrend?.dispose(); chartTrend = null
}

onBeforeUnmount(() => {
  disposeCharts()
  window.removeEventListener('resize', handleResize)
})

function handleResize() {
  chartBar?.resize(); chartStatus?.resize(); chartTrend?.resize()
}

function extractDateStr(t: any): string | null {
  if (t == null) return null
  if (typeof t === 'number') {
    const d = new Date(t)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  const s = String(t)
  // handle "2026-05-10T12:34:56", "2026-05-10 12:34:56", timestamp strings
  return s.replace('T', ' ').slice(0, 10)
}

function isInRange(t: any, range: [number, number] | null): boolean {
  if (!range) return true
  if (t == null) return false
  const ts = typeof t === 'number' ? t : new Date(t).getTime()
  return ts >= range[0] && ts <= range[1]
}

function onDateRangeChange() {
  nextTick(() => renderCharts())
}

async function initCharts() {
  await loadOverviewLogs()
  await nextTick()
  disposeCharts()
  if (chartBarRef.value) chartBar = echarts.init(chartBarRef.value)
  if (chartStatusRef.value) chartStatus = echarts.init(chartStatusRef.value)
  if (chartTrendRef.value) chartTrend = echarts.init(chartTrendRef.value)
  renderCharts()
  window.removeEventListener('resize', handleResize)
  window.addEventListener('resize', handleResize)
}

function renderCharts() {
  const allLogs = overviewLogs.value
  const range = overviewDateRange.value
  const todayStr = extractDateStr(Date.now())

  // Helper: match a log against the date range
  function logInRange(log: any) {
    return isInRange(log.jobLogTriggerTime || log.jobLogTriggerDate, range)
  }
  function isToday(log: any) {
    const ds = extractDateStr(log.jobLogTriggerTime || log.jobLogTriggerDate)
    return ds === todayStr
  }

  // ===== 1) Bar chart: per-task success / failure =====
  const taskMap = new Map<string, { success: number; failure: number }>()
  for (const log of allLogs) {
    if (!logInRange(log)) continue
    const name = log.jobLogTriggerBean || log.jobNo || 'unknown'
    if (!taskMap.has(name)) taskMap.set(name, { success: 0, failure: 0 })
    const entry = taskMap.get(name)!
    if (log.jobLogExecuteCode === 'SUCCESS') entry.success++
    else if (log.jobLogExecuteCode === 'FAILURE') entry.failure++
  }
  const barNames: string[] = []
  const barSuccess: number[] = []
  const barFailure: number[] = []
  for (const [name, data] of taskMap) {
    barNames.push(name.length > 18 ? name.slice(0, 18) + '…' : name)
    barSuccess.push(data.success)
    barFailure.push(data.failure)
  }

  chartBar?.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['成功', '失败'], right: 16, top: 0, textStyle: { fontSize: 11 } },
    grid: { left: 12, right: 16, top: 36, bottom: 4, containLabel: true },
    xAxis: { type: 'category', data: barNames, axisLabel: { fontSize: 11, rotate: barNames.length > 6 ? 30 : 0 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#e9edf2' } }, axisLabel: { fontSize: 11 } },
    series: [
      { name: '成功', type: 'bar', stack: 'total', barWidth: 22, itemStyle: { color: '#10b981', borderRadius: [0, 0, 0, 0] }, data: barSuccess },
      { name: '失败', type: 'bar', stack: 'total', itemStyle: { color: '#ef4444', borderRadius: [4, 4, 0, 0] }, data: barFailure },
    ],
  })

  // ===== 2) Status pie: overall success vs failure =====
  let totalSuccess = 0, totalFailure = 0
  for (const data of taskMap.values()) { totalSuccess += data.success; totalFailure += data.failure }
  chartStatus?.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie', radius: ['42%', '70%'], center: ['50%', '44%'],
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{c}次', fontSize: 11 },
      data: [
        { name: '成功', value: totalSuccess, itemStyle: { color: '#10b981' } },
        { name: '失败', value: totalFailure, itemStyle: { color: '#ef4444' } },
      ],
    }],
  })

  // ===== 3) Today pie chart + hourly trend =====
  let todaySuccess = 0, todayFailure = 0, todayOther = 0
  const hourlyMap = new Map<string, { s: number; f: number }>()
  for (const log of allLogs) {
    if (!isToday(log)) continue
    if (log.jobLogExecuteCode === 'SUCCESS') todaySuccess++
    else if (log.jobLogExecuteCode === 'FAILURE') todayFailure++
    else todayOther++
    // hourly aggregation
    const t = log.jobLogTriggerTime
    let hour = '?'
    if (typeof t === 'number') hour = String(new Date(t).getHours()).padStart(2, '0') + ':00'
    else if (t) hour = String(t).slice(11, 16)
    if (!hourlyMap.has(hour)) hourlyMap.set(hour, { s: 0, f: 0 })
    const h = hourlyMap.get(hour)!
    if (log.jobLogExecuteCode === 'SUCCESS') h.s++
    else if (log.jobLogExecuteCode === 'FAILURE') h.f++
  }
  const hours = Array.from(hourlyMap.keys()).sort()
  const hourSuccess = hours.map(h => hourlyMap.get(h)!.s)
  const hourFailure = hours.map(h => hourlyMap.get(h)!.f)

  chartTrend?.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['成功', '失败'], right: 16, top: 0, textStyle: { fontSize: 11 } },
    grid: { left: 12, right: 16, top: 36, bottom: 4, containLabel: true },
    xAxis: { type: 'category', data: hours, axisLabel: { fontSize: 11 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#e9edf2' } }, axisLabel: { fontSize: 11 } },
    series: [
      { name: '成功', type: 'line', smooth: true, symbol: 'circle', symbolSize: 6, lineStyle: { color: '#10b981', width: 2 }, areaStyle: { color: 'rgba(16,185,129,0.1)' }, data: hourSuccess },
      { name: '失败', type: 'line', smooth: true, symbol: 'circle', symbolSize: 6, lineStyle: { color: '#ef4444', width: 2 }, areaStyle: { color: 'rgba(239,68,68,0.1)' }, data: hourFailure },
    ],
  })
}

watch(view, (v) => {
  if (v === 'dashboard') {
    nextTick(() => initCharts())
  }
})

function selectTask(task: any) { selectedTask.value = task }

function switchView(target: "dashboard" | "manage") {
  view.value = target
}

function goBack() {
  view.value = 'dashboard'
}

async function showLogs() {
  await loadLogs()
  taskLogs.value = logs.value
  logDrawer.value = true
}

async function handleDelete() {
  if (!selectedTask.value?.jobNo) return
  try {
    await ElMessageBox.confirm("确定删除？此操作将停止任务并移至回收站。", "确认", {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    const path = `${encodeURIComponent(namespace.value)}/job/no/${encodeURIComponent(selectedTask.value.jobNo)}`
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (settings.authHeaderName && settings.authHeaderValue) headers[settings.authHeaderName] = settings.authHeaderValue
    const res = await fetch(`../job-console/api/${path}`, { method: "DELETE", headers, credentials: "include" })
    if (!res.ok) throw new Error("删除失败")
    ElMessage.success("已删除")
    await refreshTasks()
  } catch { /* ignore */ }
}

function toggleDeleted() {
  includeDeleted.value = !includeDeleted.value
  refreshTasks()
}

async function handleRestore(jobNo: string) {
  try {
    await ElMessageBox.confirm("确定恢复此任务？", "确认", {
      confirmButtonText: '恢复',
      cancelButtonText: '取消',
      type: 'info',
    })
    await restoreTask(jobNo)
  } catch { /* ignore */ }
}

function formatTime(t?: string | number | null) {
  if (t == null || t === '') return '-'
  if (typeof t === 'number') {
    return new Date(t).toISOString().replace('T', ' ').slice(0, 19)
  }
  return String(t).replace('T', ' ').slice(0, 19)
}
</script>

<style scoped lang="scss">
/* ============ Variables ============ */
.jc {
  --jc-bg: #f0f4f9;
  --jc-surface: #ffffff;
  --jc-surface-hover: #f8fafc;
  --jc-border: #e9edf2;
  --jc-text: #0f172a;
  --jc-text-secondary: #475569;
  --jc-text-tertiary: #94a3b8;
  --jc-accent: #3b82f6;
  --jc-accent-soft: #eff6ff;
  --jc-green: #10b981;
  --jc-red: #ef4444;
  --jc-amber: #f59e0b;
  --jc-purple: #8b5cf6;
  --jc-radius: 12px;
  --jc-radius-sm: 8px;

  padding: 32px 36px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
  position: relative;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans SC", sans-serif;
}

/* ============ Background Decoration ============ */
.jc-bg-deco {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}
.jc-bg-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
}
.jc-bg-circle--1 {
  width: 500px; height: 500px;
  background: radial-gradient(circle, #3b82f6, transparent);
  top: -200px; right: -100px;
  animation: float 20s ease-in-out infinite;
}
.jc-bg-circle--2 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, #8b5cf6, transparent);
  bottom: -100px; left: -100px;
  animation: float 25s ease-in-out infinite reverse;
}
.jc-bg-circle--3 {
  width: 300px; height: 300px;
  background: radial-gradient(circle, #10b981, transparent);
  top: 50%; left: 50%;
  animation: float 18s ease-in-out infinite 5s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}

/* ============ Top Bar ============ */
.jc-top {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 32px;
  animation: fadeUp 0.5s ease both;
}
.jc-top-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.jc-title {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
  color: var(--jc-text);
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, var(--jc-text), var(--jc-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.jc-subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--jc-text-tertiary);
  font-weight: 500;
}
.jc-top-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.jc-settings-btn {
  border: none !important;
  background: color-mix(in srgb, var(--jc-accent) 8%, transparent) !important;
  color: var(--jc-accent) !important;
  border-radius: 10px !important;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s;
  &:hover {
    background: color-mix(in srgb, var(--jc-accent) 15%, transparent) !important;
    transform: translateY(-1px);
  }
}

/* ============ Stats Cards ============ */
.jc-cards {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
  margin-bottom: 32px;
}
.jc-card {
  padding: 20px;
  border-radius: var(--jc-radius);
  background: var(--jc-surface);
  border: 1px solid var(--jc-border);
  display: flex;
  align-items: center;
  gap: 14px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeUp 0.5s ease both;
  animation-delay: calc(0.08s * var(--i, 0));
  cursor: default;
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 30px rgba(0,0,0,0.07);
    border-color: transparent;
  }
}
.jc-card-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.jc-card--total .jc-card-icon {
  background: color-mix(in srgb, var(--jc-accent) 10%, transparent);
  color: var(--jc-accent);
}
.jc-card--running .jc-card-icon {
  background: color-mix(in srgb, var(--jc-green) 10%, transparent);
  color: var(--jc-green);
}
.jc-card--success .jc-card-icon {
  background: color-mix(in srgb, var(--jc-green) 10%, transparent);
  color: var(--jc-green);
}
.jc-card--failure .jc-card-icon {
  background: color-mix(in srgb, var(--jc-red) 10%, transparent);
  color: var(--jc-red);
}
.jc-card--today .jc-card-icon {
  background: color-mix(in srgb, var(--jc-purple) 10%, transparent);
  color: var(--jc-purple);
}

.jc-card-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.jc-card-num {
  font-size: 24px;
  font-weight: 800;
  color: var(--jc-text);
  line-height: 1.2;
  letter-spacing: -0.02em;
}
.jc-card-lbl {
  font-size: 12px;
  color: var(--jc-text-tertiary);
  font-weight: 500;
}

/* ============ Charts ============ */
.jc-charts {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 14px;
  margin-bottom: 32px;
  animation: fadeUp 0.5s ease both 0.1s;
}
.jc-chart-card {
  background: var(--jc-surface);
  border: 1px solid var(--jc-border);
  border-radius: var(--jc-radius);
  padding: 18px 18px 6px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  &:hover {
    box-shadow: 0 8px 30px rgba(0,0,0,0.06);
    border-color: transparent;
  }
}
.jc-chart-card--bar {
  grid-column: span 1;
}
.jc-chart-card--pie {
  grid-column: span 1;
}
.jc-chart-card__header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
  padding: 0 4px;
}
.jc-chart-card__title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--jc-text);
}
.jc-chart-card__desc {
  font-size: 11px;
  color: var(--jc-text-tertiary);
}
.jc-chart-area {
  flex: 1;
  width: 100%;
  min-height: 220px;
  max-height: 280px;
}

@media (max-width: 900px) {
  .jc-charts {
    grid-template-columns: 1fr;
  }
}

/* ============ Section ============ */
.jc-section {
  position: relative;
  z-index: 1;
  background: var(--jc-surface);
  border: 1px solid var(--jc-border);
  border-radius: var(--jc-radius);
  padding: 20px 24px;
  animation: fadeUp 0.5s ease both 0.2s;
}
.jc-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}
.jc-section-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--jc-text);
}
.jc-section-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
  background: color-mix(in srgb, var(--jc-accent) 8%, transparent);
  color: var(--jc-accent);
}

/* ============ Log List ============ */
.jc-log-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.jc-log-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 14px;
  border-radius: var(--jc-radius-sm);
  border: 1px solid var(--jc-border);
  font-size: 13px;
  transition: all 0.2s;
  animation: fadeUp 0.3s ease both;
  animation-delay: calc(0.05s * var(--i, 0));
  &:hover {
    background: var(--jc-surface-hover);
    border-color: color-mix(in srgb, var(--jc-accent) 15%, transparent);
  }
}
.jc-log-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 20px;
  letter-spacing: 0.02em;
  flex-shrink: 0;
  &.badge--success {
    background: color-mix(in srgb, var(--jc-green) 10%, transparent);
    color: var(--jc-green);
  }
  &.badge--danger {
    background: color-mix(in srgb, var(--jc-red) 10%, transparent);
    color: var(--jc-red);
  }
}
.jc-log-no {
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-weight: 600;
  color: var(--jc-text-secondary);
  min-width: 140px;
  font-size: 12px;
}
.jc-log-msg {
  flex: 1;
  color: var(--jc-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.jc-log-time {
  color: var(--jc-text-tertiary);
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 12px;
  min-width: 140px;
  text-align: right;
}

/* Log transitions */
.log-enter-active { transition: all 0.3s ease; }
.log-leave-active { transition: all 0.2s ease; }
.log-enter-from { opacity: 0; transform: translateY(10px); }
.log-leave-to { opacity: 0; }

/* ============ Manage Header ============ */
.jc-manage-header {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  animation: fadeUp 0.4s ease both;
}
.jc-manage-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--jc-text);
}
.jc-manage-subtitle {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--jc-text-tertiary);
}
.jc-back-btn {
  border: 1px solid var(--jc-border) !important;
  border-radius: 8px !important;
  padding: 4px 6px !important;
  margin-right: 10px !important;
  font-size: 16px !important;
  min-width: unset !important;
  min-height: unset !important;
  height: 28px !important;
  width: 28px !important;
  transition: all 0.2s !important;
  &:hover {
    background: var(--jc-surface-hover) !important;
    border-color: var(--jc-accent) !important;
    color: var(--jc-accent) !important;
  }
}
.jc-create-btn {
  border-radius: 10px !important;
  font-weight: 600 !important;
  gap: 6px;
  padding: 9px 20px !important;
  transition: all 0.2s !important;
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 15px color-mix(in srgb, var(--jc-accent) 30%, transparent);
  }
}

/* ============ Toolbar ============ */
.jc-toolbar {
  position: relative;
  z-index: 1;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  animation: fadeUp 0.4s ease both 0.1s;
}
.jc-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 10px;
  background: var(--jc-surface);
  border: 1px solid var(--jc-border);
  width: 260px;
  transition: all 0.2s;
  &:focus-within {
    border-color: var(--jc-accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--jc-accent) 10%, transparent);
  }
}
.jc-search-icon {
  color: var(--jc-text-tertiary);
  flex-shrink: 0;
}
.jc-search-input {
  border: none;
  background: transparent;
  outline: none;
  color: var(--jc-text);
  font-size: 13px;
  width: 100%;
  &::placeholder { color: var(--jc-text-tertiary); }
}
.jc-filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  border: 1px solid var(--jc-border);
  border-radius: 10px;
  background: var(--jc-surface);
  color: var(--jc-text-tertiary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  &:hover {
    border-color: color-mix(in srgb, var(--jc-accent) 20%, transparent);
    color: var(--jc-accent);
  }
  &.is-active {
    background: color-mix(in srgb, var(--jc-red) 8%, transparent);
    border-color: color-mix(in srgb, var(--jc-red) 20%, transparent);
    color: var(--jc-red);
  }
}

/* ============ Table ============ */
.jc-table-wrap {
  position: relative;
  z-index: 1;
  border-radius: var(--jc-radius);
  border: 1px solid var(--jc-border);
  overflow: hidden;
  background: var(--jc-surface);
  animation: fadeUp 0.4s ease both 0.15s;
}
.jc-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  th {
    text-align: left;
    padding: 12px 16px;
    font-weight: 600;
    color: var(--jc-text-tertiary);
    background: color-mix(in srgb, var(--jc-border) 40%, transparent);
    border-bottom: 1px solid var(--jc-border);
    white-space: nowrap;
    font-size: 12px;
    letter-spacing: 0.03em;
  }
  td {
    padding: 12px 16px;
    color: var(--jc-text);
    border-bottom: 1px solid color-mix(in srgb, var(--jc-border) 50%, transparent);
  }
  tr:last-child td { border-bottom: none; }
}
.jc-table-row {
  transition: background 0.15s;
  &:hover td {
    background: color-mix(in srgb, var(--jc-accent) 3%, transparent);
  }
}
.row-deleted td {
  opacity: 0.55;
  background: color-mix(in srgb, var(--jc-red) 3%, transparent) !important;
}
.row-deleted:hover td {
  background: color-mix(in srgb, var(--jc-red) 5%, transparent) !important;
}
.cell-mono {
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 12px;
  color: var(--jc-text-secondary) !important;
}
.cell-name { font-weight: 600; }
.cell-desc {
  color: var(--jc-text-secondary) !important;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Status pills */
.jc-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  &.status-running {
    background: color-mix(in srgb, var(--jc-green) 10%, transparent);
    color: var(--jc-green);
  }
  &.status-stopped {
    background: color-mix(in srgb, var(--jc-text-tertiary) 10%, transparent);
    color: var(--jc-text-tertiary);
  }
}
.jc-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  .status-running & { background: var(--jc-green); }
  .status-stopped & { background: var(--jc-text-tertiary); }
  .status-deleted & { background: var(--jc-red); }
}
.status-deleted {
  background: color-mix(in srgb, var(--jc-red) 8%, transparent) !important;
  color: var(--jc-red) !important;
}

/* Action buttons */
.jc-actions {
  display: flex;
  gap: 4px;
}
.jc-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: var(--jc-text-tertiary);
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: color-mix(in srgb, var(--jc-accent) 8%, transparent);
    color: var(--jc-accent);
    border-color: color-mix(in srgb, var(--jc-accent) 15%, transparent);
  }
  /* Start button - green */
  &.ac-play:hover {
    background: color-mix(in srgb, var(--jc-green) 12%, transparent);
    color: var(--jc-green);
    border-color: color-mix(in srgb, var(--jc-green) 20%, transparent);
  }
  /* Stop button - amber */
  &.ac-pause:hover {
    background: color-mix(in srgb, var(--jc-amber) 12%, transparent);
    color: var(--jc-amber);
    border-color: color-mix(in srgb, var(--jc-amber) 20%, transparent);
  }
  /* Execute / trigger - blue prominent */
  &.ac-trigger {
    background: color-mix(in srgb, var(--jc-accent) 8%, transparent);
    color: var(--jc-accent);
    border-color: color-mix(in srgb, var(--jc-accent) 12%, transparent);
  }
  &.ac-trigger:hover {
    background: var(--jc-accent) !important;
    color: #fff !important;
    border-color: var(--jc-accent) !important;
    box-shadow: 0 2px 8px color-mix(in srgb, var(--jc-accent) 30%, transparent);
  }
  /* Restore - green */
  &.ac-success:hover {
    background: color-mix(in srgb, var(--jc-green) 12%, transparent);
    color: var(--jc-green);
    border-color: color-mix(in srgb, var(--jc-green) 20%, transparent);
  }
  /* Delete - red */
  &.ac-danger:hover {
    background: color-mix(in srgb, var(--jc-red) 12%, transparent);
    color: var(--jc-red);
    border-color: color-mix(in srgb, var(--jc-red) 20%, transparent);
  }
  &.is-disabled {
    opacity: 0.35;
    cursor: not-allowed;
    pointer-events: none;
  }
}

/* ============ Empty ============ */
.jc-empty {
  padding: 48px 20px;
  text-align: center;
  color: var(--jc-text-tertiary);
  font-size: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  p { margin: 0; }
}

/* ============ Drawer & Dialog tweaks ============ */
:deep(.jc-drawer .el-drawer__header) {
  font-weight: 700;
  font-size: 16px;
  color: var(--jc-text);
}
:deep(.jc-dialog .el-dialog__header) {
  font-weight: 700;
}
:deep(.jc-dialog .el-dialog__body) {
  padding-top: 12px;
}
:deep(.jc-dialog .el-form-item__label) {
  font-weight: 600;
  color: var(--jc-text-secondary);
  font-size: 12px;
}

/* Log cards in drawer */
.jc-log-card {
  padding: 14px;
  border-radius: var(--jc-radius-sm);
  border: 1px solid var(--jc-border);
  margin-bottom: 8px;
  transition: all 0.2s;
  &:hover {
    border-color: color-mix(in srgb, var(--jc-accent) 15%, transparent);
    background: var(--jc-surface-hover);
  }
}
.jc-log-card__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.jc-log-card__no {
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 13px;
}
.jc-log-card__msg {
  margin: 0 0 4px;
  font-size: 13px;
  color: var(--jc-text-secondary);
}
.jc-log-card__time {
  font-size: 12px;
  color: var(--jc-text-tertiary);
  font-family: monospace;
}

/* ============ Animations ============ */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
