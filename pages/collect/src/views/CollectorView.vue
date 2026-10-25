<!--
  采集器管理（采集侧的门面页面）。

  定位：采集器是核心，流程设计、运行、调度、结果、配置全部从这里发起，
  所以「流程设计」做成弹窗而不是独立菜单——它是编辑态，不是并列的模块。

  一次运行 = 一个运行ID（后端 collect_task_no，形如 CT2026...），
  列表里直接显示最近一次运行ID与成败，点击可跳到运行记录或这次的采集结果，
  排查时不用先去任务页搜一遍。

  最近运行一次取 50 条在前端按流程分组：逐行查会变成 N+1 次请求，
  采集器数量一多就明显卡。

  ── 视图约定 ──────────────────────────────────────────────
  本页以 ReTable 为主骨架：11 列 + 11 个具名插槽 + 工具栏批量选择/批量删除，
  行状态色靠 row-class-name 回写。表格不拆成卡片网格，只把「外壳」现代化：
  ReSectionHead 页头 + 统计条 + 卡片壳内的表格 + 筛选条。模板重排时
  每一个绑定、插槽、事件都原样保留（槽名/列 prop/行字段都是脚本契约）。
-->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElDropdown, ElDropdownItem, ElDropdownMenu } from "element-plus";
import { getRouter, msgError, msgSuccess, msgWarning } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReCron from "@repo/ui/re-cron";
import ReEmpty from "@repo/ui/re-empty";
import ReInput from "@repo/ui/re-input";
import ReSectionHead from "@repo/ui/re-section-head";
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
  { prop: "collectFlowRecordCount", label: "总采集数量", width: 130, slot: "recordCount", align: "right" },
  { prop: "collectFlowExecCount", label: "总采集次数", width: 116, slot: "execCount", align: "center" },
  { prop: "collectFlowCron", label: "自动调度", width: 200, slot: "cron" },
  { prop: "collectFlowNextExecTime", label: "下次执行", width: 176, slot: "next" },
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

/** 行状态类：停用行灰底；启用且最近一次失败红底；停用且失败按停用处理 */
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
function formatLarge(value: unknown): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("zh-CN");
}

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

<!--
  现代化视图：ReSectionHead 页头 + koi 令牌统计条 + 筛选卡 + 卡片壳表格 + ReEmpty 空态。
  ReTable 本体（columns / toolbar-config / 11 个具名插槽 / row-class-name /
  v-model:page / v-model:page-size）与全部点击处理函数原样保留，仅重排外壳与样式。
-->
<template>
  <div class="collector-page">
    <!-- 页头：标题 + 全局动作（新建采集器 / 平台级配置 / 刷新） -->
    <ReSectionHead
      class="collector-head"
      title="采集器"
      description="流程设计、调度与运行结果的总入口 · 一屏看清每个采集器最近一次运行的成败"
    >
      <template #actions>
        <ReButton
          show-text
          icon="Plus"
          type="primary"
          size="small"
          tip="新建采集器（打开流程设计）"
          @click="openDesign(null)"
        >
          新建采集器
        </ReButton>
        <ElDropdown trigger="click" placement="bottom-start" @command="(cmd: string) => openConfig(cmd)">
          <ReButton icon="Setting" size="small" tip="平台级配置：变量 / 函数 / 通知" />
          <template #dropdown>
            <ElDropdownMenu>
              <ElDropdownItem command="global">全局配置总览</ElDropdownItem>
              <ElDropdownItem command="variable" divided>变量管理</ElDropdownItem>
              <ElDropdownItem command="function">函数库</ElDropdownItem>
              <ElDropdownItem command="notice">执行通知</ElDropdownItem>
            </ElDropdownMenu>
          </template>
        </ElDropdown>
        <ReButton icon="Refresh" size="small" tip="重新拉取采集器与最近运行" @click="reload" />
      </template>
    </ReSectionHead>

    <!-- 概览条：4 项关键计数，窄屏 2 列 -->
    <div class="stat-grid" role="group" aria-label="采集器概览">
      <div class="stat-card" style="--accent: var(--metric-cpu)">
        <span class="stat-label">采集器</span>
        <span class="stat-value">{{ filtered.length }}</span>
        <span class="stat-trend">当前筛选结果</span>
      </div>
      <div class="stat-card" style="--accent: var(--status-success)">
        <span class="stat-label">已启用</span>
        <span class="stat-value">{{ filtered.filter(f => f.collectFlowStatus === 1).length }}</span>
        <span class="stat-trend is-up">排在最前</span>
      </div>
      <div class="stat-card" style="--accent: var(--pulse-unknown)">
        <span class="stat-label">已停用</span>
        <span class="stat-value">{{ filtered.filter(f => f.collectFlowStatus !== 1).length }}</span>
        <span class="stat-trend">灰底行</span>
      </div>
      <div class="stat-card" style="--accent: var(--status-error)">
        <span class="stat-label">最近失败</span>
        <span class="stat-value">{{ filtered.filter(f => f.collectFlowStatus === 1 && latestTaskOf.get(f.collectFlowId)?.collectTaskStatus === "FAILURE").length }}</span>
        <span
          class="stat-trend"
          :class="{ 'is-down': filtered.some(f => f.collectFlowStatus === 1 && latestTaskOf.get(f.collectFlowId)?.collectTaskStatus === 'FAILURE') }"
        >最近 50 次运行内</span>
      </div>
    </div>

    <!-- 筛选条：关键字 / 分类 -->
    <div class="filter-card">
      <ReInput
        v-model="keyword"
        class="filter-field filter-field--search"
        placeholder="按名称 / 编码搜索"
        prefix-icon="Search"
        clearable
      />
      <ReSelect
        v-model="categoryFilter"
        class="filter-field"
        :options="categoryOptions"
        placeholder="全部分类"
      />
      <span class="filter-hint">
        命中 {{ filtered.length }} / {{ flows.length }} 个采集器
      </span>
      <ReButton
        v-if="keyword || categoryFilter !== ''"
        icon="Close"
        size="small"
        tip="清空筛选"
        @click="keyword = ''; categoryFilter = ''"
      />
    </div>

    <!-- 表格壳：ReTable 自带工具栏（批量选择 / 批量删除 / 列设置 / 表格设置） -->
    <div v-loading="loading" class="table-card">
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
        <template #empty>
          <ReEmpty
            v-if="!loading"
            layout="modern"
            :image-size="72"
            :description="keyword || categoryFilter !== '' ? '没有匹配的采集器，试试清空筛选' : '还没有采集器，点击右上角「新建采集器」开始'"
          />
        </template>

        <template #name="{ row }">
          <div class="cell-name">
            <span class="name-text">{{ row.collectFlowName }}</span>
            <span v-if="row.collectFlowCode" class="name-code">{{ row.collectFlowCode }}</span>
          </div>
          <div v-if="row.running" class="cell-running">运行中</div>
        </template>

        <template #category="{ row }">
          <ReTag effect="plain">{{ categoryName(asFlow(row)) }}</ReTag>
        </template>

        <template #status="{ row }">
          <ReTag :type="row.collectFlowStatus === 1 ? 'success' : 'info'" effect="plain">
            {{ row.collectFlowStatus === 1 ? "已启用" : "已停用" }}
          </ReTag>
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
          <span class="collect-num collector-num--strong">{{ formatLarge(row.collectFlowRecordCount) }}</span>
        </template>

        <template #execCount="{ row }">
          <span class="collect-num">{{ formatLarge(row.collectFlowExecCount) }}</span>
        </template>

        <template #lastRun="{ row }">
          <template v-if="latestTaskOf.get(row.collectFlowId)">
            <div class="run-line">
              <ReTag :type="statusTagType(latestTaskOf.get(row.collectFlowId)!.collectTaskStatus)">
                {{ statusText(latestTaskOf.get(row.collectFlowId)!.collectTaskStatus) }}
              </ReTag>
              <span class="run-no">{{ latestTaskOf.get(row.collectFlowId)!.collectTaskNo }}</span>
              <span class="muted">{{ triggerText(latestTaskOf.get(row.collectFlowId)!.collectTaskTriggerType) }}</span>
            </div>
            <div class="run-sub">
              耗时
              <ReTime
                :value="costMs(latestTaskOf.get(row.collectFlowId)!.collectTaskCost)"
                format="duration"
                placeholder="—"
              />
              · 产出 {{ latestTaskOf.get(row.collectFlowId)!.collectTaskRecordCount ?? 0 }} 条 ·
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
    </div>

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
/* ===== 页面骨架 ===== */
.collector-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px;
  min-width: 0;
}

/* ===== 概览条 ===== */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.stat-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 16px;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: box-shadow 0.2s var(--ease-out), transform 0.2s var(--ease-out);
}
.stat-card::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  background: var(--accent, var(--brand-500));
}
.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
.stat-label {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--text-secondary);
}
.stat-value {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}
.stat-trend {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-tertiary);
}
.stat-trend.is-up {
  color: var(--status-success);
}
.stat-trend.is-down {
  color: var(--status-error);
}

/* ===== 筛选卡 ===== */
.filter-card {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}
.filter-field--search {
  width: 220px;
}
.filter-field {
  flex: 0 1 auto;
  min-width: 150px;
  max-width: 220px;
}
.filter-hint {
  margin-left: auto;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--text-tertiary);
}

/* ===== 表格壳 ===== */
.table-card {
  min-height: 240px;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

/* ===== 单元格 ===== */
.cell-name {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.name-text {
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.name-code {
  flex: none;
  font-size: 12px;
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
}
.cell-running {
  margin-top: 2px;
  font-size: 12px;
  font-weight: 500;
  color: var(--status-success);
}
.muted {
  color: var(--text-tertiary);
}
.collector-num--strong {
  font-weight: 600;
  color: var(--text-primary);
}
.run-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.run-no {
  font-family: var(--rm-font-mono, ui-monospace, sfmono-regular, consolas, monospace);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary);
}
.run-sub {
  margin-top: 2px;
  font-size: 12px;
  color: var(--text-tertiary);
}
.ops {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
}

/* ===== 行状态底色（保持原语义，色值换成 koi 令牌） ===== */
:deep(tr.collect-row--disabled td) {
  background-color: color-mix(in srgb, var(--bg-fill) 78%, transparent) !important;
}
:deep(tr.collect-row--failed td) {
  background-color: color-mix(in srgb, var(--status-error) 7%, var(--bg-container)) !important;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .filter-field,
  .filter-field--search {
    width: 100%;
    max-width: none;
  }
  .filter-hint {
    margin-left: 0;
  }
}

/* ===== 减少动态效果 ===== */
@media (prefers-reduced-motion: reduce) {
  .stat-card {
    transition: none;
  }
  .stat-card:hover {
    transform: none;
  }
}
</style>
