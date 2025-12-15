/**
 * 消息通知 Store
 * 管理消息列表状态，初始化时拉取未读消息，监听 Socket 实时消息
 *
 * @author CH
 * @version 1.0.0
 * @since 2024-12-15
 */
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  fetchUnreadMessages,
  fetchUnreadCount,
  markAsRead as apiMarkAsRead,
  markAllAsRead as apiMarkAllAsRead,
  deleteMessage as apiDeleteMessage,
  convertSocketMessageToItem,
  type MessageItem,
  type SocketMessageData,
} from "../../api/message";
import { useConfigStore } from "./ConfigStore";
import { ServiceTopics, getMessageTopicWithUser } from "../../config/socketTopics";
import { store } from "../utils";

export const useMessageStore = defineStore("message-store", () => {
  // 未读消息列表
  const unreadMessages = ref<MessageItem[]>([]);
  // 消息ID集合，用于去重
  const messageIdSet = ref<Set<number>>(new Set());
  // 是否已初始化
  const initialized = ref(false);
  // 加载状态
  const loading = ref(false);
  // 当前用户ID
  const currentUserId = ref<number | null>(null);

  // 未读消息数量
  const unreadCount = computed(() => unreadMessages.value.length);

  /**
   * 添加消息到列表（带去重）
   */
  function addMessage(message: MessageItem) {
    if (!messageIdSet.value.has(message.sysMessageId)) {
      messageIdSet.value.add(message.sysMessageId);
      // 插入到列表开头
      unreadMessages.value.unshift(message);
    }
  }

  /**
   * 从列表中移除消息
   */
  function removeMessage(messageId: number) {
    messageIdSet.value.delete(messageId);
    const index = unreadMessages.value.findIndex(
      (m) => m.sysMessageId === messageId
    );
    if (index !== -1) {
      unreadMessages.value.splice(index, 1);
    }
  }

  /**
   * 处理 Socket 推送的消息
   */
  function handleSocketMessage(data: SocketMessageData) {
    if (data && data.messageId) {
      const message = convertSocketMessageToItem(data);
      addMessage(message);

      // 浏览器通知
      showBrowserNotification(data.title, data.content);
    }
  }

  /**
   * 显示浏览器通知
   */
  function showBrowserNotification(title: string, content: string) {
    if (window.Notification && Notification.permission === "granted") {
      new Notification(title, { body: content });
    } else if (window.Notification && Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification(title, { body: content });
        }
      });
    }
  }

  /**
   * 初始化消息服务
   * 拉取未读消息并监听 Socket 推送
   *
   * @param userId 当前用户ID
   */
  async function init(userId: number) {
    if (initialized.value && currentUserId.value === userId) {
      return;
    }

    currentUserId.value = userId;
    loading.value = true;

    try {
      // 1. 拉取未读消息
      const response = await fetchUnreadMessages();
      if (response?.data) {
        unreadMessages.value = [];
        messageIdSet.value.clear();
        response.data.forEach((msg) => addMessage(msg));
      }

      // 2. 监听 Socket 推送
      const configStore = useConfigStore();
      const socket = configStore.getSocket();
      if (socket) {
        // 监听个人消息主题: service:message:push@{userId}
        const userTopic = getMessageTopicWithUser(userId);
        socket.on(userTopic, handleSocketMessage);

        // 同时监听广播消息: service:message:push@0
        const broadcastTopic = getMessageTopicWithUser(0);
        socket.on(broadcastTopic, handleSocketMessage);
      }

      initialized.value = true;
    } catch (error) {
      console.error("初始化消息服务失败:", error);
    } finally {
      loading.value = false;
    }
  }

  /**
   * 刷新未读消息列表
   */
  async function refresh() {
    if (!currentUserId.value) return;

    loading.value = true;
    try {
      const response = await fetchUnreadMessages();
      if (response?.data) {
        unreadMessages.value = [];
        messageIdSet.value.clear();
        response.data.forEach((msg) => addMessage(msg));
      }
    } catch (error) {
      console.error("刷新消息列表失败:", error);
    } finally {
      loading.value = false;
    }
  }

  /**
   * 标记消息为已读
   *
   * @param messageId 消息ID
   */
  async function markAsRead(messageId: number) {
    try {
      const response = await apiMarkAsRead(messageId);
      if (response?.data) {
        removeMessage(messageId);
      }
      return response;
    } catch (error) {
      console.error("标记已读失败:", error);
      throw error;
    }
  }

  /**
   * 标记所有消息为已读
   */
  async function markAllAsRead() {
    try {
      const response = await apiMarkAllAsRead();
      if (response?.data) {
        unreadMessages.value = [];
        messageIdSet.value.clear();
      }
      return response;
    } catch (error) {
      console.error("全部标记已读失败:", error);
      throw error;
    }
  }

  /**
   * 删除消息
   *
   * @param messageId 消息ID
   */
  async function deleteMessage(messageId: number) {
    try {
      const response = await apiDeleteMessage(messageId);
      if (response?.data) {
        removeMessage(messageId);
      }
      return response;
    } catch (error) {
      console.error("删除消息失败:", error);
      throw error;
    }
  }

  /**
   * 清理并关闭 Socket 监听
   */
  function dispose() {
    const configStore = useConfigStore();
    const socket = configStore.getSocket();
    if (socket && currentUserId.value !== null) {
      const userTopic = getMessageTopicWithUser(currentUserId.value);
      const broadcastTopic = getMessageTopicWithUser(0);
      socket.off(userTopic);
      socket.off(broadcastTopic);
    }

    unreadMessages.value = [];
    messageIdSet.value.clear();
    initialized.value = false;
    currentUserId.value = null;
  }

  return {
    // State
    unreadMessages,
    unreadCount,
    initialized,
    loading,
    currentUserId,
    // Actions
    init,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteMessage,
    dispose,
    addMessage,
    removeMessage,
  };
});

/**
 * 在组件外部使用 MessageStore
 */
export function useMessageStoreHook() {
  return useMessageStore(store);
}
