<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { message } from '@repo/core';
import { CronExpression } from '@repo/utils';
import {
  queryHosts, runCommand, distributeFile, getJobs, saveJob, delJob, runJobNow,
  getExecLogs, getSnippets,
} from '../api';

/** 主机选项 */
interface HostOption {
  id: number;
  serverHostName: string;
  serverHostAddress: string;
}

/** 计划任务行 */
interface JobRow {
  id: number;
  msExecJobName: string;
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
}

// ===== 批量命令 =====
const hosts = ref<HostOption[]>([]);
const selectedHostIds = ref<number[]>([]);
const command = ref('');
const running = ref(false);
const lastResults = ref<LogRow[]>([]);

/** 命令片段下拉 */
const snippets = ref<Array<{ id: number; msTerminalSnippetName: string; msTerminalSnippetContent: string }>>([]);
const pickedSnippetId = ref<number | null>(null);
const snippetOptions = ref<Array<{ label: string; value: number }>>([]);

/** 执行日志抽屉 */
const logDrawerVisible = ref(false);
const historyLogs = ref<LogRow[]>([]);
const historyType = ref('');

// 抽屉打开时加载历史日志
watch(logDrawerVisible, (show) => {
  if (show) loadHistory();
});

// ===== 文件分发 =====
const distDirectory = ref('/tmp');
const distFile = ref<File | null>(null);
const distributing = ref(false);

// ===== 计划任务 =====
const jobs = ref<JobRow[]>([]);
const jobFormVisible = ref(false);
const editingJobId = ref<number | null>(null);
const jobForm = ref({
  msExecJobName: '',
  msExecJobCron: '0 0 3 * * ?',
  msExecJobCommand: '',
  hostIdText: '',
  msExecJobTimeout: 60,
});

onMounted(async () => {
  try {
    const [hostList, jobList] = await Promise.all([queryHosts(), getJobs()]);
    hosts.value = (hostList ?? []).map((h: any) => ({
      id: h.id,
      serverHostName: h.serverHostName,
      serverHostAddress: h.serverHostAddress,
    }));
    jobs.value = jobList ?? [];
  } catch (e) {
    message.error((e as Error).message);
  }
  // 命令片段(失败静默, 不影响主功能)
  getSnippets().then(r => {
    snippets.value = r ?? [];
    snippetOptions.value = (r ?? []).map(s => ({ label: s.msTerminalSnippetName, value: s.id }));
  }).catch(() => {});
});

/**
 * 片段选中即追加到命令输入框
 *
 * @param id 片段 ID
 */
function applySnippet(id: number): void {
  const snippet = snippets.value.find(s => s.id === id);
  if (!snippet) return;
  command.value += (command.value.trim() ? ' && ' : '') + snippet.msTerminalSnippetContent;
}

/**
 * 加载历史执行日志(抽屉打开或类型切换时调用)
 */
async function loadHistory(): Promise<void> {
  try {
    historyLogs.value = await getExecLogs(historyType.value || undefined);
  } catch (e) {
    message.error((e as Error).message);
  }
}

/**
 * 执行批量命令
 */
async function onRunCommand(): Promise<void> {
  if (!selectedHostIds.value.length || !command.value.trim()) {
    message.warning('请选择主机并输入命令');
    return;
  }
  running.value = true;
  try {
    const logs = await runCommand(selectedHostIds.value, command.value.trim());
    lastResults.value = normalizeLogs(logs);
    message.success('执行完成');
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    running.value = false;
  }
}

/**
 * 文件分发
 */
async function onDistribute(): Promise<void> {
  if (!selectedHostIds.value.length || !distFile.value) {
    message.warning('请选择主机与文件');
    return;
  }
  distributing.value = true;
  try {
    await distributeFile(selectedHostIds.value.join(','), distDirectory.value, distFile.value);
    message.success('分发完成');
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    distributing.value = false;
  }
}

/**
 * 打开任务表单
 *
 * @param row 编辑中的任务，null 表示新增
 */
function openJobForm(row?: JobRow): void {
  editingJobId.value = row?.id ?? null;
  let ids = '';
  if (row?.msExecJobHostIds) {
    try {
      ids = (JSON.parse(row.msExecJobHostIds) as number[]).join(',');
    } catch {
      ids = '';
    }
  }
  jobForm.value = {
    msExecJobName: row?.msExecJobName ?? '',
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
  // cron 表达式合法性：复用框架解析器，非法即抛错
  try {
    new CronExpression(form.msExecJobCron.trim());
  } catch {
    message.warning(`cron 表达式非法: ${form.msExecJobCron}`);
    return;
  }
  try {
    await saveJob(editingJobId.value, {
      ...(editingJobId.value ? { id: editingJobId.value } : {}),
      msExecJobName: form.msExecJobName,
      msExecJobCron: form.msExecJobCron,
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
 * 立即运行任务
 *
 * @param row 任务
 */
async function onRunNow(row: JobRow): Promise<void> {
  try {
    const logs = await runJobNow(row.id);
    lastResults.value = normalizeLogs(logs);
    message.success('已触发，结果见下方');
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
  await message.confirm(`确认删除任务 ${row.msExecJobName}?`, '删除');
  await delJob(row.id);
  jobs.value = await getJobs();
  message.success('已删除');
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
  <div class="exec-tab sc-page">
    <!-- 目标主机选择 -->
    <div class="panel">
      <div class="panel-head"><h4>目标主机</h4></div>
      <ReSelect
        v-model="selectedHostIds"
        multiple
        filterable
        collapse-tags
        placeholder="选择主机(可多选)"
        :data="hosts.map(h => ({ label: `${h.serverHostName} (${h.serverHostAddress})`, value: h.id }))"
        style="width: 100%"
      />
    </div>

    <ReRow :gutter="16">
      <!-- 批量命令 -->
      <ReCol :span="12">
        <div class="panel">
          <div class="panel-head"><h4>批量命令</h4></div>
          <!-- 命令片段快捷填充 -->
          <ReSelect
            v-model="pickedSnippetId"
            placeholder="命令片段(选中即填入)"
            clearable
            filterable
            size="small"
            :data="snippetOptions"
            style="width: 100%; margin-bottom: 8px"
            @change="applySnippet"
          />
          <ReInput v-model="command" type="textarea" :rows="4" placeholder="如：df -h && free -m" />
          <div style="margin-top: 8px; display: flex; justify-content: space-between">
            <ReButton show-text icon="Document" size="small" @click="logDrawerVisible = true">执行日志</ReButton>
            <ReButton show-text icon="VideoPlay" type="primary" :loading="running" @click="onRunCommand">执行</ReButton>
          </div>
        </div>
      </ReCol>

      <!-- 文件分发 -->
      <ReCol :span="12">
        <div class="panel">
          <div class="panel-head"><h4>文件分发</h4></div>
          <ReInput v-model="distDirectory" placeholder="目标目录，如 /tmp">
            <template #prepend>目录</template>
          </ReInput>
          <label class="file-pick">
            <ReButton show-text icon="Upload" tag="span" plain>选择文件</ReButton>
            <span class="file-name" v-if="distFile">{{ distFile.name }}</span>
            <input type="file" hidden @change="(e: Event) => (distFile = (e.target as HTMLInputElement).files?.[0] ?? null)" />
          </label>
          <div style="margin-top: 8px; text-align: right">
            <ReButton show-text icon="Position" type="primary" :loading="distributing" @click="onDistribute">分发</ReButton>
          </div>
        </div>
      </ReCol>
    </ReRow>

    <!-- 最近执行结果 -->
    <div v-if="lastResults.length" class="panel">
      <div class="panel-head"><h4>最近执行结果</h4></div>
      <ReTable :data="lastResults" size="small" border :pagination="false" :toolbar="false" :layout-table="{ minHeight: 0, maxHeight: 240 }">
        <ReTableColumn prop="msExecLogHostName" label="主机" width="140" />
        <ReTableColumn prop="msExecLogStatus" label="状态" width="80">
          <template #default="{ row }">
            <ReTag :type="row.msExecLogStatus === 'SUCCESS' ? 'success' : 'danger'" size="small">
              {{ row.msExecLogStatus === 'SUCCESS' ? '成功' : '失败' }}
            </ReTag>
          </template>
        </ReTableColumn>
        <ReTableColumn prop="msExecLogOutput" label="输出" min-width="220" show-overflow-tooltip />
        <ReTableColumn prop="msExecLogError" label="错误" min-width="160" show-overflow-tooltip />
        <ReTableColumn prop="msExecLogCostMs" label="耗时(ms)" width="90" />
      </ReTable>
    </div>

    <!-- 计划任务 -->
    <div class="panel">
      <div class="panel-head">
        <h4>计划任务(cron)</h4>
        <ReButton show-text icon="Plus" type="primary" size="small" @click="openJobForm()">新增任务</ReButton>
      </div>
      <ReTable :data="jobs" size="small" border :pagination="false" :toolbar="false">
        <ReTableColumn prop="msExecJobName" label="名称" min-width="120" />
        <ReTableColumn prop="msExecJobCron" label="cron" width="110" />
        <ReTableColumn prop="msExecJobCommand" label="命令" min-width="180" show-overflow-tooltip />
        <ReTableColumn prop="msExecJobNextRunTime" label="下次运行" width="150" />
        <ReTableColumn label="启用" width="70">
          <template #default="{ row }">
            <ReTag :type="row.msExecJobEnabled === 1 ? 'success' : 'info'" size="small">
              {{ row.msExecJobEnabled === 1 ? '启用' : '停用' }}
            </ReTag>
          </template>
        </ReTableColumn>
        <ReTableColumn label="操作" width="170">
          <template #default="{ row }">
            <ReButton link type="primary" size="small" @click="onRunNow(row)">立即运行</ReButton>
            <ReButton link size="small" @click="openJobForm(row)">编辑</ReButton>
            <ReButton link type="danger" size="small" @click="onDeleteJob(row)">删除</ReButton>
          </template>
        </ReTableColumn>
      </ReTable>
    </div>

    <!-- 任务表单 -->
    <ReDialog v-model="jobFormVisible" :title="editingJobId ? '编辑任务' : '新增任务'" width="600" :height="460" confirm-text="保存" cancel-text="取消" @confirm="submitJob" @cancel="jobFormVisible = false">
      <ReForm label-width="100px" label-position="right">
        <ReFormItem label="任务名称" required>
          <ReInput v-model="jobForm.msExecJobName" placeholder="如 每日清理临时文件" />
        </ReFormItem>
        <ReFormItem label="cron 表达式" required>
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

    <!-- 执行日志抽屉 -->
    <ReDrawer v-model="logDrawerVisible" title="执行日志" :size="'58%'" :footer-hidden="true" close-only @cancel="logDrawerVisible = false">
      <template #content>
        <ReRadioGroup v-model="historyType" button size="small" capsule style="margin-bottom: 10px" @change="loadHistory">
          <ReRadioButton value="">全部</ReRadioButton>
          <ReRadioButton value="COMMAND">命令</ReRadioButton>
          <ReRadioButton value="FILE">文件</ReRadioButton>
          <ReRadioButton value="JOB">计划任务</ReRadioButton>
        </ReRadioGroup>
        <ReTable :data="historyLogs" size="small" border :pagination="false" :toolbar="false" :layout-table="{ minHeight: 0, maxHeight: 'calc(100vh - 180px)' }">
          <ReTableColumn prop="msExecLogHostName" label="主机" width="120" />
          <ReTableColumn prop="msExecLogType" label="类型" width="70">
            <template #default="{ row }">{{ row.msExecLogType }}</template>
          </ReTableColumn>
          <ReTableColumn prop="msExecLogCommand" label="命令/路径" min-width="160" show-overflow-tooltip />
          <ReTableColumn label="状态" width="80">
            <template #default="{ row }">
              <ReTag :type="row.msExecLogStatus === 'SUCCESS' ? 'success' : 'danger'" size="small">
                {{ row.msExecLogStatus === 'SUCCESS' ? '成功' : '失败' }}
              </ReTag>
            </template>
          </ReTableColumn>
          <ReTableColumn prop="msExecLogOutput" label="输出" min-width="200" show-overflow-tooltip />
          <ReTableColumn prop="msExecLogError" label="错误" min-width="140" show-overflow-tooltip />
          <ReTableColumn prop="msExecLogEndTime" label="结束时间" width="150" />
          <ReTableColumn prop="msExecLogCostMs" label="耗时(ms)" width="85" />
        </ReTable>
      </template>
    </ReDrawer>
  </div>
</template>

 <style scoped lang="scss">
.exec-tab {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .panel {
    background: var(--bg-container-card);
    border-radius: var(--border-radius);
    padding: 16px;
    border: 1px solid var(--border-subtle);
    box-shadow: var(--shadow-card);
    transition: var(--transition-base);
  }

  .panel:hover {
    box-shadow: var(--shadow-card-hover);
  }

  .panel_head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-subtle);
  }

  .panel_head h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .file-pick {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    cursor: pointer;

    .file-name {
      font-size: 12px;
      color: var(--text-tertiary);
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>