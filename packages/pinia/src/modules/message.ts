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
          const fetched = result.list;
          const fetchedIds = new Set(fetched.map((m) => m.id));
          // 游标体系可能是数字或字符串：这里只跟踪数字型 id（混合类型无法可靠排序）
          const minFetchedId = fetched.reduce<number>(
            (mn, m) => (typeof m.id === "number" && m.id < mn ? m.id : mn),
            Number.POSITIVE_INFINITY,
          );
          // 以服务端首页顺序为权威：刷新同 id 的最新字段（如 readStatus）。
          // 加载第 1 页时，本地若存在 id >= 本页最旧项却未返回的消息，
          // 说明已在服务端被删除，需剔除（避免“幽灵”消息）；
          // 仅比本页最旧项更早的本地消息才作为更旧页保留。
          const merged: StationMessage[] = [];
          for (const fresh of fetched) {
            merged.push(fresh);
          }
          for (const old of this.messages) {
            if (fetchedIds.has(old.id)) {
              continue;
            }
            if (
              page === 1 &&
              Number.isFinite(minFetchedId) &&
              typeof old.id === "number" &&
              old.id >= minFetchedId
            ) {
              continue;
            }
            merged.push(old);
          }
          this.messages = merged.slice(0, MAX_MESSAGES);
        }
        // 注意：分页 total 是「消息总数」而非「未读数」，不能据此计算 unread；
        // 未读数统一由 refreshUnread() 调用 /unread-count 获取，避免竞态覆盖。
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
        // 本地同步已读态：未传 lastId（全部已读）或按游标已读时，
        // 将 id <= lastId 的消息标记为已读，避免 UI 仍显示未读（后端字段为 readStatus）。
        const cursor = lastId ?? this.latest?.id ?? this.lastReadId;
        this.messages = this.messages.map((m) => {
          const hit = cursor === undefined || cursor === null || (m.id !== undefined && m.id <= cursor);
          return hit ? { ...m, readStatus: 1, isRead: true } : m;
        });
        this.unread = cursor === undefined || cursor === null
          ? 0
          : this.messages.filter((m) => m.readStatus !== 1).length;
      } catch {
        // 忽略
      }
      return this.unread;
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
