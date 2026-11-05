/**
 * [临时] 设计探索取数：与 JobOverviewView 相同的接口与口径，输出扁平视图模型。
 * 选定方案后本文件与整个 ovx 目录一起删除，正式实现写回 JobOverviewView.vue。
 */
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { getSummary, listExecutors, listNodes, pageJobLogs, pageJobs } from "../api/jobApi";
import { isFlowRow, isScriptJob, cronDesc } from "../utils/jobFormat";
import { statusText } from "../constants/taskStatus";
import { resolveHostPath } from "../utils/hostPath";
import type { JobExecutor, JobLog, JobNode, JobRuntime, JobSummary } from "../types/job";
import type { OvData, OvDispatch, OvHourly, OvKpi, OvKpiPart } from "./types";

const FAILURE_WINDOW_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const LEDGER_PAGE_SIZE = 500;
const LEDGER_MAX_PAGES = 20;
const LOG_PAGE_SIZE = 500;
const LOG_MAX_PAGES = 4;

export function useOvxData() {
  const router = useRouter();

  const loading = ref(false);
  const summaryRaw = ref<JobSummary | null>(null);
  const jobs = ref<JobRuntime[]>([]);
  const logs = ref<JobLog[]>([]);
  const logTruncated = ref(false);
  const nodes = ref<JobNode[]>([]);
  const executors = ref<JobExecutor[]>([]);
  const updatedAt = ref("");
  const autoRefresh = ref(false);
  let timer: ReturnType<typeof setInterval> | null = null;

  async function loadJobs(): Promise<void> {
    const all: JobRuntime[] = [];
    for (let pageNum = 1; pageNum <= LEDGER_MAX_PAGES; pageNum++) {
      const page = await pageJobs({ pageNum, pageSize: LEDGER_PAGE_SIZE });
      const rows = Array.isArray(page?.data) ? page.data : [];
      all.push(...rows);
      const total = Number(page?.total ?? 0);
      if (rows.length < LEDGER_PAGE_SIZE || pageNum * LEDGER_PAGE_SIZE >= total) {
        break;
      }
    }
    jobs.value = all;
  }

  async function loadLogs(): Promise<void> {
    const startTime = Date.now() - FAILURE_WINDOW_MS;
    const all: JobLog[] = [];
    let truncated = false;
    for (let pageNum = 1; pageNum <= LOG_MAX_PAGES; pageNum++) {
      const page = await pageJobLogs({ pageNum, pageSize: LOG_PAGE_SIZE, startTime });
      const rows = Array.isArray(page?.data) ? page.data : [];
      all.push(...rows);
      const total = Number(page?.total ?? 0);
      if (rows.length < LOG_PAGE_SIZE || all.length >= total) {
        break;
      }
      if (pageNum === LOG_MAX_PAGES) {
        truncated = true;
      }
    }
    logs.value = all;
    logTruncated.value = truncated;
  }

  async function loadRegistry(): Promise<void> {
    try {
      nodes.value = await listNodes();
    } catch {
      nodes.value = [];
    }
    try {
      executors.value = await listExecutors();
    } catch {
      executors.value = [];
    }
  }

  async function reload(): Promise<void> {
    loading.value = true;
    try {
      const [sum] = await Promise.all([getSummary(), loadJobs(), loadLogs(), loadRegistry()]);
      summaryRaw.value = sum;
      updatedAt.value = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    } finally {
      loading.value = false;
    }
  }

  function setAutoRefresh(value: boolean): void {
    autoRefresh.value = value;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (value) {
      timer = setInterval(() => void reload(), 5000);
    }
  }

  function go(path: string): void {
    void router.push(resolveHostPath(router, path));
  }

  onMounted(() => void reload());

  /* ---------------- 派生 ---------------- */

  const jobNames = computed<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const job of jobs.value) {
      if (job.jobKey) {
        map[job.jobKey] = job.jobName || job.jobKey;
      }
    }
    return map;
  });

  const hourly = computed<OvHourly>(() => {
    const end = new Date();
    end.setMinutes(0, 0, 0);
    const base = end.getTime() - 23 * HOUR_MS;
    const labels: string[] = [];
    const dispatch: number[] = [];
    const failure: number[] = [];
    for (let i = 0; i < 24; i++) {
      const hour = new Date(base + i * HOUR_MS);
      labels.push(`${String(hour.getHours()).padStart(2, "0")}:00`);
      dispatch.push(0);
      failure.push(0);
    }
    for (const log of logs.value) {
      const time = Number(log.triggerTime ?? 0);
      if (!time) {
        continue;
      }
      const index = Math.floor((time - base) / HOUR_MS);
      if (index < 0 || index >= dispatch.length) {
        continue;
      }
      const code = String(log.executeCode ?? "").toUpperCase();
      if (code === "FAILURE") {
        failure[index] += 1;
        dispatch[index] += 1;
      } else if (code === "SUCCESS") {
        dispatch[index] += 1;
      }
    }
    let cumDispatch = 0;
    let cumFailure = 0;
    const cumD: number[] = [];
    const cumF: number[] = [];
    for (let i = 0; i < 24; i++) {
      cumDispatch += dispatch[i];
      cumFailure += failure[i];
      cumD.push(cumDispatch);
      cumF.push(cumFailure);
    }
    return {
      labels,
      dispatch,
      failure,
      cumDispatch: cumD,
      cumFailure: cumF,
      totalDispatch: cumDispatch,
      totalFailure: cumFailure,
      nowIndex: 23,
    };
  });

  function hourIndexAt(time: number): number {
    const end = new Date();
    end.setMinutes(0, 0, 0);
    const base = end.getTime() - 23 * HOUR_MS;
    const index = Math.floor((time - base) / HOUR_MS);
    return index >= 0 && index < 24 ? index : -1;
  }

  const notable = computed(() => {
    const counts = new Map<string, { count: number; last: number }>();
    for (const log of logs.value) {
      const key = log.jobKey ?? "";
      const time = Number(log.triggerTime ?? 0);
      if (!key || !time) {
        continue;
      }
      const entry = counts.get(key) ?? { count: 0, last: 0 };
      entry.count += 1;
      entry.last = Math.max(entry.last, time);
      counts.set(key, entry);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 2)
      .map(([key, entry]) => ({
        key,
        name: jobNames.value[key] || key,
        count: entry.count,
        at: entry.last,
        index: hourIndexAt(entry.last),
      }));
  });

  const summary = computed(() => {
    const s = summaryRaw.value;
    return {
      ready: Boolean(s),
      role: String(s?.role ?? ""),
      nodeId: String(s?.nodeId ?? ""),
      group: String(s?.group ?? ""),
      leader: Boolean(s?.leader),
      scanIntervalMs: Number(s?.scanIntervalMs ?? 0),
      preReadMs: Number(s?.preReadMs ?? 0),
      totalJobs: Number(s?.totalJobs ?? 0),
      runningJobs: Number(s?.runningJobs ?? 0),
      stoppedJobs: Number(s?.stoppedJobs ?? 0),
      localJobs: Number(s?.localJobs ?? 0),
      remoteJobs: Number(s?.remoteJobs ?? 0),
      unregisteredJobs: Number(s?.unregisteredJobs ?? 0),
      unclaimedRemoteJobs: Number(s?.unclaimedRemoteJobs ?? 0),
      registeredHandlers: Number(s?.registeredHandlers ?? 0),
      recentFailures: Number(s?.recentFailures ?? 0),
      remoteDispatchOwnedByMe: Boolean(s?.remoteDispatchOwnedByMe),
      onlineExecutors: Array.isArray(s?.onlineExecutors) ? s.onlineExecutors : [],
    };
  });

  const kpis = computed<OvKpi[]>(() => {
    const s = summary.value;
    const h = hourly.value;
    const num = (value: number) => value.toLocaleString("zh-CN");
    const covered = Math.max(s.runningJobs - s.unregisteredJobs, 0);
    const gradientOf = (parts: OvKpiPart[]) => {
      const total = parts.reduce((sum, item) => sum + Math.max(item.value, 0), 0);
      const stops: string[] = [];
      let from = 0;
      for (const part of parts) {
        const pct = total <= 0 ? (part === parts[parts.length - 1] ? 100 : 0) : (Math.max(part.value, 0) / total) * 100;
        const to = from + pct;
        stops.push(`${part.color} ${from}%`, `${part.color} ${to}%`);
        from = to;
      }
      return `linear-gradient(90deg, ${stops.join(", ")})`;
    };
    const totalParts: OvKpiPart[] = [
      { label: "启用", value: s.runningJobs, color: "var(--brand-500)" },
      { label: "停用", value: s.stoppedJobs, color: "var(--border-default)" },
    ];
    const dispatchParts: OvKpiPart[] = [
      { label: "本地", value: s.localJobs, color: "var(--brand-500)" },
      { label: "远程", value: s.remoteJobs, color: "var(--metric-net)" },
    ];
    const handlerParts: OvKpiPart[] = [
      { label: "已覆盖", value: covered, color: "var(--status-success)" },
      { label: "未注册", value: s.unregisteredJobs, color: "var(--status-warning)" },
    ];
    return [
      {
        key: "total",
        title: "台账任务",
        value: s.ready ? num(s.totalJobs) : "—",
        desc: `启用 ${s.runningJobs} · 停用 ${s.stoppedJobs}`,
        icon: "AlarmClock",
        tone: "brand",
        path: "/collect/job",
        parts: totalParts,
        gradient: gradientOf(totalParts),
        spark: null,
        sparkColor: "var(--brand-500)",
      },
      {
        key: "dispatch",
        title: "本地 / 远程",
        value: s.ready ? `${s.localJobs} / ${s.remoteJobs}` : "—",
        desc: s.remoteDispatchOwnedByMe ? "远程行由本节点下发" : `本机不领取 ${s.unclaimedRemoteJobs} 个`,
        icon: "Connection",
        tone: "brand",
        path: "/collect/job",
        parts: dispatchParts,
        gradient: gradientOf(dispatchParts),
        spark: null,
        sparkColor: "var(--brand-500)",
      },
      {
        key: "fail",
        title: "24 小时失败",
        value: num(h.totalFailure),
        desc: h.totalFailure > 0 ? "看「最近派发」定位" : "暂无失败派发",
        icon: "WarningFilled",
        tone: h.totalFailure > 0 ? "error" : "success",
        path: "/collect/job-log",
        parts: null,
        gradient: null,
        spark: h.failure,
        sparkColor: "var(--status-error)",
      },
      {
        key: "unregistered",
        title: "未注册处理器",
        value: num(s.unregisteredJobs),
        desc: s.unregisteredJobs > 0
          ? "这些任务每一拍都会被跳过"
          : `启用任务都有同名处理器（${s.registeredHandlers} 个）`,
        icon: "Cpu",
        tone: s.unregisteredJobs > 0 ? "warning" : "success",
        path: "/collect/job",
        parts: handlerParts,
        gradient: gradientOf(handlerParts),
        spark: null,
        sparkColor: "var(--status-warning)",
      },
    ];
  });

  const facts = computed(() => {
    const s = summary.value;
    if (!s.ready) {
      return [];
    }
    return [
      { label: "节点角色", value: `${s.role || "—"}${s.leader ? " · Leader" : " · Follower"}` },
      { label: "扫描节奏", value: `${s.scanIntervalMs}ms` },
      { label: "已注册处理器", value: `${s.registeredHandlers} 个` },
      { label: "在线执行器", value: `${s.onlineExecutors.length} 个` },
    ];
  });

  const alert = computed(() => {
    const s = summary.value;
    if (!s.ready) {
      return "未取到调度概览，说明 job-starter 治理接口在当前后端未启用";
    }
    if (!s.leader) {
      return `${s.role || "—"} 角色 · 本节点不是 Leader，到点任务不会被派发`;
    }
    if (s.unregisteredJobs > 0) {
      return `${s.unregisteredJobs} 个启用任务没有同名处理器，每一拍都会被跳过`;
    }
    if (s.unclaimedRemoteJobs > 0) {
      return `${s.unclaimedRemoteJobs} 个启用的远程任务本节点不领取，只由调度中心节点下发`;
    }
    return "";
  });

  const runtimeRows = computed(() => {
    const s = summary.value;
    if (!s.ready) {
      return [];
    }
    return [
      { label: "角色", value: `${s.role || "—"}${s.leader ? " · Leader" : " · Follower"}` },
      { label: "节点", value: s.nodeId || "—" },
      { label: "分组", value: s.group || "—" },
      { label: "扫描节奏", value: `每 ${s.scanIntervalMs}ms · 预读 ${s.preReadMs}ms` },
      { label: "分发", value: `本地 ${s.localJobs} · 远程 ${s.remoteJobs}` },
    ];
  });

  const upcoming = computed(() => jobs.value
    .filter(job => job.enabled && job.nextFireTime)
    .sort((a, b) => Number(a.nextFireTime) - Number(b.nextFireTime))
    .slice(0, 10)
    .map(job => ({
      jobKey: job.jobKey,
      jobName: job.jobName || job.jobKey,
      isFlow: isFlowRow(job),
      scheduleText: scheduleCellText(job),
      scheduleType: String(job.scheduleType ?? ""),
      nextFireTime: job.nextFireTime,
      lastFireTime: job.lastFireTime ?? null,
      handlerRegistered: job.handlerRegistered !== false,
      dispatchMode: job.dispatchMode ?? null,
    })));

  function scheduleCellText(row: JobRuntime): string {
    if (row.scheduleType === "NONE" || !row.scheduleTime) {
      return "不自动调度";
    }
    if (row.scheduleType === "CRON") {
      const desc = cronDesc(row.scheduleTime);
      return desc ? `${row.scheduleTime} · ${desc}` : row.scheduleTime;
    }
    return `${row.scheduleType} · ${row.scheduleTime}ms`;
  }

  const stoppedHint = computed(() => {
    const stopped = summary.value.stoppedJobs;
    return stopped > 0 ? `另有 ${stopped} 个任务已停用，不参与调度` : "";
  });

  const dispatches = computed<OvDispatch[]>(() => logs.value.slice(0, 10).map(log => ({
    logId: String(log.logId ?? ""),
    triggerTime: log.triggerTime ?? null,
    jobKey: String(log.jobKey ?? ""),
    jobName: jobNames.value[String(log.jobKey ?? "")] || String(log.jobKey ?? "") || "—",
    executor: String(log.nodeId || log.address || "—"),
    costMs: log.costMs ?? null,
    executeCode: String(log.executeCode ?? ""),
    statusText: statusText(log.executeCode),
    triggerType: log.triggerType ?? null,
    message: log.message ?? null,
  })));

  const nodesView = computed(() => nodes.value.map(node => ({
    clientId: String(node.clientId ?? ""),
    nodeId: String(node.nodeId || node.clientId || ""),
    role: String(node.role || "EXECUTOR"),
    handlerCount: Number(node.handlerCount ?? 0),
    online: node.online !== false,
    serverUrl: node.serverUrl ?? null,
    registeredAt: Number(node.registeredAt ?? 0),
  })));

  const executorsView = computed(() => executors.value.map(item => ({
    name: String(item.name ?? ""),
    desc: String(item.desc ?? ""),
    handlerClass: item.handlerClass ?? null,
    source: String(item.source ?? "ANNOTATION"),
  })));

  const ledger = computed(() => {
    const rows = jobs.value;
    const unregistered = rows
      .filter(job => job.enabled && job.handlerRegistered === false)
      .map(job => job.jobName || job.jobKey)
      .slice(0, 6);
    return {
      running: rows.filter(job => job.enabled).length,
      stopped: rows.filter(job => !job.enabled).length,
      local: rows.filter(job => String(job.dispatchMode ?? "LOCAL").toUpperCase() !== "REMOTE").length,
      remote: rows.filter(job => String(job.dispatchMode ?? "").toUpperCase() === "REMOTE").length,
      unregisteredSample: unregistered,
      flowJobs: rows.filter(job => isFlowRow(job)).length,
      beanJobs: rows.filter(job => !isScriptJob(job)).length,
      scriptJobs: rows.filter(job => isScriptJob(job)).length,
    };
  });

  const data = computed<OvData>(() => ({
    loading: loading.value,
    updatedAt: updatedAt.value,
    autoRefresh: autoRefresh.value,
    setAutoRefresh,
    reload: () => void reload(),
    go,
    summary: summary.value,
    kpis: kpis.value,
    facts: facts.value,
    alert: alert.value,
    runtimeRows: runtimeRows.value,
    hourly: hourly.value,
    notable: notable.value,
    upcoming: upcoming.value,
    stoppedHint: stoppedHint.value,
    dispatches: dispatches.value,
    nodes: nodesView.value,
    executors: executorsView.value,
    logCount: logs.value.length,
    jobCount: jobs.value.length,
    logTruncated: logTruncated.value,
    ledger: ledger.value,
  }));

  /** 供方案内部复用的时刻格式化 */
  return { data, loading };
}
