<script setup lang="ts">
/**
 * 消息项组件
 * 用于展示单条消息的内容、头像、时间等信息
 * @author CH
 * @version 1.0.0
 * @since 2024-12-04
 */
import { ScAvatar } from "@repo/components/ScAvatar";

import { computed } from 'vue'

interface MessageItemProps {
  id: number
  title: string
  content: string
  avatar?: string
  time: string
  read: boolean
  type: string
  level: string
  url?: string
  variant?: 'compact' | 'detailed' // 紧凑模式（下拉菜单）或详细模式（Drawer）
}

const props = withDefaults(defineProps<MessageItemProps>(), {
  variant: 'compact'
})

const emit = defineEmits<{
  click: [id: number]
  markRead: [id: number]
  delete: [id: number]
}>()

// 消息类型图标映射
const typeIconMap: Record<string, string> = {
  system: 'ri:notification-3-line',
  user: 'ri:user-line',
  dev: 'ri:code-line',
  warning: 'ri:alert-line',
  error: 'ri:error-warning-line',
  success: 'ri:checkbox-circle-line'
}

const messageIcon = computed(() => typeIconMap[props.type] || 'ri:notification-3-line')

// 消息级别颜色映射
const levelColorMap: Record<string, string> = {
  normal: 'var(--el-color-primary)',
  info: 'var(--el-color-info)',
  warning: 'var(--el-color-warning)',
  error: 'var(--el-color-danger)',
  success: 'var(--el-color-success)'
}

const levelColor = computed(() => levelColorMap[props.level] || levelColorMap.normal)

const handleClick = () => {
  emit('click', props.id)
}

const handleMarkRead = (e: Event) => {
  e.stopPropagation()
  emit('markRead', props.id)
}

const handleDelete = (e: Event) => {
  e.stopPropagation()
  emit('delete', props.id)
}
</script>

<template>
  <div
    :class="[
      'message-item',
      `message-item--${variant}`,
      { 'message-item--unread': !read }
    ]"
    @click="handleClick"
  >
    <!-- 头像区域 -->
    <div class="message-item__avatar">
      <ScAvatar v-if="avatar" :size="variant === 'compact' ? 42 : 48" :src="avatar" />
      <div v-else class="message-item__default-avatar" :style="{ background: levelColor }">
        <IconifyIconOnline :icon="messageIcon" />
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="message-item__content">
      <div class="message-item__header">
        <span class="message-item__title">{{ title }}</span>
        <span v-if="variant === 'detailed'" class="message-item__time">
          <IconifyIconOnline icon="ri:time-line" />
          {{ time }}
        </span>
      </div>
      <div class="message-item__body">{{ content }}</div>
      <div v-if="variant === 'compact'" class="message-item__footer">
        <span class="message-item__time-compact">{{ time }}</span>
      </div>
    </div>

    <!-- 操作区域（详细模式） -->
    <div v-if="variant === 'detailed'" class="message-item__actions">
      <ScButton
        v-if="!read"
        circle
        size="small"
        @click="handleMarkRead"
        title="标记已读"
      >
        <IconifyIconOnline icon="ri:check-line" />
      </ScButton>
      <ScButton
        circle
        size="small"
        @click="handleDelete"
        title="删除"
      >
        <IconifyIconOnline icon="ri:close-line" />
      </ScButton>
    </div>

    <!-- 未读标记（紧凑模式） -->
    <span v-if="variant === 'compact' && !read" class="message-item__unread-dot"></span>
  </div>
</template>

<style lang="scss" scoped>
.message-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  border-radius: var(--stitch-radius-lg, 12px);
  cursor: pointer;
  transition: all var(--stitch-transition-base, 0.3s) cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  border: 1px solid transparent;
  background: rgba(var(--el-fill-color-white-rgb), 0.5);

  &:hover {
    background: var(--stitch-lay-bg-hover, var(--el-fill-color-light));
    border-color: var(--stitch-lay-border, var(--el-border-color-lighter));
    transform: translateY(-2px);
    box-shadow: var(--stitch-shadow-sm, 0 4px 12px rgba(0, 0, 0, 0.05));
  }

  &--unread {
    background: rgba(var(--el-color-primary-rgb), 0.04);
    border: 1px solid rgba(var(--el-color-primary-rgb), 0.1);

    &:hover {
      background: rgba(var(--el-color-primary-rgb), 0.08);
      border-color: rgba(var(--el-color-primary-rgb), 0.2);
    }

    .message-item__title {
      color: var(--el-color-primary);
      font-weight: 600;
    }
  }

  // 紧凑模式样式
  &--compact {
    margin: 0 12px 8px;
  }

  // 详细模式样式
  &--detailed {
    gap: 20px;
    padding: 20px;
    border-radius: var(--stitch-radius-xl, 16px);
    box-shadow: var(--stitch-shadow-xs, 0 2px 8px rgba(0, 0, 0, 0.02));

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: var(--el-color-primary);
      opacity: 0;
      transition: opacity var(--stitch-transition-base, 0.3s);
    }

    &:hover {
      border-color: var(--el-color-primary-light-5);
      box-shadow: var(--stitch-shadow-md, 0 8px 24px rgba(0, 0, 0, 0.08));

      .message-item__actions {
        opacity: 1;
        transform: translateX(0);
      }
    }

    &.message-item--unread::before {
      opacity: 1;
    }
  }

  // 头像
  &__avatar {
    flex-shrink: 0;
  }

  &__default-avatar {
    width: 42px;
    height: 42px;
    border-radius: var(--stitch-radius-lg, 12px);
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

    .message-item--detailed & {
      width: 48px;
      height: 48px;
      border-radius: var(--stitch-radius-xl, 14px);
      font-size: 24px;
    }
  }

  // 内容
  &__content {
    flex: 1;
    min-width: 0;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;

    .message-item--detailed & {
      margin-bottom: 8px;
    }
  }

  &__title {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    .message-item--detailed & {
      font-size: 15px;
      font-weight: 600;
    }
  }

  &__body {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 8px;

    .message-item--detailed & {
      font-size: 14px;
      line-height: 1.6;
    }
  }

  &__footer {
    display: flex;
    align-items: center;
  }

  &__time {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    background: var(--el-fill-color);
    padding: 2px 8px;
    border-radius: var(--stitch-radius-sm, 4px);
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  &__time-compact {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
    display: flex;
    align-items: center;
    gap: 4px;

    &::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--el-border-color);
    }
  }

  // 未读标记
  &__unread-dot {
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

  // 操作按钮
  &__actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    opacity: 0;
    transform: translateX(10px);
    transition: all var(--stitch-transition-base, 0.3s) ease;
    justify-content: center;
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

// 深色模式适配
html.dark {
  .message-item {
    &--unread {
      background: rgba(var(--el-color-primary-rgb), 0.15);
    }
  }
}
</style>
