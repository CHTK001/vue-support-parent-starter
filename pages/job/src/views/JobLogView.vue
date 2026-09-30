<!--
  调度执行日志：job-starter 落库的 sys_job_log 查询面。

   一行代表一轮派发：定时命中、手动触发或采集流程运行都会写一条。日志行只存 jobKey（处理器名 /
   collect-flow-<流程ID>），不存任务名称，所以本页拿一次台账做 jobKey → 名称 的关联，同时给
   「任务」过滤项提供下拉数据；台账行被删掉后日志仍然保留，取不到名称就退回显示 jobKey。
   从调度工作台行内「查看日志」跳来时带 jobKey 查询参数，进页即落到该任务的筛选上。

   过滤条件全部是后端 JobLogQuery 的原生字段：keyword 一个参数同时命中 jobKey / 任务编号 / 节点 /
   结果说明；时间上有两条路——预设时间窗（rangeDays 换算成 startTime）与自定义日期区间
   （customRange 的 [开始, 结束] 按本地日界展开成闭区间），自定义区间优先，都不用页面自己推导时区。
   清理按保留天数删除，0 表示清空全部，与工作台上的「清理 30 天前日志」是同一个接口。

   台账映射分页拉全（后端单页上限 500，超过就换页累积），台账行数不会再让后面的任务名从下拉里消失；
   「导出 CSV」按当前筛选条件分页拉全后交给 @repo/ui 的导出能力落盘，导的是整个结果集而非当前页。
-->
<script setup lang="ts">
import { computed, onActivated, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { msgError, msgInfo } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReIcon from "@repo/ui/re-icon";
import ReInputNumber from "@repo/ui/re-input-number";
import ReStatCard from "@repo/ui/re-stat-card";
import ReSwitch from "@repo/ui/re-switch";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import ReTime from "@repo/ui/re-time";
import type { ReOption } from "@repo/ui/re-select";
import { useTableExport } from "@repo/ui/re-table";
import type { RePageResult, ReTableColumn, ReTableLoadParams, ReTableSearchConfig } from "@repo/ui/re-table";
import { cleanupJobLogs, getSummary, pageJobLogs, pageJobs, readJobLogContent } from "../api/jobApi";
import { costMs, statusTagType, statusText, triggerTagType, triggerText } from "../constants/taskStatus";
import { COLLECT_FLOW_GROUP, type JobLog, type JobLogContent, type JobSummary } from "../types/job";
import { confirmAction, errText } from "../composables/useCollectView";
import { fmtMs } from "../utils/time";

defineOptions({ name: "CollectJobLog" });

const route = useRoute();
const router = useRouter();

const DAY_MS = 24 * 60 * 60 * 1000;

const CODE_OPTIONS: ReOption[] = [
  { label: "成功 SUCCESS", value: "SUCCESS" },
  { label: "失败 FAILURE", value: "FAILURE" },
  { label: "跳过 SKIPPED", value: "SKIPPED" },
];

/** 时间窗：value 是天数，0/空 表示不限，loader 里换算成 startTime */
const RANGE_OPTIONS: ReOption[] = [
  { label: "不限", value: "" },
  { label: "最近 1 小时", value: -1 },
  { label: "今天", value: 1 },
  { label: "近 3 天", value: 3 },
  { label: "近 7 天", value: 7 },
  { label: "近 30 天", value: 30 },
];

/** 分页快照：page/pageSize 由 ReTable 同步，过滤条件走内置搜索区 */
const query = ref({ page: 1, pageSize: 20 });

/**
 * 从调度工作台「查看日志」跳转带过来的 jobKey：作为搜索区初值，首次进入即按该任务过滤。
 * 只读一次而不清 query，保证直接刷新地址仍保持同一筛选；缓存命中时由 onActivated 再接管。
 */
const routedJobKey = typeof route.query.jobKey === "string" ? route.query.jobKey.trim() : "";

/** 内置搜索区的实时草稿值 */
const searchModel = ref<Record<string, unknown>>({
  keyword: "",
  executeCode: "",
  jobKey: routedJobKey,
  rangeDays: "",
  customRange: null,
});

const tableRef = ref<{ reload: () => void; goto: (page?: number) => void } | null>(null);
const summary = ref<JobSummary | null>(null);
const retentionDays = ref(30);
const hitTotal = ref(0);
const exporting = ref(false);

/** 导出复用 @repo/ui 的 CSV 能力：这里只拼数据与列标题，编码 / BOM / 下载都交给它 */
const { exportToCsv } = useTableExport({ enabled: true });

const detailVisible = ref(false);
const detail = ref<JobLog | null>(null);

/**
 * 「查看日志」弹层：读的是这一轮执行落的完整日志文件，不是日志行里那段截断的结果说明。
 *
 * 文件日志没开（或文件已被清理）时 exists=false，弹层据此显示原因，而不是显示空白
 * ——空白会被读成「这一轮没打日志」。
 */
const logContentVisible = ref(false);
const logContentLoading = ref(false);
const logContent = ref<JobLogContent | null>(null);
const logContentJob = ref<JobLog | null>(null);

/** 台账 jobKey → 任务名称：日志表不存名称，只能拿台账列表关联 */
const jobNames = ref<Record<string, string>>({});
const taskOptions = computed<ReOption[]>(() => {
  const options: ReOption[] = Object.entries(jobNames.value).map(([jobKey, name]) => ({
    label: name === jobKey ? jobKey : `${name} · ${jobKey}`,
    value: jobKey,
  }));
  // 「查看日志」下钻带来的 jobKey 可能不在台账选项里（台账异步加载还没回来，或任务已被删），
  // 而 el-select 对「值没有匹配选项」会直接清掉选中值 —— 那样首次进入就过滤不上，
  // 明明带了 jobKey 却显示「全部任务」。这里把它并进选项，保证选中态成立。
  if (routedJobKey && !options.some((item) => item.value === routedJobKey)) {
    options.unshift({ label: routedJobKey, value: routedJobKey });
  }
  return options;
});

const SEARCH = computed<ReTableSearchConfig>(() => ({
  title: "搜索日志",
  filters: [
    { key: "keyword", label: "关键字", type: "input", placeholder: "任务 / 编号 / 节点 / 说明" },
    { key: "jobKey", label: "任务", type: "select", placeholder: "全部任务", options: taskOptions.value },
    { key: "executeCode", label: "结果", type: "select", placeholder: "全部结果", options: CODE_OPTIONS },
    { key: "rangeDays", label: "时间窗", type: "select", placeholder: "不限", options: RANGE_OPTIONS },
    {
      key: "customRange",
      label: "自定义区间",
      type: "daterange",
      placeholder: "开始日期",
      attrs: { style: "width: 240px" },
    },
  ],
}));

const columns = computed<ReTableColumn[]>(() => [
  { prop: "triggerTime", label: "触发时刻", width: 160, slot: "time" },
  { prop: "jobKey", label: "任务", minWidth: 190, slot: "job", showOverflowTooltip: true },
  { prop: "triggerType", label: "触发方式", width: 88, slot: "trigger", align: "center" },
  { prop: "executeCode", label: "结果", width: 88, slot: "code", align: "center" },
  { prop: "costMs", label: "耗时", width: 110, slot: "cost", align: "right" },
  { prop: "message", label: "消息", minWidth: 220, slot: "msg", showOverflowTooltip: true },
  { prop: "nodeId", label: "节点", width: 120, slot: "node", showOverflowTooltip: true },
  { prop: "address", label: "运行客户端", width: 132, slot: "client", showOverflowTooltip: true },
  { prop: "action", label: "操作", maxWidth: 120, slot: "action", fixed: "right" },
]);

const kpis = computed(() => {
  const s = summary.value;
  return [
    {
      key: "hit",
      title: "当前条件命中",
      value: hitTotal.value.toLocaleString("zh-CN"),
      desc: `每页 ${query.value.pageSize} 条`,
      icon: "Tickets",
      color: "var(--el-color-primary)",
    },
    {
      key: "fail",
      title: "24 小时失败",
      value: String(s?.recentFailures ?? 0),
      desc: (s?.recentFailures ?? 0) > 0 ? "点「结果=失败」定位这一批" : "暂无失败派发",
      icon: "WarningFilled",
      color: (s?.recentFailures ?? 0) > 0 ? "var(--el-color-danger)" : "var(--el-color-info)",
    },
    {
      key: "job",
      title: "台账任务",
      value: String(s?.totalJobs ?? 0),
      desc: `启用 ${s?.runningJobs ?? 0} · 未注册 ${s?.unregisteredJobs ?? 0}`,
      icon: "AlarmClock",
      color: "var(--el-color-success)",
    },
    {
      key: "node",
      title: "本节点",
      value: s?.leader ? "Leader" : "Follower",
      desc: `${s?.role ?? "—"} 角色 · 执行器 ${s?.registeredHandlers ?? 0} 个`,
      icon: "Cpu",
      color: s?.leader ? "var(--el-color-primary)" : "var(--el-color-warning)",
    },
  ];
});

/** 时间窗 → 触发时刻下界（毫秒）；-1 是「最近 1 小时」的特殊值 */
function startOfRange(days: unknown): number | undefined {
  const value = Number(days ?? "");
  if (!Number.isFinite(value) || value === 0) {
    return undefined;
  }
  if (value < 0) {
    return Date.now() - 60 * 60 * 1000;
  }
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start.getTime() - (value - 1) * DAY_MS;
}

/** 日志行的任务名称：优先台账名，作业已删除时退回 jobKey */
function jobNameOf(row: JobLog): string {
  const key = row.jobKey ?? "";
  return jobNames.value[key] || key || "—";
}

function isFlowKey(row: JobLog): boolean {
  return row.jobKey?.startsWith(`${COLLECT_FLOW_GROUP}-`) === true;
}

/**
 * 台账 jobKey → 任务名称映射：日志表不存名称，只能拿台账列表关联。
 *
 * 台账分页拉全而不是只取一页 500：后端单页上限就是 500，台账超过 500 行时
 * 后面的任务名会从下拉与列表里凭空消失。这里按页累积，最多 LEDGER_MAX_PAGES 页
 * （单页上限的 20 倍），台账异常膨胀时不至于把日志页拖垮；中途失败保留已取到的部分。
 */
const LEDGER_PAGE_SIZE = 500;
const LEDGER_MAX_PAGES = 20;

async function loadLedger(): Promise<void> {
  const map: Record<string, string> = {};
  try {
    for (let pageNum = 1; pageNum <= LEDGER_MAX_PAGES; pageNum++) {
      const page = await pageJobs({ pageNum, pageSize: LEDGER_PAGE_SIZE });
      const rows = Array.isArray(page?.data) ? page.data : [];
      for (const job of rows) {
        if (job.jobKey) {
          map[job.jobKey] = job.jobName || job.jobKey;
        }
      }
      const total = Number(page?.total ?? 0);
      if (rows.length < LEDGER_PAGE_SIZE || pageNum * LEDGER_PAGE_SIZE >= total) {
        break;
      }
    }
  } catch {
    // 台账取不到只影响名称列与任务下拉，关键字仍能定位；已取到的部分保留
  }
  jobNames.value = map;
}

async function loadSummary(): Promise<void> {
  try {
    summary.value = await getSummary();
  } catch {
    // 概览取不到不打断日志列表
  }
}

/**
 * 解析时间范围：自定义区间优先于预设时间窗。
 *
 * 自定义区间的值是 daterange 组件的 [开始日期, 结束日期]（YYYY-MM-DD），按本地日界展开成
 * [当天 00:00:00, 结束当天 23:59:59.999] 的毫秒闭区间；未选自定义时回落到预设时间窗。
 *
 * @param params 搜索区参数
 * @returns 触发时刻的起止毫秒，未限定的一端不返回
 */
function resolveRange(params: Record<string, unknown>): { startTime?: number; endTime?: number } {
  const custom = params.customRange;
  if (Array.isArray(custom) && custom.length >= 2 && custom[0] && custom[1]) {
    const start = new Date(`${custom[0]}T00:00:00`).getTime();
    const end = new Date(`${custom[1]}T23:59:59`).getTime() + 999;
    if (Number.isFinite(start) && Number.isFinite(end)) {
      return { startTime: start, endTime: end };
    }
  }
  return { startTime: startOfRange(params.rangeDays) };
}

async function loadLogs({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const result = await pageJobLogs({
    pageNum: page,
    pageSize,
    keyword: params.keyword as string | undefined,
    jobKey: params.jobKey as string | undefined,
    executeCode: params.executeCode as string | undefined,
    ...resolveRange(params),
  });
  const rows = Array.isArray(result?.data) ? result.data : [];
  hitTotal.value = Number(result?.total ?? 0);
  return { total: hitTotal.value, data: rows as unknown as Record<string, unknown>[] };
}

async function reloadAll(): Promise<void> {
  await Promise.all([Promise.resolve(tableRef.value?.reload()), loadSummary(), loadLedger()]);
}

function showDetail(input: Record<string, unknown>): void {
  detail.value = input as unknown as JobLog;
  detailVisible.value = true;
}

/**
 * 打开「查看日志」弹层并拉取这一轮的完整日志正文。
 *
 * 日志行只存结果说明（截断在 4000 字符），完整正文在每次执行一个的文件里，
 * 路径由日志行的 filePath 给出。没有 filePath 说明本节点没开文件日志，
 * 不必发请求，直接给出原因更省事也更清楚。
 *
 * @param input 当前行
 */
async function showLogContent(input: Record<string, unknown>): Promise<void> {
  const row = input as unknown as JobLog;
  logContentJob.value = row;
  logContent.value = null;
  logContentVisible.value = true;
  if (!row.filePath) {
    return;
  }
  logContentLoading.value = true;
  try {
    logContent.value = await readJobLogContent(row.filePath);
  } catch (error) {
    msgError(errText(error));
  } finally {
    logContentLoading.value = false;
  }
}

async function clean(): Promise<void> {
  const days = Number(retentionDays.value) || 0;
  const message = days === 0
    ? "确认清空全部作业执行日志？该操作不可恢复。"
    : `确认删除 ${days} 天前的作业执行日志？`;
  if (!(await confirmAction(message, "清理作业日志"))) {
    return;
  }
  try {
    const removed = await cleanupJobLogs(days);
    msgInfo(`已清理 ${removed ?? 0} 条作业日志`);
    await reloadAll();
  } catch (error) {
    msgError(errText(error));
  }
}

/** 导出列与表头：与页面列一致，时刻转可读文本、任务列用台账名 */
const EXPORT_COLUMNS = [
  "triggerTime", "jobName", "jobKey", "triggerType", "executeCode", "costMs", "message", "nodeId", "jobNo",
];
const EXPORT_TITLES: Record<string, string> = {
  triggerTime: "触发时刻",
  jobName: "任务",
  jobKey: "任务键",
  triggerType: "触发方式",
  executeCode: "结果",
  costMs: "耗时(ms)",
  message: "消息",
  nodeId: "节点",
  jobNo: "业务编号",
};

/** 导出单页上限与最多拉取的页数：避免"导出"被理解成"把整张日志表读进浏览器" */
const EXPORT_PAGE_SIZE = 200;
const EXPORT_MAX_PAGES = 50;

/**
 * 导出当前筛选条件下的全部日志为 CSV。
 *
 * 按当前搜索条件分页拉全（不受列表当前页限制），到上限仍在增长时只导出已取部分并如实说明，
 * 不做静默截断。筛选换算与列表 loader 同一套（startOfRange / jobNameOf），避免两处口径漂移。
 */
async function exportLogs(): Promise<void> {
  if (exporting.value) {
    return;
  }
  exporting.value = true;
  try {
    const params = searchModel.value;
    const range = resolveRange(params);
    const rows: JobLog[] = [];
    let truncated = false;
    for (let pageNum = 1; pageNum <= EXPORT_MAX_PAGES; pageNum++) {
      const page = await pageJobLogs({
        pageNum,
        pageSize: EXPORT_PAGE_SIZE,
        keyword: params.keyword as string | undefined,
        jobKey: params.jobKey as string | undefined,
        executeCode: params.executeCode as string | undefined,
        ...range,
      });
      const data = Array.isArray(page?.data) ? page.data : [];
      rows.push(...data);
      if (data.length < EXPORT_PAGE_SIZE) {
        break;
      }
      if (pageNum === EXPORT_MAX_PAGES && rows.length < Number(page?.total ?? 0)) {
        truncated = true;
      }
    }
    if (!rows.length) {
      msgInfo("当前条件没有可导出的日志");
      return;
    }
    const flat = rows.map(row => ({
      ...row,
      jobName: jobNameOf(row),
      triggerTime: fmtMs(row.triggerTime),
    }));
    await exportToCsv(flat, {
      filename: `job-log-${fmtMs(Date.now()).replace(/[: ]/g, "-")}`,
      columns: EXPORT_COLUMNS,
      columnTitles: EXPORT_TITLES,
    });
    msgInfo(`已导出 ${rows.length} 条日志${truncated ? `（到导出上限，仅前 ${rows.length} 条）` : ""}`);
  } catch (error) {
    msgError(errText(error));
  } finally {
    exporting.value = false;
  }
}

/**
 * keep-alive 命中后挂载只跑一次，重进页面靠激活钩子取新数据。
 *
 * 自动刷新交给 ReTable 的 autoRefresh（见模板）：定时器与开关都由它按 keep-alive
 * 激活态自己启停。页面不再自建 setInterval —— 两套定时器会各刷一遍，而且页面这套
 * 拿不到组件的激活态，停止时机必然错。
 */
let firstActivation = true;
onActivated(() => {
  // 从工作台「查看日志」跳来：带 jobKey 时先把搜索区切到该任务再取数，随后抹掉 query 防止重复套用
  const incoming = typeof route.query.jobKey === "string" ? route.query.jobKey.trim() : "";
  if (incoming && incoming !== String(searchModel.value.jobKey ?? "")) {
    searchModel.value = { ...searchModel.value, jobKey: incoming };
    void router.replace({ path: route.path, query: {} });
    void reloadAll();
    return;
  }
  if (firstActivation) {
    firstActivation = false;
    void Promise.all([loadSummary(), loadLedger()]);
    return;
  }
  void reloadAll();
});
</script>

<template>
  <div class="collect-page job-log ">
    <div class="collect-stats">
      <ReStatCard
        size="compact"
        v-for="item in kpis"
        :key="item.key"
        :title="item.title"
        :value="item.value"
        :desc="item.desc"
      >
        <template #icon>
          <ReIcon :name="item.icon" :size="16" :style="{ color: item.color }"/>
        </template>
      </ReStatCard>
    </div>

    <ReTable
      ref="tableRef"
      class="collect-card"
      table-id="collect-job-log"
      :loader="loadLogs"
      :params="query"
      :columns="columns"
      row-key="logId"
      v-model:page="query.page"
      v-model:page-size="query.pageSize"
      v-model:search-model="searchModel"
      :search="SEARCH"
      :auto-refresh="{ interval: 5000 }"
      :page-sizes="[20, 50, 100, 200]"
      empty-text="还没有派发记录，去「调度工作台」启用一个任务或手动触发一次"
      stripe
      @search="query.page !== 1 && tableRef?.goto(1)"
      @search-reset="tableRef?.goto(1)"
    >
      <template #toolbar>
        <span class="collect-hint">保留</span>
        <ReInputNumber v-model="retentionDays"  :min="0" :max="3650" controls-position="right"
                       style="width: 104px" aria-label="日志保留天数"/>
        <span class="collect-hint collect-hint--muted">{{ retentionDays === 0 ? "天（0=清空全部）" : "天" }}</span>
        <ReButton icon="Delete" type="danger" title="按保留天数清理日志" @click="clean">按保留天数清理日志</ReButton>
        <ReButton
          icon="Download"
          :loading="exporting"
          :disabled="exporting"
          title="把当前筛选条件下的日志导出为 CSV"
          @click="exportLogs"
        >
          导出 CSV
        </ReButton>
      </template>

      <!--
        可操作空态：默认的 el-empty 只能看不能做。
        执行日志由调度器在派发时写入，管理端造不出来，所以只给一个「刷新」出口，不给「新增」。
        「刷新」复用 reloadAll：它同时重取列表 / 概览 / 台账映射，正是本页一次刷新该做的事。
        empty-text 属性保留不动，它仍是 #empty 插槽 description 的回退值。
      -->
      <template #empty>
        <div class="page-empty">
          <span class="page-empty__icon"><ReIcon name="Tickets" :size="22" /></span>
          <span class="page-empty__title">还没有执行日志</span>
          <span class="page-empty__desc">作业执行日志在这里按轮次记录；启用一个任务或手动触发一次后就会写入。</span>
          <span class="page-empty__actions">
            <ReButton icon="Refresh" @click="reloadAll">刷新</ReButton>
          </span>
        </div>
      </template>

      <template #time="{ row }"><span class="collect-num">{{ fmtMs(row.triggerTime) }}</span></template>
      <template #job="{ row }">
        <span>{{ jobNameOf(row as unknown as JobLog) }}</span>
        <ReTag v-if="isFlowKey(row as unknown as JobLog)" class="collect-tag-inline"  type="primary" effect="plain">
          采集流程
        </ReTag>
      </template>
      <template #trigger="{ row }">
        <ReTag  :type="triggerTagType(row.triggerType)" effect="plain">
          {{ triggerText(row.triggerType) }}
        </ReTag>
      </template>
      <template #code="{ row }">
        <ReTag :type="statusTagType(row.executeCode)" effect="plain" dot>
          {{ statusText(row.executeCode) }}
        </ReTag>
      </template>
      <template #cost="{ row }">
        <ReTag type="info" effect="plain">
          <ReTime :value="costMs(row.costMs)" format="duration" placeholder="—" />
        </ReTag>
      </template>
      <template #msg="{ row }">
        <span class="collect-cell-ellipsis">{{ row.message || "—" }}</span>
      </template>
      <template #node="{ row }"><span class="collect-cell-mono">{{ row.nodeId || "—" }}</span></template>
      <template #client="{ row }">
        <span class="collect-cell-mono">{{ row.address || "—" }}</span>
      </template>
      <template #action="{ row }">
        <ReButton layout="square" icon="View" type="primary" tip="查看这条日志的完整字段" @click="showDetail(row)"/>
        <ReButton layout="square" icon="Document" tip="查看这一轮执行的完整日志" @click="showLogContent(row)"/>
      </template>
    </ReTable>

    <ReDialog v-model="detailVisible" title="执行日志详情" width="660px" top="8vh">
      <div v-if="detail" class="log-detail">
        <h4 class="log-detail__title">基本信息</h4>
        <div class="log-detail__grid">
          <div class="log-detail__cell">
            <span class="log-detail__label">日志号</span>
            <span class="log-detail__value collect-cell-mono">{{ detail.logId }}</span>
          </div>
          <div class="log-detail__cell">
            <span class="log-detail__label">任务</span>
            <span class="log-detail__value">
              {{ jobNameOf(detail) }}
              <ReTag
                v-if="isFlowKey(detail)"
                class="collect-tag-inline"
                
                type="primary"
                effect="plain"
              >
                采集流程
              </ReTag>
            </span>
          </div>
          <div class="log-detail__cell">
            <span class="log-detail__label">任务键</span>
            <span class="log-detail__value collect-cell-mono">{{ detail.jobKey || "—" }}</span>
          </div>
          <div class="log-detail__cell">
            <span class="log-detail__label">业务编号</span>
            <span class="log-detail__value collect-cell-mono">{{ detail.jobNo || "—" }}</span>
          </div>
          <div class="log-detail__cell log-detail__cell--wide">
            <span class="log-detail__label">应用 / 节点</span>
            <span class="log-detail__value">{{ detail.app || "—" }} / {{ detail.nodeId || "—" }}</span>
          </div>
          <div class="log-detail__cell">
            <span class="log-detail__label">触发方式</span>
            <span class="log-detail__value">{{ triggerText(detail.triggerType) }}</span>
          </div>
          <div class="log-detail__cell">
            <span class="log-detail__label">触发时刻</span>
            <span class="log-detail__value collect-num">{{ fmtMs(detail.triggerTime) }}</span>
          </div>
          <div class="log-detail__cell">
            <span class="log-detail__label">派发码 / 执行码</span>
            <span class="log-detail__value">
              <span class="collect-cell-mono">{{ detail.triggerCode || "—" }}</span>
              <!-- 详情里的执行码是这一屏的结论，dark 底强调保留，只补状态点统一语义 -->
              <ReTag
                class="collect-tag-inline"
                dot
                :type="statusTagType(detail.executeCode)"
                effect="dark"
              >
                {{ statusText(detail.executeCode) }}
              </ReTag>
            </span>
          </div>
          <div class="log-detail__cell">
            <span class="log-detail__label">耗时</span>
            <span class="log-detail__value collect-num">
              <ReTime :value="costMs(detail.costMs)" format="duration" placeholder="—" />
            </span>
          </div>
          <div class="log-detail__cell">
            <span class="log-detail__label">触发参数</span>
            <span class="log-detail__value collect-cell-mono">{{ detail.executeParam || "—" }}</span>
          </div>
          <div class="log-detail__cell">
            <span class="log-detail__label">日志文件</span>
            <span class="log-detail__value collect-cell-mono">{{ detail.filePath || "—" }}</span>
          </div>
          <div class="log-detail__cell">
            <span class="log-detail__label">运行客户端</span>
            <span class="log-detail__value collect-cell-mono">{{ detail.address || "—" }}</span>
          </div>
        </div>

        <h4 class="log-detail__title">执行消息</h4>
        <pre class="log-detail__message">{{ detail.message || "（无执行消息）" }}</pre>
        <div class="log-detail__footer">
          <ReButton icon="Document" @click="showLogContent(detail as unknown as Record<string, unknown>)">
            查看完整日志
          </ReButton>
        </div>
      </div>

    </ReDialog>

    <!--
      完整日志正文弹层：读的是这一轮执行落的日志文件，不是上面那段截断的结果说明。
      三种「看不到正文」的成因要分开说——没开文件日志 / 文件已被清理 / 读取中，
      统一显示空白会被读成「这一轮没打日志」。
    -->
    <ReDialog v-model="logContentVisible" title="执行日志正文" width="820px" top="6vh">
      <div class="log-content">
        <div class="log-content__meta">
          <span class="log-content__label">任务</span>
          <span class="log-content__value collect-cell-mono">{{ logContentJob?.jobKey || "—" }}</span>
        </div>
        <div class="log-content__meta">
          <span class="log-content__label">日志文件</span>
          <span class="log-content__value collect-cell-mono">
            {{ logContent?.filePath || logContentJob?.filePath || "—" }}
          </span>
        </div>
        <div v-if="logContentLoading" class="log-content__hint">正在读取日志…</div>
        <div v-else-if="!logContentJob?.filePath" class="log-content__hint">
          这一轮没有落日志文件：本节点的文件日志开关（plugin.job.log.enabled）未启用。
          启用后新产生的执行才会有完整日志正文。
        </div>
        <div v-else-if="!logContent" class="log-content__hint">日志未读取，请重新打开。</div>
        <div v-else-if="!logContent.exists" class="log-content__hint">
          日志文件不存在或本节点读不到：可能已被日志清理策略删除，或该次执行发生在文件日志启用之前。
        </div>
        <template v-else>
          <div v-if="logContent.truncated" class="log-content__hint log-content__hint--warn">
            文件超过读取上限，下面只显示尾部。
          </div>
          <pre class="log-content__body">{{ logContent.content }}</pre>
        </template>
      </div>
    </ReDialog>
  </div>
</template>

<style scoped>
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
  ReTable 的卡片外壳（描边 / 圆角 / 底色 / focus-within 转主色）已由插件提供，
  见 packages/ui ReTable/shared/table-vars.css 与 ReTable.vue 的
  `.re-table` / `.re-table--separated` 规则。本页只保留一条与布局强相关的覆盖：
*/
:deep(.re-table) {
  /*
   * 不吃剩余高度：.collect-page 是 height:100% 的 flex 列，ReTable 默认 flex:1 会被
   * 压到容器高度、表体内容溢出，而页面 overflow 是 visible —— 结果就是下方数据与
   * 分页条都看不到。改成表格按内容自然撑开，由 .job-log 纵向滚动。
   */
  flex: 0 0 auto;
}
.job-log {
  overflow-y: auto;
}
/* 顶部统计卡不能跟着被压扁，固定按内容高度 */
.job-log .collect-stats {
  flex: none;
}

.log-detail {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.log-detail__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--el-text-color-primary);
}

/* 单元格之间用 1px gap + 底色当作分隔线，两个方向都均匀，不用逐格写边框 */
.log-detail__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  overflow: hidden;
  background: var(--el-border-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md);
}

.log-detail__cell {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: baseline;
  gap: 12px;
  min-width: 0;
  padding: 10px 14px 10px 16px;
  background: var(--el-bg-color-overlay);
}

/* 每格左侧的主色竖条，是这套详情卡片的识别特征 */
.log-detail__cell::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: var(--el-color-primary);
}

.log-detail__cell--wide {
  grid-column: 1 / -1;
}

.log-detail__label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.log-detail__value {
  min-width: 0;
  font-size: 13px;
  color: var(--el-text-color-primary);
  overflow-wrap: anywhere;
}

/*
 * 消息用反转面板：底色取主文本色、文字取页面底色，亮色下是深色控制台、暗色下自动翻成浅色，
 * 全程只用 koi 的 --el-* 变量，不引入主题外的固定色。
 */
.log-detail__message {
  margin: 0;
  padding: 14px 16px;
  max-height: 260px;
  overflow: auto;
  border-radius: var(--el-radius-md);
  background: var(--el-text-color-primary);
  color: var(--el-bg-color);
  font-family: var(--cc-font-num);
  font-size: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.log-detail__footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

/* ============ 完整日志正文弹层 ============
   正文可能很长（上限 512KB），必须限高 + 自滚，否则弹层会把整页顶开。 */
.log-content__meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 6px;
}
.log-content__label {
  flex: none;
  width: 64px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.log-content__value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.log-content__hint {
  padding: 10px 12px;
  border-radius: var(--el-radius-md);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.7;
}
.log-content__hint--warn {
  margin-bottom: 8px;
  color: var(--el-color-warning);
}
.log-content__body {
  margin: 8px 0 0;
  padding: 14px 16px;
  max-height: 62vh;
  overflow: auto;
  border-radius: var(--el-radius-md);
  background: var(--el-text-color-primary);
  color: var(--el-bg-color);
  font-family: var(--cc-font-num);
  font-size: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

/* 尊重系统「减少动态效果」偏好：
   ReTable 的过渡已由插件自带的同名媒体查询处理，本页不再代管。 */
</style>
