<script setup lang="ts">
/**
 * 消息中心页面
 * @author CH
 * @version 1.0.0
 * @since 2024-12-15
 */
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { Delete, CheckDouble } from "@element-plus/icons-vue";
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

/**
 * 获取 Tab 图标
 */
const getTabIcon = (key: string) => {
  const iconMap: Record<string, string> = {
    all: "ri:inbox-line",
    unread: "ri:mail-unread-line",
    history: "ri:mail-check-line",
    system: "ri:notification-3-line",
  };
  return iconMap[key] || "ri:inbox-line";
};

/**
 * 获取消息图标
 */
const getMessageIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    system: "ri:notification-3-line",
    warning: "ri:error-warning-line",
    success: "ri:check-line",
    info: "ri:information-line",
  };
  return iconMap[type] || "ri:message-3-line";
};

/**
 * 获取头像类型样式类
 */
const getAvatarTypeClass = (type: string) => {
  return `avatar-${type}`;
};

/**
 * 获取标签类型
 */
const getTagType = (type: string) => {
  const typeMap: Record<string, string> = {
    system: "info",
    warning: "warning",
    success: "success",
    error: "danger",
  };
  return typeMap[type] || "";
};

/**
 * 获取类型标签文本
 */
const getTypeLabel = (type: string) => {
  const labelMap: Record<string, string> = {
    system: "系统通知",
    warning: "警告",
    success: "成功",
    error: "错误",
  };
  return labelMap[type] || type;
};

/**
 * 格式化时间
 */
const formatTime = (time: string) => {
  if (!time) return "";
  const date = new Date(time);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
</script>

<template>
  <div class="message-center">
    <!-- 头部区域 -->
    <div class="message-header">
      <div class="header-content">
        <div class="header-title-section">
          <h1 class="header-title">
            <IconifyIconOnline icon="ri:message-3-line" class="title-icon" />
            消息中心
          </h1>
          <p class="header-subtitle" v-if="unreadCount > 0">
            共 <span class="unread-count">{{ unreadCount }}</span> 条未读消息
          </p>
          <p class="header-subtitle" v-else>暂无未读消息</p>
        </div>
        <div class="header-actions">
          <el-button 
            v-if="unreadCount > 0" 
            type="primary" 
            :icon="CheckDouble"
            @click="markAllAsRead"
            size="default"
          >
            全部已读
          </el-button>
        </div>
      </div>
    </div>

    <!-- Tab 导航 -->
    <div class="message-tabs">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-item', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        <IconifyIconOnline 
          :icon="getTabIcon(tab.key)" 
          class="tab-icon"
        />
        <span class="tab-label">{{ tab.label }}</span>
        <span v-if="tab.key === 'unread' && unreadCount > 0" class="tab-badge">
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </div>
    </div>

    <!-- 消息内容区域 -->
    <div class="message-content">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-wrapper">
        <el-icon class="is-loading loading-icon">
          <IconifyIconOnline icon="ri:loader-4-line" />
        </el-icon>
        <p class="loading-text">加载中...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="filteredMessages.length === 0" class="empty-wrapper">
        <IconifyIconOnline icon="ri:inbox-line" class="empty-icon" />
        <p class="empty-text">暂无消息</p>
        <p class="empty-hint">当有新消息时，会在这里显示</p>
      </div>

      <!-- 消息列表 -->
      <div v-else class="message-list">
        <transition-group name="message-list" tag="div">
          <div
            v-for="(msg, index) in filteredMessages"
            :key="msg.id"
            :class="['message-item', { unread: !msg.read }]"
            :style="{ '--index': index }"
            @click="markAsRead(msg)"
          >
            <!-- 头像区域 -->
            <div class="item-avatar">
              <el-avatar v-if="msg.avatar" :size="44" :src="msg.avatar" />
              <div v-else class="default-avatar" :class="getAvatarTypeClass(msg.type)">
                <IconifyIconOnline :icon="getMessageIcon(msg.type)" />
              </div>
            </div>
            
            <!-- 内容区域 -->
            <div class="item-content">
              <div class="item-header">
                <div class="item-title-row">
                  <h3 class="item-title">{{ msg.title }}</h3>
                  <span class="item-time">{{ formatTime(msg.time) }}</span>
                </div>
                <p class="item-desc">{{ msg.content }}</p>
              </div>
              <div class="item-footer">
                <el-tag 
                  size="small" 
                  :type="getTagType(msg.type)"
                  effect="plain"
                  class="type-tag"
                >
                  {{ getTypeLabel(msg.type) }}
                </el-tag>
                <div class="item-actions">
                  <el-button
                    type="danger"
                    :icon="Delete"
                    link
                    size="small"
                    @click.stop="deleteMessage(msg)"
                  >
                    删除
                  </el-button>
                </div>
              </div>
            </div>
            
            <!-- 未读标记 -->
            <div v-if="!msg.read" class="unread-dot"></div>
          </div>
        </transition-group>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.message-center {
  padding: 24px;
  min-height: 100%;
  background: var(--el-bg-color-page);
}

// 头部区域
.message-header {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-title-section {
    .header-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 24px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin: 0 0 8px 0;

      .title-icon {
        font-size: 24px;
        color: var(--el-color-primary);
      }
    }

    .header-subtitle {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      margin: 0;

      .unread-count {
        color: var(--el-color-primary);
        font-weight: 600;
      }
    }
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }
}

// Tab 导航
.message-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  padding: 4px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  width: fit-content;

  .tab-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-regular);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;

    .tab-icon {
      font-size: 14px;
    }

    .tab-label {
      font-weight: 500;
    }

    &:hover {
      color: var(--el-color-primary);
      background: var(--el-fill-color);
    }

    &.active {
      background: var(--el-color-primary);
      color: #fff;
      box-shadow: 0 2px 4px rgba(var(--el-color-primary-rgb), 0.2);

      .tab-icon {
        color: #fff;
      }
    }

    .tab-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      font-size: 11px;
      font-weight: 600;
      color: #fff;
      background: var(--el-color-danger);
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--el-bg-color);
    }
  }
}

// 消息内容区域
.message-content {
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;
  min-height: 400px;
}

// 加载状态
.loading-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  gap: 16px;

  .loading-icon {
    font-size: 32px;
    color: var(--el-color-primary);
  }

  .loading-text {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin: 0;
  }
}

// 空状态
.empty-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  gap: 12px;

  .empty-icon {
    font-size: 64px;
    color: var(--el-text-color-placeholder);
    opacity: 0.4;
  }

  .empty-text {
    font-size: 16px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    margin: 0;
  }

  .empty-hint {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin: 0;
  }
}

// 消息列表
.message-list {
  padding: 12px;
}

.message-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  margin-bottom: 8px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  animation: slideIn 0.3s ease-out;
  animation-delay: calc(var(--index) * 0.03s);
  animation-fill-mode: both;

  &:hover {
    background: var(--el-fill-color-light);
    border-color: var(--el-border-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

    .item-actions {
      opacity: 1;
    }
  }

  &.unread {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-7);

    &:hover {
      background: var(--el-color-primary-light-8);
      border-color: var(--el-color-primary-light-6);
    }
  }

  // 头像区域
  .item-avatar {
    flex-shrink: 0;

    .default-avatar {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 20px;
      background: var(--el-color-primary);

      &.avatar-system {
        background: var(--el-color-info);
      }

      &.avatar-warning {
        background: var(--el-color-warning);
      }

      &.avatar-success {
        background: var(--el-color-success);
      }

      &.avatar-error {
        background: var(--el-color-danger);
      }
    }
  }

  // 内容区域
  .item-content {
    flex: 1;
    min-width: 0;
  }

  .item-header {
    margin-bottom: 8px;

    .item-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 6px;

      .item-title {
        font-size: 15px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin: 0;
        line-height: 1.4;
        word-break: break-word;
        flex: 1;
      }

      .item-time {
        font-size: 12px;
        color: var(--el-text-color-placeholder);
        white-space: nowrap;
        flex-shrink: 0;
      }
    }

    .item-desc {
      font-size: 13px;
      color: var(--el-text-color-secondary);
      line-height: 1.5;
      margin: 0;
      word-break: break-word;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }

  .item-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;

    .type-tag {
      font-size: 12px;
    }

    .item-actions {
      opacity: 0;
      transition: opacity 0.2s ease;
    }
  }

  // 未读标记
  .unread-dot {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 8px;
    height: 8px;
    background: var(--el-color-primary);
    border-radius: 50%;
  }
}

// 动画
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-list-enter-active,
.message-list-leave-active {
  transition: all 0.2s ease;
}

.message-list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.message-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.message-list-move {
  transition: transform 0.2s ease;
}

// 深色模式适配
html.dark {
  .message-item {
    &.unread {
      background: rgba(var(--el-color-primary-rgb), 0.1);
      border-color: rgba(var(--el-color-primary-rgb), 0.2);

      &:hover {
        background: rgba(var(--el-color-primary-rgb), 0.15);
        border-color: rgba(var(--el-color-primary-rgb), 0.3);
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .message-center {
    padding: 16px;
  }

  .message-header {
    .header-content {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }

    .header-actions {
      width: 100%;

      .el-button {
        flex: 1;
      }
    }
  }

  .message-tabs {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;

    .tab-item {
      flex-shrink: 0;
    }
  }

  .message-item {
    padding: 12px;

    .item-header .item-title-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }

    .item-footer {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;

      .item-actions {
        opacity: 1;
        align-self: flex-end;
      }
    }
  }
}
</style>
