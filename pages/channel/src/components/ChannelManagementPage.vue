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

import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
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
import { channelApi } from '../channelApi'
import type {
  ChannelSummary,
  ChannelConnectionSummary,
  ChannelAccount,
} from '../channelApi'
import ReButton from '@repo/ui/re-button'
import ReTabs from '@repo/ui/re-tabs'
import ChannelAccountDialog from './ChannelAccountDialog.vue'
import MagpieProviderPanel from './MagpieProviderPanel.vue'
import MagpiePluginPanel from './MagpiePluginPanel.vue'

// 各渠道的官方图标（本地落地的品牌资源）。
// 有官方 SVG/ICO 的渠道用图标；没有公开官方资源的渠道（Qoder / Raccoon / Loomy…）
// 用品牌色圆角徽标 + 首字母兜底，保证视觉一致性。
import clineIcon from '../assets/channel-icons/cline.svg'
import traeIcon from '../assets/channel-icons/trae.svg'
import opencodeIcon from '../assets/channel-icons/opencode.svg'
import geminiIcon from '../assets/channel-icons/gemini.svg'
import minimaxIcon from '../assets/channel-icons/minimax.ico'
import zcodeIcon from '../assets/channel-icons/zcode.ico'
import lobsteraiIcon from '../assets/channel-icons/lobsterai.ico'

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
  workbuddy: { color: '#5A4FF3', glyph: 'W', method: '浏览器授权' },
  // Magpie 统一网关：本机 / Docker 常驻，凭据是「网关地址 + 网关 key」
  magpie: { color: '#0EA5A4', glyph: 'M', method: 'API Key' },
  // ChatClient 免登录渠道：无官方图标，用 DuckDuckGo 品牌橙 + 首字母徽标
  'chat-duckduckgo': { color: '#DE5833', glyph: 'D', method: '免登录' },
  // Trae：对话复用本机登录态（也可在面板里临时填 JWT），同时具备文生图能力
  'chat-trae': { icon: traeIcon, color: '#0F766E', glyph: 'T', method: '本机登录态' },
  // 文生图渠道：Pollinations 免登录，DuckDuckGo 走 SSE 免登录，Trae 需登录态
  'image-duckduckgo': { color: '#DE5833', glyph: 'D', method: '免登录' },
  'image-pollinations': { color: '#7C3AED', glyph: 'P', method: '免登录' },
  'image-trae': { icon: traeIcon, color: '#0F766E', glyph: 'T', method: '本机登录态' },
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
  // ChatClient 免登录渠道（对话 / 文生图）没有连接行：只要 SPI 已注册即可用
  const kind = String(c?.kind ?? '').toUpperCase()
  if (kind === 'CHAT' || kind === 'IMAGE') return 'online'
  const conns = c?.connections ?? []
  if (!conns.length) return 'none'
  return conns.some((x) => x.status === 'valid') ? 'online' : 'stale'
}
const channelStateText = (c?: ChannelSummary): string =>
  ['CHAT', 'IMAGE'].includes(String(c?.kind ?? '').toUpperCase())
    ? '免登录可用'
    : ({ online: '在线', stale: '待刷新', none: '未绑定' })[channelState(c)]

const connState = (conn: ChannelConnectionSummary): 'valid' | 'stale' | 'unknown' =>
  conn.status === 'valid' ? 'valid' : conn.status === 'expired' || conn.status === 'invalid' ? 'stale' : 'unknown'
const connStateText = (conn: ChannelConnectionSummary): string =>
  ({ valid: '有效', stale: '待刷新', unknown: '未知' })[connState(conn)]

// ---------- 取数 ----------
async function loadChannels() {
  loading.value = true
  loadError.value = ''
  try {
    // /api/channels 只回 AI 账号渠道（AccountChannelAuthManager）；免登录对话 /
    // 文生图渠道走各自 SPI 端点。三路合并后才是完整渠道清单（DuckDuckGo 在此），
    // 单路失败不拖垮整页：AI 渠道是主体，其余两路失败仅影响新增渠道的展示。
    const [ai, chat, image] = await Promise.allSettled([
      channelApi.list(),
      channelApi.chatChannels(),
      channelApi.imageChannels(),
    ])
    // 主清单（AI 账号渠道）失败才在错误条里提示；免登录两路失败不弹错误。
    if (ai.status === 'rejected') loadError.value = ai.reason?.message ?? String(ai.reason)
    const aiRows: ChannelSummary[] =
      ai.status === 'fulfilled' && Array.isArray((ai.value as any)?.data ?? ai.value)
        ? ((ai.value as any).data ?? ai.value)
        : []
    /** 免登录 SPI 元数据 → 渠道卡片摘要 */
    const toSummary = (x: any, kind: 'CHAT' | 'IMAGE'): ChannelSummary => ({
      channel: x.channel,
      displayName: x.displayName,
      kind,
      enabled: true,
      priority: x.priority,
      supportsImage: kind === 'IMAGE' ? true : x.supportsImage,
      chatClient: kind === 'CHAT',
      imageClient: kind === 'IMAGE',
      connections: [],
      models: (x.models ?? []).map((m: any) => ({
        model: m.id ?? m.model,
        enabled: true,
        alias: m.name ?? m.alias,
        contextWindow: m.contextWindow,
      })),
    })
    const chatRows: ChannelSummary[] =
      chat.status === 'fulfilled' ? (chat.value?.channels ?? []).map((x) => toSummary(x, 'CHAT')) : []
    const imageRows: ChannelSummary[] =
      image.status === 'fulfilled' ? (image.value?.channels ?? []).map((x) => toSummary(x, 'IMAGE')) : []
    channels.value = [...aiRows, ...chatRows, ...imageRows]
    // 对话渠道的模型清单不在元数据里，并发补一次实时拉取，避免面板首屏空模型；
    // 单渠道失败/未就绪直接跳过（模型区仍可手动「拉取模型」）。
    await Promise.allSettled(
      chatRows.map(async (c) => {
        try {
          const m = await channelApi.chatModels(c.channel)
          if (m?.available !== false) {
            c.models = (m.models ?? []).map((x) => ({
              model: x.id, enabled: true, alias: x.name, contextWindow: x.contextWindow,
            }))
          }
        } catch { /* 单渠道模型拉取失败不拖垮整页 */ }
      }),
    )
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
  input: { apiKey: string; baseUrl: string; pageKey: string; pageUrl: string }
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
  bindState[channel] = { handle: {}, input: { apiKey: '', baseUrl: '', pageKey: '', pageUrl: '' } }
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
  const input = state?.input ?? { apiKey: '', baseUrl: '', pageKey: '', pageUrl: '' }
  if (input.apiKey?.trim()) handle.apiKey = input.apiKey.trim()
  // Magpie：数据面地址 / 管理面地址 / 页面 Key 分开传（后端会互相推导，可只填其一）
  if (channel === 'magpie') {
    if (input.baseUrl?.trim()) handle.baseUrl = input.baseUrl.trim()
    if (input.pageKey?.trim()) handle.pageKey = input.pageKey.trim()
    if (input.pageUrl?.trim()) handle.pageUrl = input.pageUrl.trim()
  }
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
/**
 * 免鉴权渠道（如 Kilo 免费池）：无凭据、无授权页，点「绑定账号」后直接开流即可。
 *
 * <p>后端用 {@code loginMethod=keyless} 表达。缺少这一支时 Kilo 会被当成
 * {@code api-key}，弹窗要求填一个根本不存在的 key，用户以为绑定失败。</p>
 */
const isKeylessBind = () => /^keyless$/i.test(bindMethod())
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
    // Magpie：把后端给的默认网关地址 / 页面地址预填到输入框（用户可改成远程地址）
    if (channel === 'magpie') {
      if (!bindState[channel]!.input.baseUrl) {
        bindState[channel]!.input.baseUrl = String(handle.baseUrl ?? '')
      }
      if (!bindState[channel]!.input.pageUrl) {
        bindState[channel]!.input.pageUrl = String(handle.pageUrl ?? '')
      }
    }

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
  if (isApiKeyBind() && !state.input.apiKey.trim() && channel !== 'magpie') {
    ElMessage.warning('请填写 API key（匿名通道填 public）')
    return
  }
  startSse(channel)
}

// Magpie 网关地址输入（远程 / Docker 部署时填非本机地址；
// 也允许整条粘贴 magpie web 启动链接 http://127.0.0.1:3430/?k=…）
function onBaseUrlInput(event: Event) {
  const channel = bindChannel.value
  const state = bindState[channel]
  if (!state) return
  const raw = (event.target as HTMLInputElement).value
  state.input.baseUrl = raw
  if (channel !== 'magpie') return
  const split = splitMagpieLink(raw)
  if (!split) return
  state.input.baseUrl = split.gateway
  state.input.pageUrl = split.pageUrl
  state.input.pageKey = split.pageKey
  ;(event.target as HTMLInputElement).value = split.gateway
}

// Magpie：整条启动链接拆成「数据面地址 / 页面地址 / 页面 Key」
function splitMagpieLink(raw: string): { gateway: string; pageUrl: string; pageKey: string } | null {
  const text = raw.trim()
  const queryAt = text.indexOf('?')
  if (queryAt < 0) return null
  const base = text.slice(0, queryAt)
  let key = ''
  for (const piece of text.slice(queryAt + 1).split('&')) {
    const eq = piece.indexOf('=')
    if (eq > 0 && piece.slice(0, eq) === 'k') {
      try {
        key = decodeURIComponent(piece.slice(eq + 1))
      } catch {
        key = piece.slice(eq + 1)
      }
    }
  }
  if (!key) return null
  // 页面端口 3430 → 数据面 3425；其它端口视为同一个反代入口，原样保留
  const gateway = base.replace(/:3430(?=\/|$)/, ':3425')
  return { gateway, pageUrl: base, pageKey: key }
}

// Magpie 页面地址输入（管理面，可空）
function onPageUrlInput(event: Event) {
  const channel = bindChannel.value
  const state = bindState[channel]
  if (!state) return
  state.input.pageUrl = (event.target as HTMLInputElement).value
}

// Magpie 页面 Key 输入（管理面必需，只在管理上游 / 签到用）
function onPageKeyInput(event: Event) {
  const channel = bindChannel.value
  const state = bindState[channel]
  if (!state) return
  state.input.pageKey = (event.target as HTMLInputElement).value
}

// api-key 输入：直接写响应式状态（模板里用 $event 取 target，避免用未定义变量）
function onApiKeyInput(event: Event) {
  const channel = bindChannel.value
  const state = bindState[channel]
  if (!state) return
  state.input.apiKey = (event.target as HTMLInputElement).value
}

// 模型开关：从 $event 取 checked
function onModelToggle(model: string, event: Event) {
  const enabled = (event.target as HTMLInputElement).checked
  void toggleModel(activeChannel.value, model, enabled)
}

// 回调地址兜底输入：同样写响应式状态
function onCallbackUrlInput(event: Event) {
  const channel = bindChannel.value
  const state = bindState[channel]
  if (!state) return
  state.handle.callbackUrl = (event.target as HTMLInputElement).value
}

// ---------- 账号刷新 / 签到 / 改名 / 切主 / 删除 ----------
// 账号操作一律按 connectionId 精确寻址：label 可能被本次操作改掉（改名），
// 也可能历史重复；connectionId 是主键，能避免误改/误删同渠道的其他账号。
const accountRef = (conn: ChannelConnectionSummary) => ({
  connectionId: conn.connectionId,
  label: conn.label,
})

/** 到期文案：无 expiresAt 视为长期有效；已过期 / 不足一天按小时展示 */
function connExpireText(conn: ChannelConnectionSummary): string {
  const at = conn.expiresAt
  if (!at) return ''
  const diff = Number(at) - Date.now()
  if (!Number.isFinite(diff) || diff <= 0) return '已过期'
  const hours = Math.ceil(diff / 3_600_000)
  return hours < 24 ? `${hours} 小时后到期` : `${Math.ceil(diff / 86_400_000)} 天后到期`
}

async function refreshAccount(channel: string, conn: ChannelConnectionSummary) {
  const b = busyOf(channel)
  b.refresh = true
  try {
    const res = await channelApi.refresh(channel, accountRef(conn))
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

async function checkin(channel: string, conn: ChannelConnectionSummary) {
  const b = busyOf(channel)
  b.sign = true
  try {
    const res = await channelApi.checkin(channel, accountRef(conn))
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

/**
 * 自动签到：全局开关，不按渠道存。
 *
 * 后端 {@code ChannelCheckinTask} 读全局键 {@code enable_channel_checkin}
 * （默认开启），每天 00:30 后替所有支持签到的渠道签到一次。渠道页这里只是
 * 一个入口：进入带签到能力的渠道时读一次回显，改动走 {@code PUT /v2/settings/global}
 * 写全局层（仅管理员）。
 */
const autoCheckin = ref(true)
const autoCheckinLoading = ref(false)
const autoCheckinLoaded = ref(false)

/** 读全局自动签到开关：一次成功即不再重复请求 */
async function loadAutoCheckin() {
  if (autoCheckinLoaded.value || autoCheckinLoading.value) return
  autoCheckinLoading.value = true
  try {
    const data = await channelApi.globalSettings()
    const raw = (data as any)?.enable_channel_checkin
    // 没有存过就用后端默认值（开启），不要把「缺省」当成「关闭」
    autoCheckin.value = raw === undefined || raw === null || String(raw).trim() === ''
      ? true
      : !/^(false|0|off|no)$/i.test(String(raw).trim())
    autoCheckinLoaded.value = true
  } catch {
    // 读不到只影响开关回显，不影响后端签到；保持默认值，等下次进页再试
  } finally {
    autoCheckinLoading.value = false
  }
}

/** 改全局自动签到开关：失败回滚，避免界面显示与实际不符 */
async function toggleAutoCheckin(enabled: boolean) {
  const previous = autoCheckin.value
  autoCheckin.value = enabled
  autoCheckinLoading.value = true
  try {
    await channelApi.saveGlobalSettings({ enable_channel_checkin: enabled ? 'true' : 'false' })
    autoCheckinLoaded.value = true
    ElMessage.success(enabled ? '已开启自动签到' : '已关闭自动签到')
  } catch (e: any) {
    autoCheckin.value = previous
    ElMessage.error('自动签到开关保存失败：' + (e?.message ?? e))
  } finally {
    autoCheckinLoading.value = false
  }
}

// 只有切到「支持签到」的渠道才去读开关，其它渠道不产生多余请求
watch(
  () => activeSummary()?.supportsCheckin,
  (on) => {
    if (on) void loadAutoCheckin()
  },
)

/**
 * 改名：弹输入框，默认填当前名。
 *
 * 提交后只就地更新该账号的 label，不整表重载——用户正在看的渠道/模型开关状态
 * 不该因为改个名被重置。
 */
async function renameAccount(channel: string, conn: ChannelConnectionSummary) {
  let newLabel: string
  try {
    const { value } = await ElMessageBox.prompt('请输入新的账号名称', '改名', {
      inputValue: conn.label ?? '',
      inputPattern: /\S/,
      inputErrorMessage: '名称不能为空',
      confirmButtonText: '保存',
      cancelButtonText: '取消',
    })
    newLabel = String(value ?? '').trim()
  } catch {
    return
  }
  if (!newLabel || newLabel === conn.label) return
  try {
    const res = await channelApi.renameConnection(channel, {
      ...accountRef(conn),
      newLabel,
    })
    const out = (res as any)?.data ?? res
    conn.label = out?.label ?? newLabel
    ElMessage.success('账号已改名')
  } catch (e: any) {
    ElMessage.error('改名失败：' + (e?.message ?? e))
  }
}

/**
 * 设为主账号。
 *
 * 后端保证主账号唯一（先降级其余 default），所以本地也同步把同渠道其它账号
 * 的 primary 清掉，避免界面出现两个「主账号」徽章直到下次刷新。
 */
async function setPrimaryAccount(channel: string, conn: ChannelConnectionSummary) {
  if (conn.primary) return
  try {
    await channelApi.setPrimary(channel, accountRef(conn))
    const summary = channels.value.find((c) => c.channel === channel)
    for (const c of summary?.connections ?? []) {
      c.primary = c.connectionId === conn.connectionId
      c.role = c.primary ? 'default' : 'backup'
    }
    ElMessage.success(`已将「${conn.label ?? conn.connectionId}」设为主账号`)
  } catch (e: any) {
    ElMessage.error('设为主账号失败：' + (e?.message ?? e))
  }
}

async function deleteAccount(channel: string, conn: ChannelConnectionSummary) {
  const name = conn.label ?? conn.connectionId
  try {
    await ElMessageBox.confirm(`删除账号「${name}」？`, '确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    await channelApi.deleteConnection(channel, accountRef(conn))
    ElMessage.success('账号已删除')
    await loadChannels()
  } catch (e: any) {
    ElMessage.error('删除失败：' + (e?.message ?? e))
  }
}

/** 账号排序：后端不保证顺序，主账号置顶，其余按绑定时间升序 */
function sortedConnections(c?: ChannelSummary): ChannelConnectionSummary[] {
  const list = [...(c?.connections ?? [])]
  return list.sort((a, b) => {
    if (!!a.primary !== !!b.primary) return a.primary ? -1 : 1
    return (a.createdAt ?? 0) - (b.createdAt ?? 0)
  })
}

// ---------- 模型 ----------
async function pullModels(channel: string) {
  const b = busyOf(channel)
  b.models = true
  try {
    const summary = channels.value.find((c) => c.channel === channel)
    const conns = summary?.connections ?? []
    // 显式选主账号：不传寻址参数时后端取哪条取决于查询顺序，用户无从得知。
    const target = conns.find((x) => x.primary) ?? conns[0]
    const label = target?.label
    // 渠道绑了多个账号时，不传 label 会让后端取「第一个账号」，用户无从得知拉的是谁的模型。
    if (conns.length > 1) {
      ElMessage.info(`该渠道有 ${conns.length} 个账号，当前按「${label ?? '默认账号'}」拉取`)
    }
    const targetRef = target ? accountRef(target) : {}
    const res = await channelApi.listModels(channel, targetRef)
    const out = (res as any)?.data ?? res
    if (out?.models?.length) {
      ElMessage.success(`拉取到 ${out.models.length} 个模型，正在落库…`)
      // 落库走渠道专用端点（SPI listModels → sys_ai_provider_model），
      // 而非 /api/providers/{id}/models/import-all（该端点对 oauth 类 provider 会失败）。
      const impRes = await channelApi.importModels(channel, targetRef)
      const imp = (impRes as any)?.data ?? impRes
      if (imp?.ok) {
        ElMessage.success(`落库完成：新增 ${imp.created ?? 0}，更新 ${imp.updated ?? 0}`)
      }
      // 可能是 undefined：渠道列表刷新后，本次 `channel` 未必还在里面。
      // 这种情况下上面已经把模型落库了，只是没处写回面板态 —— 不回写不算错。
      if (summary) summary.models = out.models.map((m: any) => ({
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

// ---------- 模型批量快捷操作（全选 / 反选 / 全不选） ----------
//
// 逐个串行调 setModelEnabled（与单模型开关同一端点），避免并发请求被上游限流；
// 复用 busyFor(channel, 'models') 标志防止与「拉取模型」互抢。
async function batchSetModels(
  channel: string,
  target: (m: { model: string; enabled: boolean }) => boolean,
) {
  const summary = channels.value.find((c) => c.channel === channel)
  const models = summary?.models ?? []
  if (!models.length) {
    ElMessage.info('该渠道暂无模型，请先拉取模型')
    return
  }
  const b = busyOf(channel)
  if (b.models) return
  b.models = true
  let ok = 0
  let fail = 0
  try {
    for (const m of models) {
      const want = target(m)
      if (want === m.enabled) continue
      try {
        await channelApi.setModelEnabled(channel, m.model, want)
        m.enabled = want
        ok++
      } catch {
        fail++
      }
    }
  } finally {
    b.models = false
  }
  if (fail > 0) {
    ElMessage.error(`批量更新完成：成功 ${ok}，失败 ${fail}`)
  } else if (ok > 0) {
    ElMessage.success(`已更新 ${ok} 个模型的开关`)
  } else {
    ElMessage.info('模型开关已符合目标状态，无需变更')
  }
}

function selectAllModels() {
  void batchSetModels(activeChannel.value, () => true)
}

function deselectAllModels() {
  void batchSetModels(activeChannel.value, () => false)
}

function invertModels() {
  void batchSetModels(activeChannel.value, (m) => !m.enabled)
}

// ---------- 账号类型（kind / accountTypes）----------
// 渠道按「种类」与「支持的账号类型」两个正交维度描述：
//   kind = AI / SMS / EMAIL；accountTypes ⊂ { FIXED, TEMPORARY }。
// 历史响应缺省时按「AI + 仅固定账号」处理，保证向后兼容。
/** 渠道支持的账号类型（缺省仅固定账号） */
const accountTypesOf = (c?: ChannelSummary): string[] =>
  (c?.accountTypes ?? ['FIXED']).map((t) => String(t).toUpperCase())
/** 是否支持固定账号（长期绑定 / 授权） */
const supportsFixed = (c?: ChannelSummary): boolean => accountTypesOf(c).includes('FIXED')

/**
 * 渠道种类展示名。
 *
 * <p>渠道管理只有一种模型：渠道 + 账号。AI 账号渠道与免登录渠道在后台
 * 都提供 CHAT 能力（AI 走 AccountChannelAuthManager，免登录走 FreeChatClient），
 * 因此两者角标统一为 CHAT，不再单列「AI」种类。</p>
 */
const KIND_TEXT: Record<string, string> = {
  AI: 'CHAT',
  CHAT: 'CHAT',
  IMAGE: 'IMAGE',
  SMS: 'SMS',
  EMAIL: 'EMAIL',
}
const kindOf = (c?: ChannelSummary): string => String(c?.kind ?? 'AI').toUpperCase()
const kindText = (c?: ChannelSummary): string => KIND_TEXT[kindOf(c)] ?? kindOf(c)

// ---------- 渠道账号（/api/accounts，按 channelKey 归属） ----------
/*
 * 渠道管理只有一种模型：渠道 + 账号。
 * AI 账号渠道（AccountChannelAuthManager）与免登录渠道（FreeChatClient：
 * DuckDuckGo / Trae / Pollinations）都按同一套「账号」管理，不再给免登录渠道
 * 单独做对话 / 出图操作页。免登录渠道的密钥可留空或随意填。
 */
const accounts = ref<ChannelAccount[]>([])
const accountsLoading = ref(false)
const accountsError = ref('')

/** 拉取当前渠道下的账号 */
async function loadAccounts() {
  const channel = activeChannel.value
  if (!channel) {
    accounts.value = []
    return
  }
  accountsLoading.value = true
  accountsError.value = ''
  try {
    const rows = await channelApi.accounts(channel)
    // 切渠道期间返回的旧响应直接丢弃，避免串到新渠道下
    if (channel !== activeChannel.value) return
    accounts.value = Array.isArray(rows) ? rows : []
  } catch (e: any) {
    if (channel !== activeChannel.value) return
    accountsError.value = e?.message ?? String(e)
    accounts.value = []
  } finally {
    if (channel === activeChannel.value) accountsLoading.value = false
  }
}

/** 新增账号：走框架统一的 ReDialog 表单 */
const accountDialogVisible = ref(false)

function addAccount() {
  if (!activeChannel.value) return
  accountDialogVisible.value = true
}

/** 删除账号 */
async function removeAccount(account: ChannelAccount) {
  try {
    await ElMessageBox.confirm(
      `删除账号「${account.name || account.code || account.accountId}」？`,
      '删除账号',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  try {
    await channelApi.deleteAccount(account.accountId)
    ElMessage.success('账号已删除')
    await loadAccounts()
  } catch (e: any) {
    ElMessage.error('删除失败：' + (e?.message ?? e))
  }
}

watch(activeChannel, () => {
  void loadAccounts()
  resetDetailTabs()
}, { immediate: false })

/* ==================== 详情页签（ReTabs） ==================== */

/**
 * 详情页签：账号 / 模型 / 积分 / 任务。
 *
 * <p>「积分」「任务」只在渠道具备对应 SPI 能力时出现——否则点进去是一片
 * 「该渠道不支持」，等于把内部实现细节漏给用户。能力来自后端
 * {@code /api/channels} 的 {@code supportsCredit} / {@code supportsTask}。</p>
 */
const detailTab = ref<string>('accounts')

/** 可选页签（随选中渠道能力变化） */
const detailTabs = computed(() => {
  const summary = activeSummary()
  const tabs = [
    { name: 'accounts', label: '账号', icon: 'Connection' },
    { name: 'models', label: '模型', icon: 'DataAnalysis' },
  ]
  if (summary?.supportsCredit) {
    tabs.push({ name: 'credit', label: '积分', icon: 'Wallet' })
  }
  if (summary?.supportsTask) {
    tabs.push({ name: 'tasks', label: '任务', icon: 'Trophy' })
  }
  // 网关型渠道：上游 provider / 插件由网关自己维护，本页通过管理面做增删改查。
  // 能力来自后端 supportsUpstream / supportsPlugins，不再按渠道名硬编码。
  if (summary?.supportsUpstream) {
    tabs.push({ name: 'upstream', label: '上游', icon: 'Coin' })
  }
  if (summary?.supportsPlugins) {
    tabs.push({ name: 'plugins', label: '插件', icon: 'Box' })
  }
  return tabs
})

/** 切渠道时把页签复位到「账号」并清掉上一渠道的积分 / 任务缓存 */
function resetDetailTabs() {
  detailTab.value = 'accounts'
  creditState.value = {}
  taskState.value = {}
}

/** 积分 / 任务：按 connectionId 维度的加载与错误状态 */
const creditState = ref<Record<string, { loading?: boolean; error?: string; data?: any }>>({})
const taskState = ref<Record<string, { loading?: boolean; error?: string; rows?: any[] }>>({})

/**
 * 拉取某账号的积分快照。
 *
 * <p>刻意与「签到」分开：签到是动作（每天一次、有副作用），积分是读数。
 * 混在一起会让「看一眼余额」变成「顺手签到」。</p>
 *
 * @param conn 账号连接
 */
async function loadCredit(conn: ChannelConnectionSummary) {
  const key = conn.connectionId
  const state = (creditState.value[key] ??= {})
  state.loading = true
  state.error = ''
  try {
    const res = await channelApi.credit(activeChannel.value, accountRef(conn))
    const out = (res as any)?.data ?? res
    state.data = out?.credit ?? {}
    if (state.data?.error) {
      state.error = String(state.data.error)
    }
  } catch (e: any) {
    state.error = e?.message ?? String(e)
  } finally {
    state.loading = false
  }
}

/**
 * 拉取某账号的成长任务清单（只读）。
 *
 * @param conn 账号连接
 */
async function loadTasks(conn: ChannelConnectionSummary) {
  const key = conn.connectionId
  const state = (taskState.value[key] ??= {})
  state.loading = true
  state.error = ''
  try {
    const res = await channelApi.tasks(activeChannel.value, accountRef(conn))
    const out = (res as any)?.data ?? res
    state.rows = out?.tasks ?? []
    if (out?.ok === false && out?.message) {
      state.error = String(out.message)
    }
  } catch (e: any) {
    state.error = e?.message ?? String(e)
  } finally {
    state.loading = false
  }
}

/**
 * 领取单个任务奖励。
 *
 * @param conn 账号连接
 * @param task 任务行
 */
async function claimTask(conn: ChannelConnectionSummary, task: any) {
  const b = busyOf(activeChannel.value)
  b.sign = true
  try {
    const res = await channelApi.claimTask(activeChannel.value, {
      ...accountRef(conn),
      taskCode: String(task.code),
    })
    const out = (res as any)?.data ?? res
    const result = out?.result ?? {}
    if (result.claimed) {
      ElMessage.success(result.message ?? '奖励已领取')
    } else {
      ElMessage.info(result.message ?? '未产生新奖励')
    }
    await loadTasks(conn)
    await loadCredit(conn)
  } catch (e: any) {
    ElMessage.error('领取失败：' + (e?.message ?? e))
  } finally {
    b.sign = false
  }
}

/**
 * 一键做任务：报名未报名的 + 领取已达标的（幂等）。
 *
 * @param conn 账号连接
 */
async function runTasks(conn: ChannelConnectionSummary) {
  const b = busyOf(activeChannel.value)
  b.sign = true
  try {
    const res = await channelApi.runTasks(activeChannel.value, accountRef(conn))
    const out = (res as any)?.data ?? res
    const messages: string[] = out?.summary?.messages ?? []
    if (messages.length) {
      ElMessage.success(messages.join('；'))
    } else {
      ElMessage.info('当前没有可执行的任务')
    }
    await loadTasks(conn)
    await loadCredit(conn)
  } catch (e: any) {
    ElMessage.error('执行失败：' + (e?.message ?? e))
  } finally {
    b.sign = false
  }
}

/** 时间戳短格式（积分刷新时间 / 上次签到展示用） */
function shortTime(ts: number | string | null | undefined): string {
  const value = typeof ts === 'string' ? Date.parse(ts) : Number(ts ?? 0)
  if (!Number.isFinite(value) || value <= 0) return '—'
  const diff = Date.now() - value
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`
  return new Date(value).toLocaleDateString()
}

/** 单位文案：已知单位说人话，未知单位（percent / requests 等）原样透出 */
const creditUnitText = (unit?: string): string => {
  if (!unit) return ''
  if (unit === 'credit') return '积分'
  if (unit === 'token') return 'Token'
  if (unit === 'currency') return ''
  return unit
}

/** 积分展示文案：有单位就带单位，缺失剩余时显示「未知」而不是 0 */
const creditText = (credit: any): string => {
  if (!credit) return '—'
  const unit = credit.unit === 'currency' ? (credit.currency ?? '') : creditUnitText(credit.unit)
  const total = credit.total
  const remainMissing = credit.remain === undefined || credit.remain === null || credit.remain === ''
  // 上游只给了总量 / 只给了单位不一致的明细时，剩余就是「未知」，不能当 0 报给用户
  if (remainMissing) {
    return total === undefined || total === null || total === ''
      ? '额度未知'
      : `— / ${total}${unit ? ' ' + unit : ''}`
  }
  const remain = Number(credit.remain)
  const head = `${remain}${unit ? ' ' + unit : ''}`
  return total === undefined || total === null || total === '' ? head : `${head} / ${total}${unit ? ' ' + unit : ''}`
}

/** 明细行文案：上游给了 display 就照抄，避免把 1.2k 换算错 */
const creditPkgText = (pkg: any): string => {
  if (!pkg) return '—'
  if (pkg.display !== undefined && pkg.display !== null && pkg.display !== '') {
    return String(pkg.display)
  }
  const unit = creditUnitText(pkg.unit)
  const remain = pkg.remain
  const size = pkg.size
  const suffix = unit ? ' ' + unit : ''
  if (remain === undefined || remain === null) {
    return size === undefined || size === null ? (unit || '—') : `— / ${size}${suffix}`
  }
  return size === undefined || size === null ? `${remain}${suffix}` : `${remain}${suffix} / ${size}${suffix}`
}

/** 积分百分比（用于进度条；总量未知或为负时不显示） */
const creditPercent = (credit: any): number => {
  const total = Number(credit?.total ?? 0)
  const remain = Number(credit?.remain ?? 0)
  if (!total || total < 0) return 0
  return Math.max(0, Math.min(100, Math.round((remain / total) * 100)))
}

/** 任务进度百分比 */
const taskPercent = (task: any): number => {
  const target = Number(task?.target ?? 0)
  const current = Number(task?.current ?? 0)
  if (!target) return 0
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)))
}

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
</script>

<template>
  <div class="chm" data-page="channel">
    <!--
      不自带页头：本页既作 monitor 的独立路由，也被 AI 设置页内嵌，
      宿主已有自己的页头，重复一层只会白占高度（与账号资产页同一口径）。
      原先页头里的「刷新」下沉到左栏「渠道索引」标题行。
    -->

    <!-- 错误条 -->
    <div v-if="loadError" class="chm-alert is-danger">
      <span>渠道列表加载失败：{{ loadError }}</span>
      <button @click="loadChannels">重试</button>
    </div>

    <!-- 空态 -->
    <el-empty v-if="!loading && !channels.length" description="尚未注册任何渠道">
      <template #description>
        <p>尚未注册任何渠道</p>
        <p class="chm-empty__hint">
          渠道清单来自后端注册表：AI 账号渠道（AccountChannelAuthManager）与
          免登录对话 / 文生图渠道（ChatChannelProvider / ImageChannelProvider）。
        </p>
      </template>
    </el-empty>

    <!-- 方案 A · 运维甲板：左渠道索引 + 右选中详情 -->
    <div v-else class="chm-deck">
      <!-- 左：渠道索引（官方图标 / 品牌徽标 + 状态灯） -->
      <aside class="chm-rail">
        <div class="chm-rail__head">
          <span>渠道索引</span>
          <span class="chm-rail__head-right">
            <b>{{ channels.length }}</b>
            <button
              type="button"
              class="chm-rail__refresh"
              :class="{ 'is-busy': loading }"
              :disabled="loading"
              title="刷新渠道清单"
              aria-label="刷新渠道清单"
              @click="loadChannels"
            >
              <el-icon aria-hidden="true"><RefreshIcon /></el-icon>
            </button>
          </span>
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
          <span class="chm-rail__kind" :title="kindText(c)">{{ kindOf(c) }}</span>
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
              <span v-if="activeSummary()!.providerId">· provider {{ activeSummary()!.providerId }}</span>
              <span class="chm-panel__chip">{{ kindText(activeSummary()) }}</span>
              <span v-if="activeSummary()!.priority !== undefined" class="chm-panel__chip is-muted">
                优先级 {{ activeSummary()!.priority }}
              </span>
              <span class="chm-panel__chip" v-if="activeSummary()!.supportsImage">可出图</span>
              <span class="chm-panel__chip" v-if="activeSummary()!.supportsCheckin">可签到</span>
              <span class="chm-panel__chip is-credit" v-if="activeSummary()!.supportsCredit">积分</span>
              <span class="chm-panel__chip is-task" v-if="activeSummary()!.supportsTask">任务</span>
            </span>
          </div>
          <div class="chm-panel__state">
            <span class="chm-rail__dot" :class="'is-' + channelState(activeSummary())" />
            {{ channelStateText(activeSummary()) }}
          </div>
          <el-switch
            v-if="activeSummary()!.supportsCheckin || kindOf(activeSummary()) === 'AI'"
            :model-value="activeSummary()!.enabled"
            class="chm-panel__switch"
            @change="(v: boolean | string | number) => toggleChannelEnabled(activeChannel, !!v)"
          />
        </header>

        <!--
          详情页签：账号 / 模型 /（积分）/（任务）。

          「积分」「任务」只在渠道具备对应 SPI 能力时出现——渠道之间能力差异很大
          （Cline 只有余额、Raccoon 只有自动发放、Trae 两者都有），
          无条件显示会让人点进一片「该渠道不支持」。
        -->
        <ReTabs
          v-model="detailTab"
          :tabs="detailTabs"
          :closable="false"
          size="small"
          id="channel-detail"
          class="chm-panel__tabs"
        >
          <template #default="{ tab }">
            <!-- ════════ 账号 ════════ -->
            <div v-if="tab.name === 'accounts'" class="chm-panel__tabbody">
              <!--
                统一账号区：所有渠道同一种模型 —— 渠道 + 账号。
                AI 账号渠道与免登录渠道（DuckDuckGo / Trae / Pollinations）都在这里
                添加 / 删除账号，不再为免登录渠道提供单独的对话 / 出图操作页。
              -->
              <div class="chm-panel__block">
                <div class="chm-panel__sect-title">
                  <el-icon aria-hidden="true"><ConnectionIcon /></el-icon>
                  账号 <i>{{ accounts.length }}</i>
                  <ReButton
                    link
                    size="small"
                    :loading="accountsLoading"
                    @click.stop="loadAccounts()"
                  >刷新</ReButton>
                  <ReButton link size="small" type="primary" @click.stop="addAccount()">
                    ＋ 添加账号
                  </ReButton>
                </div>

                <p v-if="accountsError" class="chm-panel__error">账号加载失败：{{ accountsError }}</p>

                <div class="chm-accs">
                  <div v-for="acc in accounts" :key="acc.accountId" class="chm-acc">
                    <span class="chm-acc__label" :title="acc.name || acc.code">
                      {{ acc.name || acc.code || acc.accountId }}
                    </span>
                    <span class="chm-acc__state" :class="{ 'is-stale': acc.hasSecret === false }">
                      {{ acc.hasSecret ? '已配置凭据' : '无凭据' }}
                    </span>
                    <span v-if="acc.username" class="chm-acc__expire">{{ acc.username }}</span>
                    <div class="chm-acc__actions">
                      <ReButton link size="small" type="danger" @click.stop="removeAccount(acc)">删除</ReButton>
                    </div>
                  </div>
                  <div v-if="!accounts.length && !accountsLoading" class="chm-card__empty">
                    尚无账号，点「＋ 添加账号」创建
                  </div>
                </div>
              </div>

              <!--
                已绑定的登录态账号（AI 账号渠道的 OAuth / 设备码绑定）。
                与上面的统一账号是两条并存的凭据来源：统一账号供其它模块按
                accountId 引用，连接由渠道自己的授权流程产生。
              -->
              <div v-if="(activeSummary()!.connections ?? []).length" class="chm-panel__block">
                <div class="chm-panel__sect-title">
                  <el-icon aria-hidden="true"><ConnectionIcon /></el-icon>
                  已授权连接 <i>{{ (activeSummary()!.connections ?? []).length }}</i>
                  <!--
                    自动签到是全局开关（后端 ChannelCheckinTask 读
                    enable_channel_checkin），开关放这里是因为它只对本区块的
                    「签到」按钮有意义；写接口仅管理员可调，失败会回滚并提示。
                  -->
                  <span
                    v-if="activeSummary()!.supportsCheckin"
                    class="chm-auto"
                    title="全局开关：所有支持签到的渠道每天 00:30 后自动签到一次"
                  >
                    自动签到
                    <el-switch
                      size="small"
                      :model-value="autoCheckin"
                      :loading="autoCheckinLoading"
                      @change="(v: boolean | string | number) => toggleAutoCheckin(!!v)"
                    />
                  </span>
                </div>
                <div class="chm-accs">
                  <div
                    v-for="conn in sortedConnections(activeSummary())"
                    :key="conn.connectionId"
                    class="chm-acc"
                    :class="{ 'is-stale': connState(conn) !== 'valid', 'is-primary': conn.primary }"
                  >
                    <span class="chm-acc__label" :title="conn.label">{{ conn.label || '未命名' }}</span>
                    <span v-if="conn.primary" class="chm-acc__primary">主账号</span>
                    <span class="chm-acc__state" :class="'is-' + connState(conn)">
                      {{ connStateText(conn) }}
                    </span>
                    <!--
                      到期文案：connExpireText 缺 expiresAt 时返回空串，不占位。
                      「已过期」单独上危险色，与「N 天后到期」的警告色区分。
                    -->
                    <span
                      v-if="connExpireText(conn)"
                      class="chm-acc__expire"
                      :class="{ 'is-expired': connExpireText(conn) === '已过期' }"
                    >{{ connExpireText(conn) }}</span>
                    <!--
                      上次签到：签到摘要由各 SPI 写进连接凭据（checkin_at /
                      checkin_message），刷新页面仍在；hover 看上游返回的原话。
                    -->
                    <span
                      v-if="conn.checkinAt"
                      class="chm-acc__checkin"
                      :title="conn.checkinMessage || ''"
                    >签到 {{ shortTime(conn.checkinAt) }}</span>
                    <div class="chm-acc__actions">
                      <button class="chm-acc__btn"
                              @click.stop="renameAccount(activeChannel, conn)">改名</button>
                      <button v-if="!conn.primary" class="chm-acc__btn"
                              @click.stop="setPrimaryAccount(activeChannel, conn)">设为主账号</button>
                      <button v-if="activeSummary()!.supportsRefresh !== false"
                              class="chm-acc__btn" :disabled="busyFor(activeChannel, 'refresh')"
                              @click.stop="refreshAccount(activeChannel, conn)">刷新</button>
                      <button v-if="activeSummary()!.supportsCheckin" class="chm-acc__btn"
                              :disabled="busyFor(activeChannel, 'sign')"
                              @click.stop="checkin(activeChannel, conn)">签到</button>
                      <button class="chm-acc__btn is-danger"
                              @click.stop="deleteAccount(activeChannel, conn)">删除</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 绑定登录态账号（AI 账号渠道的授权流程） -->
              <div v-if="supportsFixed(activeSummary())" class="chm-panel__binds">
                <button
                  class="chm-panel__bindbtn"
                  type="button"
                  :disabled="busyFor(activeChannel, 'login')"
                  @click="openBindDialog(activeChannel)"
                >
                  <el-icon v-if="!busyFor(activeChannel, 'login')" class="chm-btn__icon" aria-hidden="true">
                    <PlusIcon />
                  </el-icon>
                  {{ busyFor(activeChannel, 'login') ? '登录中…' : '＋ 绑定登录态账号（点击弹出）' }}
                </button>
              </div>
            </div>

            <!-- ════════ 模型 ════════ -->
            <div v-else-if="tab.name === 'models'" class="chm-panel__tabbody">
              <div class="chm-panel__block">
                <div class="chm-panel__sect-title">
                  <el-icon aria-hidden="true"><DataAnalysisIcon /></el-icon>
                  模型 <i>{{ (activeSummary()!.models ?? []).length }}</i>
                  <button class="chm-panel__pull" :disabled="busyFor(activeChannel, 'models')"
                          @click.stop="pullModels(activeChannel)">
                    {{ busyFor(activeChannel, 'models') ? '拉取中…' : '拉取模型' }}
                  </button>
                </div>
                <!-- 批量快捷操作：全选 / 反选 / 全不选 -->
                <div v-if="(activeSummary()!.models ?? []).length" class="chm-models__ops">
                  <span class="chm-models__ops-title">批量：</span>
                  <button type="button" class="chm-panel__pull" :disabled="busyFor(activeChannel, 'models')"
                          @click.stop="selectAllModels()">全选</button>
                  <button type="button" class="chm-panel__pull" :disabled="busyFor(activeChannel, 'models')"
                          @click.stop="invertModels()">反选</button>
                  <button type="button" class="chm-panel__pull" :disabled="busyFor(activeChannel, 'models')"
                          @click.stop="deselectAllModels()">全不选</button>
                </div>
                <div class="chm-models">
                  <label
                    v-for="m in activeSummary()!.models ?? []"
                    :key="m.model"
                    class="chm-model"
                    :class="{ 'is-off': !m.enabled }"
                  >
                    <input type="checkbox" :checked="m.enabled"
                           @change="onModelToggle(m.model, $event)" />
                    <span class="chm-model__name" :title="m.model">{{ m.model }}</span>
                    <span v-if="m.contextWindow" class="chm-model__ctx">{{ m.contextWindow }}</span>
                  </label>
                  <div v-if="!(activeSummary()!.models ?? []).length" class="chm-card__empty">
                    该渠道暂无已启用模型
                  </div>
                </div>
              </div>
            </div>

            <!-- ════════ 积分 ════════ -->
            <div v-else-if="tab.name === 'credit'" class="chm-panel__tabbody">
              <div v-if="!(activeSummary()!.connections ?? []).length" class="chm-card__empty">
                先绑定账号，才能查询积分
              </div>
              <div
                v-for="conn in sortedConnections(activeSummary())"
                v-else
                :key="'credit-' + conn.connectionId"
                class="chm-credit"
              >
                <div class="chm-credit__head">
                  <span class="chm-credit__label">{{ conn.label || '未命名' }}</span>
                  <span v-if="conn.primary" class="chm-acc__primary">主账号</span>
                  <button
                    class="chm-panel__pull"
                    type="button"
                    :disabled="creditState[conn.connectionId]?.loading"
                    @click.stop="loadCredit(conn)"
                  >{{ creditState[conn.connectionId]?.loading ? '查询中…' : '查询积分' }}</button>
                </div>
                <p v-if="creditState[conn.connectionId]?.error" class="chm-panel__error">
                  {{ creditState[conn.connectionId]!.error }}
                </p>
                <div v-else-if="creditState[conn.connectionId]?.data" class="chm-credit__body">
                  <div class="chm-credit__value">
                    {{ creditText(creditState[conn.connectionId]!.data) }}
                  </div>
                  <div
                    v-if="creditPercent(creditState[conn.connectionId]!.data) > 0"
                    class="chm-credit__bar"
                    role="progressbar"
                    :aria-valuenow="creditPercent(creditState[conn.connectionId]!.data)"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  >
                    <i :style="{ width: creditPercent(creditState[conn.connectionId]!.data) + '%' }" />
                  </div>
                  <div class="chm-credit__meta">
                    <span v-if="creditState[conn.connectionId]!.data.plan">
                      套餐 {{ creditState[conn.connectionId]!.data.plan }}
                    </span>
                    <span v-if="creditState[conn.connectionId]!.data.exceeded" class="is-warn">额度已用尽</span>
                    <span v-if="creditState[conn.connectionId]!.data.updatedAt">
                      更新于 {{ shortTime(creditState[conn.connectionId]!.data.updatedAt) }}
                    </span>
                  </div>
                  <ul
                    v-if="(creditState[conn.connectionId]!.data.packages ?? []).length"
                    class="chm-credit__pkgs"
                  >
                    <li
                      v-for="(pkg, idx) in creditState[conn.connectionId]!.data.packages"
                      :key="'pkg-' + idx"
                    >
                      <span class="chm-credit__pkgname">{{ pkg.name || '额度包' }}</span>
                      <span class="chm-credit__pkgval">{{ creditPkgText(pkg) }}</span>
                    </li>
                  </ul>
                  <p v-if="creditState[conn.connectionId]!.data.warning" class="chm-credit__warn">
                    {{ creditState[conn.connectionId]!.data.warning }}
                  </p>
                </div>
                <div v-else class="chm-card__empty">尚未查询</div>
              </div>
            </div>

            <!-- ════════ 任务 ════════ -->
            <div v-else-if="tab.name === 'tasks'" class="chm-panel__tabbody">
              <div v-if="!(activeSummary()!.connections ?? []).length" class="chm-card__empty">
                先绑定账号，才能查看成长任务
              </div>
              <div
                v-for="conn in sortedConnections(activeSummary())"
                v-else
                :key="'task-' + conn.connectionId"
                class="chm-tasks"
              >
                <div class="chm-tasks__head">
                  <span class="chm-credit__label">{{ conn.label || '未命名' }}</span>
                  <button
                    class="chm-panel__pull"
                    type="button"
                    :disabled="taskState[conn.connectionId]?.loading"
                    @click.stop="loadTasks(conn)"
                  >{{ taskState[conn.connectionId]?.loading ? '加载中…' : '刷新任务' }}</button>
                  <button
                    class="chm-panel__pull is-primary"
                    type="button"
                    :disabled="busyFor(activeChannel, 'sign')"
                    @click.stop="runTasks(conn)"
                  >一键做任务</button>
                </div>
                <p v-if="taskState[conn.connectionId]?.error" class="chm-panel__error">
                  {{ taskState[conn.connectionId]!.error }}
                </p>
                <ul v-if="(taskState[conn.connectionId]?.rows ?? []).length" class="chm-tasks__list">
                  <li
                    v-for="task in taskState[conn.connectionId]!.rows"
                    :key="task.code"
                    class="chm-task"
                    :class="{ 'is-done': task.claimed }"
                  >
                    <div class="chm-task__main">
                      <span class="chm-task__title">{{ task.title || task.code }}</span>
                      <span v-if="task.description" class="chm-task__desc">{{ task.description }}</span>
                    </div>
                    <div v-if="Number(task.target ?? 0) > 0" class="chm-task__progress">
                      <div class="chm-credit__bar">
                        <i :style="{ width: taskPercent(task) + '%' }" />
                      </div>
                      <span class="chm-task__count">{{ task.current ?? 0 }} / {{ task.target }}</span>
                    </div>
                    <div class="chm-task__ops">
                      <span v-if="task.claimed" class="chm-task__badge is-done">已领取</span>
                      <span v-else-if="task.credit" class="chm-task__badge">+{{ task.credit }}</span>
                      <button
                        class="chm-panel__pull"
                        type="button"
                        :disabled="!task.claimable || busyFor(activeChannel, 'sign')"
                        @click.stop="claimTask(conn, task)"
                      >{{ task.claimable ? '领取' : '未达标' }}</button>
                    </div>
                  </li>
                </ul>
                <div v-else-if="!taskState[conn.connectionId]?.loading" class="chm-card__empty">
                  暂无任务（或尚未加载）
                </div>
              </div>
            </div>

            <!-- ════════ 上游（网关型渠道） ════════ -->
            <div v-else-if="tab.name === 'upstream'" class="chm-panel__tabbody">
              <MagpieProviderPanel
                :channel="activeChannel"
                :connections="activeSummary()!.connections ?? []"
                :signin-enabled="activeSummary()?.supportsSignin ?? false"
                @changed="loadChannels()"
              />
            </div>

            <!-- ════════ 插件（网关型渠道） ════════ -->
            <div v-else-if="tab.name === 'plugins'" class="chm-panel__tabbody">
              <MagpiePluginPanel
                :channel="activeChannel"
                :connections="activeSummary()!.connections ?? []"
                @changed="loadChannels()"
              />
            </div>
          </template>
        </ReTabs>
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
          <!-- 秒表时钟（Console 仪表） -->
          <span v-if="bindPhase !== 'error'" class="chm-bind__clock">
            <span class="chm-bind__clock-label">已等待</span>
            <b class="chm-bind__clock-value">{{ bindElapsed }}s</b>
          </span>
        </div>
      </template>

      <div class="chm-bind">
        <!-- 状态带 -->
        <div class="chm-bind__status" :class="{ 'is-error': bindPhase === 'error' }">
          <span class="chm-bind__dot" :class="{ 'is-error': bindPhase === 'error' }" />
          <span class="chm-bind__status-text">
            <span v-if="bindPhase === 'starting'">正在创建登录会话…</span>
            <span v-else-if="bindPhase === 'error'">失败：{{ bindError }}</span>
            <span v-else-if="isKeylessBind()">免鉴权渠道，正在自动完成绑定（无需填写凭据）</span>
            <span v-else-if="isApiKeyBind()">请填写 API key 后提交</span>
            <span v-else-if="isQrBind()">请用微信扫码授权</span>
            <span v-else-if="callbackAuto(bindChannel)">已打开授权页，完成后会自动绑定（无需回到本页）</span>
            <span v-else>已打开授权页，请在那里完成登录</span>
          </span>
          <span class="chm-bind__meter" :class="{ 'is-error': bindPhase === 'error' }">
            <i :class="{ 'is-error': bindPhase === 'error' }" />
          </span>
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

          <!-- (4) API key（OpenCode / Magpie 网关凭据） -->
          <div v-if="isApiKeyBind()" class="chm-bind__form">
            <div v-if="bindChannel === 'magpie'" class="chm-bind__row">
              <input
                :value="bindState[bindChannel]?.input?.baseUrl ?? ''"
                @input="onBaseUrlInput($event)"
                class="chm-input"
                placeholder="网关地址，如 http://127.0.0.1:3425（也可整条粘贴 magpie web 的链接）"
              />
            </div>
            <div v-if="bindChannel === 'magpie'" class="chm-bind__row">
              <input
                :value="bindState[bindChannel]?.input?.pageUrl ?? ''"
                @input="onPageUrlInput($event)"
                class="chm-input"
                placeholder="页面地址，如 http://127.0.0.1:3430（缺省按网关地址推导）"
              />
            </div>
            <div v-if="bindChannel === 'magpie'" class="chm-bind__row">
              <input
                :value="bindState[bindChannel]?.input?.pageKey ?? ''"
                @input="onPageKeyInput($event)"
                class="chm-input"
                placeholder="页面 Key（启动链接里的 k=…，管理上游与签到用）"
              />
            </div>
            <div class="chm-bind__row">
              <input
                :value="bindState[bindChannel]?.input?.apiKey ?? ''"
                @input="onApiKeyInput($event)"
                class="chm-input"
                :placeholder="bindChannel === 'magpie'
                  ? '网关 key（本机未开启鉴权可留空）'
                  : 'Zen API key（匿名通道填 public）'"
              />
              <button class="chm-btn chm-btn--primary" type="button" @click="submitBindInput()">提交</button>
            </div>
            <span v-if="bindChannel === 'magpie'" class="chm-bind__code-hint">
              网关地址用于对话 / 模型 / 配额；页面地址与页面 Key 只用于上游管理与签到
              （桌面版需在 magpie 设置里打开「浏览器访问」）。
            </span>
          </div>

          <!-- (5) 本地回调不可用时的兜底：允许手工粘贴回调地址 -->
          <div v-if="bindState[bindChannel]?.handle?.callbackListening === false" class="chm-bind__form">
            <div class="chm-bind__hint">检测到本地回调端口不可用，授权后请把浏览器地址栏的回调地址粘到下面：</div>
            <div class="chm-bind__row">
              <input
                :value="bindState[bindChannel]?.handle?.callbackUrl ?? ''"
                @input="onCallbackUrlInput($event)"
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

    <!-- 添加渠道账号：与 Cookie 池 / AppKey 同款 ReDialog 表单 -->
    <ChannelAccountDialog
      v-model="accountDialogVisible"
      :channel-key="activeChannel"
      :channel-name="activeSummary()?.displayName"
      @saved="loadAccounts()"
    />
  </div>
</template>

<style scoped>
.chm {
  display: flex;
  flex-direction: column;
  gap: 16px;
  /* 撑满宿主：monitor 路由宿主给确定高度（与账号资产页同款 height:100%+min-height:0）；
     AI 设置页把它放进 ScrollContainer（内容滚动、contentElement 高度 auto），
     height:100% 会退化成内容高度，不破坏原有滚动语义。box-sizing 让 padding 不溢出 100%。 */
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  /* 页头已移除，顶部不再需要留白 */
  padding: 0 0 8px;
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
  /* 左右两栏紧邻：原来是 14px 的缝，视觉上像两块割裂的卡片 */
  gap: 8px;
  align-items: stretch;
  /* 吃掉 .chm 除页头外的全部剩余高度：左右两栏等高，右栏内部自己滚动 */
  flex: 1;
  min-height: 0;
}

/* ---- 左：渠道索引 ---- */
.chm-rail {
  flex: none;
  /* 216 → 188：渠道名够放，把省下的宽度让给右侧详情 */
  width: 188px;
  border: 1px solid var(--border-default, #e2e9f3);
  border-radius: 12px;
  background: var(--bg-container, #fff);
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  /* 高度由 .chm-deck 的 stretch 决定（撑满），内部自己滚；不再写死 100vh-220px 的视口上限 */
  min-height: 0;
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
.chm-rail__head-right {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.chm-rail__head b {
  color: var(--text-tertiary, #94a3b8);
  font-variant-numeric: tabular-nums;
}
/* 刷新：原先在页头，页头移除后落到索引标题行，保持一键重取 */
.chm-rail__refresh {
  display: inline-grid;
  place-items: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--text-tertiary, #94a3b8);
  cursor: pointer;
  transition: color .15s ease, background-color .15s ease;
}
.chm-rail__refresh:hover:not(:disabled) {
  color: var(--el-color-primary, #409eff);
  background: var(--bg-hover, #f1f5fb);
}
.chm-rail__refresh:disabled {
  cursor: default;
  opacity: .6;
}
.chm-rail__refresh.is-busy :deep(svg) {
  animation: chm-spin 1s linear infinite;
}
@keyframes chm-spin {
  to { transform: rotate(360deg); }
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
/* 渠道种类角标（AI / SMS / EMAIL） */
.chm-rail__kind {
  flex: none;
  font-size: 10px;
  line-height: 1;
  padding: 2px 5px;
  border-radius: 4px;
  color: var(--text-secondary, #64748b);
  background: var(--fill-quaternary, #f1f5f9);
  letter-spacing: 0.04em;
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
  min-height: 0;
  border: 1px solid var(--border-default, #e2e9f3);
  border-radius: 12px;
  background: var(--bg-container, #fff);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  /* 详情区吃满高度，内容超出时面板内部滚动，表头/KPI 不随整页滚动丢失 */
  overflow-y: auto;
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
/* 能力标签：积分（琥珀）/ 任务（靛蓝），与「可签到」的绿色区分开 */
.chm-panel__chip.is-credit {
  background: color-mix(in srgb, var(--el-color-warning, #e6a23c) 16%, transparent);
  color: var(--el-color-warning, #b88230);
}
.chm-panel__chip.is-task {
  background: color-mix(in srgb, var(--el-color-primary, #409eff) 16%, transparent);
  color: var(--el-color-primary, #337ecc);
}

/* ===== 详情页签（ReTabs 容器） ===== */
.chm-panel__tabs {
  flex: 1 1 auto;
  min-height: 0;
}
.chm-panel__tabbody {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  overflow-y: auto;
  padding-top: 10px;
}

/* ===== 积分 ===== */
.chm-credit,
.chm-tasks {
  border: 1px solid var(--border-subtle, #eef2f8);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.chm-credit__head,
.chm-tasks__head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.chm-credit__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #1e293b);
}
.chm-credit__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.chm-credit__value {
  font-size: 20px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary, #1e293b);
}
.chm-credit__bar {
  position: relative;
  height: 6px;
  border-radius: 3px;
  background: var(--el-fill-color, #f0f2f5);
  overflow: hidden;
}
.chm-credit__bar i {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: var(--el-color-primary, #409eff);
  transition: width 0.25s ease;
}
.chm-credit__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 11px;
  color: var(--text-secondary, #64748b);
}
.chm-credit__meta .is-warn {
  color: var(--el-color-danger, #f56c6c);
}
.chm-credit__pkgs {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.chm-credit__pkgs li {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
  color: var(--text-secondary, #475569);
}
.chm-credit__pkgval {
  font-variant-numeric: tabular-nums;
}
.chm-credit__warn {
  margin: 0;
  font-size: 11px;
  line-height: 1.6;
  color: var(--el-color-warning, #e6a23c);
}

/* ===== 任务 ===== */
.chm-tasks__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.chm-task {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 10px;
  border-radius: 8px;
  background: var(--el-fill-color-lighter, #fafbfc);
}
.chm-task.is-done {
  opacity: 0.62;
}
.chm-task__main {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.chm-task__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #1e293b);
}
.chm-task__desc {
  font-size: 11px;
  color: var(--text-secondary, #64748b);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.chm-task__progress {
  display: flex;
  flex: none;
  align-items: center;
  gap: 6px;
  width: 120px;
}
.chm-task__progress .chm-credit__bar {
  flex: 1 1 auto;
}
.chm-task__count {
  flex: none;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary, #64748b);
}
.chm-task__ops {
  display: flex;
  flex: none;
  align-items: center;
  gap: 6px;
}
.chm-task__badge {
  padding: 1px 6px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  background: color-mix(in srgb, var(--el-color-primary, #409eff) 14%, transparent);
  color: var(--el-color-primary, #337ecc);
}
.chm-task__badge.is-done {
  background: color-mix(in srgb, var(--el-color-success, #67c23a) 14%, transparent);
  color: var(--el-color-success, #529b2e);
}
.chm-panel__pull.is-primary {
  color: var(--el-color-primary, #409eff);
  border-color: color-mix(in srgb, var(--el-color-primary, #409eff) 40%, transparent);
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
/* 自动签到：全局开关，右对齐到标题行末尾（与「刷新 / 添加」按钮同侧） */
.chm-auto {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  color: var(--text-tertiary, #94a3b8);
  cursor: help;
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
.chm-models__ops {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.chm-models__ops-title {
  font-size: 12px;
  color: var(--text-tertiary, #94a3b8);
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
/* 主账号行：左侧品牌色描边，一眼能看出缺 label 的接口落在谁身上 */
.chm-acc.is-primary {
  border-color: color-mix(in srgb, var(--brand-500, #3b82f6) 45%, transparent);
  background: color-mix(in srgb, var(--brand-500, #3b82f6) 4%, var(--bg-container, #fff));
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
/* 统一账号区：加载失败提示 */
.chm-panel__error {
  margin: 0;
  font-size: 12px;
  color: var(--el-color-danger, #f56c6c);
}
.chm-acc__state.is-unknown {
  background: color-mix(in srgb, var(--el-text-color-secondary, #909399) 14%, transparent);
  color: var(--el-text-color-secondary, #909399);
}
/* 主账号徽章：与状态徽章同尺寸，但用品牌色区分「身份」而非「健康度」 */
.chm-acc__primary {
  flex-shrink: 0;
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .2px;
  background: color-mix(in srgb, var(--brand-500, #3b82f6) 12%, transparent);
  color: var(--brand-600, #2563eb);
}
/* 到期文案：接近到期用警告色，已过期用危险色 */
.chm-acc__expire {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--el-color-warning, #e6a23c);
  white-space: nowrap;
}
.chm-acc__expire.is-expired {
  color: var(--el-color-danger, #f56c6c);
  font-weight: 600;
}
/* 上次签到：中性色，只作「做过」的痕迹，不与到期告警抢注意力 */
.chm-acc__checkin {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--text-tertiary, #94a3b8);
  white-space: nowrap;
  cursor: help;
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
/* 新增入口容器（当前只有固定账号绑定） */
.chm-panel__binds {
  display: flex;
  flex-direction: column;
  gap: 8px;
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
/* 状态文字：可截断（仪表行） */
.chm-bind__status-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* 仪表进度条：等待时蓝色滑动，错误时红色满格 */
.chm-bind__meter {
  flex: none;
  width: 72px;
  height: 4px;
  border-radius: 999px;
  background: var(--border-subtle, #eef2f8);
  overflow: hidden;
}
.chm-bind__meter i {
  display: block;
  height: 100%;
  width: 40%;
  border-radius: 999px;
  background: var(--brand-500, #3b82f6);
  animation: chm-meter 1.6s ease-in-out infinite;
}
.chm-bind__meter.is-error i {
  background: var(--el-color-danger, #f56c6c);
  animation: none;
  width: 100%;
}
@keyframes chm-meter {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(260%); }
}
/* 秒表时钟（Console 仪表） */
.chm-bind__clock {
  flex: none;
  display: inline-flex;
  align-items: baseline;
  gap: 5px;
  margin-left: auto;
  padding: 3px 9px;
  border: 1px solid var(--border-subtle, #eef2f8);
  border-radius: 6px;
  background: var(--bg-elevated, #f8fafc);
}
.chm-bind__clock-label {
  font-size: 11px;
  color: var(--text-tertiary, #94a3b8);
}
.chm-bind__clock-value {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 16px;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary, #0f172a);
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
