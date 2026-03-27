<template>
  <div class="spring-page-shell">
    <header class="spring-hero">
      <div>
        <span class="spring-eyebrow">{{ eyebrow }}</span>
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
      </div>
      <div class="spring-hero-actions">
        <button type="button" class="spring-ghost-button" @click="settingsVisible = true">接口设置</button>
        <button type="button" class="spring-ghost-button" @click="refreshAll">刷新</button>
        <button type="button" class="spring-primary-button" @click="openEditor()">新建任务</button>
      </div>
    </header>

    <section class="spring-toolbar spring-card">
      <label class="spring-field">
        <span>任务名称</span>
        <input v-model.trim="filters.keyword" type="text" placeholder="回车查询" @keyup.enter="refreshTasks">
      </label>
      <label class="spring-field">
        <span>任务状态</span>
        <select v-model="filters.status">
          <option value="">全部</option>
          <option value="RUNNING">RUNNING</option>
          <option value="STOPPED">STOPPED</option>
          <option value="ERROR">ERROR</option>
        </select>
      </label>
      <label class="spring-field">
        <span>每页大小</span>
        <select v-model="filters.pageSize">
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
      </label>
      <label class="spring-field">
        <span>告警视图</span>
        <select v-model="filters.alertView">
          <option value="unresolved">未解决</option>
          <option value="all">全部</option>
          <option value="resolved">已解决</option>
        </select>
      </label>
      <div class="spring-toolbar-actions">
        <button type="button" class="spring-ghost-button" @click="refreshTasks">查询</button>
      </div>
    </section>

    <section class="spring-metrics">
      <article class="spring-metric-card spring-card"><span class="spring-metric-label">任务总数</span><strong class="spring-metric-value">{{ taskTotal }}</strong><small>当前条件下总任务数</small></article>
      <article class="spring-metric-card spring-card"><span class="spring-metric-label">运行中</span><strong class="spring-metric-value spring-accent-green">{{ runningCount }}</strong><small>当前页 RUNNING 数量</small></article>
      <article class="spring-metric-card spring-card"><span class="spring-metric-label">未解决告警</span><strong class="spring-metric-value spring-accent-amber">{{ unresolvedCount }}</strong><small>监控尚未确认的问题</small></article>
      <article class="spring-metric-card spring-card"><span class="spring-metric-label">已就绪表</span><strong class="spring-metric-value spring-accent-blue">{{ readyTableCount }}</strong><small>{{ tableStatus?.initialized ? "基础表已初始化" : "基础表未初始化" }}</small></article>
    </section>

    <section class="spring-layout-grid">
      <article class="spring-panel spring-card">
        <div class="spring-panel-header">
          <div><h2>同步任务</h2><p>轻页面负责启停、执行、编辑和删除。</p></div>
          <span class="spring-panel-meta">{{ loading.tasks ? "加载中" : `${tasks.length} / ${taskTotal}` }}</span>
        </div>
        <div class="spring-table-shell">
          <table class="spring-table">
            <thead><tr><th>任务</th><th>调度</th><th>状态</th><th>统计</th><th>操作</th></tr></thead>
            <tbody>
              <tr v-if="loading.tasks"><td colspan="5" class="spring-empty-cell">正在加载任务...</td></tr>
              <tr v-else-if="!tasks.length"><td colspan="5" class="spring-empty-cell">当前没有任务。</td></tr>
              <tr v-for="task in tasks" v-else :key="task.syncTaskId || task.syncTaskName" :class="{ 'spring-active-row': isSelected(task) }" @click="selectedTask = task">
                <td><div class="spring-table-title"><span class="spring-title-strong">{{ task.syncTaskName || "未命名任务" }}</span><span class="spring-muted-line">#{{ task.syncTaskId || "-" }}</span><span class="spring-muted-line">{{ task.syncTaskDesc || "无描述" }}</span></div></td>
                <td><div class="spring-table-title"><span class="spring-chip">{{ task.syncTaskCron || "手动/轮询" }}</span><span class="spring-muted-line">{{ task.syncTaskSyncMode || "FULL" }}</span></div></td>
                <td><div class="spring-table-title"><span class="spring-chip" :class="taskStatusClass(task.syncTaskStatus)">{{ task.syncTaskStatus || "UNKNOWN" }}</span><span class="spring-muted-line">{{ task.syncTaskLastRunStatus || "暂无执行结果" }}</span></div></td>
                <td><div class="spring-table-title"><span class="spring-title-strong">{{ formatNumber(task.syncTaskRunCount) }} 次</span><span class="spring-muted-line">成功 {{ formatNumber(task.syncTaskSuccessCount) }} · 失败 {{ formatNumber(task.syncTaskFailCount) }}</span></div></td>
                <td><div class="spring-table-title"><button type="button" class="spring-text-button" @click.stop="openEditor(task)">编辑</button><button type="button" class="spring-text-button" @click.stop="toggleTask(task)">{{ upper(task.syncTaskStatus) === "RUNNING" ? "停止" : "启动" }}</button><button type="button" class="spring-text-button" @click.stop="executeTask(task)">执行一次</button><button type="button" class="spring-text-button" @click.stop="deleteTask(task)">删除</button></div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <aside class="spring-side-column">
        <article class="spring-panel spring-card">
          <div class="spring-panel-header"><div><h2>任务详情</h2><p>当前选中任务的主要配置。</p></div><span class="spring-panel-meta">{{ selectedTask?.syncTaskStatus || "未选择" }}</span></div>
          <div v-if="selectedTask" class="spring-detail-content">
            <div class="spring-detail-grid">
              <div v-for="item in detailItems" :key="item.label" class="spring-detail-item"><small>{{ item.label }}</small><strong>{{ item.value }}</strong></div>
            </div>
          </div>
          <div v-else class="spring-detail-content spring-empty-state">请选择任务查看详情。</div>
        </article>

        <article class="spring-panel spring-card">
          <div class="spring-panel-header"><div><h2>最近日志</h2><p>展示当前任务最近 6 条执行记录。</p></div><button type="button" class="spring-text-button" @click="loadLogs">{{ loading.logs ? "加载中..." : "刷新日志" }}</button></div>
          <div class="spring-log-list">
            <div v-if="loading.logs" class="spring-empty-state">正在加载日志...</div>
            <div v-else-if="!logs.length" class="spring-empty-state">{{ selectedTask ? "当前任务暂无日志。" : "请选择任务后查看日志。" }}</div>
            <article v-for="log in logs" v-else :key="log.syncLogId || log.syncLogStartTime" class="spring-log-card">
              <div class="spring-log-card-head"><div class="spring-table-title"><span class="spring-title-strong">LOG-{{ log.syncLogId || "-" }}</span><span class="spring-muted-line">{{ formatDateTime(log.syncLogStartTime) || "-" }}</span></div><span class="spring-chip" :class="logStatusClass(log.syncLogStatus)">{{ log.syncLogStatus || "UNKNOWN" }}</span></div>
              <p>{{ log.syncLogMessage || "暂无执行消息" }}</p>
              <p class="spring-muted-line">{{ log.syncLogTriggerType || "UNKNOWN" }} · 读取 {{ formatNumber(log.syncLogReadCount) }} · 写入 {{ formatNumber(log.syncLogWriteCount) }} · 耗时 {{ formatNumber(log.syncLogCost) }} ms</p>
              <pre v-if="log.syncLogStackTrace" class="spring-code-block">{{ log.syncLogStackTrace }}</pre>
            </article>
          </div>
        </article>
      </aside>
    </section>

    <section class="spring-layout-grid">
      <article class="spring-panel spring-card">
        <div class="spring-panel-header"><div><h2>监控告警</h2><p>支持在轻页面直接确认告警。</p></div><span class="spring-panel-meta">{{ loading.alerts ? "加载中" : `${alerts.length} 条` }}</span></div>
        <div class="spring-log-list">
          <div v-if="loading.alerts" class="spring-empty-state">正在加载告警...</div>
          <div v-else-if="!alerts.length" class="spring-empty-state">当前条件下没有告警。</div>
          <article v-for="alert in alerts" v-else :key="alert.alertId || alert.alertTime" class="spring-log-card">
            <div class="spring-log-card-head"><div class="spring-table-title"><span class="spring-title-strong">{{ alert.alertType || "ALERT" }} · {{ alert.alertLevel || "INFO" }}</span><span class="spring-muted-line">任务 #{{ alert.syncTaskId || "-" }} · {{ formatDateTime(alert.alertTime) || "-" }}</span></div><span class="spring-chip" :class="isResolved(alert) ? 'spring-success' : 'spring-failure'">{{ isResolved(alert) ? "已解决" : "未解决" }}</span></div>
            <p>{{ alert.alertMessage || "无告警说明" }}</p>
            <div v-if="!isResolved(alert)" class="spring-detail-actions"><button type="button" class="spring-primary-button" @click="resolveAlert(alert.alertId)">确认告警</button></div>
          </article>
        </div>
      </article>

      <aside class="spring-side-column">
        <article class="spring-panel spring-card">
          <div class="spring-panel-header"><div><h2>执行统计</h2><p>全局执行摘要。</p></div><span class="spring-panel-meta">{{ loading.statistics ? "加载中" : "Summary" }}</span></div>
          <div class="spring-detail-content">
            <div v-if="loading.statistics" class="spring-empty-state">正在加载统计...</div>
            <div v-else-if="!summary" class="spring-empty-state">暂无统计数据。</div>
            <div v-else class="spring-detail-grid">
              <div class="spring-detail-item"><small>总执行次数</small><strong>{{ formatNumber(summary.totalExecutions) }}</strong></div>
              <div class="spring-detail-item"><small>成功次数</small><strong>{{ formatNumber(summary.successCount) }}</strong></div>
              <div class="spring-detail-item"><small>失败次数</small><strong>{{ formatNumber(summary.failCount) }}</strong></div>
              <div class="spring-detail-item"><small>成功率</small><strong>{{ formatPercent(summary.successRate) }}</strong></div>
              <div class="spring-detail-item"><small>平均耗时</small><strong>{{ formatDecimal(summary.avgCost) }} ms</strong></div>
              <div class="spring-detail-item"><small>平均吞吐</small><strong>{{ formatDecimal(summary.avgThroughput) }} /s</strong></div>
            </div>
          </div>
        </article>

        <article class="spring-panel spring-card">
          <div class="spring-panel-header"><div><h2>表状态</h2><p>初始化 `sync-data` 基础表。</p></div><span class="spring-panel-meta">{{ tableStatus?.initialized ? "已初始化" : "未初始化" }}</span></div>
          <div class="spring-detail-content">
            <div v-if="loading.tables" class="spring-empty-state">正在检查表状态...</div>
            <div v-else-if="!tableStatus" class="spring-empty-state">未获取到表状态。</div>
            <div v-else class="spring-detail-grid">
              <div v-for="item in asList(tableStatus.tables)" :key="item.tableName || item.description" class="spring-detail-item"><small>{{ item.description || "同步表" }}</small><strong>{{ item.tableName || "-" }}</strong><span class="spring-muted-line">{{ item.exists ? "已存在" : "缺失" }}</span></div>
            </div>
            <p v-if="tableStatus?.message" class="spring-muted-line">{{ tableStatus.message }}</p>
          </div>
          <div class="spring-detail-content"><div class="spring-detail-actions"><button type="button" class="spring-primary-button" :disabled="loading.initTables" @click="initializeTables(false)">{{ loading.initTables ? "初始化中..." : "初始化表" }}</button><button type="button" class="spring-danger-button" :disabled="loading.initTables" @click="initializeTables(true)">强制重建</button></div></div>
        </article>

        <article class="spring-panel spring-card">
          <div class="spring-panel-header"><div><h2>SPI 测试</h2><p>动态读取参数并测试连通性。</p></div><span class="spring-panel-meta">{{ currentSpis.length }} 个实现</span></div>
          <div class="spring-detail-content">
            <div class="spring-form-grid">
              <label class="spring-form-field"><span>SPI 类型</span><select v-model="spi.type"><option value="INPUT">INPUT</option><option value="OUTPUT">OUTPUT</option><option value="DATA_CENTER">DATA_CENTER</option><option value="FILTER">FILTER</option></select></label>
              <label class="spring-form-field"><span>SPI 名称</span><select v-model="spi.name"><option value="">{{ currentSpis.length ? "请选择 SPI" : "当前类型暂无 SPI" }}</option><option v-for="item in currentSpis" :key="item.name || item.displayName" :value="item.name">{{ item.displayName || item.name }}</option></select></label>
              <template v-for="param in visibleParams" :key="param.name || param.label">
                <label v-if="isBool(param)" class="spring-form-field"><span>{{ param.label || param.name }}</span><select v-model="spi.config[param.name]"><option :value="true">{{ param.activeText || "true" }}</option><option :value="false">{{ param.inactiveText || "false" }}</option></select></label>
                <label v-else-if="isSelect(param)" class="spring-form-field"><span>{{ param.label || param.name }}</span><select v-model="spi.config[param.name]"><option value="">{{ param.placeholder || "请选择" }}</option><option v-for="option in asList(param.options)" :key="optionValue(option)" :value="optionValue(option)">{{ optionLabel(option) }}</option></select></label>
                <label v-else-if="isLong(param)" class="spring-form-field spring-field-span-2"><span>{{ param.label || param.name }}</span><textarea v-model="spi.config[param.name]" :placeholder="param.placeholder || param.description || ''" rows="4" /></label>
                <label v-else class="spring-form-field"><span>{{ param.label || param.name }}</span><input v-model="spi.config[param.name]" :type="inputType(param)" :placeholder="param.placeholder || param.description || ''"></label>
              </template>
            </div>
          </div>
          <div class="spring-detail-content"><div class="spring-detail-actions"><button type="button" class="spring-primary-button" :disabled="loading.spiTest" @click="testSpi">{{ loading.spiTest ? "测试中..." : "测试连通性" }}</button></div><pre v-if="spi.result" class="spring-code-block">{{ spi.result }}</pre></div>
        </article>
      </aside>
    </section>

    <div v-if="editorVisible" class="spring-modal-backdrop" @click.self="editorVisible = false">
      <div class="spring-modal-card">
        <div class="spring-modal-header"><div><h3>{{ form.syncTaskId ? `编辑任务 #${form.syncTaskId}` : "新建同步任务" }}</h3><p>这里维护调度页所需的核心字段。</p></div><button type="button" class="spring-icon-button" @click="editorVisible = false">×</button></div>
        <form class="spring-modal-form" @submit.prevent="saveTask">
          <div class="spring-form-grid">
            <label class="spring-form-field"><span>任务名称</span><input v-model.trim="form.syncTaskName" type="text" required placeholder="例如：订单增量同步"></label>
            <label class="spring-form-field"><span>任务状态</span><select v-model="form.syncTaskStatus"><option value="STOPPED">STOPPED</option><option value="RUNNING">RUNNING</option><option value="ERROR">ERROR</option></select></label>
            <label class="spring-form-field"><span>CRON 表达式</span><input v-model.trim="form.syncTaskCron" type="text" placeholder="0 */5 * * * ?"></label>
            <label class="spring-form-field"><span>同步模式</span><select v-model="form.syncTaskSyncMode"><option value="FULL">FULL</option><option value="INCREMENTAL">INCREMENTAL</option><option value="BIDIRECTIONAL">BIDIRECTIONAL</option></select></label>
            <label class="spring-form-field"><span>批次大小</span><input v-model.trim="form.syncTaskBatchSize" type="number" min="1" placeholder="500"></label>
            <label class="spring-form-field"><span>同步间隔(ms)</span><input v-model.trim="form.syncTaskSyncInterval" type="number" min="0" placeholder="1000"></label>
            <label class="spring-form-field"><span>重试次数</span><input v-model.trim="form.syncTaskRetryCount" type="number" min="0" placeholder="3"></label>
            <label class="spring-form-field"><span>最大内存(MB)</span><input v-model.trim="form.syncTaskMaxMemoryMb" type="number" min="0" placeholder="512"></label>
            <label class="spring-form-field spring-field-span-2"><span>任务描述</span><textarea v-model.trim="form.syncTaskDesc" rows="4" placeholder="描述同步目标和注意事项" /></label>
          </div>
          <div class="spring-modal-footer"><button type="button" class="spring-ghost-button" @click="editorVisible = false">取消</button><button type="submit" class="spring-primary-button" :disabled="loading.saveTask">{{ loading.saveTask ? "保存中..." : "保存任务" }}</button></div>
        </form>
      </div>
    </div>

    <div v-if="settingsVisible" class="spring-modal-backdrop" @click.self="settingsVisible = false">
      <div class="spring-modal-card spring-modal-card-small">
        <div class="spring-modal-header"><div><h3>接口设置</h3><p>默认走控制台 Session，也支持补自定义请求头。</p></div><button type="button" class="spring-icon-button" @click="settingsVisible = false">×</button></div>
        <form class="spring-modal-form" @submit.prevent="saveSettings">
          <div class="spring-form-grid">
            <label class="spring-form-field spring-field-span-2"><span>API 根路径</span><input v-model.trim="settings.apiRoot" type="text" placeholder="../v1/sync/"></label>
            <label class="spring-form-field"><span>Header 名称</span><input v-model.trim="settings.authHeaderName" type="text" placeholder="可选"></label>
            <label class="spring-form-field"><span>Header 值</span><input v-model.trim="settings.authHeaderValue" type="password" placeholder="可选"></label>
          </div>
          <div class="spring-modal-footer"><button type="button" class="spring-ghost-button" @click="settingsVisible = false">取消</button><button type="submit" class="spring-primary-button">保存设置</button></div>
        </form>
      </div>
    </div>

    <div class="spring-toast-stack"><div v-for="toast in toasts" :key="toast.id" class="spring-toast" :class="`spring-${toast.type}`">{{ toast.message }}</div></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";

type RecordLike = Record<string, any>;
const props = withDefaults(defineProps<{ title?: string; description?: string; eyebrow?: string; defaultApiRoot?: string; storageKey?: string; }>(), {
  title: "Sync Data Console",
  description: "在 Spring 模块内直接管理同步任务、告警、日志、表状态和 SPI 连通性。",
  eyebrow: "Sync Data Starter",
  defaultApiRoot: "../v1/sync/",
  storageKey: "spring.simple-pages.sync-data-console.settings",
});

const loading = reactive({ tasks: false, logs: false, alerts: false, statistics: false, tables: false, initTables: false, spiCatalog: false, spiTest: false, saveTask: false });
const filters = reactive({ keyword: "", status: "", pageSize: "10", alertView: "unresolved" });
const settings = reactive(loadSettings());
const form = reactive(createForm());
const spi = reactive({ type: "INPUT", name: "", config: {} as Record<string, any>, result: "" });
const tasks = ref<RecordLike[]>([]);
const logs = ref<RecordLike[]>([]);
const alerts = ref<RecordLike[]>([]);
const statistics = ref<RecordLike | null>(null);
const tableStatus = ref<RecordLike | null>(null);
const params = ref<RecordLike[]>([]);
const catalog = reactive<Record<string, RecordLike[]>>({ INPUT: [], OUTPUT: [], DATA_CENTER: [], FILTER: [] });
const taskTotal = ref(0);
const selectedTask = ref<RecordLike | null>(null);
const editorVisible = ref(false);
const settingsVisible = ref(false);
const toasts = ref<{ id: number; message: string; type: "success" | "error" | "info" }[]>([]);
let toastSeed = 0;

const currentSpis = computed(() => asList(catalog[spi.type]));
const visibleParams = computed(() => params.value.filter((item) => isVisible(item)));
const summary = computed(() => statistics.value?.summary || null);
const runningCount = computed(() => tasks.value.filter((item) => upper(item.syncTaskStatus) === "RUNNING").length);
const unresolvedCount = computed(() => alerts.value.filter((item) => !isResolved(item)).length);
const readyTableCount = computed(() => asList(tableStatus.value?.tables).filter((item) => Boolean(item.exists)).length);
const detailItems = computed(() => selectedTask.value ? [
  { label: "任务编号", value: selectedTask.value.syncTaskId || "-" },
  { label: "任务名称", value: selectedTask.value.syncTaskName || "-" },
  { label: "任务状态", value: selectedTask.value.syncTaskStatus || "-" },
  { label: "CRON", value: selectedTask.value.syncTaskCron || "未配置" },
  { label: "同步模式", value: selectedTask.value.syncTaskSyncMode || "FULL" },
  { label: "最后执行", value: formatDateTime(selectedTask.value.syncTaskLastRunTime) || "暂无" },
  { label: "最后结果", value: selectedTask.value.syncTaskLastRunStatus || "暂无" },
  { label: "批次大小", value: formatNumber(selectedTask.value.syncTaskBatchSize) },
  { label: "总执行次数", value: formatNumber(selectedTask.value.syncTaskRunCount) },
  { label: "任务描述", value: selectedTask.value.syncTaskDesc || "无描述" },
] : []);

watch(tasks, (items) => {
  if (!items.length) { selectedTask.value = null; return; }
  const match = selectedTask.value ? items.find((item) => sameTask(item, selectedTask.value)) : null;
  selectedTask.value = match || items[0] || null;
}, { immediate: true });

watch(() => filters.status, () => void refreshTasks());
watch(() => filters.pageSize, () => void refreshTasks());
watch(() => filters.alertView, () => void loadAlerts());
watch(selectedTask, () => void loadLogs());
watch(currentSpis, (items) => { if (!items.some((item) => item.name === spi.name)) spi.name = items[0]?.name || ""; }, { immediate: true });
watch(() => spi.name, () => void loadParams());

onMounted(async () => { await Promise.all([refreshTasks(), loadAlerts(), loadStatistics(), loadTableStatus(), loadCatalog()]); });

async function refreshAll() { await Promise.all([refreshTasks(), loadAlerts(), loadStatistics(), loadTableStatus(), loadCatalog()]); }
async function refreshTasks() {
  loading.tasks = true;
  try {
    const query = new URLSearchParams({ page: "1", size: trim(filters.pageSize) || "10" });
    if (trim(filters.keyword)) query.set("taskName", trim(filters.keyword));
    if (trim(filters.status)) query.set("taskStatus", trim(filters.status));
    const payload = await request(`task/list?${query.toString()}`);
    tasks.value = asList(payload?.records);
    taskTotal.value = intOr(payload?.total, tasks.value.length);
  } catch (error) {
    tasks.value = [];
    taskTotal.value = 0;
    notify(resolveError(error, "加载同步任务失败"), "error");
  } finally {
    loading.tasks = false;
  }
}

async function loadLogs() {
  if (!selectedTask.value?.syncTaskId) { logs.value = []; return; }
  loading.logs = true;
  try {
    const payload = await request(`task/logs/${encodeURIComponent(String(selectedTask.value.syncTaskId))}?page=1&size=6`);
    logs.value = asList(payload?.records);
  } catch (error) {
    logs.value = [];
    notify(resolveError(error, "加载日志失败"), "error");
  } finally {
    loading.logs = false;
  }
}

async function loadAlerts() {
  loading.alerts = true;
  try {
    const query = new URLSearchParams();
    if (filters.alertView === "unresolved") query.set("resolved", "false");
    if (filters.alertView === "resolved") query.set("resolved", "true");
    alerts.value = asList(await request(`monitor/alerts${query.size ? `?${query.toString()}` : ""}`));
  } catch (error) {
    alerts.value = [];
    notify(resolveError(error, "加载告警失败"), "error");
  } finally {
    loading.alerts = false;
  }
}

async function loadStatistics() {
  loading.statistics = true;
  try {
    statistics.value = await request("task/statistics");
  } catch (error) {
    statistics.value = null;
    notify(resolveError(error, "加载统计失败"), "error");
  } finally {
    loading.statistics = false;
  }
}

async function loadTableStatus() {
  loading.tables = true;
  try {
    tableStatus.value = await request("task/table/status");
  } catch (error) {
    tableStatus.value = null;
    notify(resolveError(error, "加载表状态失败"), "error");
  } finally {
    loading.tables = false;
  }
}

async function initializeTables(force: boolean) {
  if (force && !window.confirm("强制重建会覆盖现有同步表结构，确认继续？")) return;
  loading.initTables = true;
  try {
    tableStatus.value = await request(`task/table/initialize?force=${force}`, { method: "POST" });
    notify(force ? "同步表已强制重建" : "同步表已初始化", "success");
  } catch (error) {
    notify(resolveError(error, "初始化同步表失败"), "error");
  } finally {
    loading.initTables = false;
  }
}

async function resolveAlert(alertId: unknown) {
  if (alertId == null) return;
  try {
    await request(`monitor/alerts/${encodeURIComponent(String(alertId))}/resolve`, { method: "PUT" });
    notify("告警已确认", "success");
    await loadAlerts();
  } catch (error) {
    notify(resolveError(error, "确认告警失败"), "error");
  }
}

async function loadCatalog() {
  loading.spiCatalog = true;
  try {
    const payload = await request("spi/all");
    catalog.INPUT = asList(payload?.input);
    catalog.OUTPUT = asList(payload?.output);
    catalog.DATA_CENTER = asList(payload?.dataCenter);
    catalog.FILTER = asList(payload?.filter);
  } catch (error) {
    catalog.INPUT = []; catalog.OUTPUT = []; catalog.DATA_CENTER = []; catalog.FILTER = [];
    notify(resolveError(error, "加载 SPI 列表失败"), "error");
  } finally {
    loading.spiCatalog = false;
  }
}

async function loadParams() {
  spi.result = "";
  params.value = [];
  clearObj(spi.config);
  if (!spi.name) return;
  try {
    params.value = asList(await request(`spi/parameters?spiType=${encodeURIComponent(spi.type)}&spiName=${encodeURIComponent(spi.name)}`)).sort((a, b) => intOr(a?.order, 0) - intOr(b?.order, 0));
    params.value.forEach((item) => { spi.config[item.name] = item.defaultValue ?? (isBool(item) ? false : ""); });
  } catch (error) {
    notify(resolveError(error, "加载 SPI 参数失败"), "error");
  }
}

async function testSpi() {
  if (!spi.name) { notify("请先选择 SPI", "info"); return; }
  loading.spiTest = true;
  try {
    const payload = await request(`spi/test?spiType=${encodeURIComponent(spi.type)}&spiName=${encodeURIComponent(spi.name)}`, {
      method: "POST",
      body: JSON.stringify(buildSpiBody()),
    });
    spi.result = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
    notify("SPI 连通性测试完成", "success");
  } catch (error) {
    spi.result = resolveError(error, "SPI 测试失败");
    notify(spi.result, "error");
  } finally {
    loading.spiTest = false;
  }
}

function openEditor(task?: RecordLike | null) {
  Object.assign(form, createForm());
  if (task) {
    selectedTask.value = task;
    Object.assign(form, {
      syncTaskId: task.syncTaskId ?? "",
      syncTaskName: trim(task.syncTaskName),
      syncTaskDesc: trim(task.syncTaskDesc),
      syncTaskStatus: trim(task.syncTaskStatus) || "STOPPED",
      syncTaskCron: trim(task.syncTaskCron),
      syncTaskSyncMode: trim(task.syncTaskSyncMode) || "FULL",
      syncTaskBatchSize: trim(task.syncTaskBatchSize),
      syncTaskSyncInterval: trim(task.syncTaskSyncInterval),
      syncTaskRetryCount: trim(task.syncTaskRetryCount),
      syncTaskMaxMemoryMb: trim(task.syncTaskMaxMemoryMb),
    });
  }
  editorVisible.value = true;
}

async function saveTask() {
  loading.saveTask = true;
  try {
    const editing = Boolean(trim(form.syncTaskId));
    await request(editing ? "task/update" : "task/create", {
      method: editing ? "PUT" : "POST",
      body: JSON.stringify(buildTaskBody()),
    });
    notify(editing ? "同步任务已更新" : "同步任务已创建", "success");
    editorVisible.value = false;
    await refreshTasks();
  } catch (error) {
    notify(resolveError(error, "保存同步任务失败"), "error");
  } finally {
    loading.saveTask = false;
  }
}

async function toggleTask(task: RecordLike | null) {
  if (!task?.syncTaskId) return;
  const action = upper(task.syncTaskStatus) === "RUNNING" ? "stop" : "start";
  try {
    await request(`task/${action}/${encodeURIComponent(String(task.syncTaskId))}`, { method: "POST" });
    notify(action === "start" ? "任务已启动" : "任务已停止", "success");
    await refreshTasks();
  } catch (error) {
    notify(resolveError(error, "切换任务状态失败"), "error");
  }
}

async function executeTask(task: RecordLike | null) {
  if (!task?.syncTaskId) return;
  try {
    await request(`task/execute/${encodeURIComponent(String(task.syncTaskId))}`, { method: "POST" });
    notify("任务已提交执行", "success");
    await Promise.all([refreshTasks(), loadLogs(), loadStatistics()]);
  } catch (error) {
    notify(resolveError(error, "执行任务失败"), "error");
  }
}

async function deleteTask(task: RecordLike | null) {
  if (!task?.syncTaskId || !window.confirm(`确认删除同步任务 ${task.syncTaskName || `#${task.syncTaskId}`} 吗？`)) return;
  try {
    await request(`task/delete/${encodeURIComponent(String(task.syncTaskId))}`, { method: "DELETE" });
    notify("同步任务已删除", "success");
    await Promise.all([refreshTasks(), loadAlerts(), loadStatistics()]);
  } catch (error) {
    notify(resolveError(error, "删除同步任务失败"), "error");
  }
}

function saveSettings() {
  settings.apiRoot = trim(settings.apiRoot) || props.defaultApiRoot;
  settings.authHeaderName = trim(settings.authHeaderName);
  settings.authHeaderValue = trim(settings.authHeaderValue);
  localStorage.setItem(props.storageKey, JSON.stringify(settings));
  settingsVisible.value = false;
  notify("接口设置已保存", "success");
  void refreshAll();
}

async function request(path: string, init?: RequestInit): Promise<any> {
  const headers = new Headers(init?.headers || {});
  if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (trim(settings.authHeaderName) && trim(settings.authHeaderValue)) headers.set(trim(settings.authHeaderName), trim(settings.authHeaderValue));
  const response = await fetch(apiUrl(path), { credentials: "include", ...init, headers });
  if (response.status === 401) { redirectToLogin(); throw new Error("请先登录控制台"); }
  const text = await response.text();
  const payload = text ? safeJsonParse(text) : null;
  if (!response.ok) throw new Error(resolveMessage(payload) || `请求失败: ${response.status}`);
  if (payload && typeof payload === "object" && "code" in payload) {
    const code = String(payload.code ?? "");
    if (!["00000", "200", "0"].includes(code)) throw new Error(resolveMessage(payload) || `业务请求失败: ${code}`);
    return "data" in payload ? payload.data : payload;
  }
  if (payload && typeof payload === "object" && payload.success === false) throw new Error(resolveMessage(payload) || "业务请求失败");
  return payload;
}

function apiUrl(path: string) {
  const root = trim(settings.apiRoot) || props.defaultApiRoot;
  const normalized = root.endsWith("/") ? root : `${root}/`;
  return new URL(path.replace(/^\/+/, ""), new URL(normalized, window.location.href)).toString();
}

function loadSettings() {
  try {
    const value = JSON.parse(localStorage.getItem(props.storageKey) || "{}");
    return { apiRoot: trim(value.apiRoot) || props.defaultApiRoot, authHeaderName: trim(value.authHeaderName), authHeaderValue: trim(value.authHeaderValue) };
  } catch {
    return { apiRoot: props.defaultApiRoot, authHeaderName: "", authHeaderValue: "" };
  }
}

function createForm() {
  return { syncTaskId: "", syncTaskName: "", syncTaskDesc: "", syncTaskStatus: "STOPPED", syncTaskCron: "", syncTaskSyncMode: "FULL", syncTaskBatchSize: "500", syncTaskSyncInterval: "1000", syncTaskRetryCount: "3", syncTaskMaxMemoryMb: "512" };
}

function buildTaskBody() {
  const base = trim(form.syncTaskId) && selectedTask.value ? { ...selectedTask.value } : {};
  return {
    ...base,
    ...(trim(form.syncTaskId) ? { syncTaskId: intOr(form.syncTaskId, 0) } : {}),
    syncTaskName: trim(form.syncTaskName),
    syncTaskDesc: trim(form.syncTaskDesc),
    syncTaskStatus: trim(form.syncTaskStatus) || "STOPPED",
    syncTaskCron: trim(form.syncTaskCron),
    syncTaskSyncMode: trim(form.syncTaskSyncMode) || "FULL",
    syncTaskBatchSize: numOr(form.syncTaskBatchSize),
    syncTaskSyncInterval: numOr(form.syncTaskSyncInterval),
    syncTaskRetryCount: numOr(form.syncTaskRetryCount),
    syncTaskMaxMemoryMb: numOr(form.syncTaskMaxMemoryMb),
  };
}

function buildSpiBody() {
  return Object.fromEntries(visibleParams.value.map((item) => [item.name, normalizeParam(item, spi.config[item.name])]));
}

function normalizeParam(param: RecordLike, value: unknown) {
  if (isBool(param)) return value === true || String(value) === "true";
  if (upper(param.type) === "NUMBER") return numOr(value);
  if (upper(param.type) === "JSON") {
    const text = trim(value);
    if (!text) return {};
    const parsed = safeJsonParse(text);
    return typeof parsed === "string" ? text : parsed;
  }
  return trim(value);
}

function isSelected(task: RecordLike) { return sameTask(task, selectedTask.value); }
function sameTask(left: RecordLike | null, right: RecordLike | null) { return !!left && !!right && String(left.syncTaskId ?? "") === String(right.syncTaskId ?? ""); }
function taskStatusClass(status: unknown) { const value = upper(status); return value === "RUNNING" ? "spring-running" : value === "STOPPED" ? "spring-stopped" : value === "ERROR" ? "spring-failure" : ""; }
function logStatusClass(status: unknown) { const value = upper(status); return value === "SUCCESS" || value === "RUNNING" ? "spring-success" : value === "FAIL" || value === "TIMEOUT" ? "spring-failure" : ""; }
function isResolved(alert: RecordLike) { return String(alert?.isResolved ?? "") === "1" || alert?.isResolved === true; }
function isBool(param: RecordLike) { return upper(param?.type) === "BOOLEAN"; }
function isSelect(param: RecordLike) { return upper(param?.type) === "SELECT"; }
function isLong(param: RecordLike) { const type = upper(param?.type); return type === "TEXTAREA" || type === "JSON"; }
function isVisible(param: RecordLike) { return !param?.dependsOn || Object.entries(param.dependsOn).every(([key, expected]) => String(spi.config[key] ?? "") === String(expected ?? "")); }
function inputType(param: RecordLike) { return upper(param?.type) === "PASSWORD" ? "password" : upper(param?.type) === "NUMBER" ? "number" : "text"; }
function optionValue(option: RecordLike) { return option?.value ?? option?.name ?? option?.code ?? option?.id ?? ""; }
function optionLabel(option: RecordLike) { return option?.label ?? option?.name ?? option?.displayName ?? option?.text ?? String(optionValue(option)); }
function formatDateTime(value?: unknown) { const text = trim(value); if (!text) return ""; const parsed = new Date(text.includes("T") ? text : text.replace(" ", "T")); return Number.isNaN(parsed.getTime()) ? text.replace("T", " ") : parsed.toLocaleString("zh-CN", { hour12: false }); }
function formatNumber(value: unknown) { const num = numOr(value); return num == null ? "0" : num.toLocaleString("zh-CN"); }
function formatDecimal(value: unknown) { const num = numOr(value); return num == null ? "0.00" : num.toFixed(2); }
function formatPercent(value: unknown) { const num = numOr(value); return num == null ? "0%" : `${num.toFixed(2)}%`; }
function notify(message: string, type: "success" | "error" | "info") { const id = ++toastSeed; toasts.value.push({ id, message, type }); window.setTimeout(() => { toasts.value = toasts.value.filter((item) => item.id !== id); }, 3200); }
function asList(value: any) { return Array.isArray(value) ? value : []; }
function clearObj(target: Record<string, any>) { Object.keys(target).forEach((key) => delete target[key]); }
function resolveMessage(payload: any) { return !payload ? "" : typeof payload === "string" ? payload : payload.message || payload.msg || payload.error || ""; }
function safeJsonParse(value: string) { try { return JSON.parse(value); } catch { return value; } }
function resolveError(error: unknown, fallback: string) { return error instanceof Error && error.message ? error.message : fallback; }
function trim(value: unknown) { return value == null ? "" : String(value).trim(); }
function upper(value: unknown) { return trim(value).toUpperCase(); }
function intOr(value: unknown, fallback: number) { const parsed = Number.parseInt(trim(value), 10); return Number.isFinite(parsed) ? parsed : fallback; }
function numOr(value: unknown) { const text = trim(value); if (!text) return null; const parsed = Number(text); return Number.isFinite(parsed) ? parsed : null; }
function redirectToLogin() { const url = new URL("./login.html", window.location.href); url.searchParams.set("redirect", window.location.href); window.location.replace(url.toString()); }
</script>
