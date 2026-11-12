<!--
  HTTP 正文查看器（智能 / 表单 / JSON / 文本 / HEX）

  正文来自解析期入库的 http 列：先按 Content-Encoding 解压、再按 charset 解码，
  文本视图就是这段解码结果；HEX 视图优先用同一份字节的十六进制（httpBodyHex），
  老会话没有这一列时按文本重新编码，保证「有正文就一定有 HEX」。

  为什么要分视图：同一条正文可以既是 JSON（要看缩进）、又是字节流（要看编码），
  固定一种展示总有一半人看不出问题。智能视图按内容自动选，用户也可以手动钉住。

  表单视图只在 Content-Type 是 x-www-form-urlencoded / multipart/form-data 时出现：
  这两种正文的「值」常常需要按 charset 做百分号解码、按 boundary 切 part，
  只给原文等于让人手工解析。文件 part 不塞进文本里，单独标文件名 / 类型 / 字节数，
  给一段 HEX 预览，并支持按原始字节导出（后缀取该 part 的 Content-Type）。
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

    <div v-if="activeView === 'form'" class="http-form">
      <p v-if="!formFields.length" class="http-form__empty">
        没能从正文里解析出表单字段，可切回「文本」看原文。
      </p>
      <div v-for="(field, i) in formFields" :key="i" class="http-form__row">
        <span class="http-form__name" :title="field.name">{{ field.name }}</span>
        <span class="http-form__value">
          <template v-if="field.filename != null">
            <span class="http-form__file" :title="field.filename">{{ field.filename || '(未命名文件)' }}</span>
            <span class="http-form__tag">{{ formatBytes(field.bytes || 0) }}</span>
            <span v-if="field.partType" class="http-form__tag">{{ field.partType }}</span>
            <ReButton v-if="field.data && field.data.length" text type="primary" @click="download(field)">下载</ReButton>
            <code v-if="field.hex" class="http-form__hex">{{ field.hex }}</code>
          </template>
          <span v-else-if="field.binary" class="http-form__tag">二进制值，看 HEX</span>
          <template v-else>{{ field.value }}</template>
        </span>
      </div>
    </div>

    <pre v-else class="http-body" :class="{ 'is-hex': activeView === 'hex' }">{{ shownText }}</pre>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { message } from '@repo/core'
import ReButton from '@repo/ui/re-button'

type BodyView = 'auto' | 'form' | 'json' | 'text' | 'hex'

/** 表单字段：普通字段只填 value，文件 part 填 filename / partType / bytes / hex / data */
interface FormField {
  name: string
  value?: string
  filename?: string
  partType?: string
  bytes?: number
  hex?: string
  binary?: boolean
  /** 文件 part 的原始字节（来自 httpBodyHex），用于导出 */
  data?: Uint8Array
}

const props = defineProps<{
  /** 区块标题，如「请求体」 */
  title?: string
  /** 正文说明（类型 / 编码 / 字节数），由调用方拼好 */
  meta?: string
  /** 可读正文（后端已解压 + 解码 + 截断） */
  body?: string | null
  /** 同一份字节的十六进制；老会话为空 */
  bodyHex?: string | null
  /** Content-Type，用来判断 JSON / 二进制 / 表单 */
  contentType?: string | null
  /** 原始字节数 */
  contentLength?: number | null
}>()

/** 正文被解析期截断时追加的标记（见后端 decodeHttpBody） */
const TRUNC_MARK = '…（正文已截断）'
/** 后端 hex 列最多保留 32KB 原始字节 */
const HEX_KEEP_BYTES = 32 * 1024
/** 文件 part 的 HEX 预览长度（字节） */
const PART_HEX_PREVIEW = 256

/** Content-Type 是否属于表单：只有这两类才有结构化字段可谈 */
const isForm = computed(() => {
  const type = (props.contentType || '').toLowerCase()
  return type.includes('application/x-www-form-urlencoded') || type.includes('multipart/form-data')
})

const isMultipart = computed(() => (props.contentType || '').toLowerCase().includes('multipart/form-data'))

/** 视图清单：表单只在表单正文时出现，别给 JSON 请求塞一个空页签 */
const VIEWS = computed<Array<{ value: BodyView, label: string }>>(() => {
  const list: Array<{ value: BodyView, label: string }> = [
    { value: 'auto', label: '智能' },
  ]
  if (isForm.value) list.push({ value: 'form', label: '表单' })
  list.push({ value: 'json', label: 'JSON' }, { value: 'text', label: '文本' }, { value: 'hex', label: 'HEX' })
  return list
})

const view = ref<BodyView>('auto')

const rawText = computed(() => props.body ?? '')

/** 去掉截断标记后的正文：JSON / 表单解析要用没被尾巴污染的那一段 */
const cleanText = computed(() => rawText.value.endsWith(TRUNC_MARK)
  ? rawText.value.slice(0, -TRUNC_MARK.length)
  : rawText.value)

/** 后端二进制正文的文本视图是 `HEX <预览>`，此时文本视图没有可读性 */
const binary = computed(() => {
  const text = rawText.value
  if (text.startsWith('HEX ')) return true
  const type = (props.contentType || '').toLowerCase()
  if (!type) return false
  return !/(^text\/)|json|xml|javascript|ecmascript|x-www-form-urlencoded|multipart\/form-data|graphql|yaml|csv/.test(type)
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

/** 后端 hex 列已顶到上限：文件 part 的字节与导出都可能不完整 */
const hexTruncated = computed(() => {
  const hex = props.bodyHex
  if (!hex) return false
  return hex.replace(/[^0-9a-fA-F]/g, '').length >= HEX_KEEP_BYTES * 2
})

/** 表单字段；解析不出来时给空数组（视图会提示切回文本） */
const formFields = computed<FormField[]>(() => {
  if (!isForm.value) return []
  try {
    const type = props.contentType || ''
    if (isMultipart.value) return parseMultipart(bodyBytes.value, type, charsetOf(type))
    // urlencoded：正文可能被判成二进制（异常字节），优先用原始字节还原
    const text = cleanText.value.startsWith('HEX ')
      ? new TextDecoder(charsetOf(type)).decode(bodyBytes.value)
      : cleanText.value
    return parseUrlEncoded(text, charsetOf(type))
  } catch {
    return []
  }
})

/** 表单的可复制形态：name = value，文件 part 标出文件名与大小 */
const formText = computed(() => formFields.value
  .map((f) => (f.filename != null
    ? `${f.name} = <文件 ${f.filename || '(未命名)'} · ${formatBytes(f.bytes || 0)}${f.partType ? ' · ' + f.partType : ''}>`
    : `${f.name} = ${f.value ?? ''}`))
  .join('\n'))

/** 智能视图：表单先按字段展开，再才是 JSON 缩进 / 二进制退 HEX / 文本 */
const activeView = computed<'form' | 'json' | 'text' | 'hex'>(() => {
  if (view.value === 'form' && isForm.value) return 'form'
  if (view.value !== 'auto' && view.value !== 'form') return view.value
  if (isForm.value && formFields.value.length) return 'form'
  if (prettyJson.value) return 'json'
  if (binary.value) return 'hex'
  return 'text'
})

/** 当前视图真正展示的文本（表单视图走结构化渲染，这里只服务复制与其它视图） */
const shownText = computed(() => {
  switch (activeView.value) {
    case 'form':
      return formText.value
    case 'hex':
      return hexText.value
    case 'json':
      return prettyJson.value ?? cleanText.value
    default:
      return cleanText.value
  }
})

/** 说明行：截断原因 / 解析失败 / 二进制提示，没有就不占位 */
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
  if (activeView.value === 'form') {
    if (!formFields.value.length) {
      notes.push('表单解析失败，可切回「文本」看原文。')
    } else if (!props.bodyHex) {
      notes.push('该会话没有原始字节（旧口径），字段值按已解码正文还原，可能与原件有差异。')
    }
    if (rawText.value.endsWith(TRUNC_MARK)) {
      notes.push('正文已按入库上限截断，后面的字段可能缺失。')
    }
    if (hexTruncated.value && formFields.value.some((f) => f.filename != null)) {
      notes.push(`原始字节只保留了前 ${formatBytes(HEX_KEEP_BYTES)}，附件导出可能不完整。`)
    }
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
  if (rawText.value.endsWith(TRUNC_MARK) && activeView.value !== 'hex' && activeView.value !== 'form') {
    notes.push('正文已按入库上限截断。')
  }
  return notes.join(' ')
})

/** 从 Content-Type 里取 charset，缺省 UTF-8；非法名字退回 UTF-8 */
function charsetOf(contentType: string): string {
  const m = /charset\s*=\s*"?([\w.:-]+)"?/i.exec(contentType || '')
  const name = (m?.[1] || 'utf-8').toLowerCase()
  try {
    // TextDecoder 会校验标签并把别名归一（如 UTF8 → utf-8），后面直接拿来解码
    return new TextDecoder(name).encoding
  } catch {
    return 'utf-8'
  }
}

/** 按指定 charset 解码字节；非法序列用替换字符，不整段丢弃 */
function decodeBytes(bytes: Uint8Array, charset: string): string {
  try {
    return new TextDecoder(charset, { fatal: false }).decode(bytes)
  } catch {
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
  }
}

/**
 * 百分号解码：先把 `%XX` 聚成字节，再按 charset 解码。
 *
 * <p>不用 decodeURIComponent 的原因：它只认 UTF-8，GBK 页面提交的表单
 * （老系统里很常见）会直接抛 URIError，反而看不到值。</p>
 */
function percentDecode(input: string, charset: string, plusAsSpace: boolean): string {
  const text = plusAsSpace ? input.replace(/\+/g, ' ') : input
  let out = ''
  let pending: number[] = []
  const flush = () => {
    if (!pending.length) return
    out += decodeBytes(new Uint8Array(pending), charset)
    pending = []
  }
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '%' && /^[0-9a-fA-F]{2}$/.test(text.slice(i + 1, i + 3))) {
      pending.push(parseInt(text.slice(i + 1, i + 3), 16))
      i += 2
      continue
    }
    flush()
    out += ch
  }
  flush()
  return out
}

/**
 * 解析 application/x-www-form-urlencoded。
 *
 * <p>分隔符按 `&` 切；历史实现里也有 `;` 当分隔符的，整段没有 `&` 时再按 `;` 兜底。
 * 段内只按<b>第一个</b> `=` 切，值里再出现 `=` 不会被截断。</p>
 */
function parseUrlEncoded(text: string, charset: string): FormField[] {
  const body = text.trim()
  if (!body) return []
  const parts = body.includes('&') ? body.split('&') : body.split(';')
  const fields: FormField[] = []
  for (const seg of parts) {
    if (!seg) continue
    const eq = seg.indexOf('=')
    const rawName = eq < 0 ? seg : seg.slice(0, eq)
    const rawValue = eq < 0 ? '' : seg.slice(eq + 1)
    const name = percentDecode(rawName, charset, true)
    // 没有字段名的段没有展示价值，但也别丢：用序号占位，方便对照原件
    fields.push({ name: name || `(第 ${fields.length + 1} 段)`, value: percentDecode(rawValue, charset, true) })
  }
  return fields
}

/** 从 multipart 的 Content-Type 里取 boundary；带引号 / 不带引号都认 */
function boundaryOf(contentType: string): string {
  const m = /boundary\s*=\s*(?:"([^"]+)"|([^;]+))/i.exec(contentType || '')
  return (m?.[1] || m?.[2] || '').trim()
}

/** 字节 → 单字节字符串：用它才能在原始字节里按 boundary 找位置 */
function bytesToLatin1(bytes: Uint8Array): string {
  let out = ''
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    out += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return out
}

/** 单字节字符串 → 字节（与 bytesToLatin1 互逆） */
function latin1ToBytes(text: string): Uint8Array {
  const out = new Uint8Array(text.length)
  for (let i = 0; i < text.length; i++) {
    out[i] = text.charCodeAt(i) & 0xff
  }
  return out
}

/** 一段字节的十六进制预览（大写、空格分隔，超出上限加省略号） */
function previewHex(bytes: Uint8Array, limit: number): string {
  const slice = bytes.subarray(0, limit)
  const hex = Array.from(slice, (b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
  return bytes.length > limit ? `${hex} …` : hex
}

/**
 * 解析 multipart/form-data。
 *
 * <p>必须在原始字节上切 boundary：文件 part 里出现 `\r\n--` 这种字节序列时，
 * 先按文本解码再切会把二进制切坏，还可能把 UTF-8 的多字节序列切断。</p>
 */
function parseMultipart(bytes: Uint8Array, contentType: string, charset: string): FormField[] {
  const boundary = boundaryOf(contentType)
  if (!boundary || !bytes.length) return []
  const raw = bytesToLatin1(bytes)
  const delim = `--${boundary}`
  const fields: FormField[] = []
  let cursor = raw.indexOf(delim)
  if (cursor < 0) return []
  while (cursor >= 0) {
    const next = raw.indexOf(delim, cursor + delim.length)
    if (next < 0) break
    let chunk = raw.slice(cursor + delim.length, next)
    cursor = next
    // 收尾分隔符：--boundary--
    if (chunk.startsWith('--')) break
    // 每个 part 以 CRLF 开头，body 再以 CRLF 收尾（属于分隔符的）
    if (chunk.startsWith('\r\n')) chunk = chunk.slice(2)
    let headText = ''
    let bodyText = ''
    const headEnd = chunk.indexOf('\r\n\r\n')
    if (headEnd < 0) {
      // 只有头没有 body（空值字段）：整段都是头
      headText = chunk.replace(/\r\n$/, '')
    } else {
      headText = chunk.slice(0, headEnd)
      bodyText = chunk.slice(headEnd + 4)
      if (bodyText.endsWith('\r\n')) bodyText = bodyText.slice(0, -2)
    }
    const name = /name\s*=\s*(?:"([^"]*)"|([^;\r\n]+))/i.exec(headText)
    const filename = /filename\s*=\s*(?:"([^"]*)"|([^;\r\n]+))/i.exec(headText)
    const partType = /content-type\s*:\s*([^\r\n]+)/i.exec(headText)?.[1]?.trim() || ''
    const fieldName = (name?.[1] ?? name?.[2] ?? '').trim() || `(第 ${fields.length + 1} 部分)`
    const fileName = (filename?.[1] ?? filename?.[2] ?? '').trim()
    const bodyBytesPart = latin1ToBytes(bodyText)
    const hasFile = /filename\s*=/i.test(headText)
    if (hasFile) {
      fields.push({
        name: fieldName,
        filename: fileName,
        partType: partType || undefined,
        bytes: bodyBytesPart.length,
        hex: bodyBytesPart.length ? previewHex(bodyBytesPart, PART_HEX_PREVIEW) : '',
        data: bodyBytesPart,
      })
      continue
    }
    const isTextPart = !partType || /^text\/|json|xml|x-www-form-urlencoded/i.test(partType)
    if (!isTextPart) {
      fields.push({ name: fieldName, binary: true, partType, bytes: bodyBytesPart.length })
      continue
    }
    fields.push({
      name: fieldName,
      value: decodeBytes(bodyBytesPart, partType ? charsetOf(partType) : charset),
    })
  }
  return fields
}

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

/**
 * 导出表单里的文件 part。
 *
 * <p>字节来自后端 {@code httpBodyHex}（与正文同源），不是把文本重新编码——
 * 附件里的二进制必须按原始字节写回，否则 Excel/图片一律打不开。</p>
 */
function download(field: FormField) {
  const bytes = field.data
  if (!bytes || !bytes.length) {
    message.warning('该 part 没有可导出的字节')
    return
  }
  // 复制一份再取 ArrayBuffer：避免把视图缓冲直接交给 Blob，类型上也更稳
  const copyBytes = new Uint8Array(bytes.length)
  copyBytes.set(bytes)
  const blob = new Blob([copyBytes.buffer], { type: field.partType || 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = safeFileName(field.filename || 'attachment.bin')
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // 立刻 revoke 会让部分浏览器来不及取数据，延后释放
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
  if (hexTruncated.value) {
    message.warning('只导出了抓到的部分字节，原件可能更长')
  } else {
    message.success('已导出 ' + anchor.download)
  }
}

/** 去掉路径分隔符与 Windows 非法字符：有些客户端的 filename 带完整本地路径 */
function safeFileName(name: string): string {
  const cleaned = name
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
    .replace(/^\.+/, '')
    .trim()
  return cleaned || 'attachment.bin'
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

/* 表单视图：字段名进列，值可换行复制；文件 part 用标签区分，不塞进正文 */
.http-form {
  padding: 8px 12px;
  background: var(--el-fill-color-lighter);
  border-radius: var(--el-radius-sm, 6px);
  overflow: auto;
  max-height: 220px;
}
.http-form__empty {
  margin: 0;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
.http-form__row {
  display: flex;
  gap: 10px;
  align-items: baseline;
  padding: 3px 0;
  border-bottom: 1px dashed var(--el-border-color-lighter);
}
.http-form__row:last-child {
  border-bottom: 0;
}
.http-form__name {
  flex: 0 0 auto;
  max-width: 40%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-size: 11px;
  font-weight: 600;
  color: var(--el-color-primary);
}
.http-form__value {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 11px;
  line-height: 1.55;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
  word-break: break-all;
}
.http-form__file {
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
}
.http-form__tag {
  display: inline-block;
  margin-left: 6px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  font-size: 10px;
  line-height: 16px;
}
.http-form__hex {
  display: block;
  margin-top: 2px;
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-size: 10px;
  color: var(--el-text-color-secondary);
  word-break: break-all;
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
