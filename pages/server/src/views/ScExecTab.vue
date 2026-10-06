<script setup lang="ts">
/**
 * 批量作业 —— 计划任务 / 最近执行结果
 *
 * 计划任务以 ReTable 呈现，支持「表格 / 卡片」布局切换（默认表格，偏好持久化）；
 * 任务分「定时(CRON)」与「脚本(NONE)」两类，定时任务由后端逐任务 CronTrigger 调度。
 * 操作列：执行（弹窗选择同类型服务器，选择主机后才会执行）/ 全部日志 / 编辑 / 删除。
 * 目标主机不再常驻页面，统一收敛到「执行」弹窗内选择；批量命令与文件分发已移除
 * （文件分发移至「文件资产」）。视觉走 koi 变量（--el-*）。
 *
 * @author CH
 * @since 4.0.0
 */
import { computed, onMounted, ref, watch } from 'vue';
import { message } from '@repo/core';
import { CronExpression } from '@repo/utils';
import {
  queryHosts, getJobs, saveJob, delJob, runJobNow, getExecLogs,
} from '../api';

/** 主机选项 */
interface HostOption {
  id: number;
  serverHostName: string;
  serverHostAddress: string;
  /** 主机 OS 类型（相同类型判定依据） */
  serverHostOsType?: string;
}

/** 计划任务行 */
interface JobRow {
  id: number;
  msExecJobName: string;
  msExecJobType?: string;
  msExecJobCron: string;
  msExecJobCommand: string;
  msExecJobHostIds?: string;
  msExecJobTimeout?: number;
  msExecJobEnabled: number;
  msExecJobRemark?: string;
  msExecJobLastRunTime?: string;
  msExecJobNextRunTime?: string;
}

/** 执行日志行 */
interface LogRow {
  id: number;
  msExecLogType: string;
  msExecLogHostName?: string;
  msExecLogCommand?: string;
  msExecLogStatus: string;
  msExecLogExitCode?: number;
  msExecLogError?: string;
  msExecLogCostMs?: number;
  msExecLogOutput?: string;
  msExecLogEndTime?: string;
}

/** 任务类型：定时 / 脚本 */
type JobType = 'CRON' | 'NONE';

// ===== 主机（执行弹窗同类型过滤 + 名称展示） =====
const hosts = ref<HostOption[]>([]);

// ===== 最近执行结果 =====
const lastResults = ref<LogRow[]>([]);

// ===== 计划任务 =====
const jobs = ref<JobRow[]>([]);
const jobFormVisible = ref(false);
const editingJobId = ref<number | null>(null);
const jobForm = ref<{
  msExecJobName: string;
  msExecJobType: JobType;
  msExecJobCron: string;
  msExecJobCommand: string;
  hostIdText: string;
  msExecJobTimeout: number;
}>({
  msExecJobName: '',
  msExecJobType: 'CRON',
  msExecJobCron: '0 0 3 * * ?',
  msExecJobCommand: '',
  hostIdText: '',
  msExecJobTimeout: 60,
});

/** 计划任务布局：table（默认）/ card，持久化偏好 */
const JOB_LAYOUT_KEY = 'exec-job-layout';
const jobLayout = ref<'table' | 'card'>(
  (localStorage.getItem(JOB_LAYOUT_KEY) as 'table' | 'card' | null) === 'card' ? 'card' : 'table',
);

/**
 * 切换计划任务布局
 *
 * @param layout 布局
 */
function setJobLayout(layout: 'table' | 'card'): void {
  jobLayout.value = layout;
  try {
    localStorage.setItem(JOB_LAYOUT_KEY, layout);
  } catch {
    /* 忽略隐私模式写入失败 */
  }
}

// ===== 执行（选择服务器）弹窗 =====
const runDialogVisible = ref(false);
const runJobRow = ref<JobRow | null>(null);
const runHostIds = ref<number[]>([]);

// ===== 执行日志抽屉 =====
const logDrawerVisible = ref(false);
const historyLogs = ref<LogRow[]>([]);
const historyType = ref('');
const logJobId = ref<number | null>(null);
const logJobName = ref('');

watch(logDrawerVisible, (show) => {
  if (show) loadHistory();
});

onMounted(async () => {
  try {
    const [hostList, jobList] = await Promise.all([queryHosts(), getJobs()]);
    hosts.value = (hostList ?? []).map((h: any) => ({
      id: h.id,
      serverHostName: h.serverHostName,
      serverHostAddress: h.serverHostAddress,
      serverHostOsType: h.serverHostOsType,
    }));
    jobs.value = jobList ?? [];
  } catch (e) {
    message.error((e as Error).message);
  }
});

/**
 * 加载历史执行日志(抽屉打开、类型切换或按任务过滤时调用)
 */
async function loadHistory(): Promise<void> {
  try {
    historyLogs.value = await getExecLogs(historyType.value || undefined, undefined, logJobId.value ?? undefined);
  } catch (e) {
    message.error((e as Error).message);
  }
}

/** 打开「全部日志」抽屉（按任务过滤） */
function openJobLogs(row: JobRow): void {
  logJobId.value = row.id;
  logJobName.value = row.msExecJobName;
  if (logDrawerVisible.value) {
    loadHistory();
  } else {
    logDrawerVisible.value = true;
  }
}

/** 打开「执行日志」抽屉（全部日志，不带任务过滤） */
function openAllLogs(): void {
  logJobId.value = null;
  logJobName.value = '';
  if (logDrawerVisible.value) {
    loadHistory();
  } else {
    logDrawerVisible.value = true;
  }
}

// ===== 相同类型判定 =====

/**
 * 主机 OS 类型（大写）
 *
 * @param h 主机
 */
function hostOs(h: HostOption): string {
  return (h.serverHostOsType || '').toUpperCase();
}

/**
 * 解析任务配置的主机 ID 集合
 *
 * @param row 任务
 */
function jobHostIds(row: JobRow): number[] {
  if (!row.msExecJobHostIds) return [];
  try {
    return JSON.parse(row.msExecJobHostIds) as number[];
  } catch {
    return [];
  }
}

/**
 * 任务的目标 OS 类型（取首个可识别主机）
 *
 * @param row 任务
 */
function jobOsType(row: JobRow | null): string {
  if (!row) return '';
  for (const id of jobHostIds(row)) {
    const h = hosts.value.find(x => x.id === id);
    if (h && hostOs(h)) return hostOs(h);
  }
  return '';
}

/** OS 类型展示名 */
function osLabel(type: string): string {
  if (!type) return '全部类型';
  const map: Record<string, string> = { LINUX: 'Linux', WINDOWS: 'Windows', MACOS: 'macOS', UNIX: 'Unix' };
  return map[type] || type;
}

/** 执行弹窗可选主机：与任务同类型（任务无类型时不过滤） */
const runHostOptions = computed(() => {
  const type = jobOsType(runJobRow.value);
  const list = type ? hosts.value.filter(h => hostOs(h) === type) : hosts.value;
  return list.map(h => ({ label: `${h.serverHostName} (${h.serverHostAddress})`, value: h.id }));
});

/**
 * 打开「选择服务器（相同类型）」执行弹窗
 *
 * @param row 任务
 */
function openRunDialog(row: JobRow): void {
  runJobRow.value = row;
  const type = jobOsType(row);
  const configured = jobHostIds(row);
  const allowed = new Set(runHostOptions.value.map(o => o.value as number));
  const preset = configured.filter(id => allowed.has(id));
  runHostIds.value = preset.length ? preset : [...allowed];
  runDialogVisible.value = true;
}

/** 确认执行：按所选服务器触发任务 */
async function confirmRun(): Promise<void> {
  const row = runJobRow.value;
  if (!row) return;
  if (!runHostIds.value.length) {
    message.warning('请至少选择一台服务器');
    return;
  }
  try {
    const logs = await runJobNow(row.id, runHostIds.value);
    lastResults.value = normalizeLogs(logs);
    runDialogVisible.value = false;
    message.success('已触发，结果见下方');
  } catch (e) {
    message.error((e as Error).message);
  }
}

/** 任务类型显示名 */
function jobTypeText(row: JobRow): string {
  return (row.msExecJobType || 'CRON').toUpperCase() === 'NONE' ? '脚本' : '定时';
}

/** 任务类型样式类 */
function jobTypeClass(row: JobRow): string {
  return (row.msExecJobType || 'CRON').toUpperCase() === 'NONE' ? 'is-none' : 'is-cron';
}

/** 任务 cron 展示（脚本任务无 cron） */
function jobCronText(row: JobRow): string {
  return jobTypeText(row) === '脚本' ? '—' : (row.msExecJobCron || '-');
}

/**
 * 打开任务表单
 *
 * @param row 编辑中的任务，null 表示新增
 */
function openJobForm(row?: JobRow): void {
  editingJobId.value = row?.id ?? null;
  const ids = row ? jobHostIds(row).join(',') : '';
  jobForm.value = {
    msExecJobName: row?.msExecJobName ?? '',
    msExecJobType: ((row?.msExecJobType || 'CRON').toUpperCase() === 'NONE' ? 'NONE' : 'CRON') as JobType,
    msExecJobCron: row?.msExecJobCron ?? '0 0 3 * * ?',
    msExecJobCommand: row?.msExecJobCommand ?? '',
    hostIdText: ids,
    msExecJobTimeout: row?.msExecJobTimeout ?? 60,
  };
  jobFormVisible.value = true;
}

/**
 * 提交任务表单（含 cron 前端预校验，复用 @repo/utils CronExpression）
 */
async function submitJob(): Promise<void> {
  const form = jobForm.value;
  if (!form.msExecJobName.trim() || !form.msExecJobCommand.trim()) {
    message.warning('任务名称与命令均不能为空');
    return;
  }
  if (!form.hostIdText.trim()) {
    message.warning('目标主机ID不能为空');
    return;
  }
  if (form.msExecJobType === 'CRON') {
    try {
      new CronExpression(form.msExecJobCron.trim());
    } catch {
      message.warning(`cron 表达式非法: ${form.msExecJobCron}`);
      return;
    }
  }
  try {
    await saveJob(editingJobId.value, {
      ...(editingJobId.value ? { id: editingJobId.value } : {}),
      msExecJobName: form.msExecJobName,
      msExecJobType: form.msExecJobType,
      msExecJobCron: form.msExecJobType === 'CRON' ? form.msExecJobCron : '',
      msExecJobCommand: form.msExecJobCommand,
      msExecJobHostIds: JSON.stringify(
        form.hostIdText.split(',').map(v => Number(v.trim())).filter(v => Number.isFinite(v) && v > 0),
      ),
      msExecJobTimeout: form.msExecJobTimeout,
      msExecJobEnabled: 1,
    });
    message.success('已保存');
    jobFormVisible.value = false;
    jobs.value = await getJobs();
  } catch (e) {
    message.error((e as Error).message);
  }
}

/**
 * 删除任务
 *
 * @param row 任务
 */
async function onDeleteJob(row: JobRow): Promise<void> {
  try {
    await message.confirm(`确认删除任务 ${row.msExecJobName}?`, '删除');
  } catch {
    return;
  }
  try {
    await delJob(row.id);
    jobs.value = await getJobs();
    message.success('已删除');
  } catch (e) {
    message.error((e as Error).message);
  }
}

/**
 * 归一化后端日志为表格数据
 *
 * @param logs 后端日志数组
 */
function normalizeLogs(logs?: LogRow[] | null): LogRow[] {
  return (logs ?? []).map(l => ({ ...l }));
}
</script>

<template>
  <div class="exec-tab">
    <!-- 最近执行结果 -->
    <section v-if="lastResults.length" class="ex-card">
      <header class="ex-head">
        <div>
          <h3 class="ex-head__title">最近执行结果</h3>
          <p class="ex-head__desc">{{ lastResults.length }} 台主机</p>
        </div>
      </header>
      <ReTable
        class="ex-table"
        :data="lastResults"
        :pagination="false"
        :toolbar="false"
        :layout-table="{ minHeight: 0, maxHeight: 260 }"
      >
        <ReTableColumn prop="msExecLogHostName" label="主机" width="150" show-overflow-tooltip />
        <ReTableColumn label="状态" width="96">
          <template #default="{ row }">
            <span class="ex-status" :class="row.msExecLogStatus === 'SUCCESS' ? 'is-ok' : 'is-fail'">
              <i class="ex-status__dot" />{{ row.msExecLogStatus === 'SUCCESS' ? '成功' : '失败' }}
            </span>
          </template>
        </ReTableColumn>
        <ReTableColumn prop="msExecLogOutput" label="输出" min-width="220" show-overflow-tooltip />
        <ReTableColumn prop="msExecLogError" label="错误" min-width="160" show-overflow-tooltip />
        <ReTableColumn prop="msExecLogCostMs" label="耗时(ms)" width="96" />
      </ReTable>
    </section>

    <!-- 计划任务 -->
    <section class="ex-card ex-card--jobs">
      <header class="ex-head">
        <div>
          <h3 class="ex-head__title">计划任务</h3>
          <p class="ex-head__desc">定时任务按 cron 后台执行；脚本任务仅手动执行</p>
        </div>
        <div class="ex-head__tools">
          <ReButton show-text icon="Document" @click="openAllLogs">执行日志</ReButton>
          <div class="ex-layout-toggle">
            <button
              type="button"
              :class="['ex-layout-btn', { 'is-active': jobLayout === 'table' }]"
              title="表格布局"
              @click="setJobLayout('table')"
            ><ReIcon name="Grid" /></button>
            <button
              type="button"
              :class="['ex-layout-btn', { 'is-active': jobLayout === 'card' }]"
              title="卡片布局"
              @click="setJobLayout('card')"
            ><ReIcon name="Postcard" /></button>
          </div>
          <ReButton show-text icon="Plus" type="primary" @click="openJobForm()">新增任务</ReButton>
        </div>
      </header>

      <ReTable
        class="ex-table"
        :data="jobs"
        :layout="jobLayout"
        :layout-card="{ columns: 3, minWidth: 320, gap: 12, fields: [{ prop: 'msExecJobName', title: true }] }"
        :pagination="false"
        :toolbar="false"
        empty-text="暂无计划任务，点击右上角「新增任务」创建"
      >
        <ReTableColumn prop="msExecJobName" label="名称" min-width="150" show-overflow-tooltip />
        <ReTableColumn label="类型" width="92">
          <template #default="{ row }">
            <span class="ex-pill" :class="jobTypeClass(row)">{{ jobTypeText(row) }}</span>
          </template>
        </ReTableColumn>
        <ReTableColumn label="cron" width="130">
          <template #default="{ row }"><span class="ex-mono">{{ jobCronText(row) }}</span></template>
        </ReTableColumn>
        <ReTableColumn prop="msExecJobCommand" label="命令" min-width="200" show-overflow-tooltip>
          <template #default="{ row }"><span class="ex-mono">{{ row.msExecJobCommand }}</span></template>
        </ReTableColumn>
        <ReTableColumn prop="msExecJobNextRunTime" label="下次运行" width="168" />
        <ReTableColumn label="启用" width="96">
          <template #default="{ row }">
            <span class="ex-status" :class="row.msExecJobEnabled === 1 ? 'is-ok' : 'is-off'">
              <i class="ex-status__dot" />{{ row.msExecJobEnabled === 1 ? '启用' : '停用' }}
            </span>
          </template>
        </ReTableColumn>
        <ReTableColumn label="操作" width="270" align="right" fixed="right">
          <template #default="{ row }">
            <button class="ex-link" type="button" @click="openRunDialog(row)"><i class="ex-link__dot" />执行</button>
            <button class="ex-link" type="button" @click="openJobLogs(row)">全部日志</button>
            <button class="ex-link" type="button" @click="openJobForm(row)">编辑</button>
            <button class="ex-link is-danger" type="button" @click="onDeleteJob(row)">删除</button>
          </template>
        </ReTableColumn>

        <!-- 卡片布局：任务卡片内容 + 操作 -->
        <template #card="{ row }: { row: JobRow }">
          <div class="ex-jobcard__meta">
            <span class="ex-jobcard__row"><i>cron</i><b class="ex-mono">{{ jobCronText(row) }}</b></span>
            <span class="ex-jobcard__row"><i>下次运行</i><b>{{ row.msExecJobNextRunTime || '-' }}</b></span>
            <span class="ex-jobcard__row"><i>命令</i><b class="ex-mono ex-jobcard__cmd">{{ row.msExecJobCommand }}</b></span>
          </div>
          <div class="ex-jobcard__foot">
            <span class="ex-status" :class="row.msExecJobEnabled === 1 ? 'is-ok' : 'is-off'">
              <i class="ex-status__dot" />{{ row.msExecJobEnabled === 1 ? '启用' : '停用' }}
            </span>
            <div class="ex-jobcard__ops">
              <button class="ex-link" type="button" @click="openRunDialog(row)"><i class="ex-link__dot" />执行</button>
              <button class="ex-link" type="button" @click="openJobLogs(row)">全部日志</button>
              <button class="ex-link" type="button" @click="openJobForm(row)">编辑</button>
              <button class="ex-link is-danger" type="button" @click="onDeleteJob(row)">删除</button>
            </div>
          </div>
        </template>
      </ReTable>
    </section>

    <!-- 任务表单 -->
    <ReDialog
      v-model="jobFormVisible"
      :title="editingJobId ? '编辑任务' : '新增任务'"
      width="600"
      :height="500"
      confirm-text="保存"
      cancel-text="取消"
      :footer-hidden="false" @confirm="submitJob"
      @cancel="jobFormVisible = false"
    >
      <ReForm label-width="100px" label-position="right">
        <ReFormItem label="任务名称" required>
          <ReInput v-model="jobForm.msExecJobName" placeholder="如 每日清理临时文件" />
        </ReFormItem>
        <ReFormItem label="任务类型" required>
          <ReRadioGroup v-model="jobForm.msExecJobType" button capsule>
            <ReRadioButton value="CRON">定时</ReRadioButton>
            <ReRadioButton value="NONE">脚本</ReRadioButton>
          </ReRadioGroup>
        </ReFormItem>
        <ReFormItem v-if="jobForm.msExecJobType === 'CRON'" label="cron 表达式" required>
          <ReInput v-model="jobForm.msExecJobCron" placeholder="6 域：秒 分 时 日 月 周，如 0 0 3 * * ?" />
        </ReFormItem>
        <ReFormItem label="命令" required>
          <ReInput v-model="jobForm.msExecJobCommand" type="textarea" :rows="3" />
        </ReFormItem>
        <ReFormItem label="目标主机ID" required>
          <ReInput v-model="jobForm.hostIdText" placeholder="逗号分隔，如 1,2,3" />
        </ReFormItem>
        <ReFormItem label="超时(秒)">
          <ReInputNumber v-model="jobForm.msExecJobTimeout" :min="5" :max="3600" />
        </ReFormItem>
      </ReForm>
    </ReDialog>

    <!-- 执行：选择服务器（相同类型） -->
    <ReDialog
      v-model="runDialogVisible"
      title="选择服务器（相同类型）"
      width="560"
      confirm-text="执行"
      cancel-text="取消"
      :footer-hidden="false" @confirm="confirmRun"
      @cancel="runDialogVisible = false"
    >
      <div class="ex-runhint">
        任务「<b>{{ runJobRow?.msExecJobName }}</b>」目标类型
        <span class="ex-pill is-cron">{{ osLabel(jobOsType(runJobRow)) }}</span>
        —— 仅可选择与该类型一致的服务器。
      </div>
      <ReSelect
        v-model="runHostIds"
        multiple
        filterable
        collapse-tags
        placeholder="选择服务器"
        :data="runHostOptions"
        class="ex-full"
      />
    </ReDialog>

    <!-- 执行日志抽屉 -->
    <ReDrawer
      v-model="logDrawerVisible"
      :title="logJobId ? `执行日志 · ${logJobName}` : '执行日志'"
      direction="rtl"
      size="62%"
      :footer-hidden="true"
      close-only
      @cancel="logDrawerVisible = false"
    >
      <template #content>
        <div class="ex-logfilter">
          <ReRadioGroup v-model="historyType" button capsule @change="loadHistory">
            <ReRadioButton value="">全部</ReRadioButton>
            <ReRadioButton value="COMMAND">命令</ReRadioButton>
            <ReRadioButton value="FILE">文件</ReRadioButton>
            <ReRadioButton value="JOB">计划任务</ReRadioButton>
          </ReRadioGroup>
        </div>
        <ReTable
          class="ex-table"
          :data="historyLogs"
          :pagination="false"
          :toolbar="false"
          :layout-table="{ minHeight: 0, maxHeight: 'calc(100vh - 200px)' }"
          empty-text="暂无执行日志"
        >
          <ReTableColumn prop="msExecLogHostName" label="主机" width="130" show-overflow-tooltip />
          <ReTableColumn label="类型" width="90">
            <template #default="{ row }">
              <span class="ex-pill">{{ row.msExecLogType }}</span>
            </template>
          </ReTableColumn>
          <ReTableColumn prop="msExecLogCommand" label="命令/路径" min-width="170" show-overflow-tooltip />
          <ReTableColumn label="状态" width="96">
            <template #default="{ row }">
              <span class="ex-status" :class="row.msExecLogStatus === 'SUCCESS' ? 'is-ok' : 'is-fail'">
                <i class="ex-status__dot" />{{ row.msExecLogStatus === 'SUCCESS' ? '成功' : '失败' }}
              </span>
            </template>
          </ReTableColumn>
          <ReTableColumn prop="msExecLogOutput" label="输出" min-width="200" show-overflow-tooltip />
          <ReTableColumn prop="msExecLogError" label="错误" min-width="150" show-overflow-tooltip />
          <ReTableColumn prop="msExecLogEndTime" label="结束时间" width="168" />
          <ReTableColumn prop="msExecLogCostMs" label="耗时(ms)" width="96" />
        </ReTable>
      </template>
    </ReDrawer>
  </div>
</template>

<style scoped lang="scss">
.exec-tab {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100%;
  box-sizing: border-box;
}

/* 卡片 */
.ex-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px 24px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-extra-light, var(--el-border-color-lighter));
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-lighter);
}

/* 分区标题 */
.ex-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.ex-head__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.ex-head__desc {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.ex-head__tools {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

/* 布局切换 */
.ex-layout-toggle {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-md, 8px);
}
.ex-layout-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 15px;
  color: var(--el-text-color-regular);
  background: transparent;
  border: none;
  border-radius: var(--el-radius-sm, 6px);
  cursor: pointer;
  transition: color var(--el-transition-duration), background var(--el-transition-duration);
}
.ex-layout-btn:hover {
  color: var(--el-color-primary);
}
.ex-layout-btn.is-active {
  color: var(--el-color-primary);
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-lighter);
}

.ex-full {
  width: 100%;
}

/* 表格 */
.ex-table {
  --el-table-border-color: var(--el-border-color-lighter);
}
.ex-table :deep(.el-table__header-wrapper th.el-table__cell) {
  background: transparent;
  color: var(--el-text-color-secondary);
  font-weight: 500;
  font-size: 13px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.ex-table :deep(.el-table__row > td.el-table__cell) {
  border-bottom: 1px solid var(--el-border-color-extra-light, var(--el-border-color-lighter));
}
.ex-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}
.ex-table :deep(.el-table__row:hover > td.el-table__cell) {
  background: var(--el-color-primary-light-9);
}

/* 等宽文本 */
.ex-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
}

/* 状态点 */
.ex-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
}
.ex-status__dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-text-color-disabled);
}
.ex-status.is-ok .ex-status__dot { background: var(--el-color-success); }
.ex-status.is-fail .ex-status__dot { background: var(--el-color-danger); }
.ex-status.is-off .ex-status__dot { background: var(--el-text-color-disabled); }

/* 类型 / 标签 pill */
.ex-pill {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-full, 9999px);
}
.ex-pill.is-cron {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.ex-pill.is-none {
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
}

/* 行内链接按钮 */
.ex-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-right: 12px;
  padding: 0;
  font-size: 13px;
  color: var(--el-color-primary);
  background: none;
  border: none;
  cursor: pointer;
}
.ex-link:hover {
  color: var(--el-color-primary-dark-2);
}
.ex-link__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-primary);
}
.ex-link.is-danger {
  color: var(--el-color-danger);
}
.ex-link.is-danger:hover {
  color: var(--el-color-danger-dark-2);
}

/* 卡片模式：任务卡片 */
.ex-jobcard__meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}
.ex-jobcard__row {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: var(--el-text-color-regular);
}
.ex-jobcard__row i {
  flex: 0 0 60px;
  font-style: normal;
  color: var(--el-text-color-secondary);
}
.ex-jobcard__row b {
  font-weight: 500;
  color: var(--el-text-color-primary);
  word-break: break-all;
}
.ex-jobcard__cmd {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ex-jobcard__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.ex-jobcard__ops {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
}
.ex-jobcard__ops .ex-link {
  margin-right: 10px;
}

/* 执行弹窗提示 */
.ex-runhint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.ex-runhint .ex-pill {
  margin: 0 2px;
}

/* 抽屉日志筛选 */
.ex-logfilter {
  margin-bottom: 12px;
}

/* 窄屏 */
@media (max-width: 900px) {
  .ex-card {
    padding: 16px;
  }
  .ex-head {
    flex-wrap: wrap;
  }
}
</style>
