/**
 * 站内消息 Socket 绑定（@repo/pinia）
 *
 * 订阅全局 Socket 服务的 message/push 事件，将实时推送写入 useMessageStore。
 * 放在 pinia 包内实现（pinia 依赖 core），避免 core → pinia 循环依赖。
 *
 * 用法（应用初始化时调用一次，见 createApp）：
 *   void bindStationMessageSocket();
 */
import { useSocketService } from "@repo/core";
import { getConfig } from "@repo/config";
import { useMessageStore } from "./index";

/**
 * 绑定 Socket 站内消息推送 → message store
 *
 * 无全局 Socket 服务时返回 null，不影响 HTTP 拉取。
 * @returns 解绑函数或 null
 */
export function bindStationMessageSocket(): (() => void) | null {
  const service = useSocketService();
  if (!service) {
    return null;
  }
  return service.subscribe("message", "push", (msg) => {
    // app.yaml `message.socket=false`：关闭实时推送，仅保留 HTTP 拉取。
    // 在回调里判断而不是绑定前判断，这样设置面板拨开关不用刷新页面即可生效。
    if (getConfig().message?.socket === false) {
      return;
    }
    const data = (msg as Record<string, unknown>).data;
    // 兼容两种载荷：{ module, event, data } 或 { module, event, content, subject }
    const payload = (data && typeof data === "object"
      ? (data as Record<string, unknown>)
      : (msg as Record<string, unknown>)) as import("@repo/core").StationMessage;
    useMessageStore().push(payload);
  });
}
