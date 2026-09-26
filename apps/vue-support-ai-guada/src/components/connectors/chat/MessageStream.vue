<template>
  <div class="message-stream">
    <!-- 无会话 -->
    <div v-if="!active" class="stream-placeholder">
      <div class="placeholder-blob">
        <el-icon :size="38"><Chat24Regular /></el-icon>
      </div>
      <p class="placeholder-title">请选择左侧会话</p>
      <p class="placeholder-desc">或等待外部平台发来新消息</p>
    </div>

    <template v-else>
      <div ref="viewportRef" class="stream-viewport" @scroll="handleScroll">
        <div class="stream-inner">
          <template v-for="(block, idx) in blocks" :key="idx">
            <!-- 日期分隔 -->
            <div v-if="block.kind === 'date'" class="date-divider">
              <span class="date-pill">{{ block.label }}</span>
            </div>

            <!-- 消息簇 -->
            <div
              v-else
              class="cluster"
              :class="block.role === 'assistant' ? 'is-out' : 'is-in'"
            >
              <div class="cluster-avatar">
                <el-icon v-if="block.role !== 'assistant'" :size="17">
                  <Person24Regular />
                </el-icon>
                <ConnectorIcon
                  v-else
                  :type="platform"
                  :size="15"
                />
              </div>

              <div class="cluster-content">
                <div class="cluster-meta">
                  <span class="cluster-name">
                    {{ block.role === 'assistant' ? connectorName : contactName(block.items[0]) }}
                  </span>
                  <span class="cluster-time">{{ formatHMS(block.items[block.items.length - 1].createTime) }}</span>
                </div>

                <div
                  v-for="m in block.items"
                  :key="m.id"
                  class="bubble"
                  :class="{ 'is-error': isError(m.content) }"
                >
                  <el-icon v-if="isError(m.content)" :size="14" class="bubble-err-icon">
                    <Warning24Regular />
                  </el-icon>
                  <MarkdownContent class="bubble-text markdown-text" :content="m.content" />
                </div>
              </div>
            </div>
          </template>

          <div v-if="loading" class="stream-loading">
            <el-icon :size="15" class="is-spin"><ArrowSync24Regular /></el-icon>
            <span>正在加载…</span>
          </div>
          <div v-else-if="!messages.length" class="stream-empty">该会话暂无消息</div>
        </div>
      </div>

      <!-- 回到底部 -->
      <transition name="rise">
        <button v-if="showJump" type="button" class="jump-bottom" @click="scrollToBottom">
          <el-icon :size="16"><ArrowDown24Regular /></el-icon>
        </button>
      </transition>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import {
  Chat24Regular, Person24Regular, ArrowSync24Regular,
  ArrowDown24Regular, Warning24Regular,
} from '@vicons/fluent'
import ConnectorIcon from '../ConnectorIcon.vue'
import { formatHMS, dayLabel, parseDate, contactShortName } from './format'

defineOptions({ name: 'ConnectorMessageStream' })

const props = defineProps<{
  messages: any[]
  active: boolean
  platform: string
  connectorName: string
  loading?: boolean
}>()

const viewportRef = ref<HTMLElement | null>(null)
const showJump = ref(false)
let nearBottom = true

function isError(content: string): boolean {
  return typeof content === 'string' && content.startsWith('AI 回复失败')
}

function contactName(m: any): string {
  return contactShortName(m.fromUser, m.chatId)
}

function dayKey(time: string): string {
  const d = parseDate(time)
  return d ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` : ''
}

interface Block {
  kind: 'date' | 'cluster'
  label?: string
  role?: string
  items?: any[]
}

const blocks = computed<Block[]>(() => {
  const out: Block[] = []
  let lastDay = ''
  let cluster: Block | null = null
  for (const m of props.messages) {
    const day = dayKey(m.createTime)
    if (day !== lastDay) {
      if (cluster) out.push(cluster)
      out.push({ kind: 'date', label: dayLabel(m.createTime) })
      cluster = null
      lastDay = day
    }
    if (!cluster || cluster.role !== m.role) {
      if (cluster) out.push(cluster)
      cluster = { kind: 'cluster', role: m.role, items: [] }
    }
    cluster.items!.push(m)
  }
  if (cluster) out.push(cluster)
  return out
})

function scrollToBottom() {
  nextTick(() => {
    const el = viewportRef.value
    if (el) el.scrollTop = el.scrollHeight
    showJump.value = false
    nearBottom = true
  })
}

function handleScroll() {
  const el = viewportRef.value
  if (!el) return
  const distance = el.scrollHeight - el.scrollTop - el.clientHeight
  nearBottom = distance < 80
  showJump.value = distance > 160
}

// 新消息到达：仅当用户已在底部附近时才自动跟随，避免打断阅读
watch(() => props.messages, () => {
  if (nearBottom) scrollToBottom()
}, { deep: false })

defineExpose({ scrollToBottom })
</script>

<style scoped>
.message-stream {
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.stream-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.placeholder-blob {
  width: 96px;
  height: 96px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  margin-bottom: 20px;
}
.placeholder-title {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-gray);
}
.placeholder-desc {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-disabled);
}

.stream-viewport {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scroll-behavior: smooth;
}
.stream-viewport::-webkit-scrollbar {
  width: 7px;
}
.stream-viewport::-webkit-scrollbar-thumb {
  border-radius: 4px;
  background: var(--el-border-color);
}
.stream-viewport::-webkit-scrollbar-thumb:hover {
  background: var(--el-border-color-darker);
}

.stream-inner {
  max-width: 820px;
  margin: 0 auto;
  padding: 22px 24px 12px;
}

.date-divider {
  display: flex;
  justify-content: center;
  margin: 18px 0 14px;
}
.date-pill {
  padding: 3px 12px;
  border-radius: 999px;
  font-size: 11.5px;
  color: var(--color-text-gray);
  background: var(--el-fill-color-light);
}

.cluster {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}
.cluster.is-in {
  justify-content: flex-start;
}
.cluster.is-out {
  justify-content: flex-end;
}

.cluster-avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: flex-end;
}
.is-in .cluster-avatar {
  color: var(--color-text-gray);
  background: var(--el-fill-color);
}
.is-out .cluster-avatar {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.cluster-content {
  display: flex;
  flex-direction: column;
  max-width: 76%;
}
.is-out .cluster-content {
  align-items: flex-end;
}
.cluster-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 4px 5px;
}
.cluster-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-gray);
}
.cluster-time {
  font-size: 10.5px;
  color: var(--color-text-disabled);
}

.bubble {
  display: inline-flex;
  align-items: flex-start;
  gap: 6px;
  padding: 10px 14px;
  margin-bottom: 3px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
  border: 1px solid transparent;
}
/* 收到的消息（用户侧）：使用全局气泡令牌，与主会话 TurnItem 的用户气泡保持一致。
   不能用 --el-fill-color-light：它在 style.css 中被别名到 --color-sidebar-bg-hover
   （浅色下仅 5% 覆盖），几乎不可见，导致用户消息看起来完全没有气泡样式。 */
.is-in .bubble {
  color: var(--color-bubble-user-text);
  background: var(--color-bubble-user-bg);
  border-color: var(--color-bubble-user-border);
  border-radius: 20px 6px 20px 20px;
}
.is-out .bubble {
  color: var(--color-primary-text);
  background: var(--el-color-primary);
  border-radius: 20px 6px 20px 20px;
}
.bubble-text {
  min-width: 0;
  flex: 1;
}
.bubble-text.markdown-content {
  width: 100%;
}
.bubble-err-icon {
  margin-top: 3px;
  flex-shrink: 0;
}
.bubble.is-error {
  color: var(--el-color-warning-dark-2) !important;
  background: var(--el-color-warning-light-9) !important;
  border-color: var(--el-color-warning-light-7) !important;
}

.stream-loading,
.stream-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 26px 0;
  font-size: 12.5px;
  color: var(--color-text-disabled);
}
.is-spin {
  animation: stream-spin 0.9s linear infinite;
}
@keyframes stream-spin {
  to { transform: rotate(360deg); }
}

.jump-bottom {
  position: absolute;
  right: 26px;
  bottom: 16px;
  width: 40px;
  height: 40px;
  border: 1px solid var(--color-surface-border);
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-gray);
  background: var(--color-surface);
  box-shadow: var(--el-box-shadow-lighter);
  cursor: pointer;
  transition: color 0.18s ease, transform 0.18s ease;
}
.jump-bottom:hover {
  color: var(--el-color-primary);
  transform: translateY(-2px);
}
.rise-enter-active,
.rise-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.rise-enter-from,
.rise-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>

<style>
/* markdown 排版规则需全局生效（与主会话 TurnItem 一致），故放在非 scoped 块 */
@import "@/assets/markdown.css";

/* IN 气泡（收到消息）底色为浅蓝灰，行内代码/引用块需比气泡底更深一档，
   否则 #f3f3f5 的 code 底色贴在 #eef3fb 气泡上几乎看不出边界。 */
.is-in .markdown-text code {
  background-color: rgba(15, 23, 42, 0.06);
}
.dark .is-in .markdown-text code {
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--color-text);
}
.is-in .markdown-text blockquote {
  border-left-color: var(--color-bubble-user-border);
}

/* 蓝色 OUT 气泡内 markdown 元素的配色。
   这些 HTML 由子组件 MarkdownContent 运行时生成、不带本组件 scoped id，
   故覆盖规则必须放在全局块才能命中。 */
.is-out .markdown-text,
.is-out .markdown-text p,
.is-out .markdown-text li,
.is-out .markdown-text h1,
.is-out .markdown-text h2,
.is-out .markdown-text h3,
.is-out .markdown-text h4,
.is-out .markdown-text h5,
.is-out .markdown-text h6 {
  color: var(--color-primary-text);
}
.is-out .markdown-text ul > li::before {
  background-color: rgba(255, 255, 255, 0.85);
}
.is-out .markdown-text ol > li:before {
  color: rgba(255, 255, 255, 0.9);
}
.is-out .markdown-text a {
  color: #fff;
  text-decoration: underline;
}
/* 行内代码：半透明白底白字 */
.is-out .markdown-text code {
  background-color: rgba(255, 255, 255, 0.22);
  color: #fff;
}
/* 浅色模式下代码块为浅底，pre 内文字强制深色（否则继承气泡白字，白底上看不清）。
   深色模式交给 markdown.css 的 .dark 规则（浅字深底），不在此覆盖。 */
html:not(.dark) .is-out .markdown-text pre,
html:not(.dark) .is-out .markdown-text pre code,
html:not(.dark) .is-out .markdown-text pre.hljs,
html:not(.dark) .is-out .markdown-text code.hljs {
  color: #1f2937;
}
html:not(.dark) .is-out .markdown-text .custom-code-block,
html:not(.dark) .is-out .markdown-text pre {
  background: var(--el-bg-color, #fff);
}
.is-out .markdown-text blockquote {
  border-left-color: rgba(255, 255, 255, 0.6);
}
</style>
