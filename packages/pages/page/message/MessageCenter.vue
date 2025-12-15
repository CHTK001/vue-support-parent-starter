<script setup lang="ts">
/**
 * 消息中心页面
 * @author CH
 * @version 1.0.0
 * @since 2024-12-15
 */
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useMessageStore, useUserStoreHook } from "@repo/core";
import { fetchHistoryMessages, type MessageHistoryItem } from "@repo/core/src/api/message";

defineOptions({
  name: "MessageCenter",
});

const { t } = useI18n();
const messageStore = useMessageStore();
const userStore = useUserStoreHook();

/**
 * 显示用消息项接口（统一未读和历史）
 */
interface DisplayMessageItem {
  id: string | number;
  title: string;
  content: string;
  avatar?: string;
  time: string;
  read: boolean;
  type: string;
  isHistory: boolean;
  originalId: number;
}

// 历史消息列表
const historyMessages = ref<MessageHistoryItem[]>([]);
// 历史消息加载状态
const historyLoading = ref(false);
// 当前选中的tab
const activeTab = ref("all");

// Tab 选项
const tabs = [
  { key: "all", label: "全部消息" },
  { key: "unread", label: "未读消息" },
  { key: "history", label: "已读消息" },
  { key: "system", label: "系统通知" },
];

// 将未读消息转换为显示格式
const unreadDisplayMessages = computed<DisplayMessageItem[]>(() => {
  return messageStore.unreadMessages.map((msg) => ({
    id: `unread-${msg.sysMessageId}`,
    title: msg.sysMessageTitle,
    content: msg.sysMessageContent,
    time: msg.sysMessageSendTime,
    read: false,
    type: msg.sysMessageType,
    isHistory: false,
    originalId: msg.sysMessageId,
  }));
});

// 将历史消息转换为显示格式
const historyDisplayMessages = computed<DisplayMessageItem[]>(() => {
  return historyMessages.value.map((msg) => ({
    id: `history-${msg.sysMessageHistoryId}`,
    title: msg.sysMessageHistoryTitle,
    content: msg.sysMessageHistoryContent,
    time: msg.sysMessageHistoryReadTime || msg.sysMessageHistorySendTime,
    read: true,
    type: msg.sysMessageHistoryType,
    isHistory: true,
    originalId: msg.sysMessageHistoryId,
  }));
});

// 合并后的消息列表
const allMessages = computed<DisplayMessageItem[]>(() => {
  return [...unreadDisplayMessages.value, ...historyDisplayMessages.value];
});

// 根据当前tab筛选消息
const filteredMessages = computed(() => {
  if (activeTab.value === "all") {
    return allMessages.value;
  } else if (activeTab.value === "unread") {
    return unreadDisplayMessages.value;
  } else if (activeTab.value === "history") {
    return historyDisplayMessages.value;
  } else {
    return allMessages.value.filter((m) => m.type === activeTab.value);
  }
});

// 加载状态
const loading = computed(() => messageStore.loading || historyLoading.value);

// 未读消息数量
const unreadCount = computed(() => messageStore.unreadCount);

/**
 * 获取历史消息
 */
const loadHistoryMessages = async () => {
  historyLoading.value = true;
  try {
    const response = await fetchHistoryMessages(1, 50);
    if (response?.data) {
      historyMessages.value = response.data;
    }
  } catch (error) {
    console.error("获取历史消息失败:", error);
  } finally {
    historyLoading.value = false;
  }
};

/**
 * 标记消息为已读
 * @param message 消息项
 */
const markAsRead = async (message: DisplayMessageItem) => {
  if (message.read || message.isHistory) return;
  
  try {
    await messageStore.markAsRead(message.originalId);
    // 刷新历史消息
    await loadHistoryMessages();
  } catch (error) {
    console.error("标记已读失败:", error);
  }
};

/**
 * 标记全部已读
 */
const markAllAsRead = async () => {
  try {
    await messageStore.markAllAsRead();
    // 刷新历史消息
    await loadHistoryMessages();
  } catch (error) {
    console.error("全部标记已读失败:", error);
  }
};

/**
 * 删除消息
 */
const deleteMessage = async (message: DisplayMessageItem) => {
  try {
    if (message.isHistory) {
      // TODO: 调用删除历史消息API
      historyMessages.value = historyMessages.value.filter(
        (m) => m.sysMessageHistoryId !== message.originalId
      );
    } else {
      await messageStore.deleteMessage(message.originalId);
    }
  } catch (error) {
    console.error("删除消息失败:", error);
  }
};

/**
 * 清空所有消息
 */
const clearAll = async () => {
  await markAllAsRead();
};

// 组件挂载时初始化
onMounted(async () => {
  // 初始化消息服务（传入当前用户ID）
  const userId = userStore.sysUserId;
  if (userId) {
    await messageStore.init(Number(userId));
  }
  
  // 加载历史消息
  await loadHistoryMessages();
});

// 组件卸载时清理
onUnmounted(() => {
  // MessageStore 的 Socket 监听由 Store 自身管理
  // 不需要在这里清理
});
</script>

<template>
  <div class="message-center">
    <div class="message-header">
      <h1 class="header-title">
        <IconifyIconOnline icon="ri:message-3-line" class="title-icon" />
        消息中心
      </h1>
      <div class="header-actions">
        <el-button v-if="unreadCount > 0" type="primary" link @click="markAllAsRead">
          <IconifyIconOnline icon="ri:check-double-line" />
          全部已读
        </el-button>
        <el-button v-if="messages.length > 0" type="danger" link @click="clearAll">
          <IconifyIconOnline icon="ri:delete-bin-line" />
          清空消息
        </el-button>
      </div>
    </div>

    <div class="message-tabs">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-item', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span v-if="tab.key === 'unread' && unreadCount > 0" class="tab-badge">
          {{ unreadCount }}
        </span>
      </div>
    </div>

    <div class="message-content">
      <div v-if="loading" class="loading-wrapper">
        <el-icon class="is-loading">
          <IconifyIconOnline icon="ri:loader-4-line" />
        </el-icon>
        <span>加载中...</span>
      </div>

      <el-empty
        v-else-if="filteredMessages.length === 0"
        description="暂无消息"
        :image-size="120"
      />

      <div v-else class="message-list">
        <div
          v-for="msg in filteredMessages"
          :key="msg.id"
          :class="['message-item', { unread: !msg.read }]"
          @click="markAsRead(msg)"
        >
          <div class="item-avatar">
            <el-avatar v-if="msg.avatar" :size="48" :src="msg.avatar" />
            <div v-else class="default-avatar">
              <IconifyIconOnline icon="ri:notification-3-line" />
            </div>
          </div>
          <div class="item-content">
            <div class="item-header">
              <span class="item-title">{{ msg.title }}</span>
              <span class="item-time">{{ msg.time }}</span>
            </div>
            <div class="item-desc">{{ msg.content }}</div>
            <div class="item-type">
              <el-tag size="small" :type="msg.type === 'system' ? 'info' : msg.read ? 'success' : ''">
                {{ msg.type === "system" ? "系统" : msg.type }}
              </el-tag>
              <el-tag v-if="msg.read" size="small" type="success" class="ml-2">
                已读
              </el-tag>
            </div>
          </div>
          <div class="item-actions">
            <el-button
              type="danger"
              link
              size="small"
              @click.stop="deleteMessage(msg)"
            >
              <IconifyIconOnline icon="ri:delete-bin-line" />
            </el-button>
          </div>
          <span v-if="!msg.read" class="unread-dot"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.message-center {
  padding: 24px;
  background: var(--el-bg-color);
  min-height: 100%;
}

.message-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);

  .header-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 24px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 0;

    .title-icon {
      font-size: 28px;
      color: var(--el-color-primary);
    }
  }

  .header-actions {
    display: flex;
    gap: 16px;
  }
}

.message-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  padding: 4px;
  background: var(--el-fill-color-lighter);
  border-radius: 12px;
  width: fit-content;

  .tab-item {
    position: relative;
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-regular);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      color: var(--el-color-primary);
    }

    &.active {
      background: var(--el-bg-color);
      color: var(--el-color-primary);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .tab-badge {
      position: absolute;
      top: 2px;
      right: 2px;
      min-width: 18px;
      height: 18px;
      padding: 0 6px;
      font-size: 12px;
      font-weight: 600;
      color: #fff;
      background: var(--el-color-danger);
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}

.message-content {
  background: var(--el-bg-color);
  border-radius: 16px;
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;
}

.loading-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: var(--el-text-color-secondary);
  gap: 12px;

  .el-icon {
    font-size: 32px;
  }
}

.message-list {
  padding: 12px;
}

.message-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  margin-bottom: 8px;

  &:hover {
    background: var(--el-fill-color-light);

    .item-actions {
      opacity: 1;
    }
  }

  &.unread {
    background: var(--el-color-primary-light-9);

    &:hover {
      background: var(--el-color-primary-light-8);
    }
  }

  .item-avatar {
    flex-shrink: 0;

    .default-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(
        135deg,
        var(--el-color-primary) 0%,
        var(--el-color-primary-light-3) 100%
      );
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 24px;
    }
  }

  .item-content {
    flex: 1;
    min-width: 0;
  }

  .item-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .item-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .item-time {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }

  .item-desc {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    line-height: 1.6;
    margin-bottom: 8px;
  }

  .item-type {
    display: flex;
    align-items: center;
  }

  .item-actions {
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .unread-dot {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 10px;
    height: 10px;
    background: var(--el-color-primary);
    border-radius: 50%;
  }
}

// 深色模式适配
html.dark {
  .message-content {
    background: var(--el-bg-color-overlay);
  }

  .message-tabs {
    background: var(--el-fill-color-dark);
  }

  .message-item.unread {
    background: rgba(var(--el-color-primary-rgb), 0.15);

    &:hover {
      background: rgba(var(--el-color-primary-rgb), 0.2);
    }
  }
}
</style>
