/**
 * 站内消息订阅（@repo/core）
 *
 * 封装全局 Socket 服务的 message/push 订阅，实时接收后端「站内消息」渠道
 * （MessagePush SPI: station）推送的通知；同时支持按 userId -> lastReadId
 * 游标拉取历史消息 / 未读数 / 标记已读（后端接口由 adapter 注入，未注入时
 * 仅实时订阅，不影响使用）。
 *
 * 用法：
 *   const { messages, unread, loadHistory, markAllRead } = useStationMessage();
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
  /** 消息ID（游标用） */
  id?: number | string;
  [key: string]: unknown;
}

/**
 * 站内消息后端适配器（接入 sysMessage 查询/已读接口）
 *
 * 推荐后端接口设计（userId -> lastReadId 游标，减少数据量）：
 *   - loadHistory(): GET /v2/sys-message/page?cursor=&page=&pageSize=
 *     返回当前用户消息列表 + 服务端游标 lastReadId
 *   - getUnreadCount(): GET /v2/sys-message/unread-count
 *     返回未读数（count(id > lastReadId)）
 *   - markRead(): PUT /v2/sys-message/read
 *     把已读游标更新到指定消息 ID（全读传最新 id）
 * 各方法失败时内部 catch，返回空/0，不影响实时订阅。
 */
export interface StationMessageAdapter {
  /** 拉取历史消息（含服务端已读游标），分页 */
  loadHistory?: (params?: {
    cursor?: number | string;
    page?: number;
    pageSize?: number;
  }) => Promise<{ list: StationMessage[]; lastReadId?: number | string; total?: number }>;
  /** 获取未读数 */
  getUnreadCount?: () => Promise<number>;
  /** 标记已读（lastId 为空表示全部已读） */
  markRead?: (lastId?: number | string) => Promise<void>;
}

/** 最大保留条数 */
const MAX_MESSAGES = 50;

/** 未注入后端适配器时的空实现 */
const EMPTY_ADAPTER: StationMessageAdapter = {};

/**
 * 订阅站内消息推送
 *
 * @param adapter 后端适配器（可选）
 * @returns 站内消息列表与绑定/解绑/加载/已读方法
 */
export function useStationMessage(adapter: StationMessageAdapter = EMPTY_ADAPTER) {
  const messages = ref<StationMessage[]>([]);
  const latest = computed(() => messages.value[0] ?? null);
  const unread = ref(0);
  const loading = ref(false);
  /** 服务端已读游标（lastReadId） */
  const lastReadId = ref<number | string | undefined>(undefined);

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
      // 实时新消息未读 +1
      unread.value += 1;
    });
  }

  /** 解绑订阅 */
  function unbind() {
    unsubscribe?.();
    unsubscribe = null;
  }

  /** 拉取历史消息（注入 adapter 后可用） */
  async function loadHistory(params?: { page?: number; pageSize?: number }): Promise<void> {
    if (!adapter.loadHistory) {
      return;
    }
    loading.value = true;
    try {
      const result = await adapter.loadHistory({
        cursor: lastReadId.value,
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20,
      });
      if (result.lastReadId !== undefined) {
        lastReadId.value = result.lastReadId;
      }
      if (result.list?.length) {
        // 历史消息按时间倒序，追加到实时消息后；去重
        const known = new Set(messages.value.map((m) => m.id));
        const history = result.list.filter((m) => !known.has(m.id));
        messages.value.push(...history);
        if (messages.value.length > MAX_MESSAGES) {
          messages.value.length = MAX_MESSAGES;
        }
      }
      // 服务端未返回未读数时，按历史列表内 id > 游标 估算
      if (result.total !== undefined) {
        unread.value = Math.max(0, result.total - (messages.value.length - historyUnreadCount()));
      }
    } finally {
      loading.value = false;
    }
  }

  /** 刷新未读数（注入 adapter 后可用） */
  async function refreshUnread(): Promise<number> {
    if (!adapter.getUnreadCount) {
      return unread.value;
    }
    try {
      unread.value = await adapter.getUnreadCount();
    } catch {
      // 忽略，保留旧值
    }
    return unread.value;
  }

  /** 标记已读（注入 adapter 后可用；lastId 为空表示全部已读） */
  async function markAllRead(lastId?: number | string): Promise<void> {
    if (!adapter.markRead) {
      return;
    }
    try {
      await adapter.markRead(lastId ?? latest.value?.id ?? lastReadId.value);
      unread.value = 0;
    } catch {
      // 忽略
    }
  }

  // 历史列表中 id <= 游标 的条数（用于估算未读）
  function historyUnreadCount(): number {
    const cursor = lastReadId.value;
    if (cursor === undefined) {
      return 0;
    }
    return messages.value.filter((m) => m.id === undefined || Number(m.id) > Number(cursor)).length;
  }

  // 组件销毁时自动解绑
  onScopeDispose(unbind);

  bind();

  return {
    messages,
    latest,
    unread,
    loading,
    lastReadId,
    bind,
    unbind,
    loadHistory,
    refreshUnread,
    markAllRead,
  };
}
