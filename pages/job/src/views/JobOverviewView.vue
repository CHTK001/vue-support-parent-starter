<!--
  调度总览：调度中心的落地页，只看「这一台节点在调度链路里的健康度」。

  数据全部来自现网接口：节点身份与计数取 /v2/scheduler/summary 一份概览；台账分页拉全后本地算
  「即将触发」（启用任务按 nextFireTime 升序取前 N）；失败面取近 24 小时的 FAILURE 日志，一份数据
  同时喂「每小时失败趋势」与「最近失败」列表，避免为了画图和列表各拉一次。

  与平台总览的分工：平台总览回答「采集平台整体怎么样」，本页只回答调度面——谁在派发、下一拍是什么、
  失败集中在哪个时段、哪些启用任务其实没有处理器。因此每个面板都带一个直达对应明细页的入口。
-->
<script setup lang="ts">
import { computed, onActivated, onDeactivated, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import ReButton from "@repo/ui/re-button";
import ReEcharts from "@repo/ui/re-echarts";
import ReIcon from "@repo/ui/re-icon";
import ReStatCard from "@repo/ui/re-stat-card";
import ReSwitch from "@repo/ui/re-switch";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import ReTime from "@repo/ui/re-time";
import type { ReTableColumn } from "@repo/ui/re-table";

/** ECharts 配置类型从组件实例的 props 反推：app 未直接依赖 echarts，不引它的类型入口 */
type ChartOption = InstanceType<typeof ReEcharts>["$props"]["option"];
import { getSummary, pageJobLogs, pageJobs } from "../api/jobApi";
import { costMs } from "../constants/taskStatus";
import { COLLECT_FLOW_GROUP, type JobLog, type JobRuntime, type JobSummary } from "../types/job";
import { useCollectView } from "../composables/useCollectView";
import { fmtMs } from "../utils/time";
import { resolveHostPath } from "../utils/hostPath";

defineOptions({ name: "CollectJobOverview" });

const router = useRouter();

/** 失败观测窗口与趋势分桶粒度 */
const FAILURE_WINDOW_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

/** 台账分页拉全的页大小与页数上限（单页上限 500 由后端约定） */
const LEDGER_PAGE_SIZE = 500;
const LEDGER_MAX_PAGES = 20;

/** 失败日志分页拉全的页数上限：趋势图不需要把整表读回浏览器 */
const FAILURE_MAX_PAGES = 4;

const summary = ref<JobSummary | null>(null);
const jobs = ref<JobRuntime[]>([]);
const failures = ref<JobLog[]>([]);
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

/** 近 24 小时失败日志，分页拉全（到上限即停） */
async function loadFailures(): Promise<void> {
  const startTime = Date.now() - FAILURE_WINDOW_MS;
  const all: JobLog[] = [];
  for (let pageNum = 1; pageNum <= FAILURE_MAX_PAGES; pageNum++) {
    const page = await pageJobLogs({ pageNum, pageSize: 500, executeCode: "FAILURE", startTime });
    const rows = Array.isArray(page?.data) ? page.data : [];
    all.push(...rows);
    if (rows.length < 500) {
      break;
    }
  }
  failures.value = all;
}

const { loading, reload } = useCollectView(async () => {
  const [sum] = await Promise.all([getSummary(), loadJobs(), loadFailures()]);
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

interface Kpi {
  key: string;
  title: string;
  value: string;
  desc: string;
  icon: string;
  color: string;
  path: string;
}

const kpis = computed<Kpi[]>(() => {
  const s = summary.value;
  const num = (value: number | undefined) => (value ?? 0).toLocaleString("zh-CN");
  return [
    {
      key: "total",
      title: "台账任务",
      value: num(s?.totalJobs),
      desc: `启用 ${s?.runningJobs ?? 0} · 停用 ${s?.stoppedJobs ?? 0}`,
      icon: "AlarmClock",
      color: "var(--el-color-primary)",
      path: "/collect/job",
    },
    {
      key: "dispatch",
      title: "本地 / 远程",
      value: `${s?.localJobs ?? 0} / ${s?.remoteJobs ?? 0}`,
      desc: s?.remoteDispatchOwnedByMe
        ? "远程行由本节点下发"
        : `本机不领取 ${s?.unclaimedRemoteJobs ?? 0} 个`,
      icon: "Connection",
      color: "var(--el-color-info)",
      path: "/collect/job",
    },
    {
      key: "fail",
      title: "24 小时失败",
      value: num(s?.recentFailures),
      desc: (s?.recentFailures ?? 0) > 0 ? "看「最近失败」定位" : "暂无失败派发",
      icon: "WarningFilled",
      color: (s?.recentFailures ?? 0) > 0 ? "var(--el-color-danger)" : "var(--el-color-info)",
      path: "/collect/job-log",
    },
    {
      key: "unregistered",
      title: "未注册处理器",
      value: num(s?.unregisteredJobs),
      desc: (s?.unregisteredJobs ?? 0) > 0 ? "这些任务每一拍都会被跳过" : "启用任务都有同名处理器",
      icon: "Cpu",
      color: (s?.unregisteredJobs ?? 0) > 0 ? "var(--el-color-warning)" : "var(--el-color-success)",
      path: "/collect/job",
    },
  ];
});

/** 一句话说清本节点在调度链路里的处境，颜色随健康度变化 */
const engineRow = computed<{ tone: "ok" | "warn"; text: string }>(() => {
  const s = summary.value;
  if (!s) {
    return { tone: "warn", text: "未取到调度概览，说明 job-starter 治理接口在当前后端未启用" };
  }
  if (!s.leader) {
    return { tone: "warn", text: `${s.role ?? "—"} 角色 · 本节点 ${s.nodeId ?? "—"} 不是 Leader，到点任务不会被派发` };
  }
  if (s.unregisteredJobs > 0) {
    return { tone: "warn", text: `${s.unregisteredJobs} 个启用任务没有同名处理器，去工作台看「未注册」标记` };
  }
  if (s.unclaimedRemoteJobs > 0) {
    return { tone: "warn", text: `${s.unclaimedRemoteJobs} 个启用的远程任务本节点不领取，只由调度中心节点下发` };
  }
  const online = s.onlineExecutors.length ? ` · 在线执行器 ${s.onlineExecutors.join("、")}` : "";
  return {
    tone: "ok",
    text: `Leader ${s.nodeId ?? "—"} · 扫描每 ${s.scanIntervalMs}ms · 已注册处理器 ${s.registeredHandlers} 个${online}`,
  };
});

/** 即将触发：启用的定时任务按下次触发升序取前 10 */
const upcoming = computed(() => jobs.value
  .filter(job => job.enabled && job.nextFireTime)
  .sort((a, b) => Number(a.nextFireTime) - Number(b.nextFireTime))
  .slice(0, 10));

/** 最近失败：失败日志已按触发时刻倒序，取前 8 */
const recentFailures = computed(() => failures.value.slice(0, 8));

/** jobKey → 台账名，供失败列表显示任务名 */
const jobNames = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {};
  for (const job of jobs.value) {
    if (job.jobKey) {
      map[job.jobKey] = job.jobName || job.jobKey;
    }
  }
  return map;
});

/** 每小时失败数：以当前整点为右端往前 24 桶，落在窗口外的丢弃 */
const trendOption = computed<ChartOption>(() => {
  const end = new Date();
  end.setMinutes(0, 0, 0);
  const base = end.getTime() - 23 * HOUR_MS;
  const labels: string[] = [];
  const counts: number[] = [];
  for (let i = 0; i < 24; i++) {
    const hour = new Date(base + i * HOUR_MS);
    labels.push(`${String(hour.getHours()).padStart(2, "0")}:00`);
    counts.push(0);
  }
  for (const log of failures.value) {
    const time = Number(log.triggerTime ?? 0);
    if (!time) {
      continue;
    }
    const index = Math.floor((time - base) / HOUR_MS);
    if (index >= 0 && index < counts.length) {
      counts[index]++;
    }
  }
  return {
    grid: { left: 36, right: 12, top: 16, bottom: 26 },
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: { fontSize: 10, interval: 2 },
      axisTick: { show: false },
    },
    yAxis: { type: "value", minInterval: 1, splitLine: { lineStyle: { type: "dashed" } } },
    series: [{
      type: "bar",
      name: "失败",
      data: counts,
      barMaxWidth: 16,
      itemStyle: { borderRadius: [3, 3, 0, 0] },
    }],
  };
});

/** 运行时参数清单（只调度面，不掺采集配置） */
const runtimeRows = computed<{ label: string; value: string }[]>(() => {
  const s = summary.value;
  if (!s) {
    return [];
  }
  return [
    { label: "角色", value: s.role ?? "—" },
    { label: "节点", value: `${s.nodeId ?? "—"}（${s.leader ? "Leader" : "Follower"}）` },
    { label: "分组", value: s.group || "—" },
    { label: "扫描节奏", value: `每 ${s.scanIntervalMs}ms · 预读 ${s.preReadMs}ms` },
    { label: "台账", value: `${s.totalJobs} 个 · 启用 ${s.runningJobs} · 停用 ${s.stoppedJobs}` },
    { label: "分发", value: `本地 ${s.localJobs} · 远程 ${s.remoteJobs}` },
    { label: "未注册处理器", value: `${s.unregisteredJobs} 个` },
    { label: "本机不领取远程", value: `${s.unclaimedRemoteJobs} 个` },
    { label: "已注册处理器", value: `${s.registeredHandlers} 个` },
    { label: "在线执行器", value: s.onlineExecutors.length ? s.onlineExecutors.join("、") : "—" },
  ];
});

const upcomingColumns: ReTableColumn[] = [
  { prop: "jobName", label: "任务", minWidth: 150, slot: "name", showOverflowTooltip: true },
  { prop: "scheduleType", label: "调度", width: 170, slot: "schedule" },
  { prop: "nextFireTime", label: "下次触发", width: 160, slot: "next" },
];

const failureColumns: ReTableColumn[] = [
  { prop: "triggerTime", label: "触发时刻", width: 150, slot: "time" },
  { prop: "jobKey", label: "任务", minWidth: 150, slot: "job", showOverflowTooltip: true },
  { prop: "costMs", label: "耗时", width: 96, slot: "cost", align: "right" },
  { prop: "message", label: "消息", minWidth: 180, slot: "msg", showOverflowTooltip: true },
];

function scheduleText(job: JobRuntime): string {
  if (job.scheduleType === "NONE" || !job.scheduleTime) {
    return "不自动调度";
  }
  return job.scheduleType === "CRON" ? `CRON · ${job.scheduleTime}` : `${job.scheduleType} · ${job.scheduleTime}ms`;
}

/**
 * 采集流程镜像行的判断：key 约定为 collect-flow-<流程ID>。
 *
 * 不能只看 group——脚本与片段任务同样登记在 collect-flow 分组下（该分组同时是
 * 调度选举的命名空间兜底），只看分组会把「片段 · Groovy」这类任务误标成采集流程。
 *
 * @param row 台账行
 * @returns true 表示这一行是采集流程的调度镜像
 */
function isFlowRow(row: JobRuntime): boolean {
  return row.jobKey?.startsWith(`${COLLECT_FLOW_GROUP}-`) === true;
}

function jobNameOf(row: JobLog): string {
  const key = row.jobKey ?? "";
  return jobNames.value[key] || key || "—";
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
  <div v-loading="loading" class="collect-page sched-center">
    <div class="sc-head">
      <div>
        <h1 class="sc-head__title">调度总览</h1>
        <p class="sc-head__sub">
          {{ summary?.role ?? "—" }} 角色 · {{ summary?.nodeId || "—" }} · 更新于 {{ updatedAt || "—" }}
        </p>
      </div>
      <div class="sc-head__actions">
        <ReTag v-if="summary" :type="summary.leader ? 'success' : 'warning'" effect="plain" dot>
          {{ summary.leader ? "Leader" : "Follower" }}
        </ReTag>
        <span class="collect-hint collect-hint--muted">自动刷新</span>
        <ReSwitch v-model="autoRefresh"  aria-label="每 5 秒自动刷新" @change="toggleAuto"/>
        <ReButton icon="Refresh" :loading="loading" title="刷新总览" @click="reload">刷新</ReButton>
      </div>
    </div>

    <div class="collect-stats">
      <ReStatCard
        size="compact"
        v-for="kpi in kpis"
        :key="kpi.key"
        :title="kpi.title"
        :value="kpi.value"
        :desc="kpi.desc"
        @click="go(kpi.path)"
      >
        <template #icon>
          <ReIcon :name="kpi.icon" :size="16" :style="{ color: kpi.color }"/>
        </template>
      </ReStatCard>
    </div>

    <div class="collect-callout" :class="`is-${engineRow.tone}`">
      <ReIcon :name="engineRow.tone === 'ok' ? 'CircleCheck' : 'Warning'" :size="14"/>
      <span>{{ engineRow.text }}</span>
    </div>

    <div class="ov-grid">
      <div class="collect-card ov-panel">
        <div class="collect-rail__title koi-ov-head">
          <ReIcon name="TrendCharts" :size="14"/>
          <b>近 24 小时失败趋势</b>
          <span class="spacer"/>
          <span class="collect-hint collect-hint--muted">共 {{ summary?.recentFailures ?? 0 }} 次</span>
          <ReButton  text type="primary" @click="go('/collect/job-log')">作业日志</ReButton>
        </div>
        <ReEcharts :option="trendOption" height="220px"/>
      </div>

      <div class="collect-card ov-panel">
        <div class="collect-rail__title koi-ov-head">
          <ReIcon name="AlarmClock" :size="14"/>
          <b>即将触发</b>
          <span class="spacer"/>
          <ReButton  text type="primary" @click="go('/collect/job')">调度工作台</ReButton>
        </div>
        <ReTable
          :data="upcoming as unknown as Record<string, unknown>[]"
          :columns="upcomingColumns"
          :pagination="false"
          :toolbar="false"
          row-key="jobKey"
          :layout-table="{ minHeight: 0 }"
          empty-text="没有启用的定时任务，去工作台启用一个或在流程设计页给流程配 cron"
        >
          <!--
            可操作空态：默认的 el-empty 只能看不能做。
            本面板没有工具栏（:toolbar="false"），标题栏的「调度工作台」才是它的出口，
            所以这里只给一个「刷新」出口，不重复造「去工作台」按钮。
            empty-text 属性保留不动，它仍是 #empty 插槽 description 的回退值。
          -->
          <template #empty>
            <div class="page-empty">
              <span class="page-empty__icon"><ReIcon name="AlarmClock" :size="22" /></span>
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
            >
              采集流程
            </ReTag>
          </template>
          <template #schedule="{ row }">
            <span class="collect-cell-mono collect-cell-ellipsis">{{ scheduleText(row as unknown as JobRuntime) }}</span>
          </template>
          <template #next="{ row }"><span class="collect-num">{{ fmtMs(row.nextFireTime) }}</span></template>
        </ReTable>
      </div>

      <div class="collect-card ov-panel">
        <div class="collect-rail__title koi-ov-head">
          <ReIcon name="WarningFilled" :size="14"/>
          <b>最近失败</b>
          <span class="spacer"/>
          <span class="collect-hint collect-hint--muted">近 24 小时</span>
          <ReButton  text type="primary" @click="go('/collect/job-log')">全部失败</ReButton>
        </div>
        <ReTable
          :data="recentFailures as unknown as Record<string, unknown>[]"
          :columns="failureColumns"
          :pagination="false"
          :toolbar="false"
          row-key="logId"
          :layout-table="{ minHeight: 0 }"
          empty-text="近 24 小时没有失败派发"
        >
          <template #time="{ row }"><span class="collect-num">{{ fmtMs(row.triggerTime) }}</span></template>
          <template #job="{ row }">{{ jobNameOf(row as unknown as JobLog) }}</template>
          <template #cost="{ row }"><ReTime :value="costMs(row.costMs)" format="duration" placeholder="—" /></template>
          <template #msg="{ row }"><span class="collect-cell-ellipsis">{{ row.message || "—" }}</span></template>
        </ReTable>
      </div>

      <div class="collect-card ov-panel">
        <div class="collect-rail__title koi-ov-head">
          <ReIcon name="Setting" :size="14"/>
          <b>运行时参数</b>
        </div>
        <dl v-if="runtimeRows.length" class="collect-kv">
          <template v-for="item in runtimeRows" :key="item.label">
            <dt>{{ item.label }}</dt>
            <dd>{{ item.value }}</dd>
          </template>
        </dl>
        <p v-else class="collect-hint collect-hint--muted">未取到运行时参数，说明调度治理接口在当前后端不可用。</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ov-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: var(--cc-gap);
}

.ov-panel {
  min-width: 0;
}

.koi-ov-head {
  padding-bottom: 8px;
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
  border-radius: var(--el-radius-lg, 12px);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  color: var(--el-color-primary);
}
.page-empty__title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--el-text-color-primary);
}
.page-empty__desc {
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}
.page-empty__actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}

/*
  表格外壳跟随主题色轻微变化，聚焦时给出可感知的边界（键盘可达的必备反馈）。
  面板卡片（.sched-center .collect-card）已经带了圆角与阴影，这里只补 1px 细描边与
  focus-within 反馈——卡片内再叠投影就成了一摞纸，koi 规约只给焦点环与悬浮浮起留投影。
*/
:deep(.re-table) {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color);
  overflow: hidden;
  transition: border-color var(--el-transition-duration-fast, 0.2s) ease;
}
:deep(.re-table:focus-within) {
  border-color: var(--el-color-primary-light-5);
}

/* 尊重系统「减少动态效果」偏好：把本页新增的过渡全部关掉 */
@media (prefers-reduced-motion: reduce) {
  :deep(.re-table) {
    transition: none;
  }
}
</style>
