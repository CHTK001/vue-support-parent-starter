/**
 * 启动期设置读取的登录态门控。
 *
 * <p><b>为什么需要它</b>：应用启动时若在令牌就绪之前就去读「分组设置」
 * （appearance / browser 等），后端会因无有效令牌返回 403。表现为控制台刷出一串
 * "API 请求失败: settings/appearance 403"，看起来像功能坏了，实际上调用方都
 * catch 掉了、只是降级到 localStorage，功能不受影响——但噪音会淹没真正的报错，
 * 排查时容易误判。</p>
 *
 * <p><b>为什么不能靠 localStorage 判断</b>：这两个读取方原本就有
 * 「localStorage 已有值就直接用」的短路，问题恰恰出在 localStorage 为空
 * （首次访问 / 全新浏览器）时才会走后端分支。所以判据必须是「令牌是否就绪」，
 * 而不是「有没有缓存」。</p>
 *
 * <p><b>为什么不用 sleep 硬等</b>：等待时长依赖后端与网络，不可预期；
 * 轮询一次即可判定，登录流程本身就是同步完成后才继续。</p>
 *
 * @since 4.0.0.42
 */

/** 认证未就绪时的最长等待（毫秒） */
const AUTH_WAIT_TIMEOUT_MS = 8000

/** 轮询间隔（毫秒） */
const AUTH_POLL_INTERVAL_MS = 200

/**
 * 判断本地是否已有登录令牌。
 *
 * <p>直接读 localStorage 而不走框架的 TokenManager：启动早期框架可能尚未
 * 完成配置注入，直接读存储是唯一稳定的方式；键名与框架一致
 * （见 packages/config/src/shared.ts 的 accessTokenKey）。</p>
 *
 * @returns 是否存在非空令牌
 */
function hasToken(): boolean {
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (!key || !/accessToken/i.test(key)) {
                continue
            }
            const raw = localStorage.getItem(key) || ''
            // 存储值可能是 JSON 字符串（含引号），两种形态都算有值
            const cleaned = raw.replace(/^"|"$/g, '')
            if (cleaned.trim()) {
                return true
            }
        }
    } catch {
        // localStorage 不可用（隐私模式 / SSR）时按未登录处理
    }
    return false
}

/**
 * 等待登录态就绪。
 *
 * <p>在「刷新场景」下令牌已在存储里，第一次检查即返回，不引入额外延迟；
 * 只有真正需要走登录页的冷启动才会等待，而那种情况下调用方本来也拿不到设置。</p>
 *
 * @returns true 表示令牌已就绪，可以安全调用受保护接口
 */
export async function waitForAuthReady(): Promise<boolean> {
    if (hasToken()) {
        return true
    }
    const deadline = Date.now() + AUTH_WAIT_TIMEOUT_MS
    while (Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, AUTH_POLL_INTERVAL_MS))
        if (hasToken()) {
            return true
        }
    }
    // 未登录：调用方应保留 localStorage 缓存降级，不要去打后端
    return false
}
