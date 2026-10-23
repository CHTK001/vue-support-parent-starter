<!--
  调度总览：调度中心的落地页，只看「这一台节点在调度链路里的健康度」。

  数据全部来自现网接口：
  - 节点身份与计数取 /v2/scheduler/summary 一份概览
  - 台账分页拉全后本地算「即将触发」（启用任务按 nextFireTime 升序取前 N）
  - 近 24 小时日志（不限状态码）分页拉全，一份数据同时喂「每小时趋势」与「最近派发」列表
  - 执行器与处理器清单取 /nodes 与 /executors，两个辅助面板取数失败不影响整页

  与平台总览的分工：平台总览回答「采集平台整体怎么样」，本页只回答调度面——谁在派发、下一拍是什么、
  失败集中在哪个时段、哪些启用任务其实没有处理器。因此每个面板都带一个直达对应明细页的入口。
-->
<script setup lang="ts">
import { computed, onActivated, onDeactivated, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import ReButton from "@repo/ui/re-button";
import ReEcharts from "@repo/ui/re-echarts";
import ReIcon from "@repo/ui/re-icon";
import ReSwitch from "@repo/ui/re-switch";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import ReTime from "@repo/ui/re-time";
import type { ReTableColumn } from "@repo/ui/re-table";
import FireCountdown from "../components/FireCountdown.vue";
import OvSpark from "../components/OvSpark.vue";
import { getSummary, listExecutors, listNodes, pageJobLogs, pageJobs } from "../api/jobApi";
import { costMs, statusTagType, statusText } from "../constants/taskStatus";
import type { JobExecutor, JobLog, JobNode, JobRuntime, JobSummary } from "../types/job";
import { useCollectView, errText } from "../composables/useCollectView";
import { cronDesc, isFlowRow, scheduleText } from "../utils/jobFormat";
import { fmtFireShort, fmtMs } from "../utils/time";
import { resolveHostPath } from "../utils/hostPath";

/** ECharts 配置类型从组件实例的 props 反推：app 未直接依赖 echarts，不引它的类型入口 */
type ChartOption = InstanceType<typeof ReEcharts>["$props"]["option"];

defineOptions({ name: "CollectJobOverview" });

const router = useRouter();

/** 日志观测窗口与趋势分桶粒度 */
const FAILURE_WINDOW_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

/** 台账分页拉全的页大小与页数上限（单页上限 500 由后端约定） */
const LEDGER_PAGE_SIZE = 500;
const LEDGER_MAX_PAGES = 20;

/** 日志分页拉全的页数上限：趋势图不需要把整表读回浏览器 */
const LOG_PAGE_SIZE = 500;
const LOG_MAX_PAGES = 4;

const summary = ref<JobSummary | null>(null);
const jobs = ref<JobRuntime[]>([]);
const logs = ref<JobLog[]>([]);
const logTruncated = ref(false);
const nodes = ref<JobNode[]>([]);
const executors = ref<JobExecutor[]>([]);
const registryError = ref("");
const updatedAt = ref("");
const autoRefresh = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

/** 台账分页拉全，供「即将触发」排序与启停计数 */
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

/** 近 24 小时日志分页拉全（不限状态码）；到上限即停并标记截断 */
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

/** 执行器与处理器清单：辅助面板，取数失败只让对应面板显示提示，不拖垮整页 */
async function loadRegistry(): Promise<void> {
  try {
    nodes.value = await listNodes();
  } catch (error) {
    nodes.value = [];
    registryError.value = errText(error);
  }
  try {
    executors.value = await listExecutors();
  } catch {
    executors.value = [];
  }
}

const { loading, reload } = useCollectView(async () => {
  const [sum] = await Promise.all([getSummary(), loadJobs(), loadLogs(), loadRegistry()]);
  summary.value = sum;
  updatedAt.value = new Date().toLocaleTimeString("zh-CN", { hour12: false });
});

/** keep-alive 命中后挂载只跑一次，重进页面靠激活钩子重取 */
let firstActivation = true;
onActivated(() => {
  if (firstActivation) {
    firstActivation = false;
    return;
  }
  void reload();
  if (autoRefresh.value) {
    toggleAuto(true);
  }
});
onDeactivated(() => toggleAuto(false));

/* ============ 图表配色：canvas 不认 CSS 变量，读真实色值 ============ */

/** 暗色类名变化时重算图表配色 */
const themeTick = ref(0);
let themeObserver: MutationObserver | null = null;

onMounted(() => {
  if (typeof MutationObserver === "undefined") {
    return;
  }
  themeObserver = new MutationObserver(() => {
    themeTick.value += 1;
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
});

onUnmounted(() => {
  themeObserver?.disconnect();
  themeObserver = null;
});

/** 读一个 koi 令牌的真实值（canvas 用）；读不到时回落兜底色 */
function koiColor(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

const chartPalette = computed(() => {
  void themeTick.value; // 建立依赖：暗色类名变化时整体重算
  return {
    brand: koiColor("--brand-500", "#6d5dfc"),
    error: koiColor("--status-error", "#ff4c4c"),
    axis: koiColor("--text-secondary", "#5c6270"),
    axisLine: koiColor("--border-default", "#e3e6ef"),
    split: koiColor("--border-subtle", "#eef0f6"),
    tipBg: koiColor("--bg-elevated", "#fbfbff"),
    tipText: koiColor("--text-primary", "#1f2430"),
  };
});

/* ============ KPI ============ */

interface KpiPart {
  label: string;
  value: number;
  color: string;
}

interface Kpi {
  key: string;
  title: string;
  value: string;
  desc: string;
  icon: string;
  tone: "brand" | "success" | "warning" | "error";
  path: string;
  visual:
    | { kind: "ratio"; parts: KpiPart[]; gradient: string }
    | { kind: "spark"; values: number[]; color: string };
}

const kpis = computed<Kpi[]>(() => {
  const s = summary.value;
  const h = hourly.value;
  const num = (value: number | undefined) => (value ?? 0).toLocaleString("zh-CN");
  const running = s?.runningJobs ?? 0;
  const stopped = s?.stoppedJobs ?? 0;
  const local = s?.localJobs ?? 0;
  const remote = s?.remoteJobs ?? 0;
  const unreg = s?.unregisteredJobs ?? 0;
  const handlers = s?.registeredHandlers ?? 0;
  const covered = Math.max(running - unreg, 0);
  const ratio = (parts: KpiPart[]) => ({
    kind: "ratio" as const,
    parts,
    gradient: ratioGradient(parts),
  });
  return [
    {
      key: "total",
      title: "台账任务",
      value: num(s?.totalJobs),
      desc: `启用 ${running} · 停用 ${stopped}`,
      icon: "AlarmClock",
      tone: "brand",
      path: "/collect/job",
      visual: ratio([
        { label: "启用", value: running, color: "var(--brand-500)" },
        { label: "停用", value: stopped, color: "var(--border-default)" },
      ]),
    },
    {
      key: "dispatch",
      title: "本地 / 远程",
      value: `${local} / ${remote}`,
      desc: s?.remoteDispatchOwnedByMe
        ? "远程行由本节点下发"
        : `本机不领取 ${s?.unclaimedRemoteJobs ?? 0} 个`,
      icon: "Connection",
      tone: "brand",
      path: "/collect/job",
      visual: ratio([
        { label: "本地", value: local, color: "var(--brand-500)" },
        { label: "远程", value: remote, color: "var(--metric-net)" },
      ]),
    },
    {
      key: "fail",
      title: "24 小时失败",
      value: num(h.totalFailure),
      desc: h.totalFailure > 0 ? "看「最近派发」定位" : "暂无失败派发",
      icon: "WarningFilled",
      tone: h.totalFailure > 0 ? "error" : "success",
      path: "/collect/job-log",
      visual: { kind: "spark", values: h.failure, color: "var(--status-error)" },
    },
    {
      key: "unregistered",
      title: "未注册处理器",
      value: num(unreg),
      desc: unreg > 0
        ? "这些任务每一拍都会被跳过"
        : `启用任务都有同名处理器（${handlers} 个）`,
      icon: "Cpu",
      tone: unreg > 0 ? "warning" : "success",
      path: "/collect/job",
      visual: ratio([
        { label: "已覆盖", value: covered, color: "var(--status-success)" },
        { label: "未注册", value: unreg, color: "var(--status-warning)" },
      ]),
    },
  ];
});

/* ============ 状态卡 ============ */

/**
 * 概览事实：拆成「标签 + 值」的小卡片，而不是挤在一条横杠里。
 *
 * <p>原先是一条绿底横条、四段文字用竖线分隔（"本节点 Leader | 扫描节奏 1000ms |
 * 已注册处理器 3 个 | 在线执行器 0 个"），与上方 KPI 卡、下方面板卡片不是一个
 * 视觉语汇，看着像后来贴上去的一条。拆成小卡片后与全页统一，且每项的值可以
 * 单独对齐、单独强调（正常 / 0 个这类值一眼能扫到）。</p>
 */
const facts = computed<{ label: string; value: string }[]>(() => {
  const s = summary.value;
  if (!s) {
    return [];
  }
  return [
    { label: "节点角色", value: `${s.role ?? "—"}${s.leader ? " · Leader" : " · Follower"}` },
    { label: "扫描节奏", value: `${s.scanIntervalMs}ms` },
    { label: "已注册处理器", value: `${s.registeredHandlers} 个` },
    { label: "在线执行器", value: `${s.onlineExecutors.length} 个` },
  ];
});

/**
 * 异常提醒：只在真有问题时出现，正常时整条不渲染。
 *
 * <p>原先把提醒和事实混在同一个数组里（提醒排在第一段），于是正常时也得占着
 * 一整条横杠。拆出来后正常态只剩四张事实卡，异常时才多出一行警示。</p>
 */
const stripAlert = computed<string>(() => {
  const s = summary.value;
  if (!s) {
    return "未取到调度概览，说明 job-starter 治理接口在当前后端未启用";
  }
  if (!s.leader) {
    return `${s.role ?? "—"} 角色 · 本节点不是 Leader，到点任务不会被派发`;
  }
  if (s.unregisteredJobs > 0) {
    return `${s.unregisteredJobs} 个启用任务没有同名处理器，每一拍都会被跳过`;
  }
  if (s.unclaimedRemoteJobs > 0) {
    return `${s.unclaimedRemoteJobs} 个启用的远程任务本节点不领取，只由调度中心节点下发`;
  }
  return "";
});

/* ============ 即将触发 ============ */

const upcoming = computed(() => jobs.value
  .filter(job => job.enabled && job.nextFireTime)
  .sort((a, b) => Number(a.nextFireTime) - Number(b.nextFireTime))
  .slice(0, 10));

const stoppedHint = computed(() => {
  const stopped = summary.value?.stoppedJobs ?? 0;
  return stopped > 0 ? `另有 ${stopped} 个任务已停用，不参与调度` : "";
});

/* ============ 最近派发 ============ */

const recentDispatches = computed(() => logs.value.slice(0, 10));

/* ============ 日志分桶与趋势 ============ */

/** jobKey → 台账名，供派发列表与图上标注显示任务名 */
const jobNames = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {};
  for (const job of jobs.value) {
    if (job.jobKey) {
      map[job.jobKey] = job.jobName || job.jobKey;
    }
  }
  return map;
});

/**
 * 近 24 小时按整点分桶（右端是当前整点）。
 *
 * 派发 = SUCCESS + FAILURE（真正执行过的）；SKIPPED 等其它状态不计入派发，
 * 否则「未注册处理器」的跳过行会把派发数撑大，与趋势图语义不符。
 */
const hourly = computed(() => {
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
  return { labels, dispatch, failure, cumDispatch: cumD, cumFailure: cumF, totalDispatch: cumDispatch, totalFailure: cumFailure };
});

/** 触发时刻落在哪个桶；窗口外返回 -1 */
function hourIndexAt(time: number): number {
  const end = new Date();
  end.setMinutes(0, 0, 0);
  const base = end.getTime() - 23 * HOUR_MS;
  const index = Math.floor((time - base) / HOUR_MS);
  return index >= 0 && index < 24 ? index : -1;
}

/**
 * 图上标注：近 24 小时触发次数最多的前 2 个任务，标它们最后一次触发的时刻。
 *
 * 标注点全部来自真实日志（触发时刻 + jobKey），没有可标的就不画，不编造示例。
 */
const notableFires = computed(() => {
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
    .map(([key, entry]) => ({ key, name: jobNames.value[key] || key, at: entry.last, count: entry.count }));
});

const trendOption = computed<ChartOption>(() => {
  const p = chartPalette.value;
  const h = hourly.value;
  const marks = notableFires.value
    .map(fire => ({ fire, index: hourIndexAt(fire.at) }))
    .filter(item => item.index >= 0)
    .map(item => ({
      name: item.fire.name,
      coord: [h.labels[item.index], h.cumDispatch[item.index]] as [string, number],
    }));
  return {
    grid: { left: 38, right: 14, top: 22, bottom: 24 },
    tooltip: {
      trigger: "axis",
      backgroundColor: p.tipBg,
      borderColor: p.axisLine,
      borderWidth: 1,
      padding: [6, 10],
      textStyle: { color: p.tipText, fontSize: 12 },
      axisPointer: { type: "line", lineStyle: { color: p.axisLine, type: "dashed" } },
      valueFormatter: (value) => `${value} 次`,
    },
    xAxis: {
      type: "category",
      data: h.labels,
      boundaryGap: false,
      axisLabel: { color: p.axis, fontSize: 10, interval: 2, hideOverlap: true },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: p.axisLine } },
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      axisLabel: { color: p.axis, fontSize: 10 },
      splitLine: { lineStyle: { color: p.split, type: "dashed" } },
    },
    series: [
      {
        name: "累计派发",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 5,
        showSymbol: false,
        data: h.cumDispatch,
        lineStyle: { width: 2, color: p.brand },
        itemStyle: { color: p.brand },
        areaStyle: { color: p.brand, opacity: 0.14 },
        markPoint: marks.length
          ? {
              symbol: "circle",
              symbolSize: 7,
              itemStyle: { color: p.brand, borderColor: p.tipBg, borderWidth: 2 },
              label: {
                show: true,
                formatter: "{b}",
                position: "top",
                distance: 8,
                color: p.axis,
                fontSize: 10,
              },
              data: marks,
            }
          : undefined,
        z: 2,
      },
      {
        name: "累计失败",
        type: "line",
        smooth: false,
        symbol: "none",
        data: h.cumFailure,
        lineStyle: { width: 1.5, type: "dashed", color: p.error },
        itemStyle: { color: p.error },
        z: 3,
      },
    ],
  };
});

/* ============ 运行时参数 ============ */

const runtimeRows = computed<{ label: string; value: string }[]>(() => {
  const s = summary.value;
  if (!s) {
    return [];
  }
  return [
    { label: "角色", value: `${s.role ?? "—"}${s.leader ? " · Leader" : " · Follower"}` },
    { label: "节点", value: s.nodeId ?? "—" },
    { label: "分组", value: s.group || "—" },
    { label: "扫描节奏", value: `每 ${s.scanIntervalMs}ms · 预读 ${s.preReadMs}ms` },
    { label: "分发", value: `本地 ${s.localJobs} · 远程 ${s.remoteJobs}` },
  ];
});

/* ============ 表格列 ============ */

const upcomingColumns: ReTableColumn[] = [
  { prop: "jobName", label: "任务", minWidth: 150, slot: "name", showOverflowTooltip: true },
  { prop: "scheduleTime", label: "调度", minWidth: 150, slot: "schedule" },
  { prop: "nextFireTime", label: "下次触发", width: 132, slot: "next" },
  { prop: "countdown", label: "倒计时", width: 108, slot: "countdown" },
];

const dispatchColumns: ReTableColumn[] = [
  { prop: "triggerTime", label: "触发时刻", width: 148, slot: "time" },
  { prop: "jobKey", label: "任务", minWidth: 130, slot: "job", showOverflowTooltip: true },
  { prop: "nodeId", label: "执行器", minWidth: 120, slot: "executor", showOverflowTooltip: true },
  { prop: "costMs", label: "耗时", width: 92, slot: "cost", align: "right" },
  { prop: "executeCode", label: "状态", width: 82, slot: "status" },
];

/** 调度列文案：cron 表达式 + 人话描述（解析不出时只显示表达式） */
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

/**
 * 构成条的 CSS 渐变（硬边分段，用单个元素承载，避免为每段单独建节点）。
 *
 * 总量为 0 时整条留给最后一段，避免出现空条。
 */
function ratioGradient(parts: KpiPart[]): string {
  const total = parts.reduce((sum, item) => sum + Math.max(item.value, 0), 0);
  const stops: string[] = [];
  let from = 0;
  for (const part of parts) {
    const pct =
      total <= 0
        ? part === parts[parts.length - 1]
          ? 100
          : 0
        : (Math.max(part.value, 0) / total) * 100;
    const to = from + pct;
    stops.push(`${part.color} ${from}%`, `${part.color} ${to}%`);
    from = to;
  }
  return `linear-gradient(90deg, ${stops.join(", ")})`;
}

function jobNameOf(row: JobLog): string {
  const key = row.jobKey ?? "";
  return jobNames.value[key] || key || "—";
}

function executorOf(row: JobLog): string {
  return row.nodeId || row.address || "—";
}

/** 切换自动刷新：定时器随组件与 keep-alive 激活态起停 */
function toggleAuto(value: unknown): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  if (value === true) {
    timer = setInterval(() => void reload(), 5000);
  }
}

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
});

/**
 * 跳到指定页面。
 *
 * @param path 目标路由
 */
function go(path: string): void {
  void router.push(resolveHostPath(router, path));
}
</script>

<template>
  <div v-loading="loading" class="collect-page sched-center ov-page">
    <!-- KPI -->
    <div class="ov-kpis">
      <button
        v-for="kpi in kpis"
        :key="kpi.key"
        type="button"
        class="ov-kpi"
        :title="`查看${kpi.title}`"
        @click="go(kpi.path)"
      >
        <span class="ov-kpi__top">
          <span class="ov-kpi__icon" :class="`is-${kpi.tone}`">
            <ReIcon :name="kpi.icon" :size="15"/>
          </span>
          <span class="ov-kpi__value">{{ kpi.value }}</span>
        </span>
        <span class="ov-kpi__title">{{ kpi.title }}</span>
        <span class="ov-kpi__desc">{{ kpi.desc }}</span>
        <span class="ov-kpi__visual">
          <OvSpark
            v-if="kpi.visual.kind === 'spark'"
            :values="kpi.visual.values"
            :style="{ color: kpi.visual.color }"
          />
          <span v-else class="ov-ratio" :style="{ background: kpi.visual.gradient }" />
        </span>
      </button>
    </div>

    <!-- 状态卡：事实项用小卡片，异常时另起一行警示 -->
    <div v-if="facts.length" class="ov-facts">
      <div v-for="fact in facts" :key="fact.label" class="ov-fact">
        <span class="ov-fact__label">{{ fact.label }}</span>
        <span class="ov-fact__value">{{ fact.value }}</span>
      </div>
    </div>

    <!-- 主区：趋势 + 右栏 -->
    <div class="ov-main">
      <section class="ov-panel">
        <header class="ov-panel__head">
          <ReIcon name="TrendCharts" :size="14" class="ov-panel__icon"/>
          <h2 class="ov-panel__title">近 24 小时调度趋势</h2>
          <span class="ov-panel__spacer"/>
          <span class="ov-legend">
            <span class="ov-legend__item">
              <i class="ov-legend__dot is-brand"/>累计派发 <b>{{ hourly.totalDispatch }}</b>
            </span>
            <span class="ov-legend__item">
              <i class="ov-legend__dot is-error"/>累计失败 <b>{{ hourly.totalFailure }}</b>
            </span>
          </span>
          <button type="button" class="ov-link" @click="go('/collect/job-log')">
            作业日志 <ReIcon name="Right" :size="12"/>
          </button>
        </header>
        <div class="ov-chart">
          <!-- 高度交给容器（见 .ov-chart）：写死 240px 会让这一块比同排面板矮一截 -->
          <ReEcharts :option="trendOption" height="100%"/>
        </div>
        <p v-if="logTruncated" class="ov-panel__note">
          近 24 小时日志超过 {{ LOG_MAX_PAGES * LOG_PAGE_SIZE }} 条，曲线与计数只统计已读到的这一批（下限值）。
        </p>
      </section>

      <div class="ov-rail">
        <!-- 运行时参数 -->
        <section class="ov-panel">
          <header class="ov-panel__head">
            <ReIcon name="Setting" :size="14" class="ov-panel__icon"/>
            <h2 class="ov-panel__title">运行时参数</h2>
          </header>
          <div class="ov-panel__body">
            <dl v-if="runtimeRows.length" class="ov-kv">
              <template v-for="item in runtimeRows" :key="item.label">
                <dt>{{ item.label }}</dt>
                <dd>{{ item.value }}</dd>
              </template>
            </dl>
            <p v-else class="collect-hint collect-hint--muted">未取到运行时参数，说明调度治理接口在当前后端不可用。</p>
          </div>
        </section>

        <!-- 执行器 -->
        <section class="ov-panel">
          <header class="ov-panel__head">
            <ReIcon name="Connection" :size="14" class="ov-panel__icon"/>
            <h2 class="ov-panel__title">执行器</h2>
          </header>
          <div class="ov-panel__body">
            <ul v-if="nodes.length" class="ov-exec">
              <li v-for="node in nodes" :key="node.clientId" class="ov-exec__row">
                <i class="ov-exec__dot" :class="node.online ? 'is-online' : 'is-offline'"/>
                <span class="ov-exec__name" :title="node.nodeId || node.clientId">
                  {{ node.nodeId || node.clientId }}
                </span>
                <span class="ov-exec__meta">{{ node.role ?? "EXECUTOR" }} · {{ node.handlerCount }} 个处理器</span>
              </li>
            </ul>
            <p v-else class="collect-hint collect-hint--muted">
              暂无在线远程执行器。执行器以 EXECUTOR 角色启动并连上本调度中心后出现在这里。
            </p>
            <button type="button" class="ov-dashed" @click="go('/collect/remote-node')">
              <ReIcon name="Plus" :size="13"/>接入远程执行器
            </button>
          </div>
        </section>

        <!-- 已注册处理器 -->
        <section class="ov-panel">
          <header class="ov-panel__head">
            <ReIcon name="Cpu" :size="14" class="ov-panel__icon"/>
            <h2 class="ov-panel__title">已注册处理器 · {{ summary?.registeredHandlers ?? 0 }}</h2>
          </header>
          <div class="ov-panel__body">
            <div v-if="executors.length" class="ov-chips">
              <span
                v-for="executor in executors.slice(0, 14)"
                :key="executor.name"
                class="ov-chip"
                :class="{ 'is-remote': executor.source === 'REMOTE' }"
                :title="executor.desc || executor.handlerClass || executor.name"
              >
                {{ executor.name }}
              </span>
              <span v-if="executors.length > 14" class="ov-chip ov-chip--more">
                等 {{ executors.length }} 个
              </span>
            </div>
            <p v-else class="collect-hint collect-hint--muted">本节点没有已注册处理器。</p>
          </div>
        </section>
      </div>
    </div>

    <!-- 底部：即将触发 + 最近派发 -->
    <div class="ov-bottom">
      <section class="ov-panel">
        <header class="ov-panel__head">
          <ReIcon name="AlarmClock" :size="14" class="ov-panel__icon"/>
          <h2 class="ov-panel__title">即将触发</h2>
          <span class="ov-panel__spacer"/>
          <button type="button" class="ov-link" @click="go('/collect/job')">
            调度工作台 <ReIcon name="Right" :size="12"/>
          </button>
        </header>
        <ReTable
          :data="upcoming as unknown as Record<string, unknown>[]"
          :columns="upcomingColumns"
          row-key="jobKey"
          :layout-table="{ minHeight: 0 }"
          empty-text="没有启用的定时任务，去工作台启用一个或在流程设计页给流程配 cron"
          :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
        >
          <template #empty>
            <div class="page-empty">
              <span class="page-empty__icon"><ReIcon name="AlarmClock" :size="22"/></span>
              <span class="page-empty__title">没有启用的定时任务</span>
              <span class="page-empty__desc">这里只列启用中、且算得出下次触发时刻的任务；到工作台启用一个，或在流程设计页给流程配 cron。</span>
              <span class="page-empty__actions">
                <ReButton icon="Refresh" @click="reload">刷新</ReButton>
              </span>
            </div>
          </template>
          <template #name="{ row }">
            <span>{{ row.jobName || row.jobKey }}</span>
            <ReTag
              v-if="isFlowRow(row as unknown as JobRuntime)"
              class="collect-tag-inline"
              type="primary"
              effect="plain"
              size="small"
            >
              采集流程
            </ReTag>
          </template>
          <template #schedule="{ row }">
            <span class="collect-cell-mono collect-cell-ellipsis">
              {{ scheduleCellText(row as unknown as JobRuntime) }}
            </span>
          </template>
          <template #next="{ row }">
            <span class="collect-num">{{ fmtFireShort(row.nextFireTime) }}</span>
          </template>
          <template #countdown="{ row }">
            <span class="ov-cd">
              <FireCountdown :at="row.nextFireTime" bare/>
            </span>
          </template>
        </ReTable>
        <p v-if="stoppedHint" class="ov-panel__foot">{{ stoppedHint }}</p>
      </section>

      <section class="ov-panel">
        <header class="ov-panel__head">
          <ReIcon name="Tickets" :size="14" class="ov-panel__icon"/>
          <h2 class="ov-panel__title">最近派发记录</h2>
          <span class="ov-panel__spacer"/>
          <span class="collect-hint collect-hint--muted">
            近 24 小时 · {{ hourly.totalFailure > 0 ? `${hourly.totalFailure} 次失败` : "全部成功" }}
          </span>
          <button v-if="hourly.totalFailure > 0" type="button" class="ov-link" @click="go('/collect/job-log')">
            查看失败
          </button>
        </header>
        <ReTable
          :data="recentDispatches as unknown as Record<string, unknown>[]"
          :columns="dispatchColumns"
          row-key="logId"
          :layout-table="{ minHeight: 0 }"
          empty-text="近 24 小时没有派发记录"
          :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
        >
          <template #time="{ row }">
            <span class="collect-num">{{ fmtMs(row.triggerTime) }}</span>
          </template>
          <template #job="{ row }">{{ jobNameOf(row as unknown as JobLog) }}</template>
          <template #executor="{ row }">
            <span class="collect-cell-ellipsis">{{ executorOf(row as unknown as JobLog) }}</span>
          </template>
          <template #cost="{ row }">
            <ReTime :value="costMs(row.costMs)" format="duration" placeholder="—"/>
          </template>
          <template #status="{ row }">
            <ReTag :type="statusTagType(row.executeCode)" effect="plain" size="small">
              {{ statusText(row.executeCode) }}
            </ReTag>
          </template>
        </ReTable>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* ============ 设计令牌来源 ============
 * 颜色 / 阴影 / 圆角 / 缓动一律取 koi 共享令牌（@repo/theme 的 tokens.css，
 * 由 @repo/app 统一注入，monitor 与 collect-scheduler 两个宿主 app 共享），
 * 不写死十六进制，暗色主题自动跟随。
 *
 * 间距（--cc-gap / --cc-gap-sm）与动效时长（--cc-duration）koi 体系没有对应令牌，
 * 它们定义在 pages/collect/src/styles/collect.css 的 :root 里。本包是独立发布的
 * pages 模块：vue-support-system-starter 只挂 @pages/job、不加载 collect.css，
 * 裸写 var(--cc-gap) 会让 gap 在 computed-value-time 失效、退化成 normal(0)，
 * KPI 栅格与三栏主区整块塌成无间距。所以这里一律带兜底值，
 * 与同包 scheduler.css 的既有写法一致；宿主加载了 collect.css 时取值不变。
 * 缓动直接用 koi 的 --ease-out（与 --cc-ease 同值）。
 * ==================================== */

/* ============ 页头 ============ */
.ov-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--cc-gap, 12px);
  flex-wrap: wrap;
}

.ov-head__row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.ov-head__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.2px;
  color: var(--text-primary);
}

.ov-head__sub {
  margin: 3px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-tertiary);
}

.ov-head__actions {
  display: flex;
  align-items: center;
  gap: var(--cc-gap-sm, 8px);
}

.ov-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  border: 1px solid transparent;
}

.ov-badge.is-ok {
  color: var(--status-success);
  background: color-mix(in srgb, var(--status-success) 12%, transparent);
  border-color: color-mix(in srgb, var(--status-success) 30%, transparent);
}

.ov-badge.is-warn {
  color: var(--status-warning);
  background: color-mix(in srgb, var(--status-warning) 12%, transparent);
  border-color: color-mix(in srgb, var(--status-warning) 30%, transparent);
}

.ov-badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

/* ============ KPI ============ */
.ov-kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--cc-gap, 12px);
}

@media (max-width: 1280px) {
  .ov-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.ov-kpi {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  text-align: left;
  cursor: pointer;
  font: inherit;
  color: inherit;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: transform var(--cc-duration, 180ms) var(--ease-out, cubic-bezier(0.4, 0, 0.2, 1)),
    box-shadow var(--cc-duration, 180ms) var(--ease-out, cubic-bezier(0.4, 0, 0.2, 1)),
    border-color var(--cc-duration, 180ms) var(--ease-out, cubic-bezier(0.4, 0, 0.2, 1));
}

.ov-kpi:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: color-mix(in srgb, var(--brand-500) 35%, transparent);
}

.ov-kpi__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ov-kpi__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
  flex: none;
}

.ov-kpi__icon.is-brand {
  color: var(--brand-500);
  background: color-mix(in srgb, var(--brand-500) 12%, transparent);
}

.ov-kpi__icon.is-success {
  color: var(--status-success);
  background: color-mix(in srgb, var(--status-success) 12%, transparent);
}

.ov-kpi__icon.is-warning {
  color: var(--status-warning);
  background: color-mix(in srgb, var(--status-warning) 14%, transparent);
}

.ov-kpi__icon.is-error {
  color: var(--status-error);
  background: color-mix(in srgb, var(--status-error) 12%, transparent);
}

.ov-kpi__value {
  font-size: 24px;
  font-weight: 800;
  line-height: 1.1;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.ov-kpi__title {
  font-size: 12.5px;
  color: var(--text-secondary);
}

.ov-kpi__desc {
  font-size: 12px;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ov-kpi__visual {
  display: flex;
  align-items: center;
  margin-top: 6px;
  height: 30px;
}

/* 构成条：单元素承载，分段由 computed 产出的 CSS 渐变绘制（见 ratioGradient） */
.ov-ratio {
  display: block;
  width: 100%;
  height: 6px;
  border-radius: 999px;
  overflow: hidden;
  background: var(--bg-fill);
}

/* ============ 状态卡 ============ */
/*
 * 事实卡：外壳沿用面板那一套令牌（--bg-container / --border-subtle / --radius-lg /
 * --shadow-sm），只是内距更小、字号更轻 —— 与全页卡片同一套语汇，只是信息密度更低。
 * 四张等宽平铺：标签在上、值在下，值左对齐等宽，扫一眼就能横向比大小。
 */
.ov-facts {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--cc-gap, 12px);
}

.ov-fact {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  padding: 9px 14px;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.ov-fact__label {
  color: var(--text-tertiary);
  font-size: 11.5px;
  line-height: 1.4;
}

/* 值不换行也不截断：这几项都是短值（Leader / 1000ms / 3 个），换行反而把卡片撑散 */
.ov-fact__value {
  overflow: hidden;
  color: var(--text-primary);
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 异常提醒：正常时整行不渲染，出问题时是一句独立警示，不与事实卡混排 */
.ov-alert {
  margin: 0;
  padding: 8px 14px;
  border: 1px solid color-mix(in srgb, var(--status-warning) 30%, transparent);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--status-warning) 10%, var(--bg-container));
  color: var(--text-secondary);
  font-size: 12.5px;
  line-height: 1.5;
}

/* 窄屏：四张卡横向会被压扁（"已注册处理器" 这种六字标签放不下），退成两列 */
@media (max-width: 900px) {
  .ov-facts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* ============ 面板 ============ */
/*
 * align-items 用 stretch（默认）而不是 start：同一排的面板必须等高。
 * start 下各卡片按自身内容收缩，实测「近 24 小时调度趋势」(285px) 与右栏
 * (168+130=310px)、「即将触发」(191px) 与「最近派发记录」(184px) 顶底都对不齐，
 * 一眼看过去就是"两块牌子不在一条线上"。拉伸后多出来的高度交给内部
 * 弹性内容（图表 / 表格，见 .ov-chart / .ov-table）吃掉，卡片内不留空档。
 */
.ov-main {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: var(--cc-gap, 12px);
}

.ov-bottom {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
  gap: var(--cc-gap, 12px);
}

@media (max-width: 1280px) {
  .ov-main,
  .ov-bottom {
    grid-template-columns: minmax(0, 1fr);
  }
}

/*
 * 右栏随左栏一起被拉高，两个面板按内容比例分摊多余高度（flex: 1），
 * 否则栅格拉伸只作用到 .ov-rail 本身，它内部两块仍然各自贴顶、底下留白。
 */
.ov-rail {
  display: flex;
  flex-direction: column;
  gap: var(--cc-gap, 12px);
  min-width: 0;
}

.ov-rail > .ov-panel {
  flex: 1 1 auto;
}

.ov-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.ov-panel__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px 8px;
}

.ov-panel__icon {
  color: var(--brand-500);
  flex: none;
}

.ov-panel__title {
  margin: 0;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
}

.ov-panel__spacer {
  flex: 1 1 auto;
}

.ov-panel__body {
  padding: 0 14px 12px;
}

.ov-panel__note {
  margin: 0 14px 10px;
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--text-tertiary);
}

.ov-panel__foot {
  margin: 0;
  padding: 0 14px 10px;
  font-size: 11.5px;
  color: var(--text-tertiary);
}

/* ============ 图例与链接 ============ */
.ov-legend {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--text-secondary);
}

.ov-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}

.ov-legend__dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex: none;
}

.ov-legend__dot.is-brand {
  background: var(--brand-500);
}

.ov-legend__dot.is-error {
  background: var(--status-error);
}

.ov-legend b {
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.ov-link {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  font-size: 12px;
  color: var(--brand-500);
  white-space: nowrap;
}

.ov-link:hover {
  color: var(--brand-600);
  text-decoration: underline;
}

/* ============ 图表与表格 ============ */
/*
 * 图表容器跟着面板一起长高：面板被栅格拉伸后，多出来的高度如果没人吃，
 * 卡片底部会空出一块。与其写死 240px（那正是两排对不齐的根源），
 * 不如给它一个下限高度、再让它吃满剩余空间。
 */
.ov-chart {
  display: flex;
  flex: 1 1 auto;
  min-height: 240px;
  padding: 0 6px 6px;
}

.ov-chart :deep(.re-echarts) {
  flex: 1 1 auto;
  min-height: 0;
}

/* 表格同理：面板撑高后表格区跟着长高，行多时填满而不是留白 */
.ov-table {
  flex: 1 1 auto;
}

/* ReTable 自带卡片外壳（描边/圆角/投影），本面板已有一层壳，这里把内层壳拆掉避免双边框 */
.ov-table :deep(.re-table) {
  padding: 0 12px 10px;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

/* ============ 运行时参数 ============ */
.ov-kv {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  gap: 8px 12px;
  margin: 0;
  font-size: 12.5px;
}

.ov-kv dt {
  color: var(--text-tertiary);
}

.ov-kv dd {
  margin: 0;
  color: var(--text-primary);
  overflow-wrap: anywhere;
}

/* ============ 执行器 ============ */
.ov-exec {
  list-style: none;
  margin: 0;
  padding: 0;
}

.ov-exec__row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
  font-size: 12.5px;
}

.ov-exec__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex: none;
}

.ov-exec__dot.is-online {
  background: var(--pulse-online);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--pulse-online) 22%, transparent);
}

.ov-exec__dot.is-offline {
  background: var(--pulse-offline);
}

.ov-exec__name {
  color: var(--text-primary);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ov-exec__meta {
  margin-left: auto;
  color: var(--text-tertiary);
  font-size: 12px;
  white-space: nowrap;
}

.ov-dashed {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 10px;
  padding: 7px 0;
  border: 1px dashed var(--border-default);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  font-size: 12.5px;
  cursor: pointer;
}

.ov-dashed:hover {
  color: var(--brand-500);
  border-color: color-mix(in srgb, var(--brand-500) 45%, transparent);
  background: var(--brand-50);
}

/* ============ 处理器芯片 ============ */
.ov-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ov-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-fill);
  border: 1px solid var(--border-subtle);
  font-family: var(--cc-font-num, ui-monospace, SFMono-Regular, Consolas, "Courier New", monospace);
}

.ov-chip.is-remote {
  color: var(--brand-600);
  background: var(--brand-50);
  border-color: color-mix(in srgb, var(--brand-500) 22%, transparent);
}

.ov-chip--more {
  color: var(--text-tertiary);
}

/* ============ 倒计时芯片 ============ */
.ov-cd {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 12px;
  color: var(--brand-600);
  background: var(--brand-50);
  border: 1px solid color-mix(in srgb, var(--brand-500) 20%, transparent);
}

.ov-cd :deep(.fire-cell__left) {
  color: var(--brand-600);
}

/* ============ 可操作空态 ============
   .page-empty 系列的定义在 pages/system/src/styles/system-page.css，那是 system 包的
   全局 css（随宿主一次性加载）；job 包只有 scheduler.css，未收录这一组类名，
   且本页样式是 scoped 的，拿不到别的包的全局类，所以此处自带一份最小必要样式，
   取值与 system 包逐条对齐，换包不会走样。 */
.page-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 28px 16px;
  text-align: center;
}

.page-empty__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--brand-500) 12%, transparent);
  color: var(--brand-500);
}

.page-empty__title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--text-primary);
}

.page-empty__desc {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.page-empty__actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .ov-kpi {
    transition: none;
  }

  .ov-kpi:hover {
    transform: none;
  }
}
</style>
