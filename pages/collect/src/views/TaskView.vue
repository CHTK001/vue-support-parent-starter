<!--
  运行记录（原任务监控）：每一次运行 = 一条记录 = 一个运行ID。

  状态与触发方式是后端字符串常量（CollectTaskStatus / CollectTriggerType），
  这里只做展示映射，不参与业务判断；日志接口单次上限 1000 条，按执行顺序返回。
  翻页交给 ReTable 的 loader，查询条件走内置搜索区（ReSearch）：草稿值点「查询」才生效，
  「清理 7 天前」跟着最近一次真正生效的流程筛选走，避免按没提交的下拉值误删。

  行内三个出口：回放（按节点日志重演，纯动画不重跑）、采集结果（按运行ID 过滤）、
  节点日志（原始表格，排查时看细节）。
-->
<script setup lang="ts">
import { computed, onActivated, onBeforeUnmount, onMounted, ref } from "vue";
import { getRouter, msgError, msgInfo, msgSuccess } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import ReCostText from "@repo/ui/re-cost-text";
import LogFullTextDialog from "../components/LogFullTextDialog.vue";
import RunReplayDialog from "../components/RunReplayDialog.vue";
import TaskMonitorDialog from "../components/TaskMonitorDialog.vue";
import TaskQualityDialog from "../components/TaskQualityDialog.vue";
import { cleanTasks, deleteTask, fetchTaskLogs, listFlows, pageTasks } from "../api/collectApi";
import { COLLECT_ACTIONS } from "../constants/actionColumns";
import { costMs, statusTagType, statusText, triggerText } from "../constants/taskStatus";
import { confirmAction, errText, useCollectView } from "../composables/useCollectView";
import type { RePageResult, ReTableAutoRefresh, ReTableColumn, ReTableLoadParams, ReTableSearchConfig } from "@repo/ui/re-table";
import type { CollectFlow, CollectTask, CollectTaskLog } from "../types/collect";

defineOptions({ name: "CollectRun" });

const STATUS_OPTIONS = [
  { label: "执行中", value: "RUNNING" },
  { label: "成功", value: "SUCCESS" },
  { label: "失败", value: "FAILURE" },
  { label: "已停止", value: "STOPPED" },
];

const TRIGGER_OPTIONS = [
  { label: "定时", value: "CRON" },
  { label: "手动", value: "MANUAL" },
  { label: "试运行", value: "TEST" },
];

/** 分页游标：查询条件不在这里，交给内置搜索区的 searchModel */
interface TaskQuery {
  page: number;
  pageSize: number;
}

const query = ref<TaskQuery>({ page: 1, pageSize: 20 });
/** 内置搜索区的草稿值，点「查询」时由 ReTable 合并进 loader 的 params */
const searchModel = ref<Record<string, unknown>>({
  collectTaskFlowId: "",
  collectTaskStatus: "",
  collectTaskTriggerType: "",
  collectTaskNo: "",
});

/**
 * 自动刷新交给 ReTable 的内置能力（工具栏计时器入口 + 浮层选档）。
 *
 * 档位只给"不刷新 / 5 秒 / 10 秒"三档：运行记录是人盯着看的列表，3s 太密
 * （接口是分页查询，打穿了没意义）、30s/60s 又长到看不出变化，5s/10s 刚好。
 * 挂载默认关闭（defaultOn 省略），用户选一次即可。
 */
const AUTO_REFRESH: ReTableAutoRefresh = {
  interval: 5000,
  intervals: [0, 5000, 10000],
};

const flows = ref<CollectFlow[]>([]);
const tableRef = ref<{ reload: () => void; goto: (page?: number) => void; clearAllSelection: () => void } | null>(null);

/**
 * 当前勾选的运行记录（跨页常驻勾选列回传），批量删除的输入。
 *
 * <p>与采集结果页（RecordView）同一套模式：勾选状态由 ReTable 常驻勾选列持有，
 * 翻页不丢；删完统一 clearAllSelection 收口。</p>
 */
const selected = ref<CollectTask[]>([]);

/** 回放弹窗选中的运行 */
const replayTask = ref<CollectTask | null>(null);
const replayVisible = ref(false);

/** 质量报告弹窗选中的运行 */
const qualityTask = ref<CollectTask | null>(null);
const qualityVisible = ref(false);

/** 实时监控弹窗选中的运行 */
const monitorTask = ref<CollectTask | null>(null);
const monitorVisible = ref(false);

const { reload: reloadFlows } = useCollectView(async () => {
  flows.value = (await listFlows()) ?? [];
});

const flowOptions = computed(() =>
  flows.value.map(item => ({
    label: String(item.collectFlowName ?? item.collectFlowId),
    value: String(item.collectFlowId),
  })),
);

/** 最近一次取数真正生效的流程筛选：下拉改了没查之前不作数 */
const activeFlowId = ref("");

/** 清理历史任务的按钮文案：按是否限定流程给不同说法，标题与按钮文字共用一份 */
const cleanTitle = computed(() =>
  activeFlowId.value ? "清理该流程 7 天前的历史任务" : "清理全部流程 7 天前的历史任务",
);

/** 内置搜索区：必须是 computed，流程下拉的选项要跟着流程列表刷新 */
const SEARCH = computed<ReTableSearchConfig>(() => ({
  title: "搜索任务",
  filters: [
    {
      key: "collectTaskFlowId",
      label: "流程",
      type: "select",
      placeholder: "全部流程",
      options: flowOptions.value,
      attrs: { filterable: true },
    },
    { key: "collectTaskStatus", label: "状态", type: "select", placeholder: "全部状态", options: STATUS_OPTIONS },
    {
      key: "collectTaskTriggerType",
      label: "触发方式",
      type: "select",
      placeholder: "全部触发",
      options: TRIGGER_OPTIONS,
    },
    { key: "collectTaskNo", label: "任务号", type: "input", placeholder: "任务号模糊查询" },
  ],
}));

const columns = computed<ReTableColumn[]>(() => [
  { prop: "collectTaskNo", label: "运行ID", width: 180, slot: "no" },
  { prop: "collectTaskFlowName", label: "采集器", minWidth: 140, showOverflowTooltip: true },
  { prop: "collectTaskStatus", label: "状态", width: 92, slot: "status", align: "center" },
  { prop: "collectTaskTriggerType", label: "触发", width: 80, slot: "trigger", align: "center" },
  { prop: "collectTaskBeginTime", label: "开始时间", width: 176 },
  { prop: "collectTaskEndTime", label: "结束时间", width: 176 },
  { prop: "collectTaskCost", label: "耗时", width: 90, slot: "cost", align: "right" },
  { prop: "collectTaskNodeCount", label: "节点/请求/结果", width: 126, slot: "counts", align: "center" },
  { prop: "collectTaskExecutorId", label: "执行器", width: 200, showOverflowTooltip: true },
  { prop: "collectTaskError", label: "错误", minWidth: 160, showOverflowTooltip: true },
  { prop: "action", label: "操作", width: 260, slot: "action", fixed: "right" },
]);

const logColumns = computed<ReTableColumn[]>(() => [
  { prop: "collectTaskLogNodeName", label: "节点", minWidth: 130, showOverflowTooltip: true },
  { prop: "collectTaskLogNodeId", label: "节点ID", width: 150, showOverflowTooltip: true },
  { prop: "collectTaskLogNodeShape", label: "类型", width: 90, align: "center" },
  { prop: "collectTaskLogIteration", label: "迭代", width: 66, slot: "iteration", align: "center" },
  { prop: "collectTaskLogStatus", label: "状态", width: 88, slot: "status", align: "center" },
  { prop: "collectTaskLogCost", label: "耗时", width: 86, slot: "cost", align: "right" },
  { prop: "collectTaskLogMessage", label: "消息", minWidth: 160, showOverflowTooltip: true },
  { prop: "collectTaskLogOutput", label: "出参预览", minWidth: 220, showOverflowTooltip: true },
  { prop: "logFull", label: "全文", width: 84, slot: "logFull", align: "center", fixed: "right" },
]);

const logsVisible = ref(false);
const logs = ref<CollectTaskLog[]>([]);
const logsLoading = ref(false);
const logsTask = ref<CollectTask | null>(null);

/**
 * 日志全文弹层：表格里「消息」「出参预览」都受列宽与后端 COLUMN_LIMIT 截断，
 * 排查时看不到完整值，所以每行给一个「全文」入口（见 LogFullTextDialog）。
 */
const logFullVisible = ref(false);
const logFullTarget = ref<CollectTaskLog | null>(null);

function showLogFull(input: Record<string, unknown>): void {
  logFullTarget.value = input as unknown as CollectTaskLog;
  logFullVisible.value = true;
}

async function loadTasks({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  activeFlowId.value = params.collectTaskFlowId ? String(params.collectTaskFlowId) : "";
  const page1 = await pageTasks({
    page,
    pageSize,
    collectTaskFlowId: params.collectTaskFlowId as string | undefined,
    collectTaskStatus: params.collectTaskStatus as string | undefined,
    collectTaskTriggerType: params.collectTaskTriggerType as string | undefined,
    collectTaskNo: params.collectTaskNo as string | undefined,
  });
  return { total: page1.total, data: page1.rows as unknown as Record<string, unknown>[] };
}

/** 点「查询」：ReTable 自己会带新条件重载，本页只负责不在第一页时跳回去 */
function backToFirstPage(): void {
  if (query.value.page !== 1) {
    void tableRef.value?.goto(1);
  }
}

/** 点「重置」：内置搜索区只清值不取数，必须回到第一页重查一次 */
function reloadFromFirstPage(): void {
  void tableRef.value?.goto(1);
}

async function showLogs(input: Record<string, unknown>): Promise<void> {
  const task = input as unknown as CollectTask;
  logsVisible.value = true;
  logsTask.value = task;
  logsLoading.value = true;
  try {
    logs.value = (await fetchTaskLogs(task.collectTaskId)) ?? [];
  } catch (error) {
    logs.value = [];
    msgError(errText(error));
  } finally {
    logsLoading.value = false;
  }
}

/** 回放：只重演节点日志，不重跑采集 */
function openReplay(input: Record<string, unknown>): void {
  replayTask.value = input as unknown as CollectTask;
  replayVisible.value = true;
}

/** 质量报告：按节点日志聚合健康指标 */
function openQuality(input: Record<string, unknown>): void {
  qualityTask.value = input as unknown as CollectTask;
  qualityVisible.value = true;
}

/** 实时监控：轮询运行中的节点状态 */
function openMonitor(input: Record<string, unknown>): void {
  monitorTask.value = input as unknown as CollectTask;
  monitorVisible.value = true;
}

/** 采集结果：按运行ID 过滤到这一次跑出来的东西 */
function gotoRecords(input: Record<string, unknown>): void {
  const task = input as unknown as CollectTask;
  void getRouter().push({ path: "/collect/record", query: { taskId: String(task.collectTaskId) } });
}

/**
 * 深链预置筛选：采集器管理点「运行记录」带 flowId 过来。
 *
 * 写进 searchModel 再走一次 reload，等价于用户自己选了流程点查询——
 * 不自己拼 params 绕开 ReTable，否则「清理 7 天前」跟着 activeFlowId 走的逻辑会失配。
 */
function applyFlowDeepLink(): void {
  const flowId = getRouter().currentRoute.value.query?.flowId;
  if (!flowId) {
    return;
  }
  searchModel.value = { ...searchModel.value, collectTaskFlowId: String(flowId) };
  void tableRef.value?.goto(1);
}

async function removeTask(input: Record<string, unknown>): Promise<void> {
  const task = input as unknown as CollectTask;
  if (!(await confirmAction(`确认删除任务 ${task.collectTaskNo} 及其节点日志？`, "删除任务"))) {
    return;
  }
  try {
    await deleteTask(task.collectTaskId);
    msgSuccess("任务已删除");
    tableRef.value?.reload();
  } catch (error) {
    msgError(errText(error));
  }
}

/** ReTable 勾选列回传：跨页保持，翻页/筛选变化时由 ReTable 重新回传 */
function pickSelection(rows: Record<string, unknown>[]): void {
  selected.value = rows as unknown as CollectTask[];
}

/**
 * 批量删除勾选的运行记录。
 *
 * <p>逐个删 + 逐行报错，任一失败不中断整批（与调度作业页 JobView 的批量删除同款模式）：
 * 运行记录接口只有单条删除，没有批量端点，串行逐条删是既定做法。</p>
 */
async function removeSelected(): Promise<void> {
  const rows = selected.value;
  if (!rows.length) {
    msgInfo("请先勾选要删除的运行记录");
    return;
  }
  if (!(await confirmAction(`确认删除勾选的 ${rows.length} 个运行记录及其节点日志？`, "批量删除"))) {
    return;
  }
  let done = 0;
  for (const task of rows) {
    try {
      await deleteTask(task.collectTaskId);
      done++;
    } catch (error) {
      msgError(`任务 ${task.collectTaskNo}：${errText(error)}`);
    }
  }
  msgSuccess(`已删除 ${done} 个运行记录`);
  clearSelection();
  tableRef.value?.reload();
}

/** 清空勾选：本地 selected 与 ReTable 常驻勾选列一起清 */
function clearSelection(): void {
  selected.value = [];
  tableRef.value?.clearAllSelection();
}

async function cleanHistory(): Promise<void> {
  const flowId = activeFlowId.value;
  const scope = flowId ? `流程「${flowOptions.value.find(item => item.value === flowId)?.label ?? flowId}」` : "全部流程";
  if (!(await confirmAction(`确认清理 ${scope} 7 天前的历史任务？`, "清理历史"))) {
    return;
  }
  try {
    const removed = await cleanTasks(flowId ? Number(flowId) : undefined, 7);
    msgInfo(`已清理 ${removed} 条历史任务`);
    tableRef.value?.reload();
  } catch (error) {
    msgError(errText(error));
  }
}

/** keep-alive 命中后挂载只跑一次，重进页面靠激活钩子取新数据 */
let firstActivation = true;
onActivated(() => {
  if (firstActivation) {
    firstActivation = false;
    applyFlowDeepLink();
    return;
  }
  void reloadFlows();
  tableRef.value?.reload();
});

/* 运行中任务的实时耗时：前端每 1s 用开始时间滚动刷新，不需要等后端刷新 */
const clock = ref(Date.now());
let clockTimer: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
  clockTimer = setInterval(() => {
    clock.value = Date.now();
  }, 1000);
});
onBeforeUnmount(() => {
  if (clockTimer) {
    clearInterval(clockTimer);
    clockTimer = null;
  }
});

function displayCost(row: CollectTask): number | null {
  if (row.running || row.collectTaskStatus === "RUNNING") {
    const begin = row.collectTaskBeginTime ? new Date(row.collectTaskBeginTime.replace(/-/g, "/")).getTime() : 0;
    if (begin) {
      return Math.max(0, clock.value - begin);
    }
  }
  return row.collectTaskCost ?? null;
}

</script>

<template>
  <div class="collect-page">
    <ReTable
      ref="tableRef"
      class="collect-card"
      table-id="collect-task"
      :loader="loadTasks"
      :params="query"
      :columns="columns"
      row-key="collectTaskId"
      show-selection
      v-model:page="query.page"
      v-model:page-size="query.pageSize"
      v-model:search-model="searchModel"
      :search="SEARCH"
      :page-sizes="[10, 20, 50, 100]"
      :auto-refresh="AUTO_REFRESH"
      empty-text="暂无运行记录，去「采集器管理」运行一个采集器"
      stripe
      @selection-change="pickSelection"
      @search="backToFirstPage"
      @search-reset="reloadFromFirstPage"
    >
      <template #toolbar>
        <ReButton
          icon="Delete"
          type="danger"
          layout="square"
          :tip="cleanTitle"
          @click="cleanHistory"/>
        <template v-if="selected.length">
          <span class="collect-hint">已选 {{ selected.length }} 项</span>
          <ReButton
            icon="Delete"
            type="danger"
            layout="square"
            tip="删除勾选的运行记录"
            @click="removeSelected"/>
          <ReButton icon="CircleClose" tip="清空选择" @click="clearSelection">清空选择</ReButton>
        </template>
      </template>

      <template #no="{ row }">
        <span class="collect-cell-mono">{{ row.collectTaskNo }}</span>
      </template>
      <template #status="{ row }">
        <ReTag  :type="statusTagType(row.collectTaskStatus)" effect="plain">
          {{ statusText(row.collectTaskStatus) }}
        </ReTag>
      </template>
      <template #trigger="{ row }">{{ triggerText(row.collectTaskTriggerType) }}</template>
      <template #cost="{ row }">
        <ReCostText :cost="displayCost(row)" />
      </template>
      <template #counts="{ row }">
        {{ row.collectTaskNodeCount ?? 0 }} / {{ row.collectTaskRequestCount ?? 0 }} /
        {{ row.collectTaskRecordCount ?? 0 }}
      </template>
      <template #action="{ row }">
        <ReButton v-bind="COLLECT_ACTIONS.replay" layout="square" @click="openReplay(row)"/>
        <ReButton v-bind="COLLECT_ACTIONS.quality" layout="square" @click="openQuality(row)"/>
        <ReButton v-bind="COLLECT_ACTIONS.monitor" layout="square" @click="openMonitor(row)"/>
        <ReButton v-bind="COLLECT_ACTIONS.records" layout="square" @click="gotoRecords(row)"/>
        <ReButton v-bind="COLLECT_ACTIONS.logs" layout="square" @click="showLogs(row)"/>
        <ReButton v-bind="COLLECT_ACTIONS.deleteRun" layout="square" @click="removeTask(row)"/>
      </template>
    </ReTable>

    <ReDialog
      v-model="logsVisible"
      :title="`节点日志 · ${logsTask?.collectTaskNo || ''}`"
      width="920px"
      top="6vh"
      footer-hidden
    >
      <ReTable
        :loading="logsLoading"
        :data="logs"
        :columns="logColumns"
        :pagination="true"
        pagination-mode="scroll"
        :page-size="50"
        :layout-table="{ maxHeight: 460 }"
        row-key="collectTaskLogId"
        empty-text="该任务暂无节点日志"
        stripe
      >
        <template #status="{ row }">
          <ReTag  :type="statusTagType(row.collectTaskLogStatus)" effect="plain">
            {{ statusText(row.collectTaskLogStatus) }}
          </ReTag>
        </template>
        <template #cost="{ row }">
          <ReCostText :cost="costMs(row.collectTaskLogCost)" />
        </template>
        <template #iteration="{ row }">
          {{ row.collectTaskLogIteration == null ? "—" : Number(row.collectTaskLogIteration) + 1 }}
        </template>
        <template #logFull="{ row }">
          <ReButton layout="square" icon="Document" tip="看这条节点日志的完整消息与出参" @click="showLogFull(row)"/>
        </template>
      </ReTable>
    </ReDialog>

    <LogFullTextDialog v-model="logFullVisible" :log="logFullTarget"/>

    <RunReplayDialog v-model="replayVisible" :task="replayTask" />

    <TaskQualityDialog v-model="qualityVisible" :task="qualityTask" />

    <TaskMonitorDialog v-model="monitorVisible" :task="monitorTask" />
  </div>
</template>
