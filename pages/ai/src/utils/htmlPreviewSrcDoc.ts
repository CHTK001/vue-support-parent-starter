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
