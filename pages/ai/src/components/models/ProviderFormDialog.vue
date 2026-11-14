<script setup lang="ts">
import { message } from "@repo/core";
import { ref, reactive, watch, computed } from 'vue'

import {
  Add24Regular, Link24Regular, Eye24Regular, EyeOff24Regular, Delete24Regular,
  Info24Regular, Key24Regular, ChevronDown24Regular, CloudCheckmark24Regular,
  CloudArrowDown24Regular, Folder24Regular, Search24Regular, BranchFork24Regular,
} from '@vicons/fluent'
import { useI18n } from 'vue-i18n'
import ReSelect from '@repo/ui/re-select'
import ReInputNumber from '@repo/ui/re-input-number'
import ReDialog from '@repo/ui/re-dialog'
import ProviderLogo from './ProviderLogo.vue'
import OnnxExternalDialog from './OnnxExternalDialog.vue'
import { apiService } from '../../services/ApiService'
import { adminApi } from '@/framework/context'
import { KEY_STRATEGIES, AUTH_SCHEMES, DEFAULT_AUTH_SCHEME, deriveAuthMode, isChannelProvider, CHANNEL_PROVIDER_IDS } from './model.constants'
import { parseHeaders, validateHeadersText, resolveProviderBrand, headersToText } from './model.utils'
import { channelApi, type ChannelSummary } from '@/services/javaApi'
import { ReRadioGroup, ReRadioButton } from "@repo/ui/re-kit";

const { t } = useI18n()

const emit = defineEmits<{ saved: []; back: []; goToChannelManagement: [] }>()

const dialogVisible = ref(false)
const isEditMode = ref(false)
const providerId = ref('')
const providerType = ref('')
const testing = ref(false)
const testResult = ref<null | { success: boolean; message: string }>(null)

// API 地址 suffix 的「检测协议」：对同一地址按 4 种协议各发一次只读探测；
// 判定口径：只要不是 404 都算该协议形态被支持（405/401 等也显示可用）
const detectVisible = ref(false)
const detecting = ref(false)
// 探测请求序号：重开表单 / 换供应商时自增，迟到的旧结果据此丢弃
const detectSeq = ref(0)
// 上一轮探测用的地址：地址一改，结果就该作废
const detectUrl = ref('')
const detectRows = ref<{ protocol: string; label: string; icon: string; ok: boolean; message: string; url?: string }[]>([])
const detectFoot = ref('')
/**
 * 检测结果行状态，三档分开看：
 * <ul>
 *   <li>{@code ok} 任意非 404 响应（含 401/403/405/429/5xx）—— 端点存在、协议形态对；</li>
 *   <li>{@code na} 404 —— 该地址下没有此协议的模型列表端点，是正常结论，不是故障；</li>
 *   <li>{@code bad} 连不上 —— DNS/拒连/TLS/超时等网络异常，这才是真异常。</li>
 * </ul>
 */
function detectRowState(row: { ok: boolean; message: string }): 'ok' | 'na' | 'bad' {
  if (row.ok) {
    return 'ok'
  }
  return String(row.message || '').includes('404') ? 'na' : 'bad'
}
const DETECT_STATE_LABEL: Record<'ok' | 'na' | 'bad', string> = { ok: '可用', na: '不支持', bad: '连不上' }

/**
 * 余额查询方式（extra.credit_kind）。
 *
 * <p>{@code auto} 不落库：后端按「厂商官方 → OpenAI 官方 → new-api → sub2api」
 * 自动回落，第一条查到数的胜出。其余值直接指定唯一实现，并可覆盖地址与字段表达式。
 * 实现在 datasearch-starter 的 credit SPI 里，与渠道管理页共用同一套口径。</p>
 */
const CREDIT_KINDS = [
  { value: 'auto', label: '自动识别（推荐）', short: '自动' },
  { value: 'new-api', label: 'new-api / one-api 中转站', short: 'new-api' },
  { value: 'sub2api', label: 'sub2api 中转站', short: 'sub2api' },
  { value: 'host', label: '厂商官方（DeepSeek / Moonshot / 硅基流动 / OpenRouter）', short: '厂商官方' },
  { value: 'openai', label: 'OpenAI 官方', short: 'OpenAI' },
  { value: 'expression', label: '自定义地址 + 字段表达式', short: '自定义' },
]
const apiKeyList = ref<string[]>([])
const showKey = ref<Record<number, boolean>>({})

/** 本地推理提供商（ONNX）：apikey 语义是本地模型路径，而非远程密钥 */
const isLocalProvider = computed(() => (providerType.value || '').toLowerCase().includes('onnx'))
/** 本地模型路径（仅本地提供商使用，最终写入 apiKey 字段） */
const localModelPath = ref('')
/** ONNX 真实模型根目录（后端 /providers 回传的 model_root，绝对路径；只读展示） */
const providerModelRoot = ref('')
/** 绑定外部模型目录弹窗（ONNX 专属：本地目录只能在这里登记） */
const externalVisible = ref(false)

const form = reactive({
  name: '',
  protocol: 'openai',
  apiUrl: '',
  apiKey: '',
  proxyUrl: '',
  loadStrategy: 'failover',
  autoSwitchOnRateLimit: true,
  customHeaders: '',
  existingKeyCount: 0,
  existingKeyMask: '',
  // 认证方式：UI 值（见 AUTH_SCHEMES），落库时拆成 auth_scheme + extra.auth_header/auth_prefix
  authMode: DEFAULT_AUTH_SCHEME,
  authHeader: 'api-key',
  authPrefix: '',
  // 推理设备（仅本地 ONNX 提供商）：auto / cpu / gpu，落库到 extra.device；云端提供商不涉及
  device: 'auto',
  // 多协议端点（extra.endpoints）：按模型协议覆盖上游地址，留空跟随 apiUrl
  endpoints: { openai: '', 'openai-response': '', anthropic: '' } as Record<string, string>,
  // 额外请求体（extra.extra_body，JSON 文本）：整段并入出站请求
  extraBodyText: '',
  // 透传头（extra.passthrough_request_headers / passthrough_response_headers，逗号分隔）
  passthroughReq: '',
  passthroughResp: '',
  // 用量/指标接口（extra.metrics_url）：拉价格、延迟等指标数据的端点
  metricsUrl: '',
  // 余额查询口径（extra.credit_kind / credit_url / credit_expression）：auto 不落库，
  // 由后端按厂商与地址自动回落；选了具体实现才写这三个键
  creditKind: 'auto',
  creditUrl: '',
  creditExpression: '',
  // 供应商级限流（extra.max_concurrency / max_accounts / requests_per_minute），null = 不限制
  maxConcurrency: null as number | null,
  maxAccounts: null as number | null,
  rpm: null as number | null,
})

/** 编辑态下保留的原始 extra，保存时合并回去，避免覆盖掉本表单不管理的键 */
const origExtra = ref<Record<string, any>>({})

const selectedTemplate = ref<any>(null)

/** 当前认证方式对应的落库三元组 */
const resolvedAuth = computed(() => {
  const opt = AUTH_SCHEMES.find((s) => s.value === form.authMode) || AUTH_SCHEMES[0]
  // 「自定义请求头」用表单里手填的头名与前缀，其余方式用选项自带的固定值
  if (form.authMode === 'custom') {
    return { authScheme: opt.authScheme, authHeader: form.authHeader.trim(), authPrefix: form.authPrefix }
  }
  return { authScheme: opt.authScheme, authHeader: opt.authHeader, authPrefix: opt.authPrefix }
})

/** 当前选项的说明文案，用于表单下方提示 */
const authHint = computed(
  () => (AUTH_SCHEMES.find((s) => s.value === form.authMode) || AUTH_SCHEMES[0]).description,
)

// ---------- 账号渠道识别 ----------

/**
 * 是否为账号渠道类 provider（平台 ∈ CHANNEL_PROVIDER_IDS 或 auth_scheme === 'oauth'）。
 * 渠道 provider 不走 API Key 输入，改走渠道管理页的账号绑定；表单内只读回显 + 跳转入口。
 */
const isChannelProviderFlag = ref(false)

/** 当前渠道已绑定的账号列表（编辑态回显用，从 channelApi.list() 拉取） */
const channelConnections = ref<ChannelSummary[]>([])

/** 拉取渠道账号列表（编辑态打开时调用；失败不影响表单） */
async function loadChannelConnections(channelId: string) {
  try {
    const res = await channelApi.list()
    const data = (res as any)?.data ?? res
    const all: ChannelSummary[] = Array.isArray(data) ? data : []
    const hit = all.find((c) => c.channel === channelId)
    channelConnections.value = hit ? [hit] : []
  } catch {
    channelConnections.value = []
  }
}

/** 渠道 provider 对应的 channel 标识（platform 值） */
const channelProviderId = computed(() => {
  const brand = String(providerType.value || '').toLowerCase()
  return CHANNEL_PROVIDER_IDS.has(brand) ? brand : ''
})

/** 高级设置折叠时的摘要：不用展开也知道配了什么，避免「看着空白其实配了一堆」 */
const advancedSummary = computed(() => {
  const parts: string[] = []
  const headerCount = splitList(form.customHeaders).length
  if (headerCount) parts.push(`请求头 ${headerCount}`)
  const endpointCount = ['openai', 'openai-response', 'anthropic'].filter((k) => (form.endpoints[k] || '').trim()).length
  if (endpointCount) parts.push(`端点 ${endpointCount}`)
  if (form.extraBodyText.trim()) parts.push('附加请求体')
  if (splitList(form.passthroughResp).length) parts.push('透传响应头')
  if (splitList(form.passthroughReq).length) parts.push('透传请求头')
  if (form.metricsUrl.trim()) parts.push('用量接口')
  if (form.creditKind && form.creditKind !== 'auto') {
    const hit = CREDIT_KINDS.find((k) => k.value === form.creditKind)
    parts.push(`余额 ${hit ? hit.short : form.creditKind}`)
  }
  if (proxyMode.value === 'custom') parts.push('自定义代理')
  if (form.maxConcurrency) parts.push(`并发 ${form.maxConcurrency}`)
  if (form.maxAccounts) parts.push(`账号 ${form.maxAccounts}`)
  if (form.rpm) parts.push(`${form.rpm}/分`)
  return parts
})

/** 额外请求体：空返回 null；非法 JSON 也返回 null（保存前单独拦并提示） */
function parseExtraBody(): Record<string, any> | null {
  const text = form.extraBodyText.trim()
  if (!text) return null
  try {
    const parsed = JSON.parse(text)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

/** 逗号 / 换行分隔的名单 */
function splitList(text: string): string[] {
  return String(text || '').split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
}

/** 名单回显成一行文本 */
function listToText(value: any): string {
  if (Array.isArray(value)) return value.filter(Boolean).join(', ')
  return typeof value === 'string' ? value : ''
}

/** 正整数或 null（0 / 空 / 非法都按「不限制」） */
function numOrNull(value: any): number | null {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : null
}

/**
 * 组装供应商扩展配置。
 *
 * 自定义请求头的键名必须是 {@code custom_headers}：后端
 * ModelClientResolver / AiChatFacadeServiceImpl / AiBotChatService / SysAiAgentServiceImpl
 * 四处都只读这个键，历史上前端写的是 headers，导致请求头被静默丢弃。
 */
const buildExtra = () => {
  const auth = resolvedAuth.value
  const extra: Record<string, any> = {
    ...origExtra.value,
    load_strategy: form.loadStrategy,
    auto_switch_on_rate_limit: form.autoSwitchOnRateLimit,
    custom_headers: parseHeaders(form.customHeaders),
  }
  // 多协议端点：只落有值的协议，空值删键（避免把历史端点留成脏数据）
  const endpoints: Record<string, string> = {}
  for (const key of ['openai', 'openai-response', 'anthropic']) {
    const url = (form.endpoints[key] || '').trim()
    if (url) endpoints[key] = url
  }
  if (Object.keys(endpoints).length) extra.endpoints = endpoints
  else delete extra.endpoints
  // 额外请求体：合法 JSON 对象才落库（保存前已校验）
  const extraBody = parseExtraBody()
  if (extraBody) extra.extra_body = extraBody
  else delete extra.extra_body
  // 用量/指标接口：空则删键（后端 metrics_url 为空表示该供应商不支持指标拉取）
  const metricsUrl = form.metricsUrl.trim()
  if (metricsUrl) extra.metrics_url = metricsUrl
  else delete extra.metrics_url
  // 余额查询口径：auto 不落库（后端按厂商与地址自动回落），选了实现才写键
  if (form.creditKind && form.creditKind !== 'auto') extra.credit_kind = form.creditKind
  else delete extra.credit_kind
  const creditUrl = form.creditUrl.trim()
  if (creditUrl) extra.credit_url = creditUrl
  else delete extra.credit_url
  const creditExpression = form.creditExpression.trim()
  if (creditExpression) extra.credit_expression = creditExpression
  else delete extra.credit_expression
  // 透传头：逗号/换行分隔，数组落库
  for (const [field, key] of [['passthroughReq', 'passthrough_request_headers'],
    ['passthroughResp', 'passthrough_response_headers']] as const) {
    const list = splitList(form[field])
    if (list.length) extra[key] = list
    else delete extra[key]
  }
  // 供应商级限流：null / 0 一律删键（不限制就是不写配置）
  for (const [field, key] of [['maxConcurrency', 'max_concurrency'],
    ['maxAccounts', 'max_accounts'], ['rpm', 'requests_per_minute']] as const) {
    const value = form[field]
    if (value != null && value > 0) extra[key] = value
    else delete extra[key]
  }
  // 推理设备仅本地 ONNX 有意义：auto 视为默认不落库，避免把 auto 写进 extra
  if (isLocalProvider.value && form.device && form.device !== 'auto') extra.device = form.device
  else delete extra.device
  // 空值一律删除，避免把 auth_header='' 这种「覆盖成空头名」的脏数据写进库
  if (auth.authHeader) extra.auth_header = auth.authHeader
  else delete extra.auth_header
  if (auth.authPrefix) extra.auth_prefix = auth.authPrefix
  else delete extra.auth_prefix
  // 免费渠道：模型目录不在上游，路由表（extra.routes）是本表单唯一来源，
  // 不管是新增还是编辑，行清单就是路由表的全部；非免费渠道则保留 origExtra 里的路径
  if (isFreeChannelProvider.value) {
    const routes = routesFromRows(formRoutes.value)
    if (Object.keys(routes).length) {
      extra.routes = routes
    } else {
      delete extra.routes
    }
  } else {
    delete extra.routes
  }
  return extra
}

watch(apiKeyList, (list) => {
  form.apiKey = list.filter(k => k.trim()).join(',')
})

/**
 * 单条免费渠道路由（extra.routes 的编辑态表示）。
 *
 * <p>key 是模型标识（模型名 / 模型名前缀），路由目标按
 * {@code { provider, base_url, api_key }} 覆盖上游地址与凭据；
 * api_key 留空时由客户端回落到供应商维度的全局 Key。</p>
 */
interface RouteTableRow {
  /** 路由 key（模型名 / 模型名前缀，也是模型列表行里露出的模型名） */
  key: string
  /** 上游 provider 标识（openai、kilo、openrouter …，留空按 OpenAI 兼容协议） */
  provider: string
  /** 上游基础地址 */
  baseUrl: string
  /** 该目标的 API Key（留空 = 沿用供应商全局 Key） */
  apiKey: string
}

/** 当前供应商是否是免费渠道：只有它能按模型名路由到不同上游 */
const isFreeChannelProvider = computed(() => {
  const brand = String(providerType.value || '').toLowerCase()
  return brand === 'free-channel' || brand === 'free'
})

/** 当前供应商是否是路由组：没有真实上游地址与凭证，成员来自模型库，策略在组内维护 */
const isRouterGroupProvider = computed(() => String(providerType.value || '').toLowerCase() === 'router-group')

/** 路由表编辑行：点击「添加」时新增，保存时写回 extra.routes */
const formRoutes = ref<RouteTableRow[]>([])

/** 路由表提示（格式错误 / 重复 key 等错误信息，保存时一起提示） */
const routeHint = ref<string>('')

/** 把 extra.routes 映射为可编辑行（字段名同时兼容下划线/驼峰） */
const rowsFromRoutes = (routes: any): RouteTableRow[] => {
  if (!routes || typeof routes !== 'object') return []
  return Object.entries(routes).map(([key, target]: [string, any]) => ({
    key: String(key).trim(),
    provider: String(target?.provider || target?.protocol || '').trim(),
    baseUrl: String(target?.base_url || target?.baseUrl || target?.url || target?.endpoint || '')
      .trim(),
    apiKey: String(target?.api_key || target?.apiKey || '').trim(),
  }))
}

/**
 * 把可编辑行写回 extra.routes。
 *
 * <p>丢弃无 key / 无可用目标的行，行内同 key 只留第一条，结构符合后端
 * {@link ProviderRouteTargets} 的解析约定（provider / base_url / api_key）。</p>
 */
const routesFromRows = (rows: RouteTableRow[]): Record<string, any> => {
  const out: Record<string, any> = {}
  const seen = new Set<string>()
  for (const r of rows) {
    const key = String(r.key || '').trim()
    if (!key || seen.has(key)) continue
    const target: Record<string, any> = {
      provider: String(r.provider || '').trim(),
      base_url: String(r.baseUrl || '').trim(),
      api_key: String(r.apiKey || '').trim(),
    }
    if (!Object.values(target).some(Boolean)) continue
    seen.add(key)
    out[key] = target
  }
  return out
}

/**
 * 路由表保存前校验（不阻断保存，只汇报问题）。
 *
 * <p>dup key / 空 key 是写坏库的干因素：空 key 行被丢弃，同 key 只留一条，
 * 多余信息静默丢失。error 置位后保存按钮依旧可用。</p>
 */
const validateRoutes = () => {
  routeHint.value = ''
  const rows = formRoutes.value.filter(r => String(r.key || '').trim())
  const keys = rows.map((r) => String(r.key || '').trim())
  const seen = new Set<string>()
  const dup = keys.find((k) => seen.has(k) || seen.add(k))
  if (dup) {
    routeHint.value = '路由表存在重复 key：' + dup
    return false
  }
  if (!rows.length) {
    routeHint.value = '未配置路由表：所有模型名会回落到供应商的默认（base_url）地址'
    return true
  }
  return true
}

/** 新增一条空路由行 */
const addRouteRow = () => formRoutes.value.push({ key: '', provider: '', baseUrl: '', apiKey: '' })

/** 删除一行，行内同 key 只留第一条 */
const removeRouteRow = (idx: number) => formRoutes.value.splice(idx, 1)

const resetForm = () => {
  Object.assign(form, {
    name: '', protocol: 'openai', apiUrl: '', apiKey: '', proxyUrl: '',
    loadStrategy: 'failover', autoSwitchOnRateLimit: true, customHeaders: '',
    existingKeyCount: 0, existingKeyMask: '',
    authMode: DEFAULT_AUTH_SCHEME, authHeader: 'api-key', authPrefix: '',
    device: 'auto',
    endpoints: { openai: '', 'openai-response': '', anthropic: '' },
    extraBodyText: '', passthroughReq: '', passthroughResp: '',
    maxConcurrency: null, maxAccounts: null, rpm: null,
    metricsUrl: '',
    creditKind: 'auto', creditUrl: '', creditExpression: '',
  })
  apiKeyList.value = []
  localModelPath.value = ''
  providerModelRoot.value = ''
  externalVisible.value = false
  testResult.value = null
  showKey.value = {}
  selectedTemplate.value = null
  origExtra.value = {}
  formRoutes.value = []
  routeHint.value = ''
  proxyCustom.value = false
  // 检测协议结果是「这一次地址」的探测记录：换一家供应商还留着上一家的结果
  // 会让人以为新地址已经测过（实测：重开编辑弹框仍显示旧的四行）。
  detectSeq.value++ // 使仍在飞行中的旧探测请求作废
  detectVisible.value = false
  detecting.value = false
  detectRows.value = []
  detectFoot.value = ''
  detectUrl.value = ''
  // 每次打开表单都从折叠态开始：上一家的「高级」展开状态不该带到新供应商
  advancedOpen.value = false
}

const openCreate = () => {
  resetForm()
  isEditMode.value = false
  providerId.value = ''
  providerType.value = 'custom'
  apiKeyList.value = [''] // 默认展示一个 Key 输入框，贴合单 Key 主流程
  dialogVisible.value = true
}

const openFromTemplate = (template: any) => {
  resetForm()
  isEditMode.value = false
  providerId.value = ''
  providerType.value = template.id
  selectedTemplate.value = template
  form.name = template.name
  form.protocol = template.protocol
  form.apiUrl = template.defaultApiUrl || template.defaultUrl || ''
  // 模板可声明该供应商要求的认证方式（如 Dots Studio 只认 api-key 请求头）
  form.authMode = template.defaultAuthMode || DEFAULT_AUTH_SCHEME
  form.authHeader = template.defaultAuthHeader || 'api-key'
  form.authPrefix = template.defaultAuthPrefix || ''
  apiKeyList.value = [''] // 选模板后直接填自己的 Key
  dialogVisible.value = true
}

const openEdit = (provider: any) => {
  resetForm()
  isEditMode.value = true
  providerId.value = provider.id
  const brand = provider.provider || provider.platform || 'custom'
  providerType.value = brand
  form.name = provider.name
  form.protocol = provider.protocol || 'openai'
  form.apiUrl = provider.apiUrl || provider.base_url || provider.url || ''
  // ONNX 的 base_url 是后端写死的占位值（ai.onnx.base-url，默认 http://127.0.0.1:8080/v1），
  // 与本地推理毫无关系；真实位置是 model_root（绝对路径）。表单里不回显占位 URL，
  // 改为只读展示 model_root，避免用户误以为要填 http 地址。
  providerModelRoot.value = String(provider.model_root || '').trim()
  if (isLocalProvider.value) {
    form.apiUrl = ''
  }
  form.proxyUrl = provider.proxy || provider.proxyUrl || ''
  form.loadStrategy = provider.extra?.load_strategy || provider.loadStrategy || 'failover'
  form.autoSwitchOnRateLimit = provider.extra?.auto_switch_on_rate_limit !== false
  // 后端把自定义请求头存在 extra.custom_headers（不是 extra.headers），旧键名读不到任何东西
  form.customHeaders = provider.customHeaders || headersToText(provider.extra?.custom_headers) || ''
  // 认证方式回显：由 auth_scheme + extra.auth_header/auth_prefix 反推表单值
  origExtra.value = (provider.extra && typeof provider.extra === 'object') ? { ...provider.extra } : {}
  // 推理设备回显（仅本地 ONNX 用）：读 extra.device，默认 auto
  form.device = origExtra.value.device || 'auto'
  // 端点 / 额外请求体 / 透传头 / 限流回显
  const ep = (origExtra.value.endpoints && typeof origExtra.value.endpoints === 'object')
    ? origExtra.value.endpoints : {}
  form.endpoints = {
    openai: String(ep.openai || ''),
    'openai-response': String(ep['openai-response'] || ep.responses || ''),
    anthropic: String(ep.anthropic || ''),
  }
  form.extraBodyText = origExtra.value.extra_body && typeof origExtra.value.extra_body === 'object'
    ? JSON.stringify(origExtra.value.extra_body, null, 2) : ''
  form.passthroughReq = listToText(origExtra.value.passthrough_request_headers)
  form.passthroughResp = listToText(origExtra.value.passthrough_response_headers)
  form.metricsUrl = String(origExtra.value.metrics_url || '')
  form.creditKind = String(origExtra.value.credit_kind || 'auto')
  form.creditUrl = String(origExtra.value.credit_url || '')
  form.creditExpression = String(origExtra.value.credit_expression || '')
  form.maxConcurrency = numOrNull(origExtra.value.max_concurrency)
  form.maxAccounts = numOrNull(origExtra.value.max_accounts)
  form.rpm = numOrNull(origExtra.value.requests_per_minute)
  form.authMode = deriveAuthMode(
    provider.authScheme ?? provider.auth_scheme,
    provider.authHeader ?? provider.extra?.auth_header,
    provider.authPrefix ?? provider.extra?.auth_prefix,
  )
  form.authHeader = provider.authHeader || provider.extra?.auth_header || 'api-key'
  form.authPrefix = provider.authPrefix || provider.extra?.auth_prefix || ''
  form.existingKeyCount = provider.api_key_count ?? provider.api_keys?.length ?? 0
  form.existingKeyMask = provider.api_key_mask || provider.apiKeyMask || ''
  apiKeyList.value = [...(provider.api_keys || provider.apiKeyList || [])]
  // 本地推理（ONNX）：apikey 存的就是本地模型路径，回填到路径输入框
  if ((brand || '').toLowerCase().includes('onnx')) {
    localModelPath.value = provider.api_keys?.[0] || provider.apiKeyList?.[0] || ''
  } else {
    localModelPath.value = ''
  }
  // 账号渠道识别：platform ∈ CHANNEL_PROVIDER_IDS 或 auth_scheme='oauth'
  isChannelProviderFlag.value = isChannelProvider(provider)
  if (isChannelProviderFlag.value) {
    const channelId = channelProviderId.value || String(brand).toLowerCase()
    loadChannelConnections(channelId)
  } else {
    channelConnections.value = []
  }
  // 免费渠道：模型目录是 extra.routes 路由表（不是上游 /models），
  // 路由表的维护入口就是本表单：行清单是 extra.routes 的唯一来源
  formRoutes.value = rowsFromRoutes(provider.extra?.routes)
  if (!isFreeChannelProvider.value) formRoutes.value = []
  dialogVisible.value = true
}

defineExpose({ openCreate, openFromTemplate, openEdit })

const addApiKey = () => apiKeyList.value.push('')
/** 行内删除：多行直接删掉该行，只剩一行时清空内容（永远保留一个输入框） */
const removeApiKeyAt = (index: number) => {
  if (apiKeyList.value.length > 1) {
    apiKeyList.value.splice(index, 1)
    // showKey 是按下标记的：删中间一行后整体前移，避免显隐状态错位
    const next: Record<number, boolean> = {}
    Object.keys(showKey.value).forEach((k) => {
      const i = Number(k)
      if (i < index) next[i] = showKey.value[i]
      else if (i > index) next[i - 1] = showKey.value[i]
    })
    showKey.value = next
  } else if (apiKeyList.value.length === 1) {
    apiKeyList.value[0] = ''
  }
}
const toggleKey = (i: number) => { showKey.value[i] = !showKey.value[i] }

/** 检测协议：对同一 API 地址按 OpenAI / Responses / Claude / Gemini 四种形态各探测一次。
 *  判定口径（与后端一致）：只要不是 404 都算「该地址支持此协议形态」 */
const openDetectProtocol = async () => {
  if (!form.apiUrl?.trim()) {
    message.warning(t('settings.models.apiUrlFirst'))
    return
  }
  const seq = ++detectSeq.value
  detectUrl.value = form.apiUrl.trim()
  detectVisible.value = true
  detecting.value = true
  detectRows.value = []
  detectFoot.value = ''
  const auth = resolvedAuth.value
  try {
    const res: any = await adminApi.post('/api/providers/detect-protocol', {
      apiUrl: form.apiUrl.trim(),
      apiKey: form.apiKey.trim() || undefined,
      proxy: form.proxyUrl.trim() || undefined,
      auth_scheme: auth.authScheme,
      auth_header: auth.authHeader,
      auth_prefix: auth.authPrefix,
    })
    // 探测期间换了供应商 / 重开了表单：这是上一次请求的迟到结果，直接丢弃
    if (seq !== detectSeq.value) return
    const data = res?.data ?? res
    detectRows.value = ((data?.results || []) as any[]).map((x: any) => ({
      protocol: x.protocol,
      label: x.label,
      icon: x.icon,
      ok: !!x.ok,
      message: x.message || '',
      url: x.url || '',
    }))
    detectFoot.value = data?.foot || ''
  } catch (error: any) {
    if (seq !== detectSeq.value) return
    detectRows.value = []
    detectFoot.value = error?.response?.data?.message || error?.message || '检测失败'
  } finally {
    if (seq === detectSeq.value) detecting.value = false
  }
}

const handleTestConnection = async () => {
  if (!form.apiUrl.trim()) {
    testResult.value = { success: false, message: t('settings.models.apiUrlFirst') }
    return
  }
  // 去空白后再判空：全空格的 Key 会被后端 trim 成空串，留着只会让测试请求白跑一趟
  const validKeys = apiKeyList.value.map(k => k.trim()).filter(Boolean)
  if (validKeys.length === 0) {
    testResult.value = { success: false, message: t('settings.models.apiKeyFirst') }
    return
  }
  testing.value = true
  testResult.value = null
  const auth = resolvedAuth.value
  // 认证三件套与代理按「即将落库的值」一起传：Dots Studio 这类只认 api-key 头的
  // 服务商，测试时不带 auth_header 会把有效 Key 判成 401（假失败）。
  const testPayload = {
    apiUrl: form.apiUrl,
    protocol: form.protocol,
    auth_scheme: auth.authScheme,
    auth_header: auth.authHeader,
    auth_prefix: auth.authPrefix,
    proxy: form.proxyUrl.trim() || undefined,
  }
  try {
    // 字段名必须是 apiUrl：后端 ApiProviderController#testConnection 读的是
    // body.apiUrl，早先这里发的是 url → apiUrl 为空 → 后端直接回「API地址不能为空」，
    // 测试请求根本没打到上游（该 false 又被信封 success 掩盖，表现为恒成功）。
    // 表单允许多个 Key：并行逐个探测（只读，互不依赖），只要有一个无效就报出来 ——
    // 原实现只测第一个 Key，第 2 个起填错也照样显示「连接成功」。
    const settled = await Promise.allSettled(
      validKeys.map(apiKey => apiService.testProviderConnection({ ...testPayload, apiKey })),
    )
    const failed: string[] = []
    // 单个 Key 时把上游实测延迟带出来：既让「成功」有据可查（确实打到了上游），
    // 也省得用户再去模型卡片点一次测延迟。
    const latencies: number[] = []
    settled.forEach((r, i) => {
      // 多 Key 时标出是第几个失败；单 Key 不加前缀，避免「#1 连接失败」这种噪音
      const label = validKeys.length > 1 ? `#${i + 1} ` : ''
      if (r.status === 'rejected') {
        failed.push(`${label}${r.reason?.message || t('settings.models.connectionFailed')}`)
      } else if (r.value?.success !== true) {
        failed.push(`${label}${r.value?.message || t('settings.models.connectionFailed')}`)
      } else if (typeof r.value?.latency === 'number') {
        latencies.push(r.value.latency)
      }
    })
    const allOk = failed.length === 0
    const latency = latencies.length > 0 ? Math.round(latencies[0]) : null
    testResult.value = {
      success: allOk,
      message: allOk
        ? (validKeys.length > 1
            ? t('settings.models.connectionSuccessMulti', { n: validKeys.length })
            : (latency != null
                ? t('settings.models.connectionSuccessLatency', { ms: latency })
                : t('settings.models.connectionSuccess')))
        : failed.join('；'),
    }
  } catch (e: any) {
    testResult.value = { success: false, message: e?.message || t('settings.models.connectionFailed') }
  } finally {
    testing.value = false
  }
}

const handleOpenApiKeyUrl = () => {
  testResult.value = { success: false, message: t('settings.models.noApiKeyUrl') }
}

const handleBack = () => {
  dialogVisible.value = false
  emit('back')
}

/** 「apikey 保存」预览：已填显示原值，留空回落默认模型根（后端解析出的绝对路径） */
const previewLocalPath = computed(() => {
  const v = localModelPath.value.trim()
  return v || providerModelRoot.value || '（后端未给出默认模型根）'
})

/** 复制预览路径，方便直接到资源管理器核对 / 放模型 */
const copyPreviewPath = async () => {
  const v = previewLocalPath.value
  if (!v || v === '（后端未给出默认模型根）') return
  try {
    await navigator.clipboard.writeText(v)
    message.success('已复制：' + v)
  } catch {
    // 剪贴板被拒（非安全上下文等）：退回选中文本，用户 Ctrl+C 即可
    message.warning('复制失败，请手动选中路径复制')
  }
}

/**
 * 外部目录绑定完成：刷新展示的模型根（绝对路径）。
 *
 * <p>绑定接口（POST /api/onnx/external）内部直接落库并推送模型注册表，
 * 表单无需再保存一次；这里只回显最新 model_root。</p>
 */
const onExternalSaved = async () => {
  try {
    const body = await adminApi.get('/api/providers')
    const rawList = Array.isArray(body) ? body : body?.data || []
    const hit = rawList.find((p: any) => (p.provider_id || p.id) === 'onnx')
    providerModelRoot.value = String(hit?.model_root || '').trim()
  } catch { /* 回显失败不打断流程，下次打开表单会重新拉 */ }
}

const handleSave = async () => {
  if (!form.name.trim()) { message.warning(t('settings.models.nameRequired')); return }
  // ONNX 纯本地推理没有远端地址；路由组也没有真实上游地址，都不校验 apiUrl
  // （模型库驱动，成员各自带着地址与凭证）
  if (!isLocalProvider.value && !isChannelProviderFlag.value && !isRouterGroupProvider.value && !form.apiUrl.trim()) {
    message.warning(t('settings.models.apiUrlRequired')); return
  }
  const headerErrors = validateHeadersText(form.customHeaders, t)
  if (headerErrors.length > 0) { message.warning(headerErrors[0]); return }
  // 用量接口必须是一个 http(s) 地址：写错的话指标拉取会静默失败
  const metricsUrl = form.metricsUrl.trim()
  if (metricsUrl && !/^https?:\/\//i.test(metricsUrl)) {
    message.warning('用量接口要填 http(s) 开头的完整地址')
    return
  }
  // 额外请求体必须是一个 JSON 对象（数组/标量无处可并，直接拦下）
  if (form.extraBodyText.trim()) {
    try {
      const parsed = JSON.parse(form.extraBodyText)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        message.warning('额外请求体必须是 JSON 对象，例如 {"prompt_cache_key": "${sessionId}"}')
        return
      }
    } catch {
      message.warning('额外请求体不是合法 JSON')
      return
    }
  }
  // 自定义认证方式必须给出请求头名称，否则等于配了一个空头名
  if (form.authMode === 'custom' && !form.authHeader.trim()) {
    message.warning('请填写自定义认证的请求头名称'); return
  }
  // 免费渠道：路由表是模型来源，保存前校准并提示（不阻断保存）
  if (isFreeChannelProvider.value) validateRoutes()
  // 本地推理（ONNX）：凭证就是本地模型路径，鉴权卡片整体不适用
  const effectiveApiKey = isLocalProvider.value
    ? localModelPath.value.trim()
    : (apiKeyList.value.map(k => k.trim()).filter(Boolean).join(','))
  const newApiKeys = isLocalProvider.value
    ? (localModelPath.value.trim() ? [localModelPath.value.trim()] : [])
    : apiKeyList.value.map(k => k.trim()).filter(Boolean)
  const auth = resolvedAuth.value

  if (isEditMode.value) {
    const updateData: any = {
      auth_scheme: auth.authScheme,
      extra: buildExtra(),
    }
    // ONNX 的 base_url 是后端占位值（模型注册表驱动），表单已不展示该字段，
    // 不回传，避免把空串覆盖进库里
    // 路由组同样不传 base_url：地址留空，成员是库里的真实上游
    if (!isLocalProvider.value && !isRouterGroupProvider.value) updateData.base_url = form.apiUrl
    // 凭证必须走 credentials：后端 ApiProviderController#updateProvider 只认 body.credentials，
    // 顶层 apiKey 不在它的字段表里 —— 早先这里发 apiKey，接口照样 200、前端照样弹「已更新」，
    // 但 Key 一个字节都没落库（用户报的「key 无法修改、无法保存」）。
    if (newApiKeys.length > 0) updateData.credentials = { api_key: newApiKeys.join(',') }
    // 代理必须「空也提交」：表单改成 直连 / 自定义 两态后，选直连的语义是
    // 「把代理清掉」。以前只在非空时才带 proxy，用户从自定义改回直连永远清不掉，
    // 后端 body.containsKey("proxy") 才写库，所以空串要显式发出去。
    updateData.proxy = form.proxyUrl.trim()
    // 管理员可编辑所有字段：始终提交名称与协议
    updateData.name = form.name
    updateData.protocol = form.protocol
    await apiService.updateProvider(providerId.value, updateData)
    message.success(t('settings.models.providerUpdated'))
  } else {
    // 依据名称 / 地址推断品牌，避免把自定义添加的 DeepSeek 等存成协议图标
    const inferred = resolveProviderBrand({ name: form.name, base_url: form.apiUrl })
    const platformVal = inferred !== 'custom' ? inferred : providerType.value
    // 路由组没有真实上游：base_url 留空（后端对 router-group 不做必填校验），凭证也空
    const payload: any = {
      platform: platformVal, name: form.name,
      base_url: isRouterGroupProvider.value || isChannelProviderFlag.value ? '' : form.apiUrl,
      auth_scheme: isRouterGroupProvider.value ? 'none' : (isLocalProvider.value ? 'none' : auth.authScheme),
      enabled: true, initial_model: null,
      extra: buildExtra(),
    }
    // 账号渠道 provider 凭据由渠道管理页绑定（sys_ai_provider_connection），表单不采集 api_key
    // 路由组同样不采集：成员留在模型库，成员自己的 Key 在成员行上维护
    if (!isChannelProviderFlag.value && !isRouterGroupProvider.value) {
      payload.credentials = { api_key: effectiveApiKey }
    }
    if (form.proxyUrl.trim()) payload.proxy = form.proxyUrl.trim()
    await adminApi.post('/api/providers', payload)
    message.success(t('settings.models.providerAdded', { name: form.name }))
  }
  dialogVisible.value = false
  emit('saved')
}

/** 高级设置折叠态：默认收起，只留「高级」一行，和简洁版式一致 */
const advancedOpen = ref(false)

/**
 * 代理模式：表单只有一个 proxyUrl 字段。
 * 「直连」= 空串（后端按不走代理处理）；「自定义」= 用户填的地址。
 * 模式必须自己存一份状态：若 getter 直接由 proxyUrl 推导，用户点「自定义」时
 * 地址还是空串 → 模式又被打回「直连」，输入框永远不出现。
 */
const proxyCustom = ref(false)
const proxyMode = computed({
  get: () => (proxyCustom.value ? 'custom' : 'none'),
  set: (v: string) => {
    proxyCustom.value = v === 'custom'
    if (v === 'none') form.proxyUrl = ''
  },
})
/** 编辑态回填了代理地址时，自动落到「自定义」 */
watch(() => form.proxyUrl, (v) => { if (v && v.trim()) proxyCustom.value = true })

/**
 * 地址一改动，上一轮检测结果立刻作废。
 *
 * <p>检测结果对应的是「那次探测的地址」，地址换了还留着四行旧结论，
 * 用户会以为新地址已经测过。地址改回原值不恢复旧结果 —— 重新点一次更可靠。</p>
 */
watch(() => form.apiUrl, (v) => {
  if (!detectVisible.value) return
  if ((v || '').trim() === detectUrl.value) return
  detectSeq.value++
  detectVisible.value = false
  detecting.value = false
  detectRows.value = []
  detectFoot.value = ''
})

/** 弹窗标题：名字还没填时不要渲染成「添加 」这种半截文案 */
const dialogTitle = computed(() => {
  if (isEditMode.value) return t('settings.models.editProvider')
  const name = form.name.trim()
  return name
    ? t('settings.models.addProvider', { name })
    : t('settings.models.addProviderPlain')
})

/** 协议的中文名：头部副标题用，避免直接显示 openai-response 这种内部值 */
const protocolLabel = computed(
  () => protocolOptions.find((o) => o.value === form.protocol)?.label || form.protocol,
)

const protocolOptions = [
  { label: 'OpenAI', value: 'openai', icon: 'openai' },
  { label: 'OpenAI Response', value: 'openai-response', icon: 'openai-response' },
  { label: 'Gemini', value: 'gemini', icon: 'gemini' },
  { label: 'Anthropic Claude', value: 'anthropic', icon: 'anthropic' },
  // System one 是决策协议（POST /v1/systemone，utils 侧实现是 DecisionsClient），
  // 与对话协议并列出现在「这个供应商按什么协议说话」这一层。
  { label: 'System one', value: 'system-one', icon: 'systemone' },
]
</script>

<template>
  <ReDialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="700px"
    align-center
    append-to-body
    :close-on-click-modal="false"
    class="provider-modal"
  >
    <template #header>
      <div class="pf-header">
        <button v-if="selectedTemplate" class="pf-back-btn" title="返回模板库" @click="handleBack">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>
        <ProviderLogo v-else :pid="providerType" :name="form.name" size="sm" />
        <div class="pf-header-meta">
          <span class="pf-header-title">
            {{ dialogTitle }}
          </span>
          <!-- 副标题：一眼看清「哪家 / 什么协议 / 打哪个地址」，不用往表单里找 -->
          <span class="pf-header-sub">
            {{ protocolLabel }}<template v-if="form.apiUrl.trim()"> · {{ form.apiUrl.trim() }}</template>
          </span>
          <span v-if="selectedTemplate" class="pf-badge">
            <el-icon :size="11"><Key24Regular /></el-icon>{{ selectedTemplate.name }}
          </span>
        </div>
      </div>
    </template>

    <div class="pf-body">
      <!-- 基本信息 -->
      <div class="pf-line">
        <span class="pf-line-label"><span class="pf-req">*</span>{{ t('settings.models.name') }}</span>
        <div class="pf-line-ctrl">
          <el-input v-model="form.name" :placeholder="t('settings.models.namePlaceholder')" clearable />
        </div>
      </div>

      <!-- 本地推理（ONNX）没有对话协议可选：不走上游 HTTP，模型由本地注册表提供 -->
      <div v-if="!isLocalProvider" class="pf-line">
        <span class="pf-line-label"><span class="pf-req">*</span>{{ t('settings.models.protocol') }}</span>
        <div class="pf-line-ctrl">
          <el-segmented v-model="form.protocol" :options="protocolOptions" block class="pf-seg">
            <template #default="{ item }">
              <el-tooltip :content="item.label" placement="top" :show-after="120">
                <span class="pf-proto-icon">
                  <!-- OpenAI Response = OpenAI 家族：openai logo 右下角挂一个 R 小标 -->
                  <span v-if="item.icon === 'openai-response'" class="pf-proto-stack">
                    <ProviderLogo pid="openai" :name="item.label" :size="18" />
                    <i class="pf-proto-badge">R</i>
                  </span>
                  <!-- System one（决策协议）用通用「分支」图标，不再用 S1 文字块 -->
                  <el-icon v-else-if="item.icon === 'systemone'" :size="18"><BranchFork24Regular /></el-icon>
                  <ProviderLogo v-else :pid="item.icon" :name="item.label" :size="18" />
                </span>
              </el-tooltip>
            </template>
          </el-segmented>
        </div>
      </div>

      <!--
        ONNX 是纯本地推理，没有远端地址：后端 ai.onnx.base-url 只是占位值，
        这里不再展示/编辑该字段（填 http 地址对本地推理毫无作用）。
        真实位置是 model_root —— 绝对路径只读展示，修改入口是「绑定外部模型目录」
        （走 /api/onnx/external/browse 目录选择器，路径只能选不能填）。
      -->
      <div v-if="isLocalProvider" class="pf-line">
        <span class="pf-line-label">模型根目录</span>
        <div class="pf-line-ctrl">
          <div class="pf-root">
            <el-input
              :model-value="providerModelRoot || '尚未绑定模型目录'"
              readonly
              class="pf-root-input"
            >
              <template #prefix><el-icon :size="14"><Folder24Regular /></el-icon></template>
            </el-input>
            <el-button @click="externalVisible = true">绑定目录</el-button>
          </div>
          <p class="pf-note">模型文件实际存放位置；通过目录选择器绑定，不能手工填写。</p>
        </div>
      </div>
      <div v-else-if="isRouterGroupProvider" class="pf-line">
        <span class="pf-line-label">{{ t('settings.models.apiUrl') }}</span>
        <div class="pf-line-ctrl">
          <p class="pf-note">
            路由组没有真实上游：它不占地址与密钥，成员全部来自模型库。
            成员的顺序与策略（路由策略 / 被限流时 / 延迟 / 全忙 / 上下文）在供应商详情页的「路由组」面板维护。
          </p>
        </div>
      </div>
      <div v-else class="pf-line">
        <span class="pf-line-label"><span class="pf-req">*</span>{{ t('settings.models.apiUrl') }}</span>
        <div class="pf-line-ctrl">
          <el-input v-model="form.apiUrl" placeholder="https://api.example.com/v1" clearable>
    <template #suffix>
      <el-tooltip content="检测协议" placement="top" :show-after="200">
        <el-button class="pf-detect-btn" text size="small" :loading="detecting" @click="openDetectProtocol">
          <el-icon :size="14"><Search24Regular /></el-icon>
        </el-button>
      </el-tooltip>
    </template>
  </el-input>

  <!-- 检测协议：结果直接内联在地址框下方，四个协议各一行（标准端点 + 状态）。
       状态三档：可用（非 404 响应）/ 不支持（404，没有该协议的模型列表端点）/ 连不上（网络异常）。 -->
  <div v-if="detectVisible" class="pf-detect">
    <div v-if="detecting && detectRows.length === 0" class="pf-detect-empty">正在检测…</div>
    <div v-for="row in detectRows" :key="row.protocol" class="pf-detect-row" :class="'is-' + detectRowState(row)">
      <span v-if="row.icon === 'openai-response'" class="pf-proto-stack">
        <ProviderLogo pid="openai" :name="row.label" :size="18" />
        <i class="pf-proto-badge">R</i>
      </span>
      <el-icon v-else-if="row.icon === 'systemone'" :size="18"><BranchFork24Regular /></el-icon>
      <ProviderLogo v-else :pid="row.icon" :name="row.label" :size="18" />
      <span class="pf-detect-name">{{ row.label }}</span>
      <span class="pf-detect-url">{{ row.url }}</span>
      <span class="pf-detect-state">{{ DETECT_STATE_LABEL[detectRowState(row)] }}</span>
      <span class="pf-detect-msg">{{ row.message }}</span>
    </div>
    <p v-if="detectFoot && detectRows.length" class="pf-detect-foot">{{ detectFoot }}</p>
  </div>
        </div>
      </div>

      <!-- 本地推理（ONNX）：无远程鉴权，凭证即本地模型路径 -->
      <template v-if="isLocalProvider">
        <div class="pf-line">
          <span class="pf-line-label">本地模型路径</span>
          <div class="pf-line-ctrl">
            <el-input v-model="localModelPath" placeholder="留空 = 使用上方模型根目录" clearable />
            <!--
              预览必须给完整绝对路径：后端保存/解析时会把相对值按 user.dir 绝对化，
              这里只显示用户输入的相对值（如 models/onnx）的话，用户既不知道
              真实生效位置在盘上哪里、也没法直接复制去核对/放模型。
              输入已填时它就是路径原样展示（假定用户填的即绝对路径）；
              留空时显示后端解析出的默认模型根（provider.model_root，已是绝对路径）。
            -->
            <p class="pf-note">
              该路径将作为本地推理的「apikey」保存：<code>{{ previewLocalPath }}</code>
              <el-button
                v-if="previewLocalPath && previewLocalPath !== '（留空）'"
                link
                type="primary"
                class="pf-copy-btn"
                @click="copyPreviewPath"
              >复制</el-button>
            </p>
            <p class="pf-note">
              未填时的默认模型根（把模型放进这个目录即可被加载）：<code>{{ providerModelRoot || '解析中…' }}</code>
            </p>
          </div>
        </div>

        <!-- 推理设备（本地模型专属）：云端提供商走远程 API，无 CPU/GPU 之分 -->
        <div class="pf-line">
          <span class="pf-line-label">推理设备</span>
          <div class="pf-line-ctrl">
            <ReRadioGroup v-model="form.device">
              <ReRadioButton value="auto">自动</ReRadioButton>
              <ReRadioButton value="cpu">CPU</ReRadioButton>
              <ReRadioButton value="gpu">GPU</ReRadioButton>
            </ReRadioGroup>
            <p class="pf-note">auto 按本机驱动自动判定；选 gpu 缺 CUDA 组件时自动回退 CPU。</p>
          </div>
        </div>
      </template>

      <!-- 账号渠道鉴权：凭据由渠道管理页统一绑定/刷新，表单侧只读回显 + 跳转入口 -->
      <div v-else-if="isChannelProviderFlag" class="pf-line">
        <span class="pf-line-label">账号渠道</span>
        <div class="pf-line-ctrl">
          <p class="pf-note">
            认证方式：{{ authHint }}。凭据由「渠道管理」页统一绑定、刷新与签到，本表单不采集 API Key。
          </p>
          <div class="pf-inline">
            <el-button @click="emit('goToChannelManagement')">前往渠道管理页绑定账号</el-button>
          </div>

          <!-- 已绑定账号回显（编辑态） -->
          <div v-if="channelConnections.length > 0" class="pf-note">
            已绑定
            <strong>{{ channelConnections.reduce((n, c) => n + (c.connections?.length ?? 0), 0) }}</strong>
            个账号（在渠道管理页可刷新 / 签到 / 删除）
            <ul v-if="channelConnections[0].connections?.length" class="ch-conn-list">
              <li v-for="conn in channelConnections[0].connections" :key="conn.connectionId">
                <span class="ch-conn-label">{{ conn.label || '未命名' }}</span>
                <span class="ch-conn-state" :class="{ 'is-valid': conn.status === 'valid', 'is-stale': conn.status !== 'valid' }">
                  {{ conn.status || '未知' }}
                </span>
              </li>
            </ul>
          </div>
          <p v-else class="pf-note">尚无绑定账号，请前往渠道管理页完成绑定。</p>
        </div>
      </div>

      <!-- 路由组没有真实上游：不展示地址 / 鉴权，成员与策略在组内维护 -->
      <div v-else-if="isRouterGroupProvider" class="pf-line">
        <span class="pf-line-label">组内配置</span>
        <div class="pf-line-ctrl">
          <p class="pf-note">
            路由组不占有地址与密钥，成员全部来自「已添加的模型库」，选哪个模型由组内策略决定。
          </p>
          <p class="pf-note">
            配置入口：创建或编辑完供应商后，在供应商详情页的「路由组」面板里设置成员、顺序与策略。
          </p>
        </div>
      </div>

      <!-- API 鉴权（远程提供商） -->
      <template v-else>
        <!-- 认证方式：决定 Key 以哪个请求头发出去（Dots 等只认 api-key，不认 Authorization） -->
        <div class="pf-line">
          <span class="pf-line-label">认证方式</span>
          <div class="pf-line-ctrl">
            <!-- 下拉用 ReSelect（@repo/ui），与全站下拉观感一致；
                 layout="default" 会透传默认插槽，因此可自定义「名称 + 说明」两行选项 -->
            <ReSelect
              v-model="form.authMode"
              layout="default"
              class="w-full auth-select"
              placeholder="选择认证方式"
            >
              <el-option v-for="s in AUTH_SCHEMES" :key="s.value" :label="s.label" :value="s.value">
                <span class="opt-two-line">
                  <span class="opt-main">{{ s.label }}</span>
                  <span class="opt-sub">{{ s.description }}</span>
                </span>
              </el-option>
            </ReSelect>

            <div v-if="form.authMode === 'custom'" class="pf-pair">
              <el-input v-model="form.authHeader" placeholder="请求头名称，如 api-key" />
              <el-input v-model="form.authPrefix" placeholder="值前缀，留空不加前缀" />
            </div>

            <p class="pf-note">
              实际发送：
              <code v-if="form.authMode === 'bearer'">Authorization: Bearer &lt;你的 Key&gt;</code>
              <code v-else-if="form.authMode === 'none'">（不发送认证头）</code>
              <code v-else>{{ form.authHeader || 'api-key' }}: {{ form.authPrefix }}&lt;你的 Key&gt;</code>
            </p>
          </div>
        </div>

        <div class="pf-line">
          <span class="pf-line-label">API Key</span>
          <div class="pf-line-ctrl">
            <div v-if="isEditMode && form.existingKeyCount > 0" class="pf-note">
              已配置 <strong>{{ form.existingKeyCount }}</strong> 个 Key
              <template v-if="form.existingKeyMask">（{{ form.existingKeyMask }}）</template>
              ，留空保留原配置，填写新值则替换
            </div>

            <div class="pf-keys">
              <div v-for="(key, index) in apiKeyList" :key="index" class="key-row">
                <el-input
                  v-model="apiKeyList[index]"
                  placeholder="sk-..."
                  :type="showKey[index] ? 'text' : 'password'"
                >
                  <template #prefix><el-icon :size="14"><Key24Regular /></el-icon></template>
                  <template #suffix>
                    <button class="key-eye" type="button" @click="toggleKey(index)" :title="showKey[index] ? '隐藏' : '显示'">
                      <el-icon :size="15"><Eye24Regular v-if="!showKey[index]" /><EyeOff24Regular v-else /></el-icon>
                    </button>
                  </template>
                </el-input>
                <!-- 每个 Key 行自带一个删除按钮：多行删本行，只剩一行时清空内容 -->
                <button
                  class="key-remove"
                  type="button"
                  :title="apiKeyList.length > 1 ? '删除这个 Key' : '清空这个 Key'"
                  @click="removeApiKeyAt(index)"
                >
                  <el-icon :size="14"><Delete24Regular /></el-icon>
                </button>
              </div>
            </div>

            <div class="pf-inline">
              <button class="pf-add" type="button" @click="addApiKey">
                <el-icon :size="13"><Add24Regular /></el-icon>添加 Key
              </button>
              <button class="pf-link" type="button" :title="t('settings.models.getApiKey')" @click="handleOpenApiKeyUrl">
                <el-icon :size="13"><Link24Regular /></el-icon>{{ t('settings.models.getApiKey') }}
              </button>
            </div>

            <div v-if="testResult" class="test-result" :class="testResult.success ? 'is-success' : 'is-error'">
              <el-icon :size="15"><CloudCheckmark24Regular v-if="testResult.success" /><CloudArrowDown24Regular v-else /></el-icon>
              <span>{{ testResult.message }}</span>
            </div>
          </div>
        </div>
      </template>

      <!-- 高级：请求头 / Key 策略 / 自动限流 / 代理（默认收起，和简洁版式一致）
           只属于云 API；ONNX 纯本地推理没有远端连接，整块隐藏 -->
      <div v-if="!isLocalProvider" class="pf-more">
        <button
          type="button"
          class="pf-more-toggle"
          :aria-expanded="advancedOpen"
          @click="advancedOpen = !advancedOpen"
        >
          <el-icon :size="12" class="pf-more-arrow" :class="{ 'is-open': advancedOpen }">
            <ChevronDown24Regular />
          </el-icon>
          <span>高级</span>
          <!-- 折叠时的摘要：已配项一目了然，不用逐个展开找 -->
          <span v-if="!advancedOpen && advancedSummary.length" class="pf-more-chips">
            <span v-for="item in advancedSummary" :key="item" class="pf-chip">{{ item }}</span>
          </span>
          <span v-else-if="!advancedOpen" class="pf-more-hint">请求头 / 端点 / 限流</span>
        </button>

        <div v-show="advancedOpen" class="pf-more-body">
          <div class="pf-section">请求</div>
          <div class="pf-line">
            <span class="pf-line-label">请求头</span>
            <div class="pf-line-ctrl">
              <el-input v-model="form.customHeaders" type="textarea" :rows="3"
                :placeholder="t('settings.models.customHeadersPlaceholder')" />
            </div>
          </div>

          <!-- 多协议端点：同一供应商的 OpenAI / Responses / Anthropic 可以各走各的地址 -->
          <div class="pf-line">
            <span class="pf-line-label">端点</span>
            <div class="pf-line-ctrl">
              <div class="pf-endpoint">
                <span class="pf-endpoint-name">OpenAI</span>
                <el-input v-model="form.endpoints.openai" placeholder="留空跟随上游地址" />
              </div>
              <div class="pf-endpoint">
                <span class="pf-endpoint-name">Responses</span>
                <el-input v-model="form.endpoints['openai-response']" placeholder="留空跟随上游地址" />
              </div>
              <div class="pf-endpoint">
                <span class="pf-endpoint-name">Anthropic</span>
                <el-input v-model="form.endpoints.anthropic" placeholder="留空跟随上游地址" />
              </div>
              <p class="pf-note">按模型实际协议选地址；三行都留空就用上面的上游地址。</p>
            </div>
          </div>

          <!-- 用量/指标接口：部分服务商额外提供带价格、延迟的指标端点（如 OpenRouter /models） -->
          <div class="pf-line">
            <span class="pf-line-label">用量接口</span>
            <div class="pf-line-ctrl">
              <el-input v-model="form.metricsUrl" placeholder="如 https://openrouter.ai/api/v1/models（留空不拉取）" />
              <p class="pf-note">填了才会从该地址拉价格、上下文等指标；留空表示这家供应商不支持指标拉取。</p>
            </div>
          </div>

          <!-- 余额：给提供商详情的「余额与用量」用，每个 Key 各查一次 -->
          <div class="pf-line">
            <span class="pf-line-label">余额</span>
            <div class="pf-line-ctrl">
              <ReSelect v-model="form.creditKind" class="w-full" layout="default" placeholder="自动识别">
                <el-option v-for="k in CREDIT_KINDS" :key="k.value" :label="k.label" :value="k.value" />
              </ReSelect>
              <template v-if="form.creditKind !== 'auto'">
                <el-input v-model="form.creditUrl" placeholder="余额接口地址（留空用该方式的默认地址）" />
                <el-input v-model="form.creditExpression"
                  placeholder="字段表达式：前一段剩余、后一段已用，如 $data.total_available; $data.total_used" />
              </template>
              <p class="pf-note">
                决定「提供商详情 → 余额与用量」怎么查：每个 Key 单独查一次，前一段算剩余、后一段算已用，总量是两者之和。
              </p>
            </div>
          </div>

          <div class="pf-line">
            <span class="pf-line-label">额外请求体</span>
            <div class="pf-line-ctrl">
              <el-input v-model="form.extraBodyText" type="textarea" :rows="3"
                placeholder='并入出站 JSON 的字段，例如 {"prompt_cache_key": "${sessionId}"}' />
              <p class="pf-note">必须是 JSON 对象；会原样并进每次请求体。</p>
            </div>
          </div>

          <div class="pf-line">
            <span class="pf-line-label">透传响应头</span>
            <div class="pf-line-ctrl">
              <el-input v-model="form.passthroughResp" placeholder="X-Trace-Id, X-Foo" />
              <p class="pf-note">上游响应里的这些头带回到调用方（多个用逗号分隔）。</p>
            </div>
          </div>

          <div class="pf-line">
            <span class="pf-line-label">透传请求头</span>
            <div class="pf-line-ctrl">
              <el-input v-model="form.passthroughReq" placeholder="X-Tenant-Id" />
              <p class="pf-note">调用方带来的这些头原样转给上游（多个用逗号分隔）。</p>
            </div>
          </div>

          <div class="pf-line">
            <span class="pf-line-label">Key 策略</span>
            <div class="pf-line-ctrl">
              <ReSelect v-model="form.loadStrategy" class="w-full" layout="default" placeholder="选择 Key 轮询策略">
                <el-option v-for="s in KEY_STRATEGIES" :key="s.name" :label="s.display_name" :value="s.name">
                  <span class="opt-two-line">
                    <span class="opt-main">{{ s.display_name }}</span>
                    <span class="opt-sub">{{ s.description }}</span>
                  </span>
                </el-option>
              </ReSelect>
            </div>
          </div>

          <div class="pf-line">
            <span class="pf-line-label">自动限流</span>
            <div class="pf-line-ctrl pf-inline">
              <el-switch v-model="form.autoSwitchOnRateLimit" />
              <span class="pf-note">触发限流时自动切换到下一个可用 Key</span>
            </div>
          </div>

          <div class="pf-section">网络与限流</div>

          <div class="pf-line">
            <span class="pf-line-label">代理</span>
            <div class="pf-line-ctrl">
              <ReRadioGroup v-model="proxyMode">
                <ReRadioButton value="none">直连</ReRadioButton>
                <ReRadioButton value="custom">自定义</ReRadioButton>
              </ReRadioGroup>
              <el-input
                v-if="proxyMode === 'custom'"
                v-model="form.proxyUrl"
                placeholder="http://127.0.0.1:7890"
              />
              <p v-else class="pf-note">留空即直连上游，不走代理。</p>
            </div>
          </div>

          <!-- 供应商级限流：同一个供应商下所有 Key 共用这三项配额 -->
          <div class="pf-line">
            <span class="pf-line-label">开发上限</span>
            <div class="pf-line-ctrl">
              <ReInputNumber v-model="form.maxConcurrency" :min="0" :step="1" controls-position="right"
                placeholder="不限制" class="pf-num" />
              <p class="pf-note">同一时间最多几个请求打到这家上游；0 或留空 = 不限制。</p>
            </div>
          </div>

          <div class="pf-line">
            <span class="pf-line-label">同时使用的账号数</span>
            <div class="pf-line-ctrl">
              <ReInputNumber v-model="form.maxAccounts" :min="0" :step="1" controls-position="right"
                placeholder="不限制" class="pf-num" />
              <p class="pf-note">只启用地前 N 个 Key 轮换；0 或留空 = 全部启用。</p>
            </div>
          </div>

          <div class="pf-line">
            <span class="pf-line-label">每分钟请求数</span>
            <div class="pf-line-ctrl">
              <ReInputNumber v-model="form.rpm" :min="0" :step="1" controls-position="right"
                placeholder="不限制" class="pf-num" />
              <p class="pf-note">同一供应商每分钟最多几次请求；0 或留空 = 不限制。</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 免费渠道：模型目录不在上游，路由表（extra.routes）是本表单维护的模型级配置——
           key 即模型名/模型名前缀，route 按模型命中并覆盖上游地址与凭据 -->
      <div v-if="isFreeChannelProvider" class="pf-routes">
        <div class="pf-routes-head">
          <span class="pf-routes-title">模型路由表</span>
          <span class="pf-note">按模型名（key）指定上游 provider / 地址 / Key</span>
          <el-button class="pf-routes-add" link type="primary" @click="addRouteRow">
            <el-icon :size="13"><Add24Regular /></el-icon>添加路由
          </el-button>
        </div>
        <div class="route-list">
          <!-- 错误提示：重复 key/空 key 等，保存时统一展示 -->
          <div v-if="routeHint" class="route-hint">
            <el-icon class="route-hint-icon" :size="14"><Info24Regular /></el-icon>
            <span class="route-hint-text">{{ routeHint }}</span>
          </div>
          <!-- 没有行时给一个友好的默认态 -->
          <div v-if="formRoutes.length === 0" class="route-empty">
            尚未添加路由：模型名会回落到供应商默认地址。
          </div>
          <div v-for="(row, idx) in formRoutes" :key="idx" class="route-row">
            <div class="route-row-main">
              <div class="route-key">
                <span class="route-key-label">key（模型名）</span>
                <el-input v-model="row.key" placeholder="模型名，如 glm-4.7" size="small" clearable />
              </div>
              <div class="route-target">
                <div class="route-target-col">
                  <span class="route-target-label">provider</span>
                  <el-input v-model="row.provider" placeholder="留空按 OpenAI 兼容协议" size="small" clearable />
                </div>
                <div class="route-target-col">
                  <span class="route-target-label">base_url</span>
                  <el-input v-model="row.baseUrl" placeholder="https://…/v1" size="small" clearable />
                </div>
              </div>
              <div class="route-key">
                <span class="route-key-label">api_key</span>
                <el-input v-model="row.apiKey" placeholder="留空 = 沿用供应商全局 Key" size="small" clearable type="password" show-password />
              </div>
            </div>
            <div class="route-row-foot">
              <el-button class="pf-foot-btn-delete" link type="danger" @click="removeRouteRow(idx)">
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="pf-footer">
        <span v-if="testing" class="pf-testing">连接测试中…</span>
        <div class="pf-footer-btns">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button v-if="!isLocalProvider" :loading="testing" @click="handleTestConnection">测试连接</el-button>
          <el-button type="primary" @click="handleSave">保存</el-button>
        </div>
      </div>
    </template>

    <!-- ONNX 外部目录绑定：路径只能在这里经目录选择器选取，入口在模型根目录旁 -->
    <OnnxExternalDialog v-model="externalVisible" @saved="onExternalSaved" />
  </ReDialog>
</template>

<style scoped>
/* --mp-* 令牌原定义在 src/styles/modern-polish.css，但该文件在整个仓库里并不存在
   （main.js 也从未引入），所以 --mp-radius / -sm / -lg / --mp-shadow-pop 全是取不到值的
   空令牌：var() 无回退值时整条声明失效，圆角/阴影直接掉回初始值。
   已统一到本项目实际在用的 --el-radius-* 刻度（sm 6 / md 8 / lg 12 / xl 16）。 */
.pf-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.pf-header-meta { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
/* 头部副标题：协议 + 上游地址，长地址截断，避免把标题挤成两行 */
.pf-header-sub {
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  max-width: 460px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pf-header-title {
  text-align: left;
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1.3;
}
.pf-back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: var(--el-border-color-light);
  color: var(--el-text-color-regular);
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}
.pf-back-btn:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.pf-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  align-self: flex-start;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  padding: 2px 8px;
  border-radius: var(--el-border-radius-round);
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/*
 * 滚动交给外层 .l-dialog__body（LDialog 里已设 flex:1 / min-height:0 / overflow-y:auto）。
 * 这里不要再设 max-height + overflow，否则会形成「双层滚动容器」：
 * 表单被硬卡在 64vh，卡片自身 overflow:hidden 再把内容裁掉。
 *
 * 版式（2026-11-12）：对齐「简洁表单」口径 —— 左侧标签 + 右侧控件同行，
 * 不再用带图标头的分区卡片；高级项收进「高级」折叠区。
 */
.pf-body {
  padding: 2px 2px 6px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 一行：左标签（右对齐）+ 右控件 */
.pf-line {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}
.pf-line-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 20px;
  padding-top: 6px;
  text-align: right;
  white-space: normal;
}
.pf-line-ctrl {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.pf-line-ctrl.pf-inline { flex-direction: row; align-items: center; gap: 8px; flex-wrap: wrap; }
.pf-note {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}
.pf-note code {
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 11px;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
  word-break: break-all;
}
.pf-note strong { color: var(--el-text-color-primary); }
/* 并排两张输入（自定义认证头名 / 前缀） */
.pf-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
/* 多协议端点：协议名 + 地址一行 */
.pf-endpoint { display: grid; grid-template-columns: 76px minmax(0, 1fr); gap: 8px; align-items: center; }
.pf-endpoint-name { font-size: 12px; color: var(--el-text-color-secondary); }
/* 限流三项：数字框不铺满整行 */
.pf-num { width: 160px; }
/* 必填标记：只在真正会挡住保存的字段上出现 */
.pf-req { color: var(--el-color-danger); margin-right: 4px; }
/* 协议分段器：四个协议一行铺满，比下拉少一次点击 */
.pf-seg { width: 100%; }
.pf-seg :deep(.el-segmented__item-label) {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0 4px;
}
/* 输入框聚焦不弹高亮：相关样式已全部移除，聚焦前后视觉一致 */
/* ONNX 模型根目录：只读输入 + 绑定按钮并排 */
.pf-root { display: flex; gap: 8px; align-items: stretch; }
.pf-root-input { flex: 1; }

/* 高级折叠 */
.pf-more { border-top: 1px solid var(--el-border-color-lighter); padding-top: 6px; }
.pf-more-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: transparent;
  padding: 4px 0;
  font-size: 13px;
  color: var(--el-text-color-regular);
  cursor: pointer;
}
.pf-more-toggle:hover { color: var(--el-color-primary); }
/* 折叠态摘要：已配项用轻量 chip 呈现，扫一眼就知道有没有配过 */
.pf-more-chips { display: inline-flex; align-items: center; gap: 4px; margin-left: 4px; flex-wrap: wrap; }
.pf-chip {
  font-size: 11px; line-height: 18px; padding: 0 7px; border-radius: 9px;
  color: var(--el-color-primary); background: var(--el-color-primary-light-9);
}
.pf-more-hint { margin-left: 4px; font-size: 11px; color: var(--el-text-color-disabled); }
/* 高级区分组标题：请求 / 网络与限流，用上间距与小字号建立层级，不加边框噪音 */
.pf-section {
  margin-top: 4px; font-size: 11px; font-weight: 600; letter-spacing: .04em;
  color: var(--el-text-color-secondary);
}
.pf-section::after {
  content: ''; display: block; margin-top: 6px; height: 1px;
  background: var(--el-border-color-lighter);
}
.pf-more-arrow { transition: transform 0.18s ease; }
.pf-more-arrow.is-open { transform: rotate(180deg); }
.pf-more-body { display: flex; flex-direction: column; gap: 10px; padding-top: 6px; }

/* 模型路由表（免费渠道专属） */
.pf-routes { border-top: 1px solid var(--el-border-color-lighter); padding-top: 8px; }
.pf-routes-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.pf-routes-title { font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); }
.pf-routes-add { margin-left: auto; }


/* ReSelect（@repo/ui）自带 modern 样式，用 :not(.re-select) 把它排除在本文件的
   通用输入框覆盖之外，避免两套圆角/边框规则互相打架 */
.pf-body :deep(.el-input__wrapper),
.pf-body :deep(.el-textarea__inner),
.pf-body :deep(.el-select:not(.re-select) .el-select__wrapper) {
  border-radius: 6px;
}
.pf-body :deep(.el-input__prefix) { color: var(--el-text-color-disabled); }
/* ReSelect 触发栏铺满容器（组件默认 display:block，这里只保证宽度） */
.auth-select { width: 100%; }

/* Key 管理 */
.pf-keys { display: flex; flex-direction: column; gap: 6px; }
.key-row { display: flex; align-items: center; gap: 6px; }
.key-row .el-input { flex: 1; }
.key-eye {
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--el-text-color-disabled);
  display: inline-flex;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.15s ease;
}
.key-eye:hover { color: var(--el-text-color-primary); background: var(--el-fill-color-light); }
.key-remove {
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--el-text-color-disabled);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  transition: all 0.15s ease;
  flex-shrink: 0;
}
.key-remove:hover { color: var(--el-color-danger); background: var(--el-color-danger-light-9); }

/* 添加 Key / 获取 Key：轻量文字按钮，和简洁版式一致 */
.pf-add {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 10px;
  border: 1px dashed var(--el-border-color);
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.pf-add:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
/* 「添加 Key」旁的纯图标删除按钮 */
.pf-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}
.pf-remove:hover {
  color: var(--el-color-danger);
  border-color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}.pf-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  cursor: pointer;
  padding: 4px 2px;
}
.pf-link:hover { color: var(--el-color-primary); }
.pf-copy-btn { margin-left: 6px; font-size: 11px; }

/* 账号渠道：已绑定账号列表 */
.ch-conn-list { list-style: none; margin: 4px 0 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
.ch-conn-list li { display: flex; align-items: center; gap: 6px; }
.ch-conn-label { color: var(--el-text-color-regular); }
.ch-conn-state { font-size: 11px; padding: 0 5px; border-radius: 4px; background: var(--el-fill-color); }
.ch-conn-state.is-valid { color: var(--el-color-success); background: var(--el-color-success-light-9); }
.ch-conn-state.is-stale { color: var(--el-color-warning); background: var(--el-color-warning-light-9); }

.test-result {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 12.5px;
  animation: pf-fade-in 0.25s ease;
  border: 1px solid transparent;
}
.test-result.is-success {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success-dark-2);
  border-color: color-mix(in srgb, var(--el-color-success) 30%, transparent);
}
.test-result.is-error {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger-dark-2);
  border-color: color-mix(in srgb, var(--el-color-danger) 30%, transparent);
}

@keyframes pf-fade-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.opt-two-line { display: flex; flex-direction: column; gap: 2px; line-height: 1.3; }
.opt-main { font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); }
.opt-sub { font-size: 11px; color: var(--el-text-color-regular); }

/* 底部 */
.pf-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}
.pf-testing { font-size: 12px; color: var(--el-color-primary); }
.pf-footer-btns { display: flex; justify-content: flex-end; gap: 10px; margin-left: auto; }
/* 按钮配色回归 Element Plus 默认：此前这里自造了背景色 / 边框色 / 主色阴影，
   与全局按钮口径不一致（悬停还会整块变色）。 */

/* 模型路由表（免费渠道专属：extra.routes 编辑态） */
.route-list { padding-top: 10px; display: flex; flex-direction: column; gap: 10px; }
.route-empty {
  text-align: center;
  padding: 20px 0;
  font-size: 12.5px;
  color: var(--el-text-color-regular);
}
.route-hint {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: var(--el-color-warning-light-9);
  border: 1px solid color-mix(in srgb, var(--el-color-warning) 30%, transparent);
  padding: 8px 10px;
  border-radius: 6px;
  line-height: 1.6;
}
.route-hint-icon { color: var(--el-color-warning); flex-shrink: 0; margin-top: 1px; }
.route-row {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color-overlay);
  overflow: hidden;
}
.route-row-main { padding: 10px 12px; display: flex; flex-direction: column; gap: 10px; }
.route-key { display: flex; align-items: center; gap: 8px; }
.route-key-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  min-width: 68px;
  flex-shrink: 0;
}
.route-target { display: grid; grid-template-columns: 1fr 1fr; gap: 0 10px; }
.route-target-col { display: flex; align-items: center; gap: 8px; }
.route-target-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  min-width: 52px;
  flex-shrink: 0;
}
.route-row-foot {
  display: flex;
  justify-content: flex-end;
  padding: 8px 12px;
  border-top: 1px solid var(--el-border-color-light);
}
.pf-foot-btn-delete {
  font-size: 12px;
  color: var(--el-color-danger);
  border-radius: var(--el-radius-md, 8px);
  transition: all 0.15s ease;
}
.pf-foot-btn-delete:hover { background: var(--el-color-danger-light-9); }
.pf-proto-icon { display: inline-flex; align-items: center; justify-content: center; }
/* OpenAI Response：openai logo + 右下角 R 小标（同一品牌家族，只是 Responses 变体） */
.pf-proto-stack { position: relative; display: inline-flex; align-items: center; justify-content: center; }
.pf-proto-badge {
  position: absolute; right: -5px; bottom: -5px;
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 11px; height: 11px; padding: 0 2px; border-radius: 6px;
  background: var(--el-fill-color-blank); color: var(--el-color-primary);
  border: 1px solid var(--el-color-primary-light-5);
  font-size: 8px; line-height: 1; font-weight: 700; font-style: normal;
}
/* 选中态底色是主题色：图标统一反白，彩色品牌图才不会糊在蓝底上 */
.pf-seg :deep(.el-segmented__item.is-selected .pf-proto-icon img) {
  filter: brightness(0) invert(1);
}
.pf-seg :deep(.el-segmented__item.is-selected) .pf-proto-icon .avatar-auto {
  color: #fff;
  background: transparent !important;
}
/* 选中态的小标反过来：白底蓝字，压在主题色底上依然看得清 */
.pf-seg :deep(.el-segmented__item.is-selected) .pf-proto-badge {
  background: #fff;
  color: var(--el-color-primary);
  border-color: #fff;
}
.pf-detect-btn { border: none; padding: 0 4px; }
.pf-detect { display: flex; flex-direction: column; gap: 8px; }
.pf-detect-empty { padding: 12px 0; color: var(--el-text-color-secondary); }
.pf-detect-row {
  display: flex; align-items: center; gap: 10px; padding: 9px 12px;
  border: 1px solid var(--el-border-color-lighter); border-radius: 8px;
}
.pf-detect-row.is-ok { border-color: var(--el-color-success-light-5); background: var(--el-color-success-light-9); }
/* 404 是正常结论（这个地址就是没有该协议的端点），用中性色，不要报警色 */
.pf-detect-row.is-na { border-color: var(--el-border-color-lighter); background: var(--el-fill-color-lighter); }
.pf-detect-row.is-bad { border-color: var(--el-color-danger-light-5); background: var(--el-color-danger-light-9); }
.pf-detect-name { font-size: 13px; font-weight: 600; min-width: 128px; }
.pf-detect-url { font-size: 11px; color: var(--el-text-color-secondary); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pf-detect-state { font-size: 12px; padding: 1px 8px; border-radius: 999px; color: #fff; flex: none; }
.pf-detect-row.is-ok .pf-detect-state { background: var(--el-color-success); }
.pf-detect-row.is-na .pf-detect-state { background: var(--el-text-color-secondary); }
.pf-detect-row.is-bad .pf-detect-state { background: var(--el-color-danger); }
.pf-detect-msg { font-size: 12px; color: var(--el-text-color-secondary); }
.pf-detect-foot { margin: 10px 0 0; font-size: 12px; color: var(--el-text-color-secondary); }
</style>

<style>
/* 弹框在 body 下（teleport），scoped 打不到，这里非 scoped 限定 .provider-modal。
   聚焦相关样式已全部删除，聚焦前后不改变描边与颜色。 */
</style>