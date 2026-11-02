<template>
  <div class="vtp">
    <!-- 厂商页签：定时任务是厂商维度的能力，每家厂商一套任务 -->
    <nav class="vtp-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="vtp-tab"
        :class="{ 'is-active': activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <span class="vtp-tab__label">{{ tab.label }}</span>
        <b class="vtp-tab__count">{{ tab.count }}</b>
      </button>
      <span class="vtp-grow" />
      <ReButton icon="RefreshRight" :show-text="true" size="small" :loading="loading" @click="load">
        刷新
      </ReButton>
    </nav>

    <p class="vtp-desc">
      定时任务挂在厂商凭据上：开/关与间隔在
      <b>接入凭据 → 高级配置</b> 中按凭据维护，也可在本页临时调整。
      间隔优先级为「凭据高级配置 → 本页调整 → 默认 30 秒」；开关关闭或凭据停用时，该任务不注册时间轮。
    </p>

    <!-- 任务列表 -->
    <section class="vtp-panel">
      <ReTable
        v-if="rows.length"
        :data="tableRows"
        :columns="columns"
        engine="element"
        table-id="device-vendor-task-states"
        row-key="name"
        :loading="loading"
        :pagination="false"
        :toolbar="false"
        :settings="{ border: false }"
        style="width: 100%"
      >
        <template #col-task="{ row }">
          <div class="vtp-task">
            <span class="vtp-task__name">{{ row.label }}</span>
            <span class="vtp-task__code">{{ row.name }}</span>
          </div>
        </template>
        <template #col-credential="{ row }">
          <div class="vtp-cred">
            <span class="vtp-cred__name">{{ row.credentialName }}</span>
            <span class="vtp-cred__vendor">{{ vendorName(row.vendor) }}</span>
          </div>
        </template>
        <template #col-running="{ row }">
          <ReTag :type="row.running ? 'success' : 'info'" size="small" effect="plain">
            {{ row.running ? '执行中' : '空闲' }}
          </ReTag>
        </template>
        <template #col-lastRunAt="{ row }">
          <span class="vtp-mono">{{ row.lastRunAt ? formatDateTime(row.lastRunAt) : '从未执行' }}</span>
        </template>
        <template #col-interval="{ row }">
          <div class="vtp-int">
            <ReInputNumber
              v-model="row.interval"
              :min="1"
              :max="86400"
              :step="10"
              size="small"
              style="width: 116px"
              @change="(value: number | undefined) => onIntervalChange(row, value)"
            />
            <span class="vtp-int__unit">秒</span>
          </div>
        </template>
        <template #col-actions="{ row }">
          <ReButton
            icon="Promotion"
            :show-text="true"
            size="small"
            :loading="runningTask === row.name"
            @click="runNow(row)"
          >
            立即执行
          </ReButton>
        </template>
      </ReTable>

      <article v-else class="vtp-ghost">
        <span class="vtp-ghost__icon"><el-icon><Timer /></el-icon></span>
        <p class="vtp-ghost__title">该厂商还没有注册定时任务</p>
        <p class="vtp-ghost__desc">
          到「接入凭据 → 高级配置」打开在离线检测 / 设备自动同步 / 组织自动同步，保存后任务会立即补种到这个页签。
        </p>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * 厂商维度的定时任务面板（厂商接入页 · 定时任务页签）
 *
 * <p>任务名与归属：</p>
 * <ul>
 *   <li>{@code offlineDetect_{credentialId}} —— 在离线检测</li>
 *   <li>{@code deviceSync_{credentialId}} —— 设备自动同步</li>
 *   <li>{@code orgSync_{credentialId}} —— 组织自动同步</li>
 *   <li>其余为全局任务（在离线检测 / 事件轮询 / 厂商同步 / 门禁记录抽取）</li>
 * </ul>
 *
 * <p>厂商页签由凭据的 vendor 归并（任务名后缀 → 凭据 → 厂商），
 * 这样「定时任务属于厂商」而不只是一个与厂商无关的全局任务列表。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, onMounted, ref } from 'vue'
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
import type { DeviceVendorDescriptor, ProviderCredential } from '../types/device'

const props = withDefaults(
  defineProps<{
    /** 厂商描述符（页签顺序与显示名） */
    vendors?: DeviceVendorDescriptor[]
    /** 当前凭据列表（任务名后缀 → 凭据 → 厂商） */
    credentials?: ProviderCredential[]
  }>(),
  { vendors: () => [], credentials: () => [] }
)

/** 后端任务状态行 */
interface TaskState {
  deviceTaskStateId: string
  deviceTaskStateName: string
  deviceTaskStateRunning: boolean
  deviceTaskStateLastRunAt?: string
  deviceTaskStateInterval?: number
  deviceTaskStateDescription?: string
}

/** 按厂商归并后的一行 */
interface TaskRow {
  name: string
  label: string
  description: string
  running: boolean
  lastRunAt?: string
  interval?: number
  credentialId: string
  credentialName: string
  vendor: string
}

/** 凭据级任务前缀 → 展示名 */
const PREFIX_LABELS: Array<[string, string]> = [
  ['offlineDetect_', '在离线检测'],
  ['deviceSync_', '设备自动同步'],
  ['orgSync_', '组织自动同步']
]

/** 全局任务 → 展示名 */
const GLOBAL_LABELS: Record<string, string> = {
  deviceOfflineCheck: '在离线检测',
  deviceEventPoll: '事件轮询',
  deviceSync: '厂商设备目录同步',
  deviceAccessExtract: '门禁记录抽取'
}

const taskStates = ref<TaskState[]>([])
const loading = ref(false)
const runningTask = ref('')
/** 任务名 → 最近一次保存成功的间隔（失败回填用） */
const savedInterval = new Map<string, number>()

const credentialMap = computed(
  () => new Map(props.credentials.map((item) => [item.deviceCredentialId || '', item]))
)

const allRows = computed<TaskRow[]>(() => {
  const out: TaskRow[] = []
  for (const state of taskStates.value) {
    const name = String(state.deviceTaskStateName || '')
    const base = {
      name,
      description: state.deviceTaskStateDescription || '',
      running: Boolean(state.deviceTaskStateRunning),
      lastRunAt: state.deviceTaskStateLastRunAt,
      interval: state.deviceTaskStateInterval
    }
    const hit = PREFIX_LABELS.find(([prefix]) => name.startsWith(prefix))
    if (hit) {
      const credentialId = name.slice(hit[0].length)
      const credential = credentialMap.value.get(credentialId)
      out.push({
        ...base,
        label: hit[1],
        credentialId,
        credentialName: credential?.deviceCredentialName || credentialId || '未知凭据',
        vendor: credential?.deviceCredentialVendor || ''
      })
      continue
    }
    out.push({
      ...base,
      label: GLOBAL_LABELS[name] || name,
      credentialId: '',
      credentialName: '全局',
      vendor: ''
    })
  }
  return out
})

/** 页签：全部 + 各厂商 + 全局任务 */
const tabs = computed<Array<{ key: string; label: string; count: number }>>(() => {
  const list = [{ key: 'all', label: '全部', count: allRows.value.length }]
  for (const vendor of props.vendors) {
    list.push({
      key: vendor.vendor,
      label: vendor.name,
      count: allRows.value.filter((row) => row.vendor === vendor.vendor).length
    })
  }
  // 凭据已删除或厂商描述符缺失的任务，单独归到「全局任务」之外的未归类页签
  const unmatched = allRows.value.filter((row) => !row.vendor && row.credentialId).length
  list.push({
    key: 'global',
    label: '全局任务',
    count: allRows.value.filter((row) => !row.vendor).length
  })
  if (unmatched) {
    list.push({ key: 'unmatched', label: '未归类', count: unmatched })
  }
  return list
})

const activeTab = ref('all')

const rows = computed<TaskRow[]>(() => {
  if (activeTab.value === 'all') return allRows.value
  if (activeTab.value === 'global') return allRows.value.filter((row) => !row.vendor && !row.credentialId)
  if (activeTab.value === 'unmatched') return allRows.value.filter((row) => !row.vendor && row.credentialId)
  return allRows.value.filter((row) => row.vendor === activeTab.value)
})

/** ReTable 只收 Record 数组，真实结构是 TaskRow */
const tableRows = computed<Array<Record<string, unknown>>>(
  () => rows.value as unknown as Array<Record<string, unknown>>
)

const columns: ReTableColumn[] = [
  { prop: 'label', label: '任务', slot: 'col-task', minWidth: 200 },
  { prop: 'credentialName', label: '所属凭据', slot: 'col-credential', minWidth: 180 },
  { prop: 'description', label: '说明', minWidth: 220, showOverflowTooltip: true },
  { prop: 'running', label: '运行状态', width: 100, slot: 'col-running' },
  { prop: 'lastRunAt', label: '最后执行', minWidth: 170, slot: 'col-lastRunAt' },
  { prop: 'interval', label: '间隔（秒）', width: 180, slot: 'col-interval' },
  { prop: 'actions', label: '操作', width: 130, slot: 'col-actions', align: 'right' }
]

function vendorName(vendor: string): string {
  if (!vendor) return '全局'
  return props.vendors.find((item) => item.vendor === vendor)?.name || vendor
}

async function load(): Promise<void> {
  loading.value = true
  try {
    taskStates.value = ((await deviceApi.listTaskStates()) as TaskState[]) || []
    savedInterval.clear()
    for (const state of taskStates.value) {
      savedInterval.set(
        state.deviceTaskStateName,
        Number(state.deviceTaskStateInterval) || 30
      )
    }
  } catch (err) {
    taskStates.value = []
    message.error('加载任务状态失败：' + errorText(err))
  } finally {
    loading.value = false
  }
}

async function onIntervalChange(row: TaskRow, value: number | undefined): Promise<void> {
  const previous = savedInterval.get(row.name) ?? 30
  const next = Number(value)
  if (!Number.isFinite(next) || next <= 0) {
    ElMessage.warning('任务间隔必须大于 0 秒')
    row.interval = previous
    return
  }
  try {
    await deviceApi.updateTaskInterval(row.name, next)
    savedInterval.set(row.name, next)
    row.interval = next
    ElMessage.success(`「${row.label}」间隔已设为 ${next} 秒`)
  } catch (err) {
    row.interval = previous
    message.error('更新间隔失败：' + errorText(err))
  }
}

/** 立即执行：绕过时间轮 tick，支持凭据级任务名 */
async function runNow(row: TaskRow): Promise<void> {
  runningTask.value = row.name
  try {
    const ok = await deviceApi.runTask(row.name)
    if (ok) {
      ElMessage.success(`已触发「${row.label}」`)
    } else {
      ElMessage.warning(`「${row.label}」没有对应的执行入口或执行失败`)
    }
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
.vtp {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
  padding: 2px 0 4px;
  color: var(--el-text-color-primary);
}

/* ---- 厂商页签 ---- */
.vtp-tabs {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.vtp-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
  cursor: pointer;
  transition: color 0.16s ease, border-color 0.16s ease, background 0.16s ease;
}
.vtp-tab:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-7);
}
.vtp-tab.is-active {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
  background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
  font-weight: 600;
}
.vtp-tab__count {
  font-family: var(--el-font-family-mono, monospace);
  font-size: 11px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}
.vtp-grow { flex: 1; }

.vtp-desc {
  flex: none;
  margin: 0;
  padding: 10px 14px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
  background: color-mix(in srgb, var(--el-color-primary) 5%, transparent);
  border-radius: var(--el-radius-lg, 12px);
}

/* ---- 任务表 ---- */
.vtp-panel {
  flex: 1;
  min-height: 0;
  padding: 12px 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
  overflow: auto;
}

.vtp-task {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.vtp-task__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.vtp-task__code {
  font-family: var(--el-font-family-mono, monospace);
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
.vtp-cred {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.vtp-cred__name {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vtp-cred__vendor {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
.vtp-int {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.vtp-int__unit {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.vtp-mono {
  font-family: var(--el-font-family-mono, monospace);
  font-size: 12px;
}

.vtp-ghost {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 48px 20px;
  text-align: center;
  color: var(--el-text-color-secondary);
}
.vtp-ghost__icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  font-size: 20px;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  border-radius: 12px;
}
.vtp-ghost__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.vtp-ghost__desc {
  margin: 0;
  max-width: 520px;
  font-size: 12px;
  line-height: 1.6;
}
</style>
