<script setup lang="ts">
// 邮箱组件：临时邮箱收到的邮件（收件箱形态）。
//
// 展示约定：
// - 行内展示「发件人首字母徽标 + 主题 + 摘要」，点击整行展开正文；
// - 正文优先使用后端模板渲染结果（`display.content`），回退 `body` / `text` / `textAsHtml`；
// - 顶部支持搜索主题 / 发件人，以及「全部 / 含验证码」筛选；验证码可一键复制。

import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  /** 邮件消息（后端 payload，可能含 display / html / body） */
  messages: Record<string, any>[]
  /** 接收邮箱地址（展示用） */
  email?: string
  /** 收信渠道标识（展示用） */
  channel?: string
}>()

type Filter = 'all' | 'code'
const filter = ref<Filter>('all')
const query = ref('')
const expanded = ref<Record<string, boolean>>({})

/** 去掉 HTML 标签，得到可读摘要 */
function plain(html: unknown): string {
  if (typeof html !== 'string') return ''
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

/** 邮件正文：模板渲染优先，其次纯文本正文，最后兜底 HTML */
function bodyOf(message: Record<string, any>): string {
  const display = message?.display?.content
  if (typeof display === 'string' && display.trim()) return display
  const body = message?.body ?? message?.text ?? message?.bodyText
  if (typeof body === 'string' && body.trim()) return body
  return plain(message?.html ?? message?.textAsHtml)
}

/** 主题：模板渲染主题优先 */
function subjectOf(message: Record<string, any>): string {
  const subject = message?.display?.subject
  if (typeof subject === 'string' && subject.trim()) return subject
  return String(message?.subject ?? '(无主题)')
}

/** 发件人 */
function fromOf(message: Record<string, any>): string {
  return String(message?.from ?? message?.fromAddress ?? message?.sender ?? '未知发件人')
}

/** 发件人首字母（用于徽标） */
function initialsOf(message: Record<string, any>): string {
  const from = fromOf(message).trim()
  const name = from.includes('@') ? from.split('@')[0] : from
  const matched = name.match(/[A-Za-z0-9\u4e00-\u9fa5]/g)
  return matched ? matched.slice(0, 2).join('').toUpperCase() : '✉'
}

/** 验证码 */
function codeOf(message: Record<string, any>): string {
  const code = message?.verifyCode ?? message?.code
  if (code) return String(code)
  const matched = bodyOf(message).match(/\b(\d{4,8})\b/)
  return matched ? matched[1] : ''
}

/** 时间 / 日期 */
function timeOf(message: Record<string, any>): string {
  const raw = message?.createdAt ?? message?.receivedAt ?? message?.date
  const value = Number(raw)
  if (!raw || !Number.isFinite(value)) return typeof raw === 'string' ? raw : ''
  const ms = value < 1_000_000_000_000 ? value * 1000 : value
  const date = new Date(ms)
  const today = new Date()
  const sameDay = date.toDateString() === today.toDateString()
  return sameDay
    ? date.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

/** 行 key：主题 + 发件人 + 时间，避免依赖数组下标 */
function keyOf(message: Record<string, any>, index: number): string {
  return `${fromOf(message)}|${subjectOf(message)}|${message?.createdAt ?? message?.receivedAt ?? index}`
}

const visible = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  return props.messages.filter((m) => {
    if (filter.value === 'code' && !codeOf(m)) return false
    if (!keyword) return true
    return `${subjectOf(m)} ${fromOf(m)} ${bodyOf(m)}`.toLowerCase().includes(keyword)
  })
})

const codeCount = computed(() => props.messages.filter((m) => !!codeOf(m)).length)

function toggle(message: Record<string, any>, index: number) {
  const key = keyOf(message, index)
  expanded.value[key] = !expanded.value[key]
}

async function copyCode(code: string) {
  try {
    await navigator.clipboard.writeText(code)
    ElMessage.success(`已复制验证码 ${code}`)
  } catch {
    ElMessage.warning('复制失败，请手动选择文本')
  }
}
</script>

<template>
  <div class="mail">
    <div class="mail__head">
      <div class="mail__ident">
        <span class="mail__title">邮箱</span>
        <span class="mail__addr" :title="email">{{ email || '未创建邮箱' }}</span>
        <span v-if="channel" class="mail__chan">{{ channel }}</span>
      </div>
      <div class="mail__tools">
        <input
          v-model="query"
          class="mail__search"
          type="search"
          placeholder="搜索主题 / 发件人"
          aria-label="搜索邮件"
        />
        <div class="mail__seg">
          <button type="button" :class="{ 'is-active': filter === 'all' }" @click="filter = 'all'">
            全部 {{ messages.length }}
          </button>
          <button type="button" :class="{ 'is-active': filter === 'code' }" @click="filter = 'code'">
            验证码 {{ codeCount }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="!visible.length" class="mail__empty">
      {{ messages.length ? '没有符合条件的邮件' : '暂无邮件，收件箱会在轮询到新邮件时自动刷新' }}
    </div>

    <div v-else class="mail__list">
      <div
        v-for="(m, i) in visible"
        :key="keyOf(m, i)"
        class="mail__item"
        :class="{ 'is-open': expanded[keyOf(m, i)] }"
      >
        <button type="button" class="mail__row" @click="toggle(m, i)">
          <span class="mail__avatar">{{ initialsOf(m) }}</span>
          <span class="mail__meta">
            <span class="mail__row1">
              <b class="mail__from" :title="fromOf(m)">{{ fromOf(m) }}</b>
              <i class="mail__time">{{ timeOf(m) }}</i>
            </span>
            <span class="mail__subject" :title="subjectOf(m)">{{ subjectOf(m) }}</span>
            <span class="mail__snippet">{{ bodyOf(m) }}</span>
          </span>
          <span v-if="codeOf(m)" class="mail__flag">验证码</span>
        </button>

        <div v-if="expanded[keyOf(m, i)]" class="mail__body">
          <p class="mail__body-text">{{ bodyOf(m) }}</p>
          <div class="mail__body-foot">
            <button v-if="codeOf(m)" type="button" class="mail__code" @click="copyCode(codeOf(m))">
              验证码 {{ codeOf(m) }}
              <span>复制</span>
            </button>
            <span class="mail__body-from">发件人 {{ fromOf(m) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mail {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border: 1px solid var(--border-default, #e2e9f3);
  border-radius: 12px;
  background: var(--bg-container, #fff);
  overflow: hidden;
}
.mail__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-default, #e2e9f3);
  background: var(--bg-elevated, #f8fafc);
}
.mail__ident {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.mail__title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
}
.mail__addr {
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--text-secondary, #475569);
  max-width: 170px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mail__chan {
  font-size: 11px;
  color: var(--text-tertiary, #94a3b8);
  border: 1px dashed var(--border-default, #e2e9f3);
  border-radius: 999px;
  padding: 1px 7px;
}
.mail__tools {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
}
.mail__search {
  width: 150px;
  border: 1px solid var(--border-default, #e2e9f3);
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 11px;
  background: var(--bg-container, #fff);
  color: var(--text-primary, #0f172a);
  outline: none;
}
.mail__search:focus {
  border-color: var(--el-color-primary, #409eff);
}
.mail__seg {
  display: inline-flex;
  padding: 2px;
  border-radius: 8px;
  background: var(--el-fill-color-light, #f1f5f9);
  gap: 2px;
}
.mail__seg button {
  border: 0;
  background: transparent;
  color: var(--text-secondary, #475569);
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background .15s ease, color .15s ease;
}
.mail__seg button.is-active {
  background: var(--bg-container, #fff);
  color: var(--el-color-primary, #409eff);
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(15, 23, 42, .08);
}
.mail__empty {
  padding: 22px 12px;
  text-align: center;
  font-size: 12px;
  color: var(--text-tertiary, #94a3b8);
}
.mail__list {
  display: flex;
  flex-direction: column;
  max-height: 300px;
  overflow-y: auto;
}
.mail__item {
  border-bottom: 1px dashed var(--border-default, #e2e9f3);
}
.mail__item:last-child {
  border-bottom: 0;
}
.mail__row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background .15s ease;
}
.mail__row:hover {
  background: var(--el-fill-color-lighter, #f8fafc);
}
.mail__item.is-open .mail__row {
  background: var(--el-fill-color-lighter, #f8fafc);
}
.mail__avatar {
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 700;
  color: var(--el-color-primary, #409eff);
  background: color-mix(in srgb, var(--el-color-primary, #409eff) 12%, transparent);
}
.mail__meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.mail__row1 {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.mail__from {
  font-size: 12px;
  color: var(--text-primary, #0f172a);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mail__time {
  flex: none;
  font-size: 11px;
  color: var(--text-tertiary, #94a3b8);
}
.mail__subject {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #475569);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mail__snippet {
  font-size: 11px;
  color: var(--text-tertiary, #94a3b8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mail__flag {
  flex: none;
  font-size: 10px;
  color: var(--el-color-primary, #409eff);
  border: 1px solid color-mix(in srgb, var(--el-color-primary, #409eff) 35%, transparent);
  border-radius: 4px;
  padding: 1px 5px;
}
.mail__body {
  padding: 2px 12px 10px 50px;
}
.mail__body-text {
  margin: 0 0 6px;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--text-secondary, #475569);
}
.mail__body-foot {
  display: flex;
  align-items: center;
  gap: 10px;
}
.mail__code {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary, #409eff) 35%, transparent);
  background: color-mix(in srgb, var(--el-color-primary, #409eff) 8%, transparent);
  color: var(--el-color-primary, #409eff);
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 700;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  cursor: pointer;
}
.mail__code span {
  font-family: inherit;
  font-size: 10px;
  font-weight: 400;
  opacity: .75;
}
.mail__body-from {
  font-size: 11px;
  color: var(--text-tertiary, #94a3b8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
