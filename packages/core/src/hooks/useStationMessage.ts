/**
 * 站内消息订阅（@repo/core）
 *
 * 封装全局 Socket 服务的 message/push 订阅，实时接收后端「站内消息」渠道
 * （MessagePush SPI: station）推送的通知。供任意页面/应用复用。
 *
 * 用法：
 *   const { messages, latest, bind, unbind } = useStationMessage();
 *   watch(latest, (msg) => { ElMessage.success(msg?.subject || "收到新站内消息"); });
 */
import { computed, onScopeDispose, ref } from "vue";
import { useSocketService } from "../socket";

/** 站内消息体（与后端 StationMessagePush 推送结构一致） */
export interface StationMessage {
  /** 模块标识（固定 message） */
  module?: string;
  /** 事件（固定 push） */
  event?: string;
  /** 消息内容 */
  content?: string;
  /** 消息标题 */
  subject?: string;
  /** 目标用户ID */
  target?: string;
  /** 发送时间 */
  sendTime?: string;
  [key: string]: unknown;
}

/** 最大保留条数 */
const MAX_MESSAGES = 50;

/**
 * 订阅站内消息推送
 *
 * @returns 站内消息列表与绑定/解绑方法
 */
export function useStationMessage() {
  const messages = ref<StationMessage[]>([]);
  const latest = computed(() => messages.value[0] ?? null);

  let unsubscribe: (() => void) | null = null;

  /** 绑定全局 socket 订阅 */
  function bind() {
    const service = useSocketService();
    if (!service) {
      return;
    }
    unsubscribe = service.subscribe("message", "push", (msg) => {
      messages.value.unshift({ ...(msg as StationMessage) });
      if (messages.value.length > MAX_MESSAGES) {
        messages.value.length = MAX_MESSAGES;
      }
    });
  }

  /** 解绑订阅 */
  function unbind() {
    unsubscribe?.();
    unsubscribe = null;
  }

  // 组件销毁时自动解绑
  onScopeDispose(unbind);

  bind();

  return {
    messages,
    latest,
    bind,
    unbind,
  };
}
