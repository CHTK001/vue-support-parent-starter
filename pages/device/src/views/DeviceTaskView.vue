<template>
  <div class="dtv">
    <!-- 说明 -->
    <section class="dtv-desc">
      <span class="dtv-desc__icon"><el-icon><Timer /></el-icon></span>
      <div class="dtv-desc__body">
        <p>
          后台定时任务由时间轮统一驱动（每秒 tick，按
          <code class="dtv-desc__code">device_task_state.interval</code> 判断是否到期）。
          调整间隔后下一轮即生效：适用于
          <b>在离线检测</b>、<b>事件轮询</b>、<b>厂商同步</b>、<b>门禁记录抽取</b>。
        </p>
        <p>
          每套凭据的进阶开关在 <b>接入凭据页 / 高级配置</b> 中：在离线检测、设备自动同步、组织自动同步 各开各关；
          间隔留 0 则走默认 30 秒，开关关闭或间隔为 0 不给时间轮注册任务。
        </p>
      </div>
      <div class="dtv-desc__ops">
        <ReButton icon="RefreshRight" :show-text="true" :loading="loading" @click="load">刷新</ReButton>
      </div>
    </section>

    <!-- 任务列表 -->
    <section class="dtv-panel">
      <header class="dtv-panel__head">
        <span class="dtv-panel__bar" />
        <span>任务列表</span>
        <span class="dtv-panel__count">{{ rows.length }}</span>
      </header>

      <ReTable
        v-if="rows.length"
        :data="rows"
        :columns="columns"
        engine="element"
        table-id="device-task-states"
        row-key="deviceTaskStateId"
        :pagination="false"
        :toolbar="false"
        :settings="{ border: false }"
        style="width: 100%"
      >
        <template #col-running="{ row }">
          <ReTag :type="row.deviceTaskStateRunning ? 'success' : 'info'" size="small" effect="plain">
            {{ row.deviceTaskStateRunning ? '执行中' : '空闲' }}
          </ReTag>
        </template>
        <template #col-lastRunAt="{ row }">
          <span class="dtv-mono">{{ row.deviceTaskStateLastRunAt ? formatDateTime(row.deviceTaskStateLastRunAt) : '从未执行' }}</span>
        </template>
        <template #col-interval="{ row }">
          <div class="dtv-int">
            <ReInputNumber
              :model-value="row.deviceTaskStateInterval ?? 30"
              :min="1"
              :max="86400"
              :step="10"
              size="small"
              style="width: 116px"
              @change="(v: number | undefined) => onIntervalChange(row, v)"
            />
            <span class="dtv-int__unit">秒</span>
          </div>
        </template>
        <template #col-actions="{ row }">
          <ReButton
            icon="Promotion"
            :show-text="true"
            size="small"
            :loading="runningTask === row.deviceTaskStateName"
            @click="runNow(row)"
          >
            立即执行
          </ReButton>
        </template>
      </ReTable>

      <article v-else class="dtv-ghost">
        <span class="dtv-ghost__icon"><el-icon><Timer /></el-icon></span>
        <p class="dtv-ghost__title">还没有定时任务状态</p>
        <p class="dtv-ghost__desc">任务状态行由 seed SQL（全局任务）与凭据保存时补种（凭据级任务）；时间轮会在重启后自动注册并驱动。</p>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * 定时任务配置 —— 时间轮任务状态与间隔调整。
 *
 * 数据来自 device-starter 的 `/api/device/tasks`：
 *   - GET  /list                全部任务状态（interval / running / lastRunAt）
 *   - PUT  /{taskName}/interval 改间隔（秒）
 *   - POST /{taskName}/run      立即执行（绕过时间轮 tick；支持凭据级任务名）
 *
 * 任务名与业务的映射（seed SQL 补种 + DeviceScheduleManager 凭据级补种）：
 *   - deviceOfflineCheck   在离线检测（重连恢复）
 *   - deviceEventPoll      事件轮询（从会话拉事件落库）
 *   - deviceSync           厂商设备目录同步（fetchDevices → 台账 upsert）
 *   - deviceAccessExtract  门禁出入记录抽取（queryAccessRecords → 落库）
 *   - offlineDetect_{cred} 该凭据维度的在离线检测
 *   - deviceSync_{cred}    该凭据维度的设备自动同步
 *   - orgSync_{cred}       该凭据维度的组织自动同步
 *
 * 任务间隔档位：interval=0（不使用）→ 使用 credential 配置间隔 → 5 秒兜底；
 * 凭据级开关关闭或间隔为 0 的任务不注册任何时间轮 tick，不会出现在任务列表。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Timer } from '@element-plus/icons-vue'

import ReButton from '@repo/ui/re-button'
import ReInputNumber from '@repo/ui/re-input-number'
import ReTable from '@repo/ui/re-table'
import type { ReTableColumn } from '@repo/ui/re-table'
import ReTag from '@repo/ui/re-tag'
import { message } from '@repo/core'

import { deviceApi } from '../api/deviceApi'
import { formatDateTime } from '../utils/deviceFormat'

/** 任务状态（与后端 DeviceTaskState 对齐） */
interface TaskState {
  deviceTaskStateId: string
  deviceTaskStateName: string
  deviceTaskStateRunning: boolean
  deviceTaskStateLastRunAt?: string
  deviceTaskStateInterval?: number
  deviceTaskStateDescription?: string
}

/** 任务名 → 中文名（展示用） */
const TASK_NAME_LABELS: Record<string, string> = {
  deviceOfflineCheck: '在离线检测',
  deviceEventPoll: '事件轮询',
  deviceSync: '厂商同步',
  deviceAccessExtract: '门禁记录抽取',
}

/** 凭据级任务前缀 → 中文名（每套凭据一个任务） */
const TASK_PREFIX_LABELS: Record<string, string> = {
  offlineDetect_: '在离线检测',
  deviceSync_: '设备自动同步',
  orgSync_: '组织自动同步',
}

/** 任务名 → 展示名（全局任务查表，凭据级任务按前缀匹配） */
function labelOf(name: string): string {
  const label =
    TASK_NAME_LABELS[name] ??
    Object.entries(TASK_PREFIX_LABELS).find(([prefix]) => name.startsWith(prefix))?.[1]
  return label ? `${label}（${name}）` : name
}

/** 任务行 → 展示名 */
function taskLabel(row: TaskState): string {
  return labelOf(String(row.deviceTaskStateName || ''))
}

const rows = ref<TaskState[]>([])
const loading = ref(false)
const runningTask = ref('')

const columns = computed<ReTableColumn[]>(() => [
  {
    prop: 'deviceTaskStateName',
    label: '任务',
    minWidth: 180,
    formatter: (row: Record<string, unknown>) => labelOf(String(row.deviceTaskStateName || '')),
  },
  { prop: 'deviceTaskStateDescription', label: '说明', minWidth: 220 },
  { prop: 'running', label: '运行状态', width: 100, slot: 'col-running' },
  { prop: 'lastRunAt', label: '最后执行', minWidth: 170, slot: 'col-lastRunAt' },
  { prop: 'interval', label: '间隔（秒）', width: 180, slot: 'col-interval' },
  { prop: 'actions', label: '操作', width: 130, slot: 'col-actions', align: 'right' },
])

async function load(): Promise<void> {
  loading.value = true
  try {
    const list = (await deviceApi.listTaskStates()) as TaskState[]
    rows.value = list || []
  } catch (err) {
    rows.value = []
    message.error('加载任务状态失败：' + errorText(err))
  } finally {
    loading.value = false
  }
}

async function onIntervalChange(row: TaskState, value: number | undefined): Promise<void> {
  const next = Number(value)
  if (!Number.isFinite(next) || next <= 0) {
    ElMessage.warning('任务间隔必须大于 0')
    return
  }
  try {
    await deviceApi.updateTaskInterval(row.deviceTaskStateName, next)
    row.deviceTaskStateInterval = next
    ElMessage.success(`「${taskLabel(row)}」间隔已设为 ${next} 秒`)
  } catch (err) {
    message.error('更新间隔失败：' + errorText(err))
  }
}

/** 立即执行：绕过时间轮 tick，支持凭据级任务名（offlineDetect_{cred}/deviceSync_{cred}/orgSync_{cred}） */
async function runNow(row: TaskState): Promise<void> {
  const name = row.deviceTaskStateName
  runningTask.value = name
  try {
    const ok = await deviceApi.runTask(name)
    ElMessage.success(ok ? `已触发「${taskLabel(row)}」` : `「${name}」暂无可调度的执行入口`)
  } catch (err) {
    message.error('立即执行失败：' + errorText(err))
  } finally {
    runningTask.value = ''
  }
}

function errorText(err: unknown): string {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    || (err as Error)?.message
    || '未知错误'
}

onMounted(load)
</script>

<style scoped>
.dtv {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 10px 0 12px;
  min-height: 100%;
  color: var(--el-text-color-primary);
}

.dtv-desc {
  flex: none;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
}
.dtv-desc__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dtv-desc__icon {
  flex: none;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  font-size: 16px;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  border-radius: var(--el-radius-base, 8px);
}
.dtv-desc p {
  flex: 1;
  min-width: 0;
  margin: 0;
}
.dtv-desc__code {
  padding: 1px 5px;
  font-family: var(--el-font-family-mono, monospace);
  font-size: 12px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}
.dtv-desc__ops {
  flex: none;
  display: flex;
  align-items: center;
}

.dtv-panel {
  flex: 1;
  min-height: 0;
  padding: 14px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}
.dtv-panel__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.dtv-panel__bar {
  width: 6px;
  height: 16px;
  border-radius: 999px;
  background: var(--el-color-primary);
}
.dtv-panel__count {
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.dtv-int {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.dtv-int__unit {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.dtv-mono {
  font-family: var(--el-font-family-mono, monospace);
  font-size: 12px;
}

.dtv-ghost {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 40px 20px;
  text-align: center;
  border: 1px dashed var(--el-border-color);
  border-radius: var(--el-radius-lg, 12px);
}
.dtv-ghost__icon {
  font-size: 28px;
  color: var(--el-text-color-placeholder);
}
.dtv-ghost__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}
.dtv-ghost__desc {
  margin: 0;
  max-width: 420px;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}
</style>