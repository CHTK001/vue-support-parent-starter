/**
 * 输入框历史（本地浏览器存储）
 *
 * <p>输入框按 ↑ 打开的历史提示此前只取「当前会话已加载的消息」，用户清空会话
 * 消息后历史就跟着空了（2026-11-14 反馈：删了全部消息，仍应能翻到上次输入）。</p>
 *
 * <p>这里把每次发送的文本额外在本机存一份，与会话消息解耦：删消息、切分支、
 * 换压缩摘要都不影响本机历史。按用户分键，避免同一浏览器多账号串内容；
 * 重复输入提到最前，上限 {@link LIMIT} 条。</p>
 *
 * <p>存储不可用（隐私模式 / 配额满 / 非浏览器环境）时静默降级为空历史，
 * 不影响发送——历史提示只是便利功能，不能因为它写失败把消息发不出去。</p>
 */
const PREFIX = "ai-input-history";
const LIMIT = 200;
const MAX_TEXT = 4000;

/**
 * 当前用户的存储键。
 *
 * @param user 用户名（缺省为匿名）
 * @param scope 业务分组（如 generate）。不同页面的输入历史互不串味：
 *              会话的追问和生图的提示词是两类文本，混在一个列表里翻起来很乱。
 * @return localStorage 键名
 */
function keyOf(user?: string | null, scope?: string | null): string {
  const name = String(user ?? "").trim() || "anon";
  const group = String(scope ?? "").trim();
  return group ? `${PREFIX}:${group}:${name}` : `${PREFIX}:${name}`;
}

/**
 * 读取本机输入历史（最新在前）。
 *
 * @param user 用户名
 * @param scope 业务分组（不传则与会话页共用一份）
 * @return 历史文本；无记录或存储损坏时返回空数组
 */
export function loadInputHistory(user?: string | null, scope?: string | null): string[] {
  try {
    if (typeof localStorage === "undefined") return [];
    const raw = localStorage.getItem(keyOf(user, scope));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .slice(0, LIMIT);
  } catch {
    return [];
  }
}

/**
 * 记住一条输入文本（去重后置顶）。
 *
 * @param text 用户发送的原始文本
 * @param user 用户名
 * @param scope 业务分组（不传则与会话页共用一份）
 */
export function rememberInput(text: string, user?: string | null, scope?: string | null): void {
  const value = String(text ?? "").trim();
  if (!value) return;
  const kept = value.slice(0, MAX_TEXT);
  try {
    if (typeof localStorage === "undefined") return;
    const rest = loadInputHistory(user, scope).filter((item) => item !== kept);
    localStorage.setItem(keyOf(user, scope), JSON.stringify([kept, ...rest].slice(0, LIMIT)));
  } catch {
    /* 存储不可用：历史提示降级，不影响发送 */
  }
}
