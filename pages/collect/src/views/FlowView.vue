<!--
  流程设计器主视图：流程选择 / 属性 / 保存校验 / 试运行与运行 / 节点状态回显。

  节点库与属性面板全部由 /designer/metas 驱动，本页面不硬编码任何节点类型；
  试运行与运行都是异步提交，拿到 taskId 后轮询 /task/node-states 给画布着色。
  cron 用 ReCron：面板生成 + 合法性 + 未来触发时间都在页面上算，与服务端同一套 6 字段方言。
-->
<script setup lang="ts">
  import { computed, onActivated, onDeactivated, onMounted, onUnmounted, reactive, ref, withDefaults } from "vue";
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
import { formatDuration } from "@repo/ui/re-time";
import { costMs } from "@repo/utils";
import CategoryDialog from "../components/CategoryDialog.vue";
import FlowDesigner from "../components/FlowDesigner.vue";
// 建表 / 补列走数据源中心的 DDL 接口（只有它是权威实现，采集侧运行期也用同一套）
import { executeTableDdl, previewTableDdl } from "@pages/datasource";
import {
  copyFlow,
  deleteFlow,
    dryRun,
    fetchCategoryOptions,
    fetchDatasourceColumns,
    APP_DATASOURCE,
    fetchDatasourceOptions,
    fetchDatasourceTables,
    fetchMetas,
  fetchNodeStates,
  fetchRuntime,
  getFlow,
  getTask,
  listFlows,
  listFunctions,
  listVariables,
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
  import type { PlaceholderGroup } from "../components/nodes/paramContext";

defineOptions({ name: "CollectDesign" });

/**
 * 弹窗承载模式（流程设计不再占独立菜单）。
 *
 * 采集器管理里点「流程设计」打开全屏弹窗，承载的就是这个组件：
 *   embedded=true  隐掉左侧流程选择与页级运行条，采集器由外部指定
 *   flowId 有值    装载该采集器；为 null 则开一张空白画布（新建）
 * 保存成功后 emit("saved")，由采集器列表自己刷新，避免弹窗内外两套列表打架。
 */
const props = withDefaults(
  defineProps<{
    /** 是否弹窗承载模式 */
    embedded?: boolean;
    /** 要装载的采集器（流程）ID；null 表示新建空白画布 */
    flowId?: number | null;
  }>(),
  { embedded: false, flowId: null },
);

const emit = defineEmits<{ (event: "saved", flowId: number): void }>();

const designer = ref<InstanceType<typeof FlowDesigner> | null>(null);

/** 「插入占位」入口的分组数据：全局变量 + 自定义函数，由 onMounted 拉取 */
const placeholderGroups = ref<PlaceholderGroup[]>([]);
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
  // 弹窗模式：metas 与画布就绪后再装载目标采集器，顺序反了会拿空画布加载
  if (props.embedded) {
    if (props.flowId) {
      await selectFlow(props.flowId);
    } else {
      await newFlow();
    }
  }
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

/** 数据源下拉候选 */
const datasourceOptions = ref<CollectOption[]>([]);

/**
 * 保证「本系统」始终排在第一项。
 *
 * <p>台账接口可能返回空、也可能直接失败（原实现失败时把候选清成空数组），那时用户在选择
 * 「目标数据源」时**一个可选项都没有**，字段映射自然无从下手。应用主库是平台自己本来就有的，
 * 不该依赖台账接口是否可用 —— 所以这里无条件兜底，label 也写成人话而不是 {@code app}。</p>
 *
 * @param rows 台账返回的候选（可为空）
 * @returns 已确保含「本系统」的候选列表
 */
function withAppDatasource(rows?: CollectOption[] | null): CollectOption[] {
  const list = [...(rows ?? [])];
  if (!list.some(item => item.value === APP_DATASOURCE)) {
    list.unshift({ value: APP_DATASOURCE, label: "本系统（当前应用库）" });
  }
  return list;
}

onMounted(() => {
  void fetchDatasourceOptions()
    .then(rows => (datasourceOptions.value = withAppDatasource(rows)))
    .catch(() => (datasourceOptions.value = withAppDatasource([])));
  void loadPlaceholders();
});

/**
 * 占位字段分组：全局变量 + 自定义函数。
 *
 * <p>两者都是「写表达式时可引用的东西」，所以合成分组交给设计器的「插入占位」入口。
 * 失败一律降级成空数组 —— 拿不到占位清单不该把设计器整体打挂（用户仍能手打 `${}`）。</p>
 */
async function loadPlaceholders(): Promise<void> {
  const [vars, funcs] = await Promise.all([
    listVariables().catch(() => []),
    listFunctions().catch(() => []),
  ]);
  const groups: PlaceholderGroup[] = [];
  const varItems = (vars ?? [])
    .filter(item => item.collectVariableName)
    .map(item => ({
      name: item.collectVariableName,
      description: item.collectVariableDescription
        || (item.collectVariableEncrypted ? "全局变量（密文）" : "全局变量"),
      sample: item.collectVariableEncrypted ? "" : (item.collectVariableValue ?? "").slice(0, 40),
    }));
  if (varItems.length) {
    groups.push({ label: "全局变量", items: varItems });
  }
  const funcItems = (funcs ?? [])
    .filter(item => item.collectFunctionName)
    .map(item => ({
      name: item.collectFunctionName,
      description: item.collectFunctionDescription || "自定义函数",
      sample: item.collectFunctionParameters != null ? `${item.collectFunctionParameters} 个形参` : "",
    }));
  if (funcItems.length) {
    groups.push({ label: "自定义函数", items: funcItems });
  }
  placeholderGroups.value = groups;
}

/** 读表清单：设计器按需调用并自行缓存，这里只做透传 */
/**
 * 建表 / 补列的请求与结果适配。
 *
 * <p>表单只给「目标列名 + 主键列名」，列类型在这里补齐成 TEXT —— 与运行期
 * {@code CollectJdbcSupport.ensureTable} 用同一套规则，避免设计期建出来的表和运行期自动建的表不一致。
 * 数据源引用留空即应用主库。</p>
 *
 * @param request 表单给的列名与主键列名
 * @returns 数据源中心的建表请求
 */
function toDdlRequest(request: { datasource: string; table: string; columns: string[]; primaryKey: string[] }) {
  const keys = new Set(request.primaryKey);
  return {
    datasource: request.datasource || APP_DATASOURCE,
    table: request.table,
    // 主键列必须是「可索引」类型：TEXT 做主键会被 MySQL/MariaDB 直接拒
    // （实测报错：BLOB/TEXT column 'x' used in key specification without a key length），
    // 所以主键列给 VARCHAR(191)，其余仍用 TEXT —— 与运行期 CollectJdbcSupport.ensureTable 同一套口径。
    columns: request.columns.map(name => ({
      name,
      type: keys.has(name) ? "VARCHAR(191)" : "TEXT",
    })),
    primaryKey: request.primaryKey.length ? request.primaryKey : null,
  };
}

/**
 * 把数据源中心的返回摊平成表单能直接显示的形态。
 *
 * @param result 数据源中心返回的建表结果
 * @returns 含 SQL 文本与「是否存在 / 是否新建 / 补了哪些列」的结果
 */
function toDdlPayload(result: {
  exists?: boolean;
  created?: boolean;
  appendedColumns?: string[] | null;
  sql?: string | null;
  sqls?: string[] | null;
}): { sql: string; exists: boolean; created: boolean; appended: string[] } {
  const sql = result?.sql
    || (Array.isArray(result?.sqls) ? result.sqls.join("\n") : "")
    || "";
  return {
    sql,
    exists: Boolean(result?.exists),
    created: Boolean(result?.created),
    appended: result?.appendedColumns ?? [],
  };
}

/** 预览建表 / 补列 DDL（不执行） */
async function previewDdl(request: { datasource: string; table: string; columns: string[]; primaryKey: string[] }) {
  return toDdlPayload(await previewTableDdl(toDdlRequest(request)));
}

/** 执行建表 / 补列 */
async function executeDdl(request: { datasource: string; table: string; columns: string[]; primaryKey: string[] }) {
  return toDdlPayload(await executeTableDdl(toDdlRequest(request)));
}

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
      // 耗时用 ReTime 的 formatDuration 格式化（与表格列同源），空值不编造 0
      const parts = [
        `节点 ${task.collectTaskNodeCount ?? 0}`,
        `请求 ${task.collectTaskRequestCount ?? 0}`,
        `结果 ${task.collectTaskRecordCount ?? 0}`,
      ];
      const cost = costMs(task.collectTaskCost);
      if (cost != null) {
        parts.push(`耗时 ${formatDuration(cost)}`);
      }
      const stat = parts.join(" · ");
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

/**
 * 清空到「未命名流程」态。
 *
 * 刻意不做「是否放弃未保存改动」的确认：由调用方各自决定要不要问。
 * `newFlow` 是用户主动新建（该问）；删除成功后是既成事实（没什么可放弃的，
 * 再问一遍只会让人有机会点「取消」，而删除又拦不住）。
 */
function resetToNewFlow(): void {
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

async function newFlow(): Promise<void> {
  if (!(await confirmDiscard("新建流程"))) {
    return;
  }
  resetToNewFlow();
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
    emit("saved", saved.collectFlowId);
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
    // 这里刻意不走 newFlow()：它开头会问「新建流程会丢弃当前画布上未保存的改动，是否继续？」，
    // 用户点「取消」时 newFlow 直接 return，而本函数无从得知 —— 结果是流程已从服务端删除、
    // 界面却还开着它、currentId 也没清，后续保存必然撞 400「流程不存在或已删除」。
    // 删除已经发生，没有可放弃的东西，直接复位。
    resetToNewFlow();
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
      <template v-if="!embedded">
        <span class="tb-label">流程</span>
        <ReSelect
          :model-value="currentId ?? ''"
          
          style="width: 260px"
          :options="flowOptions"
          placeholder="选择已保存的流程"
          filterable
          clearable
          @update:model-value="selectFlow"
        />
        <ReButton layout="square" icon="DocumentAdd" tip="新建流程" @click="newFlow" />
      </template>
      <span v-else class="tb-label">流程设计</span>
      <ReTag v-if="dirty"  type="warning">未保存</ReTag>
      <ReTag v-else-if="currentId"  type="success">已保存</ReTag>
      <span class="tb-sep"/>
      <ReButton layout="square" type="primary" icon="Check" tip="保存流程" :loading="saving" @click="save" />
      <ReButton layout="square" icon="CircleCheck" tip="结构校验" @click="validate" />
      <ReButton layout="square" icon="VideoPlay" tip="试运行" @click="doDryRun" />
      <ReButton layout="square" icon="Promotion" tip="运行" :disabled="!currentId" @click="doRun" />
      <ReButton
        layout="square"
        type="danger"
        plain
        icon="VideoPause"
        tip="停止运行"
        :disabled="!activeTaskId || !taskRunning"
        @click="doStop"
      />
      <span class="tb-sep"/>
      <ReButton layout="square" icon="Setting" tip="流程属性" @click="openProps" />
      <ReButton layout="square" icon="CopyDocument" tip="复制流程" :disabled="!currentId" @click="doCopy" />
      <ReButton layout="square" type="danger" icon="Delete" tip="删除流程" :disabled="!currentId" @click="doDelete" />
      <ReButton layout="square" icon="Files" tip="分类管理" @click="categoryVisible = true" />
      <span class="spacer"/>
      <span class="tb-label">调度</span>
      <ReSwitch
        
        :model-value="currentFlow?.collectFlowStatus === 1"
        :disabled="!currentId"
        @update:model-value="toggleSchedule"
      />
      <ReButton layout="square" icon="RefreshRight" tip="刷新节点状态" @click="refreshStates" />
      <ReButton v-if="!embedded" layout="square" icon="Refresh" tip="刷新列表" @click="reload" />
    </div>

    <div v-if="!embedded" class="collect-card collect-runtime">
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

      <!--
        画布要等节点元数据（metas）到齐才挂。
        ReFlowGraph 的内核在 onMounted 那一刻就把 nodeTypes 读进引擎，之后不再跟 prop 走；
        画布先挂、metas 后到时引擎里一个节点类型都没有，灌进来的节点拿不到图形信息，
        表现为「流程能选中、能保存，但画布空白、计数 0」（实测）。
        预览图弹窗一直是先取 metas 再挂画布，所以只有设计器空白——两条路径的差别只在这里。
      -->
      <FlowDesigner
        v-if="metas.length"
        ref="designer"
        :metas="metas"
        :states="states"
        :flow-options="subflowOptions"
        :initial-dsl="currentFlow?.dsl ?? null"
        :datasource-options="datasourceOptions"
        :load-tables="loadTables"
        :load-columns="loadColumns"
        :preview-ddl="previewDdl"
        :execute-ddl="executeDdl"
        :placeholder-groups="placeholderGroups"
        @change="dirty = true"
      />

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
          <ReInput v-model="form.name"  maxlength="128" placeholder="必填，不超过 128 字"/>
        </div>
        <div class="collect-form__item">
          <span class="collect-form__label">流程编码</span>
          <ReInput v-model="form.code"  maxlength="64" placeholder="留空自动生成 flow-xxxxxxxx"/>
        </div>
        <div class="collect-form__item">
          <span class="collect-form__label">分类</span>
          <ReSelect v-model="form.categoryId"  style="width: 100%" :options="categorySelectOptions"/>
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
          <ReInputNumber v-model="form.concurrency"  :min="1" :max="32" controls-position="right"/>
          <span class="collect-hint collect-hint--muted">同一流程在途任务上限，超出时本次触发跳过</span>
        </div>
        <div class="collect-form__item">
          <span class="collect-form__label">线程数</span>
          <ReInputNumber v-model="form.threadCount"  :min="1" :max="64" controls-position="right"/>
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
        <ReButton  @click="cancel">关闭</ReButton>
        <ReButton  type="primary" :loading="saving" @click="save">保存</ReButton>
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
