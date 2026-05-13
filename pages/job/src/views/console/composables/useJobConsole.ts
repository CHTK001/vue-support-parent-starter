import { computed, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type {
  ConsoleMetricItem,
  JobConsoleForm,
  JobConsoleProps,
  JobConsoleSettings,
  LogRecord,
  RailTabName,
  Task,
} from "../types";

export function useJobConsole(props: JobConsoleProps) {
  const loadingNamespaces = ref(false);
  const loadingTasks = ref(false);
  const loadingLogs = ref(false);
  const savingJob = ref(false);
  const editorVisible = ref(false);
  const editorMode = ref<"create" | "edit">("create");
  const activeRailTab = ref<RailTabName>("overview");
  const namespaces = ref<string[]>([]);
  const namespace = ref("");
  const tasks = ref<Task[]>([]);
  const selectedTask = ref<Task | null>(null);
  const selectedJob = ref<Task | null>(null);
  const logs = ref<LogRecord[]>([]);
  const logDetailsMap = ref<Record<string, any[]>>({});
  const loadingDetail = ref(false);
  const overviewLogs = ref<LogRecord[]>([]);
  const filters = reactive({ keyword: "", status: "", dispatch: "" });
  const includeDeleted = ref(false);
  const settings = reactive(loadSettings(props));
  const form = reactive(createForm());
  const namespaceInfo = ref<{
    hasRemoteExecutors: boolean;
    schedulerMode: string;
    dataSource: string;
    group: string | null;
    executors: Array<{ name: string; baseUrl: string }>;
  } | null>(null);

  const filteredTasks = computed(() =>
    tasks.value.filter(task => {
      const keyword = filters.keyword.trim().toLowerCase();
      const keywordMatched =
        !keyword
        || [task.jobNo, task.taskKey, task.taskName, task.description].some(item =>
          String(item ?? "").toLowerCase().includes(keyword),
        );
      const statusMatched =
        !filters.status
        || (filters.status === "running"
          ? Boolean(task.enabled)
          : filters.status === "stopped"
            ? !task.enabled
            : filters.status === "success"
              ? upper(task.lastRunStatus) === "SUCCESS"
              : filters.status === "failure"
                ? upper(task.lastRunStatus) === "FAILURE"
                : true);
      const dispatchMatched =
        !filters.dispatch || upper(task.dispatchMode) === filters.dispatch;
      return keywordMatched && statusMatched && dispatchMatched;
    }),
  );

  const runningCount = computed(
    () => filteredTasks.value.filter(item => item.enabled).length,
  );
  const successCount = computed(
    () =>
      filteredTasks.value.filter(item => upper(item.lastRunStatus) === "SUCCESS")
        .length,
  );
  const failureCount = computed(
    () =>
      filteredTasks.value.filter(item => upper(item.lastRunStatus) === "FAILURE")
        .length,
  );
  const remoteCount = computed(
    () =>
      filteredTasks.value.filter(item => upper(item.dispatchMode) === "REMOTE")
        .length,
  );
  const todayCount = computed(() => {
    const ymd = localDateStr(new Date());
    return logs.value.filter(log => {
      const t = log.jobLogTriggerTime || log.jobLogTriggerDate;
      return t != null && localDateStr(t) === ymd;
    }).length;
  });
  const todayExecutionCount = computed(() => {
    const ymd = localDateStr(new Date());
    return overviewLogs.value.filter(log => {
      const t = log.jobLogTriggerTime || log.jobLogTriggerDate;
      return t != null && localDateStr(t) === ymd;
    }).length;
  });
  const todaySuccessCount = computed(() => {
    const ymd = localDateStr(new Date());
    return overviewLogs.value.filter(log => {
      const t = log.jobLogTriggerTime || log.jobLogTriggerDate;
      return t != null && localDateStr(t) === ymd && upper(log.jobLogExecuteCode) === "SUCCESS";
    }).length;
  });
  const totalLogCount = computed(() => overviewLogs.value.length);
  const totalLogSuccessCount = computed(() =>
    overviewLogs.value.filter(log => upper(log.jobLogExecuteCode) === "SUCCESS").length,
  );
  const previewLogs = computed(() => logs.value.slice(0, 3));
  const namespaceLabel = computed(() =>
    namespace.value ? `命名空间 · ${namespace.value}` : "未选择命名空间",
  );
  const selectedTaskTitle = computed(
    () => selectedJob.value?.jobName || selectedTask.value?.taskName || "未选择任务",
  );
  const selectedTaskDescription = computed(
    () =>
      selectedJob.value?.jobDesc
      || selectedTask.value?.description
      || "左侧选择任务后可在这里查看调度节奏、执行方式和最近运行轨迹。",
  );
  const selectedStatusText = computed(() => {
    if (!selectedTask.value) return "未选择";
    return isTaskRunning(selectedTask.value, selectedJob.value) ? "运行中" : "已停止";
  });
  const selectedStatusClass = computed(() =>
    statusClass({
      enabled: isTaskRunning(selectedTask.value, selectedJob.value),
      lastRunStatus:
        selectedJob.value?.lastRunStatus || selectedTask.value?.lastRunStatus,
    }),
  );
  const focusMeta = computed<ConsoleMetricItem[]>(() => {
    if (!selectedTask.value) return [];
    return [
      { label: "任务编号", value: selectedJob.value?.jobNo || selectedTask.value?.jobNo || "-" },
      { label: "调度", value: selectedJob.value?.jobScheduleType || selectedTask.value?.scheduleType || "CRON" },
      { label: "下次执行", value: formatDateTime(selectedJob.value?.nextExecutionTime || selectedTask.value?.nextExecutionTime) || "未安排" },
      { label: "分发", value: selectedJob.value?.jobDispatchMode || selectedTask.value?.dispatchMode || "LOCAL" },
    ];
  });
  const overviewItems = computed<ConsoleMetricItem[]>(() => {
    if (!selectedTask.value) return [];
    return [
      { label: "Cron / 调度值", value: selectedJob.value?.jobScheduleTime || selectedTask.value?.cronExpression || "手动触发" },
      { label: "执行 Bean", value: selectedJob.value?.jobExecuteBean || selectedTask.value?.taskKey || "脚本模式 / 未设置" },
      { label: "Glue 类型", value: selectedJob.value?.jobGlueType || "BEAN" },
      { label: "存储模式", value: selectedJob.value?.jobStorageMode || selectedTask.value?.storageMode || "DATABASE" },
      { label: "负责人", value: selectedJob.value?.jobAuthor || "未配置" },
      { label: "最近状态", value: selectedJob.value?.lastRunStatus || selectedTask.value?.lastRunStatus || "暂无执行" },
    ];
  });
  const detailItems = computed<ConsoleMetricItem[]>(() => {
    if (!selectedTask.value) return [];
    return [
      { label: "任务编号", value: selectedJob.value?.jobNo || selectedTask.value?.jobNo || "-" },
      { label: "任务名称", value: selectedJob.value?.jobName || selectedTask.value?.taskName || "-" },
      { label: "执行 Bean", value: selectedJob.value?.jobExecuteBean || "脚本模式 / 未设置" },
      { label: "任务 Key", value: selectedTask.value?.taskKey || "-" },
      { label: "调度类型", value: selectedJob.value?.jobScheduleType || selectedTask.value?.scheduleType || "CRON" },
      { label: "调度配置", value: selectedJob.value?.jobScheduleTime || selectedTask.value?.cronExpression || "手动触发" },
      { label: "分发模式", value: selectedJob.value?.jobDispatchMode || selectedTask.value?.dispatchMode || "LOCAL" },
      { label: "存储模式", value: selectedJob.value?.jobStorageMode || selectedTask.value?.storageMode || "DATABASE" },
      { label: "最近状态", value: selectedJob.value?.lastRunStatus || selectedTask.value?.lastRunStatus || "暂无执行" },
      { label: "下次执行", value: formatDateTime(selectedJob.value?.nextExecutionTime || selectedTask.value?.nextExecutionTime) || "未安排" },
      { label: "负责人", value: selectedJob.value?.jobAuthor || "未配置" },
      { label: "任务描述", value: selectedJob.value?.jobDesc || selectedTask.value?.description || "无描述" },
    ];
  });
  const settingSummaryItems = computed<ConsoleMetricItem[]>(() => [
    { label: "API 根路径", value: trim(settings.apiRoot) || props.defaultApiRoot },
    { label: "认证 Header", value: trim(settings.authHeaderName) || "未配置" },
    { label: "Header 值", value: trim(settings.authHeaderValue) ? "已配置" : "未配置" },
    { label: "已加载命名空间", value: namespaces.value.length ? `${namespaces.value.length} 个` : "0 个" },
    { label: "当前命名空间", value: namespace.value || "未选择" },
    { label: "存储 Key", value: props.storageKey },
  ]);

  watch(
    filteredTasks,
    items => {
      if (!items.length) {
        selectedTask.value = null;
        return;
      }
      const visible = selectedTask.value
        ? items.find(item => sameTask(item, selectedTask.value))
        : null;
      selectedTask.value = visible || items[0];
    },
    { immediate: true },
  );

  watch(namespace, async (value, oldValue) => {
    if (!value) {
      tasks.value = [];
      selectedTask.value = null;
      selectedJob.value = null;
      logs.value = [];
      return;
    }
    if (value !== oldValue) await refreshTasks();
    await loadNamespaceInfo();
  });

  watch(selectedTask, async () => {
    await loadDetail();
    await loadLogs();
  });

  async function loadNamespaces() {
    loadingNamespaces.value = true;
    try {
      namespaces.value = normalizeArray(await request("namespaces", settings, props));
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

  async function loadNamespaceInfo() {
    if (!namespace.value) { namespaceInfo.value = null; return; }
    try {
      const info = await request(`${namespace.value}/config`, settings, props);
      namespaceInfo.value = info || null;
    } catch {
      namespaceInfo.value = null;
    }
  }

  async function refreshTasks() {
    if (!namespace.value) return;
    loadingTasks.value = true;
    try {
      const query = includeDeleted.value ? "?includeDeleted=true" : "";
      tasks.value = normalizeArray(
        await request(`${encodeURIComponent(namespace.value)}/task/list${query}`, settings, props),
      );
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
      selectedJob.value = await request(
        `${encodeURIComponent(namespace.value)}/job/no/${encodeURIComponent(selectedTask.value.jobNo)}`,
        settings,
        props,
      );
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
      const query = new URLSearchParams({ pageNum: "1", pageSize: "20" });
      if (selectedTask.value?.taskKey) query.set("beanName", selectedTask.value.taskKey);
      const payload = await request(
        `${encodeURIComponent(namespace.value)}/job-log/page?${query.toString()}`,
        settings,
        props,
      );
      logs.value = normalizeArray(payload?.records);
    } catch (error) {
      logs.value = [];
      notify(resolveError(error, "加载任务日志失败"), "error");
    } finally {
      loadingLogs.value = false;
    }
  }

  async function loadLogDetails(jobLogId: number | string) {
    if (!namespace.value || !jobLogId) return;
    const key = String(jobLogId);
    if (logDetailsMap.value[key]) return; // already loaded
    loadingDetail.value = true;
    try {
      const data = await request(
        `${encodeURIComponent(namespace.value)}/job-log/${jobLogId}/detail`,
        settings,
        props,
      );
      logDetailsMap.value[key] = normalizeArray(data);
    } catch {
      logDetailsMap.value[key] = [];
    } finally {
      loadingDetail.value = false;
    }
  }

  async function loadOverviewLogs() {
    if (!namespace.value) {
      overviewLogs.value = [];
      return;
    }
    try {
      const query = new URLSearchParams({ pageNum: "1", pageSize: "200" });
      const payload = await request(
        `${encodeURIComponent(namespace.value)}/job-log/page?${query.toString()}`,
        settings,
        props,
      );
      overviewLogs.value = normalizeArray(payload?.records);
    } catch {
      overviewLogs.value = [];
    }
  }

  function handleSelectTask(task: Task) {
    selectedTask.value = task;
    if (activeRailTab.value === "settings") activeRailTab.value = "overview";
  }

  function resetFilters() {
    filters.keyword = "";
    filters.status = "";
    filters.dispatch = "";
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
    const path = editing
      ? `${encodeURIComponent(namespace.value)}/job/no/${encodeURIComponent(selectedJob.value.jobNo)}`
      : `${encodeURIComponent(namespace.value)}/job`;
    try {
      await request(path, settings, props, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify({
          ...form,
          jobTriggerStatus: parseInteger(form.jobTriggerStatus, 1),
        }),
      });
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
    const suffix = action === "trigger" ? "trigger" : action;
    const path = `${encodeURIComponent(namespace.value)}/job/no/${encodeURIComponent(selectedTask.value.jobNo)}/${suffix}`;
    const messageMap = { start: "任务已启动", stop: "任务已停止", trigger: "任务已触发" };
    try {
      await request(path, settings, props, { method: "POST" });
      notify(messageMap[action], "success");
      await refreshTasks();
    } catch (error) {
      notify(resolveError(error, "操作失败"), "error");
    }
  }

  async function restoreTask(jobNo: string) {
    if (!namespace.value || !jobNo) {
      notify("请先选择任务", "info");
      return;
    }
    const path = `${encodeURIComponent(namespace.value)}/job/no/${encodeURIComponent(jobNo)}/restore`;
    try {
      await request(path, settings, props, { method: "POST" });
      notify("任务已恢复", "success");
      await refreshTasks();
    } catch (error) {
      notify(resolveError(error, "恢复失败"), "error");
    }
  }

  function saveSettings() {
    settings.apiRoot = trim(settings.apiRoot) || props.defaultApiRoot;
    settings.authHeaderName = trim(settings.authHeaderName);
    settings.authHeaderValue = trim(settings.authHeaderValue);
    localStorage.setItem(props.storageKey, JSON.stringify(settings));
    notify("接口设置已保存", "success");
    void loadNamespaces();
  }

  function restoreSettings() {
    Object.assign(settings, loadSettings(props));
  }

  function notify(message: string, type: "success" | "error" | "info") {
    ElMessage({ message, type, duration: 3200 });
  }

  return {
    activeRailTab,
    detailItems,
    editorMode,
    editorVisible,
    failureCount,
    filteredTasks,
    filters,
    focusMeta,
    form,
    handleSelectTask,
    includeDeleted,
    loadLogDetails,
    loadingDetail,
    loadingLogs,
    loadingNamespaces,
    loadingTasks,
    logDetailsMap,
    loadLogs,
    loadNamespaces,
    loadOverviewLogs,
    logs,
    namespace,
    namespaceInfo,
    namespaceLabel,
    namespaces,
    openEditor,
    overviewItems,
    overviewLogs,
    previewLogs,
    refreshTasks,
    remoteCount,
    resetFilters,
    restoreSettings,
    restoreTask,
    runAction,
    runningCount,
    saveJob,
    saveSettings,
    savingJob,
    selectedJob,
    selectedStatusClass,
    selectedStatusText,
    selectedTask,
    selectedTaskDescription,
    selectedTaskTitle,
    settingSummaryItems,
    settings,
    statusClass,
    successCount,
    todayCount,
    todayExecutionCount,
    todaySuccessCount,
    totalLogCount,
    totalLogSuccessCount,
  };
}

async function request(
  path: string,
  settings: JobConsoleSettings,
  props: JobConsoleProps,
  init?: RequestInit,
): Promise<any> {
  const headers = new Headers(init?.headers || {});
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (trim(settings.authHeaderName) && trim(settings.authHeaderValue)) {
    headers.set(trim(settings.authHeaderName), trim(settings.authHeaderValue));
  }
  const response = await fetch(buildApiUrl(path, settings, props), {
    credentials: "include",
    ...init,
    headers,
  });
  if (response.status === 401) {
    redirectToLogin();
    throw new Error("请先登录控制台");
  }
  const text = await response.text();
  const payload = text ? safeJsonParse(text) : null;
  if (!response.ok) throw new Error(resolveMessage(payload) || `请求失败: ${response.status}`);
  if (payload && typeof payload === "object" && "code" in payload) {
    const code = String(payload.code ?? "");
    if (!["00000", "200", "0"].includes(code)) {
      throw new Error(resolveMessage(payload) || `业务请求失败: ${code}`);
    }
    return "data" in payload ? payload.data : payload;
  }
  return payload;
}

function buildApiUrl(path: string, settings: JobConsoleSettings, props: JobConsoleProps) {
  const root = trim(settings.apiRoot) || props.defaultApiRoot;
  const normalized = root.endsWith("/") ? root : `${root}/`;
  return new URL(path.replace(/^\/+/, ""), new URL(normalized, window.location.href)).toString();
}

function loadSettings(props: JobConsoleProps): JobConsoleSettings {
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

function createForm(): JobConsoleForm {
  return {
    jobNo: "",
    jobName: "",
    jobScheduleType: "CRON",
    jobScheduleTime: "",
    jobGlueType: "BEAN",
    jobGlueSource: "",
    jobExecuteBean: "",
    jobDispatchMode: "LOCAL",
    jobStorageMode: "DATABASE",
    jobTriggerStatus: "1",
    jobAuthor: "",
    jobDesc: "",
  };
}

function redirectToLogin() {
  const loginUrl = new URL("./login.html", window.location.href);
  loginUrl.searchParams.set("redirect", window.location.href);
  window.location.replace(loginUrl.toString());
}

function normalizeArray(value: any) {
  return Array.isArray(value) ? value : [];
}

function isTaskRunning(task?: Task | null, job?: Task | null) {
  return Boolean(job?.jobTriggerStatus === 1 || task?.enabled);
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
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function resolveError(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function sameTask(left: Task | null, right: Task | null) {
  if (!left || !right) return false;
  return Boolean(
    (left.jobNo && right.jobNo && left.jobNo === right.jobNo)
    || (left.taskKey && right.taskKey && left.taskKey === right.taskKey),
  );
}

function formatDateTime(value?: string) {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? String(value).replace("T", " ")
    : parsed.toLocaleString("zh-CN", { hour12: false });
}

function localDateStr(value: Date | number | string): string {
  const d = typeof value === 'object' ? value : new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
