/**
 * 以图搜图 · 图片地址解析（唯一实现）。
 *
 * <p><b>为什么必须收成一个函数</b>：检索页与图像底库面板都要把后端给的
 * {@code url} 变成 {@code <img src>}，两处原先各写一份，结果检索页那份漏了
 * baseURL 与令牌，搜出来的图整片裂开 —— 而底库面板是好的。同一件事存在两份
 * 实现就一定会漂移，所以这里收敛成一处，两个页面共用。</p>
 *
 * <p><b>三个要点</b>（都是仓库既有约定，缺一不可）：</p>
 * <ol>
 *   <li>后端 {@code list}/{@code search} 返回的 {@code url} 是**不带 /v2 前缀**的
 *       相对路径（如 {@code /image-search/9/image}），必须拼上 baseURL。
 *       Web 下 baseURL 是 {@code /v2}（由 vite 代理到后端），Electron 下是绝对地址。
 *       <b>后端也不能自己补 /v2</b>：前端已经拼过一次，补了会变成 {@code /v2/v2/...}。</li>
 *   <li><b>令牌绝不进 URL</b>。原实现拼成 {@code ?x-oauth-token=<accessToken>}，
 *       而查询参数会进浏览器历史、各级访问日志，以及最致命的 <b>Referer</b> ——
 *       用户点一个外链，外站就能在自己的日志里看到完整的 accessToken。
 *       现在改由 {@link AuthImageLoader} 用 {@code fetch} 带请求头取图、再转成
 *       blob 地址，令牌从头到尾不出现在任何 URL 里。详见 {@link ./authImage.ts}。</li>
 *   <li>没有 {@code url} 时回退到内嵌的 base64 缩略图，保证不出现裂图。</li>
 * </ol>
 *
 * @since 4.0.0.42
 */
import type { AuthImageLoader } from './authImage'
import { toThumbnailDataUrl } from './authImage'
/** 解析所需的最小字段集 */
export interface ResolvableImage {
  /** 后端给的相对路径；不带 /v2 前缀 */
  url?: string | null
  /** 内嵌 base64 缩略图，作为 url 缺失时的回退 */
  thumbnail?: string | null
}

/**
 * 把后端条目解析成可直接给 {@code <img src>} 的地址。
 *
 * @param item 含 url / thumbnail 的条目
 * @param loader 带鉴权的图片加载器（组件 setup 里创建一次）
 * @return 可直接赋给 img.src 的地址；两者都缺时返回空串
 */
export function resolveImageUrl(
  item: ResolvableImage | null | undefined,
  loader: AuthImageLoader,
): string {
  if (!item) {
    return ''
  }
  const raw = item.url
  if (!raw) {
    // 没有原图地址：内嵌 base64 本身就是 data URL，同样不含令牌
    return toThumbnailDataUrl(item.thumbnail)
  }
  // 交给加载器：已就绪返回 blob 地址，未就绪返回透明占位图并自动发起 fetch
  return loader.resolve(raw)
}

/**
 * 从缓存/服务端返回的 base64 缩略图直接构造 data URL。
 *
 * <p>实现已迁到 {@link ./authImage}（避免与加载器循环依赖），此处保留转发
 * 以兼容既有 import 路径。</p>
 *
 * @param thumbnail base64 串（不含 data: 前缀）
 * @return data URL；为空时返回空串
 */
export { toThumbnailDataUrl } from './authImage'