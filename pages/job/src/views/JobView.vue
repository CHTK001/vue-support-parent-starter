<!--
  调度工作台：调度中心的落地页，整页就一张任务列表。

  运行态分页（JobRuntimeVO），关键字走 ReTable 内置搜索区输入框，状态是下拉框（含「全部状态」这一档，
  选中即随下次查询生效），分发仍是纯图标按钮式直点（字段标签在上，含义不靠文字猜）。工具栏只有「新建任务」，
  刷新与自动刷新都用表格自带的能力（:auto-refresh，轮询定时器由 ReTable 持有），执行器清单在进页面与每次
  写入后自动重取，逐行的启停与操作都在「操作」列上。要看单轮派发的详情去「作业日志」页，日志清理也在那一页，
  这里不再复制一份侧栏。

  新建/编辑任务的弹层是手写的卡片式布局（模板里的 task-form 分支）：顶部三张卡片切执行类型（对象 / 脚本 / 片段），
  脚本与片段再按 SPI 枚举出的「语言」下拉细分引擎；往下按「基本信息 / 代码正文 / 调度配置 / 策略与告警」分区，
  字段集只在这一处维护；cron 用 ReCron 收口，毫秒间隔按调度类型显隐。只有「编辑流程调度」另一种弹层状态
  走 ReForm schema（FLOW_FIELDS）。

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
import { computed, nextTick, onActivated, onMounted, reactive, ref, watch } from "vue";
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
  listGlueEngines,
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
import { resolveHostPath } from "../utils/hostPath";
import { CronExpression } from "@repo/utils";
import ReIcon from "@repo/ui/re-icon";

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

/**
 * 表单校验提示的展示时长（毫秒）。
 *
 * 比 msgError 默认的 2 秒更长：这些提示都要求用户回到表单改字段，
 * 2 秒内常常还没看清就消失了（自动化验收里直接读不到）。
 */
const FORM_MSG_DURATION = 4000;

/** 调度类型 → 简称：校验提示里用它对齐下拉选项，避免用户找不到说的是哪一项 */
const SCHEDULE_NAME: Record<string, string> = {
  CRON: "CRON 表达式",
  FIXED: "固定频率",
  DELAY: "固定延迟",
  NONE: "不自动调度",
};

/** 调度类型 → 该填的调度配置举例，直接告诉用户填什么格式 */
const SCHEDULE_TIME_HINT: Record<string, string> = {
  CRON: "cron 表达式（6 段，例如 0 0/30 * * * ?）",
  FIXED: "固定频率毫秒数（例如 60000 表示每分钟一次）",
  DELAY: "固定延迟毫秒数（例如 60000 表示上次结束后隔一分钟）",
};

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
 * 执行类型（顶部三张卡片，与后端 GlueTypes 收敛后的三类语义一致）：
 *  - 对象（BEAN）：从已注册执行器对象（@Job 处理器）里选一个执行，任务键即处理器名，正文为空；
 *  - 脚本（裸引擎名，如 java / groovy）：写**完整文件**（完整 Java 类 / 完整 Groovy 脚本），
 *    保存时由对应引擎预编译校验，执行时复用同一份编译产物；
 *  - 片段（GLUE_ + 引擎名大写，如 GLUE_JAVA / GLUE_GROOVY）：只写 @Job 方法的**方法体**，
 *    由后端 GlueScriptSynthesizer 合成完整脚本后再交同一引擎。
 *
 * 判据只有一条：值以 GLUE_ 开头就是片段（需要后端合成），否则是脚本；BEAN 是对象。
 * 语言不写死在前端，由 SPI 运行时枚举（GET /glue/engines）驱动，装了新引擎自动进下拉。
 */
const GLUE_BEAN = "BEAN";
/** 片段类型前缀：带此前缀表示只写方法体，需要后端合成完整脚本 */
const GLUE_FRAGMENT_PREFIX = "GLUE_";
/** 用户首次点脚本 / 片段时的默认语言；选过之后由 lastGlueEngine 记住 */
const DEFAULT_GLUE_ENGINE = "groovy";
/** 引擎枚举拉取失败时的兜底清单，保证下拉始终可用 */
const FALLBACK_GLUE_ENGINES = ["groovy", "java"];

/** 已注册引擎名 -> 下拉展示名；未收录的引擎原样显示 */
const GLUE_ENGINE_LABELS: Record<string, string> = { java: "Java", groovy: "Groovy" };

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

/** 可用脚本引擎（SPI 运行时枚举）：驱动「语言」下拉，装了新引擎自动出现 */
const glueEngines = ref<string[]>([]);
/** 用户上次选过的语言：切「脚本 / 片段」时保持不变，首次默认 groovy */
const lastGlueEngine = ref(DEFAULT_GLUE_ENGINE);

/** 语言下拉选项：label 映射到 Java / Groovy，未收录的引擎名原样展示 */
const glueEngineOptions = computed<ReOption[]>(() =>
  glueEngines.value.map(engine => ({ label: GLUE_ENGINE_LABELS[engine] ?? engine, value: engine })),
);

/** 取语言下拉选项值；请求失败或空列表静默回落到内置清单，保证下拉始终可用 */
async function loadGlueEngines(): Promise<void> {
  try {
    const listed = await listGlueEngines();
    // 统一小写：后端 SPI 注册表归一后的扩展名可能是大写（JAVA / GROOVY），
    // 而 glueType 的口径是小写（java / groovy），不归一会出现「下拉值选不中选项」。
    const engines = Array.isArray(listed)
      ? [...new Set(listed.map(name => String(name ?? "")).filter(Boolean).map(name => name.toLowerCase()))]
      : [];
    glueEngines.value = engines.length ? engines : [...FALLBACK_GLUE_ENGINES];
  } catch {
    glueEngines.value = [...FALLBACK_GLUE_ENGINES];
  }
  // 默认语言不在枚举里（例如只装了 java）时，退到清单首项，避免下拉显示空值
  if (!glueEngines.value.includes(lastGlueEngine.value)) {
    lastGlueEngine.value = glueEngines.value[0] ?? DEFAULT_GLUE_ENGINE;
  }
}

const columns = computed<ReTableColumn[]>(() => [
  { prop: "jobName", label: "任务名", minWidth: 160, slot: "name", showOverflowTooltip: true },
  { prop: "scheduleType", label: "调度表达式", width: 186, slot: "schedule" },
  { prop: "jobKey", label: "执行器", minWidth: 80, slot: "executor", showOverflowTooltip: true },
  { prop: "enabled", label: "状态开关", width: 84, slot: "status", align: "center" },
  { prop: "nextFireTime", label: "下次触发", width: 132, slot: "next" },
  { prop: "lastFireTime", label: "最近触发", width: 132, slot: "last" },
  { prop: "author", label: "负责人", width: 74, slot: "author" },
  /* 操作列：3 个常用方形按钮 + 1 个「更多」下拉触发器 = 4×38 的间距。
     低频/危险动作收进下拉后，不再需要为平铺 6 个按钮留 268px。 */
  { prop: "action", label: "操作", width: 180, slot: "action", fixed: "right" },
]);

/**
 * 台账行是否按「采集流程镜像」处理（启停/删除都回落到采集流程接口）。
 *
 * 不能只看分组：脚本与片段任务同样登记在 collect-flow 分组下，
 * 但它们的 jobKey 是 script-<脚本ID>，末尾那串是脚本的雪花 ID——
 * 既不是流程 ID，也远超 Integer 范围。若按流程行处理，flowIdOf 会用正则
 * 从 jobKey 末尾抓出该数字发给 /collect/flow/status，后端以 Integer 接收
 * 直接 400（且 JS Number 已把雪花末位舍掉），启用与删除整个不可用。
 *
 * 所以这里要求同时满足：属于该分组、不是脚本类任务、且真能解析出流程 ID。
 * 解析不出的行（如 collect.self.check 这类非流程的内置任务）走调度治理接口，
 * 与批量启停「缺流程 ID 的行跳过」的口径一致。
 *
 * @param job 台账行
 * @returns true 表示应走采集流程接口，false 表示走调度治理接口
 */
function isFlowRow(job: JobRuntime): boolean {
  return job.group === COLLECT_FLOW_GROUP && !isScriptJob(job) && flowIdOf(job) > 0;
}

/** 代码片段任务：执行类型非 BEAN，不依赖处理器注册表（脚本与片段都算） */
function isScriptJob(job: JobRuntime): boolean {
  return Boolean(job.glueType) && job.glueType !== GLUE_BEAN;
}

/** 从 glueType 原值判形态：GLUE_ 前缀 = 片段，BEAN（含空）= 对象，其余 = 脚本 */
function kindOfGlueType(glueType: string | null | undefined): "bean" | "script" | "fragment" {
  const value = String(glueType ?? "");
  if (!value || value === GLUE_BEAN) {
    return "bean";
  }
  return value.toUpperCase().startsWith(GLUE_FRAGMENT_PREFIX) ? "fragment" : "script";
}

/** 从 glueType 原值取引擎名：片段去掉 GLUE_ 前缀，脚本原样；对象返回空串 */
function engineOfGlueType(glueType: string | null | undefined): string {
  const kind = kindOfGlueType(glueType);
  if (kind === "bean") {
    return "";
  }
  const value = String(glueType);
  return (kind === "fragment" ? value.slice(GLUE_FRAGMENT_PREFIX.length) : value).toLowerCase();
}

/** 引擎展示名：java / groovy 归一成首字母大写，其余引擎名原样，空串落到「脚本」 */
function glueEngineLabel(engine: string): string {
  if (engine === "java") {
    return "Java";
  }
  if (engine === "groovy") {
    return "Groovy";
  }
  return engine || "脚本";
}

/** 列表标签用：片段 / 脚本 前缀 + 语言，例如「片段 · Java」「脚本 · Groovy」 */
function glueKindLabel(job: JobRuntime): string {
  const kind = kindOfGlueType(job.glueType);
  const label = glueEngineLabel(engineOfGlueType(job.glueType));
  return kind === "fragment" ? `片段 · ${label}` : `脚本 · ${label}`;
}

/** 详情正文标签：片段写方法体、脚本写完整文件，按语言分别说明 */
function detailSourceLabel(job: JobRuntime): string {
  const kind = kindOfGlueType(job.glueType);
  const isJava = engineOfGlueType(job.glueType) === "java";
  if (kind === "fragment") {
    return isJava ? "Java 片段（方法体）" : `${glueEngineLabel(engineOfGlueType(job.glueType))} 片段`;
  }
  return isJava ? "Java 脚本（完整类）" : `${glueEngineLabel(engineOfGlueType(job.glueType))} 脚本（完整文件）`;
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

/**
 * 跳到作业日志页并按该任务预筛。
 *
 * 列表行的「更多 → 查看日志」与详情弹层底部的「查看日志」共用这一条动线：
 * 两处各写一份跳转参数，日后只改其一会让入口行为分叉。
 *
 * @param job 台账行
 */
function openLogs(job: JobRuntime): void {
  if (!job?.jobKey) {
    return;
  }
  // 本宿主口径可能是 /collect/job-log（采集）或 /job/log（系统管理），按路由表择一
  void router.push({ path: resolveHostPath(router, "/collect/job-log"), query: { jobKey: job.jobKey } });
}

/** 详情里的「查看日志」：关掉弹层再跳，补齐「任务 → 它的执行历史」这条动线 */
function logsFromDetail(): void {
  const job = detail.value;
  if (!job) {
    return;
  }
  detailVisible.value = false;
  openLogs(job);
}

/** 后续执行时间点预览弹层：显隐与内容 */
const fireTimesVisible = ref(false);
const fireTimesTitle = ref("");
const fireTimes = ref<Date[]>([]);
const fireTimesError = ref("");

/**
 * 打开「后续执行时间点」弹层。
 *
 * <p>只对 cron 任务有意义：固定延迟 / 固定频率的下一拍取决于上一拍实际完成时刻，
 * 事先算不出来，所以那两类任务不给这个按钮。</p>
 *
 * <p>时间直接用 @repo/utils 的 {@link CronExpression} 算——它是服务端
 * {@code com.chua.common.support.task.scheduler.CronExpression} 的逐行镜像，
 * 与保存后调度器实际触发的口径一致，不必为此加后端接口。</p>
 *
 * @param job 台账行
 */
function openFireTimes(job: JobRuntime): void {
  const expression = String(job.scheduleTime ?? "").trim();
  fireTimesTitle.value = job.jobName || job.jobKey || "";
  fireTimes.value = [];
  fireTimesError.value = "";
  if (!expression) {
    fireTimesError.value = "该任务没有填写调度配置";
    fireTimesVisible.value = true;
    return;
  }
  try {
    fireTimes.value = new CronExpression(expression).getFireTimes(5, new Date());
    if (!fireTimes.value.length) {
      // 能解析但永不匹配（如 0 0 9 30 2 *）——与 ReCron 预览、后端校验同一口径
      fireTimesError.value = "该表达式算不出后续触发时间";
    }
  } catch (error) {
    fireTimesError.value = `表达式无法解析：${String((error as Error)?.message ?? error)}`;
  }
  fireTimesVisible.value = true;
}

/** 后续执行时间是否可看：仅 cron 任务 */
function canPreviewFireTimes(job: JobRuntime): boolean {
  return String(job.scheduleType ?? "").toUpperCase() === "CRON" && Boolean(String(job.scheduleTime ?? "").trim());
}

/** 预览弹层里的时间展示格式 */
function fmtFireTime(value: Date): string {
  const pad = (n: number): string => String(n).padStart(2, "0");
  return (
    `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ` +
    `${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`
  );
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
  version: 0,
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

/**
 * 调度配置缺失的内联错误提示。
 *
 * toast 会自己消失，而「调度类型选了 CRON 却没填 cron」要求用户回到对应字段改，
 * 所以在字段下面额外留一行红字，并把视图滚到那一项 —— 只弹 toast 时用户常常
 * 不知道是哪一项没填、还要自己滚回去找。
 */
const scheduleError = ref("");

/** 调度配置字段容器：校验失败时滚到它 */
const scheduleFieldRef = ref<HTMLElement | null>(null);

/** 用户一动调度类型或调度配置就撤掉红字，避免「已经改了还标红」 */
watch([() => form.scheduleType, () => form.scheduleTime], () => {
  scheduleError.value = "";
});

const isScriptForm = computed(() => Boolean(form.glueType) && form.glueType !== GLUE_BEAN);

/**
 * 形态派生：以 form.glueType 为唯一真源。
 * BEAN → bean；以 GLUE_ 开头 → fragment；其余非空值 → script。
 */
const taskKind = computed<"bean" | "script" | "fragment">(() => kindOfGlueType(form.glueType));

/** 当前引擎名：片段去掉 GLUE_ 前缀，脚本原样；对象为空串 */
const glueEngine = computed(() => engineOfGlueType(form.glueType));

/**
 * ScriptSourceField 的 lang：引擎归一成 java / groovy，未知引擎原样返回字符串
 * （模板按 groovy 兜底）；对象类型落到记住的语言，仅作兜底取值。
 */
const glueLang = computed<string>(() => glueEngine.value || lastGlueEngine.value || DEFAULT_GLUE_ENGINE);

/**
 * 语言下拉的当前值；设置了就按当前形态回写 glueType（片段继续片段、脚本继续脚本）。
 * 类型放宽到 ReSelect 的 model 联合类型，保证组件 v-model 赋值不报类型错。
 */
const glueEngineModel = computed<string | number | (string | number)[] | null>({
  get: () => glueEngine.value || lastGlueEngine.value,
  set: (value) => {
    const engine = typeof value === "string" ? value : "";
    if (engine) {
      setGlueEngine(engine);
    }
  },
});

/** 正文区标题：形态 + 语言；脚本写完整文件、片段写方法体 */
const glueSourceTitle = computed(() => {
  const label = glueEngineLabel(glueLang.value);
  return taskKind.value === "fragment"
    ? `${label} 片段${label === "Java" ? "（方法体）" : ""}`
    : `${label} 脚本（${label === "Java" ? "完整类" : "完整文件"}）`;
});

/** 正文区占位：脚本与片段的写法要求不同，提示必须分开说 */
const glueSourcePlaceholder = computed(() => {
  if (taskKind.value === "fragment") {
    return glueLang.value === "java"
      ? "点击编辑：只写 @Job 方法的方法体（不要写 package / class / import / @Job），后端会合成完整类"
      : "点击编辑：只写 @Job 方法的方法体（Groovy 裸语句），入口与类名由后端合成";
  }
  return glueLang.value === "java"
    ? "点击编辑完整 Java 类源码：package / class / @Job 入口方法都自己写，保存时后端预编译校验"
    : "点击编辑完整 Groovy 脚本文件，保存时后端预编译校验";
});

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
 * 应用执行类型（形态 + 引擎）到表单，并在落库值真的变化时清空正文。
 *
 * 类型或语言一变，原正文就一定不合法（Groovy 正文当 Java 源码编译必然失败，反之亦然），
 * 所以顺手清空；不清的话用户会对着上一段正文反复踩编译错。
 *
 * @param kind   目标形态：bean / script / fragment
 * @param engine 目标引擎名（对象形态忽略）
 */
function applyGlueType(kind: "bean" | "script" | "fragment", engine: string): void {
  const next = kind === "bean"
    ? GLUE_BEAN
    : kind === "fragment"
      ? GLUE_FRAGMENT_PREFIX + engine.toUpperCase()
      : engine;
  if (form.glueType !== next) {
    form.glueSource = "";
  }
  form.glueType = next;
  clearFormErrors();
}

/** 切「对象 / 脚本 / 片段」：脚本与片段沿用记住的语言，不因切形态丢语言 */
function setTaskKind(kind: "bean" | "script" | "fragment"): void {
  if (kind === "bean") {
    applyGlueType("bean", "");
    return;
  }
  applyGlueType(kind, lastGlueEngine.value || DEFAULT_GLUE_ENGINE);
}

/** 切语言：保持当前形态归属，脚本↔脚本、片段↔片段，并记住这次选择 */
function setGlueEngine(engine: string): void {
  lastGlueEngine.value = engine;
  const kind = taskKind.value === "bean" ? "script" : taskKind.value;
  applyGlueType(kind, engine);
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
    version: 0,
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
    version: job.version ?? 0,
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
  // 编辑回显：把存量任务的引擎同步进「上次选择」，之后切脚本 / 片段时语言不跳
  const restoredEngine = engineOfGlueType(job.glueType);
  if (restoredEngine) {
    lastGlueEngine.value = restoredEngine;
  }
  cronBroken.value = false;
  formVisible.value = true;
  clearFormValidate();
}

/**
 * 查台账里是否已有这个任务键。
 *
 * 对象类型建档是**按 jobKey 覆盖**已有台账行（脚本 / 片段的 jobKey 由后端生成，不会撞），
 * 所以在「新建」路径上选中一个已登记的处理器，等于静默改掉那一行的名称、分组、
 * 调度与启用状态。没有这一步提示时，操作者看到的是「保存成功」，线上任务却已被改。
 *
 * @param jobKey 待查的任务键
 * @returns 已存在的运行态；查不到（新建）或查询异常都返回 null
 */
async function loadExistingForOverwrite(jobKey: string): Promise<JobRuntime | null> {
  try {
    return (await getJob(jobKey)) ?? null;
  } catch {
    // 查不到就按新建处理：不为一次存在性检查挡住用户，也不因为网络抖动把人拦在门外
    return null;
  }
}

/**
 * 拼覆盖前的差异说明。
 *
 * 只列**会变**的字段：全量罗列会让真正的改动淹没在未变项里，点了确认也不知道改了什么。
 *
 * @param existing 台账里已存在的任务
 * @param next 本次要保存的内容
 * @returns 可直接放进确认框的差异文案
 */
function describeOverwriteDiff(existing: JobRuntime, next: JobSave): string {
  const changes: string[] = [];
  const name = String(next.jobName ?? "").trim();
  if (name && name !== String(existing.jobName ?? "").trim()) {
    changes.push(`任务名称「${existing.jobName || "空"}」改为「${name}」`);
  }
  const group = String(next.group ?? "").trim();
  if (group !== String(existing.group ?? "").trim()) {
    changes.push(`分组「${existing.group || "空"}」改为「${group || "空"}」`);
  }
  const scheduleType = next.scheduleType ?? "";
  if (scheduleType !== String(existing.scheduleType ?? "")) {
    changes.push(`调度类型「${existing.scheduleType || "空"}」改为「${scheduleType}」`);
  }
  const scheduleTime = String(next.scheduleTime ?? "").trim();
  if (scheduleTime !== String(existing.scheduleTime ?? "").trim()) {
    changes.push(`调度配置「${existing.scheduleTime || "空"}」改为「${scheduleTime || "空"}」`);
  }
  if (Boolean(next.enabled) !== Boolean(existing.enabled)) {
    changes.push(`登记后启用「${existing.enabled ? "是" : "否"}」改为「${next.enabled ? "是" : "否"}」`);
  }
  return changes.length > 0 ? changes.join("；") : "本次没有字段变化";
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
    msgError("任务名称不能为空", true, FORM_MSG_DURATION);
    return;
  }
  if (isScriptTask) {
    // 脚本任务不需要用户填任务键：编辑保持原标识；新建留空，由后端用 IdUtils 生成全局唯一标识
    jobKey = formMode.value === "edit" && String(form.originJobKey ?? "").trim()
      ? String(form.originJobKey).trim()
      : "";
  } else if (!jobKey) {
    msgError("请选择任务", true, FORM_MSG_DURATION);
    return;
  }
  if (form.scheduleType === "CRON" && cronBroken.value) {
    msgError("cron 表达式不合法，请检查格式（6 段，例如 0 0/30 * * * ?）", true, FORM_MSG_DURATION);
    return;
  }
  if (form.scheduleType !== "NONE" && !String(form.scheduleTime ?? "").trim()) {
    // 提示要同时说清「哪个字段」和「另一条路怎么走」：默认调度类型就是 CRON，
    // 不写清字段名和替代选项时，用户只看到一句「必须给调度配置」会不知道从哪改起。
    // 除了 toast，还在字段下面留红字并把视图滚过去。
    scheduleError.value = `调度类型选了「${SCHEDULE_NAME[form.scheduleType] ?? form.scheduleType}」，`
      + `请填写：${SCHEDULE_TIME_HINT[form.scheduleType] ?? "调度配置"}`;
    void nextTick(() => {
      scheduleFieldRef.value?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
    msgError(`${scheduleError.value}；不需要自动调度请把调度类型改成「不自动调度」`,
      true, FORM_MSG_DURATION);
    return;
  }
  scheduleError.value = "";
  if (isScriptTask && !String(form.glueSource ?? "").trim()) {
    msgError("代码片段任务必须填写片段正文", true, FORM_MSG_DURATION);
    return;
  }
  if (isScriptTask && String(form.glueSource ?? "").length > GLUE_SOURCE_LIMIT) {
    msgError(`片段正文过长（上限 ${GLUE_SOURCE_LIMIT} 字符，与台账列 sys_job_glue_source 同宽）`,
      true, FORM_MSG_DURATION);
    return;
  }
  if (String(form.alarmType ?? "").trim() && !String(form.alarmEmail ?? "").trim()) {
    msgError("选择了告警类型就必须填写告警目标，否则任务失败时不会告警", true, FORM_MSG_DURATION);
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
  // 覆盖护栏：对象类型新建时若 jobKey 已在台账，先摆出差异再决定要不要覆盖
  if (formMode.value === "create" && !isScriptTask && jobKey) {
    const existing = await loadExistingForOverwrite(jobKey);
    if (existing) {
      const diff = describeOverwriteDiff(existing, payload);
      const ok = await confirmAction(
        `任务「${jobKey}」已在台账中，保存会覆盖它的配置：${diff}。确认覆盖？`,
        "该任务已存在",
      );
      if (!ok) {
        return;
      }
      // 覆盖确认基于刚读到的这一版：用它的版本做 CAS，期间被别人改过就拒绝覆盖而不是盖掉别人的改动
      payload.version = existing.version ?? undefined;
    }
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

/**
 * 首次挂载取一次执行器清单。
 *
 * <p>执行器清单原来只挂在 {@code onActivated} 上，但只有被 keep-alive 缓存的视图才会触发它：
 * 系统管理宿主（route.mode=remote）下实测进入调度管理只请求了 {@code /v2/job/page}，
 * {@code /v2/job/executors} 从未发出，于是「新建任务 → 对象」的任务选择器永远是
 * 「暂无匹配选项」，对象类型任务根本建不出来。挂到 onMounted 上补齐这条路径。</p>
 */
onMounted(() => {
  void loadExecutors();
  // 语言下拉由 SPI 运行时枚举驱动；只在挂载时取一次，失败静默回落到内置清单
  void loadGlueEngines();
});

onActivated(() => {
  if (firstActivation) {
    firstActivation = false;
    // 首次挂载已由 onMounted 取过清单，这里不重复请求（keep-alive 下两个钩子都会触发）
    return;
  }
  void loadExecutors();
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
        :layout-switch="false"
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

        <!--
          可操作空态：默认的 el-empty 只能看不能做。
          台账空有两种成因，话必须分开说：带着筛选条件查不到 ≠ 台账真的没任务，
          所以沿用已有的 filteredEmpty 区分文案与动作（带条件时空态不再给「新建任务」，
          否则会把「筛太严」误导成「台账空了」）。empty-text 属性保留不动，
          它仍是 #empty 插槽 description 的回退值。
          本页的 page-empty 样式在下方 scoped 里自带一份，原因见那段注释。
        -->
        <template #empty>
          <div class="page-empty">
            <span class="page-empty__icon"><ReIcon name="AlarmClock" :size="22" /></span>
            <span class="page-empty__title">
              {{ filteredEmpty ? '没有符合当前条件的任务' : '还没有调度作业' }}
            </span>
            <span class="page-empty__desc">
              {{ filteredEmpty
                ? '换个关键字或状态，或点搜索区的「重置」看全部。'
                : '调度作业由调度中心按 cron 派发；新建一个任务，或在流程设计页给流程配 cron 后会出现在这里。' }}
            </span>
            <span class="page-empty__actions">
              <ReButton v-if="!filteredEmpty" type="primary" icon="Plus" @click="openCreate">新建任务</ReButton>
              <ReButton icon="Refresh" @click="reloadJobs">刷新</ReButton>
            </span>
          </div>
        </template>

        <template #name="{ row }">
        <span>{{ row.jobName || row.jobKey }}</span>
        <ReTag v-if="isFlowRow(row as unknown as JobRuntime)" class="collect-tag-inline"  type="primary" effect="plain">
          采集流程
        </ReTag>
        <ReTag
          v-else-if="kindOfGlueType((row as unknown as JobRuntime).glueType) === 'fragment'"
          class="collect-tag-inline"
          type="warning"
          effect="plain"
        >
          {{ glueKindLabel(row as unknown as JobRuntime) }}
        </ReTag>
        <ReTag
          v-else-if="isScriptJob(row as unknown as JobRuntime)"
          class="collect-tag-inline"
          type="success"
          effect="plain"
        >
          {{ glueKindLabel(row as unknown as JobRuntime) }}
        </ReTag>
        <ReTag v-else-if="row.group"  type="info" effect="plain">{{ row.group }}</ReTag>
      </template>
      <template #schedule="{ row }">
        <span class="collect-cell-mono collect-cell-ellipsis">{{ scheduleText(row as unknown as JobRuntime) }}</span>
      </template>
      <template #executor="{ row }">
        <span class="collect-cell-mono">{{ row.jobKey }}</span>
        <ReTag
          v-if="executorMissing(row as unknown as JobRuntime)"
          class="collect-tag-inline"
          dot
          type="danger"
          effect="plain"
        >
          未注册
        </ReTag>
        <ReTag
          v-if="row.dispatchMode === 'REMOTE'"
          class="collect-tag-inline"
          
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
          tip="查看任务详情"
          @click="openDetail(row as unknown as JobRuntime)"
        />
        <ReButton
          layout="square"
          icon="VideoPlay"
          type="primary"
          :disabled="Boolean(busyKey) || row.enabled !== true"
          :tip="
            row.enabled === true
              ? isFlowRow(row as unknown as JobRuntime) ? '立即运行' : '立即触发'
              : '任务已停用，触发不会被派发，请先启用调度'
          "
          @click="runNow(row as unknown as JobRuntime)"
        />
        <ReButton
          layout="square"
          icon="Edit"
          :disabled="Boolean(busyKey)"
          :tip="isFlowRow(row as unknown as JobRuntime) ? '编辑流程调度' : '编辑任务'"
          @click="openEdit(row as unknown as JobRuntime)"
        />
        <!--
          低频/危险动作收进「更多」：操作列平铺 6 个方形按钮时，按钮间距 38px 累积到
          228px，宽一点的列也放不下，删除按钮会被挤到第二行。留 3 个常用动作在外，
          其余按频率与风险降级到下拉里。
        -->
        <el-dropdown trigger="click" :disabled="Boolean(busyKey)">
          <!--
            触发器必须是**原生 button**：ReButton 的根节点是 ElTooltip / 异步加载的
            SquareLayout，都是组件而不是元素，ElDropdown 解析不到触发元素，
            popper 会挂载却永远不显示（点上去「像没反应」）。外观由 .job-action__more
            复制 Square.vue 的方形按钮样式，与旁边三个按钮保持一致。
          -->
          <button
            type="button"
            class="job-action__more"
            title="更多操作"
            aria-label="更多操作"
            :disabled="Boolean(busyKey)"
          >
            <ReIcon name="MoreFilled" />
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item :disabled="Boolean(busyKey)" @click="openLogs(row as unknown as JobRuntime)">
                查看日志
              </el-dropdown-item>
              <el-dropdown-item
                v-if="canPreviewFireTimes(row as unknown as JobRuntime)"
                :disabled="Boolean(busyKey)"
                @click="openFireTimes(row as unknown as JobRuntime)"
              >
                后续 5 次执行时间
              </el-dropdown-item>
              <el-dropdown-item :disabled="Boolean(busyKey)" @click="copy(row as unknown as JobRuntime)">
                {{ isFlowRow(row as unknown as JobRuntime) ? "复制流程" : "复制为新建" }}
              </el-dropdown-item>
              <el-dropdown-item
                divided
                :disabled="Boolean(busyKey)"
                class="job-action__danger"
                @click="remove(row as unknown as JobRuntime)"
              >
                {{ isFlowRow(row as unknown as JobRuntime) ? "删除流程" : "删除任务" }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
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
            :class="{ 'is-active': taskKind === 'bean' }"
            @click="setTaskKind('bean')"
          >
            <strong>对象</strong>
            <span>使用已注册的执行器对象（Bean）执行，从任务列表中选择</span>
          </button>
          <button
            type="button"
            class="task-form__type-card"
            :class="{ 'is-active': taskKind === 'script' }"
            @click="setTaskKind('script')"
          >
            <strong>脚本</strong>
            <span>写完整文件（完整 Java 类 / 完整 Groovy 脚本），保存时后端预编译校验</span>
          </button>
          <button
            type="button"
            class="task-form__type-card"
            :class="{ 'is-active': taskKind === 'fragment' }"
            @click="setTaskKind('fragment')"
          >
            <strong>片段</strong>
            <span>只写 @Job 方法的方法体，类名与入口由后端合成</span>
          </button>
        </div>

        <label v-if="taskKind !== 'bean'" class="task-form__engine">
          <span>语言</span>
          <ReSelect
            v-model="glueEngineModel"
            :data="glueEngineOptions"
            :clearable="false"
            placeholder="选择脚本引擎"
          />
          <em class="task-form__help">
            引擎清单来自本进程的 SPI 运行时枚举（{{ taskKind === 'fragment' ? '写方法体' : '写完整文件' }}）
          </em>
        </label>

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
            :mode="taskKind === 'fragment' ? 'fragment' : 'file'"
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
            <label
              v-if="form.scheduleType === 'CRON'"
              ref="scheduleFieldRef"
              class="task-form__field task-form__field--wide"
              :class="{ 'is-error': scheduleError }"
            >
              <span>cron 表达式</span>
              <ReCron
                v-model="form.scheduleTime"
                :preview-count="3"
                placeholder="6 段表达式，例如 0 0/30 * * * ?"
                @change="onCronChange"
              />
              <em v-if="scheduleError" class="task-form__error">{{ scheduleError }}</em>
            </label>
            <label
              v-else-if="form.scheduleType !== 'NONE'"
              ref="scheduleFieldRef"
              class="task-form__field task-form__field--wide"
              :class="{ 'is-error': scheduleError }"
            >
              <span>调度配置</span>
              <ReInput v-model="form.scheduleTime" placeholder="毫秒数，例如 60000" />
              <em v-if="scheduleError" class="task-form__error">{{ scheduleError }}</em>
              <em v-else class="task-form__help">固定频率 / 固定延迟填毫秒间隔</em>
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
                  <ReTag :type="detail.enabled ? 'success' : 'info'" effect="solid" dot>
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
                  <ReTag :type="isScriptJob(detail) ? 'primary' : detail.handlerRegistered ? 'success' : 'danger'" effect="solid" dot>
                    {{ isScriptJob(detail) ? "代码片段任务" : detail.handlerRegistered ? "已注册" : "未注册" }}
                  </ReTag>
                  <span class="job-detail__mono">{{ detail.glueType || GLUE_BEAN }}</span>
                </dd>
              </div>
              <div v-if="isScriptJob(detail)" class="job-detail__row-wide">
                <dt>{{ detailSourceLabel(detail) }}</dt>
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

    <!-- 后续执行时间点预览：只对 cron 任务开放，时间由与服务端同源的 CronExpression 算出 -->
    <ReDialog
      v-model="fireTimesVisible"
      :title="`后续 5 次执行时间${fireTimesTitle ? ' · ' + fireTimesTitle : ''}`"
      width="480px"
      footer-hidden
    >
      <div class="job-fire-times">
        <ol v-if="fireTimes.length" class="job-fire-times__list">
          <li v-for="(time, index) in fireTimes" :key="index">
            <span class="job-fire-times__seq">{{ index + 1 }}</span>
            <span class="job-fire-times__time">{{ fmtFireTime(time) }}</span>
          </li>
        </ol>
        <p v-else class="job-fire-times__empty">{{ fireTimesError || "暂无数据" }}</p>
        <p class="job-fire-times__note">
          由与服务端同一套解析引擎算出，保存后的实际触发时间与此一致；台账行的「下次触发」只显示最近一次。
        </p>
      </div>
    </ReDialog>
  </div>
</template>

<style scoped>
/*
 * 根节点挂 collect-page 与其余 11 个视图对齐，拿共享的 flex 列布局与间距。
 *
 * 这里对 ReTable 做了三处页内调整，都是「本页就该这样」，不动组件默认值：
 *  1) 关掉布局切换器（见模板 :layout-switch="false"）：调度台账只该以表格呈现，
 *     组件默认开着且 monitor 应用的 e2e 明确断言「默认可见」，
 *     所以只能按页关闭，不能翻组件默认值。
 *  2) 去掉外层卡片背景：台账直接铺在页面底上，不再套一层白卡。
 *     --rt-bg 同时被用来画行底色（--el-table-tr-bg-color），不能改它，
 *     只把外层 .re-table 自身的 background 置透明。
 *  3) 补回滚动条：ReTable 只在调用方传 layout-table 高度时表体才内滚，
 *     本页没传，而 .job-table 原先是 flex:1+min-height:0 —— 表格被压到容器高度、
 *     内容溢出且页面 overflow:visible，等于没有滚动条。
 *     改为按内容自然高度展开 + 页面纵向滚动，行为最可预期。
 */
.job-page {
  width: 100%;
  overflow-y: auto;
}

.job-table {
  width: 100%;
  /* 不再吃掉剩余高度：让表格按内容撑开，由 .job-page 滚动 */
  flex: 0 0 auto;
  min-height: 0;
}

/*
 * 去背景要带祖先选择器：ReTable 自身的 `.re-table[data-v-child]` 与本文件的
 * `.job-table[data-v-parent]` 特异性相同（0,2,0），子组件样式在文档里靠后，
 * 同特异性下会盖掉本文件。加 `.job-page` 前缀提到 0,4,0 才稳。
 */
.job-page .job-table {
  background: transparent;
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

/* 「更多」下拉里的删除项：与其余项同一行高，只用文字色区分危险级，不做整行红底（易与禁用态混淆） */
.job-action__danger {
  color: var(--el-color-danger);
}

/*
  「更多」触发按钮：复制 ReButton Square.vue 的方形按钮外观（30×30 / 圆角 / 边框同色）。
  不复用 .rs-btn 类的原因是那套样式是 Square.vue 的 scoped CSS，带自身作用域标记，
  在别的组件模板里写同名 class 拿不到。之所以不用 ReButton 组件，是为了让
  el-dropdown 拿到原生元素做触发器（见模板里的注释）。
  圆角：Square.vue 写死的是 10px，koi 令牌里没有 10 这一档，取最近的
  --el-radius-md(8px)；与旁边三个方形按钮有 2px 观感差，要完全对齐得改 UI 包本身，本页不越界改。
*/
.job-action__more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 4px;
  width: 30px;
  height: 30px;
  padding: 0;
  /* 原这几行用的是「var(--el-border-color, 写死 hex)」这种带 hex 兜底的写法，
     兜底色已去掉：koi 主题必定定义这些变量，留一份写死色反而在换肤 / 暗色下露出马脚（兜底色是亮色的） */
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color);
  color: var(--el-text-color-secondary);
  font-family: inherit;
  font-size: 14px;
  cursor: pointer;
  user-select: none;
  outline: none;
  flex-shrink: 0;
  transition: all var(--el-transition-duration, 0.2s) ease;
}

.job-action__more:hover:not(:disabled) {
  border-color: var(--el-color-primary-light-3);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.job-action__more:active:not(:disabled) {
  transform: scale(0.92);
}

.job-action__more:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 键盘可达：原生 button 默认有焦点环，但这里用 transform 做按压反馈，
   焦点环会被 el-button 的样式压掉，显式补一圈 koi 焦点环 */
.job-action__more:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

/* 后续执行时间点预览：序号 + 等宽时间，5 行高度稳定不跳动 */
.job-fire-times__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.job-fire-times__list li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  /* 原写死 8px，对应 koi 的 --el-radius-md */
  border-radius: var(--el-radius-md, 8px);
  background: var(--rm-bg-subtle, var(--el-fill-color-light));
}

.job-fire-times__seq {
  flex: none;
  width: 20px;
  height: 20px;
  /* 原写死 9999px，对应 koi 的 --el-radius-full */
  border-radius: var(--el-radius-full, 9999px);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  color: var(--el-color-primary);
  font-size: 11px;
  line-height: 20px;
  text-align: center;
}

.job-fire-times__time {
  font-family: ui-monospace, "Cascadia Mono", "Consolas", monospace;
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.job-fire-times__empty {
  margin: 0;
  font-size: 13px;
  color: var(--el-color-danger);
}

.job-fire-times__note {
  margin: 12px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.task-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.task-form__type {
  display: grid;
  /*
    三张类型卡片（对象 / 脚本 / 片段）：按容器实际宽度自适应，不写死列数。
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
  /* 原写死 0.15s，改用 --el-transition-duration 与全站过渡同档 */
  transition:
    border-color var(--el-transition-duration, 0.2s) ease,
    background-color var(--el-transition-duration, 0.2s) ease;
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

/* 语言下拉：类型卡下方的独立一行，宽度跟类型卡列宽一致，不铺满弹层 */
.task-form__engine {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 260px;
}

.task-form__engine > span {
  color: var(--el-text-color-regular);
  font-size: 13px;
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

/* 调度配置缺失时的内联错误：贴在字段下面，比 toast 更持久、也更靠近出错位置 */
.task-form__error {
  color: var(--el-color-danger);
  font-size: 12px;
  font-style: normal;
  line-height: 1.5;
}

.task-form__field.is-error > span {
  color: var(--el-color-danger);
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

/* ============ 可操作空态 ============
   .page-empty 系列的定义在 pages/system/src/styles/system-page.css，那是 system 包的
   全局 css（随宿主一次性加载）；job 包只有 scheduler.css，未收录这一组类名，
   且本页样式是 scoped 的，拿不到别的包的全局类，所以此处自带一份最小必要样式，
   取值与 system 包逐条对齐，换包不会走样。 */
.page-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 28px 16px;
  text-align: center;
}
.page-empty__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--el-radius-lg, 12px);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  color: var(--el-color-primary);
}
.page-empty__title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--el-text-color-primary);
}
.page-empty__desc {
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}
.page-empty__actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}

/*
  ReTable 的卡片外壳（描边 / 圆角 / 卡片投影 / focus-within 转主色）已由插件提供，
  页面不再自行补边：见 packages/ui ReTable/shared/table-vars.css 与
  ReTable.vue 的 `.re-table` / `.re-table--separated` 规则。
*/

/* 尊重系统「减少动态效果」偏好：把本页自己的过渡关掉
   （ReTable 的过渡由插件自带的同名媒体查询处理） */
@media (prefers-reduced-motion: reduce) {
  .job-action__more,
  .task-form__type-card {
    transition: none;
  }
}
</style>
