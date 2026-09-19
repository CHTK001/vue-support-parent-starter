<template>
  <div v-if="outlineItems.length > 0" class="chat-outline-container"
    @mouseleave="closeCard">
    <!-- 竖条指示器 -->
    <div class="outline-lines">
      <div v-for="item in outlineItems" :key="item.id"
        class="outline-line-item"
        :class="{ 'is-active': activeId === item.id, 'is-hover': hoverItem?.id === item.id }"
        @click="handleItemClick(item.id)"
        @mouseenter="showCard(item.id, $event)">
        <span class="outline-line"></span>
      </div>
    </div>

    <!-- 悬停卡片 -->
    <transition name="card-fade">
      <div v-if="hoverItem && isHoverCard" class="outline-card" :style="{ top: cardTop + 'px' }">
        <div class="card-title">{{ hoverItem.title }}</div>
        <div class="card-preview">{{ hoverItem.preview }}</div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import type { Message } from '@/utils/messageUtils'
import { extractMessageTitle } from '@/utils/messageUtils'

const props = defineProps<{
  messages: Message[]
  chatPanelRef: any
}>()

const emit = defineEmits<{
  scrollToMessage: [messageId: string]
}>()

const activeId = ref<string | null>(null)
const hoverItem = ref<{ id: string; title: string; preview: string } | null>(null)
const isHoverCard = ref(false)
const cardTop = ref(0)
let closeTimer: ReturnType<typeof setTimeout> | null = null

const outlineItems = computed(() => {
  return props.messages
    .filter(msg => msg.role === 'user')
    .map(msg => {
      const title = extractMessageTitle(msg)
      // 获取消息内容预览（去掉 markdown 标记）
      const content = msg.contents?.[0]?.content || ''
      const preview = content
        .replace(/[#*`\[\]()]/g, '')
        .replace(/\n+/g, ' ')
        .trim()
        .slice(0, 80)
      return {
        id: msg.id,
        title,
        preview,
        index: msg.index ?? 0
      }
    })
})

let observer: IntersectionObserver | null = null

// 消抖更新高亮，500ms 内滚动稳定后才切换
const debouncedSetActive = useDebounceFn((id: string) => {
  activeId.value = id
}, 500)

watch(() => props.messages, () => {
  nextTick(() => {
    setupObserver()
  })
}, { deep: true })

onBeforeUnmount(() => {
  observer?.disconnect()
})

function setupObserver() {
  observer?.disconnect()
  // 查找所有 user 消息的 DOM 元素
  const elements: Element[] = []
  for (const item of outlineItems.value) {
    const el = document.querySelector(`[data-message-id="${item.id}"]`)
    if (el) elements.push(el)
  }
  if (elements.length === 0) return

  observer = new IntersectionObserver((entries) => {
    // 找到 IntersectionRatio 最大的那个
    let best: string | null = null
    let bestRatio = 0
    for (const entry of entries) {
      if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
        bestRatio = entry.intersectionRatio
        best = entry.target.getAttribute('data-message-id')
      }
    }
    if (best) debouncedSetActive(best)
  }, { threshold: [0, 0.25, 0.5, 0.75, 1] })

  elements.forEach(el => observer!.observe(el))

  // 初始默认高亮最后一条（页面刷新后自动滚动到底部）
  const last = outlineItems.value[outlineItems.value.length - 1]
  if (last) activeId.value = last.id
}

function showCard(id: string, event: MouseEvent) {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
  const itemIndex = outlineItems.value.findIndex(i => i.id === id)
  const item = outlineItems.value[itemIndex]
  if (item) {
    hoverItem.value = item
    isHoverCard.value = true
    
    // 标记上下相邻的线
    nextTick(() => {
      const lineItems = document.querySelectorAll('.outline-line-item')
      lineItems.forEach((el, index) => {
        el.classList.remove('is-hover-prev', 'is-hover-next')
        if (index === itemIndex - 1) {
          el.classList.add('is-hover-prev')
        } else if (index === itemIndex + 1) {
          el.classList.add('is-hover-next')
        }
      })
    })
    
    // 获取悬停线条的位置，设置卡片 top
    const target = event.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    const containerRect = (document.querySelector('.chat-outline-container') as HTMLElement)?.getBoundingClientRect()
    if (containerRect) {
      cardTop.value = rect.top - containerRect.top
    }
  }
}

function closeCard() {
  if (closeTimer) {
    clearTimeout(closeTimer)
  }
  closeTimer = setTimeout(() => {
    isHoverCard.value = false
    hoverItem.value = null
    // 清除相邻线的样式
    document.querySelectorAll('.outline-line-item.is-hover-prev, .outline-line-item.is-hover-next')
      .forEach(el => el.classList.remove('is-hover-prev', 'is-hover-next'))
  }, 200)
}

function handleItemClick(messageId: string) {
  emit('scrollToMessage', messageId)
}
</script>

<style scoped>
.chat-outline-container {
  position: fixed;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 30;
}

/* —— 竖条指示器 —— */

.outline-lines {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
  padding: 4px 0;
}

.outline-line-item {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  cursor: pointer;
  padding: 2px 0;
}

.outline-line {
  width: 8px;
  height: 2px;
  border-radius: 1px;
  background-color: #d1d5db;
  transition: background-color 0.15s ease, width 0.15s ease, height 0.15s ease;
}

.dark .outline-line {
  background-color: #4b5563;
}

/* 只有 is-hover 或 is-active 时才变粗变黑 */
.outline-line-item.is-hover .outline-line,
.outline-line-item.is-active .outline-line {
  background-color: #1f2937;
  width: 14px;
  height: 3px;
}

.dark .outline-line-item.is-hover .outline-line,
.dark .outline-line-item.is-active .outline-line {
  background-color: #e5e7eb;
}

/* 悬停项上下相邻的线也稍微变粗 */
.outline-line-item.is-hover-prev .outline-line,
.outline-line-item.is-hover-next .outline-line {
  background-color: #9ca3af;
  width: 10px;
  height: 2.5px;
}

.dark .outline-line-item.is-hover-prev .outline-line,
.dark .outline-line-item.is-hover-next .outline-line {
  background-color: #6b7280;
}

/* —— 悬停卡片 —— */

.outline-card {
  position: absolute;
  right: 24px;
  width: 320px;
  padding: 16px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12),
    0 2px 6px rgba(0, 0, 0, 0.06);
  pointer-events: none;
  transform: translateY(-50%);
}

.dark .outline-card {
  background-color: #232428;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
  line-height: 1.4;
}

.dark .card-title {
  color: #e5e7eb;
}

.card-preview {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dark .card-preview {
  color: #9ca3af;
}

/* —— 卡片过渡动画 —— */

.card-fade-enter-active,
.card-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.card-fade-enter-from,
.card-fade-leave-to {
  opacity: 0;
  transform: translateX(8px) translateY(-50%);
}
</style>
