<script setup lang="ts">
/**
 * 消息弹窗组件
 * 类似手机通知的消息弹窗，支持重叠效果
 * @author CH
 * @version 1.0.0
 */
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { router, emitter } from "@repo/core";
import { useGlobal } from "@pureadmin/utils";
import { getConfig } from "@repo/config";

defineOptions({
  name: "LayMessageToast",
});

const props = withDefaults(
  defineProps<{
    // 弹窗位置：top-left, top-center, top-right, left-center, right-center, bottom-left, bottom-center, bottom-right
    position?: string;
    // 消息存在时间（毫秒）
    duration?: number;
    // 最大显示数量（超出后显示重叠效果）
    maxVisible?: number;
  }>(),
  {
    position: "top-right",
    duration: 5000,
    maxVisible: 4,
  }
);

const { $storage } = useGlobal<GlobalPropertiesApi>();

/** 消息接口 */
interface ToastMessage {
  id: number | string;
  title: string;
  content: string;
  avatar?: string;
  time: string;
  type?: string;
  level?: string;
  url?: string;
  timer?: ReturnType<typeof setTimeout>;
}

// 消息队列
const messages = ref<ToastMessage[]>([]);

// 从配置获取设置
const toastEnabled = computed(() => {
  return (
    $storage?.configure?.messagePopupEnabled ??
    getConfig().MessagePopupEnabled ??
    true
  );
});

const toastPosition = computed(() => {
  return $storage?.configure?.messagePopupPosition ?? props.position;
});

const toastDuration = computed(() => {
  const duration = $storage?.configure?.messagePopupDuration;
  return duration ? duration * 1000 : props.duration;
});

// 计算位置样式
const positionStyle = computed(() => {
  const pos = toastPosition.value;
  const style: Record<string, string> = {
    position: "fixed",
    zIndex: "9999",
  };

  if (pos === "top-center") {
    style.top = "80px";
    style.left = "50%";
    style.transform = "translateX(-50%)";
  } else if (pos === "bottom-center") {
    style.bottom = "20px";
    style.left = "50%";
    style.transform = "translateX(-50%)";
  } else if (pos === "left-center") {
    style.top = "50%";
    style.left = "20px";
    style.transform = "translateY(-50%)";
  } else if (pos === "right-center") {
    style.top = "50%";
    style.right = "20px";
    style.transform = "translateY(-50%)";
  } else {
    if (pos.includes("top")) {
      style.top = "80px";
    } else {
      style.bottom = "20px";
    }

    if (pos.includes("left")) {
      style.left = "20px";
    } else {
      style.right = "20px";
    }
  }

  return style;
});

// 计算可见消息和重叠效果
const visibleMessages = computed(() => {
  return messages.value.slice(0, props.maxVisible);
});

/**
 * 添加消息
 */
const addMessage = (msg: ToastMessage) => {
  if (!toastEnabled.value) return;

  // 检查是否已存在
  const exists = messages.value.some((m) => m.id === msg.id);
  if (exists) return;

  // 添加到队列
  const newMsg = { ...msg };
  messages.value.unshift(newMsg);

  // 设置自动移除定时器
  newMsg.timer = setTimeout(() => {
    removeMessage(newMsg.id);
  }, toastDuration.value);
};

/**
 * 移除消息
 */
const removeMessage = (id: number | string) => {
  const index = messages.value.findIndex((m) => m.id === id);
  if (index > -1) {
    const msg = messages.value[index];
    if (msg.timer) {
      clearTimeout(msg.timer);
    }
    messages.value.splice(index, 1);
  }
};

/**
 * 点击消息
 */
const handleClick = (msg: ToastMessage) => {
  removeMessage(msg.id);
  if (msg.url) {
    router.push(msg.url);
  }
  // 触发消息点击事件
  emitter.emit("messageToastClick", msg);
};

/**
 * 关闭消息
 */
const handleClose = (e: Event, msg: ToastMessage) => {
  e.stopPropagation();
  removeMessage(msg.id);
};

/**
 * 清空所有消息
 */
const clearAll = () => {
  messages.value.forEach((msg) => {
    if (msg.timer) {
      clearTimeout(msg.timer);
    }
  });
  messages.value = [];
};

// 监听新消息推送
const handleNewMessage = (data: any) => {
  if (!data) return;
  
  addMessage({
    id: data.messageId || data.id || Date.now(),
    title: data.title || "新消息",
    content: data.content || data.message || "",
    avatar: data.avatar,
    time: data.sendTime || data.time || new Date().toLocaleString(),
    type: data.type || "system",
    level: data.level || "normal",
    url: data.url,
  });
};

// 监听配置变更
const handleConfigChange = () => {
  // 如果禁用了弹窗，清空所有消息
  if (!toastEnabled.value) {
    clearAll();
  }
};

onMounted(() => {
  // 监听消息推送事件
  emitter.on("messageToastPush", handleNewMessage);
  // 监听配置变更
  emitter.on("messagePopupConfigChange", handleConfigChange);
});

onUnmounted(() => {
  clearAll();
  emitter.off("messageToastPush", handleNewMessage);
  emitter.off("messagePopupConfigChange", handleConfigChange);
});

// 暴露方法给父组件
defineExpose({
  addMessage,
  removeMessage,
  clearAll,
});
</script>

<template>
  <Teleport to="body">
    <Transition name="toast-container">
      <div
        v-if="messages.length > 0 && toastEnabled"
        class="message-toast-container"
        :style="positionStyle"
      >
        <!-- 消息卡片列表 -->
        <TransitionGroup name="toast" tag="div" class="toast-list">
          <div
            v-for="(msg, index) in visibleMessages"
            :key="msg.id"
            class="toast-card"
            :class="[
              `toast-level-${msg.level || 'normal'}`,
              { 'is-stacked': index > 0 },
            ]"
            :style="{
              '--stack-index': index,
              '--stack-offset': `${index * 8}px`,
              '--stack-scale': 1 - index * 0.03,
              zIndex: props.maxVisible - index,
            }"
            @click="handleClick(msg)"
          >
            <!-- 消息头像/图标 -->
            <div class="toast-icon">
              <img v-if="msg.avatar" :src="msg.avatar" class="toast-avatar" />
              <div v-else class="toast-default-icon">
                <IconifyIconOnline
                  :icon="
                    msg.type === 'system'
                      ? 'ri:notification-3-line'
                      : msg.type === 'warning'
                        ? 'ri:error-warning-line'
                        : 'ri:message-3-line'
                  "
                />
              </div>
            </div>

            <!-- 消息内容 -->
            <div class="toast-content">
              <div class="toast-header">
                <span class="toast-title">{{ msg.title }}</span>
                <span class="toast-time">{{ msg.time }}</span>
              </div>
              <div class="toast-body">{{ msg.content }}</div>
            </div>

            <!-- 关闭按钮 -->
            <button class="toast-close" @click="handleClose($event, msg)">
              <IconifyIconOnline icon="ri:close-line" />
            </button>

            <!-- 进度条 -->
            <div
              class="toast-progress"
              :style="{ animationDuration: `${toastDuration}ms` }"
            ></div>
          </div>
        </TransitionGroup>

      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.message-toast-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 380px;
  pointer-events: none;
}

.toast-list {
  position: relative;
  display: flex;
  flex-direction: column;
}

.toast-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: var(--el-bg-color);
  border-radius: 16px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  pointer-events: auto;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 12px 40px rgba(0, 0, 0, 0.15),
      0 6px 20px rgba(0, 0, 0, 0.1);

    .toast-close {
      opacity: 1;
    }
  }

  // 重叠效果
  &.is-stacked {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    transform: translateY(var(--stack-offset)) scale(var(--stack-scale));
    opacity: calc(1 - var(--stack-index) * 0.15);
  }

  // 消息级别样式
  &.toast-level-warning {
    border-left: 3px solid var(--el-color-warning);
  }

  &.toast-level-error {
    border-left: 3px solid var(--el-color-danger);
  }

  &.toast-level-success {
    border-left: 3px solid var(--el-color-success);
  }
}

.toast-icon {
  flex-shrink: 0;

  .toast-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
  }

  .toast-default-icon {
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

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.toast-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toast-time {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  flex-shrink: 0;
  margin-left: 8px;
}

.toast-body {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.toast-close {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border: none;
  background: var(--el-fill-color-light);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  opacity: 0;
  transition: all 0.2s ease;

  &:hover {
    background: var(--el-fill-color);
    color: var(--el-text-color-primary);
  }
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(
    90deg,
    var(--el-color-primary),
    var(--el-color-primary-light-3)
  );
  animation: progress-shrink linear forwards;
  border-radius: 0 0 0 16px;
}

@keyframes progress-shrink {
  from {
    width: 100%;
  }
  to {
    width: 0;
  }
}

// 动画
.toast-container-enter-active,
.toast-container-leave-active {
  transition: opacity 0.3s ease;
}

.toast-container-enter-from,
.toast-container-leave-to {
  opacity: 0;
}

.toast-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}

.toast-move {
  transition: transform 0.3s ease;
}

// 深色主题适配
html.dark {
  .toast-card {
    background: var(--el-bg-color-overlay);
    border-color: var(--el-border-color);
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.3),
      0 4px 16px rgba(0, 0, 0, 0.2);

    &:hover {
      box-shadow:
        0 12px 40px rgba(0, 0, 0, 0.4),
        0 6px 20px rgba(0, 0, 0, 0.25);
    }
  }

}

// 不同位置的动画调整
[style*="left: 20px"] {
  .toast-enter-from {
    transform: translateX(-100%);
  }

  .toast-leave-to {
    transform: translateX(-100%) scale(0.9);
  }
}
</style>

<style lang="scss">
// 引入主题样式
@use './themes/index';
</style>
