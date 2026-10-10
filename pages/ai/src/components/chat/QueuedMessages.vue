<template>
  <TransitionGroup name="queue" tag="div" class="queued-messages">
    <div v-for="item in queue" :key="item.id" class="queue-item"
      :class="{ 'is-sending': item.status === 'sending', 'dragging': draggingId === item.id }"
      draggable="true"
      @dragstart="handleDragStart($event, item)"
      @dragend="handleDragEnd"
      @dragover.prevent="handleDragOver($event, item)"
      @drop="handleDrop($event, item)">
      <!-- 拖拽手柄 -->
      <div class="drag-handle" v-if="item.status === 'queued'">
        <div class="drag-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
      
      <!-- 消息内容 -->
      <div class="queue-content" @click="item.status === 'queued' && emit('edit', item)">
        <span class="queue-text">{{ item.content }}</span>
        <div class="queue-files" v-if="item.files?.length > 0">
          <el-icon size="12"><Attach24Regular /></el-icon>
          <span>+{{ item.files.length }}个附件</span>
        </div>
      </div>
      
      <!-- 状态 -->
      <div class="queue-status">
        <el-icon v-if="item.status === 'sending'" class="is-loading" size="12">
          <Loading />
        </el-icon>
      </div>
      
      <!-- 操作按钮 -->
      <div class="queue-actions" v-if="item.status === 'queued'">
        <!-- 提前发送 -->
        <button class="queue-action-btn" @click="emit('moveToFront', item.id)" title="提前发送">
          <el-icon size="14"><ArrowUp24Regular /></el-icon>
        </button>
        <!-- 手动发送 -->
        <button class="send-now-btn" @click="emit('sendNow', item)" title="立即发送">
          发送
        </button>
        <button class="queue-action-btn" @click="emit('edit', item)" :title="t('chat.queue.edit')">
          <el-icon size="14"><Edit24Regular /></el-icon>
        </button>
        <button class="queue-action-btn" @click="emit('remove', item.id)" :title="t('chat.queue.withdraw')">
          <el-icon size="14"><Dismiss24Regular /></el-icon>
        </button>
      </div>
    </div>
  </TransitionGroup>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { Edit24Regular, Dismiss24Regular, Attach24Regular, ArrowUp24Regular } from '@vicons/fluent'
import { useI18n } from 'vue-i18n'
import type { QueuedMessage } from '@/types/session'

const { t } = useI18n()

defineProps<{
  queue: QueuedMessage[]
}>()

const emit = defineEmits<{
  edit: [item: QueuedMessage]
  remove: [id: string]
  sendNow: [item: QueuedMessage]
  moveToFront: [id: string]
  reorder: [fromId: string, toId: string]
}>()

const draggingId = ref<string | null>(null)

const handleDragStart = (e: DragEvent, item: QueuedMessage) => {
  if (item.status !== 'queued') return
  draggingId.value = item.id
  e.dataTransfer?.setData('text/plain', item.id)
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
  }
}

const handleDragEnd = () => {
  draggingId.value = null
}

const handleDragOver = (e: DragEvent, item: QueuedMessage) => {
  e.preventDefault()
  if (item.status !== 'queued') return
}

const handleDrop = (e: DragEvent, targetItem: QueuedMessage) => {
  e.preventDefault()
  const fromId = e.dataTransfer?.getData('text/plain')
  if (fromId && fromId !== targetItem.id) {
    emit('reorder', fromId, targetItem.id)
  }
  draggingId.value = null
}
</script>

<style scoped>
/* ============================================================================
   令牌口径（与本批 8 个聊天组件统一）：
   1. 颜色走 --el-*（refactor.css 已把 --el-* 映射到 --color-* 主题层，
      9 套配色换肤时自动跟随）。原 var(--el-*, #兜底) 里的 hex 是死兜底
      （令牌恒有值），直接去掉。
   2. 队列条目是行而非卡片：只靠填充色区分状态，不加投影。
   3. 圆角、过渡时长统一取 --el-radius-* / --el-transition-duration 令牌。
   ============================================================================ */

.queued-messages {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
}

.queue-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 12px;
  /* 原值 8px → md 档 */
  border-radius: var(--el-radius-md, 8px);
  font-size: 13px;
  transition: all var(--el-transition-duration-fast, 0.2s);
}

.queue-item:hover {
  background: var(--el-fill-color-light);
}

.queue-item.is-sending {
  opacity: 0.6;
  pointer-events: none;
}

.queue-item.dragging {
  opacity: 0.5;
}

/* 拖拽手柄 */
.drag-handle {
  display: flex;
  align-items: center;
  padding-top: 4px;
  cursor: grab;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

.drag-handle:active {
  cursor: grabbing;
}

.drag-dots {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.drag-dots span {
  width: 3px;
  height: 3px;
  /* 原值 50%（圆形）→ full 档 */
  border-radius: var(--el-radius-full, 9999px);
  background: currentColor;
  opacity: 0.5;
}

/* 消息内容：div + @click，可点不可 Tab 聚焦，焦点环先挂好 */
.queue-content {
  flex: 1;
  min-width: 0;
  cursor: pointer;
  outline: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.queue-content:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.queue-text {
  display: block;
  color: var(--el-text-color-primary);
  line-height: 1.5;
  word-break: break-word;
}

.queue-files {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

/* 状态 */
.queue-status {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
}

/* 操作按钮 */
.queue-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding-top: 2px;
}

.send-now-btn {
  padding: 2px 10px;
  border: none;
  /* 原值 4px → xs 档 */
  border-radius: var(--el-radius-xs, 4px);
  background: var(--el-color-primary);
  color: var(--el-color-white);
  font-size: 12px;
  cursor: pointer;
  outline: none;
  transition: all var(--el-transition-duration-fast, 0.2s);
}

/* 键盘焦点环：22px 高的小按钮上默认 outline 太弱 */
.send-now-btn:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.send-now-btn:hover {
  background: var(--el-color-primary-dark-2);
}

.queue-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  /* 原值 6px → sm 档 */
  border-radius: var(--el-radius-sm, 6px);
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  outline: none;
  transition: all var(--el-transition-duration-fast, 0.2s);
}

.queue-action-btn:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.queue-action-btn:hover {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

/* 动画：入队 / 出队 / 换位，原值 0.25s，取最近的 0.2s 档 */
.queue-enter-active,
.queue-leave-active {
  transition: all var(--el-transition-duration-fast, 0.2s) ease;
}

.queue-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.queue-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.queue-move {
  transition: transform var(--el-transition-duration-fast, 0.2s) ease;
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .queue-item,
  .send-now-btn,
  .queue-action-btn,
  .queue-enter-active,
  .queue-leave-active,
  .queue-move {
    transition: none;
  }
}
</style>
