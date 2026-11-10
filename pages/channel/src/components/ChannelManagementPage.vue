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

import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { isAdmin } from '@repo/core'
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
  Setting as SettingIcon,
  Picture as PictureIcon,
} from '@element-plus/icons-vue'
import { channelApi } from '../channelApi'
import type {
  ChannelSummary,
  ChannelConnectionSummary,
  ChannelAccount,
  MagpieProvider,
  MagpieQuota,
} from '../channelApi'
import ReButton from '@repo/ui/re-button'
import ReTabs from '@repo/ui/re-tabs'
import ChannelAccountDialog from './ChannelAccountDialog.vue'
import MagpieAccountBindDialog from './MagpieAccountBindDialog.vue'
import MagpieGatewaySettingsDialog from './MagpieGatewaySettingsDialog.vue'
import MagpieProviderPanel from './MagpieProviderPanel.vue'
import MagpiePluginPanel from './MagpiePluginPanel.vue'
import { MAGPIE_OWNED_VENDORS, magpieOwnedOf, type MagpieOwnedVendor } from '../magpieOwnership'
import {
  MAGPIE_PLUGIN_CHANNELS,
  magpiePluginOfProviders,
  magpiePluginOfSpec,
  type MagpiePluginChannel,
} from '../magpiePlugins'

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
// 这三个图标来自 Magpie 自带的品牌图（/icons/…），和网关里的上游列表同源，
// 渠道页与网关页才不会同一家出现两种标记。
import qoderIcon from '../assets/channel-icons/qoder.svg'
import workbuddyIcon from '../assets/channel-icons/workbuddy.svg'
import magpieIcon from '../assets/channel-icons/magpie.svg'

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
  qoder: { icon: qoderIcon, color: '#4F6BFF', glyph: 'Q', method: '设备码' },
  'qoder-cn': { icon: qoderIcon, color: '#F59E0B', glyph: 'Q', method: '设备码' }, // 国内变体用琥珀金区分
  trae: { icon: traeIcon, color: '#0F766E', glyph: 'T', method: '浏览器授权' },
  gemini: { icon: geminiIcon, color: '#8E75B2', glyph: 'G', method: '浏览器授权' },
  minimax: { icon: minimaxIcon, color: '#F5701A', glyph: 'M', method: '设备码' },
  zcode: { icon: zcodeIcon, color: '#0C5CFF', glyph: 'Z', method: '浏览器授权' },
  raccoon: { color: '#0FA47F', glyph: 'R', method: '扫码' },
  loomy: { color: '#2B7DE9', glyph: 'L', method: '微信扫码' },
  lobsterai: { icon: lobsteraiIcon, color: '#F03D64', glyph: 'L', method: '浏览器授权' },
  opencode: { icon: opencodeIcon, color: '#111827', glyph: 'O', method: 'API Key' },
  workbuddy: { icon: workbuddyIcon, color: '#5A4FF3', glyph: 'W', method: '浏览器授权' },
  // Magpie 统一网关：本机 / Docker 常驻，凭据是「网关地址 + 网关 key」
  magpie: { icon: magpieIcon, color: '#0EA5A4', glyph: 'M', method: 'API Key' },
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

/**
 * 插件渠道的品牌外观：先按它的第一个 provider 复用渠道品牌（cline / trae / zcode
 * 这些已有官方图标），没有就按名字散列一个稳定色 + 首字。
 *
 * <p>散列而不是「全部用 Magpie 青」：44 行插件同色圆点会分不出谁是谁；按名字散列
 * 保证同一插件每次刷新颜色一致。</p>
 */
const PLUGIN_BRAND_COLORS = [
  '#4F6BFF', '#0FA47F', '#F59E0B', '#F03D64',
  '#8E75B2', '#0C5CFF', '#DE5833', '#7C3AED',
]
function pluginBrand(plugin: MagpiePluginChannel): ChannelBrand {
  const known = plugin.providers.map((id) => CHANNEL_BRANDS[id]).find(Boolean)
  if (known) return known
  const seed = [...plugin.name].reduce((n, ch) => n + (ch.codePointAt(0) ?? 0), 0)
  return {
    color: PLUGIN_BRAND_COLORS[seed % PLUGIN_BRAND_COLORS.length],
    glyph: plugin.name.slice(0, 1).toUpperCase(),
    method: '插件',
  }
}

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

/**
 * 当前用户是否管理员。
 *
 * <p>账号是每个用户自己的（与渠道页「按 userId 隔离」一致），新增入口对所有登录用户开放；
 * 网关上游 / 插件的管理入口才是运维动作，只对管理员显示。角色是登录后异步写入的，
 * setup 时读一次可能还是空角色，onMounted 再确认一次。</p>
 */
const isAdminUser = ref(isAdmin())

// 渠道卡片内的状态：是否正在签到 / 正在拉模型 / 正在刷新
const busy = ref<Record<string, { sign?: boolean; models?: boolean; refresh?: boolean; login?: boolean }>>({})

/**
 * 渠道级忙碌标记。
 *
 * <p>⚠️ 必须返回响应式代理，不能写成 {@code busy.value[channel] ??= {}}：赋值表达式的
 * 值是<b>右侧原始对象</b>，后续直接改它不会触发依赖收集，按钮的「刷新中…」永远不出现。</p>
 *
 * @param channel 渠道标识
 * @returns 该渠道的忙碌标记（已是 reactive 代理）
 */
const busyOf = (channel: string) => {
  if (!busy.value[channel]) busy.value[channel] = {}
  return busy.value[channel]
}

const activeSummary = () => channels.value.find((c) => c.channel === activeChannel.value)

// ---------- 方案 A：运维甲板（OPS·DECK）派生状态 ----------
// 渠道级健康状态：按该渠道绑定的账号状态汇总出「在线 / 待刷新 / 未绑定」。
const channelState = (c?: ChannelSummary): 'online' | 'stale' | 'none' => {
  // ChatClient 免登录渠道（对话 / 文生图）没有连接行：只要 SPI 已注册即可用
  const kind = String(c?.kind ?? '').toUpperCase()
  if (kind === 'CHAT' || kind === 'IMAGE') return 'online'
  const conns = c?.connections ?? []
  // 网关托管：凭据在 magpie 里，本地没有连接行，但渠道本身是可用的
  if (!conns.length) return c && hostedProviderOf(c.channel) ? 'online' : 'none'
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
    // 免登录对话 / 文生图渠道的模型由客户端内置，启用状态存在
    // sys_ai_provider_model（与 AI 渠道同一套行）。这里把用户保存过的
    // enabled / alias / 价格合并回内置清单；读不到就保留默认值，不阻塞页面。
    await Promise.allSettled(
      [...chatRows, ...imageRows]
        .filter((c) => (c.models ?? []).length)
        .map(async (c) => {
          try {
            const cfg = await channelApi.modelConfig(c.channel)
            const rows = (cfg as any)?.models ?? []
            if (Array.isArray(rows) && rows.length && c.models) {
              const saved = new Map(rows.map((r: any) => [String(r.model), r]))
              for (const m of c.models) {
                const hit = saved.get(m.model)
                if (!hit) continue
                m.enabled = hit.enabled !== false
                if (hit.alias) m.alias = hit.alias
                if (hit.contextWindow) m.contextWindow = hit.contextWindow
                if (hit.free !== undefined) m.free = hit.free
                if (hit.rate !== undefined) m.rate = hit.rate
                if (hit.priceInput !== undefined) m.priceInput = hit.priceInput
                if (hit.priceOutput !== undefined) m.priceOutput = hit.priceOutput
              }
            }
          } catch { /* 单渠道配置读取失败不拖垮整页 */ }
        }),
    )
    // 当前选中失效时落到第一个业务渠道；网关允许被选中，但它不在左栏列表里。
    if (!activeChannel.value || !channels.value.some((c) => c.channel === activeChannel.value)) {
      activeChannel.value = businessChannels.value[0]?.channel ?? channels.value[0]?.channel ?? ''
    }
    // 左栏状态灯与「点进去落到上游还是插件」要看网关现状：只读拉一次，
    // 管理面不可用时按「未接入」处理，点开仍有预设 / 插件两条路。
    void loadGatewayIndex()
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

/** 弹窗头部展示的渠道名（缺省回落到渠道标识） */
const bindChannelLabel = computed(
  () => channels.value.find((c) => c.channel === bindChannel.value)?.displayName
    || bindChannel.value
    || '渠道',
)

/**
 * 一句话状态：告诉用户「现在该做什么 / 正在等什么」。
 *
 * <p>不用「创建登录会话」「仪表」这类实现词；失败时也只给原因和下一步。</p>
 */
const bindStatusText = computed(() => {
  if (bindPhase.value === 'starting') return '正在准备登录…'
  if (bindPhase.value === 'error') return bindError.value || '绑定没有成功，请重试'
  if (isKeylessBind()) return '这个渠道无需登录，正在自动完成绑定'
  if (isApiKeyBind()) return '填入密钥后点「完成绑定」'
  if (isQrBind()) return '等待扫码授权…'
  if (callbackAuto(bindChannel.value)) return '等待你在授权页完成登录，完成后会自动绑定'
  return '等待你在授权页完成登录…'
})

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

/** 兼容原生 input（Event）与 el-input（直接给字符串）两种输入源 */
function inputText(source: Event | string): string {
  if (typeof source === 'string') return source
  return String((source.target as HTMLInputElement)?.value ?? '')
}

// Magpie 网关地址输入（远程 / Docker 部署时填非本机地址；
// 也允许整条粘贴 magpie web 启动链接 http://127.0.0.1:3430/?k=…）
function onBaseUrlInput(event: Event | string) {
  const channel = bindChannel.value
  const state = bindState[channel]
  if (!state) return
  const raw = inputText(event)
  state.input.baseUrl = raw
  if (channel !== 'magpie') return
  const split = splitMagpieLink(raw)
  if (!split) return
  state.input.baseUrl = split.gateway
  state.input.pageUrl = split.pageUrl
  state.input.pageKey = split.pageKey
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
function onPageUrlInput(event: Event | string) {
  const channel = bindChannel.value
  const state = bindState[channel]
  if (!state) return
  state.input.pageUrl = inputText(event)
}

// Magpie 页面 Key 输入（管理面必需，只在管理上游 / 签到用）
function onPageKeyInput(event: Event | string) {
  const channel = bindChannel.value
  const state = bindState[channel]
  if (!state) return
  state.input.pageKey = inputText(event)
}

// api-key 输入：直接写响应式状态（模板里用 $event 取 target，避免用未定义变量）
function onApiKeyInput(event: Event | string) {
  const channel = bindChannel.value
  const state = bindState[channel]
  if (!state) return
  state.input.apiKey = inputText(event)
}

// 模型开关：勾选只改本地草稿，点「保存」才落库（见 saveModelSelection）

// 回调地址兜底输入：同样写响应式状态
function onCallbackUrlInput(event: Event | string) {
  const channel = bindChannel.value
  const state = bindState[channel]
  if (!state) return
  state.handle.callbackUrl = inputText(event)
}

// ---------- 账号刷新 / 签到 / 改名 / 切主 / 删除 ----------
// 账号操作一律按 connectionId 精确寻址：label 可能被本次操作改掉（改名），
// 也可能历史重复；connectionId 是主键，能避免误改/误删同渠道的其他账号。
const accountRef = (conn: ChannelConnectionSummary) =>
  // 网关托管行是前端合成的，本地没有这条连接记录：不带 connectionId，
  // 后端才会走「本地无连接 → 借网关凭据」的回落。带上假 id 只会 404。
  // 同一上游多个账号时用 account 指定网关里的账号，否则是这一家上游的合计。
  conn.hosted
    ? (conn.account ? { account: conn.account } : {})
    : { connectionId: conn.connectionId, label: conn.label }

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
    // 业务失败信封（success/ok=false）在 200/500 两种状态里都可能出现，统一当错误处理
    if (out?.ok === false || out?.success === false) {
      throw new Error(String(out?.error ?? out?.message ?? out?.msg ?? '刷新失败'))
    }
    // SPI refresh() 可能返回同一份凭据（渠道没有可刷新字段、或上游未下发新 token），
    // 此时若仍提示「凭据已刷新」，用户会以为刷新成功但过期时间没变是 bug。
    if (out?.refreshed === false) {
      ElMessage.info(out?.message ?? '凭据仍有效，无需刷新')
    } else {
      ElMessage.success('凭据已刷新')
    }
  } catch (e: any) {
    const message = String(e?.message ?? e ?? '').trim() || '请求失败'
    /*
     * 「key 不可续期」属于渠道能力边界，不是服务故障：
     * 用 warning 直说原因，不拼「刷新失败」，也不让别人以为重试就能好。
     */
    if (/不可续期|不支持刷新|未实现|NOT_IMPLEMENTED/i.test(message)) {
      ElMessage.warning(message)
    } else {
      ElMessage.error('刷新失败：' + message)
    }
  } finally {
    b.refresh = false
  }
}

/**
 * 把签到结果整理成一句可读文案。
 *
 * <p>签到结果的 Map 里既有 {@code checkin_message} 这类人话摘要，也有
 * {@code base_url} / {@code page_key} / {@code gateway_key} 等内部键；
 * 直接 {@code JSON.stringify} 打印会给用户看一屏 JSON，还可能把页面 Key 泄露到界面上。</p>
 *
 * @param result  后端回传的签到结果（已剔除凭据敏感键）
 * @param fallback 结果里没有可读文案时的兜底
 * @returns 建议直接展示的一句话
 */
function checkinSummary(result: Record<string, any>, fallback?: string): string {
  const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
  let base = text(result?.checkin_message) || text(result?.message) || text(result?.msg)
  if (!base) {
    const nickname = text(result?.nickname)
    base = nickname ? `${nickname} 签到完成` : ''
  }
  base = base || text(fallback) || '签到完成'
  // WorkBuddy 类渠道会带回积分变化，附在摘要后面比单独一个数字更有意义
  const credits = result?.credits
  const total = result?.credits_total
  if (credits !== undefined && credits !== null && credits !== '') {
    const suffix = total !== undefined && total !== null && total !== '' ? `${credits}/${total}` : String(credits)
    return `${base}（积分 ${suffix}）`
  }
  return base
}

async function checkin(channel: string, conn: ChannelConnectionSummary) {
  const b = busyOf(channel)
  b.sign = true
  try {
    const res = await channelApi.checkin(channel, accountRef(conn))
    const out = (res as any)?.data ?? res
    if (out?.ok === false) {
      ElMessage.warning(String(out?.message ?? '签到未完成'))
      return
    }
    const result = out?.result && typeof out.result === 'object' ? out.result : {}
    const summary = checkinSummary(result, out?.message)
    if (summary === '签到完成' && !out?.result) {
      ElMessage.info(summary)
    } else {
      ElMessage.success(summary)
    }
    // 签到会改变额度，签完立即重读，避免进度条停在签到前的旧数字
    if (activeSummary()?.supportsCredit) void loadCredit(conn)
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
    // 用页面展示的账号行定位：网关托管时本地没有连接，按本地 connections 取会得到
    // 空数组、把「按哪个账号拉」说成默认账号。托管行的 accountRef 不带假 id。
    const conns = displayConnections(summary)
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
        ElMessage.success(`落库完成：新增 ${imp.created ?? 0}，更新 ${imp.updated ?? 0}（新模型默认不启用）`)
      }
      // 以数据库为准重建模型清单：拉取只负责同步目录，启用哪些由用户在页面上
      // 勾选保存。以前这里直接把本次拉到的清单写成 enabled=true，等于替用户
      // 把所有新模型全开，用户还得逐个关掉。
      await loadChannels()
      syncModelDraft(channel)
    } else {
      ElMessage.info('未返回模型')
    }
  } catch (e: any) {
    // 后端的 NOT_FOUND 文案已经是面向用户的（「还没有绑定账号…」），原样透出；
    // 其余异常才补一句兜底，避免把英文 / 堆栈甩给用户。
    const msg = String(e?.message ?? '').trim()
    ElMessage.error(msg || '这次没有拉到模型，请稍后再试')
  } finally {
    b.models = false
  }
}

// ---------- 模型选择（本地草稿 + 一次保存） ----------
//
// 勾选 / 全选 / 反选 / 全不选都只改本地草稿，不发请求；点「保存」才把有变化的
// 模型一次性提交。此前「全选」会逐个模型串行 PUT（82 个模型 = 82 次往返），
// 用户看到的「只是保存渠道和模型关系却这么慢」就来自这里。

/** 模型选择草稿：channel -> model -> enabled；只在前端暂存 */
const modelDraft = ref<Record<string, Record<string, boolean>>>({})
/** 保存中（与「拉取模型」分开，工具条文案才不会串成「拉取中…」） */
const modelSaving = ref(false)

/** 按渠道现有模型重建草稿（拉取模型成功、切换渠道时调用） */
function syncModelDraft(channel = activeChannel.value) {
  const models = channels.value.find((c) => c.channel === channel)?.models ?? []
  const next: Record<string, boolean> = {}
  for (const m of models) next[m.model] = m.enabled !== false
  modelDraft.value[channel] = next
}

/** 模型当前是否被选中：以草稿为准，草稿没有则回落到已保存状态 */
const modelEnabled = (m: { model: string; enabled?: boolean }): boolean => {
  const draft = modelDraft.value[activeChannel.value]
  return draft && m.model in draft ? (draft[m.model] as boolean) : m.enabled !== false
}

/** 有变化的模型（点「保存」时提交这些） */
const modelChanges = computed<Array<{ model: string; enabled: boolean }>>(() => {
  const models = activeSummary()?.models ?? []
  const draft = modelDraft.value[activeChannel.value] ?? {}
  const changes: Array<{ model: string; enabled: boolean }> = []
  for (const m of models) {
    const want = m.model in draft ? (draft[m.model] as boolean) : m.enabled !== false
    if (want !== (m.enabled !== false)) changes.push({ model: m.model, enabled: want })
  }
  return changes
})

/** 已选模型数（工具条展示「已选 N / M」） */
const modelSelectedCount = computed(
  () => (activeSummary()?.models ?? []).filter((m) => modelEnabled(m)).length,
)

/** 数字去掉多余小数位（0.15 / 1 / 12.5） */
function compactNumber(value: number): string {
  if (!Number.isFinite(value)) return ''
  return String(Number(value.toFixed(4)))
}

/**
 * 模型单价文案：{@code $输入 / $输出}（USD / 百万 token）。
 *
 * <p>渠道摘要里的价格来自模型行 metrics（上游 / 指标库），没有就是没有：
 * 缺值返回空串，模板据此不显示价格标签，不会把「未知」写成 $0。</p>
 *
 * @param m 渠道摘要里的模型项
 * @returns 展示文案（可为空串）
 */
function modelPriceText(m: any): string {
  const parts: string[] = []
  if (m?.priceInput !== undefined && m?.priceInput !== null) {
    parts.push('$' + compactNumber(Number(m.priceInput)))
  }
  if (m?.priceOutput !== undefined && m?.priceOutput !== null) {
    parts.push('$' + compactNumber(Number(m.priceOutput)))
  }
  return parts.length ? `${parts.join(' / ')}/M` : ''
}

/** 价格标签的悬浮说明：写清单位，避免把「每百万 token」当成每次调用 */
function modelPriceTitle(m: any): string {
  const text = modelPriceText(m)
  return text ? `每百万 token 价格（USD，输入 / 输出）：${text}` : ''
}

/**
 * 模型是否免费。
 *
 * <p>两个来源：指标库明确标注（输入输出价格都是 0，或上游写了 free），
 * 以及上游模型 ID 的免费命名约定 —— Kilo / OpenCode 之类的聚合源用
 * {@code :free}、{@code -free}、{@code /free} 后缀标识免费档。只看 ID
 * 里的独立片段，避免把 {@code freedom} 这类词误判成免费。</p>
 *
 * @param m 渠道摘要里的模型项
 */
function modelIsFree(m: any): boolean {
  if (m?.free === true) return true
  const id = String(m?.model ?? '')
  return /(^|[/:_-])free($|[/:_-])/i.test(id)
}

/** 点胶囊：直接切换选中态（不落库） */
function toggleModelChip(m: { model: string; enabled?: boolean }) {
  if (!modelsManageable(activeSummary())) return
  if (!modelDraft.value[activeChannel.value]) syncModelDraft()
  const draft = modelDraft.value[activeChannel.value]
  const current = m.model in draft ? (draft[m.model] as boolean) : m.enabled !== false
  draft[m.model] = !current
}

/**
 * 批量改草稿：全选 / 全不选 / 反选 / 全选免费都不发请求。
 *
 * <p>「全选免费」只把明确免费的模型打开，付费模型的勾选状态保持不变：
 * 用户点它是想一键用上免费额度，不是想顺手关掉已经买过的模型。</p>
 *
 * @param target 目标动作
 */
function setAllModelDraft(target: 'all' | 'none' | 'invert' | 'free') {
  const models = activeSummary()?.models ?? []
  if (!models.length) {
    ElMessage.info('该渠道暂无模型，请先拉取模型')
    return
  }
  if (target === 'free' && !models.some((m) => modelIsFree(m))) {
    ElMessage.info('该渠道没有标记为免费的模型')
    return
  }
  if (!modelDraft.value[activeChannel.value]) syncModelDraft()
  const draft = modelDraft.value[activeChannel.value]
  for (const m of models) {
    const current = m.model in draft ? (draft[m.model] as boolean) : m.enabled !== false
    if (target === 'free') {
      if (modelIsFree(m)) draft[m.model] = true
      continue
    }
    draft[m.model] = target === 'all' ? true : target === 'none' ? false : !current
  }
}

/** 丢弃草稿，回到后台已保存状态 */
function resetModelDraft() {
  syncModelDraft()
}

/** 保存：只提交有变化的模型，一次请求 */
async function saveModelSelection() {
  const changes = modelChanges.value
  if (!changes.length) {
    ElMessage.info('没有需要保存的改动')
    return
  }
  const b = busyOf(activeChannel.value)
  if (b.models) return
  modelSaving.value = true
  const channel = activeChannel.value
  try {
    const res = await channelApi.setModelsEnabled(channel, changes)
    const out = (res as any)?.data ?? res
    if (out?.ok === false) {
      throw new Error(String(out?.message ?? '保存失败'))
    }
    const summary = channels.value.find((c) => c.channel === channel)
    for (const change of changes) {
      const m = summary?.models?.find((x) => x.model === change.model)
      if (m) m.enabled = change.enabled
    }
    syncModelDraft(channel)
    ElMessage.success(`已保存 ${changes.length} 个模型的启用状态`)
  } catch (e: any) {
    ElMessage.error('保存失败：' + (e?.message ?? e))
  } finally {
    modelSaving.value = false
  }
}

// ---------- 文生图渠道：试出图 ----------
// DuckDuckGo / Trae 这类渠道没有「模型清单」可配置（内置一个默认出图实现），
// 只给一张空列表，用户看到的就是「啥也没有」。这里给一块最小可用的试出图面板：
// 提示词 → 生成 → 结果留在页面上，让渠道本身可被验证。

/** 试出图的提示词 */
const imagePrompt = ref('')
/** 出图比例（渠道支持的档位不多，给固定的几个） */
const imageRatio = ref('1:1')
/** 需要登录态的渠道（Trae）临时填的令牌，只随本次请求发送 */
const imageToken = ref('')
/** 出图请求进行中 */
const imageBusy = ref(false)
/** 最近一次出图的结果 */
const imageResults = ref<Array<{ url: string; thumbUrl?: string }>>([])
/** 出图失败原因（渠道上游的错误原样展示） */
const imageError = ref('')
/** 选中的出图模型；渠道没有模型清单时为空 */
const imageModel = ref('')

/** 当前渠道是不是文生图渠道 */
const isImageChannel = computed(() => kindOf(activeSummary()) === 'IMAGE')

/** 出图可选模型：渠道摘要里的模型清单，可能为空 */
const imageModelOptions = computed(() => activeSummary()?.models ?? [])

/**
 * 换渠道时清掉上一渠道的出图输入与结果。
 *
 * <p>出图结果 URL 往往带时效签名，跨渠道混在一起既会误导，也会让用户以为
 * 上一张图是当前渠道出的。</p>
 */
function resetImageTest(): void {
  imagePrompt.value = ''
  imageRatio.value = '1:1'
  imageToken.value = ''
  imageResults.value = []
  imageError.value = ''
  imageBusy.value = false
  imageModel.value = ''
}

/**
 * 按提示词出一张图。
 *
 * <p>失败时保留用户已写的提示词，只把上游给的原因显示出来（如 DuckDuckGo 的
 * 出图限额、Trae 的登录态失效），不做「生成成功」的假提示。</p>
 */
async function runImageTest(): Promise<void> {
  const prompt = imagePrompt.value.trim()
  if (!prompt || imageBusy.value) return
  const channel = activeChannel.value
  if (!channel) return
  imageBusy.value = true
  imageError.value = ''
  imageResults.value = []
  try {
    const res = await channelApi.generateImage(channel, {
      prompt,
      ratio: imageRatio.value,
      n: 1,
      ...(imageModel.value ? { model: imageModel.value } : {}),
      ...(imageToken.value.trim() ? { token: imageToken.value.trim() } : {}),
    })
    const out = (res as any)?.data ?? res
    const images = (out?.images ?? []) as Array<{ url?: string; thumbUrl?: string }>
    const rows = images
      .filter((x) => !!x?.url)
      .map((x) => ({ url: String(x.url), thumbUrl: x.thumbUrl ? String(x.thumbUrl) : undefined }))
    imageResults.value = rows
    if (!rows.length) imageError.value = '上游没有返回图片地址，请换个提示词再试'
  } catch (e: any) {
    imageError.value = e?.message ?? String(e)
  } finally {
    imageBusy.value = false
  }
}


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
/**
 * 是否有「渠道 + 账号」这一层。
 *
 * <p>免登录对话 / 文生图渠道（kind=CHAT/IMAGE）由 SPI 直接提供，没有账号表；
 * 网关型渠道（supportsUpstream）的账号在 magpie 里。只有普通 AI 账号渠道才有
 * 统一账号接口，别的渠道去请求只会拿到「未注册的渠道: image-duckduckgo」。</p>
 */
const accountsSupported = (c?: ChannelSummary): boolean =>
  kindOf(c) === 'AI' && !c?.supportsUpstream

/**
 * 模型清单是否可逐项配置（勾选 + 保存启用状态）。
 *
 * <p>AI 账号渠道与免登录对话 / 文生图渠道都有模型清单，都需要能配置；三者的
 * 启用状态都落在 {@code sys_ai_provider_model}（后端按渠道标识惰性建 provider 行），
 * 保存走同一个 {@code PUT /models/enabled}。短信 / 邮件渠道没有模型，自然不显示。</p>
 *
 * @param c 渠道摘要
 * @returns true 表示可勾选、可保存
 */
const modelsManageable = (c?: ChannelSummary): boolean => (c?.models ?? []).length > 0

/**
 * 模型能否从上游拉取。
 *
 * <p>只有 AI 账号渠道才有 provider 行与授权账号，{@code /list-models} 才有上游可问。
 * 免登录渠道的模型是客户端内置表，拉取只会拿到「未注册的渠道」，因此不显示拉取按钮。</p>
 *
 * @param c 渠道摘要
 * @returns true 表示可拉取
 */
const modelsPullable = (c?: ChannelSummary): boolean => kindOf(c) === 'AI'

/**
 * 模型展示顺序：已启用的排前面，其余保持后台 sortOrder 原序。
 *
 * <p>草稿会实时改变启用状态，所以排序按 {@link modelEnabled} 计算，勾选后
 * 卡片会立刻上移；取消勾选则回落到未启用组。</p>
 */
const sortedModels = computed(() => {
  const models = [...(activeSummary()?.models ?? [])]
  return models
    .map((m, index) => ({ m, index }))
    .sort((a, b) => {
      const ea = modelEnabled(a.m) ? 0 : 1
      const eb = modelEnabled(b.m) ? 0 : 1
      return ea !== eb ? ea - eb : a.index - b.index
    })
    .map((item) => item.m)
})

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
  /*
   * 网关型渠道（magpie）的账号由网关托管；免登录对话 / 文生图渠道没有账号表。
   * 这两类都直接跳过请求，避免拉出一片空列表或「未注册的渠道」。
   */
  if (!accountsSupported(activeSummary())) {
    accounts.value = []
    accountsLoading.value = false
    accountsError.value = ''
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

/* ==================== 网关托管账号行 ==================== */

/** 网关里的上游实例（展示名 / 状态灯 / 托管账号行都用它） */
const gatewayProviderRows = ref<MagpieProvider[]>([])
/** 上游 provider id，与 {@link gatewayProviderRows} 同源，方便按 id 判断 */
const gatewayProviders = ref<string[]>([])
/** 已安装的 magpie 插件规格 */
const gatewayPlugins = ref<string[]>([])
/**
 * 网关管理面的额度卡（含 {@code provider} + {@code user}）。
 *
 * <p>它是「网关里这一家上游登录了哪几个账号」的唯一可靠来源：上游 provider 行只有
 * {@code pluginAccounts} 计数，没有账号名。拿不到额度卡时托管行退回「一条上游一行」。</p>
 */
const gatewayQuotaCards = ref<MagpieQuota[]>([])

/** 前端合成的网关托管行所用的连接 id（后端不存在这条记录） */
const GATEWAY_CONNECTION_ID = '__gateway__'

/** 渠道在网关里命中的上游实例；没有返回 undefined */
function hostedProviderOf(channel: string): MagpieProvider | undefined {
  const vendor = magpieOwnedOf(channel)
  if (!vendor || !vendor.providers.length) return undefined
  return gatewayProviderRows.value.find((p) =>
    vendor.providers.includes(String(p?.id ?? '')),
  )
}

/**
 * 某渠道在网关里命中的全部上游实例。
 *
 * <p>一个业务渠道可能对应多个上游（如 Trae 国内/国际两个实例），这里全部取回，
 * 账号行按「上游 + 账号」展开；命中不到时返回空数组。</p>
 *
 * @param channel 业务渠道标识
 * @returns 网关上游实例列表
 */
function hostedProvidersOf(channel: string): MagpieProvider[] {
  const vendor = magpieOwnedOf(channel)
  if (!vendor || !vendor.providers.length) return []
  return gatewayProviderRows.value.filter((p) =>
    vendor.providers.includes(String(p?.id ?? '')),
  )
}

/**
 * 某个上游实例下已登录的账号（按额度卡的 {@code user} 去重，顺序即网关返回顺序）。
 *
 * @param provider 网关上游实例
 * @returns 账号名；没有账号明细时返回空数组
 */
function hostedAccountsOf(provider: MagpieProvider): string[] {
  const providerId = String(provider?.id ?? '')
  if (!providerId) return []
  const users: string[] = []
  for (const quota of gatewayQuotaCards.value) {
    if (String(quota?.provider ?? '') !== providerId) continue
    const user = String(quota?.user ?? '').trim()
    if (!user || users.includes(user)) continue
    users.push(user)
  }
  return users
}

/**
 * 合成一条网关托管账号行。
 *
 * @param channel  业务渠道标识
 * @param provider 网关上游实例
 * @param user     上游账号（空表示只按上游展示，不含账号明细）
 * @param primary  是否主行（只影响排序与高亮，不代表网关里的主账号）
 * @returns 展示用连接行
 */
function hostedRow(
  channel: string,
  provider: MagpieProvider,
  user: string,
  primary: boolean,
): ChannelConnectionSummary {
  const providerId = String(provider?.id ?? '')
  return {
    connectionId: user
      ? `${GATEWAY_CONNECTION_ID}:${providerId}:${user}`
      : `${GATEWAY_CONNECTION_ID}:${providerId}`,
    label: user || providerLabel(provider),
    account: user || undefined,
    provider: providerId,
    primary,
    status: 'valid',
    hasCredentials: true,
    hosted: true,
    channel,
  }
}

/**
 * 详情页要展示的账号行。
 *
 * <p><b>网关优先</b>：只要网关里已经有这个渠道的上游，就以网关为准，
 * 本地旧连接不再展示也不参与请求（数据仍在库里）。此前是「本地连接优先」，
 * 结果是过期连接把请求挡回原生实现——直连 minimax 余额 404、缺 access_token
 * 这类报错都来自那条路径。本地没有对应上游时才展示本地连接。</p>
 *
 * <p>同一上游在网关里可能登录多个账号：额度卡带 {@code user} 时一行一账号，
 * 每行按账号查自己的余额；拿不到账号明细时仍只展示一条上游行。</p>
 *
 * @param c 渠道摘要
 * @returns 真实连接，或若干条虚拟的托管行
 */
function displayConnections(c?: ChannelSummary): ChannelConnectionSummary[] {
  const local = sortedConnections(c)
  if (!c || c.supportsUpstream) return local
  const providers = hostedProvidersOf(c.channel)
  if (!providers.length) return local
  const rows: ChannelConnectionSummary[] = []
  for (const provider of providers) {
    const users = hostedAccountsOf(provider)
    if (!users.length) {
      rows.push(hostedRow(c.channel, provider, '', rows.length === 0))
      continue
    }
    for (const user of users) {
      rows.push(hostedRow(c.channel, provider, user, rows.length === 0))
    }
  }
  return rows
}

/**
 * 本地连接数（含被网关接管的旧连接）。
 *
 * @param c 渠道摘要
 * @returns 本地连接条数
 */
function localConnectionCount(c?: ChannelSummary): number {
  return (c?.connections ?? []).length
}

/**
 * 当前渠道是否由网关托管（展示出来的行全是网关托管行）。
 *
 * <p>网关优先：即使本地还留着旧连接，只要网关里有这个渠道的上游，就按托管处理。
 * magpie 只提供签到，没有成长任务接口，所以这类渠道不显示「任务」页签：
 * 显示出来只会是一个点开就报错的入口。</p>
 *
 * @param c 渠道摘要
 * @returns 有托管行且全部是托管行时 true
 */
function hostedOnly(c?: ChannelSummary): boolean {
  const list = displayConnections(c)
  return list.length > 0 && list.every((conn) => !!conn.hosted)
}

/* ==================== 详情页签（ReTabs） ==================== */

/**
 * 详情页签：账号 / 模型 / 积分 / 任务。
 *
 * <p>「积分」「任务」只在渠道具备对应 SPI 能力时出现——否则点进去是一片
 * 「该渠道不支持」，等于把内部实现细节漏给用户。能力来自后端
 * {@code /api/channels} 的 {@code supportsCredit} / {@code supportsTask}。</p>
 */
const detailTab = ref<string>('accounts')

/**
 * 切到「账号」页签时顺带拉一下它的积分读数（进度条 + 额度）：
 * 数据存在监听的 `creditState` 里，与「积分」页签共享同一份状态。
 *
 * @param _ 组合属性（detailTab），仅当切到账号页签时触发
 */
watch(detailTab, (_tab) => {
  if (_tab === 'accounts') {
    const list = displayConnections(activeSummary())
    if (!list.length || !activeSummary()?.supportsCredit) return
    void Promise.all(list.map((conn) => loadCredit(conn)))
  }
})

/**
 * 连接列表变化时自动拉一次积分。
 *
 * <p>此前只在「点账号页签」时触发：切渠道时 detailTab 若本来就是 accounts，
 * watch 不会重新触发，于是积分块永远停在「尚未查询」——看起来就是积分不显示。
 * 这里改为按 connectionId 集合变化触发，切换渠道、绑定新账号都会刷新。</p>
 */
watch(
  () => displayConnections(activeSummary()).map((conn) => conn.connectionId).join('|'),
  () => {
    const summary = activeSummary()
    if (!summary?.supportsCredit) return
    const list = displayConnections(summary)
    if (!list.length) return
    void Promise.all(list.map((conn) => loadCredit(conn)))
  },
  { immediate: true },
)

/** 渠道 / 模型清单变化时重建模型选择草稿 */
watch(
  () => [activeChannel.value, (activeSummary()?.models ?? []).length] as const,
  () => syncModelDraft(),
  { immediate: true },
)

// ---------- Magpie 托管收敛（左栏） ----------

/** 网关型渠道：能力位驱动，不按渠道名硬编码 */
const gatewayChannel = computed(() => channels.value.find((c) => c.supportsUpstream))

/**
 * 已经可以整体交给 Magpie 的渠道。
 *
 * <p>两个条件缺一不可：</p>
 * <ol>
 *   <li>名单里有一个网关型渠道（能力位 {@code supportsUpstream}），它是收纳方；</li>
 *   <li>网关自己至少绑定了一个连接——没绑连接时跳过去只会看到「未绑定」；</li>
 *   <li>被收纳的渠道在 {@link MAGPIE_OWNED_VENDORS} 名单里。</li>
 * </ol>
 *
 * <p>网关优先：渠道即使还留着本地旧连接也算托管，旧连接不参与展示与请求，
 * 但数据保留在库里。</p>
 */
const managedChannels = computed(() => {
  const gateway = gatewayChannel.value
  if (!gateway || !(gateway.connections ?? []).length) return []
  return channels.value.filter((c) =>
    MAGPIE_OWNED_VENDORS.some((v) => v.channel === c.channel),
  )
})

/** 「Magpie 插件」分组是否展开（默认收起：44 个社区插件） */
const pluginOpen = ref(false)

/** 插件分组过滤词：44 行不靠滚动找，输入名字 / provider / 说明都能命中 */
const pluginFilter = ref('')

/** 托管子项：渠道摘要 + 归属条目（顺序跟随 MAGPIE_OWNED_VENDORS） */
interface ManagedEntry {
  channel: ChannelSummary
  vendor: MagpieOwnedVendor
}

const managedEntries = computed<ManagedEntry[]>(() => {
  const rows = new Map(managedChannels.value.map((c) => [c.channel, c]))
  return MAGPIE_OWNED_VENDORS.map((vendor) => ({ vendor, channel: rows.get(vendor.channel) }))
    .filter((x): x is ManagedEntry => !!x.channel)
})

/** 上游行的展示名：magpie 的 name 优先，没有就退回 provider id */
function providerLabel(provider: MagpieProvider): string {
  const name = String(provider?.name ?? '').trim()
  return name || String(provider?.id ?? '')
}

async function loadGatewayIndex(): Promise<void> {
  const gateway = gatewayChannel.value
  const conn = gateway?.connections?.find((c) => c.primary) ?? gateway?.connections?.[0]
  if (!gateway || !conn?.connectionId) {
    gatewayProviders.value = []
    gatewayProviderRows.value = []
    gatewayPlugins.value = []
    gatewayQuotaCards.value = []
    return
  }
  const ref = { connectionId: conn.connectionId }
  const [prov, plug, quota] = await Promise.allSettled([
    channelApi.magpieProviders(gateway.channel, ref),
    channelApi.magpiePlugins(gateway.channel, ref),
    // 额度卡用来把「一家上游」展开成「一个账号一行」；管理面没开 / 页面 Key 失效时
    // 读不到，托管行退回一条上游行，页面不受影响。
    channelApi.magpieQuotas(gateway.channel, ref),
  ])
  if (prov.status === 'fulfilled') {
    const out = (prov.value as any)?.data ?? prov.value
    const list = out?.providers ?? out?.result?.providers ?? []
    const rows = (Array.isArray(list) ? list : []).filter(
      (p: any) => p && typeof p === 'object',
    ) as MagpieProvider[]
    gatewayProviderRows.value = rows
    gatewayProviders.value = rows
      .map((p: any) => String(p?.id ?? ''))
      .filter(Boolean)
  }
  if (quota.status === 'fulfilled') {
    const out = (quota.value as any)?.data ?? quota.value
    const list = out?.result?.quotas ?? out?.quotas ?? []
    gatewayQuotaCards.value = Array.isArray(list) ? (list as MagpieQuota[]) : []
  } else {
    gatewayQuotaCards.value = []
  }
  if (plug.status === 'fulfilled') {
    const out = (plug.value as any)?.data ?? plug.value
    const state = out?.result ?? out
    gatewayPlugins.value = (state?.plugins ?? [])
      .map((p: any) => String(p?.spec ?? ''))
      .filter(Boolean)
  }
}

/** 网关里已经有这条渠道的上游时返回命中的 provider id */
function liveProvider(ids: string[]): string {
  return ids.find((id) => gatewayProviders.value.includes(id)) ?? ''
}

/** 插件是否已安装（规格可能带 {@code @版本} 后缀） */
function pluginInstalled(spec?: string): boolean {
  if (!spec) return false
  return gatewayPlugins.value.some((x) => x === spec || x.startsWith(spec + '@'))
}

/** 托管子项状态灯：网关已接上（有上游或插件已装）→ 绿，否则灰 */
function managedState(entry: ManagedEntry): 'online' | 'none' {
  return liveProvider(entry.vendor.providers) || pluginInstalled(entry.vendor.plugin)
    ? 'online'
    : 'none'
}

/** 插件渠道状态灯：已装或有上游 → 绿 */
function pluginState(plugin: MagpiePluginChannel): 'online' | 'none' {
  return liveProvider(plugin.providers) || pluginInstalled(plugin.spec) ? 'online' : 'none'
}

/** 过滤后的插件渠道（名称 / provider / 说明都可搜） */
const pluginRows = computed<MagpiePluginChannel[]>(() => {
  const q = pluginFilter.value.trim().toLowerCase()
  if (!q) return MAGPIE_PLUGIN_CHANNELS
  return MAGPIE_PLUGIN_CHANNELS.filter((p) =>
    `${p.name} ${p.providers.join(' ')} ${p.summary}`.toLowerCase().includes(q),
  )
})

/** 从托管分组点进去的渠道 id（不是网关 id） */
const focusChannel = ref('')

/** 直接指定要定位的 provider（插件行没有对应原生渠道时用） */
const focusProviderId = ref('')
/** 直接指定备选 provider id */
const focusAltIds = ref<string[]>([])
/** 直接指定「新增上游」预填的 preset */
const focusPresetId = ref('')
/** 直接指定预填显示名 */
const focusLabelText = ref('')

/** 从插件分组点进去的插件（「插件」页签置顶 + 安装入口） */
const focusPluginSpec = ref('')
const focusPluginName = ref('')
const focusPluginSummary = ref('')
const focusPluginProviders = ref<string[]>([])

/** 该渠道的归属条目；没点托管子项时为空 */
const focusVendor = computed(() =>
  focusChannel.value ? magpieOwnedOf(focusChannel.value) : undefined,
)

/** 从托管分组点进去时要高亮的 magpie provider id */
const focusProvider = computed(() => focusProviderId.value || focusVendor.value?.providers[0] || '')

/** 备选 provider id（插件 / 预设两种装法，如 cline → clinepass） */
const focusAlt = computed(() =>
  focusAltIds.value.length ? focusAltIds.value : (focusVendor.value?.providers.slice(1) ?? []),
)

/**
 * 网关里还没有该渠道的上游时，预填进「新增上游」的 preset。
 *
 * <p>只预填、不自动保存：新增上游是写操作，必须由用户补 key 后自己点保存。</p>
 */
const focusPreset = computed(() => focusPresetId.value || focusVendor.value?.preset || '')

/** 预填「新增上游」时用的显示名（左栏同一份 displayName） */
const focusLabel = computed(() => {
  if (focusLabelText.value) return focusLabelText.value
  const id = focusChannel.value
  if (!id) return ''
  return channels.value.find((c) => c.channel === id)?.displayName || id
})

/* ==================== 左栏：业务渠道 + 拖拽排序 ==================== */

/**
 * 左栏顺序的本地存储键。
 *
 * <p>只影响展示顺序，不改后端、不改变渠道启用状态：渠道清单来自 SPI 注册表，
 * 排序属于前端偏好。</p>
 */
const CHANNEL_ORDER_KEY = 'chm.rail.channel-order.v1'

/** 读取本地记住的渠道顺序；读不到 / 格式不对时返回空数组 */
function readChannelOrder(): string[] {
  try {
    const raw = localStorage.getItem(CHANNEL_ORDER_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

/** 左栏顺序（渠道 id）；新出现的渠道自动排在末尾 */
const channelOrder = ref<string[]>(readChannelOrder())

/** 正在拖拽的渠道 id */
const draggingChannel = ref('')
/** 当前拖到的目标渠道 id（用于画落点线） */
const dropTargetChannel = ref('')

/**
 * 业务渠道：排除网关型渠道（支持上游管理的 magpie 之类）。
 *
 * <p>magpie 是「接入实现」而不是业务渠道：它自己维护上游 provider 与插件，
 * 用户在左栏要看到的是 Qoder / WorkBuddy / Trae 这些渠道本身。网关本身不出现在
 * 左栏，也不计入渠道数、不参与拖拽排序。</p>
 */
const businessChannels = computed<ChannelSummary[]>(() =>
  channels.value.filter((c) => !c.supportsUpstream),
)

/**
 * 左栏条目：只放业务渠道，一行一个。
 *
 * <p>不再出现「托管 / 上游 / 插件」这些后端实现行：magpie、cdp 只是渠道背后的
 * 接入方式，用户看到的是 Qoder、WorkBuddy、Trae 这些渠道本身。渠道之间的先后
 * 顺序由拖拽决定，并记在本地。</p>
 */
const railItems = computed<ChannelSummary[]>(() => {
  const rank = new Map(channelOrder.value.map((id, i) => [id, i]))
  return [...businessChannels.value].sort((a, b) => {
    const ra = rank.get(a.channel)
    const rb = rank.get(b.channel)
    if (ra === undefined && rb === undefined) return 0
    if (ra === undefined) return 1
    if (rb === undefined) return -1
    return ra - rb
  })
})

/** 该行是否处于选中态 */
function railActive(c: ChannelSummary): boolean {
  return c.channel === activeChannel.value
}

/**
 * 点开一个渠道：右侧永远展示该渠道自己的常规详情（账号 / 模型 / 积分 / 任务）。
 *
 * <p>后端是 magpie、cdp 还是原生 SPI 只是接入方式，不该改变左侧渠道行点击后的
 * 落点。以前「由 magpie 托管且本地没有连接」的渠道会跳到网关的上游 / 插件面板，
 * 用户点 Qoder 却看到一片 magpie 术语，等于把实现细节漏到渠道管理里。现在统一
 * 留在渠道详情；要给托管渠道加账号，点底部「新增账号」原地走网关绑定，
 * 网关自身上游 / 插件的管理入口留在账号区。</p>
 *
 * @param c 渠道摘要
 */
function onRailClick(c: ChannelSummary): void {
  activeChannel.value = c.channel
  clearManagedFocus()
}

/**
 * 开始拖拽某一行。
 *
 * @param event   原生拖拽事件
 * @param channel 渠道 id
 */
function onChannelDragStart(event: DragEvent, channel: string): void {
  draggingChannel.value = channel
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', channel)
  }
}

/**
 * 拖到某一行上方：记录落点，由模板画一条落点线。
 *
 * @param channel 目标渠道 id
 */
function onChannelDragOver(channel: string): void {
  if (!draggingChannel.value || draggingChannel.value === channel) return
  dropTargetChannel.value = channel
}

/**
 * 拖离某一行：清掉落点线。
 *
 * @param channel 目标渠道 id
 */
function onChannelDragLeave(channel: string): void {
  if (dropTargetChannel.value === channel) dropTargetChannel.value = ''
}

/**
 * 放下：把被拖渠道移动到目标位置，并写入本地顺序。
 *
 * @param channel 目标渠道 id
 */
function onChannelDrop(channel: string): void {
  const from = draggingChannel.value
  onChannelDragEnd()
  if (!from || from === channel) return
  const ids = railItems.value.map((c) => c.channel)
  const fromIndex = ids.indexOf(from)
  const toIndex = ids.indexOf(channel)
  if (fromIndex < 0 || toIndex < 0) return
  ids.splice(fromIndex, 1)
  ids.splice(toIndex, 0, from)
  channelOrder.value = ids
  try {
    localStorage.setItem(CHANNEL_ORDER_KEY, JSON.stringify(ids))
  } catch {
    /* 隐私模式 / 配额满：顺序只在本次会话生效，不影响功能 */
  }
}

/** 结束拖拽：清掉落点与拖拽态 */
function onChannelDragEnd(): void {
  draggingChannel.value = ''
  dropTargetChannel.value = ''
}

/* ==================== 左右分栏：左栏宽度可拖拽 ==================== */

/** 左栏宽度偏好的本地存储键 */
const RAIL_WIDTH_KEY = 'chm.rail.width.v1'
/** 左栏最小宽度（px） */
const RAIL_MIN_WIDTH = 200
/** 左栏最大宽度（px） */
const RAIL_MAX_WIDTH = 560
/**
 * 默认宽度。
 *
 * <p>原来是 188px，「WorkBuddy（腾讯）」「DuckDuckGo 文生图」这类长名只能靠省略号，
 * 用户还得 hover 才知道是哪家。200 起才放得下常规渠道名，默认给 280。</p>
 */
const RAIL_DEFAULT_WIDTH = 280

/** 读取本地记住的左栏宽度；读不到 / 超界时回到默认值 */
function readRailWidth(): number {
  try {
    const raw = Number(localStorage.getItem(RAIL_WIDTH_KEY))
    if (!Number.isFinite(raw) || raw <= 0) return RAIL_DEFAULT_WIDTH
    return Math.min(RAIL_MAX_WIDTH, Math.max(RAIL_MIN_WIDTH, raw))
  } catch {
    return RAIL_DEFAULT_WIDTH
  }
}

/** 左栏当前宽度（px），拖拽时实时变化 */
const railWidth = ref<number>(readRailWidth())

/** 拖拽起点：鼠标 x 与起始宽度 */
let railResizeX = 0
let railResizeWidth = 0

/** 拖拽中：按鼠标位移改左栏宽度，并留出右栏最小可视宽度 */
function onRailResizeMove(e: MouseEvent): void {
  const room = window.innerWidth - 360
  const max = Math.min(RAIL_MAX_WIDTH, Math.max(RAIL_MIN_WIDTH, room))
  railWidth.value = Math.min(max, Math.max(RAIL_MIN_WIDTH, railResizeWidth + (e.clientX - railResizeX)))
}

/** 松手：移除全局监听并记住宽度 */
function stopRailResize(): void {
  document.removeEventListener('mousemove', onRailResizeMove)
  document.removeEventListener('mouseup', stopRailResize)
  document.body.style.userSelect = ''
  document.body.style.cursor = ''
  try {
    localStorage.setItem(RAIL_WIDTH_KEY, String(Math.round(railWidth.value)))
  } catch {
    /* 隐私模式 / 配额满：宽度只在本次会话生效 */
  }
}

/** 按下分栏手柄：开始跟踪鼠标 */
function startRailResize(e: MouseEvent): void {
  railResizeX = e.clientX
  railResizeWidth = railWidth.value
  document.addEventListener('mousemove', onRailResizeMove)
  document.addEventListener('mouseup', stopRailResize)
  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'col-resize'
}

/** 双击手柄：复位默认宽度 */
function resetRailWidth(): void {
  railWidth.value = RAIL_DEFAULT_WIDTH
  try {
    localStorage.setItem(RAIL_WIDTH_KEY, String(RAIL_DEFAULT_WIDTH))
  } catch {
    /* 忽略 */
  }
}

/** 键盘微调（手柄可聚焦，←/→ 每次 ±16px） */
function nudgeRail(delta: number): void {
  const room = window.innerWidth - 360
  const max = Math.min(RAIL_MAX_WIDTH, Math.max(RAIL_MIN_WIDTH, room))
  railWidth.value = Math.min(max, Math.max(RAIL_MIN_WIDTH, railWidth.value + delta))
  try {
    localStorage.setItem(RAIL_WIDTH_KEY, String(Math.round(railWidth.value)))
  } catch {
    /* 忽略 */
  }
}

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onRailResizeMove)
  document.removeEventListener('mouseup', stopRailResize)
})

/**
 * 网关里还没有对应渠道行的上游。
 *
 * <p>能对上渠道的（zcode / workbuddy / trae…）已经由「托管」行承载，
 * 不再重复占一行；对不上的（devin / deepseek-web…）单独成行，保证每个
 * 上游都能像普通渠道一样点开。</p>
 */
const extraProviders = computed<MagpieProvider[]>(() => {
  const covered = new Set<string>([
    ...channels.value.map((c) => c.channel),
    ...MAGPIE_OWNED_VENDORS.flatMap((v) => v.providers),
  ])
  return gatewayProviderRows.value.filter((p) => p?.id && !covered.has(String(p.id)))
})

/** 上游条目的展示名：网关里的 name 优先，没有就退回 id */
function extraProviderName(provider: MagpieProvider): string {
  return providerLabel(provider)
}

/** 上游条目的首字：没有品牌图标时用文字徽标占位 */
function extraProviderGlyph(provider: MagpieProvider): string {
  const name = extraProviderName(provider).trim()
  return name ? name.slice(0, 1).toUpperCase() : '·'
}

/**
 * 点开一条「网关里还没有对应渠道行」的上游。
 *
 * <p>这类上游（devin / deepseek-web 等）没有自己的业务渠道，用户只能在网关里
 * 找到它。左栏给一行，点开就落到网关渠道的「上游」页签并高亮这条，避免用户
 * 先点进别的渠道再找。</p>
 *
 * @param provider 网关上游实例
 */
function openExtraProvider(provider: MagpieProvider): void {
  const id = String(provider?.id ?? '')
  if (!id) return
  openGateway('upstream', () => {
    clearManagedFocus()
    focusProviderId.value = id
    focusLabelText.value = extraProviderName(provider)
  })
}

/** 清掉所有「刚才那一跳」的定位与预填 */
function clearManagedFocus(): void {
  focusChannel.value = ''
  focusProviderId.value = ''
  focusAltIds.value = []
  focusPresetId.value = ''
  focusLabelText.value = ''
  focusPluginSpec.value = ''
  focusPluginName.value = ''
  focusPluginSummary.value = ''
  focusPluginProviders.value = []
}

/** 记录一个插件行的定位（不触发任何写操作） */
function applyPluginFocus(plugin: MagpiePluginChannel): void {
  focusPluginSpec.value = plugin.spec
  focusPluginName.value = plugin.name
  focusPluginSummary.value = plugin.summary
  focusPluginProviders.value = [...plugin.providers]
}

/**
 * 切到网关渠道的某个页签。
 *
 * <p>{@code activeChannel} 的 watcher 会把页签复位到「账号」（{@code resetDetailTabs}），
 * 而 watcher 在本次同步代码之后才跑，所以页签和定位必须放到 {@code nextTick} 里，
 * 否则刚设好就被复位成「账号」。</p>
 *
 * @param tab   目标页签
 * @param apply 页签就位后再写定位（避免被 resetDetailTabs 清掉）
 */
function openGateway(tab: string, apply: () => void): void {
  const gateway = gatewayChannel.value
  if (!gateway) return
  activeChannel.value = gateway.channel
  void nextTick(() => {
    detailTab.value = tab
    apply()
  })
}

/**
 * 点开一个被托管渠道：
 *
 * <ul>
 *   <li>网关里已有 provider → 「上游」并高亮该行；</li>
 *   <li>没有 provider 但有预设 → 「上游」并打开新增、按 preset 预填（只预填）；</li>
 *   <li>两者都没有 → 「插件」页签，把接管插件置顶并给出安装入口。</li>
 * </ul>
 *
 * @param entry 托管子项
 */
function openManaged(entry: ManagedEntry): void {
  const { vendor, channel } = entry
  const name = channel.displayName || channel.channel
  const hit = liveProvider(vendor.providers)
  if (hit) {
    openGateway('upstream', () => {
      clearManagedFocus()
      focusChannel.value = channel.channel
      focusProviderId.value = hit
      focusAltIds.value = vendor.providers.filter((x) => x !== hit)
      focusLabelText.value = name
    })
    return
  }
  if (vendor.preset) {
    openGateway('upstream', () => {
      clearManagedFocus()
      focusChannel.value = channel.channel
      focusLabelText.value = name
    })
    return
  }
  const plugin = vendor.plugin
    ? magpiePluginOfSpec(vendor.plugin)
    : magpiePluginOfProviders(vendor.providers)
  openGateway(plugin ? 'plugins' : 'upstream', () => {
    clearManagedFocus()
    focusChannel.value = channel.channel
    focusLabelText.value = name
    if (plugin) applyPluginFocus(plugin)
  })
}

/**
 * 网关托管的渠道：登录入口必须回到网关本身。
 *
 * <p>网关优先后本地连接不参与，页面上的「绑定登录态账号」只会新建一条马上被
 * 忽略的本地连接。这里直接打开网关「上游」并定位该渠道的 provider（没接上时
 * 落到新增 / 插件），由网关面板完成登录。</p>
 */
function openGatewayLogin(): void {
  const channel = activeChannel.value
  const entry = managedEntries.value.find((x) => x.channel.channel === channel)
  if (entry) {
    openManaged(entry)
    return
  }
  openGatewayRoot()
}

/**
 * 左栏入口：网关自己的「上游」页签。
 *
 * <p>渠道页不再常驻这个入口（底部改成「新增账号」），只在网关里还没有上游、
 * 需要先接入时由绑定弹窗带着用户进来。</p>
 */
function openGatewayRoot(): void {
  openGateway('upstream', () => clearManagedFocus())
}

/* ==================== 底部「新增账号」 ==================== */

/** 当前渠道能否新增账号：普通渠道走本页表单，网关托管渠道走 Magpie 绑定 */
const canAddAccount = computed(() => {
  const c = activeSummary()
  return !!c && (accountsSupported(c) || !!magpieOwnedOf(c.channel))
})

/**
 * 当前渠道是否交给 Magpie 处理。
 *
 * <p>判据是「网关里已经有这个渠道的上游」（托管行来源），而不是只看归属表：
 * opencode / kilo / cline / gemini 这类渠道在网关里通常是预设上游，网关没接时
 * 用户仍可以走本地账号表单。网关优先：接上了就按网关处理。</p>
 */
const activeMagpieOwned = computed(() => hostedOnly(activeSummary()))

/** 网关主连接：上游管理与登录都按它取凭据 */
const gatewayConnectionId = computed(() => {
  const gateway = gatewayChannel.value
  const conn = gateway?.connections?.find((x) => x.primary) ?? gateway?.connections?.[0]
  return conn?.connectionId ?? ''
})

/** 当前渠道在网关里的上游实例（新增账号时选绑定到哪一个） */
const activeMagpieProviders = computed(() => hostedProvidersOf(activeChannel.value))

/** Magpie 绑定弹窗显隐 */
const magpieBindVisible = ref(false)

/**
 * 「网关设置」弹窗显隐。
 *
 * <p>网关地址是所有托管渠道共用的基础设置，不该藏进某个渠道的账号表单里：
 * 新电脑上还没装网关的人需要一个显眼的入口，既能看到怎么下载，也能填地址。</p>
 */
const gatewaySettingsVisible = ref(false)

/** 打开网关设置：地址回显与探活由弹窗自己做 */
function openGatewaySettings(): void {
  gatewaySettingsVisible.value = true
}

/** 网关设置保存成功：连接摘要与上游索引都要重读 */
async function onGatewaySettingsSaved(): Promise<void> {
  await Promise.allSettled([loadChannels(), loadGatewayIndex()])
}

/**
 * 底部「新增账号」的唯一入口。
 *
 * <p>普通渠道弹本页的账号表单；Magpie 托管的渠道当场走网关绑定会话，
 * 不把用户送到网管页面去。</p>
 */
function openAddAccount(): void {
  if (!activeChannel.value) return
  if (activeMagpieOwned.value) {
    if (!gatewayConnectionId.value) {
      ElMessage.warning('还没有配置网关，请先在左下角「网关设置」里配置')
      return
    }
    magpieBindVisible.value = true
    return
  }
  addAccount()
}

/** 绑定成功：渠道摘要与网关索引都要重读（托管行按网关展开） */
async function onMagpieBound(): Promise<void> {
  magpieBindVisible.value = false
  await Promise.allSettled([loadChannels(), loadGatewayIndex()])
}

/** 弹窗里点「去网关接入上游」：回到网关「上游」，按当前渠道定位 */
function onMagpieManageUpstream(): void {
  magpieBindVisible.value = false
  openGatewayLogin()
}

/** 点开一个插件渠道：网关里已经有它的上游就去上游高亮，否则去「插件」页签置顶，
 * 由插件面板给出「安装」入口（安装要用户自己点并二次确认）。
 *
 * @param plugin 插件渠道
 */
function openPlugin(plugin: MagpiePluginChannel): void {
  const hit = liveProvider(plugin.providers)
  openGateway(hit ? 'upstream' : 'plugins', () => {
    clearManagedFocus()
    applyPluginFocus(plugin)
    if (hit) {
      focusProviderId.value = hit
      focusAltIds.value = plugin.providers.filter((x) => x !== hit)
      focusLabelText.value = plugin.name
    }
  })
}

/**
 * 托管子项的悬停提示。
 *
 * <p>两类渠道的「托管」含义不同：插件那批是登录、签到、额度都在网关；
 * 预设那批只是上游地址、key、模型目录在网关。提示语照实说，不把两者混为一谈。</p>
 */
function managedHint(entry: ManagedEntry): string {
  const name = entry.channel.displayName || entry.channel.channel
  if (entry.vendor.preset) return `到 Magpie 里接入「${name}」的上游（预设 + API Key）`
  const plugin = entry.vendor.plugin ? magpiePluginOfSpec(entry.vendor.plugin) : undefined
  return plugin
    ? `到 Magpie 里用插件「${plugin.name}」接管「${name}」的登录与签到`
    : `到 Magpie 里管理「${name}」的登录与签到`
}

/** 可选页签（随选中渠道能力变化） */
const detailTabs = computed(() => {
  const summary = activeSummary()
  const tabs = []
  // 免登录渠道（CHAT/IMAGE）没有账号表，页签从「模型」开始，避免点进账号就报错。
  if (accountsSupported(summary) || summary?.supportsUpstream || displayConnections(summary).length) {
    tabs.push({ name: 'accounts', label: '账号', icon: 'Connection' })
  }
  // 文生图渠道没有模型清单可配：页签直接叫「出图」，点进去就能写提示词试一张。
  tabs.push({
    name: 'models',
    label: kindOf(summary) === 'IMAGE' ? '出图' : '模型',
    icon: 'DataAnalysis',
  })
  // 积分不再单独成页：额度已经画在账号卡片里，单开一页只是把同一份数据读两遍。
  if (summary?.supportsTask && !hostedOnly(summary)) {
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
  const summary = activeSummary()
  detailTab.value = (accountsSupported(summary) || summary?.supportsUpstream || displayConnections(summary).length)
    ? 'accounts'
    : 'models'
  // 托管 / 插件分组的定位高亮只对「刚才那一跳」有效，换渠道就清掉
  clearManagedFocus()
  creditState.value = {}
  taskState.value = {}
  // 出图结果带时效签名，跨渠道留着只会误导；换渠道即清空
  resetImageTest()
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
  // ⚠️ 不能写 `creditState.value[key] ??= {}`：赋值表达式的值是右侧的原始对象，
  // 之后改 state.loading / state.data 都不会触发渲染（页面永远停在「查询中…」）。
  // 先建号，再通过 ref 读回来拿到 reactive 代理。
  if (!creditState.value[key]) creditState.value[key] = {}
  const state = creditState.value[key]
  state.loading = true
  state.error = ''
  try {
    const res = await channelApi.credit(activeChannel.value, accountRef(conn))
    const out = (res as any)?.data ?? res
    const credit = out?.credit ?? {}
    // 渠道没有注册积分能力 / 寻址失败时后端回 ok=false + message，不能当「已查询到空数据」
    if (out?.ok === false && !credit?.error) {
      state.data = undefined
      state.error = String(out?.message ?? '积分查询失败')
      return
    }
    state.data = credit
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
  // 同上：必须拿到 reactive 代理，`??=` 拿到的是原始对象，改它不会重渲染。
  if (!taskState.value[key]) taskState.value[key] = {}
  const state = taskState.value[key]
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

/**
 * 上下文窗口人类化：{@code 1048576} → {@code 1M}，{@code 200000} → {@code 200K}。
 *
 * <p>模型胶囊上直接印六位数字（1048576）会被挤成两行，也难一眼比较；
 * 真正的精度放进 {@code title}。</p>
 */
const contextWindowText = (value: unknown): string => {
  const size = Number(value)
  if (!Number.isFinite(size) || size <= 0) return ''
  if (size >= 1_000_000) {
    const scaled = size / 1_000_000
    return `${Math.round(scaled * 10) / 10}M`.replace('.0M', 'M')
  }
  if (size >= 1_000) {
    const scaled = size / 1_000
    return `${Math.round(scaled * 10) / 10}K`.replace('.0K', 'K')
  }
  return String(size)
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
  const unit = pkg.unit === 'currency' ? (pkg.currency ?? '') : creditUnitText(pkg.unit)
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

/**
 * 是否有可算比例的「剩余 / 总量」。
 *
 * <p>上游常常只给余额、不给总量（充值卡、订阅窗口），此时百分比恒为 0；
 * 直接展示「剩余 0%」会把「未知」说成「用光」。</p>
 */
const creditHasRatio = (credit: any): boolean => Number(credit?.total ?? 0) > 0

/** 顶部额度汇总的一项（按单位分组，不同单位不混算） */
interface CreditTotal {
  /** 单位（currency 时为币种代码） */
  unit: string
  /** 展示文案，如「1,234 积分」 */
  text: string
  /** 剩余比例（0~100）；没有总量时为 null，只显示数字 */
  percent: number | null
  /** 聚合的账号数 */
  accounts: number
}

/**
 * 当前渠道的剩余额度汇总（顶部条）。
 *
 * <p>数据来自每张账号卡的 {@code /credit} 读数，只做「同单位相加」：
 * 积分 / token / 货币是三种量纲，混加会得到没有意义的数字。后端在
 * {@code units} 里已经按「单位 + 币种」分好桶（{@code currency:USD} 与
 * {@code currency:CNY} 也是两个桶），这里逐桶展示，一种单位一条。
 * 任一账号没有读数就不参与合计，避免把「未知」当成 0；全部未知时返回空数组，顶部不显示。</p>
 */
const creditTotals = computed<CreditTotal[]>(() => {
  const summary = activeSummary()
  if (!summary?.supportsCredit) return []
  const groups = new Map<string, {
    unit: string
    currency: string
    remain: number
    total: number
    hasRemain: boolean
    hasTotal: boolean
    accounts: number
  }>()
  const addBucket = (unit: string, currency: string, remain: unknown, total: unknown) => {
    const remainMissing = remain === undefined || remain === null || remain === ''
    const totalMissing = total === undefined || total === null || total === ''
    // 两个字段都没有的桶不显示：不能拿「未提供」画一条空账
    if (remainMissing && totalMissing) return
    const key = unit === 'currency' ? `currency:${currency}` : unit
    const group = groups.get(key) ?? {
      unit,
      currency,
      remain: 0,
      total: 0,
      hasRemain: false,
      hasTotal: false,
      accounts: 0,
    }
    if (!remainMissing) {
      const value = Number(remain)
      if (Number.isFinite(value)) {
        group.remain += value
        group.hasRemain = true
        group.accounts += 1
      }
    }
    if (!totalMissing) {
      const value = Number(total)
      if (Number.isFinite(value) && value > 0) {
        group.total += value
        group.hasTotal = true
      }
    }
    groups.set(key, group)
  }
  for (const conn of displayConnections(summary)) {
    const data = creditState.value[conn.connectionId]?.data
    if (!data || data.error) continue
    // 新后端按单位分桶；旧后端没有 units，退回单条 unit / remain / total
    const units = Array.isArray(data.units) ? data.units : []
    if (units.length) {
      for (const bucket of units) {
        if (!bucket) continue
        addBucket(String(bucket.unit ?? ''), String(bucket.currency ?? ''), bucket.remain, bucket.total)
      }
      continue
    }
    addBucket(String(data.unit ?? ''), String(data.currency ?? ''), data.remain, data.total)
  }
  return [...groups.values()]
    .filter((group) => group.hasRemain || group.hasTotal)
    .map((group) => {
      const label = group.unit === 'currency' ? (group.currency || '货币') : creditUnitText(group.unit)
      return {
        unit: group.unit === 'currency' ? (group.currency || 'currency') : group.unit,
        text: group.hasRemain
          ? `${compactNumber(group.remain)}${label ? ' ' + label : ''}`
          : `—${label ? ' ' + label : ''}`,
        percent: group.hasRemain && group.hasTotal && group.total > 0
          ? Math.max(0, Math.min(100, Math.round((group.remain / group.total) * 100)))
          : null,
        accounts: group.accounts,
      }
    })
})

/** 任务进度百分比 */
const taskPercent = (task: any): number => {
  const target = Number(task?.target ?? 0)
  const current = Number(task?.current ?? 0)
  if (!target) return 0
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)))
}

onMounted(() => {
  // 角色是登录后异步写入 @repo/core 的模块级缓存（非响应式），
  // setup 时读一次可能还是空角色，挂载时再确认一次。
  isAdminUser.value = isAdmin()
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
    <ReErrorBar v-if="loadError" :message="loadError" retryText="重试" @retry="loadChannels" />

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
      <aside class="chm-rail" :style="{ width: railWidth + 'px' }">
        <div class="chm-rail__head">
          <span>渠道索引</span>
          <span class="chm-rail__head-right">
            <b>{{ railItems.length }}</b>
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
        <!--
          左栏只有业务渠道：一行一个，拖上拖下调整顺序。
          后端是 magpie、cdp 还是原生 SPI 都不在这里体现；接入方式在右侧详情里看。
        -->
        <!-- 渠道行单独滚动：网关入口固定在底部，不被长列表挤出视口 -->
        <div class="chm-rail__list">
          <button
            v-for="c in railItems"
            :key="c.channel"
            type="button"
            class="chm-rail__item"
            :class="{
              'is-active': railActive(c),
              'is-dragging': draggingChannel === c.channel,
              'is-drop-target': dropTargetChannel === c.channel && draggingChannel !== c.channel,
            }"
            draggable="true"
            :title="`${c.displayName || c.channel}（拖拽调整顺序）`"
            @click="onRailClick(c)"
            @dragstart="onChannelDragStart($event, c.channel)"
            @dragover.prevent="onChannelDragOver(c.channel)"
            @dragleave="onChannelDragLeave(c.channel)"
            @drop.prevent="onChannelDrop(c.channel)"
            @dragend="onChannelDragEnd()"
          >
            <span class="chm-rail__grip" aria-hidden="true">⠿</span>
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

          <!--
            网关里还有一批没有对应业务渠道的上游：一行一个放在渠道之后。
            点开直接落到网关「上游」页签并高亮这一条，用户不用先猜它属于哪个渠道。
          -->
          <template v-if="extraProviders.length">
            <p class="chm-rail__sect">网关里的其它上游</p>
            <button
              v-for="p in extraProviders"
              :key="'upstream-' + p.id"
              type="button"
              class="chm-rail__item chm-rail__item--upstream"
              :title="`${extraProviderName(p)}（在网关里管理）`"
              @click="openExtraProvider(p)"
            >
              <span class="chm-rail__grip" aria-hidden="true">↗</span>
              <span class="chm-rail__logo is-upstream">
                <b>{{ extraProviderGlyph(p) }}</b>
              </span>
              <span class="chm-rail__name" :title="extraProviderName(p)">
                {{ extraProviderName(p) }}
              </span>
              <span class="chm-rail__kind">上游</span>
            </button>
          </template>
        </div>

        <!--
          底部常驻入口：
            新增账号 —— 普通渠道弹本页账号表单；托管渠道当场走网关登录会话。
            网关设置 —— 配置网关地址 / 页面 Key，新电脑上还能从这里去下载网关。
        -->
        <div class="chm-rail__foot">
          <button
            v-if="canAddAccount"
            type="button"
            class="chm-rail__item chm-rail__item--util is-add-account"
            title="给当前渠道新增一个账号"
            @click="openAddAccount"
          >
            <span class="chm-rail__grip" aria-hidden="true">＋</span>
            <span class="chm-rail__logo is-add" aria-hidden="true">
              <el-icon><PlusIcon /></el-icon>
            </span>
            <span class="chm-rail__name">新增账号</span>
          </button>
          <button
            type="button"
            class="chm-rail__item chm-rail__item--util is-gateway"
            title="配置网关地址，或下载安装网关"
            @click="openGatewaySettings"
          >
            <span class="chm-rail__grip" aria-hidden="true">⚙</span>
            <span class="chm-rail__logo is-gateway" aria-hidden="true">
              <el-icon><SettingIcon /></el-icon>
            </span>
            <span class="chm-rail__name">网关设置</span>
          </button>
        </div>
      </aside>

      <!--
        左右分栏拖拽手柄：只调左栏宽度（不改右栏内容）。
        宽度存本地偏好，刷新后保持；双击复位默认宽度。
      -->
      <div
        class="chm-deck__split"
        role="separator"
        aria-orientation="vertical"
        aria-label="拖拽调整左栏宽度"
        :aria-valuenow="railWidth"
        :aria-valuemin="RAIL_MIN_WIDTH"
        :aria-valuemax="RAIL_MAX_WIDTH"
        title="拖拽调整左栏宽度（双击复位）"
        tabindex="0"
        @mousedown.prevent="startRailResize"
        @dblclick.prevent="resetRailWidth"
        @keydown.left.prevent="nudgeRail(-16)"
        @keydown.right.prevent="nudgeRail(16)"
      />

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
              <span class="chm-panel__chip is-task" v-if="activeSummary()!.supportsTask && !hostedOnly(activeSummary())">任务</span>
            </span>
          </div>
          <!--
            顶部额度汇总：把本渠道已查到的账号余额按单位合计。
            有总量才画进度条，只有余额时退化成数字（上游不给总量不是 0%）。
          -->
          <div
            v-if="creditTotals.length"
            class="chm-total"
            title="当前渠道已查询到的剩余额度：同单位相加，积分 / token / 货币不混算"
          >
            <div v-for="(total, idx) in creditTotals" :key="'chm-total-' + idx" class="chm-total__item">
              <span class="chm-total__label">剩余</span>
              <span class="chm-total__value">{{ total.text }}</span>
              <span
                v-if="total.percent !== null"
                class="chm-total__bar"
                role="progressbar"
                :aria-valuenow="total.percent"
                aria-valuemin="0"
                aria-valuemax="100"
              ><i :style="{ width: total.percent + '%' }" /></span>
              <span v-if="total.percent !== null" class="chm-total__pct">{{ total.percent }}%</span>
            </div>
          </div>
          <div class="chm-panel__state">
            <span class="chm-rail__dot" :class="'is-' + channelState(activeSummary())" />
            {{ channelStateText(activeSummary()) }}
          </div>
          <!--
            渠道启停：关掉后该渠道不参与路由（后端按 provider.enabled 过滤），
            免费渠道也不会再进 FreeChatClient；账号与模型配置都保留。
          -->
          <el-switch
            :model-value="activeSummary()!.enabled"
            class="chm-panel__switch"
            :title="activeSummary()!.enabled ? '已启用：可参与对话/出图路由' : '已停用：不参与路由'"
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

                网关型渠道（magpie）例外：账号由网关自己托管，这里既不显示
                「添加账号」也不显示统一账号列表，只保留下面的「已授权连接」。
              -->
              <div v-if="accountsSupported(activeSummary()) && !hostedOnly(activeSummary())" class="chm-panel__block">
                <div class="chm-panel__sect-title">
                  <el-icon aria-hidden="true"><ConnectionIcon /></el-icon>
                  账号 <i>{{ accounts.length }}</i>
                  <button
                    type="button"
                    class="chm-panel__pull chm-panel__pull--icon"
                    :title="accountsLoading ? '加载中…' : '刷新账号列表'"
                    aria-label="刷新账号列表"
                    :disabled="accountsLoading"
                    @click.stop="loadAccounts()"
                  >
                    <el-icon aria-hidden="true"><RefreshIcon /></el-icon>
                  </button>
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
              <div v-if="displayConnections(activeSummary()).length" class="chm-panel__block">
                <div class="chm-panel__sect-title">
                  <el-icon aria-hidden="true"><ConnectionIcon /></el-icon>
                  已授权连接 <i>{{ displayConnections(activeSummary()).length }}</i>
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
                  <article
                    v-for="conn in displayConnections(activeSummary())"
                    :key="conn.connectionId"
                    class="chm-acc"
                    :class="{ 'is-stale': connState(conn) !== 'valid', 'is-primary': conn.primary }"
                  >
                    <!-- 身份头：徽标 + 名称 + 身份/健康徽章 + 操作 -->
                    <header class="chm-acc__row">
                      <span class="chm-acc__avatar" aria-hidden="true">{{ (conn.label || '?').slice(0, 1).toUpperCase() }}</span>
                      <div class="chm-acc__ident">
                        <div class="chm-acc__titlerow">
                          <span class="chm-acc__label" :title="conn.label">{{ conn.label || '未命名' }}</span>
                          <span v-if="conn.primary && !conn.hosted" class="chm-acc__primary">主账号</span>
                          <span v-if="conn.hosted" class="chm-acc__state is-valid" title="账号已授权，可直接使用">已授权</span>
                          <span v-else class="chm-acc__state" :class="'is-' + connState(conn)">
                            {{ connStateText(conn) }}
                          </span>
                        </div>
                        <div class="chm-acc__sub">
                          <span
                            v-if="connExpireText(conn)"
                            class="chm-acc__expire"
                            :class="{ 'is-expired': connExpireText(conn) === '已过期' }"
                          >{{ connExpireText(conn) }}</span>
                          <span
                            v-if="conn.checkinAt"
                            class="chm-acc__checkin"
                            :title="conn.checkinMessage || ''"
                          >签到 {{ shortTime(conn.checkinAt) }}</span>
                          <span v-if="!conn.hosted && !connExpireText(conn) && !conn.checkinAt" class="chm-acc__muted">长期有效</span>
                        </div>
                      </div>
                      <div class="chm-acc__actions">
                        <button v-if="!conn.hosted" class="chm-acc__btn"
                                @click.stop="renameAccount(activeChannel, conn)">改名</button>
                        <button v-if="!conn.primary && !conn.hosted" class="chm-acc__btn"
                                @click.stop="setPrimaryAccount(activeChannel, conn)">设为主账号</button>
                        <button v-if="!conn.hosted && activeSummary()!.supportsRefresh !== false"
                                class="chm-acc__btn" :disabled="busyFor(activeChannel, 'refresh')"
                                @click.stop="refreshAccount(activeChannel, conn)">刷新</button>
                        <!--
                          有积分能力的渠道：签到收进积分行（额度变化就在旁边）；
                          没有积分能力才把签到留在操作行里。
                        -->
                        <button v-if="activeSummary()!.supportsCheckin && !activeSummary()!.supportsCredit" class="chm-acc__btn"
                                :disabled="busyFor(activeChannel, 'sign')"
                                @click.stop="checkin(activeChannel, conn)">签到</button>
                        <button v-if="!conn.hosted" class="chm-acc__btn is-danger"
                                @click.stop="deleteAccount(activeChannel, conn)">删除</button>
                      </div>
                    </header>

                    <!-- 积分：额度 + 进度 + 签到，一条读完 -->
                    <section v-if="activeSummary()!.supportsCredit" class="chm-acc__credit">
                      <div class="chm-credit__top">
                        <span class="chm-credit__caption">积分</span>
                        <template v-if="creditState[conn.connectionId]?.data">
                          <span class="chm-credit__value">{{ creditText(creditState[conn.connectionId]!.data) }}</span>
                          <span
                            v-if="creditHasRatio(creditState[conn.connectionId]!.data)"
                            class="chm-credit__pct"
                            :class="{ 'is-low': creditPercent(creditState[conn.connectionId]!.data) <= 20 }"
                          >剩余 {{ creditPercent(creditState[conn.connectionId]!.data) }}%</span>
                        </template>
                        <span v-else-if="creditState[conn.connectionId]?.loading" class="chm-credit__caption">查询中…</span>
                        <span v-else class="chm-credit__caption">尚未查询</span>
                        <div class="chm-credit__ops">
                          <button
                            type="button"
                            class="chm-credit__icon"
                            :title="creditState[conn.connectionId]?.loading ? '查询中…' : '刷新积分'"
                            aria-label="刷新积分"
                            :disabled="creditState[conn.connectionId]?.loading"
                            @click.stop="loadCredit(conn)"
                          >
                            <el-icon aria-hidden="true"><RefreshIcon /></el-icon>
                          </button>
                          <button
                            v-if="activeSummary()!.supportsCheckin"
                            class="chm-credit__checkin"
                            type="button"
                            :disabled="busyFor(activeChannel, 'sign')"
                            @click.stop="checkin(activeChannel, conn)"
                          >签到</button>
                        </div>
                      </div>
                      <p v-if="creditState[conn.connectionId]?.error" class="chm-credit__error">
                        {{ creditState[conn.connectionId]!.error }}
                      </p>
                      <template v-else-if="creditState[conn.connectionId]?.data">
                        <div
                          v-if="creditHasRatio(creditState[conn.connectionId]!.data)"
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
                        <div
                          v-if="(creditState[conn.connectionId]!.data.packages ?? []).length"
                          class="chm-credit__pkgs"
                        >
                          <span
                            v-for="(pkg, idx) in creditState[conn.connectionId]!.data.packages"
                            :key="'pkg-' + idx"
                            class="chm-credit__pkg"
                          >
                            <b>{{ pkg.name || '额度包' }}</b>{{ creditPkgText(pkg) }}
                          </span>
                        </div>
                        <p v-if="creditState[conn.connectionId]!.data.warning" class="chm-credit__warn">
                          {{ creditState[conn.connectionId]!.data.warning }}
                        </p>
                      </template>
                    </section>
                  </article>
                </div>
              </div>

              <!-- 绑定登录态账号（AI 账号渠道的授权流程） -->
              <div v-if="supportsFixed(activeSummary()) && !hostedOnly(activeSummary())" class="chm-panel__binds">
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
              <!--
                网关托管：账号在 Magpie 里。点这里当场发起网关登录会话（授权页在新窗口
                打开），不跳转到网关自己的管理页；网关管理保留成次级链接。
              -->
              <div v-else-if="hostedOnly(activeSummary())" class="chm-panel__binds">
                <button
                  class="chm-panel__bindbtn"
                  type="button"
                  :disabled="!gatewayConnectionId"
                  @click="openAddAccount"
                >
                  <el-icon class="chm-btn__icon" aria-hidden="true"><PlusIcon /></el-icon>
                  新增账号
                </button>
                <button
                  v-if="isAdminUser"
                  class="chm-panel__bindlink"
                  type="button"
                  @click="openGatewayLogin"
                >
                  管理上游与插件
                </button>
              </div>
            </div>

            <!-- ════════ 模型 / 出图 ════════ -->
            <div v-else-if="tab.name === 'models'" class="chm-panel__tabbody">
              <!--
                文生图渠道：DuckDuckGo / Trae 没有可配置的模型清单，页面以前只剩一句
                「未声明内置模型」。这里给一块能直接出图的面板，渠道到底通不通一眼可见。
              -->
              <div v-if="isImageChannel" class="chm-panel__block chm-img">
                <div class="chm-panel__sect-title">
                  <el-icon aria-hidden="true"><PictureIcon /></el-icon>
                  试出图
                  <span class="chm-img__tip">写一句提示词，点「生成」</span>
                </div>
                <label class="chm-img__field">
                  <span class="chm-img__label">提示词</span>
                  <el-input
                    v-model="imagePrompt"
                    type="textarea"
                    :rows="2"
                    resize="vertical"
                    placeholder="例如：黄昏下的雪山湖泊，写实摄影，柔和光线"
                  />
                </label>
                <div class="chm-img__row">
                  <label class="chm-img__field is-inline">
                    <span class="chm-img__label">比例</span>
                    <el-select v-model="imageRatio" class="chm-img__select">
                      <el-option label="1:1" value="1:1" />
                      <el-option label="4:3" value="4:3" />
                      <el-option label="3:4" value="3:4" />
                      <el-option label="16:9" value="16:9" />
                      <el-option label="9:16" value="9:16" />
                    </el-select>
                  </label>
                  <label v-if="imageModelOptions.length" class="chm-img__field is-inline">
                    <span class="chm-img__label">模型</span>
                    <el-select
                      v-model="imageModel"
                      class="chm-img__select"
                      placeholder="默认"
                      clearable
                    >
                      <el-option
                        v-for="m in imageModelOptions"
                        :key="m.model"
                        :label="m.alias || m.model"
                        :value="m.model"
                      />
                    </el-select>
                  </label>
                  <label class="chm-img__field is-inline is-grow">
                    <span class="chm-img__label">登录令牌（需要登录态的渠道才填）</span>
                    <el-input
                      v-model="imageToken"
                      type="password"
                      show-password
                      placeholder="可留空"
                    />
                  </label>
                  <el-button
                    type="primary"
                    class="chm-img__run"
                    :loading="imageBusy"
                    :disabled="!imagePrompt.trim() || imageBusy"
                    @click="runImageTest"
                  >
                    {{ imageBusy ? '生成中…' : '生成' }}
                  </el-button>
                </div>
                <p v-if="imageError" class="chm-img__error">{{ imageError }}</p>
                <div v-if="imageResults.length" class="chm-img__grid">
                  <a
                    v-for="(img, i) in imageResults"
                    :key="img.url + i"
                    class="chm-img__shot"
                    :href="img.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    :title="'打开原图 ' + (i + 1)"
                  >
                    <img :src="img.thumbUrl || img.url" :alt="`生成结果 ${i + 1}`" />
                  </a>
                </div>
              </div>

              <div
                v-if="!isImageChannel || (activeSummary()!.models ?? []).length"
                class="chm-panel__block"
              >
                <div class="chm-models__title">
                  <div class="chm-panel__sect-title">
                    <el-icon aria-hidden="true"><DataAnalysisIcon /></el-icon>
                    模型 <i>{{ (activeSummary()!.models ?? []).length }}</i>
                    <span v-if="(activeSummary()!.models ?? []).length"
                          class="chm-models__count">
                      已启用 {{ modelSelectedCount }} / {{ (activeSummary()!.models ?? []).length }}
                    </span>
                  </div>
                  <!-- 拉取 + 批量 + 保存只占一行：都是模型管理动作，不该拆成两个容器 -->
                  <div v-if="modelsPullable(activeSummary()) || (activeSummary()!.models ?? []).length"
                       class="chm-models__toolbar">
                    <!-- 托管渠道也允许拉取：后端按「网关优先」从网关上游 provider 取模型并落库 -->
                    <template v-if="modelsPullable(activeSummary())">
                      <button type="button" class="chm-models__op" :disabled="busyFor(activeChannel, 'models') || modelSaving"
                              @click.stop="pullModels(activeChannel)">
                        {{ busyFor(activeChannel, 'models') ? '拉取中…' : '拉取模型' }}
                      </button>
                      <span class="chm-models__sep" aria-hidden="true"></span>
                    </template>
                    <button type="button" class="chm-models__op" @click.stop="setAllModelDraft('all')">全选</button>
                    <button type="button" class="chm-models__op" @click.stop="setAllModelDraft('free')">全选免费</button>
                    <button type="button" class="chm-models__op" @click.stop="setAllModelDraft('invert')">反选</button>
                    <button type="button" class="chm-models__op" @click.stop="setAllModelDraft('none')">全不选</button>
                    <span class="chm-models__sep" aria-hidden="true"></span>
                    <button type="button" class="chm-models__op is-primary"
                            :disabled="!modelChanges.length || modelSaving"
                            @click.stop="saveModelSelection()">
                      {{ modelSaving ? '保存中…' : modelChanges.length ? `保存 (${modelChanges.length})` : '保存' }}
                    </button>
                    <button v-if="modelChanges.length" type="button" class="chm-models__op is-ghost"
                            :disabled="modelSaving" @click.stop="resetModelDraft()">撤销</button>
                  </div>
                </div>
                <!--
                  免登录 / 文生图渠道的模型是客户端内置表：不需要（也不能）从上游拉取，
                  但启用状态同样保存在后台，勾选后点「保存」即生效。
                -->
                <p v-if="!modelsPullable(activeSummary()) && (activeSummary()!.models ?? []).length"
                   class="chm-models__hint">
                  该渠道模型由客户端内置，无需拉取；勾选后点「保存」即可配置启用状态。
                </p>
                <p v-if="modelChanges.length" class="chm-models__dirty">
                  有 {{ modelChanges.length }} 处改动未保存，点右侧「保存」才会写入后台。
                </p>
                <!-- 卡片：与「模型管理」页同一套信息密度（名称 / 标签 / 启用开关） -->
                <div class="chm-model-cards" role="group" aria-label="模型配置">
                  <article
                    v-for="m in sortedModels"
                    :key="m.model"
                    class="chm-mcard"
                    :class="{ 'is-off': !modelEnabled(m) }"
                  >
                    <header class="chm-mcard__head">
                      <span class="chm-mcard__name" :title="m.model">{{ m.alias || m.model }}</span>
                      <span v-if="m.alias && m.alias !== m.model" class="chm-mcard__id" :title="m.model">{{ m.model }}</span>
                    </header>
                    <div class="chm-mcard__tags">
                      <span v-if="modelIsFree(m)" class="chm-mtag is-free">免费</span>
                      <span v-if="m.rate" class="chm-mtag is-rate" title="计费倍率">{{ m.rate }}x 倍率</span>
                      <span
                        v-if="modelPriceText(m)"
                        class="chm-mtag is-price"
                        :title="modelPriceTitle(m)"
                      >{{ modelPriceText(m) }}</span>
                      <span
                        v-if="m.contextWindow"
                        class="chm-mtag is-ctx"
                        :title="`上下文窗口 ${m.contextWindow} tokens`"
                      >{{ contextWindowText(m.contextWindow) }} 上下文</span>
                      <span
                        v-if="!modelIsFree(m) && !m.rate && !modelPriceText(m)"
                        class="chm-mtag is-unknown"
                        title="上游没有提供价格或倍率，未把它当成免费"
                      >价格未配置</span>
                    </div>
                    <footer class="chm-mcard__foot">
                      <span class="chm-mcard__state">{{ modelEnabled(m) ? '已启用' : '未启用' }}</span>
                      <el-switch
                        :model-value="modelEnabled(m)"
                        size="small"
                        @change="toggleModelChip(m)"
                      />
                    </footer>
                  </article>
                  <div v-if="!(activeSummary()!.models ?? []).length" class="chm-card__empty">
                    {{ modelsPullable(activeSummary()) ? '该渠道暂无模型，点「拉取模型」同步上游目录' : '该渠道未声明内置模型' }}
                  </div>
                </div>
              </div>
            </div>

            <!-- ════════ 任务 ════════ -->
            <div v-else-if="tab.name === 'tasks'" class="chm-panel__tabbody">
              <div v-if="!displayConnections(activeSummary()).length" class="chm-card__empty">
                先绑定账号，才能查看成长任务
              </div>
              <div
                v-for="conn in displayConnections(activeSummary())"
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
                :focus="focusProvider"
                :focus-alt="focusAlt"
                :preset="focusPreset"
                :preset-label="focusLabel"
                @changed="loadChannels()"
              />
            </div>

            <!-- ════════ 插件（网关型渠道） ════════ -->
            <div v-else-if="tab.name === 'plugins'" class="chm-panel__tabbody">
              <MagpiePluginPanel
                :channel="activeChannel"
                :connections="activeSummary()!.connections ?? []"
                :focus-spec="focusPluginSpec"
                :focus-name="focusPluginName"
                :focus-summary="focusPluginSummary"
                :focus-providers="focusPluginProviders"
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
      结构（2026-11 重构）：
        - #header：渠道身份（图标 + 名称 + 登录方式），不放计时器
        - 状态行：一句话说明「正在等什么 / 该做什么」，等待时右侧给秒数
        - 内容区：按登录方式只呈现用户当下要做的那一步
            设备码：授权码 + 复制 + 打开授权页
            扫码：二维码
            浏览器授权：打开授权页 + 链接兜底
            API key：带标签与说明的输入框 + 完成绑定
        - #footer：取消 / 重新发起
      拿到凭据（SSE done）自动关闭；用户在弹窗里不做任何账号粘贴（Loomy 微信扫码同其它渠道）。
    -->
    <ReDialog
      v-model="bindDialogVisible"
      width="520px"
      append-to-body
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      destroy-on-close
      class="chm-bind-dialog"
      @closed="closeBindDialog"
    >
      <!-- 头部：只留渠道身份与登录方式，不放计时器 / 仪表 -->
      <template #header>
        <div class="chm-bind__head">
          <span class="chm-bind__logo"
                :class="{ 'is-ico': !!brandOf(bindChannel).icon }"
                :style="brandOf(bindChannel).icon ? undefined : { background: brandOf(bindChannel).color }">
            <img v-if="brandOf(bindChannel).icon" :src="brandOf(bindChannel).icon" :alt="bindChannel" />
            <b v-else>{{ brandOf(bindChannel).glyph }}</b>
          </span>
          <div class="chm-bind__headtext">
            <b>{{ bindChannelLabel }}</b>
            <span>{{ brandOf(bindChannel).method || '账号绑定' }} · 绑定新账号</span>
          </div>
        </div>
      </template>

      <div class="chm-bind">
        <!-- 一句话状态：现在在做什么 / 该做什么，右侧只有安静的等待秒数 -->
        <div class="chm-bind__state" :class="'is-' + bindPhase">
          <span class="chm-bind__state-icon" aria-hidden="true" />
          <span class="chm-bind__state-text">{{ bindStatusText }}</span>
          <span v-if="bindPhase === 'waiting'" class="chm-bind__elapsed">已等待 {{ bindElapsed }}s</span>
        </div>

        <!-- 设备码：先给码，再给授权页入口 -->
        <section v-if="bindUserCode()" class="chm-bind__card">
          <p class="chm-bind__card-title">把授权码填到授权页</p>
          <div class="chm-bind__code-row">
            <b class="chm-bind__code-value">{{ bindUserCode() }}</b>
            <el-button size="small" @click="copyBindCode()">复制</el-button>
          </div>
          <p class="chm-bind__help">在授权页粘贴这串码并确认，完成后这里会自动关闭。</p>
        </section>

        <!-- 扫码 -->
        <section v-if="isQrBind() && qrImages[bindChannel]" class="chm-bind__card is-center">
          <img class="chm-bind__qr" :src="qrImages[bindChannel]" alt="登录二维码" />
          <p class="chm-bind__help">用微信「扫一扫」，在手机上确认授权。</p>
        </section>

        <!-- 授权页入口（设备码 / 浏览器授权） -->
        <section v-if="handleVerifyUrl(bindState[bindChannel]?.handle ?? {}) && !isQrBind() && !isApiKeyBind()"
                 class="chm-bind__cta">
          <el-button type="primary" class="chm-bind__wide"
                     @click="openAuthWindow(handleVerifyUrl(bindState[bindChannel]?.handle ?? {}))">
            打开授权页
          </el-button>
          <a class="chm-bind__link"
             :href="handleVerifyUrl(bindState[bindChannel]?.handle ?? {})"
             target="_blank" rel="noopener noreferrer">没有自动打开？点此进入</a>
        </section>

        <!-- 密钥 -->
        <section v-if="isApiKeyBind()" class="chm-bind__fields">
          <template v-if="bindChannel === 'magpie'">
            <label class="chm-bind__field">
              <span>网关地址</span>
              <el-input :model-value="bindState[bindChannel]?.input?.baseUrl ?? ''"
                        @input="onBaseUrlInput"
                        placeholder="http://127.0.0.1:3425" />
              <em>对话、模型与配额走这里；也可以整条粘贴 magpie 的启动链接。</em>
            </label>
            <label class="chm-bind__field">
              <span>页面地址</span>
              <el-input :model-value="bindState[bindChannel]?.input?.pageUrl ?? ''"
                        @input="onPageUrlInput"
                        placeholder="http://127.0.0.1:3430（可空）" />
              <em>只在管理上游与签到时使用；留空按网关地址推导。</em>
            </label>
            <label class="chm-bind__field">
              <span>页面 Key</span>
              <el-input :model-value="bindState[bindChannel]?.input?.pageKey ?? ''"
                        @input="onPageKeyInput"
                        placeholder="启动链接里的 k=…（可空）" />
            </label>
          </template>
          <label class="chm-bind__field">
            <span>{{ bindChannel === 'magpie' ? '网关 Key' : 'API Key' }}</span>
            <el-input :model-value="bindState[bindChannel]?.input?.apiKey ?? ''"
                      type="password"
                      show-password
                      @input="onApiKeyInput"
                      :placeholder="bindChannel === 'magpie'
                        ? '未开启鉴权可留空'
                        : '粘贴密钥；匿名通道填 public'" />
          </label>
          <el-button type="primary" class="chm-bind__wide" @click="submitBindInput()">完成绑定</el-button>
        </section>

        <!-- 回调没自动收到时的兜底 -->
        <section v-if="bindState[bindChannel]?.handle?.callbackListening === false" class="chm-bind__card">
          <p class="chm-bind__card-title">授权后没有自动完成？</p>
          <p class="chm-bind__help">把浏览器地址栏里的完整回调地址粘贴到这里。</p>
          <div class="chm-bind__row">
            <el-input :model-value="bindState[bindChannel]?.handle?.callbackUrl ?? ''"
                      @input="onCallbackUrlInput"
                      placeholder="http://127.0.0.1:…/authorize?…" />
            <el-button @click="submitBindInput()">提交</el-button>
          </div>
        </section>
      </div>

      <template #footer>
        <el-button text @click="closeBindDialog()">取消</el-button>
        <el-button :disabled="bindPhase === 'starting'" @click="restartBind()">重新发起</el-button>
      </template>
    </ReDialog>

    <!-- 添加渠道账号：与 Cookie 池 / AppKey 同款 ReDialog 表单 -->
    <ChannelAccountDialog
      v-model="accountDialogVisible"
      :channel-key="activeChannel"
      :channel-name="activeSummary()?.displayName"
      @saved="loadAccounts()"
    />

    <!--
      新增账号（Magpie 托管渠道）：登录会话由网关持有，这里只展示授权地址并轮询状态。
      授权页在浏览器里打开，不跳转到网关管理页。
    -->
    <MagpieAccountBindDialog
      v-model="magpieBindVisible"
      :channel="activeChannel"
      :channel-name="activeSummary()?.displayName"
      :gateway-channel="gatewayChannel?.channel ?? ''"
      :connection-id="gatewayConnectionId"
      :providers="activeMagpieProviders"
      @bound="onMagpieBound"
      @manage-upstream="onMagpieManageUpstream"
    />

    <!--
      网关设置：地址 / 页面 Key 是全部托管渠道共用的基础配置，单独一个入口。
      新电脑上还没装网关时，这里也能直接去下载页。
    -->
    <MagpieGatewaySettingsDialog
      v-model="gatewaySettingsVisible"
      :gateway-channel="gatewayChannel?.channel ?? ''"
      :connection-id="gatewayConnectionId"
      @saved="onGatewaySettingsSaved"
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
/* ============ 方案 A · 运维甲板（OPS·DECK） ============ */
.chm-deck {
  display: flex;
  /* 两栏之间只留分栏手柄本身，不再额外加缝（原来 8px + 手柄 = 12px 空档） */
  gap: 0;
  align-items: stretch;
  /* 吃掉 .chm 除页头外的全部剩余高度：左右两栏等高，右栏内部自己滚动 */
  flex: 1;
  min-height: 0;
}

/* 分栏手柄：常显一条 4px 圆角竖条 + 中间三点握把，hover / 拖拽加深 */
.chm-deck__split {
  flex: none;
  align-self: stretch;
  width: 11px;
  margin: 0 -1px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: col-resize;
  touch-action: none;
  outline: none;
}
.chm-deck__split::before {
  content: '';
  width: 4px;
  height: 44px;
  border-radius: 999px;
  background: var(--border-default, #e2e9f3);
  box-shadow: 0 0 0 1px var(--bg-container, #fff);
  transition: background-color .15s ease, height .15s ease;
}
.chm-deck__split::after {
  content: '';
  position: absolute;
  width: 2px;
  height: 22px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-image: radial-gradient(circle, var(--text-tertiary, #94a3b8) 1px, transparent 1.2px);
  background-size: 2px 6px;
  background-repeat: repeat-y;
  pointer-events: none;
}
.chm-deck__split:hover::before,
.chm-deck__split:focus-visible::before,
.chm-deck__split:active::before {
  background: var(--brand-500, #3b82f6);
  height: 72px;
}
.chm-deck__split:hover::after,
.chm-deck__split:active::after {
  background-image: radial-gradient(circle, #fff 1px, transparent 1.2px);
}

/* ---- 左：渠道索引 ---- */
.chm-rail {
  flex: none;
  /* 宽度由 railWidth 内联控制（可拖拽，存本地偏好）；这里只留兜底值 */
  width: 280px;
  min-width: 200px;
  max-width: 560px;
  border: 1px solid var(--border-default, #e2e9f3);
  border-radius: 12px;
  background: var(--bg-container, #fff);
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  /* 高度由 .chm-deck 的 stretch 决定（撑满）；滚动交给 .chm-rail__list，
     这样底部的网关入口能常驻，不被长渠道列表顶出视口 */
  min-height: 0;
  overflow: hidden;
}
.chm-rail__head {
  flex: none;
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
/* 渠道行滚动区：撑满标题与底部网关入口之间的空间 */
.chm-rail__list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
  /* 滚动条占位不挤压行宽，避免文字抖动 */
  margin-right: -2px;
  padding-right: 2px;
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
/* 拖拽排序：手柄在 hover 时显形，落点用顶部亮线提示 */
.chm-rail__grip {
  flex: none;
  width: 8px;
  opacity: 0;
  font-size: 11px;
  line-height: 1;
  color: var(--text-tertiary, #94a3b8);
  transition: opacity .12s ease;
}
.chm-rail__item:hover .chm-rail__grip {
  opacity: 1;
}
.chm-rail__item[draggable='true'] {
  cursor: grab;
}
.chm-rail__item.is-dragging {
  opacity: .45;
}
.chm-rail__item.is-drop-target {
  box-shadow: inset 0 2px 0 0 var(--brand-500, #3b82f6);
}
/* Magpie 托管分组：把已托管的 N 个渠道收敛成一行，展开才是子项 */
.chm-rail__item--group {
  color: var(--text-secondary, #475569);
}
.chm-rail__item--group.is-open {
  background: var(--bg-hover, #f1f5fb);
}
.chm-rail__logo.is-group {
  background: color-mix(in srgb, var(--brand-500, #3b82f6) 14%, transparent);
}
.chm-rail__logo.is-group b {
  color: var(--brand-500, #3b82f6);
}
.chm-rail__chev {
  flex: none;
  width: 12px;
  text-align: center;
  font-size: 11px;
  color: var(--text-tertiary, #94a3b8);
}
/* 托管行与普通渠道同版式；插件分组仍缩进一档表示归属 */
.chm-rail__item.is-plugin {
  padding-left: 18px;
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
/* 插件分组：与「托管」同形，但用青色图标区分「社区插件」语义 */
.chm-rail__logo.is-group.is-plugin {
  background: color-mix(in srgb, #0ea5a4 15%, transparent);
}
.chm-rail__logo.is-group.is-plugin b {
  color: #0d9488;
}
/* 行内小标：目前只给「明确免费」的插件（如 OpenCode Zen Free） */
.chm-rail__chip {
  flex: none;
  font-size: 10px;
  line-height: 1;
  padding: 2px 5px;
  border-radius: 4px;
  color: var(--text-secondary, #64748b);
  background: var(--fill-quaternary, #f1f5f9);
}
.chm-rail__chip.is-free {
  color: #0f766e;
  background: color-mix(in srgb, #14b8a6 16%, transparent);
}
.chm-rail__item.is-add-account .chm-rail__grip {
  opacity: 1;
  width: 10px;
}
/* 底部常驻入口组：新增账号 + 网关设置，与上面的渠道列表用一条分隔线隔开 */
.chm-rail__foot {
  flex: none;
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle, #eef2f8);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.chm-rail__item--util {
  color: var(--text-secondary, #475569);
}
.chm-rail__item--util .chm-rail__grip {
  opacity: 1;
  width: 10px;
}
.chm-rail__logo.is-add,
.chm-rail__logo.is-gateway {
  background: color-mix(in srgb, var(--brand-500, #3b82f6) 12%, transparent);
  color: var(--brand-500, #3b82f6);
  font-size: 15px;
}
.chm-rail__logo.is-gateway {
  color: var(--text-secondary, #475569);
  background: var(--fill-quaternary, #f1f5f9);
}
/* 网关里没有对应渠道行的上游：与业务渠道分开，用更浅的文字提示它们是「网关侧」的 */
.chm-rail__sect {
  margin: 8px 0 2px;
  padding: 0 8px 2px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .04em;
  color: var(--text-tertiary, #94a3b8);
}
.chm-rail__item--upstream .chm-rail__grip {
  opacity: 0;
}
.chm-rail__item--upstream:hover .chm-rail__grip {
  opacity: .8;
}
.chm-rail__logo.is-upstream {
  background: var(--fill-quaternary, #f1f5f9);
}
.chm-rail__logo.is-upstream b {
  color: var(--text-secondary, #475569);
}
/* 插件过滤：44 行不靠滚动找 */
.chm-rail__filter {
  padding: 2px 8px 6px 18px;
}
.chm-rail__filter input {
  width: 100%;
  height: 26px;
  padding: 0 8px;
  border: 1px solid var(--border-default, #e2e9f3);
  border-radius: 6px;
  background: var(--bg-container, #fff);
  color: var(--text-primary, #0f172a);
  font-size: 12px;
  outline: none;
}
.chm-rail__filter input:focus {
  border-color: var(--brand-500, #3b82f6);
}
.chm-rail__empty {
  margin: 0;
  padding: 6px 12px 8px 18px;
  font-size: 11.5px;
  color: var(--text-tertiary, #94a3b8);
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
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
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
/* 顶部额度汇总：与状态灯同级的读数，窄屏时换行不挤压标题 */
.chm-total {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.chm-total__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--border-subtle, #eef2f8);
  background: var(--bg-elevated, #f8fafc);
  font-size: 12px;
  color: var(--text-secondary, #475569);
  white-space: nowrap;
}
.chm-total__label {
  color: var(--text-tertiary, #94a3b8);
}
.chm-total__value {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary, #1e293b);
}
.chm-total__bar {
  position: relative;
  width: 64px;
  height: 5px;
  border-radius: 3px;
  background: var(--el-fill-color, #f0f2f5);
  overflow: hidden;
}
.chm-total__bar i {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: var(--el-color-primary, #409eff);
  transition: width 0.25s ease;
}
.chm-total__pct {
  font-size: 11px;
  color: var(--text-tertiary, #94a3b8);
  font-variant-numeric: tabular-nums;
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
/* 刷新按钮只留图标：圈与文字一起去掉 */
.chm-panel__pull--icon {
  width: 22px;
  height: 22px;
  padding: 0;
  display: inline-grid;
  place-items: center;
  border-radius: 6px;
  border: 1px solid var(--border-default, #e2e9f3);
  background: var(--bg-container, #fff);
  color: var(--text-secondary, #475569);
}
.chm-panel__pull--icon:hover:not(:disabled) {
  border-color: var(--brand-400, #60a5fa);
  color: var(--brand-600, #2563eb);
  background: var(--bg-hover, #f1f5fb);
}
.chm-panel__pull--icon:disabled {
  opacity: .55;
  cursor: not-allowed;
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
/*
 * 账号区一行三列：账号/连接是「看一眼状态」的密集信息，一行一个会被拉成整屏
 * 一张卡。窄屏按 2 列 / 1 列回收，避免卡片被压到读不清。
 */
.chm-accs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
@media (max-width: 1500px) {
  .chm-accs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 1100px) {
  .chm-accs {
    grid-template-columns: minmax(0, 1fr);
  }
}
/* 空态/说明行横跨整行，不被挤进第一列 */
.chm-accs > .chm-card__empty {
  grid-column: 1 / -1;
}
/* 文生图渠道的试出图面板：提示词 + 一行参数 + 结果网格 */
.chm-img__tip {
  margin-left: 6px;
  font-size: 12px;
  font-weight: 400;
  color: var(--text-tertiary, #94a3b8);
}
.chm-img__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 10px;
}
.chm-img__label {
  font-size: 12px;
  color: var(--text-secondary, #475569);
}
.chm-img__row {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 12px;
}
.chm-img__row .chm-img__field {
  margin-top: 10px;
}
.chm-img__field.is-inline {
  flex: none;
  width: 150px;
}
.chm-img__field.is-grow {
  flex: 1 1 240px;
  min-width: 200px;
  width: auto;
}
.chm-img__select {
  width: 100%;
}
.chm-img__run {
  margin-bottom: 1px;
}
.chm-img__error {
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-color-danger, #dc2626);
  word-break: break-word;
}
.chm-img__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}
.chm-img__shot {
  display: block;
  width: 180px;
  height: 180px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-default, #e2e9f3);
  background: var(--fill-quaternary, #f8fafc);
}
.chm-img__shot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.chm-models {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.chm-models__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
/* 模型管理工具栏：拉取 + 全选/反选/全不选，同行排列，不再被 margin-left: auto 挤向不太分明的位置 */
.chm-models__toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
}
.chm-models__op {
  border: 1px solid var(--border-default, #e2e9f3);
  background: var(--bg-container, #fff);
  color: var(--text-regular, #475569);
  border-radius: 6px;
  padding: 3px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: border-color .15s, color .15s;
}
.chm-models__op:hover:not(:disabled) {
  border-color: var(--brand-400, #60a5fa);
  color: var(--brand-600, #2563eb);
}
.chm-models__op:disabled {
  opacity: .55;
  cursor: not-allowed;
}
/* 内置模型说明：免登录 / 文生图渠道只读，不提供拉取与开关 */
.chm-models__hint {
  margin: 0 0 2px;
  font-size: 12px;
  color: var(--text-tertiary, #94a3b8);
}
/* 模型卡片网格：与「模型管理」页同一套信息密度（名称 / 标签 / 启用开关） */
.chm-model-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(232px, 1fr));
  align-items: start;
  gap: 10px;
}
.chm-model-cards > .chm-card__empty {
  grid-column: 1 / -1;
}
.chm-mcard {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 12px 10px;
  border: 1px solid var(--border-default, #e2e9f3);
  border-radius: 10px;
  background: var(--bg-container, #fff);
  overflow: hidden;
  transition: border-color .18s ease, box-shadow .18s ease, background-color .18s ease;
}
/* 顶部色带作为身份标记：启用为主色，停用降为灰阶 */
.chm-mcard::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  background: linear-gradient(90deg, var(--brand-500, #3b82f6), #6d28d9);
}
.chm-mcard.is-off::before {
  background: linear-gradient(90deg, var(--border-strong, #d3dceb), var(--border-subtle, #eef2f8));
}
.chm-mcard:hover {
  border-color: color-mix(in srgb, var(--brand-500, #3b82f6) 32%, var(--border-default, #e2e9f3));
  box-shadow: 0 4px 12px rgba(15, 23, 42, .06);
}
.chm-mcard.is-off {
  background: color-mix(in srgb, var(--el-fill-color-light, #f5f7fa) 60%, #fff);
}
.chm-mcard__head {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.chm-mcard__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #1e293b);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.chm-mcard.is-off .chm-mcard__name {
  color: var(--text-secondary, #64748b);
}
.chm-mcard__id {
  font-size: 11px;
  color: var(--text-tertiary, #94a3b8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.chm-mcard__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  min-height: 18px;
}
.chm-mtag {
  display: inline-flex;
  align-items: center;
  padding: 0 6px;
  border-radius: 999px;
  font-size: 10px;
  line-height: 18px;
  background: var(--el-fill-color, #f0f2f5);
  color: var(--text-secondary, #64748b);
  font-variant-numeric: tabular-nums;
}
.chm-mtag.is-free {
  background: color-mix(in srgb, var(--el-color-success, #67c23a) 15%, transparent);
  color: var(--el-color-success, #529b2e);
  font-weight: 600;
}
.chm-mtag.is-rate {
  background: color-mix(in srgb, var(--el-color-warning, #e6a23c) 15%, transparent);
  color: #b45309;
}
.chm-mtag.is-price {
  background: color-mix(in srgb, var(--el-color-primary, #409eff) 12%, transparent);
  color: var(--el-color-primary, #337ecc);
}
.chm-mtag.is-ctx {
  background: color-mix(in srgb, var(--el-fill-color, #f0f2f5) 70%, transparent);
}
.chm-mtag.is-unknown {
  background: transparent;
  border: 1px dashed var(--border-default, #e2e9f3);
  color: var(--text-tertiary, #94a3b8);
}
.chm-mcard__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle, #eef2f8);
}
.chm-mcard__state {
  font-size: 11px;
  color: var(--text-tertiary, #94a3b8);
}
.chm-mcard:not(.is-off) .chm-mcard__state {
  color: var(--brand-600, #2563eb);
}
/* 工具条：计数 / 分隔 / 主按钮 / 撤销 / 未保存提示 */
.chm-models__count {
  margin-left: 6px;
  font-size: 11px;
  font-weight: 400;
  color: var(--text-tertiary, #94a3b8);
}
.chm-models__sep {
  width: 1px;
  height: 16px;
  margin: 0 2px;
  background: var(--border-default, #e2e9f3);
}
.chm-models__op.is-primary {
  border-color: var(--brand-600, #2563eb);
  background: var(--brand-600, #2563eb);
  color: #fff;
}
.chm-models__op.is-primary:hover:not(:disabled) {
  border-color: var(--brand-500, #3b82f6);
  background: var(--brand-500, #3b82f6);
  color: #fff;
}
.chm-models__op.is-primary:disabled {
  border-color: var(--border-default, #e2e9f3);
  background: var(--el-fill-color, #f0f2f5);
  color: var(--text-tertiary, #94a3b8);
  opacity: 1;
}
.chm-models__op.is-ghost {
  border-color: transparent;
  background: transparent;
  color: var(--text-tertiary, #94a3b8);
}
.chm-models__dirty {
  margin: 0;
  font-size: 11.5px;
  color: var(--el-color-warning, #b45309);
}
.chm-acc {
  /* 卡片：身份头 + 积分条；本身不再是裸行 */
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1 1 auto;
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid var(--border-subtle, #eef2f8);
  border-radius: 10px;
  background: var(--bg-container, #fff);
  transition: border-color .15s, box-shadow .15s;
}
.chm-acc:hover {
  border-color: var(--border-default, #e2e9f3);
}
.chm-acc__avatar {
  flex: none;
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 700;
  color: var(--brand-600, #2563eb);
  background: color-mix(in srgb, var(--brand-500, #3b82f6) 12%, transparent);
}
.chm-acc__ident {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.chm-acc__titlerow {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.chm-acc__sub {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  color: var(--text-tertiary, #94a3b8);
}
.chm-acc__muted {
  color: var(--text-tertiary, #94a3b8);
}
.chm-acc__row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
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

/* 账号下方的积分块：额度 + 进度 + 签到 */
.chm-acc__credit {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--brand-500, #3b82f6) 3%, var(--bg-elevated, #f8fafc));
  border: 1px solid var(--border-subtle, #eef2f8);
}
.chm-acc__credit .chm-credit__head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.chm-acc__credit .chm-credit__label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary, #94a3b8);
  text-transform: uppercase;
  letter-spacing: .06em;
}
.chm-acc__credit .chm-credit__load {
  margin-left: auto;
  border: 0;
  background: transparent;
  color: var(--text-secondary, #475569);
  font-size: 11px;
  cursor: pointer;
}
.chm-acc__credit .chm-credit__load:hover:not(:disabled) {
  color: var(--brand-600, #2563eb);
}
.chm-acc__credit .chm-credit__load:disabled {
  opacity: .55;
  cursor: not-allowed;
}
.chm-acc__credit .chm-credit__error {
  margin: 0;
  font-size: 11.5px;
  color: var(--el-color-danger, #f56c6c);
}
/* 积分卡（「积分」页签） */
.chm-credit {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--border-subtle, #eef2f8);
  border-radius: 10px;
  background: var(--bg-container, #fff);
}
.chm-credit__top {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}
.chm-credit__caption {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary, #94a3b8);
  text-transform: uppercase;
  letter-spacing: .06em;
}
.chm-credit__top .chm-credit__value {
  font-size: 19px;
}
.chm-credit__pct {
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--brand-700, #1d4ed8);
  background: color-mix(in srgb, var(--brand-500, #3b82f6) 12%, transparent);
}
.chm-credit__pct.is-low {
  color: var(--el-color-danger, #f56c6c);
  background: color-mix(in srgb, var(--el-color-danger, #f56c6c) 12%, transparent);
}
/* 积分请求失败时给出原因（缺凭据 / 上游拒绝），不要只留一个空块 */
.chm-credit__error {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-color-danger, #f56c6c);
}
/* 积分页签里签到直接挂在顶部行尾，与数值同一行 */
.chm-credit__top > .chm-credit__checkin {
  margin-left: auto;
  align-self: center;
}
.chm-credit__ops {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.chm-credit__icon {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 1px solid var(--border-default, #e2e9f3);
  border-radius: 6px;
  background: var(--bg-container, #fff);
  color: var(--text-secondary, #475569);
  cursor: pointer;
  transition: border-color .15s, color .15s;
}
.chm-credit__icon:hover:not(:disabled) {
  border-color: var(--brand-400, #60a5fa);
  color: var(--brand-600, #2563eb);
}
.chm-credit__icon:disabled {
  opacity: .55;
  cursor: not-allowed;
}
.chm-credit__pkg {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid var(--border-subtle, #eef2f8);
  background: var(--bg-elevated, #f8fafc);
  font-size: 11.5px;
  color: var(--text-regular, #475569);
  font-variant-numeric: tabular-nums;
}
.chm-credit__pkg b {
  font-weight: 500;
  color: var(--text-secondary, #64748b);
}
.chm-credit__checkin {
  border: 1px solid var(--brand-600, #2563eb);
  background: var(--brand-600, #2563eb);
  color: #fff;
  border-radius: 6px;
  padding: 3px 14px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color .15s;
}
.chm-credit__checkin:hover:not(:disabled) {
  background: var(--brand-500, #3b82f6);
}
.chm-credit__checkin:disabled {
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
/* 新增入口容器（固定账号绑定 / 网关托管新增账号） */
.chm-panel__binds {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
/* 网关管理的次级入口：不抢「新增账号」的位置 */
.chm-panel__bindlink {
  align-self: flex-start;
  padding: 0;
  border: none;
  background: transparent;
  font-size: 12px;
  color: var(--text-tertiary, #94a3b8);
  cursor: pointer;
}
.chm-panel__bindlink:hover {
  color: var(--brand-600, #2563eb);
  text-decoration: underline;
}

/* ---------- 绑定弹窗（ReDialog 重构） ---------- */
/* 外壳：ReDialog 默认 layout=el 是素面 Element 弹窗，这里补「运维甲板」风格外壳 */
.chm-bind-dialog {
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--border-default, #e2e9f3);
  box-shadow: 0 24px 60px rgba(15, 23, 42, .16);
}
.chm-bind-dialog :deep(.el-dialog__header) {
  padding: 18px 22px 14px;
  margin-right: 0;
  border-bottom: 1px solid var(--border-subtle, #eef2f8);
}
.chm-bind-dialog :deep(.el-dialog__headerbtn) {
  top: 18px;
  right: 18px;
}
.chm-bind-dialog :deep(.el-dialog__body) {
  padding: 18px 22px 6px;
}
.chm-bind-dialog :deep(.el-dialog__footer) {
  padding: 4px 22px 18px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.chm-bind {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 头部：渠道身份 + 登录方式 */
.chm-bind__head {
  display: flex;
  align-items: center;
  gap: 12px;
}
.chm-bind__logo {
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 17px;
  font-weight: 700;
  overflow: hidden;
}
.chm-bind__logo.is-ico {
  background: #fff;
  border: 1px solid var(--border-subtle, #eef2f8);
}
.chm-bind__logo img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}
.chm-bind__logo b {
  color: #fff;
  font-size: 15px;
}
.chm-bind__headtext {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.chm-bind__headtext > b {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.chm-bind__headtext > span {
  font-size: 12px;
  color: var(--text-secondary, #475569);
}

/* 一句话状态行 */
.chm-bind__state {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border: 1px solid var(--border-subtle, #eef2f8);
  border-radius: 9px;
  background: var(--bg-elevated, #f8fafc);
  font-size: 13px;
  color: var(--text-regular, #475569);
}
.chm-bind__state.is-error {
  border-color: color-mix(in srgb, var(--el-color-danger, #f56c6c) 40%, transparent);
  background: color-mix(in srgb, var(--el-color-danger, #f56c6c) 5%, transparent);
  color: var(--el-color-danger, #f56c6c);
}
.chm-bind__state-icon {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--brand-500, #3b82f6);
  animation: chm-pulse 1.2s ease-in-out infinite;
}
.chm-bind__state.is-error .chm-bind__state-icon {
  background: var(--el-color-danger, #f56c6c);
  animation: none;
}
.chm-bind__state-text {
  flex: 1;
  min-width: 0;
}
.chm-bind__elapsed {
  flex: none;
  font-size: 11.5px;
  color: var(--text-tertiary, #94a3b8);
  font-variant-numeric: tabular-nums;
}
@keyframes chm-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .25; }
}

/* 阶段卡片 */
.chm-bind__card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  border: 1px solid var(--border-subtle, #eef2f8);
  border-radius: 10px;
  background: var(--bg-elevated, #f8fafc);
}
.chm-bind__card.is-center {
  align-items: center;
  text-align: center;
}
.chm-bind__card-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #0f172a);
}
.chm-bind__help {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-tertiary, #94a3b8);
}
.chm-bind__code-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.chm-bind__code-value {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 26px;
  letter-spacing: 3px;
  padding: 5px 12px;
  border: 1px dashed var(--border-default, #e2e9f3);
  border-radius: 8px;
  background: var(--bg-container, #fff);
  color: var(--text-primary, #0f172a);
  user-select: all;
}
.chm-bind__qr {
  width: 200px;
  height: 200px;
  border: 1px solid var(--border-subtle, #eef2f8);
  border-radius: 10px;
  background: #fff;
}
.chm-bind__cta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.chm-bind__wide {
  width: 100%;
}
.chm-bind__link {
  text-align: center;
  font-size: 12px;
  color: var(--brand-600, #2563eb);
  text-decoration: none;
}
.chm-bind__link:hover {
  text-decoration: underline;
}

/* 密钥表单 */
.chm-bind__fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.chm-bind__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12.5px;
}
.chm-bind__field > span {
  font-weight: 600;
  color: var(--text-primary, #0f172a);
}
.chm-bind__field > em {
  font-style: normal;
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--text-tertiary, #94a3b8);
}
.chm-bind__row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.chm-empty__hint {
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}

</style>
