<!--
  任务监控：分页查询、节点日志、历史清理。

  状态与触发方式是后端字符串常量（CollectTaskStatus / CollectTriggerType），
  这里只做展示映射，不参与业务判断；日志接口单次上限 1000 条，按执行顺序返回。
  翻页/筛选都交给 ReTable 的 loader，查询条件整体替换、不逐字段 mutate。
-->
<script setup lang="ts">
import { computed, onActivated, onDeactivated, onUnmounted, ref } from "vue";
import { msgError, msgInfo, msgSuccess } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReInput from "@repo/ui/re-input";
import ReSelect from "@repo/ui/re-select";
import ReSwitch from "@repo/ui/re-switch";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import { cleanTasks, deleteTask, fetchTaskLogs, listFlows, pageTasks } from "../api/collectApi";
import { costText, statusTagType, statusText, triggerText } from "../constants/taskStatus";
import { confirmAction, errText, useCollectGated, useCollectView } from "../composables/useCollectView";
import type { RePageResult, ReTableColumn, ReTableLoadParams } from "@repo/ui/re-table";
import type { CollectFlow, CollectTask, CollectTaskLog } from "../types/collect";

defineOptions({ name: "CollectTask" });

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

/** 一次查询的全部条件快照：整体替换，ReTable 靠引用变化决定是否重载 */
interface TaskQuery {
  page: number;
  pageSize: number;
  collectTaskFlowId?: string;
  collectTaskStatus?: string;
  collectTaskTriggerType?: string;
  collectTaskNo?: string;
}

const query = ref<TaskQuery>({ page: 1, pageSize: 20 });
const draft = ref({
  collectTaskFlowId: "" as string | number,
  collectTaskStatus: "",
  collectTaskTriggerType: "",
  collectTaskNo: "",
});

const flows = ref<CollectFlow[]>([]);
const autoRefresh = ref(false);
const tableRef = ref<{ reload: () => void } | null>(null);
let timer: ReturnType<typeof setInterval> | null = null;

const { ready } = useCollectGated();
const { reload: reloadFlows } = useCollectView(async () => {
  flows.value = (await listFlows()) ?? [];
});

const flowOptions = computed(() =>
  flows.value.map(item => ({
    label: String(item.collectFlowName ?? item.collectFlowId),
    value: String(item.collectFlowId),
  })),
);

const columns = computed<ReTableColumn[]>(() => [
  { prop: "collectTaskNo", label: "任务号", width: 180, slot: "no" },
  { prop: "collectTaskFlowName", label: "流程", minWidth: 140, showOverflowTooltip: true },
  { prop: "collectTaskStatus", label: "状态", width: 92, slot: "status", align: "center" },
  { prop: "collectTaskTriggerType", label: "触发", width: 80, slot: "trigger", align: "center" },
  { prop: "collectTaskBeginTime", label: "开始时间", width: 176 },
  { prop: "collectTaskEndTime", label: "结束时间", width: 176 },
  { prop: "collectTaskCost", label: "耗时", width: 90, slot: "cost", align: "right" },
  { prop: "collectTaskNodeCount", label: "节点/请求/结果", width: 126, slot: "counts", align: "center" },
  { prop: "collectTaskExecutorId", label: "执行器", width: 200, showOverflowTooltip: true },
  { prop: "collectTaskError", label: "错误", minWidth: 160, showOverflowTooltip: true },
  { prop: "action", label: "操作", width: 130, slot: "action", fixed: "right" },
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

function search(): void {
  const picked = draft.value;
  query.value = {
    page: 1,
    pageSize: query.value.pageSize,
    collectTaskFlowId: picked.collectTaskFlowId ? String(picked.collectTaskFlowId) : undefined,
    collectTaskStatus: picked.collectTaskStatus || undefined,
    collectTaskTriggerType: picked.collectTaskTriggerType || undefined,
    collectTaskNo: String(picked.collectTaskNo ?? "").trim() || undefined,
  };
}

function reset(): void {
  draft.value = { collectTaskFlowId: "", collectTaskStatus: "", collectTaskTriggerType: "", collectTaskNo: "" };
  query.value = { page: 1, pageSize: 20 };
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
  const flowId = draft.value.collectTaskFlowId;
  const scope = flowId ? `流程 ${flowId}` : "全部流程";
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
    <div class="collect-card collect-filters">
      <ReSelect
        v-model="draft.collectTaskFlowId"
        size="small"
        clearable
        filterable
        placeholder="全部流程"
        :options="flowOptions"
        style="width: 200px"
        @update:model-value="search"
      />
      <ReSelect
        v-model="draft.collectTaskStatus"
        size="small"
        clearable
        placeholder="全部状态"
        :options="STATUS_OPTIONS"
        style="width: 120px"
        @update:model-value="search"
      />
      <ReSelect
        v-model="draft.collectTaskTriggerType"
        size="small"
        clearable
        placeholder="全部触发"
        :options="TRIGGER_OPTIONS"
        style="width: 120px"
        @update:model-value="search"
      />
      <ReInput
        v-model="draft.collectTaskNo"
        size="small"
        clearable
        placeholder="任务号模糊查询"
        style="width: 200px"
        @keyup.enter="search"
      />
      <ReButton size="small" type="primary" icon="Search" @click="search">查询</ReButton>
      <ReButton size="small" @click="reset">重置</ReButton>
      <span class="spacer"/>
      <span class="collect-hint">自动刷新</span>
      <ReSwitch v-model="autoRefresh" size="small" @change="toggleAuto(autoRefresh === true)"/>
      <ReButton size="small" icon="Delete" @click="cleanHistory">清理7天前</ReButton>
    </div>

    <ReTable
      v-if="ready"
      ref="tableRef"
      class="collect-card"
      table-id="collect-task"
      :loader="loadTasks"
      :params="query"
      :columns="columns"
      row-key="collectTaskId"
      v-model:page="query.page"
      v-model:page-size="query.pageSize"
      :page-sizes="[10, 20, 50, 100]"
      empty-text="暂无任务，先去「流程设计」运行或试运行一个流程"
      stripe
    >
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
        <ReButton size="small" text type="primary" @click="showLogs(row)">日志</ReButton>
        <ReButton size="small" text type="danger" @click="removeTask(row)">删除</ReButton>
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
  </div>
</template>
