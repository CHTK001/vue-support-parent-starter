/**
 * 品牌资源解析：把 getConfig('app') 中的 title / logoUrl / logoLargeUrl / favicon
 * 收敛为唯一出口，组件与 index.html 一律不再硬编码品牌图片路径。
 *
 * 优先级（全部来自 app.yaml，缺省才落到内置兜底）：
 *   大图 logoLargeUrl → logoUrl → favicon → 内置 /favicon.ico
 *   小图 logoUrl     → logoLargeUrl → favicon → 内置 /favicon.ico
 *   ico  favicon     → logoUrl → logoLargeUrl → 内置 /favicon.ico
 *
 * index.html 是静态文件，物理上无法调用 getConfig()，因此 favicon / title 一律
 * 不在 HTML 里写死：由 applyBranding() 在 bootstrapFramework() 之后按 getConfig
 * 结果创建并写入 <link rel="icon">，再用 watchBranding() 订阅配置变更保持同步。
 */
import { getConfig, onConfigChange } from '@repo/config'
import { fixFrontendAssetUrl } from './url'

/**
 * 内置兜底图标：public/favicon.ico。
 *
 * <p>注意它<strong>就是本应用的品牌图</strong>（并非中性占位）：这里只作为
 * getConfig 未给出 app.favicon / logoUrl / logoLargeUrl 时的最后兜底。浏览器在
 * 应用启动前还会按约定自动请求 /favicon.ico，那条路径不由本模块决定。</p>
 */
const FALLBACK_ICON = '/favicon.ico'
/** 内置兜底标题（app.yaml 未配置 app.title 时使用） */
const FALLBACK_TITLE = 'AI 控制台'

type AppCfg = {
  title?: unknown
  logoUrl?: unknown
  logoLargeUrl?: unknown
  favicon?: unknown
}

function appCfg(): AppCfg {
  return (getConfig()?.app ?? {}) as AppCfg
}

/** 取第一个非空字符串配置项 */
function pick(...values: unknown[]): string {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

/** 品牌标题（document.title 与标题栏文案共用） */
export function resolveBrandTitle(): string {
  return pick(appCfg().title) || FALLBACK_TITLE
}

/** 浏览器 favicon / 站点图标 */
export function resolveBrandFavicon(): string {
  const app = appCfg()
  return fixFrontendAssetUrl(pick(app.favicon, app.logoUrl, app.logoLargeUrl) || FALLBACK_ICON)
}

/** 小尺寸品牌 Logo（标题栏、侧边栏） */
export function resolveBrandLogoSmall(): string {
  const app = appCfg()
  return fixFrontendAssetUrl(pick(app.logoUrl, app.logoLargeUrl, app.favicon) || FALLBACK_ICON)
}

/** 大尺寸品牌 Logo（欢迎页横幅、关于面板） */
export function resolveBrandLogoLarge(): string {
  const app = appCfg()
  return fixFrontendAssetUrl(pick(app.logoLargeUrl, app.logoUrl, app.favicon) || FALLBACK_ICON)
}

/**
 * 由扩展名推断图标 MIME。
 *
 * <p>不能一律写 image/png：内置兜底是 .ico，谎报类型会让部分浏览器拒绝解析。
 * 识别不出扩展名时按 png 处理（app.yaml 里的品牌图默认就是 png）。</p>
 *
 * @param href 图标地址
 * @returns MIME 类型
 */
function iconMime(href: string): string {
  const path = String(href || '').split(/[?#]/)[0].toLowerCase()
  if (path.endsWith('.ico')) return 'image/x-icon'
  if (path.endsWith('.svg')) return 'image/svg+xml'
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg'
  if (path.endsWith('.webp')) return 'image/webp'
  if (path.endsWith('.gif')) return 'image/gif'
  return 'image/png'
}

/**
 * 页面上已有的站点图标链接。
 *
 * <p>{@code rel="shortcut icon"} 是空白分隔词表，必须用 {@code rel~=} 才能命中；
 * {@code apple-touch-icon} 与 icon 不同名，单独列出。</p>
 */
function iconLinks(): HTMLLinkElement[] {
  return Array.from(
    document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"], link[rel="apple-touch-icon"]'),
  )
}

/**
 * 写入 favicon：按 getConfig 结果创建 / 更新全部图标链接。
 *
 * <p>不依赖 index.html 预先写好 href——没有图标链接时补一个 {@code rel="icon"}，
 * 已有的（含 {@code rel="shortcut icon"} 与 apple-touch-icon）一并更新，
 * 避免出现「一个链接是旧品牌、另一个是新品牌」。</p>
 */
function applyBrandIcons(): void {
  const href = resolveBrandFavicon()
  const type = iconMime(href)
  let links = iconLinks()
  if (!links.some((l) => (l.rel || '').split(/\s+/).includes('icon'))) {
    const link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
    links = iconLinks()
  }
  for (const link of links) {
    link.type = type
    link.href = href
  }
}

/**
 * 上次由本模块写入的标题。
 *
 * <p>用于判断 document.title 是否仍由品牌名持有：路由 meta.titleKey 与页面
 * useTitle（见 App.vue / composables/useTitle.ts）都会接管标题，配置热更时
 * 不能把「登录」这类页面标题覆盖回品牌名。</p>
 */
let lastBrandTitle = ''

/**
 * 同步标题与 favicon 到浏览器（幂等，bootstrap 后调用一次）。
 *
 * <p>标题取 app.title；此时路由尚未完成首次导航，页面级标题还没接管，
 * 随后会被路由 meta 正常覆盖。</p>
 */
export function applyBranding(): void {
  lastBrandTitle = resolveBrandTitle()
  document.title = lastBrandTitle
  applyBrandIcons()
}

/**
 * 订阅配置变更：配置热更（远程设置 / 环境级 app.yaml 覆盖）后自动重刷品牌。
 *
 * <p>favicon 无条件跟随；标题仅在「当前 document.title 仍是上次写入的品牌标题」
 * 时才跟随，若已被路由 meta 或页面 useTitle 接管则保持原样。</p>
 *
 * @returns 取消订阅函数
 */
export function watchBranding(): () => void {
  return onConfigChange(() => {
    if (document.title === lastBrandTitle) {
      lastBrandTitle = resolveBrandTitle()
      document.title = lastBrandTitle
    }
    applyBrandIcons()
  })
}

