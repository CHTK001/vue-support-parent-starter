<script setup lang="ts">
/**
 * 调度控制台页
 *
 * 定时任务 CRUD + 启停/触发/恢复 + 执行日志分页
 *
 * 由 @pages/task/SchedulerManage 迁入 @pages/job：调度相关能力独立成包，
 * @pages/task 只保留任务派发。
 */
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Delete,
  Plus,
  Refresh,
  Search,
  SwitchButton,
  Timer,
  VideoPause,
  VideoPlay,
} from "@element-plus/icons-vue";
import {
  createJob,
  deleteJob,
  pageForJob,
  pageForJobLog,
  restoreJob,
  startJob,
  stopJob,
  triggerJob,
  updateJob,
} from "../api/jobApi";
import type { JobEntity, JobLogEntity } from "../api/types";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";

const tableRef = ref();
const logTableRef = ref();

const query = ref<{ pageNum: number; pageSize: number; jobName?: string; triggerStatus?: number }>({
  pageNum: 1,
  pageSize: 10,
});

const logQuery = ref<{ pageNum: number; pageSize: number; beanName?: string; executeCode?: string }>({
  pageNum: 1,
  pageSize: 10,
});

/** 提交快照：只有点「搜索」/回车时才变，避免逐键发请求 */
const filter = ref<{ jobName?: string; triggerStatus?: number }>({});
const logFilter = ref<{ beanName?: string; executeCode?: string }>({});

async function loadJobs({ page, pageSize }: ReTableLoadParams): Promise<RePageResult> {
  const res = await pageForJob({
    pageNum: page,
    pageSize,
    jobName: filter.value.jobName || undefined,
    triggerStatus: filter.value.triggerStatus,
  });
  return { total: res?.data?.total ?? 0, data: (res?.data?.records ?? []) as Record<string, unknown>[] };
}

async function loadJobLogs({ page, pageSize }: ReTableLoadParams): Promise<RePageResult> {
  const res = await pageForJobLog({
    pageNum: page,
    pageSize,
    beanName: logFilter.value.beanName || undefined,
    executeCode: logFilter.value.executeCode || undefined,
  });
  return { total: res?.data?.total ?? 0, data: (res?.data?.records ?? []) as Record<string, unknown>[] };
}

const scheduleTypeMap: Record<string, string> = {
  CRON: "Cron 表达式",
  FIXED: "固定间隔(秒)",
  FIXED_MS: "固定间隔(毫秒)",
  DELAY: "延迟执行",
  AT: "指定时间",
  NONE: "不调度",
};

const jobColumns: ReTableColumn[] = [
  { prop: "sysJobName", label: "任务名称", minWidth: 150, showOverflowTooltip: true },
  { prop: "sysJobNo", label: "任务编号", minWidth: 120, showOverflowTooltip: true },
  { prop: "sysJobGroup", label: "分组", width: 110, slot: "group" },
  { prop: "sysJobScheduleType", label: "调度类型", width: 130, slot: "scheduleType" },
  { prop: "sysJobScheduleTime", label: "调度时间", minWidth: 150, slot: "scheduleTime", showOverflowTooltip: true },
  { prop: "sysJobDispatchMode", label: "分发模式", width: 100, slot: "dispatchMode", align: "center" },
  { prop: "sysJobTriggerStatus", label: "状态", width: 90, slot: "triggerStatus", align: "center" },
  { prop: "sysJobTriggerNextTime", label: "下次触发", minWidth: 150, slot: "nextTime", align: "center" },
  { prop: "sysJobExecuteBean", label: "执行 Bean", minWidth: 140, showOverflowTooltip: true },
  { prop: "action", label: "操作", width: 260, slot: "action", fixed: "right" },
];

const logColumns: ReTableColumn[] = [
  { prop: "sysJobLogNo", label: "日志编号", minWidth: 150, showOverflowTooltip: true },
  { prop: "sysJobName", label: "任务名称", minWidth: 130, showOverflowTooltip: true },
  { prop: "sysJobLogTriggerType", label: "触发类型", width: 110, slot: "triggerType" },
  { prop: "sysJobLogTriggerCode", label: "触发结果", width: 90, slot: "triggerCode", align: "center" },
  { prop: "sysJobLogExecuteCode", label: "执行结果", width: 90, slot: "executeCode", align: "center" },
  { prop: "sysJobLogCost", label: "耗时(ms)", width: 90, align: "center" },
  { prop: "sysJobLogTriggerTime", label: "触发时间", minWidth: 160, slot: "triggerTime" },
  { prop: "sysJobLogNodeId", label: "节点", minWidth: 110, showOverflowTooltip: true },
];

function formatTs(ts?: number): string {
  if (!ts) return "-";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return String(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function codeMeta(code?: string): { label: string; type: "success" | "danger" | "info" } {
  if (code === undefined || code === null || code === "") return { label: "-", type: "info" };
  const c = String(code);
  if (c === "200" || c === "0" || c.toLowerCase() === "success") return { label: "成功", type: "success" };
  if (c === "500" || c === "-1" || c.toLowerCase() === "fail" || c.toLowerCase() === "error") return { label: "失败", type: "danger" };
  return { label: c, type: "info" };
}

function handleSearch() {
  const next = { jobName: query.value.jobName, triggerStatus: query.value.triggerStatus };
  if (JSON.stringify(next) === JSON.stringify(filter.value)) {
    tableRef.value?.reload();
    return;
  }
  filter.value = next;
}

function handleLogSearch() {
  const next = { beanName: logQuery.value.beanName, executeCode: logQuery.value.executeCode };
  if (JSON.stringify(next) === JSON.stringify(logFilter.value)) {
    logTableRef.value?.reload();
    return;
  }
  logFilter.value = next;
}

function handleReset() {
  query.value = { pageNum: 1, pageSize: 10 };
  if (JSON.stringify(filter.value) === "{}") {
    tableRef.value?.reload();
  } else {
    filter.value = {};
  }
}

function handleResetLog() {
  logQuery.value = { pageNum: 1, pageSize: 10 };
  if (JSON.stringify(logFilter.value) === "{}") {
    logTableRef.value?.reload();
  } else {
    logFilter.value = {};
  }
}

/* ================== 新增 / 编辑 ================== */

const dialogVisible = ref(false);
const saving = ref(false);
const isEdit = ref(false);
const form = ref<JobEntity>({
  sysJobScheduleType: "CRON",
  sysJobTriggerStatus: 0,
  sysJobDispatchMode: "LOCAL",
  sysJobStorageMode: "DATABASE",
  sysJobGlueType: "BEAN",
});

const scheduleTypeOptions = [
  { label: "Cron 表达式", value: "CRON" },
  { label: "固定间隔(秒)", value: "FIXED" },
  { label: "固定间隔(毫秒)", value: "FIXED_MS" },
  { label: "延迟执行", value: "DELAY" },
  { label: "指定时间", value: "AT" },
  { label: "不调度", value: "NONE" },
];

const dispatchModeOptions = [
  { label: "本地执行", value: "LOCAL" },
  { label: "远程执行", value: "REMOTE" },
];

function openAdd() {
  isEdit.value = false;
  form.value = {
    sysJobScheduleType: "CRON",
    sysJobTriggerStatus: 0,
    sysJobDispatchMode: "LOCAL",
    sysJobStorageMode: "DATABASE",
    sysJobGlueType: "BEAN",
  };
  dialogVisible.value = true;
}

function openEdit(row: Record<string, unknown>) {
  isEdit.value = true;
  form.value = { ...(row as JobEntity) };
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!form.value.sysJobName || !form.value.sysJobExecuteBean) {
    ElMessage.warning("请填写任务名称与执行 Bean");
    return;
  }
  if (form.value.sysJobScheduleType === "CRON" && !form.value.sysJobScheduleTime) {
    ElMessage.warning("请填写 Cron 表达式");
    return;
  }
  saving.value = true;
  try {
    if (isEdit.value) {
      await updateJob(form.value.sysJobId!, form.value);
      ElMessage.success("修改成功");
    } else {
      await createJob(form.value);
      ElMessage.success("新增成功");
    }
    dialogVisible.value = false;
    tableRef.value?.reload();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "保存失败");
  } finally {
    saving.value = false;
  }
}

/* ================== 启停 / 触发 / 删除 ================== */

const opId = ref<number>(0);
const opType = ref("");

async function handleOp(row: Record<string, unknown>, action: "start" | "stop" | "trigger" | "restore" | "delete") {
  const job = row as unknown as JobEntity;
  if (opId.value) return;
  if (action === "delete") {
    try {
      await ElMessageBox.confirm(`确认删除任务「${job.sysJobName}」？`, "提示", { type: "warning", confirmButtonText: "确认删除" });
    } catch {
      return;
    }
  }
  opId.value = job.sysJobId!;
  opType.value = action;
  try {
    const fn = { start: startJob, stop: stopJob, trigger: triggerJob, restore: restoreJob, delete: deleteJob }[action];
    await fn(job.sysJobId!);
    const msg = { start: "已启动", stop: "已停止", trigger: "已触发", restore: "已恢复", delete: "已删除" }[action];
    ElMessage.success(msg);
    tableRef.value?.reload();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "操作失败");
  } finally {
    opId.value = 0;
    opType.value = "";
  }
}

onMounted(() => {
  tableRef.value?.reload();
  logTableRef.value?.reload();
});
</script>

<template>
  <div class="task-page">
    <div class="task-page__header">
      <div>
        <h2 class="task-page__title">调度中心</h2>
        <p class="task-page__subtitle">定时任务管理、执行状态与运行日志</p>
      </div>
      <ReButton layout="modern" type="primary" icon="Plus" @click="openAdd">新增任务</ReButton>
    </div>

    <el-card shadow="never" class="task-page__card">
      <ReSearch :is-expanded="true" @search="handleSearch()" @reset="handleReset" @refresh="tableRef?.reload()">
        <div class="task-page__search">
          <ReInput
            layout="modern"
            v-model="query.jobName"
            placeholder="任务名称"
            clearable
            class="!w-48"
            @keyup.enter="handleSearch()"
          />
          <ReSelect
            v-model="query.triggerStatus"
            placeholder="状态"
            clearable
            class="!w-32"
            :data="[
              { label: '运行中', value: 1 },
              { label: '已停止', value: 0 },
            ]"
          />
        </div>
      </ReSearch>

      <ReTable
        ref="tableRef"
        table-id="task-scheduler"
        :loader="loadJobs"
        :columns="jobColumns"
        :pagination="true"
        :params="filter"
        row-key="sysJobId"
        v-model:page="query.pageNum"
        v-model:page-size="query.pageSize"
      >
        <template #group="{ row }">
          <ReTag v-if="row.sysJobGroup" type="info" effect="plain" size="small">{{ row.sysJobGroup }}</ReTag>
          <span v-else class="task-dim">-</span>
        </template>
        <template #scheduleType="{ row }">
          <span class="task-dim">{{ scheduleTypeMap[row.sysJobScheduleType] || row.sysJobScheduleType || "-" }}</span>
        </template>
        <template #scheduleTime="{ row }">
          <span v-if="row.sysJobScheduleTime" class="task-mono">{{ row.sysJobScheduleTime }}</span>
          <span v-else class="task-dim">-</span>
        </template>
        <template #dispatchMode="{ row }">
          <ReTag :type="row.sysJobDispatchMode === 'REMOTE' ? 'warning' : 'primary'" effect="plain" size="small">
            {{ row.sysJobDispatchMode || "-" }}
          </ReTag>
        </template>
        <template #triggerStatus="{ row }">
          <span :class="['task-status-pill', Number(row.sysJobTriggerStatus) === 1 ? 'on' : 'off']">
            {{ Number(row.sysJobTriggerStatus) === 1 ? "运行中" : "已停止" }}
          </span>
        </template>
        <template #nextTime="{ row }">
          <span v-if="row.sysJobTriggerNextTime" class="task-dim">{{ formatTs(row.sysJobTriggerNextTime) }}</span>
          <span v-else class="task-dim">-</span>
        </template>
        <template #action="{ row }">
          <ReButton v-if="Number(row.sysJobTriggerStatus) !== 1" layout="modern" link type="success" :icon="VideoPlay" :loading="opId === row.sysJobId" @click="handleOp(row, 'start')">启动</ReButton>
          <ReButton v-else layout="modern" link type="warning" :icon="VideoPause" :loading="opId === row.sysJobId" @click="handleOp(row, 'stop')">停止</ReButton>
          <ReButton layout="modern" link type="primary" :icon="Timer" :loading="opId === row.sysJobId" @click="handleOp(row, 'trigger')">执行一次</ReButton>
          <ReButton v-if="row.sysJobIsDeleted" layout="modern" link type="info" :icon="Refresh" :loading="opId === row.sysJobId" @click="handleOp(row, 'restore')">恢复</ReButton>
          <ReButton layout="modern" link type="danger" icon="Delete" :loading="opId === row.sysJobId" @click="handleOp(row, 'delete')">删除</ReButton>
        </template>
      </ReTable>
    </el-card>

    <el-card shadow="never" class="task-page__card">
      <template #header>
        <div class="task-page__card-head">
          <span class="task-page__card-title">
            <el-icon class="task-page__card-icon"><Timer /></el-icon>
            执行日志
          </span>
        </div>
      </template>
      <ReSearch :is-expanded="true" @search="handleLogSearch()" @reset="handleResetLog" @refresh="logTableRef?.reload()">
        <div class="task-page__search">
          <ReInput
            layout="modern"
            v-model="logQuery.beanName"
            placeholder="执行 Bean"
            clearable
            class="!w-44"
            @keyup.enter="handleLogSearch()"
          />
          <ReInput
            layout="modern"
            v-model="logQuery.executeCode"
            placeholder="执行结果码"
            clearable
            class="!w-36"
            @keyup.enter="handleLogSearch()"
          />
        </div>
      </ReSearch>

      <ReTable
        ref="logTableRef"
        table-id="task-scheduler-log"
        :loader="loadJobLogs"
        :columns="logColumns"
        :pagination="true"
        :params="logFilter"
        row-key="sysJobLogId"
        v-model:page="logQuery.pageNum"
        v-model:page-size="logQuery.pageSize"
      >
        <template #triggerType="{ row }">
          <span class="task-dim">{{ row.sysJobLogTriggerType || "-" }}</span>
        </template>
        <template #triggerCode="{ row }">
          <ReTag :type="codeMeta(row.sysJobLogTriggerCode).type" effect="plain" size="small">
            {{ codeMeta(row.sysJobLogTriggerCode).label }}
          </ReTag>
        </template>
        <template #executeCode="{ row }">
          <ReTag :type="codeMeta(row.sysJobLogExecuteCode).type" effect="plain" size="small">
            {{ codeMeta(row.sysJobLogExecuteCode).label }}
          </ReTag>
        </template>
        <template #triggerTime="{ row }">
          <span v-if="row.sysJobLogTriggerTime" class="task-dim">
            {{ String(row.sysJobLogTriggerTime).replace("T", " ").slice(0, 19) }}
          </span>
          <span v-else class="task-dim">-</span>
        </template>
      </ReTable>
    </el-card>

    <!-- 任务编辑弹窗 -->
    <ReDialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑任务' : '新增任务'"
      width="640"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      :confirm-loading="saving"
      @ok="handleSubmit"
    >
      <el-form label-width="110px" :model="form">
        <el-form-item label="任务名称" required>
          <ReInput layout="modern" v-model="form.sysJobName" placeholder="任务名称" />
        </el-form-item>
        <el-form-item label="任务分组">
          <ReInput layout="modern" v-model="form.sysJobGroup" placeholder="default" />
        </el-form-item>
        <el-form-item label="调度类型" required>
          <ReSelect
            layout="modern"
            v-model="form.sysJobScheduleType"
            :data="scheduleTypeOptions"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item :label="form.sysJobScheduleType === 'CRON' ? 'Cron 表达式' : '调度时间'" required>
          <ReInput layout="modern" v-model="form.sysJobScheduleTime" placeholder="0 0/10 * * * ?  或 固定间隔值" />
        </el-form-item>
        <el-form-item label="执行 Bean" required>
          <ReInput layout="modern" v-model="form.sysJobExecuteBean" placeholder="spring bean 名称" />
        </el-form-item>
        <el-form-item label="执行参数">
          <ReInput layout="modern" v-model="form.sysJobExecuteParam" type="textarea" placeholder="JSON 或参数串" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="分发模式">
              <ReSelect layout="modern" v-model="form.sysJobDispatchMode" :data="dispatchModeOptions" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="执行超时(秒)">
              <ReInputNumber layout="modern" v-model="form.sysJobExecuteTimeout" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="失败重试次数">
              <ReInputNumber layout="modern" v-model="form.sysJobFailRetry" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="重试间隔(秒)">
              <ReInputNumber layout="modern" v-model="form.sysJobRetryInterval" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item v-if="form.sysJobDispatchMode === 'REMOTE'" label="远程地址">
          <ReInput layout="modern" v-model="form.sysJobRemoteExecutorAddress" placeholder="http://host:port" />
        </el-form-item>
        <el-form-item label="告警邮箱">
          <ReInput layout="modern" v-model="form.sysJobAlarmEmail" placeholder="可选，逗号分隔" />
        </el-form-item>
        <el-form-item label="描述">
          <ReInput layout="modern" v-model="form.sysJobDesc" type="textarea" placeholder="任务说明" />
        </el-form-item>
        <el-form-item label="保存后启动">
          <ReSwitch
            layout="modern"
            :model-value="Number(form.sysJobTriggerStatus) === 1"
            @update:model-value="(v: string | number | boolean) => (form.sysJobTriggerStatus = v ? 1 : 0)"
          />
        </el-form-item>
      </el-form>
    </ReDialog>
  </div>
</template>

<style scoped>
.task-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
}

.task-page__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.task-page__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1.4;
}

.task-page__subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.task-page__search {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
}

.task-page__card {
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.task-page__card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.task-page__card-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.task-page__card-icon {
  color: var(--el-color-primary);
}

.task-dim {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.task-mono {
  font-family: 'SF Mono', 'Cascadia Code', monospace;
  font-size: 12px;
  color: var(--el-text-color-primary);
}

.task-status-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.task-status-pill.on {
  color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 8%, transparent);
}

.task-status-pill.off {
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
}

@media screen and (max-width: 768px) {
  .task-page {
    padding: 16px;
    gap: 12px;
  }

  .task-page__search {
    gap: 8px;
  }
}
</style>