/**
 * Web 浏览器推理 · 图片上色（DDColor fp16 ONNX）
 *
 * 真实浏览器端图像上色：onnxruntime-web（WebGPU 优先、WASM 兜底）加载
 * DDColor fp16 ONNX 单文件权重（约 108MB，Apache-2.0，源自 Qualcomm AI Hub
 * 的 DDColor 导出，与 wavespeed 免费上色工具同源），把黑白/灰度照片还原成
 * 彩色。结果以 Markdown 图片（dataURL）直接进会话正文。
 *
 * 前后处理遵循 Qualcomm DDColorApp 的权威口径：
 *   预处理：图片 → [0,1] → sRGB→Lab 取 L 通道；缩放到 256×256；
 *           Lab(L,0,0)→RGB 得三通道「灰度图」作为模型输入 [1,3,256,256]。
 *   推理：  output [1,2,256,256] = 预测的 a/b 色度通道（Lab 域）。
 *   后处理：ab 上采样回原图尺寸 → 与原图 L 通道拼接 → Lab→sRGB 输出。
 *
 * 与 image-gen.js 的差异：上色结果的 dataURL 是照片级大图（数百 KB~数 MB），
 * 走 streamOut 的逐块节奏会拖到分钟级，因此状态行走 onDelta、图片 Markdown
 * 整块一次吐出（SSE 对单块大小无限制，前端按 Markdown 渲染成图）。
 *
 * 契约同 echo-demo.js：默认导出 createClient(modelInfo) → { chat, dispose? }。
 * 权重与参数可经模型行 js_path 查询参数覆盖：
 *   /web-chat/colorize.js?model=<权重URL>&fmt=jpeg|png&max=2048&ep=webgpu|wasm
 * 权重源：默认走 hf-mirror.com（HuggingFace 大陆镜像）；自托管权重直接把
 * model 参数换成同源 URL 即可。
 */

import { importFirst, resolveInputImages, loadImage } from './_shared.js'

/** onnxruntime-web CDN（多候选依次兜底） */
const ORT_CDN = [
  'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/ort.min.js',
  'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/ort.min.js',
  'https://unpkg.com/onnxruntime-web@1.20.1/dist/ort.min.js',
  'https://esm.sh/onnxruntime-web@1.20.1',
]

/** ort 的 wasm 运行时文件目录（jsdelivr，与 import 候选解耦，CORS 均放行） */
const ORT_WASM_PATHS = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/'

/** 默认权重：DDColor fp16 ONNX（单文件，sha256 40ff5091…bab73c） */
const DEFAULT_MODEL_URL =
  'https://hf-mirror.com/wavespeed/image-colorizer/resolve/main/ddcolor-fp16.onnx'

/** js_path 查询参数：/web-chat/colorize.js?model=...&fmt=jpeg&max=2048&ep=auto */
function pathOptions() {
  try {
    const url = new URL(import.meta.url, (typeof location !== 'undefined' && location.href) || 'http://localhost/')
    return url.searchParams
  } catch (e) {
    return new URLSearchParams()
  }
}

/* ---------------- 颜色空间：sRGB ↔ Lab（D65，与 OpenCV 浮点口径一致） ---------------- */

const XN = 0.95047, YN = 1.0, ZN = 1.08883

function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}
function linearToSrgb(c) {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
}
function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

/** rgb（各分量 [0,1]）→ [L(0..100), a, b]（a/b 约 -127..127） */
function rgb2lab(r, g, b) {
  const R = srgbToLinear(r), G = srgbToLinear(g), B = srgbToLinear(b)
  const X = (0.4124564 * R + 0.3575761 * G + 0.1804375 * B) / XN
  const Y = (0.2126729 * R + 0.7151522 * G + 0.0721750 * B) / YN
  const Z = (0.0193339 * R + 0.1191920 * G + 0.9503041 * B) / ZN
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  const fx = f(X), fy = f(Y), fz = f(Z)
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

/** [L,a,b] → rgb（各分量 [0,1]） */
function lab2rgb(L, a, b) {
  const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200
  const finv = (t) => (t * t * t > 0.008856 ? t * t * t : (t - 16 / 116) / 7.787)
  const X = finv(fx) * XN, Y = finv(fy) * YN, Z = finv(fz) * ZN
  const R = 3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z
  const G = -0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z
  const B = 0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z
  return [clamp01(linearToSrgb(R)), clamp01(linearToSrgb(G)), clamp01(linearToSrgb(B))]
}

/** ImageData → 原尺寸 L 通道 Float32Array（每像素 rgb2lab 取 L） */
function imageDataToL(data) {
  const n = data.length / 4
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    out[i] = rgb2lab(data[i * 4] / 255, data[i * 4 + 1] / 255, data[i * 4 + 2] / 255)[0]
  }
  return out
}

/**
 * ImageData（size×size）→ DDColor 输入张量 [1,3,size,size]：
 * RGB→Lab 仅保留 L → Lab(L,0,0)→RGB 得三通道「灰度图」，NCHW 排布。
 */
function imageDataToGrayTensor(data, size) {
  const n = size * size
  const out = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const L = rgb2lab(data[i * 4] / 255, data[i * 4 + 1] / 255, data[i * 4 + 2] / 255)[0]
    const rgb = lab2rgb(L, 0, 0)
    out[i] = rgb[0]
    out[n + i] = rgb[1]
    out[2 * n + i] = rgb[2]
  }
  return out
}

/** 双线性上采样 ab 双通道（模型输出 size×size → 原图 w×h） */
function upsampleAB(ab, size, w, h) {
  const a = new Float32Array(w * h)
  const b = new Float32Array(w * h)
  const sx = size / w, sy = size / h
  const plane = size * size
  for (let y = 0; y < h; y++) {
    const gy = Math.min(size - 1, Math.max(0, (y + 0.5) * sy - 0.5))
    const y0 = Math.floor(gy)
    const y1 = Math.min(size - 1, y0 + 1)
    const wy = gy - y0
    for (let x = 0; x < w; x++) {
      const gx = Math.min(size - 1, Math.max(0, (x + 0.5) * sx - 0.5))
      const x0 = Math.floor(gx)
      const x1 = Math.min(size - 1, x0 + 1)
      const wx = gx - x0
      const i00 = y0 * size + x0, i01 = y0 * size + x1
      const i10 = y1 * size + x0, i11 = y1 * size + x1
      const wa = (1 - wx) * (1 - wy), wb = wx * (1 - wy), wc = (1 - wx) * wy, wd = wx * wy
      const o = y * w + x
      a[o] = ab[i00] * wa + ab[i01] * wb + ab[i10] * wc + ab[i11] * wd
      b[o] = ab[plane + i00] * wa + ab[plane + i01] * wb + ab[plane + i10] * wc + ab[plane + i11] * wd
    }
  }
  return { a, b }
}

/** 画布工具：把图片画到指定尺寸并取 ImageData 的像素数据 */
function drawToImageData(img, w, h) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, w, h)
  return ctx.getImageData(0, 0, w, h).data
}

/** 下载权重并回报进度（ReadableStream 分块累计；小响应直接 arrayBuffer） */
async function fetchModelBytes(url, onProgress, signal) {
  const resp = await fetch(url, { signal })
  if (!resp.ok) throw new Error('权重下载失败: HTTP ' + resp.status + '（' + url + '）')
  const total = Number(resp.headers.get('content-length') || 0)
  if (!resp.body || !total) return new Uint8Array(await resp.arrayBuffer())
  const reader = resp.body.getReader()
  const chunks = []
  let loaded = 0
  let lastEmit = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    loaded += value.length
    if (onProgress && loaded - lastEmit > 8 * 1024 * 1024) {
      lastEmit = loaded
      onProgress(loaded, total)
    }
  }
  const out = new Uint8Array(loaded)
  let off = 0
  for (const c of chunks) {
    out.set(c, off)
    off += c.length
  }
  return out
}

export default function createClient(modelInfo) {
  const name = (modelInfo && (modelInfo.name || modelInfo.id)) || 'web-colorize'
  const q = pathOptions()
  const modelUrl = q.get('model') || DEFAULT_MODEL_URL
  // 该 fp16 导出为固定 256×256 输入；size 参数留给未来换动态尺寸权重用
  const size = Number(q.get('size')) > 0 ? Number(q.get('size')) : 256
  // 原图超过 max 边长时先等比缩小，控制后处理耗时与会话载荷
  const maxDim = Math.min(4096, Math.max(256, Number(q.get('max') || 2048)))
  const epPref = (q.get('ep') || 'auto').toLowerCase()
  const fmt = q.get('fmt') === 'png' ? 'image/png' : 'image/jpeg'
  const fmtQuality = fmt === 'image/jpeg' ? 0.92 : undefined

  let ort = null
  let session = null
  let usingEP = ''

  /** 懒加载：拉库 → 下载权重 → 创建推理会话（WebGPU 优先，失败回退 WASM） */
  async function ensureSession(emit, signal) {
    if (session) return
    const mod = await importFirst(ORT_CDN)
    const lib = mod && mod.InferenceSession ? mod : mod.default
    if (!lib || !lib.InferenceSession) {
      throw new Error('onnxruntime-web 加载失败：库未正确挂载（检查 CDN 可达性）')
    }
    ort = lib
    try {
      ort.env.wasm.wasmPaths = ORT_WASM_PATHS
    } catch (e) { /* 某些构建的 env 只读，忽略 */ }

    emit('⏳ [' + name + '] 正在下载 DDColor fp16 权重（约 108MB，首次较慢）…\n')
    const bytes = await fetchModelBytes(modelUrl, (loaded, total) => {
      const pct = total ? Math.floor((loaded / total) * 100) : 0
      emit('　下载进度 ' + pct + '%（' + Math.round(loaded / 1048576) + 'MB）\n')
    }, signal)
    if (signal && signal.aborted) throw new Error('aborted')

    const hasWebGPU = typeof navigator !== 'undefined' && !!navigator.gpu
    const candidates = epPref === 'wasm' || !hasWebGPU
      ? ['wasm']
      : epPref === 'webgpu' ? ['webgpu'] : ['webgpu', 'wasm']
    let lastErr = null
    for (const ep of candidates) {
      try {
        emit('⏳ 正在以 ' + ep.toUpperCase() + ' 初始化推理会话…\n')
        session = await ort.InferenceSession.create(bytes, { executionProviders: [ep] })
        usingEP = ep
        break
      } catch (e) {
        lastErr = e
        session = null
      }
    }
    if (!session) {
      throw new Error('推理会话创建失败（WebGPU/WASM 均不可用）: ' + String((lastErr && lastErr.message) || lastErr))
    }
    emit('✅ 模型就绪（' + usingEP.toUpperCase() + '）\n\n')
  }

  return {
    async load() { /* 权重懒加载放在首帧 chat 时进行，便于把下载进度吐进会话 */ },

    /**
     * 图片上色：对会话里的第一张图片做 DDColor 推理，流式输出结果图。
     *
     * @param {Array<{role:string,content:string}>} messages 会话消息
     * @param {{onDelta?:(chunk:string)=>void, signal?:AbortSignal, files?:Array<string|{path?:string}>}} opts
     * @returns {Promise<string>} 结果全文
     */
    async chat(messages, opts = {}) {
      const onDelta = typeof opts.onDelta === 'function' ? opts.onDelta : null
      const signal = opts.signal
      const emit = (s) => { if (onDelta) onDelta(s) }

      const images = await resolveInputImages(messages, opts.files)
      if (!images.length) {
        throw new Error('没有可上色的图片：请先在输入框上传图片附件，再发送。')
      }

      await ensureSession(emit, signal)
      if (signal && signal.aborted) throw new Error('aborted')

      const img = await loadImage(images[0])
      const iw = img.naturalWidth || img.width
      const ih = img.naturalHeight || img.height
      if (!iw || !ih) throw new Error('图片尺寸无效')
      const scale = Math.min(1, maxDim / iw, maxDim / ih)
      const w = Math.max(1, Math.round(iw * scale))
      const h = Math.max(1, Math.round(ih * scale))

      emit('⏳ 预处理：sRGB→Lab（' + w + '×' + h + '），输入缩放 ' + size + '×' + size + '…\n')
      const origL = imageDataToL(drawToImageData(img, w, h))
      const tensorData = imageDataToGrayTensor(drawToImageData(img, size, size), size)
      if (signal && signal.aborted) throw new Error('aborted')

      emit('⏳ 推理中（' + usingEP.toUpperCase() + '）…\n')
      const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())
      const t0 = now()
      const inputName = (session.inputNames && session.inputNames[0]) || 'input'
      const outputName = (session.outputNames && session.outputNames[0]) || 'output'
      const results = await session.run({
        [inputName]: new ort.Tensor('float32', tensorData, [1, 3, size, size]),
      })
      const inferMs = Math.round(now() - t0)
      if (signal && signal.aborted) throw new Error('aborted')
      const ab = results[outputName].data
      emit('✅ 推理完成（' + inferMs + 'ms）\n')

      emit('⏳ 后处理：ab 上采样 → Lab 合成 → sRGB…\n')
      const { a, b } = upsampleAB(ab, size, w, h)
      const outCanvas = document.createElement('canvas')
      outCanvas.width = w
      outCanvas.height = h
      const octx = outCanvas.getContext('2d')
      const outData = octx.createImageData(w, h)
      for (let i = 0; i < w * h; i++) {
        const rgb = lab2rgb(origL[i], a[i], b[i])
        outData.data[i * 4] = Math.round(rgb[0] * 255)
        outData.data[i * 4 + 1] = Math.round(rgb[1] * 255)
        outData.data[i * 4 + 2] = Math.round(rgb[2] * 255)
        outData.data[i * 4 + 3] = 255
      }
      octx.putImageData(outData, 0, 0)
      const dataUrl = outCanvas.toDataURL(fmt, fmtQuality)

      const head = [
        '🎨 [' + name + '] DDColor 上色完成：' + w + '×' + h + '，推理 ' + inferMs + 'ms（' + usingEP.toUpperCase() + '）',
        '',
      ].join('\n')
      const imageMd = '![' + name + ' 上色结果](' + dataUrl + ')'
      // 大 dataURL 不走逐字流式（会拖到分钟级）：状态行走 onDelta，图片整块吐出
      emit(head)
      emit(imageMd)
      const tail = '\n\n—— 上色在浏览器本地完成，照片不会上传到服务端；换一张黑白图试试。'
      emit(tail)
      return head + imageMd + tail
    },

    dispose() {
      try {
        if (session) session.release()
      } catch (e) { /* 忽略重复释放 */ }
      session = null
      ort = null
    },
  }
}
