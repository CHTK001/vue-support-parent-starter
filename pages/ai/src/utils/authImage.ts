/**
 * 带鉴权的图片地址解析（令牌不出现在 URL 里）。
 *
 * <p><b>为什么不能把令牌拼进 {@code <img src>}。</b>{@code <img>} 带不了请求头，
 * 于是唯一的「把令牌送到服务端」的办法就是塞进查询参数：
 *
 * <pre>{@code
 * <img src="/v2/image-search/9/image?x-oauth-token=<完整 accessToken>" />
 * }</pre>
 *
 * 而查询参数是<b>到处都会留下副本</b>的地方：
 * <ul>
 *   <li>浏览器历史记录（前进/后退框里直接可见）；</li>
 *   <li>服务端 access log、Nginx log、网关日志、WAF 日志；</li>
 *   <li><b>Referer 请求头</b> —— 用户从检索页点一个外链，攻击者控制的站点
 *       就能在自己的日志里看到完整的 accessToken，等于令牌直接送出；</li>
 *   <li>浏览器扩展、同步盘、CDN 的缓存键与统计。</li>
 * </ul>
 *
 * 也就是说，一个「只能看图」的页面，把<b>整个账号的访问权</b>顺手送了出去。
 *
 * <p><b>本模块的解法：fetch + Blob URL。</b>用 {@code fetch} 带上令牌请求头
 * （和框架 {@code http()} 完全一样的头），拿到 {@code Blob} 后
 * {@code URL.createObjectURL} 生成本进程私有的地址再交给 {@code <img>}。
 * 令牌从头到尾没有出现在任何 URL 里。</p>
 *
 * <p><b>代价与处理。</b>地址变成异步可得，所以 {@link createAuthImageLoader}
 * 返回的 {@code resolve} 在图片尚未加载完时返回 {@link pendingPlaceholder}；
 * 加载完成后写入响应式映射，{@code <img :src>} 自动换成 blob 地址。
 * 所有 object URL 在 {@link AuthImageLoader.dispose} 时统一 revoke ——
 * 忘记 revoke 会让 blob 一直驻留内存（文件下载页一次几十张图就会明显涨内存）。</p>
 *
 * @since 4.0.0.42
 */
import { onScopeDispose, reactive } from 'vue'

import { apiService } from '@/services/ApiService'
import { currentToken } from '@/framework/context'
import { authHeaders, isSameOrigin, TOKEN_HEADER } from './token-origin'

/** 令牌头名；重新导出，调用方一处取全 */
export { TOKEN_HEADER }
/** 同源判定与请求头构造；重新导出便于其它取图处复用同一套规则 */
export { authHeaders, isSameOrigin }

/**
 * 从缓存/服务端返回的 base64 缩略图构造 data URL。
 *
 * <p>刻意放在本模块而不是 imageSearchUrl.ts：{@link ./imageSearchUrl} 需要
 * 依赖本模块（要 AuthImageLoader 类型与本函数），若把函数放在那边就形成
 * 循环依赖。</p>
 *
 * @param thumbnail base64 串（不含 data: 前缀）
 * @return data URL；为空时返回空串
 */
export function toThumbnailDataUrl(thumbnail?: string | null): string {
  return thumbnail ? `data:image/jpeg;base64,${thumbnail}` : ''
}

/**
 * 加载中的占位图（1×1 透明 PNG 的 data URL）。
 *
 * <p>不能返回空串：{@code <img src="">} 会让浏览器<b>重新请求当前页面地址</b>
 * （HTML4 起的老行为，各家浏览器至今仍如此），于是埋点/日志里会多出一次莫名其妙的
 * 页面请求，甚至在某些代理下形成自环。给一个合法的最小透明图最省事。</p>
 */
export const pendingPlaceholder =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

/** 需要鉴权图片加载器 */
export interface AuthImageLoader {
  /**
   * 解析为可直接给 {@code <img src>} 的地址。
   *
   * @param url 后端返回的地址（默认视作「不含 baseURL 的相对路径」，
   *            {@link AuthImageLoaderOptions.withBaseUrl} 为 false 时视作完整地址）
   * @returns blob 地址；尚未就绪时返回占位图；无 url 返回空串
   */
  resolve: (url: string | null | undefined) => string
  /**
   * 该地址是否已就绪（{@link AuthImageLoader.resolve} 会返回真实地址而非占位图）。
   *
   * <p>给 {@code <video>} 这类「占位图本身就是非法资源」的标签用 ——
   * {@code <video src="data:image/gif..."} 会直接抛媒体错误。</p>
   *
   * @param url 后端返回的地址
   * @returns 已就绪时为 true
   */
  isReady: (url: string | null | undefined) => boolean
  /**
   * 该地址是否已确定加载失败（HTTP 非 2xx 或网络异常）。
   *
   * <p>失败时 {@link AuthImageLoader.resolve} 会一直返回占位图 —— 那是 1×1 透明 GIF，
   * 放进卡片里就是「一片空白」，用户无从判断是没图还是取图失败。
   * 调用方据此渲染明确的「原图已丢失」态，而不是留白。</p>
   *
   * @param url 后端返回的地址
   * @returns 已失败时为 true
   */
  failed: (url: string | null | undefined) => boolean
  /** 立即释放所有 object URL（组件卸载 / 列表整体重建时调用） */
  dispose: () => void
  /**
   * 释放已加载的全部图片并允许重新拉取（区别于终态的 dispose）。
   * 用于「先隐藏、后恢复」的场景，如人脸底库的隐私显示开关。
   */
  revokeAll: () => void
  /** 已经发起过加载的图片数量（排障用） */
  readonly requested: number
}

/** {@link createAuthImageLoader} 的可选参数 */
export interface AuthImageLoaderOptions {
  /**
   * 传入的地址是否需要补 {@code apiService.baseURL}（默认 {@code /v2}）。
   *
   * <p><b>两种地址形态在本仓库同时存在，补错了就是 {@code /v2/v2/...}：</b></p>
   * <ul>
   *   <li><b>不含 /v2</b>：以图搜图接口返回的 {@code /image-search/9/image}
   *       —— 前端要自己拼 baseURL；</li>
   *   <li><b>已含 /v2</b>：出图任务媒体 {@code /v2/ai/generate/tasks/{id}/media/0}
   *       —— 后端下发的就是完整路径，再拼一次就 404。</li>
   * </ul>
   * <p>所以第二种场景要显式传 {@code withBaseUrl: false}。</p>
   */
  withBaseUrl?: boolean
  /** 令牌请求头名（默认 {@code x-oauth-token}） */
  headerName?: string
}

/**
 * 创建一个带鉴权的图片地址加载器。
 *
 * <p>在组件 {@code setup} 里创建一次即可 —— 它内部有缓存与去重，
 * 多个组件各自创建只会多发请求，不会互相污染。</p>
 *
 * @param options 可选参数，见 {@link AuthImageLoaderOptions}
 * @returns 加载器
 */
export function createAuthImageLoader(options: AuthImageLoaderOptions = {}): AuthImageLoader {
  const { withBaseUrl = true, headerName = TOKEN_HEADER } = options
  /** 已就绪的「原始地址 → blob 地址」响应式映射 */
  const blobUrls = reactive<Record<string, string>>({})
  /** 已确定失败的地址（响应式：失败后要让页面换成明确的「已丢失」态） */
  const failedUrls = reactive<Record<string, true>>({})
  /** 已在途 / 已失败（失败不再重试，避免 401 时反复打后端） */
  const settled = new Set<string>()
  /** 全部创建过的 object URL，供 dispose 统一 revoke */
  const created: string[] = []
  let requested = 0

  /** 拼出请求地址（**不带任何令牌**） */
  function absoluteUrl(raw: string): string {
    const path = raw.startsWith('/') ? raw : '/' + raw
    if (!withBaseUrl) {
      return path
    }
    const base = (apiService.baseURL || '').replace(/\/+$/, '')
    return base + path
  }

  async function load(raw: string): Promise<void> {
    const token = currentToken()
    if (!token) {
      // 未登录：不再静默把裸地址交给 <img>（那必然 401，且会把「需要登录」这件事
      // 伪装成「图片裂了」）。标记为已处理，交给调用方走登录引导。
      settled.add(raw)
      return
    }
    const url = absoluteUrl(raw)
    try {
      const res = await fetch(url, {
        headers: authHeaders(token, url, headerName),
        // 同源，cookie 也不必带上；显式声明避免被某些代理加塞
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
      })
      if (!res.ok) {
        // 401/403 不重试：此刻多半是会话失效，再打只是徒增 401 计数并触发限流
        failedUrls[raw] = true
        settled.add(raw)
        return
      }
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      created.push(objectUrl)
      blobUrls[raw] = objectUrl
    } catch {
      // 网络异常：标记为已处理，避免渲染期疯狂重试
      failedUrls[raw] = true
      settled.add(raw)
    } finally {
      settled.add(raw)
    }
  }

  function resolve(url: string | null | undefined): string {
    if (!url) {
      return ''
    }
    const ready = blobUrls[url]
    if (ready) {
      return ready
    }
    if (!settled.has(url)) {
      /**
       * **必须在派发前同步占位**，否则「结算后才标记」会让 pending 窗口内的每次
       * 重渲染都再发一次同一个地址。
       *
       * `resolve()` 是模板里直接调用的（如 ImageGeneratePage 的 `mediaSrc(url)`），
       * 每渲染一行就调一次；而原来 `settled.add(raw)` 写在 `load()` 的 `finally`
       * 里，要等 fetch 落地才执行。地址未就绪期间页面只要重新渲染，就会再 `void load()`
       * 一次 —— 请求还没回来，`settled` 就还是空的，于是无限自我复制。
       *
       * 实测（2026-10-07，dist 生产形态 /image-generate 静置 15s）：
       *   总请求 3182 次，但**只有 20 个不同地址**，平均重复 159×，
       *   单个地址最多被请求 372 次，直接打出 294 个 `net::ERR_INSUFFICIENT_RESOURCES`。
       * 同一批地址在全量 sweep 里把 ImageGenerate 的 9 个按钮判成 click-error FAIL，
       * 并在 Chat 路由上把一个已经跳转成功的侧栏项也拖下水。
       *
       * 这里先占位再派发：一次地址只会发起一次请求（与原有语义一致 ——
       * 成功写 blobUrls、失败停在 settled，两条路径都不重试），只是把「重复派发」堵死。
       */
      settled.add(url)
      requested++
      void load(url)
    }
    return pendingPlaceholder
  }

  function dispose(): void {
    for (const objectUrl of created.splice(0)) {
      URL.revokeObjectURL(objectUrl)
    }
    for (const key of Object.keys(blobUrls)) {
      delete blobUrls[key]
    }
    for (const key of Object.keys(failedUrls)) {
      delete failedUrls[key]
    }
  }

  /**
   * 释放已加载的全部图片，并**允许下次重新拉取**。
   *
   * <p>与 {@link dispose} 的区别：dispose 是「这个加载器用完了」，之后不会再用；
   * 本方法服务于「先藏起来、过一会儿再放出来」的场景（如人脸底库的隐私显示开关）。
   * 只 revoke 不清 {@code settled} 的话，第二次 resolve 会因为地址已 settle 而
   * 直接返回占位图、永远补不回来 —— 表现为开关打开后图片再也不出现。</p>
   */
  function revokeAll(): void {
    for (const objectUrl of created.splice(0)) {
      URL.revokeObjectURL(objectUrl)
    }
    for (const key of Object.keys(blobUrls)) {
      delete blobUrls[key]
      settled.delete(key)
    }
    for (const key of Object.keys(failedUrls)) {
      delete failedUrls[key]
    }
  }

  // 组件卸载 / effectScope 销毁时自动释放；脱离 scope 调用时 dispose 仍可手动调
  onScopeDispose(dispose)

  return {
    resolve,
    isReady: (url) => (url ? Boolean(blobUrls[url]) : true),
    failed: (url) => (url ? Boolean(failedUrls[url]) : false),
    dispose,
    revokeAll,
    get requested() {
      return requested
    },
  }
}

/**
 * 带鉴权下载一个资源（令牌不进入任何 URL）。
 *
 * <p>{@code <a href download>} 同样带不了请求头，所以「下载」这条路径
 * 也曾经只能靠把令牌拼进查询参数来绕过鉴权 —— 结果是浏览器下载历史里
 * 留着一整条带 accessToken 的地址，粘给谁就等于把账号交出去。</p>
 *
 * @param url 完整资源地址（不应已带令牌）
 * @param fileName 建议的保存文件名
 * @returns 是否成功触发下载
 */
export async function downloadAuthenticatedFile(url: string, fileName: string): Promise<boolean> {
  const token = currentToken()
  if (!url) {
    return false
  }
  const sameOrigin = isSameOrigin(url)
  try {
    let href = url
    let revoke: (() => void) | null = null
    if (token && sameOrigin) {
      const res = await fetch(url, {
        headers: authHeaders(token, url),
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
      })
      if (!res.ok) {
        return false
      }
      href = URL.createObjectURL(await res.blob())
      revoke = () => URL.revokeObjectURL(href)
    }
    const a = document.createElement('a')
    a.href = href
    a.download = fileName
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    // 延后 revoke：部分浏览器在 click 后仍是异步读取 href，立刻 revoke 会得到空文件
    if (revoke) {
      setTimeout(() => revoke?.(), 60_000)
    }
    return true
  } catch {
    return false
  }
}

/**
 * 与 {@link createAuthImageLoader} 等价的**一次性**缩略图解析。
 *
 * <p>仅用于「本来就有 base64 内嵌图、不需要再请求后端」的场景：
 * 有 {@code thumbnail} 就直接给 data URL（令牌同样不进 URL），
 * 否则退回占位图而不是把裸地址塞回 {@code <img>}。</p>
 *
 * @param thumbnail base64 缩略图（不含 data: 前缀）
 * @returns data URL / 占位图
 */
export function thumbnailOrPlaceholder(thumbnail?: string | null): string {
  return toThumbnailDataUrl(thumbnail) || pendingPlaceholder
}

/**
 * 用请求头带令牌取一张图，返回可给 {@code <img src>} 的 object URL。
 *
 * <p>用于「地址是完整绝对 URL」的场景（此时不能再拼 baseURL），
 * 例如工作区原始文件预览。返回的对象自带 {@code revoke}，
 * 调用方<b>必须</b>在替换图片或卸载组件时调用，否则 blob 会一直驻留内存。</p>
 *
 * @param url 完整资源地址（不应已带令牌）
 * @returns object URL 与释放函数；失败时返回 {@code null}
 */
export async function loadAuthenticatedImage(
  url: string,
): Promise<{ objectUrl: string; revoke: () => void } | null> {
  const token = currentToken()
  if (!token || !url) {
    return null
  }
  try {
    const res = await fetch(url, {
      headers: authHeaders(token, url),
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    })
    if (!res.ok) {
      return null
    }
    const objectUrl = URL.createObjectURL(await res.blob())
    return { objectUrl, revoke: () => URL.revokeObjectURL(objectUrl) }
  } catch {
    return null
  }
}