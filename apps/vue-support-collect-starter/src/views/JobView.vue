<!--
  调度作业台：sys_job 台账的统一运维入口（合并后的调度面）。

  台账里两类行待遇不同：
  - 分组 collect-flow 的行是采集流程的台账镜像，cron 与生命周期归流程管，
    这里只给「启停 / 立即运行 / 去画布」，且一律调采集接口，避免两处写同一张表；
  - 其余是外部作业，走 /job-console/api/** 的通用台账接口做增删改与启停触发。

  「立即触发」只是把下次触发时刻改写成当前时间，停用的作业不会被派发，
  因此停用行的触发按钮禁用；下次触发时刻同理，停用时残留的旧值不展示。
-->
<script setup lang="ts">
import { computed, onActivated, onDeactivated, onUnmounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { msgError, msgInfo, msgSuccess } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReCron from "@repo/ui/re-cron";
import ReDialog from "@repo/ui/re-dialog";
import ReInput from "@repo/ui/re-input";
import ReInputNumber from "@repo/ui/re-input-number";
import ReSelect from "@repo/ui/re-select";
import ReSwitch from "@repo/ui/re-switch";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import type { ReOption } from "@repo/ui/re-select";
import type { RePageResult, ReTableColumn, ReTableLoadParams } from "@repo/ui/re-table";
import { cleanupJobLogs, createJob, deleteJob, pageJobs, startJob, stopJob, triggerJob, updateJob } from "../api/jobApi";
import { runFlow, setFlowStatus } from "../api/collectApi";
import { COLLECT_FLOW_GROUP, type SysJob, type SysJobSave } from "../types/job";
import { confirmAction, errText, useCollectGated } from "../composables/useCollectView";
import { openFlowOnCanvas } from "../composables/useCanvasTarget";
import { fmtMs } from "../utils/time";

defineOptions({ name: "CollectJob" });

/** 台账查询条件快照：整体替换，ReTable 靠引用变化决定是否重载 */
interface JobQuery {
  page: number;
  pageSize: number;
  sysJobName?: string;
  sysJobTriggerStatus?: number;
}

const STATUS_OPTIONS: ReOption[] = [
  { label: "启用中", value: 1 },
  { label: "已停用", value: 0 },
];

const SCHEDULE_OPTIONS: ReOption[] = [
  { label: "CRON 表达式", value: "CRON" },
  { label: "固定间隔（毫秒）", value: "FIXED" },
  { label: "不自动调度", value: "NONE" },
];

const MISFIRE_OPTIONS: ReOption[] = [
  { label: "错过不补跑", value: "DO_NOTHING" },
  { label: "错过补跑一次", value: "FIRE_ONCE_NOW" },
];

const query = ref<JobQuery>({ page: 1, pageSize: 20 });
const draft = reactive({ sysJobName: "", sysJobTriggerStatus: "" as string | number });
const tableRef = ref<{ reload: () => void } | null>(null);
const busyNo = ref("");
const autoRefresh = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

const { ready } = useCollectGated();
const router = useRouter();

const formVisible = ref(false);
const formMode = ref<"create" | "edit">("create");
const formJobNo = ref("");
const cronBroken = ref(false);
const form = reactive<SysJobSave>({
  sysJobName: "",
  sysJobGroup: "",
  sysJobScheduleType: "CRON",
  sysJobScheduleTime: "",
  sysJobExecuteBean: "",
  sysJobExecuteParam: "",
  sysJobDesc: "",
  sysJobFailRetry: 0,
  sysJobExecuteTimeout: 0,
  sysJobExecuteMisfireStrategy: "DO_NOTHING",
  sysJobTriggerStatus: 0,
});

const columns = computed<ReTableColumn[]>(() => [
  { prop: "sysJobNo", label: "任务编号", width: 168, slot: "no" },
  { prop: "sysJobName", label: "任务名称", minWidth: 150, slot: "name", showOverflowTooltip: true },
  { prop: "sysJobScheduleType", label: "调度", width: 190, slot: "schedule" },
  { prop: "sysJobExecuteBean", label: "执行器", minWidth: 150, slot: "executor", showOverflowTooltip: true },
  { prop: "sysJobTriggerStatus", label: "状态", width: 82, slot: "status", align: "center" },
  { prop: "sysJobTriggerNextTime", label: "下次触发", width: 168, slot: "next" },
  { prop: "sysJobTriggerLastTime", label: "最近触发", width: 168, slot: "last" },
  { prop: "sysJobFailRetry", label: "重试/超时", width: 92, slot: "guards", align: "center" },
  { prop: "action", label: "操作", width: 232, slot: "action", fixed: "right" },
]);

function isFlowRow(job: SysJob): boolean {
  return job.sysJobGroup === COLLECT_FLOW_GROUP;
}

/** 台账行回到流程：优先用执行参数里的流程 ID，退回按 collect-flow-<id> 约定解析 */
function flowIdOf(job: SysJob): number {
  const fromParam = Number(job.sysJobExecuteParam);
  if (Number.isFinite(fromParam) && fromParam > 0) {
    return fromParam;
  }
  const matched = /(\d+)$/.exec(job.sysJobExecuteBean ?? "");
  return matched ? Number(matched[1]) : 0;
}

function scheduleText(job: SysJob): string {
  if (job.sysJobScheduleType === "NONE" || !job.sysJobScheduleTime) {
    return "不自动调度";
  }
  if (job.sysJobScheduleType === "CRON") {
    return `CRON · ${job.sysJobScheduleTime}`;
  }
  return `${job.sysJobScheduleType} · ${job.sysJobScheduleTime}ms`;
}

async function reload(): Promise<void> {
  tableRef.value?.reload();
}

async function loadJobs({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const result = await pageJobs({
    pageNum: page,
    pageSize,
    sysJobName: params.sysJobName as string | undefined,
    sysJobTriggerStatus: params.sysJobTriggerStatus as number | undefined,
  });
  return { total: result.total, data: result.rows as unknown as Record<string, unknown>[] };
}

/** 台账行回到所属流程：登记目标后跳画布，画布挂载/激活时取走 */
function goDesigner(job: SysJob): void {
  const flowId = flowIdOf(job);
  if (!flowId) {
    msgError("台账行缺少流程 ID，无法跳转");
    return;
  }
  openFlowOnCanvas(flowId);
  void router.push({ path: "/collect/design" });
}

function search(): void {
  query.value = {
    page: 1,
    pageSize: query.value.pageSize,
    sysJobName: draft.sysJobName.trim() || undefined,
    sysJobTriggerStatus: draft.sysJobTriggerStatus === "" ? undefined : Number(draft.sysJobTriggerStatus),
  };
}

function reset(): void {
  draft.sysJobName = "";
  draft.sysJobTriggerStatus = "";
  query.value = { page: 1, pageSize: 20 };
}

/** 一次只让一行在飞，避免连点把台账状态打乱 */
async function withRow(job: SysJob, action: () => Promise<unknown>): Promise<void> {
  if (busyNo.value) {
    return;
  }
  busyNo.value = job.sysJobNo;
  try {
    await action();
    await reload();
  } catch (error) {
    msgError(errText(error));
  } finally {
    busyNo.value = "";
  }
}

async function toggle(job: SysJob, enabled: boolean): Promise<void> {
  await withRow(job, async () => {
    if (isFlowRow(job)) {
      const flowId = flowIdOf(job);
      if (!flowId) {
        throw new Error("台账行缺少流程 ID，请去流程设计页重新保存该流程");
      }
      await setFlowStatus(flowId, enabled ? 1 : 0);
    } else if (enabled) {
      await startJob(job.sysJobNo);
    } else {
      await stopJob(job.sysJobNo);
    }
    msgSuccess(enabled ? "已启用调度" : "已停止调度");
  });
}

async function runNow(job: SysJob): Promise<void> {
  await withRow(job, async () => {
    if (isFlowRow(job)) {
      const flowId = flowIdOf(job);
      if (!flowId) {
        throw new Error("台账行缺少流程 ID，无法运行");
      }
      const task = await runFlow({ collectFlowId: flowId, persist: true });
      msgInfo(`已提交运行，任务号 ${task?.collectTaskNo ?? ""}`);
      return;
    }
    await triggerJob(job.sysJobNo);
    msgInfo("已请求立即触发，等待调度器下一轮派发");
  });
}

async function remove(job: SysJob): Promise<void> {
  if (!(await confirmAction(`确认从台账删除作业 ${job.sysJobName}？删除后不再自动调度。`, "删除作业"))) {
    return;
  }
  await withRow(job, async () => {
    await deleteJob(job.sysJobNo);
    msgSuccess("作业已删除");
  });
}

function openCreate(): void {
  formMode.value = "create";
  formJobNo.value = "";
  Object.assign(form, {
    sysJobName: "",
    sysJobGroup: "",
    sysJobScheduleType: "CRON",
    sysJobScheduleTime: "",
    sysJobExecuteBean: "",
    sysJobExecuteParam: "",
    sysJobDesc: "",
    sysJobFailRetry: 0,
    sysJobExecuteTimeout: 0,
    sysJobExecuteMisfireStrategy: "DO_NOTHING",
    sysJobTriggerStatus: 0,
  });
  cronBroken.value = false;
  formVisible.value = true;
}

function openEdit(job: SysJob): void {
  formMode.value = "edit";
  formJobNo.value = job.sysJobNo;
  Object.assign(form, {
    sysJobName: job.sysJobName ?? "",
    sysJobGroup: job.sysJobGroup ?? "",
    sysJobScheduleType: job.sysJobScheduleType || "NONE",
    sysJobScheduleTime: job.sysJobScheduleTime ?? "",
    sysJobExecuteBean: job.sysJobExecuteBean ?? "",
    sysJobExecuteParam: job.sysJobExecuteParam ?? "",
    sysJobDesc: job.sysJobDesc ?? "",
    sysJobFailRetry: job.sysJobFailRetry ?? 0,
    sysJobExecuteTimeout: job.sysJobExecuteTimeout ?? 0,
    sysJobExecuteMisfireStrategy: job.sysJobExecuteMisfireStrategy || "DO_NOTHING",
    sysJobTriggerStatus: job.sysJobTriggerStatus ? 1 : 0,
  });
  cronBroken.value = false;
  formVisible.value = true;
}

function onCronChange(expression: string, valid: boolean): void {
  cronBroken.value = !valid && Boolean(expression.trim());
}

async function submit(): Promise<void> {
  const name = form.sysJobName.trim();
  const bean = form.sysJobExecuteBean.trim();
  if (!name) {
    msgError("任务名称不能为空");
    return;
  }
  if (!bean) {
    msgError("执行器不能为空");
    return;
  }
  if (form.sysJobScheduleType === "CRON" && cronBroken.value) {
    msgError("cron 表达式不合法");
    return;
  }
  if (form.sysJobScheduleType !== "NONE" && !String(form.sysJobScheduleTime ?? "").trim()) {
    msgError("填写了调度类型就必须给调度配置");
    return;
  }
  const payload: SysJobSave = { ...form, sysJobName: name, sysJobExecuteBean: bean };
  try {
    if (formMode.value === "create") {
      const saved = await createJob(payload);
      msgInfo(`已登记作业 ${saved?.sysJobNo ?? ""}`);
    } else {
      await updateJob(formJobNo.value, payload);
      msgSuccess("作业已更新");
    }
    formVisible.value = false;
    await reload();
  } catch (error) {
    msgError(errText(error));
  }
}

async function cleanLogs(): Promise<void> {
  if (!(await confirmAction("确认清理 30 天前的作业执行日志？", "清理作业日志"))) {
    return;
  }
  try {
    msgInfo((await cleanupJobLogs(30)) || "清理完成");
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
    timer = setInterval(() => void reload(), 5000);
  }
}

/** keep-alive 命中后挂载只跑一次，重进页面靠激活钩子取新数据 */
let firstActivation = true;
onActivated(() => {
  if (firstActivation) {
    firstActivation = false;
    return;
  }
  void reload();
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
        v-model="draft.sysJobName"
        size="small"
        clearable
        placeholder="任务名称模糊查询"
        style="width: 200px"
        @keyup.enter="search"
      />
      <ReSelect
        v-model="draft.sysJobTriggerStatus"
        size="small"
        clearable
        placeholder="全部状态"
        :options="STATUS_OPTIONS"
        style="width: 120px"
        @update:model-value="search"
      />
      <ReButton size="small" type="primary" icon="Search" @click="search">查询</ReButton>
      <ReButton size="small" @click="reset">重置</ReButton>
      <span class="spacer"/>
      <span class="collect-hint">自动刷新</span>
      <ReSwitch v-model="autoRefresh" size="small" @change="toggleAuto(autoRefresh === true)"/>
      <ReButton size="small" icon="Document" @click="cleanLogs">清理30天前日志</ReButton>
      <ReButton size="small" type="primary" icon="Plus" @click="openCreate">新建作业</ReButton>
    </div>

    <ReTable
      v-if="ready"
      ref="tableRef"
      class="collect-card"
      table-id="collect-job"
      :loader="loadJobs"
      :params="query"
      :columns="columns"
      row-key="sysJobNo"
      v-model:page="query.page"
      v-model:page-size="query.pageSize"
      :page-sizes="[10, 20, 50, 100]"
      empty-text="台账里还没有作业，新建一个或在流程设计页保存带 cron 的流程"
      stripe
    >
      <template #no="{ row }">
        <span class="collect-cell-mono">{{ row.sysJobNo }}</span>
      </template>
      <template #name="{ row }">
        <span>{{ row.sysJobName }}</span>
        <ReTag v-if="row.sysJobGroup === 'collect-flow'" class="collect-tag-inline" size="small" type="primary" effect="plain">
          采集流程
        </ReTag>
        <ReTag v-else-if="row.sysJobGroup" size="small" type="info" effect="plain">{{ row.sysJobGroup }}</ReTag>
      </template>
      <template #schedule="{ row }">
        <span class="collect-cell-mono collect-cell-ellipsis">{{ scheduleText(row as unknown as SysJob) }}</span>
      </template>
      <template #executor="{ row }">
        <span class="collect-cell-mono">{{ row.sysJobExecuteBean }}</span>
        <span v-if="row.sysJobExecuteParam" class="collect-hint collect-hint--muted"> · {{ row.sysJobExecuteParam }}</span>
      </template>
      <template #status="{ row }">
        <ReSwitch
          :model-value="Number(row.sysJobTriggerStatus) === 1"
          :disabled="busyNo === row.sysJobNo"
          :loading="busyNo === row.sysJobNo"
          size="small"
          @change="toggle(row as unknown as SysJob, $event === true)"
        />
      </template>
      <template #next="{ row }">
        {{ Number(row.sysJobTriggerStatus) === 1 ? fmtMs(row.sysJobTriggerNextTime) : "—" }}
      </template>
      <template #last="{ row }">{{ fmtMs(row.sysJobTriggerLastTime) }}</template>
      <template #guards="{ row }">
        {{ row.sysJobFailRetry ?? 0 }}/{{ row.sysJobExecuteTimeout ?? 0 }}s
      </template>
      <template #action="{ row }">
        <template v-if="row.sysJobGroup === 'collect-flow'">
          <ReButton
            size="small"
            text
            type="primary"
            :disabled="Boolean(busyNo)"
            @click="runNow(row as unknown as SysJob)"
          >
            立即运行
          </ReButton>
          <ReButton size="small" text @click="goDesigner(row as unknown as SysJob)">去画布</ReButton>
        </template>
        <template v-else>
          <ReButton
            size="small"
            text
            type="primary"
            :disabled="Boolean(busyNo) || Number(row.sysJobTriggerStatus) !== 1"
            :title="Number(row.sysJobTriggerStatus) === 1 ? '' : '作业已停用，触发不会被派发，请先启用调度'"
            @click="runNow(row as unknown as SysJob)"
          >
            立即触发
          </ReButton>
          <ReButton size="small" text @click="openEdit(row as unknown as SysJob)">编辑</ReButton>
          <ReButton size="small" text type="danger" :disabled="Boolean(busyNo)" @click="remove(row as unknown as SysJob)">
            删除
          </ReButton>
        </template>
      </template>
    </ReTable>

    <ReDialog
      v-model="formVisible"
      :title="formMode === 'create' ? '新建调度作业' : `编辑作业 · ${formJobNo}`"
      width="640px"
      top="8vh"
      @ok="submit"
    >
      <div class="collect-form">
        <div class="collect-form__item">
          <span class="collect-form__label">任务名称</span>
          <ReInput v-model="form.sysJobName" size="small" maxlength="64" placeholder="便于在台账与日志里识别"/>
        </div>
        <div class="collect-form__item">
          <span class="collect-form__label">分组</span>
          <ReInput v-model="form.sysJobGroup" size="small" maxlength="32" placeholder="留空表示不分组"/>
        </div>
        <div class="collect-form__item">
          <span class="collect-form__label">调度类型</span>
          <ReSelect v-model="form.sysJobScheduleType" size="small" :options="SCHEDULE_OPTIONS" style="width: 180px"/>
        </div>
        <div v-if="form.sysJobScheduleType === 'CRON'" class="collect-form__item collect-form__item--stack">
          <span class="collect-form__label">cron 表达式</span>
          <ReCron
            v-model="form.sysJobScheduleTime"
            :preview-count="3"
            placeholder="6 段表达式，例如 0 0/30 * * * ?"
            @change="onCronChange"
          />
        </div>
        <div v-else-if="form.sysJobScheduleType !== 'NONE'" class="collect-form__item">
          <span class="collect-form__label">调度配置</span>
          <ReInput v-model="form.sysJobScheduleTime" size="small" placeholder="固定间隔毫秒数，例如 60000"/>
        </div>
        <div class="collect-form__item">
          <span class="collect-form__label">执行器</span>
          <ReInput v-model="form.sysJobExecuteBean" size="small" placeholder="@Job 处理器名"/>
          <span class="collect-hint collect-hint--muted">必须与后端已注册的 @Job 处理器名一致，否则该轮记为处理器未注册</span>
        </div>
        <div class="collect-form__item">
          <span class="collect-form__label">执行参数</span>
          <ReInput v-model="form.sysJobExecuteParam" size="small" placeholder="传给处理器的原始字符串，可留空"/>
        </div>
        <div class="collect-form__item">
          <span class="collect-form__label">失败重试</span>
          <ReInputNumber v-model="form.sysJobFailRetry" size="small" :min="0" :max="5" controls-position="right"/>
          <span class="collect-form__label">执行超时</span>
          <ReInputNumber v-model="form.sysJobExecuteTimeout" size="small" :min="0" :max="3600" controls-position="right"/>
          <span class="collect-hint collect-hint--muted">秒，0 为不限</span>
        </div>
        <div class="collect-form__item">
          <span class="collect-form__label">错过策略</span>
          <ReSelect v-model="form.sysJobExecuteMisfireStrategy" size="small" :options="MISFIRE_OPTIONS" style="width: 180px"/>
        </div>
        <div class="collect-form__item">
          <span class="collect-form__label">登记即启用</span>
          <ReSwitch v-model="form.sysJobTriggerStatus" :active-value="1" :inactive-value="0" size="small"/>
          <span class="collect-hint collect-hint--muted">关闭表示只登记台账，不进入自动调度</span>
        </div>
        <div class="collect-form__item collect-form__item--stack">
          <span class="collect-form__label">说明</span>
          <ReInput v-model="form.sysJobDesc" type="textarea" :rows="2" maxlength="200" placeholder="作业用途"/>
        </div>
      </div>
    </ReDialog>
  </div>
</template>
