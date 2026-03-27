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
        <button type="button" class="spring-primary-button" @click="openEditor('create')">新建任务</button>
      </div>
    </header>

    <section class="spring-toolbar spring-card">
      <label class="spring-field">
        <span>命名空间</span>
        <select v-model="namespace" :disabled="loadingNamespaces">
          <option value="">{{ loadingNamespaces ? "加载中..." : "请选择命名空间" }}</option>
          <option v-for="item in namespaces" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>
      <label class="spring-field">
        <span>任务筛选</span>
        <input v-model.trim="filters.keyword" type="text" placeholder="任务编号 / Bean / 名称">
      </label>
      <label class="spring-field">
        <span>状态</span>
        <select v-model="filters.status">
          <option value="">全部</option>
          <option value="running">运行中</option>
          <option value="stopped">已停止</option>
          <option value="success">最近成功</option>
          <option value="failure">最近失败</option>
        </select>
      </label>
      <label class="spring-field">
        <span>分发</span>
        <select v-model="filters.dispatch">
          <option value="">全部</option>
          <option value="LOCAL">本地</option>
          <option value="REMOTE">远程</option>
        </select>
      </label>
      <div class="spring-toolbar-actions">
        <button type="button" class="spring-ghost-button" @click="refreshTasks">刷新</button>
      </div>
    </section>

    <section class="spring-metrics">
      <article class="spring-metric-card spring-card">
        <span class="spring-metric-label">任务总数</span>
        <strong class="spring-metric-value">{{ filteredTasks.length }}</strong>
        <small>当前命名空间内所有任务</small>
      </article>
      <article class="spring-metric-card spring-card">
        <span class="spring-metric-label">运行中</span>
        <strong class="spring-metric-value spring-accent-green">{{ runningCount }}</strong>
        <small>已启用并等待调度</small>
      </article>
      <article class="spring-metric-card spring-card">
        <span class="spring-metric-label">远程分发</span>
        <strong class="spring-metric-value spring-accent-blue">{{ remoteCount }}</strong>
        <small>由调度中心下发执行</small>
      </article>
      <article class="spring-metric-card spring-card">
        <span class="spring-metric-label">最近失败</span>
        <strong class="spring-metric-value spring-accent-amber">{{ failureCount }}</strong>
        <small>最近一次执行状态为 FAILURE</small>
      </article>
    </section>

    <section class="spring-layout-grid">
      <article class="spring-panel spring-card">
        <div class="spring-panel-header">
          <div>
            <h2>任务列表</h2>
            <p>支持命名空间切换、本地与远程分发识别、快速启停和触发。</p>
          </div>
          <span class="spring-panel-meta">{{ filteredTasks.length }} 条</span>
        </div>
        <div class="spring-table-shell">
          <table class="spring-table">
            <thead>
              <tr>
                <th>任务编号</th>
                <th>任务</th>
                <th>调度</th>
                <th>分发</th>
                <th>下次执行</th>
                <th>最近结果</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loadingTasks">
                <td colspan="6" class="spring-empty-cell">正在加载任务...</td>
              </tr>
              <tr v-else-if="!filteredTasks.length">
                <td colspan="6" class="spring-empty-cell">{{ namespace ? "当前筛选条件下没有任务。" : "请先选择命名空间。" }}</td>
              </tr>
              <tr
                v-for="task in filteredTasks"
                v-else
                :key="task.jobNo || task.taskKey || task.taskName"
                :class="{ 'spring-active-row': isSelected(task) }"
                @click="selectedTask = task"
              >
                <td>
                  <div class="spring-table-title">
                    <span class="spring-title-strong">{{ task.jobNo || "-" }}</span>
                    <span class="spring-muted-line">{{ task.taskKey || "-" }}</span>
                  </div>
                </td>
                <td>
                  <div class="spring-table-title">
                    <span class="spring-title-strong">{{ task.taskName || "未命名任务" }}</span>
                    <span class="spring-muted-line">{{ task.description || "无描述" }}</span>
                  </div>
                </td>
                <td>
                  <div class="spring-table-title">
                    <span class="spring-chip">{{ task.scheduleType || "CRON" }}</span>
                    <span class="spring-muted-line">{{ task.cronExpression || "手动触发" }}</span>
                  </div>
                </td>
                <td>
                  <div class="spring-table-title">
                    <span class="spring-chip" :class="{ 'spring-remote': upper(task.dispatchMode) === 'REMOTE' }">
                      {{ task.dispatchMode || "LOCAL" }}
                    </span>
                    <span class="spring-muted-line">{{ task.storageMode || "DATABASE" }}</span>
                  </div>
                </td>
                <td>{{ formatDateTime(task.nextExecutionTime) || "-" }}</td>
                <td>
                  <div class="spring-table-title">
                    <span class="spring-chip" :class="statusClass(task)">
                      {{ task.enabled ? "RUNNING" : "STOPPED" }}
                    </span>
                    <span class="spring-muted-line">{{ task.lastRunStatus || "暂无执行" }}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <aside class="spring-side-column">
        <article class="spring-panel spring-card">
          <div class="spring-panel-header">
            <div>
              <h2>任务详情</h2>
              <p>核心配置和当前运行状态</p>
            </div>
            <span class="spring-panel-meta">{{ selectedJob?.jobTriggerStatus === 1 ? "运行中" : selectedJob ? "已停止" : "未选择" }}</span>
          </div>
          <div v-if="selectedJob" class="spring-detail-content">
            <div class="spring-detail-grid">
              <div v-for="item in detailItems" :key="item.label" class="spring-detail-item">
                <small>{{ item.label }}</small>
                <strong>{{ item.value }}</strong>
              </div>
            </div>
          </div>
          <div v-else class="spring-detail-content spring-empty-state">请选择左侧任务查看详情。</div>
          <div v-if="selectedJob" class="spring-detail-actions">
            <button type="button" class="spring-ghost-button" @click="runAction('start')">启动</button>
            <button type="button" class="spring-ghost-button" @click="runAction('stop')">停止</button>
            <button type="button" class="spring-primary-button" @click="runAction('trigger')">立即执行</button>
            <button type="button" class="spring-ghost-button" @click="openEditor('edit')">编辑</button>
          </div>
        </article>

        <article class="spring-panel spring-card">
          <div class="spring-panel-header">
            <div>
              <h2>最近日志</h2>
              <p>默认跟随当前选中任务</p>
            </div>
            <button type="button" class="spring-text-button" @click="loadLogs">{{ loadingLogs ? "加载中..." : "刷新日志" }}</button>
          </div>
          <div class="spring-log-list">
            <div v-if="loadingLogs" class="spring-empty-state">正在加载日志...</div>
            <div v-else-if="!logs.length" class="spring-empty-state">{{ selectedTask ? "当前任务暂无日志。" : "请选择任务后查看日志。" }}</div>
            <article v-for="log in logs" v-else :key="log.jobLogNo || String(log.jobLogId)" class="spring-log-card">
              <div class="spring-log-card-head">
                <div class="spring-table-title">
                  <span class="spring-title-strong">{{ log.jobLogNo || `LOG-${log.jobLogId || "-"}` }}</span>
                  <span class="spring-muted-line">{{ formatDateTime(log.jobLogTriggerTime) || "-" }}</span>
                </div>
                <span class="spring-chip" :class="statusClass({ enabled: log.jobLogExecuteCode === 'SUCCESS', lastRunStatus: log.jobLogExecuteCode || log.jobLogTriggerCode })">
                  {{ log.jobLogExecuteCode || log.jobLogTriggerCode || "UNKNOWN" }}
                </span>
              </div>
              <p>{{ log.jobLogTriggerMsg || "暂无执行消息" }}</p>
              <p class="spring-muted-line">{{ log.jobLogTriggerBean || "-" }} · 耗时 {{ log.jobLogCost != null ? `${log.jobLogCost} ms` : "-" }}</p>
            </article>
          </div>
        </article>
      </aside>
    </section>

    <div v-if="editorVisible" class="spring-modal-backdrop" @click.self="editorVisible = false">
      <div class="spring-modal-card">
        <div class="spring-modal-header">
          <div>
            <h3>{{ editorMode === "edit" ? `编辑任务 · ${selectedJob?.jobNo || ""}` : "新建任务" }}</h3>
            <p>这里保留常用字段，复杂参数仍然建议走平台 API 或高级页面。</p>
          </div>
          <button type="button" class="spring-icon-button" @click="editorVisible = false">×</button>
        </div>
        <form class="spring-modal-form" @submit.prevent="saveJob">
          <div class="spring-form-grid">
            <label class="spring-form-field"><span>任务编号</span><input v-model.trim="form.jobNo" :readonly="editorMode === 'edit'" type="text" placeholder="留空则自动生成"></label>
            <label class="spring-form-field"><span>任务名称</span><input v-model.trim="form.jobName" type="text" required placeholder="例如：支付超时清理"></label>
            <label class="spring-form-field"><span>调度类型</span><select v-model="form.jobScheduleType"><option value="CRON">CRON</option><option value="FIXED">FIXED</option><option value="FIXED_MS">FIXED_MS</option><option value="DELAY">DELAY</option><option value="AT">AT</option><option value="NONE">NONE</option></select></label>
            <label class="spring-form-field"><span>调度配置</span><input v-model.trim="form.jobScheduleTime" type="text" placeholder="Cron、秒数、毫秒数或绝对时间"></label>
            <label class="spring-form-field"><span>Glue 类型</span><select v-model="form.jobGlueType"><option value="BEAN">BEAN</option><option value="GLUE_GROOVY">GLUE_GROOVY</option><option value="GLUE_SHELL">GLUE_SHELL</option><option value="GLUE_POWERSHELL">GLUE_POWERSHELL</option></select></label>
            <label class="spring-form-field"><span>执行 Bean</span><input v-model.trim="form.jobExecuteBean" :disabled="upper(form.jobGlueType) !== 'BEAN'" type="text" placeholder="Bean 任务必填"></label>
            <label class="spring-form-field"><span>分发模式</span><select v-model="form.jobDispatchMode"><option value="LOCAL">LOCAL</option><option value="REMOTE">REMOTE</option></select></label>
            <label class="spring-form-field"><span>存储模式</span><select v-model="form.jobStorageMode"><option value="DATABASE">DATABASE</option><option value="REDIS">REDIS</option></select></label>
            <label class="spring-form-field"><span>任务状态</span><select v-model="form.jobTriggerStatus"><option value="1">运行中</option><option value="0">停止</option></select></label>
            <label class="spring-form-field"><span>负责人</span><input v-model.trim="form.jobAuthor" type="text" placeholder="负责人"></label>
            <label class="spring-form-field spring-field-span-2"><span>任务描述</span><textarea v-model.trim="form.jobDesc" rows="4" placeholder="描述业务作用和注意事项" /></label>
            <label class="spring-form-field spring-field-span-2"><span>脚本源码 / Glue</span><textarea v-model.trim="form.jobGlueSource" rows="7" placeholder="脚本任务填写源码，Bean 任务可留空" /></label>
          </div>
          <div class="spring-modal-footer">
            <button type="button" class="spring-ghost-button" @click="editorVisible = false">取消</button>
            <button type="submit" class="spring-primary-button" :disabled="savingJob">{{ savingJob ? "保存中..." : "保存任务" }}</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="settingsVisible" class="spring-modal-backdrop" @click.self="settingsVisible = false">
      <div class="spring-modal-card spring-modal-card-small">
        <div class="spring-modal-header">
          <div>
            <h3>接口设置</h3>
            <p>默认走控制台会话 API，只有在直连平台接口时才需要额外填写认证头。</p>
          </div>
          <button type="button" class="spring-icon-button" @click="settingsVisible = false">×</button>
        </div>
        <form class="spring-modal-form" @submit.prevent="saveSettings">
          <div class="spring-form-grid">
            <label class="spring-form-field spring-field-span-2"><span>API 根路径</span><input v-model.trim="settings.apiRoot" type="text" placeholder="../job-console/api/"></label>
            <label class="spring-form-field"><span>Header 名称</span><input v-model.trim="settings.authHeaderName" type="text" placeholder="可选"></label>
            <label class="spring-form-field"><span>Header 值</span><input v-model.trim="settings.authHeaderValue" type="password" placeholder="可选"></label>
          </div>
          <div class="spring-modal-footer">
            <button type="button" class="spring-ghost-button" @click="settingsVisible = false">取消</button>
            <button type="submit" class="spring-primary-button">保存设置</button>
          </div>
        </form>
      </div>
    </div>

    <div class="spring-toast-stack">
      <div v-for="toast in toasts" :key="toast.id" class="spring-toast" :class="`spring-${toast.type}`">{{ toast.message }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";

type Task = Record<string, any>;
type LogRecord = Record<string, any>;

const props = withDefaults(defineProps<{ title?: string; description?: string; eyebrow?: string; defaultApiRoot?: string; storageKey?: string; }>(), {
  title: "Job Control Console",
  description: "在 Spring 模块内直接管理命名空间任务、调度表达式、远程分发和执行日志。",
  eyebrow: "Scheduler Starter",
  defaultApiRoot: "../job-console/api/",
  storageKey: "spring.pages.job-console.settings",
});

const loadingNamespaces = ref(false);
const loadingTasks = ref(false);
const loadingLogs = ref(false);
const savingJob = ref(false);
const editorVisible = ref(false);
const settingsVisible = ref(false);
const editorMode = ref<"create" | "edit">("create");
const namespaces = ref<string[]>([]);
const namespace = ref("");
const tasks = ref<Task[]>([]);
const selectedTask = ref<Task | null>(null);
const selectedJob = ref<Task | null>(null);
const logs = ref<LogRecord[]>([]);
const filters = reactive({ keyword: "", status: "", dispatch: "" });
const settings = reactive(loadSettings());
const form = reactive(createForm());
const toasts = ref<{ id: number; message: string; type: "success" | "error" | "info" }[]>([]);
let toastSeed = 0;

const filteredTasks = computed(() => tasks.value.filter((task) => {
  const keyword = filters.keyword.trim().toLowerCase();
  const keywordMatched = !keyword || [task.jobNo, task.taskKey, task.taskName, task.description].some((item) => String(item ?? "").toLowerCase().includes(keyword));
  const statusMatched = !filters.status || (filters.status === "running" ? Boolean(task.enabled) : filters.status === "stopped" ? !task.enabled : filters.status === "success" ? upper(task.lastRunStatus) === "SUCCESS" : filters.status === "failure" ? upper(task.lastRunStatus) === "FAILURE" : true);
  const dispatchMatched = !filters.dispatch || upper(task.dispatchMode) === filters.dispatch;
  return keywordMatched && statusMatched && dispatchMatched;
}));
const runningCount = computed(() => filteredTasks.value.filter((item) => item.enabled).length);
const remoteCount = computed(() => filteredTasks.value.filter((item) => upper(item.dispatchMode) === "REMOTE").length);
const failureCount = computed(() => filteredTasks.value.filter((item) => upper(item.lastRunStatus) === "FAILURE").length);
const detailItems = computed(() => {
  if (!selectedJob.value) return [];
  return [
    { label: "任务编号", value: selectedJob.value.jobNo || "-" },
    { label: "任务名称", value: selectedJob.value.jobName || "-" },
    { label: "执行 Bean", value: selectedJob.value.jobExecuteBean || "脚本模式 / 未设置" },
    { label: "调度类型", value: selectedJob.value.jobScheduleType || "CRON" },
    { label: "调度配置", value: selectedJob.value.jobScheduleTime || "手动触发" },
    { label: "分发模式", value: selectedJob.value.jobDispatchMode || "LOCAL" },
    { label: "存储模式", value: selectedJob.value.jobStorageMode || "DATABASE" },
    { label: "负责人", value: selectedJob.value.jobAuthor || "未配置" },
    { label: "任务描述", value: selectedJob.value.jobDesc || "无描述" },
  ];
});

watch(filteredTasks, (items) => {
  if (!items.length) {
    selectedTask.value = null;
    return;
  }
  const visible = selectedTask.value ? items.find((item) => sameTask(item, selectedTask.value)) : null;
  selectedTask.value = visible || items[0];
}, { immediate: true });

watch(namespace, async (value, oldValue) => {
  if (!value) {
    tasks.value = [];
    selectedTask.value = null;
    selectedJob.value = null;
    logs.value = [];
    return;
  }
  if (value !== oldValue) {
    await refreshTasks();
  }
});

watch(selectedTask, async () => {
  await loadDetail();
  await loadLogs();
});

onMounted(async () => {
  await loadNamespaces();
});

async function loadNamespaces() {
  loadingNamespaces.value = true;
  try {
    namespaces.value = normalizeArray(await request("namespaces"));
    if (!namespaces.value.length) {
      namespace.value = "";
      return;
    }
    if (!namespace.value || !namespaces.value.includes(namespace.value)) {
      namespace.value = namespaces.value[0] || "";
      return;
    }
    await refreshTasks();
  } catch (error) {
    notify(resolveError(error, "加载命名空间失败"), "error");
  } finally {
    loadingNamespaces.value = false;
  }
}

async function refreshTasks() {
  if (!namespace.value) return;
  loadingTasks.value = true;
  try {
    tasks.value = normalizeArray(await request(`${encodeURIComponent(namespace.value)}/task/list`));
  } catch (error) {
    tasks.value = [];
    selectedTask.value = null;
    selectedJob.value = null;
    logs.value = [];
    notify(resolveError(error, "加载任务失败"), "error");
  } finally {
    loadingTasks.value = false;
  }
}

async function loadDetail() {
  if (!namespace.value || !selectedTask.value?.jobNo) {
    selectedJob.value = null;
    return;
  }
  try {
    selectedJob.value = await request(`${encodeURIComponent(namespace.value)}/job/no/${encodeURIComponent(selectedTask.value.jobNo)}`);
  } catch (error) {
    selectedJob.value = null;
    notify(resolveError(error, "加载任务详情失败"), "error");
  }
}

async function loadLogs() {
  if (!namespace.value) {
    logs.value = [];
    return;
  }
  loadingLogs.value = true;
  try {
    const query = new URLSearchParams({ pageNum: "1", pageSize: "6" });
    if (selectedTask.value?.taskKey) query.set("beanName", selectedTask.value.taskKey);
    const payload = await request(`${encodeURIComponent(namespace.value)}/job-log/page?${query.toString()}`);
    logs.value = normalizeArray(payload?.records);
  } catch (error) {
    logs.value = [];
    notify(resolveError(error, "加载任务日志失败"), "error");
  } finally {
    loadingLogs.value = false;
  }
}

function openEditor(mode: "create" | "edit") {
  editorMode.value = mode;
  Object.assign(form, createForm());
  if (mode === "edit" && selectedJob.value) {
    Object.assign(form, {
      jobNo: trim(selectedJob.value.jobNo),
      jobName: trim(selectedJob.value.jobName),
      jobScheduleType: trim(selectedJob.value.jobScheduleType) || "CRON",
      jobScheduleTime: trim(selectedJob.value.jobScheduleTime),
      jobGlueType: trim(selectedJob.value.jobGlueType) || "BEAN",
      jobGlueSource: trim(selectedJob.value.jobGlueSource),
      jobExecuteBean: trim(selectedJob.value.jobExecuteBean),
      jobDispatchMode: trim(selectedJob.value.jobDispatchMode) || "LOCAL",
      jobStorageMode: trim(selectedJob.value.jobStorageMode) || "DATABASE",
      jobTriggerStatus: String(selectedJob.value.jobTriggerStatus ?? 1),
      jobAuthor: trim(selectedJob.value.jobAuthor),
      jobDesc: trim(selectedJob.value.jobDesc),
    });
  }
  editorVisible.value = true;
}

async function saveJob() {
  if (!namespace.value) {
    notify("请先选择命名空间", "info");
    return;
  }
  savingJob.value = true;
  const editing = editorMode.value === "edit" && selectedJob.value?.jobNo;
  const path = editing ? `${encodeURIComponent(namespace.value)}/job/no/${encodeURIComponent(selectedJob.value.jobNo)}` : `${encodeURIComponent(namespace.value)}/job`;
  try {
    await request(path, { method: editing ? "PUT" : "POST", body: JSON.stringify({ ...form, jobTriggerStatus: parseInteger(form.jobTriggerStatus, 1) }) });
    notify(editing ? "任务已更新" : "任务已创建", "success");
    editorVisible.value = false;
    await refreshTasks();
  } catch (error) {
    notify(resolveError(error, "保存任务失败"), "error");
  } finally {
    savingJob.value = false;
  }
}

async function runAction(action: "start" | "stop" | "trigger") {
  if (!namespace.value || !selectedTask.value?.jobNo) {
    notify("请先选择任务", "info");
    return;
  }
  const config = {
    start: { path: `${encodeURIComponent(namespace.value)}/job/no/${encodeURIComponent(selectedTask.value.jobNo)}/start`, message: "任务已启动" },
    stop: { path: `${encodeURIComponent(namespace.value)}/job/no/${encodeURIComponent(selectedTask.value.jobNo)}/stop`, message: "任务已停止" },
    trigger: { path: `${encodeURIComponent(namespace.value)}/job/no/${encodeURIComponent(selectedTask.value.jobNo)}/trigger`, message: "任务已触发" },
  }[action];
  try {
    await request(config.path, { method: "POST" });
    notify(config.message, "success");
    await refreshTasks();
  } catch (error) {
    notify(resolveError(error, "操作失败"), "error");
  }
}

function saveSettings() {
  settings.apiRoot = trim(settings.apiRoot) || props.defaultApiRoot;
  settings.authHeaderName = trim(settings.authHeaderName);
  settings.authHeaderValue = trim(settings.authHeaderValue);
  localStorage.setItem(props.storageKey, JSON.stringify(settings));
  settingsVisible.value = false;
  notify("接口设置已保存", "success");
  void loadNamespaces();
}

async function request(path: string, init?: RequestInit): Promise<any> {
  const headers = new Headers(init?.headers || {});
  if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (trim(settings.authHeaderName) && trim(settings.authHeaderValue)) headers.set(trim(settings.authHeaderName), trim(settings.authHeaderValue));
  const response = await fetch(buildApiUrl(path), { credentials: "include", ...init, headers });
  if (response.status === 401) {
    redirectToLogin();
    throw new Error("请先登录控制台");
  }
  const text = await response.text();
  const payload = text ? safeJsonParse(text) : null;
  if (!response.ok) throw new Error(resolveMessage(payload) || `请求失败: ${response.status}`);
  if (payload && typeof payload === "object" && "code" in payload) {
    const code = String(payload.code ?? "");
    if (!["00000", "200", "0"].includes(code)) throw new Error(resolveMessage(payload) || `业务请求失败: ${code}`);
    return "data" in payload ? payload.data : payload;
  }
  return payload;
}

function buildApiUrl(path: string) {
  const root = trim(settings.apiRoot) || props.defaultApiRoot;
  const normalized = root.endsWith("/") ? root : `${root}/`;
  return new URL(path.replace(/^\/+/, ""), new URL(normalized, window.location.href)).toString();
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(props.storageKey);
    const parsed = raw ? JSON.parse(raw) : {};
    const legacyApiRoot = trim(parsed.apiRoot);
    return {
      apiRoot: !legacyApiRoot || legacyApiRoot === "../v1/job-platform/" ? props.defaultApiRoot : legacyApiRoot,
      authHeaderName: trim(parsed.authHeaderName),
      authHeaderValue: trim(parsed.authHeaderValue),
    };
  } catch {
    return { apiRoot: props.defaultApiRoot, authHeaderName: "", authHeaderValue: "" };
  }
}

function redirectToLogin() {
  const loginUrl = new URL("./login.html", window.location.href);
  loginUrl.searchParams.set("redirect", window.location.href);
  window.location.replace(loginUrl.toString());
}

function createForm() {
  return { jobNo: "", jobName: "", jobScheduleType: "CRON", jobScheduleTime: "", jobGlueType: "BEAN", jobGlueSource: "", jobExecuteBean: "", jobDispatchMode: "LOCAL", jobStorageMode: "DATABASE", jobTriggerStatus: "1", jobAuthor: "", jobDesc: "" };
}

function notify(message: string, type: "success" | "error" | "info") {
  const id = ++toastSeed;
  toasts.value.push({ id, message, type });
  window.setTimeout(() => { toasts.value = toasts.value.filter((item) => item.id !== id); }, 3200);
}

function isSelected(task: Task) {
  return sameTask(task, selectedTask.value);
}

function sameTask(left: Task | null, right: Task | null) {
  if (!left || !right) return false;
  return Boolean((left.jobNo && right.jobNo && left.jobNo === right.jobNo) || (left.taskKey && right.taskKey && left.taskKey === right.taskKey));
}

function normalizeArray(value: any) {
  return Array.isArray(value) ? value : [];
}

function formatDateTime(value?: string) {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value).replace("T", " ") : parsed.toLocaleString("zh-CN", { hour12: false });
}

function statusClass(task: { enabled?: boolean; lastRunStatus?: string }) {
  if (upper(task.lastRunStatus) === "FAILURE") return "spring-failure";
  if (upper(task.lastRunStatus) === "SUCCESS") return "spring-success";
  return task.enabled ? "spring-running" : "spring-stopped";
}

function resolveMessage(payload: any) {
  if (!payload) return "";
  if (typeof payload === "string") return payload;
  return payload.message || payload.msg || payload.error || "";
}

function safeJsonParse(value: string) {
  try { return JSON.parse(value); } catch { return value; }
}

function resolveError(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function trim(value: unknown) {
  return value == null ? "" : String(value).trim();
}

function upper(value: unknown) {
  return trim(value).toUpperCase();
}

function parseInteger(value: string, fallback: number) {
  const parsed = Number.parseInt(trim(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}
</script>
