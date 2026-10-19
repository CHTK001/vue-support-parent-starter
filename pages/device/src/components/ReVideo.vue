<template>
  <div ref="containerRef" class="re-video">
    <video
      ref="videoRef"
      class="re-video__el"
      :poster="poster"
      :muted="muted"
      :autoplay="autoplay"
      :controls="controls"
      :playsinline="true"
      @error="onVideoError"
      @loadedmetadata="onLoaded"
    ></video>

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
import Hls from 'hls.js'
// @ts-ignore flv.js 无 d.ts
import flvjs from 'flv.js'

const props = defineProps<{
  url: string
  protocol?: string
  channel?: number
  muted?: boolean
  autoplay?: boolean
  controls?: boolean
  poster?: string
}>()

const emit = defineEmits<{
  (e: 'error', err: unknown): void
  (e: 'loaded'): void
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const error = ref<string>('')
const loading = ref(false)

let hls: Hls | null = null
// @ts-ignore flv.js 无 d.ts
let flvPlayer: any = null

function detectProtocol(url: string, hint?: string): string {
  if (hint) return hint.toLowerCase()
  const u = url.toLowerCase()
  if (u.endsWith('.m3u8') || u.includes('.m3u8?')) return 'hls'
  if (u.endsWith('.flv') || u.includes('.flv?')) return 'flv'
  if (u.endsWith('.mp4') || u.includes('.mp4?')) return 'mp4'
  if (u.startsWith('ws://') || u.startsWith('wss://')) return 'ws'
  return 'mp4'
}

function destroy() {
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
  }
}

function playHls(url: string) {
  const v = videoRef.value
  if (!v) return
  destroy()
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

function playFlv(url: string) {
  const v = videoRef.value
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

function load() {
  error.value = ''
  loading.value = true
  if (!props.url) {
    loading.value = false
    return
  }
  try {
    const proto = detectProtocol(props.url, props.protocol)
    if (proto === 'hls') {
      playHls(props.url)
    } else if (proto === 'flv') {
      playFlv(props.url)
    } else {
      playNative(props.url)
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
  error.value = '视频播放错误'
  emit('error', e)
}

function onLoaded() {
  emit('loaded')
}

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
