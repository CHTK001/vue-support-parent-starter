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
 *       相对路径（如 {@code /image-search/9/image}），必须拼上 {@code baseURL}。
 *       Web 下 baseURL 是 {@code /v2}（由 vite 代理到后端），Electron 下是绝对地址。
 *       <b>后端也不能自己补 /v2</b>：前端已经拼过一次，补了会变成 {@code /v2/v2/...}。</li>
 *   <li>{@code <img>} 带不了请求头，令牌只能走 {@code x-oauth-token} 查询参数
 *       （参数名与后端 oauth 客户端 tokenName 一致）。</li>
 *   <li>没有 {@code url} 时回退到内嵌的 base64 缩略图，保证不出现裂图。</li>
 * </ol>
 *
 * @since 4.0.0.42
 */
import { apiService } from '@/services/ApiService'
import { currentToken } from '@/framework/context'

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
 * @return 可直接赋给 img.src 的地址；两者都缺时返回空串
 */
export function resolveImageUrl(item: ResolvableImage | null | undefined): string {
  if (!item) {
    return ''
  }
  const raw = item.url
  if (!raw) {
    return item.thumbnail ? `data:image/jpeg;base64,${item.thumbnail}` : ''
  }
  const base = (apiService.baseURL || '').replace(/\/+$/, '')
  const path = raw.startsWith('/') ? raw : '/' + raw
  const token = currentToken()
  const query = token ? `?x-oauth-token=${encodeURIComponent(token)}` : ''
  return base + path + query
}

/**
 * 从缓存/服务端返回的 base64 缩略图直接构造 data URL。
 *
 * @param thumbnail base64 串（不含 data: 前缀）
 * @return data URL；为空时返回空串
 */
export function toThumbnailDataUrl(thumbnail?: string | null): string {
  return thumbnail ? `data:image/jpeg;base64,${thumbnail}` : ''
}
