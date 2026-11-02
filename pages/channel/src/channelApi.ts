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
import { createHttp, createSseClient } from '@repo/utils'
import type {
  ChainableRequest,
  Http,
  RequestBody,
  SseClient,
  SseClientOptions,
} from '@repo/utils'

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
  hasCredentials?: boolean
  status?: string
  updatedAt?: number
}

/** 渠道级摘要 */
export interface ChannelSummary {
  channel: string
  displayName?: string
  loginMethod?: string
  supportsCheckin?: boolean
  supportsRefresh?: boolean
  providerId?: string
  enabled?: boolean
  connections?: ChannelConnectionSummary[]
  models?: Array<{ model: string; enabled: boolean; alias?: string; contextWindow?: number }>
}

export const channelApi = {
  /** GET /api/channels —— 全部渠道（含未绑定账号的） */
  list: () => apiHttp.get('/api/channels') as Promise<ChannelSummary[]>,
  /** POST /api/channels/{channel}/start-login —— 发起绑定，返回轮询句柄 */
  startLogin: (channel: string) =>
    apiHttp.post(`/api/channels/${channel}/start-login`) as Promise<{ channel: string; handle: Record<string, any> }>,
  /** POST /api/channels/{channel}/poll —— 按句柄轮询；pending=true 表示仍在等待 */
  poll: (channel: string, body: { handle: Record<string, any>; label?: string }) =>
    apiHttp.post(`/api/channels/${channel}/poll`, body) as Promise<{ ok: boolean; pending?: boolean; connectionId?: string }>,
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
  /** POST /api/channels/{channel}/refresh —— 按 label 刷新凭据 */
  refresh: (channel: string, body: { label: string }) =>
    apiHttp.post(`/api/channels/${channel}/refresh`, body) as Promise<{ ok: boolean; refreshed?: boolean }>,
  /** POST /api/channels/{channel}/checkin —— 按 label 签到/领额度 */
  checkin: (channel: string, body: { label: string }) =>
    apiHttp.post(`/api/channels/${channel}/checkin`, body) as Promise<{ ok: boolean; channel: string; label: string; result: Record<string, any> }>,
  /** POST /api/channels/{channel}/list-models —— 按 label 拉取账号当前可用模型 */
  listModels: (channel: string, body: { label?: string }) =>
    apiHttp.post(`/api/channels/${channel}/list-models`, body) as Promise<{ ok: boolean; models: Array<{ id: string; name?: string; contextWindow?: number }> }>,
  /** POST /api/channels/{channel}/import-models —— 调 SPI listModels 并落库 sys_ai_provider_model */
  importModels: (channel: string, body: { label?: string }) =>
    apiHttp.post(`/api/channels/${channel}/import-models`, body) as Promise<{ ok: boolean; channel: string; created: number; updated: number; total: number }>,
  /** PUT /api/channels/{channel}/models/{model}/enabled —— 单模型开关 */
  setModelEnabled: (channel: string, model: string, enabled: boolean) =>
    apiHttp.put(`/api/channels/${channel}/models/${encodeURIComponent(model)}/enabled`, { enabled }) as Promise<{ ok: boolean; model: string; enabled: boolean }>,
  /** PUT /api/channels/{channel}/enabled —— 渠道总开关 */
  setEnabled: (channel: string, enabled: boolean) =>
    apiHttp.put(`/api/channels/${channel}/enabled`, { enabled }) as Promise<{ ok: boolean; enabled: boolean }>,
  /** GET /api/channels/{channel}/status?label= —— 凭据状态探活 */
  status: (channel: string, label?: string) =>
    apiHttp.get(`/api/channels/${channel}/status`, { params: { label } }) as Promise<{ ok: boolean; status?: string; details?: Record<string, any> }>,
  /** POST /api/channels/{channel}/delete-connection —— 删除某账号 */
  deleteConnection: (channel: string, label: string) =>
    apiHttp.post(`/api/channels/${channel}/delete-connection`, { label }),
}
