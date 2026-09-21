<!--
  平台总览：登录后的落地页（app.yaml 的 routeConfig.homePath 指向本页）。

  数据全部来自现网接口，不做前端推算：runtime 给执行器与统计，task/flow 分页给最近执行与流程健康，
  变量/数据源/函数/通知取列表长度；调度面直接读 sys_job 台账与作业日志的总数。
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
import ReStatCard from "@repo/ui/re-stat-card";
import {
  fetchRuntime,
  listDatasources,
  listFunctions,
  listNotices,
  listVariables,
  pageFlows,
  pageTasks,
} from "../api/collectApi";
import { pageJobs, pageJobLogs } from "../api/jobApi";
import { costText, statusTagType, statusText, triggerText } from "../constants/taskStatus";
import { useCollectGated, useCollectView } from "../composables/useCollectView";
import { fmtMs } from "../utils/time";
import type { ReTableColumn } from "@repo/ui/re-table";
import type { SysJob } from "../types/job";
import type {
  CollectDatasourceVO,
  CollectFlow,
  CollectFunction,
  CollectNotice,
  CollectRuntime,
  CollectTask,
  CollectVariable,
} from "../types/collect";

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
const recentTasks = ref<CollectTask[]>([]);
const flows = ref<CollectFlow[]>([]);
const variables = ref<CollectVariable[]>([]);
const datasources = ref<CollectDatasourceVO[]>([]);
const functions = ref<CollectFunction[]>([]);
const notices = ref<CollectNotice[]>([]);
const jobs = ref<SysJob[]>([]);
const jobTotal = ref(0);
const enabledJobCount = ref(0);
const failureLogCount = ref(0);
const updatedAt = ref("");
const autoRefresh = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

const { ready } = useCollectGated();
const { loading, reload } = useCollectView(async () => {
  const [rt, taskPage, flowPage, vars, ds, fns, nts, jobPage, enabledPage, failedLogPage] = await Promise.all([
    fetchRuntime(),
    pageTasks({ page: 1, pageSize: 8 }),
    pageFlows({ page: 1, pageSize: 8 }),
    listVariables(),
    listDatasources(),
    listFunctions(),
    listNotices(),
    pageJobs({ pageNum: 1, pageSize: 6 }),
    pageJobs({ pageNum: 1, pageSize: 1, sysJobTriggerStatus: 1 }),
    pageJobLogs({ pageNum: 1, pageSize: 1, executeCode: "FAILURE" }),
  ]);
  runtime.value = rt;
  recentTasks.value = taskPage.rows;
  flows.value = flowPage.rows;
  variables.value = vars ?? [];
  datasources.value = ds ?? [];
  functions.value = fns ?? [];
  notices.value = nts ?? [];
  jobs.value = jobPage.rows;
  jobTotal.value = jobPage.total;
  enabledJobCount.value = enabledPage.total;
  failureLogCount.value = failedLogPage.total;
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
      desc: `运行中 ${rt?.runningTasks ?? 0} · 采集流程登记 ${rt?.scheduledJobCount ?? 0} 个`,
      icon: "Timer",
      color: "var(--el-color-success)",
      path: "/collect/task",
    },
    {
      key: "job",
      title: "调度作业",
      value: num(jobTotal.value),
      desc: `启用 ${enabledJobCount.value} · 失败轮次 ${failureLogCount.value}`,
      icon: "AlarmClock",
      color: "var(--el-color-info)",
      path: "/collect/job",
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
      desc: `启用 ${datasources.value.filter(item => item.collectDatasourceStatus === 1).length} 个`,
      icon: "Coin",
      color: "var(--el-color-primary)",
      path: "/collect/datasource",
    },
    {
      key: "function",
      title: "自定义函数",
      value: num(functions.value.length),
      desc: `启用 ${functions.value.filter(item => item.collectFunctionEnabled !== 0).length} 个`,
      icon: "Operation",
      color: "var(--el-color-success)",
      path: "/collect/function",
    },
    {
      key: "notice",
      title: "执行通知",
      value: num(notices.value.length),
      desc: `启用 ${notices.value.filter(item => item.collectNoticeEnabled !== 0).length} 个`,
      icon: "Bell",
      color: "var(--el-color-danger)",
      path: "/collect/notice",
    },
  ];
});

const schedulerRows = computed<{ label: string; value: string }[]>(() => {
  const rt = runtime.value;
  if (!rt) {
    return [];
  }
  return [
    { label: "执行器", value: rt.executorId || "—" },
    { label: "调度台账", value: `${rt.schedulerGroup} · 采集流程登记 ${rt.scheduledJobCount} / 全台账 ${jobTotal.value} 个作业` },
    { label: "启用中作业", value: `${enabledJobCount.value} 个 · 失败轮次 ${failureLogCount.value}` },
    { label: "任务超时", value: `${rt.taskTimeoutMs / 1000}s` },
    { label: "请求超时", value: `${rt.requestTimeoutMs / 1000}s` },
    { label: "默认线程", value: String(rt.defaultThreadCount) },
    { label: "单任务结果上限", value: rt.maxRecordPerTask.toLocaleString("zh-CN") },
  ];
});

const taskColumns = computed<ReTableColumn[]>(() => [
  { prop: "status", label: "状态", width: 78, slot: "status" },
  { prop: "collectTaskFlowName", label: "流程", minWidth: 130, showOverflowTooltip: true },
  { prop: "collectTaskTriggerType", label: "触发", width: 68, slot: "trigger" },
  { prop: "collectTaskCost", label: "耗时", width: 78, slot: "cost", align: "right" },
  { prop: "collectTaskBeginTime", label: "开始", width: 150, slot: "begin" },
]);

const flowColumns = computed<ReTableColumn[]>(() => [
  { prop: "collectFlowName", label: "流程", minWidth: 140, showOverflowTooltip: true },
  { prop: "collectFlowCron", label: "调度", width: 120, slot: "cron", showOverflowTooltip: true },
  { prop: "collectFlowLastExecTime", label: "最近执行", width: 150, slot: "last" },
  { prop: "collectFlowExecCount", label: "次数", width: 74, align: "right" },
  { prop: "action", label: "操作", width: 72, slot: "action" },
]);

const jobColumns = computed<ReTableColumn[]>(() => [
  { prop: "sysJobName", label: "作业", minWidth: 130, showOverflowTooltip: true },
  { prop: "sysJobScheduleType", label: "调度", width: 60, align: "center" },
  { prop: "sysJobTriggerStatus", label: "状态", width: 62, slot: "status", align: "center" },
  { prop: "sysJobTriggerNextTime", label: "下次触发", width: 150, slot: "next" },
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

/** 只保留 "MM-DD HH:mm:ss"，总览里年份占宽且无信息量 */
function shortTime(value: unknown): string {
  const text = String(value ?? "");
  return text.length >= 16 ? text.slice(5) : text || "—";
}
</script>

<template>
  <div class="collect-page">
    <div class="collect-card collect-card--head">
      <ReIcon name="Odometer" :size="18"/>
      <b>平台总览</b>
      <ReTag size="small" :type="runtime?.enable ? 'success' : 'danger'" effect="plain">
        {{ runtime?.enable ? "调度已启用" : "调度未启用" }}
      </ReTag>
      <span class="collect-pulse" :class="{ 'is-idle': !runtime?.runningTasks }"/>
      <span class="collect-hint">运行中 {{ runtime?.runningTasks ?? 0 }} · 执行器 {{ runtime?.executorId || "—" }}</span>
      <span class="spacer"/>
      <span class="collect-hint collect-hint--muted">更新于 {{ updatedAt || "—" }}</span>
      <span class="collect-hint">自动刷新</span>
      <ReSwitch v-model="autoRefresh" size="small" @change="toggleAuto"/>
      <ReButton size="small" icon="Refresh" :loading="loading" @click="reload">刷新</ReButton>
    </div>

    <div class="dash-kpis">
      <ReStatCard
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

    <div class="dash-grid">
      <div class="collect-card dash-panel">
        <div class="collect-card--head dash-panel__head">
          <b>最近执行</b>
          <span class="spacer"/>
          <ReButton size="small" text type="primary" @click="go('/collect/task')">任务监控</ReButton>
        </div>
        <ReTable
          v-if="ready"
          :data="recentTasks as unknown as Record<string, unknown>[]"
          :columns="taskColumns"
          :pagination="false"
          :toolbar="false"
          row-key="collectTaskId"
          size="small"
          empty-text="还没有执行记录，去「流程设计」运行一个流程"
        >
          <template #status="{ row }">
            <ReTag size="small" :type="statusTagType(row.collectTaskStatus)" effect="plain">
              {{ statusText(row.collectTaskStatus) }}
            </ReTag>
          </template>
          <template #trigger="{ row }">{{ triggerText(row.collectTaskTriggerType) }}</template>
          <template #cost="{ row }">{{ costText(row.collectTaskCost) }}</template>
          <template #begin="{ row }">
            <span class="collect-cell-mono">{{ shortTime(row.collectTaskBeginTime) }}</span>
          </template>
        </ReTable>
      </div>

      <div class="collect-card dash-panel">
        <div class="collect-card--head dash-panel__head">
          <b>流程健康</b>
          <span class="spacer"/>
          <ReButton size="small" text type="primary" @click="go('/collect/design')">流程设计</ReButton>
        </div>
        <ReTable
          v-if="ready"
          :data="flows as unknown as Record<string, unknown>[]"
          :columns="flowColumns"
          :pagination="false"
          :toolbar="false"
          row-key="collectFlowId"
          size="small"
          empty-text="还没有流程"
        >
          <template #cron="{ row }">
            <span class="collect-cell-mono">{{ row.collectFlowCron || "手动" }}</span>
          </template>
          <template #last="{ row }">
            <span class="collect-cell-mono">{{ shortTime(row.collectFlowLastExecTime) }}</span>
          </template>
          <template #action="{ row }">
            <ReButton size="small" text type="primary" @click="go('/collect/design')">
              {{ row.running ? "运行中" : "编排" }}
            </ReButton>
          </template>
        </ReTable>
      </div>
      <div class="collect-card dash-panel">
        <div class="collect-card--head dash-panel__head">
          <b>调度作业</b>
          <span class="spacer"/>
          <ReButton size="small" text type="primary" @click="go('/collect/job')">调度作业台</ReButton>
        </div>
        <ReTable
          v-if="ready"
          :data="jobs as unknown as Record<string, unknown>[]"
          :columns="jobColumns"
          :pagination="false"
          :toolbar="false"
          row-key="sysJobNo"
          size="small"
          empty-text="台账为空，去「调度作业」新建或在流程设计页给流程配 cron"
        >
          <template #status="{ row }">
            <ReTag size="small" :type="Number(row.sysJobTriggerStatus) === 1 ? 'success' : 'info'" effect="plain">
              {{ Number(row.sysJobTriggerStatus) === 1 ? "启用" : "停用" }}
            </ReTag>
          </template>
          <template #next="{ row }">
            <span class="collect-cell-mono">
              {{ Number(row.sysJobTriggerStatus) === 1 ? fmtMs(row.sysJobTriggerNextTime) : "—" }}
            </span>
          </template>
        </ReTable>
      </div>
    </div>

    <div class="collect-card">
      <div class="collect-card--head dash-panel__head">
        <b>调度与执行参数</b>
        <span class="spacer"/>
        <ReButton size="small" icon="DocumentAdd" @click="go('/collect/design')">新建流程</ReButton>
        <ReButton size="small" icon="SetUp" @click="go('/collect/variable')">变量</ReButton>
        <ReButton size="small" icon="Coin" @click="go('/collect/datasource')">数据源</ReButton>
        <ReButton size="small" icon="Operation" @click="go('/collect/function')">函数库</ReButton>
        <ReButton size="small" icon="Bell" @click="go('/collect/notice')">通知</ReButton>
        <ReButton size="small" icon="AlarmClock" @click="go('/collect/job')">调度作业</ReButton>
        <ReButton size="small" icon="Tickets" @click="go('/collect/job-log')">作业日志</ReButton>
      </div>
      <dl class="collect-kv dash-kv">
        <div v-for="item in schedulerRows" :key="item.label" class="dash-kv__item">
          <dt>{{ item.label }}</dt>
          <dd>{{ item.value }}</dd>
        </div>
      </dl>
      <p v-if="!schedulerRows.length" class="collect-hint collect-hint--muted">
        未取到运行时参数，说明采集模块在当前后端未启用。
      </p>
    </div>
  </div>
</template>

<style scoped>
.dash-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(168px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.dash-kpi {
  cursor: pointer;
  transition: box-shadow 0.18s ease, transform 0.18s ease;
}

.dash-kpi:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgb(0 0 0 / 8%);
}

.dash-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.dash-panel {
  padding-bottom: 6px;
}

.dash-panel__head {
  padding: 2px 2px 8px;
  border: none;
  box-shadow: none;
}

.dash-kv {
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.dash-kv__item {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}

.dash-kv__item dt {
  flex: 0 0 auto;
}

.dash-kv__item dd {
  flex: 1 1 auto;
  min-width: 0;
}
</style>
