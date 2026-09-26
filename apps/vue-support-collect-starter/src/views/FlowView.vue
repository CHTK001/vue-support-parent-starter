<!--
  流程设计器主视图：流程选择 / 属性 / 保存校验 / 试运行与运行 / 节点状态回显。

  节点库与属性面板全部由 /designer/metas 驱动，本页面不硬编码任何节点类型；
  试运行与运行都是异步提交，拿到 taskId 后轮询 /task/node-states 给画布着色。
  cron 用 ReCron：面板生成 + 合法性 + 未来触发时间都在页面上算，与服务端同一套 6 字段方言。
-->
<script setup lang="ts">
  import { computed, onActivated, onDeactivated, onMounted, onUnmounted, reactive, ref } from "vue";
import { msgError, msgInfo, msgSuccess, msgWarning } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReCron from "@repo/ui/re-cron";
import ReDialog from "@repo/ui/re-dialog";
import ReInput from "@repo/ui/re-input";
import ReInputNumber from "@repo/ui/re-input-number";
import ReSelect from "@repo/ui/re-select";
import type { ReOption } from "@repo/ui/re-select";
import ReSwitch from "@repo/ui/re-switch";
import ReTag from "@repo/ui/re-tag";
import CategoryDialog from "../components/CategoryDialog.vue";
import FlowDesigner from "../components/FlowDesigner.vue";
import {
  copyFlow,
  deleteFlow,
    dryRun,
    fetchCategoryOptions,
    fetchDatasourceColumns,
    fetchDatasourceOptions,
    fetchDatasourceTables,
    fetchMetas,
  fetchNodeStates,
  fetchRuntime,
  getFlow,
  getTask,
  listFlows,
  runFlow,
  saveFlow,
  setFlowStatus,
  stopTask,
  updateFlow,
  validateDsl,
} from "../api/collectApi";
import { confirmAction, errText, useCollectView } from "../composables/useCollectView";
  import type {
    CollectColumn,
    CollectDsl,
    CollectFlow,
    CollectFlowSave,
    CollectOption,
    CollectRuntime,
    CollectShapeMeta,
    CollectTask,
    CollectTaskLog,
  } from "../types/collect";

defineOptions({ name: "CollectDesign" });

const designer = ref<InstanceType<typeof FlowDesigner> | null>(null);
const metas = ref<CollectShapeMeta[]>([]);
const flows = ref<CollectFlow[]>([]);
const runtime = ref<CollectRuntime | null>(null);
const categoryOptions = ref<CollectOption[]>([]);

const currentId = ref<number | null>(null);
const currentFlow = ref<CollectFlow | null>(null);
const dirty = ref(false);
const saving = ref(false);
const states = ref<Record<string, CollectTaskLog>>({});

const activeTaskId = ref<number | null>(null);
const activeTask = ref<CollectTask | null>(null);

const propsVisible = ref(false);
const categoryVisible = ref(false);
/** ReCron 回报的表达式合法性；留空视为不定时调度，合法 */
const cronBroken = ref(false);

/** 流程实体属性（dsl 之外的部分），保存时与画布内容合成 CollectFlowSaveDTO */
const form = reactive({
  name: "",
  code: "",
  categoryId: 0,
  cron: "",
  concurrency: 1,
  threadCount: 4,
  remark: "",
});

const loaded = ref(false);


const { loading, reload } = useCollectView(async () => {
  const [metaList, flowList, runtimeInfo] = await Promise.all([fetchMetas(), listFlows(), fetchRuntime()]);
  metas.value = metaList ?? [];
  flows.value = flowList ?? [];
  runtime.value = runtimeInfo;
  if (runtimeInfo) {
    form.threadCount = runtimeInfo.defaultThreadCount ?? 4;
  }
  loaded.value = true;
});

/**
 * 只刷流程列表与运行条，不动 metas。
 *
 * metas 是调色板的数据源，换身份会连带重建画布；画布上有未保存草稿时只能走这条路。
 */
async function reloadFlowList(): Promise<void> {
  try {
    const [flowList, runtimeInfo] = await Promise.all([listFlows(), fetchRuntime()]);
    flows.value = flowList ?? [];
    runtime.value = runtimeInfo;
  } catch (error) {
    msgError(errText(error));
  }
}

/** 画布页是 keepAlive 的，命中缓存时挂载加载不会重跑，重进页面靠激活钩子重载 */
onActivated(() => {
  if (!loaded.value) {
    return;
  }
  if (dirty.value) {
    // 脏画布不能整条重载：metas 换身份会重建调色板与画布，刚摆上去还没存的节点会被抹掉
    void reloadFlowList();
  } else {
    void reload();
  }
  resumePolling();
});

const taskRunning = computed(() => Boolean(activeTask.value?.running) || activeTask.value?.collectTaskStatus === "RUNNING");

/** 工具条上的流程下拉，label 带编码便于同名区分 */
const flowOptions = computed<ReOption[]>(() => flows.value.map(flow => ({
  label: flow.collectFlowCode ? `${flow.collectFlowName}（${flow.collectFlowCode}）` : flow.collectFlowName ?? "",
  value: flow.collectFlowId ?? 0,
})));

/** 分类下拉，0 表示未分类 */
const categorySelectOptions = computed<ReOption[]>(() => [
  { label: "未分类", value: 0 },
  ...categoryOptions.value.map(item => ({ label: item.label, value: Number(item.value) })),
]);

/** 子流程节点可选的流程，排除自己（后端同样拒自引用） */
const subflowOptions = computed<CollectOption[]>(() => flows.value
  .filter(flow => flow.collectFlowId !== currentId.value)
  .map(flow => ({ value: String(flow.collectFlowId), label: flow.collectFlowName })));

/* ------------------------- 入库节点：数据源 / 表 / 列 ------------------------- */

/** 数据源下拉候选，后端已把应用主库固定为首项 */
const datasourceOptions = ref<CollectOption[]>([]);

onMounted(() => {
  void fetchDatasourceOptions()
    .then(rows => (datasourceOptions.value = rows ?? []))
    .catch(() => (datasourceOptions.value = []));
});

/** 读表清单：设计器按需调用并自行缓存，这里只做透传 */
async function loadTables(datasource: string): Promise<string[]> {
  return (await fetchDatasourceTables(datasource)) ?? [];
}

/** 读列元数据：字段映射控件的左列候选 */
async function loadColumns(datasource: string, table: string): Promise<CollectColumn[]> {
  return (await fetchDatasourceColumns(datasource, table)) ?? [];
}

/* -------------------------------- 任务轮询 -------------------------------- */

let timer: ReturnType<typeof setInterval> | null = null;

function stopPolling(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

/** 取一次任务详情与节点状态，回填画布着色数据 */
async function refreshTask(): Promise<void> {
  const taskId = activeTaskId.value;
  if (!taskId) {
    return;
  }
  try {
    const [task, nodeStates] = await Promise.all([getTask(taskId), fetchNodeStates(taskId)]);
    activeTask.value = task;
    const map: Record<string, CollectTaskLog> = {};
    const viewing = Number(currentId.value ?? 0);
    (nodeStates ?? []).forEach(log => {
      const owner = Number(log.collectTaskLogFlowId ?? 0);
      // 归属为空是草稿执行；归属不是本流程的日志出自子流程，同名节点不能给本画布着色
      if (log.collectTaskLogNodeId && (!viewing || !owner || owner === viewing)) {
        map[log.collectTaskLogNodeId] = log;
      }
    });
    states.value = map;
    if (task.collectTaskStatus !== "RUNNING") {
      stopPolling();
      // 运行条是全局统计，只在进页时取过一次；任务结束不重拉就会一直停在旧值
      void fetchRuntime().then(info => (runtime.value = info));
      const stat = `节点 ${task.collectTaskNodeCount ?? 0} · 请求 ${task.collectTaskRequestCount ?? 0} · 结果 ${task.collectTaskRecordCount ?? 0} · 耗时 ${task.collectTaskCost ?? 0}ms`;
      if (task.collectTaskStatus === "SUCCESS") {
        msgSuccess(`任务 ${task.collectTaskNo} 执行完成，${stat}`);
      } else if (task.collectTaskStatus === "FAILURE") {
        msgError(`任务 ${task.collectTaskNo} 失败：${task.collectTaskError || "见节点日志"}`);
      } else {
        msgInfo(`任务 ${task.collectTaskNo} 已${task.collectTaskStatus === "STOPPED" ? "停止" : "结束"}，${stat}`);
      }
    }
  } catch (error) {
    stopPolling();
    msgError(errText(error));
  }
}

/** 提交任务后开始轮询，1.5s 一次直到任务离开 RUNNING */
function startPolling(taskId: number): void {
  activeTaskId.value = taskId;
  activeTask.value = null;
  states.value = {};
  void refreshTask();
  stopPolling();
  timer = setInterval(() => void refreshTask(), 1500);
}

/**
 * 缓存页切走只停表；重进时若最后取到的状态还是 RUNNING 就续上。
 *
 * 判据用 activeTask 而不是另存一份任务号：切流程与新建都会把它清空，天然不再续轮。
 */
function resumePolling(): void {
  const status = activeTask.value?.collectTaskStatus;
  if (!activeTaskId.value || (status && status !== "RUNNING")) {
    return;
  }
  stopPolling();
  timer = setInterval(() => void refreshTask(), 1500);
  void refreshTask();
}

onDeactivated(stopPolling);

onUnmounted(stopPolling);

/* -------------------------------- 流程切换 -------------------------------- */

function applyFlow(flow: CollectFlow): void {
  currentId.value = flow.collectFlowId;
  currentFlow.value = flow;
  form.name = flow.collectFlowName ?? "";
  form.code = flow.collectFlowCode ?? "";
  form.categoryId = flow.collectFlowCategoryId ?? 0;
  form.cron = flow.collectFlowCron ?? "";
  form.concurrency = flow.collectFlowConcurrency ?? 1;
  form.threadCount = flow.collectFlowThreadCount ?? runtime.value?.defaultThreadCount ?? 4;
  form.remark = flow.collectFlowRemark ?? "";
  cronBroken.value = false;
  designer.value?.load(flow.dsl);
  states.value = {};
  dirty.value = false;
}

/** 丢弃未保存改动前的统一确认；返回 false 表示用户取消 */
async function confirmDiscard(action: string): Promise<boolean> {
  if (!dirty.value) {
    return true;
  }
  return confirmAction(`${action}会丢弃当前画布上未保存的改动，是否继续？`, "未保存的改动");
}

async function selectFlow(flowId: unknown): Promise<void> {
  const id = Number(flowId) || 0;
  if (!id) {
    return;
  }
  if (!(await confirmDiscard("切换流程"))) {
    return;
  }
  try {
    applyFlow(await getFlow(id));
    stopPolling();
    activeTaskId.value = null;
    activeTask.value = null;
  } catch (error) {
    msgError(errText(error));
  }
}

async function newFlow(): Promise<void> {
  if (!(await confirmDiscard("新建流程"))) {
    return;
  }
  stopPolling();
  activeTaskId.value = null;
  activeTask.value = null;
  currentId.value = null;
  currentFlow.value = null;
  form.name = "未命名流程";
  form.code = "";
  form.categoryId = 0;
  form.cron = "";
  form.concurrency = 1;
  form.threadCount = runtime.value?.defaultThreadCount ?? 4;
  form.remark = "";
  cronBroken.value = false;
  designer.value?.startWith(form.name);
  dirty.value = true;
  propsVisible.value = true;
}

/* -------------------------------- 保存与执行 ------------------------------- */

function graphOf(): CollectDsl | null {
  const dsl = designer.value?.getGraph();
  if (!dsl) {
    msgError("设计器尚未就绪");
    return null;
  }
  if (!dsl.nodes.length) {
    msgWarning("流程图还没有节点");
    return null;
  }
  dsl.name = form.name || dsl.name;
  return dsl;
}

function dtoOf(dsl: CollectDsl): CollectFlowSave {
  return {
    collectFlowId: currentId.value,
    collectFlowName: form.name.trim(),
    collectFlowCategoryId: form.categoryId || 0,
    collectFlowCode: form.code.trim() || null,
    collectFlowCron: form.cron.trim() || null,
    collectFlowConcurrency: form.concurrency,
    collectFlowThreadCount: form.threadCount,
    collectFlowRemark: form.remark || null,
    dsl,
  };
}

async function save(): Promise<void> {
  if (!form.name.trim()) {
    msgWarning("请填写流程名称");
    propsVisible.value = true;
    return;
  }
  if (cronBroken.value) {
    msgWarning("cron 表达式不合法，请修正后再保存");
    propsVisible.value = true;
    return;
  }
  const dsl = graphOf();
  if (!dsl) {
    return;
  }
  saving.value = true;
  try {
    const saved = currentId.value ? await updateFlow(dtoOf(dsl)) : await saveFlow(dtoOf(dsl));
    currentId.value = saved.collectFlowId;
    currentFlow.value = saved;
    form.code = saved.collectFlowCode ?? form.code;
    dirty.value = false;
    propsVisible.value = false;
    flows.value = (await listFlows()) ?? [];
    msgSuccess(`流程已保存（ID ${saved.collectFlowId}）`);
  } catch (error) {
    msgError(errText(error));
  } finally {
    saving.value = false;
  }
}

async function validate(): Promise<void> {
  const dsl = graphOf();
  if (!dsl) {
    return;
  }
  try {
    msgSuccess(await validateDsl(dsl));
  } catch (error) {
    msgError(errText(error));
  }
}

/** 试运行：提交当前画布（无需先保存），结果不落库 */
async function doDryRun(): Promise<void> {
  const dsl = graphOf();
  if (!dsl) {
    return;
  }
  try {
    const task = await dryRun(dsl);
    msgInfo(`试运行已提交：${task.collectTaskNo}`);
    startPolling(task.collectTaskId);
  } catch (error) {
    msgError(errText(error));
  }
}

/** 运行：执行库里已保存的流程，结果落库 */
async function doRun(): Promise<void> {
  if (!currentId.value) {
    msgWarning("请先保存流程再运行");
    return;
  }
  try {
    const task = await runFlow({ collectFlowId: currentId.value, persist: true });
    msgInfo(`运行已提交：${task.collectTaskNo}`);
    startPolling(task.collectTaskId);
  } catch (error) {
    msgError(errText(error));
  }
}

async function doStop(): Promise<void> {
  if (!activeTaskId.value) {
    return;
  }
  try {
    const stopped = await stopTask(activeTaskId.value);
    msgInfo(stopped ? "已发送停止信号" : "该任务已不在本机执行队列中");
  } catch (error) {
    msgError(errText(error));
  }
}

async function doCopy(): Promise<void> {
  if (!currentId.value) {
    return;
  }
  try {
    const copied = await copyFlow(currentId.value);
    flows.value = (await listFlows()) ?? [];
    applyFlow(copied);
    msgSuccess(`已复制为流程「${copied.collectFlowName}」`);
  } catch (error) {
    msgError(errText(error));
  }
}

async function doDelete(): Promise<void> {
  if (!currentId.value) {
    return;
  }
  if (!(await confirmAction(`确认删除流程「${form.name}」？其节点日志与采集结果不受影响。`, "删除流程"))) {
    return;
  }
  try {
    await deleteFlow(currentId.value);
    msgSuccess("流程已删除");
    await newFlow();
    flows.value = (await listFlows()) ?? [];
  } catch (error) {
    msgError(errText(error));
  }
}

async function toggleSchedule(value: unknown): Promise<void> {
  if (!currentId.value) {
    msgWarning("请先保存流程再启停调度");
    return;
  }
  try {
    const updated = await setFlowStatus(currentId.value, value === true ? 1 : 0);
    currentFlow.value = updated;
    flows.value = (await listFlows()) ?? [];
    msgSuccess(value === true ? "调度已启用" : "调度已停用");
  } catch (error) {
    msgError(errText(error));
  }
}

async function openProps(): Promise<void> {
  propsVisible.value = true;
  try {
    categoryOptions.value = (await fetchCategoryOptions()) ?? [];
  } catch (error) {
    msgError(errText(error));
  }
}

/** ReCron 回报合法性：留空是「不定时调度」，不算错 */
function onCronChange(expression: string, valid: boolean): void {
  cronBroken.value = !valid && Boolean(expression.trim());
}

/** 手动重取当前任务节点状态（任务结束后画布回显用） */
async function refreshStates(): Promise<void> {
  if (!activeTaskId.value) {
    msgInfo("还没有执行过任务");
    return;
  }
  await refreshTask();
}
</script>

<template>
  <div v-loading="loading" class="collect-page">
    <div class="collect-toolbar">
      <span class="tb-label">流程</span>
      <ReSelect
        :model-value="currentId ?? ''"
        size="small"
        style="width: 260px"
        :options="flowOptions"
        placeholder="选择已保存的流程"
        filterable
        clearable
        @update:model-value="selectFlow"
      />
      <ReButton size="small" icon="DocumentAdd" @click="newFlow">新建</ReButton>
      <ReTag v-if="dirty" size="small" type="warning">未保存</ReTag>
      <ReTag v-else-if="currentId" size="small" type="success">已保存</ReTag>
      <span class="tb-sep"/>
      <ReButton size="small" type="primary" icon="Check" :loading="saving" @click="save">保存</ReButton>
      <ReButton size="small" icon="CircleCheck" @click="validate">校验</ReButton>
      <ReButton size="small" icon="VideoPlay" @click="doDryRun">试运行</ReButton>
      <ReButton size="small" icon="Promotion" :disabled="!currentId" @click="doRun">运行</ReButton>
      <ReButton
        size="small"
        type="danger"
        plain
        icon="VideoPause"
        :disabled="!activeTaskId || !taskRunning"
        @click="doStop"
      >
        停止
      </ReButton>
      <span class="tb-sep"/>
      <ReButton size="small" icon="Setting" @click="openProps">流程属性</ReButton>
      <ReButton size="small" icon="CopyDocument" :disabled="!currentId" @click="doCopy">复制</ReButton>
      <ReButton size="small" icon="Delete" :disabled="!currentId" @click="doDelete">删除</ReButton>
      <ReButton size="small" icon="Files" @click="categoryVisible = true">分类管理</ReButton>
      <span class="spacer"/>
      <span class="tb-label">调度</span>
      <ReSwitch
        size="small"
        :model-value="currentFlow?.collectFlowStatus === 1"
        :disabled="!currentId"
        @update:model-value="toggleSchedule"
      />
      <ReButton size="small" text @click="refreshStates">刷新节点状态</ReButton>
      <ReButton size="small" text icon="Refresh" @click="reload">刷新列表</ReButton>
    </div>

    <div class="collect-card collect-runtime">
      <span class="collect-pulse"/>
      <template v-if="runtime">
        <span>执行器 {{ runtime.executorId }}</span>
        <span class="tb-dot">·</span>
        <span>模块{{ runtime.enable ? "已启用" : "已停用" }}</span>
        <span class="tb-dot">·</span>
        <span>流程 {{ runtime.flowCount }}（启用 {{ runtime.enabledFlowCount }}）</span>
        <span class="tb-dot">·</span>
        <span>任务 {{ runtime.taskCount }}</span>
        <span class="tb-dot">·</span>
        <span>结果 {{ runtime.recordCount }}</span>
        <span class="tb-dot">·</span>
        <span>运行中 {{ runtime.runningTasks }}</span>
        <span class="tb-dot">·</span>
        <span>调度台账 {{ runtime.schedulerGroup }} · 已登记 {{ runtime.scheduledJobCount }}</span>
        <span class="tb-dot">·</span>
        <span>节点类型 {{ metas.length }} 种</span>
      </template>
      <template v-if="activeTask">
        <span class="tb-dot">｜</span>
        <span>当前任务 {{ activeTask.collectTaskNo }}（{{ activeTask.collectTaskStatus }}）</span>
      </template>
      <span class="spacer"/>
    </div>

      <FlowDesigner ref="designer" :metas="metas" :states="states" :flow-options="subflowOptions"
                    :datasource-options="datasourceOptions" :load-tables="loadTables"
                    :load-columns="loadColumns"
                    @change="dirty = true"/>

    <CategoryDialog v-model="categoryVisible"/>

    <ReDialog
      v-model="propsVisible"
      title="流程属性"
      :width="620"
      :close-on-click-modal="false"
    >
      <div class="collect-form">
        <div class="collect-form__item">
          <span class="collect-form__label"><i class="req">*</i>流程名称</span>
          <ReInput v-model="form.name" size="small" maxlength="128" placeholder="必填，不超过 128 字"/>
        </div>
        <div class="collect-form__item">
          <span class="collect-form__label">流程编码</span>
          <ReInput v-model="form.code" size="small" maxlength="64" placeholder="留空自动生成 flow-xxxxxxxx"/>
        </div>
        <div class="collect-form__item">
          <span class="collect-form__label">分类</span>
          <ReSelect v-model="form.categoryId" size="small" style="width: 100%" :options="categorySelectOptions"/>
        </div>
        <div class="collect-form__item collect-form__item--stack">
          <span class="collect-form__label">cron</span>
          <ReCron
            v-model="form.cron"
            :preview-count="5"
            placeholder="6 段表达式，留空表示不定时调度"
            @change="onCronChange"
          />
        </div>
        <div class="collect-form__item">
          <span class="collect-form__label">并发数</span>
          <ReInputNumber v-model="form.concurrency" size="small" :min="1" :max="32" controls-position="right"/>
          <span class="collect-hint collect-hint--muted">同一流程在途任务上限，超出时本次触发跳过</span>
        </div>
        <div class="collect-form__item">
          <span class="collect-form__label">线程数</span>
          <ReInputNumber v-model="form.threadCount" size="small" :min="1" :max="64" controls-position="right"/>
          <span class="collect-hint collect-hint--muted">流程内节点并行执行线程数</span>
        </div>
        <div class="collect-form__item collect-form__item--stack">
          <span class="collect-form__label">备注</span>
          <ReInput v-model="form.remark" type="textarea" :rows="2"/>
        </div>
        <div v-if="currentFlow" class="collect-form__item collect-form__item--stack">
          <span class="collect-form__label">执行统计</span>
          <span class="collect-hint">
            已执行 {{ currentFlow.collectFlowExecCount }} 次 · 上次
            {{ currentFlow.collectFlowLastExecTime || "—" }} · 下次
            {{ currentFlow.collectFlowNextExecTime || "—" }}
            <template v-if="currentFlow.collectFlowStatus === 1 && !currentFlow.scheduled">
              · 调度未登记，保存一次流程即可补上
            </template>
          </span>
        </div>
      </div>
      <template #footer="{ cancel }">
        <ReButton size="small" @click="cancel">关闭</ReButton>
        <ReButton size="small" type="primary" :loading="saving" @click="save">保存</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped>
.tb-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.tb-sep {
  width: 1px;
  align-self: stretch;
  background: var(--el-border-color-lighter);
}

.tb-dot {
  color: var(--el-text-color-placeholder);
}

.collect-runtime {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.collect-runtime .spacer {
  flex: 1 1 auto;
}
</style>
