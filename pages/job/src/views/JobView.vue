<!--
  调度工作台：调度中心的落地页，整页就一张任务列表。

  运行态分页（JobRuntimeVO），关键字走 ReTable 内置搜索区输入框，状态是下拉框（含「全部状态」这一档，
  选中即随下次查询生效），分发仍是纯图标按钮式直点（字段标签在上，含义不靠文字猜）。工具栏只有「新建任务」，
  刷新与自动刷新都用表格自带的能力（:auto-refresh，轮询定时器由 ReTable 持有），执行器清单在进页面与每次
  写入后自动重取，逐行的启停与操作都在「操作」列上。要看单轮派发的详情去「作业日志」页，日志清理也在那一页，
  这里不再复制一份侧栏。

  新建/编辑任务的弹层是手写的卡片式布局（模板里的 task-form 分支）：顶部两张卡片切执行类型（对象 / 脚本），
  往下按「基本信息 / 脚本正文 / 调度配置 / 策略与告警」分区，字段集只在这一处维护；cron 用 ReCron 收口，
  毫秒间隔按调度类型显隐。只有「编辑流程调度」另一种弹层状态走 ReForm schema（FLOW_FIELDS）。

  两类行的写入口不同，这里按分组分流：
  - group=collect-flow 的行是采集流程的调度镜像，改名/改 cron/删除一律走采集流程接口
    （流程表是唯一写入方，台账镜像由后端重新登记），启停与运行也回落到流程接口；
  - 其余是外部作业，走调度控制台的 /v2/scheduler/** 治理接口。

   「立即触发」经 JobOperator 命令通道投递一次立即派发，不改变启停状态；停用的任务不会被
   自动派发，所以停用行的触发按钮禁用。远程分发（dispatchMode=REMOTE）的行本机不领取：本节点不是调度中心时，
   这类行在「执行器」列打「远程」标记（带归属提示）、「下次触发」列直接写「非本机执行」，工具条上给出本机不领取的
   条数，而不是让人对着一个永远不来的时刻等。

   顶部状态条把 summary 里的节点身份一次说完：角色 / 是否 Leader / 节点标识 / 台账构成 / 未注册处理器 /
   在线执行器，让「本机到底会不会派发」在进页面第一眼就有答案，不必逐行翻找标记。行内「详情」回显
   /detail 的完整运行态（含脚本正文与重试/超时策略），弹层底部可直接编辑或立即触发，省去关弹层再找行；
   「复制」按行类型分流：流程行走采集的流程复制、外部任务预填新建表单，都不改变源任务。列表开启常驻勾选，
   工具条的批量启停/批量删除对勾选行逐个执行并逐行报错，任一失败不会中断整批。
-->
<script setup lang="ts">
import { computed, nextTick, onActivated, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { msgError, msgInfo, msgSuccess } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReCron from "@repo/ui/re-cron";
import ReDialog from "@repo/ui/re-dialog";
import ReForm from "@repo/ui/re-form";
import ReInput from "@repo/ui/re-input";
import ReInputNumber from "@repo/ui/re-input-number";
import ReSelect from "@repo/ui/re-select";
import ReSwitch from "@repo/ui/re-switch";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import ReTime from "@repo/ui/re-time";
import type { ReOption } from "@repo/ui/re-select";
import type { ReFormField } from "@repo/ui/re-form";
import type { RePageResult, ReTableColumn, ReTableLoadParams, ReTableSearchConfig } from "@repo/ui/re-table";
import {
  deleteJob,
  getJob,
  getSummary,
  listExecutors,
  pageJobs,
  saveJob,
  setJobStatus,
  triggerJob,
} from "../api/jobApi";
import { copyFlow, deleteFlow, getFlow, setFlowStatus, updateFlow } from "@pages/collect";
import {
  COLLECT_FLOW_GROUP,
  type JobExecutor,
  type JobRuntime,
  type JobSave,
  type JobSummary,
} from "../types/job";
import type { CollectFlow } from "@pages/collect";
import ScriptSourceField from "../components/ScriptSourceField.vue";
import { confirmAction, errText } from "../composables/useCollectView";
import { fmtMs } from "../utils/time";

defineOptions({ name: "CollectJob" });

const router = useRouter();
const route = useRoute();

/** 分页快照：page/pageSize 由 ReTable 同步，过滤条件走内置搜索区 */
const query = ref({ page: 1, pageSize: 20 });

/** 内置搜索区的实时草稿值，ReTable 会把它并进 loader 的 params */
const searchModel = ref<Record<string, unknown>>({ keyword: "", status: "", dispatchMode: "" });

/** 状态下拉：空串是「全部」这一档，过筛时归一为不带该条件 */
const STATUS_OPTIONS: ReOption[] = [
  { label: "全部状态", value: "" },
  { label: "启用中", value: 1 },
  { label: "已停用", value: 0 },
];

const DISPATCH_OPTIONS: ReOption[] = [
  { label: "全部分发", value: "", icon: "Grid" },
  { label: "本地执行", value: "LOCAL", icon: "Monitor" },
  { label: "远程分发", value: "REMOTE", icon: "Connection" },
];

/** 调度类型取值与后端 JobSpec 常量一致 */
const SCHEDULE_OPTIONS: ReOption[] = [
  { label: "CRON 表达式", value: "CRON" },
  { label: "固定频率（毫秒）", value: "FIXED" },
  { label: "固定延迟（毫秒）", value: "DELAY" },
  { label: "不自动调度", value: "NONE" },
];

const MISFIRE_OPTIONS: ReOption[] = [
  { label: "错过不补跑", value: "DO_NOTHING" },
  { label: "错过补跑一次", value: "FIRE_ONCE_NOW" },
];

/** 失败告警类型：空串表示不告警，值域与后端 JobAlarmMessage 常量一致 */
const ALARM_TYPE_OPTIONS: ReOption[] = [
  { label: "不告警", value: "" },
  { label: "邮件", value: "EMAIL" },
  { label: "Webhook", value: "WEBHOOK" },
];

/**
 * 执行类型（顶部三张卡片，与后端 GlueTypes 常量逐字对齐）：
 *  - 对象：从已注册执行器对象（Bean 处理器）里选一个执行，任务键即处理器名；
 *  - 脚本：Groovy 正文随任务下发到执行器执行（ScriptProvider SPI），无需注册处理器；
 *  - Java：完整类源码片段，执行器用 javax.tools 现场编译后反射调用，字段上的 @Autowired 生效。
 *
 * 脚本侧写 GLUE_GROOVY 而非裸值 groovy：裸值是存量台账的写法，两者后端等价，
 * 新建统一用 GLUE_ 前缀形态，避免下拉里出现两个含义相同的值。
 */
const GLUE_BEAN = "BEAN";
const GLUE_JAVA = "GLUE_JAVA";
const GLUE_GROOVY = "GLUE_GROOVY";

const SEARCH: ReTableSearchConfig = {
  title: "搜索任务",
  showToggle: true,
  showSearchBtn: true,
  showResetBtn: true,
  filters: [
    { key: "keyword", label: "关键字", type: "input", placeholder: "任务名 / 处理器 / 编号 / 负责人" },
    {
      key: "status",
      label: "状态",
      type: "select",
      placeholder: "全部状态",
      options: STATUS_OPTIONS,
      attrs: { clearable: false },
    },
    // 分发筛选：ReTable 的搜索过滤控件已不再支持 square（分段按钮），
    // 与相邻的「状态」筛选取同一种 select 形态；DISPATCH_OPTIONS 首项即「全部分发」。
    {
      key: "dispatchMode",
      label: "分发",
      type: "select",
      placeholder: "全部分发",
      options: DISPATCH_OPTIONS,
      attrs: { clearable: false },
    },
  ],
};

const tableRef = ref<{
  reload: () => void;
  goto: (page?: number) => void;
  clearAllSelection: () => void;
} | null>(null);

const busyKey = ref("");

/** 当前勾选行（跨页，由 ReTable 常驻勾选列回传），批量启停与批量删除的输入 */
const selectedRows = ref<JobRuntime[]>([]);
const selectedCount = computed(() => selectedRows.value.length);

/** 本节点已注册执行器清单（@Job 扫描 + 三方注入），表单选项与「未注册」标记都以此为准 */
const executors = ref<JobExecutor[]>([]);
const registeredNames = computed(() => new Set(executors.value.map(item => item.name)));
const executorOptions = computed<ReOption[]>(() =>
  executors.value.map(item => ({
    label: `[${executorSourceLabel(item.source)}] ${item.name}${item.desc ? ` · ${item.desc}` : ""}`,
    value: item.name,
  })),
);

/** 执行器来源标签：远端上报说明本节点没有该处理器，任务由执行器节点执行 */
function executorSourceLabel(source: JobExecutor["source"]): string {
  if (source === "REMOTE") {
    return "执行器";
  }
  return source === "INJECTED" ? "注入" : "@Job";
}

/** 任务选择器的卡片数据：卡片模式展示来源与描述，并用 tag 明确标记「本机 / 远程」 */
const executorCardOptions = computed<ReOption[]>(() =>
  executors.value.map(item => {
    const remote = item.source === "REMOTE";
    return {
      value: item.name,
      label: item.name,
      description: `${executorSourceLabel(item.source)}${item.desc ? ` · ${item.desc}` : ""}`,
      group: remote ? "在线执行器（远程）" : "本节点",
      tag: remote ? "远程" : "本机",
      tagColor: remote
        ? "var(--el-color-warning-light-8)"
        : "var(--el-color-primary-light-8)",
    };
  }),
);

const columns = computed<ReTableColumn[]>(() => [
  { prop: "jobName", label: "任务名", minWidth: 160, slot: "name", showOverflowTooltip: true },
  { prop: "scheduleType", label: "调度表达式", width: 126, slot: "schedule" },
  { prop: "jobKey", label: "执行器", minWidth: 110, slot: "executor", showOverflowTooltip: true },
  { prop: "enabled", label: "状态开关", width: 84, slot: "status", align: "center" },
  { prop: "nextFireTime", label: "下次触发", width: 132, slot: "next" },
  { prop: "lastFireTime", label: "最近触发", width: 132, slot: "last" },
  { prop: "author", label: "负责人", width: 74, slot: "author" },
  { prop: "action", label: "操作", width: 190, slot: "action", fixed: "right" },
]);

function isFlowRow(job: JobRuntime): boolean {
  return job.group === COLLECT_FLOW_GROUP;
}

/** 代码片段任务：执行类型非 BEAN，不依赖处理器注册表（Groovy 脚本与 Java 片段都算） */
function isScriptJob(job: JobRuntime): boolean {
  return Boolean(job.glueType) && job.glueType !== GLUE_BEAN;
}

/** 台账行回到流程：优先用执行参数里的流程 ID，退回按 collect-flow-<id> 约定解析 */
function flowIdOf(job: JobRuntime): number {
  const fromParam = Number(job.executeParam);
  if (Number.isFinite(fromParam) && fromParam > 0) {
    return fromParam;
  }
  const matched = /(\d+)$/.exec(job.jobKey ?? "");
  return matched ? Number(matched[1]) : 0;
}

/**
 * 告警类型展示名。
 *
 * @param alarmType 台账告警类型
 * @param target    告警目标
 * @returns 展示名（空类型但有目标时按邮件，与后端兼容口径一致）
 */
function alarmTypeText(alarmType: unknown, target: unknown): string {
  const key = String(alarmType ?? "").toUpperCase();
  if (key === "WEBHOOK") {
    return "Webhook";
  }
  if (key === "EMAIL") {
    return "邮件";
  }
  return target ? "邮件" : "不告警";
}

function scheduleText(job: JobRuntime): string {
  if (job.scheduleType === "NONE" || !job.scheduleTime) {
    return "不自动调度";
  }
  if (job.scheduleType === "CRON") {
    return `CRON · ${job.scheduleTime}`;
  }
  return `${job.scheduleType} · ${job.scheduleTime}ms`;
}

/** 注册表里没有同名处理器 = 这一轮派发必然记处理器未注册；本机不领取的远程行与脚本任务除外 */
function executorMissing(job: JobRuntime): boolean {
  return Boolean(job.jobKey) && !isScriptJob(job)
    && !registeredNames.value.has(job.jobKey) && !remoteIdleFor(job);
}

/** 本节点运行态：概览接口一次给全（执行器清单 + 本机不领取的远程任务数），写入后随列表一起回读 */
const summary = ref<JobSummary | null>(null);

async function loadExecutors(): Promise<void> {
  try {
    const [listed, stat] = await Promise.all([listExecutors(), getSummary()]);
    executors.value = listed ?? [];
    summary.value = stat ?? null;
  } catch (error) {
    msgError(errText(error));
  }
}

/** 远程行的归属：本机不是调度中心时，启用的远程任务在这里既不领取也不下发，只会静默不出日志 */
const remoteIdleHere = computed(() => summary.value?.unclaimedRemoteJobs ?? 0);
const remoteOwnedByMe = computed(() => summary.value?.remoteDispatchOwnedByMe === true);
const remoteTagTip = computed(() => (remoteOwnedByMe.value
  ? "远程分发：本节点作为调度中心把它下发给连接的执行器节点"
  : "远程分发：本机不领取也不下发，这一行只在调度中心节点上跑；要让本机执行请把分发改成本地"));

/** 单行是否在本机根本不会跑：启用的远程行 + 本节点不是下发方 */
function remoteIdleFor(job: JobRuntime): boolean {
  return job.dispatchMode === "REMOTE" && job.enabled === true && !remoteOwnedByMe.value;
}

async function loadJobs({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const result = await pageJobs({
    pageNum: page,
    pageSize,
    keyword: params.keyword as string | undefined,
    // 按钮式筛选的「全部」是空串占位，过筛等价于不带该条件
    status: (params.status === "" ? undefined : params.status) as number | undefined,
    dispatchMode: (params.dispatchMode === "" ? undefined : params.dispatchMode) as string | undefined,
  });
  const rows = Array.isArray(result?.data) ? result.data : [];
  return { total: Number(result?.total ?? 0), data: rows as unknown as Record<string, unknown>[] };
}

/** 列表重取：调度是后台线程在动，改完配置要立刻回读才能看到下一拍的口径 */
function reloadJobs(): void {
  tableRef.value?.reload();
}

/** ReTable 常驻勾选列回传的跨页选中行 */
function onSelectionChange(rows: Record<string, unknown>[]): void {
  selectedRows.value = rows as unknown as JobRuntime[];
}

/** 清空勾选：批量动作收尾与用户手动清空共用 */
function clearSelection(): void {
  tableRef.value?.clearAllSelection();
}

/** 带着筛选条件的空列表和「台账真的没任务」不是一回事，空态文案要分开说 */
const filteredEmpty = computed<boolean>(() => {
  const m = searchModel.value;
  const picked = (v: unknown) => v !== undefined && v !== null && v !== "";
  return picked(m.keyword) || picked(m.status) || picked(m.dispatchMode);
});

/** 一次只让一行在飞，避免连点把台账状态打乱 */
async function withRow(job: JobRuntime, action: () => Promise<unknown>): Promise<void> {
  if (busyKey.value) {
    return;
  }
  busyKey.value = job.jobKey;
  try {
    await action();
    reloadJobs();
  } catch (error) {
    msgError(errText(error));
  } finally {
    busyKey.value = "";
  }
}

async function toggle(job: JobRuntime, enabled: boolean): Promise<void> {
  await withRow(job, async () => {
    if (isFlowRow(job)) {
      const flowId = flowIdOf(job);
      if (!flowId) {
        throw new Error("台账行缺少流程 ID，请去流程设计页重新保存该流程");
      }
      await setFlowStatus(flowId, enabled ? 1 : 0);
    } else {
      await setJobStatus(job.jobKey, enabled);
    }
    msgSuccess(enabled ? "已启用调度" : "已停止调度");
  });
}

async function runNow(job: JobRuntime): Promise<void> {
  await withRow(job, async () => {
    // 两类任务都只走调度派发：直接调采集接口会让这一跑在台账和作业日志里查无此事
    await triggerJob(job.jobKey);
    msgInfo(isFlowRow(job) ? "已请求立即运行，等待调度派发" : "已请求立即触发，等待调度器下一轮派发");
  });
}

async function remove(job: JobRuntime): Promise<void> {
  if (isFlowRow(job)) {
    const flowId = flowIdOf(job);
    if (!flowId) {
      msgError("台账行缺少流程 ID，请到流程设计页删除该流程");
      return;
    }
    if (
      !(await confirmAction(
        `确认删除流程「${job.jobName ?? job.jobKey}」？流程定义、采集结果与它的调度台账行一并删除。`,
        "删除采集流程",
      ))
    ) {
      return;
    }
    await withRow(job, async () => {
      await deleteFlow(flowId);
      msgSuccess("流程及其调度台账已删除");
      await loadExecutors();
    });
    return;
  }
  if (!(await confirmAction(`确认删除任务 ${job.jobName ?? job.jobKey}？删除后不再自动调度。`, "删除任务"))) {
    return;
  }
  await withRow(job, async () => {
    await deleteJob(job.jobKey);
    msgSuccess("任务已删除");
  });
  await loadExecutors();
}

/**
 * 批量启停：流程行回落采集流程接口（台账镜像由后端同步），其余行走调度治理接口。
 * 逐行执行并逐行报错，单行失败不影响整批；缺流程 ID 的镜像行跳过并计数。
 *
 * @param enabled true 启用，false 停用
 */
async function batchToggle(enabled: boolean): Promise<void> {
  const rows = selectedRows.value;
  if (!rows.length || busyKey.value) {
    return;
  }
  busyKey.value = "__batch__";
  let done = 0;
  let skipped = 0;
  try {
    for (const job of rows) {
      try {
        if (isFlowRow(job)) {
          const flowId = flowIdOf(job);
          if (!flowId) {
            skipped++;
            continue;
          }
          await setFlowStatus(flowId, enabled ? 1 : 0);
        } else {
          await setJobStatus(job.jobKey, enabled);
        }
        done++;
      } catch (error) {
        msgError(`${job.jobName || job.jobKey}：${errText(error)}`);
      }
    }
    msgSuccess(`已${enabled ? "启用" : "停用"} ${done} 个任务`
      + (skipped ? `，${skipped} 个缺少流程 ID 的镜像行已跳过` : ""));
    clearSelection();
    await loadExecutors();
    reloadJobs();
  } finally {
    busyKey.value = "";
  }
}

/**
 * 批量删除：流程行删除流程定义与调度镜像，外部行删除台账行。确认文案按两类构成分别说明，
 * 逐行执行并逐行报错。
 */
async function batchRemove(): Promise<void> {
  const rows = selectedRows.value;
  if (!rows.length || busyKey.value) {
    return;
  }
  const flowCount = rows.filter(isFlowRow).length;
  const otherCount = rows.length - flowCount;
  const parts: string[] = [];
  if (flowCount) {
    parts.push(`${flowCount} 个采集流程（定义、结果与调度台账一并删除）`);
  }
  if (otherCount) {
    parts.push(`${otherCount} 个外部任务`);
  }
  if (!(await confirmAction(`确认删除勾选的 ${rows.length} 个任务？含 ${parts.join("、")}。`, "批量删除"))) {
    return;
  }
  busyKey.value = "__batch__";
  let done = 0;
  try {
    for (const job of rows) {
      try {
        if (isFlowRow(job)) {
          const flowId = flowIdOf(job);
          if (!flowId) {
            msgError(`${job.jobName || job.jobKey}：缺少流程 ID，已跳过`);
            continue;
          }
          await deleteFlow(flowId);
        } else {
          await deleteJob(job.jobKey);
        }
        done++;
      } catch (error) {
        msgError(`${job.jobName || job.jobKey}：${errText(error)}`);
      }
    }
    msgSuccess(`已删除 ${done} 个任务`);
    clearSelection();
    await loadExecutors();
    reloadJobs();
  } finally {
    busyKey.value = "";
  }
}

/** 详情：先用列表行即时回显，再取一次 /detail 拿完整字段（含脚本正文与重试/超时策略） */
const detailVisible = ref(false);
const detailLoading = ref(false);
const detail = ref<JobRuntime | null>(null);

async function openDetail(job: JobRuntime): Promise<void> {
  detail.value = job;
  detailVisible.value = true;
  detailLoading.value = true;
  try {
    detail.value = (await getJob(job.jobKey)) ?? job;
  } catch (error) {
    msgError(errText(error));
  } finally {
    detailLoading.value = false;
  }
}

/** 详情里的「立即触发」：关掉弹层后走列表同一条派发链，保证台账与作业日志一致 */
function triggerFromDetail(): void {
  const job = detail.value;
  if (!job) {
    return;
  }
  detailVisible.value = false;
  void runNow(job);
}

/** 详情里的「编辑」：关掉弹层后复用列表的编辑分流（流程行 → 流程调度，外部行 → 任务表单） */
function editFromDetail(): void {
  const job = detail.value;
  if (!job) {
    return;
  }
  detailVisible.value = false;
  openEdit(job);
}

/** 详情里的「查看日志」：跳到作业日志页并按该任务预筛，补齐「任务 → 它的执行历史」这条动线 */
function logsFromDetail(): void {
  const job = detail.value;
  if (!job) {
    return;
  }
  detailVisible.value = false;
  void router.push({ path: "/collect/job-log", query: { jobKey: job.jobKey } });
}

/** 复制：流程行走采集的流程复制（副本默认停用），外部任务预填新建表单（含脚本正文与策略） */
async function copy(job: JobRuntime): Promise<void> {
  if (isFlowRow(job)) {
    const flowId = flowIdOf(job);
    if (!flowId) {
      msgError("台账行缺少流程 ID，请到流程设计页复制该流程");
      return;
    }
    await withRow(job, async () => {
      await copyFlow(flowId);
      await loadExecutors();
      msgSuccess("流程已复制为副本（默认停用），到流程设计页可继续编辑");
    });
    return;
  }
  openEdit(job);
  formMode.value = "create";
  form.jobKey = `${job.jobKey}-copy`;
  form.jobName = `${job.jobName || job.jobKey}-副本`;
  form.enabled = false;
  cronBroken.value = false;
  clearFormValidate();
}

const formVisible = ref(false);
const formMode = ref<"create" | "edit" | "flow">("create");
const cronBroken = ref(false);
const form = reactive<JobSave & {
  flowId: number;
  flowName: string;
  flowCron: string;
  flowRemark: string;
  flowDsl: CollectFlow["dsl"] | null;
  flowCategoryId: number;
  flowCode: string;
  flowConcurrency: number;
  flowThreadCount: number;
}>({
  jobKey: "",
  originJobKey: "",
  jobName: "",
  group: "",
  dispatchMode: "LOCAL",
  remoteExecutorAddress: "",
  scheduleType: "CRON",
  scheduleTime: "",
  executeParam: "",
  author: "",
  failRetry: 0,
  retryInterval: 0,
  executeTimeout: 0,
  misfireStrategy: "DO_NOTHING",
  glueType: GLUE_BEAN,
  glueSource: "",
  retryCallbackBean: "",
  exceptionCallbackBean: "",
  alarmEmail: "",
  alarmType: "",
  enabled: false,
  desc: "",
  flowId: 0,
  flowName: "",
  flowCron: "",
  flowRemark: "",
  flowDsl: null,
  flowCategoryId: 0,
  flowCode: "",
  flowConcurrency: 0,
  flowThreadCount: 0,
});

const isScriptForm = computed(() => Boolean(form.glueType) && form.glueType !== GLUE_BEAN);

/** 当前片段语言：给 ScriptSourceField 决定标题/占位/模板，BEAN 落到 groovy 只是兜底取值 */
const glueLang = computed<"groovy" | "java">(() =>
  form.glueType === GLUE_JAVA ? "java" : "groovy",
);

/** 片段正文区的标题与占位：两种语言的写法要求不同，提示必须分开说 */
const glueSourceTitle = computed(() => (form.glueType === GLUE_JAVA ? "Java 代码片段" : "脚本正文"));
const glueSourcePlaceholder = computed(() =>
  form.glueType === GLUE_JAVA
    ? "点击编辑：完整类源码，package 可选、class 必写；入口方法支持 @Job 注解"
    : "点击编辑脚本正文：可用变量 jobName / objectContext / executeParam，最后一条表达式即返回值",
);

/**
 * 片段正文长度上限：与台账列 sys_job_glue_source 同宽。
 *
 * DDL（V1.0__init_all_job.sql）把「大文本统一 VARCHAR(4000)」列为跨库兼容约束
 * （Oracle VARCHAR2 上限），是刻意设计，不能为了塞长脚本去放宽——三库会失配。
 * 所以上限取 4000，前后端一致，超限在提交前就被拦下，不会等到存库才报 500。
 */
const GLUE_SOURCE_LIMIT = 4000;
const glueSourceDesc = computed(() => {
  const length = String(form.glueSource ?? "").length;
  if (length <= GLUE_SOURCE_LIMIT) {
    return `正文变更自动递增版本并刷新执行器缓存；当前 ${length} / ${GLUE_SOURCE_LIMIT} 字符`;
  }
  return `当前 ${length} 字符，已超上限 ${GLUE_SOURCE_LIMIT}，保存会被拒绝——请精简正文`;
});

/**
 * 切换执行类型。
 *
 * 类型一变，原正文就一定不合法（Groovy 正文当 Java 源码编译必然失败，反之亦然），
 * 所以顺手清空；不清的话用户会对着上一段正文反复踩编译错。
 *
 * @param glueType 目标执行类型
 */
function setGlueType(glueType: string): void {
  if (form.glueType !== glueType) {
    form.glueSource = "";
  }
  form.glueType = glueType;
  clearFormErrors();
}

/** ReForm 实例：必填校验交给 el-form 规则，弹层重开时要清掉上一次的报错态 */
const formRef = ref<{ validate: () => Promise<boolean>; clearValidate: () => void } | null>(null);

/** ReForm 的 model 直接复用这张 reactive 表单：schema 字段按属性名读写同一个代理，不另存一份草稿 */
const formModel = form as unknown as Record<string, unknown>;

/** 弹层里的表单是复用实例，重开时把上一次的红色报错一起清掉 */
function clearFormValidate(): void {
  void nextTick(() => formRef.value?.clearValidate());
}

/** 弹层里所有控件统一走 Re 体系的 default 档（34px 基线，与 ReInput/ReSelect/ReInputNumber 的对齐口径一致） */
const FIELD_SIZE = { size: "default" } as const;

/** ReCron 变更：仅在明确判定非法（第二参为 false）且表达式非空时标记，提交前拦截。
 *
 * @param expression cron 表达式
 * @param valid      ReCron 给出的合法性；未提供时不做判断
 */
function onCronChange(expression: string, valid?: boolean): void {
  const text = String(expression ?? "").trim();
  cronBroken.value = text.length > 0 && valid === false;
}

/** 执行类型/脚本正文变更后清掉上一次的红色校验态：避免"已经填了还标红" */
function clearFormErrors(): void {
  void nextTick(() => formRef.value?.clearValidate());
}

/**
 * 采集流程调度的编辑 schema（ReForm 栅格档，span 之和 24 一行，标签在控件上方）。
 *
 * 只服务「编辑流程调度」这一种弹层状态：流程行的写入口是采集流程表（名称 / cron / 备注），
 * 画布结构原样回写，所以这里只有三个字段。非流程任务（新建 / 编辑外部任务）走模板里的
 * task-form 卡片式布局，字段集只在那儿维护一份——两份表单不同步过一次，新增项差点全丢。
 *
 * 控件都显式带 size：ReInput/ReCron 自己声明了 size 属性（默认 default），会盖掉 el-form
 * 往下传的档，只在 ReForm 上设 size 会出现同一张表里两种高度。
 */
const FLOW_FIELDS = computed<ReFormField[]>(() => [
  {
    prop: "flowName",
    label: "流程名称",
    span: 24,
    required: true,
    component: ReInput,
    attrs: { ...FIELD_SIZE, maxlength: 64, placeholder: "流程名称" },
  },
  {
    prop: "flowCron",
    label: "cron 表达式",
    span: 24,
    component: ReCron,
    attrs: {
      previewCount: 3,
      placeholder: "留空表示只登记台账、不自动调度",
      onChange: onCronChange,
    },
  },
  {
    prop: "flowRemark",
    label: "备注",
    span: 24,
    component: ReInput,
    attrs: { ...FIELD_SIZE, type: "textarea", rows: 2, maxlength: 200, placeholder: "流程用途" },
    help: "改这里等于改流程定义本身，画布结构原样保留；启停仍由列表的开关控制，调度周期以此处为准。",
  },
]);

/** 采集流程行的调度编辑：只改流程表的名称/cron/备注，台账镜像由后端重新登记 */
async function openFlowSchedule(job: JobRuntime): Promise<void> {
  const flowId = flowIdOf(job);
  if (!flowId) {
    msgError("台账行缺少流程 ID，请到流程设计页维护该流程");
    return;
  }
  try {
    const flow = await getFlow(flowId);
    if (!flow?.dsl?.nodes) {
      msgError("未取到流程结构，请到流程设计页维护该流程");
      return;
    }
    formMode.value = "flow";
    form.flowId = flow.collectFlowId;
    form.flowName = flow.collectFlowName ?? "";
    form.flowCron = flow.collectFlowCron ?? "";
    form.flowRemark = flow.collectFlowRemark ?? "";
    form.flowDsl = flow.dsl;
    form.flowCategoryId = flow.collectFlowCategoryId;
    form.flowCode = flow.collectFlowCode;
    form.flowConcurrency = flow.collectFlowConcurrency;
    form.flowThreadCount = flow.collectFlowThreadCount;
    cronBroken.value = false;
    formVisible.value = true;
    clearFormValidate();
  } catch (error) {
    msgError(errText(error));
  }
}

function openCreate(): void {
  formMode.value = "create";
  Object.assign(form, {
    jobKey: "",
    originJobKey: "",
    jobName: "",
    // 默认落到本调度中心分组：Leader 只派发同组任务，留空落 default 会"登记成功但永不派发"
    group: summary.value?.group ?? "",
    dispatchMode: "LOCAL",
    remoteExecutorAddress: "",
    scheduleType: "CRON",
    scheduleTime: "",
    executeParam: "",
    author: "",
    failRetry: 0,
    retryInterval: 0,
    executeTimeout: 0,
    misfireStrategy: "DO_NOTHING",
    glueType: GLUE_BEAN,
    glueSource: "",
    retryCallbackBean: "",
    exceptionCallbackBean: "",
    alarmEmail: "",
    alarmType: "",
    enabled: false,
    desc: "",
    flowId: 0,
    flowName: "",
    flowCron: "",
    flowRemark: "",
    flowDsl: null,
    flowCategoryId: 0,
    flowCode: "",
    flowConcurrency: 0,
    flowThreadCount: 0,
  });
  cronBroken.value = false;
  formVisible.value = true;
  clearFormValidate();
}

function openEdit(job: JobRuntime): void {
  if (isFlowRow(job)) {
    void openFlowSchedule(job);
    return;
  }
  formMode.value = "edit";
  Object.assign(form, {
    jobKey: job.jobKey,
    originJobKey: job.jobKey,
    jobName: job.jobName ?? "",
    group: job.group ?? "",
    dispatchMode: job.dispatchMode === "REMOTE" ? "REMOTE" : "LOCAL",
    remoteExecutorAddress: job.remoteExecutorAddress ?? "",
    scheduleType: job.scheduleType || "NONE",
    scheduleTime: job.scheduleTime ?? "",
    executeParam: job.executeParam ?? "",
    author: job.author ?? "",
    failRetry: job.failRetry ?? 0,
    retryInterval: job.retryInterval ?? 0,
    executeTimeout: job.executeTimeout ?? 0,
    misfireStrategy: job.misfireStrategy || "DO_NOTHING",
    glueType: job.glueType || GLUE_BEAN,
    glueSource: job.glueSource ?? "",
    retryCallbackBean: job.retryCallbackBean ?? "",
    exceptionCallbackBean: job.exceptionCallbackBean ?? "",
    alarmEmail: job.alarmEmail ?? "",
    alarmType: job.alarmType ?? "",
    enabled: job.enabled,
    desc: job.desc ?? "",
  });
  cronBroken.value = false;
  formVisible.value = true;
  clearFormValidate();
}

async function submit(): Promise<void> {
  /** 流程调度编辑：走采集流程接口，画布 dsl 原样回写 */
  if (formMode.value === "flow") {
    const dsl = form.flowDsl;
    if (!dsl) {
      msgError("未取到流程结构，请到流程设计页维护该流程");
      return;
    }
    const name = form.flowName.trim();
    if (!name) {
      msgError("流程名称不能为空");
      return;
    }
    if (cronBroken.value) {
      msgError("cron 表达式不合法");
      return;
    }
    try {
      await updateFlow({
        collectFlowId: form.flowId,
        collectFlowName: name,
        collectFlowCategoryId: form.flowCategoryId,
        collectFlowCode: form.flowCode,
        collectFlowCron: form.flowCron.trim(),
        collectFlowConcurrency: form.flowConcurrency,
        collectFlowThreadCount: form.flowThreadCount,
        collectFlowRemark: form.flowRemark.trim(),
        dsl,
      });
      msgSuccess("流程调度已更新");
      formVisible.value = false;
      reloadJobs();
      await loadExecutors();
    } catch (error) {
      msgError(errText(error));
    }
    return;
  }

  const isScriptTask = isScriptForm.value;
  let jobKey = String(form.jobKey ?? "").trim();
  if (isScriptTask && formMode.value !== "edit") {
    jobKey = "";
  }
  // 必填不再自己弹 toast：el-form 规则会在字段下面标红，只在整表通过后才继续
  if ((await formRef.value?.validate()) === false) {
    return;
  }
  // 任务名称两种模式都必填（列表与作业日志按它展示）
  const jobName = String(form.jobName ?? "").trim();
  if (!jobName) {
    msgError("任务名称不能为空");
    return;
  }
  if (isScriptTask) {
    // 脚本任务不需要用户填任务键：编辑保持原标识；新建留空，由后端用 IdUtils 生成全局唯一标识
    jobKey = formMode.value === "edit" && String(form.originJobKey ?? "").trim()
      ? String(form.originJobKey).trim()
      : "";
  } else if (!jobKey) {
    msgError("请选择任务");
    return;
  }
  if (form.scheduleType === "CRON" && cronBroken.value) {
    msgError("cron 表达式不合法");
    return;
  }
  if (form.scheduleType !== "NONE" && !String(form.scheduleTime ?? "").trim()) {
    msgError("填写了调度类型就必须给调度配置");
    return;
  }
  if (isScriptTask && !String(form.glueSource ?? "").trim()) {
    msgError("代码片段任务必须填写片段正文");
    return;
  }
  if (isScriptTask && String(form.glueSource ?? "").length > GLUE_SOURCE_LIMIT) {
    msgError(`片段正文过长（上限 ${GLUE_SOURCE_LIMIT} 字符，与台账列 sys_job_glue_source 同宽）`);
    return;
  }
  if (String(form.alarmType ?? "").trim() && !String(form.alarmEmail ?? "").trim()) {
    msgError("选择了告警类型就必须填写告警目标，否则任务失败时不会告警");
    return;
  }
  const originJobKey = formMode.value === "edit" ? String(form.originJobKey ?? "").trim() : "";
  const payload: JobSave = {
    ...form,
    jobKey,
    originJobKey: originJobKey && originJobKey !== jobKey ? originJobKey : undefined,
    jobName,
    // 采集栈统一「标准派发」：由本节点调度循环领取（调度中心角色经长链下发给在线执行器）；
    // 是否在远程节点执行由执行器拓扑决定，不由台账字段决定，故固定 LOCAL
    dispatchMode: "LOCAL",
    remoteExecutorAddress: "",
  };
  if (!isScriptTask) {
    payload.glueType = GLUE_BEAN;
    payload.glueSource = "";
  }
  try {
    await saveJob(payload);
    msgSuccess(formMode.value === "create" ? `已登记任务 ${jobKey}` : "任务已更新");
    formVisible.value = false;
    reloadJobs();
    await loadExecutors();
  } catch (error) {
    msgError(errText(error));
  }
}

/** keep-alive 命中后挂载只跑一次，重进页面靠激活钩子取新数据（执行器清单可能被新流程改写） */
let firstActivation = true;
onActivated(() => {
  void loadExecutors();
  if (firstActivation) {
    firstActivation = false;
    return;
  }
  reloadJobs();
});

/** 从「远程作业」节点卡片跳入：?create=1[&task=处理器] 预填并打开新建弹层（处理后立即清参，防重复弹） */
function applyCreateQuery(): void {
  const create = String(route.query.create ?? "");
  if (create !== "1") {
    return;
  }
  const task = String(route.query.task ?? "").trim();
  openCreate();
  if (task) {
    form.jobKey = task;
    form.jobName = task;
    form.scheduleType = "NONE";
  }
  void router.replace({ path: route.path });
}

// 同路由仅 query 变化（远程作业卡片跳转）不会触发 mounted/activated，必须监听 query
watch(() => route.query, () => applyCreateQuery(), { immediate: true });
</script>

<template>
  <div class="collect-page job-page">
      <ReTable
        ref="tableRef"
        class="job-table"
        table-id="collect-job"
        :loader="loadJobs"
        :params="query"
        :columns="columns"
        row-key="jobKey"
        show-selection
        @selection-change="onSelectionChange"
        v-model:page="query.page"
        v-model:page-size="query.pageSize"
        v-model:search-model="searchModel"
        :search="SEARCH"
        auto-refresh
        :page-sizes="[10, 20, 50, 100]"
        :empty-text="filteredEmpty ? '没有符合当前条件的任务，换个条件或点「重置」' : '台账里还没有任务，用工具栏的「新建任务」登记一个，或在流程设计页保存带 cron 的流程'"
        @search="query.page !== 1 && tableRef?.goto(1)"
        @search-reset="tableRef?.goto(1)"
      >
        <template #toolbar>
          <ReButton text type="primary" icon="Plus" @click="openCreate">新建任务</ReButton>
          <template v-if="selectedCount">
            <span class="job-toolbar-selected">已选 {{ selectedCount }} 项</span>
            <el-button text :disabled="Boolean(busyKey)" @click="batchToggle(true)">批量启用</el-button>
            <el-button text :disabled="Boolean(busyKey)" @click="batchToggle(false)">批量停用</el-button>
            <el-button text type="danger" :disabled="Boolean(busyKey)" @click="batchRemove">批量删除</el-button>
            <el-button text @click="clearSelection">清空选择</el-button>
          </template>
          <span v-if="remoteIdleHere > 0" class="job-toolbar-hint">
            {{ remoteIdleHere }} 个远程任务由调度中心下发，本机不领取
          </span>
        </template>

        <template #name="{ row }">
        <span>{{ row.jobName || row.jobKey }}</span>
        <ReTag v-if="row.group === COLLECT_FLOW_GROUP" class="collect-tag-inline" size="small" type="primary" effect="plain">
          采集流程
        </ReTag>
        <ReTag v-else-if="isScriptJob(row as unknown as JobRuntime)" class="collect-tag-inline" size="small" type="success" effect="plain">
          脚本
        </ReTag>
        <ReTag v-else-if="row.group" size="small" type="info" effect="plain">{{ row.group }}</ReTag>
      </template>
      <template #schedule="{ row }">
        <span class="collect-cell-mono collect-cell-ellipsis">{{ scheduleText(row as unknown as JobRuntime) }}</span>
      </template>
      <template #executor="{ row }">
        <span class="collect-cell-mono">{{ row.jobKey }}</span>
        <ReTag
          v-if="executorMissing(row as unknown as JobRuntime)"
          class="collect-tag-inline"
          size="small"
          type="danger"
          effect="plain"
        >
          未注册
        </ReTag>
        <ReTag
          v-if="row.dispatchMode === 'REMOTE'"
          class="collect-tag-inline"
          size="small"
          type="warning"
          effect="plain"
          :title="remoteTagTip"
        >
          远程
        </ReTag>
      </template>
      <template #status="{ row }">
        <ReSwitch
          :model-value="row.enabled === true"
          :disabled="busyKey === row.jobKey"
          :loading="busyKey === row.jobKey"
          size="small"
          aria-label="启用自动调度"
          @change="toggle(row as unknown as JobRuntime, $event === true)"
        />
      </template>
      <template #next="{ row }">
        <span
          v-if="remoteIdleFor(row as unknown as JobRuntime)"
          class="collect-hint collect-hint--muted"
          :title="`本节点不领取远程任务；这行的下次触发 ${fmtMs(row.nextFireTime)} 只在调度中心节点上生效`"
        >
          非本机执行
        </span>
        <span v-else class="collect-num">{{ row.enabled ? fmtMs(row.nextFireTime) : "—" }}</span>
      </template>
      <template #last="{ row }">
        <span class="collect-num">
          <ReTime :value="row.lastFireTime" format="YYYY-MM-DD HH:mm:ss" placeholder="—" />
        </span>
      </template>
      <template #author="{ row }">{{ row.author || "—" }}</template>
      <template #action="{ row }">
        <ReButton
          layout="square"
          icon="View"
          title="查看任务详情"
          @click="openDetail(row as unknown as JobRuntime)"
        />
        <ReButton
          layout="square"
          icon="VideoPlay"
          type="primary"
          :disabled="Boolean(busyKey) || row.enabled !== true"
          :title="
            row.enabled === true
              ? row.group === COLLECT_FLOW_GROUP ? '立即运行' : '立即触发'
              : '任务已停用，触发不会被派发，请先启用调度'
          "
          @click="runNow(row as unknown as JobRuntime)"
        />
        <ReButton
          layout="square"
          icon="CopyDocument"
          :disabled="Boolean(busyKey)"
          :title="row.group === COLLECT_FLOW_GROUP ? '复制流程' : '复制为新建'"
          @click="copy(row as unknown as JobRuntime)"
        />
        <ReButton
          layout="square"
          icon="Edit"
          :disabled="Boolean(busyKey)"
          :title="row.group === COLLECT_FLOW_GROUP ? '编辑流程调度' : '编辑任务'"
          @click="openEdit(row as unknown as JobRuntime)"
        />
        <ReButton
          layout="square"
          icon="Delete"
          type="danger"
          :disabled="Boolean(busyKey)"
          :title="row.group === COLLECT_FLOW_GROUP ? '删除流程' : '删除任务'"
          @click="remove(row as unknown as JobRuntime)"
        />
      </template>
    </ReTable>

    <ReDialog
      v-model="formVisible"
      :title="formMode === 'create' ? '新建调度任务' : formMode === 'flow' ? '编辑流程调度' : `编辑任务 · ${form.jobKey}`"
      width="820px"
      top="6vh"
      @ok="submit"
    >
      <ReForm
        v-if="formMode === 'flow'"
        ref="formRef"
        :model-value="formModel"
        :fields="FLOW_FIELDS"
        label-position="top"
        size="default"
      />
      <div v-else class="task-form">
        <div class="task-form__type">
          <button
            type="button"
            class="task-form__type-card"
            :class="{ 'is-active': !isScriptForm }"
            @click="setGlueType(GLUE_BEAN)"
          >
            <strong>对象</strong>
            <span>使用已注册的执行器对象（Bean）执行，从任务列表中选择</span>
          </button>
          <button
            type="button"
            class="task-form__type-card"
            :class="{ 'is-active': form.glueType === GLUE_GROOVY }"
            @click="setGlueType(GLUE_GROOVY)"
          >
            <strong>脚本</strong>
            <span>Groovy 脚本正文随任务下发到执行器执行，objectContext.getBean 取 Spring Bean</span>
          </button>
          <button
            type="button"
            class="task-form__type-card"
            :class="{ 'is-active': form.glueType === GLUE_JAVA }"
            @click="setGlueType(GLUE_JAVA)"
          >
            <strong>Java 片段</strong>
            <span>完整类源码随任务下发，执行器现场编译后执行，字段上的 @Autowired 生效</span>
          </button>
        </div>

        <section class="task-form__section">
          <h3>基本信息</h3>
          <div class="task-form__grid">
            <label v-if="!isScriptForm" class="task-form__field">
              <span>选择任务</span>
              <ReSelect
                v-model="form.jobKey"
                :data="executorCardOptions"
                layout="card"
                filterable
                :clearable="false"
                placeholder="从已注册任务里选择"
              />
              <em class="task-form__help">〔@Job〕/〔注入〕为本节点处理器，〔执行器〕为在线执行器上报的远端处理器</em>
            </label>
            <label v-else-if="formMode === 'edit'" class="task-form__field">
              <span>任务标识</span>
              <ReInput v-model="form.jobKey" disabled />
              <em class="task-form__help">代码片段任务标识由系统生成，创建后保持不变</em>
            </label>
            <label class="task-form__field">
              <span>任务名称</span>
              <ReInput v-model="form.jobName" maxlength="64" placeholder="请输入任务名称" />
              <em v-if="isScriptForm" class="task-form__help">列表与作业日志的展示名；任务标识由系统自动生成</em>
            </label>
            <label class="task-form__field">
              <span>分组</span>
              <ReInput v-model="form.group" maxlength="32" :placeholder="`留空按本调度中心分组（${summary?.group || 'default'}）登记`" />
              <em class="task-form__help">
                只有与调度中心同分组的任务才会被自动派发；留空会自动落到本中心分组，
                填成其它分组则只登记台账、不会自动运行（手动触发仍可用）。
              </em>
            </label>
            <label class="task-form__field">
              <span>负责人</span>
              <ReInput v-model="form.author" maxlength="32" placeholder="便于按人过滤" />
            </label>
            <label class="task-form__field">
              <span>错过策略</span>
              <ReSelect v-model="form.misfireStrategy" :data="MISFIRE_OPTIONS" />
              <em class="task-form__help">错过触发时刻时：补跑一次，或直接跳过</em>
            </label>
          </div>
        </section>

        <section v-if="isScriptForm" class="task-form__section">
          <h3>{{ glueSourceTitle }}</h3>
          <ScriptSourceField
            v-model="form.glueSource"
            :lang="glueLang"
            :placeholder="glueSourcePlaceholder"
            :description="glueSourceDesc"
          />
        </section>

        <section class="task-form__section">
          <h3>调度配置</h3>
          <div class="task-form__grid task-form__grid--schedule">
            <label class="task-form__field">
              <span>调度类型</span>
              <ReSelect v-model="form.scheduleType" :data="SCHEDULE_OPTIONS" />
            </label>
            <div class="task-form__switch-field">
              <span>登记后启用</span>
              <el-switch v-model="form.enabled" />
              <em class="task-form__help">关闭表示只登记台账，不进入自动调度</em>
            </div>
            <label v-if="form.scheduleType === 'CRON'" class="task-form__field task-form__field--wide">
              <span>cron 表达式</span>
              <ReCron
                v-model="form.scheduleTime"
                :preview-count="3"
                placeholder="6 段表达式，例如 0 0/30 * * * ?"
                @change="onCronChange"
              />
            </label>
            <label v-else-if="form.scheduleType !== 'NONE'" class="task-form__field task-form__field--wide">
              <span>调度配置</span>
              <ReInput v-model="form.scheduleTime" placeholder="毫秒数，例如 60000" />
              <em class="task-form__help">固定频率 / 固定延迟填毫秒间隔</em>
            </label>
            <label class="task-form__field task-form__field--wide">
              <span>执行参数</span>
              <ReInput v-model="form.executeParam" type="textarea" :rows="2" placeholder="可选，执行器接收的原始参数，可直接粘贴 JSON" />
            </label>
          </div>
        </section>

        <section class="task-form__section">
          <h3>策略与告警</h3>
          <div class="task-form__grid">
            <label class="task-form__field">
              <span>失败重试</span>
              <ReInputNumber v-model="form.failRetry" :min="0" :max="5" controls-position="right" />
            </label>
            <label class="task-form__field">
              <span>重试间隔（秒）</span>
              <ReInputNumber
                v-model="form.retryInterval"
                :min="0"
                :max="3600"
                controls-position="right"
                :disabled="Number(form.failRetry ?? 0) <= 0"
              />
              <em class="task-form__help">0 为立即重试；需先设置失败重试次数</em>
            </label>
            <label class="task-form__field">
              <span>重试回调</span>
              <ReSelect
                v-model="form.retryCallbackBean"
                :data="executorOptions"
                filterable
                clearable
                placeholder="每次重试前调用的处理器，留空不回调"
              />
              <em class="task-form__help">处理器名，未注册只记警告，不影响重试</em>
            </label>
            <label class="task-form__field">
              <span>异常回调</span>
              <ReSelect
                v-model="form.exceptionCallbackBean"
                :data="executorOptions"
                filterable
                clearable
                placeholder="最终失败时调用的处理器，留空不回调"
              />
            </label>
            <label class="task-form__field">
              <span>执行超时（秒）</span>
              <ReInputNumber v-model="form.executeTimeout" :min="0" :max="3600" controls-position="right" />
              <em class="task-form__help">0 为不限</em>
            </label>
            <label class="task-form__field">
              <span>告警类型</span>
              <ReSelect v-model="form.alarmType" :data="ALARM_TYPE_OPTIONS" />
              <em class="task-form__help">宿主按类型路由到对应实现，未接入只写运行日志</em>
            </label>
            <label class="task-form__field task-form__field--wide">
              <span>告警目标</span>
              <ReInput
                v-model="form.alarmEmail"
                maxlength="255"
                :disabled="!form.alarmType"
                :placeholder="form.alarmType === 'WEBHOOK'
                  ? 'http(s):// 回调地址，接收 JSON POST'
                  : form.alarmType === 'EMAIL'
                    ? '失败时通知的邮箱，多个用逗号分隔'
                    : '请先选择告警类型'"
              />
            </label>
            <label class="task-form__field task-form__field--wide">
              <span>说明</span>
              <ReInput v-model="form.desc" type="textarea" :rows="2" maxlength="200" placeholder="任务用途" />
            </label>
          </div>
        </section>
      </div>
    </ReDialog>

    <ReDialog v-model="detailVisible" title="任务详情" width="980px" top="5vh" footer-hidden>
      <div v-loading="detailLoading" class="job-detail">
        <div v-if="detail" class="job-detail__alert" :class="isFlowRow(detail) ? 'is-warn' : ''">
          <el-icon><InfoFilled /></el-icon>
          <span v-if="isFlowRow(detail)">
            这是一条采集流程的调度镜像行：画布结构与 cron 以采集流程为准，改名/改期请走「编辑流程调度」或流程设计页。
          </span>
          <span v-else>
            这是调度中心自行登记的外部任务：配置以本行为准，执行器需与任务键同名才会被领取。
          </span>
          <el-icon class="job-detail__alert-arrow"><ArrowDown /></el-icon>
        </div>

        <div v-if="detail" class="job-detail__grid">
          <section class="job-detail__card">
            <h3>基本信息</h3>
            <dl class="job-detail__list">
              <div><dt>任务键</dt><dd class="job-detail__mono job-detail__link">{{ detail.jobKey }}</dd></div>
              <div><dt>任务名称</dt><dd>{{ detail.jobName || "—" }}</dd></div>
              <div><dt>业务编号</dt><dd class="job-detail__mono job-detail__link">{{ detail.jobNo || "—" }}</dd></div>
              <div><dt>分组</dt><dd>{{ detail.group || "—" }}</dd></div>
              <div><dt>调度</dt><dd class="job-detail__mono">{{ scheduleText(detail) }}</dd></div>
              <div>
                <dt>状态</dt>
                <dd>
                  <ReTag size="small" :type="detail.enabled ? 'success' : 'info'" effect="solid">
                    {{ detail.enabled ? "启用" : "停用" }}
                  </ReTag>
                </dd>
              </div>
              <div>
                <dt>分发</dt>
                <dd>{{ detail.dispatchMode === "REMOTE" ? "远程" : "本地" }}</dd>
              </div>
            </dl>
          </section>

          <section class="job-detail__card">
            <h3>执行配置</h3>
            <dl class="job-detail__list">
              <div class="job-detail__row-wide">
                <dt>处理器</dt>
                <dd class="job-detail__handler">
                  <span class="job-detail__mono job-detail__link">{{ detail.jobKey }}</span>
                  <span class="job-detail__plus">+</span>
                  <ReTag size="small" :type="isScriptJob(detail) ? 'primary' : detail.handlerRegistered ? 'success' : 'danger'" effect="solid">
                    {{ isScriptJob(detail) ? "代码片段任务" : detail.handlerRegistered ? "已注册" : "未注册" }}
                  </ReTag>
                  <span class="job-detail__mono">{{ detail.glueType || GLUE_BEAN }}</span>
                </dd>
              </div>
              <div v-if="isScriptJob(detail)" class="job-detail__row-wide">
                <dt>{{ detail.glueType === GLUE_JAVA ? "Java 代码片段" : "脚本正文" }}</dt>
                <dd><pre class="job-detail__code">{{ detail.glueSource || "—" }}</pre></dd>
              </div>
              <div class="job-detail__row-wide">
                <dt>执行参数</dt>
                <dd><pre class="job-detail__code job-detail__code--param">{{ detail.executeParam || "—" }}</pre></dd>
              </div>
            </dl>
          </section>

          <section class="job-detail__card">
            <h3>策略与告警</h3>
            <dl class="job-detail__list">
              <div><dt>失败重试</dt><dd>{{ detail.failRetry ?? 0 }} 次<span v-if="Number(detail.failRetry ?? 0) > 0"> · 间隔 {{ detail.retryInterval ? `${detail.retryInterval}s` : "立即" }}</span></dd></div>
              <div><dt>执行超时</dt><dd>{{ detail.executeTimeout ? `${detail.executeTimeout}s` : "不限" }}</dd></div>
              <div><dt>错过策略</dt><dd>{{ detail.misfireStrategy === "FIRE_ONCE_NOW" ? "补跑一次" : "不补跑" }}</dd></div>
              <div><dt>失败告警</dt><dd>{{ alarmTypeText(detail.alarmType, detail.alarmEmail) }}<span v-if="detail.alarmEmail" class="job-detail__mono"> · {{ detail.alarmEmail }}</span></dd></div>
              <div><dt>最近触发</dt><dd class="job-detail__num">{{ fmtMs(detail.lastFireTime) }}</dd></div>
              <div><dt>下次触发</dt><dd class="job-detail__num">{{ detail.enabled ? fmtMs(detail.nextFireTime) : "—" }}</dd></div>
            </dl>
          </section>
        </div>

        <div v-if="detail" class="job-detail__footer">
          <ReButton size="default" plain icon="Tickets" @click="logsFromDetail">查看日志</ReButton>
          <ReButton size="default" plain icon="Edit" @click="editFromDetail">
            {{ isFlowRow(detail) ? "编辑流程调度" : "编辑任务" }}
          </ReButton>
          <ReButton
            size="default"
            type="primary"
            icon="VideoPlay"
            :disabled="detail.enabled !== true"
            :title="detail.enabled === true ? '立即触发一次' : '任务已停用，请先启用调度'"
            @click="triggerFromDetail"
          >
            {{ isFlowRow(detail) ? "立即运行" : "立即触发" }}
          </ReButton>
        </div>
      </div>
    </ReDialog>
  </div>
</template>

<style scoped>
/* 根节点挂 collect-page 与其余 11 个视图对齐，拿共享的 flex 列布局与间距 */
.job-page {
  width: 100%;
}

/* collect-page 是 flex 列，表格要自己吃掉剩余高度并允许内部滚动 */
.job-table {
  width: 100%;
  flex: 1 1 auto;
  min-height: 0;
}

.job-toolbar-selected,
.job-toolbar-hint {
  margin-left: 12px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.job-toolbar-hint {
  color: var(--el-color-warning);
}

.task-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.task-form__type {
  display: grid;
  /*
    三张类型卡片（对象 / 脚本 / Java 片段）：按容器实际宽度自适应，不写死列数。
    写成 repeat(3, minmax(0,1fr)) 在窄弹层下会把三张卡各挤成 ~72px、文案折成竖线；
    auto-fit + minmax(200px,1fr) 的行为是：容器够宽就一行三列，~420px 两列，再窄一列，
    不会出现细条。判断依据是容器宽度而非视口宽度——弹层实际宽度受 dialog width 与
    视口双重约束，两者不一定同步，纯 media query 会判错。
  */
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

/* 类型卡片就是按钮本体：点一下即切换，不再在里面套开关 */
.task-form__type-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  text-align: left;
  border-radius: var(--el-radius-lg);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color-overlay);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.task-form__type-card:hover {
  border-color: color-mix(in srgb, var(--el-color-primary) 40%, var(--el-border-color-lighter));
}

.task-form__type-card.is-active {
  border-color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 8%, var(--el-bg-color-overlay));
}

.task-form__type-card strong {
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
}

.task-form__type-card.is-active strong {
  color: var(--el-color-primary);
}

.task-form__type-card > span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.task-form__section {
  padding-top: 2px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.task-form__section h3 {
  margin: 12px 0 10px;
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 600;
}

.task-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 18px;
}

.task-form__grid--schedule {
  grid-template-columns: minmax(0, 1fr) auto;
}

.task-form__field,
.task-form__switch-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.task-form__field > span,
.task-form__switch-field > span {
  color: var(--el-text-color-regular);
  font-size: 13px;
}

/* 字段下方的一行灰字说明，不撑高栅格 */
.task-form__help {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-style: normal;
  line-height: 1.5;
}

.task-form__field--wide {
  grid-column: 1 / -1;
}

.task-form :deep(.re-cron .el-input__wrapper) {
  outline: none;
  box-shadow: 0 0 0 1px var(--el-border-color) inset !important;
}

.task-form :deep(.re-cron .el-input__wrapper:focus-within) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
}

.task-form :deep(.re-cron .el-input__inner) {
  outline: none;
}

.task-form__switch-field {
  justify-content: center;
  padding-bottom: 2px;
}

.task-form__switch-field .el-switch {
  --el-switch-on-color: var(--el-color-primary);
}

@media (max-width: 640px) {
  .task-form__type,
  .task-form__grid,
  .task-form__grid--schedule {
    grid-template-columns: 1fr;
  }

  .task-form__field--wide {
    grid-column: auto;
  }

  .task-form__switch-field {
    align-items: flex-start;
  }
}

.job-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.job-detail__alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 18%, var(--el-border-color-lighter));
  border-radius: var(--el-radius-md);
  background: color-mix(in srgb, var(--el-color-primary) 10%, var(--el-bg-color-overlay));
  color: var(--el-text-color-primary);
  font-size: 14px;
  line-height: 1.6;
}

.job-detail__alert > .el-icon:first-child {
  flex: 0 0 auto;
  color: var(--el-color-primary);
  font-size: 20px;
}

.job-detail__alert.is-warn {
  border-color: color-mix(in srgb, var(--el-color-warning) 28%, var(--el-border-color-lighter));
  background: color-mix(in srgb, var(--el-color-warning) 10%, var(--el-bg-color-overlay));
}

.job-detail__alert-arrow {
  margin-left: auto;
  color: var(--el-text-color-primary);
}

.job-detail__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
  gap: 16px;
  align-items: start;
}

.job-detail__card {
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-left: 3px solid var(--el-color-primary);
  border-radius: var(--el-radius-lg);
  background: var(--el-bg-color-overlay);
}

.job-detail__card h3 {
  margin: 0;
  padding: 14px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 600;
}

.job-detail__list {
  margin: 0;
  padding: 0 16px 8px;
}

.job-detail__list > div {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  min-height: 44px;
  padding: 8px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.job-detail__list > div:last-child {
  border-bottom: 0;
}

.job-detail__list dt {
  color: var(--el-text-color-regular);
  font-size: 13px;
  white-space: nowrap;
}

.job-detail__list dd {
  min-width: 0;
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 14px;
  overflow-wrap: anywhere;
}

.job-detail__mono,
.job-detail__num {
  font-family: var(--cc-font-num);
  font-variant-numeric: tabular-nums;
}

.job-detail__link {
  color: var(--el-color-primary);
}

.job-detail__handler {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.job-detail__plus {
  color: var(--el-text-color-regular);
}

.job-detail__code {
  max-height: 240px;
  margin: 0;
  padding: 12px;
  overflow: auto;
  border-radius: var(--el-radius-md);
  background: var(--el-text-color-primary);
  color: var(--el-bg-color);
  font-family: var(--cc-font-num);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.job-detail__code--param {
  min-height: 44px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.job-detail__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 4px;
}

@media (max-width: 760px) {
  .job-detail__grid {
    grid-template-columns: 1fr;
  }
}
</style>
