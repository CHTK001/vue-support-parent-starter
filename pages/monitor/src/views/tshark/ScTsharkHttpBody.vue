<!--
  HTTP 正文查看器（文本 / JSON / HEX 三视图）

  正文来自解析期入库的 http 列：先按 Content-Encoding 解压、再按 charset 解码，
  文本视图就是这段解码结果；HEX 视图优先用同一份字节的十六进制（httpBodyHex），
  老会话没有这一列时按文本重新编码，保证「有正文就一定有 HEX」。

  为什么要分视图：同一条正文可以既是 JSON（要看缩进）、又是字节流（要看编码），
  固定一种展示总有一半人看不出问题。智能视图按内容自动选，用户也可以手动钉住。
-->
<template>
  <div class="http-body-view">
    <div class="http-body__head">
      <span class="http-body__title">{{ title }}</span>
      <span class="http-body__meta">{{ meta }}</span>
      <span class="http-spacer"></span>
      <span class="view-switch" role="group" aria-label="正文视图">
        <button
          v-for="item in VIEWS"
          :key="item.value"
          type="button"
          class="view-switch__item"
          :class="{ 'is-on': view === item.value }"
          :aria-pressed="view === item.value"
          @click="view = item.value"
        >{{ item.label }}</button>
      </span>
      <ReButton text type="primary" @click="copy(shownText, '正文已复制')">复制</ReButton>
    </div>

    <p v-if="notice" class="http-body__notice">{{ notice }}</p>

    <pre class="http-body" :class="{ 'is-hex': activeView === 'hex' }">{{ shownText }}</pre>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { message } from '@repo/core'
import ReButton from '@repo/ui/re-button'

type BodyView = 'auto' | 'json' | 'text' | 'hex'

const props = defineProps<{
  /** 区块标题，如「请求体」 */
  title?: string
  /** 正文说明（类型 / 编码 / 字节数），由调用方拼好 */
  meta?: string
  /** 可读正文（后端已解压 + 解码 + 截断） */
  body?: string | null
  /** 同一份字节的十六进制；老会话为空 */
  bodyHex?: string | null
  /** Content-Type，用来判断 JSON / 二进制 */
  contentType?: string | null
  /** 原始字节数 */
  contentLength?: number | null
}>()

const VIEWS: Array<{ value: BodyView, label: string }> = [
  { value: 'auto', label: '智能' },
  { value: 'json', label: 'JSON' },
  { value: 'text', label: '文本' },
  { value: 'hex', label: 'HEX' },
]

/** 正文被解析期截断时追加的标记（见后端 decodeHttpBody） */
const TRUNC_MARK = '…（正文已截断）'
/** 后端 hex 列最多保留 32KB 原始字节 */
const HEX_KEEP_BYTES = 32 * 1024

const view = ref<BodyView>('auto')

const rawText = computed(() => props.body ?? '')
const hasBody = computed(() => rawText.value.length > 0)

/** 去掉截断标记后的正文：JSON 解析要用没被尾巴污染的那一段 */
const cleanText = computed(() => rawText.value.endsWith(TRUNC_MARK)
  ? rawText.value.slice(0, -TRUNC_MARK.length)
  : rawText.value)

/** 后端二进制正文的文本视图是 `HEX <预览>`，此时文本视图没有可读性 */
const binary = computed(() => {
  const text = rawText.value
  if (text.startsWith('HEX ')) return true
  const type = (props.contentType || '').toLowerCase()
  if (!type) return false
  return !/(^text\/)|json|xml|javascript|ecmascript|x-www-form-urlencoded|graphql|yaml|csv/.test(type)
})

/** JSON 美化结果；解析失败（含正文被截断）为 null，视图要能回落 */
const prettyJson = computed<string | null>(() => {
  const text = cleanText.value.trim()
  if (!text) return null
  const first = text[0]
  if (first !== '{' && first !== '[') return null
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return null
  }
})

/** 正文对应的原始字节：优先用后端 hex 列，其次从文本编码出来 */
const bodyBytes = computed<Uint8Array>(() => {
  const hex = props.bodyHex
  if (hex) {
    return hexToBytes(hex)
  }
  // 老会话：二进制正文只留了 `HEX <前 1KB>` 预览，按它还原能看的部分
  if (rawText.value.startsWith('HEX ')) {
    return hexToBytes(rawText.value.slice(4))
  }
  return new TextEncoder().encode(cleanText.value)
})

const hexText = computed(() => dumpHex(bodyBytes.value))

/** 智能视图：能解析成 JSON 就先给缩进，二进制退 HEX，其余按文本 */
const activeView = computed<'json' | 'text' | 'hex'>(() => {
  if (view.value !== 'auto') return view.value
  if (prettyJson.value) return 'json'
  if (binary.value) return 'hex'
  return 'text'
})

/** 当前视图真正展示的文本 */
const shownText = computed(() => {
  switch (activeView.value) {
    case 'hex':
      return hexText.value
    case 'json':
      return prettyJson.value ?? cleanText.value
    default:
      return cleanText.value
  }
})

/** 说明行：截断原因 / JSON 解析失败 / 二进制提示，没有就不占位 */
const notice = computed(() => {
  const notes: string[] = []
  if (view.value === 'json' && !prettyJson.value) {
    notes.push(rawText.value.endsWith(TRUNC_MARK)
      ? 'JSON 正文已被截断，无法解析，下面是原文。'
      : 'JSON 解析失败，下面是原文。')
  }
  if (activeView.value === 'text' && binary.value) {
    notes.push('正文被判为二进制，文本视图只是后端给的可读预览；看字节请切 HEX。')
  }
  if (activeView.value === 'hex') {
    const bytes = bodyBytes.value.length
    const total = props.contentLength
    // 后端 hex 列上限 32KB：正好顶到上限说明后面还有，不能假装这就是全部
    if (bytes >= HEX_KEEP_BYTES) {
      notes.push(`HEX 只保留前 ${formatBytes(HEX_KEEP_BYTES)}${total != null && total > bytes ? `，原件 ${formatBytes(total)}` : ''}。`)
    } else if (total != null && total > bytes) {
      notes.push(`HEX 覆盖 ${formatBytes(bytes)}，原件 ${formatBytes(total)}（抓到的正文不完整）。`)
    }
  }
  if (rawText.value.endsWith(TRUNC_MARK) && activeView.value !== 'hex') {
    notes.push('正文已按入库上限截断。')
  }
  return notes.join(' ')
})

/** 十六进制串 → 字节（容错：忽略空白与非十六进制字符） */
function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '')
  const n = Math.floor(clean.length / 2)
  const out = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

/**
 * 生成 hex dump：每行 16 字节，左侧 8 位偏移、中间两段十六进制、右侧 ASCII。
 *
 * <p>和 hexdump -C 的排版一致，离线贴到票据/邮件里也能对着看。</p>
 */
function dumpHex(bytes: Uint8Array): string {
  const lines: string[] = []
  for (let i = 0; i < bytes.length; i += 16) {
    const chunk = bytes.subarray(i, i + 16)
    const left: string[] = []
    const right: string[] = []
    let ascii = ''
    for (let j = 0; j < 16; j++) {
      if (j < chunk.length) {
        const b = chunk[j]
        const hex = b.toString(16).padStart(2, '0')
        ascii += b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : '.'
        if (j < 8) left.push(hex)
        else right.push(hex)
      } else {
        if (j < 8) left.push('  ')
        else right.push('  ')
      }
    }
    lines.push(`${i.toString(16).padStart(8, '0')}  ${left.join(' ')}  ${right.join(' ')}  |${ascii}|`)
  }
  return lines.join('\n')
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
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
.http-body-view {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.http-body__head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.http-body__title {
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}
.http-body__meta {
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
.http-body__notice {
  margin: 0;
  font-size: 11px;
  line-height: 1.5;
  color: var(--el-color-warning);
}
.http-body {
  margin: 0;
  padding: 10px 12px;
  background: var(--el-fill-color-lighter);
  border-radius: var(--el-radius-sm, 6px);
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-size: 11px;
  line-height: 1.55;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
  word-break: break-word;
  overflow: auto;
  max-height: 220px;
}
/* hex dump 靠空格对齐，换行会被打散 */
.http-body.is-hex {
  white-space: pre;
  word-break: normal;
}

/* 视图切换：分段控件，选中格浮起一层底（与时间轴粒度切换同一形态） */
.view-switch {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  border-radius: 999px;
  background: var(--el-fill-color-light);
}
.view-switch__item {
  padding: 2px 8px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  cursor: pointer;
  transition: color var(--el-transition-duration-fast, 0.2s) ease,
    background-color var(--el-transition-duration-fast, 0.2s) ease;
}
.view-switch__item:hover {
  color: var(--el-text-color-primary);
}
.view-switch__item.is-on {
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  font-weight: 600;
  box-shadow: 0 1px 2px rgb(0 0 0 / 8%);
}
.view-switch__item:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--el-color-primary) 40%, transparent);
  outline-offset: 1px;
}
</style>
