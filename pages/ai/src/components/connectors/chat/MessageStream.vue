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
                    {{ block.role === 'assistant' ? connectorName : contactName(block.items?.[0]) }}
                  </span>
                  <span class="cluster-time">{{ formatHMS(block.items?.[block.items.length - 1]?.createTime) }}</span>
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
  return contactShortName(m?.fromUser, m?.chatId)
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
/* ============================================================================
   令牌口径（与本应用其余已改组件统一）：
   1. 圆角、过渡统一取 --el-radius-* / --el-transition-duration-fast 令牌。
      注意 --el-transition-duration 在 EP base.css 里恒为 .3s 且 koi 不覆盖，
      写 var(--el-transition-duration, 0.2s) 的兜底值是死代码、实际生效 .3s；
      因此颜色/边框/位移这类微交互一律走 -fast 档（EP 自己就是这么用的）。
   2. 消息气泡与滚动容器不是卡片，不加投影；唯一允许的投影是
      「回到底部」悬浮按钮（浮起来才能和消息流分层，投影是功能必需的）。
   3. 三个色值（占位块 / 头像底 / 加载态）统一走语义色，主题切换时自动跟随。
   ============================================================================ */
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
  /* 原值 30px：超出六档上限，96px 见方的占位方块取 xl 档（16px）后
     相对边长约 17%，与卡片 xl 档在同一体量级，形状语义不变 */
  border-radius: var(--el-radius-xl, 16px);
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
  color: var(--el-text-color-regular);
}
.placeholder-desc {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
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
  /* 原值 4px → xs 档 */
  border-radius: var(--el-radius-xs, 4px);
  background: var(--el-border-color);
}
.stream-viewport::-webkit-scrollbar-thumb:hover {
  background: var(--el-border-color-darker);
}

/* 右侧内容区宽度：满屏时由 MainLayout 注入 --content-max-width: none（见 useKbDisplay），
   窄屏保持舒适阅读宽度 820px 居中 */
.stream-inner {
  max-width: var(--content-max-width, 820px);
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
  /* 原值 999px（胶囊）→ full 档 */
  border-radius: var(--el-radius-full, 9999px);
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
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
  /* 原值 50%（正圆）→ full 档 */
  border-radius: var(--el-radius-full, 9999px);
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: flex-end;
}
.is-in .cluster-avatar {
  color: var(--el-text-color-secondary);
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
  color: var(--el-text-color-secondary);
}
.cluster-time {
  font-size: 10.5px;
  color: var(--el-text-color-secondary);
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
   不能用 --el-fill-color-light：在 style.css 中被别名到 --color-sidebar-bg-hover
   （浅色下仅 5% 覆盖），几乎不可见，导致用户消息看起来完全没有气泡样式。 */
.is-in .bubble {
  color: var(--color-bubble-user-text);
  background: var(--color-bubble-user-bg);
  border-color: var(--color-bubble-user-border);
  /* 原值 20px 6px 20px 20px（右上角收紧的气泡尾巴造型）→ 最近的 xl / sm 档 */
  border-radius: var(--el-radius-xl, 16px) var(--el-radius-sm, 6px) var(--el-radius-xl, 16px) var(--el-radius-xl, 16px);
}
.is-out .bubble {
  /* 气泡文字用 --el-color-white 而非原来的 --color-primary-text：
     底色恒为主色，白字是对比度最高的反相色；9 套主题下都成立
     （涂鸦本的米黄、蒸汽朋克的黄铜色底上白字同样清晰） */
  //color: var(--el-color-white);
  background: var(--el-color-primary);
  border-radius: var(--el-radius-xl, 16px) var(--el-radius-sm, 6px) var(--el-radius-xl, 16px) var(--el-radius-xl, 16px);
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
  color: var(--el-text-color-secondary);
}
.is-spin {
  animation: stream-spin 0.9s linear infinite;
}
@keyframes stream-spin {
  to { transform: rotate(360deg); }
}

/* 「回到底部」是浮在消息流之上的悬浮按钮：投影与位移都是「浮起」提示，
   属于 koi 允许的第二类投影，只把色源从写死 rgba 换成色相派生 */
.jump-bottom {
  position: absolute;
  right: 26px;
  bottom: 16px;
  width: 40px;
  height: 40px;
  border: 1px solid var(--el-border-color-lighter);
  /* 原值 13px：不属六档，取最近的 lg(12px) */
  border-radius: var(--el-radius-lg, 12px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  background: var(--el-bg-color);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--el-text-color-primary) 14%, transparent);
  cursor: pointer;
  outline: none;
  transition:
    color var(--el-transition-duration-fast, 0.2s) ease,
    transform var(--el-transition-duration-fast, 0.2s) ease;
}
.jump-bottom:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.jump-bottom:hover {
  color: var(--el-color-primary);
  transform: translateY(-2px);
}
.rise-enter-active,
.rise-leave-active {
  transition:
    opacity var(--el-transition-duration-fast, 0.2s) ease,
    transform var(--el-transition-duration-fast, 0.2s) ease;
}
.rise-enter-from,
.rise-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* 尊重系统「减少动态效果」偏好。
   .is-spin 是「正在加载」的唯一视觉反馈，关掉旋转后必须补一个静态态，
   否则加载与「没有更多消息」在视觉上无法区分 —— 这里用保持不透明 + 常显
   来替代旋转（元素本身仍在，父级 .stream-loading 已有文字「正在加载…」，
   故文字本身就是可靠的静态反馈）。 */
@media (prefers-reduced-motion: reduce) {
  .stream-viewport {
    scroll-behavior: auto;
  }
  .is-spin {
    animation: none;
    opacity: 0.7;
  }
  .jump-bottom,
  .rise-enter-active,
  .rise-leave-active {
    transition: none;
  }
  .jump-bottom:hover {
    transform: none;
  }
}
</style>

<style>
/* markdown 排版规则需全局生效（与主会话 TurnItem 一致），故放在非 scoped 块 */
@import "@/assets/markdown.css";

/* IN 气泡（收到消息）底色为浅蓝灰，行内代码/引用块需比气泡底更深一档，
   否则 markdown.css 的 code 底色贴在气泡上几乎看不出边界。
   原写法是写死的 rgba(15,23,42,.06) / rgba(255,255,255,.1) 两套，
   这里改为从当前模式下的正文色派生，换肤时自动跟随。 */
.is-in .markdown-text code {
  background-color: color-mix(in srgb, var(--el-text-color-primary) 6%, transparent);
}
.dark .is-in .markdown-text code {
  background-color: color-mix(in srgb, var(--el-text-color-primary) 10%, transparent);
  color: var(--el-text-color-primary);
}
.is-in .markdown-text blockquote {
  border-left-color: var(--color-bubble-user-border);
}

/* 主色 OUT 气泡内 markdown 元素的配色。
   这些 HTML 由子组件 MarkdownContent 运行时生成、不带本组件 scoped id，
   故覆盖规则必须放在全局块才能命中。
   气泡底是 var(--el-color-primary)，其上的文字/描边必须始终与底色反相，
   所以这里统一用「主色底的对立面 = 纯白」令牌 --el-color-white，
   而不是留 #fff —— 写死的白在 9 套主题里若气泡底偏亮（如涂鸦本米黄）就糊成一片。 */
.is-out .markdown-text,
.is-out .markdown-text p,
.is-out .markdown-text li,
.is-out .markdown-text h1,
.is-out .markdown-text h2,
.is-out .markdown-text h3,
.is-out .markdown-text h4,
.is-out .markdown-text h5,
.is-out .markdown-text h6 {
 /* color: var(--el-color-white);*/
}
.is-out .markdown-text ul > li::before {
  background-color: color-mix(in srgb, var(--el-color-white) 85%, transparent);
}
.is-out .markdown-text ol > li:before {
  color: color-mix(in srgb, var(--el-color-white) 90%, transparent);
}
.is-out .markdown-text a {
  //color: var(--el-color-white);
  text-decoration: underline;
}
/* 行内代码：半透明白底白字 */
.is-out .markdown-text code {
  background-color: color-mix(in srgb, var(--el-color-white) 22%, transparent);
  //color: var(--el-color-white);
}
/* 浅色模式下代码块为浅底，pre 内文字强制深色（否则继承气泡白字，白底上看不清）。
   深色模式交给 markdown.css 的 .dark 规则（浅字深底），不在此覆盖。
   原值 #1f2937 是写死的 slate-800，这里改用 --el-text-color-primary：
   它随主题走，在涂鸦本这类暖色浅底上比固定深灰更协调。 */
html:not(.dark) .is-out .markdown-text pre,
html:not(.dark) .is-out .markdown-text pre code,
html:not(.dark) .is-out .markdown-text pre.hljs,
html:not(.dark) .is-out .markdown-text code.hljs {
  color: var(--el-text-color-primary);
}
html:not(.dark) .is-out .markdown-text .custom-code-block,
html:not(.dark) .is-out .markdown-text pre {
  background: var(--el-bg-color);
}
.is-out .markdown-text blockquote {
  border-left-color: color-mix(in srgb, var(--el-color-white) 60%, transparent);
}
</style>
