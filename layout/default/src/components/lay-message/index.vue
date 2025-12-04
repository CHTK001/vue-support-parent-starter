<script setup lang="ts">
/**
 * 消息菜单组件
 * 支持异步请求获取消息列表，以及通过Socket.IO实时推送
 * @author CH
 * @version 1.0.0
 * @since 2024-12-04
 */
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useConfigStore, router } from "@repo/core";
import MessageIcon from "@iconify-icons/ri/message-3-line";
import { getConfig } from "@repo/config";

defineOptions({
  name: "LayMessage",
});

const { t } = useI18n();

/**
 * 消息项接口
 */
interface MessageItem {
  id: string | number;
  title: string;
  content: string;
  avatar?: string;
  time: string;
  read: boolean;
  type: string;
}

// 消息列表
const messages = ref<MessageItem[]>([]);
// 加载状态
const loading = ref(false);
// 未读消息数量
const unreadCount = computed(
  () => messages.value.filter((m) => !m.read).length
);

/**
 * 获取消息列表
 */
const fetchMessages = async () => {
  loading.value = true;
  try {
    // 这里可以替换为实际的API请求
    // const response = await fetchMessageList();
    // messages.value = response.data;

    // 模拟数据
    messages.value = [];
  } catch (error) {
    console.error("获取消息列表失败:", error);
  } finally {
    loading.value = false;
  }
};

/**
 * 处理Socket消息推送
 * @param data 推送的消息数据
 */
const handleSocketMessage = (data: any) => {
  if (data && data.message) {
    const newMessage: MessageItem = {
      id: data.id || Date.now(),
      title: data.title || "新消息",
      content: data.message || data.content,
      avatar: data.avatar,
      time: data.time || new Date().toLocaleString(),
      read: false,
      type: data.type || "system",
    };
    messages.value.unshift(newMessage);
  }
};

/**
 * 标记消息为已读
 * @param message 消息项
 */
const markAsRead = (message: MessageItem) => {
  message.read = true;
};

/**
 * 标记全部已读
 */
const markAllAsRead = () => {
  messages.value.forEach((m) => (m.read = true));
};

/**
 * 清空所有消息
 */
const clearAll = () => {
  messages.value = [];
};

/**
 * 跳转到消息中心
 */
const gotoMessageCenter = () => {
  if (router.hasRoute("MessageCenter")) {
    router.push({ name: "MessageCenter" });
  } else {
    router.push("/message/center");
  }
};

// 组件挂载时初始化
onMounted(() => {
  // 获取消息列表
  fetchMessages();

  // 监听Socket消息推送
  const configStore = useConfigStore();
  const socket = configStore.getSocket();
  if (socket) {
    // 使用统一的主题命名规范: system:message:push
    socket.on("system:message:push", handleSocketMessage);
    socket.on("system:message:notification", handleSocketMessage);
  }
});

// 组件卸载时清理
onUnmounted(() => {
  const configStore = useConfigStore();
  const socket = configStore.getSocket();
  if (socket) {
    socket.off("system:message:push");
    socket.off("system:message:notification");
  }
});
</script>

<template>
  <el-dropdown
    trigger="click"
    placement="bottom-end"
    popper-class="message-dropdown-popper"
  >
    <span class="message-trigger">
      <el-badge
        :value="unreadCount > 0 ? unreadCount : ''"
        :max="99"
        :hidden="unreadCount === 0"
      >
        <div class="message-icon-wrapper">
          <IconifyIconOffline :icon="MessageIcon" class="message-icon" />
        </div>
      </el-badge>
    </span>
    <template #dropdown>
      <div class="message-panel">
        <!-- 头部 -->
        <div class="panel-header">
          <span class="header-title">消息中心</span>
          <div class="header-actions">
            <el-button
              v-if="unreadCount > 0"
              link
              size="small"
              @click="markAllAsRead"
            >
              全部已读
            </el-button>
          </div>
        </div>

        <!-- 消息列表 -->
        <div class="panel-body">
          <el-scrollbar max-height="320px">
            <div v-if="loading" class="loading-wrapper">
              <el-icon class="is-loading"
                ><IconifyIconOnline icon="ri:loader-4-line"
              /></el-icon>
              <span>加载中...</span>
            </div>
            <el-empty
              v-else-if="messages.length === 0"
              description="暂无消息"
              :image-size="80"
            />
            <div v-else class="message-list">
              <div
                v-for="msg in messages"
                :key="msg.id"
                :class="['message-item', { unread: !msg.read }]"
                @click="markAsRead(msg)"
              >
                <div class="item-avatar">
                  <el-avatar v-if="msg.avatar" :size="36" :src="msg.avatar" />
                  <div v-else class="default-avatar">
                    <IconifyIconOnline icon="ri:notification-3-line" />
                  </div>
                </div>
                <div class="item-content">
                  <div class="item-title">{{ msg.title }}</div>
                  <div class="item-desc">{{ msg.content }}</div>
                  <div class="item-time">{{ msg.time }}</div>
                </div>
                <span v-if="!msg.read" class="unread-dot"></span>
              </div>
            </div>
          </el-scrollbar>
        </div>

        <!-- 底部 -->
        <div class="panel-footer">
          <el-button link @click="clearAll">清空消息</el-button>
          <el-button link type="primary" @click="gotoMessageCenter"
            >查看全部</el-button
          >
        </div>
      </div>
    </template>
  </el-dropdown>
</template>

<style lang="scss" scoped>
.message-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--el-fill-color-light);

    .message-icon {
      color: var(--el-color-primary);
    }
  }
}

.message-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-icon {
  font-size: 20px;
  color: var(--el-text-color-regular);
  transition: color 0.2s ease;
}
</style>

<style lang="scss">
.message-dropdown-popper {
  .el-dropdown-menu {
    padding: 0 !important;
    border-radius: 16px;
    border: none;
    box-shadow:
      0 12px 48px rgba(0, 0, 0, 0.15),
      0 4px 16px rgba(0, 0, 0, 0.08);
    overflow: hidden;
  }
}

.message-panel {
  width: 360px;
  background: var(--el-bg-color);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);

  .header-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }
}

.panel-body {
  min-height: 200px;

  .loading-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 0;
    color: var(--el-text-color-secondary);
    gap: 8px;

    .el-icon {
      font-size: 24px;
    }
  }
}

.message-list {
  padding: 8px;
}

.message-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background: var(--el-fill-color-light);
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
      width: 36px;
      height: 36px;
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
      font-size: 18px;
    }
  }

  .item-content {
    flex: 1;
    min-width: 0;
  }

  .item-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .item-desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .item-time {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
    margin-top: 6px;
  }

  .unread-dot {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 8px;
    height: 8px;
    background: var(--el-color-primary);
    border-radius: 50%;
  }
}

.panel-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);
}

// 深色模式适配
html.dark {
  .message-panel {
    background: var(--el-bg-color-overlay);
  }

  .panel-header,
  .panel-footer {
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
