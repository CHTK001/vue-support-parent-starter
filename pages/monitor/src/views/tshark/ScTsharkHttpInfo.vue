<!--
  HTTP 报文实体展示（请求 / 响应各一段）

  数据来自「解析阶段」入库的 http 列，不是打开时回扫 pcap：一个几百 MB 的 pcap
  单帧回扫要分钟级，详情弹层和生命周期都等不起。

  一个帧只有一个方向：带请求头的显示「HTTP 请求」，带响应头的显示「HTTP 响应」。
  正文跟随头部归属，所以请求体不会跑到响应下面。
-->
<template>
  <div v-if="hasAny" class="http-info">
    <section v-if="requestHead" class="http-block">
      <header class="http-block__head">
        <h4>HTTP 请求</h4>
        <span class="http-block__meta">{{ requestLine }}</span>
        <span class="http-spacer"></span>
        <ReButton text type="primary" @click="copy(requestText, '请求已复制')">复制</ReButton>
      </header>
      <pre class="http-head">{{ requestHead }}</pre>
      <template v-if="body">
        <div class="http-body__head">
          <span class="http-body__title">请求体</span>
          <span class="http-block__meta">{{ bodyMeta }}</span>
          <ReButton text type="primary" @click="copy(body, '请求体已复制')">复制</ReButton>
        </div>
        <pre class="http-body">{{ body }}</pre>
      </template>
    </section>

    <section v-if="responseHead" class="http-block">
      <header class="http-block__head">
        <h4>HTTP 响应</h4>
        <span class="http-block__meta">{{ responseLine }}</span>
        <span class="http-spacer"></span>
        <ReButton text type="primary" @click="copy(responseText, '响应已复制')">复制</ReButton>
      </header>
      <pre class="http-head">{{ responseHead }}</pre>
      <template v-if="body">
        <div class="http-body__head">
          <span class="http-body__title">响应体</span>
          <span class="http-block__meta">{{ bodyMeta }}</span>
          <ReButton text type="primary" @click="copy(body, '响应体已复制')">复制</ReButton>
        </div>
        <pre class="http-body">{{ body }}</pre>
      </template>
    </section>

    <!-- 只有正文、没有起始行时的兜底（例如头部所在的帧被过滤掉，正文仍完整） -->
    <section v-if="body && !requestHead && !responseHead" class="http-block">
      <header class="http-block__head">
        <h4>HTTP 正文</h4>
        <span class="http-block__meta">{{ bodyMeta }}</span>
        <span class="http-spacer"></span>
        <ReButton text type="primary" @click="copy(body, '正文已复制')">复制</ReButton>
      </header>
      <pre class="http-body">{{ body }}</pre>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { message } from '@repo/core'
import ReButton from '@repo/ui/re-button'
import type { TsharkPacket } from './types'

const props = defineProps<{
  packet: TsharkPacket | null
}>()

const requestHead = computed(() => props.packet?.httpRequestHead || '')
const responseHead = computed(() => props.packet?.httpResponseHead || '')
/**
 * 正文：每个实例只承载一个方向（请求帧或响应帧），正文直接属于该帧。
 *
 * <p>原实现按「有请求头就算请求体」反推方向，但事务视图里请求与响应是两个实例，
 * 反推反而可能把响应体挂到请求下面；直接取本帧的 httpBody 才不会串方向。</p>
 */
const body = computed(() => props.packet?.httpBody || '')

const hasAny = computed(() => !!requestHead.value || !!responseHead.value || !!body.value)

const requestLine = computed(() => firstLine(requestHead.value))
const responseLine = computed(() => firstLine(responseHead.value))

/** 正文说明：类型 · 编码 · 原始字节数（后端给人看的元信息） */
const bodyMeta = computed(() => {
  const p = props.packet
  if (!p) return ''
  const parts: string[] = []
  if (p.httpContentType) parts.push(p.httpContentType)
  if (p.httpContentEncoding) parts.push(`编码 ${p.httpContentEncoding}`)
  if (p.httpContentLength != null) parts.push(`${p.httpContentLength} 字节`)
  return parts.join(' · ')
})

const requestText = computed(() => [requestHead.value, body.value].filter(Boolean).join('\n\n'))
const responseText = computed(() => [responseHead.value, body.value].filter(Boolean).join('\n\n'))

function firstLine(text: string): string {
  return text ? text.split('\n')[0] : ''
}

async function copy(text: string, okText: string) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    message.success(okText)
  } catch {
    message.warning('复制失败，请手动选中文本复制')
  }
}
</script>

<style scoped>
.http-info {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.http-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.http-block__head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.http-block__head h4 {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.http-block__meta {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
.http-spacer {
  flex: 1 1 auto;
}
.http-head,
.http-body {
  margin: 0;
  padding: 10px 12px;
  background: var(--el-fill-color-lighter);
  border-radius: var(--el-radius-sm, 6px);
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-size: 11px;
  line-height: 1.55;
  color: var(--el-text-color-regular);
  white-space: pre;
  overflow: auto;
  max-height: 220px;
}
.http-body {
  white-space: pre-wrap;
  word-break: break-word;
}
.http-body__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}
.http-body__title {
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}
</style>
