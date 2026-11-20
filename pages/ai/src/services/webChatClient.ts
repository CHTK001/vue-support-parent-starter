/**
 * Web 浏览器推理客户端
 *
 * 与 ONNX 同构的「虚拟本地提供商」（后端固定单行 provider_id='web'）的前端执行侧：
 * 模型是一个 ES Module 脚本（模型行 capabilities[0].js_path），由浏览器动态
 * import 加载并在页面里推理；后端只维护模型目录，不参与对话路由。
 *
 * 脚本契约（示例见 public/web-chat/echo-demo.js）：
 *   export default function createClient(modelInfo) {
 *     return {
 *       load?:    () => Promise<void>          // 可选：预热 / 加载权重
 *       chat:     (messages, { onDelta, signal, files }) => Promise<string>  // 返回全文
 *       dispose?: () => void                   // 可选：释放资源
 *     }
 *   }
 *
 * 事件序列与后端 SSE 对齐（create → text* → finish），复用 useStreamResponse
 * 的同一事件循环，不复制循环体。
 */

import { createClient, rootHttp } from '@/framework/context'
import type { StreamEvent } from '@/types/service'

/** /api/** 管理接口客户端：不解包，返回值与后端统一响应体 {code,data,msg} 一致 */
const rawApi = createClient(rootHttp, { unwrap: false })

/** 模型脚本实例的最小契约 */
export interface WebChatClientInstance {
  load?: () => Promise<void> | void
  chat: (
    messages: Array<{ role: string; content: string }>,
    opts?: {
      onDelta?: (chunk: string) => void
      signal?: AbortSignal
      /** 会话附件（后端落盘路径 / fileIds），供 OCR、人脸检测等图片输入脚本取用 */
      files?: unknown[]
    },
  ) => Promise<string>
  dispose?: () => void
}

/** 模型脚本模块的最小契约（默认导出 createClient 工厂） */
export interface WebChatModule {
  default: (modelInfo: { id: string; name: string; jsPath: string }) => WebChatClientInstance
}

/** 已加载脚本的模块缓存：同一 jsPath 只动态 import 一次 */
const moduleCache = new Map<string, Promise<WebChatModule>>()

/**
 * 会话流里的模型是否走 Web 浏览器推理。
 *
 * <p>会话侧只拿得到模型复合 id（{@code web:&lt;model&gt;}，与后端
 * provider_id='web' + 模型名的复合主键同构），按前缀判定。</p>
 */
export function isWebChatModel(modelId: unknown): boolean {
  return String(modelId || '').trim().toLowerCase().startsWith('web:')
}

/**
 * 动态加载模型脚本（按路径缓存）。
 *
 * <p>路径是运行期数据（库里的 js_path），必须带 {@code @vite-ignore} 阻止
 * 构建期静态分析；失败时清掉缓存，下次可重试。</p>
 *
 * @param jsPath 脚本路径（如 /web-chat/echo-demo.js）
 */
export function loadWebChatModule(jsPath: string): Promise<WebChatModule> {
  const path = String(jsPath || '').trim()
  if (!path) return Promise.reject(new Error('Web 推理模型缺少脚本路径（js_path）'))
  let cached = moduleCache.get(path)
  if (!cached) {
    cached = import(/* @vite-ignore */ path) as Promise<WebChatModule>
    moduleCache.set(path, cached)
    cached.catch(() => moduleCache.delete(path))
  }
  return cached
}

/** 模型目录的短缓存：一次会话连发多条消息时不重复拉目录 */
let catalogCache: { at: number; rows: any[] } | null = null
const CATALOG_TTL_MS = 60_000

/**
 * 从模型目录反查 web 模型的脚本路径。
 *
 * <p>会话流里只拿得到模型复合 id，js_path 存在模型目录行
 * capabilities[0].js_path 里，这里经 /api/providers 目录反查（带短缓存）。</p>
 *
 * @param modelId 模型复合 id（web:&lt;model&gt;，兼容裸模型名）
 */
async function resolveWebModelJsPath(modelId: string): Promise<string> {
  const raw = String(modelId || '').trim()
  const modelName = raw.startsWith('web:') ? raw.slice(4) : raw
  let rows = catalogCache?.rows ?? []
  if (!catalogCache || Date.now() - catalogCache.at > CATALOG_TTL_MS) {
    const body: any = await rawApi.get('/api/providers?enabled_only=0')
    const data = body?.data ?? body
    rows = Array.isArray(data) ? data : Array.isArray(data?.providers) ? data.providers : []
    catalogCache = { at: Date.now(), rows }
  }
  for (const p of rows) {
    const pid = String(p?.id ?? p?.provider_id ?? '').toLowerCase()
    const platform = String(p?.platform ?? p?.provider ?? '').toLowerCase()
    if (pid !== 'web' && platform !== 'web') continue
    const models = Array.isArray(p?.models) ? p.models : []
    for (const m of models) {
      const name = String(m?.model ?? m?.modelName ?? m?.name ?? '')
      if (name && (name === modelName || `web:${name}` === raw || name === raw)) {
        const caps = Array.isArray(m?.capabilities) ? m.capabilities : []
        return String(caps[0]?.js_path || m?.js_path || '').trim()
      }
    }
  }
  return ''
}

/**
 * Web 推理的事件源：按后端 SSE 事件口径产出 StreamEvent 序列
 * （create → text* → finish），供 useStreamResponse 的事件循环直接消费。
 *
 * @param params 与 apiService.chat 同构的对话参数（取 model / userMessage）
 */
export async function* webChatEventSource(
  params: any,
): AsyncGenerator<StreamEvent, void, unknown> {
  const rawModel = String(params?.model || '')
  const modelName = rawModel.startsWith('web:') ? rawModel.slice(4) : rawModel
  const jsPath = await resolveWebModelJsPath(rawModel)
  if (!jsPath) {
    throw new Error(`未找到 Web 推理模型「${modelName}」的脚本路径（js_path），请在模型管理里补填`)
  }

  const mod = await loadWebChatModule(jsPath)
  if (typeof mod?.default !== 'function') {
    throw new Error(`模型脚本「${jsPath}」缺少默认导出 createClient`)
  }
  const client = mod.default({ id: modelName, name: modelName, jsPath })
  if (!client || typeof client.chat !== 'function') {
    throw new Error(`模型脚本「${jsPath}」的 createClient 未返回 chat 方法`)
  }

  const messageId = `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  const contentId = `${messageId}-c0`

  // 会话历史：演示链路只把本轮用户输入交给脚本（真实多轮记忆由脚本自行扩展）
  const userContent = String(params?.userMessage?.content ?? '')

  // 与后端 SSE 同构：流开头先回放本次用户消息（user_message 事件，携带消息 id），
  // 供 useStreamResponse 的 user_message 分支认领本地乐观插入的那条；否则它会在
  // 流结束的 finally 里被当作「未被后端认领」删掉，助手消息 parentId 悬空，
  // visibleTurns 过滤后整轮消息都不渲染。
  // 重答/订阅（regenerationMode 非空）时 userMessage.id 是既有消息 id，原样回放
  // 即可被 id 去重命中，不会多出一行（与后端 ChatStreamOrchestrator 回放口径一致）。
  const providedUserId = String(params?.userMessage?.id || '').trim()
  const userMsgId = providedUserId || `web-u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  if (userContent || providedUserId) {
    yield {
      type: 'user_message',
      userMessage: {
        id: userMsgId,
        role: 'user',
        contents: userContent
          ? [{ id: `${userMsgId}-content`, content: userContent, state: { isStreaming: false } }]
          : undefined,
      },
    } as StreamEvent
  }

  yield {
    type: 'create',
    messageId,
    turnsId: messageId,
    contentId,
    modelName,
    // 助手消息挂到本次用户消息下：ChatPanel 按 parentId 把消息分组成轮次
    parentId: userContent || providedUserId ? userMsgId : '',
  } as StreamEvent
  const messages = userContent ? [{ role: 'user', content: userContent }] : []
  // 会话附件（后端落盘路径 / fileIds）：交给 OCR、人脸检测等需要图片输入的脚本，
  // 由脚本自行经 /api/fs/image-base64 读回；纯文本脚本可忽略该参数。
  const userFiles: unknown[] = Array.isArray(params?.userMessage?.files) ? params.userMessage.files : []

  // onDelta 增量 → 事件队列：脚本回调节奏与生成器消费节奏解耦
  const pending: string[] = []
  let wake: (() => void) | null = null
  let done = false
  let failure: unknown = null
  let full = ''

  // 取消链路：消费侧提前退出（用户中止流）时，经 finally 里 abort 生效，
  // 模型脚本内部按 signal.aborted 自行尽快返回（契约同 fetch）
  const abort = new AbortController()

  const pushDelta = (chunk: string) => {
    if (!chunk) return
    pending.push(chunk)
    wake?.()
    wake = null
  }
  const nextChunk = async (): Promise<string | null> => {
    if (pending.length) return pending.shift()!
    if (done) return null
    await new Promise<void>((resolve) => { wake = resolve })
    return pending.length ? pending.shift()! : null
  }

  // 推理异步推进；结束后置 done 并唤醒消费侧
  void (async () => {
    try {
      if (typeof client.load === 'function') await client.load()
      full = String((await client.chat(messages, { onDelta: pushDelta, signal: abort.signal, files: userFiles })) ?? '')
    } catch (e) {
      failure = e
    } finally {
      done = true
      // TS 控制流分析看不到上面闭包里的同步赋值，会把 wake 收窄成 null（TS2349）；
      // 运行时 wake 可能是 null（没人在等）也可能是 resolve，显式宽化后再安全调用。
      const notifyWake = wake as (() => void) | null
      notifyWake?.()
      wake = null
    }
  })()

  try {
    for (;;) {
      const chunk = await nextChunk()
      if (chunk == null) break
      yield { type: 'text', content: chunk } as StreamEvent
    }
    if (failure) throw failure
    // finish 携带全文：handleStreamFinish 对「finish 带完整内容」直接覆盖缓冲，天然聚合
    yield { type: 'finish', finishReason: 'stop', content: full } as StreamEvent
  } finally {
    // 无论正常结束还是消费侧中止，都停掉脚本推理并释放资源
    abort.abort()
    try { client.dispose?.() } catch { /* 释放失败不影响主流程 */ }
  }
}
