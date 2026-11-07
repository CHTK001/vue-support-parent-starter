/**
 * 虚拟桌面：跨窗口复用的地址拼装。
 *
 * <p>终端窗口里的 iframe 和标题栏的「在新标签页打开」必须是同一条地址，
 * 否则两处各拼一份，令牌或身份参数迟早漏一处。放在这里由两边共用。</p>
 *
 * @author CH
 * @since 4.0.0.55
 */
import { getAccessToken } from "@repo/utils";

/**
 * 终端页地址（后端静态页 {@code /ssh-direct.html}，页面里是 xterm + SSH 直连桥）。
 *
 * @param hostId     主机标识
 * @param identityId 登录身份；空表示默认凭据
 * @returns 带访问令牌的相对地址
 */
export function terminalFrameUrl(hostId: number, identityId?: number | null): string {
  const q = new URLSearchParams({ hostId: String(hostId) });
  if (identityId != null) {
    q.set("identityId", String(identityId));
  }
  const token = getAccessToken();
  if (token) {
    q.set("x-oauth-token", token);
  }
  return `/ssh-direct.html?${q.toString()}`;
}
