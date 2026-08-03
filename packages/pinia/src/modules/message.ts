/**
 * message store（@repo/pinia）—— 站内消息全局状态
 *
 * 统一管理当前用户站内消息（列表 / 未读数 / 已读游标），
 * 通过 core 的 stationMessageAdapter（HTTP 接口）拉取与标记已读，
 * 不依赖 Socket；实时推送由 Socket 订阅回调写入 store。
 *
 * 用法：
 *   import { useMessageStore } from "@repo/pinia";
 *   const store = useMessageStore();
 *   await store.loadHistory();      // 拉取分页历史
 *   await store.refreshUnread();    // 刷新未读数
 *   await store.markAllRead();      // 全部已读
 *   store.push({ subject, content }); // 实时推送回调写入
 */
import { defineStore } from "pinia";
import { CACHE_PREFIX } from "@repo/config";
import type { StationMessage } from "@repo/core";

/** 消息列表最大保留条数 */
const MAX_MESSAGES = 50;

const messageStore = defineStore("message", {
  persist: {
    key: CACHE_PREFIX + "message",
    storage: localStorage,
  },
  state: () => {
    return {
      /** 站内消息列表（时间倒序，最新在前） */
      messages: [] as StationMessage[],
      /** 未读数 */
      unread: 0,
      /** 服务端已读游标（lastReadId） */
      lastReadId: undefined as number | string | undefined,
      /** 是否加载中 */
      loading: false,
      /** 已初始化（拉取过历史） */
      initialized: false,
    };
  },
  getters: {
    /** 最新一条消息 */
    latest(state): StationMessage | null {
      return state.messages[0] ?? null;
    },
  },
  actions: {
    /** 拉取历史消息（注入 adapter 后可用） */
    async loadHistory(page = 1, pageSize = 20) {
      const { getStationMessageAdapter } = await import("@repo/core");
      const adapter = getStationMessageAdapter();
      if (!adapter?.loadHistory) {
        return;
      }
      this.loading = true;
      try {
        const result = await adapter.loadHistory({
          cursor: this.lastReadId,
          page,
          pageSize,
        });
        if (result.lastReadId !== undefined) {
          this.lastReadId = result.lastReadId;
        }
        if (result.list?.length) {
          const known = new Set(this.messages.map((m) => m.id));
          const history = result.list.filter((m) => !known.has(m.id));
          this.messages = [...history, ...this.messages];
          if (this.messages.length > MAX_MESSAGES) {
            this.messages.length = MAX_MESSAGES;
          }
        }
        if (result.total !== undefined) {
          this.unread = Math.max(0, result.total - this.messages.length);
        }
        this.initialized = true;
      } finally {
        this.loading = false;
      }
    },

    /** 刷新未读数（注入 adapter 后可用） */
    async refreshUnread() {
      const { getStationMessageAdapter } = await import("@repo/core");
      const adapter = getStationMessageAdapter();
      if (!adapter?.getUnreadCount) {
        return this.unread;
      }
      try {
        this.unread = await adapter.getUnreadCount();
      } catch {
        // 忽略，保留旧值
      }
      return this.unread;
    },

    /** 标记已读（注入 adapter 后可用；lastId 为空表示全部已读） */
    async markAllRead(lastId?: number | string) {
      const { getStationMessageAdapter } = await import("@repo/core");
      const adapter = getStationMessageAdapter();
      if (!adapter?.markRead) {
        return;
      }
      try {
        await adapter.markRead(lastId ?? this.latest?.id ?? this.lastReadId);
        this.unread = 0;
      } catch {
        // 忽略
      }
    },

    /** 实时推送回调写入一条新消息（最新在前，未读 +1） */
    push(message: StationMessage) {
      this.messages.unshift(message);
      if (this.messages.length > MAX_MESSAGES) {
        this.messages.length = MAX_MESSAGES;
      }
      this.unread += 1;
    },

    /** 重置状态 */
    $reset() {
      this.messages = [];
      this.unread = 0;
      this.lastReadId = undefined;
      this.loading = false;
      this.initialized = false;
    },
  },
});

export default messageStore;
