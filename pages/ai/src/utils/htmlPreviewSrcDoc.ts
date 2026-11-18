/**
 * HTML 预览文档改写：把工作区 HTML 用 srcdoc 渲染，令牌不进任何 URL。
 *
 * <p><b>背景。</b>工作区 HTML 预览原先是
 * {@code <iframe src=".../html-preview/a.html?x-oauth-token=<完整 accessToken>">}。
 * iframe 与 <img> 一样带不了请求头，于是令牌只能塞进查询参数，而查询参数会：</p>
 * <ul>
 *   <li>进服务端 access log / 网关日志 / WAF 日志；</li>
 *   <li>作为 <b>Referer</b> 发给页面里的外链资源，等于把账号交出去；</li>
 *   <li>留在浏览器扩展、同步盘、CDN 缓存键里。</li>
 * </ul>
 *
 * <p><b>解法。</b>预览所需的 HTML 正文<b>本来就已经通过
 * {@code getWorkspaceFile} 用鉴权请求头取回来了</b>（见 FilePreviewPanel
 * 的 loadFileContent），完全不需要再让浏览器自己发一次带令牌的导航请求。
 * 直接把这份正文塞进 {@code srcdoc}，令牌就没有任何机会出现在 URL 里。</p>
 *
 * <p><b>相对资源怎么办。</b>srcdoc 的文档基址是父页面，会让 HTML 里
 * {@code ./style.css} 之类的相对路径解析到错误位置。这里按 markdown 预览
 * 已在用的做法，注入一个 {@code <base href>} 指回 {@code html-preview/}
 * 下的对应目录 —— 浏览器原生解析，相对资源的落点与改写前一致。</p>
 *
 * <p><b>已知取舍。</b>改写后预览文档的 {@code location} 是父页面地址而非
 * {@code html-preview} 地址，因此靠读 {@code location.search} 拿令牌的
 * HTML 会失效。这是刻意接受的：让令牌留在 URL 里本就是要修的缺陷。</p>
 *
 * @since 4.0.0.42
 */

/** 转义属性值里的 {@code "} 与 {@code &}，避免拼出的 {@code <base href>} 被截断 */
function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

/**
 * 把 {@code <base href="…">} 注入 HTML 文档。
 *
 * <p>文档里原有的 {@code <base>} 会先被移除：多个 {@code <base>} 时浏览器只认
 * 第一个，留着旧的会让本函数注入的目录静默失效。</p>
 *
 * @param html 原始 HTML 文本
 * @param baseUrl 资源基址（目录，应以 {@code /} 结尾）
 * @returns 注入后的 HTML；输入为空时返回空串
 */
export function injectBaseHref(html: string, baseUrl: string): string {
  if (!html) {
    return ''
  }
  // 先清掉既有 base（大小写不敏感，且允许自闭合写法）
  const stripped = html.replace(/<base\b[^>]*>/gi, '')
  const baseTag = `<base href="${escapeAttr(baseUrl)}">`

  const headOpen = /<head\b[^>]*>/i.exec(stripped)
  if (headOpen) {
    const at = headOpen.index + headOpen[0].length
    return stripped.slice(0, at) + baseTag + stripped.slice(at)
  }

  // 没有 head：包一个。html 之后紧跟的内容按 HTML5 解析规则仍会落进 head/body，
  // 但显式包一层可避免浏览器把 <base> 挪到 body（那样它就不生效了）。
  const htmlOpen = /<html\b[^>]*>/i.exec(stripped)
  if (htmlOpen) {
    const at = htmlOpen.index + htmlOpen[0].length
    return stripped.slice(0, at) + `<head>${baseTag}</head>` + stripped.slice(at)
  }

  const bodyOpen = /<body\b[^>]*>/i.exec(stripped)
  if (bodyOpen) {
    return stripped.slice(0, bodyOpen.index) + `<head>${baseTag}</head>` + stripped.slice(bodyOpen.index)
  }

  return `<head>${baseTag}</head>` + stripped
}

/**
 * 构建 HTML 预览用的 srcdoc 文档。
 *
 * @param html 已带鉴权取回的 HTML 正文
 * @param baseUrl 资源基址（目录，应以 {@code /} 结尾，不含任何令牌）
 * @returns 可直接给 {@code <iframe srcdoc>} 的文档字符串
 */
export function buildHtmlPreviewSrcDoc(html: string, baseUrl: string): string {
  return injectBaseHref(html, baseUrl)
}

/** 预览资源加载器：给完整地址，返回 blob 地址与释放句柄；失败返回 {@code null} */
export interface PreviewAssetLoader {
  (url: string): Promise<{ objectUrl: string; revoke: () => void } | null>
}

/** 带资源改写的预览文档 */
export interface HtmlPreviewSrcDoc {
  /** 可直接给 {@code <iframe srcdoc>} 的文档 */
  html: string
  /** 释放本次改写创建的 blob 地址（切换文件 / 卸载时必须调用） */
  revoke: () => void
}

/** 需要改写的标签与属性（{@code srcset} 单独处理） */
const ASSET_ATTRS: Record<string, string[]> = {
  img: ['src', 'srcset'],
  source: ['src', 'srcset'],
  video: ['src', 'poster'],
  audio: ['src'],
}

/**
 * 把地址解析成**同源绝对地址**；不支持取的协议（data/blob/相对之外的 scheme）返回 {@code null}。
 *
 * <p>{@code baseUrl} 可能是相对路径（开发态经 Vite 代理的 {@code /v2/...}），
 * {@code new URL} 必须拿到绝对基址，所以先按当前页面补全。</p>
 */
function resolveAssetUrl(value: string, baseUrl: string): string | null {
  const raw = value.trim()
  if (!raw || raw.startsWith('#')) {
    return null
  }
  try {
    const base = new URL(baseUrl, window.location.href)
    const resolved = new URL(raw, base)
    return resolved.protocol === 'http:' || resolved.protocol === 'https:' ? resolved.href : null
  } catch {
    return null
  }
}

/**
 * 构建 HTML 预览文档，并把图片/媒体资源换成**带鉴权取回的 blob 地址**。
 *
 * <p><b>为什么要换。</b>预览正文由 {@code getWorkspaceFile} 带请求头取回，
 * 但页面里的 {@code <img src>} 是浏览器自己发的请求，带不上令牌；服务端
 * 鉴权层只把 {@code .js/.css/favicon.ico} 当静态资源放行，其它后缀一律 404，
 * 于是预览里只有样式能出来、图片全裂。</p>
 *
 * <p><b>做法。</b>解析文档，把 {@code img/source/video/audio} 的相对地址
 * 按 {@code <base href>} 口径解析成绝对地址，逐个用 {@code load} 带令牌取回，
 * 换成 {@code blob:} 地址；非 http(s) 地址（data/blob/内联）原样保留。
 * 取不到的保留原地址，不阻断其它资源。</p>
 *
 * @param html 已带鉴权取回的 HTML 正文
 * @param baseUrl 资源基址（目录，应以 {@code /} 结尾）
 * @param load 资源加载器（例如 {@code loadAuthenticatedImage}）
 * @returns 改写后的文档与释放句柄
 */
export async function buildHtmlPreviewSrcDocWithAssets(
  html: string,
  baseUrl: string,
  load: PreviewAssetLoader,
): Promise<HtmlPreviewSrcDoc> {
  if (!html) {
    return { html: '', revoke: () => {} }
  }
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('base').forEach((el) => el.remove())
  const baseTag = doc.createElement('base')
  baseTag.setAttribute('href', baseUrl)
  doc.head.prepend(baseTag)

  const elements = Array.from(doc.querySelectorAll('img, source, video, audio'))
  const urls = new Set<string>()
  for (const el of elements) {
    for (const attr of ASSET_ATTRS[el.tagName.toLowerCase()] || []) {
      const value = el.getAttribute(attr)
      if (!value) {
        continue
      }
      if (attr === 'srcset') {
        for (const candidate of value.split(',')) {
          const urlPart = candidate.trim().split(/\s+/)[0]
          const abs = urlPart ? resolveAssetUrl(urlPart, baseUrl) : null
          if (abs) {
            urls.add(abs)
          }
        }
      } else {
        const abs = resolveAssetUrl(value, baseUrl)
        if (abs) {
          urls.add(abs)
        }
      }
    }
  }

  const loaded = new Map<string, string>()
  const revokes: Array<() => void> = []
  await Promise.all(
    Array.from(urls).map(async (abs) => {
      const asset = await load(abs)
      if (!asset) {
        return
      }
      loaded.set(abs, asset.objectUrl)
      revokes.push(asset.revoke)
    }),
  )

  const swap = (value: string): string => {
    const abs = resolveAssetUrl(value, baseUrl)
    return (abs && loaded.get(abs)) || value
  }

  for (const el of elements) {
    for (const attr of ASSET_ATTRS[el.tagName.toLowerCase()] || []) {
      const value = el.getAttribute(attr)
      if (!value) {
        continue
      }
      if (attr === 'srcset') {
        const rewritten = value
          .split(',')
          .map((candidate) => {
            const trimmed = candidate.trim()
            if (!trimmed) {
              return ''
            }
            const spaceAt = trimmed.search(/\s/)
            const urlPart = spaceAt < 0 ? trimmed : trimmed.slice(0, spaceAt)
            const descriptor = spaceAt < 0 ? '' : trimmed.slice(spaceAt)
            const swapped = swap(urlPart)
            return swapped === urlPart ? trimmed : swapped + descriptor
          })
          .filter(Boolean)
          .join(', ')
        el.setAttribute(attr, rewritten)
      } else {
        el.setAttribute(attr, swap(value))
      }
    }
  }

  return {
    html: `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`,
    revoke: () => revokes.forEach((revoke) => revoke()),
  }
}
