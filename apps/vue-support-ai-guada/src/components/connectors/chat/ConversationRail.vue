<template>
  <aside class="conv-rail">
    <!-- 头部 -->
    <div class="rail-header">
      <div class="rail-title">
        会话
        <span class="rail-count">{{ conversations.length }}</span>
      </div>
      <button
        type="button"
        class="rail-icon-btn"
        title="刷新会话"
        :disabled="loading"
        @click="$emit('refresh')"
      >
        <el-icon :size="16" :class="{ 'is-spin': loading }"><ArrowSync24Regular /></el-icon>
      </button>
    </div>

    <!-- 搜索 -->
    <div class="rail-search">
      <el-input
        v-model="keyword"
        size="default"
        clearable
        placeholder="搜索会话"
        :prefix-icon="SearchIcon"
      />
    </div>

    <!-- 会话列表 -->
    <div class="rail-list">
      <button
        v-for="conv in filtered"
        :key="conv.chatId"
        type="button"
        class="conv-card"
        :class="{ 'is-active': conv.chatId === activeChatId }"
        @click="$emit('select', conv.chatId)"
      >
        <span class="conv-avatar" :class="conv.fromGroup ? 'is-group' : 'is-person'">
          <el-icon :size="18">
            <People24Regular v-if="conv.fromGroup" />
            <Person24Regular v-else />
          </el-icon>
          <span class="presence-dot" :class="online ? 'is-online' : 'is-off'" />
        </span>

        <span class="conv-body">
          <span class="conv-row-top">
            <span class="conv-name">{{ conversationTitle(conv) }}</span>
            <span class="conv-time">{{ conversationTime(conv.lastTime) }}</span>
          </span>
          <span class="conv-row-bottom">
            <span class="conv-preview">{{ conv.lastContent || '暂无消息' }}</span>
            <span v-if="conv.messageCount" class="conv-msgnum">{{ conv.messageCount }}</span>
          </span>
        </span>

        <span
          class="conv-clear"
          title="清除会话"
          @click.stop="$emit('clear', conv)"
        >
          <el-icon :size="14"><Delete24Regular /></el-icon>
        </span>
      </button>

      <div v-if="!filtered.length" class="rail-empty">
        <div class="rail-empty-blob">
          <el-icon :size="26"><Chat24Regular /></el-icon>
        </div>
        <p class="rail-empty-title">{{ keyword ? '未找到匹配会话' : '暂无会话' }}</p>
        <p class="rail-empty-desc">{{ keyword ? '换个关键词试试' : '等待外部平台发来消息' }}</p>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  ArrowSync24Regular, Person24Regular, People24Regular,
  Chat24Regular, Delete24Regular, Search24Regular,
} from '@vicons/fluent'
import { conversationTitle, conversationTime } from './format'

defineOptions({ name: 'ConnectorConversationRail' })

const props = defineProps<{
  conversations: any[]
  activeChatId: string
  online: boolean
  loading?: boolean
}>()

defineEmits<{
  (e: 'select', chatId: string): void
  (e: 'refresh'): void
  (e: 'clear', conv: any): void
}>()

const keyword = ref('')
const SearchIcon = Search24Regular

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return props.conversations
  return props.conversations.filter((c) => {
    return conversationTitle(c).toLowerCase().includes(kw)
      || (c.lastContent || '').toLowerCase().includes(kw)
  })
})
</script>

<style scoped>
.conv-rail {
  width: 264px;
  flex-shrink: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-right: 1px solid var(--color-surface-border);
}

.rail-header {
  height: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px 0 16px;
}
.rail-title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}
.rail-count {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-gray);
  background: var(--el-fill-color-light);
}
.rail-icon-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-gray);
  background: transparent;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease;
}
.rail-icon-btn:hover {
  background: var(--el-fill-color-light);
  color: var(--color-text);
}
.is-spin {
  animation: rail-spin 0.9s linear infinite;
}
@keyframes rail-spin {
  to { transform: rotate(360deg); }
}

.rail-search {
  padding: 0 12px 8px;
  flex-shrink: 0;
}
.rail-search :deep(.el-input__wrapper) {
  border-radius: 10px;
  background: var(--el-fill-color-light);
  box-shadow: none;
}
.rail-search :deep(.el-input__wrapper.is-focus) {
  background: var(--color-surface);
  box-shadow: 0 0 0 1px var(--el-color-primary-light-7) inset;
}

.rail-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 2px 10px 12px;
}
.rail-list::-webkit-scrollbar {
  width: 6px;
}
.rail-list::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background: var(--el-border-color-lighter);
}

.conv-card {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px;
  margin-bottom: 3px;
  border: none;
  border-radius: 14px;
  text-align: left;
  cursor: pointer;
  background: transparent;
  transition: background 0.18s ease;
}
.conv-card:hover {
  background: var(--color-conversation-bg-hover);
}
.conv-card.is-active {
  background: var(--color-conversation-bg-active);
}

.conv-avatar {
  position: relative;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.conv-avatar.is-group {
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
}
.conv-avatar.is-person {
  color: var(--color-text-gray);
  background: var(--el-fill-color);
}
.presence-dot {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  border: 2px solid var(--color-surface);
}
.presence-dot.is-online {
  background: var(--el-color-success);
}
.presence-dot.is-off {
  background: var(--el-color-info-light-5);
}

.conv-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.conv-row-top,
.conv-row-bottom {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.conv-name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.conv-card.is-active .conv-name {
  color: var(--color-text);
}
.conv-time {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--color-text-disabled);
}
.conv-preview {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  color: var(--color-text-gray);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.conv-msgnum {
  flex-shrink: 0;
  min-width: 17px;
  height: 17px;
  padding: 0 5px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--color-text-gray);
  background: var(--el-fill-color-light);
}

.conv-clear {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-disabled);
  opacity: 0;
  transition: opacity 0.16s ease, color 0.16s ease, background 0.16s ease;
}
.conv-card:hover .conv-clear {
  opacity: 1;
}
.conv-clear:hover {
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}

.rail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 52px 20px;
}
.rail-empty-blob {
  width: 68px;
  height: 68px;
  border-radius: 21px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  margin-bottom: 14px;
}
.rail-empty-title {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-gray);
}
.rail-empty-desc {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-disabled);
}
</style>
