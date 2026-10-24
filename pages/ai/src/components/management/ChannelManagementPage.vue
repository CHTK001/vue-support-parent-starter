<script setup lang="ts">
// 渠道管理页（全部登录用户，数据按 userId 隔离）。
//
// 设计原则：
// - 只展示 dsh-our-free-model 仓库的账号类渠道（Cline / Qoder / Trae / Gemini），
//   通过后端 /api/channels 拉取；前端不硬编码渠道清单，新增 SPI 实现即可自动呈现。
// - 账号连接按当前用户隔离：每个人看到的都是自己绑定的账号。
// - 每个渠道卡片呈现：
//     ① 渠道总开关（PUT /api/channels/{ch}/enabled）
//     ② 账号连接列表（绑定 / 刷新 / 签到 / 删除）
//     ③ 模型拉取 + 单模型开关（PUT /api/channels/{ch}/models/{m}/enabled）
// - 绑定交互：点「绑定账号」→ 弹窗 + 自动打开授权页（或显示二维码）→
//   后端 SSE 持续等待 → 拿到凭据自动关窗并刷新列表。用户不需要粘贴回调地址；
//   TRAE / Gemini / LobsterAI 由后端本地监听回环端口接收浏览器跳转；
//   Loomy 走微信扫码（官方授权页 + 弹窗内二维码），不收集手机号。
// - 自动签到走后端 ChannelCheckinTask，前端「签到」按钮仅做手动补一次。

import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ReDialog from '@repo/ui/re-dialog'
import {
  // @element-plus/icons-vue 导出的名字**没有 Icon 后缀**（Refresh / Plus / Delete /
  // Connection / DataAnalysis）。此前按「XxxIcon」写，构建直接报 MISSING_EXPORT，
  // 整个应用打不出包。这里用 `as XxxIcon` 起别名，模板里的标签名保持不变。
  Refresh as RefreshIcon,
  Plus as PlusIcon,
  Delete as DeleteIcon,
  Connection as ConnectionIcon,
  DataAnalysis as DataAnalysisIcon,
} from '@element-plus/icons-vue'
import { channelApi, type ChannelSummary, type ChannelConnectionSummary } from '@/services/javaApi'

// 各渠道的官方图标（本地落地的品牌资源）。
// 有官方 SVG/ICO 的渠道用图标；没有公开官方资源的渠道（Qoder / Raccoon / Loomy…）
// 用品牌色圆角徽标 + 首字母兜底，保证视觉一致性。
import clineIcon from '@/assets/channel-icons/cline.svg'
import traeIcon from '@/assets/channel-icons/trae.svg'
import opencodeIcon from '@/assets/channel-icons/opencode.svg'
import geminiIcon from '@/assets/channel-icons/gemini.svg'
import minimaxIcon from '@/assets/channel-icons/minimax.ico'
import zcodeIcon from '@/assets/channel-icons/zcode.ico'
import lobsteraiIcon from '@/assets/channel-icons/lobsterai.ico'
import RePageHead from '@/components/re/RePageHead.vue'

/** 渠道品牌外观：官方图标（可选）+ 品牌色 + 徽标字形 */
interface ChannelBrand {
  /** 官方图标资源 URL；缺省时用 brandColor/glyph 渲染徽标 */
  icon?: string
  /** 品牌主色（徽标底色 / 状态点缀） */
  color: string
  /** 徽标字形（无官方图标时用首字母） */
  glyph: string
  /** 登录方式短标签（展示用） */
  method?: string
}

// channel id（后端 @Spi 别名，小写）→ 品牌外观
const CHANNEL_BRANDS: Record<string, ChannelBrand> = {
  cline: { icon: clineIcon, color: '#6E4FFF', glyph: 'C', method: '设备码' },
  qoder: { color: '#4F6BFF', glyph: 'Q', method: '设备码' },
  'qoder-cn': { color: '#F59E0B', glyph: 'Q', method: '设备码' }, // 国内变体用琥珀金区分
  trae: { icon: traeIcon, color: '#0F766E', glyph: 'T', method: '浏览器授权' },
  gemini: { icon: geminiIcon, color: '#8E75B2', glyph: 'G', method: '浏览器授权' },
  minimax: { icon: minimaxIcon, color: '#F5701A', glyph: 'M', method: '设备码' },
  zcode: { icon: zcodeIcon, color: '#0C5CFF', glyph: 'Z', method: '浏览器授权' },
  raccoon: { color: '#0FA47F', glyph: 'R', method: '扫码' },
  loomy: { color: '#2B7DE9', glyph: 'L', method: '微信扫码' },
  lobsterai: { icon: lobsteraiIcon, color: '#F03D64', glyph: 'L', method: '浏览器授权' },
  opencode: { icon: opencodeIcon, color: '#111827', glyph: 'O', method: 'API Key' },
}

/** 渠道品牌外观（未知渠道给中性灰兜底） */
const brandOf = (channel: string): ChannelBrand =>
  CHANNEL_BRANDS[channel] ?? { color: '#64748B', glyph: (channel || '?').slice(0, 1).toUpperCase() }

interface ParsedHandle {
  channel: string
  handle: Record<string, any>
  verifyUrl?: string
}

const loading = ref(false)
const loadError = ref('')
const channels = ref<ChannelSummary[]>([])

// 当前选中的渠道 id
const activeChannel = ref<string>('')

// 渠道卡片内的状态：是否正在签到 / 正在拉模型 / 正在刷新
const busy = ref<Record<string, { sign?: boolean; models?: boolean; refresh?: boolean; login?: boolean }>>({})

const busyOf = (channel: string) => (busy.value[channel] ??= {})

const activeSummary = () => channels.value.find((c) => c.channel === activeChannel.value)

// ---------- 方案 A：运维甲板（OPS·DECK）派生状态 ----------
// 渠道级健康状态：按该渠道绑定的账号状态汇总出「在线 / 待刷新 / 未绑定」。
const channelState = (c?: ChannelSummary): 'online' | 'stale' | 'none' => {
  const conns = c?.connections ?? []
  if (!conns.length) return 'none'
  return conns.some((x) => x.status === 'valid') ? 'online' : 'stale'
}
const channelStateText = (c?: ChannelSummary): string =>
  ({ online: '在线', stale: '待刷新', none: '未绑定' })[channelState(c)]

// 待刷新账号数（过期 / 失效 / 未知凭借据）
const staleCount = (c?: ChannelSummary): number =>
  (c?.connections ?? []).filter((x) => x.status === 'expired' || x.status === 'invalid').length

const connState = (conn: ChannelConnectionSummary): 'valid' | 'stale' | 'unknown' =>
  conn.status === 'valid' ? 'valid' : conn.status === 'expired' || conn.status === 'invalid' ? 'stale' : 'unknown'
const connStateText = (conn: ChannelConnectionSummary): string =>
  ({ valid: '有效', stale: '待刷新', unknown: '未知' })[connState(conn)]

// ---------- 取数 ----------
async function loadChannels() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await channelApi.list()
    const data = (res as any)?.data ?? res
    channels.value = Array.isArray(data) ? data : []
    if (!activeChannel.value || !channels.value.some((c) => c.channel === activeChannel.value)) {
      activeChannel.value = channels.value[0]?.channel ?? ''
    }
  } catch (e: any) {
    loadError.value = e?.message ?? String(e)
    ElMessage.error('渠道列表加载失败：' + loadError.value)
  } finally {
    loading.value = false
  }
}

// ---------- 渠道总开关 ----------
async function toggleChannelEnabled(channel: string, enabled: boolean) {
  const b = busyOf(channel)
  if (b.login) return
  b.refresh = true
  try {
    await channelApi.setEnabled(channel, enabled)
    const c = channels.value.find((x) => x.channel === channel)
    if (c) c.enabled = enabled
    ElMessage.success('渠道状态已更新')
  } catch (e: any) {
    ElMessage.error('更新渠道开关失败：' + (e?.message ?? e))
  } finally {
    b.refresh = false
  }
}

// ---------- 账号绑定 ----------
// 交互契约（所有渠道统一）：
//   点「绑定账号」→ 立刻弹出绑定对话框 → 后端 start-login → 自动打开授权页/二维码
//   → SSE 持续等待 → 拿到凭据（done）自动关弹窗并刷新账号列表。
// 用户在弹窗里<b>不输入任何账号信息</b>（唯一例外：手动 API key，
// 这类在页面内拿不到，但也放在弹窗里完成，不散落在卡片上）。
//
// ⚠️ 用 reactive：模板直接读 bindState[c.channel]，必须响应式才能渲染弹窗内容。
const bindState = reactive<Record<string, {
  handle: Record<string, any>
  input: { apiKey: string }
}>>({})

// 进行中的 SSE 客户端（按渠道），用于「关闭弹窗 / 重新发起」时中止旧流。
const sseClients: Record<string, { close: () => void }> = {}

// 每个渠道当前流的序号：close() 会触发旧流的 onClose，
// 用它区分「旧流被主动关闭」和「当前流异常结束」。
const sseSeq: Record<string, number> = {}

// 绑定对话框的可见性 / 阶段 / 计时
const bindDialogVisible = ref(false)
const bindChannel = ref('')
const bindPhase = ref<'starting' | 'waiting' | 'error'>('starting')
const bindError = ref('')
const bindElapsed = ref(0)
let bindTimer: ReturnType<typeof setInterval> | null = null

// Raccoon 之类扫码渠道的二维码图片（dataURL），由 url 本地渲染，不外发。
const qrImages = reactive<Record<string, string>>({})

function resetBindChannel(channel: string) {
  bindState[channel] = { handle: {}, input: { apiKey: '' } }
}
function ensureBindState(channel: string) {
  if (!bindState[channel]) resetBindChannel(channel)
  return bindState[channel]!
}

// 按渠道 loginMethod 把弹窗内的输入合并进句柄后再开流。
// 约定键（与 SPI 实现对齐）：
//   api-key  → handle.apiKey（OpenCode）
//   其余     → handle.callbackUrl（手写兜底；TRAE / Gemini / LobsterAI 已由后端监听回调，正常不会用到）
function buildPollHandle(channel: string): Record<string, any> {
  const state = bindState[channel]
  const handle: Record<string, any> = { ...(state?.handle ?? {}) }
  const input = state?.input ?? { apiKey: '' }
  if (input.apiKey?.trim()) handle.apiKey = input.apiKey.trim()
  return handle
}

// 统一句柄 URL 键读取链：后端统一写 verifyUrl（各实现旧键 loginUrl / qrUrl /
// url / verification_uri* 保留兼容）。
function handleVerifyUrl(handle: Record<string, any>): string {
  if (!handle) return ''
  return String(
    handle.verifyUrl
    || handle.verification_uri_complete
    || handle.verification_uri
    || handle.loginUrl
    || handle.qrUrl
    || handle.url
    || '',
  )
}

// 本次绑定是否由后端本地回调自动收尾（TRAE / Gemini / LobsterAI）。
// 后端在句柄里回 callbackListening；true 表示用户授权后浏览器跳转会被自动接收。
const callbackAuto = (channel: string) => bindState[channel]?.handle?.callbackListening === true

// 当前绑定的渠道登录方式
const bindMethod = () => String(channels.value.find((c) => c.channel === bindChannel.value)?.loginMethod ?? '')
const isApiKeyBind = () => /^api-key$/i.test(bindMethod())
const isQrBind = () => /^qr-code$/i.test(bindMethod())
const bindNeedsInput = () => isApiKeyBind()

// 设备码：优先读句柄的 user_code；没有时从 verifyUrl 的 query 里兜底解析。
// 上游（如 MiniMax）只把码拼在 verification_uri_complete 里，句柄不带独立字段，
// 前端若只读 handle.user_code，弹窗上就会空一块，用户不知道该输什么。
function bindUserCode(): string {
  const handle = bindState[bindChannel.value]?.handle ?? {}
  const direct = String(handle.user_code ?? handle.userCode ?? '').trim()
  if (direct) return direct
  const url = handleVerifyUrl(handle)
  const m = /[?&]user_code=([^&#]+)/i.exec(url)
  return m ? decodeURIComponent(m[1]) : ''
}

// 复制授权码到剪贴板（设备码渠道；复制失败时静默，不影响流程）
async function copyBindCode() {
  const code = bindUserCode()
  if (!code) return
  try {
    await navigator.clipboard.writeText(code)
    ElMessage.success('授权码已复制')
  } catch {
    // 剪贴板权限被拒 / 非安全上下文：忽略，用户仍可手抄
  }
}

// 自动打开授权页：新窗口 + noopener（防止被打开的页面拿到 opener 句柄）。
//
// ⚠️ 两个坑：
//   1. 必须由用户点击同步触发，否则会被浏览器拦截；
//   2. 带 noopener 特性时，浏览器规范规定 window.open() **一律返回 null**
//      （新窗口没有 opener 可回指，自然拿不到 WindowProxy）。
//      所以不能再用 `!win` 判断「被拦截」—— 那会让每一次正常的自动开窗都弹出
//      「浏览器拦截了授权页弹窗」的错误提示，用户看到成功打开的新标签页时却被告知失败。
function openAuthWindow(url: string) {
  if (!url) return
  window.open(url, '_blank', 'noopener,noreferrer')
  // 不留 window 句柄，也就不做拦截判定：弹窗没开时用户仍可点弹窗内的
  // 「打开授权页」按钮（同一次点击上下文，属用户手势，不会再次被拦）。
}

// 扫码渠道：把 URL 本地渲染成二维码图片
async function renderQr(channel: string, url: string) {
  if (!url) return
  try {
    const QRCode = (await import('qrcode')).default
    qrImages[channel] = await QRCode.toDataURL(url, { width: 220, margin: 1 })
  } catch {
    // 渲染失败不影响主流程，弹窗里仍能看到链接
    qrImages[channel] = ''
  }
}

function stopBindTimer() {
  if (bindTimer) {
    clearInterval(bindTimer)
    bindTimer = null
  }
}

function closeBindDialog() {
  const channel = bindChannel.value
  if (channel) {
    // 先作废序号再 close：close() 同步触发旧流的 onClose，
    // 不推进序号的话它会被当成「当前流异常结束」而把弹窗重新标成错误态。
    sseSeq[channel] = (sseSeq[channel] ?? 0) + 1
    sseClients[channel]?.close()
    delete sseClients[channel]
    const b = busy.value[channel]
    if (b) b.login = false
  }
  stopBindTimer()
  bindDialogVisible.value = false
}

// 开 SSE 流并驱动弹窗阶段。
function startSse(channel: string) {
  sseClients[channel]?.close()
  delete sseClients[channel]
  bindPhase.value = 'waiting'
  bindError.value = ''
  // 用序号标记「本次」流：close 会触发旧流的 onClose，若不校验序号，
  // 关闭旧流的事件会把刚开的新流误判成异常结束。
  const seq = (sseSeq[channel] = (sseSeq[channel] ?? 0) + 1)
  let settled = false
  const isCurrent = () => !settled && sseSeq[channel] === seq
  const settle = () => {
    settled = true
    delete sseClients[channel]
    const b = busy.value[channel]
    if (b) b.login = false
    stopBindTimer()
  }
  const sse = channelApi.sseLogin(
    channel,
    // 不传 label：页面不收集任何账号信息（需求②），由后端按「账号 N」自动生成。
    { handle: buildPollHandle(channel) },
    {
      onPending: (data) => {
        // ⚠️ 合并服务端回显的句柄（Zcode 的 __lastPollAt 等），否则两次轮询之间服务端写入的状态会丢。
        const state = bindState[channel]
        if (data?.handle && typeof data.handle === 'object' && state) {
          Object.assign(state.handle, data.handle)
        }
      },
      onDone: (data) => {
        if (!isCurrent()) return
        settle()
        bindDialogVisible.value = false
        delete bindState[channel]
        ElMessage.success('账号绑定成功' + (data?.label ? '：' + data.label : ''))
        void loadChannels()
      },
      onFailed: (data) => {
        if (!isCurrent()) return
        const timedOut = data?.code === 'TIMEOUT'
        settle()
        bindPhase.value = 'error'
        bindError.value = timedOut
          ? '等待超时：请点「重新发起」再试'
          : (data?.message ?? data?.code ?? '未知错误')
      },
      onError: (err) => {
        if (!isCurrent()) return
        settle()
        bindPhase.value = 'error'
        bindError.value = err instanceof Error ? err.message : String(err)
      },
      onClose: () => {
        // 流结束但没收到 done / failed：服务端在推结果前异常退出，或网关掐断。
        // 不处理的话弹窗会永远停在「等待中」（转圈到死）。
        if (!isCurrent()) return
        settle()
        bindPhase.value = 'error'
        bindError.value = '登录流意外结束（未收到结果），请点「重新发起」'
      },
    },
    300,
  )
  sseClients[channel] = sse
}

// 点「绑定账号」的唯一入口：同步开窗（避免被拦截）→ 再拉句柄 → 开 SSE。
async function openBindDialog(channel: string) {
  const b = busyOf(channel)
  if (b.login) return
  b.login = true
  bindChannel.value = channel
  bindDialogVisible.value = true
  bindPhase.value = 'starting'
  bindError.value = ''
  bindElapsed.value = 0
  resetBindChannel(channel)
  stopBindTimer()
  bindTimer = setInterval(() => { bindElapsed.value += 1 }, 1000)

  try {
    const res = await channelApi.startLogin(channel)
    const out = (res as any)?.data ?? res
    const handle = (out?.handle ?? {}) as Record<string, any>
    bindState[channel]!.handle = handle

    const url = handleVerifyUrl(handle)
    if (isQrBind() && url) {
      // 后端直接下发的二维码图片（data URL）优先；没有时再本地把 URL 渲染成二维码。
      // 有后端直发二维码图时，verifyUrl 是官方授权页（如 Loomy 微信扫码）：
      // 除弹窗内联展示二维码外，同时自动打开官方页 —— 与浏览器授权类渠道一致。
      if (handle.qrImage) {
        qrImages[channel] = String(handle.qrImage)
        openAuthWindow(url)
      } else {
        await renderQr(channel, url)
      }
    } else if (url && !isApiKeyBind()) {
      // 授权页类渠道：直接开新窗口（用户点完就切过去了，不用回来操作本页）
      openAuthWindow(url)
    }

    // api-key 需要用户先在弹窗里给出凭据，不立即开流；
    // 其余渠道（设备码 / 授权页 / 扫码）立刻开流等待。
    if (!bindNeedsInput()) {
      startSse(channel)
    } else {
      bindPhase.value = 'waiting'
    }
    // api-key 之外的入参就绪后立刻发起；这里仅提示状态。
    if (handle.callbackListening === false) {
      ElMessage.warning('本地回调端口不可用，授权后需要手动粘贴回调地址')
    }
  } catch (e: any) {
    bindPhase.value = 'error'
    bindError.value = e?.message ?? String(e)
    b.login = false
  }
}

// 弹窗内「重新发起」：重新走一遍 start-login（换新授权码/新二维码）
async function restartBind() {
  const channel = bindChannel.value
  if (!channel) return
  sseSeq[channel] = (sseSeq[channel] ?? 0) + 1
  sseClients[channel]?.close()
  delete sseClients[channel]
  const b = busyOf(channel)
  b.login = false
  await openBindDialog(channel)
}

// api-key：提交 key（其余渠道无需输入，直接开流）
function submitBindInput() {
  const channel = bindChannel.value
  const state = bindState[channel]
  if (!state) return
  if (isApiKeyBind() && !state.input.apiKey.trim()) {
    ElMessage.warning('请填写 API key（匿名通道填 public）')
    return
  }
  startSse(channel)
}

// ---------- 账号刷新 / 签到 / 删除 ----------
async function refreshAccount(channel: string, label: string) {
  const b = busyOf(channel)
  b.refresh = true
  try {
    const res = await channelApi.refresh(channel, { label })
    const out = (res as any)?.data ?? res
    // SPI refresh() 可能返回同一份凭据（渠道没有可刷新字段、或上游未下发新 token），
    // 此时若仍提示「凭据已刷新」，用户会以为刷新成功但过期时间没变是 bug。
    if (out?.refreshed === false) {
      ElMessage.info('凭据仍有效，无需刷新')
    } else {
      ElMessage.success('凭据已刷新')
    }
  } catch (e: any) {
    ElMessage.error('刷新失败：' + (e?.message ?? e))
  } finally {
    b.refresh = false
  }
}

async function checkin(channel: string, label: string) {
  const b = busyOf(channel)
  b.sign = true
  try {
    const res = await channelApi.checkin(channel, { label })
    const out = (res as any)?.data ?? res
    if (out?.result && Object.keys(out.result).length > 0) {
      ElMessage.success('签到完成：' + JSON.stringify(out.result))
    } else {
      ElMessage.info(out?.message ?? '签到完成')
    }
  } catch (e: any) {
    ElMessage.error('签到失败：' + (e?.message ?? e))
  } finally {
    b.sign = false
  }
}

async function deleteAccount(channel: string, label: string) {
  try {
    await ElMessageBox.confirm(`删除账号「${label}」？`, '确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    await channelApi.deleteConnection(channel, label)
    ElMessage.success('账号已删除')
    await loadChannels()
  } catch (e: any) {
    ElMessage.error('删除失败：' + (e?.message ?? e))
  }
}

// ---------- 模型 ----------
async function pullModels(channel: string) {
  const b = busyOf(channel)
  b.models = true
  try {
    const summary = channels.value.find((c) => c.channel === channel)
    const conns = summary?.connections ?? []
    const label = conns[0]?.label
    // 渠道绑了多个账号时，不传 label 会让后端取「第一个账号」，用户无从得知拉的是谁的模型。
    if (conns.length > 1) {
      ElMessage.info(`该渠道有 ${conns.length} 个账号，当前按「${label ?? '默认账号'}」拉取`)
    }
    const res = await channelApi.listModels(channel, { label })
    const out = (res as any)?.data ?? res
    if (out?.models?.length) {
      ElMessage.success(`拉取到 ${out.models.length} 个模型，正在落库…`)
      // 落库走渠道专用端点（SPI listModels → sys_ai_provider_model），
      // 而非 /api/providers/{id}/models/import-all（该端点对 oauth 类 provider 会失败）。
      const impRes = await channelApi.importModels(channel, { label })
      const imp = (impRes as any)?.data ?? impRes
      if (imp?.ok) {
        ElMessage.success(`落库完成：新增 ${imp.created ?? 0}，更新 ${imp.updated ?? 0}`)
      }
      summary.models = out.models.map((m: any) => ({
        model: m.id,
        enabled: m.enabled ?? true,
        alias: m.name,
        contextWindow: m.contextWindow,
      }))
    } else {
      ElMessage.info('未返回模型')
    }
  } catch (e: any) {
    ElMessage.error('拉取模型失败：' + (e?.message ?? e))
  } finally {
    b.models = false
  }
}

async function toggleModel(channel: string, model: string, enabled: boolean) {
  try {
    await channelApi.setModelEnabled(channel, model, enabled)
    ElMessage.success(enabled ? '已启用 ' + model : '已停用 ' + model)
    const summary = channels.value.find((c) => c.channel === channel)
    const m = summary?.models?.find((x) => x.model === model)
    if (m) m.enabled = enabled
  } catch (e: any) {
    ElMessage.error('切换失败：' + (e?.message ?? e))
  }
}

watch(activeChannel, () => {
  /* 切换渠道卡片时不做额外操作 */
}, { immediate: false })

onMounted(() => {
  loadChannels()
})

// 卸载时中止所有进行中的登录流，避免后端线程空转到超时、前端残留回调。
onBeforeUnmount(() => {
  for (const key of Object.keys(sseClients)) {
    sseSeq[key] = (sseSeq[key] ?? 0) + 1
    try {
      sseClients[key].close()
    } catch {
      /* 已关闭 */
    }
    delete sseClients[key]
  }
})

// 模板引用
const busyFor = (channel: string, key: 'sign' | 'models' | 'refresh' | 'login') =>
  busyOf(channel)[key] === true
const setCallback = (channel: string, url: string) => {
  pendingCallback.value[channel] = url
}
const pendingCallbackFor = (channel: string) => pendingCallback.value[channel] ?? ''
</script>

<template>
  <div class="chm" data-page="channel">
    <!-- 页头：统一用 RePageHead（全站共用一份页面头实现） -->
    <RePageHead title="渠道管理">
      <template #sub>
        账号类渠道的账号绑定、轮询、刷新、签到与模型开关。
        <b>{{ channels.length }}</b> 个已注册渠道
      </template>
      <template #actions>
        <el-button class="chm-btn" :loading="loading" @click="loadChannels">
          <el-icon v-if="!loading" class="chm-btn__icon" aria-hidden="true"><RefreshIcon /></el-icon>
          刷新
        </el-button>
      </template>
    </RePageHead>

    <!-- 错误条 -->
    <div v-if="loadError" class="chm-alert is-danger">
      <span>渠道列表加载失败：{{ loadError }}</span>
      <button @click="loadChannels">重试</button>
    </div>

    <!-- 空态 -->
    <el-empty v-if="!loading && !channels.length" description="尚未注册任何账号类渠道">
      <template #description>
        <p>尚未注册任何账号类渠道</p>
        <p class="chm-empty__hint">
          渠道清单来自后端 SPI 注册表（{@code META-INF/extensions/AccountChannelAuthManager}）。
        </p>
      </template>
    </el-empty>

    <!-- 方案 A · 运维甲板：左渠道索引 + 右选中详情 -->
    <div v-else class="chm-deck">
      <!-- 左：渠道索引（官方图标 / 品牌徽标 + 状态灯） -->
      <aside class="chm-rail">
        <div class="chm-rail__head">
          <span>渠道索引</span>
          <b>{{ channels.length }}</b>
        </div>
        <button
          v-for="c in channels"
          :key="c.channel"
          type="button"
          class="chm-rail__item"
          :class="{ 'is-active': c.channel === activeChannel }"
          @click="activeChannel = c.channel"
        >
          <span class="chm-rail__logo"
                :class="{ 'is-ico': !!brandOf(c.channel).icon }"
                :style="brandOf(c.channel).icon ? undefined : { background: brandOf(c.channel).color }">
            <img v-if="brandOf(c.channel).icon" :src="brandOf(c.channel).icon" :alt="c.channel" />
            <b v-else>{{ brandOf(c.channel).glyph }}</b>
          </span>
          <span class="chm-rail__name" :title="c.displayName || c.channel">
            {{ c.displayName || c.channel }}
          </span>
          <span class="chm-rail__dot" :class="'is-' + channelState(c)"
                :title="channelStateText(c)" />
        </button>
      </aside>

      <!-- 右：选中渠道详情 -->
      <section v-if="activeSummary()" class="chm-panel">
        <header class="chm-panel__head">
          <span class="chm-panel__logo"
                :class="{ 'is-ico': !!brandOf(activeChannel).icon }"
                :style="brandOf(activeChannel).icon ? undefined : { background: brandOf(activeChannel).color }">
            <img v-if="brandOf(activeChannel).icon" :src="brandOf(activeChannel).icon" :alt="activeChannel" />
            <b v-else>{{ brandOf(activeChannel).glyph }}</b>
          </span>
          <div class="chm-panel__title">
            <h3>{{ activeSummary()!.displayName || activeChannel }}</h3>
            <span>
              <i>{{ brandOf(activeChannel).method || activeSummary()!.loginMethod || '—' }}</i>
              · provider {{ activeSummary()!.providerId }}
              <span class="chm-panel__chip" v-if="activeSummary()!.supportsCheckin">可签到</span>
              <span class="chm-panel__chip is-muted" v-else>无签到</span>
            </span>
          </div>
          <div class="chm-panel__state">
            <span class="chm-rail__dot" :class="'is-' + channelState(activeSummary())" />
            {{ channelStateText(activeSummary()) }}
          </div>
          <el-switch
            :model-value="activeSummary()!.enabled"
            class="chm-panel__switch"
            @change="(v: boolean | string | number) => toggleChannelEnabled(activeChannel, !!v)"
          />
        </header>

        <!-- KPI 行 -->
        <div class="chm-kpis">
          <div class="chm-kpi">
            <b>{{ (activeSummary()!.connections ?? []).length }}</b>
            <span>绑定账号</span>
          </div>
          <div class="chm-kpi">
            <b>{{ (activeSummary()!.models ?? []).length }}</b>
            <span>可用模型</span>
          </div>
          <div class="chm-kpi">
            <b :class="{ 'is-warn': staleCount(activeSummary()!) > 0 }">{{ staleCount(activeSummary()!) }}</b>
            <span>待刷新</span>
          </div>
        </div>

        <!-- 账号区 -->
        <div class="chm-panel__block">
          <div class="chm-panel__sect-title">
            <el-icon aria-hidden="true"><ConnectionIcon /></el-icon>
            账号 <i>{{ (activeSummary()!.connections ?? []).length }}</i>
          </div>
          <div class="chm-accs">
            <div
              v-for="conn in activeSummary()!.connections ?? []"
              :key="conn.connectionId"
              class="chm-acc"
              :class="{ 'is-stale': connState(conn) !== 'valid' }"
            >
              <span class="chm-acc__label" :title="conn.label">{{ conn.label || '未命名' }}</span>
              <span class="chm-acc__state" :class="'is-' + connState(conn)">
                {{ connStateText(conn) }}
              </span>
              <div class="chm-acc__actions">
                <button class="chm-acc__btn" :disabled="busyFor(activeChannel, 'refresh')"
                        @click.stop="refreshAccount(activeChannel, conn.label ?? '')">刷新</button>
                <button v-if="activeSummary()!.supportsCheckin" class="chm-acc__btn"
                        :disabled="busyFor(activeChannel, 'sign')"
                        @click.stop="checkin(activeChannel, conn.label ?? '')">签到</button>
                <button class="chm-acc__btn is-danger"
                        @click.stop="deleteAccount(activeChannel, conn.label ?? '')">删除</button>
              </div>
            </div>
            <div v-if="!(activeSummary()!.connections ?? []).length" class="chm-card__empty">
              尚无绑定账号
            </div>
          </div>
        </div>

        <!-- 模型区 -->
        <div class="chm-panel__block">
          <div class="chm-panel__sect-title">
            <el-icon aria-hidden="true"><DataAnalysisIcon /></el-icon>
            模型 <i>{{ (activeSummary()!.models ?? []).length }}</i>
            <button class="chm-panel__pull" :disabled="busyFor(activeChannel, 'models')"
                    @click.stop="pullModels(activeChannel)">
              {{ busyFor(activeChannel, 'models') ? '拉取中…' : '拉取模型' }}
            </button>
          </div>
          <div class="chm-models">
            <label
              v-for="m in activeSummary()!.models ?? []"
              :key="m.model"
              class="chm-model"
              :class="{ 'is-off': !m.enabled }"
            >
              <input type="checkbox" :checked="m.enabled"
                     @change="(e) => toggleModel(activeChannel, m.model, (e as any).target.checked)" />
              <span class="chm-model__name" :title="m.model">{{ m.model }}</span>
              <span v-if="m.contextWindow" class="chm-model__ctx">{{ m.contextWindow }}</span>
            </label>
            <div v-if="!(activeSummary()!.models ?? []).length" class="chm-card__empty">
              该渠道暂无已启用模型
            </div>
          </div>
        </div>

        <!-- 绑定新账号：虚线框，点击即弹窗。
             不设账号标签输入框——页面不收集任何账号信息（需求②），
             标签由后端按「账号 N」自动生成，绑定成功后可在列表里识别。 -->
        <button
          class="chm-panel__bindbtn"
          type="button"
          :disabled="busyFor(activeChannel, 'login')"
          @click="openBindDialog(activeChannel)"
        >
          <el-icon v-if="!busyFor(activeChannel, 'login')" class="chm-btn__icon" aria-hidden="true">
            <PlusIcon />
          </el-icon>
          {{ busyFor(activeChannel, 'login') ? '登录中…' : '＋ 绑定新账号（点击弹出）' }}
        </button>
      </section>

      <!-- 选中渠道消失的兜底（列表刷新间隙） -->
      <section v-else class="chm-panel">
        <div class="chm-card__empty">正在加载渠道详情…</div>
      </section>
    </div>

    <!--
      绑定账号对话框：ReDialog（koi 平台壳），所有渠道统一。
      内部结构（重构后）：
        - #header：渠道品牌头部（官方图标 / 徽标 + 渠道名 + 登录方式 + provider）
        - 状态带：四相（starting 创建会话 / waiting 等待授权 / error 失败）+ 计时
        - 阶段区：按登录方式呈递内容
            (1) 设备码（device-code / browser-device）：授权码大字 + 复制 + 授权链接
            (2) 扫码（qr-code）：二维码 + 提示
            (3) 浏览器授权（browser-oauth）：打开授权页主按钮 + 链接兜底
            (4) API key：密钥输入
        - #footer：重新发起 + 取消
      拿到凭据（SSE done）自动关闭；用户在弹窗里不做任何账号粘贴（Loomy 微信扫码同其它渠道）。
    -->
    <ReDialog
      v-model="bindDialogVisible"
      width="480px"
      append-to-body
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      destroy-on-close
      class="chm-bind-dialog"
      @closed="closeBindDialog"
    >
      <!-- 头部：渠道品牌 -->
      <template #header>
        <div class="chm-bind__head">
          <span class="chm-bind__logo"
                :class="{ 'is-ico': !!brandOf(bindChannel).icon }"
                :style="brandOf(bindChannel).icon ? undefined : { background: brandOf(bindChannel).color }">
            <img v-if="brandOf(bindChannel).icon" :src="brandOf(bindChannel).icon" :alt="bindChannel" />
            <b v-else>{{ brandOf(bindChannel).glyph }}</b>
          </span>
          <div class="chm-bind__headtext">
            <b>{{ channels.find((c) => c.channel === bindChannel)?.displayName || bindChannel }}</b>
            <span>
              <i>{{ brandOf(bindChannel).method || '账号绑定' }}</i>
              · 绑定新账号
            </span>
          </div>
        </div>
      </template>

      <div class="chm-bind">
        <!-- 状态带 -->
        <div class="chm-bind__status" :class="{ 'is-error': bindPhase === 'error' }">
          <span class="chm-bind__dot" :class="{ 'is-error': bindPhase === 'error' }" />
          <span v-if="bindPhase === 'starting'">正在创建登录会话…</span>
          <span v-else-if="bindPhase === 'error'">失败：{{ bindError }}</span>
          <span v-else-if="isApiKeyBind()">请填写 API key 后提交</span>
          <span v-else-if="isQrBind()">请用微信扫码授权</span>
          <span v-else-if="callbackAuto(bindChannel)">已打开授权页，完成后会自动绑定（无需回到本页）</span>
          <span v-else>已打开授权页，请在那里完成登录</span>
          <span class="chm-bind__elapsed" v-if="bindPhase === 'waiting'">{{ bindElapsed }}s</span>
        </div>

        <div class="chm-bind__stage">
          <!-- (1) 设备码 / 授权码（device-code / browser-device） -->
          <div v-if="bindUserCode()" class="chm-bind__code">
            <span class="chm-bind__code-label">授权码</span>
            <div class="chm-bind__code-row">
              <b class="chm-bind__code-value">{{ bindUserCode() }}</b>
              <button
                class="chm-bind__copy"
                type="button"
                title="复制授权码"
                @click="copyBindCode()"
              >复制</button>
            </div>
            <span class="chm-bind__code-hint">在设备 / 授权页面输入此授权码完成登录</span>
          </div>

          <!-- (2) 扫码（qr-code） -->
          <div v-if="isQrBind() && qrImages[bindChannel]" class="chm-bind__qr">
            <img :src="qrImages[bindChannel]" alt="登录二维码" />
            <span class="chm-bind__qr-hint">使用微信「扫一扫」完成授权，成功后自动绑定</span>
          </div>

          <!-- (3) 浏览器授权入口（授权链接兜底：自动开窗失败 / 被关闭时） -->
          <div v-if="handleVerifyUrl(bindState[bindChannel]?.handle ?? {}) && !isQrBind() && !isApiKeyBind()"
               class="chm-bind__cta">
            <button
              class="chm-bind__open"
              type="button"
              @click="openAuthWindow(handleVerifyUrl(bindState[bindChannel]?.handle ?? {}))"
            >
              打开授权页
            </button>
            <a class="chm-bind__href"
               :href="handleVerifyUrl(bindState[bindChannel]?.handle ?? {})"
               target="_blank" rel="noopener noreferrer">或点此链接</a>
          </div>

          <!-- (4) API key（OpenCode） -->
          <div v-if="isApiKeyBind()" class="chm-bind__form">
            <div class="chm-bind__row">
              <input
                :value="bindState[bindChannel]?.input?.apiKey ?? ''"
                @input="(bindState[bindChannel]!.input.apiKey = (e as any).target.value)"
                class="chm-input"
                placeholder="Zen API key（匿名通道填 public）"
              />
              <button class="chm-btn chm-btn--primary" type="button" @click="submitBindInput()">提交</button>
            </div>
          </div>

          <!-- (5) 本地回调不可用时的兜底：允许手工粘贴回调地址 -->
          <div v-if="bindState[bindChannel]?.handle?.callbackListening === false" class="chm-bind__form">
            <div class="chm-bind__hint">检测到本地回调端口不可用，授权后请把浏览器地址栏的回调地址粘到下面：</div>
            <div class="chm-bind__row">
              <input
                :value="bindState[bindChannel]?.handle?.callbackUrl ?? ''"
                @input="(bindState[bindChannel]!.handle.callbackUrl = (e as any).target.value)"
                class="chm-input"
                placeholder="http://127.0.0.1:…/authorize?…"
              />
              <button class="chm-btn" type="button" @click="submitBindInput()">提交</button>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <button class="chm-btn" type="button" @click="restartBind()"
                :disabled="bindPhase === 'starting'">重新发起</button>
        <button class="chm-btn chm-btn--primary" type="button" @click="closeBindDialog()">取消</button>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped>
.chm {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 0 24px;
}
.chm-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  background: var(--el-fill-color-blank, #fff);
  color: var(--el-text-color-regular, #606266);
  font-size: 13px;
  cursor: pointer;
  transition: all .15s ease;
}
.chm-btn:hover {
  border-color: var(--el-color-primary-light-5, #a0cfff);
  color: var(--el-color-primary, #409eff);
}
.chm-btn--primary {
  border-color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary, #409eff);
  color: #fff;
}
.chm-btn--primary:hover {
  background: var(--el-color-primary-light-3, #79bbff);
}
.chm-btn--primary:disabled {
  opacity: .55;
  cursor: not-allowed;
}
.chm-alert {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.chm-alert.is-danger {
  background: color-mix(in srgb, var(--el-color-danger, #f56c6c) 8%, transparent);
  color: var(--el-color-danger, #f56c6c);
}
.chm-alert button {
  border: 1px solid currentColor;
  background: transparent;
  color: inherit;
  border-radius: 4px;
  padding: 2px 10px;
  cursor: pointer;
  font-size: 12px;
}
/* ============ 方案 A · 运维甲板（OPS·DECK） ============ */
.chm-deck {
  display: flex;
  gap: 14px;
  align-items: stretch;
}

/* ---- 左：渠道索引 ---- */
.chm-rail {
  flex: none;
  width: 216px;
  border: 1px solid var(--border-default, #e2e9f3);
  border-radius: 12px;
  background: var(--bg-container, #fff);
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: calc(100vh - 220px);
  overflow-y: auto;
}
.chm-rail__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px 8px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary, #475569);
  letter-spacing: .04em;
}
.chm-rail__head b {
  color: var(--text-tertiary, #94a3b8);
  font-variant-numeric: tabular-nums;
}
.chm-rail__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 8px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  text-align: left;
  color: var(--text-primary, #0f172a);
  transition: background-color .15s ease;
}
.chm-rail__item:hover {
  background: var(--bg-hover, #f1f5fb);
}
.chm-rail__item.is-active {
  background: color-mix(in srgb, var(--brand-500, #3b82f6) 10%, transparent);
  font-weight: 600;
}
.chm-rail__logo {
  flex: none;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  overflow: hidden;
}
.chm-rail__logo.is-ico {
  background: #fff;
  border: 1px solid var(--border-subtle, #eef2f8);
}
.chm-rail__logo img {
  width: 16px;
  height: 16px;
  object-fit: contain;
}
.chm-rail__logo b {
  color: #fff;
  font-size: 11px;
}
.chm-rail__name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.chm-rail__dot {
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--text-tertiary, #94a3b8);
}
.chm-rail__dot.is-online {
  background: #22c55e;
}
.chm-rail__dot.is-stale {
  background: #f59e0b;
}
.chm-rail__dot.is-none {
  background: #cbd5e1;
}

/* ---- 右：选中渠道详情 ---- */
.chm-panel {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--border-default, #e2e9f3);
  border-radius: 12px;
  background: var(--bg-container, #fff);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.chm-panel__head {
  display: flex;
  align-items: center;
  gap: 12px;
}
.chm-panel__logo {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 20px;
  font-weight: 800;
  overflow: hidden;
}
.chm-panel__logo.is-ico {
  background: #fff;
  border: 1px solid var(--border-subtle, #eef2f8);
}
.chm-panel__logo img {
  width: 28px;
  height: 28px;
  object-fit: contain;
}
.chm-panel__logo b {
  color: #fff;
  font-size: 18px;
}
.chm-panel__title {
  flex: 1;
  min-width: 0;
}
.chm-panel__title h3 {
  margin: 0 0 2px;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
}
.chm-panel__title > span {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary, #475569);
  flex-wrap: wrap;
}
.chm-panel__title i {
  font-style: normal;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--text-secondary, #475569);
  background: var(--bg-fill, #f1f5fb);
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
}
.chm-panel__chip {
  display: inline-block;
  padding: 1px 6px;
  font-size: 11px;
  font-weight: 500;
  border-radius: 4px;
  background: color-mix(in srgb, var(--el-color-success, #67c23a) 14%, transparent);
  color: var(--el-color-success, #67c23a);
}
.chm-panel__chip.is-muted {
  background: color-mix(in srgb, var(--el-text-color-secondary, #909399) 14%, transparent);
  color: var(--el-text-color-secondary, #909399);
}
.chm-panel__state {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary, #475569);
  white-space: nowrap;
}
.chm-panel__state .chm-rail__dot {
  width: 9px;
  height: 9px;
}
.chm-panel__switch {
  margin: 0;
}

/* ---- KPI 行 ---- */
.chm-kpis {
  display: flex;
  gap: 10px;
}
.chm-kpi {
  flex: 1;
  border: 1px solid var(--border-subtle, #eef2f8);
  border-radius: 10px;
  padding: 8px 12px;
  background: var(--bg-elevated, #f8fafc);
}
.chm-kpi b {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}
.chm-kpi b.is-warn {
  color: var(--el-color-warning, #e6a23c);
}
.chm-kpi span {
  font-size: 12px;
  color: var(--text-secondary, #475569);
}

/* ---- 账号 / 模型区块 ---- */
.chm-panel__block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.chm-panel__sect-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-regular, #475569);
  letter-spacing: .04em;
}
.chm-panel__sect-title i {
  font-style: normal;
  font-weight: 500;
  color: var(--text-tertiary, #94a3b8);
}
.chm-panel__sect-title .el-icon {
  color: var(--text-tertiary, #94a3b8);
}
.chm-panel__pull {
  margin-left: auto;
  border: 1px solid var(--border-default, #e2e9f3);
  background: var(--bg-container, #fff);
  color: var(--text-regular, #475569);
  border-radius: 6px;
  padding: 3px 10px;
  font-size: 12px;
  cursor: pointer;
}
.chm-panel__pull:hover {
  border-color: var(--brand-400, #60a5fa);
  color: var(--brand-600, #2563eb);
}
.chm-panel__pull:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.chm-card__empty {
  font-size: 12px;
  color: var(--text-tertiary, #94a3b8);
  padding: 8px;
  border: 1px dashed var(--border-default, #d3dceb);
  border-radius: 8px;
  text-align: center;
}
.chm-accs,
.chm-models {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.chm-acc {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid var(--border-subtle, #eef2f8);
  border-radius: 8px;
  font-size: 13px;
  background: var(--bg-container, #fff);
}
.chm-acc.is-stale {
  border-color: color-mix(in srgb, var(--el-color-warning, #e6a23c) 50%, transparent);
}
.chm-acc__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary, #0f172a);
  font-weight: 500;
}
.chm-acc__state {
  font-size: 11px;
  font-weight: 500;
  padding: 1px 8px;
  border-radius: 99px;
  background: color-mix(in srgb, var(--el-text-color-secondary, #909399) 14%, transparent);
  color: var(--el-text-color-secondary, #909399);
}
.chm-acc__state.is-valid {
  background: color-mix(in srgb, var(--el-color-success, #67c23a) 14%, transparent);
  color: var(--el-color-success, #67c23a);
}
.chm-acc__state.is-stale {
  background: color-mix(in srgb, var(--el-color-warning, #e6a23c) 14%, transparent);
  color: var(--el-color-warning, #e6a23c);
}
.chm-acc__state.is-unknown {
  background: color-mix(in srgb, var(--el-text-color-secondary, #909399) 14%, transparent);
  color: var(--el-text-color-secondary, #909399);
}
.chm-acc__actions {
  display: flex;
  gap: 6px;
}
.chm-acc__btn {
  border: 1px solid var(--border-default, #e2e9f3);
  background: var(--bg-container, #fff);
  color: var(--text-regular, #475569);
  border-radius: 6px;
  padding: 3px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: border-color .15s, color .15s;
}
.chm-acc__btn:hover {
  border-color: var(--brand-400, #60a5fa);
  color: var(--brand-600, #2563eb);
}
.chm-acc__btn.is-danger:hover {
  border-color: var(--el-color-danger-light-5, #fab6b6);
  color: var(--el-color-danger, #f56c6c);
}
.chm-acc__btn:disabled {
  opacity: .55;
  cursor: not-allowed;
}

/* ---- 绑定虚线框 ---- */
.chm-panel__bindbtn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 10px;
  font-size: 13px;
  color: var(--text-regular, #475569);
  background: transparent;
  border: 1px dashed var(--border-strong, #d3dceb);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color .15s, color .15s, background-color .15s;
}
.chm-panel__bindbtn:hover {
  border-color: var(--brand-600, #2563eb);
  color: var(--brand-600, #2563eb);
  background: color-mix(in srgb, var(--brand-500, #3b82f6) 6%, transparent);
}
.chm-panel__bindbtn:disabled {
  opacity: .55;
  cursor: not-allowed;
}

/* ---------- 绑定弹窗（ReDialog 重构） ---------- */
/* 外壳：ReDialog 默认 layout=el 是素面 Element 弹窗，这里补「运维甲板」风格外壳 */
.chm-bind-dialog {
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(15, 23, 42, .18);
  border: 1px solid var(--border-default, #e2e9f3);
}
.chm-bind-dialog :deep(.el-dialog__header) {
  padding: 16px 20px 0;
  margin-right: 0;
  border-bottom: 1px solid var(--border-subtle, #eef2f8);
  background: var(--bg-elevated, #f8fafc);
}
.chm-bind-dialog :deep(.el-dialog__headerbtn) {
  top: 16px;
  right: 16px;
}
.chm-bind-dialog :deep(.el-dialog__body) {
  padding: 16px 20px 8px;
}
.chm-bind-dialog :deep(.el-dialog__footer) {
  padding: 8px 20px 16px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid var(--border-subtle, #eef2f8);
  background: var(--bg-elevated, #f8fafc);
}
.chm-bind {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
/* 头部：渠道品牌 */
.chm-bind__head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.chm-bind__logo {
  flex: none;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  overflow: hidden;
}
.chm-bind__logo.is-ico {
  background: #fff;
  border: 1px solid var(--border-subtle, #eef2f8);
}
.chm-bind__logo img {
  width: 22px;
  height: 22px;
  object-fit: contain;
}
.chm-bind__logo b {
  color: #fff;
  font-size: 14px;
}
.chm-bind__headtext {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.chm-bind__headtext > b {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
  line-height: 1.2;
}
.chm-bind__headtext > span {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--text-secondary, #475569);
}
.chm-bind__headtext i {
  font-style: normal;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  color: var(--text-secondary, #475569);
  background: var(--bg-fill, #f1f5fb);
  padding: 1px 6px;
  border-radius: 4px;
}
/* 状态带 */
.chm-bind__status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-regular, #475569);
  border: 1px solid var(--border-subtle, #eef2f8);
  border-radius: 8px;
  padding: 8px 10px;
  background: var(--bg-elevated, #f8fafc);
}
.chm-bind__status.is-error {
  border-color: color-mix(in srgb, var(--el-color-danger, #f56c6c) 40%, transparent);
  color: var(--el-color-danger, #f56c6c);
}
.chm-bind__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--brand-500, #3b82f6);
  animation: chm-pulse 1.2s ease-in-out infinite;
  flex: none;
}
.chm-bind__dot.is-error {
  background: var(--el-color-danger, #f56c6c);
  animation: none;
}
.chm-bind__dot.is-done {
  background: #22c55e;
  animation: none;
}
@keyframes chm-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.25; }
}
.chm-bind__elapsed {
  margin-left: auto;
  font-variant-numeric: tabular-nums;
  color: var(--text-tertiary, #94a3b8);
}
/* 阶段内容区 */
.chm-bind__stage {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
/* 设备码 / 授权码 */
.chm-bind__code {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px 12px;
  background: var(--bg-elevated, #f8fafc);
  border: 1px solid var(--border-subtle, #eef2f8);
  border-radius: 10px;
}
.chm-bind__code-label {
  font-size: 12px;
  color: var(--text-secondary, #475569);
}
.chm-bind__code-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.chm-bind__code-value {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 22px;
  letter-spacing: 2px;
  user-select: all;
  color: var(--text-primary, #0f172a);
}
.chm-bind__copy {
  border: 1px solid var(--border-default, #e2e9f3);
  background: var(--bg-container, #fff);
  color: var(--text-regular, #475569);
  border-radius: 6px;
  padding: 3px 10px;
  font-size: 12px;
  cursor: pointer;
}
.chm-bind__copy:hover {
  border-color: var(--brand-400, #60a5fa);
  color: var(--brand-600, #2563eb);
}
.chm-bind__code-hint {
  font-size: 12px;
  color: var(--text-tertiary, #94a3b8);
}
/* 扫码 */
.chm-bind__qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.chm-bind__qr img {
  width: 210px;
  height: 210px;
  border: 1px solid var(--border-subtle, #eef2f8);
  border-radius: 10px;
}
.chm-bind__qr-hint {
  font-size: 12px;
  color: var(--text-tertiary, #94a3b8);
}
/* 授权入口 */
.chm-bind__cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px;
  font-size: 12px;
}
.chm-bind__open {
  border: 1px solid var(--brand-600, #2563eb);
  background: var(--brand-600, #2563eb);
  color: #fff;
  border-radius: 8px;
  padding: 7px 18px;
  font-size: 13px;
  cursor: pointer;
}
.chm-bind__open:hover {
  background: var(--brand-500, #3b82f6);
}
.chm-bind__href {
  color: var(--brand-600, #2563eb);
}
/* 输入表单（API key / 回调粘贴） */
.chm-bind__form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.chm-bind__row {
  display: flex;
  gap: 8px;
}
.chm-bind__hint {
  font-size: 12px;
  color: var(--el-color-warning, #e6a23c);
}

.chm-input {
  padding: 5px 8px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 4px;
  font-size: 12px;
  color: var(--el-text-color-regular, #606266);
  background: var(--el-fill-color-blank, #fff);
  width: 100%;
}
.chm-input:focus {
  outline: none;
  border-color: var(--el-color-primary, #409eff);
}
.chm-model {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}
.chm-model.is-off {
  opacity: .65;
}
.chm-model input[type='checkbox'] {
  accent-color: var(--el-color-primary, #409eff);
}
.chm-model__name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-primary, #303133);
}
.chm-model__ctx {
  font-size: 11px;
  color: var(--el-text-color-secondary, #909399);
  font-variant-numeric: tabular-nums;
}
.chm-empty__hint {
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}
</style>
