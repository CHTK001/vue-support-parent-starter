/**
 * Web 浏览器推理 · OCR 文字识别（Tesseract.js）
 *
 * 真实浏览器端 OCR：Tesseract.js（WASM 版 Tesseract），支持中英文。
 * 图片来自会话附件（fileIds → /api/fs/image-base64 读回）或消息内嵌 dataURL。
 * 契约同 echo-demo.js：默认导出 createClient(modelInfo) → { chat }。
 *
 * 语言包：默认 chi_sim+eng。语言包体积较大（chi_sim 约 10~20MB），首次使用
 * 需下载并缓存（IndexedDB）；语言包源可经 js_path 查询参数覆盖：
 *   /web-chat/ocr.js?langs=chi_sim+eng&lang_path=https://你的镜像/tessdata
 */

import { importFirst, resolveInputImages, sleep } from './_shared.js'

const CDN = [
  'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.esm.min.js',
  'https://unpkg.com/tesseract.js@5.1.1/dist/tesseract.esm.min.js',
  'https://esm.sh/tesseract.js@5.1.1',
]

/** 语言包候选源：按序探测，取第一个能取到 chi_sim 包的 */
const LANG_PATH_CANDIDATES = [
  'https://tessdata.projectnaptha.com/4.0.0',
  'https://cdn.jsdelivr.net/npm/tessdata@1.0.0',
]

/** js_path 查询参数：/web-chat/ocr.js?langs=chi_sim+eng&lang_path=... */
function pathOptions() {
  try {
    const url = new URL(import.meta.url, (typeof location !== 'undefined' && location.href) || 'http://localhost/')
    return url.searchParams
  } catch (e) {
    return new URLSearchParams()
  }
}

/** 探测语言包目录：Tesseract 会到 <langPath>/<lang>.traineddata.gz 拉包 */
async function pickLangPath(preferred) {
  const candidates = []
  if (preferred) candidates.push(preferred)
  candidates.push(...LANG_PATH_CANDIDATES)
  for (const base of candidates) {
    try {
      const res = await fetch(base.replace(/\/$/, '') + '/chi_sim.traineddata.gz', { method: 'HEAD' })
      if (res.ok) return base
    } catch (e) { /* 换下一个源 */ }
  }
  // 都探不通时仍返回默认源，让 Tesseract 自己报错（错误信息更具体）
  return candidates[0]
}

/** 兼容 tesseract.js 不同构建的导出形态：tesseract.esm.min.js 只导出 default（CJS 互操作产物），createWorker 挂在 default 上 */
function pickTesseract(mod) {
  const cands = [mod, mod && mod.default, mod && mod.default && mod.default.default]
  for (const c of cands) {
    if (c && typeof c.createWorker === 'function') return c
  }
  throw new Error('tesseract.js 加载异常：未找到 createWorker 导出（keys=' +
    Object.keys((mod && mod.default) || mod || {}).slice(0, 12).join(',') + '）')
}

export default function createClient(modelInfo) {
  const name = (modelInfo && (modelInfo.name || modelInfo.id)) || 'web-ocr'
  const q = pathOptions()
  const langs = q.get('langs') || 'chi_sim+eng'
  const langPathPreferred = q.get('lang_path') || ''

  return {
    async load() {},

    /**
     * OCR：识别会话里的第一张图片，按行流式输出文本。
     *
     * @param {Array<{role:string,content:string}>} messages 会话消息
     * @param {{onDelta?:(chunk:string)=>void, signal?:AbortSignal, files?:Array<string|{path?:string}>}} opts
     * @returns {Promise<string>} 识别出的全文
     */
    async chat(messages, opts = {}) {
      const onDelta = typeof opts.onDelta === 'function' ? opts.onDelta : null
      const signal = opts.signal
      const images = await resolveInputImages(messages, opts.files)
      if (!images.length) {
        throw new Error('没有可识别的图片：请先在输入框上传图片附件（jpg/png 等），再发送。')
      }

      if (onDelta) onDelta('⏳ [' + name + '] 正在加载 OCR 引擎与语言包（' + langs + '，首次较慢）…\n')
      const T = pickTesseract(await importFirst(CDN))
      const langPath = await pickLangPath(langPathPreferred)
      if (signal && signal.aborted) throw new Error('aborted')
      if (onDelta) onDelta('✅ 引擎就绪，开始识别（语言包源：' + langPath + '）\n\n')

      const worker = await T.createWorker(langs, 1, {
        langPath,
        logger: () => { /* 进度不进正文，避免刷屏；识别节奏由 streamOut 控制 */ },
      })
      try {
        const { data } = await worker.recognize(images[0])
        if (signal && signal.aborted) throw new Error('aborted')
        const text = String((data && data.text) || '').replace(/\n{3,}/g, '\n\n').trim()
        if (!text) {
          const hint = '（未识别出文字：图片可能过模糊、无文字，或语言包不匹配）'
          if (onDelta) onDelta(hint)
          return hint
        }
        // 按行流式输出，观感接近「逐行读出」
        const lines = text.split(/\r?\n/).filter((s) => s.trim().length)
        for (const line of lines) {
          if (signal && signal.aborted) throw new Error('aborted')
          if (onDelta) onDelta(line + '\n')
          await sleep(24)
        }
        const conf = data && typeof data.confidence === 'number' ? data.confidence.toFixed(1) : '—'
        const tail = '\n\n——\n识别完成：' + lines.length + ' 行，平均置信度 ' + conf + '%'
        if (onDelta) onDelta(tail)
        return text
      } finally {
        try { await worker.terminate() } catch (e) { /* 释放失败不影响结果 */ }
      }
    },

    dispose() {},
  }
}
