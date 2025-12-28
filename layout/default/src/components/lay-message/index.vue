<script setup lang="ts">
/**
 * 消息菜单组件
 * 支持异步请求获取消息列表，以及通过Socket.IO实时推送
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

// 消息功能开关 - 从配置中读取
const messageEnabled = ref(
  $storage.configure?.showMessage ?? getConfig().ShowBarMessage ?? true
);

/**
 * 消息项接口
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
// 加载状态
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
  // 开关关闭时不请求后端
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
 * 处理Socket消息推送
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
      
      // 触发消息弹窗推送事件
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
 * 标记消息为已读
 * @param message 消息项
 */
const markAsRead = async (message: MessageItem) => {
  if (message.read) return;
  // 开关关闭时只修改本地状态
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
      // 标记已读后从列表移除（后端已转入历史记录）
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
  // 开关关闭时只清空本地
  if (!messageEnabled.value) {
    messages.value = [];
    return;
  }
  try {
    const response = await fetchMarkAllAsRead();
    if (response.success) {
      // 清空未读列表（后端已全部转入历史记录）
      messages.value = [];
    }
  } catch (error) {
    console.error("全部标记已读失败:", error);
  }
};

/**
 * 清空所有消息
 */
const clearAll = async () => {
  // 批量标记已读后清空
  await markAllAsRead();
};

// 消息中心 Drawer 状态
const drawerVisible = ref(false);
const activeTab = ref("all");
const dropdownRef = ref();

/**
 * 打开消息中心 Drawer
 */
const openMessageCenter = () => {
  // 先关闭下拉菜单
  dropdownRef.value?.handleClose();
  drawerVisible.value = true;
};

/**
 * 关闭消息中心 Drawer
 */
const closeMessageCenter = () => {
  drawerVisible.value = false;
};

// 根据选项卡过滤消息
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
  // 开关关闭时只删除本地
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

  // 监听消息开关变化
  emitter.on("showMessageChange", showMessageChangeHandler);

  // 监听Socket消息推送
  const configStore = useConfigStore();
  const socket = configStore.getSocket();
  if (socket) {
    // 使用统一的主题命名规范
    socket.on("service:message:push", handleSocketMessage);
    socket.on("system:message:push", handleSocketMessage);
    socket.on("system:message:notification", handleSocketMessage);
  }
});

// 组件卸载时清理
onUnmounted(() => {
  const configStore = useConfigStore();
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

    <!-- 选项卡 -->
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

    <!-- 操作栏 -->
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

// ==================== 赛博朋克主题样式 ====================
html[data-skin="cyberpunk"] {
  $cyber-cyan: #00ffff;
  $cyber-magenta: #ff00ff;
  $cyber-dark: #0a0a12;
  $cyber-border: rgba(0, 255, 255, 0.25);
  $cyber-border-hover: rgba(0, 255, 255, 0.45);
  $cyber-shadow: 0 0 15px rgba(0, 255, 255, 0.3);

  // 消息触发按钮 - 参考全屏按钮样式
  .message-trigger {
    background: rgba(0, 0, 0, 0.55) !important;
    border: 1px solid $cyber-border !important;
    border-radius: 10px !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 10px rgba(0, 255, 255, 0.18) !important;
    transition: all 0.25s ease !important;

    &:hover {
      background: rgba(0, 0, 0, 0.7) !important;
      border-color: $cyber-border-hover !important;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35), 0 0 18px rgba(0, 255, 255, 0.28) !important;
      transform: translateY(-2px);

      .message-icon {
        color: $cyber-cyan !important;
        filter: drop-shadow(0 0 8px rgba(0, 255, 255, 0.6));
      }
    }

    .message-icon {
      color: $cyber-cyan !important;
      filter: drop-shadow(0 0 4px rgba(0, 255, 255, 0.4));
    }

    // Badge 样式
    .el-badge__content {
      background: linear-gradient(135deg, $cyber-magenta, #ff00aa) !important;
      border: none !important;
      box-shadow: 0 0 10px rgba(255, 0, 255, 0.5);
    }
  }

  // 消息下拉面板
  .message-dropdown-popper {
    .el-dropdown-menu {
      background: rgba(10, 14, 25, 0.96) !important;
      border: 1px solid $cyber-border !important;
      box-shadow:
        0 0 30px rgba(0, 255, 255, 0.2),
        0 0 60px rgba(255, 0, 255, 0.1),
        0 20px 60px rgba(0, 0, 0, 0.5) !important;
      border-radius: 12px !important;
      overflow: hidden;
    }
  }

  .message-panel {
    background: transparent !important;
    position: relative;

    // 扫描线纹理
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 255, 255, 0.015) 2px,
        rgba(0, 255, 255, 0.015) 4px
      );
      pointer-events: none;
      z-index: 0;
    }
  }

  .panel-header {
    background: linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(255, 0, 255, 0.05) 100%) !important;
    border-bottom: 1px solid $cyber-border !important;
    position: relative;
    z-index: 1;

    // 底部霓虹线
    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, $cyber-cyan 30%, $cyber-magenta 50%, $cyber-cyan 70%, transparent);
    }

    .header-title {
      color: $cyber-cyan !important;
      text-shadow: 0 0 8px rgba(0, 255, 255, 0.5);
      font-family: 'Rajdhani', 'Roboto', sans-serif;
      letter-spacing: 1px;
    }

    .el-button {
      color: $cyber-cyan !important;

      &:hover {
        color: #fff !important;
        text-shadow: 0 0 8px rgba(0, 255, 255, 0.6);
      }
    }
  }

  .panel-body {
    position: relative;
    z-index: 1;

    .loading-wrapper {
      color: $cyber-cyan !important;

      .el-icon {
        filter: drop-shadow(0 0 6px rgba(0, 255, 255, 0.6));
      }
    }
  }

  .message-item {
    background: rgba(10, 10, 18, 0.6) !important;
    border: 1px solid rgba(0, 255, 255, 0.15) !important;
    border-radius: 10px !important;
    margin: 4px 0 !important;
    transition: all 0.3s ease !important;

    &:hover {
      background: rgba(0, 255, 255, 0.1) !important;
      border-color: $cyber-cyan !important;
      box-shadow: 0 0 15px rgba(0, 255, 255, 0.25) !important;
      transform: translateX(4px);
    }

    &.unread {
      background: linear-gradient(135deg, rgba(0, 255, 255, 0.12) 0%, rgba(255, 0, 255, 0.08) 100%) !important;
      border-color: rgba(0, 255, 255, 0.3) !important;

      &:hover {
        background: linear-gradient(135deg, rgba(0, 255, 255, 0.18) 0%, rgba(255, 0, 255, 0.12) 100%) !important;
      }
    }

    .item-avatar .default-avatar {
      background: linear-gradient(135deg, $cyber-cyan, $cyber-magenta) !important;
      box-shadow: 0 0 12px rgba(0, 255, 255, 0.4);
    }

    .item-title {
      color: #fff !important;
    }

    .item-desc {
      color: rgba(0, 255, 255, 0.7) !important;
    }

    .item-time {
      color: rgba(0, 255, 255, 0.5) !important;
    }

    .unread-dot {
      background: $cyber-magenta !important;
      box-shadow: 0 0 8px rgba(255, 0, 255, 0.6);
    }
  }

  .panel-footer {
    background: linear-gradient(135deg, rgba(0, 255, 255, 0.05) 0%, rgba(255, 0, 255, 0.03) 100%) !important;
    border-top: 1px solid $cyber-border !important;
    position: relative;
    z-index: 1;

    // 顶部霓虹线
    &::before {
      content: '';
      position: absolute;
      top: -1px;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, $cyber-cyan 30%, $cyber-magenta 50%, $cyber-cyan 70%, transparent);
    }

    .el-button {
      color: $cyber-cyan !important;

      &:hover {
        color: #fff !important;
        text-shadow: 0 0 8px rgba(0, 255, 255, 0.6);
      }

      &[type="primary"] {
        color: $cyber-magenta !important;

        &:hover {
          color: #fff !important;
          text-shadow: 0 0 8px rgba(255, 0, 255, 0.6);
        }
      }
    }
  }

  // 消息中心 Drawer
  .message-center-drawer {
    .el-drawer {
      background: rgba(10, 14, 25, 0.98) !important;
    }

    .el-drawer__header {
      background: linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(255, 0, 255, 0.05) 100%) !important;
      border-bottom: 1px solid $cyber-border !important;
    }

    .drawer-title {
      color: $cyber-cyan !important;
      text-shadow: 0 0 8px rgba(0, 255, 255, 0.5);
    }

    .el-tabs__item {
      color: rgba(0, 255, 255, 0.7) !important;

      &.is-active {
        color: $cyber-cyan !important;
        text-shadow: 0 0 8px rgba(0, 255, 255, 0.5);
      }

      &:hover {
        color: #fff !important;
      }
    }

    .el-tabs__active-bar {
      background: linear-gradient(90deg, $cyber-cyan, $cyber-magenta) !important;
      box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
    }

    .drawer-actions {
      background: linear-gradient(135deg, rgba(0, 255, 255, 0.05) 0%, rgba(255, 0, 255, 0.03) 100%) !important;
      border-bottom-color: $cyber-border !important;

      .el-button {
        background: rgba(10, 10, 18, 0.6) !important;
        border: 1px solid rgba(0, 255, 255, 0.2) !important;
        color: $cyber-cyan !important;

        &:hover:not(:disabled) {
          background: rgba(0, 255, 255, 0.1) !important;
          border-color: $cyber-cyan !important;
          box-shadow: 0 0 12px rgba(0, 255, 255, 0.3);
        }

        &:disabled {
          opacity: 0.4;
        }
      }
    }

    .drawer-message-item {
      background: rgba(10, 10, 18, 0.6) !important;
      border: 1px solid rgba(0, 255, 255, 0.15) !important;

      &:hover {
        border-color: $cyber-cyan !important;
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.2);
      }

      &.unread {
        background: linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(255, 0, 255, 0.06) 100%) !important;
        border-left: 3px solid $cyber-cyan !important;
      }

      .msg-avatar .default-avatar {
        background: linear-gradient(135deg, $cyber-cyan, $cyber-magenta) !important;
        box-shadow: 0 0 12px rgba(0, 255, 255, 0.4);
      }

      .msg-title {
        color: #fff !important;
      }

      .msg-time {
        color: rgba(0, 255, 255, 0.5) !important;
      }

      .msg-content {
        color: rgba(0, 255, 255, 0.7) !important;
      }

      .msg-actions .el-button {
        color: $cyber-cyan !important;

        &:hover {
          color: #fff !important;
          filter: drop-shadow(0 0 6px rgba(0, 255, 255, 0.6));
        }
      }
    }
  }
}

// ==================== 春节主题样式 ====================
html[data-skin="spring-festival"] {
  $spring-red: #DC143C;
  $spring-red-dark: #B22222;
  $spring-gold: #FFD700;
  $spring-gold-dark: #DAA520;
  $spring-border: rgba(255, 215, 0, 0.3);
  $spring-border-hover: rgba(255, 215, 0, 0.5);

  // 消息触发按钮
  .message-trigger {
    background: rgba(139, 0, 0, 0.6) !important;
    border: 1px solid $spring-border !important;
    border-radius: 10px !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 10px rgba(255, 215, 0, 0.15) !important;
    transition: all 0.25s ease !important;

    &:hover {
      background: rgba(139, 0, 0, 0.8) !important;
      border-color: $spring-border-hover !important;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35), 0 0 18px rgba(255, 215, 0, 0.25) !important;
      transform: translateY(-2px);

      .message-icon {
        color: $spring-gold !important;
        filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.6));
      }
    }

    .message-icon {
      color: $spring-gold !important;
      filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.4));
    }

    // Badge 样式
    .el-badge__content {
      background: linear-gradient(135deg, $spring-red, $spring-red-dark) !important;
      border: none !important;
      box-shadow: 0 0 10px rgba(220, 20, 60, 0.5);
    }
  }

  // 消息下拉面板
  .message-dropdown-popper {
    .el-dropdown-menu {
      background: linear-gradient(180deg, $spring-red 0%, $spring-red-dark 100%) !important;
      border: 2px solid $spring-gold !important;
      box-shadow:
        0 0 20px rgba(255, 215, 0, 0.4),
        0 0 40px rgba(255, 215, 0, 0.2),
        0 20px 60px rgba(0, 0, 0, 0.4) !important;
      border-radius: 12px !important;
      overflow: hidden;
    }
  }

  .message-panel {
    background: transparent !important;
    position: relative;
  }

  .panel-header {
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(139, 0, 0, 0.2) 100%) !important;
    border-bottom: 1px solid $spring-border !important;
    position: relative;

    // 底部金色线
    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, $spring-gold 30%, rgba(255, 255, 255, 0.8) 50%, $spring-gold 70%, transparent);
    }

    .header-title {
      color: $spring-gold !important;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      font-weight: 600;
    }

    .el-button {
      color: rgba(255, 255, 255, 0.9) !important;

      &:hover {
        color: $spring-gold !important;
      }
    }
  }

  .panel-body {
    .loading-wrapper {
      color: $spring-gold !important;
    }
  }

  .message-item {
    background: rgba(139, 0, 0, 0.4) !important;
    border: 1px solid rgba(255, 215, 0, 0.2) !important;
    border-radius: 10px !important;
    margin: 4px 0 !important;
    transition: all 0.3s ease !important;

    &:hover {
      background: rgba(255, 215, 0, 0.15) !important;
      border-color: $spring-gold !important;
      box-shadow: 0 0 15px rgba(255, 215, 0, 0.2) !important;
      transform: translateX(4px);
    }

    &.unread {
      background: linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(139, 0, 0, 0.3) 100%) !important;
      border-color: rgba(255, 215, 0, 0.35) !important;

      &:hover {
        background: linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(139, 0, 0, 0.35) 100%) !important;
      }
    }

    .item-avatar .default-avatar {
      background: linear-gradient(135deg, $spring-red, $spring-gold) !important;
      box-shadow: 0 0 12px rgba(255, 215, 0, 0.4);
    }

    .item-title {
      color: #fff !important;
    }

    .item-desc {
      color: rgba(255, 255, 255, 0.8) !important;
    }

    .item-time {
      color: rgba(255, 215, 0, 0.7) !important;
    }

    .unread-dot {
      background: $spring-gold !important;
      box-shadow: 0 0 8px rgba(255, 215, 0, 0.6);
    }
  }

  .panel-footer {
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(139, 0, 0, 0.15) 100%) !important;
    border-top: 1px solid $spring-border !important;
    position: relative;

    // 顶部金色线
    &::before {
      content: '';
      position: absolute;
      top: -1px;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, $spring-gold 30%, rgba(255, 255, 255, 0.8) 50%, $spring-gold 70%, transparent);
    }

    .el-button {
      color: rgba(255, 255, 255, 0.9) !important;

      &:hover {
        color: $spring-gold !important;
      }

      &[type="primary"] {
        color: $spring-gold !important;

        &:hover {
          color: #fff !important;
          text-shadow: 0 0 8px rgba(255, 215, 0, 0.6);
        }
      }
    }
  }

  // 消息中心 Drawer
  .message-center-drawer {
    .el-drawer {
      background: linear-gradient(180deg, $spring-red 0%, $spring-red-dark 100%) !important;
    }

    .el-drawer__header {
      background: linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(139, 0, 0, 0.2) 100%) !important;
      border-bottom: 1px solid $spring-border !important;
    }

    .drawer-title {
      color: $spring-gold !important;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    }

    .el-tabs__item {
      color: rgba(255, 255, 255, 0.8) !important;

      &.is-active {
        color: $spring-gold !important;
      }

      &:hover {
        color: #fff !important;
      }
    }

    .el-tabs__active-bar {
      background: linear-gradient(90deg, $spring-gold, $spring-red) !important;
      box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
    }

    .drawer-actions {
      background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(139, 0, 0, 0.15) 100%) !important;
      border-bottom-color: $spring-border !important;

      .el-button {
        background: rgba(139, 0, 0, 0.4) !important;
        border: 1px solid rgba(255, 215, 0, 0.25) !important;
        color: rgba(255, 255, 255, 0.9) !important;

        &:hover:not(:disabled) {
          background: rgba(255, 215, 0, 0.15) !important;
          border-color: $spring-gold !important;
          color: $spring-gold !important;
          box-shadow: 0 0 12px rgba(255, 215, 0, 0.25);
        }

        &:disabled {
          opacity: 0.4;
        }
      }
    }

    .drawer-message-item {
      background: rgba(139, 0, 0, 0.4) !important;
      border: 1px solid rgba(255, 215, 0, 0.2) !important;

      &:hover {
        border-color: $spring-gold !important;
        box-shadow: 0 0 15px rgba(255, 215, 0, 0.2);
      }

      &.unread {
        background: linear-gradient(135deg, rgba(255, 215, 0, 0.12) 0%, rgba(139, 0, 0, 0.3) 100%) !important;
        border-left: 3px solid $spring-gold !important;
      }

      .msg-avatar .default-avatar {
        background: linear-gradient(135deg, $spring-red, $spring-gold) !important;
        box-shadow: 0 0 12px rgba(255, 215, 0, 0.4);
      }

      .msg-title {
        color: #fff !important;
      }

      .msg-time {
        color: rgba(255, 215, 0, 0.7) !important;
      }

      .msg-content {
        color: rgba(255, 255, 255, 0.8) !important;
      }

      .msg-actions .el-button {
        color: rgba(255, 255, 255, 0.9) !important;

        &:hover {
          color: $spring-gold !important;
          filter: drop-shadow(0 0 6px rgba(255, 215, 0, 0.6));
        }
      }
    }
  }
}

// ==================== 中秋主题样式 ====================
html[data-skin="mid-autumn"] {
  $mid-blue: #1a237e;
  $mid-blue-light: #283593;
  $mid-gold: #ffd54f;
  $mid-gold-light: #ffecb3;
  $mid-cyan: #00bcd4;
  $mid-border: rgba(255, 213, 79, 0.3);
  $mid-border-hover: rgba(255, 213, 79, 0.5);

  // 消息触发按钮
  .message-trigger {
    background: rgba(26, 35, 126, 0.6) !important;
    border: 1px solid $mid-border !important;
    border-radius: 10px !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 10px rgba(255, 213, 79, 0.15) !important;
    transition: all 0.25s ease !important;

    &:hover {
      background: rgba(26, 35, 126, 0.8) !important;
      border-color: $mid-border-hover !important;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35), 0 0 18px rgba(255, 213, 79, 0.25) !important;
      transform: translateY(-2px);

      .message-icon {
        color: $mid-gold !important;
        filter: drop-shadow(0 0 8px rgba(255, 213, 79, 0.6));
      }
    }

    .message-icon {
      color: $mid-gold !important;
      filter: drop-shadow(0 0 4px rgba(255, 213, 79, 0.4));
    }

    // Badge 样式
    .el-badge__content {
      background: linear-gradient(135deg, $mid-blue, $mid-blue-light) !important;
      border: none !important;
      box-shadow: 0 0 10px rgba(26, 35, 126, 0.5);
    }
  }

  // 消息下拉面板
  .message-dropdown-popper {
    .el-dropdown-menu {
      background: linear-gradient(180deg, $mid-blue 0%, $mid-blue-light 100%) !important;
      border: 2px solid $mid-gold !important;
      box-shadow:
        0 0 20px rgba(255, 213, 79, 0.3),
        0 0 40px rgba(255, 213, 79, 0.15),
        0 20px 60px rgba(0, 0, 0, 0.4) !important;
      border-radius: 12px !important;
      overflow: hidden;
    }
  }

  .message-panel {
    background: transparent !important;
    position: relative;
  }

  .panel-header {
    background: linear-gradient(135deg, rgba(255, 213, 79, 0.15) 0%, rgba(26, 35, 126, 0.2) 100%) !important;
    border-bottom: 1px solid $mid-border !important;
    position: relative;

    // 底部金色线
    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, $mid-gold 30%, rgba(255, 255, 255, 0.8) 50%, $mid-gold 70%, transparent);
    }

    .header-title {
      color: $mid-gold !important;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      font-weight: 600;
    }

    .el-button {
      color: rgba(255, 255, 255, 0.9) !important;

      &:hover {
        color: $mid-gold !important;
      }
    }
  }

  .panel-body {
    .loading-wrapper {
      color: $mid-gold !important;
    }
  }

  .message-item {
    background: rgba(26, 35, 126, 0.4) !important;
    border: 1px solid rgba(255, 213, 79, 0.2) !important;
    border-radius: 10px !important;
    margin: 4px 0 !important;
    transition: all 0.3s ease !important;

    &:hover {
      background: rgba(255, 213, 79, 0.15) !important;
      border-color: $mid-gold !important;
      box-shadow: 0 0 15px rgba(255, 213, 79, 0.2) !important;
      transform: translateX(4px);
    }

    &.unread {
      background: linear-gradient(135deg, rgba(255, 213, 79, 0.15) 0%, rgba(26, 35, 126, 0.3) 100%) !important;
      border-color: rgba(255, 213, 79, 0.35) !important;

      &:hover {
        background: linear-gradient(135deg, rgba(255, 213, 79, 0.2) 0%, rgba(26, 35, 126, 0.35) 100%) !important;
      }
    }

    .item-avatar .default-avatar {
      background: linear-gradient(135deg, $mid-blue, $mid-gold) !important;
      box-shadow: 0 0 12px rgba(255, 213, 79, 0.4);
    }

    .item-title {
      color: #fff !important;
    }

    .item-desc {
      color: rgba(255, 255, 255, 0.8) !important;
    }

    .item-time {
      color: rgba(255, 213, 79, 0.7) !important;
    }

    .unread-dot {
      background: $mid-gold !important;
      box-shadow: 0 0 8px rgba(255, 213, 79, 0.6);
    }
  }

  .panel-footer {
    background: linear-gradient(135deg, rgba(255, 213, 79, 0.1) 0%, rgba(26, 35, 126, 0.15) 100%) !important;
    border-top: 1px solid $mid-border !important;
    position: relative;

    // 顶部金色线
    &::before {
      content: '';
      position: absolute;
      top: -1px;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, $mid-gold 30%, rgba(255, 255, 255, 0.8) 50%, $mid-gold 70%, transparent);
    }

    .el-button {
      color: rgba(255, 255, 255, 0.9) !important;

      &:hover {
        color: $mid-gold !important;
      }

      &[type="primary"] {
        color: $mid-gold !important;

        &:hover {
          color: #fff !important;
          text-shadow: 0 0 8px rgba(255, 213, 79, 0.6);
        }
      }
    }
  }

  // 消息中心 Drawer
  .message-center-drawer {
    .el-drawer {
      background: linear-gradient(180deg, $mid-blue 0%, $mid-blue-light 100%) !important;
    }

    .el-drawer__header {
      background: linear-gradient(135deg, rgba(255, 213, 79, 0.15) 0%, rgba(26, 35, 126, 0.2) 100%) !important;
      border-bottom: 1px solid $mid-border !important;
    }

    .drawer-title {
      color: $mid-gold !important;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    }

    .el-tabs__item {
      color: rgba(255, 255, 255, 0.8) !important;

      &.is-active {
        color: $mid-gold !important;
      }

      &:hover {
        color: #fff !important;
      }
    }

    .el-tabs__active-bar {
      background: linear-gradient(90deg, $mid-gold, $mid-cyan) !important;
      box-shadow: 0 0 10px rgba(255, 213, 79, 0.5);
    }

    .drawer-actions {
      background: linear-gradient(135deg, rgba(255, 213, 79, 0.1) 0%, rgba(26, 35, 126, 0.15) 100%) !important;
      border-bottom-color: $mid-border !important;

      .el-button {
        background: rgba(26, 35, 126, 0.4) !important;
        border: 1px solid rgba(255, 213, 79, 0.25) !important;
        color: rgba(255, 255, 255, 0.9) !important;

        &:hover:not(:disabled) {
          background: rgba(255, 213, 79, 0.15) !important;
          border-color: $mid-gold !important;
          color: $mid-gold !important;
          box-shadow: 0 0 12px rgba(255, 213, 79, 0.25);
        }

        &:disabled {
          opacity: 0.4;
        }
      }
    }

    .drawer-message-item {
      background: rgba(26, 35, 126, 0.4) !important;
      border: 1px solid rgba(255, 213, 79, 0.2) !important;

      &:hover {
        border-color: $mid-gold !important;
        box-shadow: 0 0 15px rgba(255, 213, 79, 0.2);
      }

      &.unread {
        background: linear-gradient(135deg, rgba(255, 213, 79, 0.12) 0%, rgba(26, 35, 126, 0.3) 100%) !important;
        border-left: 3px solid $mid-gold !important;
      }

      .msg-avatar .default-avatar {
        background: linear-gradient(135deg, $mid-blue, $mid-gold) !important;
        box-shadow: 0 0 12px rgba(255, 213, 79, 0.4);
      }

      .msg-title {
        color: #fff !important;
      }

      .msg-time {
        color: rgba(255, 213, 79, 0.7) !important;
      }

      .msg-content {
        color: rgba(255, 255, 255, 0.8) !important;
      }

      .msg-actions .el-button {
        color: rgba(255, 255, 255, 0.9) !important;

        &:hover {
          color: $mid-gold !important;
          filter: drop-shadow(0 0 6px rgba(255, 213, 79, 0.6));
        }
      }
    }
  }
}

// ==================== 圣诞主题样式 ====================
html[data-skin="christmas"] {
  $xmas-green: #1b5e20;
  $xmas-green-light: #2e7d32;
  $xmas-red: #c62828;
  $xmas-red-light: #e53935;
  $xmas-gold: #ffd700;
  $xmas-white: #ffffff;
  $xmas-border: rgba(255, 215, 0, 0.3);
  $xmas-border-hover: rgba(255, 215, 0, 0.5);

  // 消息触发按钮
  .message-trigger {
    background: rgba(27, 94, 32, 0.6) !important;
    border: 1px solid $xmas-border !important;
    border-radius: 10px !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 10px rgba(255, 215, 0, 0.15) !important;
    transition: all 0.25s ease !important;

    &:hover {
      background: rgba(27, 94, 32, 0.8) !important;
      border-color: $xmas-border-hover !important;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35), 0 0 18px rgba(255, 215, 0, 0.25) !important;
      transform: translateY(-2px);

      .message-icon {
        color: $xmas-gold !important;
        filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.6));
      }
    }

    .message-icon {
      color: $xmas-gold !important;
      filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.4));
    }

    // Badge 样式
    .el-badge__content {
      background: linear-gradient(135deg, $xmas-red, $xmas-red-light) !important;
      border: none !important;
      box-shadow: 0 0 10px rgba(198, 40, 40, 0.5);
    }
  }

  // 消息下拉面板
  .message-dropdown-popper {
    .el-dropdown-menu {
      background: linear-gradient(180deg, $xmas-green 0%, $xmas-green-light 100%) !important;
      border: 2px solid $xmas-gold !important;
      box-shadow:
        0 0 20px rgba(255, 215, 0, 0.4),
        0 0 40px rgba(198, 40, 40, 0.2),
        0 20px 60px rgba(0, 0, 0, 0.4) !important;
      border-radius: 12px !important;
      overflow: hidden;
    }
  }

  .message-panel {
    background: transparent !important;
    position: relative;
  }

  .panel-header {
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(198, 40, 40, 0.1) 100%) !important;
    border-bottom: 1px solid $xmas-border !important;
    position: relative;

    // 底部金色线
    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, $xmas-gold 30%, $xmas-white 50%, $xmas-gold 70%, transparent);
    }

    .header-title {
      color: $xmas-gold !important;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      font-weight: 600;
    }

    .el-button {
      color: rgba(255, 255, 255, 0.9) !important;

      &:hover {
        color: $xmas-gold !important;
      }
    }
  }

  .panel-body {
    .loading-wrapper {
      color: $xmas-gold !important;
    }
  }

  .message-item {
    background: rgba(27, 94, 32, 0.4) !important;
    border: 1px solid rgba(255, 215, 0, 0.2) !important;
    border-radius: 10px !important;
    margin: 4px 0 !important;
    transition: all 0.3s ease !important;

    &:hover {
      background: rgba(255, 215, 0, 0.15) !important;
      border-color: $xmas-gold !important;
      box-shadow: 0 0 15px rgba(255, 215, 0, 0.2) !important;
      transform: translateX(4px);
    }

    &.unread {
      background: linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(198, 40, 40, 0.15) 100%) !important;
      border-color: rgba(255, 215, 0, 0.35) !important;

      &:hover {
        background: linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(198, 40, 40, 0.2) 100%) !important;
      }
    }

    .item-avatar .default-avatar {
      background: linear-gradient(135deg, $xmas-red, $xmas-gold) !important;
      box-shadow: 0 0 12px rgba(255, 215, 0, 0.4);
    }

    .item-title {
      color: #fff !important;
    }

    .item-desc {
      color: rgba(255, 255, 255, 0.8) !important;
    }

    .item-time {
      color: rgba(255, 215, 0, 0.7) !important;
    }

    .unread-dot {
      background: $xmas-red !important;
      box-shadow: 0 0 8px rgba(198, 40, 40, 0.6);
    }
  }

  .panel-footer {
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(198, 40, 40, 0.08) 100%) !important;
    border-top: 1px solid $xmas-border !important;
    position: relative;

    // 顶部金色线
    &::before {
      content: '';
      position: absolute;
      top: -1px;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, $xmas-gold 30%, $xmas-white 50%, $xmas-gold 70%, transparent);
    }

    .el-button {
      color: rgba(255, 255, 255, 0.9) !important;

      &:hover {
        color: $xmas-gold !important;
      }

      &[type="primary"] {
        color: $xmas-gold !important;

        &:hover {
          color: #fff !important;
          text-shadow: 0 0 8px rgba(255, 215, 0, 0.6);
        }
      }
    }
  }

  // 消息中心 Drawer
  .message-center-drawer {
    .el-drawer {
      background: linear-gradient(180deg, $xmas-green 0%, $xmas-green-light 100%) !important;
    }

    .el-drawer__header {
      background: linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(198, 40, 40, 0.1) 100%) !important;
      border-bottom: 1px solid $xmas-border !important;
    }

    .drawer-title {
      color: $xmas-gold !important;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    }

    .el-tabs__item {
      color: rgba(255, 255, 255, 0.8) !important;

      &.is-active {
        color: $xmas-gold !important;
      }

      &:hover {
        color: #fff !important;
      }
    }

    .el-tabs__active-bar {
      background: linear-gradient(90deg, $xmas-gold, $xmas-red) !important;
      box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
    }

    .drawer-actions {
      background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(198, 40, 40, 0.08) 100%) !important;
      border-bottom-color: $xmas-border !important;

      .el-button {
        background: rgba(27, 94, 32, 0.4) !important;
        border: 1px solid rgba(255, 215, 0, 0.25) !important;
        color: rgba(255, 255, 255, 0.9) !important;

        &:hover:not(:disabled) {
          background: rgba(255, 215, 0, 0.15) !important;
          border-color: $xmas-gold !important;
          color: $xmas-gold !important;
          box-shadow: 0 0 12px rgba(255, 215, 0, 0.25);
        }

        &:disabled {
          opacity: 0.4;
        }
      }
    }

    .drawer-message-item {
      background: rgba(27, 94, 32, 0.4) !important;
      border: 1px solid rgba(255, 215, 0, 0.2) !important;

      &:hover {
        border-color: $xmas-gold !important;
        box-shadow: 0 0 15px rgba(255, 215, 0, 0.2);
      }

      &.unread {
        background: linear-gradient(135deg, rgba(255, 215, 0, 0.12) 0%, rgba(198, 40, 40, 0.15) 100%) !important;
        border-left: 3px solid $xmas-gold !important;
      }

      .msg-avatar .default-avatar {
        background: linear-gradient(135deg, $xmas-red, $xmas-gold) !important;
        box-shadow: 0 0 12px rgba(255, 215, 0, 0.4);
      }

      .msg-title {
        color: #fff !important;
      }

      .msg-time {
        color: rgba(255, 215, 0, 0.7) !important;
      }

      .msg-content {
        color: rgba(255, 255, 255, 0.8) !important;
      }

      .msg-actions .el-button {
        color: rgba(255, 255, 255, 0.9) !important;

        &:hover {
          color: $xmas-gold !important;
          filter: drop-shadow(0 0 6px rgba(255, 215, 0, 0.6));
        }
      }
    }
  }
}

</style>
