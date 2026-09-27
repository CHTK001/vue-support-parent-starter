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
import { computed, onActivated, onDeactivated, onUnmounted, ref } from "vue";
import { getRouter, msgError, msgInfo, msgSuccess } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReSwitch from "@repo/ui/re-switch";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import RunReplayDialog from "../components/RunReplayDialog.vue";
import { cleanTasks, deleteTask, fetchTaskLogs, listFlows, pageTasks } from "../api/collectApi";
import { costText, statusTagType, statusText, triggerText } from "../constants/taskStatus";
import { confirmAction, errText, useCollectView } from "../composables/useCollectView";
import type { RePageResult, ReTableColumn, ReTableLoadParams, ReTableSearchConfig } from "@repo/ui/re-table";
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

const flows = ref<CollectFlow[]>([]);
const autoRefresh = ref(false);
const tableRef = ref<{ reload: () => void; goto: (page?: number) => void } | null>(null);
let timer: ReturnType<typeof setInterval> | null = null;

/** 回放弹窗选中的运行 */
const replayTask = ref<CollectTask | null>(null);
const replayVisible = ref(false);

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
  { prop: "action", label: "操作", width: 176, slot: "action", fixed: "right" },
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
]);

const logsVisible = ref(false);
const logs = ref<CollectTaskLog[]>([]);
const logsLoading = ref(false);
const logsTask = ref<CollectTask | null>(null);

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

function toggleAuto(value: boolean): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  if (value) {
    timer = setInterval(() => tableRef.value?.reload(), 3000);
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
  if (autoRefresh.value) {
    toggleAuto(true);
  }
});

onDeactivated(() => {
  toggleAuto(false);
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
});
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
      v-model:page="query.page"
      v-model:page-size="query.pageSize"
      v-model:search-model="searchModel"
      :search="SEARCH"
      :page-sizes="[10, 20, 50, 100]"
      empty-text="暂无运行记录，去「采集器管理」运行一个采集器"
      stripe
      @search="backToFirstPage"
      @search-reset="reloadFromFirstPage"
    >
      <template #toolbar>
        <span class="collect-hint">自动刷新</span>
        <ReSwitch v-model="autoRefresh" size="small" @change="toggleAuto(autoRefresh === true)"/>
        <ReButton
          icon="Delete"
          type="danger"
          :title="cleanTitle"
          @click="cleanHistory">{{ cleanTitle }}</ReButton>
      </template>

      <template #no="{ row }">
        <span class="collect-cell-mono">{{ row.collectTaskNo }}</span>
      </template>
      <template #status="{ row }">
        <ReTag size="small" :type="statusTagType(row.collectTaskStatus)" effect="plain">
          {{ statusText(row.collectTaskStatus) }}
        </ReTag>
      </template>
      <template #trigger="{ row }">{{ triggerText(row.collectTaskTriggerType) }}</template>
      <template #cost="{ row }">{{ costText(row.collectTaskCost) }}</template>
      <template #counts="{ row }">
        {{ row.collectTaskNodeCount ?? 0 }} / {{ row.collectTaskRequestCount ?? 0 }} /
        {{ row.collectTaskRecordCount ?? 0 }}
      </template>
      <template #action="{ row }">
        <ReButton layout="square" icon="VideoPlay" type="primary" tip="回放这次运行（只看动画，不重跑）" @click="openReplay(row)"/>
        <ReButton layout="square" icon="Files" tip="看这次运行产出的采集结果" @click="gotoRecords(row)"/>
        <ReButton layout="square" icon="Tickets" tip="看这次运行的节点日志" @click="showLogs(row)"/>
        <ReButton layout="square" icon="Delete" type="danger" tip="删除这条运行记录及其节点日志" @click="removeTask(row)"/>
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
        :pagination="false"
        :layout-table="{ maxHeight: 460 }"
        row-key="collectTaskLogId"
        empty-text="该任务暂无节点日志"
        stripe
      >
        <template #status="{ row }">
          <ReTag size="small" :type="statusTagType(row.collectTaskLogStatus)" effect="plain">
            {{ statusText(row.collectTaskLogStatus) }}
          </ReTag>
        </template>
        <template #cost="{ row }">{{ costText(row.collectTaskLogCost) }}</template>
        <template #iteration="{ row }">
          {{ row.collectTaskLogIteration == null ? "—" : Number(row.collectTaskLogIteration) + 1 }}
        </template>
      </ReTable>
    </ReDialog>

    <RunReplayDialog v-model="replayVisible" :task="replayTask" />
  </div>
</template>
