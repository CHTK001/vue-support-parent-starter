/**
 * 验收套件取登录令牌的**唯一正确姿势**。
 *
 * <p><b>为什么不能用 localStorage</b>：框架 storage 是**加密**落盘的。
 * 实测（探针 token3，同一台机器同一时刻）：
 * <ul>
 *   <li>服务端下发的原始令牌 = 1376 字符（`74d8ab9e55d9e8b9…`，与 API 直登同一个）</li>
 *   <li>localStorage 的 `ai-guada:accessToken` = <b>1856 字符密文</b>（+480），不含原始令牌</li>
 *   <li>带<b>原始令牌</b>请求 `/v2/settings/image_search` → <b>200</b></li>
 *   <li>带<b>密文</b>请求同一路径 → <b>403 用户信息不存在/请重新登录</b></li>
 * </ul>
 * 头名无关（`x-oauth-token` 与 `Authorization: Bearer` 都是 403），补指纹头也无效。
 * 所以「从 localStorage 读出来当令牌发」必然 403，且报错信息极具误导性 ——
 * 看起来像「用户不存在 / 功能坏了」，实际是套件把密文发出去了。
 *
 * <p><b>为什么不用窗口内的框架函数</b>：{@link getAccessToken} 在
 * `packages/utils/src/modules/token.ts` 里确实会解密，但它是模块函数、
 * 没有挂到 window 上，页面上下文（`page.evaluate`）里够不着。
 *
 * <p><b>为什么从登录响应取</b>：那是服务端**真正下发**的令牌，
 * 与存储格式解耦 —— 以后框架换加密算法或改键名，套件都不会跟着失效。
 */

/**
 * 用口令直接登录后端，取回原始 accessToken。
 *
 * <p>只给「需要令牌去造数/查询」的套件用；纯 UI 断言的套件不需要它。
 * 走 `AI_ACCEPT_BASE`（前端地址，由 vite 代理转发到后端），
 * 因此不需要在验收机上直连后端端口。
 *
 * @param {string} base 被测前端地址
 * @param {string} user 登录用户名
 * @param {string} pass 登录口令
 * @returns {Promise<string>} 原始 accessToken
 */
export async function apiToken(base, user, pass) {
  const url = `${base}/v2/user/login`
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: user, password: pass }),
  })
  if (!r.ok) throw new Error(`登录失败 HTTP=${r.status} url=${url}`)
  const j = await r.json()
  const t = j?.data?.accessToken
  if (!t) throw new Error(`登录响应里没有 accessToken，code=${j?.code} msg=${j?.msg}`)
  return t
}

/**
 * 挂一个监听，捕获登录页**真实登录请求的响应**里下发的原始令牌。
 *
 * <p>给「既要断言登录 UI 行为、又要拿令牌发请求」的套件用
 * （如 `acc-salted-login.mjs`：它验证的是登录流程本身，令牌必须来自那条流程）。
 *
 * <p>用法：先 `const cap = captureLoginToken(page)`，再触发登录，
 * 最后 `const tk = await cap.token`。
 *
 * @param {import('playwright').Page} page
 */
export function captureLoginToken(page) {
  let found = ''
  let settle
  const ready = new Promise((resolve) => { settle = resolve })
  const failed = new Promise((_, reject) => {
    setTimeout(() => { if (!found) reject(new Error('30s 内没等到登录响应，无法取令牌')) }, 30000)
  })
  page.on('response', async (resp) => {
    if (found) return
    if (!/\/v2\/user\/login/.test(resp.url()) || resp.request().method() !== 'POST') return
    try {
      const j = JSON.parse(await resp.text())
      const t = j?.data?.accessToken
      if (t && !found) { found = t; settle(t) }
    } catch {
      /* 非 JSON 或响应体已被读走，忽略 */
    }
  })
  // 调用方习惯在触发登录之后才 await，所以这里直接返回 promise；
  // 未 await 期间若超时抛错，先吞掉避免 unhandledRejection 干扰真正的断言失败。
  ready.catch(() => {})
  return Promise.race([ready, failed])
}

/** 带令牌请求用的头。头名沿用各套件原有的 `x-oauth-token`（两种头名后端都认）。 */
export function authHeader(tk) {
  return { 'x-oauth-token': tk }
}
