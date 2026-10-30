/**
 * 可选的 WASM 软解器（H.264/H.265 / 未知格式 → canvas）。
 *
 * <p>约定：出口能力（decoder）作为公共附件随发布投递，位于
 * <code>public/vendor/wasm/video/decode.js</code> + <code>decode.wasm</code>（加载方式与
 * {@code public/vendor/pdf/wasm/openjpeg_wasm} 同构：Vite 原样复制，TS 侧用动态
 * <code>import()</code> 引入，不写死地址）。软解器的具体接口有多种（PDF.js 系的是
 * <code>openjpeg</code>，暴露 <code>decode()</code>/<code>push()</code>/<code>flush()</code>），
 * 本模块不绑定具体实现，只按「定位 → 加载 → 调用」的通用模式编排：</p>
 * <ul>
 *   <li>推流：{@code push(bytes)}（ANNEX B 片段）；</li>
 *   <li>出帧：{@code onFrame(frame)}，frame 的 data 为 RGBA 字节（宽度不足时按帧补足）；</li>
 *   <li>结束/释放：{@code flush()} / {@code close()}。</li>
 * </ul>
 *
 * <p>有了软解器，前面收不到丝的报错会少很多；没有它之前，播放器先试
 * <code>&lt;video&gt;</code> 原生能播的（见 {@link streamProtocol}），再走到这里
 * 直接给出说明。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */

/** 约定：公共附件根（Vite 生产构建 / 开发代理都会原样复制 public/vendor 下的文件） */
const WASM_VIDEO_ROOT = '/vendor/wasm/video/'

/** 软解器模块约定出的公共接口 */
export interface WasmDecoderModule {
  /** 推一段 ANNEX B 字节进缓冲 */
  push?: (data: Uint8Array) => void
  /** 继续/开始解码 */
  decode?: () => void
  /** 结束，吐出最后一帧 */
  flush?: () => void
  /** 关闭 / 释放资源 */
  close?: () => void
  /** 出一帧画面，data 为 RGBA 字节（含宽度） */
  onFrame?: (frame: { data: Uint8Array; w: number; h: number }) => void
  /** 是否已准备好 */
  ready?: () => boolean
}

/** 已装载的软解器（null = 未装载） */
let cache: WasmDecoderModule | boolean | null = null

/** 软解器是否已经就位（未具有{@code push}的一律当未就位） */
export function wasmVideoAvailable(): boolean {
  return !!cache && !!(cache as WasmDecoderModule).push
}

/**
 * 尝试在公共位置装载软解器（随时可装、装上之后才生效，失败则不在它身上崩溃）。
 *
 * @returns 是否载入成功（失败则仍处于不可用态，上层回退到 <video> 并说明）
 */
export async function loadWasmVideoPlayer(): Promise<boolean> {
  if (cache !== null) return wasmVideoAvailable()
  try {
    cache = await import(/* @vite-ignore */ `${WASM_VIDEO_ROOT}decode.js`)
  } catch {
    cache = false
  }
  return wasmVideoAvailable()
}

/** 软解器未就位时的标准解释 */
export function wasmUnavailable(): Error {
  return new Error('该软件格式需要 WASM 软解器，公共附件 public/vendor/wasm/video/decode.{js,wasm} 未就绪')
}

/**
 * 把各路流（H.264/H.265、未知容器）喂给 WASM 软解器，画面画到 canvas 上。
 *
 * @param url 流地址
 * @param canvas 输出画布
 * @param hooks 首帧 / 错误
 * @returns 0-接进去即可；-1 可 Native 播（上层用 <video> 再试）；-2 软解器未就位（停止，说明地址）
 */
export async function playWasmVideo(
  url: string,
  canvas: HTMLCanvasElement,
  hooks: { onFirstFrame?: () => void; onError?: (e: Error) => void } = {},
): Promise<number> {
  const decoder = cache as WasmDecoderModule | null
  if (!decoder || !decoder.push) {
    void loadWasmVideoPlayer().catch(() => undefined)
    return -2
  }
  try {
    const ctx = canvas.getContext('2d')
    let first = true
    decoder.onFrame = (frame: { data: Uint8Array; w: number; h: number }): void => {
      try {
        if (canvas.width !== frame.w || canvas.height !== frame.h) {
          canvas.width = frame.w
          canvas.height = frame.h
        }
        const img = new ImageData(frame.w, frame.h)
        const bytes = img.data
        if (frame.data.length === frame.w * frame.h) {
          for (let i = 0; i < frame.w * frame.h; i++) {
            const v = frame.data[i]
            bytes[i * 4] = v
            bytes[i * 4 + 1] = v
            bytes[i * 4 + 2] = v
            bytes[i * 4 + 3] = 255
          }
        } else if (frame.data.length === frame.w * frame.h * 4) {
          bytes.set(frame.data, 0)
        } else {
          bytes.fill(0)
        }
        ctx?.putImageData(img, 0, 0)
        if (first) {
          first = false
          hooks.onFirstFrame?.()
        }
      } catch (e) {
        hooks.onError?.(e as Error)
      }
    }
    // 把流里的字节全部送给软解器，flush 吐出最后一帧。
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error(`读取流失败：HTTP ${res.status}`)
    if (!res.body) throw new Error('响应不支持流式读取')
    const reader = res.body.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      decoder.push?.(value)
    }
    decoder.flush?.()
    decoder.close?.()
    return 0
  } catch (e) {
    hooks.onError?.(e as Error)
    return -1
  }
}
