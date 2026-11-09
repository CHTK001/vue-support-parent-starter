/**
 * 渠道管理 API（`/api/channels`）
 *
 * 登录用户接口，与 `pages/ai/src/services/javaApi.ts` 中的 `channelApi` 同源但
 * **自行创建请求客户端**（所有官方渠道的逻辑抽离到此包后，不能再借 pages/ai 的
 * `@/framework/context`）：
 *
 * `createHttp({ baseUrl: '', useAppConfig: false })` 不传 `instance`，默认挂到
 * `createApp` 注入的全局 axios 实例（Bearer 注入 / 第一方头 / 401 / 统一提示都在
 * 那条管线上），从而让本包只依赖 `@repo/utils` 即可完整工作。
 *
 * 句柄结构由后端统一写 `verifyUrl`；时钟类型（`pending`/`done`/`failed`/`error` 等）
 * 与 `ApiChannelAuthSseHandler` 对齐。
 */
import { createHttp, createSseClient, unwrapResult } from '@repo/utils'
import type {
  ChainableRequest,
  Http,
  RequestBody,
  SseClient,
  SseClientOptions,
} from '@repo/utils'

/**
 * 把 axios / 业务失败统一转成「能给人看」的 Error。
 *
 * <p>axios 对非 2xx 只给 {@code Request failed with status code 403}，真正的原因
 * （后端 msg、跨域白名单拒绝的纯文本等）全在 {@code error.response.data} 里。
 * 页面若直接取 {@code e.message}，用户看到的永远是一句和业务无关的英文状态码
 * ——「绑定 Kilo 时报 403」当初就是这样把「Origin 被 CORS 白名单拒绝」藏掉的。</p>
 *
 * @param error 捕获到的异常
 * @returns 带后端信息的 Error（保留原始 HTTP 状态码）
 */
function toReadableError(error: unknown): Error {
  const source = error as {
    message?: string
    response?: { data?: unknown; status?: number }
  }
  const data = source?.response?.data
  let text = ''
  if (typeof data === 'string') {
    text = data.trim()
  } else if (data && typeof data === 'object') {
    /*
     * 异常处理器会把真正的失败信封再包一层统一响应：
     * `{ code: '00000', msg: '操作成功', data: { success: false, code, error } }`。
     * 只看外层 msg 会把「失败」显示成「操作成功」——「刷新失败：操作成功」就是这么来的。
     * 内层明确失败时优先取其 error / message / msg，外层只作兜底。
     */
    const pickFailure = (value: unknown, depth: number): string => {
      if (!value || typeof value !== 'object' || depth > 4) return ''
      const row = value as Record<string, unknown>
      const failed = row.success === false || row.ok === false || row.code === 'INTERNAL_ERROR'
      if (failed) {
        const own = String(row.error ?? row.message ?? row.msg ?? '').trim()
        if (own && own !== '操作成功') return own
      }
      return pickFailure(row.data, depth + 1)
    }
    text = pickFailure(data, 0)
    if (!text) {
      text = String((data as Record<string, unknown>).msg
        ?? (data as Record<string, unknown>).message
        ?? (data as Record<string, unknown>).error
        ?? '').trim()
    }
  }
  // 「操作成功」出现在错误路径上没有任何信息量，宁可退回 axios 的原文/状态码。
  if (text === '操作成功') text = ''
  if (!text) {
    text = String(source?.message ?? error ?? '').trim()
  }
  if (!text) {
    text = '请求失败'
  }
  if (/invalid cors request/i.test(text)) {
    // 后端 CorsFilter 只回这一句纯文本，不解释是哪个 Origin 被拒
    text = '被后端跨域白名单拒绝（Invalid CORS request）：'
      + '请确认 dev 代理已剥离 Origin，或把当前访问地址加入 plugin.api.cors.allowed-origins'
  }
  const readable = new Error(text) as Error & { status?: number }
  if (source?.response?.status !== undefined) {
    readable.status = source.response.status
  }
  return readable
}

/**
 * 兼容两种返回形态：统一包装（`{ code, data }`）与直接返回体。
 *
 * 后端部分接口经 `@ApiReturnFormatIgnore` 直接返回 `ApiResult`，其余由统一响应
 * 解码器包一层；这里复用 `@repo/utils` 的 {@link unwrapResult} 统一穿透：
 * 既剥掉 `{ code, data, msg }` 信封，也把后端业务失败码转成可 catch 的 Error，
 * 避免「HTTP 200 + 业务失败」被当成成功数据渲染。
 *
 * <p>HTTP 层失败（4xx/5xx）在这里统一转成 {@link toReadableError}，
 * 页面拿到的 {@code e.message} 即后端真实原因。</p>
 *
 * @param request 可等待的请求句柄
 * @returns 业务数据
 */
async function unwrapPayload<T>(request: unknown): Promise<T> {
  let payload: unknown
  try {
    payload = await (request as Promise<unknown>)
  } catch (error) {
    throw toReadableError(error)
  }
  return unwrapResult<T>(payload)
}

/** SseClient 构造参数（SSE 事件回调，与 pages/ai 的原始契约一致） */
export interface ChannelSseHandlers {
  onPending?: (data: { handle?: Record<string, any> }) => void
  onDone?: (data: { connectionId?: string; label?: string }) => void
  onFailed?: (data: { message?: string; code?: string }) => void
  onError?: (err: unknown) => void
  /** 流正常结束（服务端 complete）时回调 */
  onClose?: () => void
}

/**
 * `channelApi` 统一使用本包自己造的根路径客户端（`/api/**` 在 flash 的
 * `baseUrl: ''` 下，浏览器直接相对路径 `/api/...`），不再借 `pages/ai` 的
 * `@/framework/context` 和 router 上下文。
 */
const apiHttp: Http = createHttp({ baseUrl: '', useAppConfig: false })

/** 渠道账号连接摘要（不含 credentials 原文） */
export interface ChannelConnectionSummary {
  connectionId: string
  label?: string
  role?: string
  /** 是否为主账号（role=default）；status / refresh / checkin / list-models 缺省落在它上面 */
  primary?: boolean
  hasCredentials?: boolean
  status?: string
  /** 绑定时间（毫秒），用于账号排序 */
  createdAt?: number
  updatedAt?: number
  /** 凭据到期时间（毫秒），缺省表示长期有效 */
  expiresAt?: number | null
  /** 最近一次签到时间（毫秒）；由各渠道 SPI 写入连接凭据的 checkin_at */
  checkinAt?: number | null
  /** 最近一次签到的人话摘要（如「workbuddy 处理 1 个账号」）；无则不回字段 */
  checkinMessage?: string
  /** 连接所属渠道标识 */
  channel?: string
}

/** 账号寻址参数：connectionId 优先，label 仅作旧接口兜底 */
export interface ChannelAccountRef {
  connectionId?: string
  label?: string
  /**
   * 允许附加后端扩展字段。
   *
   * `@repo/utils` 的 `.data()` 形参是 `RequestBody = Record<string, unknown>`，
   * 纯接口类型没有索引签名时无法赋值（TS2345）；补一个 `unknown` 索引签名即可，
   * 既保留字段的类型提示，又满足请求体契约。
   */
  [key: string]: unknown
}

/** 渠道种类：AI（账号类）/ CHAT（ChatClient 免登录对话）/ IMAGE（文生图）/ SMS（接码）/ EMAIL（收信） */
export type ChannelKind = 'AI' | 'CHAT' | 'IMAGE' | 'SMS' | 'EMAIL'

/** 账号类型：FIXED（固定，长期绑定）/ TEMPORARY（临时，一次性虚拟身份） */
export type AccountType = 'FIXED' | 'TEMPORARY'

/** 渠道级摘要 */
export interface ChannelSummary {
  channel: string
  displayName?: string
  loginMethod?: string
  /** 渠道种类（后端 SPI 输出；历史响应可能缺省，缺省按 AI 处理） */
  kind?: ChannelKind | string
  /** 本渠道支持的账号类型（缺省按仅 FIXED 处理） */
  accountTypes?: Array<AccountType | string>
  supportsCheckin?: boolean
  /**
   * 是否由本服务代为自动签到。
   *
   * <p>magpie 这类网关自己就有签到定时器，本服务必须让开，否则两边同时打上游；
   * 缺省按 {@code true} 处理（历史渠道都是本服务代签）。</p>
   */
  supportsAutoCheckin?: boolean
  /**
   * 是否有上游控制台（{@code ChannelUpstreamAdmin}）。
   *
   * <p>为 {@code true} 时前端才显示「上游 provider / 插件 / 登录」这些页签，
   * 不再靠 {@code channel === 'magpie'} 硬编码。</p>
   */
  supportsUpstream?: boolean
  /** 上游插件管理（网关型渠道，如 magpie） */
  supportsPlugins?: boolean
  /** 上游登录（打开授权页 + 轮询会话） */
  supportsSignin?: boolean
  supportsRefresh?: boolean
  /** 是否支持积分 / 余额查询（ChannelCreditProvider SPI 存在时为 true） */
  supportsCredit?: boolean
  /** 是否支持成长任务（ChannelTaskProvider SPI 存在时为 true） */
  supportsTask?: boolean
  providerId?: string
  enabled?: boolean
  /**
   * 进入优先级（后端 `ChannelProvider#priority`，数值越大越优先）。
   * 同 kind 多渠道并存时用于展示「默认数据源」，临时身份创建时缺省取最高者。
   */
  priority?: number
  /** 是否为 ChatClient 免登录对话渠道（kind=CHAT 时为 true） */
  chatClient?: boolean
  /** 是否为文生图渠道（kind=IMAGE 时为 true） */
  imageClient?: boolean
  /** 对话渠道是否同时具备文生图能力（如 Trae） */
  supportsImage?: boolean
  connections?: ChannelConnectionSummary[]
  models?: Array<{ model: string; enabled: boolean; alias?: string; contextWindow?: number }>
}

export const channelApi = {
  /** GET /api/channels —— 全部渠道（含未绑定账号的） */
  list: () => unwrapPayload<ChannelSummary[]>(apiHttp.get('/api/channels')),
  /** POST /api/channels/{channel}/start-login —— 发起绑定，返回轮询句柄 */
  startLogin: (channel: string) =>
    unwrapPayload<{ channel: string; handle: Record<string, any> }>(
      apiHttp.post(`/api/channels/${channel}/start-login`),
    ),
  /** POST /api/channels/{channel}/poll —— 按句柄轮询；pending=true 表示仍在等待 */
  poll: (channel: string, body: { handle: Record<string, any>; label?: string }) =>
    unwrapPayload<{ ok: boolean; pending?: boolean; connectionId?: string }>(
      apiHttp.post(`/api/channels/${channel}/poll`).data(body),
    ),
  /**
   * GET /api/channels/{channel}/sse-login?timeoutSec= —— 账号绑定的 SSE 流（替代前端轮询）。
   *
   * 事件：`pending`（附回显 handle）/ `done`（附 connectionId）/ `failed`（附 message）。
   * 后端在任一终态后关流，故这里 `reconnect: false`。
   *
   * @param channel    渠道标识
   * @param body       { handle, label?, intervalMs? }
   * @param handlers   事件回调；返回 sse 客户端（调用 close() 中止）
   */
  sseLogin: (
    channel: string,
    body: { handle: Record<string, any>; label?: string; intervalMs?: number },
    handlers: ChannelSseHandlers,
    timeoutSec = 180,
  ) =>
    createSseClient<Record<string, any>>(`/api/channels/${channel}/sse-login?timeoutSec=${timeoutSec}`, {
      method: 'POST',
      body,
      reconnect: false,
      onMessage: (event: any) => {
        // SSE 事件名在 event 字段（fetch-event-source 形态），内容在 data
        const name = String(event?.event ?? event?.type ?? '')
        const data = (event?.data ?? event) as Record<string, any>
        if (name === 'pending') handlers.onPending?.(data)
        else if (name === 'done') handlers.onDone?.(data)
        else if (name === 'failed') handlers.onFailed?.(data)
      },
      onError: handlers.onError,
      onClose: handlers.onClose,
    }),
  /**
   * POST /api/channels/{channel}/refresh —— 刷新单个账号的凭据。
   *
   * ⚠️ 请求体必须走 `.data(body)`：`post(url)` 只接受 URL，第二个参数会被忽略，
   * 后端收不到寻址参数时无法定位要刷新的账号。
   *
   * 寻址优先级 connectionId > label > 主账号。
   */
  refresh: (channel: string, body: ChannelAccountRef) =>
    unwrapPayload<{ ok: boolean; refreshed?: boolean; message?: string }>(
      // noToast：刷新失败要由页面按「能力边界 / 真实故障」分别提示，避免拦截器
      // 先弹一条与业务无关的 5xx 通用错误，再被页面拼成「刷新失败：操作成功」。
      apiHttp.post(`/api/channels/${channel}/refresh`).noToast(true).data(body),
    ),
  /** POST /api/channels/{channel}/checkin —— 签到/领额度（寻址同 refresh） */
  checkin: (channel: string, body: ChannelAccountRef) =>
    unwrapPayload<{ ok: boolean; channel: string; label: string; result: Record<string, any> }>(
      apiHttp.post(`/api/channels/${channel}/checkin`).data(body),
    ),
  /**
   * GET /v2/settings/global —— 全局分组设置（含自动签到开关）。
   *
   * 「自动签到」由后端 {@code ChannelCheckinTask} 读全局键
   * {@code enable_channel_checkin} 驱动，不按渠道落库；渠道页只在带签到能力的
   * 渠道下读它回显开关，避免每次进页都多打一次设置接口。
   */
  globalSettings: () =>
    unwrapPayload<Record<string, any>>(apiHttp.get('/v2/settings/global')),
  /**
   * PUT /v2/settings/global —— 写全局分组设置（仅管理员；普通账号会 403）。
   *
   * 自动签到传 {@code { enable_channel_checkin: 'true' | 'false' }}：设置值统一
   * 按字符串落库，后端 {@code GlobalSettingReader#getBool} 能解析。
   */
  saveGlobalSettings: (patch: Record<string, unknown>) =>
    unwrapPayload<Record<string, any>>(
      apiHttp.put('/v2/settings/global').data(patch),
    ),
  /**
   * POST /api/channels/{channel}/credit —— 积分 / 余额查询（只读，不触发签到）。
   *
   * 与 `checkin` 分开：签到是动作（每天一次），本接口是读数（随时可查）。
   * 渠道页的「积分」页签靠它渲染。
   */
  credit: (channel: string, body: ChannelAccountRef) =>
    unwrapPayload<{
      ok: boolean
      channel: string
      label: string
      message?: string
      credit: {
        remain?: number
        total?: number
        unit?: string
        currency?: string
        plan?: string
        exceeded?: boolean
        expiresAt?: number
        updatedAt?: number
        packages?: Array<{ name?: string; remain?: number; size?: number; expiresAt?: number | string }>
        error?: string
        warning?: string
      }
    }>(apiHttp.post(`/api/channels/${channel}/credit`).data(body)),
  /** POST /api/channels/{channel}/tasks —— 成长任务清单（只读） */
  tasks: (channel: string, body: ChannelAccountRef) =>
    unwrapPayload<{
      ok: boolean
      channel: string
      label: string
      message?: string
      tasks: Array<{
        code: string
        title?: string
        description?: string
        current?: number
        target?: number
        acceptStatus?: string
        claimable?: boolean
        claimed?: boolean
        credit?: number
        energy?: number
        jumpUrl?: string
        error?: string
      }>
    }>(apiHttp.post(`/api/channels/${channel}/tasks`).data(body)),
  /** POST /api/channels/{channel}/tasks/claim —— 领取单个任务奖励 */
  claimTask: (channel: string, body: ChannelAccountRef & { taskCode: string }) =>
    unwrapPayload<{
      ok: boolean
      channel: string
      label: string
      result: { ok?: boolean; claimed?: boolean; credit?: number; message?: string }
    }>(apiHttp.post(`/api/channels/${channel}/tasks/claim`).data(body)),
  /** POST /api/channels/{channel}/tasks/run —— 一键做任务（报名 + 领奖，幂等） */
  runTasks: (channel: string, body: ChannelAccountRef) =>
    unwrapPayload<{
      ok: boolean
      channel: string
      label: string
      summary: { accepted?: number; claimed?: number; credit?: number; messages?: string[] }
    }>(apiHttp.post(`/api/channels/${channel}/tasks/run`).data(body)),
  /** POST /api/channels/{channel}/list-models —— 拉取账号当前可用模型（寻址同 refresh） */
  listModels: (channel: string, body: ChannelAccountRef) =>
    unwrapPayload<{ ok: boolean; models: Array<{ id: string; name?: string; contextWindow?: number }> }>(
      apiHttp.post(`/api/channels/${channel}/list-models`).data(body),
    ),
  /** POST /api/channels/{channel}/import-models —— 调 SPI listModels 并落库 sys_ai_provider_model */
  importModels: (channel: string, body: ChannelAccountRef) =>
    unwrapPayload<{ ok: boolean; channel: string; created: number; updated: number; total: number }>(
      apiHttp.post(`/api/channels/${channel}/import-models`).data(body),
    ),
  /** PUT /api/channels/{channel}/models/{model}/enabled —— 单模型开关 */
  setModelEnabled: (channel: string, model: string, enabled: boolean) =>
    unwrapPayload<{ ok: boolean; model: string; enabled: boolean }>(
      apiHttp.put(`/api/channels/${channel}/models/${encodeURIComponent(model)}/enabled`).data({ enabled }),
    ),
  /** PUT /api/channels/{channel}/enabled —— 渠道总开关 */
  setEnabled: (channel: string, enabled: boolean) =>
    unwrapPayload<{ ok: boolean; enabled: boolean }>(
      apiHttp.put(`/api/channels/${channel}/enabled`).data({ enabled }),
    ),
  /** GET /api/channels/{channel}/status?label=&connectionId= —— 凭据状态探活 */
  status: (channel: string, ref?: ChannelAccountRef | string) =>
    unwrapPayload<{ ok: boolean; status?: string; details?: Record<string, any> }>(
      apiHttp.get(`/api/channels/${channel}/status`).query(
        typeof ref === 'string' ? { label: ref } : (ref ?? {}),
      ),
    ),
  /**
   * POST /api/channels/{channel}/delete-connection —— 删除某账号。
   *
   * 写操作必须带 connectionId 或 label，后端不会静默回退到主账号。
   */
  deleteConnection: (channel: string, ref: ChannelAccountRef) =>
    unwrapPayload<unknown>(
      apiHttp.post(`/api/channels/${channel}/delete-connection`).data(ref),
    ),
  /**
   * POST /api/channels/{channel}/rename-connection —— 修改账号显示名。
   *
   * 用 connectionId 定位要改的账号（label 是本次要改的字段，不能拿它当唯一键）；
   * newLabel 由调用方保证非空。
   */
  renameConnection: (channel: string, body: ChannelAccountRef & { newLabel: string }) =>
    unwrapPayload<{
      ok: boolean
      channel: string
      connectionId: string
      label: string
      primary?: boolean
      expiresAt?: number | null
    }>(apiHttp.post(`/api/channels/${channel}/rename-connection`).data(body)),
  /**
   * POST /api/channels/{channel}/set-primary —— 把指定账号切换为主账号。
   *
   * 后端会把同渠道当前 default 降级为 backup，保证主账号唯一。
   */
  setPrimary: (channel: string, ref: ChannelAccountRef) =>
    unwrapPayload<{
      ok: boolean
      channel: string
      connectionId: string
      label: string
      primary?: boolean
      expiresAt?: number | null
    }>(apiHttp.post(`/api/channels/${channel}/set-primary`).data(ref)),
  /**
   * GET /api/channels/{channel}/chat-models —— 免登录对话渠道的实时模型清单。
   *
   * 用于「试对话」面板刷新模型（渠道列表里的 `models` 是同一份数据，刷新按钮走这里）。
   */
  chatModels: (channel: string) =>
    unwrapPayload<{
      ok: boolean
      /** 渠道是否就绪：底层 ChatClient 扩展已注册时为 true */
      available?: boolean
      /** 不可用原因（如宿主工程未引入 duckduckgo 模块） */
      reason?: string
      channel: string
      models: Array<{ id: string; name?: string; contextWindow?: number }>
    }>(apiHttp.get(`/api/channels/${channel}/chat-models`)),
  /**
   * POST /api/channels/{channel}/chat —— 免登录对话渠道试对话（同步返回完整回答）。
   *
   * 每次调用后端新建客户端、结束即关闭，不产生凭据与会话。
   */
  chat: (channel: string, body: { prompt: string; model?: string; system?: string; token?: string }) =>
    unwrapPayload<{
      ok: boolean
      channel: string
      model?: string | null
      answer: string
      elapsedMs?: number
    }>(apiHttp.post(`/api/channels/${channel}/chat`).data(body)),
  /**
   * GET /api/channels/{channel}/image-models —— 文生图渠道的可选模型。
   */
  imageModels: (channel: string) =>
    unwrapPayload<{
      ok: boolean
      channel: string
      models: Array<{ id: string; name?: string }>
      /** 渠道是否可用（false 时 models 为空，reason 给出原因） */
      available?: boolean
      /** 不可用原因（如宿主未引入对应 ChatClient 模块） */
      reason?: string
    }>(apiHttp.get(`/api/channels/${channel}/image-models`)),
  /**
   * POST /api/channels/{channel}/images —— 文生图。
   *
   * `token` 仅对需要登录态的渠道（如 Trae）有效：只在本请求内使用，不落库。
   * 免登录渠（如 Pollinations）返回的是「按需出图」URL，浏览器加载时才开始渲染。
   */
  generateImage: (
    channel: string,
    body: {
      prompt: string
      ratio?: string
      n?: number
      width?: number
      height?: number
      model?: string
      token?: string
    },
  ) =>
    unwrapPayload<{
      ok: boolean
      channel: string
      prompt: string
      images: Array<{
        key?: string
        url: string
        thumbUrl?: string
        width?: number
        height?: number
        format?: string
      }>
      elapsedMs?: number
    }>(apiHttp.post(`/api/channels/${channel}/images`).data(body)),
  /**
   * GET /api/channels/chat-channels —— 全部免登录对话渠道元数据（ChatClient SPI）。
   *
   * 与 image-channels 对称：后端把免登录渠道放在独立 SPI 注册表，/api/channels
   * 只回 AI 账号渠道。渠道页 loadChannels() 三路合并后 DuckDuckGo / Trae 才会出现。
   */
  chatChannels: () =>
    unwrapPayload<{
      ok: boolean
      channels: Array<{
        channel: string
        displayName?: string
        extension?: string | null
        priority?: number
        supportsImage?: boolean
      }>
    }>(apiHttp.get('/api/channels/chat-channels')),
  /**
   * GET /api/channels/image-channels —— 全部文生图渠道元数据。
   */
  imageChannels: () =>
    unwrapPayload<{
      ok: boolean
      channels: Array<{
        channel: string
        displayName?: string
        extension?: string | null
        priority?: number
        models?: Array<{ id: string; name?: string }>
      }>
    }>(apiHttp.get('/api/channels/image-channels')),
  /**
   * GET /api/accounts?channelKey= —— 某渠道下的账号（统一账号管理）。
   *
   * <p>渠道管理只有一种模型：渠道 + 账号。AI 账号渠道与免登录渠道
   * （DuckDuckGo / Trae / Pollinations）都按同一个接口挂账号，
   * 免登录渠道的密钥可留空或随意填，不额外提供操作页。</p>
   */
  accounts: (channelKey: string) =>
    unwrapPayload<ChannelAccount[]>(
      apiHttp.get('/api/accounts').query({ channelKey }),
    ),
  /** POST /api/accounts —— 新增账号（secret 为明文，服务端加密落库） */
  createAccount: (account: ChannelAccountInput) =>
    unwrapPayload<ChannelAccount>(
      apiHttp.post('/api/accounts').data(account as unknown as Record<string, unknown>),
    ),
  /** DELETE /api/accounts/{accountId} —— 逻辑删除账号 */
  deleteAccount: (accountId: string) =>
    unwrapPayload<boolean>(apiHttp.delete(`/api/accounts/${accountId}`)),
  /**
   * GET /api/channels/{channel}/providers —— Magpie 网关的上游 provider 清单。
   *
   * <p>只有 {@code magpie} 渠道有这一层：magpie 是常驻网关，上游 provider 由它自己
   * 维护。接口代理 magpie 管理面的 {@code /api/providers}，API key 已脱敏。</p>
   */
  magpieProviders: (channel: string, ref?: ChannelAccountRef) =>
    unwrapPayload<MagpieProviderList>(
      apiHttp.get(`/api/channels/${channel}/providers`).query(ref ?? {}),
    ),
  /**
   * POST /api/channels/{channel}/providers —— 新增 / 覆盖 / 重命名上游 provider。
   *
   * <p>{@code provider.key} 留空表示保留原 key（magpie 的 save 语义）；
   * 改名时把旧 id 放 {@code from}。</p>
   */
  saveMagpieProvider: (
    channel: string,
    body: {
      connectionId?: string
      label?: string
      provider: Record<string, unknown>
      isNew?: boolean
      from?: string
    },
  ) =>
    unwrapPayload<{ ok: boolean; channel: string; result: Record<string, unknown> }>(
      apiHttp.post(`/api/channels/${channel}/providers`).data(body),
    ),
  /** POST /api/channels/{channel}/providers/delete —— 删除上游 provider */
  deleteMagpieProvider: (channel: string, body: { connectionId?: string; label?: string; id: string }) =>
    unwrapPayload<{ ok: boolean; channel: string; result: Record<string, unknown> }>(
      apiHttp.post(`/api/channels/${channel}/providers/delete`).data(body),
    ),
  /**
   * POST /api/channels/{channel}/providers/{action} —— 上游分项动作。
   *
   * <p>{@code action} 仅 {@code detect} / {@code models} / {@code test}。</p>
   */
  magpieProviderAction: (
    channel: string,
    action: 'detect' | 'models' | 'test',
    body: { connectionId?: string; label?: string; provider: Record<string, unknown> },
  ) =>
    unwrapPayload<{ ok: boolean; channel: string; result: Record<string, unknown> }>(
      apiHttp.post(`/api/channels/${channel}/providers/${action}`).data(body),
    ),
  /**
   * GET /api/channels/{channel}/plugins —— 网关插件清单（可带市场）。
   *
   * <p>{@code market=true} 会访问 npm / GitHub，较慢，应单独触发。</p>
   */
  magpiePlugins: (channel: string, ref?: ChannelAccountRef, market = false) =>
    unwrapPayload<{ ok: boolean; channel: string; result: MagpiePluginState }>(
      apiHttp.get(`/api/channels/${channel}/plugins`).query({ ...(ref ?? {}), market }),
    ),
  /**
   * POST /api/channels/{channel}/plugins/{op} —— 插件动作。
   *
   * <p>{@code add} 首次会下载 Bun，可能超过 100 秒，调用方要按长任务处理。</p>
   */
  magpiePluginAction: (
    channel: string,
    op: 'add' | 'remove' | 'update' | 'upgrade' | 'off' | 'options' | 'prefer' | 'registry' | 'mirror' | 'check',
    body: {
      connectionId?: string
      label?: string
      spec?: string
      off?: boolean
      options?: Record<string, unknown>
      provider?: string
      [key: string]: unknown
    },
  ) =>
    unwrapPayload<{ ok: boolean; channel: string; result: MagpiePluginState }>(
      apiHttp.post(`/api/channels/${channel}/plugins/${op}`).data(body),
    ),
  /**
   * POST /api/channels/{channel}/signin —— 发起上游登录。
   *
   * <p>插件 provider 传 {@code provider + method}，内置 provider 传 {@code agent}。
   * 返回的 {@code url} 由页面打开，凭据不经过本服务。</p>
   */
  magpieSignin: (
    channel: string,
    body: {
      connectionId?: string
      label?: string
      plugin?: boolean
      provider?: string
      method?: number
      inputs?: Record<string, string>
      key?: string
      agent?: string
      site?: string
    },
  ) =>
    unwrapPayload<{ ok: boolean; channel: string; result: MagpieSigninSession }>(
      apiHttp.post(`/api/channels/${channel}/signin`).data(body),
    ),
  /** GET /api/channels/{channel}/signin/{id} —— 轮询登录会话 */
  magpieSigninStatus: (channel: string, id: string, ref?: ChannelAccountRef) =>
    unwrapPayload<{ ok: boolean; channel: string; result: MagpieSigninSession }>(
      apiHttp.get(`/api/channels/${channel}/signin/${encodeURIComponent(id)}`).query(ref ?? {}),
    ),
  /** POST /api/channels/{channel}/signin/{id}/cancel —— 取消登录会话 */
  magpieSigninCancel: (channel: string, id: string, body?: { connectionId?: string; label?: string }) =>
    unwrapPayload<{ ok: boolean; channel: string; result: Record<string, unknown> }>(
      apiHttp.post(`/api/channels/${channel}/signin/${encodeURIComponent(id)}/cancel`).data(body ?? {}),
    ),
  /** GET /api/channels/{channel}/quotas —— 管理面额度卡（含签到状态与插件账号） */
  magpieQuotas: (channel: string, ref?: ChannelAccountRef, provider?: string, user?: string) =>
    unwrapPayload<{ ok: boolean; channel: string; result: { quotas?: MagpieQuota[] } }>(
      apiHttp.get(`/api/channels/${channel}/quotas`).query({
        ...(ref ?? {}),
        ...(provider ? { provider } : {}),
        ...(user ? { user } : {}),
      }),
    ),
  /** POST /api/channels/{channel}/quotas/refresh —— 让网关重新读一张额度卡 */
  magpieQuotaRefresh: (
    channel: string,
    provider: string,
    user?: string,
    ref?: ChannelAccountRef,
  ) =>
    unwrapPayload<{ ok: boolean; channel: string; result: { quotas?: MagpieQuota[] } }>(
      apiHttp.post(`/api/channels/${channel}/quotas/refresh`).query({
        ...(ref ?? {}),
        provider,
        ...(user ? { user } : {}),
      }),
    ),
}

/**
 * 渠道账号（`/api/accounts` 的读模型）。
 *
 * <p>敏感字段服务端一律清空，只回 {@code hasSecret}；渠道归属由 {@code channelKey} 表达。</p>
 */
export interface ChannelAccount {
  accountId: string
  /** 业务唯一键 */
  code?: string
  /** 展示名 */
  name?: string
  /** 账号种类（API_KEY / EMAIL / SMS） */
  kind?: string
  /** 所属渠道标识 */
  channelKey?: string
  /** 登录名 / 地址 */
  username?: string
  /** 是否已配置凭据（服务端不回明文） */
  hasSecret?: boolean
  status?: number
  defaultAccount?: boolean
  verifyStatus?: string
  verifyMessage?: string
  updatedAt?: number
  createdAt?: number
}

/** 新增账号的写入模型（{@code secret} 为明文，仅提交时使用） */
export interface ChannelAccountInput {
  code: string
  name: string
  kind: string
  channelKey: string
  username?: string
  secret?: string
  endpoint?: string
  status?: number
}

/**
 * Magpie 网关的上游 provider（管理面 {@code /api/providers} 的脱敏视图）。
 *
 * <p>{@code key} 只回末四位；{@code keyCount} 是 {@code keyList} 的条数
 * （magpie 的凭据在 {@code keyList} 里，不在 {@code provider.key} 上），
 * {@code hasKey} 表示网关里是否配置了凭据。其余字段原样透传，前端不解释。</p>
 */
export interface MagpieProvider {
  id?: string
  name?: string
  /** 创建时使用的内置 preset 标识 */
  preset?: string
  /** 脱敏后的 API key（如 {@code ****abcd}） */
  key?: string
  /** 是否已配置凭据（{@code key} 有值或 {@code keyList} 非空） */
  hasKey?: boolean
  /** {@code keyList} 条数 */
  keyCount?: number
  /** 插件接管后的账号数（magpie 的 {@code pluginAccounts}） */
  pluginAccounts?: number
  /** 脱敏后的凭据行 */
  keyList?: Array<Record<string, unknown>>
  /** OpenAI 兼容 chat 基址 */
  chat?: string
  /** Responses 协议基址 */
  responses?: string
  /** Anthropic 协议基址 */
  anthropic?: string
  /** Gemini 协议基址 */
  gemini?: string
  /** 该上游的模型（magpie 下发对象数组 {@code [{id,name}]}，也兼容字符串数组） */
  models?: Array<string | { id?: string; name?: string }>
  /** 其余 magpie 字段原样透传 */
  [key: string]: unknown
}

/** {@code /api/channels/{channel}/providers} 的响应 */
export interface MagpieProviderList {
  ok: boolean
  channel?: string
  /** 网关根地址（回显，便于确认连的是哪台） */
  baseUrl?: string
  /** 管理面地址（页面端口，默认 3430） */
  pageUrl?: string
  /** 管理面是否可用（页面没开 / 页面 Key 缺失时为 false） */
  manageable?: boolean
  providers?: MagpieProvider[]
  /** {@code ok=false} 时的原因 */
  message?: string
}

/**
 * 网关插件行（后端已把 magpie 内嵌的包 Entry 归一过）。
 *
 * <p>{@code moved} 是「接管了哪些内置 provider」，装完这个插件后这些 provider
 * 的 {@code move.state} 会变成 {@code plugin}，签到也得改走插件端点。</p>
 */
export interface MagpiePlugin {
  /** npm 规格，如 {@code @magpie-community/opencode-workbuddy-auth} */
  spec?: string
  name?: string
  /** 是否被手动停用（停用不等于卸载） */
  off?: boolean
  /** 已安装版本 */
  version?: string
  /** 市场最新版本，与 {@code version} 不同说明可升级 */
  latest?: string
  providers?: string[]
  /** 被本插件接管的内置 provider */
  moved?: string[]
  error?: string
  [key: string]: unknown
}

/** 插件状态：{@code GET /api/channels/{channel}/plugins} 的 {@code result} */
export interface MagpiePluginState {
  plugins?: MagpiePlugin[]
  /** 市场清单（仅 {@code market=true} 时返回），字段由 npm 决定，原样展示 */
  listings?: Array<Record<string, unknown>>
  /** 本机是否已就绪 Bun（没装插件前通常为 false） */
  bun?: boolean
  bunVer?: string
  mirror?: boolean
  registry?: string
  error?: string
  marketError?: string
}

/**
 * 上游登录会话（内置与插件同一个轮询端点）。
 *
 * <p>{@code state}：{@code installing}（插件在装）/ {@code waiting}（等人在浏览器里
 * 完成授权）/ {@code done} / {@code failed} / {@code canceled}。只有前两个是「还没结束」。</p>
 */
export interface MagpieSigninSession {
  id?: string
  /** 内置登录的 agent，或插件登录的 provider */
  agent?: string
  provider?: string
  /** 授权地址，由页面打开（{@code https} 外链或 {@code http} 本机回调） */
  url?: string
  state?: string
  /** 需要人工把回调地址 / 验证码贴回来时，页面要显示输入框 */
  pasteCallback?: boolean
  /** 登录成功的账号名 */
  user?: string
  message?: string
  [key: string]: unknown
}

/**
 * 管理面额度卡（{@code GET /api/usage/quotas}）。
 *
 * <p>magpie 的卡分 {@code balance}（余额）与 {@code subscription}（订阅窗口）两类，
 * 窗口里既有 token 也有 credit，前端只做展示，不参与计算。</p>
 */
export interface MagpieQuota {
  provider?: string
  kind?: string
  plan?: string
  user?: string
  balance?: string | number
  windows?: Array<Record<string, unknown>>
  /** 签到状态（管理面独有） */
  checkin?: Record<string, unknown>
  [key: string]: unknown
}
