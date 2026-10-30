<template>
  <div ref="containerRef" class="re-video">
    <video
      ref="videoRef"
      v-show="!rawMode"
      class="re-video__el"
      :poster="poster"
      :muted="muted"
      :autoplay="autoplay"
      :controls="controls"
      :playsinline="true"
      @error="onVideoError"
      @loadedmetadata="onLoaded"
    ></video>

    <!-- 裸流（H.264/H.265）由 WebCodecs 解码后画到 canvas，不走 <video> -->
    <canvas v-show="rawMode" ref="canvasRef" class="re-video__el"></canvas>

    <!-- 无流 / 出错：居中占位（不拦截鼠标，避免挡住原生控件） -->
    <div v-if="!url || error" class="re-video__mask">
      <span class="re-video__tile">
        <el-icon :size="26"><VideoCamera /></el-icon>
      </span>
      <span class="re-video__title">{{ error || '暂无视频流' }}</span>
      <span v-if="protocol" class="re-video__sub">协议 · {{ protocol.toUpperCase() }}</span>
    </div>

    <div v-if="loading" class="re-video__loading">
      <span class="re-video__spinner" />
      <span class="re-video__sub">正在拉流…</span>
    </div>

    <!-- 通道角标：贴左上，随多路联播复用 -->
    <span v-if="channel && url && !error" class="re-video__badge">CH{{ channel }}</span>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { VideoCamera } from '@element-plus/icons-vue'
import type HlsType from 'hls.js'
import { planStream, type StreamPlan } from '../utils/streamProtocol'
import { ElementaryStreamPlayer } from '../utils/elementaryPlayer'
import { playWasmVideo } from '../utils/wasmVideoPlayer'

const props = defineProps<{
  url: string
  protocol?: string
  channel?: number
  muted?: boolean
  autoplay?: boolean
  controls?: boolean
  poster?: string
  /**
   * RTSP 网关配置（可选）。浏览器无法直连 rtsp://，需服务端转流；
   * 配了模板后这里会自动改写地址并走对应播放器。
   */
  gateway?: { template: string; protocol: 'flv' | 'hls' | 'mp4' }
}>()

const emit = defineEmits<{
  (e: 'error', err: unknown): void
  (e: 'loaded'): void
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const error = ref<string>('')
const loading = ref(false)
/** 当前是否走裸流（WebCodecs → canvas）通道 */
const rawMode = ref(false)

let hls: HlsType | null = null
// @ts-ignore flv.js 无 d.ts
let flvPlayer: any = null
let rawPlayer: ElementaryStreamPlayer | null = null
/** <video> 盲试（canplay/能播…能播…）时挂的监听序列，别让它追着旧地址跑 */
let _videoListeners: Array<[HTMLVideoElement, string, EventListenerOrEventListenerObject]> | null = null

function destroy() {
  if (rawPlayer) {
    try {
      rawPlayer.stop()
    } catch (e) {
      // ignore
    }
    rawPlayer = null
  }
  rawMode.value = false
  if (hls) {
    try {
      hls.destroy()
    } catch (e) {
      // ignore
    }
    hls = null
  }
  if (flvPlayer) {
    try {
      flvPlayer.destroy()
    } catch (e) {
      // ignore
    }
    flvPlayer = null
  }
  const v = videoRef.value
  if (v) {
    v.removeAttribute('src')
    try {
      v.load()
    } catch (e) {
      // ignore
    }
    // 当时挂的 <video> 盲试监听序列也一起收掉（别让旧策略的 canplay/error 再惹麻烦）
    if (_videoListeners) {
      for (const [el, ev, fn] of _videoListeners) el.removeEventListener(ev, fn as EventListener)
      _videoListeners = null
    }
  }
}

/**
 * 播放 HLS。
 *
 * <p>hls.js 有 3MB 出头（dev 预构建后更大），只有真的开了 HLS 流才用得到，
 * 因此在函数内部按需 import：设备列表页只是挂着 <code>ReVideo</code>，
 * 不该为了一个没开始的播放背这份包。</p>
 */
async function playHls(url: string) {
  const v = videoRef.value
  if (!v) return
  destroy()
  const { default: Hls } = await import('hls.js')
  if (Hls.isSupported()) {
    hls = new Hls({ enableWorker: true, lowLatencyMode: true })
    hls.loadSource(url)
    hls.attachMedia(v)
    // @ts-ignore Hls 事件类型
    hls.on(Hls.Events.ERROR, (_event: unknown, data: any) => {
      if (data.fatal) {
        error.value = `HLS 错误: ${data.type} - ${data.details}`
        emit('error', data)
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls?.startLoad()
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls?.recoverMediaError()
        }
      }
    })
  } else if (v.canPlayType('application/vnd.apple.mpegurl')) {
    v.src = url
  } else {
    error.value = '当前浏览器不支持 HLS 播放'
    emit('error', new Error(error.value))
  }
}

/** FLV 同理：flv.js 只在真正播 FLV 时才加载 */
async function playFlv(url: string) {
  const v = videoRef.value
  // @ts-ignore flv.js
  const { default: flvjs } = await import('flv.js')
  // @ts-ignore flv.js
  if (!v || !flvjs.isSupported()) {
    error.value = '当前浏览器不支持 FLV 播放'
    emit('error', new Error(error.value))
    return
  }
  destroy()
  // @ts-ignore flv.js
  flvPlayer = flvjs.createPlayer(
    { type: 'flv', url, isLive: true },
    { enableWorker: false, enableStashBuffer: false, stashInitialSize: 128 },
  )
  // @ts-ignore
  flvPlayer.attachMediaElement(v)
  // @ts-ignore
  flvPlayer.load()
  // @ts-ignore
  flvPlayer.play().catch((e: unknown) => emit('error', e))
  // @ts-ignore
  flvPlayer.on(flvjs.Events.ERROR, (errType: string, errDetail: string) => {
    error.value = `FLV 错误: ${errType} - ${errDetail}`
    emit('error', new Error(error.value))
  })
}

function playNative(url: string) {
  const v = videoRef.value
  if (!v) return
  destroy()
  v.src = url
}

/**
 * 裸流（H.264/H.265）：Annex B 切 framed、WebCodecs → canvas，不支持时说明情况。
 */
function playRaw(plan: StreamPlan): void {
  const canvas = canvasRef.value
  if (!canvas) throw new Error('画布未就绪')
  rawMode.value = true
  rawPlayer = new ElementaryStreamPlayer(canvas, {
    family: plan.strategy === 'raw-h265' ? 'h265' : 'h264',
    hooks: {
      onFirstFrame: () => {
        error.value = ''
        emit('loaded')
      },
      onError: (e: Error) => {
        error.value = `裸流解码失败：${e.message}`
        emit('error', e)
      },
    },
  })
  if (plan.url.startsWith('ws://') || plan.url.startsWith('wss://')) {
    rawPlayer.startWs(plan.url)
  } else {
    void rawPlayer.startHttp(plan.url)
  }
}

/**
 * RTSP 无 TCP，必须经服务端网关转流；挂了网关 <code>planStream</code> 已经改写过了，
 * 走不到的话可以给说明，而不是 <video> 静默出让。
 */
function playRtsp(plan: StreamPlan): void {
  error.value = plan.note || 'RTSP 需要服务端转流（可配 gateway 转 FLV / HLS 后播放）'
  emit('error', new Error(error.value))
}

/**
 * 未知策略 / 盲流 / 没挂网关的 rtsp：先让 <video> 盲试一把（浏览器能播的容器/编码
 * 不一定非要 FLV/HLS），播不过的再求 WASM 软解，最后再看计划书的说明。
 */
function playUnsupported(plan: StreamPlan): void {
  const v = videoRef.value
  if (!v) {
    error.value = plan.note || '正在等待画布'
    emit('error', new Error(error.value))
    return
  }
  blindTest.value = true
  destroy()
  const clean = () => {
    v.removeEventListener('canplay', onCanPlay)
    v.removeEventListener('canplaythrough', onCanPlay)
    v.removeEventListener('error', onFail)
    blindTest.value = false
  }
  const onCanPlay = (): void => {
    error.value = ''
    emit('loaded')
    clean()
  }
  const onFail = (): void => {
    clean()
    void (async () => {
      const ok = await tryWasm(plan.url)
      if (!ok) {
        error.value = plan.note || `当前格式无法识别（${plan.protocol}）`
        emit('error', new Error(error.value))
      }
    })()
  }
  v.src = plan.url
  v.load()
  v.addEventListener('canplay', onCanPlay)
  v.addEventListener('canplaythrough', onCanPlay)
  v.addEventListener('error', onFail)
  _videoListeners = [[v, 'canplay', onCanPlay], [v, 'canplaythrough', onCanPlay], [v, 'error', onFail]]
}

/**
 * 尝试把流喂给公共附件里的 WASM 软解器（装不上的话原地报错，不理头）。
 *
 * @returns 是否已经看到一帧画面（有了一帧，才算软解成功）
 */
async function tryWasm(url: string): Promise<boolean> {
  const canvas = canvasRef.value
  if (!canvas) return false
  rawMode.value = true
  let framed = false
  return (
    framed ||
    (await playWasmVideo(url, canvas, {
      onFirstFrame: () => {
        framed = true
        error.value = ''
        emit('loaded')
      },
      onError: (e: Error) => {
        error.value = `软解失败：${e.message}`
        emit('error', e)
      },
    })) > 0
  )
}

function load() {
  error.value = ''
  loading.value = true
  if (!props.url) {
    loading.value = false
    return
  }
  try {
    const plan = planStream(props.url, props.protocol, { gateway: props.gateway })
    if (plan.strategy === 'hls') {
      void playHls(plan.url)
    } else if (plan.strategy === 'flv') {
      void playFlv(plan.url)
    } else if (plan.strategy === 'native') {
      playNative(plan.url)
    } else if (plan.strategy === 'raw-h264' || plan.strategy === 'raw-h265') {
      playRaw(plan)
    } else if (plan.strategy === 'rtsp-gateway') {
      playRtsp(plan)
    } else {
      // 未知/盲流/没挂网关的 rtsp：先让 <video> 盲试一把，再求 WASM 软解
      playUnsupported(plan)
    }
    if (props.autoplay) {
      videoRef.value?.play().catch((e: unknown) => {
        console.warn('[ReVideo] autoplay blocked:', (e as Error)?.message)
      })
    }
  } catch (e: unknown) {
    error.value = (e as Error)?.message || '视频加载失败'
    emit('error', e)
  } finally {
    loading.value = false
  }
}

function onVideoError(e: unknown) {
  if (blindTest.value) return // 盲试阶段由显式 error 监听接管（它决定找不找 WASM）
  error.value = '视频播放错误'
  emit('error', e)
}

function onLoaded() {
  if (blindTest.value) return // 元数据加载不等于取出了一整条流
  emit('loaded')
}

/** 当前是否由 <video> 盲试在底层兜底（是的话上面的模板监听让给显式监听） */
const blindTest = ref(false)

watch(
  () => [props.url, props.protocol],
  () => load(),
)

onMounted(load)
onBeforeUnmount(destroy)
</script>

<style scoped>
.re-video {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: var(--el-radius-lg, 12px);
  background: #05070c;
}
.re-video__el {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #05070c;
  display: block;
}

/* 占位层 */
.re-video__mask,
.re-video__loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  pointer-events: none;
  text-align: center;
  padding: 12px;
}
.re-video__loading {
  background: color-mix(in srgb, #05070c 55%, transparent);
}
.re-video__tile {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  color: var(--el-text-color-secondary);
  background: color-mix(in srgb, var(--el-text-color-primary) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-text-color-primary) 16%, transparent);
}
.re-video__title {
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.re-video__sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.re-video__spinner {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid color-mix(in srgb, var(--el-color-primary) 25%, transparent);
  border-top-color: var(--el-color-primary);
  animation: re-video-spin 0.8s linear infinite;
}
.re-video__badge {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #fff;
  background: color-mix(in srgb, #000 45%, transparent);
  backdrop-filter: blur(4px);
}
@keyframes re-video-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
