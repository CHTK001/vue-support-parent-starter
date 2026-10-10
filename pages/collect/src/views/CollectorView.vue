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
import { computed, ref } from "vue";
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
import type { ReTableColumn } from "@repo/ui/re-table";
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

/** 前端过滤：采集器数量不大，搜索/分类直接过滤列表，省掉分页与草稿查询那一套 */
const keyword = ref("");
const categoryFilter = ref("");

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
  { prop: "lastRun", label: "最近运行", minWidth: 210, slot: "lastRun" },
  { prop: "action", label: "操作", width: 320, slot: "action", fixed: "right" },
]);

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

function gotoRuns(flow: CollectFlow): void {
  void getRouter().push({ path: "/collect/run", query: { flowId: String(flow.collectFlowId) } });
}

/** 采集结果：按运行ID 过滤优先（这次跑出来的），没有就按采集器看全部 */
function gotoRecords(flow: CollectFlow, taskId?: number | null): void {
  const query = taskId ? { taskId: String(taskId) } : { flowId: String(flow.collectFlowId) };
  void getRouter().push({ path: "/collect/record", query });
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

    <ReTable
      table-id="collect-collector"
      :data="filtered"
      :columns="columns"
      :pagination="false"
      :layout-table="{ fill: true }"
      row-key="collectFlowId"
      empty-text="没有匹配的采集器"
      stripe
    >
      <template #name="{ row }">
        <div class="cell-name">
          <span class="name-text">{{ row.collectFlowName }}</span>
          <span v-if="row.collectFlowCode" class="name-code">{{ row.collectFlowCode }}</span>
        </div>
        <div v-if="row.running" class="cell-running">运行中</div>
      </template>

      <template #category="{ row }">
        <ReTag  effect="plain">{{ categoryName(asFlow(row)) }}</ReTag>
      </template>

      <template #status="{ row }">
        <ReTag  :type="row.collectFlowStatus === 1 ? 'success' : 'info'" effect="plain">
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
.cell-name {
  display: flex;
  align-items: center;
  gap: 6px;
}
.name-text {
  font-weight: 600;
}
.name-code {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.cell-running {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-color-success);
}
.muted {
  color: var(--el-text-color-placeholder);
}
.run-line {
  display: flex;
  align-items: center;
  gap: 6px;
}
.run-no {
  font-family: var(--rm-font-mono, monospace);
  font-size: 12px;
}
.run-sub {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.ops {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
}
</style>
