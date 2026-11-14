<script setup lang="ts">
/**
 * ACME 证书 —— 编排层
 *
 * <p>这一页真正的信息不是「有哪些证书」，而是「哪几张快到期了」。后端给的是
 * `acmeCertNotAfter` 与 `acmeCertRenewAt` 两个时刻，原先界面上只有一列原始时间戳，
 * 读者要自己去和今天相减才知道还剩几天。这里把「剩余天数 / 紧迫度」提到与域名
 * 同级的位置 —— 时间轴（节奏）负责看整体，表格负责逐张处理。</p>
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
import { ElDropdown, ElDropdownItem, ElDropdownMenu, ElMessageBox } from 'element-plus'
import {
  ReCanvasBand,
  RePageStage,
} from '@repo/ui/components/RePageKit'
import type { BandItem } from '@repo/ui/components/RePageKit'
import ReTable from '@repo/ui/re-table'
import type { ReTableColumn } from '@repo/ui/re-table'
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
import {
  EMPTY_CERT_FILTERS,
  URGENCY_LABEL,
  URGENCY_ORDER,
  axisTicks,
  certGeometry,
  filterCerts,
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
/** 是否已成功载入过一次账户（控制栏计数/分隔线只在有数据口径后出现） */
const accountLoaded = ref(false)

/** 单一筛选状态源 */
const filters = reactive<CertFilters>({ ...EMPTY_CERT_FILTERS })

/** 当前时刻：剩余天数、紧迫度、时间轴上的「现在」都依赖它 */
const now = ref(new Date())

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

/** 全量展示行 */
const allViews = computed(() => toCertViews(certRows.value, now.value))

/** 已筛选的展示行 */
const views = computed(() => filterCerts(allViews.value, filters))

/** 是否被上界截断 */
const truncated = computed(() => certTotal.value > certRows.value.length)

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

/** 证书表列（ReTable vxe 引擎） */
const rhythmCols: ReTableColumn[] = [
  { prop: 'domain', label: '主域名', slot: 'domain', minWidth: 160 },
  { prop: 'status', label: '状态', slot: 'status', width: 90 },
  { prop: 'window', label: '有效期', slot: 'window', minWidth: 200 },
  { prop: 'daysLeft', label: '剩余', slot: 'daysLeft', width: 92, align: 'right' },
  { prop: 'actions', label: '操作', width: 132, fixed: 'right', align: 'center' },
]

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
    accountLoaded.value = true
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

/**
 * 「更多」下拉命令分发
 *
 * @param command 命令名
 * @param view 证书展示行
 */
function onMoreCommand(command: string, view: CertView): void {
  if (command === 'download') openDownload(view)
  else if (command === 'retry') void confirmRetry(view)
  else if (command === 'revoke') void confirmRevoke(view)
  else if (command === 'delete') void confirmDelete(view)
}

// ==================== 生命周期 ====================

/** 账户表列（账户段是简单表格，不需分页） */
const accountCols: ReTableColumn[] = [
  { prop: 'acmeAccountEmail', label: '邮箱', slot: 'acmeAccountEmail', minWidth: 160 },
  { prop: 'server', label: 'ACME 服务商', slot: 'server', minWidth: 140 },
  { prop: 'status', label: '状态', slot: 'status', width: 90 },
  { prop: 'updateTime', label: '更新时间', width: 160 },
  { prop: 'remark', label: '备注', minWidth: 120 },
  { prop: 'actions', label: '操作', width: 104, fixed: 'right', align: 'center' },
]

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
  <!-- ==================== 证书段：节奏视图（时间轴 + 必修单表） ==================== -->
  <RePageStage
    v-if="activeTab === 'certs'"
    variant="rhythm"
    no-head
    title="安全证书"
    :variant-items="[]"
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
    @filter="(k, v) => (filters[k as 'keyword' | 'status'] = v)"
    @refresh="refresh"
  >
    <template #bar-lead>
      <ReTab v-model="activeTab" :tabs="mainTabs" nav-only class="section-switch" />
    </template>

    <template #bar-actions>
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

      <ReTable
        :data="views as unknown as Array<Record<string, unknown>>"
        :columns="rhythmCols"
        row-key="id"
        :loading="certLoading"
        :page-size="8"
        :page-sizes="[8, 20, 50]"
        :toolbar="false"
        stripe
        table-id="acme-cert-list"
        empty-text="还没有证书"
        @row-click="(r) => viewCert(r as unknown as CertView)"
      >
        <template #col-domain="{ row }">
          <span class="pk-strong pk-ellipsis">{{ (row as unknown as CertView).domain }}</span>
        </template>
        <template #col-status="{ row }">
          <span class="sstate" :class="`is-${(row as unknown as CertView).urgency}`">
            <i class="pk-dot" :class="(row as unknown as CertView).urgency === 'urgent' ? 'pk-dot--live' : ''" />
            {{ (row as unknown as CertView).statusLabel }}
          </span>
        </template>
        <template #col-window="{ row }">
          <span class="pk-num pk-dim pk-ellipsis">
            {{ (row as unknown as CertView).notBeforeText }} → {{ (row as unknown as CertView).notAfterText }}
          </span>
        </template>
        <template #col-daysLeft="{ row }">
          <span class="days" :class="`is-${(row as unknown as CertView).urgency}`">
            {{ (row as unknown as CertView).daysLeftText }}
          </span>
        </template>
        <!-- 操作列：统一 ReButton square 纯图标按钮（详情 / 续签 / 更多），
             tip 即悬浮提示；下载 / 重新验证 / 吊销 / 删除收进「更多」下拉，
             避免一整排红按钮（吊销与删除不可恢复）。 -->
        <template #col-actions="{ row }">
          <div class="row-acts">
            <ReButton layout="square" icon="View" tip="详情" @click.stop="viewCert(row as unknown as CertView)" />
            <ReButton
              layout="square" icon="RefreshRight" tip="续签"
              :loading="renewingId === (row as unknown as CertView).id"
              :disabled="renewingId === (row as unknown as CertView).id"
              @click.stop="confirmRenew(row as unknown as CertView)"
            />
            <ElDropdown trigger="click" placement="bottom-end" @command="(cmd) => onMoreCommand(cmd, row as unknown as CertView)">
              <ReButton
                layout="square" icon="MoreFilled" tip="下载 / 重新验证 / 吊销 / 删除"
                :loading="retryingId === (row as unknown as CertView).id"
                @click.stop
              />
              <template #dropdown>
                <ElDropdownMenu>
                  <ElDropdownItem command="download">下载证书</ElDropdownItem>
                  <ElDropdownItem v-if="(row as unknown as CertView).statusCode === 'validating'" command="retry">
                    {{ retryingId === (row as unknown as CertView).id ? '重新验证中…' : '重新验证' }}
                  </ElDropdownItem>
                  <ElDropdownItem command="revoke" divided>吊销</ElDropdownItem>
                  <ElDropdownItem command="delete">删除</ElDropdownItem>
                </ElDropdownMenu>
              </template>
            </ElDropdown>
          </div>
        </template>
      </ReTable>
    </template>

  </RePageStage>

  <!-- ==================== 账户段：简单表格，不参与方向 ==================== -->
  <div v-else class="pk-page">
    <div class="pk-bar">
      <div class="pk-bar__lead">
        <ReTab v-model="activeTab" :tabs="mainTabs" nav-only class="section-switch" />
      </div>
      <span v-if="accountLoaded" class="pk-bar__sep" />
      <span class="pk-bar__spacer" />
      <span v-if="accountLoaded" class="pk-bar__count">
        共 {{ accountTotal }} 个账户 · 账户下的证书存在时后端会拒绝删除
      </span>
      <div class="pk-bar__actions">
        <ReButton icon="Plus" type="primary" @click="addAccount">添加账户</ReButton>
        <ReButton icon="Refresh" layout="square" tip="刷新账户列表" :loading="accountLoading" @click="loadAccounts" />
      </div>
    </div>

    <ReTable
      :data="accountRows as unknown as Array<Record<string, unknown>>"
      :columns="accountCols"
      row-key="acmeAccountId"
      :loading="accountLoading"
      :page-size="8"
      :page-sizes="[8, 20, 50]"
      :toolbar="false"
      stripe
      table-id="acme-account-list"
      empty-text="还没有 ACME 账户"
    >
      <template #col-acmeAccountEmail="{ row }">
        <span class="pk-strong">{{ (row as unknown as AcmeAccount).acmeAccountEmail }}</span>
      </template>
      <template #col-server="{ row }">
        <span class="pk-ellipsis">{{ serverLabel((row as unknown as AcmeAccount).acmeAccountServer) }}</span>
      </template>
      <template #col-status="{ row }">
        <span class="pk-state">
          <i class="pk-dot" />
          {{ accountStatusInfo((row as unknown as AcmeAccount).acmeAccountStatus).label }}
        </span>
      </template>
      <template #col-updateTime="{ row }">
        <span class="pk-num pk-dim">{{ (row as unknown as AcmeAccount).updateTime || '—' }}</span>
      </template>
      <template #col-remark="{ row }">
        <span class="pk-ellipsis">{{ (row as unknown as AcmeAccount).acmeAccountRemark || '—' }}</span>
      </template>
      <template #col-actions="{ row }">
        <div class="row-acts">
          <ReButton layout="square" icon="EditPen" tip="编辑" @click="editAccount(row as unknown as AcmeAccount)" />
          <ReButton layout="square" icon="Delete" type="danger" tip="删除" @click="confirmDeleteAccount(row as unknown as AcmeAccount)" />
        </div>
      </template>
    </ReTable>
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
/* 一级分段（证书 / 账户）放进控制栏最左：它是内容分段，不是筛选条件 */
.section-switch {
  flex: none;
}

.section-switch :deep(.re-tab--capsule) {
  width: auto;
}

/* 胶囊与同栏的搜索框/下拉高度对齐（32px 控件），默认 7px 上下内边距会高出 4px */
.section-switch :deep(.re-tab-capsule__nav) {
  padding: 3px;
}

.section-switch :deep(.re-tab-capsule__item) {
  padding: 5px 12px;
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

/* 操作列按钮组：三个 square 图标按钮并排，间距紧凑 */
.row-acts {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

@media (prefers-reduced-motion: reduce) {
  .dist__bar {
    transition: none;
  }
}
</style>
