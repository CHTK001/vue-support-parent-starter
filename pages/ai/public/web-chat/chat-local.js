/**
 * Web 浏览器推理 · 本地对话模型（transformers.js）
 *
 * 真实浏览器端文本推理：@huggingface/transformers（ONNX Runtime Web，
 * WebGPU 优先、WASM 兜底），权重按需下载。契约同 echo-demo.js：
 * ES Module 默认导出 createClient(modelInfo)，返回 { load?, chat, dispose? }。
 *
 * 模型与参数可通过模型行的 js_path 查询参数覆盖，例如：
 *   /web-chat/chat-local.js?model=onnx-community/Qwen2.5-0.5B-Instruct&max_new_tokens=512
 * 默认模型 HuggingFaceTB/SmolLM2-135M-Instruct（q4f16 量化约 100MB，中文能力
 * 有限但体积小、加载快；需要中文质量请换 Qwen2.5-0.5B 等模型行）。
 *
 * 权重源：默认走 hf-mirror.com（HuggingFace 的大陆可达镜像）；若自托管权重，
 * 把模型行的 js_path 加 ?endpoint=https://你的镜像/ 即可。
 */

import { importFirst, streamOut } from './_shared.js'

const CDN = [
  'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.5/dist/transformers.min.js',
  'https://unpkg.com/@huggingface/transformers@3.7.5/dist/transformers.min.js',
  'https://esm.sh/@huggingface/transformers@3.7.5',
]

/** 默认模型（小体积优先；可被 js_path 查询参数覆盖） */
const DEFAULT_MODEL = 'HuggingFaceTB/SmolLM2-135M-Instruct'
const DEFAULT_MAX_NEW_TOKENS = 256

/** js_path 上的查询参数（模型行配置入口）：/web-chat/chat-local.js?model=xxx&max_new_tokens=512&endpoint=... */
function pathOptions() {
  try {
    const url = new URL(import.meta.url, (typeof location !== 'undefined' && location.href) || 'http://localhost/')
    return url.searchParams
  } catch (e) {
    return new URLSearchParams()
  }
}

export default function createClient(modelInfo) {
  const name = (modelInfo && (modelInfo.name || modelInfo.id)) || 'web-chat-local'
  const q = pathOptions()
  const modelId = q.get('model') || DEFAULT_MODEL
  const maxNewTokens = Number(q.get('max_new_tokens') || DEFAULT_MAX_NEW_TOKENS) || DEFAULT_MAX_NEW_TOKENS
  const endpoint = q.get('endpoint') || ''
  /** @type {any} */
  let pipe = null
  /** @type {any} */
  let T = null

  /**
   * 懒加载推理管线（首次 chat 时建，之后复用）。
   * 加载进度经 report 回调吐给会话正文，让用户看得见「正在下载权重」。
   */
  async function ensurePipeline(report) {
    if (pipe) return pipe
    T = await importFirst(CDN)
    if (endpoint) {
      T.env.remoteHost = endpoint
    } else {
      // HuggingFace 官方源在大陆不可达，默认走镜像；自托管权重时用 endpoint 覆盖
      T.env.remoteHost = 'https://hf-mirror.com'
    }
    T.env.allowLocalModels = false
    const device = (typeof navigator !== 'undefined' && navigator.gpu) ? 'webgpu' : 'wasm'
    let lastBucket = -1
    pipe = await T.pipeline('text-generation', modelId, {
      dtype: 'q4f16',
      device,
      progress_callback: (p) => {
        if (!report || !p || p.status !== 'progress' || typeof p.progress !== 'number') return
        const bucket = Math.floor(p.progress / 20) * 20
        if (bucket > lastBucket) {
          lastBucket = bucket
          report('⏳ 权重下载 ' + bucket + '%（' + modelId + '）')
        }
      },
    })
    return pipe
  }

  return {
    /** 可选预热：无操作，权重在首次对话时按需加载 */
    async load() {},

    /**
     * 对话：把用户输入交给本地模型，流式回吐生成 token。
     *
     * @param {Array<{role:string,content:string}>} messages 会话消息（webChatClient 传本轮用户输入）
     * @param {{onDelta?:(chunk:string)=>void, signal?:AbortSignal}} opts
     * @returns {Promise<string>} 全文
     */
    async chat(messages, opts = {}) {
      const onDelta = typeof opts.onDelta === 'function' ? opts.onDelta : null
      const signal = opts.signal
      const last = (messages && messages.length) ? messages[messages.length - 1] : null
      const userText = String((last && (last.content ?? last.text)) ?? '').trim() || '（没有输入）'

      const report = (line) => { if (onDelta) onDelta('\n' + line + '\n') }
      report('⏳ [' + name + '] 正在初始化浏览器推理（' + modelId + '，首次需下载权重）…')

      const p = await ensurePipeline((line) => report(line))
      if (signal && signal.aborted) throw new Error('aborted')
      report('✅ 运行时就绪（' + ((typeof navigator !== 'undefined' && navigator.gpu) ? 'WebGPU' : 'WASM') + '），开始生成…\n')

      const chatInput = [
        { role: 'system', content: 'You are a helpful AI model running locally inside the user\'s browser. Reply in the same language as the user. Be concise and honest; if you do not know something, say so.' },
        { role: 'user', content: userText },
      ]
      let full = ''
      const streamer = new T.TextStreamer(p.tokenizer, {
        skip_prompt: true,
        skip_special_tokens: true,
        callback_function: (t) => {
          if (signal && signal.aborted) throw new Error('aborted')
          if (t) { full += t; if (onDelta) onDelta(t) }
        },
      })
      const ret = await p(chatInput, {
        max_new_tokens: maxNewTokens,
        streamer,
        do_sample: true,
        temperature: 0.7,
        top_p: 0.9,
        repetition_penalty: 1.1,
      })
      // 个别运行时 streamer 不出流：从 pipeline 返回值兜底取生成文本，一次性吐出
      if (!full && ret && ret[0] && Array.isArray(ret[0].generated_text)) {
        const gen = ret[0].generated_text
        const lastMsg = gen[gen.length - 1]
        const text = String((lastMsg && lastMsg.content) || '').trim()
        if (text) full = await streamOut(text, onDelta, { signal, step: 24, delay: 12 })
      }
      return full
    },

    dispose() {
      // transformers.js 管线无显式释放 API；置空等待 GC
      pipe = null
      T = null
    },
  }
}
