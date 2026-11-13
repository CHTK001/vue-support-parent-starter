<template>
  <div v-if="outlineItems.length > 0" class="chat-outline-container"
    @mouseleave="closeCard">
    <!-- 竖条指示器 -->
    <div class="outline-lines">
      <!-- role/tabindex/键盘处理：原先只有 @click，键盘与读屏都用不了这条导航；
           本文件 :focus-visible 的焦点环样式此前就挂好了，补上 tabindex 才生效 -->
      <div v-for="item in outlineItems" :key="item.id"
        class="outline-line-item"
        :class="{ 'is-active': activeId === item.id, 'is-hover': hoverItem?.id === item.id }"
        role="button"
        tabindex="0"
        :aria-label="`定位到：${item.title}`"
        @click="handleItemClick(item.id)"
        @keydown.enter.prevent="handleItemClick(item.id)"
        @keydown.space.prevent="handleItemClick(item.id)"
        @mouseenter="showCard(item.id, $event)">
        <span class="outline-line"></span>
      </div>
    </div>

    <!-- 悬停卡片：卡片自己也可点。此前它是 pointer-events:none，
         用户最直觉的动作「点这张预览卡」会直接穿到下面的消息文本上，
         表现出来就是「点预览没反应」。 -->
    <transition name="card-fade">
      <div v-if="hoverItem && isHoverCard" class="outline-card" :style="{ top: cardTop + 'px' }"
        role="button"
        tabindex="0"
        :aria-label="`定位到：${hoverItem.title}`"
        @mouseenter="cancelCloseCard"
        @click="handleCardClick"
        @keydown.enter.prevent="handleCardClick"
        @keydown.space.prevent="handleCardClick">
        <div class="card-title">{{ hoverItem.title }}</div>
        <div class="card-preview">{{ hoverItem.preview }}</div>
        <div class="card-action">点击定位到这条提问</div>
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

/**
 * 定位重试参数：间隔 120ms、最多 20 次（≈2.4s）。
 *
 * <p>要覆盖的最长等待是「会话切换 → 骨架屏最短显示 500ms → 消息渲染」这一段，
 * 2.4s 留了足够余量；不设无限重试，是因为目标消息真的不在窗口里时
 * （例如已被回退删除）无限轮询只会一直占着定时器。</p>
 */
const LOCATE_RETRY_INTERVAL_MS = 120
const LOCATE_RETRY_MAX = 20

/** 待重试的定位定时器：同一时刻只保留一个，连点多个标记时以最后一次为准 */
let locateRetryTimer: ReturnType<typeof setTimeout> | null = null

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
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
  if (locateRetryTimer) {
    clearTimeout(locateRetryTimer)
    locateRetryTimer = null
  }
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

/**
 * 鼠标移到卡片上时取消关闭计时。
 *
 * <p>卡片与竖条之间隔了 24px，指针穿过这段空隙时容器的 mouseleave 已经触发；
 * 不取消计时的话，用户还没点到卡片它就先消失了。</p>
 */
function cancelCloseCard() {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

/** 点悬停卡片：等价于点对应的竖条标记 */
function handleCardClick() {
  if (hoverItem.value) {
    handleItemClick(hoverItem.value.id)
  }
}

/**
 * 目标消息是否已经渲染进 DOM。
 *
 * <p>与 ChatPanel.scrollToMessage 用同一个选择器，判定口径保持一致：
 * 这里说「已渲染」而那边找不到，或者反过来，都会让重试变得没有意义。</p>
 *
 * @param messageId 消息 id
 */
function isMessageRendered(messageId: string): boolean {
  return !!document.querySelector(`[data-message-id="${messageId}"]`)
}

/**
 * 点击定位：发一次 scrollToMessage 给父级（ChatPage → ChatPanel.scrollToMessage）。
 *
 * <p><b>为什么需要重试</b>：右侧预览条由 activeMessages 派生，而消息 DOM 要等骨架屏
 * 结束才会渲染 —— 两者之间存在一小段「条已经能点、消息还不存在」的窗口
 * （实测在会话切换后的骨架屏阶段稳定复现）。这段窗口里点下去，ChatPanel 只会
 * 打一行 console.warn('未找到消息元素') 然后什么都不发生，用户看到的就是「点了没反应」。
 * 目标还没渲染时按帧重试，等消息出现再把同一次定位请求发出去。</p>
 *
 * @param messageId 消息 id
 * @param attempt   已重试次数
 */
function locateMessage(messageId: string, attempt: number) {
  if (isMessageRendered(messageId) || attempt >= LOCATE_RETRY_MAX) {
    if (locateRetryTimer) {
      clearTimeout(locateRetryTimer)
      locateRetryTimer = null
    }
    emit('scrollToMessage', messageId)
    return
  }
  if (locateRetryTimer) {
    clearTimeout(locateRetryTimer)
  }
  locateRetryTimer = setTimeout(
    () => locateMessage(messageId, attempt + 1),
    LOCATE_RETRY_INTERVAL_MS,
  )
}

function handleItemClick(messageId: string) {
  locateMessage(messageId, 0)
}
</script>

<style scoped>
/* ============================================================================
   令牌口径（与本批 8 个聊天组件统一）：
   1. 颜色走 --el-*（refactor.css 已把 --el-* 映射到 --color-* 主题层，
      9 套配色换肤时自动跟随）。原先成套的 .dark 硬编码色已被令牌吞掉，
      .dark 规则保留仅为可读性与后续按主题微调。
   2. 阴影取舍：竖条指示器与页面容器不加投影；悬停浮出的预览卡属于
      「浮起反馈」，保留单层 --el-box-shadow（原为双层，收敛为一层）。
   3. 圆角、过渡时长统一取 --el-radius-* / --el-transition-duration 令牌。
   ============================================================================ */

.chat-outline-container {
  position: fixed;
  /* 右侧栏（执行轨迹 / 会话状态）打开时让开它：这类导航挂在本 pane 的
     包含块里（.chat-pane-content 有 contain: layout），不让开就会压在面板上。
     宽度由 ChatPage 以 --chat-side-rail-width 下发，未打开时为 0px。 */
  right: calc(8px + var(--chat-side-rail-width, 0px));
  top: 50%;
  transform: translateY(-50%);
  z-index: 30;
  transition: right 0.16s ease;
}

/* —— 竖条指示器 —— */

.outline-lines {
  display: flex;
  flex-direction: column;
  /* 标记之间不留缝：缝隙里没有任何点击处理，真实鼠标点进去既不定位也没有反馈
     （实测：原 gap:6px 时每个标记只占 12px 节距里的一半，命中率约五成）。
     节的节奏仍靠 .outline-line-item 的 12px 高度维持，视觉位置与原先一致。 */
  gap: 0;
  align-items: flex-end;
  padding: 0;
}

.outline-line-item {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  /* 命中区：16px 宽 × 12px 高。视觉上仍是 8×2 居中的细条（见 .outline-line），
     但左右各多出 4px、上下各多出 5px 的容错，点到细条附近也算数。
     原先是 8×6，且上下相邻之间还隔着 6px 死区。 */
  width: 16px;
  height: 12px;
  cursor: pointer;
  outline: none;
}

/* 键盘焦点环。这是 div + @click，当前模板未加 tabindex，
   环先挂好，模板补上 tabindex="0" 即自动生效 */
.outline-line-item:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.outline-line {
  width: 8px;
  height: 2px;
  /* 原值 1px，恰为 2px 条高的一半即胶囊；用 full 令牌表达同一种形状 */
  border-radius: var(--el-radius-full, 9999px);
  background-color: var(--el-border-color);
  transition:
    background-color var(--el-transition-duration-fast, 0.2s) ease,
    width var(--el-transition-duration-fast, 0.2s) ease,
    height var(--el-transition-duration-fast, 0.2s) ease;
}

.dark .outline-line {
  background-color: var(--el-border-color-darker);
}

/* 只有 is-hover 或 is-active 时才变粗变深 */
.outline-line-item.is-hover .outline-line,
.outline-line-item.is-active .outline-line {
  background-color: var(--el-text-color-primary);
  width: 14px;
  height: 3px;
}

.dark .outline-line-item.is-hover .outline-line,
.dark .outline-line-item.is-active .outline-line {
  background-color: var(--el-text-color-primary);
}

/* 悬停项上下相邻的线也稍微变粗 */
.outline-line-item.is-hover-prev .outline-line,
.outline-line-item.is-hover-next .outline-line {
  background-color: var(--el-text-color-secondary);
  width: 10px;
  height: 2.5px;
}

.dark .outline-line-item.is-hover-prev .outline-line,
.dark .outline-line-item.is-hover-next .outline-line {
  background-color: var(--el-text-color-secondary);
}

/* —— 悬停卡片 —— */

.outline-card {
  position: absolute;
  right: 24px;
  width: 320px;
  padding: 16px;
  background-color: var(--el-bg-color-overlay);
  /* 原值 12px → lg 档 */
  border-radius: var(--el-radius-lg, 12px);
  /* 悬停浮出的预览卡属「浮起反馈」，是本文件唯一保留的投影：
     原为 0 4px 20px + 0 2px 6px 双层，收敛为单层令牌 */
  box-shadow: var(--el-box-shadow-light);
  /* 卡片自己要能点：它是最显眼的「这一条讲什么」预览，
     原先 pointer-events:none 让点击穿到下面的消息文本上，等于点了没反应 */
  pointer-events: auto;
  cursor: pointer;
  transform: translateY(-50%);
}

.outline-card:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.dark .outline-card {
  background-color: var(--el-bg-color-overlay);
  box-shadow: var(--el-box-shadow);
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
  line-height: 1.4;
}

.dark .card-title {
  color: var(--el-text-color-primary);
}

.card-preview {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dark .card-preview {
  color: var(--el-text-color-secondary);
}

/* 卡片上的动作提示：卡片可点这件事必须写出来，否则用户仍会去点那条 2px 细线 */
.card-action {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
  font-size: 12px;
  color: var(--el-color-primary);
  line-height: 1.4;
}

/* —— 卡片过渡动画 —— */

.card-fade-enter-active,
.card-fade-leave-active {
  transition:
    opacity var(--el-transition-duration-fast, 0.2s) ease,
    transform var(--el-transition-duration-fast, 0.2s) ease;
}

.card-fade-enter-from,
.card-fade-leave-to {
  opacity: 0;
  transform: translateX(8px) translateY(-50%);
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .outline-line,
  .chat-outline-container,
  .card-fade-enter-active,
  .card-fade-leave-active {
    transition: none;
  }
}
</style>
