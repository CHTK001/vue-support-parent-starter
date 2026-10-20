<template>
  <div class="flex items-center justify-center h-full min-h-125 py-10 px-5">
    <div class="max-w-150 w-full text-center p-10 rounded-2xl animate-fade-in-up">
      <div class="relative inline-block mb-5">
        <div
          class="w-24 h-24 rounded-full flex items-center justify-center mx-auto relative overflow-hidden p-0 animate-bounce-in">
          <Avatar v-if="session" :src="session.character.avatarUrl" :name="session.character.title" type="assistant"
            round />
          <div v-else class="text-4xl text-white">?</div>
        </div>
        <div class="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
      </div>
      <div class="mb-6">
        <h1 class="text-3xl font-bold mb-4 text-(--color-primary)">
          {{ session?.character.title || '' }}
        </h1>
        <h2 class="text-lg font-normal text-gray-600 dark:text-gray-300 leading-relaxed">
          {{ session?.character.description || '' }}
        </h2>
      </div>
      <div class="welcome-actions flex flex-wrap gap-3 justify-center">
        <button
          v-for="action in quickActions"
          :key="action.label"
          class="welcome-action-btn"
          @click="$emit('quick-action', action.label)"
        >
          <el-icon size="16"><component :is="getIcon(action.icon)" /></el-icon>
          {{ action.label }}
        </button>
      </div>
      <div v-if="recentSessions && recentSessions.length > 0" class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <p class="text-sm text-gray-400 mb-3">最近会话</p>
        <div class="flex flex-wrap gap-2 justify-center">
          <button
            v-for="s in recentSessions.slice(0, 3)"
            :key="s.id"
            class="recent-session-btn"
            @click="$emit('open-session', s.id)"
          >
            {{ s.title || '未命名会话' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Avatar from '../ui/Avatar.vue'
import {
  Code16Regular, Lightbulb16Regular, Document16Regular,
  Chat32Regular, Globe24Regular, Sparkle16Regular,
} from '@vicons/fluent'

const props = defineProps<{
  session: any
  recentSessions?: any[]
}>()

const emit = defineEmits<{
  'quick-action': [label: string]
  'open-session': [sessionId: string]
}>()

const iconMap: Record<string, unknown> = {
  Code16Regular, Lightbulb16Regular, Document16Regular,
  Chat32Regular, Globe24Regular, Sparkle16Regular,
}
function getIcon(name: string) { return iconMap[name] }

const quickActions = computed(() => {
  const desc = (props.session?.character?.description || '').toLowerCase()
  if (desc.includes('代码') || desc.includes('code') || desc.includes('编程') || desc.includes('developer')) {
    return [
      { label: '写一个函数', icon: 'Code16Regular' },
      { label: '审查代码', icon: 'Sparkle16Regular' },
      { label: '解释这段代码', icon: 'Document16Regular' },
    ]
  }
  if (desc.includes('写作') || desc.includes('文案') || desc.includes('content') || desc.includes('创作')) {
    return [
      { label: '写一篇文案', icon: 'Document16Regular' },
      { label: '帮我润色', icon: 'Sparkle16Regular' },
      { label: '头脑风暴', icon: 'Lightbulb16Regular' },
    ]
  }
  if (desc.includes('知识') || desc.includes('qa') || desc.includes('问答')) {
    return [
      { label: '问一个问题', icon: 'Chat32Regular' },
      { label: '搜索资料', icon: 'Globe24Regular' },
      { label: '总结文档', icon: 'Document16Regular' },
    ]
  }
  return [
    { label: '你好，能做什么？', icon: 'Chat32Regular' },
    { label: '帮我想个创意', icon: 'Lightbulb16Regular' },
    { label: '开始写代码', icon: 'Code16Regular' },
  ]
})
</script>

<style scoped>
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes bounceIn {
  0% { opacity: 0; transform: scale(0.3); }
  50% { opacity: 1; transform: scale(1.05); }
  70% { transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1); }
}
.animate-fade-in-up { animation: fadeInUp 0.8s ease-out; }
.animate-bounce-in { animation: bounceIn 1s ease-out; }

.welcome-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-primary) 20%, transparent);
  cursor: pointer;
  transition: all 0.2s ease;
}
.welcome-action-btn:hover {
  background: color-mix(in srgb, var(--color-primary) 15%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 35%, transparent);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--color-primary) 20%, transparent);
}
.dark .welcome-action-btn {
  color: #a5b4fc;
  background: rgba(102, 126, 234, 0.12);
  border-color: rgba(102, 126, 234, 0.25);
}
.dark .welcome-action-btn:hover {
  background: rgba(102, 126, 234, 0.2);
  border-color: rgba(102, 126, 234, 0.4);
}

.recent-session-btn {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--color-text-secondary);
  background: var(--color-surface);
  border: 1px solid var(--color-surface-border);
  cursor: pointer;
  transition: all 0.15s ease;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.recent-session-btn:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 5%, transparent);
}
</style>
