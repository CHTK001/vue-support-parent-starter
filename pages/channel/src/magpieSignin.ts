/**
 * magpie 上游「能不能登录」的判定。
 *
 * <p>magpie 只对<b>有账号概念</b>的上游实现了登录：插件接管的（{@code chat=plugin://}、
 * {@code move.state=plugin}、{@code account.logins[].agent=plugin:x}），以及它内置的
 * 少数几家（如 {@code copilot}，login agent 就是裸 id）。纯 API Key 上游（自带
 * {@code chat} 基址 + {@code keyList}）在网关里没有登录实现，打 {@code POST /api/signin}
 * 只会回 400 {@code magpie can't sign in to xxx accounts}，再被本服务包成
 * {@code 502 渠道上游返回非 2xx} —— 用户看到的是一句既不是原因也不给下一步的报错。</p>
 *
 * <p>所以「登录」入口与登录请求都要先过这一层判定；纯 Key 上游换 Key 的正确入口是
 * 「编辑」上游凭据，不是绑定账号。上游面板与新增账号弹窗共用本文件，避免两处判据漂移。</p>
 */
import type { MagpieProvider } from './channelApi'

/**
 * 该 provider 是否由插件接管。
 *
 * <p>{@code move.state=plugin} 只覆盖 magpie 明确标记过的那几个；实测
 * minimax-code / trae-cn / trae-global 等 provider 的 {@code move} 是 null，
 * 但 {@code account.logins[].agent} 已经写成 {@code plugin:xxx}，登录必须走
 * 插件端点。只看 move 会让这些上游全部落到内置端点，magpie 直接回
 * 「magpie can't sign in to xxx accounts」。</p>
 *
 * @param provider 上游行
 * @returns 是否插件接管
 */
export function isMagpiePluginManaged(provider: MagpieProvider): boolean {
  const move = provider.move as Record<string, unknown> | undefined
  const state = move?.state ?? (provider as Record<string, unknown>).moveState
  if (String(state ?? '') === 'plugin') return true
  const account = (provider as Record<string, unknown>).account as Record<string, unknown> | undefined
  const logins = Array.isArray(account?.logins) ? account.logins : []
  if (logins.some((row) => String((row as Record<string, unknown>)?.agent ?? '').startsWith('plugin:'))) {
    return true
  }
  return String((provider as Record<string, unknown>).chat ?? '').startsWith('plugin://')
}

/**
 * 这个上游能不能「登录」（绑定账号）。
 *
 * <p>插件接管的、或者网关里已经有账号记录（{@code account} / {@code pluginAccounts}）的
 * 上游可以登录；纯 API Key 上游不行。</p>
 *
 * @param provider 上游行
 * @returns 是否可以登录
 */
export function magpieCanSignin(provider: MagpieProvider | undefined | null): boolean {
  if (!provider) return false
  if (isMagpiePluginManaged(provider)) return true
  const account = (provider as Record<string, unknown>).account
  if (account && typeof account === 'object') return true
  const pluginAccounts = Number((provider as Record<string, unknown>).pluginAccounts ?? 0)
  return Number.isFinite(pluginAccounts) && pluginAccounts > 0
}

/** 纯 API Key 上游点「登录 / 新增账号」时的说明：讲清原因与下一步 */
export const MAGPIE_KEY_ONLY_REASON =
  '这个上游用 API Key 接入，网关里没有它的登录方式，不需要绑定账号；换 Key 请到网关管理面里改这条上游的凭据。'
