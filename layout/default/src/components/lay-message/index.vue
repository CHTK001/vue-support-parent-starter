<script setup lang="ts">
/**
 * 消息菜单组件
 * 支持异步请求获取消息列表，以及通过Socket.IO实时推�?
 * @author CH
 * @version 1.0.0
 * @since 2024-12-04
 */
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useConfigStore, router, emitter } from "@repo/core";
import MessageIcon from "@iconify-icons/ri/message-3-line";
import { getConfig } from "@repo/config";
import { useGlobal } from "@pureadmin/utils";
import {
  fetchUnreadMessages,
  fetchMarkAsRead,
  fetchMarkAllAsRead,
  fetchDeleteMessage,
  type SysMessage,
} from "./api";
import LayMessageToast from "../lay-message-toast/index.vue";

defineOptions({
  name: "LayMessage",
});

const { t } = useI18n();
const { $storage } = useGlobal<GlobalPropertiesApi>();
// 提取 store 引用到顶层，避免在生命周期中重复调用
const configStore = useConfigStore();

// 消息功能开�?- 从配置中读取
const messageEnabled = ref(
  $storage.configure?.showMessage ?? getConfig().ShowBarMessage ?? true
);

/**
 * 消息项接�?
 */
interface MessageItem {
  id: number;
  title: string;
  content: string;
  avatar?: string;
  time: string;
  read: boolean;
  type: string;
  level: string;
  url?: string;
}

// 消息列表
const messages = ref<MessageItem[]>([]);
// 加载状�?
const loading = ref(false);
// 未读消息数量
const unreadCount = computed(
  () => messages.value.filter((m) => !m.read).length
);

/**
 * 将后端消息转换为前端格式
 */
const transformMessage = (msg: SysMessage): MessageItem => {
  return {
    id: msg.sysMessageId,
    title: msg.sysMessageTitle,
    content: msg.sysMessageContent,
    avatar: undefined,
    time: msg.sysMessageSendTime || new Date().toLocaleString(),
    read: msg.sysMessageRead === 1,
    type: msg.sysMessageType || "system",
    level: msg.sysMessageLevel || "normal",
    url: msg.sysMessageUrl,
  };
};

/**
 * 获取消息列表
 */
const fetchMessages = async () => {
  // 开关关闭时不请求后�?
  if (!messageEnabled.value) {
    messages.value = [];
    return;
  }
  loading.value = true;
  try {
    const response = await fetchUnreadMessages();
    if (response.success && response.data) {
      messages.value = response.data.map(transformMessage);
    } else {
      messages.value = [];
    }
  } catch (error) {
    console.error("获取消息列表失败:", error);
    messages.value = [];
  } finally {
  loading.value = false;
  }
};

/**
 * showMessage 变化监听处理函数
 */
const showMessageChangeHandler = (val: boolean) => {
  messageEnabled.value = val;
  if (val) {
    fetchMessages();
  } else {
    messages.value = [];
  }
};

/**
 * 处理Socket消息推�?
 * @param data 推送的消息数据
 */
const handleSocketMessage = (data: any) => {
  // 开关关闭时不处理推送
  if (!messageEnabled.value) return;
  
  if (data) {
    const newMessage: MessageItem = {
      id: data.messageId || data.id || Date.now(),
      title: data.title || "新消息",
      content: data.content || data.message,
      avatar: data.avatar,
      time: data.sendTime || data.time || new Date().toLocaleString(),
      read: false,
      type: data.type || "system",
      level: data.level || "normal",
      url: data.url,
    };
    // 避免重复添加
    const exists = messages.value.some((m) => m.id === newMessage.id);
    if (!exists) {
      messages.value.unshift(newMessage);
      
      // 触发消息弹窗推送事�?
      emitter.emit("messageToastPush", {
        messageId: newMessage.id,
        title: newMessage.title,
        content: newMessage.content,
        avatar: newMessage.avatar,
        sendTime: newMessage.time,
        type: newMessage.type,
        level: newMessage.level,
        url: newMessage.url,
      });
    }
  }
};

/**
 * 标记消息为已�?
 * @param message 消息�?
 */
const markAsRead = async (message: MessageItem) => {
  if (message.read) return;
  // 开关关闭时只修改本地状�?
  if (!messageEnabled.value) {
    const index = messages.value.findIndex((m) => m.id === message.id);
    if (index > -1) {
      messages.value.splice(index, 1);
    }
    return;
  }
  try {
    const response = await fetchMarkAsRead(message.id);
    if (response.success) {
      // 标记已读后从列表移除（后端已转入历史记录�?
      const index = messages.value.findIndex((m) => m.id === message.id);
      if (index > -1) {
        messages.value.splice(index, 1);
      }
    }
  } catch (error) {
    console.error("标记已读失败:", error);
  }
};

/**
 * 标记全部已读
 */
const markAllAsRead = async () => {
  // 开关关闭时只清空本�?
  if (!messageEnabled.value) {
    messages.value = [];
    return;
  }
  try {
    const response = await fetchMarkAllAsRead();
    if (response.success) {
      // 清空未读列表（后端已全部转入历史记录�?
      messages.value = [];
    }
  } catch (error) {
    console.error("全部标记已读失败:", error);
  }
};

/**
 * 清空所有消�?
 */
const clearAll = async () => {
  // 批量标记已读后清�?
  await markAllAsRead();
};

// 消息中心 Drawer 状�?
const drawerVisible = ref(false);
const activeTab = ref("all");
const dropdownRef = ref();

/**
 * 打开消息中心 Drawer
 */
const openMessageCenter = () => {
  // 先关闭下拉菜�?
  dropdownRef.value?.handleClose();
  drawerVisible.value = true;
};

/**
 * 关闭消息中心 Drawer
 */
const closeMessageCenter = () => {
  drawerVisible.value = false;
};

// 根据选项卡过滤消�?
const filteredMessages = computed(() => {
  if (activeTab.value === "unread") {
    return messages.value.filter((m) => !m.read);
  } else if (activeTab.value === "system") {
    return messages.value.filter((m) => m.type === "system");
  }
  return messages.value;
});

/**
 * 删除消息
 */
const deleteMessage = async (msg: MessageItem) => {
  // 开关关闭时只删除本�?
  if (!messageEnabled.value) {
    const index = messages.value.findIndex((m) => m.id === msg.id);
    if (index > -1) {
      messages.value.splice(index, 1);
    }
    return;
  }
  try {
    const response = await fetchDeleteMessage(msg.id);
    if (response.success) {
      const index = messages.value.findIndex((m) => m.id === msg.id);
      if (index > -1) {
        messages.value.splice(index, 1);
      }
    }
  } catch (error) {
    console.error("删除消息失败:", error);
  }
};

/**
 * 点击消息跳转
 */
const handleMessageClick = (msg: MessageItem) => {
  markAsRead(msg);
  if (msg.url) {
    router.push(msg.url);
    drawerVisible.value = false;
  }
};

// 组件挂载时初始化
onMounted(() => {
  // 获取消息列表
  fetchMessages();

  // 监听消息开关变�?
  emitter.on("showMessageChange", showMessageChangeHandler);

  // 监听Socket消息推�?
  const socket = configStore.getSocket();
  if (socket) {
    // 使用统一的主题命名规�?
    socket.on("service:message:push", handleSocketMessage);
    socket.on("system:message:push", handleSocketMessage);
    socket.on("system:message:notification", handleSocketMessage);
  }
});

// 组件卸载时清�?
onUnmounted(() => {
  const socket = configStore.getSocket();
  if (socket) {
    socket.off("service:message:push");
    socket.off("system:message:push");
    socket.off("system:message:notification");
  }
  // 清理事件监听
  emitter.off("showMessageChange", showMessageChangeHandler);
});
</script>

<template>
  <div>
    <el-dropdown
      ref="dropdownRef"
      trigger="click"
      placement="bottom-end"
      popper-class="message-dropdown-popper"
    >
      <div class="message-container flex-c cursor-pointer navbar-bg-hover">
        <el-badge
          :value="unreadCount > 0 ? unreadCount : ''"
          :max="99"
          :hidden="unreadCount === 0"
        >
          <IconifyIconOffline :icon="MessageIcon" />
        </el-badge>
      </div>
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
              <span>加载�?..</span>
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
                @click="handleMessageClick(msg)"
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
          <el-button link type="primary" @click="openMessageCenter"
            >查看全部</el-button
          >
        </div>
      </div>
    </template>
    </el-dropdown>

    <!-- 消息中心 Drawer - 使用 Teleport 避免父元素堆叠上下文限制 -->
    <Teleport to="body">
    <sc-drawer
      v-model="drawerVisible"
      title="消息中心"
      direction="rtl"
      size="420px"
      :show-close="true"
      :z-index="2000"
      class="message-center-drawer"
    >
    <template #header>
      <div class="drawer-header">
        <span class="drawer-title">消息中心</span>
        <el-badge :value="unreadCount" :hidden="unreadCount === 0" />
      </div>
    </template>

    <!-- 选项�?-->
    <el-tabs v-model="activeTab" class="message-tabs">
      <el-tab-pane label="全部消息" name="all" />
      <el-tab-pane name="unread">
        <template #label>
          <span>未读消息</span>
          <el-badge v-if="unreadCount > 0" :value="unreadCount" class="tab-badge" />
        </template>
      </el-tab-pane>
      <el-tab-pane label="系统通知" name="system" />
    </el-tabs>

    <!-- 操作�?-->
    <div class="drawer-actions">
      <el-button size="small" @click="markAllAsRead" :disabled="unreadCount === 0">
        <IconifyIconOnline icon="ri:check-double-line" />
        全部已读
      </el-button>
      <el-button size="small" @click="clearAll" :disabled="messages.length === 0">
        <IconifyIconOnline icon="ri:delete-bin-line" />
        清空全部
      </el-button>
    </div>

    <!-- 消息列表 -->
    <el-scrollbar class="drawer-content">
      <el-empty v-if="filteredMessages.length === 0" description="暂无消息" />
      <div v-else class="drawer-message-list">
        <div
          v-for="msg in filteredMessages"
          :key="msg.id"
          :class="['drawer-message-item', { unread: !msg.read }]"
        >
          <div class="msg-avatar">
            <el-avatar v-if="msg.avatar" :size="40" :src="msg.avatar" />
            <div v-else class="default-avatar">
              <IconifyIconOnline icon="ri:notification-3-line" />
            </div>
          </div>
          <div class="msg-body" @click="handleMessageClick(msg)">
            <div class="msg-header">
              <span class="msg-title">{{ msg.title }}</span>
              <span class="msg-time">{{ msg.time }}</span>
            </div>
            <div class="msg-content">{{ msg.content }}</div>
          </div>
          <div class="msg-actions">
            <el-button
              v-if="!msg.read"
              link
              size="small"
              @click="markAsRead(msg)"
              title="标记已读"
            >
              <IconifyIconOnline icon="ri:check-line" />
            </el-button>
            <el-button
              link
              size="small"
              @click="deleteMessage(msg)"
              title="删除"
            >
              <IconifyIconOnline icon="ri:close-line" />
            </el-button>
          </div>
        </div>
      </div>
    </el-scrollbar>
    </sc-drawer>
    </Teleport>
    
    <!-- 消息弹窗组件 -->
    <LayMessageToast />
  </div>
</template>

<style lang="scss" scoped>
.message-container {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.message-container,
:deep(.message-container) {
  svg {
    background: transparent !important;
  }
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

// 消息中心 Drawer 样式
.message-center-drawer {
  .el-drawer__header {
    margin-bottom: 0;
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .el-drawer__body {
    padding: 0;
    display: flex;
    flex-direction: column;
  }

  .drawer-header {
    display: flex;
    align-items: center;
    gap: 10px;

    .drawer-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .message-tabs {
    padding: 0 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .el-tabs__header {
      margin: 0;
    }

    .tab-badge {
      margin-left: 6px;
    }
  }

  .drawer-actions {
    display: flex;
    gap: 10px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-lighter);
  }

  .drawer-content {
    flex: 1;
    padding: 12px 16px;
  }

  .drawer-message-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .drawer-message-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px;
    border-radius: 12px;
    background: var(--el-fill-color-lighter);
    border: 1px solid transparent;

    &:hover {
      border-color: var(--el-border-color);
    }

    &.unread {
      background: var(--el-color-primary-light-9);
      border-left: 3px solid var(--el-color-primary);
    }

    .msg-avatar {
      flex-shrink: 0;

      .default-avatar {
        width: 40px;
        height: 40px;
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
        font-size: 20px;
      }
    }

    .msg-body {
      flex: 1;
      min-width: 0;
      cursor: pointer;
    }

    .msg-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .msg-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .msg-time {
      font-size: 11px;
      color: var(--el-text-color-placeholder);
    }

    .msg-content {
      font-size: 13px;
      color: var(--el-text-color-secondary);
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .msg-actions {
      display: flex;
      flex-direction: column;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    &:hover .msg-actions {
      opacity: 1;
    }
  }
}

html.dark .message-center-drawer {
  .drawer-actions {
    background: var(--el-fill-color-dark);
  }

  .drawer-message-item {
    background: var(--el-fill-color-dark);

    &.unread {
      background: rgba(var(--el-color-primary-rgb), 0.15);
    }
  }
}

// 导入拆分的主题样式文�?
@use './themes/index';

</style>
