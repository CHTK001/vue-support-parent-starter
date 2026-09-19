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
        <button class="interject-btn" @click="emit('interject', item)">
          插话
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
import { Edit24Regular, Dismiss24Regular, Attach24Regular } from '@vicons/fluent'
import { useI18n } from 'vue-i18n'
import type { QueuedMessage } from '@/types/session'

const { t } = useI18n()

const props = defineProps<{
  queue: QueuedMessage[]
}>()

const emit = defineEmits<{
  edit: [item: QueuedMessage]
  remove: [id: string]
  interject: [item: QueuedMessage]
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
  border-radius: 8px;
  font-size: 13px;
  transition: all 0.2s;
}

.queue-item:hover {
  background: var(--el-fill-color-light, rgba(200, 200, 200, 0.15));
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
  color: var(--color-text-gray, #999);
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
  border-radius: 50%;
  background: currentColor;
  opacity: 0.5;
}

/* 消息内容 */
.queue-content {
  flex: 1;
  min-width: 0;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.queue-text {
  display: block;
  color: var(--color-text, #333);
  line-height: 1.5;
  word-break: break-word;
}

.queue-files {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-gray, #999);
  font-size: 11px;
}

/* 状态 */
.queue-status {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: var(--color-text-gray, #999);
}

/* 操作按钮 */
.queue-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding-top: 2px;
}

.interject-btn {
  padding: 2px 8px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--color-text-gray, #666);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.interject-btn:hover {
  background: var(--el-color-primary-light-9, rgba(64, 158, 255, 0.1));
  color: var(--el-color-primary, #409eff);
}

.queue-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-gray, #999);
  cursor: pointer;
  transition: all 0.15s;
}

.queue-action-btn:hover {
  background: var(--color-sidebar-bg-hover, rgba(0, 0, 0, 0.06));
  color: var(--color-text, #333);
}

/* 动画 */
.queue-enter-active,
.queue-leave-active {
  transition: all 0.25s ease;
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
  transition: transform 0.25s ease;
}
</style>
