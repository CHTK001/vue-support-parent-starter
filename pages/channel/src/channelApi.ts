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
    unwrapPayload<{ ok: boolean; refreshed?: boolean }>(
      apiHttp.post(`/api/channels/${channel}/refresh`).data(body),
    ),
  /** POST /api/channels/{channel}/checkin —— 签到/领额度（寻址同 refresh） */
  checkin: (channel: string, body: ChannelAccountRef) =>
    unwrapPayload<{ ok: boolean; channel: string; label: string; result: Record<string, any> }>(
      apiHttp.post(`/api/channels/${channel}/checkin`).data(body),
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
 * <p>{@code key} 只回末四位；{@code hasKey} 表示网关里是否配置了凭据。
 * 其余字段（routing/fallback/keys 等）原样透传，前端不解释。</p>
 */
export interface MagpieProvider {
  id?: string
  name?: string
  /** 创建时使用的内置 preset 标识 */
  preset?: string
  /** 脱敏后的 API key（如 {@code ****abcd}） */
  key?: string
  /** 是否已配置 API key */
  hasKey?: boolean
  /** OpenAI 兼容 chat 基址 */
  chat?: string
  /** Responses 协议基址 */
  responses?: string
  /** Anthropic 协议基址 */
  anthropic?: string
  /** Gemini 协议基址 */
  gemini?: string
  /** 该上游声明的模型 id */
  models?: string[]
  /** 其余 magpie 字段原样透传 */
  [key: string]: unknown
}

/** {@code /api/channels/{channel}/providers} 的响应 */
export interface MagpieProviderList {
  ok: boolean
  channel?: string
  /** 网关根地址（回显，便于确认连的是哪台） */
  baseUrl?: string
  /** 管理面是否可用（旧版本 magpie 可能没有 /api/providers） */
  manageable?: boolean
  providers?: MagpieProvider[]
  /** {@code ok=false} 时的原因 */
  message?: string
}
