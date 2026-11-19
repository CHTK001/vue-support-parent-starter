/**
 * 输入草稿持久化（IndexedDB + AES 加密）
 *
 * <p>正在输入、尚未发送的文本此前只活在组件内存里：刷新页面、切换会话再切回来，
 * 打了一半的内容就丢了。这里把草稿按「用户 + 会话」落盘，复用 {@code @repo/utils}
 * 的 messageHistory 基础设施（IndexedDB + AES，见 utils/modules/messageHistory.ts），
 * 不新开存储层。</p>
 *
 * <p>隔离口径：scope 取 {@code draft:<sessionId>}，与聊天历史（chat）、生图历史
 * （generate）互不干扰；每个会话只保留最新一条草稿（limit=1，写入时底层自动裁掉
 * 同组旧记录）。文本超过底层单条上限（4000 字符）时截断保存——草稿是「接着写」
 * 的提示，不是全文备份。</p>
 *
 * <p>存储不可用（隐私模式 / 配额满 / 非浏览器环境）时底层自动降级为内存态：
 * 本次页面生命周期内草稿仍可读写，刷新后失效，不影响发送主流程。</p>
 */
import {
  clearMessageHistory,
  loadMessageHistory,
  rememberMessage,
} from "@repo/utils";

/**
 * 草稿的分组 scope：每个会话一份，避免与聊天/生图历史混存。
 *
 * @param sessionId 会话 ID
 * @returns scope 字符串
 */
function draftScope(sessionId: string): string {
  return `draft:${sessionId}`;
}

/**
 * 保存（或清除）一个会话的输入草稿。
 *
 * @param text 当前输入的文本；空白视为清除草稿
 * @param user 用户名（缺省归入匿名分组）
 * @param sessionId 会话 ID；缺省/空串不动作
 */
export async function saveInputDraft(
  text: string,
  user?: string | null,
  sessionId?: string | null,
): Promise<void> {
  const sid = String(sessionId ?? "").trim();
  if (!sid) return;
  const value = String(text ?? "").trim();
  const options = { user, scope: draftScope(sid), limit: 1 };
  if (!value) {
    await clearMessageHistory(options);
    return;
  }
  // limit=1：rememberMessage 写入后会裁掉同组其它记录，草稿组里永远只有最新一条；
  // 文本与上次相同重复保存也会被底层按文本去重，不会堆出多条
  await rememberMessage(value, options);
}

/**
 * 读取一个会话的输入草稿。
 *
 * @param user 用户名
 * @param sessionId 会话 ID
 * @returns 草稿文本；没有草稿或存储不可用时返回空串
 */
export async function loadInputDraft(
  user?: string | null,
  sessionId?: string | null,
): Promise<string> {
  const sid = String(sessionId ?? "").trim();
  if (!sid) return "";
  const list = await loadMessageHistory({ user, scope: draftScope(sid), limit: 1 });
  return list[0] ?? "";
}

/**
 * 清除一个会话的输入草稿（发送成功、编辑器清空后调用）。
 *
 * @param user 用户名
 * @param sessionId 会话 ID
 */
export async function clearInputDraft(
  user?: string | null,
  sessionId?: string | null,
): Promise<void> {
  const sid = String(sessionId ?? "").trim();
  if (!sid) return;
  await clearMessageHistory({ user, scope: draftScope(sid) });
}
