<!--
  采集器管理（采集侧的门面页面）。

  定位：采集器是核心，流程设计、运行、调度、结果、配置全部从这里发起，
  所以「流程设计」做成弹窗而不是独立菜单——它是编辑态，不是并列的模块。

  一次运行 = 一个运行ID（后端 collect_task_no，形如 CT2026...），
  列表里直接显示最近一次运行ID与成败，点击可跳到运行记录或这次的采集结果，
  排查时不用先去任务页搜一遍。

  最近运行一次取 50 条在前端按流程分组：逐行查会变成 N+1 次请求，
  采集器数量一多就明显卡。
-->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElDropdown, ElDropdownItem, ElDropdownMenu } from "element-plus";
import { getRouter, msgError, msgSuccess, msgWarning } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReCron from "@repo/ui/re-cron";
import ReInput from "@repo/ui/re-input";
import ReSelect from "@repo/ui/re-select";
import ReSwitch from "@repo/ui/re-switch";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import ReTime from "@repo/ui/re-time";
import type { ReOption } from "@repo/ui/re-select";
import type { ReTableColumn, ReTableToolbarConfig } from "@repo/ui/re-table";
import FlowDesignDialog from "../components/FlowDesignDialog.vue";
import FlowEditDialog from "../components/FlowEditDialog.vue";
import FlowPreviewDialog from "../components/FlowPreviewDialog.vue";
import CollectorConfigDialog from "../components/CollectorConfigDialog.vue";
import {
  copyFlow,
  deleteFlow,
  fetchCategoryOptions,
  listFlows,
  pageTasks,
  runFlow,
  setFlowStatus,
} from "../api/collectApi";
import { COLLECT_ACTIONS } from "../constants/actionColumns";
import { costMs, statusTagType, statusText, triggerText } from "../constants/taskStatus";
import { confirmAction, errText, useCollectView } from "../composables/useCollectView";
import type { CollectFlow, CollectOption, CollectTask } from "../types/collect";

defineOptions({ name: "CollectCollector" });

const flows = ref<CollectFlow[]>([]);
const categories = ref<CollectOption[]>([]);
const recentTasks = ref<CollectTask[]>([]);
const runningIds = ref<Record<number, boolean>>({});

/** 前端过滤：搜索/分类直接过滤列表；分页由 ReTable 按 page/pageSize 本地切片 */
const keyword = ref("");
const categoryFilter = ref("");

/** 分页页码/每页条数：v-model 给 ReTable；筛选变化时回到第 1 页，避免停在越界的空页 */
const page = ref(1);
const pageSize = ref(10);
watch([keyword, categoryFilter], () => {
  page.value = 1;
});

const designVisible = ref(false);
const designFlowId = ref<number | null>(null);
const editVisible = ref(false);
const editFlowId = ref<number | null>(null);
const previewVisible = ref(false);
const previewFlowId = ref<number | null>(null);
const configVisible = ref(false);
const configPanel = ref("variable");

/**
 * 旧深链落点：/collect/design?flowId=3 直接进设计弹窗，
 * /collect/variable?panel=notice 直接进对应配置页签。
 * 菜单里已经没有这些入口，但外部系统的链接、收藏夹还会打过来。
 */
function applyDeepLink(): void {
  const query = getRouter().currentRoute.value.query as Record<string, string>;
  const flowId = Number(query.flowId ?? query.design ?? 0);
  if (flowId) {
    openDesign(flowId);
    return;
  }
  const panel = String(query.panel ?? "");
  if (panel) {
    configPanel.value = panel;
    configVisible.value = true;
  }
}

const { loading, reload } = useCollectView(async () => {
  const [flowList, categoryList, taskPage] = await Promise.all([
    listFlows(),
    fetchCategoryOptions(),
    pageTasks({ page: 1, pageSize: 50 }),
  ]);
  flows.value = flowList ?? [];
  categories.value = categoryList ?? [];
  recentTasks.value = taskPage?.rows ?? [];
  applyDeepLink();
});

/** 分类下拉：0 表示未分类，与后端口径一致 */
const categoryOptions = computed<ReOption[]>(() => [
  { label: "全部分类", value: "" },
  ...categories.value.map(item => ({ label: item.label, value: String(item.value) })),
]);

const categoryName = (flow: CollectFlow) =>
  flow.collectFlowCategoryId ? flow.collectFlowCategoryName || `分类 ${flow.collectFlowCategoryId}` : "未分类";

/** flowId → 最近一次运行；同一流程只保留开始时间最大的那条 */
const latestTaskOf = computed(() => {
  const map = new Map<number, CollectTask>();
  recentTasks.value.forEach(task => {
    const flowId = Number(task.collectTaskFlowId ?? 0);
    if (!flowId) {
      return;
    }
    const exists = map.get(flowId);
    if (!exists || String(task.collectTaskBeginTime ?? "") > String(exists.collectTaskBeginTime ?? "")) {
      map.set(flowId, task);
    }
  });
  return map;
});

const filtered = computed(() => {
  const text = keyword.value.trim().toLowerCase();
  return flows.value.filter(flow => {
    if (categoryFilter.value !== "" && String(flow.collectFlowCategoryId ?? 0) !== categoryFilter.value) {
      return false;
    }
    if (!text) {
      return true;
    }
    return `${flow.collectFlowName ?? ""} ${flow.collectFlowCode ?? ""}`.toLowerCase().includes(text);
  });
});

/** 启用优先：后端激活的采集器排在前面，停用行靠后 */
const sortedFlows = computed(() =>
  [...filtered.value].sort(
    (a, b) => Number(b.collectFlowStatus === 1) - Number(a.collectFlowStatus === 1),
  ),
);

/* ------------------------------- 仪表盘 KPI ------------------------------- */

/** 全局聚合指标 */
const kpiStats = computed(() => {
  const all = flows.value;
  const total = all.length;
  const active = all.filter(f => f.collectFlowStatus === 1).length;
  const running = all.filter(f => f.running).length;
  const totalRecords = all.reduce((sum, f) => sum + (Number(f.collectFlowRecordCount) || 0), 0);
  const totalRuns = all.reduce((sum, f) => sum + (Number(f.collectFlowExecCount) || 0), 0);
  const hasRun = all.filter(f => (Number(f.collectFlowExecCount) || 0) > 0).length;
  const allSuccess = all.filter(f => {
    const t = latestTaskOf.value.get(f.collectFlowId);
    return t?.collectTaskStatus === "SUCCESS";
  }).length;
  const failRate = hasRun > 0 ? Math.max(0, hasRun - allSuccess) : 0;
  return { total, active, running, totalRecords, totalRuns, failRate };
});

/** 格式化大数字：1万以上显示 X.X万 */
function fmtKpi(n: number): string {
  if (n >= 10_000) return (n / 10_000).toFixed(1) + "万";
  return n.toLocaleString("zh-CN");
}

/* ------------------------------- 列定义 ------------------------------- */

const columns = computed<ReTableColumn[]>(() => [
  { prop: "collectFlowName", label: "采集器", minWidth: 200, slot: "name" },
  { prop: "collectFlowCategoryId", label: "分类", width: 110, slot: "category", align: "center" },
  { prop: "collectFlowStatus", label: "状态", width: 96, slot: "status", align: "center" },
  /* 启停开关独立成列：此前塞在「自动调度」单元格里，和 cron 挤在一起，
     开关状态读不出来（同格内容要靠宽度猜）。prop 必须与各列唯一 ——
     ReTable 按 prop 建列索引（列顺序/隐藏持久化），复用 collectFlowStatus
     会让本列与「状态」列互相顶掉。 */
  { prop: "enabled", label: "启用", width: 84, slot: "switch", align: "center" },
  { prop: "nodeCount", label: "节点/连线", width: 96, align: "center" },
  { prop: "collectFlowCron", label: "自动调度", width: 200, slot: "cron" },
  { prop: "collectFlowNextExecTime", label: "下次执行", width: 176, slot: "next" },
  { prop: "collectFlowRecordCount", label: "总采集数量", width: 128, slot: "recordCount", align: "right" },
  { prop: "collectFlowExecCount", label: "总采集次数", width: 116, slot: "execCount", align: "center" },
  { prop: "lastRun", label: "最近运行", minWidth: 210, slot: "lastRun" },
  { prop: "action", label: "操作", width: 320, slot: "action", fixed: "right" },
]);

/**
 * ReTable 内置批量：勾选列（batchSelect）+ 批量删除按钮（batchDelete）。
 * 确认由工具栏的 ElPopconfirm 承担（confirmMessage），handler 里不再二次确认；
 * 本地数组模式下刷新按钮会被 ReTable 自动关掉，避免和页面顶部刷新重复。
 */
const collectorToolbarConfig = computed<ReTableToolbarConfig>(() => ({
  position: "top",
  batchSelect: { enabled: true, tip: "批量选择" },
  batchDelete: {
    enabled: true,
    tip: "批量删除",
    confirmMessage: "确认删除选中的采集器？运行记录与采集结果会保留。",
    handler: batchDeleteFlows,
  },
}));

/* ------------------------------- 行内操作 ------------------------------- */

function openDesign(flowId: number | null): void {
  designFlowId.value = flowId;
  designVisible.value = true;
}

/** 属性快速编辑：不载画布，只改 dsl 之外的实体字段（见 FlowEditDialog 头部注释） */
function openEdit(flow: CollectFlow): void {
  editFlowId.value = flow.collectFlowId;
  editVisible.value = true;
}

function openPreview(flow: CollectFlow): void {
  previewFlowId.value = flow.collectFlowId;
  previewVisible.value = true;
}

/** ReTable 插槽里的行是 DefaultRow，统一在这里收口成 CollectFlow */
function asFlow(input: unknown): CollectFlow {
  return input as CollectFlow;
}

/* ------------------------------- 工具函数 ------------------------------- */

/** 格式化计数：空值显示 0，大数显示千分位 */
function formatCount(val: unknown): string {
  const n = Number(val) || 0;
  return n === 0 ? "0" : n.toLocaleString("zh-CN");
}

/** 状态行类：停用行灰底；启用且最近一次失败红底；停用且失败按停用处理 */
function collectorRowClassName(data: { row: Record<string, unknown>; rowIndex: number }): string {
  const flow = asFlow(data.row);
  if (flow.collectFlowStatus !== 1) {
    return "collect-row collect-row--disabled";
  }
  const latest = latestTaskOf.value.get(flow.collectFlowId);
  if (latest?.collectTaskStatus === "FAILURE") {
    return "collect-row collect-row--failed";
  }
  return "collect-row";
}

/**
 * 打开全局配置弹窗。
 *
 * 变量 / 函数 / 通知 / 操作列定义都是平台级配置，挂在页面顶部的工具栏上，
 * 每一行都摆一份入口只会让人误以为「这条采集器有自己的一套变量」。
 * 行内与「更多」里原来的入口已收掉，唯一入口在这里。
 */
function openConfig(panel: string): void {
  configPanel.value = panel;
  configVisible.value = true;
}

/** 手动运行：与自动调度共用同一执行入口，只是触发方式不同 */
async function runNow(flow: CollectFlow): Promise<void> {
  if (runningIds.value[flow.collectFlowId]) {
    return;
  }
  runningIds.value = { ...runningIds.value, [flow.collectFlowId]: true };
  try {
    const task = await runFlow({ collectFlowId: flow.collectFlowId });
    msgSuccess(`已提交运行，运行ID ${task?.collectTaskNo ?? ""}`);
    await reload();
  } catch (error) {
    msgError(errText(error));
  } finally {
    const next = { ...runningIds.value };
    delete next[flow.collectFlowId];
    runningIds.value = next;
  }
}

/** 自动（job）开关：cron 为空时后端不会注册 job，这里提前拦一句免得以为开了就一定跑 */
async function toggleSchedule(flow: CollectFlow, value: unknown): Promise<void> {
  const on = value === true;
  if (on && !flow.collectFlowCron) {
    msgWarning("该采集器还没有 cron 表达式，请先在「流程设计 → 流程属性」里配置");
    return;
  }
  try {
    await setFlowStatus(flow.collectFlowId, on ? 1 : 0);
    msgSuccess(on ? `已启用自动调度（${flow.collectFlowCron}）` : "已停用自动调度");
    await reload();
  } catch (error) {
    msgError(errText(error));
    await reload();
  }
}

/**
 * 跳「运行记录」/「采集结果」用命名路由，不用硬编码 path。
 *
 * 本组件会被多个宿主复用，路径前缀各不相同（采集平台自己挂 /collect/**，
 * eduai 挂 /edu/collect/**）。写死 path 等于假设「只有采集平台在用这个页面」，
 * 换宿主就静默 404——实测 eduai 里点「运行记录」直接落到 404 页。
 * 用命名路由后，宿主只要注册了同名路由即可；没注册会显式报导航失败，不会假装成功。
 */
function gotoRuns(flow: CollectFlow): void {
  void getRouter().push({ name: "CollectRun", query: { flowId: String(flow.collectFlowId) } });
}

/** 采集结果：按运行ID 过滤优先（这次跑出来的），没有就按采集器看全部 */
function gotoRecords(flow: CollectFlow, taskId?: number | null): void {
  const query = taskId ? { taskId: String(taskId) } : { flowId: String(flow.collectFlowId) };
  void getRouter().push({ name: "CollectRecord", query });
}

async function doCopy(flow: CollectFlow): Promise<void> {
  if (!(await confirmAction(`复制采集器「${flow.collectFlowName}」？`, "复制采集器"))) {
    return;
  }
  try {
    const copy = await copyFlow(flow.collectFlowId);
    msgSuccess(`已复制为「${copy?.collectFlowName ?? ""}」`);
    await reload();
  } catch (error) {
    msgError(errText(error));
  }
}

async function doDelete(flow: CollectFlow): Promise<void> {
  if (!(await confirmAction(`删除采集器「${flow.collectFlowName}」？运行记录与采集结果会保留。`, "删除采集器"))) {
    return;
  }
  try {
    await deleteFlow(flow.collectFlowId);
    msgSuccess("采集器已删除");
    await reload();
  } catch (error) {
    msgError(errText(error));
  }
}

/**
 * 批量删除：ReTable 内置批量删除经工具栏 ElPopconfirm 确认后回调。
 * 后端没有批量删除流程的接口，逐条复用 deleteFlow；单条失败不中断，尽量删掉能删的。
 * 完成后回到第 1 页再刷新：条数变少后当前页可能越界成空页。
 */
async function batchDeleteFlows(rows: Record<string, unknown>[]): Promise<void> {
  const ids = rows
    .map(row => Number((row as unknown as CollectFlow).collectFlowId))
    .filter(id => Number.isFinite(id) && id > 0);
  if (!ids.length) {
    return;
  }
  let ok = 0;
  const failed: number[] = [];
  for (const id of ids) {
    try {
      await deleteFlow(id);
      ok += 1;
    } catch {
      failed.push(id);
    }
  }
  if (ok) {
    msgSuccess(`已删除 ${ok} 个采集器`);
  }
  if (failed.length) {
    msgError(`${failed.length} 个采集器删除失败`);
  }
  page.value = 1;
  await reload();
}

/** 更多菜单：只留采集器自身的复制与删除，配置类入口一律在页面顶部 */
function runMore(command: string, flow: CollectFlow): void {
  if (command === "copy") {
    void doCopy(flow);
  } else if (command === "delete") {
    void doDelete(flow);
  }
}
</script>

<template>
  <div v-loading="loading" class="collect-page">

    <!-- ========== 数据仪表盘 KPI 指标栏 ========== -->
    <div class="kpi-bar">
      <div class="kpi-card">
        <div class="kpi-icon kpi-icon--total">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
        </div>
        <div class="kpi-body">
          <div class="kpi-value">{{ kpiStats.total }}</div>
          <div class="kpi-label">采集器总数</div>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon kpi-icon--active">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        </div>
        <div class="kpi-body">
          <div class="kpi-value">{{ kpiStats.active }}<span class="kpi-sub">/{{ kpiStats.total }}</span></div>
          <div class="kpi-label">已启用</div>
        </div>
      </div>

      <div v-if="kpiStats.running > 0" class="kpi-card kpi-card--running">
        <div class="kpi-icon kpi-icon--running">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div class="kpi-body">
          <div class="kpi-value kpi-value--running">{{ kpiStats.running }}</div>
          <div class="kpi-label">运行中</div>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon kpi-icon--records">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        </div>
        <div class="kpi-body">
          <div class="kpi-value">{{ fmtKpi(kpiStats.totalRecords) }}</div>
          <div class="kpi-label">累计采集</div>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon kpi-icon--runs">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </div>
        <div class="kpi-body">
          <div class="kpi-value">{{ fmtKpi(kpiStats.totalRuns) }}</div>
          <div class="kpi-label">累计执行</div>
        </div>
      </div>

      <div v-if="kpiStats.failRate > 0" class="kpi-card kpi-card--warn">
        <div class="kpi-icon kpi-icon--warn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div class="kpi-body">
          <div class="kpi-value kpi-value--warn">{{ kpiStats.failRate }}</div>
          <div class="kpi-label">失败流程</div>
        </div>
      </div>
    </div>

    <!-- ========== 工具栏 ========== -->
    <div class="collect-toolbar">
      <ReInput
        v-model="keyword"
        style="width: 220px"
        placeholder="按名称 / 编码搜索"
        clearable
      />
      <ReSelect
        v-model="categoryFilter"
        style="width: 150px"
        :options="categoryOptions"
        placeholder="全部分类"
      />
      <el-button icon="Plus" @click="openDesign(null)" text></el-button>
      <ElDropdown trigger="click" placement="bottom-start" @command="(cmd: string) => openConfig(cmd)">
        <ReButton icon="Setting" text></ReButton>
        <template #dropdown>
          <ElDropdownMenu>
            <ElDropdownItem command="global">全局配置总览</ElDropdownItem>
            <ElDropdownItem command="variable" divided>变量管理</ElDropdownItem>
            <ElDropdownItem command="function">函数库</ElDropdownItem>
            <ElDropdownItem command="notice">执行通知</ElDropdownItem>
          </ElDropdownMenu>
        </template>
      </ElDropdown>
      <span class="spacer" />
      <span class="tb-label">共 {{ filtered.length }} 个采集器</span>
      <ReButton text icon="Refresh" @click="reload"></ReButton>
    </div>

    <!-- ========== 数据表格 ========== -->
    <ReTable
      table-id="collect-collector"
      :data="sortedFlows"
      :columns="columns"
      :pagination="true"
      :page-sizes="[10, 20, 50, 100]"
      v-model:page="page"
      v-model:page-size="pageSize"
      :toolbar="true"
      :toolbar-config="collectorToolbarConfig"
      :layout-table="{ fill: true }"
      row-key="collectFlowId"
      row-class-name="collectorRowClassName"
      empty-text="没有匹配的采集器"
      stripe
    >
      <template #name="{ row }">
        <div class="cell-name">
          <span class="name-text">{{ row.collectFlowName }}</span>
          <span v-if="row.collectFlowCode" class="name-code">{{ row.collectFlowCode }}</span>
        </div>
        <div v-if="row.running" class="cell-running">
          <span class="running-dot"></span>运行中
        </div>
      </template>

      <template #category="{ row }">
        <ReTag  effect="plain">{{ categoryName(asFlow(row)) }}</ReTag>
      </template>

      <template #status="{ row }">
        <div class="status-indicator" :class="row.collectFlowStatus === 1 ? 'status-indicator--active' : 'status-indicator--inactive'">
          <span class="status-dot"></span>
          {{ row.collectFlowStatus === 1 ? "已启用" : "已停用" }}
        </div>
      </template>

      <template #switch="{ row }">
        <ReSwitch
          :model-value="row.collectFlowStatus === 1"
          @update:model-value="value => toggleSchedule(asFlow(row), value)"
        />
      </template>

      <template #cron="{ row }">
        <!-- 文本模式：表达式 + 人话与 ReCron 校验引擎同源，登记错也会原样显示 -->
        <ReCron v-if="row.collectFlowCron" :model-value="row.collectFlowCron" mode="text" />
        <span v-else class="muted">未配置</span>
      </template>

      <template #next="{ row }">
        <span v-if="row.collectFlowStatus === 1 && row.collectFlowNextExecTime">{{ row.collectFlowNextExecTime }}</span>
        <span v-else class="muted">—</span>
      </template>

      <template #recordCount="{ row }">
        <div class="count-cell">
          <span class="count-value">{{ formatCount(row.collectFlowRecordCount) }}</span>
        </div>
      </template>

      <template #execCount="{ row }">
        <div class="count-cell count-cell--center">
          <span class="count-badge">{{ formatCount(row.collectFlowExecCount) }}</span>
        </div>
      </template>

      <template #lastRun="{ row }">
        <template v-if="latestTaskOf.get(row.collectFlowId)">
          <div class="run-line">
            <ReTag  :type="statusTagType(latestTaskOf.get(row.collectFlowId)!.collectTaskStatus)">
              {{ statusText(latestTaskOf.get(row.collectFlowId)!.collectTaskStatus) }}
            </ReTag>
            <span class="run-no">{{ latestTaskOf.get(row.collectFlowId)!.collectTaskNo }}</span>
            <span class="muted">{{ triggerText(latestTaskOf.get(row.collectFlowId)!.collectTaskTriggerType) }}</span>
          </div>
          <div class="run-sub">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:2px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {{ costMs(latestTaskOf.get(row.collectFlowId)!.collectTaskCost) }}
            <span class="run-sep">·</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:2px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            {{ latestTaskOf.get(row.collectFlowId)!.collectTaskRecordCount ?? 0 }} 条
            <span class="run-sep">·</span>
            {{ latestTaskOf.get(row.collectFlowId)!.collectTaskBeginTime || "—" }}
          </div>
        </template>
        <span v-else class="muted">尚未运行</span>
      </template>

      <template #action="{ row }">
        <div class="ops">
          <ReButton v-bind="COLLECT_ACTIONS.designFlow" layout="square" @click="openDesign(row.collectFlowId)"/>
          <ReButton v-bind="COLLECT_ACTIONS.editFlow" layout="square" @click="openEdit(asFlow(row))"/>
          <ReButton v-bind="COLLECT_ACTIONS.previewFlow" layout="square" @click="openPreview(asFlow(row))"/>
          <ReButton
            v-bind="COLLECT_ACTIONS.runFlow"
            layout="square"
            :loading="runningIds[row.collectFlowId]"
            @click="runNow(asFlow(row))"
          />
          <ReButton v-bind="COLLECT_ACTIONS.flowRuns" layout="square" @click="gotoRuns(asFlow(row))"/>
          <ReButton
            v-bind="COLLECT_ACTIONS.flowRecords"
            layout="square"
            @click="gotoRecords(asFlow(row), latestTaskOf.get(asFlow(row).collectFlowId)?.collectTaskId)"
          />
          <ElDropdown trigger="click" placement="bottom-end" @command="(cmd: string) => runMore(cmd, asFlow(row))">
            <ReButton v-bind="COLLECT_ACTIONS.flowMore" layout="square" />
            <template #dropdown>
              <ElDropdownMenu>
                <ElDropdownItem command="copy">复制采集器</ElDropdownItem>
                <ElDropdownItem command="delete" divided>删除采集器</ElDropdownItem>
              </ElDropdownMenu>
            </template>
          </ElDropdown>
        </div>
      </template>
    </ReTable>

    <FlowDesignDialog
      v-model="designVisible"
      :flow-id="designFlowId"
      :title="designFlowId ? `流程设计 · ${flows.find(f => f.collectFlowId === designFlowId)?.collectFlowName || ''}` : '新建采集器'"
      @saved="reload"
    />
    <FlowEditDialog v-model="editVisible" :flow-id="editFlowId" @saved="reload" />
    <FlowPreviewDialog v-model="previewVisible" :flow-id="previewFlowId" />
    <CollectorConfigDialog v-model="configVisible" :panel="configPanel" />
  </div>
</template>

<style scoped>
/* ========== 数据仪表盘 KPI ========== */
.kpi-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.kpi-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04);
  flex: 1;
  min-width: 140px;
  position: relative;
  overflow: hidden;
  transition: box-shadow 0.2s, transform 0.2s;
}
.kpi-card::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  border-radius: 12px 0 0 12px;
}
.kpi-card--running { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); }
.kpi-card--running::before { background: #3b82f6; }
.kpi-card--warn { background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%); }
.kpi-card--warn::before { background: #f97316; }

.kpi-icon {
  width: 40px; height: 40px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.kpi-icon--total { background: #f1f5f9; color: #64748b; }
.kpi-icon--active { background: #ecfdf5; color: #10b981; }
.kpi-icon--running { background: #dbeafe; color: #3b82f6; }
.kpi-icon--records { background: #fdf4ff; color: #a855f7; }
.kpi-icon--runs { background: #fff7ed; color: #f97316; }
.kpi-icon--warn { background: #fef2f2; color: #ef4444; }

.kpi-body { min-width: 0; }
.kpi-value {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
  letter-spacing: -0.5px;
}
.kpi-value--running { color: #2563eb; }
.kpi-value--warn { color: #dc2626; }
.kpi-sub { font-size: 13px; font-weight: 400; color: #94a3b8; margin-left: 2px; }
.kpi-label {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

/* ========== 工具栏 ========== */
.collect-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #fff;
  border-radius: 10px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  flex-wrap: wrap;
}
.tb-label { font-size: 13px; color: #64748b; }

/* ========== 表格单元格 ========== */
.cell-name {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-width: 0;
}
.name-text {
  font-weight: 600;
  color: #1e293b;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.name-code {
  font-size: 11px;
  color: #94a3b8;
  font-family: var(--el-font-family);
  background: #f1f5f9;
  padding: 1px 6px;
  border-radius: 4px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-running {
  margin-top: 3px;
  font-size: 12px;
  color: #3b82f6;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}
.running-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #3b82f6;
  animation: pulse-dot 1.5s ease-in-out infinite;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.85); }
}

.muted { color: var(--el-text-color-placeholder); font-size: 13px; }

/* 状态指示器（左侧小圆点） */
.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
}
.status-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.status-indicator--active { color: #059669; }
.status-indicator--active .status-dot { background: #10b981; box-shadow: 0 0 0 2px rgba(16,185,129,0.2); }
.status-indicator--inactive { color: #94a3b8; }
.status-indicator--inactive .status-dot { background: #cbd5e1; }

/* 计数单元格 */
.count-cell {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
.count-cell--center { justify-content: center; }
.count-value {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  font-variant-numeric: tabular-nums;
}
.count-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 20px;
  background: #f1f5f9;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* 运行行 */
.run-line {
  display: flex;
  align-items: center;
  gap: 6px;
}
.run-no {
  font-family: var(--rm-font-mono, 'SF Mono', Consolas, monospace);
  font-size: 12px;
  color: #3b82f6;
}
.run-sub {
  margin-top: 2px;
  font-size: 12px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
}
.run-sep { color: #cbd5e1; margin: 0 2px; }

.ops {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
}

/* ========== 行状态底色 ========== */
:deep(tr.collect-row--disabled td) {
  background-color: color-mix(in srgb, var(--el-fill-color-light) 85%, transparent) !important;
  opacity: 0.7;
}
:deep(tr.collect-row--failed td) {
  background-color: color-mix(in srgb, var(--el-color-danger-light) 8%, #fff) !important;
}
/* 左侧状态指示条 */
:deep(tr.collect-row--failed td:first-child)::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: var(--el-color-danger);
}
:deep(tr.collect-row) { position: relative; }
:deep(tr.collect-row td:first-child) {
  position: relative;
  transition: background-color 0.2s;
}
:deep(tr.collect-row:hover td:first-child) {
  box-shadow: inset 3px 0 0 #3b82f6;
}
:deep(tr.collect-row--failed:hover td:first-child) {
  box-shadow: inset 3px 0 0 var(--el-color-danger) !important;
}
:deep(tr.collect-row--disabled:hover td:first-child) {
  box-shadow: none !important;
}
</style>
