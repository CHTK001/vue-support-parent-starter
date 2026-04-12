<script setup lang="ts">
import ScTabPane from "@repo/components/ScTabs";
import { ScAvatar } from "@repo/components/ScAvatar";
import { ScBadge } from "@repo/components/ScBadge";
import { ScIcon } from "@repo/components/ScIcon";
import { ScEmpty } from "@repo/components/ScEmpty";
import { ScButton } from "@repo/components/ScButton";
import ScDropdown from "@repo/components/ScDropdown";
import ScScrollbar from "@repo/components/ScScrollbar";
import { ScTabs } from "@repo/components/ScTabs";
/**
 * 消息菜单组件
 * 支持异步请求获取消息列表，以及通过Socket.IO实时推�?
 * @author CH
 * @version 1.0.0
 * @since 2024-12-04
 */
import { ref, onMounted, onUnmounted, computed, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import {
  useConfigStore,
  useUserStoreHook,
  getMessageTopicWithUser,
  router,
  emitter,
} from "@repo/core";
import MessageIcon from "@iconify-icons/ri/message-3-line";
import { getConfig } from "@repo/config";
import { useGlobal } from "@pureadmin/utils";
import { message } from "@repo/utils";
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
const userStore = useUserStoreHook();
const socketTopics = ref<string[]>([]);

// 消息功能开�?- 从配置中读取
const messageEnabled = ref(
  $storage.configure?.showMessage ?? getConfig().ShowBarMessage ?? true,
);

type MessageDropdownPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "left-center"
  | "right-center"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

// 消息中心下拉弹框位置（与 ScSelect layout="position" 一致）
// 默认顶部靠右，便于与通知区域保持一致
const messageDropdownPosition = ref<MessageDropdownPosition>(
  ($storage.configure?.messageDropdownPosition as MessageDropdownPosition) ??
    "top-right",
);

const dropdownPlacement = computed(() => {
  const map: Record<MessageDropdownPosition, string> = {
    "top-left": "top-start",
    "top-center": "top",
    "top-right": "top-end",
    "left-center": "left",
    "right-center": "right",
    "bottom-left": "bottom-start",
    "bottom-center": "bottom",
    "bottom-right": "bottom-end",
  };
  return map[messageDropdownPosition.value] || "bottom-end";
});

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
  () => messages.value.filter((m) => !m.read).length,
);

const notifyActionError = (content: string) => {
  message(content, { type: "error" });
};

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
    const records = Array.isArray(response?.data) ? response.data : [];
    messages.value = records.map(transformMessage);
  } catch {
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
 * messageDropdownPosition 变化监听处理函数
 */
const messageDropdownPositionChangeHandler = (val: MessageDropdownPosition) => {
  messageDropdownPosition.value = val;
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
      id: data.messageId || data.sysMessageId || data.id || Date.now(),
      title: data.title || data.sysMessageTitle || "新消息",
      content: data.content || data.sysMessageContent || data.message,
      avatar: data.avatar,
      time:
        data.sendTime ||
        data.sysMessageSendTime ||
        data.time ||
        new Date().toLocaleString(),
      read: false,
      type: data.type || data.sysMessageType || "system",
      level: data.level || data.sysMessageLevel || "normal",
      url: data.url || data.sysMessageUrl,
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
    if (response?.code === "00000" || response?.data === true) {
      // 标记已读后从列表移除（后端已转入历史记录�?
      const index = messages.value.findIndex((m) => m.id === message.id);
      if (index > -1) {
        messages.value.splice(index, 1);
      }
    }
  } catch {
    notifyActionError("标记已读失败");
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
    if (response?.code === "00000" || response?.data === true) {
      // 清空未读列表（后端已全部转入历史记录�?
      messages.value = [];
    }
  } catch {
    notifyActionError("全部标记已读失败");
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
let openDrawerTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * 打开消息中心 Drawer
 */
const openMessageCenter = () => {
  if (openDrawerTimer) {
    clearTimeout(openDrawerTimer);
  }
  dropdownRef.value?.handleClose();
  nextTick(() => {
    openDrawerTimer = setTimeout(() => {
      drawerVisible.value = true;
    }, 80);
  });
};

/**
 * 关闭消息中心 Drawer
 */
const closeMessageCenter = () => {
  if (openDrawerTimer) {
    clearTimeout(openDrawerTimer);
  }
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
    if (response?.code === "00000" || response?.data === true) {
      const index = messages.value.findIndex((m) => m.id === msg.id);
      if (index > -1) {
        messages.value.splice(index, 1);
      }
    }
  } catch {
    notifyActionError("删除消息失败");
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
/**
 * 开发模式下的本地默认消息推送
 * 通过事件总线触发，避免依赖真实后端
 */
const handleDevMessagePush = (payload?: any) => {
  const now = new Date();
  const data = payload || {
    id: now.getTime(),
    title: "开发环境默认测试消息",
    content:
      "这是通过设置面板发送的默认测试消息，用于验证消息中心展示和弹窗配置。",
    type: "dev",
    level: "info",
    time: now.toLocaleString(),
  };
  handleSocketMessage(data);
};

const bindSocketTopics = () => {
  const socket = configStore.getSocket();
  if (!socket) {
    socketTopics.value = [];
    return;
  }

  const topics = new Set<string>(["system:message:notification"]);
  const currentUserId = Number(userStore.sysUserId || 0);

  if (currentUserId > 0) {
    topics.add(getMessageTopicWithUser(currentUserId));
  }
  topics.add(getMessageTopicWithUser(0));
  topics.add("service:message:push");
  topics.add("system:message:push");

  socketTopics.value = Array.from(topics);
  socketTopics.value.forEach((topic) => {
    socket.on(topic, handleSocketMessage);
  });
};

onMounted(() => {
  // 获取消息列表
  fetchMessages();

  // 监听消息开关变�?
  emitter.on("showMessageChange", showMessageChangeHandler);
  emitter.on(
    "messageDropdownPositionChange",
    messageDropdownPositionChangeHandler,
  );
  emitter.on("messageCenterOpen", openMessageCenter);

  // 开发模式下的本地默认消息推送
  emitter.on("devMessagePush", handleDevMessagePush);

  // 监听Socket消息推�?
  bindSocketTopics();
});

// 组件卸载时清�?
onUnmounted(() => {
  const socket = configStore.getSocket();
  if (socket) {
    socketTopics.value.forEach((topic) => {
      socket.off(topic);
    });
  }
  // 清理事件监听
  emitter.off("showMessageChange", showMessageChangeHandler);
  emitter.off(
    "messageDropdownPositionChange",
    messageDropdownPositionChangeHandler,
  );
  emitter.off("messageCenterOpen", openMessageCenter);
  emitter.off("devMessagePush", handleDevMessagePush);
  if (openDrawerTimer) {
    clearTimeout(openDrawerTimer);
  }
});
</script>

<template>
  <div v-if="messageEnabled">
    <ScDropdown
      ref="dropdownRef"
      trigger="click"
      :placement="dropdownPlacement"
      popper-class="message-dropdown-popper"
    >
      <div class="message-trigger flex-c cursor-pointer navbar-bg-hover">
        <ScBadge
          :value="unreadCount > 0 ? unreadCount : ''"
          :max="99"
          :hidden="unreadCount === 0"
        >
          <IconifyIconOffline :icon="MessageIcon" />
        </ScBadge>
      </div>
      <template #dropdown>
        <div class="message-panel">
          <!-- 头部 -->
          <div class="panel-header">
            <span class="header-title">消息中心</span>
            <div class="header-actions">
              <ScButton
                v-if="unreadCount > 0"
                link
                size="small"
                @click="markAllAsRead"
              >
                全部已读
              </ScButton>
            </div>
          </div>

          <!-- 消息列表 -->
          <div class="panel-body">
            <ScScrollbar max-height="320px">
              <div v-if="loading" class="loading-wrapper">
                <ScIcon class="is-loading"
                  ><IconifyIconOnline icon="ri:loader-4-line"
                /></ScIcon>
                <span>加载�?..</span>
              </div>
              <ScEmpty
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
                    <ScAvatar v-if="msg.avatar" :size="36" :src="msg.avatar" />
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
            </ScScrollbar>
          </div>

          <!-- 底部 -->
          <div class="panel-footer">
            <ScButton link @click="clearAll">清空消息</ScButton>
            <ScButton link type="primary" @click="openMessageCenter"
              >查看全部</ScButton
            >
          </div>
        </div>
      </template>
    </ScDropdown>

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
            <ScBadge :value="unreadCount" :hidden="unreadCount === 0" />
          </div>
        </template>

        <!-- 选项�?-->
        <ScTabs v-model="activeTab" class="message-tabs">
          <ScTabPane label="全部消息" name="all" />
          <ScTabPane name="unread">
            <template #label>
              <span>未读消息</span>
              <ScBadge
                v-if="unreadCount > 0"
                :value="unreadCount"
                class="tab-badge"
              />
            </template>
          </ScTabPane>
          <ScTabPane label="系统通知" name="system" />
        </ScTabs>

        <!-- 操作栏 -->
        <div class="drawer-actions">
          <ScButton
            round
            size="small"
            @click="markAllAsRead"
            :disabled="unreadCount === 0"
          >
            <IconifyIconOnline icon="ri:check-double-line" class="mr-1" />
            全部已读
          </ScButton>
          <ScButton
            round
            size="small"
            @click="clearAll"
            :disabled="messages.length === 0"
          >
            <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
            清空全部
          </ScButton>
        </div>

        <!-- 消息列表 -->
        <ScScrollbar class="drawer-content">
          <ScEmpty
            v-if="filteredMessages.length === 0"
            description="暂无消息"
          />
          <div v-else class="drawer-message-list">
            <div
              v-for="msg in filteredMessages"
              :key="msg.id"
              :class="['drawer-message-item', { unread: !msg.read }]"
            >
              <div class="msg-avatar">
                <ScAvatar v-if="msg.avatar" :size="40" :src="msg.avatar" />
                <div v-else class="default-avatar">
                  <IconifyIconOnline icon="ri:notification-3-line" />
                </div>
              </div>
              <div class="msg-body" @click="handleMessageClick(msg)">
                <div class="msg-header">
                  <span class="msg-title">{{ msg.title }}</span>
                  <span class="msg-time">
                    <IconifyIconOnline icon="ri:time-line" />
                    {{ msg.time }}
                  </span>
                </div>
                <div class="msg-content">{{ msg.content }}</div>
              </div>
              <div class="msg-actions">
                <ScButton
                  v-if="!msg.read"
                  circle
                  size="small"
                  @click="markAsRead(msg)"
                  title="标记已读"
                >
                  <IconifyIconOnline icon="ri:check-line" />
                </ScButton>
                <ScButton
                  circle
                  size="small"
                  @click="deleteMessage(msg)"
                  title="删除"
                >
                  <IconifyIconOnline icon="ri:close-line" />
                </ScButton>
              </div>
            </div>
          </div>
        </ScScrollbar>
      </sc-drawer>
    </Teleport>

    <!-- 消息弹窗组件 -->
    <LayMessageToast />
  </div>
</template>

<style lang="scss" scoped>
.message-trigger {
  --lay-message-trigger-bg: rgba(255, 255, 255, 0.42);
  --lay-message-trigger-border: rgba(148, 163, 184, 0.16);
  --lay-message-trigger-hover-bg: rgba(var(--el-color-primary-rgb), 0.12);
  --lay-message-trigger-hover-shadow: 0 4px 12px
    rgba(var(--el-color-primary-rgb), 0.15);
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transition: all 0.3s ease;
  color: var(--el-text-color-regular);
  position: relative;
  overflow: hidden;
  background: var(--lay-message-trigger-bg);
  border: 1px solid var(--lay-message-trigger-border);
  backdrop-filter: blur(14px);

  /* 玻璃拟态光泽 */
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover {
    background: var(--lay-message-trigger-hover-bg);
    color: var(--el-color-primary);
    transform: translateY(-2px);
    box-shadow: var(--lay-message-trigger-hover-shadow);

    &::before {
      opacity: 1;
    }
  }

  /* 适配不同主题的图标颜色 */
  :deep(svg) {
    /* 移除 !important 以允许 hover 颜色生效 */
    background: transparent;
  }
}

html.dark .message-trigger {
  --lay-message-trigger-bg: rgba(15, 23, 42, 0.68);
  --lay-message-trigger-border: rgba(148, 163, 184, 0.18);
  --lay-message-trigger-hover-bg: rgba(var(--el-color-primary-rgb), 0.18);
  --lay-message-trigger-hover-shadow: 0 12px 26px rgba(2, 8, 23, 0.32);
}
</style>

<style lang="scss">
// 引入主题样式
@use "./themes/index";

.message-dropdown-popper {
  .el-dropdown-menu {
    padding: 0 !important;
    border-radius: 16px;
    border: 1px solid var(--stitch-lay-border, var(--el-border-color-lighter));
    background: var(--stitch-lay-bg-overlay, var(--el-bg-color-overlay));
    backdrop-filter: blur(20px);
    box-shadow:
      0 16px 48px rgba(0, 0, 0, 0.18),
      0 4px 16px rgba(0, 0, 0, 0.08);
    overflow: hidden;
  }

  // 去除箭头
  .el-popper__arrow {
    display: none;
  }

  .message-panel {
    color: var(--stitch-lay-text-main, var(--el-text-color-primary));
  }

  .sc-button.is-link {
    color: var(--el-text-color-regular);
  }

  .sc-button.is-link:hover {
    color: var(--el-color-primary);
  }
}

.message-panel {
  width: 380px;
  background: transparent; // 背景由 dropdown-menu 控制
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid
    var(--stitch-lay-border, var(--el-border-color-lighter));
  background: rgba(var(--el-fill-color-lighter-rgb), 0.5);

  .header-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--stitch-lay-text-main, var(--el-text-color-primary));
    display: flex;
    align-items: center;
    gap: 8px;

    &::before {
      content: "";
      width: 4px;
      height: 16px;
      background: var(--el-color-primary);
      border-radius: 2px;
    }
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }
}

.panel-body {
  min-height: 200px;
  max-height: 400px;

  .loading-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 0;
    color: var(--el-text-color-secondary);
    gap: 12px;

    .el-icon {
      font-size: 28px;
      color: var(--el-color-primary);
      animation: rotate 1.5s linear infinite;
    }
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.message-list {
  padding: 12px;
}

.message-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  margin: 0 12px 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  border: 1px solid transparent;
  background: rgba(var(--el-fill-color-white-rgb), 0.5);

  &:hover {
    background: var(--stitch-lay-bg-hover, var(--el-fill-color-light));
    border-color: var(--stitch-lay-border, var(--el-border-color-lighter));
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  &.unread {
    background: rgba(var(--el-color-primary-rgb), 0.04);
    border: 1px solid rgba(var(--el-color-primary-rgb), 0.1);

    &:hover {
      background: rgba(var(--el-color-primary-rgb), 0.08);
      border-color: rgba(var(--el-color-primary-rgb), 0.2);
    }

    .item-title {
      color: var(--el-color-primary);
      font-weight: 600;
    }
  }

  .item-avatar {
    flex-shrink: 0;

    .default-avatar {
      width: 42px;
      height: 42px;
      border-radius: 12px;
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
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
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
    margin-bottom: 6px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .item-desc {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .item-time {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
    display: flex;
    align-items: center;
    gap: 4px;

    &::before {
      content: "";
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--el-border-color);
    }
  }

  .unread-dot {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 8px;
    height: 8px;
    background: var(--el-color-primary);
    border-radius: 50%;
    box-shadow: 0 0 0 4px rgba(var(--el-color-primary-rgb), 0.1);
    animation: pulse 2s infinite;
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--el-color-primary-rgb), 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(var(--el-color-primary-rgb), 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(var(--el-color-primary-rgb), 0);
  }
}

.panel-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  border-top: 1px solid var(--stitch-lay-border, var(--el-border-color-lighter));
  background: rgba(var(--el-fill-color-lighter-rgb), 0.3);
  backdrop-filter: blur(10px);
}

// 深色模式适配
html.dark {
  .message-dropdown-popper .el-dropdown-menu {
    background: rgba(15, 23, 42, 0.92) !important;
    border-color: rgba(148, 163, 184, 0.18) !important;
    box-shadow:
      0 24px 48px rgba(2, 8, 23, 0.42),
      0 0 0 1px rgba(255, 255, 255, 0.03) !important;
  }

  .panel-header,
  .panel-footer {
    background: rgba(15, 23, 42, 0.88);
    border-color: rgba(148, 163, 184, 0.14);
  }

  .panel-header .header-title {
    color: #f8fafc;
  }

  .message-dropdown-popper .sc-button.is-link {
    color: #cbd5e1;
  }

  .message-dropdown-popper .sc-button.is-link:hover {
    color: #f8fafc;
  }

  .message-item {
    background: rgba(30, 41, 59, 0.62);
    border-color: rgba(148, 163, 184, 0.12);

    &:hover {
      background: rgba(51, 65, 85, 0.78);
      border-color: rgba(148, 163, 184, 0.2);
      box-shadow: 0 12px 24px rgba(2, 8, 23, 0.24);
    }
  }

  .message-item .item-title,
  .message-center-drawer .drawer-title,
  .message-center-drawer .msg-title {
    color: #f8fafc;
  }

  .message-item .item-desc,
  .message-item .item-time,
  .message-center-drawer .msg-content,
  .message-center-drawer .msg-time {
    color: #94a3b8;
  }

  .message-item.unread {
    background: rgba(var(--el-color-primary-rgb), 0.18);
    border-color: rgba(var(--el-color-primary-rgb), 0.24);
  }

  .message-center-drawer {
    .el-drawer {
      background:
        linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 8, 23, 0.98));
      color: #f8fafc;
    }

    .el-drawer__header,
    .message-tabs,
    .drawer-actions {
      background: rgba(15, 23, 42, 0.9);
      border-color: rgba(148, 163, 184, 0.14);
    }

    .drawer-message-item {
      background: rgba(30, 41, 59, 0.74);
      border-color: rgba(148, 163, 184, 0.14);
      box-shadow: 0 14px 28px rgba(2, 8, 23, 0.2);
    }

    .drawer-message-item:hover {
      border-color: rgba(var(--el-color-primary-rgb), 0.34);
      box-shadow:
        0 18px 34px rgba(2, 8, 23, 0.24),
        0 0 0 1px rgba(var(--el-color-primary-rgb), 0.12);
    }

    .drawer-message-item.unread {
      background: rgba(var(--el-color-primary-rgb), 0.16);
    }

    .drawer-message-item .msg-time {
      background: rgba(51, 65, 85, 0.9);
      color: #cbd5e1;
    }

    .drawer-message-item .msg-actions .el-button {
      border-color: rgba(148, 163, 184, 0.16);
      background: rgba(15, 23, 42, 0.84);
      color: #e2e8f0;
    }
  }
}

// 消息中心 Drawer 样式
.message-center-drawer {
  .el-drawer__header {
    margin-bottom: 0;
    padding: 20px 24px;
    border-bottom: 1px solid
      var(--stitch-lay-border, var(--el-border-color-lighter));
    background: var(--stitch-lay-bg-overlay, var(--el-bg-color));
  }

  .el-drawer__body {
    padding: 0;
    display: flex;
    flex-direction: column;
    background: var(--stitch-lay-bg-base, var(--el-bg-color-page));
  }

  .drawer-header {
    display: flex;
    align-items: center;
    gap: 12px;

    .drawer-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .message-tabs {
    padding: 0 24px;
    background: var(--stitch-lay-bg-overlay, var(--el-bg-color));
    border-bottom: 1px solid
      var(--stitch-lay-border, var(--el-border-color-lighter));

    .el-tabs__header {
      margin: 0;
    }

    .el-tabs__item {
      height: 48px;
      font-size: 15px;
    }

    .tab-badge {
      margin-left: 6px;
      sup {
        top: 12px;
      }
    }
  }

  .drawer-actions {
    display: flex;
    gap: 12px;
    padding: 16px 24px;
    border-bottom: 1px solid
      var(--stitch-lay-border, var(--el-border-color-lighter));
    background: var(--stitch-lay-bg-overlay, var(--el-bg-color));

    .el-button {
      flex: 1;
    }
  }

  .drawer-content {
    flex: 1;
    padding: 16px 24px;
  }

  .drawer-message-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .drawer-message-item {
    display: flex;
    align-items: flex-start;
    gap: 20px;
    padding: 20px;
    border-radius: 16px;
    background: var(--stitch-lay-bg-overlay, var(--el-bg-color));
    border: 1px solid var(--stitch-lay-border, var(--el-border-color-lighter));
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: var(--el-color-primary);
      opacity: 0;
      transition: opacity 0.3s;
    }

    &:hover {
      border-color: var(--el-color-primary-light-5);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);

      .msg-actions {
        opacity: 1;
        transform: translateX(0);
      }
    }

    &.unread {
      background: rgba(var(--el-color-primary-rgb), 0.02);

      &::before {
        opacity: 1;
      }

      .msg-title {
        color: var(--el-color-primary);
      }
    }

    .msg-avatar {
      flex-shrink: 0;

      .default-avatar {
        width: 48px;
        height: 48px;
        border-radius: 14px;
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
        box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
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
      margin-bottom: 8px;
    }

    .msg-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .msg-time {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
      background: var(--el-fill-color);
      padding: 2px 8px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .msg-content {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      line-height: 1.6;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .msg-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      opacity: 0;
      transform: translateX(10px);
      transition: all 0.3s ease;
      justify-content: center;
    }
  }
}

.message-dropdown-popper {
  max-width: min(420px, calc(100vw - 16px));

  .el-dropdown-menu {
    max-width: min(420px, calc(100vw - 16px));
  }
}

.message-panel {
  width: min(380px, calc(100vw - 24px));
}

.panel-body,
.message-list,
.drawer-content,
.drawer-message-list {
  overflow-x: hidden;
}

.message-center-drawer {
  .el-drawer {
    width: min(440px, calc(100vw - 16px)) !important;
    max-width: calc(100vw - 16px);
  }

  .drawer-actions {
    flex-wrap: wrap;
  }

  .drawer-content {
    min-width: 0;
  }

  .drawer-message-item {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 16px;
    align-items: start;
  }

  .drawer-message-item .msg-header {
    gap: 10px;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .drawer-message-item .msg-title,
  .drawer-message-item .msg-content {
    word-break: break-word;
  }

  .drawer-message-item .msg-time {
    max-width: 100%;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .drawer-message-item .msg-actions {
    opacity: 1;
    transform: none;
    align-self: center;
  }
}

@media (max-width: 768px) {
  .message-center-drawer {
    .el-drawer {
      width: calc(100vw - 8px) !important;
    }

    .message-tabs,
    .drawer-actions,
    .drawer-content,
    .el-drawer__header {
      padding-left: 16px;
      padding-right: 16px;
    }

    .drawer-message-item {
      grid-template-columns: 1fr;
    }

    .drawer-message-item .msg-avatar {
      display: none;
    }

    .drawer-message-item .msg-actions {
      flex-direction: row;
      justify-content: flex-end;
    }
  }
}
</style>
