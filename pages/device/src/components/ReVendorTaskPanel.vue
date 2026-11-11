<template>
  <div class="vtp">
    <!-- 厂商页签：只在整页浏览时出现；抽屉里只看这一家 -->
    <nav v-if="!vendor" class="vtp-tabs">
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

    <nav v-else class="vtp-tabs">
      <span class="vtp-scope">该厂商共 {{ rows.length }} 个任务 · 每套凭据各跑各的</span>
      <span class="vtp-grow" />
      <ReButton icon="RefreshRight" :show-text="true" size="small" :loading="loading" @click="load">
        刷新
      </ReButton>
    </nav>

    <p class="vtp-desc">
      定时任务挂在厂商凭据上：开关与间隔在
      <b>接入凭据 → 能力 / 任务</b> 中按凭据维护。
      未开启的能力不注册时间轮，也不产生同步记录。
    </p>

    <!-- 任务面板：默认「表盘」卡片（2026-11 定版 B 方案），可切回表格 -->
    <section class="vtp-panel">
      <!-- 表盘视图 -->
      <div v-if="variant === 'dial' && rows.length" class="vtp-grid">
        <article
          v-for="row in rows"
          :key="row.name"
          class="vtp-card"
          :class="{ 'is-running': row.running }"
          :data-task="row.name"
        >
          <header class="vtp-card__head">
            <div class="vtp-task">
              <span class="vtp-task__name">{{ row.label }}</span>
              <span class="vtp-task__code">{{ row.name }}</span>
            </div>
            <ReTag :type="row.running ? 'success' : 'info'" size="small" effect="plain">
              {{ row.running ? '执行中' : '空闲' }}
            </ReTag>
          </header>

          <!-- 表盘：外环是「距下次执行还剩多少」的倒计时（ReCountdown dial）；
               已过期就换成按秒推进的「逾期 mm:ss」，不会停在 00:00:00 上一动不动 -->
          <div
            class="vtp-dial"
            :class="{ 'is-full': dialProgress(row) >= 1, 'is-idle': !row.lastRunAt, 'is-overdue': isOverdue(row) }"
            :data-progress="dialProgress(row).toFixed(2)"
            role="img"
            :aria-label="`${row.label} 间隔 ${row.interval ?? 30} 秒，${ago(row.lastRunAt)}`"
          >
            <ReCountdown
              layout="dial"
              :size="96"
              :end="nextRunAt(row)"
              :total="intervalMs(row)"
              :paused="!row.lastRunAt || row.running"
              :show-number="!!row.lastRunAt && !isOverdue(row)"
              :show-text="false"
              :color="isOverdue(row) || dialProgress(row) >= 1 ? 'warning' : 'primary'"
            />
            <span v-if="isOverdue(row)" class="vtp-dial__due">
              <b>{{ overdueText(row) }}</b>
              <i>逾期</i>
            </span>
            <span v-else-if="!row.lastRunAt" class="vtp-dial__due">
              <b>{{ row.interval ?? 30 }}</b>
              <i>秒</i>
            </span>
          </div>

          <dl class="vtp-card__meta">
            <div class="vtp-card__kv">
              <dt>所属凭据</dt>
              <dd :title="row.credentialName">{{ row.credentialName }}</dd>
            </div>
            <div class="vtp-card__kv">
              <dt>厂商</dt>
              <dd>{{ vendorName(row.vendor) }}</dd>
            </div>
            <div class="vtp-card__kv">
              <dt>最后执行</dt>
              <dd class="vtp-mono">{{ row.lastRunAt ? formatDateTime(row.lastRunAt) : '从未执行' }}</dd>
            </div>
            <div class="vtp-card__kv">
              <dt>距今</dt>
              <dd class="vtp-mono">{{ ago(row.lastRunAt) }}</dd>
            </div>
          </dl>

          <footer class="vtp-card__foot">
            <label class="vtp-int">
              <span class="vtp-int__label">间隔</span>
              <ReInputNumber
                v-model="row.interval"
                :min="1"
                :max="86400"
                :step="10"
                size="small"
                style="width: 104px"
                @change="(value: number | undefined) => onIntervalChange(row, value)"
              />
              <span class="vtp-int__unit">秒</span>
            </label>
            <ReButton
              icon="Promotion"
              :show-text="true"
              size="small"
              :loading="runningTask === row.name"
              @click="runNow(row)"
            >
              立即执行
            </ReButton>
          </footer>
        </article>
      </div>

      <!-- 表格视图（保留：大数据量或需要对齐比对时用） -->
      <ReTable
        v-else-if="variant === 'table' && rows.length"
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

      <article v-if="!rows.length" class="vtp-ghost">
        <span class="vtp-ghost__icon"><el-icon><Timer /></el-icon></span>
        <p class="vtp-ghost__title">该厂商还没有注册定时任务</p>
        <p class="vtp-ghost__desc">
          到「接入凭据 → 能力 / 任务」打开在离线检测 / 事件轮询 / 设备同步 / 组织同步，保存后任务会立即补种到这里。
        </p>
      </article>
    </section>

    <!-- 组织同步：属于单个厂商的能力，抽屉里单独成卡 -->
    <section v-if="vendor" class="vtp-org">
      <header class="vtp-org__head">
        <span class="vtp-org__title">组织同步</span>
        <span class="vtp-org__hint">按凭据拉取厂商侧组织树与人员，只影响本厂商</span>
      </header>

      <div v-if="orgCredentials.length" class="vtp-org__grid">
        <article
          v-for="credential in orgCredentials"
          :key="credential.deviceCredentialId"
          class="vtp-org__card"
          :data-org-credential="credential.deviceCredentialId"
        >
          <header class="vtp-org__card-head">
            <span class="vtp-org__name">{{ credential.deviceCredentialName }}</span>
            <span class="vtp-org__last">
              {{ orgLastRun(credential) ? `上次 ${ago(orgLastRun(credential))}` : '尚未自动同步' }}
            </span>
          </header>
          <div class="vtp-org__actions">
            <ReButton
              size="small"
              :show-text="true"
              :loading="orgLoading[`${credential.deviceCredentialId}:org`]"
              @click="pullOrg(credential, 'org')"
            >
              拉取组织
            </ReButton>
            <ReButton
              size="small"
              :show-text="true"
              :loading="orgLoading[`${credential.deviceCredentialId}:person`]"
              @click="pullOrg(credential, 'person')"
            >
              拉取人员
            </ReButton>
          </div>
          <span class="vtp-org__result">
            {{ orgResults[`${credential.deviceCredentialId}:org`] || '组织：—' }}
            <i>·</i>
            {{ orgResults[`${credential.deviceCredentialId}:person`] || '人员：—' }}
          </span>
        </article>
      </div>

      <p v-else class="vtp-org__none">当前厂商未开通组织能力，没有组织同步任务，也不会产生组织记录。</p>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * 厂商维度的定时任务面板（厂商接入页 · 定时任务页签）
 *
 * <p><b>2026-11 改版：任务列表从「表格」改成「表盘卡片网格」（定版方案 B）。</b>
 * 表格把「间隔」和「最后执行」拆在两列，要自己相减才知道任务到底跟没跟上；
 * 表盘把这两件事压成一个环：外环 = 距上次执行已过时间 / 间隔，环满即到期，
 * 中心直接是间隔秒数。哪台厂商的任务卡住了，扫一眼形状就能看出来。</p>
 *
 * <p>为什么留 {@code variant} 开关：卡片适合按厂商翻（一屏 6~12 张），
 * 但要做「跨厂商对齐比对」时表格更省事，所以表格视图保留可切（默认 dial）。</p>
 *
 * <p>任务名与归属：</p>
 * <ul>
 *   <li>{@code offlineDetect_{credentialId}} —— 在离线检测</li>
 *   <li>{@code deviceSync_{credentialId}} —— 设备自动同步</li>
 *   <li>{@code orgSync_{credentialId}} —— 组织自动同步</li>
 *   <li>{@code metricCollect_{credentialId}} —— 环境指标采集</li>
 *   <li>其余为全局任务（在离线检测 / 事件轮询 / 厂商同步 / 门禁记录抽取）</li>
 * </ul>
 *
 * <p>厂商页签由凭据的 vendor 归并（任务名后缀 → 凭据 → 厂商），
 * 这样「定时任务属于厂商」而不只是一个与厂商无关的全局任务列表。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Timer } from '@element-plus/icons-vue'

import ReButton from '@repo/ui/re-button'
import ReCountdown from '@repo/ui/re-countdown'
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
    /** 视图：表盘卡片（默认）或表格 */
    variant?: 'dial' | 'table'
    /** 只看这一家厂商（行操作打开的任务抽屉）；为空则显示全部厂商页签 */
    vendor?: string
  }>(),
  { vendors: () => [], credentials: () => [], variant: 'dial', vendor: '' }
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
  ['eventPoll_', '事件轮询'],
  ['deviceSync_', '设备自动同步'],
  ['orgSync_', '组织自动同步'],
  ['metricCollect_', '环境指标采集']
]

/** 仍由时间轮统一调度的任务 → 展示名 */
const GLOBAL_LABELS: Record<string, string> = {
  deviceAccessExtract: '门禁记录抽取'
}

const taskStates = ref<TaskState[]>([])
const loading = ref(false)
const runningTask = ref('')
/** 任务名 → 最近一次保存成功的间隔（失败回填用） */
const savedInterval = new Map<string, number>()

/**
 * 任务间隔（秒）→ 毫秒。表盘倒计时的总时长也用它，保证环与数字同源。
 *
 * @param row 任务行
 * @returns 间隔毫秒（最小 1 秒）
 */
function intervalMs(row: TaskRow): number {
  return Math.max(1, Number(row.interval) || 30) * 1000
}

/**
 * 下一次执行的时间戳：上次执行 + 间隔。
 *
 * <p>从未执行过时给一个固定的过去时刻，让倒计时停在 00:00:00 并保持暂停，
 * 而不是每次渲染都取「现在 + 间隔」——那样数字会一直跳。</p>
 *
 * @param row 任务行
 * @returns 下次执行时间戳（ms）
 */
function nextRunAt(row: TaskRow): number {
  if (!row.lastRunAt) return NEVER_RUN_END
  const last = new Date(row.lastRunAt).getTime()
  if (!Number.isFinite(last)) return NEVER_RUN_END
  return last + intervalMs(row)
}

/**
 * 「现在」的时钟。表盘要真的在走，所以每秒推进一次；
 * 卸载时清掉定时器（否则离开页签后仍在跑，属明显泄漏）。
 */
const now = ref(Date.now())
let ticker: ReturnType<typeof setInterval> | undefined
/** 任务状态轮询：last_run_at 只有后端调度完才写库，只挂载时读一次会让表盘一直停在旧值 */
const STATE_POLL_MS = 10_000
let poller: ReturnType<typeof setInterval> | undefined
/** 从未执行过的任务给一个固定的过去时刻，保证倒计时稳定停在 0（不能每次渲染都取 Date.now()） */
const NEVER_RUN_END = Date.now()

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
  if (props.vendor) return allRows.value.filter((row) => row.vendor === props.vendor)
  if (activeTab.value === 'all') return allRows.value
  if (activeTab.value === 'global') return allRows.value.filter((row) => !row.vendor && !row.credentialId)
  if (activeTab.value === 'unmatched') return allRows.value.filter((row) => !row.vendor && row.credentialId)
  return allRows.value.filter((row) => row.vendor === activeTab.value)
})

/* ==================== 组织同步卡片（抽屉内，按凭据） ==================== */
/** 抽屉里属于当前厂商、且平台支持 ORG 的凭据 */
const orgCredentials = computed<ProviderCredential[]>(() => {
  if (!props.vendor) return []
  const descriptor = props.vendors.find((item) => item.vendor === props.vendor)
  if (!descriptor?.capabilities?.includes('ORG')) return []
  return props.credentials.filter((item) => item.deviceCredentialVendor === props.vendor)
})

/** 凭据 id → 最近一次组织/人员同步结果文案 */
const orgResults = reactive<Record<string, string>>({})
const orgLoading = reactive<Record<string, boolean>>({})

/** 该凭据组织同步任务的上次执行时间（任务名 orgSync_{credId}） */
function orgLastRun(credential: ProviderCredential): string | undefined {
  const name = `orgSync_${credential.deviceCredentialId || ''}`
  return taskStates.value.find((state) => state.deviceTaskStateName === name)?.deviceTaskStateLastRunAt
}

async function pullOrg(credential: ProviderCredential, kind: 'org' | 'person'): Promise<void> {
  const id = credential.deviceCredentialId
  if (!id) return
  orgLoading[`${id}:${kind}`] = true
  try {
    const result = kind === 'org'
      ? await deviceApi.syncOrgByCredential(id)
      : await deviceApi.syncPersonsByCredential(id)
    orgResults[`${id}:${kind}`] = `新增 ${result.created} · 更新 ${result.updated} · 跳过 ${result.skipped}`
    ElMessage.success(`${kind === 'org' ? '组织' : '人员'}同步完成`)
    await load()
  } catch (err) {
    message.error('同步失败：' + errorText(err))
  } finally {
    orgLoading[`${id}:${kind}`] = false
  }
}

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

/**
 * 表盘进度：距上次执行已过时间 / 间隔，夹在 0~1。
 *
 * <p>从未执行按 0 处理（没有可参照的起点，不能假装「刚好到期」）；
 * 执行中的任务给满环，表示「正在跑，这一轮已经用掉了」。</p>
 *
 * @param row 任务行
 * @returns 0~1 的进度
 */
function dialProgress(row: TaskRow): number {
  if (row.running) return 1
  if (!row.lastRunAt) return 0
  const last = new Date(row.lastRunAt).getTime()
  if (!Number.isFinite(last)) return 0
  const ratio = (now.value - last) / intervalMs(row)
  if (!Number.isFinite(ratio)) return 0
  return Math.min(1, Math.max(0, ratio))
}

/**
 * 是否已经过了应执行时刻（后端调度没跟上）。
 *
 * <p>此时剩余时间恒为 0，若只靠倒计时，表盘会永远停在 00:00:00——
 * 用户看到的就是「倒计时根本不动」。过期后改用「逾期 mm:ss」向上计时。</p>
 *
 * @param row 任务行
 * @returns 是否逾期
 */
function isOverdue(row: TaskRow): boolean {
  if (row.running || !row.lastRunAt) return false
  const last = new Date(row.lastRunAt).getTime()
  if (!Number.isFinite(last)) return false
  return now.value >= nextRunAt(row)
}

/**
 * 逾期时长（HH:MM:SS），每秒推进一次，证明表盘还活着。
 *
 * @param row 任务行
 * @returns 形如 00:03:12 的逾期时长
 */
function overdueText(row: TaskRow): string {
  const total = Math.max(0, Math.floor((now.value - nextRunAt(row)) / 1000))
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`
}

/**
 * 距上次执行多久（口语化）。
 *
 * @param iso 最后执行时间
 * @returns 如「12 秒前」「3 分前」「从未执行」
 */
function ago(iso?: string): string {
  if (!iso) return '从未执行'
  const last = new Date(iso).getTime()
  if (!Number.isFinite(last)) return '从未执行'
  const seconds = Math.max(0, Math.round((now.value - last) / 1000))
  if (seconds < 60) return `${seconds} 秒前`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} 分前`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  return `${Math.round(hours / 24)} 天前`
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

/**
 * 静默刷新任务状态（轮询用）：不点亮刷新按钮，失败也不弹错。
 *
 * <p>表盘倒计时的起点是 last_run_at，后端只有调度完才写库；
 * 只靠挂载时读一次的话，倒计时会一直停在旧值上。</p>
 */
async function refreshStates(): Promise<void> {
  try {
    const list = ((await deviceApi.listTaskStates()) as TaskState[]) || []
    taskStates.value = list
    for (const state of list) {
      savedInterval.set(
        state.deviceTaskStateName,
        Number(state.deviceTaskStateInterval) || 30
      )
    }
  } catch {
    /* 轮询失败保持旧值，下一轮再试 */
  }
}

/** 正在改间隔输入框时不刷新，避免把用户输入顶回去 */
function isEditingInterval(): boolean {
  const el = document.activeElement as HTMLElement | null
  return Boolean(el && el.closest && el.closest('.vtp-int'))
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

onMounted(() => {
  load()
  ticker = setInterval(() => {
    now.value = Date.now()
  }, 1000)
  poller = setInterval(() => {
    if (loading.value || runningTask.value || isEditingInterval()) return
    void refreshStates()
  }, STATE_POLL_MS)
})

onBeforeUnmount(() => {
  if (ticker) {
    clearInterval(ticker)
    ticker = undefined
  }
  if (poller) {
    clearInterval(poller)
    poller = undefined
  }
})
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

/* ---- 面板 ---- */
.vtp-panel {
  flex: 1;
  min-height: 0;
  padding: 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
  overflow: auto;
}

/* ---- 表盘卡片网格 ---- */
.vtp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(248px, 1fr));
  gap: 12px;
}
.vtp-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}
.vtp-card:hover {
  border-color: var(--el-color-primary-light-7);
  box-shadow: var(--el-box-shadow-light, none);
}
.vtp-card.is-running {
  border-color: var(--el-color-success-light-5);
}
.vtp-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---- 表盘（ReCountdown dial 布局）：环是到下次执行的剩余时间 ---- */
.vtp-dial {
  position: relative;
  display: grid;
  place-items: center;
  width: 108px;
  height: 108px;
  margin: 2px auto 0;
  /* ReCountdown 的 dial 布局消费 --rm-* 令牌，这里按 Element 主题喂进去 */
  --rm-primary: var(--el-color-primary);
  --rm-warning: var(--el-color-warning);
  --rm-success: var(--el-color-success);
  --rm-danger: var(--el-color-danger);
  --rm-info: var(--el-color-info);
  --rm-border: var(--el-border-color-lighter);
  --rm-text: var(--el-text-color-primary);
  --rm-text-regular: var(--el-text-color-regular);
  --rm-text-secondary: var(--el-text-color-secondary);
  --rm-transition: 0.28s ease;
}
/* 中心是 HH:MM:SS，等宽 + 收紧字距，8 位数字才塞得进 96px 环内 */
.vtp-dial :deep(.re-countdown__value) {
  font-family: var(--el-font-family-mono, monospace);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.04em;
}
/* 已过期（环见底）：数字转预警色，配合卡片上的「已到期」提示 */
.vtp-dial.is-full :deep(.re-countdown__value) {
  color: var(--el-color-warning);
}
.vtp-dial.is-idle :deep(.re-countdown__value) {
  color: var(--el-text-color-secondary);
}
/* 逾期：环补满成预警色，中心换成按秒上涨的「逾期 mm:ss」 */
.vtp-dial.is-overdue :deep(.re-countdown__ring) {
  stroke-dashoffset: 0 !important;
  stroke: var(--el-color-warning);
}
/* 逾期 / 从未执行时，中心数字由 __due 接管，别让 00:00:00 从底下透出来 */
.vtp-dial.is-overdue :deep(.re-countdown__value),
.vtp-dial.is-idle :deep(.re-countdown__value) {
  display: none;
}
.vtp-dial__due {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  pointer-events: none;
  color: var(--el-color-warning);
}
.vtp-dial__due b {
  font-family: var(--el-font-family-mono, monospace);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.1;
}
.vtp-dial__due i {
  font-style: normal;
  font-size: 10px;
  line-height: 1;
  opacity: 0.85;
}
.vtp-dial.is-idle .vtp-dial__due {
  color: var(--el-text-color-secondary);
}

/* ---- 卡片元信息 ---- */
.vtp-card__meta {
  display: grid;
  grid-template-columns: 1fr;
  gap: 4px;
  margin: 0;
}
.vtp-card__kv {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}
.vtp-card__kv dt {
  flex: none;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
.vtp-card__kv dd {
  margin: 0;
  min-width: 0;
  font-size: 12px;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vtp-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--el-border-color-lighter);
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
.vtp-int__label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
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

/* ---- 抽屉里的厂商范围提示 ---- */
.vtp-scope {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* ---- 组织同步卡片 ---- */
.vtp-org {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
}
.vtp-org__head {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.vtp-org__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.vtp-org__hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.vtp-org__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 10px;
}
.vtp-org__card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-fill-color-lighter);
}
.vtp-org__card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.vtp-org__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.vtp-org__last {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
.vtp-org__actions {
  display: flex;
  gap: 8px;
}
.vtp-org__result {
  font-size: 11px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
}
.vtp-org__result i {
  margin: 0 4px;
  font-style: normal;
  color: var(--el-text-color-placeholder);
}
.vtp-org__none {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
