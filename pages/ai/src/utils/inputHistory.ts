/**
 * 输入框历史（浏览器 IndexedDB，AES 加密）
 *
 * <p>输入框按 ↑ 打开的历史提示此前只取「当前会话已加载的消息」，用户清空会话
 * 消息后历史就跟着空了（2026-11-14 反馈：删了全部消息，仍应能翻到上次输入）。
 * 当时把每次发送的文本额外在本机存一份（localStorage 明文），与会话消息解耦：
 * 删消息、切分支、换压缩摘要都不影响本机历史。</p>
 *
 * <p>2026-11-18 起改由 {@code @repo/utils} 的 {@code messageHistory} 承载：
 * 记录写进 IndexedDB，文本经 AES 加密后落盘（见 utils/modules/messageHistory.ts），
 * 不再以明文躺在 localStorage 里；保留条数也从固定 200 变成可配置（默认 100，
 * 见「设置 → 会话配置 → 输入历史记录数量」）。本文件只做一层轻量门面：
 * 用内存快照保住「同步读」的旧调用方式，异步结果回来后再回填。</p>
 *
 * <p>存储不可用（隐私模式 / 配额满 / 非浏览器环境）时由底层静默降级为空历史，
 * 不影响发送——历史提示只是便利功能，不能因为它写失败把消息发不出去。</p>
 */
import {
  DEFAULT_MESSAGE_HISTORY_SCOPE,
  clearMessageHistory,
  loadMessageHistory,
  rememberMessage,
} from "@repo/utils";

/**
 * 同步快照：键同下面 {@link keyOf}，值为最新在前的历史文本。
 *
 * <p>保留这一层是因为调用方（ChatPanel / ImageGeneratePage）在 setup 和 computed 里
 * 同步取值；直接改成全异步会牵动一大片渲染逻辑，而历史本身允许「先空后补」。</p>
 */
const snapshot = new Map<string, string[]>();

/**
 * 快照键。
 *
 * @param user 用户名（缺省为匿名）
 * @param scope 业务分组（如 generate）；缺省与底层一致为 chat
 * @return 内存键名
 */
function keyOf(user?: string | null, scope?: string | null): string {
  const name = String(user ?? "").trim() || "anon";
  const group = String(scope ?? "").trim() || DEFAULT_MESSAGE_HISTORY_SCOPE;
  return `${group}\u0000${name}`;
}

/**
 * 读取本机输入历史快照（最新在前）。
 *
 * <p>只返回已经加载过的内容：首次进页面时为空，{@link hydrateInputHistory}
 * 完成后才有值。</p>
 *
 * @param user 用户名
 * @param scope 业务分组（不传则与会话页共用一份）
 * @return 历史文本快照
 */
export function loadInputHistory(user?: string | null, scope?: string | null): string[] {
  return snapshot.get(keyOf(user, scope)) ?? [];
}

/**
 * 从 IndexedDB 载入历史并刷新快照。
 *
 * @param user 用户名
 * @param scope 业务分组（不传则与会话页共用一份）
 * @return 最新在前、已去重的历史文本
 */
export async function hydrateInputHistory(
  user?: string | null,
  scope?: string | null,
): Promise<string[]> {
  const list = await loadMessageHistory({ user, scope });
  snapshot.set(keyOf(user, scope), list);
  return list;
}

/**
 * 记住一条已发送的文本（去重后置顶，超额自动裁剪）。
 *
 * @param text 用户发送的原始文本
 * @param user 用户名
 * @param scope 业务分组（不传则与会话页共用一份）
 * @return 写入后的历史，可直接赋给界面用的 ref
 */
export async function rememberInput(
  text: string,
  user?: string | null,
  scope?: string | null,
): Promise<string[]> {
  const list = await rememberMessage(text, { user, scope });
  snapshot.set(keyOf(user, scope), list);
  return list;
}

/**
 * 清空某个分组的本机历史（排查问题与切换账号时用）。
 *
 * @param user 用户名
 * @param scope 业务分组（不传则与会话页共用一份）
 */
export async function clearInputHistory(
  user?: string | null,
  scope?: string | null,
): Promise<void> {
  await clearMessageHistory({ user, scope });
  snapshot.set(keyOf(user, scope), []);
}
