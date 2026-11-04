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
 * 兼容两种返回形态：统一包装（`{ code, data }`）与直接返回体。
 *
 * 后端部分接口经 `@ApiReturnFormatIgnore` 直接返回 `ApiResult`，其余由统一响应
 * 解码器包一层；这里复用 `@repo/utils` 的 {@link unwrapResult} 统一穿透：
 * 既剥掉 `{ code, data, msg }` 信封，也把后端业务失败码转成可 catch 的 Error，
 * 避免「HTTP 200 + 业务失败」被当成成功数据渲染。
 *
 * @param request 可等待的请求句柄
 * @returns 业务数据
 */
async function unwrapPayload<T>(request: unknown): Promise<T> {
  return unwrapResult<T>(await (request as Promise<unknown>))
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
  supportsRefresh?: boolean
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

/** 临时身份列表视图（`/api/channels/temp-accounts`，与 pages/monitor 契约一致） */
export interface TempIdentitySummary {
  id: string
  /** 短信数据源名（如 freephonenum） */
  smsProvider?: string
  /** 邮件数据源名（如 mail-tm） */
  emailProvider?: string
  /** 临时邮箱地址 */
  email?: string
  /** 短信渠道标识（如 sms-freephonenum），后端新增字段 */
  smsChannel?: string
  /** 邮件渠道标识（如 email-mail-tm），后端新增字段 */
  emailChannel?: string
  /** 创建时间（毫秒） */
  createdAt: number
  /** 已收短信条数 */
  smsCount?: number
  /** 已收邮件封数 */
  emailCount?: number
  /** 随机虚拟号码画像 */
  phone?: { phone?: string; countryCode?: string; countryName?: string; smsUrl?: string } | null
}

/** 临时身份消息流事件回调 */
export interface TempIdentityStreamHandlers {
  onOpen?: () => void
  onError?: (e: unknown) => void
  onClose?: () => void
  /** 建连就绪 */
  onReady?: (payload: Record<string, unknown>) => void
  /** 身份新增 */
  onAccount?: (account: TempIdentitySummary) => void
  /** 新消息（短信 / 邮件增量） */
  onMessage?: (payload: { id: string; sms?: Record<string, any>[]; emails?: Record<string, any>[] }) => void
  /** 身份删除 */
  onRemove?: (payload: { id: string }) => void
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
    unwrapPayload<{ ok: boolean; refreshed?: boolean }>(
      apiHttp.post(`/api/channels/${channel}/refresh`).data(body),
    ),
  /** POST /api/channels/{channel}/checkin —— 签到/领额度（寻址同 refresh） */
  checkin: (channel: string, body: ChannelAccountRef) =>
    unwrapPayload<{ ok: boolean; channel: string; label: string; result: Record<string, any> }>(
      apiHttp.post(`/api/channels/${channel}/checkin`).data(body),
    ),
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
}

/**
 * 临时身份 API（`/api/channels/temp-accounts`）。
 *
 * <p>原属 monitor（`/ms/monitor/temp-account`），现为渠道管理下的临时账号子域。
 * 一个临时身份 = 一个接码渠道 + 一个收信渠道的组合资源；
 * SSE 事件名 `ready / account / message / remove` 与 pages/monitor 保持一致。</p>
 */
const TEMP_BASE = '/api/channels/temp-accounts'

export const tempAccountApi = {
  /** GET /api/channels/temp-accounts —— 全部临时身份（轻量视图） */
  list: () => unwrapPayload<TempIdentitySummary[]>(apiHttp.get(TEMP_BASE)),
  /** POST /api/channels/temp-accounts?type= —— 随机创建（sms / email / both） */
  create: (
    type: 'sms' | 'email' | 'both' = 'both',
    channels: { smsChannel?: string; emailChannel?: string } = {},
  ) =>
    unwrapPayload<TempIdentitySummary>(
      apiHttp.post(TEMP_BASE).query({
        type,
        smsChannel: channels.smsChannel || undefined,
        emailChannel: channels.emailChannel || undefined,
      }),
    ),
  /**
   * GET /api/channels/temp-accounts/available-channels —— 可用短信 / 邮件渠道。
   *
   * 按进入优先级降序返回，`default=true` 为缺省渠道（创建时不下发渠道即用它）。
   */
  availableChannels: () =>
    unwrapPayload<{ sms: TempChannelOption[]; email: TempChannelOption[] }>(
      apiHttp.get(`${TEMP_BASE}/available-channels`),
    ),
  /** GET /api/channels/temp-accounts/{id} —— 详情（含全部短信与邮件） */
  detail: (id: string) =>
    unwrapPayload<Record<string, any> | null>(apiHttp.get(`${TEMP_BASE}/${id}`)),
  /** DELETE /api/channels/temp-accounts/{id} */
  remove: (id: string) => unwrapPayload<boolean>(apiHttp.delete(`${TEMP_BASE}/${id}`)),
  /**
   * 订阅临时身份消息流（SSE）。
   *
   * 事件：`ready`（建连就绪）/ `account`（身份新增）/ `message`（新短信、新邮件）/ `remove`（身份删除）。
   */
  stream: (handlers: TempIdentityStreamHandlers) =>
    apiHttp.get(`${TEMP_BASE}/stream`).sse<Record<string, any>>({
      reconnect: true,
      maxReconnectAttempts: 5,
      onOpen: () => handlers.onOpen?.(),
      onError: (e) => handlers.onError?.(e),
      onClose: () => handlers.onClose?.(),
      onMessage: (e) => {
        const data = e?.data
        if (typeof data !== 'object' || data === null) return
        switch (e.event) {
          case 'ready':
            handlers.onReady?.(data as Record<string, unknown>)
            break
          case 'account':
            handlers.onAccount?.(data as unknown as TempIdentitySummary)
            break
          case 'message':
            handlers.onMessage?.(data as { id: string; sms?: Record<string, any>[]; emails?: Record<string, any>[] })
            break
          case 'remove':
            handlers.onRemove?.(data as { id: string })
            break
        }
      },
    }),
}

/** 临时身份可用渠道（按进入优先级降序，`default=true` 为缺省渠道） */
export interface TempChannelOption {
  /** 渠道标识（如 sms-freephonenum / email-mail-tm） */
  channel: string
  displayName?: string
  /** 进入优先级：数值越大越优先 */
  priority?: number
  /** 是否为当前缺省渠道 */
  default?: boolean
}

/**
 * 短信 / 邮件消息模板（`/api/channels/templates`）。
 *
 * 模板把渠道收到的原始消息渲染成可读文本：正文变量占位写作 `{{变量名}}`，
 * 同一种类仅一条默认模板，临时身份收信时由后端套用默认模板补 `display`。
 */
export interface MessageTemplate {
  templateId?: string
  /** 模板种类：SMS / EMAIL */
  templateKind: 'SMS' | 'EMAIL'
  templateName: string
  /** 稳定编码，同种类内唯一 */
  templateCode: string
  /** 邮件主题模板（仅 EMAIL） */
  templateSubject?: string | null
  templateContent: string
  /** 模板引用的变量名（后端按正文自动抽取，也可显式传入） */
  templateVariables?: string[]
  templateDefault?: boolean
  templateEnabled?: boolean
  templateSortOrder?: number
  templateCreatedAt?: number
  templateUpdatedAt?: number
}

/** 模板渲染预览结果 */
export interface MessageTemplateRenderResult {
  ok: boolean
  subject?: string | null
  content: string
  /** 正文引用了但未提供值的变量名 */
  missing?: string[]
}

const TEMPLATE_BASE = '/api/channels/templates'

export const messageTemplateApi = {
  /** GET /api/channels/templates?kind= —— 模板列表（种类可空表示全部） */
  list: (kind?: 'SMS' | 'EMAIL') =>
    unwrapPayload<MessageTemplate[]>(apiHttp.get(TEMPLATE_BASE).query({ kind })),
  /** POST /api/channels/templates —— 新增或更新（带 templateId 即更新） */
  save: (template: MessageTemplate) =>
    unwrapPayload<MessageTemplate>(
      apiHttp.post(TEMPLATE_BASE).data(template as unknown as Record<string, unknown>),
    ),
  /** DELETE /api/channels/templates/{id} */
  remove: (templateId: string) =>
    unwrapPayload<boolean>(apiHttp.delete(`${TEMPLATE_BASE}/${templateId}`)),
  /** POST /api/channels/templates/{id}/default —— 设为该种类默认模板 */
  setDefault: (templateId: string) =>
    unwrapPayload<MessageTemplate>(apiHttp.post(`${TEMPLATE_BASE}/${templateId}/default`)),
  /** POST /api/channels/templates/render —— 变量渲染预览（不落库） */
  render: (body: {
    kind: 'SMS' | 'EMAIL'
    subject?: string
    content: string
    variables?: Record<string, unknown>
  }) => unwrapPayload<MessageTemplateRenderResult>(apiHttp.post(`${TEMPLATE_BASE}/render`).data(body)),
  /** GET /api/channels/templates/variables?kind= —— 模板内置变量清单 */
  variables: (kind: 'SMS' | 'EMAIL') =>
    unwrapPayload<string[]>(apiHttp.get(`${TEMPLATE_BASE}/variables`).query({ kind })),
}
