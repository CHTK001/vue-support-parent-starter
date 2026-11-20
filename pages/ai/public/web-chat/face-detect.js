/**
 * Web 浏览器推理 · 人脸检测（face-api.js / TensorFlow.js）
 *
 * 真实浏览器端人脸检测：face-api.js 的 TinyFaceDetector（WASM/WebGL），
 * 权重（约 190KB）从 jsdelivr 的 GitHub 镜像加载。图片来自会话附件
 * （fileIds → /api/fs/image-base64）或消息内嵌 dataURL。
 * 契约同 echo-demo.js：默认导出 createClient(modelInfo) → { chat }。
 *
 * 输出：检测到的人脸数量、每张脸的置信度与归一化框位置；多张脸逐行流式吐出。
 * 阈值/输入尺寸可经 js_path 查询参数覆盖：
 *   /web-chat/face-detect.js?threshold=0.5&input_size=320
 */

import { importFirst, resolveInputImages, loadImage } from './_shared.js'

const CDN = [
  'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js',
  'https://unpkg.com/face-api.js@0.22.2/dist/face-api.min.js',
  'https://esm.sh/face-api.js@0.22.2',
]

/** 权重镜像（jsdelivr 的 GitHub 仓库镜像，含 tiny_face_detector 等 manifest+shard） */
const WEIGHTS_URI = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights'

/** js_path 查询参数：/web-chat/face-detect.js?threshold=0.5&input_size=320 */
function pathOptions() {
  try {
    const url = new URL(import.meta.url, (typeof location !== 'undefined' && location.href) || 'http://localhost/')
    return url.searchParams
  } catch (e) {
    return new URLSearchParams()
  }
}

export default function createClient(modelInfo) {
  const name = (modelInfo && (modelInfo.name || modelInfo.id)) || 'web-face-detect'
  const q = pathOptions()
  const threshold = Math.min(0.95, Math.max(0.05, Number(q.get('threshold') || 0.4)))
  const inputSize = [128, 160, 224, 320, 416, 512, 608].includes(Number(q.get('input_size')))
    ? Number(q.get('input_size'))
    : 416

  return {
    async load() {},

    /**
     * 人脸检测：对会话里的第一张图片做 TinyFaceDetector 检测，流式输出结果。
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
        throw new Error('没有可分析的人脸图片：请先在输入框上传图片附件，再发送。')
      }

      emit('⏳ [' + name + '] 正在加载人脸检测权重（tiny_face_detector，约 190KB）…\n')
      const mod = await importFirst(CDN)
      // face-api.js 官方 dist 是 UMD 包：经 ESM import 加载时会挂到 globalThis.faceapi
      const faceapi = (mod && mod.nets) ? mod : (typeof globalThis !== 'undefined' ? globalThis.faceapi : null)
      if (!faceapi || !faceapi.nets || !faceapi.TinyFaceDetectorOptions) {
        throw new Error('face-api.js 加载失败：库未正确挂载（检查 CDN 可达性）')
      }
      if (!faceapi.nets.tinyFaceDetector.isLoaded) {
        await faceapi.nets.tinyFaceDetector.loadFromUri(WEIGHTS_URI)
      }
      if (signal && signal.aborted) throw new Error('aborted')
      emit('✅ 权重就绪，开始检测…\n\n')

      const img = await loadImage(images[0])
      const options = new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold: threshold })
      const detections = await faceapi.detectAllFaces(img, options)
      if (signal && signal.aborted) throw new Error('aborted')

      const lines = []
      if (!detections || detections.length === 0) {
        lines.push('未检测到人脸（阈值 ' + threshold + '；可尝试上传更清晰的正脸照片）。')
      } else {
        lines.push('检测到 ' + detections.length + ' 张人脸：')
        detections.forEach((d, i) => {
          const box = d.relativeBox || d.box
          const x = Math.round((box.x || 0) * 100)
          const y = Math.round((box.y || 0) * 100)
          const w = Math.round((box.width || 0) * 100)
          const h = Math.round((box.height || 0) * 100)
          const score = ((d.score || 0) * 100).toFixed(1)
          lines.push('· 人脸 ' + (i + 1) + '：置信度 ' + score + '%，位于图像 ' + x + '%,' + y + '% 处，宽高 ' + w + '%×' + h + '%')
        })
        lines.push('——\n模型：tiny_face_detector（输入 ' + inputSize + 'px，阈值 ' + threshold + '），全部在浏览器端完成。')
      }
      for (const line of lines) {
        if (signal && signal.aborted) throw new Error('aborted')
        emit(line + '\n')
        await new Promise((r) => setTimeout(r, 30))
      }
      return lines.join('\n')
    },

    dispose() {},
  }
}
