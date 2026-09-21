<!--
  作业执行日志：sys_job_log 的查询与清理（合并后的调度面）。

  一行代表一轮派发到执行的过程记录：采集流程每触发一次写一条，外部作业同理。
  日志行只落处理器 Bean 名和任务编号（后端落库时按 Bean 名回查 sys_job 补 sysJobNo），
  台账任务名称不在日志表里，所以名称列由本页拿台账列表做一次前端关联；作业被删后
  日志仍保留，取不到名称就退回显示处理器/编号。
  过滤框走后端的 beanName 参数，语义是关键字：处理器 Bean 名 / 任务编号 / 台账任务名称 三选一命中。
  清理按保留天数删除，默认与调度平台一致留 30 天。
-->
<script setup lang="ts">
import { computed, onActivated, onDeactivated, onMounted, onUnmounted, reactive, ref } from "vue";
import { msgError, msgInfo } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReInput from "@repo/ui/re-input";
import ReInputNumber from "@repo/ui/re-input-number";
import ReSelect from "@repo/ui/re-select";
import ReSwitch from "@repo/ui/re-switch";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import type { ReOption } from "@repo/ui/re-select";
import type { RePageResult, ReTableColumn, ReTableLoadParams } from "@repo/ui/re-table";
import { cleanupJobLogs, pageJobs, pageJobLogs } from "../api/jobApi";
import type { SysJobLog } from "../types/job";
import { errText, useCollectGated } from "../composables/useCollectView";
import { fmtMs } from "../utils/time";

defineOptions({ name: "CollectJobLog" });

const CODE_OPTIONS: ReOption[] = [
  { label: "成功 SUCCESS", value: "SUCCESS" },
  { label: "失败 FAILURE", value: "FAILURE" },
  { label: "跳过 SKIPPED", value: "SKIPPED" },
];

interface JobLogQuery {
  page: number;
  pageSize: number;
  beanName?: string;
  executeCode?: string;
}

const query = ref<JobLogQuery>({ page: 1, pageSize: 20 });
const draft = reactive({ beanName: "", executeCode: "" });
const retentionDays = ref(30);
const autoRefresh = ref(false);
const tableRef = ref<{ reload: () => void } | null>(null);
let timer: ReturnType<typeof setInterval> | null = null;

const { ready } = useCollectGated();

const detailVisible = ref(false);
const detail = ref<SysJobLog | null>(null);

/** 台账编号 → 任务名称：日志表不存名称，只能拿台账列表关联 */
const jobNames = ref<Record<string, string>>({});

async function loadLedgerNames(): Promise<void> {
  try {
    const ledger = await pageJobs({ pageNum: 1, pageSize: 200 });
    const map: Record<string, string> = {};
    for (const job of ledger.rows) {
      if (job.sysJobNo) {
        map[job.sysJobNo] = job.sysJobName;
      }
    }
    jobNames.value = map;
  } catch {
    // 台账取不到只影响名称列，编号与处理器仍够定位到那一行
    jobNames.value = {};
  }
}

/** 日志行的任务名称：优先台账名，作业已删除时退回处理器或编号 */
function jobNameOf(input: unknown): string {
  const row = (input ?? {}) as { sysJobNo?: string | null; sysJobLogTriggerBean?: string | null };
  const jobNo = row.sysJobNo ?? "";
  return (jobNo ? jobNames.value[jobNo] : "") || row.sysJobLogTriggerBean || jobNo || "—";
}

const columns = computed<ReTableColumn[]>(() => [
  { prop: "sysJobLogNo", label: "日志号", width: 168, slot: "no" },
  { prop: "ledgerJobName", label: "任务名称", minWidth: 150, slot: "jobName", showOverflowTooltip: true },
  { prop: "sysJobLogTriggerBean", label: "处理器", minWidth: 140, showOverflowTooltip: true },
  { prop: "sysJobNo", label: "任务编号", width: 168, slot: "jobNo" },
  { prop: "sysJobLogTriggerType", label: "触发方式", width: 92, align: "center" },
  { prop: "sysJobLogTriggerTime", label: "触发时刻", width: 168, slot: "time" },
  { prop: "sysJobLogExecuteCode", label: "结果", width: 100, slot: "code", align: "center" },
  { prop: "sysJobLogCost", label: "耗时", width: 88, slot: "cost", align: "right" },
  { prop: "sysJobLogTriggerMsg", label: "消息", minWidth: 180, slot: "msg", showOverflowTooltip: true },
  { prop: "action", label: "操作", width: 76, slot: "action", fixed: "right" },
]);

function codeTagType(code: unknown): "success" | "danger" | "warning" | "info" {
  if (code === "SUCCESS") {
    return "success";
  }
  if (code === "FAILURE") {
    return "danger";
  }
  return code ? "warning" : "info";
}

/** 触发时刻：后端把 Date 序列化成毫秒戳，历史行也可能是字符串形态，两种都要能读 */
function timeText(input: unknown): string {
  if (typeof input === "string" && input.trim()) {
    return input.replace("T", " ").slice(0, 19);
  }
  return fmtMs(input);
}

function costText(cost: unknown): string {
  const value = Number(cost ?? 0);
  if (!Number.isFinite(value) || value <= 0) {
    return "—";
  }
  return value < 1000 ? `${value} ms` : `${(value / 1000).toFixed(2)} s`;
}

async function loadLogs({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const result = await pageJobLogs({
    pageNum: page,
    pageSize,
    beanName: params.beanName as string | undefined,
    executeCode: params.executeCode as string | undefined,
  });
  return { total: result.total, data: result.rows as unknown as Record<string, unknown>[] };
}

function search(): void {
  query.value = {
    page: 1,
    pageSize: query.value.pageSize,
    beanName: draft.beanName.trim() || undefined,
    executeCode: draft.executeCode || undefined,
  };
}

function reset(): void {
  draft.beanName = "";
  draft.executeCode = "";
  query.value = { page: 1, pageSize: 20 };
}

function showDetail(input: Record<string, unknown>): void {
  detail.value = input as unknown as SysJobLog;
  detailVisible.value = true;
}

async function clean(): Promise<void> {
  const days = Number(retentionDays.value) || 0;
  if (days <= 0) {
    msgError("保留天数必须大于 0");
    return;
  }
  try {
    msgInfo((await cleanupJobLogs(days)) || "清理完成");
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
    timer = setInterval(() => tableRef.value?.reload(), 5000);
  }
}

onMounted(() => {
  void loadLedgerNames();
});

/** keep-alive 命中后挂载只跑一次，重进页面靠激活钩子取新数据；首次激活交给挂载链 */
let firstActivation = true;
onActivated(() => {
  if (firstActivation) {
    firstActivation = false;
    return;
  }
  void loadLedgerNames();
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
      <ReInput
        v-model="draft.beanName"
        size="small"
        clearable
        placeholder="任务名称 / 编号 / 处理器"
        style="width: 200px"
        @keyup.enter="search"
      />
      <ReSelect
        v-model="draft.executeCode"
        size="small"
        clearable
        placeholder="全部结果"
        :options="CODE_OPTIONS"
        style="width: 150px"
        @update:model-value="search"
      />
      <ReButton size="small" type="primary" icon="Search" @click="search">查询</ReButton>
      <ReButton size="small" @click="reset">重置</ReButton>
      <span class="spacer"/>
      <span class="collect-hint">自动刷新</span>
      <ReSwitch v-model="autoRefresh" size="small" @change="toggleAuto(autoRefresh === true)"/>
      <span class="collect-hint">保留</span>
      <ReInputNumber v-model="retentionDays" size="small" :min="1" :max="3650" controls-position="right" style="width: 110px"/>
      <span class="collect-hint">天</span>
      <ReButton size="small" icon="Delete" @click="clean">清理过期日志</ReButton>
    </div>

    <ReTable
      v-if="ready"
      ref="tableRef"
      class="collect-card"
      table-id="collect-job-log"
      :loader="loadLogs"
      :params="query"
      :columns="columns"
      row-key="sysJobLogNo"
      v-model:page="query.page"
      v-model:page-size="query.pageSize"
      :page-sizes="[10, 20, 50, 100]"
      empty-text="暂无作业执行日志，先去「调度作业」启用一个作业或到任务监控页手动运行流程"
      stripe
    >
      <template #no="{ row }">
        <span class="collect-cell-mono">{{ row.sysJobLogNo }}</span>
      </template>
      <template #jobName="{ row }">
        <span class="collect-cell-ellipsis">{{ jobNameOf(row) }}</span>
      </template>
      <template #jobNo="{ row }">
        <span class="collect-cell-mono">{{ row.sysJobNo || "—" }}</span>
      </template>
      <template #time="{ row }">{{ timeText(row.sysJobLogTriggerTime ?? row.createTime) }}</template>
      <template #code="{ row }">
        <ReTag size="small" :type="codeTagType(row.sysJobLogExecuteCode)" effect="plain">
          {{ row.sysJobLogExecuteCode || "—" }}
        </ReTag>
      </template>
      <template #cost="{ row }">{{ costText(row.sysJobLogCost) }}</template>
      <template #msg="{ row }">
        <span class="collect-cell-ellipsis">{{ row.sysJobLogTriggerMsg || "—" }}</span>
      </template>
      <template #action="{ row }">
        <ReButton size="small" text type="primary" @click="showDetail(row)">详情</ReButton>
      </template>
    </ReTable>

    <ReDialog v-model="detailVisible" title="作业执行日志详情" width="720px" top="8vh" footer-hidden>
      <dl v-if="detail" class="collect-kv">
        <dt>日志号</dt>
        <dd>{{ detail.sysJobLogNo }}</dd>
        <dt>任务名称</dt>
        <dd>{{ jobNameOf(detail) }}</dd>
        <dt>处理器</dt>
        <dd>{{ detail.sysJobLogTriggerBean || "—" }}</dd>
        <dt>任务编号</dt>
        <dd>{{ detail.sysJobNo || "—" }}</dd>
        <dt>应用 / 环境</dt>
        <dd>{{ detail.sysJobLogApp || "—" }} / {{ detail.sysJobLogProfile || "—" }}</dd>
        <dt>触发方式</dt>
        <dd>{{ detail.sysJobLogTriggerType || "—" }}</dd>
        <dt>触发时刻</dt>
        <dd>{{ timeText(detail.sysJobLogTriggerTime ?? detail.createTime) }}</dd>
        <dt>派发码 / 执行码</dt>
        <dd>{{ detail.sysJobLogTriggerCode || "—" }} / {{ detail.sysJobLogExecuteCode || "—" }}</dd>
        <dt>耗时</dt>
        <dd>{{ costText(detail.sysJobLogCost) }}</dd>
        <dt>触发参数</dt>
        <dd>{{ detail.sysJobLogTriggerParam || "—" }}</dd>
        <dt>执行器地址 / 节点</dt>
        <dd>{{ detail.sysJobLogTriggerAddress || "—" }} / {{ detail.sysJobLogNodeId || "—" }}</dd>
        <dt>消息</dt>
        <dd>{{ detail.sysJobLogTriggerMsg || "—" }}</dd>
        <dt>日志文件</dt>
        <dd>{{ detail.sysJobLogFilePath || "—" }}</dd>
      </dl>
    </ReDialog>
  </div>
</template>
