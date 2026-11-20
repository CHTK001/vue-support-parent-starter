/**
 * Web 浏览器推理 · 公共工具（供 /web-chat/ 下的模型脚本复用）
 *
 * 本目录下的脚本由前端 webChatClient 动态 import，运行在浏览器页面里；
 * 这里只放「纯浏览器」能力：动态加载 CDN 依赖、读会话附件图片、
 * 把识别/生成结果按小块流式吐回 onDelta。
 *
 * 约定：所有函数都是无副作用工具，不持有模型状态；模型状态由各脚本自己的
 * createClient 闭包管理（见 echo-demo.js 的契约注释）。
 */

/**
 * 依次尝试动态 import，返回第一个加载成功的模块。
 *
 * 浏览器端推理库与权重都在公网 CDN，单一源不可达时自动换下一个；
 * 全部失败时把每个候选的报错一并抛出，方便定位是网络问题还是路径问题。
 *
 * @param {string[]} candidates 候选 ESM URL（从优到劣）
 * @returns {Promise<any>} 第一个成功的模块命名空间
 */
export async function importFirst(candidates) {
  const errors = []
  for (const url of candidates) {
    try {
      return await import(url)
    } catch (e) {
      errors.push(url + ' → ' + String((e && e.message) || e))
    }
  }
  throw new Error('依赖库加载失败（请检查浏览器网络/CDN 可达性）:\n' + errors.join('\n'))
}

/**
 * 读取会话附件图片：POST /api/fs/image-base64，返回 base64 字符串。
 *
 * 会话发送链路里 userMessage.files 是后端落盘后的绝对路径（fileIds），
 * 这里按路径读回文件内容。响应信封兼容 {data:...} 与裸字符串两种形态。
 *
 * @param {string} path 后端文件路径（fileIds 元素）
 * @returns {Promise<string>} base64（无文件时为空串）
 */
export async function fetchImageBase64(path) {
  const res = await fetch('/api/fs/image-base64', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: String(path || '') }),
  })
  if (!res.ok) throw new Error('读取附件失败：HTTP ' + res.status)
  const body = await res.json()
  const data = body && body.data != null ? body.data : body
  return typeof data === 'string' ? data : ''
}

/** base64 → dataURL（按文件头嗅探 MIME，默认按 PNG 处理） */
export function base64ToDataUrl(b64) {
  const s = String(b64 || '').replace(/^data:[^;]+;base64,/, '')
  let mime = 'image/png'
  if (s.startsWith('/9j/')) mime = 'image/jpeg'
  else if (s.startsWith('R0lGOD')) mime = 'image/gif'
  else if (s.startsWith('UklGR')) mime = 'image/webp'
  else if (s.startsWith('iVBORw0KGgo')) mime = 'image/png'
  return 'data:' + mime + ';base64,' + s
}

/**
 * 从「消息文本 + 会话附件」里解析出全部图片 dataURL。
 *
 * <p>优先取消息 content 里内嵌的 data:image（多模态消息直接携带），
 * 再把附件 fileIds 逐个经 /api/fs/image-base64 读回；单个附件读取失败
 * 只告警不中断，尽量把可用的图都交给模型脚本。</p>
 *
 * @param {Array<{content?:string,text?:string}>} messages 会话消息（webChatClient 只传本轮用户输入）
 * @param {Array<string|{path?:string,url?:string,id?:string}>} files 会话附件（fileIds / 路径）
 * @returns {Promise<string[]>} dataURL 数组
 */
export async function resolveInputImages(messages, files) {
  const out = []
  const seen = new Set()
  const push = (dataUrl) => {
    if (dataUrl && !seen.has(dataUrl)) { seen.add(dataUrl); out.push(dataUrl) }
  }
  const re = /data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g
  for (const m of Array.isArray(messages) ? messages : []) {
    const text = String((m && (m.content ?? m.text)) ?? '')
    for (const hit of text.match(re) || []) push(hit)
  }
  for (const f of Array.isArray(files) ? files : []) {
    const path = typeof f === 'string' ? f : String((f && (f.path ?? f.url ?? f.id)) ?? '')
    if (!path) continue
    try {
      const b64 = await fetchImageBase64(path)
      if (b64) push(base64ToDataUrl(b64))
    } catch (e) {
      console.warn('[web-chat] 附件读取失败，跳过:', path, e)
    }
  }
  return out
}

/** dataURL → HTMLImageElement（解码失败 reject） */
export function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片解码失败（文件可能不是有效图片）'))
    img.src = dataUrl
  })
}

/** 取消息数组里最后一条非空用户文本 */
export function lastUserText(messages) {
  const arr = Array.isArray(messages) ? messages : []
  for (let i = arr.length - 1; i >= 0; i--) {
    const c = arr[i] && (arr[i].content ?? arr[i].text)
    if (typeof c === 'string' && c.trim()) return c.trim()
  }
  return ''
}

/**
 * 把整段文本按小块流式吐给 onDelta（模拟 token 流的观感）。
 *
 * @param {string} text 全文
 * @param {(chunk:string)=>void} [onDelta] 增量回调
 * @param {{step?:number,delay?:number,signal?:AbortSignal}} [opts] step=每块码元数，delay=块间毫秒
 * @returns {Promise<string>} 原文（便于 chat 返回全文）
 */
export async function streamOut(text, onDelta, opts = {}) {
  const step = opts.step || 36
  const delay = opts.delay == null ? 15 : opts.delay
  const signal = opts.signal
  const on = typeof onDelta === 'function' ? onDelta : null
  const full = String(text || '')
  if (!on) return full
  const chars = Array.from(full)
  for (let i = 0; i < chars.length; i += step) {
    if (signal && signal.aborted) throw new Error('aborted')
    on(chars.slice(i, i + step).join(''))
    if (delay) await new Promise((r) => setTimeout(r, delay))
  }
  return full
}

/** 睡眠（脚本内节奏控制用） */
export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}
