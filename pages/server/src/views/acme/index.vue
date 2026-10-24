<script setup lang="ts">
/**
 * ACME 证书 —— 编排层
 *
 * <p>这一页真正的信息不是「有哪些证书」，而是「哪几张快到期了」。后端给的是
 * `acmeCertNotAfter` 与 `acmeCertRenewAt` 两个时刻，原先界面上只有一列原始时间戳，
 * 读者要自己去和今天相减才知道还剩几天。五个方向都把「剩余天数 / 紧迫度」提到
 * 与域名同级的位置 —— 这是同一份事实的五种摆法。</p>
 *
 * <p>方向的适用范围：五个方向只作用于**证书**这一段。账户管理是另一段内容
 * （没有时间结构，也就没有可探索的布局），因此它是一个独立的简单表格分支，
 * 不复用方向坞。这一页的一级切换（证书 / 账户）放在页头右侧。</p>
 *
 * <p>取数方式改为「一次取回，前端筛选与排序」：剩余天数排序、紧迫度分组、
 * 有效期时间轴都需要全量才能算对，服务端分页下这些视图只能看到当前位置的一页。
 * 代价是列表规模受一个上界约束（见 {@link CERT_MAX_PAGES}），超出时页面会
 * 明确告知「只载入了前 N 张」而不是安静地少显示。</p>
 *
 * @author CH
 * @since 4.0.0
 */
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { message } from '@repo/core'
import { ElMessageBox } from 'element-plus'
import { usePageVariant } from '@repo/ui/components/RePageKit/usePageVariant'
import {
  ReCanvasBand,
  ReCanvasCards,
  ReCanvasSplit,
  ReCanvasTable,
  ReCanvasTelemetry,
  RePageStage,
} from '@repo/ui/components/RePageKit'
import type {
  BandItem,
  CanvasColumn,
  CanvasGroup,
  PageVariantId,
} from '@repo/ui/components/RePageKit'
import ReTab from '@repo/ui/re-tab'
import type { ReTabItem } from '@repo/ui/components/ReTab/types'
import {
  getCertPage,
  getAccountPage,
  deleteCert,
  renewCert,
  revokeCert,
  retryValidation,
  triggerRenewCheck,
  deleteAccount,
  accountStatusInfo,
  serverLabel,
  type AcmeCertificate,
  type AcmeAccount,
} from '../../api/acmeApi'
import ApplyCertDialog, { type AcmeHostPrefill } from './components/ApplyCertDialog.vue'
import AccountDialog from './components/AccountDialog.vue'
import CertDetailDialog from './components/CertDetailDialog.vue'
import DownloadDialog from './components/DownloadDialog.vue'
import CertRowActions from './CertRowActions.vue'
import {
  EMPTY_CERT_FILTERS,
  URGENCY_LABEL,
  URGENCY_ORDER,
  axisTicks,
  certGeometry,
  countCerts,
  filterCerts,
  groupByUrgency,
  runwayAxis,
  toCertViews,
  type CertFilters,
  type CertUrgency,
  type CertView,
} from './acmeView'

defineOptions({ name: 'AcmeCertManagement' })

const route = useRoute()

/** 证书分页上界：一页 200，最多 3 页（600 张）。超出时页面会明确提示 */
const CERT_PAGE_SIZE = 200
const CERT_MAX_PAGES = 3

/** 账户分页上界（账户数量远少于证书） */
const ACCOUNT_PAGE_SIZE = 100
const ACCOUNT_MAX_PAGES = 2

// ==================== 状态 ====================

/** 一级分段：证书 / 账户 */
const activeTab = ref<'certs' | 'accounts'>('certs')

const mainTabs: ReTabItem[] = [
  { name: 'certs', label: '证书管理' },
  { name: 'accounts', label: '账户管理' },
]

/** 证书后端原样行 */
const certRows = ref<AcmeCertificate[]>([])
/** 服务器侧证书总数（用于判断是否被上界截断） */
const certTotal = ref(0)
const certLoading = ref(false)

/** 账户后端原样行 */
const accountRows = ref<AcmeAccount[]>([])
const accountTotal = ref(0)
const accountLoading = ref(false)

/** 单一筛选状态源 */
const filters = reactive<CertFilters>({ ...EMPTY_CERT_FILTERS })

/** 当前时刻：剩余天数、紧迫度、时间轴上的「现在」都依赖它 */
const now = ref(new Date())

/** 档案柜方向的选中项 */
const pickedId = ref<number | null>(null)

// ==================== 弹窗 ====================

const applyVisible = ref(false)
const applyInit = ref<Partial<AcmeCertificate> | null>(null)
const hostPrefill = ref<AcmeHostPrefill | null>(null)

const accountDialogVisible = ref(false)
const currentAccount = ref<AcmeAccount | null>(null)

const detailVisible = ref(false)
const currentCertId = ref<number | null>(null)

const downloadVisible = ref(false)
const currentCert = ref<AcmeCertificate | null>(null)

const renewingId = ref<number | null>(null)
const retryingId = ref<number | null>(null)
const renewCheckLoading = ref(false)

/** 开放全部五个方向 —— 证书有真实的时间结构（有效期区间 + 到期紧迫度） */
const ALLOWED: PageVariantId[] = ['rhythm', 'instrument', 'console', 'dossier', 'wall']

const { variant, items, dockVisible, setVariant } = usePageVariant({
  pageKey: 'server.acme',
  allowed: ALLOWED,
})

// ==================== 派生 ====================

/** 全量展示行 */
const allViews = computed(() => toCertViews(certRows.value, now.value))

/** 已筛选的展示行 */
const views = computed(() => filterCerts(allViews.value, filters))

/** 计数（全量口径，页签/遥测不随筛选变化） */
const counts = computed(() => countCerts(allViews.value))

/** 是否被上界截断 */
const truncated = computed(() => certTotal.value > certRows.value.length)

/** 遥测 */
const teleCells = computed(() => [
  { label: '证书总数', value: certTotal.value },
  { label: '有效', value: counts.value.byStatus['valid'] ?? 0 },
  {
    label: '30 天内到期',
    value: counts.value.byUrgency.soon + counts.value.byUrgency.urgent,
    tone: (counts.value.byUrgency.urgent > 0 ? 'bad' : counts.value.byUrgency.soon > 0 ? 'warn' : undefined) as
      | 'bad'
      | 'warn'
      | undefined,
  },
  { label: '已过期', value: counts.value.byUrgency.expired, tone: (counts.value.byUrgency.expired > 0 ? 'bad' : undefined) as 'bad' | undefined },
])

/** 紧迫度分布（仪表图表） */
const urgencyDist = computed(() =>
  URGENCY_ORDER.map(key => ({ key, label: URGENCY_LABEL[key], count: counts.value.byUrgency[key] })),
)

/** 图表峰值 */
const urgencyPeak = computed(() => Math.max(1, ...urgencyDist.value.map(b => b.count)))

/** 有效期时间轴范围 */
const axis = computed(() => runwayAxis(allViews.value))

/** 时间轴刻度 */
const ticks = computed(() => (axis.value ? axisTicks(axis.value, 6) : []))

/** 时间轴上的条：每张证书一道，按重叠分道 */
const bandItems = computed<BandItem[]>(() => {
  const list = axis.value ? allViews.value : []
  if (!axis.value) return []
  const laneHeight = 9
  /** 每道最晚结束时刻 */
  const laneEnds: number[] = []
  const out: BandItem[] = []
  const sorted = list
    .filter(v => v.notBefore && v.notAfter)
    .slice()
    .sort((a, b) => (a.notBefore?.getTime() ?? 0) - (b.notBefore?.getTime() ?? 0))
  for (const view of sorted) {
    const geo = certGeometry(view, axis.value)
    if (!geo) continue
    const from = view.notBefore!.getTime()
    const to = view.notAfter!.getTime()
    let lane = laneEnds.findIndex(end => end <= from)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(to)
    } else {
      laneEnds[lane] = to
    }
    out.push({
      key: view.id,
      left: geo.leftPercent,
      width: geo.widthPercent,
      top: lane * laneHeight + 4,
      color: urgencyColor(view.urgency),
      title: `${view.domain} · ${view.notBeforeText} → ${view.notAfterText} · ${view.daysLeftText}`,
    })
  }
  return out
})

/** 时间轴高度：按实际道数撑开（外层容器再限高并滚动） */
const bandHeight = computed(() => {
  const maxTop = bandItems.value.reduce((m, i) => Math.max(m, i.top), 0)
  return Math.max(maxTop + 9 + 6, 30)
})

/** 「现在」在轴上的位置 */
const nowPercent = computed(() => {
  if (!axis.value) return null
  const span = axis.value.endMs - axis.value.startMs
  if (span <= 0) return null
  const ratio = ((now.value.getTime() - axis.value.startMs) / span) * 100
  return ratio >= 0 && ratio <= 100 ? ratio : null
})

/** 工单台列 */
const consoleCols: CanvasColumn[] = [
  { key: 'domain', label: '主域名 / 验证', width: 'minmax(0, 1.5fr)' },
  { key: 'status', label: '状态', width: '84px' },
  { key: 'notAfter', label: '到期', width: '98px' },
  { key: 'daysLeft', label: '剩余', width: '86px', align: 'right' },
  { key: 'san', label: 'SAN', width: '52px', align: 'right' },
]

/** 仪表方向的紧凑列 */
const instrumentCols: CanvasColumn[] = [
  { key: 'domain', label: '主域名', width: 'minmax(0, 1.5fr)' },
  { key: 'status', label: '状态', width: '84px' },
  { key: 'notAfter', label: '到期', width: '98px' },
  { key: 'daysLeft', label: '剩余', width: '86px', align: 'right' },
]

/** 节奏方向的列 */
const rhythmCols: CanvasColumn[] = [
  { key: 'domain', label: '主域名', width: 'minmax(0, 1.4fr)' },
  { key: 'status', label: '状态', width: '84px' },
  { key: 'window', label: '有效期', width: 'minmax(0, 1.3fr)' },
  { key: 'daysLeft', label: '剩余', width: '86px', align: 'right' },
]

/** 档案柜分组：按紧迫度，越急越前 */
const groups = computed<CanvasGroup[]>(() =>
  groupByUrgency(views.value).map(g => ({
    key: g.key,
    label: g.label,
    rows: g.rows as unknown as CanvasGroup['rows'],
  })),
)

/** 档案柜当前详情 */
const picked = computed(
  () => views.value.find(v => v.id === pickedId.value) ?? views.value[0] ?? null,
)

/** 详情里的有效期条 */
const pickedGeometry = computed(() =>
  picked.value && axis.value ? certGeometry(picked.value, axis.value) : null,
)

/** 档案柜右栏的「剩余」一栏颜色 */
const pickedUrgency = computed<CertUrgency>(() => picked.value?.urgency ?? 'unknown')

// ==================== 工具 ====================

/**
 * 紧迫度配色
 *
 * @param urgency 紧迫度
 */
function urgencyColor(urgency: CertUrgency): string {
  switch (urgency) {
    case 'expired':
      return 'var(--el-color-danger)'
    case 'urgent':
      return 'var(--el-color-danger)'
    case 'soon':
      return 'var(--el-color-warning)'
    case 'ok':
      return 'var(--el-color-success)'
    default:
      return 'var(--el-text-color-disabled)'
  }
}

/**
 * 行键
 *
 * @param row 行
 */
function rowKey(row: Record<string, unknown>): number {
  return Number(row.id)
}

/**
 * 由展示行找后端原样行（弹窗需要完整字段，如私钥链）
 *
 * @param view 展示行
 */
function rawOf(view: CertView): AcmeCertificate | null {
  return certRows.value.find(r => Number(r.acmeCertId) === view.id) ?? null
}

// ==================== 数据加载 ====================


/**
 * 取回证书（合并多页）。
 *
 * <p>为什么要合并而不是保留服务端分页：剩余天数排序、紧迫度分组、有效期时间轴
 * 都需要全量才能算对。上界 {@link CERT_MAX_PAGES} 显式存在，且在 {@link truncated}
 * 为真时页面会告知用户，不会安静地只显示一部分。</p>
 */
async function loadCerts(): Promise<void> {
  certLoading.value = true
  try {
    const all: AcmeCertificate[] = []
    let total = 0
    for (let page = 1; page <= CERT_MAX_PAGES; page++) {
      const d = await getCertPage({ page, pageSize: CERT_PAGE_SIZE })
      total = Number(d?.total ?? 0)
      const records = d?.records ?? []
      all.push(...records)
      if (records.length < CERT_PAGE_SIZE || all.length >= total) break
    }
    certRows.value = all
    certTotal.value = total
  } catch (e) {
    message.error(`证书列表加载失败：${String((e as Error)?.message ?? e)}`)
    certRows.value = []
    certTotal.value = 0
  } finally {
    certLoading.value = false
  }
}

/** 取回账户（合并多页） */
async function loadAccounts(): Promise<void> {
  accountLoading.value = true
  try {
    const all: AcmeAccount[] = []
    let total = 0
    for (let page = 1; page <= ACCOUNT_MAX_PAGES; page++) {
      const d = await getAccountPage({ page, pageSize: ACCOUNT_PAGE_SIZE })
      total = Number(d?.total ?? 0)
      const records = d?.records ?? []
      all.push(...records)
      if (records.length < ACCOUNT_PAGE_SIZE || all.length >= total) break
    }
    accountRows.value = all
    accountTotal.value = total
  } catch (e) {
    message.error(`账户列表加载失败：${String((e as Error)?.message ?? e)}`)
    accountRows.value = []
    accountTotal.value = 0
  } finally {
    accountLoading.value = false
  }
}

/** 刷新当前分段 */
function refresh(): void {
  now.value = new Date()
  if (activeTab.value === 'certs') void loadCerts()
  else void loadAccounts()
}

// ==================== 操作 ====================

/**
 * 打开申请弹窗
 *
 * @param view 以哪张证书为模板（空表示全新申请）
 */
function openApply(view?: CertView | null): void {
  applyInit.value = view ? rawOf(view) : null
  applyVisible.value = true
}

/** 申请成功 */
function handleApplySuccess(): void {
  void loadCerts()
}

/**
 * 打开详情（按 id）
 *
 * <p>申请弹窗的 `view-cert` 事件只给 id，这里与行内「详情」走同一条路径，
 * 避免出现两处各自设置 `detailVisible` 的写法。</p>
 *
 * @param id 证书 id
 */
function openDetailById(id: number): void {
  currentCertId.value = id
  detailVisible.value = true
}

/**
 * 打开详情
 *
 * @param view 展示行
 */
function viewCert(view: CertView): void {
  openDetailById(view.id)
}

/**
 * 打开下载
 *
 * @param view 展示行
 */
function openDownload(view: CertView): void {
  const raw = rawOf(view)
  if (!raw) {
    message.warning('未找到该证书的完整数据，请刷新后重试')
    return
  }
  currentCert.value = raw
  downloadVisible.value = true
}

/**
 * 续签
 *
 * @param view 展示行
 */
async function confirmRenew(view: CertView): Promise<void> {
  try {
    await ElMessageBox.confirm(`确定续签证书「${view.domain}」？`, '续签确认', {
      confirmButtonText: '续签',
      type: 'warning',
    })
  } catch {
    return
  }
  renewingId.value = view.id
  try {
    await renewCert(view.id)
    message.success('续签请求已受理')
    await loadCerts()
  } catch (e) {
    message.error(String((e as Error)?.message ?? e))
  } finally {
    renewingId.value = null
  }
}

/**
 * 重新触发验证
 *
 * @param view 展示行
 */
async function confirmRetry(view: CertView): Promise<void> {
  retryingId.value = view.id
  try {
    await retryValidation(view.id)
    message.success('已重新触发验证')
    await loadCerts()
  } catch (e) {
    message.error(String((e as Error)?.message ?? e))
  } finally {
    retryingId.value = null
  }
}

/**
 * 吊销
 *
 * @param view 展示行
 */
async function confirmRevoke(view: CertView): Promise<void> {
  try {
    await ElMessageBox.confirm(`确定吊销证书「${view.domain}」？该操作不可恢复。`, '吊销确认', {
      confirmButtonText: '吊销',
      type: 'error',
    })
  } catch {
    return
  }
  try {
    await revokeCert(view.id)
    message.success('证书已吊销')
    await loadCerts()
  } catch (e) {
    message.error(String((e as Error)?.message ?? e))
  }
}

/**
 * 删除证书
 *
 * @param view 展示行
 */
async function confirmDelete(view: CertView): Promise<void> {
  try {
    await ElMessageBox.confirm(`确定删除证书「${view.domain}」？关联订单会一并删除。`, '删除确认', {
      confirmButtonText: '删除',
      type: 'error',
    })
  } catch {
    return
  }
  try {
    await deleteCert(view.id)
    message.success('证书已删除')
    await loadCerts()
  } catch (e) {
    message.error(String((e as Error)?.message ?? e))
  }
}

/** 触发全量续签检查 */
async function renewCheckAll(): Promise<void> {
  renewCheckLoading.value = true
  try {
    const msg = await triggerRenewCheck()
    message.success(msg || '续签检查已触发')
    await loadCerts()
  } catch (e) {
    message.error(String((e as Error)?.message ?? e))
  } finally {
    renewCheckLoading.value = false
  }
}

/** 打开新增账户 */
function addAccount(): void {
  currentAccount.value = null
  accountDialogVisible.value = true
}

/**
 * 打开编辑账户
 *
 * @param row 账户行
 */
function editAccount(row: AcmeAccount): void {
  currentAccount.value = { ...row }
  accountDialogVisible.value = true
}

/** 账户保存成功 */
function handleAccountSuccess(): void {
  void loadAccounts()
}

/**
 * 删除账户
 *
 * @param row 账户行
 */
async function confirmDeleteAccount(row: AcmeAccount): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `确定删除账户「${row.acmeAccountEmail}」？存在关联证书时后端会拒绝。`,
      '删除确认',
      { confirmButtonText: '删除', type: 'warning' },
    )
  } catch {
    return
  }
  try {
    await deleteAccount(Number(row.acmeAccountId))
    message.success('账户已删除')
    await loadAccounts()
  } catch (e) {
    message.error(String((e as Error)?.message ?? e))
  }
}

// ==================== 生命周期 ====================

/** 账户表列（账户段是简单表格，不需要方向） */
const accountCols: CanvasColumn[] = [
  { key: 'acmeAccountEmail', label: '邮箱', width: 'minmax(0, 1.4fr)' },
  { key: 'server', label: 'ACME 服务商', width: 'minmax(0, 1.4fr)' },
  { key: 'status', label: '状态', width: '90px' },
  { key: 'updateTime', label: '更新时间', width: '150px' },
  { key: 'remark', label: '备注', width: 'minmax(0, 1fr)' },
]

/**
 * 账户行键
 *
 * @param row 行
 */
function accountKey(row: Record<string, unknown>): number {
  return Number(row.acmeAccountId ?? 0)
}

watch(activeTab, tab => {
  now.value = new Date()
  if (tab === 'certs') {
    void loadCerts()
  } else {
    void loadAccounts()
  }
})

/** 时钟：30 秒一跳，让剩余天数与时间轴上的「现在」保持真实 */
let clock: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await loadCerts()

  const q = route.query
  const domain = String(q.domain ?? q.host ?? '')
  if (domain) {
    hostPrefill.value = {
      hostId: q.hostId ? Number(q.hostId) : undefined,
      hostName: String(q.hostName ?? ''),
      domain,
      port: q.port ? Number(q.port) : undefined,
      username: String(q.username ?? ''),
    }
    if (String(q.autoApply ?? '') === '1') applyVisible.value = true
  }

  clock = setInterval(() => {
    now.value = new Date()
  }, 30_000)
})

onUnmounted(() => {
  if (clock) clearInterval(clock)
  clock = null
})
</script>

<template>
  <!-- ==================== 证书段：五个方向 ==================== -->
  <RePageStage
    v-if="activeTab === 'certs'"
    :variant="variant"
    title="ACME 证书"
    desc="证书资产台账：哪几张快到期、什么时候自动续签、验证卡在哪一步。"
    :variant-items="items"
    :dock-visible="dockVisible"
    :filters="[
      { key: 'keyword', kind: 'search', placeholder: '搜索主域名 / SAN', width: 240 },
      { key: 'status', kind: 'select', placeholder: '全部状态', width: 116, options: [
        { label: '全部状态', value: '' },
        { label: '待处理', value: 'pending' },
        { label: '验证中', value: 'validating' },
        { label: '有效', value: 'valid' },
        { label: '已过期', value: 'expired' },
        { label: '已吊销', value: 'revoked' },
        { label: '失败', value: 'failed' },
      ] },
    ]"
    :filter-model="filters as unknown as Record<string, string>"
    :count-text="views.length === allViews.length ? `共 ${certTotal} 张证书` : `筛选出 ${views.length} / ${allViews.length} 张`"
    :loading="certLoading"
    refresh-tip="刷新证书列表"
    @update:variant="setVariant"
    @filter="(k, v) => (filters[k as 'keyword' | 'status'] = v)"
    @refresh="refresh"
  >
    <template #head-actions>
      <ReTab v-model="activeTab" :tabs="mainTabs" nav-only class="section-switch" />
      <ReButton :loading="renewCheckLoading" @click="renewCheckAll">续签检查</ReButton>
      <ReButton type="primary" icon="Plus" @click="openApply()">申请证书</ReButton>
    </template>

    <!-- 被上界截断时明确说出来 -->
    <template #alerts>
      <div v-if="truncated" class="trunc-note">
        服务器共有 {{ certTotal }} 张证书，当前只载入了前 {{ certRows.length }} 张。
        请用状态或关键字筛选收窄范围。
      </div>
    </template>

    <!-- ==================== 节奏：有效期时间轴 ==================== -->
    <template #rhythm>
      <div class="runway">
        <ReCanvasBand
          :items="bandItems"
          :height="bandHeight"
          :ticks="ticks"
          :now-percent="nowPercent"
          :axis-clickable="false"
          @bar-click="(item) => (pickedId = Number(item.key))"
        >
          <template #head>
            <span class="band__title">
              证书有效期
              <span>一根条是一张证书的有效期；右侧越靠近轴尾越危险</span>
            </span>
            <span class="pk-band__legend">
              <span
                v-for="u in URGENCY_ORDER"
                :key="u"
                class="pk-band__legend-item"
              >
                <i class="pk-band__legend-chip" :style="{ background: urgencyColor(u) }" />{{ URGENCY_LABEL[u] }}
              </span>
            </span>
          </template>
        </ReCanvasBand>
      </div>

      <ReCanvasTable
        :rows="views as unknown as Array<Record<string, unknown>>"
        :columns="rhythmCols"
        :row-key="rowKey"
        clickable
        :loading="certLoading"
        empty-text="还没有证书"
        empty-hint="点右上角「申请证书」签发第一张。"
        @row-click="(r) => viewCert(r as unknown as CertView)"
      >
        <template #cell-domain="{ row }">
          <span class="pk-strong pk-ellipsis">{{ (row as unknown as CertView).domain }}</span>
        </template>
        <template #cell-status="{ row }">
          <span class="sstate" :class="`is-${(row as unknown as CertView).urgency}`">
            <i class="pk-dot" :class="(row as unknown as CertView).urgency === 'urgent' ? 'pk-dot--live' : ''" />
            {{ (row as unknown as CertView).statusLabel }}
          </span>
        </template>
        <template #cell-window="{ row }">
          <span class="pk-num pk-dim pk-ellipsis">
            {{ (row as unknown as CertView).notBeforeText }} → {{ (row as unknown as CertView).notAfterText }}
          </span>
        </template>
        <template #cell-daysLeft="{ row }">
          <span class="days" :class="`is-${(row as unknown as CertView).urgency}`">
            {{ (row as unknown as CertView).daysLeftText }}
          </span>
        </template>
      </ReCanvasTable>
    </template>

    <!-- ==================== 工单台：一屏尽量多的证书 ==================== -->
    <template #console>
      <ReCanvasTable
        :rows="views as unknown as Array<Record<string, unknown>>"
        :columns="consoleCols"
        :row-key="rowKey"
        clickable
        :loading="certLoading"
        empty-text="还没有证书"
        empty-hint="点右上角「申请证书」签发第一张。"
        @row-click="(r) => viewCert(r as unknown as CertView)"
      >
        <template #cell-domain="{ row }">
          <div class="pk-strong pk-ellipsis">{{ (row as unknown as CertView).domain }}</div>
          <div class="pk-sub pk-ellipsis">
            <span class="challenge">{{ (row as unknown as CertView).challenge }}</span>
            <span v-if="(row as unknown as CertView).sanCount" class="san-inline">
              +{{ (row as unknown as CertView).sanCount }} 个 SAN
            </span>
            <span v-if="(row as unknown as CertView).lastError" class="err-inline" :title="(row as unknown as CertView).lastError">
              最近错误：{{ (row as unknown as CertView).lastError }}
            </span>
          </div>
        </template>
        <template #cell-status="{ row }">
          <span class="sstate" :class="`is-${(row as unknown as CertView).urgency}`">
            <i class="pk-dot" :class="(row as unknown as CertView).urgency === 'urgent' ? 'pk-dot--live' : ''" />
            {{ (row as unknown as CertView).statusLabel }}
          </span>
        </template>
        <template #cell-notAfter="{ row }">
          <span class="pk-num">{{ (row as unknown as CertView).notAfterText }}</span>
        </template>
        <template #cell-daysLeft="{ row }">
          <span class="days" :class="`is-${(row as unknown as CertView).urgency}`">
            {{ (row as unknown as CertView).daysLeftText }}
          </span>
        </template>
        <template #cell-san="{ row }">
          <span class="pk-num pk-dim">{{ (row as unknown as CertView).sanCount || '—' }}</span>
        </template>
        <template #row-actions="{ row }">
          <CertRowActions
            :cert="row as unknown as CertView"
            :renewing="renewingId === (row as unknown as CertView).id"
            :retrying="retryingId === (row as unknown as CertView).id"
            @detail="viewCert(row as unknown as CertView)"
            @renew="confirmRenew(row as unknown as CertView)"
            @download="openDownload(row as unknown as CertView)"
            @retry="confirmRetry(row as unknown as CertView)"
            @revoke="confirmRevoke(row as unknown as CertView)"
            @delete="confirmDelete(row as unknown as CertView)"
          />
        </template>
      </ReCanvasTable>
    </template>

    <!-- ==================== 仪表：先看整体盘子 ==================== -->
    <template #instrument>
      <ReCanvasTelemetry :cells="teleCells" />

      <div class="dist">
        <div class="dist__head">
          <span class="dist__title">到期紧迫度分布</span>
          <span class="dist__note">按距到期时间分档 · 全量口径，不随筛选变化</span>
        </div>
        <div class="dist__bars">
          <div v-for="b in urgencyDist" :key="b.key" class="dist__col">
            <span class="dist__val">{{ b.count || '' }}</span>
            <span
              class="dist__bar"
              :style="{
                height: `${b.count ? Math.max((b.count / urgencyPeak) * 52, 3) : 0}px`,
                background: urgencyColor(b.key),
              }"
            />
            <span class="dist__label">{{ b.label }}</span>
          </div>
        </div>
      </div>

      <ReCanvasTable
        :rows="views as unknown as Array<Record<string, unknown>>"
        :columns="instrumentCols"
        :row-key="rowKey"
        clickable
        :loading="certLoading"
        empty-text="还没有证书"
        @row-click="(r) => viewCert(r as unknown as CertView)"
      >
        <template #cell-domain="{ row }">
          <span class="pk-strong pk-ellipsis">{{ (row as unknown as CertView).domain }}</span>
        </template>
        <template #cell-status="{ row }">
          <span class="sstate" :class="`is-${(row as unknown as CertView).urgency}`">
            <i class="pk-dot" :class="(row as unknown as CertView).urgency === 'urgent' ? 'pk-dot--live' : ''" />
            {{ (row as unknown as CertView).statusLabel }}
          </span>
        </template>
        <template #cell-notAfter="{ row }">
          <span class="pk-num">{{ (row as unknown as CertView).notAfterText }}</span>
        </template>
        <template #cell-daysLeft="{ row }">
          <span class="days" :class="`is-${(row as unknown as CertView).urgency}`">
            {{ (row as unknown as CertView).daysLeftText }}
          </span>
        </template>
      </ReCanvasTable>
    </template>

    <!-- ==================== 档案柜：左栏按紧迫度，右栏常驻详情 ==================== -->
    <template #dossier>
      <ReCanvasSplit
        :rows="views as unknown as Array<Record<string, unknown>>"
        :groups="groups"
        :row-key="rowKey"
        :active-key="picked?.id ?? null"
        :rail-width="256"
        :loading="certLoading"
        empty-text="没有匹配的证书"
        empty-hint="清掉搜索词或换一个状态试试。"
        @pick="(k) => (pickedId = Number(k))"
      >
        <template #rail-item="{ row }">
          <span class="pk-rail__title">
            <i class="pk-dot" :class="(row as unknown as CertView).urgency === 'urgent' ? 'pk-dot--live' : ''" />
            <span class="pk-ellipsis">{{ (row as unknown as CertView).domain }}</span>
          </span>
          <span class="pk-rail__meta">
            <span class="pk-num">{{ (row as unknown as CertView).notAfterText }}</span>
            <span class="rail__days" :class="`is-${(row as unknown as CertView).urgency}`">
              {{ (row as unknown as CertView).daysLeftText }}
            </span>
          </span>
        </template>

        <template #detail-head="{ row }">
          <div style="min-width: 0">
            <div class="detail__title pk-ellipsis">{{ (row as unknown as CertView).domain }}</div>
            <div class="pk-sub">
              {{ (row as unknown as CertView).challenge }}
              <span v-if="(row as unknown as CertView).sanCount">
                · 另含 {{ (row as unknown as CertView).sanCount }} 个 SAN
              </span>
            </div>
          </div>
          <span class="days" :class="`is-${pickedUrgency}`" style="margin-left: auto">
            {{ (row as unknown as CertView).daysLeftText }}
          </span>
        </template>

        <template #detail="{ row }">
          <div class="pk-kv">
            <span class="pk-kv__label">状态</span>
            <span class="pk-kv__value">{{ (row as unknown as CertView).statusLabel }}</span>
            <span class="pk-kv__label">生效日</span>
            <span class="pk-kv__value pk-num">{{ (row as unknown as CertView).notBeforeText }}</span>
            <span class="pk-kv__label">到期日</span>
            <span class="pk-kv__value pk-num">{{ (row as unknown as CertView).notAfterText }}</span>
            <span class="pk-kv__label">计划续签</span>
            <span class="pk-kv__value pk-num">{{ (row as unknown as CertView).renewAtText }}</span>
            <span class="pk-kv__label">剩余</span>
            <span class="pk-kv__value pk-num">{{ (row as unknown as CertView).daysLeftText }}</span>
            <span class="pk-kv__label">SAN</span>
            <span class="pk-kv__value">
              {{ (row as unknown as CertView).sanList.length ? (row as unknown as CertView).sanList.join('、') : '—' }}
            </span>
          </div>

          <div v-if="(row as unknown as CertView).lastError" class="detail__error">
            <span class="detail__error-title">最近一次错误</span>
            <span>{{ (row as unknown as CertView).lastError }}</span>
          </div>

          <div v-if="pickedGeometry" class="detail__band">
            <div class="detail__band-label">
              <span>有效期在整体时间轴上的位置</span>
              <span class="pk-num">
                {{ (row as unknown as CertView).usedPercent === null ? '—' : `已用 ${Math.round((row as unknown as CertView).usedPercent ?? 0)}%` }}
              </span>
            </div>
            <div class="pk-band__axis" style="height: 22px">
              <span
                class="pk-band__bar"
                :style="{
                  left: `${pickedGeometry.leftPercent}%`,
                  width: `${pickedGeometry.widthPercent}%`,
                  top: '6px',
                  background: urgencyColor(pickedUrgency),
                }"
              />
            </div>
            <div class="pk-band__ticks">
              <span v-for="t in ticks" :key="t">{{ t }}</span>
            </div>
          </div>
        </template>

        <template #detail-actions="{ row }">
          <CertRowActions
            :cert="row as unknown as CertView"
            :renewing="renewingId === (row as unknown as CertView).id"
            :retrying="retryingId === (row as unknown as CertView).id"
            mode="full"
            @detail="viewCert(row as unknown as CertView)"
            @renew="confirmRenew(row as unknown as CertView)"
            @download="openDownload(row as unknown as CertView)"
            @retry="confirmRetry(row as unknown as CertView)"
            @revoke="confirmRevoke(row as unknown as CertView)"
            @delete="confirmDelete(row as unknown as CertView)"
          />
        </template>
      </ReCanvasSplit>
    </template>

    <!-- ==================== 卡片墙：一张证书的全部字段摊在卡上 ==================== -->
    <template #wall>
      <ReCanvasCards
        :rows="views as unknown as Array<Record<string, unknown>>"
        :row-key="rowKey"
        :min-width="272"
        clickable
        :loading="certLoading"
        empty-text="还没有证书"
        empty-hint="点右上角「申请证书」签发第一张。"
        @row-click="(r) => viewCert(r as unknown as CertView)"
      >
        <template #card="{ row }">
          <header class="pk-card__head">
            <span class="pk-card__title">{{ (row as unknown as CertView).domain }}</span>
            <span class="days" :class="`is-${(row as unknown as CertView).urgency}`">
              {{ (row as unknown as CertView).daysLeftText }}
            </span>
          </header>

          <div class="card__fields">
            <span class="card__k">状态</span>
            <span class="card__v pk-state">
              <i class="pk-dot" :class="(row as unknown as CertView).urgency === 'urgent' ? 'pk-dot--live' : ''" />
              {{ (row as unknown as CertView).statusLabel }}
            </span>

            <span class="card__k">生效</span>
            <span class="card__v pk-num">{{ (row as unknown as CertView).notBeforeText }}</span>

            <span class="card__k">到期</span>
            <span class="card__v pk-num">{{ (row as unknown as CertView).notAfterText }}</span>

            <span class="card__k">验证</span>
            <span class="card__v">{{ (row as unknown as CertView).challenge || '—' }}</span>

            <span class="card__k">SAN</span>
            <span class="card__v">{{ (row as unknown as CertView).sanCount || '—' }}</span>

            <span class="card__k">续签</span>
            <span class="card__v pk-num">{{ (row as unknown as CertView).renewAtText }}</span>
          </div>

          <div v-if="(row as unknown as CertView).lastError" class="card__err">
            {{ (row as unknown as CertView).lastError }}
          </div>

          <footer class="pk-card__foot">
            <CertRowActions
              :cert="row as unknown as CertView"
              :renewing="renewingId === (row as unknown as CertView).id"
              :retrying="retryingId === (row as unknown as CertView).id"
              @detail="viewCert(row as unknown as CertView)"
              @renew="confirmRenew(row as unknown as CertView)"
              @download="openDownload(row as unknown as CertView)"
              @retry="confirmRetry(row as unknown as CertView)"
              @revoke="confirmRevoke(row as unknown as CertView)"
              @delete="confirmDelete(row as unknown as CertView)"
            />
          </footer>
        </template>
      </ReCanvasCards>
    </template>
  </RePageStage>

  <!-- ==================== 账户段：简单表格，不参与方向 ==================== -->
  <div v-else class="pk-page">
    <div class="pk-head">
      <div class="pk-head__titles">
        <h2 class="pk-head__title">ACME 证书</h2>
        <p class="pk-head__desc">账户管理：注册在 Let's Encrypt 等 ACME 服务商下的账户。</p>
      </div>
      <div class="pk-head__actions">
        <ReTab v-model="activeTab" :tabs="mainTabs" nav-only class="section-switch" />
        <ReButton icon="Plus" type="primary" @click="addAccount">添加账户</ReButton>
        <ReButton icon="Refresh" layout="square" tip="刷新账户列表" :loading="accountLoading" @click="loadAccounts" />
      </div>
    </div>

    <div class="pk-bar">
      <span class="pk-bar__count">共 {{ accountTotal }} 个账户</span>
      <span class="pk-bar__spacer" />
      <span class="pk-faint">账户下的证书存在时后端会拒绝删除</span>
    </div>

    <ReCanvasTable
      :rows="accountRows as unknown as Array<Record<string, unknown>>"
      :columns="accountCols"
      :row-key="accountKey"
      :loading="accountLoading"
      empty-text="还没有 ACME 账户"
      empty-hint="点右上角「添加账户」注册一个。申请证书前必须先有账户。"
    >
      <template #cell-acmeAccountEmail="{ row }">
        <span class="pk-strong">{{ (row as unknown as AcmeAccount).acmeAccountEmail }}</span>
      </template>
      <template #cell-server="{ row }">
        <span class="pk-ellipsis">{{ serverLabel((row as unknown as AcmeAccount).acmeAccountServer) }}</span>
      </template>
      <template #cell-status="{ row }">
        <span class="pk-state">
          <i class="pk-dot" />
          {{ accountStatusInfo((row as unknown as AcmeAccount).acmeAccountStatus).label }}
        </span>
      </template>
      <template #cell-updateTime="{ row }">
        <span class="pk-num pk-dim">{{ (row as unknown as AcmeAccount).updateTime || '—' }}</span>
      </template>
      <template #cell-remark="{ row }">
        <span class="pk-ellipsis">{{ (row as unknown as AcmeAccount).acmeAccountRemark || '—' }}</span>
      </template>
      <template #row-actions="{ row }">
        <button type="button" class="pk-link" @click="editAccount(row as unknown as AcmeAccount)">编辑</button>
        <button type="button" class="pk-link pk-link--danger" @click="confirmDeleteAccount(row as unknown as AcmeAccount)">
          删除
        </button>
      </template>
    </ReCanvasTable>
  </div>

  <ApplyCertDialog
    v-model="applyVisible"
    :init-data="applyInit"
    :host="hostPrefill"
    @success="handleApplySuccess"
    @view-cert="openDetailById"
  />
  <AccountDialog v-model="accountDialogVisible" :account="currentAccount" @success="handleAccountSuccess" />
  <CertDetailDialog v-model="detailVisible" :cert-id="currentCertId" />
  <DownloadDialog v-model="downloadVisible" :cert="currentCert" />
</template>

<style scoped>
/* 一级分段（证书 / 账户）放在页头右侧：它是内容分段，不是筛选条件 */
.section-switch {
  align-self: center;
}

.section-switch :deep(.re-tab--capsule) {
  width: auto;
}

/* 截断提示：必须显眼，否则用户会以为「剩下那些证书不存在」 */
.trunc-note {
  padding: 7px 11px;
  font-size: 12px;
  color: var(--el-color-warning);
  background: color-mix(in srgb, var(--el-color-warning) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-warning) 30%, transparent);
  border-radius: var(--el-radius-sm, 6px);
}

/* 时间轴外层限高并滚动：证书多时条会分很多道，不让页面被拉长 */
.runway {
  flex: none;
  max-height: 210px;
  overflow: auto;
}

.band__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.band__title span {
  margin-left: 8px;
  font-size: 11px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

/* ===== 紧迫度文本 ===== */
.days {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.days.is-expired,
.days.is-urgent {
  font-weight: 600;
  color: var(--el-color-danger);
}

.days.is-soon {
  font-weight: 600;
  color: var(--el-color-warning);
}

.days.is-ok {
  color: var(--el-color-success);
}

.days.is-unknown {
  color: var(--el-text-color-placeholder);
}

.sstate {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
}

.sstate.is-expired,
.sstate.is-urgent {
  color: var(--el-color-danger);
}

.sstate.is-soon {
  color: var(--el-color-warning);
}

.sstate.is-ok {
  color: var(--el-color-success);
}

.challenge {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
}

.san-inline {
  margin-left: 8px;
}

.err-inline {
  margin-left: 8px;
  color: var(--el-color-danger);
}

/* ===== 紧迫度分布图 ===== */
.dist {
  flex: none;
  padding: 10px 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
}

.dist__head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.dist__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.dist__note {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.dist__bars {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding-top: 14px;
}

.dist__col {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.dist__val {
  height: 13px;
  font-size: 10px;
  line-height: 13px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}

.dist__bar {
  width: 100%;
  max-width: 52px;
  border-radius: 2px 2px 0 0;
  transition: height var(--el-transition-duration-fast, 0.2s);
}

.dist__label {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
}

/* ===== 档案柜 ===== */
.rail__days {
  margin-left: auto;
  font-variant-numeric: tabular-nums;
}

.detail__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.detail__error {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 9px 11px;
  font-size: 12px;
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 8%, transparent);
  border-radius: var(--el-radius-sm, 6px);
}

.detail__error-title {
  font-weight: 600;
}

.detail__band {
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.detail__band-label {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

/* ===== 卡片 ===== */
.card__fields {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 5px 10px;
  font-size: 12px;
  align-items: baseline;
}

.card__k {
  color: var(--el-text-color-placeholder);
}

.card__v {
  min-width: 0;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card__err {
  padding: 6px 9px;
  font-size: 11px;
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 8%, transparent);
  border-radius: var(--el-radius-xs, 4px);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (prefers-reduced-motion: reduce) {
  .dist__bar {
    transition: none;
  }
}
</style>
