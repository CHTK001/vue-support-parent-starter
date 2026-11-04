<script setup lang="ts">
// 短信组件：临时号码收到的短信流。
//
// 展示约定：
// - 优先展示后端模板渲染结果（`display.content`），没有模板时回退原始 `content` / `text`；
// - 验证码单独抽成可复制的胶囊（后端 `verifyCode` 优先，缺失时本地正则兜底）；
// - 顶部提供「全部 / 含验证码」筛选与条数统计，列表按时间倒序（后端已倒序）。

import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  /** 短信消息（后端 payload，可能含 display / verifyCode） */
  messages: Record<string, any>[]
  /** 接收号码（展示用） */
  phone?: string
  /** 接码渠道标识（展示用） */
  channel?: string
}>()

type Filter = 'all' | 'code'
const filter = ref<Filter>('all')

/** 消息纯文本：模板渲染优先，其次原文 */
function textOf(message: Record<string, any>): string {
  const display = message?.display?.content
  if (typeof display === 'string' && display.trim()) return display
  return String(message?.content ?? message?.text ?? '')
}

/** 验证码：后端抽取优先，缺失时本地按 4-8 位数字兜底 */
function codeOf(message: Record<string, any>): string {
  const code = message?.verifyCode ?? message?.code
  if (code) return String(code)
  const matched = textOf(message).match(/\b(\d{4,8})\b/)
  return matched ? matched[1] : ''
}

/** 来源号码 / 服务号 */
function fromOf(message: Record<string, any>): string {
  return String(message?.from ?? message?.phone ?? '未知来源')
}

/** 时间展示（兼容秒 / 毫秒时间戳） */
function timeOf(message: Record<string, any>): string {
  const raw = message?.createdAt ?? message?.receivedAt
  if (!raw) return ''
  const value = Number(raw)
  if (!Number.isFinite(value)) return ''
  const ms = value < 1_000_000_000_000 ? value * 1000 : value
  return new Date(ms).toLocaleTimeString('zh-CN', { hour12: false })
}

const visible = computed(() =>
  filter.value === 'code' ? props.messages.filter((m) => !!codeOf(m)) : props.messages,
)

const codeCount = computed(() => props.messages.filter((m) => !!codeOf(m)).length)

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
  <div class="sms">
    <div class="sms__head">
      <span class="sms__title">短信</span>
      <span class="sms__addr" :title="phone">{{ phone || '未领取号码' }}</span>
      <span v-if="channel" class="sms__chan">{{ channel }}</span>
      <div class="sms__seg">
        <button type="button" :class="{ 'is-active': filter === 'all' }" @click="filter = 'all'">
          全部 {{ messages.length }}
        </button>
        <button type="button" :class="{ 'is-active': filter === 'code' }" @click="filter = 'code'">
          验证码 {{ codeCount }}
        </button>
      </div>
    </div>

    <div v-if="!visible.length" class="sms__empty">
      {{ messages.length ? '没有命中验证码的短信' : '暂无短信，号码收到后可在此查看' }}
    </div>

    <div v-else class="sms__list">
      <div v-for="(m, i) in visible" :key="'sms' + i" class="sms__item">
        <div class="sms__meta">
          <b class="sms__from" :title="fromOf(m)">{{ fromOf(m) }}</b>
          <i class="sms__time">{{ timeOf(m) }}</i>
        </div>
        <p class="sms__text">{{ textOf(m) }}</p>
        <button
          v-if="codeOf(m)"
          type="button"
          class="sms__code"
          :title="`复制验证码 ${codeOf(m)}`"
          @click="copyCode(codeOf(m))"
        >
          {{ codeOf(m) }}
          <span>复制</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sms {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border: 1px solid var(--border-default, #e2e9f3);
  border-radius: 12px;
  background: var(--bg-container, #fff);
  overflow: hidden;
}
.sms__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-default, #e2e9f3);
  background: var(--bg-elevated, #f8fafc);
}
.sms__title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
}
.sms__addr {
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--text-secondary, #475569);
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sms__chan {
  font-size: 11px;
  color: var(--text-tertiary, #94a3b8);
  border: 1px dashed var(--border-default, #e2e9f3);
  border-radius: 999px;
  padding: 1px 7px;
}
.sms__seg {
  margin-left: auto;
  display: inline-flex;
  padding: 2px;
  border-radius: 8px;
  background: var(--el-fill-color-light, #f1f5f9);
  gap: 2px;
}
.sms__seg button {
  border: 0;
  background: transparent;
  color: var(--text-secondary, #475569);
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background .15s ease, color .15s ease;
}
.sms__seg button.is-active {
  background: var(--bg-container, #fff);
  color: var(--el-color-primary, #409eff);
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(15, 23, 42, .08);
}
.sms__empty {
  padding: 22px 12px;
  text-align: center;
  font-size: 12px;
  color: var(--text-tertiary, #94a3b8);
}
.sms__list {
  display: flex;
  flex-direction: column;
  max-height: 260px;
  overflow-y: auto;
}
.sms__item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 9px 12px;
  border-bottom: 1px dashed var(--border-default, #e2e9f3);
}
.sms__item:last-child {
  border-bottom: 0;
}
.sms__meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.sms__from {
  font-size: 12px;
  color: var(--text-primary, #0f172a);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sms__time {
  font-size: 11px;
  color: var(--text-tertiary, #94a3b8);
  flex: none;
}
.sms__text {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: var(--text-secondary, #475569);
  white-space: pre-wrap;
  word-break: break-word;
}
.sms__code {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary, #409eff) 35%, transparent);
  background: color-mix(in srgb, var(--el-color-primary, #409eff) 8%, transparent);
  color: var(--el-color-primary, #409eff);
  border-radius: 6px;
  padding: 2px 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: .08em;
  cursor: pointer;
  transition: background .15s ease;
}
.sms__code:hover {
  background: color-mix(in srgb, var(--el-color-primary, #409eff) 16%, transparent);
}
.sms__code span {
  font-family: inherit;
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0;
  opacity: .75;
}
</style>
