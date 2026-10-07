<!--
  平台总览：登录后的落地页（app.yaml 的 routeConfig.homePath 指向本页）。

  数据全部来自现网接口，不做前端推算：采集面读 runtime 与 task/flow 分页，变量/数据源/函数/通知取列表长度；
  调度面只读 job-starter 的 /v2/scheduler/summary 一份概览，不再自己数台账行——概览里的
  totalJobs / runningJobs / recentFailures 与工作台显示的是同一个口径。
  任一接口失败由 useCollectView 统一弹一条中文提示。
  keepAlive 命中时（从其它页签切回）重新取数，保证刚跑完的任务能立刻看到。
-->
<script setup lang="ts">
import { computed, onActivated, onDeactivated, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import ReButton from "@repo/ui/re-button";
import ReIcon from "@repo/ui/re-icon";
import ReSwitch from "@repo/ui/re-switch";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import ReTime from "@repo/ui/re-time";
import ReStatCard from "@repo/ui/re-stat-card";
import {
  fetchRuntime,
  listFunctions,
  listNotices,
  listVariables,
  pageFlows,
  pageTasks,
} from "@pages/collect";
import { getSummary, pageJobs } from "@pages/job";
import { costMs, statusTagType, statusText, triggerText } from "@pages/collect";
import { COLLECT_FLOW_GROUP, type JobRuntime, type JobSummary } from "@pages/job";
import { useCollectView } from "@pages/collect";
import { fmtMs } from "@pages/collect";
import type { ReTableColumn } from "@repo/ui/re-table";
// 数据源台账已统一到 @pages/datasource（后端数据源中心），本页按其字段口径统计
import { fetchDataSources, type DataSourceInfo } from "@pages/datasource";
import type {
  CollectFlow,
  CollectFunction,
  CollectNotice,
  CollectRuntime,
  CollectTask,
  CollectVariable,
} from "@pages/collect";

defineOptions({ name: "CollectDashboard" });

interface Kpi {
  key: string;
  title: string;
  value: string;
  desc: string;
  icon: string;
  color: string;
  path: string;
}

const router = useRouter();
const runtime = ref<CollectRuntime | null>(null);
const summary = ref<JobSummary | null>(null);
const recentTasks = ref<CollectTask[]>([]);
const flows = ref<CollectFlow[]>([]);
const jobs = ref<JobRuntime[]>([]);
const variables = ref<CollectVariable[]>([]);
const datasources = ref<DataSourceInfo[]>([]);
const functions = ref<CollectFunction[]>([]);
const notices = ref<CollectNotice[]>([]);
const updatedAt = ref("");
const autoRefresh = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

/**
 * 取数失败的分区（供页面底部提示「哪些没取到」）。
 *
 * 为什么改成 allSettled：这一页的 9 个取数分属不同后端，其中 fetchDataSources 走
 * 数据源中心 /ms/datasource/**，该 hub 不在采集调度一体化部署范围内时会 404。
 * 用 Promise.all 时一个 404 就把整批 reject，runtime/summary/jobs 全部停在初始空值，
 * 页面表现为「未取到调度概览 + 台账里还没有任务」，而实际后端完全正常——
 * 排查方向会被整个带偏（真实故障是 datasource 一张卡的事）。
 * 与 CollectOverviewWidget 同一口径：单项失败只降级该项，不连坐整页。
 */
const loadFailed = ref<string[]>([]);

/** 单项取数：成功返回值，失败记入 loadFailed 并回落到兜底值 */
async function tolerate<T>(label: string, run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch {
    loadFailed.value.push(label);
    return fallback;
  }
}

const { loading, reload } = useCollectView(async () => {
  loadFailed.value = [];
  const [rt, sum, taskPage, flowPage, jobPage, vars, ds, fns, nts] = await Promise.all([
    tolerate("运行时参数", fetchRuntime, null as CollectRuntime | null),
    tolerate("调度概览", getSummary, null as JobSummary | null),
    tolerate("最近执行", () => pageTasks({ page: 1, pageSize: 8 }), { rows: [], total: 0, pageNo: 1, pageSize: 8 }),
    tolerate("流程健康", () => pageFlows({ page: 1, pageSize: 8 }), { rows: [], total: 0, pageNo: 1, pageSize: 8 }),
    tolerate("调度任务", () => pageJobs({ pageNum: 1, pageSize: 6 }), { data: [], total: 0, pageNo: 1, pageSize: 6, totalPages: 0 }),
    tolerate("全局变量", listVariables, [] as CollectVariable[]),
    tolerate("数据源", fetchDataSources, [] as DataSourceInfo[]),
    tolerate("自定义函数", listFunctions, [] as CollectFunction[]),
    tolerate("通知", listNotices, [] as CollectNotice[]),
  ]);
  runtime.value = rt;
  summary.value = sum;
  recentTasks.value = taskPage.rows;
  flows.value = flowPage.rows;
  jobs.value = jobPage?.data ?? [];
  variables.value = vars ?? [];
  datasources.value = ds ?? [];
  functions.value = fns ?? [];  notices.value = nts ?? [];
  updatedAt.value = new Date().toLocaleTimeString("zh-CN", { hour12: false });
});

/** 首帧由 useCollectView 的 onMounted 取数，这里只处理 keepAlive 复用时的重取 */
let firstActivate = true;
onActivated(() => {
  if (firstActivate) {
    firstActivate = false;
    return;
  }
  void reload();
  if (autoRefresh.value) {
    toggleAuto(true);
  }
});
// 页面被缓存后切走不会卸载，不停表就等于在后台永久轮询
onDeactivated(() => toggleAuto(false));

const kpis = computed<Kpi[]>(() => {
  const rt = runtime.value;
  const s = summary.value;
  const num = (value: number | undefined) => (value ?? 0).toLocaleString("zh-CN");
  return [
    {
      key: "flow",
      title: "采集流程",
      value: num(rt?.flowCount),
      desc: `启用 ${rt?.enabledFlowCount ?? 0} · 节点类型 ${rt?.shapes.length ?? 0} 种`,
      icon: "Share",
      color: "var(--el-color-primary)",
      path: "/collect/design",
    },
    {
      key: "task",
      title: "执行任务",
      value: num(rt?.taskCount),
      desc: `运行中 ${rt?.runningTasks ?? 0} · 登记调度 ${rt?.scheduledJobCount ?? 0} 个`,
      icon: "Timer",
      color: "var(--el-color-success)",
      path: "/collect/task",
    },
    {
      key: "job",
      title: "调度任务",
      value: num(s?.totalJobs),
      desc: `启用 ${s?.runningJobs ?? 0} · 未注册 ${s?.unregisteredJobs ?? 0}`,
      icon: "AlarmClock",
      color: (s?.unregisteredJobs ?? 0) > 0 ? "var(--el-color-warning)" : "var(--el-color-info)",
      path: "/collect/job",
    },
    {
      key: "fail",
      title: "24 小时失败",
      value: num(s?.recentFailures),
      desc: `本地 ${s?.localJobs ?? 0} · 远程 ${s?.remoteJobs ?? 0}`,
      icon: "WarningFilled",
      color: (s?.recentFailures ?? 0) > 0 ? "var(--el-color-danger)" : "var(--el-color-info)",
      path: "/collect/job-log",
    },
    {
      key: "record",
      title: "采集结果",
      value: num(rt?.recordCount),
      desc: `单任务上限 ${num(rt?.maxRecordPerTask)}`,
      icon: "Files",
      color: "var(--el-color-warning)",
      path: "/collect/record",
    },
    {
      key: "variable",
      title: "全局变量",
      value: num(variables.value.length),
      desc: `密文 ${variables.value.filter(item => item.collectVariableEncrypted === 1).length} 个`,
      icon: "SetUp",
      color: "var(--el-color-info)",
      path: "/collect/variable",
    },
    {
      key: "datasource",
      title: "数据源",
      value: num(datasources.value.length),
      desc: `启用 ${datasources.value.filter(item => item.status === null || item.status === 1).length} 个`,
      icon: "Coin",
      color: "var(--el-color-primary)",
      path: "/collect/datasource/list",
    },
    {
      key: "function",
      title: "自定义函数",
      value: num(functions.value.length),
      desc: `启用 ${functions.value.filter(item => item.collectFunctionEnabled !== 0).length} 个 · 通知 ${notices.value.length}`,
      icon: "Operation",
      color: "var(--el-color-success)",
      path: "/collect/function",
    },
  ];
});

/** 引擎身份：调度面只有一个事实来源，就是概览接口 */
const engineRow = computed(() => {
  const s = summary.value;
  if (!s) {
    return { tone: "info" as const, text: "未取到调度概览，说明 job-starter 治理接口在当前后端未启用" };
  }
  if (!s.leader) {
    return { tone: "warning" as const, text: `${s.role ?? "—"} 角色 · 本节点 ${s.nodeId ?? "—"} 不是 Leader，到点任务不会被派发` };
  }
  if (s.unregisteredJobs > 0) {
    return { tone: "warning" as const, text: `${s.unregisteredJobs} 个启用任务没有同名处理器，去工作台看「未注册」标记` };
  }
  if (s.unclaimedRemoteJobs > 0) {
    return { tone: "warning" as const, text: `${s.unclaimedRemoteJobs} 个启用的远程任务本节点不领取，只由调度中心节点下发` };
  }
  return {
    tone: "success" as const,
    text: `${s.role ?? "—"} 角色 · Leader ${s.nodeId ?? "—"} · 已登记处理器 ${s.registeredHandlers} 个`,
  };
});

const schedulerRows = computed<{ label: string; value: string }[]>(() => {
  const rt = runtime.value;
  const s = summary.value;
  const rows: { label: string; value: string }[] = [];
  if (s) {
    rows.push(
      { label: "调度分组", value: s.group || "—" },
      { label: "扫描节奏", value: `每 ${s.scanIntervalMs}ms 扫描 · 提前 ${s.preReadMs}ms 预读` },
      { label: "台账任务", value: `${s.totalJobs} 个 · 启用 ${s.runningJobs} · 停用 ${s.stoppedJobs}` },
      { label: "分发构成", value: `本地 ${s.localJobs} · 远程 ${s.remoteJobs}${s.remoteDispatchOwnedByMe ? "（由本节点下发）" : `（${s.unclaimedRemoteJobs} 个本节点不领取）`}` },
    );
  }
  if (rt) {
    rows.push(
      { label: "采集执行器", value: rt.executorId || "—" },
      { label: "流程登记", value: `采集流程 ${rt.scheduledJobCount} 个 / 全台账 ${s?.totalJobs ?? 0} 个` },
      { label: "任务超时", value: `${rt.taskTimeoutMs / 1000}s` },
      { label: "请求超时", value: `${rt.requestTimeoutMs / 1000}s` },
      { label: "默认线程", value: String(rt.defaultThreadCount) },
      { label: "单任务结果上限", value: rt.maxRecordPerTask.toLocaleString("zh-CN") },
    );
  }
  return rows;
});

const taskColumns = computed<ReTableColumn[]>(() => [
  { prop: "collectTaskStatus", label: "状态", width: 78, slot: "status" },
  { prop: "collectTaskFlowName", label: "流程", minWidth: 130, showOverflowTooltip: true },
  { prop: "collectTaskTriggerType", label: "触发", width: 68, slot: "trigger" },
  { prop: "collectTaskCost", label: "耗时", width: 78, slot: "cost", align: "right" },
  { prop: "collectTaskBeginTime", label: "开始", width: 132, slot: "begin" },
]);

const flowColumns = computed<ReTableColumn[]>(() => [
  { prop: "collectFlowName", label: "流程", minWidth: 140, showOverflowTooltip: true },
  { prop: "collectFlowCron", label: "调度", width: 118, slot: "cron" },
  { prop: "collectFlowLastExecTime", label: "最近执行", width: 132, slot: "last" },
  { prop: "collectFlowExecCount", label: "次数", width: 66, align: "right" },
]);

const jobColumns = computed<ReTableColumn[]>(() => [
  { prop: "jobName", label: "任务", minWidth: 130, slot: "name", showOverflowTooltip: true },
  { prop: "scheduleType", label: "调度", width: 58, slot: "type" },
  { prop: "enabled", label: "状态", width: 62, slot: "status", align: "center" },
  { prop: "nextFireTime", label: "下次触发", width: 140, slot: "next" },
]);

/**
 * 切换自动刷新。
 *
 * @param value 开关当前值
 */
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
  void router.push(path);
}

function scheduleText(job: JobRuntime): string {
  if (job.scheduleType === "NONE" || !job.scheduleTime) {
    return "不自动调度";
  }
  return job.scheduleType === "CRON" ? `CRON · ${job.scheduleTime}` : `${job.scheduleType} · ${job.scheduleTime}ms`;
}

/** 只保留 "MM-DD HH:mm:ss"，总览里年份占宽且无信息量 */
function shortTime(value: unknown): string {
  const text = String(value ?? "");
  return text.length >= 16 ? text.slice(5, 19) : text || "—";
}
</script>

<template>
  <div class="collect-page">
    <div class="collect-head">
      <ReIcon name="Odometer" :size="18"/>
      <h2 class="collect-head__title">平台总览</h2>
      <ReTag  :type="runtime?.enable ? 'success' : 'danger'" effect="plain">
        {{ runtime?.enable ? "采集已启用" : "采集未启用" }}
      </ReTag>
      <span class="collect-pulse" :class="{ 'is-idle': !runtime?.runningTasks }"/>
      <span class="collect-head__sub">
        运行中 {{ runtime?.runningTasks ?? 0 }} · 执行器 {{ runtime?.executorId || "—" }} ·
        更新于 {{ updatedAt || "—" }}
      </span>
      <span class="spacer"/>
      <span class="collect-hint collect-hint--muted">自动刷新</span>
      <ReSwitch v-model="autoRefresh"  aria-label="每 5 秒自动刷新" @change="toggleAuto"/>
      <ReButton  icon="Refresh" :loading="loading" title="刷新总览" @click="reload">刷新总览</ReButton>
    </div>

    <div class="collect-stats">
      <ReStatCard
        size="compact"
        v-for="kpi in kpis"
        :key="kpi.key"
        class="dash-kpi"
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

    <div class="collect-callout" :class="`is-${engineRow.tone === 'info' ? 'warn' : engineRow.tone}`">
      <ReIcon :name="engineRow.tone === 'success' ? 'CircleCheck' : 'Warning'" :size="14"/>
      <span>{{ engineRow.text }}</span>
    </div>

    <div class="dash-grid">
      <div class="collect-card dash-panel">
        <div class="collect-rail__title dash-panel__head">
          <ReIcon name="Timer" :size="14"/>
          <b>最近执行</b>
          <span class="spacer"/>
          <ReButton  text type="primary" @click="go('/collect/task')">任务监控</ReButton>
        </div>
        <ReTable
          :data="recentTasks as unknown as Record<string, unknown>[]"
          :columns="taskColumns"
          :pagination="false"
          :toolbar="false"
          row-key="collectTaskId"
          :layout-table="{ minHeight: 0 }"
          empty-text="还没有执行记录，去「流程设计」运行一个流程"
        >
          <template #status="{ row }">
            <ReTag  :type="statusTagType(row.collectTaskStatus)" effect="plain">
              {{ statusText(row.collectTaskStatus) }}
            </ReTag>
          </template>
          <template #trigger="{ row }">{{ triggerText(row.collectTaskTriggerType) }}</template>
          <template #cost="{ row }">
            <span class="collect-num">
              <ReTime :value="costMs(row.collectTaskCost)" format="duration" placeholder="—" />
            </span>
          </template>
          <template #begin="{ row }">
            <span class="collect-num">{{ shortTime(row.collectTaskBeginTime) }}</span>
          </template>
        </ReTable>
      </div>

      <div class="collect-card dash-panel">
        <div class="collect-rail__title dash-panel__head">
          <ReIcon name="Share" :size="14"/>
          <b>流程健康</b>
          <span class="spacer"/>
          <ReButton  text type="primary" @click="go('/collect/design')">流程设计</ReButton>
        </div>
        <ReTable
          :data="flows as unknown as Record<string, unknown>[]"
          :columns="flowColumns"
          :pagination="false"
          :toolbar="false"
          row-key="collectFlowId"
          :layout-table="{ minHeight: 0 }"
          empty-text="还没有流程"
        >
          <template #cron="{ row }">
            <span class="collect-cell-mono">{{ row.collectFlowCron || "手动" }}</span>
          </template>
          <template #last="{ row }">
            <span class="collect-num">{{ shortTime(row.collectFlowLastExecTime) }}</span>
          </template>
        </ReTable>
      </div>

      <div class="collect-card dash-panel">
        <div class="collect-rail__title dash-panel__head">
          <ReIcon name="AlarmClock" :size="14"/>
          <b>调度任务</b>
          <span class="spacer"/>
          <ReButton  text type="primary" @click="go('/collect/job')">调度工作台</ReButton>
        </div>
        <ReTable
          :data="jobs as unknown as Record<string, unknown>[]"
          :columns="jobColumns"
          :pagination="false"
          :toolbar="false"
          row-key="jobKey"
          :layout-table="{ minHeight: 0 }"
          empty-text="台账里还没有任务，去工作台新建或在流程设计页给流程配 cron"
        >
          <template #name="{ row }">
            <span>{{ row.jobName || row.jobKey }}</span>
            <ReTag v-if="row.group === COLLECT_FLOW_GROUP" class="collect-tag-inline"  type="primary" effect="plain">
              采集流程
            </ReTag>
          </template>
          <template #type="{ row }">
            <span class="collect-cell-mono" :title="scheduleText(row as unknown as JobRuntime)">{{ row.scheduleType }}</span>
          </template>
          <template #status="{ row }">
            <ReTag  :type="row.enabled === true ? 'success' : 'info'" effect="plain">
              {{ row.enabled === true ? "启用" : "停用" }}
            </ReTag>
          </template>
          <template #next="{ row }">
            <span class="collect-num">{{ row.enabled === true ? fmtMs(row.nextFireTime) : "—" }}</span>
          </template>
        </ReTable>
      </div>
    </div>

    <div class="collect-card">
      <div class="collect-rail__title dash-panel__head">
        <ReIcon name="Setting" :size="14"/>
        <b>运行时参数</b>
        <span class="spacer"/>
        <ReButton  text icon="Share" @click="go('/collect/design')">新建流程</ReButton>
        <ReButton  text icon="SetUp" @click="go('/collect/variable')">变量</ReButton>
        <ReButton  text icon="Coin" @click="go('/collect/datasource/list')">数据源</ReButton>
        <ReButton  text icon="Operation" @click="go('/collect/function')">函数库</ReButton>
        <ReButton  text icon="Bell" @click="go('/collect/notice')">通知</ReButton>
        <ReButton  text icon="Tickets" @click="go('/collect/job-log')">作业日志</ReButton>
      </div>
      <dl class="collect-kv dash-kv">
        <div v-for="item in schedulerRows" :key="item.label" class="dash-kv__item">
          <dt>{{ item.label }}</dt>
          <dd>{{ item.value }}</dd>
        </div>
      </dl>
      <!--
        分区级失败提示：只说「哪几块没取到」，不再用一句「接口都不可用」把整页
        的问题盖住——datasource 中心缺席时，这里只有「数据源」一项，
        其余七块照常出数。
      -->
      <p v-if="loadFailed.length" class="collect-hint collect-hint--muted">
        以下分区未取到数据：{{ loadFailed.join("、") }}
      </p>
      <p v-else-if="!schedulerRows.length" class="collect-hint collect-hint--muted">
        未取到运行时参数，说明采集与调度接口在当前后端都不可用。
      </p>
    </div>
  </div>
</template>

<style scoped>
.dash-kpi {
  cursor: pointer;
  transition: box-shadow var(--cc-duration) var(--cc-ease), transform var(--cc-duration) var(--cc-ease);
}

.dash-kpi:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgb(0 0 0 / 8%);
}

.dash-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: var(--cc-gap);
}

.dash-panel {
  padding-bottom: 6px;
  min-width: 0;
}

.dash-panel__head {
  padding-bottom: 8px;
}

.dash-kv {
  grid-template-columns: 1fr;
  gap: var(--cc-gap-sm) var(--cc-gap);
}

.dash-kv__item {
  display: grid;
  grid-template-columns: 116px minmax(0, 1fr);
  gap: 12px;
  align-items: baseline;
  min-width: 0;
}

@media (min-width: 1100px) {
  .dash-kv {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* 动效降级：系统开启「减少动态效果」时，KPI 卡上浮 + 投影不再渐变，直接到位。
   只关 .dash-kpi 自己的 transition，不写通配 *，避免掐掉内部 ReStatCard 的合法动效。 */
@media (prefers-reduced-motion: reduce) {
  .dash-kpi {
    transition: none;
  }
}
</style>
